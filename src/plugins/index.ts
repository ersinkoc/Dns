/**
 * @oxog/dns Plugins
 *
 * Plugin system for extending DNS resolver functionality.
 *
 * @module
 */

// Core plugins (always loaded)
export { recordParserPlugin } from './core/record-parser.js';
export {
  getNextResolver,
  markResolverFailed,
  resetFailedResolvers,
  getResolvers,
  addResolver,
  removeResolver,
  getResolverHealth,
  setResolverHealth,
  resolverChainPlugin,
} from './core/resolver-chain.js';
export {
  buildQueryWithKernel,
  getPendingQuery,
  removePendingQuery,
  clearPendingQueries,
  resetQueryCounter,
  queryBuilderPlugin,
} from './core/query-builder.js';

// Optional plugins
export {
  cachePlugin,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheClear,
  cacheGetStats,
  cacheClean,
} from './optional/cache.js';
export {
  dohPlugin,
  dohQuery,
  dohQueryGet,
  dohSetServer,
  dohGetServer,
  dohSetHeader,
  dohGetConfig,
} from './optional/doh.js';
export {
  dnssecPlugin,
  validateDnssec,
  addTrustAnchor,
  removeTrustAnchor,
  getTrustAnchors,
  isDnssecRequired,
  setDnssecEnabled,
  type DnssecResult,
} from './optional/dnssec.js';
export {
  retryPlugin,
  calculateDelay,
  sleep,
  resetRetryCounter,
  getRetryCount,
  setMaxRetries,
  setRetryDelay,
  setBackoffStrategy,
  withRetry,
} from './optional/retry.js';
export {
  metricsPlugin,
  recordMetric,
  getMetrics,
  getMetricNames,
  getMetricStats,
  clearMetrics,
  getAllMetrics,
  startTimer,
  stopTimer,
  getMetricsSummary,
  type Metric,
} from './optional/metrics.js';
export {
  loggerPlugin,
  log,
  getLogs,
  clearLogs,
  setMinLogLevel,
  setLogFunction,
  createLogStream,
  exportLogsAsJson,
  getLogStats,
  type LogLevel,
  type LogEntry,
} from './optional/logger.js';

// Re-export kernel types
export type { DnsKernel } from '../kernel.js';
export type { PluginContext, KernelEvent } from '../types.js';
