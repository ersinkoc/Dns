import { CodeBlock } from '../components/CodeBlock';

interface HomeProps {
  onPageChange: (page: string) => void;
}

export function Home({ onPageChange }: HomeProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm">
          <span className="text-primary">Zero Dependencies</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-primary">100% TypeScript</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-primary">100% Test Coverage</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Zero-Dependency DNS Library
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          DNS-over-HTTPS, intelligent caching, DNSSEC validation, and plugin architecture.
          All without a single runtime dependency.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => onPageChange('getting-started')}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </button>
          <button
            onClick={() => onPageChange('playground')}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 font-medium transition-colors hover:bg-accent"
          >
            Try Playground
          </button>
        </div>
      </div>

      {/* Quick Install */}
      <div className="mt-16">
        <CodeBlock filename="bash" language="bash">
          {`npm install @oxog/dns`}
        </CodeBlock>
      </div>

      {/* Quick Example */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold">Quick Start</h2>
        <CodeBlock filename="index.ts" language="typescript">
          {`import { dns } from '@oxog/dns';

// Simple A record lookup
const ips = await dns.resolve('example.com', 'A');
console.log(ips); // ['93.184.216.34']

// MX record lookup
const mx = await dns.resolve('gmail.com', 'MX');
console.log(mx);
// [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }]

// Create custom resolver with caching
const resolver = dns.createResolver({
  servers: ['8.8.8.8', '1.1.1.1'],
  cache: { enabled: true }
});

const result = await resolver.resolve('example.com', 'A');
console.log(result.records); // ['93.184.216.34']
console.log(result.ttl); // 3600`}
        </CodeBlock>
      </div>

      {/* Features */}
      <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">Zero Dependencies</h3>
          <p className="text-sm text-muted-foreground">
            No runtime dependencies. Everything is implemented from scratch for maximum control and minimal bundle size.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">DNS-over-HTTPS</h3>
          <p className="text-sm text-muted-foreground">
            Secure, privacy-preserving DNS queries with support for Cloudflare, Google, and Quad9.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">Intelligent Caching</h3>
          <p className="text-sm text-muted-foreground">
            TTL-aware caching with LRU eviction, configurable limits, and automatic expiration.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">DNSSEC Validation</h3>
          <p className="text-sm text-muted-foreground">
            Optional DNSSEC signature validation for security-critical applications.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">Plugin Architecture</h3>
          <p className="text-sm text-muted-foreground">
            Extensible micro-kernel design with plugin system for custom functionality.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">All Record Types</h3>
          <p className="text-sm text-muted-foreground">
            Support for A, AAAA, MX, TXT, CNAME, NS, SRV, SOA, CAA, and PTR records.
          </p>
        </div>
      </div>

      {/* Record Types */}
      <div className="mt-20">
        <h2 className="mb-6 text-2xl font-bold">Supported Record Types</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { type: 'A', desc: 'IPv4 address' },
            { type: 'AAAA', desc: 'IPv6 address' },
            { type: 'MX', desc: 'Mail server' },
            { type: 'TXT', desc: 'Text record' },
            { type: 'CNAME', desc: 'Alias' },
            { type: 'NS', desc: 'Nameserver' },
            { type: 'SRV', desc: 'Service record' },
            { type: 'SOA', desc: 'Zone authority' },
            { type: 'CAA', desc: 'CA authorization' },
            { type: 'PTR', desc: 'Reverse DNS' },
          ].map((record) => (
            <div key={record.type} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <code className="text-sm font-bold text-primary">{record.type}</code>
              <span className="text-sm text-muted-foreground">{record.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
