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
});
