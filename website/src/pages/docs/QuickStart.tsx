import { DocsLayout } from './DocsLayout';
import { CodeBlock } from '@/components/code/CodeBlock';

const BASIC_EXAMPLE = `import { dns } from '@oxog/dns';

// A record lookup
const ips = await dns.resolve('example.com', 'A');
console.log(ips);
// ['93.184.216.34']

// AAAA record lookup
const ipv6 = await dns.resolve('example.com', 'AAAA');
console.log(ipv6);
// ['2606:2800:220:1:248:1893:25c8:1946']`;

const MX_EXAMPLE = `import { dns } from '@oxog/dns';

// MX record lookup
const mx = await dns.resolve('gmail.com', 'MX');
console.log(mx);
// [
//   { priority: 5, exchange: 'gmail-smtp-in.l.google.com' },
//   { priority: 10, exchange: 'alt1.gmail-smtp-in.l.google.com' },
//   ...
// ]`;

const TXT_EXAMPLE = `import { dns } from '@oxog/dns';

// TXT record lookup (e.g., for SPF, DKIM)
const txt = await dns.resolve('google.com', 'TXT');
console.log(txt);
// ['v=spf1 include:_spf.google.com ~all', 'globalsign-...', ...]`;

const REVERSE_EXAMPLE = `import { dns } from '@oxog/dns';

// Reverse DNS lookup
const hostname = await dns.reverse('8.8.8.8');
console.log(hostname);
// 'dns.google'`;

const RESOLVER_EXAMPLE = `import { createResolver } from '@oxog/dns';

// Create a custom resolver
const resolver = createResolver({
  servers: ['8.8.8.8', '1.1.1.1'],
  timeout: 5000,
  retries: 3,
  cache: {
    enabled: true,
    maxSize: 1000
  }
});

// Use the resolver
const result = await resolver.resolve('example.com', 'A');
console.log(result.records); // ['93.184.216.34']
console.log(result.ttl); // 3600
console.log(result.cached); // false (first request)`;

const DOH_EXAMPLE = `import { createResolver } from '@oxog/dns';

// Use DNS-over-HTTPS with Cloudflare
const resolver = createResolver({
  type: 'doh',
  server: 'https://1.1.1.1/dns-query'
});

// Or use Google's DoH
const googleResolver = createResolver({
  type: 'doh',
  server: 'https://dns.google/dns-query'
});

const result = await resolver.resolve('example.com', 'A');
console.log(result.records);`;

export function QuickStart() {
  return (
    <DocsLayout
      title="Quick Start"
      description="Learn the basics of @oxog/dns with hands-on examples."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Basic DNS Lookup</h2>
        <p className="text-muted-foreground mb-4">
          The simplest way to perform a DNS lookup is using the <code className="px-1.5 py-0.5 rounded bg-muted text-sm">dns</code> helper:
        </p>
        <CodeBlock code={BASIC_EXAMPLE} language="typescript" filename="basic.ts" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">MX Records</h2>
        <p className="text-muted-foreground mb-4">
          Look up mail server records for email validation:
        </p>
        <CodeBlock code={MX_EXAMPLE} language="typescript" filename="mx.ts" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">TXT Records</h2>
        <p className="text-muted-foreground mb-4">
          Retrieve TXT records for SPF, DKIM, domain verification, etc:
        </p>
        <CodeBlock code={TXT_EXAMPLE} language="typescript" filename="txt.ts" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Reverse DNS</h2>
        <p className="text-muted-foreground mb-4">
          Get the hostname for an IP address:
        </p>
        <CodeBlock code={REVERSE_EXAMPLE} language="typescript" filename="reverse.ts" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Custom Resolver</h2>
        <p className="text-muted-foreground mb-4">
          Create a custom resolver with specific settings like custom DNS servers,
          caching, timeouts, and retries:
        </p>
        <CodeBlock code={RESOLVER_EXAMPLE} language="typescript" filename="resolver.ts" />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">DNS-over-HTTPS</h2>
        <p className="text-muted-foreground mb-4">
          Use DoH for secure, privacy-preserving DNS queries:
        </p>
        <CodeBlock code={DOH_EXAMPLE} language="typescript" filename="doh.ts" />
      </section>
    </DocsLayout>
  );
}
