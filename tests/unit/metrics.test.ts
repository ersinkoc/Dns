/**
 * Metrics plugin tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DnsKernel } from '../../src/kernel.js';
import { metricsPlugin, recordMetric, getMetrics, getMetricNames, getMetricStats, clearMetrics, getAllMetrics, startTimer, stopTimer, getMetricsSummary } from '../../src/plugins/optional/metrics.js';

describe('Metrics Plugin', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
  });

  it('should install metrics plugin', () => {
    expect(() => kernel.use(metricsPlugin)).not.toThrow();
  });

  it('should have plugin name and version', () => {
    expect(metricsPlugin.name).toBe('metrics');
    expect(metricsPlugin.version).toBe('1.0.0');
  });
});

describe('Metrics Recording', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(metricsPlugin);
  });

  it('should record metric with value', () => {
    expect(() => recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    })).not.toThrow();
  });

  it('should record multiple metrics', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    recordMetric(kernel, {
      name: 'response',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A', records: '1' }
    });

    const allMetrics = getAllMetrics(kernel);
    expect(allMetrics).toBeDefined();
    expect(Object.keys(allMetrics).length).toBeGreaterThan(0);
  });

  it('should record metric with numeric value', () => {
    recordMetric(kernel, {
      name: 'query-time',
      value: 100,
      timestamp: Date.now(),
      labels: { domain: 'example.com' }
    });

    const metrics = getMetrics(kernel, 'query-time');
    expect(metrics).toBeDefined();
    expect(metrics.length).toBe(1);
    expect(metrics[0].value).toBe(100);
  });
});

describe('Metrics Retrieval', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(metricsPlugin);
  });

  it('should get metrics by name', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    const metrics = getMetrics(kernel, 'query');
    expect(metrics).toBeDefined();
    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('should return empty array for non-existent metric', () => {
    const metrics = getMetrics(kernel, 'nonexistent');
    expect(metrics).toEqual([]);
  });

  it('should get all metric names', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    recordMetric(kernel, {
      name: 'response',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    const names = getMetricNames(kernel);
    expect(names).toBeDefined();
    expect(names.length).toBeGreaterThanOrEqual(2);
    expect(names).toContain('query');
    expect(names).toContain('response');
  });

  it('should get all metrics', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    recordMetric(kernel, {
      name: 'response',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    const allMetrics = getAllMetrics(kernel);
    expect(allMetrics).toBeDefined();
    expect(typeof allMetrics).toBe('object');
    expect(Object.keys(allMetrics).length).toBeGreaterThan(0);
  });
});

describe('Metrics Statistics', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(metricsPlugin);
  });

  it('should get metric stats', () => {
    for (let i = 0; i < 10; i++) {
      recordMetric(kernel, {
        name: 'query-time',
        value: i * 10,
        timestamp: Date.now(),
        labels: { domain: 'example.com' }
      });
    }

    const stats = getMetricStats(kernel, 'query-time');
    expect(stats).toBeDefined();
    expect(stats?.count).toBe(10);
    expect(stats?.min).toBe(0);
    expect(stats?.max).toBe(90);
    expect(stats?.avg).toBeGreaterThan(0);
  });

  it('should return undefined for non-existent metric stats', () => {
    const stats = getMetricStats(kernel, 'nonexistent');
    expect(stats).toBeUndefined();
  });

  it('should get metrics summary', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'google.com', type: 'A' }
    });

    recordMetric(kernel, {
      name: 'query-time',
      value: 100,
      timestamp: Date.now(),
      labels: { domain: 'example.com' }
    });

    const summary = getMetricsSummary(kernel);
    expect(summary).toBeDefined();
    expect(summary['query']).toBeDefined();
    expect(summary['query'].count).toBe(2);
    expect(summary['query-time']).toBeDefined();
  });
});

describe('Metrics Clear', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(metricsPlugin);
  });

  it('should clear all metrics', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    recordMetric(kernel, {
      name: 'response',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    clearMetrics(kernel);

    const names = getMetricNames(kernel);
    expect(names.length).toBe(0);
  });

  it('should clear metrics by name', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    recordMetric(kernel, {
      name: 'response',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    clearMetrics(kernel, 'query');

    const queryMetrics = getMetrics(kernel, 'query');
    expect(queryMetrics.length).toBe(0);

    const responseMetrics = getMetrics(kernel, 'response');
    expect(responseMetrics.length).toBe(1);
  });
});

describe('Metrics Timers', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(metricsPlugin);
  });

  it('should start timer', () => {
    startTimer(kernel, 'test-id', { name: 'example.com', type: 'A' });

    const timers = kernel.getState('timers');
    expect(timers).toBeDefined();
    expect(timers.size).toBe(1);
  });

  it('should stop timer and record duration', async () => {
    startTimer(kernel, 'test-id', { name: 'example.com', type: 'A' });

    await new Promise(resolve => setTimeout(resolve, 10));

    const duration = stopTimer(kernel, 'test-id');
    expect(duration).toBeDefined();
    expect(duration).toBeGreaterThanOrEqual(10);

    const timers = kernel.getState('timers');
    expect(timers.size).toBe(0);
  });

  it('should return undefined for non-existent timer', () => {
    const duration = stopTimer(kernel, 'non-existent-id');
    expect(duration).toBeUndefined();
  });

  it('should record query-duration metric on stop', () => {
    startTimer(kernel, 'test-id', { name: 'example.com', type: 'A' });

    stopTimer(kernel, 'test-id');

    const metrics = getMetrics(kernel, 'query-duration');
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0].labels.domain).toBe('example.com');
    expect(metrics[0].labels.type).toBe('A');
  });
});

describe('Metrics Aggregation', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(metricsPlugin);
  });

  it('should aggregate metrics by name', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A' }
    });

    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'AAAA' }
    });

    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'google.com', type: 'A' }
    });

    const queryMetrics = getMetrics(kernel, 'query');
    expect(queryMetrics.length).toBe(3);
  });

  it('should calculate summary stats across multiple metrics', () => {
    for (let i = 0; i < 5; i++) {
      recordMetric(kernel, {
        name: 'query-time',
        value: i * 100,
        timestamp: Date.now(),
        labels: { domain: 'example.com' }
      });
    }

    const summary = getMetricsSummary(kernel);
    expect(summary['query-time']).toBeDefined();
    expect(summary['query-time'].count).toBe(5);
    expect(summary['query-time'].min).toBe(0);
    expect(summary['query-time'].max).toBe(400);
  });
});

describe('Metrics Labels', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(metricsPlugin);
  });

  it('should store labels with metrics', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: { domain: 'example.com', type: 'A', custom: 'value' }
    });

    const metrics = getMetrics(kernel, 'query');
    expect(metrics[0].labels).toEqual({
      domain: 'example.com',
      type: 'A',
      custom: 'value'
    });
  });

  it('should handle empty labels', () => {
    recordMetric(kernel, {
      name: 'query',
      value: 1,
      timestamp: Date.now(),
      labels: {}
    });

    const metrics = getMetrics(kernel, 'query');
    expect(metrics[0].labels).toEqual({});
  });
});

describe('Metrics Plugin Events', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(metricsPlugin);
  });

  it('should start timer on query event', async () => {
    await kernel.emit('query', {
      queryId: 'test-123',
      query: { name: 'example.com', type: 'A' }
    } as never);

    const timers = kernel.getState('timers') as Map<string, unknown>;
    expect(timers.has('test-123')).toBe(true);
  });

  it('should record queries-total metric on parsed-response', async () => {
    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      response: { answers: [1, 2, 3] }
    } as never);

    const metrics = getMetrics(kernel, 'queries-total');
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0].labels.type).toBe('A');
  });

  it('should record answers-total metric on parsed-response', async () => {
    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      response: { answers: [1, 2, 3, 4, 5] }
    } as never);

    const metrics = getMetrics(kernel, 'answers-total');
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0].value).toBe(5);
    expect(metrics[0].labels.domain).toBe('example.com');
  });

  it('should record errors-total metric on error event', async () => {
    const testError = new Error('Test error');
    testError.name = 'TestError';

    await kernel.emit('error', testError as never);

    const metrics = getMetrics(kernel, 'errors-total');
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0].value).toBe(1);
    expect(metrics[0].labels.type).toBe('TestError');
  });

  it('should handle multiple query events', async () => {
    await kernel.emit('query', {
      queryId: 'query-1',
      query: { name: 'example1.com', type: 'A' }
    } as never);

    await kernel.emit('query', {
      queryId: 'query-2',
      query: { name: 'example2.com', type: 'AAAA' }
    } as never);

    const timers = kernel.getState('timers') as Map<string, unknown>;
    expect(timers.size).toBe(2);
  });
});

describe('Metrics Trimming', () => {
  it('should trim metrics when maxMetrics is exceeded', () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    // Set a low maxMetrics limit
    kernel.setState('maxMetrics', 5);

    // Add more metrics than the limit
    for (let i = 0; i < 10; i++) {
      recordMetric(kernel, {
        name: 'test-metric',
        value: i,
        timestamp: Date.now(),
      });
    }

    const metrics = getMetrics(kernel, 'test-metric');
    // Should be trimmed to maxMetrics
    expect(metrics.length).toBe(5);
    // Should keep the most recent metrics
    expect(metrics[metrics.length - 1].value).toBe(9);
  });

  it('should keep most recent metrics when trimming', () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    kernel.setState('maxMetrics', 3);

    // Add 5 metrics
    for (let i = 1; i <= 5; i++) {
      recordMetric(kernel, {
        name: 'trim-test',
        value: i * 10,
        timestamp: Date.now(),
      });
    }

    const metrics = getMetrics(kernel, 'trim-test');
    expect(metrics.length).toBe(3);
    // Should keep the last 3 (30, 40, 50)
    expect(metrics.map(m => m.value)).toEqual([30, 40, 50]);
  });

  it('should not trim when under maxMetrics limit', () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    kernel.setState('maxMetrics', 100);

    for (let i = 0; i < 10; i++) {
      recordMetric(kernel, {
        name: 'no-trim',
        value: i,
        timestamp: Date.now(),
      });
    }

    const metrics = getMetrics(kernel, 'no-trim');
    expect(metrics.length).toBe(10);
  });
});

describe('Metrics Summary Edge Cases', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(metricsPlugin);
  });

  it('should return empty summary for no metrics', () => {
    const summary = getMetricsSummary(kernel);
    expect(summary).toEqual({});
  });

  it('should handle summary with single metric', () => {
    recordMetric(kernel, {
      name: 'single-metric',
      value: 42,
      timestamp: Date.now(),
    });

    const summary = getMetricsSummary(kernel);
    expect(summary['single-metric']).toBeDefined();
    expect(summary['single-metric'].count).toBe(1);
    expect(summary['single-metric'].min).toBe(42);
    expect(summary['single-metric'].max).toBe(42);
    expect(summary['single-metric'].avg).toBe(42);
  });

  it('should include metrics with zero values', () => {
    recordMetric(kernel, {
      name: 'zero-metric',
      value: 0,
      timestamp: Date.now(),
    });

    const stats = getMetricStats(kernel, 'zero-metric');
    expect(stats).toBeDefined();
    expect(stats?.min).toBe(0);
    expect(stats?.max).toBe(0);
    expect(stats?.avg).toBe(0);
  });

  it('should handle negative metric values', () => {
    recordMetric(kernel, {
      name: 'negative',
      value: -10,
      timestamp: Date.now(),
    });

    recordMetric(kernel, {
      name: 'negative',
      value: 10,
      timestamp: Date.now(),
    });

    const stats = getMetricStats(kernel, 'negative');
    expect(stats).toBeDefined();
    expect(stats?.min).toBe(-10);
    expect(stats?.max).toBe(10);
    expect(stats?.avg).toBe(0);
  });

  it('should handle very large metric values', () => {
    recordMetric(kernel, {
      name: 'large-values',
      value: Number.MAX_SAFE_INTEGER,
      timestamp: Date.now(),
    });

    const stats = getMetricStats(kernel, 'large-values');
    expect(stats).toBeDefined();
    expect(stats?.max).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('Metrics State Management', () => {
  it('should initialize with default maxMetrics', () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    const maxMetrics = kernel.getState('maxMetrics') as number;
    expect(maxMetrics).toBe(10000);
  });

  it('should initialize empty metrics map', () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    const metrics = kernel.getState('metrics') as Map<string, unknown>;
    expect(metrics).toBeInstanceOf(Map);
    expect(metrics.size).toBe(0);
  });

  it('should initialize empty timers map', () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    const timers = kernel.getState('timers') as Map<string, unknown>;
    expect(timers).toBeInstanceOf(Map);
    expect(timers.size).toBe(0);
  });
});

describe('Metrics onDestroy', () => {
  it('should call onDestroy without error', () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    expect(() => {
      metricsPlugin.onDestroy?.();
    }).not.toThrow();
  });

  it('should handle onDestroy when cleanup is handled by kernel', () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    // Record some metrics first
    recordMetric(kernel, {
      name: 'test-metric',
      value: 42,
      timestamp: Date.now(),
    });

    // onDestroy should be callable and do nothing
    if (metricsPlugin.onDestroy) {
      metricsPlugin.onDestroy();
    }

    // Metrics should still be accessible through kernel
    const metrics = getMetrics(kernel, 'test-metric');
    expect(metrics.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Metrics parsed-response edge cases', () => {
  it('should handle parsed-response without response.answers', async () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      response: {}
    } as never);

    const metrics = getMetrics(kernel, 'queries-total');
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('should handle parsed-response with empty answers array', async () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      response: { answers: [] }
    } as never);

    const answersMetrics = getMetrics(kernel, 'answers-total');
    expect(answersMetrics.length).toBeGreaterThan(0);
    expect(answersMetrics[0].value).toBe(0);
  });
});

describe('Metrics summary fallback path', () => {
  it('should handle metric name with empty array in summary', () => {
    const kernel = new DnsKernel({});
    kernel.use(metricsPlugin);

    // Directly add an empty array to the metrics map to trigger the else branch
    const metrics = kernel.getState('metrics') as Map<string, unknown[]>;
    metrics.set('empty-metric', []);

    // getMetricsSummary should handle this and use the fallback path
    const summary = getMetricsSummary(kernel);

    // The empty-metric should still be in the summary
    expect(summary['empty-metric']).toBeDefined();
    expect(summary['empty-metric'].count).toBe(0);
    expect(summary['empty-metric'].sum).toBe(0);
  });
});
