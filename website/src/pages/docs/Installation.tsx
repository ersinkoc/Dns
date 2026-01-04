import { DocsLayout } from './DocsLayout';
import { CodeBlock } from '@/components/code/CodeBlock';
import { InstallTabs } from '@/components/common/InstallTabs';

const IMPORT_EXAMPLE = `// ESM
import { dns, createResolver } from '@oxog/dns';

// CommonJS
const { dns, createResolver } = require('@oxog/dns');`;

const TYPESCRIPT_EXAMPLE = `import { dns, DnsError, DnsErrorCode } from '@oxog/dns';
import type { ResolverOptions, DnsRecord } from '@oxog/dns';

// Full type safety and autocomplete
const result = await dns.resolve('example.com', 'A');
// result is string[]

const mx = await dns.resolve('example.com', 'MX');
// mx is { priority: number; exchange: string; }[]`;

export function Installation() {
  return (
    <DocsLayout
      title="Installation"
      description="Install @oxog/dns in your Node.js project."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Requirements</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>Node.js 18.0 or higher</li>
          <li>TypeScript 5.0+ (for TypeScript users)</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Install</h2>
        <p className="text-muted-foreground mb-4">
          Install @oxog/dns using your preferred package manager:
        </p>
        <InstallTabs />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Import</h2>
        <p className="text-muted-foreground mb-4">
          @oxog/dns supports both ESM and CommonJS:
        </p>
        <CodeBlock code={IMPORT_EXAMPLE} language="typescript" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">TypeScript</h2>
        <p className="text-muted-foreground mb-4">
          @oxog/dns is written in TypeScript and includes full type definitions.
          You get complete type safety and IDE autocompletion out of the box:
        </p>
        <CodeBlock code={TYPESCRIPT_EXAMPLE} language="typescript" />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Zero Dependencies</h2>
        <p className="text-muted-foreground">
          @oxog/dns has no runtime dependencies. When you install it, you're only
          installing the package itself - no transitive dependencies to worry about.
          This means smaller node_modules, faster installs, and reduced security
          surface area.
        </p>
      </section>
    </DocsLayout>
  );
}
