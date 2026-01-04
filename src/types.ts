/**
 * DNS record types supported by the resolver.
 *
 * @example
 * ```typescript
 * import type { RecordType } from '@oxog/dns';
 *
 * const type: RecordType = 'A';
 * ```
 */
export type RecordType =
  | 'A'
  | 'AAAA'
  | 'MX'
  | 'TXT'
  | 'CNAME'
  | 'NS'
  | 'SRV'
  | 'PTR'
  | 'SOA'
  | 'CAA';

/**
 * DNS record type to value mapping.
 *
 * @internal
 */
export const RECORD_TYPE_VALUES: Record<RecordType, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  PTR: 12,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  SRV: 33,
  CAA: 257,
} as const;

/**
 * Map record type number to name.
 *
 * @internal
 */
export const RECORD_TYPE_NAMES: Record<number, RecordType> = Object.fromEntries(
  Object.entries(RECORD_TYPE_VALUES).map(([name, value]) => [value, name as RecordType]),
) as Record<number, RecordType>;

/**
 * MX record structure.
 *
 * @example
 * ```typescript
 * const mx: MxRecord = {
 *   priority: 5,
 *   exchange: 'gmail-smtp-in.l.google.com'
 * };
 * ```
 */
export interface MxRecord {
  /** Priority value (lower = higher priority) */
  priority: number;
  /** Mail exchange hostname */
  exchange: string;
}

/**
 * SRV record structure.
 *
 * @example
 * ```typescript
 * const srv: SrvRecord = {
 *   priority: 10,
 *   weight: 5,
 *   port: 5060,
 *   target: 'sipserver.example.com'
 * };
 * ```
 */
export interface SrvRecord {
  /** Priority value (lower = higher priority) */
  priority: number;
  /** Weight for load balancing */
  weight: number;
  /** Service port number */
  port: number;
  /** Target hostname */
  target: string;
}

/**
 * SOA record structure.
 *
 * @example
 * ```typescript
 * const soa: SoaRecord = {
 *   nsname: 'ns1.example.com',
 *   hostmaster: 'hostmaster.example.com',
 *   serial: 2024010101,
 *   refresh: 3600,
 *   retry: 600,
 *   expire: 604800,
 *   minttl: 86400
 * };
 * ```
 */
export interface SoaRecord {
  /** Primary nameserver */
  nsname: string;
  /** Hostmaster email */
  hostmaster: string;
  /** Zone serial number */
  serial: number;
  /** Refresh interval */
  refresh: number;
  /** Retry interval */
  retry: number;
  /** Expire time */
  expire: number;
  /** Minimum TTL */
  minttl: number;
}

/**
 * CAA record structure.
 *
 * @example
 * ```typescript
 * const caa: CaaRecord = {
 *   critical: false,
 *   tag: 'issue',
 *   value: 'letsencrypt.org'
 * };
 * ```
 */
export interface CaaRecord {
  /** Critical flag */
  critical: boolean;
  /** Property tag */
  tag: string;
  /** Property value */
  value: string;
}

/**
 * Map of record types to their parsed structure.
 *
 * @example
 * ```typescript
 * import type { RecordTypeMap } from '@oxog/dns';
 *
 * // RecordTypeMap['A'] = string
 * // RecordTypeMap['MX'] = MxRecord
 * // RecordTypeMap['TXT'] = string
 * ```
 */
export type RecordTypeMap = {
  A: string;
  AAAA: string;
  MX: MxRecord;
  TXT: string;
  CNAME: string;
  NS: string;
  SRV: SrvRecord;
  PTR: string;
  SOA: SoaRecord;
  CAA: CaaRecord;
};

/**
 * DNS query options.
 *
 * @example
 * ```typescript
 * const options: QueryOptions = {
 *   timeout: 2000,
 *   noCache: true,
 *   dnssec: true
 * };
 * ```
 */
export interface QueryOptions {
  /** Override default timeout for this query (in milliseconds) */
  timeout?: number;
  /** Bypass cache for this query */
  noCache?: boolean;
  /** Request DNSSEC records */
  dnssec?: boolean;
  /** Sort SRV records by priority/weight */
  sortSrv?: boolean;
}

/**
 * Cache configuration options.
 *
 * @example
 * ```typescript
 * const cacheOptions: CacheOptions = {
 *   enabled: true,
 *   maxSize: 1000,
 *   respectTtl: true,
 *   minTtl: 60,
 *   maxTtl: 86400
 * };
 * ```
 */
export interface CacheOptions {
  /** Enable caching */
  enabled: boolean;
  /** Maximum number of cache entries */
  maxSize?: number;
  /** Honor DNS TTL values */
  respectTtl?: boolean;
  /** Minimum TTL in seconds */
  minTtl?: number;
  /** Maximum TTL in seconds */
  maxTtl?: number;
}

/**
 * DNSSEC validation options.
 *
 * @example
 * ```typescript
 * const dnssecOptions: DnssecOptions = {
 *   enabled: true,
 *   requireValid: true,
 *   trustAnchors: 'auto'
 * };
 * ```
 */
export interface DnssecOptions {
  /** Enable DNSSEC validation */
  enabled: boolean;
  /** Reject invalid responses */
  requireValid?: boolean;
  /** Trust anchor configuration */
  trustAnchors?: 'auto' | string[];
}

/**
 * Resolver configuration options.
 *
 * @example
 * ```typescript
 * const options: ResolverOptions = {
 *   servers: ['8.8.8.8', '1.1.1.1'],
 *   timeout: 5000,
 *   retries: 3,
 *   cache: { enabled: true },
 *   type: 'udp'
 * };
 * ```
 */
export interface ResolverOptions {
  /** DNS servers to query (default: system DNS) */
  servers?: string[];
  /** Query timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Number of retries on failure (default: 2) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 100) */
  retryDelay?: number;
  /** Retry backoff strategy: 'exponential', 'linear', or 'constant' (default: 'exponential') */
  retryBackoff?: 'exponential' | 'linear' | 'constant';
  /** Enable response caching */
  cache?: CacheOptions | boolean;
  /** DNSSEC validation options */
  dnssec?: DnssecOptions | boolean;
  /** Resolver type: 'udp', 'tcp', or 'doh' */
  type?: 'udp' | 'tcp' | 'doh';
  /** DoH server URL (required when type is 'doh') */
  server?: string;
  /** Server rotation strategy: 'failover', 'round-robin', or 'random' */
  rotationStrategy?: 'failover' | 'round-robin' | 'random';
  /** Enable server health checks */
  healthCheck?: boolean;
}

/**
 * DNS response with metadata.
 *
 * @example
 * ```typescript
 * const response: DnsResponse<string[]> = {
 *   records: ['93.184.216.34'],
 *   ttl: 3600,
 *   cached: false,
 *   duration: 45,
 *   resolver: '8.8.8.8'
 * };
 * ```
 */
export interface DnsResponse<T = unknown> {
  /** Resolved records */
  records: T[];
  /** Time to live in seconds */
  ttl: number;
  /** Whether response was from cache */
  cached: boolean;
  /** Query duration in milliseconds */
  duration: number;
  /** DNSSEC validation status */
  dnssecValid?: boolean;
  /** Resolver that provided the response */
  resolver: string;
}

/**
 * DNS query structure.
 *
 * @internal
 */
export interface DnsQuery {
  /** Domain name to query */
  name: string;
  /** Record type */
  type: RecordType;
  /** Query options */
  options?: QueryOptions;
}

/**
 * DNS response from wire format.
 *
 * @internal
 */
export interface WireDnsResponse {
  /** Response ID */
  id: number;
  /** Response flags */
  flags: number;
  /** Question section */
  questions: DnsQuery[];
  /** Answer section */
  answers: WireDnsRecord[];
  /** Authority section */
  authorities: WireDnsRecord[];
  /** Additional section */
  additionals: WireDnsRecord[];
}

/**
 * DNS record from wire format.
 *
 * @internal
 */
export interface WireDnsRecord {
  /** Record name */
  name: string;
  /** Record type */
  type: number;
  /** Record class */
  class_: number;
  /** Time to live */
  ttl: number;
  /** Record data length */
  rdlength: number;
  /** Record data as buffer */
  rdata: Buffer;
}

/**
 * Cache statistics.
 *
 * @example
 * ```typescript
 * const stats: CacheStats = {
 *   hits: 150,
 *   misses: 20,
 *   size: 45,
 *   hitRate: 0.882
 * };
 * ```
 */
export interface CacheStats {
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Current cache size */
  size: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
}

/**
 * Resolver statistics.
 *
 * @example
 * ```typescript
 * const stats: ResolverStats = {
 *   totalQueries: 1000,
 *   successfulQueries: 980,
 *   failedQueries: 20,
 *   averageDuration: 45
 * };
 * ```
 */
export interface ResolverStats {
  /** Total number of queries */
  totalQueries: number;
  /** Number of successful queries */
  successfulQueries: number;
  /** Number of failed queries */
  failedQueries: number;
  /** Average query duration in milliseconds */
  averageDuration: number;
}

/**
 * Plugin context shared between plugins.
 *
 * @template T - Custom context type
 *
 * @example
 * ```typescript
 * interface MyContext {
 *   cache?: Map<string, unknown>;
 *   metrics?: ResolverStats;
 * }
 *
 * const context: PluginContext<MyContext> = {
 *   options: {},
 *   state: {}
 * };
 * ```
 */
export interface PluginContext<T = unknown> {
  /** Resolver options */
  options: ResolverOptions;
  /** Shared state between plugins */
  state: T;
}

/**
 * DNS kernel lifecycle events.
 *
 * @internal
 */
export type KernelEvent = 'query' | 'response' | 'error' | 'cache-hit' | 'cache-miss' | 'parsed-response' | 'retry';

/**
 * Event listener callback.
 *
 * @template T - Event data type
 *
 * @internal
 */
export type EventListener<T = unknown> = (data: T) => void | Promise<void>;

/**
 * DNS plugin interface.
 *
 * Plugins extend the functionality of the DNS kernel.
 *
 * @template T - Custom context type
 *
 * @example
 * ```typescript
 * const cachePlugin: DnsPlugin = {
 *   name: 'cache',
 *   version: '1.0.0',
 *   install(kernel) {
 *     kernel.on('query', async (data) => {
 *       // Cache logic
 *     });
 *   },
 *   onInit: async () => {
 *     // Initialization logic
 *   },
 *   onDestroy: async () => {
 *     // Cleanup logic
 *   }
 * };
 * ```
 */
export interface DnsPlugin<T = unknown> {
  /** Plugin name */
  name: string;
  /** Plugin version */
  version?: string;
  /** Plugin dependencies (plugin names that must be registered first) */
  dependencies?: readonly string[];
  /** Install function called when plugin is registered */
  install: (kernel: any) => void | Promise<void>;
  /** Optional async initialization called after all plugins are registered */
  onInit?: () => void | Promise<void>;
  /** Optional cleanup function called when plugin is unregistered */
  onDestroy?: () => void | Promise<void>;
}

/**
 * DNS error codes.
 *
 * @example
 * ```typescript
 * import { DnsErrorCode } from '@oxog/dns';
 *
 * if (error.code === DnsErrorCode.NXDOMAIN) {
 *   console.log('Domain does not exist');
 * }
 * ```
 */
export enum DnsErrorCode {
  /** Domain does not exist */
  NXDOMAIN = 'NXDOMAIN',
  /** Query timed out */
  TIMEOUT = 'TIMEOUT',
  /** Server failed to respond */
  SERVFAIL = 'SERVFAIL',
  /** DNSSEC validation failed */
  DNSSEC_INVALID = 'DNSSEC_INVALID',
  /** Invalid query */
  INVALID_QUERY = 'INVALID_QUERY',
  /** Network error */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}
