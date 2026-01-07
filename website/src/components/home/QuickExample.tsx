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
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
              Quick Start
            </h2>
            <p className="text-muted-foreground">
              Create your first DNS lookup in seconds with our fluent builder API.
            </p>
          </div>

          {/* Code block */}
          <div className="code-container">
            {/* Header bar */}
            <div className="code-header">
              <div className="code-dots">
                <div className="code-dot code-dot-red" />
                <div className="code-dot code-dot-yellow" />
                <div className="code-dot code-dot-green" />
              </div>
              <span className="text-xs text-muted-foreground font-mono ml-2">
                index.ts
              </span>
            </div>

            {/* Code content */}
            <CodeBlock
              code={EXAMPLE_CODE}
              language="typescript"
              highlightLines={[4, 8, 17]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
