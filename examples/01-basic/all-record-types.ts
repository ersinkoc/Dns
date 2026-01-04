/**
 * All DNS Record Types Example
 *
 * This example demonstrates all supported DNS record types.
 */

import { dns } from '@oxog/dns';

async function main() {
  const domain = 'example.com';

  console.log(`Looking up all record types for ${domain}:\n`);

  // A Record (IPv4 address)
  console.log('A Records (IPv4):');
  const aRecords = await dns.resolve(domain, 'A');
  aRecords.forEach((ip) => console.log(`  ${ip}`));

  // AAAA Record (IPv6 address)
  console.log('\nAAAA Records (IPv6):');
  const aaaaRecords = await dns.resolve(domain, 'AAAA');
  aaaaRecords.forEach((ip) => console.log(`  ${ip}`));

  // MX Record (Mail exchange)
  console.log('\nMX Records (Mail Exchange):');
  const mxRecords = await dns.resolve(domain, 'MX');
  mxRecords.forEach((mx) => console.log(`  Priority ${mx.priority}: ${mx.exchange}`));

  // TXT Record (Text)
  console.log('\nTXT Records:');
  const txtRecords = await dns.resolve(domain, 'TXT');
  txtRecords.forEach((txt) => console.log(`  "${txt}"`));

  // CNAME Record (Canonical name)
  console.log('\nCNAME Records:');
  const cnameRecords = await dns.resolve('www.' + domain, 'CNAME');
  cnameRecords.forEach((cname) => console.log(`  ${cname}`));

  // NS Record (Nameserver)
  console.log('\nNS Records (Nameservers):');
  const nsRecords = await dns.resolve(domain, 'NS');
  nsRecords.forEach((ns) => console.log(`  ${ns}`));

  // SRV Record (Service)
  console.log('\nSRV Records (Service):');
  try {
    const srvRecords = await dns.resolve('_sip._tcp.example.com', 'SRV');
    srvRecords.forEach((srv) =>
      console.log(`  Priority ${srv.priority}, Weight ${srv.weight}, Port ${srv.port}: ${srv.target}`),
    );
  } catch (error) {
    console.log('  No SRV records found');
  }

  // SOA Record (Start of authority)
  console.log('\nSOA Record (Start of Authority):');
  try {
    const soaRecords = await dns.resolve(domain, 'SOA');
    soaRecords.forEach((soa) => {
      console.log(`  Primary NS: ${soa.nsname}`);
      console.log(`  Hostmaster: ${soa.hostmaster}`);
      console.log(`  Serial: ${soa.serial}`);
      console.log(`  Refresh: ${soa.refresh}s`);
      console.log(`  Retry: ${soa.retry}s`);
      console.log(`  Expire: ${soa.expire}s`);
      console.log(`  Min TTL: ${soa.minttl}s`);
    });
  } catch (error) {
    console.log('  No SOA records found');
  }

  // CAA Record (Certification Authority Authorization)
  console.log('\nCAA Records:');
  try {
    const caaRecords = await dns.resolve(domain, 'CAA');
    caaRecords.forEach((caa) => {
      console.log(`  ${caa.critical ? '[Critical]' : '[Non-critical]'} ${caa.tag}: ${caa.value}`);
    });
  } catch (error) {
    console.log('  No CAA records found');
  }
}

main().catch(console.error);
