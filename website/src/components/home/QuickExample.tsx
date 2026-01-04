import { CodeBlock } from '@/components/code/CodeBlock';

const EXAMPLE_CODE = `import { dns } from '@oxog/dns';

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
console.log(result.ttl); // 3600`;

export function QuickExample() {
  return (
    <section className="py-24 bg-zinc-950/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Quick Start</h2>
            <p className="text-lg text-zinc-400">
              Get started with just a few lines of code.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm">
            <CodeBlock
              code={EXAMPLE_CODE}
              language="typescript"
              filename="index.ts"
              highlightLines={[4, 8, 17]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
