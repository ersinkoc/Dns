/**
 * Basic DNSSEC Validation Example
 *
 * This example demonstrates DNSSEC validation for DNS responses.
 */

import { createResolver } from '@oxog/dns';

async function main() {
  // Create a resolver with DNSSEC enabled
  const resolver = createResolver({
    servers: ['8.8.8.8'],
    dnssec: {
      enabled: true,
      requireValid: false, // Don't reject invalid responses (for demo)
      trustAnchors: 'auto', // Use built-in root trust anchors
    },
  });

  console.log('Testing DNSSEC validation:\n');

  const domains = [
    'example.com',
    'google.com',
    'dnssec-failed.org', // Example of a domain with DNSSEC issues
  ];

  for (const domain of domains) {
    try {
      const result = await resolver.resolve(domain, 'A');
      console.log(`${domain}:`);
      console.log(`  Records:`, result.records);
      console.log(`  DNSSEC valid: ${result.dnssecValid ?? 'unknown'}`);
    } catch (error) {
      console.log(`${domain}:`);
      console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
    console.log();
  }

  await resolver.destroy();
}

main().catch(console.error);
