/**
 * Cache Plugin
 *
 * TTL-aware response caching with LRU eviction.
 *
 * @module
 */

import type { DnsPlugin, CacheOptions, QueryOptions } from '../../types.js';
import type { DnsKernelContext } from '../../kernel.js';
import { DnsKernel } from '../../kernel.js';

/**
 * Cache entry.
 *
 * @internal
 */
interface CacheEntry<T = unknown> {
  /** Cached value */
  value: T;
  /** Entry creation timestamp */
  createdAt: number;
  /** Entry expiration timestamp */
  expiresAt: number;
}

/**
 * Cache plugin state.
 *
 * @internal
 */
interface CachePluginState {
  /** Cache storage */
  cache: Map<string, CacheEntry>;
  /** Access order for LRU */
  accessOrder: string[];
  /** Maximum cache size */
  maxSize: number;
  /** Minimum TTL in seconds */
  minTtl: number;
  /** Maximum TTL in seconds */
  maxTtl: number;
  /** Respect DNS TTL */
  respectTtl: boolean;
  /** Cache statistics */
  stats: {
    hits: number;
    misses: number;
    evictions: number;
  };
}

/**
 * Default cache options.
 *
 * @internal
 */
const DEFAULT_OPTIONS: Required<CacheOptions> = {
  enabled: true,
  maxSize: 1000,
  respectTtl: true,
  minTtl: 60,
  maxTtl: 86400,
};

/**
 * Cache plugin.
 *
 * Provides intelligent caching with TTL-aware expiration.
 *
 * @example
 * ```typescript
 * import { cachePlugin } from '@oxog/dns/plugins';
 *
 * kernel.use(cachePlugin);
 * ```
 */
export const cachePlugin: DnsPlugin<CachePluginState & DnsKernelContext> = {
  name: 'cache',
  version: '1.0.0',

  install(kernel) {
    const options = kernel.context.options.cache as CacheOptions | boolean | undefined;

    if (!options || (typeof options === 'object' && !options.enabled)) {
      return; // Cache disabled
    }

    const opts = typeof options === 'boolean' ? DEFAULT_OPTIONS : { ...DEFAULT_OPTIONS, ...options };

    // Initialize state
    kernel.setState('cache', new Map());
    kernel.setState('accessOrder', []);
    kernel.setState('maxSize', opts.maxSize);
    kernel.setState('minTtl', opts.minTtl);
    kernel.setState('maxTtl', opts.maxTtl);
    kernel.setState('respectTtl', opts.respectTtl);
    kernel.setState('stats', { hits: 0, misses: 0, evictions: 0 });

    // Listen for query events to check cache
    kernel.on('query', async (data: { query: { name: string; type: string; options?: QueryOptions } }) => {
      const { query } = data;

      // Skip cache if requested
      if (query.options?.noCache) {
        await kernel.emit('cache-miss', { key: `${query.name}:${query.type}` });
        return;
      }

      const cache = kernel.getState('cache');
      if (!cache) return;

      const key = `${query.name}:${query.type}`;
      const entry = cache.get(key);

      if (!entry) {
        await kernel.emit('cache-miss', { key });
        return;
      }

      // Check expiration
      if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        await kernel.emit('cache-miss', { key });
        return;
      }

      // Update access order
      const accessOrder = kernel.getState('accessOrder') as string[];
      const index = accessOrder.indexOf(key);
      if (index > -1) {
        accessOrder.splice(index, 1);
      }
      accessOrder.push(key);

      // Update stats
      const stats = kernel.getState('stats') as { hits: number; misses: number; evictions: number };
      stats.hits++;

      await kernel.emit('cache-hit', { key, value: entry.value });
    });

    // Listen for parsed response events to cache results
    kernel.on(
      'parsed-response',
      async (data: { query: { name: string; type: string }; records: unknown[]; ttl: number }) => {
        const cache = kernel.getState('cache');
        if (!cache) return;

        const key = `${data.query.name}:${data.query.type}`;
        const respectTtl = kernel.getState('respectTtl') as boolean;
        const minTtl = kernel.getState('minTtl') as number;
        const maxTtl = kernel.getState('maxTtl') as number;
        const maxSize = kernel.getState('maxSize') as number;

        // Calculate TTL
        let ttl = data.ttl;
        if (respectTtl) {
          ttl = Math.max(minTtl, Math.min(maxTtl, ttl));
        } else {
          ttl = maxTtl;
        }

        // Create cache entry
        const entry: CacheEntry = {
          value: data.records,
          createdAt: Date.now(),
          expiresAt: Date.now() + ttl * 1000,
        };

        // Check cache size
        if (cache.size >= maxSize && !cache.has(key)) {
          // Evict least recently used
          const accessOrder = kernel.getState('accessOrder') as string[];
          const lruKey = accessOrder.shift();
          if (lruKey) {
            cache.delete(lruKey);
            const stats = kernel.getState('stats') as { hits: number; misses: number; evictions: number };
            stats.evictions++;
          }
        }

        // Store entry
        cache.set(key, entry);

        // Update access order
        const accessOrder = kernel.getState('accessOrder') as string[];
        const index = accessOrder.indexOf(key);
        if (index > -1) {
          accessOrder.splice(index, 1);
        }
        accessOrder.push(key);

        // Update stats
        const stats = kernel.getState('stats') as { hits: number; misses: number; evictions: number };
        stats.misses++;
      },
    );
  },

  onDestroy() {
    // Cleanup handled by kernel
  },
};

/**
 * Get a value from the cache.
 *
 * @param kernel - DNS kernel
 * @param key - Cache key
 * @returns Cached value or undefined
 *
 * @example
 * ```typescript
 * const value = cacheGet(kernel, 'example.com:A');
 * ```
 */
export function cacheGet<T = unknown>(
  kernel: DnsKernel<CachePluginState & DnsKernelContext>,
  key: string,
): T | undefined {
  const cache = kernel.getState('cache');
  if (!cache) return undefined;

  const entry = cache.get(key);
  if (!entry) return undefined;

  // Check expiration
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  return entry.value as T;
}

/**
 * Set a value in the cache.
 *
 * @param kernel - DNS kernel
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds
 *
 * @example
 * ```typescript
 * cacheSet(kernel, 'example.com:A', records, 3600);
 * ```
 */
export function cacheSet(
  kernel: DnsKernel<CachePluginState & DnsKernelContext>,
  key: string,
  value: unknown,
  ttl: number,
): void {
  const cache = kernel.getState('cache');
  if (!cache) return;

  const maxTtl = kernel.getState('maxTtl') as number;
  const entry: CacheEntry = {
    value,
    createdAt: Date.now(),
    expiresAt: Date.now() + Math.min(ttl, maxTtl) * 1000,
  };

  cache.set(key, entry);

  // Update access order
  const accessOrder = kernel.getState('accessOrder') as string[];
  const index = accessOrder.indexOf(key);
  if (index > -1) {
    accessOrder.splice(index, 1);
  }
  accessOrder.push(key);
}

/**
 * Delete a value from the cache.
 *
 * @param kernel - DNS kernel
 * @param key - Cache key
 * @returns True if value was deleted
 *
 * @example
 * ```typescript
 * cacheDelete(kernel, 'example.com:A');
 * ```
 */
export function cacheDelete(
  kernel: DnsKernel<CachePluginState & DnsKernelContext>,
  key: string,
): boolean {
  const cache = kernel.getState('cache');
  if (!cache) return false;

  const deleted = cache.delete(key);

  // Update access order
  const accessOrder = kernel.getState('accessOrder') as string[];
  const index = accessOrder.indexOf(key);
  if (index > -1) {
    accessOrder.splice(index, 1);
  }

  return deleted;
}

/**
 * Clear all cache entries.
 *
 * @param kernel - DNS kernel
 *
 * @example
 * ```typescript
 * cacheClear(kernel);
 * ```
 */
export function cacheClear(kernel: DnsKernel<CachePluginState & DnsKernelContext>): void {
  const cache = kernel.getState('cache');
  if (!cache) return;

  cache.clear();
  kernel.setState('accessOrder', []);
}

/**
 * Get cache statistics.
 *
 * @param kernel - DNS kernel
 * @returns Cache statistics
 *
 * @example
 * ```typescript
 * const stats = cacheGetStats(kernel);
 * console.log(stats); // { hits: 100, misses: 20, evictions: 5, size: 75 }
 * ```
 */
export function cacheGetStats(kernel: DnsKernel<CachePluginState & DnsKernelContext>): {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
} {
  const cache = kernel.getState('cache');
  const stats = kernel.getState('stats');

  return {
    hits: stats?.hits ?? 0,
    misses: stats?.misses ?? 0,
    evictions: stats?.evictions ?? 0,
    size: cache?.size ?? 0,
  };
}

/**
 * Clean expired entries from the cache.
 *
 * @param kernel - DNS kernel
 * @returns Number of entries cleaned
 *
 * @example
 * ```typescript
 * const cleaned = cacheClean(kernel);
 * console.log(`Cleaned ${cleaned} expired entries`);
 * ```
 */
export function cacheClean(kernel: DnsKernel<CachePluginState & DnsKernelContext>): number {
  const cache = kernel.getState('cache');
  if (!cache) return 0;

  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleaned++;

      // Update access order
      const accessOrder = kernel.getState('accessOrder') as string[];
      const index = accessOrder.indexOf(key);
      if (index > -1) {
        accessOrder.splice(index, 1);
      }
    }
  }

  return cleaned;
}
