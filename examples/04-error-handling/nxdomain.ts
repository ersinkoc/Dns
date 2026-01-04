/**
 * NXDOMAIN Handling Example
 *
 * This example shows how to handle non-existent domains.
 */

import { dns, DnsError, DnsErrorCode } from '@oxog/dns';

async function main() {
  console.log('Testing NXDOMAIN handling:\n');

  // Try to resolve a non-existent domain
  const nonExistentDomain = 'this-domain-definitely-does-not-exist-12345.com';

  try {
    const result = await dns.resolve(nonExistentDomain, 'A');
    console.log('Success:', result.records);
  } catch (error) {
    if (error instanceof DnsError) {
      if (error.code === DnsErrorCode.NXDOMAIN) {
        console.log('NXDOMAIN Error:');
        console.log('  Message:', error.message);
        console.log('  Domain:', error.domain);
        console.log('\nThis domain does not exist.');
      } else {
        console.error('Other DNS error:', error.message);
        console.error('  Code:', error.code);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }

  // Check multiple domains
  console.log('\nChecking multiple domains:');

  const domains = [
    'example.com', // exists
    'nonexistent-test-12345.com', // doesn't exist
    'google.com', // exists
  ];

  for (const domain of domains) {
    try {
      await dns.resolve(domain, 'A');
      console.log(`  ${domain}: EXISTS`);
    } catch (error) {
      if (error instanceof DnsError && error.code === DnsErrorCode.NXDOMAIN) {
        console.log(`  ${domain}: DOES NOT EXIST`);
      } else {
        console.log(`  ${domain}: ERROR (${error instanceof Error ? error.message : 'unknown'})`);
      }
    }
  }
}

main().catch(console.error);
