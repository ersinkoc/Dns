/**
 * Logger Plugin
 *
 * Query/response logging for debugging and monitoring.
 *
 * @module
 */

import type { DnsPlugin } from '../../types.js';
import type { DnsKernelContext } from '../../kernel.js';
import { DnsKernel } from '../../kernel.js';

/**
 * Log level.
 *
 * @example
 * ```typescript
 * import { LogLevel } from '@oxog/dns/plugins';
 *
 * const level: LogLevel = 'debug';
 * ```
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry.
 *
 * @example
 * ```typescript
 * const entry: LogEntry = {
 *   level: 'info',
 *   message: 'Query completed',
 *   timestamp: Date.now(),
 *   data: { domain: 'example.com' }
 * };
 * ```
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: number;
  /** Optional data */
  data?: Record<string, unknown>;
}

/**
 * Logger plugin state.
 *
 * @internal
 */
interface LoggerPluginState {
  /** Log entries */
  logs: LogEntry[];
  /** Maximum logs to keep */
  maxLogs: number;
  /** Minimum log level */
  minLevel: LogLevel;
  /** Custom log function */
  logFn?: (entry: LogEntry) => void;
}

/**
 * Log level priorities.
 *
 * @internal
 */
const LEVEL_PRIORITIES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger plugin.
 *
 * Provides query/response logging.
 *
 * @example
 * ```typescript
 * import { loggerPlugin } from '@oxog/dns/plugins';
 *
 * kernel.use(loggerPlugin);
 * ```
 */
export const loggerPlugin: DnsPlugin<LoggerPluginState & DnsKernelContext> = {
  name: 'logger',
  version: '1.0.0',

  install(kernel) {
    // Initialize state
    kernel.setState('logs', []);
    kernel.setState('maxLogs', 10000);
    kernel.setState('minLevel', 'info');

    // Listen for all events and log them
    kernel.on('query', async (data: { query: { name: string; type: string } }) => {
      log(kernel, 'info', 'DNS query initiated', {
        domain: data.query.name,
        type: data.query.type,
      });
    });

    kernel.on('response', async (data: { queryId: number }) => {
      log(kernel, 'info', 'DNS response received', {
        queryId: data.queryId,
      });
    });

    kernel.on('parsed-response', async (data: { query: { name: string; type: string }; records: unknown[]; ttl: number }) => {
      log(kernel, 'info', 'DNS response parsed', {
        domain: data.query.name,
        type: data.query.type,
        recordCount: data.records.length,
        ttl: data.ttl,
      });
    });

    kernel.on('error', async (error: Error) => {
      log(kernel, 'error', 'DNS error occurred', {
        error: error.message,
        name: error.name,
      });
    });

    kernel.on('cache-hit', async (data: { key: string }) => {
      log(kernel, 'debug', 'Cache hit', { key: data.key });
    });

    kernel.on('cache-miss', async (data: { key: string }) => {
      log(kernel, 'debug', 'Cache miss', { key: data.key });
    });

    kernel.on('retry', async (data: { attempt: number; maxRetries: number; delay: number; error?: Error }) => {
      /* v8 ignore next 5 */
      log(kernel, 'warn', 'Retrying DNS query', {
        attempt: data.attempt,
        maxRetries: data.maxRetries,
        delay: data.delay,
        error: data.error?.message,
      });
    });
  },

  onDestroy() {
    // Cleanup handled by kernel
  },
};

/**
 * Log a message.
 *
 * @param kernel - DNS kernel
 * @param level - Log level
 * @param message - Log message
 * @param data - Optional data
 *
 * @example
 * ```typescript
 * log(kernel, 'info', 'Custom message', { key: 'value' });
 * ```
 */
export function log(
  kernel: DnsKernel<LoggerPluginState & DnsKernelContext>,
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
): void {
  const minLevel = kernel.getState('minLevel') as LogLevel;
  const maxLogs = kernel.getState('maxLogs') as number;
  const logFn = kernel.getState('logFn') as ((entry: LogEntry) => void) | undefined;

  // Check log level
  if (LEVEL_PRIORITIES[level] < LEVEL_PRIORITIES[minLevel]) {
    return;
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: Date.now(),
    data,
  };

  // Store log
  const logs = kernel.getState('logs') as LogEntry[];
  logs.push(entry);

  // Trim if necessary
  if (logs.length > maxLogs) {
    logs.splice(0, logs.length - maxLogs);
  }

  // Call custom log function if provided
  if (logFn) {
    try {
      logFn(entry);
    } catch {
      // Ignore errors in log function
    }
  }
}

/**
 * Get all log entries.
 *
 * @param kernel - DNS kernel
 * @param level - Optional minimum log level
 * @returns Array of log entries
 *
 * @example
 * ```typescript
 * const logs = getLogs(kernel);
 * const errors = getLogs(kernel, 'error');
 * ```
 */
export function getLogs(kernel: DnsKernel<LoggerPluginState & DnsKernelContext>, level?: LogLevel): LogEntry[] {
  const logs = kernel.getState('logs') as LogEntry[];

  if (!level) {
    return [...logs];
  }

  return logs.filter((entry) => LEVEL_PRIORITIES[entry.level] >= LEVEL_PRIORITIES[level]);
}

/**
 * Clear all log entries.
 *
 * @param kernel - DNS kernel
 *
 * @example
 * ```typescript
 * clearLogs(kernel);
 * ```
 */
export function clearLogs(kernel: DnsKernel<LoggerPluginState & DnsKernelContext>): void {
  kernel.setState('logs', []);
}

/**
 * Set the minimum log level.
 *
 * @param kernel - DNS kernel
 * @param level - Minimum log level
 *
 * @example
 * ```typescript
 * setMinLogLevel(kernel, 'warn');
 * ```
 */
export function setMinLogLevel(kernel: DnsKernel<LoggerPluginState & DnsKernelContext>, level: LogLevel): void {
  kernel.setState('minLevel', level);
}

/**
 * Set a custom log function.
 *
 * @param kernel - DNS kernel
 * @param fn - Log function
 *
 * @example
 * ```typescript
 * setLogFunction(kernel, (entry) => {
 *   console.log(`[${entry.level.toUpperCase()}]`, entry.message);
 * });
 * ```
 */
export function setLogFunction(
  kernel: DnsKernel<LoggerPluginState & DnsKernelContext>,
  fn: (entry: LogEntry) => void,
): void {
  kernel.setState('logFn', fn);
}

/**
 * Create a writable stream for logs.
 *
 * @param kernel - DNS kernel
 * @returns Object with write and end methods
 *
 * @example
 * ```typescript
 * const stream = createLogStream(kernel);
 * stream.write({ level: 'info', message: 'Test' });
 * ```
 */
export function createLogStream(kernel: DnsKernel<LoggerPluginState & DnsKernelContext>): {
  write: (entry: LogEntry) => void;
  end: () => void;
} {
  return {
    write: (entry: LogEntry) => {
      log(kernel, entry.level, entry.message, entry.data);
    },
    end: () => {
      clearLogs(kernel);
    },
  };
}

/**
 * Export logs as JSON.
 *
 * @param kernel - DNS kernel
 * @param level - Optional minimum log level
 * @returns JSON string of logs
 *
 * @example
 * ```typescript
 * const json = exportLogsAsJson(kernel);
 * ```
 */
export function exportLogsAsJson(kernel: DnsKernel<LoggerPluginState & DnsKernelContext>, level?: LogLevel): string {
  const logs = getLogs(kernel, level);
  return JSON.stringify(logs, null, 2);
}

/**
 * Get log statistics.
 *
 * @param kernel - DNS kernel
 * @returns Log statistics
 *
 * @example
 * ```typescript
 * const stats = getLogStats(kernel);
 * console.log(stats); // { total: 100, debug: 20, info: 50, warn: 20, error: 10 }
 * ```
 */
export function getLogStats(kernel: DnsKernel<LoggerPluginState & DnsKernelContext>): {
  total: number;
  debug: number;
  info: number;
  warn: number;
  error: number;
} {
  const logs = kernel.getState('logs') as LogEntry[];

  return {
    total: logs.length,
    debug: logs.filter((l) => l.level === 'debug').length,
    info: logs.filter((l) => l.level === 'info').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    error: logs.filter((l) => l.level === 'error').length,
  };
}
