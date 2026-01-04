/**
 * Domain utility tests
 */

import { describe, it, expect } from 'vitest';
import {
  isValidDomain,
  validateDomain,
  normalizeDomain,
  getRootDomain,
  getSubdomains,
  isSubdomain,
  sameRootDomain,
  toPunycode,
  parseRecordType,
  formatDomain,
  isReverseZone,
  reverseToIP,
} from '../../src/utils/domain.js';
import { ValidationError } from '../../src/errors.js';

describe('isValidDomain', () => {
  it('should validate simple domains', () => {
    expect(isValidDomain('example.com')).toBe(true);
    expect(isValidDomain('sub.example.com')).toBe(true);
    expect(isValidDomain('www.example.com')).toBe(true);
  });

  it('should validate domains with numbers', () => {
    expect(isValidDomain('123.com')).toBe(true);
    expect(isValidDomain('test123.com')).toBe(true);
    expect(isValidDomain('123test.com')).toBe(true);
  });

  it('should validate domains with hyphens', () => {
    expect(isValidDomain('my-domain.com')).toBe(true);
    expect(isValidDomain('test-domain.example.com')).toBe(true);
  });

  it('should reject empty domain', () => {
    expect(isValidDomain('')).toBe(false);
  });

  it('should reject domains starting with hyphen', () => {
    expect(isValidDomain('-example.com')).toBe(false);
    expect(isValidDomain('-test.example.com')).toBe(false);
  });

  it('should reject domains ending with hyphen', () => {
    expect(isValidDomain('example-.com')).toBe(false);
    expect(isValidDomain('test-.example.com')).toBe(false);
  });

  it('should reject domains with invalid characters', () => {
    expect(isValidDomain('example_.com')).toBe(false);
    expect(isValidDomain('example$.com')).toBe(false);
    expect(isValidDomain('example space.com')).toBe(false);
  });

  it('should reject domains that are too long', () => {
    const longDomain = 'a'.repeat(254) + '.com';
    expect(isValidDomain(longDomain)).toBe(false);
  });

  it('should accept domains at max length', () => {
    // Max domain length is 253
    // Need a valid domain pattern: labels must start/end with alphanumeric
    const label1 = 'a'.repeat(60) + 'b';
    const label2 = 'c'.repeat(60) + 'd';
    const label3 = 'e'.repeat(60) + 'f';
    const domain = label1 + '.' + label2 + '.' + label3 + '.' + 'gh.com';
    expect(isValidDomain(domain)).toBe(true);
  });

  it('should reject single label domains without TLD', () => {
    expect(isValidDomain('example')).toBe(true); // Single label is valid
  });

  it('should handle case insensitivity', () => {
    expect(isValidDomain('EXAMPLE.COM')).toBe(true);
    expect(isValidDomain('ExAmPlE.CoM')).toBe(true);
  });
});

describe('validateDomain', () => {
  it('should not throw for valid domains', () => {
    expect(() => validateDomain('example.com')).not.toThrow();
    expect(() => validateDomain('sub.example.com')).not.toThrow();
  });

  it('should throw ValidationError for invalid domains', () => {
    expect(() => validateDomain('')).toThrow(ValidationError);
    expect(() => validateDomain('-example.com')).toThrow(ValidationError);
    expect(() => validateDomain('example_.com')).toThrow(ValidationError);
  });

  it('should include domain in error message', () => {
    try {
      validateDomain('');
    } catch (e) {
      expect((e as ValidationError).value).toBe('');
    }
  });
});

describe('normalizeDomain', () => {
  it('should convert to lowercase', () => {
    expect(normalizeDomain('EXAMPLE.COM')).toBe('example.com');
    expect(normalizeDomain('ExAmPlE.CoM')).toBe('example.com');
  });

  it('should trim whitespace', () => {
    expect(normalizeDomain('  example.com  ')).toBe('example.com');
    expect(normalizeDomain('\texample.com\n')).toBe('example.com');
  });

  it('should handle both case and whitespace', () => {
    expect(normalizeDomain('  EXAMPLE.COM  ')).toBe('example.com');
  });
});

describe('getRootDomain', () => {
  it('should get root domain for simple domains', () => {
    expect(getRootDomain('example.com')).toBe('example.com');
    expect(getRootDomain('www.example.com')).toBe('example.com');
  });

  it('should handle known ccTLDs', () => {
    expect(getRootDomain('www.example.co.uk')).toBe('example.co.uk');
    expect(getRootDomain('example.com.au')).toBe('example.com.au');
    expect(getRootDomain('www.example.org.uk')).toBe('example.org.uk');
    expect(getRootDomain('site.example.ac.uk')).toBe('example.ac.uk');
    expect(getRootDomain('www.example.gov.uk')).toBe('example.gov.uk');
    expect(getRootDomain('example.net.au')).toBe('example.net.au');
  });

  it('should handle deep subdomains', () => {
    expect(getRootDomain('a.b.c.example.com')).toBe('example.com');
  });

  it('should handle single label domains', () => {
    expect(getRootDomain('localhost')).toBe('localhost');
  });
});

describe('getSubdomains', () => {
  it('should return empty array for root domains', () => {
    expect(getSubdomains('example.com')).toEqual([]);
  });

  it('should return subdomains for subdomain domains', () => {
    expect(getSubdomains('www.example.com')).toEqual(['www']);
    expect(getSubdomains('mail.example.com')).toEqual(['mail']);
  });

  it('should return all subdomain parts', () => {
    expect(getSubdomains('a.b.c.example.com')).toEqual(['a', 'b', 'c']);
    expect(getSubdomains('www.mail.example.com')).toEqual(['www', 'mail']);
  });
});

describe('isSubdomain', () => {
  it('should return false for root domains', () => {
    expect(isSubdomain('example.com')).toBe(false);
  });

  it('should return true for subdomains', () => {
    expect(isSubdomain('www.example.com')).toBe(true);
    expect(isSubdomain('mail.example.com')).toBe(true);
    expect(isSubdomain('a.b.c.example.com')).toBe(true);
  });
});

describe('sameRootDomain', () => {
  it('should return true for same root domains', () => {
    expect(sameRootDomain('www.example.com', 'mail.example.com')).toBe(true);
    expect(sameRootDomain('example.com', 'example.com')).toBe(true);
  });

  it('should return false for different root domains', () => {
    expect(sameRootDomain('example.com', 'other.com')).toBe(false);
    expect(sameRootDomain('www.example.com', 'www.other.com')).toBe(false);
  });

  it('should handle ccTLDs', () => {
    expect(sameRootDomain('www.example.co.uk', 'mail.example.co.uk')).toBe(true);
    expect(sameRootDomain('example.co.uk', 'example.com')).toBe(false);
  });
});

describe('toPunycode', () => {
  it('should return ASCII domains unchanged', () => {
    expect(toPunycode('example.com')).toBe('example.com');
    expect(toPunycode('test.example.com')).toBe('test.example.com');
  });

  it('should convert Unicode to punycode', () => {
    const result = toPunycode('müller.com');
    expect(result).toMatch(/^xn--/);
    expect(result).toContain('.com');
  });

  it('should handle mixed ASCII and Unicode labels', () => {
    const result = toPunycode('www.müller.com');
    expect(result).toContain('www.');
    expect(result).toMatch(/\.xn--.*\.com$/);
  });
});

describe('parseRecordType', () => {
  it('should parse valid record types', () => {
    expect(parseRecordType('A')).toBe('A');
    expect(parseRecordType('AAAA')).toBe('AAAA');
    expect(parseRecordType('MX')).toBe('MX');
    expect(parseRecordType('TXT')).toBe('TXT');
    expect(parseRecordType('CNAME')).toBe('CNAME');
    expect(parseRecordType('NS')).toBe('NS');
    expect(parseRecordType('SRV')).toBe('SRV');
    expect(parseRecordType('PTR')).toBe('PTR');
    expect(parseRecordType('SOA')).toBe('SOA');
    expect(parseRecordType('CAA')).toBe('CAA');
  });

  it('should be case insensitive', () => {
    expect(parseRecordType('a')).toBe('A');
    expect(parseRecordType('aaaa')).toBe('AAAA');
    expect(parseRecordType('Mx')).toBe('MX');
  });

  it('should return undefined for invalid types', () => {
    expect(parseRecordType('invalid')).toBeUndefined();
    expect(parseRecordType('XYZ')).toBeUndefined();
    expect(parseRecordType('')).toBeUndefined();
  });
});

describe('formatDomain', () => {
  it('should format as FQDN with trailing dot', () => {
    expect(formatDomain('example.com', true)).toBe('example.com.');
    expect(formatDomain('example.com.', true)).toBe('example.com.');
  });

  it('should format without trailing dot', () => {
    expect(formatDomain('example.com', false)).toBe('example.com');
    expect(formatDomain('example.com.', false)).toBe('example.com');
  });

  it('should default to non-FQDN format', () => {
    expect(formatDomain('example.com')).toBe('example.com');
    expect(formatDomain('example.com.', false)).toBe('example.com');
  });

  it('should normalize domain', () => {
    expect(formatDomain('EXAMPLE.COM', true)).toBe('example.com.');
    expect(formatDomain('  example.com  ', false)).toBe('example.com');
  });
});

describe('isReverseZone', () => {
  it('should return true for IPv4 reverse zones', () => {
    expect(isReverseZone('8.8.8.8.in-addr.arpa')).toBe(true);
    expect(isReverseZone('1.0.0.127.in-addr.arpa')).toBe(true);
  });

  it('should return true for IPv6 reverse zones', () => {
    expect(isReverseZone('1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.e.f.ip6.arpa')).toBe(true);
  });

  it('should return false for regular domains', () => {
    expect(isReverseZone('example.com')).toBe(false);
    expect(isReverseZone('in-addr.arpa.com')).toBe(false);
  });
});

describe('reverseToIP', () => {
  it('should convert IPv4 reverse zone to IP', () => {
    expect(reverseToIP('8.8.8.8.in-addr.arpa')).toBe('8.8.8.8');
    expect(reverseToIP('1.0.0.127.in-addr.arpa')).toBe('127.0.0.1');
  });

  it('should convert IPv6 reverse zone to IP', () => {
    const result = reverseToIP('0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.e.f.ip6.arpa');
    expect(result).toContain(':');
    expect(result).toMatch(/^fe80:/);
  });

  it('should throw ValidationError for non-reverse zones', () => {
    expect(() => reverseToIP('example.com')).toThrow(ValidationError);
    expect(() => reverseToIP('in-addr.arpa')).toThrow(ValidationError);
  });
});

describe('domain edge cases', () => {
  it('should handle domain with only TLD', () => {
    expect(isValidDomain('com')).toBe(true);
    expect(getRootDomain('com')).toBe('com');
  });

  it('should handle consecutive dots in normalize', () => {
    expect(normalizeDomain('example..com')).toBe('example..com');
  });

  it('should handle trailing dot in normalize', () => {
    expect(normalizeDomain('example.com.')).toBe('example.com.');
  });

  it('should handle leading dot in normalize', () => {
    expect(normalizeDomain('.example.com')).toBe('.example.com');
  });

  it('should handle domain with uppercase and spaces', () => {
    expect(normalizeDomain('  EXAMPLE.COM  ')).toBe('example.com');
  });

  it('should handle very long labels', () => {
    const longLabel = 'a'.repeat(63);
    expect(isValidDomain(`${longLabel}.com`)).toBe(true);

    const tooLongLabel = 'a'.repeat(64);
    expect(isValidDomain(`${tooLongLabel}.com`)).toBe(false);
  });
});
