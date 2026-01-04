/**
 * Metrics Plugin
 *
 * Query timing and statistics collection.
 *
 * @module
 */

import type { DnsPlugin } from '../../types.js';
import type { DnsKernelContext } from '../../kernel.js';
import { DnsKernel } from '../../kernel.js';

/**
 * Metric data point.
 *
 * @example
 * ```typescript
 * const metric: Metric = {
 *   name: 'query-duration',
 *   value: 45,
 *   timestamp: Date.now(),
 *   labels: { domain: 'example.com', type: 'A' }
 * };
 * ```
 */
export interface Metric {
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Timestamp */
  timestamp: number;
  /** Optional labels */
  labels?: Record<string, string>;
}

/**
 * Metrics plugin state.
 *
 * @internal
 */
interface MetricsPluginState {
  /** Collected metrics */
  metrics: Map<string, Metric[]>;
  /** Maximum metrics to keep per name */
  maxMetrics: number;
  /** Query timers */
  timers: Map<string, { start: number; query: { name: string; type: string } }>;
}

/**
 * Metrics plugin.
 *
 * Collects query timing and statistics.
 *
 * @example
 * ```typescript
 * import { metricsPlugin } from '@oxog/dns/plugins';
 *
 * kernel.use(metricsPlugin);
 * ```
 */
export const metricsPlugin: DnsPlugin<MetricsPluginState & DnsKernelContext> = {
  name: 'metrics',
  version: '1.0.0',

  install(kernel) {
    // Initialize state
    kernel.setState('metrics', new Map());
    kernel.setState('maxMetrics', 10000);
    kernel.setState('timers', new Map());

    // Listen for query events to start timing
    kernel.on('query', async (data: { queryId: string | number; query: { name: string; type: string } }) => {
      const timers = kernel.getState('timers') as Map<string, { start: number; query: { name: string; type: string } }>;
      timers.set(String(data.queryId), {
        start: Date.now(),
        query: data.query,
      });
    });

    // Listen for parsed response events to record timing
    kernel.on(
      'parsed-response',
      async (data: { query: { name: string; type: string }; response: { answers: unknown[] } }) => {
        // Record query count
        recordMetric(kernel, {
          name: 'queries-total',
          value: 1,
          timestamp: Date.now(),
          labels: { type: data.query.type },
        });

        // Record answer count
        recordMetric(kernel, {
          name: 'answers-total',
          value: data.response.answers.length,
          timestamp: Date.now(),
          labels: { domain: data.query.name },
        });
      },
    );

    // Listen for error events to record errors
    kernel.on('error', async (error: Error) => {
      recordMetric(kernel, {
        name: 'errors-total',
        value: 1,
        timestamp: Date.now(),
        labels: { type: error.name },
      });
    });
  },

  onDestroy() {
    // Cleanup handled by kernel
  },
};

/**
 * Record a metric.
 *
 * @param kernel - DNS kernel
 * @param metric - Metric to record
 *
 * @example
 * ```typescript
 * recordMetric(kernel, {
 *   name: 'custom-metric',
 *   value: 100,
 *   timestamp: Date.now()
 * });
 * ```
 */
export function recordMetric(kernel: DnsKernel<MetricsPluginState & DnsKernelContext>, metric: Metric): void {
  const metrics = kernel.getState('metrics') as Map<string, Metric[]>;
  const maxMetrics = kernel.getState('maxMetrics') as number;

  if (!metrics.has(metric.name)) {
    metrics.set(metric.name, []);
  }

  const metricList = metrics.get(metric.name)!;
  metricList.push(metric);

  // Trim if necessary
  if (metricList.length > maxMetrics) {
    metricList.splice(0, metricList.length - maxMetrics);
  }
}

/**
 * Get all metrics for a name.
 *
 * @param kernel - DNS kernel
 * @param name - Metric name
 * @returns Array of metrics
 *
 * @example
 * ```typescript
 * const metrics = getMetrics(kernel, 'query-duration');
 * ```
 */
export function getMetrics(kernel: DnsKernel<MetricsPluginState & DnsKernelContext>, name: string): Metric[] {
  const metrics = kernel.getState('metrics') as Map<string, Metric[]>;
  return metrics.get(name) ?? [];
}

/**
 * Get all metric names.
 *
 * @param kernel - DNS kernel
 * @returns Array of metric names
 *
 * @example
 * ```typescript
 * const names = getMetricNames(kernel);
 * // ['queries-total', 'answers-total', 'errors-total']
 * ```
 */
export function getMetricNames(kernel: DnsKernel<MetricsPluginState & DnsKernelContext>): string[] {
  const metrics = kernel.getState('metrics') as Map<string, Metric[]>;
  return Array.from(metrics.keys());
}

/**
 * Get metric statistics.
 *
 * @param kernel - DNS kernel
 * @param name - Metric name
 * @returns Metric statistics or undefined
 *
 * @example
 * ```typescript
 * const stats = getMetricStats(kernel, 'query-duration');
 * console.log(stats); // { count: 100, min: 10, max: 500, avg: 45 }
 * ```
 */
export function getMetricStats(
  kernel: DnsKernel<MetricsPluginState & DnsKernelContext>,
  name: string,
): { count: number; min: number; max: number; avg: number; sum: number } | undefined {
  const metrics = getMetrics(kernel, name);

  if (metrics.length === 0) return undefined;

  const values = metrics.map((m) => m.value);

  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    sum: values.reduce((a, b) => a + b, 0),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
  };
}

/**
 * Clear all metrics.
 *
 * @param kernel - DNS kernel
 * @param name - Optional metric name to clear
 *
 * @example
 * ```typescript
 * clearMetrics(kernel);
 * clearMetrics(kernel, 'query-duration');
 * ```
 */
export function clearMetrics(kernel: DnsKernel<MetricsPluginState & DnsKernelContext>, name?: string): void {
  const metrics = kernel.getState('metrics') as Map<string, Metric[]>;

  if (name) {
    metrics.delete(name);
  } else {
    metrics.clear();
  }
}

/**
 * Get all metrics as a plain object.
 *
 * @param kernel - DNS kernel
 * @returns Object with all metrics
 *
 * @example
 * ```typescript
 * const all = getAllMetrics(kernel);
 * console.log(all); // { 'queries-total': [...], 'answers-total': [...] }
 * ```
 */
export function getAllMetrics(kernel: DnsKernel<MetricsPluginState & DnsKernelContext>): Record<string, Metric[]> {
  const metrics = kernel.getState('metrics') as Map<string, Metric[]>;
  const result: Record<string, Metric[]> = {};

  for (const [name, metricList] of metrics) {
    result[name] = [...metricList];
  }

  return result;
}

/**
 * Start a timer for a query.
 *
 * @param kernel - DNS kernel
 * @param queryId - Query ID
 * @param query - Query object
 *
 * @example
 * ```typescript
 * startTimer(kernel, '1234', { name: 'example.com', type: 'A' });
 * ```
 */
export function startTimer(
  kernel: DnsKernel<MetricsPluginState & DnsKernelContext>,
  queryId: string,
  query: { name: string; type: string },
): void {
  const timers = kernel.getState('timers') as Map<string, { start: number; query: { name: string; type: string } }>;
  timers.set(queryId, { start: Date.now(), query });
}

/**
 * Stop a timer and record the duration.
 *
 * @param kernel - DNS kernel
 * @param queryId - Query ID
 * @returns Duration in milliseconds or undefined
 *
 * @example
 * ```typescript
 * const duration = stopTimer(kernel, '1234');
 * ```
 */
export function stopTimer(kernel: DnsKernel<MetricsPluginState & DnsKernelContext>, queryId: string): number | undefined {
  const timers = kernel.getState('timers') as Map<string, { start: number; query: { name: string; type: string } }>;
  const timer = timers.get(queryId);

  if (!timer) return undefined;

  const duration = Date.now() - timer.start;

  recordMetric(kernel, {
    name: 'query-duration',
    value: duration,
    timestamp: Date.now(),
    labels: { domain: timer.query.name, type: timer.query.type },
  });

  timers.delete(queryId);
  return duration;
}

/**
 * Get a summary of all metrics.
 *
 * @param kernel - DNS kernel
 * @returns Summary of metrics
 *
 * @example
 * ```typescript
 * const summary = getMetricsSummary(kernel);
 * console.log(summary);
 * // {
 * //   'queries-total': { count: 100, sum: 100 },
 * //   'query-duration': { count: 100, min: 10, max: 500, avg: 45 }
 * // }
 * ```
 */
export function getMetricsSummary(
  kernel: DnsKernel<MetricsPluginState & DnsKernelContext>,
): Record<string, { count: number; min?: number; max?: number; avg?: number; sum?: number }> {
  const names = getMetricNames(kernel);
  const summary: Record<string, { count: number; min?: number; max?: number; avg?: number; sum?: number }> = {};

  for (const name of names) {
    const stats = getMetricStats(kernel, name);
    if (stats) {
      summary[name] = stats;
    } else {
      const metrics = getMetrics(kernel, name);
      summary[name] = { count: metrics.length, sum: metrics.reduce((a, b) => a + b.value, 0) };
    }
  }

  return summary;
}
