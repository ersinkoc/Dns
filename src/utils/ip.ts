/**
 * IP address utilities.
 *
 * @module
 */

import { ValidationError } from '../errors.js';
import { isValidDomain } from './domain.js';

/**
 * IPv4 address regex pattern.
 *
 * @internal
 */
const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * IPv6 address regex pattern (simplified).
 *
 * @internal
 */
const IPV6_PATTERN = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

/**
 * Check if a string is a valid IPv4 address.
 *
 * @param ip - IP address string to validate
 * @returns True if valid IPv4 address
 *
 * @example
 * ```typescript
 * isValidIPv4('192.168.1.1'); // true
 * isValidIPv4('256.0.0.1');   // false
 * ```
 */
export function isValidIPv4(ip: string): boolean {
  const match = ip.match(IPV4_PATTERN);
  if (!match) return false;

  // Check each octet is in range 0-255
  for (let i = 1; i <= 4; i++) {
    const octet = Number.parseInt(match[i]!, 10);
    if (octet < 0 || octet > 255) return false;
  }

  return true;
}

/**
 * Check if a string is a valid IPv6 address.
 *
 * @param ip - IP address string to validate
 * @returns True if valid IPv6 address
 *
 * @example
 * ```typescript
 * isValidIPv6('::1');                  // true
 * isValidIPv6('2001:4860:4860::8888'); // true
 * ```
 */
export function isValidIPv6(ip: string): boolean {
  // Basic validation - full IPv6 validation is more complex
  if (ip.includes('.')) {
    // IPv4-mapped IPv6
    const parts = ip.split(':');
    const lastPart = parts.at(-1);
    return lastPart !== undefined && isValidIPv4(lastPart);
  }
  return IPV6_PATTERN.test(ip) || ip === '::';
}

/**
 * Check if a string is a valid IP address (IPv4 or IPv6).
 *
 * @param ip - IP address string to validate
 * @returns True if valid IP address
 *
 * @example
 * ```typescript
 * isValidIP('192.168.1.1');         // true
 * isValidIP('2001:4860:4860::8888'); // true
 * isValidIP('invalid');              // false
 * ```
 */
export function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip);
}

/**
 * Check if a string is a valid IPv4 address or hostname.
 *
 * @param host - Host string to validate
 * @returns True if valid IPv4 or hostname
 *
 * @example
 * ```typescript
 * isValidHost('192.168.1.1');  // true
 * isValidHost('dns.google');   // true
 * isValidHost('invalid:123');  // false
 * ```
 */
export function isValidHost(host: string): boolean {
  return isValidIPv4(host) || isValidDomain(host);
}

/**
 * Convert an IPv4 address to reverse DNS format.
 *
 * @param ip - IPv4 address
 * @returns Reverse DNS format
 * @throws {ValidationError} If IP is invalid
 *
 * @example
 * ```typescript
 * ipv4ToReverse('8.8.8.8'); // '8.8.8.8.in-addr.arpa'
 * ```
 */
export function ipv4ToReverse(ip: string): string {
  if (!isValidIPv4(ip)) {
    throw new ValidationError(`Invalid IPv4 address`, ip);
  }

  const octets = ip.split('.').reverse();
  return `${octets.join('.')}.in-addr.arpa`;
}

/**
 * Convert an IPv6 address to reverse DNS format.
 *
 * @param ip - IPv6 address
 * @returns Reverse DNS format
 * @throws {ValidationError} If IP is invalid
 *
 * @example
 * ```typescript
 * ipv6ToReverse('2001:4860:4860::8888'); // '8.8.8.8.0.0.0.0.0.0.0.0.0.0.0.0.0.6.8.4.0.6.8.4.1.0.0.2.ip6.arpa'
 * ```
 */
export function ipv6ToReverse(ip: string): string {
  if (!isValidIPv6(ip)) {
    throw new ValidationError(`Invalid IPv6 address`, ip);
  }

  // Expand IPv6 address
  const expanded = expandIPv6(ip);

  // Convert to nibbles and reverse
  const nibbles = expanded.replace(/:/g, '').split('').reverse();

  return `${nibbles.join('.')}.ip6.arpa`;
}

/**
 * Expand a compressed IPv6 address.
 *
 * @param ip - IPv6 address (may be compressed)
 * @returns Expanded IPv6 address
 *
 * @example
 * ```typescript
 * expandIPv6('2001::8888'); // '2001:0000:0000:0000:0000:0000:0000:8888'
 * ```
 */
export function expandIPv6(ip: string): string {
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0]!.split(':').filter(Boolean);
    const right = parts[1]!.split(':').filter(Boolean);
    const missing = 8 - left.length - right.length;

    const expanded = [...left, ...Array(missing).fill('0000'), ...right];
    return expanded.map((part) => part.padStart(4, '0')).join(':');
  }

  return ip
    .split(':')
    .map((part) => part.padStart(4, '0'))
    .join(':');
}

/**
 * Reverse lookup from IP to hostname format.
 *
 * @param ip - IP address
 * @returns Reverse DNS format
 * @throws {ValidationError} If IP is invalid
 *
 * @example
 * ```typescript
 * ipToReverse('8.8.8.8'); // '8.8.8.8.in-addr.arpa'
 * ipToReverse('2001:4860:4860::8888'); // IPv6 reverse format
 * ```
 */
export function ipToReverse(ip: string): string {
  if (isValidIPv4(ip)) {
    return ipv4ToReverse(ip);
  }
  if (isValidIPv6(ip)) {
    return ipv6ToReverse(ip);
  }
  throw new ValidationError(`Invalid IP address`, ip);
}

/**
 * Get the IP address version.
 *
 * @param ip - IP address
 * @returns '4' for IPv4, '6' for IPv6
 * @throws {ValidationError} If IP is invalid
 *
 * @example
 * ```typescript
 * getIPVersion('192.168.1.1'); // '4'
 * getIPVersion('::1');         // '6'
 * ```
 */
export function getIPVersion(ip: string): '4' | '6' {
  if (isValidIPv4(ip)) return '4';
  if (isValidIPv6(ip)) return '6';
  throw new ValidationError(`Invalid IP address`, ip);
}

/**
 * Convert IPv4 buffer to string.
 *
 * @param buffer - Buffer containing IPv4 address (4 bytes)
 * @returns IPv4 address string
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from([0x08, 0x08, 0x08, 0x08]);
 * bufferToIPv4(buffer); // '8.8.8.8'
 * ```
 */
export function bufferToIPv4(buffer: Buffer): string {
  if (buffer.length < 4) {
    throw new Error('Buffer too short for IPv4 address');
  }
  return Array.from(buffer.subarray(0, 4)).join('.');
}

/**
 * Convert IPv6 buffer to string.
 *
 * @param buffer - Buffer containing IPv6 address (16 bytes)
 * @returns IPv6 address string (compressed)
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from([0x20, 0x01, 0x04, 0x86, ...]);
 * bufferToIPv6(buffer); // Compressed IPv6 string
 * ```
 */
export function bufferToIPv6(buffer: Buffer): string {
  if (buffer.length < 16) {
    throw new Error('Buffer too short for IPv6 address');
  }

  // Convert buffer to hex groups
  const groups: string[] = [];
  for (let i = 0; i < 16; i += 2) {
    const value = buffer.readUInt16BE(i);
    groups.push(value.toString(16));
  }

  // Compress the address
  return compressIPv6(groups.join(':'));
}

/**
 * Compress an IPv6 address.
 *
 * @param ip - Expanded IPv6 address
 * @returns Compressed IPv6 address
 *
 * @example
 * ```typescript
 * compressIPv6('2001:0000:0000:0000:0000:0000:0000:8888');
 * // '2001::8888'
 * ```
 */
export function compressIPv6(ip: string): string {
  // Find longest sequence of zeros
  const groups = ip.split(':');
  let maxZeroStart = -1;
  let maxZeroLength = 0;
  let currentZeroStart = -1;
  let currentZeroLength = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0000' || groups[i] === '0') {
      if (currentZeroStart === -1) {
        currentZeroStart = i;
      }
      currentZeroLength++;
    } else {
      if (currentZeroLength > maxZeroLength) {
        maxZeroStart = currentZeroStart;
        maxZeroLength = currentZeroLength;
      }
      currentZeroStart = -1;
      currentZeroLength = 0;
    }
  }

  // Check if trailing zeros are the longest
  if (currentZeroLength > maxZeroLength) {
    maxZeroStart = currentZeroStart;
    maxZeroLength = currentZeroLength;
  }

  // Compress if we found a sequence
  if (maxZeroLength >= 2) {
    const compressed = [
      ...groups.slice(0, maxZeroStart),
      '',
      ...groups.slice(maxZeroStart + maxZeroLength),
    ];
    return compressed.join(':').replace(/^:|:$/g, '');
  }

  return ip;
}

/**
 * Convert IPv4 string to buffer.
 *
 * @param ip - IPv4 address string
 * @returns Buffer containing the address (4 bytes)
 *
 * @example
 * ```typescript
 * const buffer = ipv4ToBuffer('8.8.8.8');
 * // Buffer <08 08 08 08>
 * ```
 */
export function ipv4ToBuffer(ip: string): Buffer {
  if (!isValidIPv4(ip)) {
    throw new ValidationError(`Invalid IPv4 address`, ip);
  }

  const octets = ip.split('.').map((octet) => Number.parseInt(octet, 10));
  return Buffer.from(octets);
}

/**
 * Convert IPv6 string to buffer.
 *
 * @param ip - IPv6 address string
 * @returns Buffer containing the address (16 bytes)
 *
 * @example
 * ```typescript
 * const buffer = ipv6ToBuffer('2001::8888');
 * // Buffer (16 bytes)
 * ```
 */
export function ipv6ToBuffer(ip: string): Buffer {
  if (!isValidIPv6(ip)) {
    throw new ValidationError(`Invalid IPv6 address`, ip);
  }

  const expanded = expandIPv6(ip);
  const groups = expanded.split(':');
  const buffer = Buffer.allocUnsafe(16);

  for (let i = 0; i < 8; i++) {
    const value = Number.parseInt(groups[i]!, 16);
    buffer.writeUInt16BE(value, i * 2);
  }

  return buffer;
}
