/**
 * Timeout Handling Example
 *
 * This example demonstrates how to handle DNS query timeouts.
 */

import { createResolver, DnsError, DnsErrorCode } from '@oxog/dns';

async function main() {
  // Create a resolver with a short timeout
  const resolver = createResolver({
    servers: ['8.8.8.8'],
    timeout: 100, // Very short timeout for demonstration
    retries: 2,
  });

  console.log('Testing timeout handling:\n');

  try {
    // This might timeout if the network is slow
    const result = await resolver.resolve('example.com', 'A');
    console.log('Success:', result.records);
  } catch (error) {
    if (error instanceof DnsError) {
      if (error.code === DnsErrorCode.TIMEOUT) {
        console.error('Query timed out:', error.message);
        console.error('  Domain:', error.domain);
        console.error('  Record type:', error.recordType);
      } else {
        console.error('DNS error:', error.message);
        console.error('  Code:', error.code);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }

  // Per-query timeout override
  console.log('\nTesting per-query timeout:');

  const normalResolver = createResolver({
    servers: ['8.8.8.8'],
    timeout: 5000,
  });

  try {
    // Use a shorter timeout for this specific query
    const result = await normalResolver.resolve('example.com', 'A', {
      timeout: 1000, // 1 second timeout for this query only
    });
    console.log('Success:', result.records);
  } catch (error) {
    if (error instanceof DnsError && error.code === DnsErrorCode.TIMEOUT) {
      console.error('Query timed out');
    }
  }

  await resolver.destroy();
  await normalResolver.destroy();
}

main().catch(console.error);
