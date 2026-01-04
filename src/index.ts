/**
 * @oxog/dns
 *
 * Zero-dependency DNS lookup library with DNS-over-HTTPS, caching, and DNSSEC validation.
 *
 * @example
 * ```typescript
 * import { dns } from '@oxog/dns';
 *
 * // Simple A record lookup
 * const ips = await dns.resolve('example.com', 'A');
 * console.log(ips); // ['93.184.216.34']
 *
 * // MX record lookup
 * const mx = await dns.resolve('gmail.com', 'MX');
 * console.log(mx); // [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }]
 *
 * // Create custom resolver
 * const resolver = dns.createResolver({
 *   servers: ['8.8.8.8', '1.1.1.1'],
 *   timeout: 5000,
 *   cache: { enabled: true }
 * });
 *
 * const result = await resolver.resolve('example.com', 'A');
 * console.log(result.records); // ['93.184.216.34']
 * console.log(result.ttl); // 3600
 * ```
 *
 * @module
 */

// Core types
export type {
  RecordType,
  RecordTypeMap,
  MxRecord,
  SrvRecord,
  SoaRecord,
  CaaRecord,
  QueryOptions,
  CacheOptions,
  DnssecOptions,
  ResolverOptions,
  DnsResponse,
  DnsQuery,
  CacheStats,
  ResolverStats,
  PluginContext,
  KernelEvent,
} from './types.js';
export { DnsErrorCode } from './types.js';

// Errors
export { DnsError, ValidationError, PluginError } from './errors.js';

// Kernel
export { DnsKernel, createKernel } from './kernel.js';

// Resolver
import { createResolver as createDnsResolver } from './core/resolver.js';
export { DnsResolver, createResolver } from './core/resolver.js';

// Low-level utilities
export {
  // Wire format
  encodeName,
  decodeName,
  encodeQuery,
  decodeResponse,
  getRecordTypeName,
  getRecordTypeValue,
} from './core/wire.js';

export {
  // Query builder
  buildQuery,
  buildQueryWithId,
  resetQueryIdCounter,
  setQueryIdCounter,
  getQueryIdCounter,
  type QueryBuilderOptions,
} from './core/query.js';

export {
  // Response parser
  parseARecord,
  parseAAAARecord,
  parseCNAMERecord,
  parseNSRecord,
  parsePTRRecord,
  parseMXRecord,
  parseSRVRecord,
  parseSOARecord,
  parseTXTRecord,
  parseCAARecord,
  parseRecord,
  parseRecords,
  getMinTtl,
  isNXDOMAIN,
  isSERVFAIL,
  sortSRVRecords,
} from './core/parser.js';

// IP utilities
export {
  isValidIPv4,
  isValidIPv6,
  isValidIP,
  isValidHost,
  ipv4ToReverse,
  ipv6ToReverse,
  ipToReverse,
  getIPVersion,
  bufferToIPv4,
  bufferToIPv6,
  compressIPv6,
  ipv4ToBuffer,
  ipv6ToBuffer,
  expandIPv6,
} from './utils/ip.js';

// Domain utilities
export {
  isValidDomain,
  validateDomain,
  normalizeDomain,
  getRootDomain,
  getSubdomains,
  isSubdomain,
  sameRootDomain,
  toPunycode,
  parseRecordType,
  formatDomain,
  isReverseZone,
  reverseToIP,
} from './utils/domain.js';

// Buffer utilities
export {
  readUInt16BE,
  writeUInt16BE,
  readUInt32BE,
  writeUInt32BE,
  concatBuffers,
  sliceBuffer,
  repeatByte,
  buffersEqual,
  bufferToHex,
  hexToBuffer,
  readNullTerminatedString,
  writeNullTerminatedString,
} from './utils/buffer.js';

// Create the base resolver instance
const _resolver = createDnsResolver();

/**
 * Default DNS resolver instance.
 *
 * Uses system DNS settings with sensible defaults.
 *
 * @example
 * ```typescript
 * import { dns } from '@oxog/dns';
 *
 * const records = await dns.resolve('example.com', 'A');
 * ```
 */
export const dns = Object.assign(_resolver, {
  /**
   * Create a new DNS resolver.
   *
   * @param options - Resolver options
   * @returns New resolver instance
   *
   * @example
   * ```typescript
   * const resolver = dns.createResolver({
   *   servers: ['8.8.8.8'],
   *   timeout: 5000
   * });
   * ```
   */
  createResolver(options?: import('./types.js').ResolverOptions) {
    return createDnsResolver(options);
  },

  /**
   * Resolve DNS records for a domain (returns only records).
   *
   * @param domain - Domain name to resolve
   * @param type - Record type
   * @param options - Query options
   * @returns Promise resolving to array of records
   *
   * @example
   * ```typescript
   * const ips = await dns.resolve('example.com', 'A');
   * console.log(ips); // ['93.184.216.34']
   *
   * const mx = await dns.resolve('gmail.com', 'MX');
   * console.log(mx); // [{ priority: 5, exchange: '...' }]
   * ```
   */
  /* v8 ignore next 8 */
  async resolve<T extends import('./types.js').RecordType>(
    domain: string,
    type: T,
    options?: import('./types.js').QueryOptions,
  ): Promise<import('./types.js').RecordTypeMap[T][]> {
    const result = await _resolver.resolve(domain, type, options);
    return result.records as import('./types.js').RecordTypeMap[T][];
  },

  /**
   * Reverse DNS lookup.
   *
   * @param ip - IP address
   * @returns Promise resolving to hostname
   *
   * @example
   * ```typescript
   * const hostname = await dns.reverse('8.8.8.8');
   * console.log(hostname); // 'dns.google'
   * ```
   */
  /* v8 ignore next 7 */
  async reverse(ip: string): Promise<string> {
    const { ipToReverse } = await import('./utils/ip.js');
    const reverseDomain = ipToReverse(ip);
    const result = await _resolver.resolve(reverseDomain, 'PTR');
    const records = result.records as string[];
    return Array.isArray(records) ? records[0] ?? '' : String(records);
  },

  /**
   * Reverse DNS lookup with all PTR records.
   *
   * @param ip - IP address
   * @returns Promise resolving to array of hostnames
   *
   * @example
   * ```typescript
   * const ptrs = await dns.reverseAll('8.8.8.8');
   * console.log(ptrs); // ['dns.google']
   * ```
   */
  /* v8 ignore next 7 */
  async reverseAll(ip: string): Promise<string[]> {
    const { ipToReverse } = await import('./utils/ip.js');
    const reverseDomain = ipToReverse(ip);
    const result = await _resolver.resolve(reverseDomain, 'PTR');
    const records = result.records as string[];
    return Array.isArray(records) ? records : [String(records)];
  },
});

// Re-export types
// Note: DnsPlugin type is not currently exported from kernel.js
// Users should extend the Plugin interface from types.js directly
