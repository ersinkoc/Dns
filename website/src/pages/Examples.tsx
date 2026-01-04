import { CodeBlock } from '../components/CodeBlock';

export function Examples() {
  const examples = [
    {
      title: 'Simple DNS Lookup',
      category: '01-basic',
      file: 'simple-lookup.ts',
      description: 'Basic DNS record lookup for common record types.',
    },
    {
      title: 'All Record Types',
      category: '01-basic',
      file: 'all-record-types.ts',
      description: 'Demonstrates all supported DNS record types.',
    },
    {
      title: 'Reverse Lookup',
      category: '01-basic',
      file: 'reverse-lookup.ts',
      description: 'Reverse DNS lookups from IP to hostname.',
    },
    {
      title: 'Custom Resolver',
      category: '02-resolvers',
      file: 'custom-resolver.ts',
      description: 'Create a custom DNS resolver with specific options.',
    },
    {
      title: 'Multiple Servers',
      category: '02-resolvers',
      file: 'multiple-servers.ts',
      description: 'Use multiple DNS servers with failover strategies.',
    },
    {
      title: 'DoH Cloudflare',
      category: '02-resolvers',
      file: 'doh-cloudflare.ts',
      description: 'DNS-over-HTTPS with Cloudflare.',
    },
    {
      title: 'DoH Google',
      category: '02-resolvers',
      file: 'doh-google.ts',
      description: 'DNS-over-HTTPS with Google Public DNS.',
    },
    {
      title: 'Basic Cache',
      category: '03-caching',
      file: 'basic-cache.ts',
      description: 'Enable and use DNS response caching.',
    },
    {
      title: 'Cache Statistics',
      category: '03-caching',
      file: 'cache-stats.ts',
      description: 'Monitor cache performance.',
    },
    {
      title: 'Timeout Handling',
      category: '04-error-handling',
      file: 'timeout.ts',
      description: 'Handle DNS query timeouts.',
    },
    {
      title: 'NXDOMAIN Handling',
      category: '04-error-handling',
      file: 'nxdomain.ts',
      description: 'Handle non-existent domains.',
    },
    {
      title: 'Retry Logic',
      category: '04-error-handling',
      file: 'retry.ts',
      description: 'Automatic retry on failure.',
    },
    {
      title: 'DNSSEC Validation',
      category: '05-dnssec',
      file: 'validate.ts',
      description: 'DNSSEC validation for DNS responses.',
    },
    {
      title: 'Custom Plugin',
      category: '06-advanced',
      file: 'custom-plugin.ts',
      description: 'Write a custom plugin for the DNS kernel.',
    },
    {
      title: 'Metrics Collection',
      category: '06-advanced',
      file: 'metrics.ts',
      description: 'Collect DNS query metrics.',
    },
    {
      title: 'Query Logging',
      category: '06-advanced',
      file: 'logging.ts',
      description: 'Log DNS queries and responses.',
    },
    {
      title: 'Email Validation',
      category: '07-real-world',
      file: 'validate-email-domain.ts',
      description: 'Verify email domains using MX records.',
    },
    {
      title: 'Service Discovery',
      category: '07-real-world',
      file: 'srv-discovery.ts',
      description: 'SRV-based service discovery.',
    },
    {
      title: 'DNS Health Check',
      category: '07-real-world',
      file: 'dns-health-check.ts',
      description: 'DNS server health monitoring.',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Examples</h1>

      <div className="mt-8 grid gap-6">
        {examples.map((example) => (
          <div
            key={example.file}
            className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {example.category}
              </span>
              <h3 className="font-semibold">{example.title}</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{example.description}</p>
            <CodeBlock filename={example.file} language="typescript">
              {`// View on GitHub
// https://github.com/ersinkoc/dns/tree/main/examples/${example.category}/${example.file}`}
            </CodeBlock>
          </div>
        ))}
      </div>
    </div>
  );
}
