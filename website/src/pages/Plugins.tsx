import { CodeBlock } from '../components/CodeBlock';

export function Plugins() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Plugins</h1>
      <p className="mt-2 text-muted-foreground">
        @oxog/dns uses a micro-kernel architecture with a plugin system for extensibility.
      </p>

      <div className="mt-8 space-y-12">
        {/* Core Plugins */}
        <section>
          <h2 className="text-2xl font-semibold">Core Plugins</h2>
          <p className="mt-2 text-muted-foreground">
            These plugins are automatically loaded by the resolver.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold">record-parser</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Parses DNS wire format responses into structured data.
              </p>
              <CodeBlock filename="record-parser.ts" language="typescript">
                {`import { recordParserPlugin } from '@oxog/dns/plugins';

const kernel = createKernel();
kernel.use(recordParserPlugin);`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">resolver-chain</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Manages resolver selection and failover logic.
              </p>
              <CodeBlock filename="resolver-chain.ts" language="typescript">
                {`import { resolverChainPlugin } from '@oxog/dns/plugins';

const kernel = createKernel({
  servers: ['8.8.8.8', '1.1.1.1'],
  rotationStrategy: 'failover'
});

kernel.use(resolverChainPlugin);

// Get next resolver
import { getNextResolver } from '@oxog/dns/plugins';
const server = getNextResolver(kernel);`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">query-builder</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Builds DNS queries in wire format.
              </p>
              <CodeBlock filename="query-builder.ts" language="typescript">
                {`import { queryBuilderPlugin } from '@oxog/dns/plugins';

const kernel = createKernel();
kernel.use(queryBuilderPlugin);

// Build query
import { buildQueryWithKernel } from '@oxog/dns/plugins';
const [queryId, buffer] = buildQueryWithKernel(kernel, 'example.com', 'A');`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Optional Plugins */}
        <section>
          <h2 className="text-2xl font-semibold">Optional Plugins</h2>
          <p className="mt-2 text-muted-foreground">
            These plugins can be enabled as needed.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold">cache</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                TTL-aware response caching with LRU eviction.
              </p>
              <CodeBlock filename="cache.ts" language="typescript">
                {`import { cachePlugin } from '@oxog/dns/plugins';

const kernel = createKernel();
kernel.use(cachePlugin);

// Use cache
import { cacheGet, cacheSet } from '@oxog/dns/plugins';
cacheSet(kernel, 'example.com:A', records, 3600);
const cached = cacheGet(kernel, 'example.com:A');`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">doh</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                DNS-over-HTTPS transport layer.
              </p>
              <CodeBlock filename="doh.ts" language="typescript">
                {`import { dohPlugin } from '@oxog/dns/plugins';

const kernel = createKernel({ type: 'doh' });
kernel.use(dohPlugin);

// Execute DoH query
import { dohQuery } from '@oxog/dns/plugins';
const buffer = await dohQuery(kernel, queryBuffer);`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">dnssec</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                DNSSEC signature validation.
              </p>
              <CodeBlock filename="dnssec.ts" language="typescript">
                {`import { dnssecPlugin } from '@oxog/dns/plugins';

const kernel = createKernel({
  dnssec: { enabled: true, requireValid: true }
});

kernel.use(dnssecPlugin);

// Validate DNSSEC
import { validateDnssec } from '@oxog/dns/plugins';
const result = await validateDnssec(kernel, 'example.com');`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">retry</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Automatic retry with backoff strategies.
              </p>
              <CodeBlock filename="retry.ts" language="typescript">
                {`import { retryPlugin } from '@oxog/dns/plugins';

const kernel = createKernel({
  retries: 3,
  retryBackoff: 'exponential'
});

kernel.use(retryPlugin);

// Execute with retry
import { withRetry } from '@oxog/dns/plugins';
const result = await withRetry(kernel, async () => {
  return await fetch('https://example.com');
});`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">metrics</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Query timing and statistics collection.
              </p>
              <CodeBlock filename="metrics.ts" language="typescript">
                {`import { metricsPlugin } from '@oxog/dns/plugins';

const kernel = createKernel();
kernel.use(metricsPlugin);

// Record metric
import { recordMetric } from '@oxog/dns/plugins';
recordMetric(kernel, {
  name: 'query-duration',
  value: 45,
  timestamp: Date.now()
});

// Get stats
import { getMetricStats } from '@oxog/dns/plugins';
const stats = getMetricStats(kernel, 'query-duration');`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">logger</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Query/response logging.
              </p>
              <CodeBlock filename="logger.ts" language="typescript">
                {`import { loggerPlugin } from '@oxog/dns/plugins';

const kernel = createKernel();
kernel.use(loggerPlugin);

// Log messages
import { log, getLogs } from '@oxog/dns/plugins';
log(kernel, 'info', 'Custom message', { key: 'value' });
const logs = getLogs(kernel);`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Custom Plugins */}
        <section>
          <h2 className="text-2xl font-semibold">Custom Plugins</h2>
          <p className="mt-2 text-muted-foreground">
            Create your own plugins to extend functionality.
          </p>
          <CodeBlock filename="custom-plugin.ts" language="typescript">
            {`import type { DnsPlugin } from '@oxog/dns';

const myPlugin: DnsPlugin = {
  name: 'my-plugin',
  version: '1.0.0',

  install(kernel) {
    // Register event listeners
    kernel.on('query', async (data) => {
      console.log('Query:', data);
    });

    kernel.on('response', async (data) => {
      console.log('Response:', data);
    });
  },

  async onInit(context) {
    // Initialize after all plugins installed
  },

  onDestroy() {
    // Cleanup
  }
};

// Use the plugin
const kernel = createKernel();
kernel.use(myPlugin);
await kernel.init();`}
          </CodeBlock>
        </section>
      </div>
    </div>
  );
}
