/**
 * Retry Logic Example
 *
 * This example demonstrates automatic retry on failure.
 */

import { createResolver } from '@oxog/dns';

async function main() {
  // Create a resolver with retry enabled
  const resolver = createResolver({
    servers: ['8.8.8.8', '1.1.1.1'],
    timeout: 5000,
    retries: 3, // Retry up to 3 times on failure
    retryDelay: 100, // Initial delay: 100ms
    retryBackoff: 'exponential', // Exponential backoff: 100ms, 200ms, 400ms
  });

  console.log('Testing retry logic:\n');

  // This will automatically retry on failure
  const domains = ['example.com', 'google.com', 'github.com'];

  for (const domain of domains) {
    const start = Date.now();
    try {
      const result = await resolver.resolve(domain, 'A');
      const duration = Date.now() - start;
      console.log(`${domain}:`);
      console.log(`  Records: ${result.records.join(', ')}`);
      console.log(`  Duration: ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`${domain}:`);
      console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.log(`  Duration: ${duration}ms (includes retries)`);
    }
  }

  // Get resolver statistics
  const stats = resolver.getStats();
  console.log('\nResolver Statistics:');
  console.log('  Total queries:', stats.totalQueries);
  console.log('  Successful:', stats.successfulQueries);
  console.log('  Failed:', stats.failedQueries);
  console.log('  Average duration:', stats.averageDuration.toFixed(2), 'ms');

  await resolver.destroy();
}

main().catch(console.error);
