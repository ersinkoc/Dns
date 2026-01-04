import { CodeBlock } from '../components/CodeBlock';

export function GettingStarted() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Getting Started</h1>

      <div className="mt-8 space-y-8">
        {/* Installation */}
        <section>
          <h2 className="text-2xl font-semibold">Installation</h2>
          <p className="mt-2 text-muted-foreground">
            Install @oxog/dns using npm, yarn, or pnpm:
          </p>
          <CodeBlock filename="bash" language="bash">
            {`npm install @oxog/dns

# or
yarn add @oxog/dns

# or
pnpm add @oxog/dns`}
          </CodeBlock>
        </section>

        {/* Basic Usage */}
        <section>
          <h2 className="text-2xl font-semibold">Basic Usage</h2>
          <p className="mt-2 text-muted-foreground">
            Import the default dns instance and start resolving records:
          </p>
          <CodeBlock filename="index.ts" language="typescript">
            {`import { dns } from '@oxog/dns';

// A record lookup (IPv4 addresses)
const ips = await dns.resolve('example.com', 'A');
console.log(ips); // ['93.184.216.34']

// MX record lookup (mail servers)
const mx = await dns.resolve('gmail.com', 'MX');
console.log(mx);
// [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }, ...]

// TXT record lookup
const txt = await dns.resolve('example.com', 'TXT');
console.log(txt); // ['v=spf1 -all']`}
          </CodeBlock>
        </section>

        {/* Custom Resolver */}
        <section>
          <h2 className="text-2xl font-semibold">Custom Resolver</h2>
          <p className="mt-2 text-muted-foreground">
            Create a custom resolver with specific options:
          </p>
          <CodeBlock filename="resolver.ts" language="typescript">
            {`import { createResolver } from '@oxog/dns';

const resolver = createResolver({
  servers: ['8.8.8.8', '1.1.1.1'], // DNS servers
  timeout: 5000,                   // 5 second timeout
  retries: 3,                      // Retry up to 3 times
  cache: { enabled: true }          // Enable caching
});

const result = await resolver.resolve('example.com', 'A');
console.log(result.records); // ['93.184.216.34']
console.log(result.ttl); // 3600
console.log(result.duration); // 45 (ms)`}
          </CodeBlock>
        </section>

        {/* Reverse DNS */}
        <section>
          <h2 className="text-2xl font-semibold">Reverse DNS Lookup</h2>
          <p className="mt-2 text-muted-foreground">
            Convert IP addresses to hostnames:
          </p>
          <CodeBlock filename="reverse.ts" language="typescript">
            {`import { dns } from '@oxog/dns';

// IPv4 reverse lookup
const hostname = await dns.reverse('8.8.8.8');
console.log(hostname); // 'dns.google'

// IPv6 reverse lookup
const hostname6 = await dns.reverse('2001:4860:4860::8888');
console.log(hostname6); // 'dns.google'

// Get all PTR records
const ptrs = await dns.reverseAll('8.8.8.8');
console.log(ptrs); // ['dns.google']`}
          </CodeBlock>
        </section>

        {/* DNS-over-HTTPS */}
        <section>
          <h2 className="text-2xl font-semibold">DNS-over-HTTPS</h2>
          <p className="mt-2 text-muted-foreground">
            Use DoH for secure, private DNS queries:
          </p>
          <CodeBlock filename="doh.ts" language="typescript">
            {`import { createResolver } from '@oxog/dns';

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

// Quad9 DoH
const quad9Resolver = createResolver({
  type: 'doh',
  server: 'https://dns.quad9.net/dns-query'
});

await cfResolver.resolve('example.com', 'A');`}
          </CodeBlock>
        </section>

        {/* Caching */}
        <section>
          <h2 className="text-2xl font-semibold">Intelligent Caching</h2>
          <p className="mt-2 text-muted-foreground">
            Enable caching to reduce redundant queries:
          </p>
          <CodeBlock filename="cache.ts" language="typescript">
            {`import { createResolver } from '@oxog/dns';

const resolver = createResolver({
  cache: {
    enabled: true,
    maxSize: 1000,        // Maximum entries
    respectTtl: true,      // Honor DNS TTL
    minTtl: 60,            // Minimum TTL (seconds)
    maxTtl: 86400          // Maximum TTL (seconds)
  }
});

// Check cache stats
const stats = resolver.getCacheStats();
console.log(stats);
// { hits: 150, misses: 20, size: 45, hitRate: 0.882 }

// Clear cache
resolver.clearCache();
resolver.clearCache('example.com', 'A');`}
          </CodeBlock>
        </section>

        {/* Error Handling */}
        <section>
          <h2 className="text-2xl font-semibold">Error Handling</h2>
          <p className="mt-2 text-muted-foreground">
            Handle DNS errors with proper error codes:
          </p>
          <CodeBlock filename="errors.ts" language="typescript">
            {`import { dns, DnsError, DnsErrorCode } from '@oxog/dns';

try {
  await dns.resolve('nonexistent-domain.com', 'A');
} catch (error) {
  if (error instanceof DnsError) {
    if (error.code === DnsErrorCode.NXDOMAIN) {
      console.log('Domain does not exist');
    } else if (error.code === DnsErrorCode.TIMEOUT) {
      console.log('Query timed out');
    } else if (error.code === DnsErrorCode.SERVFAIL) {
      console.log('Server failed to respond');
    }
  }
}`}
          </CodeBlock>
        </section>
      </div>
    </div>
  );
}
