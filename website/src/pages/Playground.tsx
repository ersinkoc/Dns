import { useState } from 'react';
import { Play, RotateCcw, Globe, Server, Clock, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { CodeBlock } from '@/components/code/CodeBlock';
import { cn } from '@/lib/utils';

type RecordType = 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' | 'NS';

const RECORD_TYPES: { value: RecordType; label: string }[] = [
  { value: 'A', label: 'A (IPv4)' },
  { value: 'AAAA', label: 'AAAA (IPv6)' },
  { value: 'MX', label: 'MX (Mail)' },
  { value: 'TXT', label: 'TXT (Text)' },
  { value: 'CNAME', label: 'CNAME (Alias)' },
  { value: 'NS', label: 'NS (Nameserver)' },
];

const EXAMPLE_DOMAINS = [
  'example.com',
  'google.com',
  'github.com',
  'cloudflare.com',
  'gmail.com',
];

interface QueryResult {
  records: string[];
  ttl: number;
  server: string;
  duration: number;
}

export function Playground() {
  const [domain, setDomain] = useState('example.com');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const startTime = performance.now();

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
      const duration = Math.round(performance.now() - startTime);

      // Check for errors
      if (data.Status !== 0) {
        const errorMessages: Record<number, string> = {
          1: 'Format error',
          2: 'Server failure',
          3: 'Domain does not exist (NXDOMAIN)',
          4: 'Not implemented',
          5: 'Query refused',
        };
        throw new Error(errorMessages[data.Status] || 'Unknown DNS error');
      }

      // Extract answers from the response
      const answers = data.Answer || [];
      const ttl = answers.length > 0 ? answers[0].TTL : 0;

      // Format the response based on record type
      const records = answers.map((record: { type: number; data: string }) => {
        return record.data;
      });

      setResult({
        records,
        ttl,
        server: '1.1.1.1 (Cloudflare)',
        duration,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDomain('example.com');
    setRecordType('A');
    setResult(null);
    setError(null);
  };

  const generatedCode = `import { dns } from '@oxog/dns';

const result = await dns.resolve('${domain}', '${recordType}');
console.log(result);
// ${result ? JSON.stringify(result.records) : "['...']"}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">DNS Playground</h1>
          <p className="text-lg text-muted-foreground">
            Try out real DNS queries using Cloudflare's DNS-over-HTTPS API.
          </p>
        </header>

        {/* Info banner */}
        <div className="mb-8 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Live DNS Queries</p>
              <p className="text-sm text-muted-foreground">
                Queries are executed in real-time using Cloudflare's DoH endpoint.
              </p>
            </div>
          </div>
        </div>

        {/* Query Form */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Domain Input */}
            <div className="flex-1">
              <label htmlFor="domain" className="block text-sm font-medium mb-2">
                Domain
              </label>
              <input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-4 py-2.5',
                  'text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                )}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              />
              <div className="flex gap-2 mt-2">
                {EXAMPLE_DOMAINS.slice(0, 3).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Record Type Select */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-2">
                Record Type
              </label>
              <select
                id="type"
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as RecordType)}
                className={cn(
                  'rounded-lg border border-border bg-background px-4 py-2.5',
                  'text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                )}
              >
                {RECORD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm',
                  'border border-border hover:bg-accent transition-colors'
                )}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={handleQuery}
                disabled={loading || !domain}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Play className="w-4 h-4" />
                {loading ? 'Querying...' : 'Query DNS'}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-xl border border-destructive/50 bg-destructive/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Query Failed</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-semibold">Query Results</h2>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Server className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">DNS Server</div>
                  <div className="text-sm font-medium">{result.server}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Query Time</div>
                  <div className="text-sm font-medium">{result.duration}ms</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">TTL</div>
                  <div className="text-sm font-medium">{result.ttl}s</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Records</div>
                  <div className="text-sm font-medium">{result.records.length} found</div>
                </div>
              </div>
            </div>

            {/* Records */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Records</h3>
              {result.records.length > 0 ? (
                <div className="space-y-2">
                  {result.records.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <code className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                        {recordType}
                      </code>
                      <code className="text-sm font-mono">{record}</code>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No records found</p>
              )}
            </div>
          </div>
        )}

        {/* Code Example */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Equivalent Code</h2>
          <CodeBlock
            code={generatedCode}
            language="typescript"
            filename="query.ts"
          />
        </div>
      </div>
    </div>
  );
}
