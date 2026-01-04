/**
 * Custom DNS Resolver Example
 *
 * This example shows how to create a custom DNS resolver
 * with specific configuration options.
 */

import { dns, type ResolverOptions } from '@oxog/dns';

async function main() {
  // Create a custom resolver with specific options
  const options: ResolverOptions = {
    servers: ['8.8.8.8', '1.1.1.1'], // Use Google and Cloudflare DNS
    timeout: 3000, // 3 second timeout
    retries: 3, // Retry up to 3 times
    retryDelay: 100, // Wait 100ms between retries
    retryBackoff: 'exponential', // Use exponential backoff
  };

  const resolver = dns.createResolver(options);

  // Use the custom resolver
  console.log('Querying with custom resolver:');
  const result = await resolver.resolve('example.com', 'A');
  console.log('Results:', result.records);
  console.log('From:', result.resolver);
  console.log('TTL:', result.ttl);
  console.log('Duration:', result.duration, 'ms');

  // Get resolver statistics
  const stats = resolver.getStats();
  console.log('\nResolver Statistics:');
  console.log('  Total queries:', stats.totalQueries);
  console.log('  Successful:', stats.successfulQueries);
  console.log('  Failed:', stats.failedQueries);
  console.log('  Average duration:', stats.averageDuration.toFixed(2), 'ms');

  // Clean up
  await resolver.destroy();
}

main().catch(console.error);
