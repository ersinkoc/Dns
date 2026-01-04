/**
 * Basic Caching Example
 *
 * This example demonstrates enabling and using DNS response caching.
 */

import { createResolver } from '@oxog/dns';

async function main() {
  // Create a resolver with caching enabled
  const resolver = createResolver({
    servers: ['8.8.8.8'],
    cache: {
      enabled: true,
      maxSize: 1000, // Maximum 1000 cached entries
      respectTtl: true, // Honor DNS TTL values
      minTtl: 60, // Minimum TTL: 60 seconds
      maxTtl: 86400, // Maximum TTL: 24 hours
    },
  });

  const domain = 'example.com';

  // First query - cache miss
  console.log('First query (cache miss):');
  const start1 = Date.now();
  const result1 = await resolver.resolve(domain, 'A');
  const duration1 = Date.now() - start1;

  console.log('  Records:', result1.records);
  console.log('  Duration:', duration1, 'ms');
  console.log('  From cache:', result1.cached);

  // Second query - cache hit (much faster!)
  console.log('\nSecond query (cache hit):');
  const start2 = Date.now();
  const result2 = await resolver.resolve(domain, 'A');
  const duration2 = Date.now() - start2;

  console.log('  Records:', result2.records);
  console.log('  Duration:', duration2, 'ms');
  console.log('  From cache:', result2.cached);

  // Get cache statistics
  const cacheStats = resolver.getCacheStats();
  console.log('\nCache Statistics:');
  console.log('  Total entries:', cacheStats.size);
  console.log('  Cache hits:', cacheStats.hits);
  console.log('  Cache misses:', cacheStats.misses);
  console.log('  Hit rate:', (cacheStats.hitRate * 100).toFixed(2) + '%');

  await resolver.destroy();
}

main().catch(console.error);
