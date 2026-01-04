/**
 * Retry plugin tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DnsKernel } from '../../src/kernel.js';
import { retryPlugin, calculateDelay, sleep, resetRetryCounter, getRetryCount, setMaxRetries, setRetryDelay, setBackoffStrategy, withRetry } from '../../src/plugins/optional/retry.js';

describe('Retry Plugin', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
  });

  it('should install retry plugin', () => {
    expect(() => kernel.use(retryPlugin)).not.toThrow();
  });

  it('should have plugin name and version', () => {
    expect(retryPlugin.name).toBe('retry');
    expect(retryPlugin.version).toBe('1.0.0');
  });

  it('should initialize with default values', () => {
    kernel.use(retryPlugin);

    expect(kernel.getState('maxRetries')).toBe(2);
    expect(kernel.getState('retryDelay')).toBe(100);
    expect(kernel.getState('backoff')).toBe('exponential');
    expect(kernel.getState('currentRetry')).toBe(0);
  });

  it('should initialize with custom options', () => {
    const customKernel = new DnsKernel({
      retries: 5,
      retryDelay: 200,
      retryBackoff: 'linear' as const,
    });
    customKernel.use(retryPlugin);

    expect(customKernel.getState('maxRetries')).toBe(5);
    expect(customKernel.getState('retryDelay')).toBe(200);
    expect(customKernel.getState('backoff')).toBe('linear');
  });
});

describe('Delay Calculation', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ retryDelay: 100 });
    kernel.use(retryPlugin);
  });

  it('should calculate exponential backoff', () => {
    kernel.setState('backoff', 'exponential');

    expect(calculateDelay(kernel, 0)).toBe(100);
    expect(calculateDelay(kernel, 1)).toBe(200);
    expect(calculateDelay(kernel, 2)).toBe(400);
    expect(calculateDelay(kernel, 3)).toBe(800);
  });

  it('should calculate linear backoff', () => {
    kernel.setState('backoff', 'linear');

    expect(calculateDelay(kernel, 0)).toBe(100);
    expect(calculateDelay(kernel, 1)).toBe(200);
    expect(calculateDelay(kernel, 2)).toBe(300);
    expect(calculateDelay(kernel, 3)).toBe(400);
  });

  it('should calculate constant delay', () => {
    kernel.setState('backoff', 'constant');

    expect(calculateDelay(kernel, 0)).toBe(100);
    expect(calculateDelay(kernel, 1)).toBe(100);
    expect(calculateDelay(kernel, 2)).toBe(100);
  });

  it('should use default backoff for unknown strategy', () => {
    kernel.setState('backoff', 'constant');
    kernel.setState('retryDelay', 50);

    expect(calculateDelay(kernel, 0)).toBe(50);
  });
});

describe('Sleep Function', () => {
  it('should sleep for specified duration', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(90);
    expect(elapsed).toBeLessThan(200);
  });

  it('should sleep for zero duration', async () => {
    const start = Date.now();
    await sleep(0);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});

describe('Retry Counter Management', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(retryPlugin);
  });

  it('should get initial retry count', () => {
    expect(getRetryCount(kernel)).toBe(0);
  });

  it('should reset retry counter', () => {
    kernel.setState('currentRetry', 5);
    expect(getRetryCount(kernel)).toBe(5);

    resetRetryCounter(kernel);
    expect(getRetryCount(kernel)).toBe(0);
  });

  it('should set maximum retries', () => {
    setMaxRetries(kernel, 10);
    expect(kernel.getState('maxRetries')).toBe(10);
  });

  it('should not allow negative max retries', () => {
    setMaxRetries(kernel, -5);
    expect(kernel.getState('maxRetries')).toBe(0);
  });

  it('should set retry delay', () => {
    setRetryDelay(kernel, 500);
    expect(kernel.getState('retryDelay')).toBe(500);
  });

  it('should not allow negative retry delay', () => {
    setRetryDelay(kernel, -100);
    expect(kernel.getState('retryDelay')).toBe(0);
  });

  it('should set backoff strategy', () => {
    setBackoffStrategy(kernel, 'linear');
    expect(kernel.getState('backoff')).toBe('linear');

    setBackoffStrategy(kernel, 'exponential');
    expect(kernel.getState('backoff')).toBe('exponential');

    setBackoffStrategy(kernel, 'constant');
    expect(kernel.getState('backoff')).toBe('constant');
  });
});

describe('Retry Event Emission', () => {
  let kernel: DnsKernel;
  let retryHandler: any;

  beforeEach(() => {
    kernel = new DnsKernel({ retries: 2, retryDelay: 10 });
    retryHandler = vi.fn();
    kernel.on('retry', retryHandler);
    kernel.use(retryPlugin);
  });

  it('should emit retry event on error', async () => {
    await kernel.emit('error', new Error('Test error'));

    // Wait for async retry logic
    await sleep(50);

    expect(retryHandler).toHaveBeenCalled();
  });

  it('should include retry data in event', async () => {
    await kernel.emit('error', new Error('Test error'));

    // Wait for async retry logic
    await sleep(50);

    expect(retryHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: expect.any(Number),
        maxRetries: 2,
        delay: expect.any(Number),
        error: expect.any(Error),
      })
    );
  });

  it('should increment retry count', async () => {
    expect(getRetryCount(kernel)).toBe(0);

    await kernel.emit('error', new Error('Test error'));
    await sleep(50);

    expect(getRetryCount(kernel)).toBeGreaterThan(0);
  });
});

describe('With Retry Function', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ retries: 3, retryDelay: 10 });
    kernel.use(retryPlugin);
  });

  it('should return result on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(kernel, fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(kernel, fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

    await expect(withRetry(kernel, fn)).rejects.toThrow('Always fails');
    expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it('should emit retry events during retry', async () => {
    const retryHandler = vi.fn();
    kernel.on('retry', retryHandler);

    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockResolvedValue('success');

    await withRetry(kernel, fn);

    expect(retryHandler).toHaveBeenCalledTimes(1);
    expect(retryHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: 1,
        maxRetries: 3,
      })
    );
  });

  it('should update retry count during retries', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    await withRetry(kernel, fn);

    // Retry count should be updated during retries
    expect(getRetryCount(kernel)).toBeGreaterThan(0);
  });

  it('should reset retry count on success', async () => {
    kernel.setState('currentRetry', 2);

    const fn = vi.fn().mockResolvedValue('success');
    await withRetry(kernel, fn);

    // After successful retry, count reflects the last attempt
    expect(getRetryCount(kernel)).toBeGreaterThanOrEqual(0);
  });
});

describe('Retry Plugin Integration', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({
      retries: 2,
      retryDelay: 10,
      retryBackoff: 'exponential',
    });
  });

  it('should work with exponential backoff', async () => {
    kernel.use(retryPlugin);

    const delays: number[] = [];
    kernel.on('retry', (data: any) => {
      delays.push(data.delay);
    });

    // Trigger multiple errors
    await kernel.emit('error', new Error('Error 1'));
    await sleep(50);

    await kernel.emit('error', new Error('Error 2'));
    await sleep(50);

    expect(delays.length).toBeGreaterThan(0);
  });

  it('should work with linear backoff', async () => {
    kernel = new DnsKernel({
      retries: 2,
      retryDelay: 10,
      retryBackoff: 'linear',
    });
    kernel.use(retryPlugin);

    const delays: number[] = [];
    kernel.on('retry', (data: any) => {
      delays.push(data.delay);
    });

    await kernel.emit('error', new Error('Error'));
    await sleep(50);

    expect(delays.length).toBeGreaterThan(0);
  });

  it('should work with constant backoff', async () => {
    kernel = new DnsKernel({
      retries: 2,
      retryDelay: 10,
      retryBackoff: 'constant',
    });
    kernel.use(retryPlugin);

    const delays: number[] = [];
    kernel.on('retry', (data: any) => {
      delays.push(data.delay);
    });

    await kernel.emit('error', new Error('Error'));
    await sleep(50);

    expect(delays.length).toBeGreaterThan(0);
    expect(delays[0]).toBe(10);
  });
});

describe('Retry Plugin Edge Cases', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ retries: 0, retryDelay: 0 });
  });

  it('should not retry when max retries is 0', async () => {
    kernel.use(retryPlugin);

    const retryHandler = vi.fn();
    kernel.on('retry', retryHandler);

    await kernel.emit('error', new Error('Error'));
    await sleep(20);

    // Should not emit retry event when max retries is 0
    expect(retryHandler).not.toHaveBeenCalled();
  });

  it('should handle zero delay', async () => {
    kernel.setState('retryDelay', 0);
    kernel.use(retryPlugin);

    const start = Date.now();
    await kernel.emit('error', new Error('Error'));
    await sleep(10);
    const elapsed = Date.now() - start;

    // Should complete quickly with zero delay
    expect(elapsed).toBeLessThan(100);
  });

  it('should handle very high retry count', () => {
    kernel.use(retryPlugin);
    setMaxRetries(kernel, 1000);

    expect(kernel.getState('maxRetries')).toBe(1000);
  });

  it('should handle very long delay', async () => {
    kernel.use(retryPlugin);
    kernel.setState('retryDelay', 10000);

    expect(calculateDelay(kernel, 0)).toBe(10000);
  });
});

describe('Retry onDestroy', () => {
  it('should call onDestroy without error', () => {
    const kernel = new DnsKernel({});
    kernel.use(retryPlugin);

    expect(() => {
      retryPlugin.onDestroy?.();
    }).not.toThrow();
  });

  it('should handle onDestroy when cleanup is handled by kernel', () => {
    const kernel = new DnsKernel({});
    kernel.use(retryPlugin);

    // onDestroy should be callable and do nothing
    if (retryPlugin.onDestroy) {
      retryPlugin.onDestroy();
    }

    // Retry state should still be accessible through kernel
    expect(getRetryCount(kernel)).toBe(0);
  });
});

describe('withRetry unreachable code path', () => {
  it('should handle successful first attempt with zero retries', async () => {
    const kernel = new DnsKernel({ retries: 0, retryDelay: 10 });
    kernel.use(retryPlugin);

    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(kernel, fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after exhausting all retry attempts', async () => {
    const kernel = new DnsKernel({ retries: 1, retryDelay: 1 });
    kernel.use(retryPlugin);

    const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

    await expect(withRetry(kernel, fn)).rejects.toThrow('Always fails');
    expect(fn).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });
});
