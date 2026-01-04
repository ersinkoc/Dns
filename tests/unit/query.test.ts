/**
 * Query builder tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildQuery,
  buildQueryWithId,
  resetQueryIdCounter,
  setQueryIdCounter,
  getQueryIdCounter,
} from '../../src/core/query.js';
import { ValidationError } from '../../src/errors.js';
import { encodeName } from '../../src/core/wire.js';

describe('buildQuery', () => {
  beforeEach(() => {
    resetQueryIdCounter();
  });

  it('should build A query with default options', () => {
    resetQueryIdCounter();
    const query = buildQuery('example.com', 'A');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should build AAAA query', () => {
    const query = buildQuery('example.com', 'AAAA');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should build MX query', () => {
    const query = buildQuery('example.com', 'MX');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should build TXT query', () => {
    const query = buildQuery('example.com', 'TXT');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should build CNAME query', () => {
    const query = buildQuery('example.com', 'CNAME');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should build NS query', () => {
    const query = buildQuery('example.com', 'NS');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should build PTR query', () => {
    const query = buildQuery('example.com', 'PTR');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should build SOA query', () => {
    const query = buildQuery('example.com', 'SOA');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should build SRV query', () => {
    const query = buildQuery('example.com', 'SRV');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should build CAA query', () => {
    const query = buildQuery('example.com', 'CAA');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.length).toBeGreaterThan(12);
  });

  it('should set RD flag by default', () => {
    const query = buildQuery('example.com', 'A');
    // Flags at offset 2, RD bit is 0x0100
    const flags = query.readUInt16BE(2);
    expect(flags & 0x0100).toBe(0x0100);
  });

  it('should set RD flag when recursionDesired is true', () => {
    const query = buildQuery('example.com', 'A', { recursionDesired: true });
    const flags = query.readUInt16BE(2);
    expect(flags & 0x0100).toBe(0x0100);
  });

  it('should not set RD flag when recursionDesired is false', () => {
    const query = buildQuery('example.com', 'A', { recursionDesired: false });
    const flags = query.readUInt16BE(2);
    expect(flags & 0x0100).toBe(0);
  });

  it('should generate sequential query IDs', () => {
    const query1 = buildQuery('example.com', 'A');
    const query2 = buildQuery('example.com', 'A');
    const query3 = buildQuery('example.com', 'A');

    const id1 = query1.readUInt16BE(0);
    const id2 = query2.readUInt16BE(0);
    const id3 = query3.readUInt16BE(0);

    expect(id2).toBe(id1 + 1);
    expect(id3).toBe(id2 + 1);
  });

  it('should wrap query ID at 65535', () => {
    setQueryIdCounter(65534);
    const query1 = buildQuery('example.com', 'A');
    const query2 = buildQuery('example.com', 'A');

    const id1 = query1.readUInt16BE(0);
    const id2 = query2.readUInt16BE(0);

    expect(id1).toBe(65535);
    expect(id2).toBe(0); // Wrapped around
  });

  it('should handle domain with subdomain', () => {
    const query = buildQuery('www.example.com', 'A');
    expect(query).toBeInstanceOf(Buffer);
  });

  it('should handle domain with many labels', () => {
    const query = buildQuery('a.b.c.d.e.f.example.com', 'A');
    expect(query).toBeInstanceOf(Buffer);
  });

  it('should set QDCOUNT to 1', () => {
    const query = buildQuery('example.com', 'A');
    const qdcount = query.readUInt16BE(4);
    expect(qdcount).toBe(1);
  });

  it('should set ANCOUNT to 0', () => {
    const query = buildQuery('example.com', 'A');
    const ancount = query.readUInt16BE(6);
    expect(ancount).toBe(0);
  });

  it('should set NSCOUNT to 0', () => {
    const query = buildQuery('example.com', 'A');
    const nscount = query.readUInt16BE(8);
    expect(nscount).toBe(0);
  });

  it('should set ARCOUNT to 0', () => {
    const query = buildQuery('example.com', 'A');
    const arcount = query.readUInt16BE(10);
    expect(arcount).toBe(0);
  });

  it('should encode domain name correctly', () => {
    const query = buildQuery('example.com', 'A');

    // Find the domain name in the query (starts after header at offset 12)
    const encodedDomain = encodeName('example.com');

    // The encoded domain should match (starts at offset 12)
    expect(query.subarray(12, 12 + encodedDomain.length)).toEqual(encodedDomain);

    // Query should have: header (12) + domain + QTYPE (2) + QCLASS (2)
    expect(query.length).toBeGreaterThan(12);
  });

  it('should have correct query structure', () => {
    const query = buildQuery('example.com', 'A');

    // Query ID at offset 0-1
    expect(query.readUInt16BE(0)).toBeGreaterThanOrEqual(0);

    // Header flags at offset 2-3
    const flags = query.readUInt16BE(2);
    expect(flags & 0x0100).toBe(0x0100); // RD bit set

    // QDCOUNT = 1 at offset 4-5
    expect(query.readUInt16BE(4)).toBe(1);

    // Rest should be zeros for ANCOUNT, NSCOUNT, ARCOUNT
    expect(query.readUInt16BE(6)).toBe(0);
    expect(query.readUInt16BE(8)).toBe(0);
    expect(query.readUInt16BE(10)).toBe(0);
  });

  it('should throw ValidationError for empty domain', () => {
    expect(() => buildQuery('', 'A')).toThrow(ValidationError);
  });

  it('should throw ValidationError for domain starting with dot', () => {
    expect(() => buildQuery('.example.com', 'A')).toThrow(ValidationError);
  });

  it('should throw ValidationError for domain ending with dot', () => {
    // FQDN with trailing dot is not accepted by the validator
    expect(() => buildQuery('example.com.', 'A')).toThrow(ValidationError);
  });

  it('should throw ValidationError for domain with consecutive dots', () => {
    expect(() => buildQuery('example..com', 'A')).toThrow(ValidationError);
  });

  it('should throw ValidationError for invalid characters in domain', () => {
    expect(() => buildQuery('example!.com', 'A')).toThrow(ValidationError);
  });

  it('should handle numeric domain', () => {
    const query = buildQuery('123.com', 'A');
    expect(query).toBeInstanceOf(Buffer);
  });

  it('should handle hyphen in domain', () => {
    const query = buildQuery('my-domain.com', 'A');
    expect(query).toBeInstanceOf(Buffer);
  });

  it('should handle underscore in domain (technically invalid but may be allowed)', () => {
    // Underscore is not valid in hostnames but is used in SRV records
    // The validator rejects underscores
    expect(() => buildQuery('_sip._tcp.example.com', 'A')).toThrow(ValidationError);
  });
});

describe('buildQueryWithId', () => {
  it('should build query with specific ID', () => {
    const query = buildQueryWithId(1234, 'example.com', 'A');
    const id = query.readUInt16BE(0);
    expect(id).toBe(1234);
  });

  it('should build query with ID 0', () => {
    const query = buildQueryWithId(0, 'example.com', 'A');
    const id = query.readUInt16BE(0);
    expect(id).toBe(0);
  });

  it('should build query with ID 65535', () => {
    const query = buildQueryWithId(65535, 'example.com', 'A');
    const id = query.readUInt16BE(0);
    expect(id).toBe(65535);
  });

  it('should build query with recursion desired by default', () => {
    const query = buildQueryWithId(1234, 'example.com', 'A');
    const flags = query.readUInt16BE(2);
    expect(flags & 0x0100).toBe(0x0100);
  });

  it('should build query with recursion desired true', () => {
    const query = buildQueryWithId(1234, 'example.com', 'A', true);
    const flags = query.readUInt16BE(2);
    expect(flags & 0x0100).toBe(0x0100);
  });

  it('should build query with recursion desired false', () => {
    const query = buildQueryWithId(1234, 'example.com', 'A', false);
    const flags = query.readUInt16BE(2);
    expect(flags & 0x0100).toBe(0);
  });

  it('should not affect global counter', () => {
    resetQueryIdCounter();
    buildQueryWithId(9999, 'example.com', 'A');
    expect(getQueryIdCounter()).toBe(0);
  });

  it('should throw ValidationError for empty domain', () => {
    expect(() => buildQueryWithId(1234, '', 'A')).toThrow(ValidationError);
  });

  it('should throw ValidationError for invalid domain', () => {
    expect(() => buildQueryWithId(1234, '.invalid', 'A')).toThrow(ValidationError);
  });

  it('should build query for all record types', () => {
    const types = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'PTR', 'SOA', 'SRV', 'CAA'] as const;

    for (const type of types) {
      const query = buildQueryWithId(1234, 'example.com', type);
      expect(query).toBeInstanceOf(Buffer);
      expect(query.readUInt16BE(0)).toBe(1234);
    }
  });

  it('should handle domain with multiple levels', () => {
    const query = buildQueryWithId(1234, 'a.b.c.example.com', 'A');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.readUInt16BE(0)).toBe(1234);
  });

  it('should handle single label domain', () => {
    const query = buildQueryWithId(1234, 'localhost', 'A');
    expect(query).toBeInstanceOf(Buffer);
    expect(query.readUInt16BE(0)).toBe(1234);
  });
});

describe('resetQueryIdCounter', () => {
  beforeEach(() => {
    resetQueryIdCounter();
  });

  it('should reset counter to 0', () => {
    setQueryIdCounter(100);
    resetQueryIdCounter();
    expect(getQueryIdCounter()).toBe(0);
  });

  it('should affect subsequent queries', () => {
    setQueryIdCounter(100);
    resetQueryIdCounter();

    const query = buildQuery('example.com', 'A');
    const id = query.readUInt16BE(0);

    expect(id).toBe(1); // Counter starts at 0, getNextId() returns 1
  });

  it('should be idempotent', () => {
    resetQueryIdCounter();
    resetQueryIdCounter();
    resetQueryIdCounter();
    expect(getQueryIdCounter()).toBe(0);
  });
});

describe('setQueryIdCounter', () => {
  beforeEach(() => {
    resetQueryIdCounter();
  });

  it('should set counter to specific value', () => {
    setQueryIdCounter(5000);
    expect(getQueryIdCounter()).toBe(5000);
  });

  it('should set counter to 0', () => {
    setQueryIdCounter(0);
    expect(getQueryIdCounter()).toBe(0);
  });

  it('should set counter to 65535', () => {
    setQueryIdCounter(65535);
    expect(getQueryIdCounter()).toBe(65535);
  });

  it('should wrap values above 65535', () => {
    setQueryIdCounter(65536);
    expect(getQueryIdCounter()).toBe(0);
  });

  it('should wrap values at multiple of 65536', () => {
    setQueryIdCounter(65537);
    expect(getQueryIdCounter()).toBe(1);

    setQueryIdCounter(131072);
    expect(getQueryIdCounter()).toBe(0);
  });

  it('should affect subsequent queries', () => {
    setQueryIdCounter(1000);

    const query = buildQuery('example.com', 'A');
    const id = query.readUInt16BE(0);

    expect(id).toBe(1001); // Incremented
  });

  it('should handle negative values (wraps to positive)', () => {
    setQueryIdCounter(-1);
    // -1 % 65536 in JS = -1, but the implementation should handle this
    // The value is stored as-is, and will be used in getNextId()
    // Since -1 + 1 = 0, the first query ID will be 0
    const query = buildQuery('example.com', 'A');
    const id = query.readUInt16BE(0);
    expect(id).toBe(0);
  });

  it('should handle large values', () => {
    setQueryIdCounter(999999);
    expect(getQueryIdCounter()).toBeLessThan(65536);
  });
});

describe('getQueryIdCounter', () => {
  beforeEach(() => {
    resetQueryIdCounter();
  });

  it('should return 0 initially', () => {
    expect(getQueryIdCounter()).toBe(0);
  });

  it('should return updated value after set', () => {
    setQueryIdCounter(5000);
    expect(getQueryIdCounter()).toBe(5000);
  });

  it('should return updated value after buildQuery', () => {
    buildQuery('example.com', 'A');
    expect(getQueryIdCounter()).toBe(1);

    buildQuery('example.com', 'A');
    expect(getQueryIdCounter()).toBe(2);
  });

  it('should reflect counter wrapping', () => {
    setQueryIdCounter(65535);
    expect(getQueryIdCounter()).toBe(65535);

    buildQuery('example.com', 'A');
    expect(getQueryIdCounter()).toBe(0);
  });
});

describe('query builder edge cases', () => {
  beforeEach(() => {
    resetQueryIdCounter();
  });

  it('should handle very long domain name', () => {
    const longDomain = 'a'.repeat(50) + '.com';
    const query = buildQuery(longDomain, 'A');
    expect(query).toBeInstanceOf(Buffer);
  });

  it('should handle domain at max label length', () => {
    // Each label max 63 characters
    const maxLabel = 'a'.repeat(63);
    const query = buildQuery(maxLabel + '.com', 'A');
    expect(query).toBeInstanceOf(Buffer);
  });

  it('should throw for label exceeding max length', () => {
    const tooLongLabel = 'a'.repeat(64);
    expect(() => buildQuery(tooLongLabel + '.com', 'A')).toThrow(ValidationError);
  });

  it('should handle punycode domain', () => {
    const punycodeDomain = 'xn--example-6q4b.com';
    const query = buildQuery(punycodeDomain, 'A');
    expect(query).toBeInstanceOf(Buffer);
  });

  it('should handle international domain as punycode', () => {
    const punycode = 'xn--n3h.com'; // ☃.com in punycode
    const query = buildQuery(punycode, 'A');
    expect(query).toBeInstanceOf(Buffer);
  });

  it('should build multiple queries with different types', () => {
    const types = ['A', 'AAAA', 'MX', 'TXT'] as const;
    const queries = types.map(type => buildQuery('example.com', type));

    expect(queries).toHaveLength(4);
    queries.forEach(query => {
      expect(query).toBeInstanceOf(Buffer);
    });
  });

  it('should generate sequential IDs for different types', () => {
    resetQueryIdCounter();
    const q1 = buildQuery('example.com', 'A');
    const q2 = buildQuery('example.com', 'AAAA');
    const q3 = buildQuery('example.com', 'MX');

    expect(q1.readUInt16BE(0)).toBe(1);
    expect(q2.readUInt16BE(0)).toBe(2);
    expect(q3.readUInt16BE(0)).toBe(3);
  });

  it('should produce consistent output for same inputs', () => {
    const q1 = buildQuery('example.com', 'A', { recursionDesired: false });
    const q2 = buildQuery('example.com', 'A', { recursionDesired: false });

    // IDs will differ but rest should be same
    expect(q1.readUInt16BE(2)).toBe(q2.readUInt16BE(2)); // Same flags
  });

  it('should handle TLD only', () => {
    const query = buildQuery('com', 'A');
    expect(query).toBeInstanceOf(Buffer);
  });
});
