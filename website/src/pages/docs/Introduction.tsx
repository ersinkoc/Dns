import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Database, Lock, Puzzle, FileCode } from 'lucide-react';
import { DocsLayout } from './DocsLayout';
import { CodeBlock } from '@/components/code/CodeBlock';
import { cn } from '@/lib/utils';

const QUICK_EXAMPLE = `import { dns } from '@oxog/dns';

// Simple A record lookup
const ips = await dns.resolve('example.com', 'A');
console.log(ips); // ['93.184.216.34']`;

const FEATURES = [
  { icon: Zap, title: 'Zero Dependencies', description: 'No runtime dependencies at all' },
  { icon: Shield, title: 'DNS-over-HTTPS', description: 'Secure, privacy-preserving queries' },
  { icon: Database, title: 'Intelligent Caching', description: 'TTL-aware with LRU eviction' },
  { icon: Lock, title: 'DNSSEC Validation', description: 'Optional signature validation' },
  { icon: Puzzle, title: 'Plugin Architecture', description: 'Extensible micro-kernel design' },
  { icon: FileCode, title: '100% TypeScript', description: 'Full type safety with strict mode' },
];

export function Introduction() {
  return (
    <DocsLayout
      title="Introduction"
      description="Get started with @oxog/dns, a zero-dependency DNS library for Node.js."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">What is @oxog/dns?</h2>
        <p className="text-muted-foreground mb-4">
          <code className="px-1.5 py-0.5 rounded bg-muted text-sm">@oxog/dns</code> is a
          zero-dependency DNS lookup library for Node.js. It provides a simple, type-safe
          API for performing DNS queries with support for DNS-over-HTTPS, intelligent
          caching, DNSSEC validation, and a powerful plugin architecture.
        </p>
        <p className="text-muted-foreground">
          Unlike other DNS libraries, @oxog/dns has no runtime dependencies - everything
          is implemented from scratch for maximum control, security, and minimal bundle size.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Key Features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{feature.title}</div>
                  <div className="text-sm text-muted-foreground">{feature.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Quick Example</h2>
        <p className="text-muted-foreground mb-4">
          Here's how simple it is to perform a DNS lookup:
        </p>
        <CodeBlock code={QUICK_EXAMPLE} language="typescript" filename="example.ts" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Supported Record Types</h2>
        <p className="text-muted-foreground mb-4">
          @oxog/dns supports all major DNS record types:
        </p>
        <div className="flex flex-wrap gap-2">
          {['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SRV', 'SOA', 'CAA', 'PTR'].map((type) => (
            <code
              key={type}
              className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium"
            >
              {type}
            </code>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
        <div className="flex flex-col gap-3">
          <Link
            to="/docs/installation"
            className={cn(
              'flex items-center justify-between p-4 rounded-lg',
              'border border-border bg-card',
              'hover:border-primary/50 transition-colors'
            )}
          >
            <div>
              <div className="font-medium">Installation</div>
              <div className="text-sm text-muted-foreground">
                Install @oxog/dns in your project
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link
            to="/docs/quick-start"
            className={cn(
              'flex items-center justify-between p-4 rounded-lg',
              'border border-border bg-card',
              'hover:border-primary/50 transition-colors'
            )}
          >
            <div>
              <div className="font-medium">Quick Start</div>
              <div className="text-sm text-muted-foreground">
                Learn the basics with hands-on examples
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
