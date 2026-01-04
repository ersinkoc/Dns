/**
 * Metrics Collection Example
 *
 * This example demonstrates collecting DNS query metrics.
 */

import { createResolver } from '@oxog/dns';

async function main() {
  const resolver = createResolver({
    servers: ['8.8.8.8'],
    timeout: 5000,
  });

  console.log('Collecting DNS query metrics:\n');

  // Perform multiple queries
  const domains = [
    'example.com',
    'google.com',
    'github.com',
    'stackoverflow.com',
    'reddit.com',
    'twitter.com',
    'facebook.com',
    'amazon.com',
    'microsoft.com',
    'apple.com',
  ];

  const recordTypes: Array<'A' | 'AAAA' | 'MX' | 'TXT'> = ['A', 'AAAA', 'MX', 'TXT'];

  for (const domain of domains) {
    for (const type of recordTypes) {
      try {
        await resolver.resolve(domain, type);
      } catch {
        // Ignore errors for metrics collection
      }
    }
  }

  // Get resolver statistics
  const stats = resolver.getStats();
  console.log('=== Resolver Statistics ===');
  console.log('Total queries:', stats.totalQueries);
  console.log('Successful:', stats.successfulQueries);
  console.log('Failed:', stats.failedQueries);
  console.log('Success rate:', ((stats.successfulQueries / stats.totalQueries) * 100).toFixed(2) + '%');
  console.log('Average duration:', stats.averageDuration.toFixed(2), 'ms');

  // Get cache statistics (if enabled)
  const cacheStats = resolver.getCacheStats();
  console.log('\n=== Cache Statistics ===');
  console.log('Cache size:', cacheStats.size);
  console.log('Cache hits:', cacheStats.hits);
  console.log('Cache misses:', cacheStats.misses);
  console.log('Hit rate:', (cacheStats.hitRate * 100).toFixed(2) + '%');

  await resolver.destroy();
}

main().catch(console.error);
