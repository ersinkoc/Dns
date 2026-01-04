/**
 * DNS wire format encoding/decoding utilities.
 *
 * @module
 * @see {@link https://datatracker.ietf.org/doc/html/rfc1035 | RFC 1035}
 */

import { RECORD_TYPE_VALUES, RECORD_TYPE_NAMES, type RecordType } from '../types.js';
import { ValidationError } from '../errors.js';

/**
 * DNS compression pointer mask.
 *
 * @internal
 */
const POINTER_MASK = 0xc0;

/**
 * Encode a domain name to DNS wire format.
 *
 * Supports label compression if an optional compression map is provided.
 *
 * @param name - Domain name to encode
 * @param compression - Optional compression map
 * @returns Encoded buffer
 *
 * @example
 * ```typescript
 * const encoded = encodeName('example.com');
 * // Buffer <07 65 78 61 6d 70 6c 65 03 63 6f 6d 00>
 * ```
 */
export function encodeName(name: string, compression?: Map<string, number>): Buffer {
  if (!name) {
    return Buffer.from([0]);
  }

  const buffers: Buffer[] = [];
  const labels = name.split('.');

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]!;
    const fullName = labels.slice(i).join('.');

    // Check if we can use a compression pointer
    if (compression?.has(fullName)) {
      const pointer = compression.get(fullName)!;
      buffers.push(Buffer.from([(POINTER_MASK | (pointer >> 8)), pointer & 0xff]));
      break;
    }

    // Store current position for compression
    const currentPos = buffers.reduce((sum, buf) => sum + buf.length, 0) + (i === 0 ? 0 : 2);

    // Encode label length and label
    /* v8 ignore next */
    const labelBuffer = Buffer.from(label ?? '', 'latin1');
    if (labelBuffer.length > 63) {
      throw new ValidationError(`Label too long: ${label}`, label);
    }
    buffers.push(Buffer.from([labelBuffer.length]));
    buffers.push(labelBuffer);

    // Store position for future compression
    if (compression && !compression.has(fullName)) {
      compression.set(fullName, currentPos);
    }
  }

  // Add root label
  if (buffers.length === labels.length) {
    buffers.push(Buffer.from([0]));
  }

  return Buffer.concat(buffers);
}

/**
 * Decode a domain name from DNS wire format.
 *
 * Handles compression pointers.
 *
 * @param buffer - Buffer to decode from
 * @param offset - Starting offset
 * @returns Tuple of [domainName, newOffset]
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from([0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00]);
 * const [name, offset] = decodeName(buffer, 0);
 * // name = 'example.com', offset = 13
 * ```
 */
export function decodeName(buffer: Buffer, offset: number): [string, number] {
  const labels: string[] = [];
  const seen = new Set<number>();
  let originalOffset = offset;
  let compressed = false;

  while (true) {
    // Check for buffer overflow
    if (offset >= buffer.length) {
      throw new Error('Buffer overflow while decoding name');
    }

    const length = buffer[offset]!;

    // End of name
    if (length === 0) {
      offset++;
      break;
    }

    // Check for compression pointer
    if ((length & POINTER_MASK) === POINTER_MASK) {
      if (!compressed) {
        originalOffset = offset + 2;
        compressed = true;
      }

      // Get pointer offset
      const pointer = ((length & 0x3f) << 8) | buffer[offset + 1]!;

      // Check for compression loop
      if (seen.has(pointer)) {
        throw new Error('Compression loop detected');
      }
      seen.add(pointer);

      offset = pointer;
      continue;
    }

    // Read label
    const label = buffer.toString('latin1', offset + 1, offset + 1 + length);
    labels.push(label);
    offset += 1 + length;
  }

  return [labels.join('.'), compressed ? originalOffset : offset];
}

/**
 * Encode a DNS query to wire format.
 *
 * @param id - Query ID
 * @param name - Domain name
 * @param type - Record type
 * @param recursionDesired - Set RD flag
 * @returns Encoded query buffer
 *
 * @example
 * ```typescript
 * const query = encodeQuery(1234, 'example.com', 'A', true);
 * ```
 */
export function encodeQuery(id: number, name: string, type: RecordType, recursionDesired = true): Buffer {
  const parts: Buffer[] = [];

  // Header
  const header = Buffer.allocUnsafe(12);
  header.writeUInt16BE(id); // ID
  header.writeUInt16BE(recursionDesired ? 0x0100 : 0, 2); // Flags
  header.writeUInt16BE(1, 4); // QDCOUNT
  header.writeUInt16BE(0, 6); // ANCOUNT
  header.writeUInt16BE(0, 8); // NSCOUNT
  header.writeUInt16BE(0, 10); // ARCOUNT
  parts.push(header);

  // Question section
  parts.push(encodeName(name));
  parts.push(Buffer.from([RECORD_TYPE_VALUES[type], 1])); // QTYPE, QCLASS (IN)

  return Buffer.concat(parts);
}

/**
 * Decode a DNS response from wire format.
 *
 * @param buffer - Buffer to decode
 * @returns Decoded DNS response
 *
 * @example
 * ```typescript
 * const response = decodeResponse(buffer);
 * console.log(response.answers);
 * ```
 */
export function decodeResponse(buffer: Buffer) {
  if (buffer.length < 12) {
    throw new Error('Response too short');
  }

  const id = buffer.readUInt16BE(0);
  const flags = buffer.readUInt16BE(2);
  const qdcount = buffer.readUInt16BE(4);
  const ancount = buffer.readUInt16BE(6);
  const nscount = buffer.readUInt16BE(8);
  const arcount = buffer.readUInt16BE(10);

  let offset = 12;

  // Decode questions
  const questions: { name: string; type: number; class_: number }[] = [];
  for (let i = 0; i < qdcount; i++) {
    const [name, newOffset] = decodeName(buffer, offset);
    offset = newOffset;
    const type = buffer.readUInt16BE(offset);
    const class_ = buffer.readUInt16BE(offset + 2);
    offset += 4;
    questions.push({ name, type, class_ });
  }

  // Decode answers
  const answers: {
    name: string;
    type: number;
    class_: number;
    ttl: number;
    rdlength: number;
    rdata: Buffer;
  }[] = [];
  for (let i = 0; i < ancount; i++) {
    const [name, newOffset] = decodeName(buffer, offset);
    offset = newOffset;
    const type = buffer.readUInt16BE(offset);
    const class_ = buffer.readUInt16BE(offset + 2);
    const ttl = buffer.readUInt32BE(offset + 4);
    const rdlength = buffer.readUInt16BE(offset + 8);
    const rdata = buffer.subarray(offset + 10, offset + 10 + rdlength);
    offset += 10 + rdlength;
    answers.push({ name, type, class_, ttl, rdlength, rdata });
  }

  // Decode authority section
  const authorities: {
    name: string;
    type: number;
    class_: number;
    ttl: number;
    rdlength: number;
    rdata: Buffer;
  }[] = [];
  for (let i = 0; i < nscount; i++) {
    const [name, newOffset] = decodeName(buffer, offset);
    offset = newOffset;
    const type = buffer.readUInt16BE(offset);
    const class_ = buffer.readUInt16BE(offset + 2);
    const ttl = buffer.readUInt32BE(offset + 4);
    const rdlength = buffer.readUInt16BE(offset + 8);
    const rdata = buffer.subarray(offset + 10, offset + 10 + rdlength);
    offset += 10 + rdlength;
    authorities.push({ name, type, class_, ttl, rdlength, rdata });
  }

  // Decode additional section
  const additionals: {
    name: string;
    type: number;
    class_: number;
    ttl: number;
    rdlength: number;
    rdata: Buffer;
  }[] = [];
  for (let i = 0; i < arcount; i++) {
    const [name, newOffset] = decodeName(buffer, offset);
    offset = newOffset;
    const type = buffer.readUInt16BE(offset);
    const class_ = buffer.readUInt16BE(offset + 2);
    const ttl = buffer.readUInt32BE(offset + 4);
    const rdlength = buffer.readUInt16BE(offset + 8);
    const rdata = buffer.subarray(offset + 10, offset + 10 + rdlength);
    offset += 10 + rdlength;
    additionals.push({ name, type, class_, ttl, rdlength, rdata });
  }

  return {
    id,
    flags,
    questions,
    answers,
    authorities,
    additionals,
  };
}

/**
 * Get record type name from type number.
 *
 * @param type - Record type number
 * @returns Record type name
 *
 * @example
 * ```typescript
 * const name = getRecordTypeName(1); // 'A'
 * ```
 */
export function getRecordTypeName(type: number): string {
  return RECORD_TYPE_NAMES[type] || `TYPE${type}`;
}

/**
 * Get record type number from name.
 *
 * @param name - Record type name
 * @returns Record type number
 *
 * @example
 * ```typescript
 * const value = getRecordTypeValue('A'); // 1
 * ```
 */
export function getRecordTypeValue(name: RecordType): number {
  return RECORD_TYPE_VALUES[name];
}
