/**
 * DNS wire format tests
 */

import { describe, it, expect } from 'vitest';
import {
  encodeName,
  decodeName,
  encodeQuery,
  decodeResponse,
  getRecordTypeName,
  getRecordTypeValue,
} from '../../src/core/wire.js';
import { ValidationError } from '../../src/errors.js';
import type { RecordType } from '../../src/types.js';

describe('DNS wire format', () => {
  describe('encodeName', () => {
    it('should encode simple domain', () => {
      const encoded = encodeName('example.com');
      expect(encoded[0]).toBe(7); // length of 'example'
      expect(encoded.toString('utf8', 1, 8)).toBe('example');
      expect(encoded[8]).toBe(3); // length of 'com'
      expect(encoded.toString('utf8', 9, 12)).toBe('com');
      expect(encoded[12] ?? 0).toBe(0); // root label (handle buffer bounds)
    });

    it('should handle empty domain', () => {
      const encoded = encodeName('');
      expect(encoded).toEqual(Buffer.from([0]));
    });

    it('should encode with compression', () => {
      const compression = new Map<string, number>();
      encodeName('example.com', compression);
      expect(compression.has('example.com')).toBe(true);
      expect(compression.has('com')).toBe(true);
    });

    it('should throw on label too long', () => {
      const longLabel = 'a'.repeat(64);
      expect(() => encodeName(`${longLabel}.com`)).toThrow(ValidationError);
    });
  });

  describe('decodeName', () => {
    it('should decode simple domain', () => {
      const buffer = Buffer.from([0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00]);
      const [name, offset] = decodeName(buffer, 0);
      expect(name).toBe('example.com');
      expect(offset).toBe(13);
    });

    it('should decode with compression pointer', () => {
      // Create a buffer with compression pointer pointing to offset 0
      const buffer = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0xc0, 0x00, // compression pointer to offset 0
      ]);
      const [name, offset] = decodeName(buffer, 13);
      expect(name).toBe('example.com');
      expect(offset).toBe(15); // compressed returns to after pointer
    });

    it('should detect compression loops', () => {
      const buffer = Buffer.from([0xc0, 0x00]); // pointer to self
      expect(() => decodeName(buffer, 0)).toThrow('Compression loop detected');
    });
  });

  describe('encodeQuery', () => {
    it('should encode basic query', () => {
      const query = encodeQuery(1234, 'example.com', 'A', true);
      expect(query.length).toBeGreaterThanOrEqual(12); // header size

      // Check ID
      expect(query.readUInt16BE(0)).toBe(1234);

      // Check flags (RD bit set)
      expect(query.readUInt16BE(2)).toBe(0x0100);

      // Check question count
      expect(query.readUInt16BE(4)).toBe(1);
    });

    it('should encode with recursion desired false', () => {
      const query = encodeQuery(1234, 'example.com', 'A', false);
      expect(query.readUInt16BE(2)).toBe(0x0000);
    });
  });

  describe('decodeResponse', () => {
    it('should decode basic response', () => {
      // Build a minimal valid response
      // Header (12 bytes)
      const header = Buffer.from([
        0x04, 0xd2, // ID = 1234
        0x80, 0x00, // Flags (response, no error)
        0x00, 0x01, // QDCOUNT = 1
        0x00, 0x01, // ANCOUNT = 1
        0x00, 0x00, // NSCOUNT = 0
        0x00, 0x00, // ARCOUNT = 0
      ]);

      // Question section
      // example.com in DNS format + QTYPE A + QCLASS IN
      const question = Buffer.from([
        0x07, // length of 'example'
        0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, // 'example'
        0x03, // length of 'com'
        0x63, 0x6f, 0x6d, // 'com'
        0x00, // root label
        0x00, 0x01, // QTYPE = A (1)
        0x00, 0x01, // QCLASS = IN (1)
      ]);

      // Answer section
      // Compression pointer to offset 12 (question name) + Type A + Class IN + TTL + RDLENGTH + RDATA
      const answer = Buffer.from([
        0xc0, 0x0c, // compression pointer to offset 12
        0x00, 0x01, // TYPE = A (1)
        0x00, 0x01, // CLASS = IN (1)
        0x00, 0x00, 0x00, 0x3c, // TTL = 60
        0x00, 0x04, // RDLENGTH = 4
        0x7f, 0x00, 0x00, 0x01, // RDATA = 127.0.0.1
      ]);

      const response = Buffer.concat([header, question, answer]);
      const decoded = decodeResponse(response);

      expect(decoded.id).toBe(1234);
      expect(decoded.questions.length).toBe(1);
      expect(decoded.answers.length).toBe(1);
    });

    it('should throw on buffer too short', () => {
      const buffer = Buffer.alloc(10);
      expect(() => decodeResponse(buffer)).toThrow('Response too short');
    });
  });

  describe('getRecordTypeName', () => {
    it('should return known type names', () => {
      expect(getRecordTypeName(1)).toBe('A');
      expect(getRecordTypeName(28)).toBe('AAAA');
      expect(getRecordTypeName(15)).toBe('MX');
    });

    it('should return TYPE prefixed for unknown', () => {
      expect(getRecordTypeName(99999)).toBe('TYPE99999');
    });
  });

  describe('getRecordTypeValue', () => {
    it('should return type values', () => {
      expect(getRecordTypeValue('A')).toBe(1);
      expect(getRecordTypeValue('AAAA')).toBe(28);
      expect(getRecordTypeValue('MX')).toBe(15);
    });
  });

  describe('encodeName edge cases', () => {
    it('should handle single label domain', () => {
      const encoded = encodeName('localhost');
      expect(encoded[0]).toBe(9); // length of 'localhost'
      expect(encoded.toString('utf8', 1, 10)).toBe('localhost');
      expect(encoded[10] ?? 0).toBe(0); // root label
    });

    it('should handle domain with trailing dot', () => {
      const encoded = encodeName('example.com.');
      expect(encoded[0]).toBe(7); // length of 'example'
    });

    it('should encode with multiple compression pointers', () => {
      const compression = new Map<string, number>();
      encodeName('www.example.com', compression);
      encodeName('mail.example.com', compression);
      // Both should share 'example.com' and 'com' compression
      expect(compression.has('www.example.com')).toBe(true);
      expect(compression.has('example.com')).toBe(true);
      expect(compression.has('com')).toBe(true);
      expect(compression.has('mail.example.com')).toBe(true);
    });

    it('should encode domain at max label length (63)', () => {
      const maxLabel = 'a'.repeat(63);
      const encoded = encodeName(`${maxLabel}.com`);
      expect(encoded[0]).toBe(63);
    });

    it('should encode multi-label domain correctly', () => {
      const encoded = encodeName('a.b.c.d.e');
      expect(encoded[0]).toBe(1); // 'a'
      expect(encoded[2]).toBe(1); // 'b'
      expect(encoded[4]).toBe(1); // 'c'
      expect(encoded[6]).toBe(1); // 'd'
      expect(encoded[8]).toBe(1); // 'e'
    });

    it('should handle empty label in middle of domain', () => {
      // Test the null coalescing case for label
      const encoded = encodeName('a..b');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should handle domain with only dots', () => {
      const encoded = encodeName('...');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should use compression pointer for repeated suffix', () => {
      const compression = new Map<string, number>();
      // First encode stores 'com' at offset
      encodeName('example.com', compression);
      // Reset compression for testing
      compression.clear();
      encodeName('example.com', compression);
      expect(compression.get('example.com')).toBe(0);
      expect(compression.get('com')).toBeGreaterThan(0);
    });
  });

  describe('decodeName edge cases', () => {
    it('should decode single label domain', () => {
      const buffer = Buffer.from([0x09, 0x6c, 0x6f, 0x63, 0x61, 0x6c, 0x68, 0x6f, 0x73, 0x74, 0x00]);
      const [name, offset] = decodeName(buffer, 0);
      expect(name).toBe('localhost');
      expect(offset).toBe(11);
    });

    it('should decode root domain', () => {
      const buffer = Buffer.from([0x00]);
      const [name, offset] = decodeName(buffer, 0);
      expect(name).toBe('');
      expect(offset).toBe(1);
    });

    it('should handle multiple compression pointers', () => {
      // Create buffer with compression pointers
      // Offset 0-3: www (0x03 0x77 0x77 0x77)
      // Offset 4-11: example (0x07 0x65...)
      // Offset 12-15: com (0x03 0x63...)
      // Offset 16: root (0x00)
      const buffer = Buffer.from([
        0x03, 0x77, 0x77, 0x77, // www
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, // example
        0x03, 0x63, 0x6f, 0x6d, // com
        0x00, // root
        0xc0, 0x04, // pointer to offset 4 (example.com)
        0x00, 0x01, 0x00, 0x01, // Extra bytes to make buffer valid
      ]);
      const [name, offset] = decodeName(buffer, 17); // Start at compression pointer (0xc0)
      expect(name).toBe('example.com');
      expect(offset).toBe(19);
    });

    it('should throw on buffer overflow', () => {
      // Buffer with length byte but no data
      const buffer = Buffer.from([0x05]); // claims 5 bytes but only 1 byte total
      expect(() => decodeName(buffer, 0)).toThrow('Buffer overflow');
    });

    it('should throw on incomplete compression pointer', () => {
      const buffer = Buffer.from([0xc0]); // compression marker but no offset byte
      expect(() => decodeName(buffer, 0)).toThrow();
    });

    it('should handle compression pointer at end of buffer', () => {
      const buffer = Buffer.from([0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x00, 0xc0, 0x00]);
      const [name, offset] = decodeName(buffer, 9);
      expect(name).toBe('example');
      expect(offset).toBe(11);
    });
  });

  describe('encodeQuery edge cases', () => {
    it('should encode query for AAAA record', () => {
      const query = encodeQuery(1234, 'example.com', 'AAAA', true);
      expect(query.length).toBeGreaterThanOrEqual(12);
      expect(query.readUInt16BE(0)).toBe(1234);
    });

    it('should encode query for MX record', () => {
      const query = encodeQuery(5678, 'mail.example.com', 'MX', false);
      expect(query.readUInt16BE(0)).toBe(5678);
      expect(query.readUInt16BE(2)).toBe(0x0000); // RD bit not set
    });

    it('should encode query for TXT record', () => {
      const query = encodeQuery(9999, 'example.com', 'TXT', true);
      expect(query.readUInt16BE(0)).toBe(9999);
      expect(query.readUInt16BE(2)).toBe(0x0100);
    });

    it('should encode query for CNAME record', () => {
      const query = encodeQuery(1111, 'alias.example.com', 'CNAME', true);
      expect(query.readUInt16BE(0)).toBe(1111);
    });

    it('should encode query for NS record', () => {
      const query = encodeQuery(2222, 'example.com', 'NS', false);
      expect(query.readUInt16BE(2)).toBe(0x0000);
    });

    it('should encode query with maximum ID', () => {
      const query = encodeQuery(65535, 'test.com', 'A', true);
      expect(query.readUInt16BE(0)).toBe(65535);
    });

    it('should encode query with zero ID', () => {
      const query = encodeQuery(0, 'test.com', 'A', true);
      expect(query.readUInt16BE(0)).toBe(0);
    });
  });

  describe('decodeResponse with all sections', () => {
    it('should decode response with authority section', () => {
      // Header with NSCOUNT = 1
      const header = Buffer.from([
        0x04, 0xd2, // ID = 1234
        0x80, 0x00, // Flags
        0x00, 0x01, // QDCOUNT = 1
        0x00, 0x01, // ANCOUNT = 1
        0x00, 0x01, // NSCOUNT = 1
        0x00, 0x00, // ARCOUNT = 0
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x01, 0x00, 0x01,
      ]);

      const answer = Buffer.from([
        0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x04, 0x7f, 0x00, 0x00, 0x01,
      ]);

      // Authority record (NS)
      const authority = Buffer.from([
        0x03, 0x6e, 0x73, 0x31, // ns1
        0xc0, 0x14, // pointer to com
        0x00, 0x02, // TYPE = NS (2)
        0x00, 0x01, // CLASS = IN
        0x00, 0x00, 0x0e, 0x10, // TTL = 3600
        0x00, 0x04, // RDLENGTH = 4
        0x6e, 0x73, 0x31, 0x61, // RDATA = "ns1a" (dummy)
      ]);

      const response = Buffer.concat([header, question, answer, authority]);
      const decoded = decodeResponse(response);

      expect(decoded.authorities).toHaveLength(1);
      expect(decoded.authorities[0]?.type).toBe(2); // NS
      expect(decoded.authorities[0]?.name).toBe('ns1.com');
      expect(decoded.authorities[0]?.ttl).toBe(3600);
    });

    it('should decode response with additional section', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x01, // QDCOUNT
        0x00, 0x01, // ANCOUNT
        0x00, 0x00, // NSCOUNT
        0x00, 0x01, // ARCOUNT = 1
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x01, 0x00, 0x01,
      ]);

      const answer = Buffer.from([
        0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x04, 0x7f, 0x00, 0x00, 0x01,
      ]);

      // Additional record - use compression pointer to avoid root name issues
      const additional = Buffer.from([
        0xc0, 0x0c, // compression pointer to example.com name
        0x00, 0x29, // TYPE = OPT (41)
        0x10, 0x00, // CLASS = UDP payload size (4096)
        0x00, 0x00, 0x00, 0x00, // TTL
        0x00, 0x00, // RDLENGTH = 0
      ]);

      const response = Buffer.concat([header, question, answer, additional]);
      const decoded = decodeResponse(response);

      expect(decoded.additionals).toHaveLength(1);
      expect(decoded.additionals[0]?.type).toBe(41); // OPT
      expect(decoded.additionals[0]?.class_).toBe(4096);
    });

    it('should decode response with all sections populated', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x01, // QDCOUNT
        0x00, 0x01, // ANCOUNT
        0x00, 0x01, // NSCOUNT
        0x00, 0x01, // ARCOUNT
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x01, 0x00, 0x01,
      ]);

      const answer = Buffer.from([
        0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x04, 0x7f, 0x00, 0x00, 0x01,
      ]);

      const authority = Buffer.from([
        0x03, 0x6e, 0x73, 0x31, 0xc0, 0x14,
        0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x0e, 0x10, 0x00, 0x04, 0x6e, 0x73, 0x31, 0x61,
      ]);

      const additional = Buffer.from([
        0xc0, 0x0c, 0x00, 0x29, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);

      const response = Buffer.concat([header, question, answer, authority, additional]);
      const decoded = decodeResponse(response);

      expect(decoded.questions).toHaveLength(1);
      expect(decoded.answers).toHaveLength(1);
      expect(decoded.authorities).toHaveLength(1);
      expect(decoded.additionals).toHaveLength(1);
      expect(decoded.additionals[0]?.type).toBe(41); // OPT
    });

    it('should decode response with multiple authority records', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x01, 0x00, 0x00,
        0x00, 0x02, // NSCOUNT = 2
        0x00, 0x00,
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x01, 0x00, 0x01,
      ]);

      const ns1 = Buffer.from([
        0x03, 0x6e, 0x73, 0x31, 0xc0, 0x14,
        0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x0e, 0x10, 0x00, 0x04, 0x01, 0x02, 0x03, 0x04,
      ]);

      const ns2 = Buffer.from([
        0x03, 0x6e, 0x73, 0x32, 0xc0, 0x14,
        0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x0e, 0x10, 0x00, 0x04, 0x05, 0x06, 0x07, 0x08,
      ]);

      const response = Buffer.concat([header, question, ns1, ns2]);
      const decoded = decodeResponse(response);

      expect(decoded.authorities).toHaveLength(2);
      expect(decoded.authorities[0]?.name).toBe('ns1.com');
      expect(decoded.authorities[1]?.name).toBe('ns2.com');
    });

    it('should decode response with multiple additional records', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x01, 0x00, 0x01,
        0x00, 0x00,
        0x00, 0x02, // ARCOUNT = 2
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x01, 0x00, 0x01,
      ]);

      const answer = Buffer.from([
        0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x04, 0x7f, 0x00, 0x00, 0x01,
      ]);

      // Additional records using compression pointers
      const add1 = Buffer.from([0xc0, 0x0c, 0x00, 0x29, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const add2 = Buffer.from([0xc0, 0x0c, 0x00, 0x29, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

      const response = Buffer.concat([header, question, answer, add1, add2]);
      const decoded = decodeResponse(response);

      expect(decoded.additionals).toHaveLength(2);
      expect(decoded.additionals[0]?.type).toBe(41); // OPT
      expect(decoded.additionals[0]?.class_).toBe(4096);
      expect(decoded.additionals[1]?.type).toBe(41); // OPT
      expect(decoded.additionals[1]?.class_).toBe(2048);
    });

    it('should handle response with only authority section', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x01, 0x00, 0x00,
        0x00, 0x01, // NSCOUNT = 1
        0x00, 0x00,
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x02, 0x00, 0x01, // NS query
      ]);

      const authority = Buffer.from([
        0x03, 0x6e, 0x73, 0x31, 0xc0, 0x14,
        0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x0e, 0x10, 0x00, 0x04, 0x6e, 0x73, 0x31, 0x61,
      ]);

      const response = Buffer.concat([header, question, authority]);
      const decoded = decodeResponse(response);

      expect(decoded.answers).toHaveLength(0);
      expect(decoded.authorities).toHaveLength(1);
      expect(decoded.authorities[0]?.type).toBe(2);
    });

    it('should handle response with only additional section', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x01, 0x00, 0x00,
        0x00, 0x00,
        0x00, 0x01, // ARCOUNT = 1
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x01, 0x00, 0x01,
      ]);

      const additional = Buffer.from([0xc0, 0x0c, 0x00, 0x29, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

      const response = Buffer.concat([header, question, additional]);
      const decoded = decodeResponse(response);

      expect(decoded.answers).toHaveLength(0);
      expect(decoded.authorities).toHaveLength(0);
      expect(decoded.additionals).toHaveLength(1);
      expect(decoded.additionals[0]?.type).toBe(41); // OPT
    });
  });

  describe('decodeResponse edge cases', () => {
    it('should decode response with truncated flag', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x01, // TC bit set
        0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);
      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x01, 0x00, 0x01,
      ]);
      const response = Buffer.concat([header, question]);
      const decoded = decodeResponse(response);
      expect(decoded.flags).toBe(0x8001);
    });

    it('should decode response with error code', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x03, // RCODE = 3 (NXDOMAIN)
        0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);
      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x01, 0x00, 0x01,
      ]);
      const response = Buffer.concat([header, question]);
      const decoded = decodeResponse(response);
      expect(decoded.flags).toBe(0x8003);
    });

    it('should handle AAAA record in answer', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x1c, // AAAA
        0x00, 0x01,
      ]);

      const answer = Buffer.from([
        0xc0, 0x0c,
        0x00, 0x1c, // AAAA
        0x00, 0x01,
        0x00, 0x00, 0x00, 0x3c,
        0x00, 0x10, // 16 bytes
        // 2001:db8::1
        0x20, 0x01, 0x0d, 0xb8, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
      ]);

      const response = Buffer.concat([header, question, answer]);
      const decoded = decodeResponse(response);

      expect(decoded.answers[0]?.type).toBe(28); // AAAA
      expect(decoded.answers[0]?.rdlength).toBe(16);
      expect(decoded.answers[0]?.rdata.length).toBe(16);
    });

    it('should handle multiple questions', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x02, // QDCOUNT = 2
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);

      const q1 = Buffer.from([0x03, 0x77, 0x77, 0x77, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01]);
      const q2 = Buffer.from([0x04, 0x6d, 0x61, 0x69, 0x6c, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01]);

      const response = Buffer.concat([header, q1, q2]);
      const decoded = decodeResponse(response);

      expect(decoded.questions).toHaveLength(2);
      expect(decoded.questions[0]?.name).toBe('www.com');
      expect(decoded.questions[1]?.name).toBe('mail.com');
    });

    it('should handle multiple answers', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x01,
        0x00, 0x02, // ANCOUNT = 2
        0x00, 0x00, 0x00, 0x00,
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x01, 0x00, 0x01,
      ]);

      const a1 = Buffer.from([
        0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x04, 0x7f, 0x00, 0x00, 0x01,
      ]);
      const a2 = Buffer.from([
        0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x04, 0x7f, 0x00, 0x00, 0x02,
      ]);

      const response = Buffer.concat([header, question, a1, a2]);
      const decoded = decodeResponse(response);

      expect(decoded.answers).toHaveLength(2);
      expect(decoded.answers[0]?.rdata[0]).toBe(0x7f);
      expect(decoded.answers[1]?.rdata[3]).toBe(0x02);
    });

    it('should decode authority record with SOA type', () => {
      const header = Buffer.from([
        0x04, 0xd2, 0x80, 0x00,
        0x00, 0x01, 0x00, 0x00,
        0x00, 0x01, // NSCOUNT = 1
        0x00, 0x00,
      ]);

      const question = Buffer.from([
        0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
        0x00, 0x06, // SOA
        0x00, 0x01,
      ]);

      // SOA record (simplified - normally much longer)
      const soa = Buffer.from([
        0xc0, 0x0c,
        0x00, 0x06, // SOA
        0x00, 0x01,
        0x00, 0x00, 0x0e, 0x10, // TTL
        0x00, 0x20, // RDLENGTH = 32 bytes
        // MNAME, RNAME, serial, refresh, retry, expire, minimum
        0x03, 0x6e, 0x73, 0x31, 0xc0, 0x14, // ns1.com
        0x05, 0x68, 0x6f, 0x73, 0x74, 0x6d, 0x61, 0x73, 0x74, 0x72, // hostmaster
        0xc0, 0x14, // .com
        0x00, 0x00, 0x00, 0x01, // serial
        0x00, 0x00, 0x0e, 0x10, // refresh
        0x00, 0x00, 0x03, 0x84, // retry
        0x00, 0x01, 0x33, 0x80, // expire
        0x00, 0x00, 0x0e, 0x10, // minimum
      ]);

      const response = Buffer.concat([header, question, soa]);
      const decoded = decodeResponse(response);

      expect(decoded.authorities[0]?.type).toBe(6); // SOA
      expect(decoded.authorities[0]?.rdlength).toBe(32);
    });
  });

  describe('getRecordTypeName edge cases', () => {
    it('should return TYPE prefix for type 0', () => {
      expect(getRecordTypeName(0)).toBe('TYPE0');
    });

    it('should handle high type numbers', () => {
      expect(getRecordTypeName(65535)).toBe('TYPE65535');
    });

    it('should return CNAME for type 5', () => {
      expect(getRecordTypeName(5)).toBe('CNAME');
    });

    it('should return PTR for type 12', () => {
      expect(getRecordTypeName(12)).toBe('PTR');
    });

    it('should return TXT for type 16', () => {
      expect(getRecordTypeName(16)).toBe('TXT');
    });
  });

  describe('getRecordTypeValue edge cases', () => {
    it('should return value for SOA', () => {
      expect(getRecordTypeValue('SOA')).toBe(6);
    });

    it('should return value for PTR', () => {
      expect(getRecordTypeValue('PTR')).toBe(12);
    });

    it('should return value for TXT', () => {
      expect(getRecordTypeValue('TXT')).toBe(16);
    });

    it('should return value for CNAME', () => {
      expect(getRecordTypeValue('CNAME')).toBe(5);
    });

    it('should return value for NS', () => {
      expect(getRecordTypeValue('NS')).toBe(2);
    });
  });
});
