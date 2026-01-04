import { useState } from 'react';
import { CodeBlock } from '../components/CodeBlock';

export function Playground() {
  const [domain, setDomain] = useState('example.com');
  const [recordType, setRecordType] = useState<'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' | 'NS'>('A');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // In a real implementation, this would call the actual API
      // For the playground, we'll simulate the response
      await new Promise((resolve) => setTimeout(resolve, 500));

      const responses: Record<string, Record<'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' | 'NS', string[]>> = {
        'example.com': {
          'A': ['93.184.216.34'],
          'AAAA': ['2606:2800:220:1:248:1893:25c8:1946'],
          'MX': [],
          'TXT': ['v=spf1 -all'],
          'CNAME': [],
          'NS': ['a.iana-servers.net', 'b.iana-servers.net'],
        },
        'google.com': {
          'A': ['142.250.185.46'],
          'AAAA': ['2607:f8b0:4004:800::200e'],
          'MX': [{ priority: 10, exchange: 'smtp.google.com' }].map(String),
          'TXT': ['v=spf1 include:_spf.google.com ~all'],
          'CNAME': [],
          'NS': ['ns1.google.com', 'ns2.google.com', 'ns3.google.com', 'ns4.google.com'],
        },
        'gmail.com': {
          'A': ['142.250.185.229'],
          'AAAA': ['2607:f8b0:4004:801::2005'],
          'MX': [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' },
                 { priority: 10, exchange: 'alt1.gmail-smtp-in.l.google.com' },
                 { priority: 20, exchange: 'alt2.gmail-smtp-in.l.google.com' }].map(String),
          'TXT': ['v=spf1 include:_spf.google.com ~all'],
          'CNAME': [],
          'NS': ['ns1.google.com', 'ns2.google.com', 'ns3.google.com', 'ns4.google.com'],
        },
      };

      const records = responses[domain]?.[recordType] ?? [];
      setResult(JSON.stringify(records, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">DNS Playground</h1>
      <p className="mt-2 text-muted-foreground">
        Try out DNS queries interactively. (Demo - not connected to real DNS)
      </p>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        {/* Query Form */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="domain" className="mb-1 block text-sm font-medium">
              Domain
            </label>
            <input
              id="domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium">
              Record Type
            </label>
            <select
              id="type"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as any)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="A">A (IPv4)</option>
              <option value="AAAA">AAAA (IPv6)</option>
              <option value="MX">MX (Mail)</option>
              <option value="TXT">TXT (Text)</option>
              <option value="CNAME">CNAME (Alias)</option>
              <option value="NS">NS (Nameserver)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleQuery}
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? 'Querying...' : 'Query DNS'}
            </button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="mt-6 rounded-md border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-500">Error: {error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <h3 className="mb-2 font-semibold">Results</h3>
            <CodeBlock filename="response.json" language="json">
              {result}
            </CodeBlock>
          </div>
        )}

        {/* Code Example */}
        <div className="mt-8">
          <h3 className="mb-4 font-semibold">Equivalent Code</h3>
          <CodeBlock filename="playground.ts" language="typescript">
            {`import { dns } from '@oxog/dns';

const result = await dns.resolve('${domain}', '${recordType}');
console.log(result);`}
          </CodeBlock>
        </div>
      </div>
    </div>
  );
}
