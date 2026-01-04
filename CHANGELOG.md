# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-04

### Added

- Initial release of `@oxog/dns`
- Zero-dependency DNS resolution library
- Support for all major DNS record types (A, AAAA, MX, TXT, CNAME, NS, SRV, SOA, CAA)
- DNS-over-HTTPS (DoH) support with Cloudflare, Google, and Quad9
- Intelligent TTL-aware caching with LRU eviction
- DNSSEC validation support
- Multiple resolver support with failover, round-robin, and random strategies
- Configurable timeouts and retry logic with exponential backoff
- Micro-kernel plugin architecture for extensibility
- Reverse DNS lookup (IP to hostname)
- Full TypeScript support with strict mode
- 100% test coverage with Vitest
- 20+ example files organized by category
- Comprehensive API documentation
- LLM-native design with llms.txt

### Core Plugins

- `record-parser` - DNS wire format parser
- `resolver-chain` - Resolver selection and failover
- `query-builder` - DNS query construction

### Optional Plugins

- `cache` - TTL-aware response caching
- `doh` - DNS-over-HTTPS transport
- `dnssec` - DNSSEC signature validation
- `retry` - Automatic retry with backoff
- `metrics` - Query timing and statistics
- `logger` - Query/response logging

### Documentation

- Complete README with quick start guide
- API reference for all public methods
- 20+ working examples
- Interactive website (https://dns.oxog.dev)

## [Unreleased]

### Planned

- EDNS0 support
- DNS over TLS (DoT)
- DNS over QUIC (DoQ)
- Zone transfer (AXFR/IXFR)
- DNS update support
- More caching strategies
- Persistent cache storage
