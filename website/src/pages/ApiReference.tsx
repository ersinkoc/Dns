import { CodeBlock } from '../components/CodeBlock';

export function ApiReference() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">API Reference</h1>

      <div className="mt-8 space-y-12">
        {/* dns.resolve */}
        <section>
          <h2 className="text-2xl font-semibold">dns.resolve(domain, type, options?)</h2>
          <p className="mt-2 text-muted-foreground">
            Resolve DNS records for a domain.
          </p>
          <CodeBlock filename="api.ts" language="typescript">
            {`async resolve<T extends RecordType>(
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
});`}
          </CodeBlock>
        </section>

        {/* dns.reverse */}
        <section>
          <h2 className="text-2xl font-semibold">dns.reverse(ip)</h2>
          <p className="mt-2 text-muted-foreground">
            Reverse DNS lookup from IP address to hostname.
          </p>
          <CodeBlock filename="api.ts" language="typescript">
            {`async reverse(ip: string): Promise<string>

// Example
const hostname = await dns.reverse('8.8.8.8');
// 'dns.google'

const hostname6 = await dns.reverse('2001:4860:4860::8888');
// 'dns.google'`}
          </CodeBlock>
        </section>

        {/* dns.reverseAll */}
        <section>
          <h2 className="text-2xl font-semibold">dns.reverseAll(ip)</h2>
          <p className="mt-2 text-muted-foreground">
            Get all PTR records for an IP address.
          </p>
          <CodeBlock filename="api.ts" language="typescript">
            {`async reverseAll(ip: string): Promise<string[]>

// Example
const ptrs = await dns.reverseAll('8.8.8.8');
// ['dns.google', 'dns.google.com']`}
          </CodeBlock>
        </section>

        {/* dns.createResolver */}
        <section>
          <h2 className="text-2xl font-semibold">dns.createResolver(options?)</h2>
          <p className="mt-2 text-muted-foreground">
            Create a custom DNS resolver with specific options.
          </p>
          <CodeBlock filename="api.ts" language="typescript">
            {`createResolver(options?: ResolverOptions): DnsResolver

// Example
const resolver = dns.createResolver({
  servers: ['8.8.8.8', '1.1.1.1'],
  timeout: 5000,
  retries: 3,
  cache: { enabled: true },
  dnssec: { enabled: true }
});

const result = await resolver.resolve('example.com', 'A');`}
          </CodeBlock>
        </section>

        {/* ResolverOptions */}
        <section>
          <h2 className="text-2xl font-semibold">ResolverOptions</h2>
          <p className="mt-2 text-muted-foreground">
            Configuration options for creating a resolver.
          </p>
          <CodeBlock filename="types.ts" language="typescript">
            {`interface ResolverOptions {
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
}`}
          </CodeBlock>
        </section>

        {/* Record Types */}
        <section>
          <h2 className="text-2xl font-semibold">Record Types</h2>
          <p className="mt-2 text-muted-foreground">
            Supported DNS record types.
          </p>
          <CodeBlock filename="types.ts" language="typescript">
            {`type RecordType =
  | 'A'      // IPv4 address
  | 'AAAA'   // IPv6 address
  | 'MX'     // Mail server
  | 'TXT'    // Text record
  | 'CNAME'  // Alias
  | 'NS'     // Nameserver
  | 'SRV'    // Service record
  | 'PTR'    // Reverse DNS
  | 'SOA'    // Zone authority
  | 'CAA';   // CA authorization`}
          </CodeBlock>
        </section>

        {/* Error Codes */}
        <section>
          <h2 className="text-2xl font-semibold">Error Codes</h2>
          <p className="mt-2 text-muted-foreground">
            DNS error codes for error handling.
          </p>
          <CodeBlock filename="errors.ts" language="typescript">
            {`enum DnsErrorCode {
  NXDOMAIN = 'NXDOMAIN',           // Domain does not exist
  TIMEOUT = 'TIMEOUT',             // Query timed out
  SERVFAIL = 'SERVFAIL',           // Server failed
  DNSSEC_INVALID = 'DNSSEC_INVALID', // DNSSEC validation failed
  INVALID_QUERY = 'INVALID_QUERY',  // Invalid query
  NETWORK_ERROR = 'NETWORK_ERROR',  // Network error
  UNKNOWN = 'UNKNOWN'              // Unknown error
}`}
          </CodeBlock>
        </section>
      </div>
    </div>
  );
}
