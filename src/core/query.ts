/**
 * DNS query builder.
 *
 * @module
 */

import type { RecordType } from '../types.js';
import { validateDomain } from '../utils/domain.js';
import { encodeQuery as encodeQueryWire } from './wire.js';

/**
 * Query ID counter (for generating unique IDs).
 *
 * @internal
 */
let queryId = 0;

/**
 * Get the next query ID.
 *
 * @internal
 */
function getNextId(): number {
  queryId = (queryId + 1) % 65536;
  return queryId;
}

/**
 * DNS query options.
 *
 * @example
 * ```typescript
 * const options: QueryBuilderOptions = {
 *   recursionDesired: true,
 *   dnssec: false
 * };
 * ```
 */
export interface QueryBuilderOptions {
  /** Set the RD (Recursion Desired) flag */
  recursionDesired?: boolean;
  /** Request DNSSEC records (sets the DO bit) */
  dnssec?: boolean;
}

/**
 * Build a DNS query in wire format.
 *
 * @param domain - Domain name to query
 * @param type - Record type
 * @param options - Query options
 * @returns DNS query buffer
 * @throws {ValidationError} If domain is invalid
 *
 * @example
 * ```typescript
 * const query = buildQuery('example.com', 'A', {
 *   recursionDesired: true
 * });
 * ```
 */
export function buildQuery(
  domain: string,
  type: RecordType,
  options: QueryBuilderOptions = {},
): Buffer {
  // Validate domain
  validateDomain(domain);

  // Get query ID
  const id = getNextId();

  // Encode query
  return encodeQueryWire(id, domain, type, options.recursionDesired !== false);
}

/**
 * Build a DNS query with a specific ID.
 *
 * @param id - Query ID
 * @param domain - Domain name to query
 * @param type - Record type
 * @param recursionDesired - Set RD flag
 * @returns DNS query buffer
 *
 * @example
 * ```typescript
 * const query = buildQueryWithId(1234, 'example.com', 'A', true);
 * ```
 */
export function buildQueryWithId(
  id: number,
  domain: string,
  type: RecordType,
  recursionDesired = true,
): Buffer {
  validateDomain(domain);
  return encodeQueryWire(id, domain, type, recursionDesired);
}

/**
 * Reset the query ID counter (useful for testing).
 *
 * @example
 * ```typescript
 * resetQueryIdCounter();
 * const id1 = getNextId(); // 0
 * const id2 = getNextId(); // 1
 * ```
 */
export function resetQueryIdCounter(): void {
  queryId = 0;
}

/**
 * Set the query ID counter (useful for testing).
 *
 * @param value - New counter value
 *
 * @example
 * ```typescript
 * setQueryIdCounter(100);
 * const id = getNextId(); // 101
 * ```
 */
export function setQueryIdCounter(value: number): void {
  queryId = value % 65536;
}

/**
 * Get the current query ID counter value.
 *
 * @returns Current counter value
 *
 * @example
 * ```typescript
 * const current = getQueryIdCounter();
 * ```
 */
export function getQueryIdCounter(): number {
  return queryId;
}
