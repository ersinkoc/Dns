import { CodeBlock } from '@/components/code/CodeBlock';
import { cn } from '@/lib/utils';

const API_SECTIONS = [
  {
    id: 'resolve',
    title: 'dns.resolve(domain, type, options?)',
    description: 'Resolve DNS records for a domain.',
    code: `async resolve<T extends RecordType>(
  domain: string,
  type: T,
  options?: QueryOptions
): Promise<RecordTypeMap[T][]>

// Example
const ips = await dns.resolve('example.com', 'A');
// ['93.184.216.34']

const mx = await dns.resolve('gmail.com', 'MX');
// [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }]

// With options
const result = await dns.resolve('example.com', 'A', {
  timeout: 2000,   // 2 second timeout
  noCache: true,   // Bypass cache
  dnssec: true     // Request DNSSEC records
});`,
    params: [
      { name: 'domain', type: 'string', description: 'The domain name to resolve' },
      { name: 'type', type: 'RecordType', description: 'The DNS record type (A, AAAA, MX, etc.)' },
      { name: 'options', type: 'QueryOptions', description: 'Optional query configuration' },
    ],
  },
  {
    id: 'reverse',
    title: 'dns.reverse(ip)',
    description: 'Reverse DNS lookup from IP address to hostname.',
    code: `async reverse(ip: string): Promise<string>

// Example
const hostname = await dns.reverse('8.8.8.8');
// 'dns.google'

const hostname6 = await dns.reverse('2001:4860:4860::8888');
// 'dns.google'`,
    params: [
      { name: 'ip', type: 'string', description: 'IPv4 or IPv6 address' },
    ],
  },
  {
    id: 'createResolver',
    title: 'createResolver(options?)',
    description: 'Create a custom DNS resolver with specific options.',
    code: `createResolver(options?: ResolverOptions): DnsResolver

// Example
const resolver = createResolver({
  servers: ['8.8.8.8', '1.1.1.1'],
  timeout: 5000,
  retries: 3,
  cache: { enabled: true },
  dnssec: { enabled: true }
});

const result = await resolver.resolve('example.com', 'A');
console.log(result.records); // ['93.184.216.34']
console.log(result.ttl);     // 3600
console.log(result.cached);  // false`,
    params: [
      { name: 'options', type: 'ResolverOptions', description: 'Resolver configuration options' },
    ],
  },
];

const TYPES_CODE = `interface ResolverOptions {
  /** DNS servers to query (default: system DNS) */
  servers?: string[];

  /** Query timeout in milliseconds (default: 5000) */
  timeout?: number;

  /** Number of retries on failure (default: 2) */
  retries?: number;

  /** Delay between retries in milliseconds (default: 100) */
  retryDelay?: number;

  /** Retry backoff strategy (default: 'exponential') */
  retryBackoff?: 'exponential' | 'linear' | 'constant';

  /** Enable response caching */
  cache?: CacheOptions | boolean;

  /** DNSSEC validation options */
  dnssec?: DnssecOptions | boolean;

  /** Resolver type: 'udp', 'tcp', or 'doh' */
  type?: 'udp' | 'tcp' | 'doh';

  /** DoH server URL (required when type is 'doh') */
  server?: string;

  /** Server rotation strategy */
  rotationStrategy?: 'failover' | 'round-robin' | 'random';

  /** Enable server health checks */
  healthCheck?: boolean;
}

interface CacheOptions {
  enabled: boolean;
  maxSize?: number;      // Maximum cache entries (default: 1000)
  respectTtl?: boolean;  // Honor DNS TTL (default: true)
  minTtl?: number;       // Minimum TTL in seconds (default: 60)
  maxTtl?: number;       // Maximum TTL in seconds (default: 86400)
}`;

const RECORD_TYPES_CODE = `type RecordType =
  | 'A'      // IPv4 address -> string[]
  | 'AAAA'   // IPv6 address -> string[]
  | 'MX'     // Mail server -> { priority: number; exchange: string; }[]
  | 'TXT'    // Text record -> string[]
  | 'CNAME'  // Alias -> string[]
  | 'NS'     // Nameserver -> string[]
  | 'SRV'    // Service -> { priority: number; weight: number; port: number; target: string; }[]
  | 'PTR'    // Reverse DNS -> string[]
  | 'SOA'    // Zone authority -> { nsname: string; hostmaster: string; serial: number; ... }[]
  | 'CAA';   // CA authorization -> { critical: boolean; tag: string; value: string; }[]`;

const ERROR_CODE = `import { DnsError, DnsErrorCode } from '@oxog/dns';

try {
  await dns.resolve('nonexistent-domain.com', 'A');
} catch (error) {
  if (error instanceof DnsError) {
    switch (error.code) {
      case DnsErrorCode.NXDOMAIN:
        console.log('Domain does not exist');
        break;
      case DnsErrorCode.TIMEOUT:
        console.log('Query timed out');
        break;
      case DnsErrorCode.SERVFAIL:
        console.log('Server failed');
        break;
      case DnsErrorCode.DNSSEC_INVALID:
        console.log('DNSSEC validation failed');
        break;
    }
  }
}

// Error codes
enum DnsErrorCode {
  NXDOMAIN = 'NXDOMAIN',
  TIMEOUT = 'TIMEOUT',
  SERVFAIL = 'SERVFAIL',
  DNSSEC_INVALID = 'DNSSEC_INVALID',
  INVALID_QUERY = 'INVALID_QUERY',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}`;

export function ApiReference() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">API Reference</h1>
          <p className="text-lg text-muted-foreground">
            Complete API documentation for @oxog/dns.
          </p>
        </header>

        {/* Table of contents */}
        <nav className="mb-12 p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-4">Contents</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#functions" className="text-muted-foreground hover:text-foreground transition-colors">
                Functions
              </a>
              <ul className="ml-4 mt-2 space-y-1">
                {API_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                      {section.title.split('(')[0]}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <a href="#types" className="text-muted-foreground hover:text-foreground transition-colors">
                Types
              </a>
            </li>
            <li>
              <a href="#record-types" className="text-muted-foreground hover:text-foreground transition-colors">
                Record Types
              </a>
            </li>
            <li>
              <a href="#errors" className="text-muted-foreground hover:text-foreground transition-colors">
                Error Handling
              </a>
            </li>
          </ul>
        </nav>

        {/* Functions */}
        <section id="functions" className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Functions</h2>
          <div className="space-y-12">
            {API_SECTIONS.map((section) => (
              <div key={section.id} id={section.id}>
                <h3 className="text-xl font-semibold font-mono mb-2">{section.title}</h3>
                <p className="text-muted-foreground mb-4">{section.description}</p>

                {/* Parameters table */}
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium">Parameter</th>
                        <th className="text-left py-2 pr-4 font-medium">Type</th>
                        <th className="text-left py-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.params.map((param) => (
                        <tr key={param.name} className="border-b border-border/50">
                          <td className="py-2 pr-4">
                            <code className="text-primary">{param.name}</code>
                          </td>
                          <td className="py-2 pr-4">
                            <code className="text-muted-foreground">{param.type}</code>
                          </td>
                          <td className="py-2 text-muted-foreground">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <CodeBlock code={section.code} language="typescript" />
              </div>
            ))}
          </div>
        </section>

        {/* Types */}
        <section id="types" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Types</h2>
          <p className="text-muted-foreground mb-4">
            Configuration options for creating a resolver.
          </p>
          <CodeBlock code={TYPES_CODE} language="typescript" filename="types.ts" />
        </section>

        {/* Record Types */}
        <section id="record-types" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Record Types</h2>
          <p className="text-muted-foreground mb-4">
            Supported DNS record types and their return values.
          </p>
          <CodeBlock code={RECORD_TYPES_CODE} language="typescript" filename="types.ts" />
        </section>

        {/* Error Handling */}
        <section id="errors">
          <h2 className="text-2xl font-bold mb-4">Error Handling</h2>
          <p className="text-muted-foreground mb-4">
            @oxog/dns throws <code className="px-1.5 py-0.5 rounded bg-muted text-sm">DnsError</code> with
            specific error codes for different failure scenarios.
          </p>
          <CodeBlock code={ERROR_CODE} language="typescript" filename="errors.ts" />
        </section>
      </div>
    </div>
  );
}
