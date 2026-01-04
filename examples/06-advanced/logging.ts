/**
 * Query Logging Example
 *
 * This example demonstrates logging DNS queries and responses.
 */

import { createResolver } from '@oxog/dns';

async function main() {
  const resolver = createResolver({
    servers: ['8.8.8.8'],
    timeout: 5000,
  });

  console.log('Logging DNS queries:\n');

  // Perform some queries
  const queries = [
    { domain: 'example.com', type: 'A' as const },
    { domain: 'google.com', type: 'AAAA' as const },
    { domain: 'github.com', type: 'MX' as const },
    { domain: 'stackoverflow.com', type: 'TXT' as const },
  ];

  for (const query of queries) {
    const start = Date.now();
    try {
      const result = await resolver.resolve(query.domain, query.type);
      const duration = Date.now() - start;

      console.log(`Query: ${query.domain} ${query.type}`);
      console.log(`  Records: ${JSON.stringify(result.records)}`);
      console.log(`  TTL: ${result.ttl}s`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Resolver: ${result.resolver}`);
      console.log();
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`Query: ${query.domain} ${query.type}`);
      console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.log(`  Duration: ${duration}ms`);
      console.log();
    }
  }

  // Log resolver stats
  const stats = resolver.getStats();
  console.log('=== Total Statistics ===');
  console.log(`Total queries: ${stats.totalQueries}`);
  console.log(`Successful: ${stats.successfulQueries}`);
  console.log(`Failed: ${stats.failedQueries}`);
  console.log(`Average duration: ${stats.averageDuration.toFixed(2)}ms`);

  await resolver.destroy();
}

main().catch(console.error);
