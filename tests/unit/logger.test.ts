/**
 * Logger plugin tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DnsKernel } from '../../src/kernel.js';
import {
  loggerPlugin,
  log,
  getLogs,
  clearLogs,
  setMinLogLevel,
  setLogFunction,
  createLogStream,
  exportLogsAsJson,
  getLogStats,
} from '../../src/plugins/optional/logger.js';
import type { LogEntry } from '../../src/plugins/optional/logger.js';

describe('Logger Plugin', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
  });

  it('should install logger plugin', () => {
    expect(() => kernel.use(loggerPlugin)).not.toThrow();
  });

  it('should have plugin name and version', () => {
    expect(loggerPlugin.name).toBe('logger');
    expect(loggerPlugin.version).toBe('1.0.0');
  });

  it('should initialize state', () => {
    kernel.use(loggerPlugin);
    expect(kernel.getState('logs')).toEqual([]);
    expect(kernel.getState('maxLogs')).toBe(10000);
    expect(kernel.getState('minLevel')).toBe('info');
  });
});

describe('log function', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should log at info level', () => {
    log(kernel, 'info', 'Test message');
    const logs = getLogs(kernel);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.level).toBe('info');
    expect(logs[0]?.message).toBe('Test message');
  });

  it('should log with data', () => {
    log(kernel, 'info', 'Test message', { key: 'value', count: 42 });
    const logs = getLogs(kernel);
    expect(logs[0]?.data).toEqual({ key: 'value', count: 42 });
  });

  it('should respect min log level', () => {
    setMinLogLevel(kernel, 'warn');
    log(kernel, 'debug', 'Debug message');
    log(kernel, 'info', 'Info message');
    log(kernel, 'warn', 'Warn message');
    log(kernel, 'error', 'Error message');

    const logs = getLogs(kernel);
    expect(logs).toHaveLength(2); // warn and error
    expect(logs[0]?.level).toBe('warn');
    expect(logs[1]?.level).toBe('error');
  });

  it('should trim logs when max is exceeded', () => {
    kernel.setState('maxLogs', 5);
    for (let i = 0; i < 10; i++) {
      log(kernel, 'info', `Message ${i}`);
    }

    const logs = getLogs(kernel);
    expect(logs).toHaveLength(5);
    // Should keep the last 5 messages
    expect(logs[0]?.message).toBe('Message 5');
    expect(logs[4]?.message).toBe('Message 9');
  });

  it('should call custom log function', () => {
    let called = false;
    let capturedEntry: LogEntry | undefined;

    setLogFunction(kernel, (entry) => {
      called = true;
      capturedEntry = entry;
    });

    log(kernel, 'info', 'Test message', { key: 'value' });

    expect(called).toBe(true);
    expect(capturedEntry?.level).toBe('info');
    expect(capturedEntry?.message).toBe('Test message');
    expect(capturedEntry?.data).toEqual({ key: 'value' });
  });

  it('should ignore errors in custom log function', () => {
    setLogFunction(kernel, () => {
      throw new Error('Log function error');
    });

    expect(() => log(kernel, 'info', 'Test message')).not.toThrow();
    const logs = getLogs(kernel);
    expect(logs).toHaveLength(1);
  });

  it('should add timestamp to log entries', () => {
    const before = Date.now();
    log(kernel, 'info', 'Test message');
    const after = Date.now();

    const logs = getLogs(kernel);
    expect(logs[0]?.timestamp).toBeGreaterThanOrEqual(before);
    expect(logs[0]?.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('getLogs', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should return all logs', () => {
    setMinLogLevel(kernel, 'debug');
    log(kernel, 'debug', 'Debug message');
    log(kernel, 'info', 'Info message');
    log(kernel, 'warn', 'Warn message');

    const logs = getLogs(kernel);
    expect(logs).toHaveLength(3);
  });

  it('should filter by log level', () => {
    setMinLogLevel(kernel, 'debug');
    log(kernel, 'debug', 'Debug message');
    log(kernel, 'info', 'Info message');
    log(kernel, 'warn', 'Warn message');
    log(kernel, 'error', 'Error message');

    const warnLogs = getLogs(kernel, 'warn');
    expect(warnLogs).toHaveLength(2); // warn and error
    expect(warnLogs[0]?.level).toBe('warn');
    expect(warnLogs[1]?.level).toBe('error');
  });

  it('should return a copy of logs', () => {
    log(kernel, 'info', 'Test message');
    const logs1 = getLogs(kernel);
    const logs2 = getLogs(kernel);

    expect(logs1).not.toBe(logs2);
    expect(logs1).toEqual(logs2);
  });

  it('should filter debug correctly', () => {
    setMinLogLevel(kernel, 'debug');
    log(kernel, 'debug', 'Debug message');
    log(kernel, 'info', 'Info message');

    const debugLogs = getLogs(kernel, 'debug');
    expect(debugLogs).toHaveLength(2);
  });

  it('should filter info correctly', () => {
    setMinLogLevel(kernel, 'debug');
    log(kernel, 'debug', 'Debug message');
    log(kernel, 'info', 'Info message');
    log(kernel, 'warn', 'Warn message');

    const infoLogs = getLogs(kernel, 'info');
    expect(infoLogs).toHaveLength(2); // info and warn
  });

  it('should filter error correctly', () => {
    setMinLogLevel(kernel, 'debug');
    log(kernel, 'debug', 'Debug message');
    log(kernel, 'info', 'Info message');
    log(kernel, 'warn', 'Warn message');
    log(kernel, 'error', 'Error message');

    const errorLogs = getLogs(kernel, 'error');
    expect(errorLogs).toHaveLength(1);
  });
});

describe('clearLogs', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should clear all logs', () => {
    log(kernel, 'info', 'Test message');
    log(kernel, 'warn', 'Warn message');
    expect(getLogs(kernel)).toHaveLength(2);

    clearLogs(kernel);
    expect(getLogs(kernel)).toHaveLength(0);
  });

  it('should work with empty logs', () => {
    expect(() => clearLogs(kernel)).not.toThrow();
    expect(getLogs(kernel)).toHaveLength(0);
  });
});

describe('setMinLogLevel', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should set min log level', () => {
    setMinLogLevel(kernel, 'warn');
    expect(kernel.getState('minLevel')).toBe('warn');
  });

  it('should affect subsequent log calls', () => {
    setMinLogLevel(kernel, 'error');
    log(kernel, 'debug', 'Debug');
    log(kernel, 'info', 'Info');
    log(kernel, 'warn', 'Warn');
    log(kernel, 'error', 'Error');

    const logs = getLogs(kernel);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.level).toBe('error');
  });

  it('should allow debug level', () => {
    setMinLogLevel(kernel, 'debug');
    log(kernel, 'debug', 'Debug');
    log(kernel, 'info', 'Info');

    const logs = getLogs(kernel);
    expect(logs).toHaveLength(2);
  });
});

describe('setLogFunction', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should set custom log function', () => {
    const fn = (entry: LogEntry) => {
      console.log(entry);
    };
    setLogFunction(kernel, fn);
    expect(kernel.getState('logFn')).toBe(fn);
  });

  it('should call custom function for each log', () => {
    const calls: LogEntry[] = [];
    setLogFunction(kernel, (entry) => {
      calls.push(entry);
    });

    log(kernel, 'info', 'Message 1');
    log(kernel, 'warn', 'Message 2');

    expect(calls).toHaveLength(2);
    expect(calls[0]?.message).toBe('Message 1');
    expect(calls[1]?.message).toBe('Message 2');
  });
});

describe('createLogStream', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should create a writable stream', () => {
    const stream = createLogStream(kernel);
    expect(stream).toBeDefined();
    expect(typeof stream.write).toBe('function');
    expect(typeof stream.end).toBe('function');
  });

  it('should write logs to kernel', () => {
    const stream = createLogStream(kernel);
    stream.write({ level: 'info', message: 'Test', timestamp: Date.now() });

    const logs = getLogs(kernel);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.message).toBe('Test');
  });

  it('should clear logs on end', () => {
    const stream = createLogStream(kernel);
    stream.write({ level: 'info', message: 'Test', timestamp: Date.now() });
    expect(getLogs(kernel)).toHaveLength(1);

    stream.end();
    expect(getLogs(kernel)).toHaveLength(0);
  });

  it('should handle logs with data', () => {
    const stream = createLogStream(kernel);
    stream.write({
      level: 'info',
      message: 'Test',
      timestamp: Date.now(),
      data: { key: 'value' },
    });

    const logs = getLogs(kernel);
    expect(logs[0]?.data).toEqual({ key: 'value' });
  });
});

describe('exportLogsAsJson', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should export logs as JSON', () => {
    log(kernel, 'info', 'Test message', { key: 'value' });
    const json = exportLogsAsJson(kernel);

    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]?.message).toBe('Test message');
  });

  it('should export with level filter', () => {
    setMinLogLevel(kernel, 'debug');
    log(kernel, 'debug', 'Debug message');
    log(kernel, 'info', 'Info message');
    log(kernel, 'warn', 'Warn message');

    const json = exportLogsAsJson(kernel, 'warn');
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1); // only warn
  });

  it('should export empty array when no logs', () => {
    const json = exportLogsAsJson(kernel);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual([]);
  });
});

describe('getLogStats', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should return log statistics', () => {
    setMinLogLevel(kernel, 'debug');
    log(kernel, 'debug', 'Debug 1');
    log(kernel, 'debug', 'Debug 2');
    log(kernel, 'info', 'Info 1');
    log(kernel, 'info', 'Info 2');
    log(kernel, 'info', 'Info 3');
    log(kernel, 'warn', 'Warn 1');
    log(kernel, 'error', 'Error 1');

    const stats = getLogStats(kernel);
    expect(stats.total).toBe(7);
    expect(stats.debug).toBe(2);
    expect(stats.info).toBe(3);
    expect(stats.warn).toBe(1);
    expect(stats.error).toBe(1);
  });

  it('should return zeros for empty logs', () => {
    const stats = getLogStats(kernel);
    expect(stats.total).toBe(0);
    expect(stats.debug).toBe(0);
    expect(stats.info).toBe(0);
    expect(stats.warn).toBe(0);
    expect(stats.error).toBe(0);
  });
});

describe('Logger Plugin Events', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should log query events', async () => {
    await kernel.emit('query', { query: { name: 'example.com', type: 'A' } });

    const logs = getLogs(kernel);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some(l => l.message === 'DNS query initiated')).toBe(true);
    expect(logs.some(l => l.data?.domain === 'example.com')).toBe(true);
  });

  it('should log response events', async () => {
    await kernel.emit('response', { queryId: 123 });

    const logs = getLogs(kernel);
    expect(logs.some(l => l.message === 'DNS response received')).toBe(true);
    expect(logs.some(l => l.data?.queryId === 123)).toBe(true);
  });

  it('should log error events', async () => {
    await kernel.emit('error', new Error('Test error'));

    const logs = getLogs(kernel);
    expect(logs.some(l => l.level === 'error' && l.message === 'DNS error occurred')).toBe(true);
  });

  it('should log parsed-response events', async () => {
    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      records: ['93.184.216.34'],
      ttl: 3600,
    });

    const logs = getLogs(kernel);
    expect(logs.some(l => l.message === 'DNS response parsed')).toBe(true);
    expect(logs.some(l => l.data?.domain === 'example.com')).toBe(true);
    expect(logs.some(l => l.data?.recordCount === 1)).toBe(true);
  });

  it('should log cache events', async () => {
    // Cache events are logged at debug level
    setMinLogLevel(kernel, 'debug');
    await kernel.emit('cache-hit', { key: 'test-key' });
    await kernel.emit('cache-miss', { key: 'test-key-2' });

    const logs = getLogs(kernel);
    expect(logs.some(l => l.message === 'Cache hit')).toBe(true);
    expect(logs.some(l => l.message === 'Cache miss')).toBe(true);
  });

  it('should log retry events', async () => {
    await kernel.emit('retry', { attempt: 1, maxRetries: 3, delay: 100 });

    const logs = getLogs(kernel);
    expect(logs.some(l => l.level === 'warn' && l.message === 'Retrying DNS query')).toBe(true);
  });
});

describe('Logger onDestroy', () => {
  it('should call onDestroy without error', () => {
    const kernel = new DnsKernel({});
    kernel.use(loggerPlugin);

    expect(() => {
      loggerPlugin.onDestroy?.();
    }).not.toThrow();
  });

  it('should handle onDestroy when cleanup is handled by kernel', () => {
    const kernel = new DnsKernel({});
    kernel.use(loggerPlugin);

    // onDestroy should be callable and do nothing
    if (loggerPlugin.onDestroy) {
      loggerPlugin.onDestroy();
    }

    // Logs should still be accessible through kernel
    log(kernel, 'info', 'After destroy');
    const logs = getLogs(kernel);
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Logger edge cases', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(loggerPlugin);
  });

  it('should handle empty message', () => {
    log(kernel, 'info', '');
    const logs = getLogs(kernel);
    expect(logs[0]?.message).toBe('');
  });

  it('should handle undefined data', () => {
    log(kernel, 'info', 'Test', undefined);
    const logs = getLogs(kernel);
    expect(logs[0]?.data).toBeUndefined();
  });

  it('should handle null data', () => {
    log(kernel, 'info', 'Test', null as never);
    const logs = getLogs(kernel);
    expect(logs[0]?.data).toBeNull();
  });

  it('should handle large data objects', () => {
    const largeData = { key: 'x'.repeat(10000) };
    log(kernel, 'info', 'Test', largeData);
    const logs = getLogs(kernel);
    expect(logs[0]?.data).toEqual(largeData);
  });

  it('should handle rapid logging', () => {
    for (let i = 0; i < 100; i++) {
      log(kernel, 'info', `Message ${i}`);
    }
    const logs = getLogs(kernel);
    expect(logs).toHaveLength(100);
  });
});
