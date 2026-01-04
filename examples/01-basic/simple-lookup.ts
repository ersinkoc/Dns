/**
 * Simple DNS Lookup Example
 *
 * This example demonstrates basic DNS record lookup.
 */

import { dns } from '@oxog/dns';

async function main() {
  // A record lookup (IPv4 addresses)
  const ipv4 = await dns.resolve('example.com', 'A');
  console.log('A records:', ipv4);
  // Output: ['93.184.216.34']

  // AAAA record lookup (IPv6 addresses)
  const ipv6 = await dns.resolve('example.com', 'AAAA');
  console.log('AAAA records:', ipv6);
  // Output: ['2606:2800:220:1:248:1893:25c8:1946']

  // MX record lookup (mail servers)
  const mx = await dns.resolve('gmail.com', 'MX');
  console.log('MX records:', mx);
  // Output: [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }, ...]

  // TXT record lookup
  const txt = await dns.resolve('example.com', 'TXT');
  console.log('TXT records:', txt);
  // Output: ['v=spf1 -all', ...]

  // CNAME record lookup
  const cname = await dns.resolve('www.google.com', 'CNAME');
  console.log('CNAME records:', cname);
  // Output: ['www.google.com']

  // NS record lookup (nameservers)
  const ns = await dns.resolve('example.com', 'NS');
  console.log('NS records:', ns);
  // Output: ['a.iana-servers.net', 'b.iana-servers.net']
}

main().catch(console.error);
