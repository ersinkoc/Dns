/**
 * DNS Health Monitoring Example
 *
 * This example demonstrates monitoring DNS server health.
 */

import { createResolver } from '@oxog/dns';

interface HealthCheckResult {
  server: string;
  healthy: boolean;
  responseTime?: number;
  error?: string;
}

async function healthCheck(server: string, timeout = 3000): Promise<HealthCheckResult> {
  const resolver = createResolver({
    servers: [server],
    timeout,
  });

  const start = Date.now();

  try {
    const result = await resolver.resolve('example.com', 'A');
    const responseTime = Date.now() - start;

    await resolver.destroy();

    return {
      server,
      healthy: true,
      responseTime,
    };
  } catch (error) {
    await resolver.destroy();

    return {
      server,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  const servers = [
    '8.8.8.8', // Google DNS
    '1.1.1.1', // Cloudflare DNS
    '9.9.9.9', // Quad9 DNS
    '208.67.222.222', // OpenDNS
  ];

  console.log('DNS Server Health Check\n');
  console.log('Testing servers...\n');

  const results: HealthCheckResult[] = [];

  for (const server of servers) {
    const result = await healthCheck(server);
    results.push(result);

    if (result.healthy) {
      console.log(`✓ ${server}:`);
      console.log(`  Status: Healthy`);
      console.log(`  Response time: ${result.responseTime}ms`);
    } else {
      console.log(`✗ ${server}:`);
      console.log(`  Status: Unhealthy`);
      console.log(`  Error: ${result.error}`);
    }
    console.log();
  }

  // Summary
  console.log('=== Summary ===');
  const healthyCount = results.filter((r) => r.healthy).length;
  const avgResponseTime = results
    .filter((r) => r.responseTime)
    .reduce((sum, r) => sum + (r.responseTime ?? 0), 0) / healthyCount;

  console.log(`Total servers: ${results.length}`);
  console.log(`Healthy: ${healthyCount}`);
  console.log(`Unhealthy: ${results.length - healthyCount}`);
  console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);

  // Recommend best server
  const healthyServers = results.filter((r) => r.healthy && r.responseTime);
  if (healthyServers.length > 0) {
    const best = healthyServers.reduce((best, current) =>
      (current.responseTime ?? 0) < (best.responseTime ?? 0) ? current : best,
    );
    console.log(`\nRecommended server: ${best.server} (${best.responseTime}ms)`);
  }
}

main().catch(console.error);
