/**
 * Query Builder Plugin
 *
 * Builds DNS queries in wire format.
 *
 * @module
 */

import type { DnsPlugin } from '../../types.js';
import type { DnsKernelContext } from '../../kernel.js';
import type { DnsQuery, RecordType } from '../../types.js';
import { DnsKernel } from '../../kernel.js';
import { buildQuery, resetQueryIdCounter } from '../../core/query.js';

/**
 * Query builder plugin context.
 *
 * @internal
 */
interface QueryBuilderState {
  /** Map of query IDs to queries */
  pendingQueries: Map<number, DnsQuery>;
  /** Query ID counter */
  nextId: number;
}

/**
 * Query builder plugin.
 *
 * Automatically builds DNS queries in wire format.
 *
 * @example
 * ```typescript
 * import { queryBuilderPlugin } from '@oxog/dns/plugins';
 *
 * kernel.use(queryBuilderPlugin);
 * ```
 */
export const queryBuilderPlugin: DnsPlugin<QueryBuilderState & DnsKernelContext> = {
  name: 'query-builder',
  version: '1.0.0',

  install(kernel: DnsKernel) {
    // Initialize state
    kernel.setState('pendingQueries', new Map());
    kernel.setState('nextId', 0);
  },

  onInit() {
    // Plugin initialized
  },

  onDestroy() {
    // Cleanup handled by kernel
  },
};

/**
 * Build a DNS query.
 *
 * @param kernel - DNS kernel
 * @param domain - Domain name to query
 * @param type - Record type
 * @param options - Query options
 * @returns Tuple of [queryId, queryBuffer]
 *
 * @example
 * ```typescript
 * const [queryId, buffer] = buildQueryWithKernel(kernel, 'example.com', 'A');
 * ```
 */
export function buildQueryWithKernel(
  kernel: DnsKernel<QueryBuilderState & DnsKernelContext>,
  domain: string,
  type: RecordType,
  options?: {
    timeout?: number;
    noCache?: boolean;
    dnssec?: boolean;
    sortSrv?: boolean;
  },
): [number, Buffer] {
  const state = kernel.context.customState;
  const pendingQueries = state.pendingQueries as Map<number, DnsQuery>;
  const nextId = (state.nextId as number) % 65536;

  // Build query buffer
  const buffer = buildQuery(domain, type, { recursionDesired: true });

  // Store pending query
  const query: DnsQuery = { name: domain, type, options };
  pendingQueries.set(nextId, query);

  // Update ID counter
  state.nextId = nextId + 1;

  // Emit query event
  kernel.emit('query', { queryId: nextId, query, buffer } as never);

  return [nextId, buffer];
}

/**
 * Get a pending query by ID.
 *
 * @param kernel - DNS kernel
 * @param queryId - Query ID
 * @returns Query or undefined
 *
 * @example
 * ```typescript
 * const query = getPendingQuery(kernel, 1234);
 * ```
 */
export function getPendingQuery(
  kernel: DnsKernel<QueryBuilderState & DnsKernelContext>,
  queryId: number,
): DnsQuery | undefined {
  const state = kernel.context.customState;
  const pendingQueries = state.pendingQueries as Map<number, DnsQuery>;
  return pendingQueries.get(queryId);
}

/**
 * Remove a pending query by ID.
 *
 * @param kernel - DNS kernel
 * @param queryId - Query ID
 * @returns True if query was removed
 *
 * @example
 * ```typescript
 * removePendingQuery(kernel, 1234);
 * ```
 */
export function removePendingQuery(
  kernel: DnsKernel<QueryBuilderState & DnsKernelContext>,
  queryId: number,
): boolean {
  const state = kernel.context.customState;
  const pendingQueries = state.pendingQueries as Map<number, DnsQuery>;
  return pendingQueries.delete(queryId);
}

/**
 * Clear all pending queries.
 *
 * @param kernel - DNS kernel
 *
 * @example
 * ```typescript
 * clearPendingQueries(kernel);
 * ```
 */
export function clearPendingQueries(kernel: DnsKernel<QueryBuilderState & DnsKernelContext>): void {
  const state = kernel.context.customState;
  (state.pendingQueries as Map<number, DnsQuery>).clear();
}

/**
 * Reset the query ID counter.
 *
 * @param kernel - DNS kernel
 *
 * @example
 * ```typescript
 * resetQueryCounter(kernel);
 * ```
 */
export function resetQueryCounter(kernel: DnsKernel<QueryBuilderState & DnsKernelContext>): void {
  resetQueryIdCounter();
  kernel.setState('nextId', 0);
}
