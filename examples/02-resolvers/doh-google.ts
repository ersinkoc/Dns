/**
 * DNS-over-HTTPS with Google Example
 *
 * This example demonstrates using Google's Public DNS over HTTPS.
 */

import { createResolver } from '@oxog/dns';

async function main() {
  // Create a resolver using Google's DoH service
  const resolver = createResolver({
    type: 'doh',
    server: 'https://dns.google/dns-query',
    timeout: 5000,
  });

  console.log('Querying via Google Public DNS over HTTPS:\n');

  const domains = [
    'example.com',
    'google.com',
    'github.com',
  ];

  for (const domain of domains) {
    try {
      const result = await resolver.resolve(domain, 'A');
      console.log(`${domain}:`);
      result.records.forEach((ip) => console.log(`  - ${ip}`));
      console.log(`  TTL: ${result.ttl}s`);
      console.log(`  Duration: ${result.duration}ms\n`);
    } catch (error) {
      console.error(`  Error resolving ${domain}:`, error);
    }
  }

  await resolver.destroy();
}

main().catch(console.error);
