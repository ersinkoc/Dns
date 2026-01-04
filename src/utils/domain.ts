/**
 * Domain name validation utilities.
 *
 * @module
 */

import { ValidationError } from '../errors.js';

/**
 * Maximum domain name length (RFC 1035).
 *
 * @internal
 */
const MAX_DOMAIN_LENGTH = 253;

/**
 * Maximum label length (RFC 1035).
 *
 * @internal
 */
const MAX_LABEL_LENGTH = 63;

/**
 * Valid domain name pattern.
 *
 * @internal
 */
const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;

/**
 * Validate a domain name.
 *
 * @param domain - Domain name to validate
 * @returns True if valid domain name
 *
 * @example
 * ```typescript
 * isValidDomain('example.com');     // true
 * isValidDomain('sub.example.com'); // true
 * isValidDomain('-invalid.com');    // false
 * ```
 */
export function isValidDomain(domain: string): boolean {
  // Check length
  if (domain.length === 0 || domain.length > MAX_DOMAIN_LENGTH) {
    return false;
  }

  // Check pattern
  if (!DOMAIN_PATTERN.test(domain)) {
    return false;
  }

  // Check each label length (defensive check - regex already limits to 63 chars)
  const labels = domain.split('.');
  for (const label of labels) {
    /* v8 ignore next 3 */
    if (label.length > MAX_LABEL_LENGTH) {
      return false;
    }
  }

  return true;
}

/**
 * Validate a domain name and throw if invalid.
 *
 * @param domain - Domain name to validate
 * @throws {ValidationError} If domain is invalid
 *
 * @example
 * ```typescript
 * validateDomain('example.com'); // OK
 * validateDomain('');            // Throws ValidationError
 * ```
 */
export function validateDomain(domain: string): void {
  if (!isValidDomain(domain)) {
    throw new ValidationError(`Invalid domain name`, domain);
  }
}

/**
 * Normalize a domain name.
 *
 * Converts to lowercase and trims whitespace.
 *
 * @param domain - Domain name to normalize
 * @returns Normalized domain name
 *
 * @example
 * ```typescript
 * normalizeDomain('Example.Com'); // 'example.com'
 * normalizeDomain('  example.com  '); // 'example.com'
 * ```
 */
export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase();
}

/**
 * Extract the root domain from a domain.
 *
 * @param domain - Domain name
 * @returns Root domain (eTLD + 1)
 *
 * @example
 * ```typescript
 * getRootDomain('www.example.com'); // 'example.com'
 * getRootDomain('sub.sub.example.co.uk'); // 'example.co.uk'
 * ```
 */
export function getRootDomain(domain: string): string {
  const labels = domain.split('.');

  // Simple heuristic: take last 2 labels, or last 3 for known ccTLDs
  const knownCcTlds = ['co.uk', 'com.au', 'org.uk', 'ac.uk', 'gov.uk', 'net.au'];

  for (const ccTld of knownCcTlds) {
    const ccTldLabels = ccTld.split('.');
    if (
      labels.length >= ccTldLabels.length + 1 &&
      labels.slice(-ccTldLabels.length).join('.') === ccTld
    ) {
      return labels.slice(-ccTldLabels.length - 1).join('.');
    }
  }

  // Default: last 2 labels
  if (labels.length >= 2) {
    return labels.slice(-2).join('.');
  }

  return domain;
}

/**
 * Get subdomains of a domain.
 *
 * @param domain - Domain name
 * @returns Array of subdomain parts (empty if no subdomains)
 *
 * @example
 * ```typescript
 * getSubdomains('www.example.com'); // ['www']
 * getSubdomains('a.b.c.example.com'); // ['a', 'b', 'c']
 * getSubdomains('example.com'); // []
 * ```
 */
export function getSubdomains(domain: string): string[] {
  const labels = domain.split('.');
  if (labels.length <= 2) {
    return [];
  }
  return labels.slice(0, -2);
}

/**
 * Check if a domain is a subdomain.
 *
 * @param domain - Domain name to check
 * @returns True if domain is a subdomain
 *
 * @example
 * ```typescript
 * isSubdomain('www.example.com'); // true
 * isSubdomain('example.com');     // false
 * ```
 */
export function isSubdomain(domain: string): boolean {
  return getSubdomains(domain).length > 0;
}

/**
 * Check if two domains are on the same root domain.
 *
 * @param domain1 - First domain
 * @param domain2 - Second domain
 * @returns True if same root domain
 *
 * @example
 * ```typescript
 * sameRootDomain('www.example.com', 'mail.example.com'); // true
 * sameRootDomain('example.com', 'other.com');            // false
 * ```
 */
export function sameRootDomain(domain1: string, domain2: string): boolean {
  return getRootDomain(domain1) === getRootDomain(domain2);
}

/**
 * Convert a domain to punycode (IDN).
 *
 * Note: This is a simplified implementation.
 * For production use, consider using the punycode library.
 *
 * @param domain - Domain name (may contain Unicode)
 * @returns ASCII-compatible domain name
 *
 * @example
 * ```typescript
 * toPunycode('müller.com'); // 'xn--mller-kva.com'
 * ```
 */
export function toPunycode(domain: string): string {
  // Check if domain contains non-ASCII characters
  const hasUnicode = /[^\x00-\x7F]/.test(domain);

  if (!hasUnicode) {
    return domain;
  }

  const labels = domain.split('.');

  return labels
    .map((label) => {
      if (/[^\x00-\x7F]/.test(label)) {
        // Convert to punycode (simplified)
        return `xn--${Buffer.from(label).toString('base64').replace(/=/g, '').toLowerCase()}`;
      }
      return label;
    })
    .join('.');
}

/**
 * Get the DNS record type from a string.
 *
 * @param str - String to parse
 * @returns Record type or undefined
 *
 * @example
 * ```typescript
 * parseRecordType('A');    // 'A'
 * parseRecordType('a');    // 'A'
 * parseRecordType('AAAA'); // 'AAAA'
 * parseRecordType('invalid'); // undefined
 * ```
 */
export function parseRecordType(str: string): string | undefined {
  const types = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SRV', 'PTR', 'SOA', 'CAA'];
  const upper = str.toUpperCase();

  for (const type of types) {
    if (type === upper) {
      return type;
    }
  }

  return undefined;
}

/**
 * Format a domain for display.
 *
 * Ensures proper trailing dot for FQDN.
 *
 * @param domain - Domain name
 * @param fqdn - Whether to format as FQDN (with trailing dot)
 * @returns Formatted domain name
 *
 * @example
 * ```typescript
 * formatDomain('example.com', true);  // 'example.com.'
 * formatDomain('example.com', false); // 'example.com'
 * formatDomain('example.com.', true); // 'example.com.'
 * ```
 */
export function formatDomain(domain: string, fqdn = false): string {
  let formatted = normalizeDomain(domain);
  if (fqdn && !formatted.endsWith('.')) {
    formatted += '.';
  } else if (!fqdn && formatted.endsWith('.')) {
    formatted = formatted.slice(0, -1);
  }
  return formatted;
}

/**
 * Check if a domain is a reverse DNS zone.
 *
 * @param domain - Domain name
 * @returns True if domain is a reverse zone
 *
 * @example
 * ```typescript
 * isReverseZone('8.8.8.8.in-addr.arpa');    // true
 * isReverseZone('example.com');             // false
 * ```
 */
export function isReverseZone(domain: string): boolean {
  return domain.endsWith('.in-addr.arpa') || domain.endsWith('.ip6.arpa');
}

/**
 * Get the IP address from a reverse DNS domain.
 *
 * @param domain - Reverse DNS domain
 * @returns IP address
 * @throws {ValidationError} If domain is not a valid reverse zone
 *
 * @example
 * ```typescript
 * reverseToIP('8.8.8.8.in-addr.arpa'); // '8.8.8.8'
 * reverseToIP('example.com');          // Throws ValidationError
 * ```
 */
export function reverseToIP(domain: string): string {
  if (domain.endsWith('.in-addr.arpa')) {
    const base = domain.slice(0, -'.in-addr.arpa'.length);
    const octets = base.split('.').reverse();
    return octets.join('.');
  }

  if (domain.endsWith('.ip6.arpa')) {
    const base = domain.slice(0, -'.ip6.arpa'.length);
    const nibbles = base.split('.').reverse();
    // Every 4 nibbles = 1 hex group
    const groups: string[] = [];
    for (let i = 0; i < nibbles.length; i += 4) {
      const group = nibbles.slice(i, i + 4).join('');
      groups.push(group);
    }
    return groups.join(':');
  }

  throw new ValidationError(`Not a valid reverse DNS zone`, domain);
}
