# Basic DNS Examples

This folder contains basic examples for using `@oxog/dns`.

## Examples

- **simple-lookup.ts** - Basic DNS record lookup for common record types
- **all-record-types.ts** - Demonstrates all supported DNS record types
- **reverse-lookup.ts** - Reverse DNS lookups (IP to hostname)

## Running the Examples

```bash
# Using tsx or ts-node
npx tsx simple-lookup.ts

# Or compile and run
tsc simple-lookup.ts --module esnext --moduleResolution bundler --target es2022
node simple-lookup.js
```

## Common Record Types

| Type | Description | Example Output |
|------|-------------|----------------|
| A | IPv4 address | `['93.184.216.34']` |
| AAAA | IPv6 address | `['2606:2800:220:1:248:1893:25c8:1946']` |
| MX | Mail server | `[{ priority: 5, exchange: '...' }]` |
| TXT | Text record | `['v=spf1 -all']` |
| CNAME | Alias | `['example.com']` |
| NS | Nameserver | `['ns1.example.com']` |
| SRV | Service | `[{ priority, weight, port, target }]` |
| SOA | Zone authority | `[{ nsname, hostmaster, ... }]` |
