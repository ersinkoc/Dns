/**
 * DNS response parser.
 *
 * Parses DNS wire format responses into structured data.
 *
 * @module
 */

import type { RecordType, RecordTypeMap, MxRecord, SrvRecord, SoaRecord, CaaRecord } from '../types.js';
import { DnsError } from '../errors.js';
import { DnsErrorCode } from '../types.js';
import { decodeName, getRecordTypeName } from './wire.js';
import { bufferToIPv4, bufferToIPv6 } from '../utils/ip.js';

/**
 * Parse A record data.
 *
 * @param rdata - Record data buffer
 * @returns IPv4 address string
 *
 * @example
 * ```typescript
 * const rdata = Buffer.from([0x08, 0x08, 0x08, 0x08]);
 * parseARecord(rdata); // '8.8.8.8'
 * ```
 */
export function parseARecord(rdata: Buffer): string {
  return bufferToIPv4(rdata);
}

/**
 * Parse AAAA record data.
 *
 * @param rdata - Record data buffer
 * @returns IPv6 address string
 *
 * @example
 * ```typescript
 * const rdata = Buffer.from([0x20, 0x01, ...]); // 16 bytes
 * parseAAAARecord(rdata); // '2001::...'
 * ```
 */
export function parseAAAARecord(rdata: Buffer): string {
  return bufferToIPv6(rdata);
}

/**
 * Parse CNAME record data.
 *
 * @param buffer - Full response buffer
 * @param rdata - Record data buffer (contains offset to name)
 * @returns Canonical name
 *
 * @example
 * ```typescript
 * const cname = parseCNAMERecord(buffer, record.rdata);
 * // 'example.com'
 * ```
 */
export function parseCNAMERecord(buffer: Buffer, rdata: Buffer): string {
  // rdata contains the compressed domain name
  // We need to decode it from the full buffer
  const rdataOffset = buffer.indexOf(rdata);
  const [name] = decodeName(buffer, rdataOffset);
  return name;
}

/**
 * Parse NS record data.
 *
 * @param buffer - Full response buffer
 * @param rdata - Record data buffer
 * @returns Nameserver hostname
 *
 * @example
 * ```typescript
 * const ns = parseNSRecord(buffer, record.rdata);
 * // 'ns1.example.com'
 * ```
 */
export function parseNSRecord(buffer: Buffer, rdata: Buffer): string {
  const rdataOffset = buffer.indexOf(rdata);
  const [name] = decodeName(buffer, rdataOffset);
  return name;
}

/**
 * Parse PTR record data.
 *
 * @param buffer - Full response buffer
 * @param rdata - Record data buffer
 * @returns Pointer domain name
 *
 * @example
 * ```typescript
 * const ptr = parsePTRRecord(buffer, record.rdata);
 * // 'dns.google'
 * ```
 */
export function parsePTRRecord(buffer: Buffer, rdata: Buffer): string {
  const rdataOffset = buffer.indexOf(rdata);
  const [name] = decodeName(buffer, rdataOffset);
  return name;
}

/**
 * Parse MX record data.
 *
 * @param buffer - Full response buffer
 * @param rdata - Record data buffer
 * @returns MX record with priority and exchange
 *
 * @example
 * ```typescript
 * const mx = parseMXRecord(buffer, record.rdata);
 * // { priority: 5, exchange: 'gmail-smtp-in.l.google.com' }
 * ```
 */
export function parseMXRecord(buffer: Buffer, rdata: Buffer): MxRecord {
  const rdataOffset = buffer.indexOf(rdata);
  const priority = rdata.readUInt16BE(0);
  const [exchange] = decodeName(buffer, rdataOffset + 2);
  return { priority, exchange };
}

/**
 * Parse SRV record data.
 *
 * @param buffer - Full response buffer
 * @param rdata - Record data buffer
 * @returns SRV record with priority, weight, port, and target
 *
 * @example
 * ```typescript
 * const srv = parseSRVRecord(buffer, record.rdata);
 * // { priority: 10, weight: 5, port: 5060, target: 'sipserver.example.com' }
 * ```
 */
export function parseSRVRecord(buffer: Buffer, rdata: Buffer): SrvRecord {
  const rdataOffset = buffer.indexOf(rdata);
  const priority = rdata.readUInt16BE(0);
  const weight = rdata.readUInt16BE(2);
  const port = rdata.readUInt16BE(4);
  const [target] = decodeName(buffer, rdataOffset + 6);
  return { priority, weight, port, target };
}

/**
 * Parse SOA record data.
 *
 * @param buffer - Full response buffer
 * @param rdata - Record data buffer
 * @returns SOA record
 *
 * @example
 * ```typescript
 * const soa = parseSOARecord(buffer, record.rdata);
 * // { nsname: 'ns1.example.com', hostmaster: 'hostmaster.example.com', ... }
 * ```
 */
export function parseSOARecord(buffer: Buffer, rdata: Buffer): SoaRecord {
  const rdataOffset = buffer.indexOf(rdata);
  let offset = rdataOffset;

  const [nsname, newOffset1] = decodeName(buffer, offset);
  offset = newOffset1;

  const [hostmaster, newOffset2] = decodeName(buffer, offset);
  offset = newOffset2;

  const serial = buffer.readUInt32BE(offset);
  const refresh = buffer.readUInt32BE(offset + 4);
  const retry = buffer.readUInt32BE(offset + 8);
  const expire = buffer.readUInt32BE(offset + 12);
  const minttl = buffer.readUInt32BE(offset + 16);

  return { nsname, hostmaster, serial, refresh, retry, expire, minttl };
}

/**
 * Parse TXT record data.
 *
 * @param rdata - Record data buffer
 * @returns Array of text strings
 *
 * @example
 * ```typescript
 * const txt = parseTXTRecord(rdata);
 * // ['v=spf1 -all', 'google-site-verification=...']
 * ```
 */
export function parseTXTRecord(rdata: Buffer): string[] {
  const texts: string[] = [];
  let offset = 0;

  while (offset < rdata.length) {
    const length = rdata[offset]!;
    offset++;
    if (length === 0) break;
    if (offset + length > rdata.length) break;

    const text = rdata.toString('utf8', offset, offset + length);
    texts.push(text);
    offset += length;
  }

  return texts;
}

/**
 * Parse CAA record data.
 *
 * @param rdata - Record data buffer
 * @returns CAA record
 *
 * @example
 * ```typescript
 * const caa = parseCAARecord(rdata);
 * // { critical: false, tag: 'issue', value: 'letsencrypt.org' }
 * ```
 */
export function parseCAARecord(rdata: Buffer): CaaRecord {
  const flags = rdata[0]!;
  const critical = (flags & 0x80) === 0x80;

  let tagOffset = 1;
  while (tagOffset < rdata.length && rdata[tagOffset] !== 0) {
    tagOffset++;
  }

  const tag = rdata.toString('ascii', 1, tagOffset);
  const value = rdata.toString('utf8', tagOffset + 1);

  return { critical, tag, value };
}

/**
 * Parse a single DNS record from wire format.
 *
 * @param buffer - Full response buffer
 * @param record - Raw record from decodeResponse
 * @returns Parsed record value
 *
 * @example
 * ```typescript
 * const parsed = parseRecord(buffer, wireRecord);
 * // Returns parsed value based on record type
 * ```
 */
export function parseRecord(
  buffer: Buffer,
  record: {
    name: string;
    type: number;
    class_: number;
    ttl: number;
    rdlength: number;
    rdata: Buffer;
  },
): RecordTypeMap[RecordType] {
  const typeName = getRecordTypeName(record.type) as RecordType;

  switch (record.type) {
    case 1: // A
      return parseARecord(record.rdata) as RecordTypeMap['A'];
    case 28: // AAAA
      return parseAAAARecord(record.rdata) as RecordTypeMap['AAAA'];
    case 5: // CNAME
      return parseCNAMERecord(buffer, record.rdata) as RecordTypeMap['CNAME'];
    case 2: // NS
      return parseNSRecord(buffer, record.rdata) as RecordTypeMap['NS'];
    case 12: // PTR
      return parsePTRRecord(buffer, record.rdata) as RecordTypeMap['PTR'];
    case 15: // MX
      return parseMXRecord(buffer, record.rdata) as RecordTypeMap['MX'];
    case 33: // SRV
      return parseSRVRecord(buffer, record.rdata) as RecordTypeMap['SRV'];
    case 6: // SOA
      return parseSOARecord(buffer, record.rdata) as RecordTypeMap['SOA'];
    case 16: // TXT
      return parseTXTRecord(record.rdata)[0]! as RecordTypeMap['TXT'];
    case 257: // CAA
      return parseCAARecord(record.rdata) as RecordTypeMap['CAA'];
    default:
      throw new DnsError(
        DnsErrorCode.UNKNOWN,
        `Unsupported record type: ${typeName}`,
        { recordType: typeName },
      );
  }
}

/**
 * Parse all records of a specific type from a DNS response.
 *
 * @param buffer - Full response buffer
 * @param response - Decoded response from decodeResponse
 * @param type - Record type to parse
 * @returns Array of parsed records
 *
 * @example
 * ```typescript
 * const response = decodeResponse(buffer);
 * const records = parseRecords(buffer, response, 'A');
 * // ['93.184.216.34']
 * ```
 */
export function parseRecords<T extends RecordType>(
  buffer: Buffer,
  response: ReturnType<typeof import('./wire.js').decodeResponse>,
  type: T,
): RecordTypeMap[T][] {
  const typeValue = {
    A: 1,
    AAAA: 28,
    MX: 15,
    TXT: 16,
    CNAME: 5,
    NS: 2,
    SRV: 33,
    PTR: 12,
    SOA: 6,
    CAA: 257,
  }[type];

  const records: RecordTypeMap[T][] = [];

  for (const answer of response.answers) {
    if (answer.type === typeValue) {
      records.push(parseRecord(buffer, answer) as RecordTypeMap[T]);
    }
  }

  return records;
}

/**
 * Get the minimum TTL from a DNS response.
 *
 * @param response - Decoded response
 * @returns Minimum TTL value
 *
 * @example
 * ```typescript
 * const minTtl = getMinTtl(response);
 * // 300
 * ```
 */
export function getMinTtl(
  response: ReturnType<typeof import('./wire.js').decodeResponse>,
): number {
  let minTtl = Number.MAX_SAFE_INTEGER;

  for (const answer of response.answers) {
    if (answer.ttl < minTtl) {
      minTtl = answer.ttl;
    }
  }

  return minTtl === Number.MAX_SAFE_INTEGER ? 0 : minTtl;
}

/**
 * Check if a response indicates an NXDOMAIN error.
 *
 * @param response - Decoded response
 * @returns True if NXDOMAIN
 *
 * @example
 * ```typescript
 * if (isNXDOMAIN(response)) {
 *   throw DnsError.nxdomain('example.com');
 * }
 * ```
 */
export function isNXDOMAIN(
  response: ReturnType<typeof import('./wire.js').decodeResponse>,
): boolean {
  // RCODE is in the lower 4 bits of byte 3 (flags)
  const rcode = response.flags & 0x0f;
  return rcode === 3; // 3 = NXDOMAIN
}

/**
 * Check if a response indicates a SERVFAIL error.
 *
 * @param response - Decoded response
 * @returns True if SERVFAIL
 *
 * @example
 * ```typescript
 * if (isSERVFAIL(response)) {
 *   throw DnsError.servfail('example.com', '8.8.8.8');
 * }
 * ```
 */
export function isSERVFAIL(
  response: ReturnType<typeof import('./wire.js').decodeResponse>,
): boolean {
  const rcode = response.flags & 0x0f;
  return rcode === 2; // 2 = SERVFAIL
}

/**
 * Sort SRV records by priority and weight.
 *
 * @param records - SRV records to sort
 * @returns Sorted SRV records
 *
 * @example
 * ```typescript
 * const sorted = sortSRVRecords(srvRecords);
 * ```
 */
export function sortSRVRecords(records: SrvRecord[]): SrvRecord[] {
  // Group by priority
  const groups = new Map<number, SrvRecord[]>();

  for (const record of records) {
    if (!groups.has(record.priority)) {
      groups.set(record.priority, []);
    }
    groups.get(record.priority)!.push(record);
  }

  // Sort priorities
  const sortedPriorities = Array.from(groups.keys()).sort((a, b) => a - b);

  // Sort within each priority group by weight (descending)
  const result: SrvRecord[] = [];
  for (const priority of sortedPriorities) {
    const group = groups.get(priority)!;
    group.sort((a, b) => b.weight - a.weight);
    result.push(...group);
  }

  return result;
}
