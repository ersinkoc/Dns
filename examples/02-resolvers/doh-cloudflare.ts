/**
 * DNS-over-HTTPS with Cloudflare Example
 *
 * This example demonstrates using Cloudflare's DoH service
 * for secure, private DNS resolution.
 */

import { createResolver } from '@oxog/dns';

async function main() {
  // Create a resolver using Cloudflare's DoH service
  const resolver = createResolver({
    type: 'doh',
    server: 'https://1.1.1.1/dns-query',
    timeout: 5000,
  });

  console.log('Querying via Cloudflare DoH:');

  // A record lookup
  const aResult = await resolver.resolve('example.com', 'A');
  console.log('A records:', aResult.records);

  // MX record lookup
  const mxResult = await resolver.resolve('gmail.com', 'MX');
  console.log('\nMX records:');
  mxResult.records.forEach((mx) => {
    console.log(`  ${mx.priority} - ${mx.exchange}`);
  });

  // TXT record lookup
  const txtResult = await resolver.resolve('example.com', 'TXT');
  console.log('\nTXT records:', txtResult.records);

  await resolver.destroy();
}

main().catch(console.error);
