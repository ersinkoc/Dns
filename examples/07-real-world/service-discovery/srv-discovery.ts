/**
 * SRV Record Service Discovery Example
 *
 * This example demonstrates using SRV records for service discovery.
 */

import { dns } from '@oxog/dns';

interface SrvService {
  priority: number;
  weight: number;
  port: number;
  target: string;
}

async function discoverService(service: string, protocol: string, domain: string): Promise<SrvService[]> {
  const query = `_${service}._${protocol}.${domain}`;

  try {
    const records = await dns.resolve(query, 'SRV');
    return records as SrvService[];
  } catch (error) {
    console.error(`Error discovering ${service}:`, error);
    return [];
  }
}

async function main() {
  console.log('Service Discovery using SRV Records:\n');

  // Example: Discover LDAP servers for a domain
  console.log('=== LDAP Service Discovery ===');
  const ldapServers = await discoverService('ldap', 'tcp', 'example.com');

  if (ldapServers.length > 0) {
    console.log(`Found ${ldapServers.length} LDAP server(s):`);
    ldapServers.forEach((srv) => {
      console.log(`  ${srv.target}:${srv.port} (priority: ${srv.priority}, weight: ${srv.weight})`);
    });
  } else {
    console.log('No LDAP servers found');
  }

  // Example: Discover SIP servers
  console.log('\n=== SIP Service Discovery ===');
  const sipServers = await discoverService('sip', 'tcp', 'example.com');

  if (sipServers.length > 0) {
    console.log(`Found ${sipServers.length} SIP server(s):`);
    sipServers.forEach((srv) => {
      console.log(`  ${srv.target}:${srv.port} (priority: ${srv.priority}, weight: ${srv.weight})`);
    });
  } else {
    console.log('No SIP servers found');
  }

  // Sort by priority and weight
  console.log('\n=== Sorted by Priority/Weight ===');
  const sortedServers = [...sipServers].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return b.weight - a.weight;
  });

  sortedServers.forEach((srv) => {
    console.log(`  ${srv.target}:${srv.port} (priority: ${srv.priority}, weight: ${srv.weight})`);
  });
}

main().catch(console.error);
