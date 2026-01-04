/**
 * Plugin tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DnsKernel, createKernel } from '../../src/kernel.js';
import { queryBuilderPlugin, buildQueryWithKernel, clearPendingQueries, resetQueryCounter, getPendingQuery, removePendingQuery } from '../../src/plugins/core/query-builder.js';
import {
  resolverChainPlugin,
  getNextResolver,
  addResolver,
  removeResolver,
  getResolvers,
  resetFailedResolvers,
} from '../../src/plugins/core/resolver-chain.js';
import { recordParserPlugin, getParsedResponse, setParsedResponse, clearParsedResponses } from '../../src/plugins/core/record-parser.js';
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

    it('should handle onInit lifecycle hook', async () => {
      await kernel.init();
      // Plugin should be initialized after init
      expect(kernel.context.initialized.has('query-builder')).toBe(true);
    });

    it('should handle onDestroy lifecycle hook', async () => {
      await kernel.init();
      await kernel.destroy();
      // After destroy, plugins should be cleared
      expect(kernel.context.plugins.size).toBe(0);
    });

    it('should build query with options', () => {
      const [queryId, buffer] = buildQueryWithKernel(kernel, 'example.com', 'A', {
        timeout: 5000,
        noCache: true,
        dnssec: false,
      });
      const query = getPendingQuery(kernel, queryId);
      expect(query?.options).toEqual({
        timeout: 5000,
        noCache: true,
        dnssec: false,
      });
    });

    it('should return undefined for non-existent pending query', () => {
      const query = getPendingQuery(kernel, 9999);
      expect(query).toBeUndefined();
    });

    it('should return false when removing non-existent query', () => {
      expect(removePendingQuery(kernel, 9999)).toBe(false);
    });

    it('should handle query ID counter wrapping', async () => {
      kernel.setState('nextId', 65535);
      const [queryId1] = buildQueryWithKernel(kernel, 'test1.com', 'A');
      expect(queryId1).toBe(65535);

      const [queryId2] = buildQueryWithKernel(kernel, 'test2.com', 'A');
      expect(queryId2).toBe(0); // Wrapped around
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

  describe('Query Builder Plugin', () => {
    it('should build query buffer for A record', () => {
      const kernel = new DnsKernel({ timeout: 5000 });
      kernel.use(queryBuilderPlugin);

      const [id, buffer] = buildQueryWithKernel(kernel, 'example.com', 'A');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(typeof id).toBe('number');
    });

    it('should build query buffer for AAAA record', () => {
      const kernel = new DnsKernel({ timeout: 5000 });
      kernel.use(queryBuilderPlugin);

      const [id, buffer] = buildQueryWithKernel(kernel, 'example.com', 'AAAA');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should build query buffer for MX record', () => {
      const kernel = new DnsKernel({ timeout: 5000 });
      kernel.use(queryBuilderPlugin);

      const [id, buffer] = buildQueryWithKernel(kernel, 'example.com', 'MX');
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should clear pending queries', () => {
      const kernel = new DnsKernel({ timeout: 5000 });
      kernel.use(queryBuilderPlugin);

      buildQueryWithKernel(kernel, 'test.com', 'A');
      clearPendingQueries(kernel);

      // After clearing, pending queries should be empty
      expect(kernel.getState('pendingQueries')?.size).toBe(0);
    });

    it('should reset query counter', () => {
      const kernel = new DnsKernel({ timeout: 5000 });
      kernel.use(queryBuilderPlugin);

      buildQueryWithKernel(kernel, 'test.com', 'A');
      buildQueryWithKernel(kernel, 'test2.com', 'A');

      const counterBefore = kernel.getState('nextId') as number;

      resetQueryCounter(kernel);

      const counterAfter = kernel.getState('nextId') as number;
      expect(counterAfter).toBe(0);
      expect(counterAfter).toBeLessThan(counterBefore);
    });
  });

  describe('Record Parser Plugin', () => {
    it('should set and get parsed responses', () => {
      const kernel = new DnsKernel({});
      kernel.use(recordParserPlugin);

      const response = {
        id: 1,
        flags: 0x8180,
        questions: [],
        answers: [
          { type: 'A', class: 1, ttl: 300, data: Buffer.from([0x7f, 0x00, 0x00, 0x01]) },
        ] as any,
        authorities: [],
        additionals: [],
      };

      setParsedResponse(kernel, 1, response);
      const parsed = getParsedResponse(kernel, 1);
      expect(parsed).toBeDefined();
    });

    it('should return undefined for non-existent parsed response', () => {
      const kernel = new DnsKernel({});
      kernel.use(recordParserPlugin);

      const parsed = getParsedResponse(kernel, 9999);
      expect(parsed).toBeUndefined();
    });

    it('should clear parsed responses', () => {
      const kernel = new DnsKernel({});
      kernel.use(recordParserPlugin);

      const response = { id: 1, flags: 0x8180, questions: [], answers: [], authorities: [], additionals: [] } as any;
      setParsedResponse(kernel, 1, response);

      clearParsedResponses(kernel);

      const parsed = getParsedResponse(kernel, 1);
      expect(parsed).toBeUndefined();
    });
  });

  describe('Resolver Chain Plugin', () => {
    it('should get next resolver', () => {
      const kernel = new DnsKernel({});
      kernel.use(resolverChainPlugin);

      const resolver = getNextResolver(kernel);
      expect(resolver).toBeDefined();
      expect(typeof resolver).toBe('string');
    });

    it('should add and remove resolvers', () => {
      const kernel = new DnsKernel({});
      kernel.use(resolverChainPlugin);

      addResolver(kernel, '8.8.8.8');
      addResolver(kernel, '1.1.1.1');

      const resolvers = getResolvers(kernel);
      expect(resolvers).toContain('8.8.8.8');
      expect(resolvers).toContain('1.1.1.1');

      removeResolver(kernel, '8.8.8.8');

      const resolversAfter = getResolvers(kernel);
      expect(resolversAfter).not.toContain('8.8.8.8');
      expect(resolversAfter).toContain('1.1.1.1');
    });

    it('should reset failed resolvers', () => {
      const kernel = new DnsKernel({});
      kernel.use(resolverChainPlugin);

      addResolver(kernel, '8.8.8.8');
      kernel.setState('failed', new Set(['8.8.8.8']));

      resetFailedResolvers(kernel);

      const failed = kernel.getState('failed') as Set<string>;
      expect(failed.size).toBe(0);
    });
  });
});
