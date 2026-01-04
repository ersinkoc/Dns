/**
 * Cache plugin tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DnsKernel } from '../../src/kernel.js';
import { cachePlugin, cacheGet, cacheSet, cacheDelete, cacheClear, cacheGetStats, cacheClean } from '../../src/plugins/optional/cache.js';

describe('Cache Plugin', () => {
  it('should install cache plugin', () => {
    const kernel = new DnsKernel({ cache: true });
    expect(() => kernel.use(cachePlugin)).not.toThrow();
  });

  it('should have plugin name and version', () => {
    expect(cachePlugin.name).toBe('cache');
    expect(cachePlugin.version).toBe('1.0.0');
  });

  it('should initialize with default values', () => {
    const kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);

    expect(kernel.getState('maxSize')).toBe(1000);
    expect(kernel.getState('minTtl')).toBe(60);
    expect(kernel.getState('maxTtl')).toBe(86400);
    expect(kernel.getState('respectTtl')).toBe(true);
    expect(kernel.getState('stats')).toEqual({ hits: 0, misses: 0, evictions: 0 });
  });

  it('should initialize with custom options', () => {
    const customKernel = new DnsKernel({
      cache: {
        enabled: true,
        maxSize: 500,
        respectTtl: false,
        minTtl: 30,
        maxTtl: 3600,
      },
    });
    customKernel.use(cachePlugin);

    expect(customKernel.getState('maxSize')).toBe(500);
    expect(customKernel.getState('minTtl')).toBe(30);
    expect(customKernel.getState('maxTtl')).toBe(3600);
    expect(customKernel.getState('respectTtl')).toBe(false);
  });

  it('should not initialize when disabled', () => {
    const customKernel = new DnsKernel({
      cache: { enabled: false },
    });
    customKernel.use(cachePlugin);

    expect(customKernel.getState('cache')).toBeUndefined();
  });

  it('should initialize with boolean cache option', () => {
    const customKernel = new DnsKernel({
      cache: true,
    });
    customKernel.use(cachePlugin);

    expect(customKernel.getState('maxSize')).toBe(1000);
  });
});

describe('Cache Get/Set Operations', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);
  });

  it('should set and get values', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 3600);

    const result = cacheGet(kernel, 'example.com:A');
    expect(result).toEqual(records);
  });

  it('should return undefined for non-existent keys', () => {
    const result = cacheGet(kernel, 'nonexistent:key');
    expect(result).toBeUndefined();
  });

  it('should return undefined for expired entries', async () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 0);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = cacheGet(kernel, 'example.com:A');
    expect(result).toBeUndefined();
  });

  it('should respect TTL when getting values', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 1);

    const result1 = cacheGet(kernel, 'example.com:A');
    expect(result1).toEqual(records);

    // Wait for expiration
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result2 = cacheGet(kernel, 'example.com:A');
        expect(result2).toBeUndefined();
        resolve();
      }, 1100);
    });
  });

  it('should cap TTL at maxTtl', () => {
    kernel.setState('maxTtl', 100);
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 1000);

    const cache = kernel.getState('cache') as Map<string, any>;
    const entry = cache!.get('example.com:A');

    // TTL should be capped at 100 seconds
    const expectedExpiresAt = Date.now() + 100 * 1000;
    expect(entry!.expiresAt).toBeLessThanOrEqual(expectedExpiresAt + 100);
  });
});

describe('Cache Delete Operations', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);
  });

  it('should delete existing entries', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 3600);

    const deleted = cacheDelete(kernel, 'example.com:A');
    expect(deleted).toBe(true);

    const result = cacheGet(kernel, 'example.com:A');
    expect(result).toBeUndefined();
  });

  it('should return false for non-existent entries', () => {
    const deleted = cacheDelete(kernel, 'nonexistent:key');
    expect(deleted).toBe(false);
  });

  it('should update access order on delete', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 3600);
    cacheSet(kernel, 'google.com:A', records, 3600);

    cacheDelete(kernel, 'example.com:A');

    const accessOrder = kernel.getState('accessOrder');
    expect(accessOrder).not.toContain('example.com:A');
    expect(accessOrder).toContain('google.com:A');
  });
});

describe('Cache Clear Operations', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);
  });

  it('should clear all entries', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 3600);
    cacheSet(kernel, 'google.com:A', records, 3600);
    cacheSet(kernel, 'test.com:A', records, 3600);

    cacheClear(kernel);

    const cache = kernel.getState('cache');
    expect(cache!.size).toBe(0);
    expect(cacheGet(kernel, 'example.com:A')).toBeUndefined();
  });

  it('should reset access order on clear', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 3600);

    cacheClear(kernel);

    const accessOrder = kernel.getState('accessOrder');
    expect(accessOrder).toEqual([]);
  });
});

describe('Cache Statistics', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);
  });

  it('should return initial stats', () => {
    const stats = cacheGetStats(kernel);

    expect(stats).toEqual({
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
    });
  });

  it('should track cache size', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 3600);
    cacheSet(kernel, 'google.com:A', records, 3600);

    const stats = cacheGetStats(kernel);
    expect(stats.size).toBe(2);
  });

  it('should return stats when cache is not initialized', () => {
    const noCacheKernel = new DnsKernel({ cache: false });
    noCacheKernel.use(cachePlugin);

    const stats = cacheGetStats(noCacheKernel);
    expect(stats).toEqual({
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
    });
  });
});

describe('Cache Clean Operations', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);
  });

  it('should clean expired entries', async () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 0);
    cacheSet(kernel, 'google.com:A', records, 3600);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10));

    const cleaned = cacheClean(kernel);

    expect(cleaned).toBeGreaterThan(0);
    expect(cacheGet(kernel, 'example.com:A')).toBeUndefined();
    expect(cacheGet(kernel, 'google.com:A')).toBeDefined();
  });

  it('should return 0 when no entries are expired', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 3600);

    const cleaned = cacheClean(kernel);
    expect(cleaned).toBe(0);
  });

  it('should return 0 when cache is not initialized', () => {
    const noCacheKernel = new DnsKernel({ cache: false });
    noCacheKernel.use(cachePlugin);

    const cleaned = cacheClean(noCacheKernel);
    expect(cleaned).toBe(0);
  });

  it('should update access order when cleaning', async () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 0);
    cacheSet(kernel, 'google.com:A', records, 3600);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10));

    cacheClean(kernel);

    const accessOrder = kernel.getState('accessOrder');
    expect(accessOrder).not.toContain('example.com:A');
  });
});

describe('Cache Event Handlers', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ cache: { enabled: true, maxSize: 2 } });
  });

  it('should handle query events', async () => {
    kernel.use(cachePlugin);
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 3600);

    const cacheHitHandler = vi.fn();
    kernel.on('cache-hit', cacheHitHandler);

    await kernel.emit('query', {
      query: { name: 'example.com', type: 'A' },
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(cacheHitHandler).toHaveBeenCalled();
  });

  it('should emit cache-miss on query', async () => {
    kernel.use(cachePlugin);

    const cacheMissHandler = vi.fn();
    kernel.on('cache-miss', cacheMissHandler);

    await kernel.emit('query', {
      query: { name: 'nonexistent.com', type: 'A' },
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(cacheMissHandler).toHaveBeenCalled();
  });

  it('should skip cache when noCache option is set', async () => {
    kernel.use(cachePlugin);
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 3600);

    const cacheHitHandler = vi.fn();
    const cacheMissHandler = vi.fn();
    kernel.on('cache-hit', cacheHitHandler);
    kernel.on('cache-miss', cacheMissHandler);

    await kernel.emit('query', {
      query: { name: 'example.com', type: 'A', options: { noCache: true } },
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(cacheHitHandler).not.toHaveBeenCalled();
    expect(cacheMissHandler).toHaveBeenCalled();
  });

  it('should cache parsed responses', async () => {
    kernel.use(cachePlugin);

    const records = [{ type: 'A', data: '1.2.3.4' }];
    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    const cached = cacheGet(kernel, 'example.com:A');
    expect(cached).toEqual(records);
  });

  it('should respect TTL when caching responses', async () => {
    kernel.use(cachePlugin);
    kernel.setState('respectTtl', true);
    kernel.setState('minTtl', 60);
    kernel.setState('maxTtl', 3600);

    const records = [{ type: 'A', data: '1.2.3.4' }];
    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      records,
      ttl: 30, // Below minTtl
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    const cache = kernel.getState('cache');
    const entry = cache!.get('example.com:A');

    // TTL should be clamped to minTtl
    const expectedExpiresAt = Date.now() + 60 * 1000;
    expect(entry!.expiresAt).toBeGreaterThanOrEqual(expectedExpiresAt - 100);
    expect(entry!.expiresAt).toBeLessThanOrEqual(expectedExpiresAt + 100);
  });
});

describe('Cache LRU Eviction', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ cache: { enabled: true, maxSize: 2 } });
  });

  it('should evict least recently used entry when cache is full', async () => {
    kernel.use(cachePlugin);

    const records = [{ type: 'A', data: '1.2.3.4' }];

    // Fill cache to max size
    await kernel.emit('parsed-response', {
      query: { name: 'first.com', type: 'A' },
      records,
      ttl: 3600,
    });

    await kernel.emit('parsed-response', {
      query: { name: 'second.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Add third entry, should evict first
    await kernel.emit('parsed-response', {
      query: { name: 'third.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(cacheGet(kernel, 'first.com:A')).toBeUndefined();
    expect(cacheGet(kernel, 'second.com:A')).toBeDefined();
    expect(cacheGet(kernel, 'third.com:A')).toBeDefined();
  });

  it('should update access order on cache hit', async () => {
    kernel.use(cachePlugin);

    const records = [{ type: 'A', data: '1.2.3.4' }];

    await kernel.emit('parsed-response', {
      query: { name: 'first.com', type: 'A' },
      records,
      ttl: 3600,
    });

    await kernel.emit('parsed-response', {
      query: { name: 'second.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Access first entry to make it more recent
    await kernel.emit('query', {
      query: { name: 'first.com', type: 'A' },
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Add third entry, should evict second (not first)
    await kernel.emit('parsed-response', {
      query: { name: 'third.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(cacheGet(kernel, 'first.com:A')).toBeDefined();
    expect(cacheGet(kernel, 'second.com:A')).toBeUndefined();
    expect(cacheGet(kernel, 'third.com:A')).toBeDefined();
  });

  it('should track eviction count', async () => {
    kernel.use(cachePlugin);

    const records = [{ type: 'A', data: '1.2.3.4' }];

    await kernel.emit('parsed-response', {
      query: { name: 'first.com', type: 'A' },
      records,
      ttl: 3600,
    });

    await kernel.emit('parsed-response', {
      query: { name: 'second.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Add third entry to trigger eviction
    await kernel.emit('parsed-response', {
      query: { name: 'third.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    const stats = cacheGetStats(kernel);
    expect(stats.evictions).toBe(1);
  });
});

describe('Cache Access Order Management', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);
  });

  it('should maintain access order', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'first.com:A', records, 3600);
    cacheSet(kernel, 'second.com:A', records, 3600);
    cacheSet(kernel, 'third.com:A', records, 3600);

    const accessOrder = kernel.getState('accessOrder');
    expect(accessOrder).toEqual(['first.com:A', 'second.com:A', 'third.com:A']);
  });

  it('should update access order on set', () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'first.com:A', records, 3600);
    cacheSet(kernel, 'second.com:A', records, 3600);
    cacheSet(kernel, 'first.com:A', records, 3600);

    const accessOrder = kernel.getState('accessOrder');
    expect(accessOrder).toEqual(['second.com:A', 'first.com:A']);
  });

  it('should update access order on get', async () => {
    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'first.com:A', records, 3600);
    cacheSet(kernel, 'second.com:A', records, 3600);

    await kernel.emit('query', {
      query: { name: 'first.com', type: 'A' },
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    const accessOrder = kernel.getState('accessOrder');
    expect(accessOrder).toEqual(['second.com:A', 'first.com:A']);
  });
});

describe('Cache onDestroy', () => {
  it('should call onDestroy without error', () => {
    const kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);

    expect(() => {
      cachePlugin.onDestroy?.();
    }).not.toThrow();
  });

  it('should handle onDestroy when cleanup is handled by kernel', () => {
    const kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);

    // onDestroy should be callable and do nothing
    if (cachePlugin.onDestroy) {
      cachePlugin.onDestroy();
    }
  });
});

describe('Cache respectTtl false behavior', () => {
  it('should use maxTtl when respectTtl is false', async () => {
    const kernel = new DnsKernel({
      cache: { enabled: true, maxTtl: 1000, respectTtl: false },
    });
    kernel.use(cachePlugin);

    const records = [{ type: 'A', data: '1.2.3.4' }];
    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      records,
      ttl: 100, // This should be ignored when respectTtl is false
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    const cache = kernel.getState('cache') as Map<string, any>;
    const entry = cache!.get('example.com:A');

    // TTL should be maxTtl (1000 seconds) when respectTtl is false
    const expectedExpiresAt = Date.now() + 1000 * 1000;
    expect(entry!.expiresAt).toBeGreaterThanOrEqual(expectedExpiresAt - 200);
  });
});

describe('Cache update existing entry', () => {
  it('should update access order when updating existing cache entry', async () => {
    const kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);

    const records = [{ type: 'A', data: '1.2.3.4' }];

    // Add first entry
    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Add second entry
    await kernel.emit('parsed-response', {
      query: { name: 'other.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify initial order
    let accessOrder = kernel.getState('accessOrder');
    expect(accessOrder).toEqual(['example.com:A', 'other.com:A']);

    // Update first entry - should move to end of access order
    const updatedRecords = [{ type: 'A', data: '2.2.2.2' }];
    await kernel.emit('parsed-response', {
      query: { name: 'example.com', type: 'A' },
      records: updatedRecords,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Access order should have example.com:A at the end now
    accessOrder = kernel.getState('accessOrder');
    expect(accessOrder).toEqual(['other.com:A', 'example.com:A']);
  });
});

describe('Cache expired entry on query', () => {
  it('should handle expired entry during query', async () => {
    const kernel = new DnsKernel({ cache: true });
    kernel.use(cachePlugin);

    // Manually insert an expired entry into the cache
    const cache = kernel.getState('cache') as Map<string, { records: unknown[]; expiresAt: number }>;
    cache.set('expired.com:A', {
      records: [{ type: 'A', data: '1.2.3.4' }],
      expiresAt: Date.now() - 1000, // Already expired
    });

    // Add to access order
    const accessOrder = kernel.getState('accessOrder') as string[];
    accessOrder.push('expired.com:A');

    const cacheMissHandler = vi.fn();
    kernel.on('cache-miss', cacheMissHandler);

    // Query for the expired entry - should trigger cache miss
    await kernel.emit('query', {
      query: { name: 'expired.com', type: 'A' },
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should have emitted cache-miss
    expect(cacheMissHandler).toHaveBeenCalled();

    // Entry should be deleted from cache
    expect(cache.has('expired.com:A')).toBe(false);
  });
});

describe('Cache Edge Cases', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ cache: true });
  });

  it('should handle empty cache operations', () => {
    kernel.use(cachePlugin);

    expect(cacheGet(kernel, 'key')).toBeUndefined();
    expect(cacheDelete(kernel, 'key')).toBe(false);
    expect(cacheClean(kernel)).toBe(0);

    cacheClear(kernel);
    const stats = cacheGetStats(kernel);
    expect(stats.size).toBe(0);
  });

  it('should handle very large cache size', () => {
    kernel = new DnsKernel({ cache: { enabled: true, maxSize: 1000000 } });
    kernel.use(cachePlugin);

    expect(kernel.getState('maxSize')).toBe(1000000);
  });

  it('should handle very small cache size', async () => {
    kernel = new DnsKernel({ cache: { enabled: true, maxSize: 1 } });
    kernel.use(cachePlugin);

    const records = [{ type: 'A', data: '1.2.3.4' }];

    await kernel.emit('parsed-response', {
      query: { name: 'first.com', type: 'A' },
      records,
      ttl: 3600,
    });

    await kernel.emit('parsed-response', {
      query: { name: 'second.com', type: 'A' },
      records,
      ttl: 3600,
    });

    // Wait for async handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(cacheGet(kernel, 'first.com:A')).toBeUndefined();
    expect(cacheGet(kernel, 'second.com:A')).toBeDefined();
  });

  it('should handle TTL boundaries', () => {
    kernel.use(cachePlugin);
    kernel.setState('maxTtl', 100);

    const records = [{ type: 'A', data: '1.2.3.4' }];
    cacheSet(kernel, 'example.com:A', records, 5);

    const cache = kernel.getState('cache') as Map<string, any>;
    const entry = cache!.get('example.com:A');

    // TTL should be capped at maxTtl (100 seconds)
    const expectedExpiresAt = Date.now() + 5 * 1000; // 5 seconds from the cacheSet call
    expect(entry!.expiresAt).toBeGreaterThanOrEqual(expectedExpiresAt - 100);
    expect(entry!.expiresAt).toBeLessThanOrEqual(expectedExpiresAt + 100);
  });
});
