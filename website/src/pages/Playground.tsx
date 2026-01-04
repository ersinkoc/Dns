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
      // Use Cloudflare DNS-over-HTTPS API for real DNS queries
      const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${recordType}`;

      const response = await fetch(dohUrl, {
        headers: {
          'Accept': 'application/dns-json',
        },
      });

      if (!response.ok) {
        throw new Error(`DNS query failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract answers from the response
      const answers = data.Answer || [];

      // Format the response
      const formatted = answers.map((record: any) => {
        if (record.type === 1) return record.data; // A
        if (record.type === 28) return record.data; // AAAA
        if (record.type === 5) return record.data; // CNAME
        if (record.type === 2) return record.data; // NS
        if (record.type === 15) return `${record.data.priority} ${record.data.exchange}`; // MX
        if (record.type === 16) return record.data; // TXT (base64 encoded)
        return JSON.stringify(record.data);
      });

      if (formatted.length === 0) {
        setResult('[]');
      } else {
        setResult(JSON.stringify(formatted, null, 2));
      }
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
        Try out real DNS queries using Cloudflare's DNS-over-HTTPS API.
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
