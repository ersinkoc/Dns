/**
 * Plugin tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DnsKernel, createKernel } from '../../src/kernel.js';
import { queryBuilderPlugin, buildQueryWithKernel, getPendingQuery, removePendingQuery } from '../../src/plugins/core/query-builder.js';
import {
  resolverChainPlugin,
  getNextResolver,
  addResolver,
  removeResolver,
} from '../../src/plugins/core/resolver-chain.js';
import { recordParserPlugin } from '../../src/plugins/core/record-parser.js';
import { cachePlugin, cacheGet, cacheSet, cacheClear } from '../../src/plugins/optional/cache.js';
import { retryPlugin, calculateDelay, sleep } from '../../src/plugins/optional/retry.js';
import { metricsPlugin, recordMetric, getMetrics, getMetricStats } from '../../src/plugins/optional/metrics.js';
import { loggerPlugin, log, getLogs, clearLogs } from '../../src/plugins/optional/logger.js';

describe('plugins', () => {
  describe('queryBuilderPlugin', () => {
    let kernel: DnsKernel;

    beforeEach(() => {
      kernel = createKernel();
      kernel.use(queryBuilderPlugin);
    });

    it('should build query', () => {
      const [queryId, buffer] = buildQueryWithKernel(kernel, 'example.com', 'A');
      expect(queryId).toBe(0);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should track pending query', () => {
      const [queryId] = buildQueryWithKernel(kernel, 'example.com', 'A');
      const query = getPendingQuery(kernel, queryId);
      expect(query).toBeDefined();
      expect(query?.name).toBe('example.com');
      expect(query?.type).toBe('A');
    });

    it('should remove pending query', () => {
      const [queryId] = buildQueryWithKernel(kernel, 'example.com', 'A');
      expect(removePendingQuery(kernel, queryId)).toBe(true);
      expect(getPendingQuery(kernel, queryId)).toBeUndefined();
    });
  });

  describe('resolverChainPlugin', () => {
    let kernel: DnsKernel;

    beforeEach(() => {
      kernel = createKernel({ servers: ['8.8.8.8', '1.1.1.1'] });
      kernel.use(resolverChainPlugin);
    });

    it('should get next resolver', () => {
      const server = getNextResolver(kernel);
      expect(['8.8.8.8', '1.1.1.1']).toContain(server);
    });

    it('should add resolver', () => {
      addResolver(kernel, '9.9.9.9');
      const servers = kernel.context.customState.servers as string[];
      expect(servers).toContain('9.9.9.9');
    });

    it('should remove resolver', () => {
      expect(removeResolver(kernel, '1.1.1.1')).toBe(true);
      const servers = kernel.context.customState.servers as string[];
      expect(servers).not.toContain('1.1.1.1');
    });
  });

  describe('recordParserPlugin', () => {
    let kernel: DnsKernel;

    beforeEach(() => {
      kernel = createKernel();
      kernel.use(recordParserPlugin);
    });

    it('should register plugin', () => {
      expect(kernel.has('record-parser')).toBe(true);
    });
  });

  describe('cachePlugin', () => {
    let kernel: DnsKernel;

    beforeEach(() => {
      kernel = createKernel({ cache: { enabled: true } });
      kernel.use(cachePlugin);
    });

    it('should cache value', () => {
      cacheSet(kernel, 'test:key', ['value1', 'value2'], 3600);
      const value = cacheGet(kernel, 'test:key');
      expect(value).toEqual(['value1', 'value2']);
    });

    it('should return undefined for non-existent key', () => {
      expect(cacheGet(kernel, 'nonexistent')).toBeUndefined();
    });

    it('should clear cache', () => {
      cacheSet(kernel, 'test:key', 'value', 3600);
      cacheClear(kernel);
      expect(cacheGet(kernel, 'test:key')).toBeUndefined();
    });
  });

  describe('retryPlugin', () => {
    let kernel: DnsKernel;

    beforeEach(() => {
      kernel = createKernel({ retries: 3, retryDelay: 100, retryBackoff: 'exponential' });
      kernel.use(retryPlugin);
    });

    it('should calculate exponential backoff', () => {
      expect(calculateDelay(kernel, 0)).toBe(100);
      expect(calculateDelay(kernel, 1)).toBe(200);
      expect(calculateDelay(kernel, 2)).toBe(400);
    });

    it('should calculate linear backoff', () => {
      kernel.context.customState.backoff = 'linear';
      expect(calculateDelay(kernel, 0)).toBe(100);
      expect(calculateDelay(kernel, 1)).toBe(200);
      expect(calculateDelay(kernel, 2)).toBe(300);
    });

    it('should calculate constant backoff', () => {
      kernel.context.customState.backoff = 'constant';
      expect(calculateDelay(kernel, 0)).toBe(100);
      expect(calculateDelay(kernel, 1)).toBe(100);
    });

    it('should sleep', async () => {
      const start = Date.now();
      await sleep(50);
      expect(Date.now() - start).toBeGreaterThanOrEqual(45);
    });
  });

  describe('metricsPlugin', () => {
    let kernel: DnsKernel;

    beforeEach(() => {
      kernel = createKernel();
      kernel.use(metricsPlugin);
    });

    it('should record metric', () => {
      recordMetric(kernel, {
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
      });

      const metrics = getMetrics(kernel, 'test-metric');
      expect(metrics.length).toBe(1);
      expect(metrics[0]?.value).toBe(100);
    });

    it('should calculate metric stats', () => {
      recordMetric(kernel, { name: 'test', value: 10, timestamp: Date.now() });
      recordMetric(kernel, { name: 'test', value: 20, timestamp: Date.now() });
      recordMetric(kernel, { name: 'test', value: 30, timestamp: Date.now() });

      const stats = getMetricStats(kernel, 'test');
      expect(stats).toEqual({
        count: 3,
        min: 10,
        max: 30,
        sum: 60,
        avg: 20,
      });
    });
  });

  describe('loggerPlugin', () => {
    let kernel: DnsKernel;

    beforeEach(() => {
      kernel = createKernel();
      kernel.use(loggerPlugin);
    });

    it('should log message', () => {
      log(kernel, 'info', 'Test message', { key: 'value' });
      const logs = getLogs(kernel);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]?.message).toBe('Test message');
    });

    it('should filter by log level', () => {
      log(kernel, 'debug', 'Debug message');
      log(kernel, 'info', 'Info message');
      log(kernel, 'error', 'Error message');

      const infoLogs = getLogs(kernel, 'info');
      expect(infoLogs.length).toBe(2); // info + error
    });

    it('should clear logs', () => {
      log(kernel, 'info', 'Test');
      clearLogs(kernel);
      expect(getLogs(kernel).length).toBe(0);
    });
  });
});
