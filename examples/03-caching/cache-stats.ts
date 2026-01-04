/**
 * Cache Statistics Example
 *
 * This example shows how to monitor cache performance.
 */

import { createResolver } from '@oxog/dns';

async function main() {
  const resolver = createResolver({
    servers: ['8.8.8.8'],
    cache: { enabled: true, maxSize: 100 },
  });

  const domains = [
    'example.com',
    'google.com',
    'github.com',
    'stackoverflow.com',
    'reddit.com',
  ];

  // First pass - populate cache
  console.log('=== First pass (populating cache) ===\n');
  for (const domain of domains) {
    await resolver.resolve(domain, 'A');
  }

  // Get initial stats
  let stats = resolver.getCacheStats();
  console.log('After first pass:');
  console.log('  Cache size:', stats.size);
  console.log('  Hits:', stats.hits);
  console.log('  Misses:', stats.misses);
  console.log('  Hit rate:', (stats.hitRate * 100).toFixed(2) + '%\n');

  // Second pass - hit cache
  console.log('=== Second pass (hitting cache) ===\n');
  for (const domain of domains) {
    await resolver.resolve(domain, 'A');
  }

  // Get final stats
  stats = resolver.getCacheStats();
  console.log('After second pass:');
  console.log('  Cache size:', stats.size);
  console.log('  Hits:', stats.hits);
  console.log('  Misses:', stats.misses);
  console.log('  Hit rate:', (stats.hitRate * 100).toFixed(2) + '%');

  await resolver.destroy();
}

main().catch(console.error);
