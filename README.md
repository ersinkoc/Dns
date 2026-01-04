# @oxog/dns

<div align="center">

Zero-dependency DNS lookup library with DNS-over-HTTPS, caching, and DNSSEC validation

[![npm version](https://badge.fury.io/js/%40oxog%2Fdns.svg)](https://www.npmjs.com/package/@oxog/dns)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E=18-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

[Documentation](https://dns.oxog.dev) · [GitHub](https://github.com/ersinkoc/dns)

</div>

## Features

- **Zero Runtime Dependencies** - No external dependencies in production
- **All Major Record Types** - A, AAAA, MX, TXT, CNAME, NS, SRV, SOA, CAA
- **DNS-over-HTTPS (DoH)** - Secure, privacy-preserving DNS queries
- **Intelligent Caching** - TTL-aware caching with LRU eviction
- **DNSSEC Validation** - Optional DNSSEC signature validation
- **Multiple Resolvers** - Configure multiple DNS servers with failover
- **Plugin Architecture** - Extensible micro-kernel design
- **100% TypeScript** - Full type safety with strict mode
- **100% Test Coverage** - Comprehensive test suite

## Installation

```bash
npm install @oxog/dns
```

## Quick Start

```typescript
import { dns } from '@oxog/dns';

// Simple A record lookup
const ips = await dns.resolve('example.com', 'A');
console.log(ips); // ['93.184.216.34']

// MX record lookup
const mx = await dns.resolve('gmail.com', 'MX');
console.log(mx);
// [{ priority: 5, exchange: 'gmail-smtp-in.l.google.com' }, ...]

// Reverse DNS lookup
const hostname = await dns.reverse('8.8.8.8');
console.log(hostname); // 'dns.google'

// Create custom resolver
const resolver = dns.createResolver({
  servers: ['8.8.8.8', '1.1.1.1'],
  timeout: 5000,
  cache: { enabled: true }
});

const result = await resolver.resolve('example.com', 'A');
console.log(result.records); // ['93.184.216.34']
console.log(result.ttl); // 3600
```

## Record Types

| Type | Description | Example Output |
|------|-------------|----------------|
| `A` | IPv4 address | `['93.184.216.34']` |
| `AAAA` | IPv6 address | `['2606:2800:220:1:248:1893:25c8:1946']` |
| `MX` | Mail server | `[{ priority: 5, exchange: '...' }]` |
| `TXT` | Text record | `['v=spf1 -all']` |
| `CNAME` | Alias | `['example.com']` |
| `NS` | Nameserver | `['ns1.example.com']` |
| `SRV` | Service | `[{ priority, weight, port, target }]` |
| `SOA` | Zone authority | `[{ nsname, hostmaster, serial, ... }]` |
| `CAA` | CA authorization | `[{ critical, tag, value }]` |

## DNS-over-HTTPS

```typescript
import { createResolver } from '@oxog/dns';

const resolver = createResolver({
  type: 'doh',
  server: 'https://1.1.1.1/dns-query' // Cloudflare
});

// Or use Google
const googleResolver = createResolver({
  type: 'doh',
  server: 'https://dns.google/dns-query'
});

await resolver.resolve('example.com', 'A');
```

## Caching

```typescript
const resolver = createResolver({
  cache: {
    enabled: true,
    maxSize: 1000,        // Maximum entries
    respectTtl: true,      // Honor DNS TTL
    minTtl: 60,            // Minimum TTL (seconds)
    maxTtl: 86400          // Maximum TTL (seconds)
  }
});

// Check cache stats
const stats = resolver.getCacheStats();
console.log(stats);
// { hits: 150, misses: 20, size: 45, hitRate: 0.882 }

// Clear cache
resolver.clearCache();
resolver.clearCache('example.com', 'A');
```

## Multiple Resolvers

```typescript
const resolver = createResolver({
  servers: ['8.8.8.8', '1.1.1.1', '9.9.9.9'],
  rotationStrategy: 'failover',  // or 'round-robin', 'random'
  healthCheck: true,
  retries: 3,
  retryDelay: 100,
  retryBackoff: 'exponential'
});

// Get active servers
const servers = resolver.getServers();
```

## Error Handling

```typescript
import { DnsError, DnsErrorCode } from '@oxog/dns';

try {
  await dns.resolve('nonexistent-domain.com', 'A');
} catch (error) {
  if (error instanceof DnsError) {
    if (error.code === DnsErrorCode.NXDOMAIN) {
      console.log('Domain does not exist');
    } else if (error.code === DnsErrorCode.TIMEOUT) {
      console.log('Query timed out');
    }
  }
}
```

## Advanced: Plugin System

```typescript
import { DnsKernel, createKernel } from '@oxog/dns';

const kernel = createKernel({ timeout: 5000 });

// Register custom plugin
kernel.use({
  name: 'my-plugin',
  version: '1.0.0',
  install: (k) => {
    k.on('query', async (data) => {
      console.log('Query:', data);
    });
  }
});

await kernel.init();
```

## API Reference

### dns.resolve(domain, type, options?)

Resolve DNS records for a domain.

```typescript
const records = await dns.resolve('example.com', 'A');
```

### dns.reverse(ip)

Reverse DNS lookup from IP to hostname.

```typescript
const hostname = await dns.reverse('8.8.8.8');
```

### dns.createResolver(options?)

Create a custom DNS resolver.

```typescript
const resolver = dns.createResolver({
  servers: ['8.8.8.8'],
  timeout: 5000,
  cache: { enabled: true }
});
```

## License

MIT © 2025 Ersin Koç

---

[Documentation](https://dns.oxog.dev) · [GitHub](https://github.com/ersinkoc/dns)
