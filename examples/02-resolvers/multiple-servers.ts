/**
 * Multiple DNS Servers Example
 *
 * This example demonstrates using multiple DNS servers
 * with different rotation strategies.
 */

import { dns, createResolver } from '@oxog/dns';

async function main() {
  const domain = 'example.com';

  // Failover strategy (default)
  console.log('=== Failover Strategy ===');
  const failoverResolver = createResolver({
    servers: ['8.8.8.8', '1.1.1.1', '9.9.9.9'],
    rotationStrategy: 'failover', // Try first, fail to next on error
  });

  const failoverResult = await failoverResolver.resolve(domain, 'A');
  console.log('Results from:', failoverResult.resolver);

  // Round-robin strategy
  console.log('\n=== Round-robin Strategy ===');
  const rrResolver = createResolver({
    servers: ['8.8.8.8', '1.1.1.1', '9.9.9.9'],
    rotationStrategy: 'round-robin', // Rotate through servers
  });

  for (let i = 0; i < 3; i++) {
    const result = await rrResolver.resolve(domain, 'A');
    console.log(`Query ${i + 1} from:`, result.resolver);
  }

  // Random strategy
  console.log('\n=== Random Strategy ===');
  const randomResolver = createResolver({
    servers: ['8.8.8.8', '1.1.1.1', '9.9.9.9'],
    rotationStrategy: 'random', // Random server selection
  });

  for (let i = 0; i < 3; i++) {
    const result = await randomResolver.resolve(domain, 'A');
    console.log(`Query ${i + 1} from:`, result.resolver);
  }

  // Add/remove servers dynamically
  console.log('\n=== Dynamic Server Management ===');
  const resolver = createResolver({ servers: ['8.8.8.8'] });

  console.log('Initial servers:', resolver.getServers());
  // Output: ['8.8.8.8']

  // Add a server
  // Note: addServer/removeServer would need to be exposed on the resolver
  // For now, create a new resolver with updated servers
  const updatedResolver = createResolver({
    servers: [...resolver.getServers(), '1.1.1.1'],
  });

  console.log('Updated servers:', updatedResolver.getServers());
  // Output: ['8.8.8.8', '1.1.1.1']
}

main().catch(console.error);
