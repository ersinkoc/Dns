/**
 * Email Domain Validation Example
 *
 * This example demonstrates how to validate email domains
 * by checking for MX records.
 */

import { dns, DnsError } from '@oxog/dns';

async function validateEmailDomain(email: string): Promise<boolean> {
  // Extract domain from email
  const domain = email.split('@')[1];

  if (!domain) {
    return false;
  }

  try {
    // Check for MX records
    const mxRecords = await dns.resolve(domain, 'MX');
    return mxRecords.length > 0;
  } catch (error) {
    // NXDOMAIN or other errors mean domain doesn't accept email
    if (error instanceof DnsError) {
      return false;
    }
    throw error;
  }
}

async function getEmailServers(domain: string): Promise<Array<{ priority: number; server: string }>> {
  try {
    const mxRecords = await dns.resolve(domain, 'MX');
    return mxRecords.map((mx) => ({
      priority: mx.priority,
      server: mx.exchange,
    }));
  } catch (error) {
    return [];
  }
}

async function main() {
  const emails = [
    'user@gmail.com',
    'user@example.com',
    'user@nonexistent-domain-12345.com',
    'user@outlook.com',
  ];

  console.log('Validating email domains:\n');

  for (const email of emails) {
    const isValid = await validateEmailDomain(email);
    console.log(`${email}: ${isValid ? 'VALID' : 'INVALID'}`);

    if (isValid) {
      const domain = email.split('@')[1]!;
      const servers = await getEmailServers(domain);
      console.log(`  Mail servers: ${servers.map((s) => s.server).join(', ')}`);
    }
    console.log();
  }

  // Detailed check for a specific domain
  console.log('=== Detailed MX Record Check for gmail.com ===');
  const mxRecords = await dns.resolve('gmail.com', 'MX');

  mxRecords.sort((a, b) => a.priority - b.priority);

  mxRecords.forEach((mx) => {
    console.log(`Priority ${mx.priority}: ${mx.exchange}`);
  });
}

main().catch(console.error);
