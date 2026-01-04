# @oxog/dns - Zero-Dependency NPM Package

## Package Identity

| Field | Value |
|-------|-------|
| **NPM Package** | `@oxog/dns` |
| **GitHub Repository** | `https://github.com/ersinkoc/dns` |
| **Documentation Site** | `https://dns.oxog.dev` |
| **License** | MIT |
| **Author** | Ersin Koç (ersinkoc) |

> **NO social media, Discord, email, or external links allowed.**

---

## Package Description

**One-line:** Zero-dependency DNS lookup library with DNS-over-HTTPS, caching, and DNSSEC validation

A complete DNS resolution toolkit that supports all major record types (A, AAAA, MX, TXT, CNAME, NS, SRV), reverse lookups, multiple resolvers, and modern DNS-over-HTTPS (DoH) protocol. Features intelligent TTL-aware caching, configurable timeouts, and DNSSEC validation for security-critical applications. Works in Node.js with full TypeScript support.

---

## NON-NEGOTIABLE RULES

These rules are **ABSOLUTE** and must be followed without exception.

### 1. ZERO RUNTIME DEPENDENCIES

```json
{
  "dependencies": {}  // MUST BE EMPTY - NO EXCEPTIONS
}
```

- Implement EVERYTHING from scratch
- No lodash, no axios, no moment - nothing
- Write your own utilities, parsers, validators
- If you think you need a dependency, you don't
- Implement DNS protocol parsing from scratch
- Implement DoH using native fetch/http modules

**Allowed devDependencies only:**
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "tsup": "^8.0.0",
    "@types/node": "^20.0.0",
    "prettier": "^3.0.0",
    "eslint": "^9.0.0"
  }
}
```

### 2. 100% TEST COVERAGE

- Every line of code must be tested
- Every branch must be tested
- Every function must be tested
- **All tests must pass** (100% success rate)
- Use Vitest for testing
- Coverage thresholds enforced in config
- Mock DNS responses for deterministic tests

### 3. MICRO-KERNEL ARCHITECTURE

All packages MUST use plugin-based architecture:

```
┌─────────────────────────────────────────────┐
│                 User Code                    │
├─────────────────────────────────────────────┤
│           Plugin Registry API                │
│  use() · register() · unregister() · list() │
├──────────┬──────────┬──────────┬────────────┤
│  Record  │  Cache   │   DoH    │  DNSSEC    │
│  Parser  │  Plugin  │  Plugin  │  Plugin    │
├──────────┴──────────┴──────────┴────────────┤
│              Micro Kernel                    │
│   Event Bus · Lifecycle · Error Boundary    │
└─────────────────────────────────────────────┘
```

**Kernel responsibilities (minimal):**
- Plugin registration and lifecycle
- Event bus for inter-plugin communication
- Error boundary and recovery
- Configuration management
- Resolver chain management

### 4. DEVELOPMENT WORKFLOW

Create these documents **FIRST**, before any code:

1. **SPECIFICATION.md** - Complete package specification
2. **IMPLEMENTATION.md** - Architecture and design decisions  
3. **TASKS.md** - Ordered task list with dependencies

Only after all three documents are complete, implement code following TASKS.md sequentially.

### 5. TYPESCRIPT STRICT MODE

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext"
  }
}
```

### 6. LLM-NATIVE DESIGN

Package must be designed for both humans AND AI assistants:

- **llms.txt** file in root (< 2000 tokens)
- **Predictable API** naming (`resolve`, `reverse`, `createResolver`, `use`)
- **Rich JSDoc** with @example on every public API
- **15+ examples** organized by category
- **README** optimized for LLM consumption

### 7. NO EXTERNAL LINKS

- ✅ GitHub repository URL
- ✅ Custom domain (dns.oxog.dev)
- ✅ npm package URL
- ❌ Social media (Twitter, LinkedIn, etc.)
- ❌ Discord/Slack links
- ❌ Email addresses
- ❌ Donation/sponsor links

---

## CORE FEATURES

### 1. Standard DNS Record Lookup

Query standard DNS record types with automatic response parsing.

**API Example:**
```typescript
import { dns } from '@oxog/dns';

// A records (IPv4)
const ipv4 = await dns.resolve('example.com', 'A');
// ['93.184.216.34']

// AAAA records (IPv6)
const ipv6 = await dns.resolve('example.com', 'AAAA');
// ['2606:2800:220:1:248:1893:25c8:1946']

// MX records
const mx = await dns.resolve('gmail.com', 'MX');
// [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }]

// TXT records
const txt = await dns.resolve('example.com', 'TXT');
// ['v=spf1 -all', 'google-site-verification=...']

// CNAME records
const cname = await dns.resolve('www.example.com', 'CNAME');
// ['example.com']

// NS records
const ns = await dns.resolve('example.com', 'NS');
// ['a.iana-servers.net', 'b.iana-servers.net']
```

### 2. SRV Record Support

Parse SRV records for service discovery with priority and weight handling.

**API Example:**
```typescript
const srv = await dns.resolve('_sip._tcp.example.com', 'SRV');
// [{
//   priority: 10,
//   weight: 5,
//   port: 5060,
//   target: 'sipserver.example.com'
// }]

// With automatic sorting by priority/weight
const sorted = await dns.resolve('_http._tcp.example.com', 'SRV', {
  sortSrv: true
});
```

### 3. Reverse DNS Lookup

Perform reverse DNS lookups from IP addresses to hostnames.

**API Example:**
```typescript
// IPv4 reverse lookup
const hostname = await dns.reverse('8.8.8.8');
// 'dns.google'

// IPv6 reverse lookup
const hostname6 = await dns.reverse('2001:4860:4860::8888');
// 'dns.google'

// Get all PTR records
const ptrs = await dns.reverseAll('8.8.8.8');
// ['dns.google', 'dns.google.com']
```

### 4. DNS-over-HTTPS (DoH)

Secure, privacy-preserving DNS resolution using HTTPS.

**API Example:**
```typescript
// Create DoH resolver
const dohResolver = dns.createResolver({
  type: 'doh',
  server: 'https://1.1.1.1/dns-query'
});

const records = await dohResolver.resolve('example.com', 'A');

// Use with Google DNS
const googleDoh = dns.createResolver({
  type: 'doh',
  server: 'https://dns.google/dns-query'
});

// Use with Quad9
const quad9Doh = dns.createResolver({
  type: 'doh',
  server: 'https://dns.quad9.net/dns-query'
});
```

### 5. Intelligent Caching with TTL

Automatic caching with TTL-aware expiration and cache management.

**API Example:**
```typescript
const resolver = dns.createResolver({
  cache: {
    enabled: true,
    maxSize: 1000,        // Maximum entries
    respectTtl: true,      // Honor DNS TTL
    minTtl: 60,            // Minimum TTL in seconds
    maxTtl: 86400          // Maximum TTL in seconds
  }
});

// Check cache stats
const stats = resolver.getCacheStats();
// { hits: 150, misses: 20, size: 45 }

// Clear cache
resolver.clearCache();

// Clear specific entry
resolver.clearCache('example.com', 'A');
```

### 6. Multiple Resolver Support

Configure multiple upstream resolvers with automatic failover.

**API Example:**
```typescript
const resolver = dns.createResolver({
  servers: [
    '8.8.8.8',           // Primary
    '1.1.1.1',           // Secondary
    '9.9.9.9'            // Tertiary
  ],
  rotationStrategy: 'failover',  // or 'round-robin', 'random'
  healthCheck: true
});

// Add custom resolver
resolver.addServer('208.67.222.222');

// Remove resolver
resolver.removeServer('9.9.9.9');

// Get active servers
const servers = resolver.getServers();
```

### 7. Timeout and Retry Handling

Configurable timeouts with automatic retry logic.

**API Example:**
```typescript
const resolver = dns.createResolver({
  timeout: 5000,         // 5 second timeout
  retries: 3,            // Retry up to 3 times
  retryDelay: 100,       // Wait 100ms between retries
  retryBackoff: 'exponential'  // or 'linear', 'constant'
});

// Per-query timeout override
const result = await resolver.resolve('example.com', 'A', {
  timeout: 2000
});
```

### 8. DNSSEC Validation

Validate DNS responses using DNSSEC for security-critical applications.

**API Example:**
```typescript
const resolver = dns.createResolver({
  dnssec: {
    enabled: true,
    requireValid: true,   // Reject invalid responses
    trustAnchors: 'auto'  // Use built-in root trust anchors
  }
});

const result = await resolver.resolve('example.com', 'A');
// Result includes validation status

if (result.dnssecValid) {
  console.log('Response is DNSSEC validated');
}

// Check DNSSEC status
const status = await resolver.validateDnssec('example.com');
// { secure: true, reason: 'validated' }
```

---

## PLUGIN SYSTEM

### Plugin Interface

```typescript
/**
 * Plugin interface for extending DNS resolver functionality.
 * 
 * @typeParam TContext - Shared context type between plugins
 */
export interface DnsPlugin<TContext = unknown> {
  /** Unique plugin identifier (kebab-case) */
  name: string;
  
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  
  /** Other plugins this plugin depends on */
  dependencies?: string[];
  
  /**
   * Called when plugin is registered.
   * @param kernel - The DNS kernel instance
   */
  install: (kernel: DnsKernel<TContext>) => void;
  
  /**
   * Called after all plugins are installed.
   * @param context - Shared context object
   */
  onInit?: (context: TContext) => void | Promise<void>;
  
  /**
   * Called before DNS query is executed.
   * @param query - The query being executed
   */
  onQuery?: (query: DnsQuery) => void | Promise<void>;
  
  /**
   * Called after DNS response is received.
   * @param response - The response received
   */
  onResponse?: (response: DnsResponse) => void | Promise<void>;
  
  /**
   * Called when plugin is unregistered.
   */
  onDestroy?: () => void | Promise<void>;
  
  /**
   * Called on error in this plugin.
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}
```

### Core Plugins (Always Loaded)

| Plugin | Description |
|--------|-------------|
| `record-parser` | Parses DNS wire format responses into structured data |
| `resolver-chain` | Manages resolver selection and failover logic |
| `query-builder` | Builds DNS queries in wire format |

### Optional Plugins (Opt-in)

| Plugin | Description | Enable |
|--------|-------------|--------|
| `cache` | TTL-aware response caching with LRU eviction | `kernel.use(cachePlugin)` |
| `doh` | DNS-over-HTTPS transport layer | `kernel.use(dohPlugin)` |
| `dnssec` | DNSSEC signature validation | `kernel.use(dnssecPlugin)` |
| `metrics` | Query timing and statistics collection | `kernel.use(metricsPlugin)` |
| `retry` | Automatic retry with backoff | `kernel.use(retryPlugin)` |
| `logger` | Query/response logging | `kernel.use(loggerPlugin)` |

---

## API DESIGN

### Main Export

```typescript
import { dns, createResolver, DnsResolver } from '@oxog/dns';

// Default resolver (uses system DNS)
const records = await dns.resolve('example.com', 'A');

// Custom resolver with options
const resolver = createResolver({
  servers: ['8.8.8.8', '1.1.1.1'],
  timeout: 5000,
  cache: { enabled: true }
});

// Use custom resolver
const result = await resolver.resolve('example.com', 'MX');
```

### Type Definitions

```typescript
/**
 * DNS record types supported by the resolver.
 */
export type RecordType = 
  | 'A' 
  | 'AAAA' 
  | 'MX' 
  | 'TXT' 
  | 'CNAME' 
  | 'NS' 
  | 'SRV' 
  | 'PTR' 
  | 'SOA' 
  | 'CAA';

/**
 * Resolver configuration options.
 */
export interface ResolverOptions {
  /** DNS servers to query (default: system DNS) */
  servers?: string[];
  
  /** Query timeout in milliseconds (default: 5000) */
  timeout?: number;
  
  /** Number of retries on failure (default: 2) */
  retries?: number;
  
  /** Enable response caching */
  cache?: CacheOptions | boolean;
  
  /** DNSSEC validation options */
  dnssec?: DnssecOptions | boolean;
  
  /** Resolver type: 'udp', 'tcp', or 'doh' */
  type?: 'udp' | 'tcp' | 'doh';
  
  /** DoH server URL (required when type is 'doh') */
  server?: string;
}

/**
 * MX record structure.
 */
export interface MxRecord {
  /** Priority value (lower = higher priority) */
  priority: number;
  
  /** Mail exchange hostname */
  exchange: string;
}

/**
 * SRV record structure.
 */
export interface SrvRecord {
  /** Priority value (lower = higher priority) */
  priority: number;
  
  /** Weight for load balancing */
  weight: number;
  
  /** Service port number */
  port: number;
  
  /** Target hostname */
  target: string;
}

/**
 * SOA record structure.
 */
export interface SoaRecord {
  /** Primary nameserver */
  nsname: string;
  
  /** Hostmaster email */
  hostmaster: string;
  
  /** Zone serial number */
  serial: number;
  
  /** Refresh interval */
  refresh: number;
  
  /** Retry interval */
  retry: number;
  
  /** Expire time */
  expire: number;
  
  /** Minimum TTL */
  minttl: number;
}

/**
 * CAA record structure.
 */
export interface CaaRecord {
  /** Critical flag */
  critical: boolean;
  
  /** Property tag */
  tag: string;
  
  /** Property value */
  value: string;
}

/**
 * DNS query options.
 */
export interface QueryOptions {
  /** Override default timeout for this query */
  timeout?: number;
  
  /** Bypass cache for this query */
  noCache?: boolean;
  
  /** Request DNSSEC records */
  dnssec?: boolean;
}

/**
 * DNS response with metadata.
 */
export interface DnsResponse<T = unknown> {
  /** Resolved records */
  records: T[];
  
  /** Time to live in seconds */
  ttl: number;
  
  /** Whether response was from cache */
  cached: boolean;
  
  /** Query duration in milliseconds */
  duration: number;
  
  /** DNSSEC validation status */
  dnssecValid?: boolean;
  
  /** Resolver that provided the response */
  resolver: string;
}
```

---

## TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js only (uses dgram/net) |
| Module Format | ESM + CJS |
| Node.js Version | >= 18 |
| TypeScript Version | >= 5.0 |
| Bundle Size (core) | < 5KB gzipped |
| Bundle Size (all plugins) | < 15KB gzipped |

---

## LLM-NATIVE REQUIREMENTS

### 1. llms.txt File

Create `/llms.txt` in project root (< 2000 tokens):

```markdown
# @oxog/dns

> Zero-dependency DNS lookup library with DoH, caching, and DNSSEC validation

## Install

```bash
npm install @oxog/dns
```

## Basic Usage

```typescript
import { dns } from '@oxog/dns';
const records = await dns.resolve('example.com', 'A');
console.log(records); // ['93.184.216.34']
```

## API Summary

### Kernel
- `createResolver(options?)` - Create custom resolver
- `resolve(domain, type, options?)` - Query DNS records
- `reverse(ip)` - Reverse lookup
- `use(plugin)` - Register plugin

### Core Plugins
- `record-parser` - Parse DNS wire format
- `resolver-chain` - Manage resolver selection
- `query-builder` - Build DNS queries

### Optional Plugins
- `cache` - TTL-aware caching
- `doh` - DNS-over-HTTPS
- `dnssec` - DNSSEC validation
- `metrics` - Query statistics

## Common Patterns

### Multiple Record Types
```typescript
const a = await dns.resolve('example.com', 'A');
const mx = await dns.resolve('example.com', 'MX');
const txt = await dns.resolve('example.com', 'TXT');
```

### DNS-over-HTTPS
```typescript
const doh = dns.createResolver({
  type: 'doh',
  server: 'https://1.1.1.1/dns-query'
});
await doh.resolve('example.com', 'A');
```

### With Caching
```typescript
const resolver = dns.createResolver({
  cache: { enabled: true, maxSize: 1000 }
});
await resolver.resolve('example.com', 'A');
```

## Errors

| Code | Meaning | Solution |
|------|---------|----------|
| `NXDOMAIN` | Domain does not exist | Check domain spelling |
| `TIMEOUT` | Query timed out | Increase timeout or check connectivity |
| `SERVFAIL` | Server failed to respond | Try different resolver |
| `DNSSEC_INVALID` | DNSSEC validation failed | Check domain DNSSEC config |

## Links

- Docs: https://dns.oxog.dev
- GitHub: https://github.com/ersinkoc/dns
```

### 2. API Naming Standards

Use predictable patterns LLMs can infer:

```typescript
// ✅ GOOD - Predictable
resolve()           // Query DNS records
reverse()           // Reverse lookup
createResolver()    // Create resolver instance
use()               // Register plugin
getServers()        // Get configured servers
addServer()         // Add a server
removeServer()      // Remove a server
clearCache()        // Clear cache
getCacheStats()     // Get cache statistics

// ❌ BAD - Unpredictable
lookup()            // Too generic
query()             // Ambiguous with SQL
fetch()             // Ambiguous with HTTP
dns()               // Function named after package
```

### 3. Example Categories

```
examples/
├── 01-basic/
│   ├── simple-lookup.ts       # Basic A record lookup
│   ├── all-record-types.ts    # All supported types
│   ├── reverse-lookup.ts      # IP to hostname
│   └── README.md
├── 02-resolvers/
│   ├── custom-resolver.ts     # Custom DNS server
│   ├── multiple-servers.ts    # Failover setup
│   ├── doh-cloudflare.ts      # DoH with Cloudflare
│   ├── doh-google.ts          # DoH with Google
│   └── README.md
├── 03-caching/
│   ├── basic-cache.ts         # Enable caching
│   ├── cache-stats.ts         # Monitor cache
│   ├── cache-control.ts       # Manual control
│   └── README.md
├── 04-error-handling/
│   ├── timeout.ts             # Handle timeouts
│   ├── nxdomain.ts            # Handle missing domains
│   ├── retry.ts               # Retry logic
│   └── README.md
├── 05-dnssec/
│   ├── validate.ts            # Basic validation
│   ├── strict-mode.ts         # Require validation
│   └── README.md
├── 06-advanced/
│   ├── custom-plugin.ts       # Write custom plugin
│   ├── metrics.ts             # Collect metrics
│   ├── logging.ts             # Query logging
│   └── README.md
└── 07-real-world/
    ├── email-validation/      # Verify MX records
    ├── service-discovery/     # SRV-based discovery
    ├── health-check/          # DNS health monitoring
    └── README.md
```

### 4. JSDoc Example

```typescript
/**
 * Resolves DNS records for a domain.
 * 
 * @param domain - The domain name to resolve
 * @param type - The DNS record type to query
 * @param options - Optional query settings
 * @returns Promise resolving to an array of records
 * 
 * @example
 * ```typescript
 * // Simple A record lookup
 * const ips = await dns.resolve('example.com', 'A');
 * console.log(ips);
 * // Output: ['93.184.216.34']
 * 
 * // MX record lookup
 * const mx = await dns.resolve('gmail.com', 'MX');
 * console.log(mx);
 * // Output: [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }]
 * ```
 * 
 * @throws {DnsError} When the query fails
 */
export async function resolve<T extends RecordType>(
  domain: string,
  type: T,
  options?: QueryOptions
): Promise<RecordTypeMap[T][]>;
```

---

## DIRECTORY STRUCTURE

```
dns/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Website deploy only
├── src/
│   ├── index.ts                # Main entry, public exports
│   ├── kernel.ts               # Micro kernel core
│   ├── types.ts                # Type definitions
│   ├── errors.ts               # Custom error classes
│   ├── core/
│   │   ├── resolver.ts         # Base resolver logic
│   │   ├── query.ts            # Query building
│   │   ├── parser.ts           # Response parsing
│   │   └── wire.ts             # Wire format encoding/decoding
│   ├── utils/
│   │   ├── ip.ts               # IP address utilities
│   │   ├── domain.ts           # Domain validation
│   │   └── buffer.ts           # Buffer utilities
│   └── plugins/
│       ├── index.ts            # Plugin exports
│       ├── core/
│       │   ├── record-parser.ts
│       │   ├── resolver-chain.ts
│       │   └── query-builder.ts
│       └── optional/
│           ├── cache.ts
│           ├── doh.ts
│           ├── dnssec.ts
│           ├── retry.ts
│           ├── metrics.ts
│           └── logger.ts
├── tests/
│   ├── unit/
│   │   ├── kernel.test.ts
│   │   ├── parser.test.ts
│   │   ├── wire.test.ts
│   │   └── plugins/
│   ├── integration/
│   │   ├── resolve.test.ts
│   │   ├── doh.test.ts
│   │   └── cache.test.ts
│   └── fixtures/
│       ├── responses/          # Mock DNS responses
│       └── domains.ts          # Test domains
├── examples/
│   ├── 01-basic/
│   ├── 02-resolvers/
│   ├── 03-caching/
│   ├── 04-error-handling/
│   ├── 05-dnssec/
│   ├── 06-advanced/
│   └── 07-real-world/
├── website/
│   ├── public/
│   │   ├── CNAME               # dns.oxog.dev
│   │   └── llms.txt
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── llms.txt
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── .gitignore
```

---

## WEBSITE SPECIFICATION

### Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Syntax Highlighting**: Prism React Renderer
- **Icons**: Lucide React
- **Domain**: dns.oxog.dev

### IDE-Style Code Blocks

All code blocks MUST have:
- Line numbers (muted, non-selectable)
- Syntax highlighting
- Header bar with filename/language
- Copy button with "Copied!" feedback
- Rounded corners, subtle border
- Dark/light theme support

### Theme System

- Dark mode (default)
- Light mode
- Toggle button in navbar
- Persist in localStorage
- Respect system preference on first visit

### Required Pages

1. **Home** - Hero, features, install, example
2. **Getting Started** - Installation, basic usage
3. **API Reference** - Complete documentation
4. **Examples** - Organized by category
5. **Plugins** - Core, optional, custom
6. **Playground** - Interactive DNS lookup tool

### Footer

- Package name
- MIT License
- © 2025 Ersin Koç
- GitHub link only

---

## GITHUB ACTIONS

Single workflow file: `.github/workflows/deploy.yml`

```yaml
name: Deploy Website

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Build package
        run: npm run build
      
      - name: Build website
        working-directory: ./website
        run: |
          npm ci
          npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './website/dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## CONFIG FILES

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/plugins/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
});
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'website/',
        'examples/',
        '*.config.*',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
```

### package.json

```json
{
  "name": "@oxog/dns",
  "version": "1.0.0",
  "description": "Zero-dependency DNS lookup library with DoH, caching, and DNSSEC validation",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./plugins": {
      "import": {
        "types": "./dist/plugins/index.d.ts",
        "default": "./dist/plugins/index.js"
      },
      "require": {
        "types": "./dist/plugins/index.d.cts",
        "default": "./dist/plugins/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test:coverage"
  },
  "keywords": [
    "dns",
    "dns-over-https",
    "doh",
    "dnssec",
    "resolver",
    "lookup",
    "zero-dependency",
    "typescript",
    "plugin",
    "micro-kernel",
    "caching",
    "nodejs"
  ],
  "author": "Ersin Koç",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ersinkoc/dns.git"
  },
  "bugs": {
    "url": "https://github.com/ersinkoc/dns/issues"
  },
  "homepage": "https://dns.oxog.dev",
  "engines": {
    "node": ">=18"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

---

## IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Create SPECIFICATION.md with complete spec
- [ ] Create IMPLEMENTATION.md with architecture
- [ ] Create TASKS.md with ordered task list
- [ ] All three documents reviewed and complete

### During Implementation
- [ ] Follow TASKS.md sequentially
- [ ] Write tests before or with each feature
- [ ] Maintain 100% coverage throughout
- [ ] JSDoc on every public API with @example
- [ ] Create examples as features are built

### Package Completion
- [ ] All tests passing (100%)
- [ ] Coverage at 100% (lines, branches, functions)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Package builds without errors

### LLM-Native Completion
- [ ] llms.txt created (< 2000 tokens)
- [ ] llms.txt copied to website/public/
- [ ] README first 500 tokens optimized
- [ ] All public APIs have JSDoc + @example
- [ ] 15+ examples in organized folders
- [ ] package.json has 12 keywords
- [ ] API uses standard naming patterns

### Website Completion
- [ ] All pages implemented
- [ ] IDE-style code blocks with line numbers
- [ ] Copy buttons working
- [ ] Dark/Light theme toggle
- [ ] CNAME file with dns.oxog.dev
- [ ] Mobile responsive
- [ ] Footer with Ersin Koç, MIT, GitHub only

### Final Verification
- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` shows 100%
- [ ] Website builds without errors
- [ ] All examples run successfully
- [ ] README is complete and accurate

---

## BEGIN IMPLEMENTATION

Start by creating **SPECIFICATION.md** with the complete package specification based on everything above.

Then create **IMPLEMENTATION.md** with architecture decisions.

Then create **TASKS.md** with ordered, numbered tasks.

Only after all three documents are complete, begin implementing code by following TASKS.md sequentially.

**Remember:**
- This package will be published to npm
- It must be production-ready
- Zero runtime dependencies
- 100% test coverage
- Professionally documented
- LLM-native design
- Beautiful documentation website
