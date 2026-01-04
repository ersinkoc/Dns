/**
 * Reverse DNS Lookup Example
 *
 * This example demonstrates reverse DNS lookups from IP address to hostname.
 */

import { dns } from '@oxog/dns';

async function main() {
  // IPv4 reverse lookup
  console.log('IPv4 Reverse Lookup:');
  const hostname4 = await dns.reverse('8.8.8.8');
  console.log('  8.8.8.8 ->', hostname4);
  // Output: dns.google

  // IPv6 reverse lookup
  console.log('\nIPv6 Reverse Lookup:');
  const hostname6 = await dns.reverse('2001:4860:4860::8888');
  console.log('  2001:4860:4860::8888 ->', hostname6);
  // Output: dns.google

  // Get all PTR records for an IP
  console.log('\nAll PTR Records:');
  const ptrs = await dns.reverseAll('8.8.8.8');
  ptrs.forEach((ptr) => console.log(`  ${ptr}`));
  // Output: dns.google
}

main().catch(console.error);
