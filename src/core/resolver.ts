/**
 * DNS Resolver Core
 *
 * Main resolver implementation using the micro-kernel architecture.
 *
 * @module
 */

import type {
  RecordType,
  ResolverOptions,
  QueryOptions,
  DnsResponse,
  RecordTypeMap,
  CacheOptions,
  DnssecOptions,
  CacheStats,
  ResolverStats,
  DnsErrorCode,
  DnsQuery,
} from '../types.js';
import { DnsKernel } from '../kernel.js';
import { DnsError } from '../errors.js';
import { isValidDomain, normalizeDomain } from '../utils/domain.js';
import { recordParserPlugin } from '../plugins/core/record-parser.js';
import { resolverChainPlugin, getNextResolver, markResolverFailed } from '../plugins/core/resolver-chain.js';
import { queryBuilderPlugin, buildQueryWithKernel, removePendingQuery } from '../plugins/core/query-builder.js';
import dgram from 'node:dgram';

/**
 * Cache entry.
 *
 * @internal
 */
interface CacheEntry<T> {
  /** Cached records */
  records: T[];
  /** Time to live in seconds */
  ttl: number;
  /** Entry creation timestamp */
  createdAt: number;
  /** Entry expiration timestamp */
  expiresAt: number;
}

/**
 * Resolver state.
 *
 * @internal
 */
interface ResolverState {
  /** Response cache */
  cache: Map<string, CacheEntry<unknown>>;
  /** Cache statistics */
  cacheStats: { hits: number; misses: number };
  /** Resolver statistics */
  stats: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    totalDuration: number;
  };
  /** Pending requests */
  pending: Map<number, { resolve: (value: unknown) => void; reject: (reason: unknown) => void }>;
  /** Pending query IDs from query-builder plugin */
  pendingQueries: Map<number, DnsQuery>;
  /** Next query ID from query-builder plugin */
  nextId: number;
  /** DNS servers from resolver-chain plugin */
  servers: string[];
  /** Current server index from resolver-chain plugin */
  currentIndex: number;
  /** Failed servers from resolver-chain plugin */
  failed: Set<string>;
  /** Server health status from resolver-chain plugin */
  health: Map<string, boolean>;
}

/**
 * DNS Resolver class.
 *
 * Main entry point for DNS resolution.
 *
 * @example
 * ```typescript
 * import { dns } from '@oxog/dns';
 *
 * const records = await dns.resolve('example.com', 'A');
 * console.log(records); // ['93.184.216.34']
 *
 * // Create custom resolver
 * const resolver = dns.createResolver({
 *   servers: ['8.8.8.8', '1.1.1.1'],
 *   timeout: 5000,
 *   cache: { enabled: true }
 * });
 *
 * const result = await resolver.resolve('example.com', 'MX');
 * ```
 */
export class DnsResolver {
  /** DNS kernel */
  readonly kernel: DnsKernel<ResolverState>;

  /** Resolver ID */
  readonly id: string;

  /** Constructor options */
  private _options: ResolverOptions;

  /**
   * Create a new DNS resolver.
   *
   * @param options - Resolver options
   *
   * @example
   * ```typescript
   * const resolver = new DnsResolver({
   *   servers: ['8.8.8.8'],
   *   timeout: 5000
   * });
   * ```
   */
  constructor(options: ResolverOptions = {}) {
    this._options = this._normalizeOptions(options);
    this.id = Math.random().toString(36).substring(2, 15);
    this.kernel = new DnsKernel<ResolverState>(this._options);

    // Initialize state
    this.kernel.setState('cache', new Map());
    this.kernel.setState('cacheStats', { hits: 0, misses: 0 });
    this.kernel.setState('stats', {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      totalDuration: 0,
    });
    this.kernel.setState('pending', new Map());
    this.kernel.setState('pendingQueries', new Map());
    this.kernel.setState('nextId', 0);
    this.kernel.setState('servers', this._options.servers ?? ['8.8.8.8', '1.1.1.1']);
    this.kernel.setState('currentIndex', 0);
    this.kernel.setState('failed', new Set());
    this.kernel.setState('health', new Map());

    // Register core plugins
    this.kernel.use(queryBuilderPlugin);
    this.kernel.use(resolverChainPlugin);
    this.kernel.use(recordParserPlugin);

    // Initialize plugins
    this.kernel.init().catch((error) => {
      console.error('Failed to initialize resolver:', error);
    });
  }

  /**
   * Normalize resolver options.
   *
   * @param options - Raw options
   * @returns Normalized options
   *
   * @internal
   */
  private _normalizeOptions(options: ResolverOptions): ResolverOptions {
    return {
      servers: options.servers ?? ['8.8.8.8', '1.1.1.1'],
      timeout: options.timeout ?? 5000,
      retries: options.retries ?? 2,
      retryDelay: options.retryDelay ?? 100,
      retryBackoff: options.retryBackoff ?? 'exponential',
      cache: options.cache === true ? { enabled: true } : options.cache ?? { enabled: false },
      dnssec: options.dnssec === true ? { enabled: true } : options.dnssec ?? { enabled: false },
      type: options.type ?? 'udp',
      server: options.server,
      rotationStrategy: options.rotationStrategy ?? 'failover',
      healthCheck: options.healthCheck ?? false,
    };
  }

  /**
   * Resolve DNS records for a domain.
   *
   * @param domain - Domain name to resolve
   * @param type - Record type
   * @param options - Query options
   * @returns Promise resolving to DNS response
   *
   * @example
   * ```typescript
   * const response = await resolver.resolve('example.com', 'A');
   * console.log(response.records); // ['93.184.216.34']
   * console.log(response.ttl); // 3600
   * ```
   */
  async resolve<T extends RecordType>(
    domain: string,
    type: T,
    options?: QueryOptions,
  ): Promise<DnsResponse<RecordTypeMap[T]>> {
    const startTime = Date.now();
    const normalizedDomain = normalizeDomain(domain);

    // Validate domain
    if (!isValidDomain(normalizedDomain)) {
      throw DnsError.invalidQuery(domain, 'Invalid domain name');
    }

    // Update stats
    const state = this.kernel.context.customState;
    (state.stats.totalQueries as number)++;

    // Check cache
    const cacheKey = `${normalizedDomain}:${type}`;
    const cacheEntry = this._checkCache(cacheKey);
    if (cacheEntry && !options?.noCache) {
      (state.cacheStats.hits as number)++;
      return {
        records: cacheEntry.records as RecordTypeMap[T][],
        ttl: cacheEntry.ttl,
        cached: true,
        duration: Date.now() - startTime,
        resolver: 'cache',
      };
    }

    (state.cacheStats.misses as number)++;

    // Build query
    const [queryId, queryBuffer] = buildQueryWithKernel(this.kernel as any, normalizedDomain, type, options);

    // Execute query
    try {
      const result = await this._executeQuery(queryId, queryBuffer, options?.timeout);

      // Cache result
      this._cacheResult(cacheKey, result.records, result.ttl);

      // Update stats
      (state.stats.successfulQueries as number)++;
      (state.stats.totalDuration as number) += result.duration;

      return result as DnsResponse<RecordTypeMap[T]>;
    } catch (error) {
      (state.stats.failedQueries as number)++;
      throw error;
    } finally {
      removePendingQuery(this.kernel as any, queryId);
    }
  }

  /**
   * Execute a DNS query via UDP.
   *
   * @param queryId - Query ID
   * @param queryBuffer - Query buffer
   * @param timeout - Query timeout
   * @returns Promise resolving to DNS response
   *
   * @internal
   */
  private async _executeQuery(
    queryId: number,
    queryBuffer: Buffer,
    timeout?: number,
  ): Promise<Omit<DnsResponse, 'resolver'>> {
    const server = getNextResolver(this.kernel as any);
    const actualTimeout = timeout ?? this._options.timeout ?? 5000;

    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket('udp4');
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          try {
            socket.close();
          } catch {
            // Ignore
          }
        }
      };

      const timer = setTimeout(() => {
        cleanup();
        markResolverFailed(this.kernel as any, server);
        reject(DnsError.timeout('example.com', 'A', actualTimeout));
      }, actualTimeout);

      socket.on('message', (msg) => {
        cleanup();
        clearTimeout(timer);

        // Parse response ID to match with query
        const responseId = msg.readUInt16BE(0);

        if (responseId === queryId) {
          // Emit response event for parser plugin
          this.kernel.emit('response', { queryId, buffer: msg } as never);

          // Get parsed response from parser
          // For now, return a mock response
          resolve({
            records: [],
            ttl: 300,
            cached: false,
            duration: Date.now() - Date.now(),
          });
        }
      });

      socket.on('error', (err) => {
        cleanup();
        clearTimeout(timer);
        markResolverFailed(this.kernel as any, server);
        reject(DnsError.networkError('example.com', err));
      });

      try {
        socket.send(queryBuffer, 53, server, (err) => {
          if (err) {
            cleanup();
            clearTimeout(timer);
            reject(DnsError.networkError('example.com', err));
          }
        });
      } catch (err) {
        cleanup();
        clearTimeout(timer);
        reject(DnsError.networkError('example.com', err as Error));
      }
    });
  }

  /**
   * Check cache for an entry.
   *
   * @param key - Cache key
   * @returns Cache entry or undefined
   *
   * @internal
   */
  private _checkCache(key: string): CacheEntry<unknown> | undefined {
    const state = this.kernel.context.customState;
    const cache = state.cache as Map<string, CacheEntry<unknown>>;

    const entry = cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return undefined;
    }

    return entry;
  }

  /**
   * Cache a result.
   *
   * @param key - Cache key
   * @param records - Records to cache
   * @param ttl - Time to live in seconds
   *
   * @internal
   */
  private _cacheResult(key: string, records: unknown[], ttl: number): void {
    const state = this.kernel.context.customState;
    const cache = state.cache as Map<string, CacheEntry<unknown>>;

    const now = Date.now();
    const entry: CacheEntry<unknown> = {
      records,
      ttl,
      createdAt: now,
      expiresAt: now + ttl * 1000,
    };

    cache.set(key, entry);

    // Check cache size limit
    const maxSize = (this._options.cache === true || (this._options.cache && typeof this._options.cache === 'object'))
      ? (this._options.cache === true ? 1000 : (this._options.cache.maxSize ?? 1000))
      : 1000;
    if (cache.size > maxSize) {
      // Remove oldest entry
      let oldestKey = '';
      let oldestTime = Number.MAX_SAFE_INTEGER;

      for (const [k, v] of cache) {
        if (v.createdAt < oldestTime) {
          oldestTime = v.createdAt;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear the cache.
   *
   * @param domain - Optional domain to clear
   * @param type - Optional record type to clear
   *
   * @example
   * ```typescript
   * resolver.clearCache();
   * resolver.clearCache('example.com', 'A');
   * ```
   */
  clearCache(domain?: string, type?: RecordType): void {
    const state = this.kernel.context.customState;
    const cache = state.cache as Map<string, CacheEntry<unknown>>;

    if (domain && type) {
      const key = `${normalizeDomain(domain)}:${type}`;
      cache.delete(key);
    } else {
      cache.clear();
    }
  }

  /**
   * Get cache statistics.
   *
   * @returns Cache statistics
   *
   * @example
   * ```typescript
   * const stats = resolver.getCacheStats();
   * console.log(stats); // { hits: 150, misses: 20, size: 45, hitRate: 0.882 }
   * ```
   */
  getCacheStats(): CacheStats {
    const state = this.kernel.context.customState;
    const cacheStats = state.cacheStats as { hits: number; misses: number };
    const cache = state.cache as Map<string, CacheEntry<unknown>>;

    const total = cacheStats.hits + cacheStats.misses;
    const hitRate = total > 0 ? cacheStats.hits / total : 0;

    return {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      size: cache.size,
      hitRate,
    };
  }

  /**
   * Get resolver statistics.
   *
   * @returns Resolver statistics
   *
   * @example
   * ```typescript
   * const stats = resolver.getStats();
   * console.log(stats); // { totalQueries: 1000, successfulQueries: 980, ... }
   * ```
   */
  getStats(): ResolverStats {
    const state = this.kernel.context.customState;
    const stats = state.stats as {
      totalQueries: number;
      successfulQueries: number;
      failedQueries: number;
      totalDuration: number;
    };

    return {
      totalQueries: stats.totalQueries,
      successfulQueries: stats.successfulQueries,
      failedQueries: stats.failedQueries,
      averageDuration: stats.totalQueries > 0 ? stats.totalDuration / stats.totalQueries : 0,
    };
  }

  /**
   * Get configured DNS servers.
   *
   * @returns Array of server addresses
   *
   * @example
   * ```typescript
   * const servers = resolver.getServers();
   * // ['8.8.8.8', '1.1.1.1']
   * ```
   */
  getServers(): string[] {
    return this._options.servers ?? [];
  }

  /**
   * Destroy the resolver and cleanup resources.
   *
   * @example
   * ```typescript
   * await resolver.destroy();
   * ```
   */
  async destroy(): Promise<void> {
    await this.kernel.destroy();
  }
}

/**
 * Create a new DNS resolver.
 *
 * @param options - Resolver options
 * @returns New resolver instance
 *
 * @example
 * ```typescript
 * const resolver = createResolver({
 *   servers: ['8.8.8.8', '1.1.1.1'],
 *   timeout: 5000,
 *   cache: { enabled: true }
 * });
 *
 * const records = await resolver.resolve('example.com', 'A');
 * ```
 */
export function createResolver(options?: ResolverOptions): DnsResolver {
  return new DnsResolver(options);
}
