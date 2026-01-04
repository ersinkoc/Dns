export const PACKAGE_NAME = '@oxog/dns';
export const PACKAGE_SHORT_NAME = 'dns';
export const GITHUB_REPO = 'ersinkoc/dns';
export const NPM_PACKAGE = '@oxog/dns';
export const VERSION = '1.0.0';
export const DESCRIPTION = 'Zero-dependency DNS lookup library with DoH, caching, and DNSSEC validation';
export const DOMAIN = 'dns.oxog.dev';
export const AUTHOR = 'Ersin KOC';
export const AUTHOR_GITHUB = 'https://github.com/ersinkoc';

export const NAV_LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/api', label: 'API' },
  { href: '/examples', label: 'Examples' },
  { href: '/plugins', label: 'Plugins' },
  { href: '/playground', label: 'Playground' },
] as const;

export const DOCS_SIDEBAR = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs', label: 'Introduction' },
      { href: '/docs/installation', label: 'Installation' },
      { href: '/docs/quick-start', label: 'Quick Start' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { href: '/docs/resolvers', label: 'Resolvers' },
      { href: '/docs/record-types', label: 'Record Types' },
      { href: '/docs/caching', label: 'Caching' },
      { href: '/docs/doh', label: 'DNS-over-HTTPS' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { href: '/docs/dnssec', label: 'DNSSEC Validation' },
      { href: '/docs/error-handling', label: 'Error Handling' },
      { href: '/docs/plugins', label: 'Plugin System' },
    ],
  },
] as const;

export const RECORD_TYPES = [
  { type: 'A', description: 'IPv4 address', example: "['93.184.216.34']" },
  { type: 'AAAA', description: 'IPv6 address', example: "['2606:2800:220:1:248:1893:25c8:1946']" },
  { type: 'MX', description: 'Mail server', example: "[{ priority: 5, exchange: '...' }]" },
  { type: 'TXT', description: 'Text record', example: "['v=spf1 -all']" },
  { type: 'CNAME', description: 'Alias', example: "['example.com']" },
  { type: 'NS', description: 'Nameserver', example: "['ns1.example.com']" },
  { type: 'SRV', description: 'Service record', example: "[{ priority, weight, port, target }]" },
  { type: 'SOA', description: 'Zone authority', example: "[{ nsname, hostmaster, serial, ... }]" },
  { type: 'CAA', description: 'CA authorization', example: "[{ critical, tag, value }]" },
  { type: 'PTR', description: 'Reverse DNS', example: "['dns.google']" },
] as const;

export const FEATURES = [
  {
    icon: 'Zap',
    title: 'Zero Dependencies',
    description: 'No runtime dependencies. Everything is implemented from scratch for maximum control and minimal bundle size.',
  },
  {
    icon: 'Shield',
    title: 'DNS-over-HTTPS',
    description: 'Secure, privacy-preserving DNS queries with support for Cloudflare, Google, and Quad9.',
  },
  {
    icon: 'Database',
    title: 'Intelligent Caching',
    description: 'TTL-aware caching with LRU eviction, configurable limits, and automatic expiration.',
  },
  {
    icon: 'Lock',
    title: 'DNSSEC Validation',
    description: 'Optional DNSSEC signature validation for security-critical applications.',
  },
  {
    icon: 'Puzzle',
    title: 'Plugin Architecture',
    description: 'Extensible micro-kernel design with plugin system for custom functionality.',
  },
  {
    icon: 'FileCode',
    title: 'TypeScript Native',
    description: '100% TypeScript with strict mode. Full type safety and excellent IDE support.',
  },
] as const;
