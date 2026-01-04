import { Puzzle, Check, Plug } from 'lucide-react';
import { CodeBlock } from '@/components/code/CodeBlock';
import { cn } from '@/lib/utils';

const CORE_PLUGINS = [
  {
    name: 'record-parser',
    description: 'Parses DNS wire format responses into structured data.',
    code: `import { recordParserPlugin } from '@oxog/dns/plugins';

const kernel = createKernel();
kernel.use(recordParserPlugin);`,
  },
  {
    name: 'resolver-chain',
    description: 'Manages resolver selection and failover logic.',
    code: `import { resolverChainPlugin } from '@oxog/dns/plugins';

const kernel = createKernel({
  servers: ['8.8.8.8', '1.1.1.1'],
  rotationStrategy: 'failover'
});

kernel.use(resolverChainPlugin);`,
  },
  {
    name: 'query-builder',
    description: 'Builds DNS queries in wire format.',
    code: `import { queryBuilderPlugin } from '@oxog/dns/plugins';

const kernel = createKernel();
kernel.use(queryBuilderPlugin);`,
  },
];

const OPTIONAL_PLUGINS = [
  {
    name: 'cache',
    description: 'TTL-aware response caching with LRU eviction.',
    code: `import { cachePlugin } from '@oxog/dns/plugins';

const kernel = createKernel({
  cache: { enabled: true, maxSize: 1000 }
});

kernel.use(cachePlugin);

// Check cache stats
const stats = kernel.getCacheStats();`,
  },
  {
    name: 'doh',
    description: 'DNS-over-HTTPS transport layer.',
    code: `import { dohPlugin } from '@oxog/dns/plugins';

const kernel = createKernel({
  type: 'doh',
  server: 'https://1.1.1.1/dns-query'
});

kernel.use(dohPlugin);`,
  },
  {
    name: 'dnssec',
    description: 'DNSSEC signature validation.',
    code: `import { dnssecPlugin } from '@oxog/dns/plugins';

const kernel = createKernel({
  dnssec: { enabled: true, requireValid: true }
});

kernel.use(dnssecPlugin);`,
  },
  {
    name: 'retry',
    description: 'Automatic retry with backoff strategies.',
    code: `import { retryPlugin } from '@oxog/dns/plugins';

const kernel = createKernel({
  retries: 3,
  retryDelay: 100,
  retryBackoff: 'exponential'
});

kernel.use(retryPlugin);`,
  },
  {
    name: 'metrics',
    description: 'Query timing and statistics collection.',
    code: `import { metricsPlugin } from '@oxog/dns/plugins';

const kernel = createKernel();
kernel.use(metricsPlugin);

// Get metrics
kernel.on('metrics', (data) => {
  console.log('Query duration:', data.duration);
});`,
  },
  {
    name: 'logger',
    description: 'Query/response logging.',
    code: `import { loggerPlugin } from '@oxog/dns/plugins';

const kernel = createKernel();
kernel.use(loggerPlugin);

// Logs are emitted as events
kernel.on('log', ({ level, message }) => {
  console.log(\`[\${level}] \${message}\`);
});`,
  },
];

const CUSTOM_PLUGIN_CODE = `import type { DnsPlugin, DnsKernel } from '@oxog/dns';

const myPlugin: DnsPlugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',

  // Called when plugin is registered
  install(kernel: DnsKernel) {
    // Register event listeners
    kernel.on('query', async (data) => {
      console.log('Query started:', data.domain, data.type);
    });

    kernel.on('response', async (data) => {
      console.log('Response received:', data.records);
    });

    kernel.on('error', async (error) => {
      console.error('Query failed:', error.message);
    });
  },

  // Called after all plugins are installed
  async onInit(context) {
    console.log('Plugin initialized');
  },

  // Called when kernel is destroyed
  onDestroy() {
    console.log('Plugin cleanup');
  }
};

// Use the plugin
const kernel = createKernel();
kernel.use(myPlugin);
await kernel.init();`;

const LIFECYCLE_CODE = `// Plugin lifecycle diagram
//
// 1. install(kernel)  <- Register event handlers
//       |
//       v
// 2. kernel.init()    <- System initialization
//       |
//       v
// 3. onInit(context)  <- Plugin ready
//       |
//       v
// 4. [queries...]     <- Normal operation
//       |
//       v
// 5. kernel.destroy() <- Cleanup
//       |
//       v
// 6. onDestroy()      <- Plugin cleanup`;

export function Plugins() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Plugins</h1>
          <p className="text-lg text-muted-foreground">
            @oxog/dns uses a micro-kernel architecture with a powerful plugin system for extensibility.
          </p>
        </header>

        {/* Architecture overview */}
        <section className="mb-16 p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Puzzle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Micro-Kernel Architecture</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            The DNS resolver is built on a minimal kernel that delegates functionality to plugins.
            This design allows for maximum flexibility and customization while keeping the core
            lightweight and maintainable.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Modular', 'Extensible', 'Testable', 'Maintainable'].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
              >
                <Check className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Core Plugins */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Core Plugins</h2>
          <p className="text-muted-foreground mb-6">
            These plugins are automatically loaded by the resolver and provide essential functionality.
          </p>
          <div className="space-y-6">
            {CORE_PLUGINS.map((plugin) => (
              <div
                key={plugin.name}
                className={cn(
                  'rounded-xl border border-border bg-card p-6',
                  'hover:border-primary/50 transition-colors'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Plug className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold font-mono">{plugin.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                    Core
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{plugin.description}</p>
                <CodeBlock code={plugin.code} language="typescript" showLineNumbers={false} />
              </div>
            ))}
          </div>
        </section>

        {/* Optional Plugins */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Optional Plugins</h2>
          <p className="text-muted-foreground mb-6">
            Enable these plugins as needed for additional functionality.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {OPTIONAL_PLUGINS.map((plugin) => (
              <div
                key={plugin.name}
                className={cn(
                  'rounded-xl border border-border bg-card p-6',
                  'hover:border-primary/50 transition-colors'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Plug className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold font-mono">{plugin.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{plugin.description}</p>
                <CodeBlock
                  code={plugin.code}
                  language="typescript"
                  showLineNumbers={false}
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Custom Plugins */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Creating Custom Plugins</h2>
          <p className="text-muted-foreground mb-6">
            Create your own plugins to extend @oxog/dns with custom functionality.
          </p>
          <CodeBlock code={CUSTOM_PLUGIN_CODE} language="typescript" filename="my-plugin.ts" />
        </section>

        {/* Plugin Lifecycle */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Plugin Lifecycle</h2>
          <p className="text-muted-foreground mb-6">
            Understanding the plugin lifecycle helps you write efficient plugins.
          </p>
          <CodeBlock code={LIFECYCLE_CODE} language="typescript" filename="lifecycle.ts" />
        </section>
      </div>
    </div>
  );
}
