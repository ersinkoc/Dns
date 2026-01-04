import { ExternalLink } from 'lucide-react';
import { CodeBlock } from '@/components/code/CodeBlock';
import { GITHUB_REPO } from '@/lib/constants';
import { cn } from '@/lib/utils';

const EXAMPLES = [
  {
    category: 'Basic',
    items: [
      {
        title: 'Simple DNS Lookup',
        file: '01-basic/simple-lookup.ts',
        description: 'Basic DNS record lookup for common record types.',
        code: `import { dns } from '@oxog/dns';

// A record lookup
const ips = await dns.resolve('example.com', 'A');
console.log(ips); // ['93.184.216.34']

// MX record lookup
const mx = await dns.resolve('gmail.com', 'MX');
console.log(mx);
// [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }, ...]`,
      },
      {
        title: 'All Record Types',
        file: '01-basic/all-record-types.ts',
        description: 'Demonstrates all supported DNS record types.',
        code: `import { dns } from '@oxog/dns';

const types = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SRV', 'SOA', 'CAA'] as const;

for (const type of types) {
  const result = await dns.resolve('example.com', type);
  console.log(\`\${type}:\`, result);
}`,
      },
      {
        title: 'Reverse Lookup',
        file: '01-basic/reverse-lookup.ts',
        description: 'Reverse DNS lookups from IP to hostname.',
        code: `import { dns } from '@oxog/dns';

// IPv4 reverse lookup
const hostname = await dns.reverse('8.8.8.8');
console.log(hostname); // 'dns.google'

// IPv6 reverse lookup
const hostname6 = await dns.reverse('2001:4860:4860::8888');
console.log(hostname6); // 'dns.google'`,
      },
    ],
  },
  {
    category: 'Resolvers',
    items: [
      {
        title: 'Custom Resolver',
        file: '02-resolvers/custom-resolver.ts',
        description: 'Create a custom DNS resolver with specific options.',
        code: `import { createResolver } from '@oxog/dns';

const resolver = createResolver({
  servers: ['8.8.8.8', '1.1.1.1'],
  timeout: 5000,
  retries: 3,
  cache: { enabled: true }
});

const result = await resolver.resolve('example.com', 'A');
console.log(result.records);
console.log(result.ttl);`,
      },
      {
        title: 'DNS-over-HTTPS',
        file: '02-resolvers/doh-cloudflare.ts',
        description: 'DNS-over-HTTPS with Cloudflare for privacy.',
        code: `import { createResolver } from '@oxog/dns';

// Cloudflare DoH
const cfResolver = createResolver({
  type: 'doh',
  server: 'https://1.1.1.1/dns-query'
});

// Google DoH
const googleResolver = createResolver({
  type: 'doh',
  server: 'https://dns.google/dns-query'
});

const result = await cfResolver.resolve('example.com', 'A');
console.log(result.records);`,
      },
      {
        title: 'Multiple Servers',
        file: '02-resolvers/multiple-servers.ts',
        description: 'Use multiple DNS servers with failover strategies.',
        code: `import { createResolver } from '@oxog/dns';

const resolver = createResolver({
  servers: ['8.8.8.8', '1.1.1.1', '9.9.9.9'],
  rotationStrategy: 'failover',  // or 'round-robin', 'random'
  healthCheck: true,
  timeout: 3000
});

const result = await resolver.resolve('example.com', 'A');
console.log('Active servers:', resolver.getServers());`,
      },
    ],
  },
  {
    category: 'Caching',
    items: [
      {
        title: 'Basic Cache',
        file: '03-caching/basic-cache.ts',
        description: 'Enable and use DNS response caching.',
        code: `import { createResolver } from '@oxog/dns';

const resolver = createResolver({
  cache: {
    enabled: true,
    maxSize: 1000,
    respectTtl: true,
    minTtl: 60,
    maxTtl: 86400
  }
});

// First request - cache miss
const result1 = await resolver.resolve('example.com', 'A');
console.log('Cached:', result1.cached); // false

// Second request - cache hit
const result2 = await resolver.resolve('example.com', 'A');
console.log('Cached:', result2.cached); // true`,
      },
      {
        title: 'Cache Statistics',
        file: '03-caching/cache-stats.ts',
        description: 'Monitor cache performance.',
        code: `import { createResolver } from '@oxog/dns';

const resolver = createResolver({ cache: { enabled: true } });

// Make some queries
await resolver.resolve('example.com', 'A');
await resolver.resolve('google.com', 'A');
await resolver.resolve('example.com', 'A'); // cache hit

// Get cache stats
const stats = resolver.getCacheStats();
console.log(stats);
// { hits: 1, misses: 2, size: 2, hitRate: 0.333 }

// Clear specific entry
resolver.clearCache('example.com', 'A');

// Clear all cache
resolver.clearCache();`,
      },
    ],
  },
  {
    category: 'Error Handling',
    items: [
      {
        title: 'NXDOMAIN Handling',
        file: '04-error-handling/nxdomain.ts',
        description: 'Handle non-existent domains.',
        code: `import { dns, DnsError, DnsErrorCode } from '@oxog/dns';

try {
  await dns.resolve('this-domain-does-not-exist.com', 'A');
} catch (error) {
  if (error instanceof DnsError) {
    if (error.code === DnsErrorCode.NXDOMAIN) {
      console.log('Domain does not exist');
    }
  }
}`,
      },
      {
        title: 'Timeout Handling',
        file: '04-error-handling/timeout.ts',
        description: 'Handle DNS query timeouts.',
        code: `import { createResolver, DnsError, DnsErrorCode } from '@oxog/dns';

const resolver = createResolver({
  timeout: 1000,  // 1 second timeout
  retries: 0      // No retries
});

try {
  await resolver.resolve('slow-server.example.com', 'A');
} catch (error) {
  if (error instanceof DnsError && error.code === DnsErrorCode.TIMEOUT) {
    console.log('Query timed out after 1 second');
  }
}`,
      },
    ],
  },
  {
    category: 'Real World',
    items: [
      {
        title: 'Email Validation',
        file: '07-real-world/validate-email-domain.ts',
        description: 'Verify email domains using MX records.',
        code: `import { dns, DnsError, DnsErrorCode } from '@oxog/dns';

async function validateEmailDomain(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;

  try {
    const mx = await dns.resolve(domain, 'MX');
    return mx.length > 0;
  } catch (error) {
    if (error instanceof DnsError && error.code === DnsErrorCode.NXDOMAIN) {
      return false;
    }
    throw error;
  }
}

const isValid = await validateEmailDomain('user@gmail.com');
console.log('Valid email domain:', isValid); // true`,
      },
      {
        title: 'Service Discovery',
        file: '07-real-world/srv-discovery.ts',
        description: 'SRV-based service discovery.',
        code: `import { dns } from '@oxog/dns';

async function discoverService(service: string, domain: string) {
  const name = \`_\${service}._tcp.\${domain}\`;
  const records = await dns.resolve(name, 'SRV');

  // Sort by priority and weight
  return records.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.weight - a.weight;
  });
}

const servers = await discoverService('ldap', 'example.com');
console.log('LDAP servers:', servers);`,
      },
    ],
  },
];

export function Examples() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Examples</h1>
          <p className="text-lg text-muted-foreground">
            Practical examples to help you get started with @oxog/dns.
          </p>
        </header>

        <div className="space-y-16">
          {EXAMPLES.map((section) => (
            <section key={section.category}>
              <h2 className="text-2xl font-bold mb-6">{section.category}</h2>
              <div className="space-y-8">
                {section.items.map((example) => (
                  <div
                    key={example.file}
                    className={cn(
                      'rounded-xl border border-border bg-card p-6',
                      'hover:border-primary/50 transition-colors'
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{example.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {example.description}
                        </p>
                      </div>
                      <a
                        href={`https://github.com/${GITHUB_REPO}/blob/main/examples/${example.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg',
                          'text-xs font-medium text-muted-foreground',
                          'hover:bg-accent hover:text-foreground transition-colors'
                        )}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on GitHub
                      </a>
                    </div>
                    <CodeBlock
                      code={example.code}
                      language="typescript"
                      filename={example.file.split('/').pop()}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
