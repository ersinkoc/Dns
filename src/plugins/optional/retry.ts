/**
 * Retry Plugin
 *
 * Automatic retry with backoff strategies.
 *
 * @module
 */

import type { DnsPlugin } from '../../types.js';
import type { DnsKernelContext } from '../../kernel.js';
import { DnsKernel } from '../../kernel.js';

/**
 * Retry plugin state.
 *
 * @internal
 */
interface RetryPluginState {
  /** Maximum number of retries */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
  /** Backoff strategy */
  backoff: 'exponential' | 'linear' | 'constant';
  /** Current retry count */
  currentRetry: number;
}

/**
 * Retry plugin.
 *
 * Provides automatic retry with configurable backoff.
 *
 * @example
 * ```typescript
 * import { retryPlugin } from '@oxog/dns/plugins';
 *
 * kernel.use(retryPlugin);
 * ```
 */
export const retryPlugin: DnsPlugin<RetryPluginState & DnsKernelContext> = {
  name: 'retry',
  version: '1.0.0',

  install(kernel) {
    const options = kernel.context.options;

    // Initialize state
    kernel.setState('maxRetries', options.retries ?? 2);
    kernel.setState('retryDelay', options.retryDelay ?? 100);
    kernel.setState('backoff', options.retryBackoff ?? 'exponential');
    kernel.setState('currentRetry', 0);

    // Listen for error events to trigger retry
    kernel.on('error', async (error: Error) => {
      const maxRetries = kernel.getState('maxRetries') as number;
      const currentRetry = kernel.getState('currentRetry') as number;

      if (currentRetry < maxRetries) {
        // Increment retry count
        kernel.setState('currentRetry', currentRetry + 1);

        // Calculate delay
        const delay = calculateDelay(kernel, currentRetry);

        // Emit retry event
        await kernel.emit('retry', {
          attempt: currentRetry + 1,
          maxRetries,
          delay,
          error,
        });

        // Wait before retry
        await sleep(delay);
      }
    });
  },

  onDestroy() {
    // Cleanup handled by kernel
  },
};

/**
 * Calculate retry delay based on backoff strategy.
 *
 * @param kernel - DNS kernel
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 *
 * @example
 * ```typescript
 * const delay = calculateDelay(kernel, 0); // First retry
 * ```
 */
export function calculateDelay(kernel: DnsKernel<RetryPluginState & DnsKernelContext>, attempt: number): number {
  const baseDelay = kernel.getState('retryDelay') as number;
  const backoff = kernel.getState('backoff') as 'exponential' | 'linear' | 'constant';

  switch (backoff) {
    case 'exponential':
      return baseDelay * 2 ** attempt;
    case 'linear':
      return baseDelay * (attempt + 1);
    case 'constant':
    default:
      return baseDelay;
  }
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 *
 * @example
 * ```typescript
 * await sleep(1000); // Sleep for 1 second
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reset the retry counter.
 *
 * @param kernel - DNS kernel
 *
 * @example
 * ```typescript
 * resetRetryCounter(kernel);
 * ```
 */
export function resetRetryCounter(kernel: DnsKernel<RetryPluginState & DnsKernelContext>): void {
  kernel.setState('currentRetry', 0);
}

/**
 * Get the current retry count.
 *
 * @param kernel - DNS kernel
 * @returns Current retry count
 *
 * @example
 * ```typescript
 * const count = getRetryCount(kernel);
 * ```
 */
export function getRetryCount(kernel: DnsKernel<RetryPluginState & DnsKernelContext>): number {
  return kernel.getState('currentRetry') as number;
}

/**
 * Set the maximum number of retries.
 *
 * @param kernel - DNS kernel
 * @param maxRetries - Maximum retry count
 *
 * @example
 * ```typescript
 * setMaxRetries(kernel, 5);
 * ```
 */
export function setMaxRetries(kernel: DnsKernel<RetryPluginState & DnsKernelContext>, maxRetries: number): void {
  kernel.setState('maxRetries', Math.max(0, maxRetries));
}

/**
 * Set the retry delay.
 *
 * @param kernel - DNS kernel
 * @param delay - Delay in milliseconds
 *
 * @example
 * ```typescript
 * setRetryDelay(kernel, 200);
 * ```
 */
export function setRetryDelay(kernel: DnsKernel<RetryPluginState & DnsKernelContext>, delay: number): void {
  kernel.setState('retryDelay', Math.max(0, delay));
}

/**
 * Set the backoff strategy.
 *
 * @param kernel - DNS kernel
 * @param backoff - Backoff strategy
 *
 * @example
 * ```typescript
 * setBackoffStrategy(kernel, 'exponential');
 * ```
 */
export function setBackoffStrategy(
  kernel: DnsKernel<RetryPluginState & DnsKernelContext>,
  backoff: 'exponential' | 'linear' | 'constant',
): void {
  kernel.setState('backoff', backoff);
}

/**
 * Execute a function with retry logic.
 *
 * @param kernel - DNS kernel
 * @param fn - Function to execute
 * @returns Promise resolving to the function result
 *
 * @example
 * ```typescript
 * const result = await withRetry(kernel, async () => {
 *   return await fetch('https://example.com');
 * });
 * ```
 */
export async function withRetry<T>(
  kernel: DnsKernel<RetryPluginState & DnsKernelContext>,
  fn: () => Promise<T>,
): Promise<T> {
  const maxRetries = kernel.getState('maxRetries') as number;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(kernel, attempt);

      // Update retry count
      kernel.setState('currentRetry', attempt + 1);

      // Emit retry event
      await kernel.emit('retry', {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error,
      });

      // Wait before retry
      await sleep(delay);
    }
    /* v8 ignore next */
  }

  // This point is only reached if maxRetries is negative (which should not happen)
  // but TypeScript requires a return/throw after the loop
  /* v8 ignore next 2 */
  throw new Error('Retry logic failed');
}
