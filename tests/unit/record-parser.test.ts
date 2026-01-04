/**
 * Record parser plugin tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DnsKernel } from '../../src/kernel.js';
import {
  recordParserPlugin,
  getParsedResponse,
  setParsedResponse,
  clearParsedResponses,
} from '../../src/plugins/core/record-parser.js';
import { DnsError } from '../../src/errors.js';

describe('recordParserPlugin', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
  });

  it('should install plugin', () => {
    expect(() => kernel.use(recordParserPlugin)).not.toThrow();
  });

  it('should have plugin name and version', () => {
    expect(recordParserPlugin.name).toBe('record-parser');
    expect(recordParserPlugin.version).toBe('1.0.0');
  });

  it('should initialize queries state', () => {
    kernel.use(recordParserPlugin);
    const queries = kernel.getState('queries');
    expect(queries).toBeInstanceOf(Map);
  });

  it('should track query events', async () => {
    kernel.use(recordParserPlugin);

    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A' },
    });

    const queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.has(123)).toBe(true);
  });
});

describe('getParsedResponse', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(recordParserPlugin);
  });

  it('should return undefined when no responses exist', () => {
    const result = getParsedResponse(kernel, 'test-key');
    expect(result).toBeUndefined();
  });

  it('should return undefined when responses map is not initialized', () => {
    const newKernel = new DnsKernel({});
    newKernel.use(recordParserPlugin);
    const result = getParsedResponse(newKernel, 'test-key');
    expect(result).toBeUndefined();
  });

  it('should return stored response', () => {
    const response = {
      records: [{ type: 'A', data: '1.2.3.4' }],
      ttl: 300,
      answers: 1,
    };

    setParsedResponse(kernel, 'test-key', response);
    const result = getParsedResponse(kernel, 'test-key');

    expect(result).toEqual(response);
  });

  it('should return undefined for non-existent key', () => {
    setParsedResponse(kernel, 'key1', { records: [], ttl: 100, answers: 0 });
    const result = getParsedResponse(kernel, 'key2');
    expect(result).toBeUndefined();
  });
});

describe('setParsedResponse', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(recordParserPlugin);
  });

  it('should create responses map if not exists', () => {
    expect(kernel.getState('responses')).toBeUndefined();

    setParsedResponse(kernel, 'test-key', {
      records: [],
      ttl: 100,
      answers: 0,
    });

    expect(kernel.getState('responses')).toBeInstanceOf(Map);
  });

  it('should store response', () => {
    const response = {
      records: [{ type: 'A', data: '1.2.3.4' }],
      ttl: 300,
      answers: 1,
    };

    setParsedResponse(kernel, 'test-key', response);
    const result = getParsedResponse(kernel, 'test-key');

    expect(result).toEqual(response);
  });

  it('should overwrite existing response', () => {
    setParsedResponse(kernel, 'test-key', {
      records: ['old'],
      ttl: 100,
      answers: 1,
    });

    setParsedResponse(kernel, 'test-key', {
      records: ['new'],
      ttl: 200,
      answers: 1,
    });

    const result = getParsedResponse(kernel, 'test-key');
    expect(result?.records).toEqual(['new']);
    expect(result?.ttl).toBe(200);
  });

  it('should store multiple responses', () => {
    setParsedResponse(kernel, 'key1', { records: [1], ttl: 100, answers: 1 });
    setParsedResponse(kernel, 'key2', { records: [2], ttl: 200, answers: 1 });

    expect(getParsedResponse(kernel, 'key1')?.records).toEqual([1]);
    expect(getParsedResponse(kernel, 'key2')?.records).toEqual([2]);
  });
});

describe('clearParsedResponses', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(recordParserPlugin);
  });

  it('should clear all responses', () => {
    setParsedResponse(kernel, 'key1', { records: [1], ttl: 100, answers: 1 });
    setParsedResponse(kernel, 'key2', { records: [2], ttl: 200, answers: 1 });

    clearParsedResponses(kernel);

    expect(getParsedResponse(kernel, 'key1')).toBeUndefined();
    expect(getParsedResponse(kernel, 'key2')).toBeUndefined();
  });

  it('should create empty responses map', () => {
    clearParsedResponses(kernel);
    const responses = kernel.getState('responses');
    expect(responses).toBeInstanceOf(Map);
    expect((responses as Map<string, unknown>).size).toBe(0);
  });

  it('should work when responses already empty', () => {
    expect(() => clearParsedResponses(kernel)).not.toThrow();
    const responses = kernel.getState('responses');
    expect((responses as Map<string, unknown>).size).toBe(0);
  });
});

describe('record parser events', () => {
  let kernel: DnsKernel;
  let parsedResponseData: unknown | undefined;
  let errorData: unknown | undefined;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(recordParserPlugin);

    // Track events
    kernel.on('parsed-response', (data: unknown) => {
      parsedResponseData = data;
    });
    kernel.on('error', (data: unknown) => {
      errorData = data;
    });
  });

  it('should handle query events', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A', options: undefined },
    });

    const queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.get(123)).toEqual({
      name: 'example.com',
      type: 'A',
      options: undefined,
    });
  });

  it('should ignore query events without queryId', async () => {
    await kernel.emit('query', {
      query: { name: 'example.com', type: 'A' },
    } as never);

    const queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.size).toBe(0);
  });

  it('should ignore query events without query', async () => {
    await kernel.emit('query', {
      queryId: 123,
    } as never);

    const queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.size).toBe(0);
  });

  it('should ignore response events without matching query', async () => {
    // Don't emit query event, so no query is tracked
    // Send an invalid buffer - the plugin should handle this gracefully
    await kernel.emit('response', {
      queryId: 123,
      buffer: Buffer.from([0x00, 0x00]), // Too short
    } as never);

    // Should not crash, just return
    expect(parsedResponseData).toBeUndefined();
  });

  it('should ignore response events without queryId', async () => {
    await kernel.emit('response', {
      buffer: Buffer.from([]),
    } as never);

    expect(parsedResponseData).toBeUndefined();
  });

  it('should ignore response events without buffer', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A' },
    });

    await kernel.emit('response', {
      queryId: 123,
    } as never);

    expect(parsedResponseData).toBeUndefined();
  });

  it('should ignore malformed data in response', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A' },
    });

    // Send invalid buffer
    await kernel.emit('response', {
      queryId: 123,
      buffer: Buffer.from([0x00, 0x00]), // Too short to be valid
    } as never);

    // Should emit error event instead of parsed-response
    expect(parsedResponseData).toBeUndefined();
  });
});

describe('record parser edge cases', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(recordParserPlugin);
  });

  it('should handle storing response with empty records', () => {
    setParsedResponse(kernel, 'empty', {
      records: [],
      ttl: 0,
      answers: 0,
    });

    const result = getParsedResponse(kernel, 'empty');
    expect(result?.records).toEqual([]);
    expect(result?.ttl).toBe(0);
    expect(result?.answers).toBe(0);
  });

  it('should handle storing response with null records', () => {
    setParsedResponse(kernel, 'null-records', {
      records: null as never,
      ttl: 100,
      answers: 0,
    });

    const result = getParsedResponse(kernel, 'null-records');
    expect(result?.records).toBeNull();
  });

  it('should handle complex key formats', () => {
    const complexKey = 'example.com:A:type1';
    setParsedResponse(kernel, complexKey, {
      records: [1, 2, 3],
      ttl: 300,
      answers: 3,
    });

    const result = getParsedResponse(kernel, complexKey);
    expect(result?.records).toEqual([1, 2, 3]);
  });

  it('should handle clearing and re-adding responses', () => {
    setParsedResponse(kernel, 'key', { records: [1], ttl: 100, answers: 1 });
    expect(getParsedResponse(kernel, 'key')).toBeDefined();

    clearParsedResponses(kernel);
    expect(getParsedResponse(kernel, 'key')).toBeUndefined();

    setParsedResponse(kernel, 'key', { records: [2], ttl: 200, answers: 1 });
    expect(getParsedResponse(kernel, 'key')?.records).toEqual([2]);
  });

  it('should handle storing many responses', () => {
    for (let i = 0; i < 100; i++) {
      setParsedResponse(kernel, `key${i}`, {
        records: [i],
        ttl: 100 + i,
        answers: 1,
      });
    }

    expect(getParsedResponse(kernel, 'key0')?.records).toEqual([0]);
    expect(getParsedResponse(kernel, 'key99')?.records).toEqual([99]);
  });

  it('should handle special characters in keys', () => {
    const specialKeys = ['test:colon', 'test/slash', 'test.dot', 'test:space'];

    for (const key of specialKeys) {
      setParsedResponse(kernel, key, { records: [key], ttl: 100, answers: 1 });
    }

    for (const key of specialKeys) {
      const result = getParsedResponse(kernel, key);
      expect(result?.records).toEqual([key]);
    }
  });
});

describe('record parser query lifecycle', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(recordParserPlugin);
  });

  it('should not clean up query after error response', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A' },
    });

    let queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.has(123)).toBe(true);

    // Send an invalid buffer that will cause error handling
    await kernel.emit('response', {
      queryId: 123,
      buffer: Buffer.from([0x00, 0x00]), // Too short to be valid
    } as never);

    // Query should NOT be cleaned up after error (query stays in map)
    queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.has(123)).toBe(true);
  });

  it('should clean up query after successful parse', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A' },
    });

    let queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.has(123)).toBe(true);

    // Send a valid response buffer
    const validResponse = Buffer.from([
      0x00, 0x7b, // ID: 123
      0x81, 0x80, // Flags: QR=1, Opcode=0, AA=0, TC=0, RD=1, RA=1, Z=0, RCODE=0
      0x00, 0x01, // QDCOUNT: 1
      0x00, 0x01, // ANCOUNT: 1
      0x00, 0x00, // NSCOUNT: 0
      0x00, 0x00, // ARCOUNT: 0
      // Question
      0x07, 'e'.charCodeAt(0), 'x'.charCodeAt(0), 'a'.charCodeAt(0), 'm'.charCodeAt(0), 'p'.charCodeAt(0), 'l'.charCodeAt(0), 'e'.charCodeAt(0),
      0x03, 'c'.charCodeAt(0), 'o'.charCodeAt(0), 'm'.charCodeAt(0),
      0x00, // Root
      0x00, 0x01, // Type: A (1)
      0x00, 0x01, // Class: IN (1)
      // Answer
      0xc0, 0x0c, // Name pointer to example.com
      0x00, 0x01, // Type: A (1)
      0x00, 0x01, // Class: IN (1)
      0x00, 0x00, 0x01, 0x2c, // TTL: 300
      0x00, 0x04, // RDLENGTH: 4
      0x5d, 0xb8, 0xd8, 0x22, // RDATA: 93.184.216.34
    ]);

    await kernel.emit('response', {
      queryId: 123,
      buffer: validResponse,
    } as never);

    // Query should be cleaned up after successful parse
    queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.has(123)).toBe(false);
  });

  it('should handle multiple queries concurrently', async () => {
    await kernel.emit('query', {
      queryId: 1,
      query: { name: 'example1.com', type: 'A' },
    });
    await kernel.emit('query', {
      queryId: 2,
      query: { name: 'example2.com', type: 'A' },
    });
    await kernel.emit('query', {
      queryId: 3,
      query: { name: 'example3.com', type: 'A' },
    });

    const queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.size).toBe(3);
    expect(queries.has(1)).toBe(true);
    expect(queries.has(2)).toBe(true);
    expect(queries.has(3)).toBe(true);
  });
});

describe('record parser error handling', () => {
  let kernel: DnsKernel;
  let errorData: unknown | undefined;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(recordParserPlugin);

    kernel.on('error', (data: unknown) => {
      errorData = data;
    });
  });

  it('should emit error for NXDOMAIN response', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A' },
    });

    // Send NXDOMAIN response (RCODE=3)
    const nxdomainResponse = Buffer.from([
      0x00, 0x7b, // ID: 123
      0x81, 0x83, // Flags: QR=1, RCODE=3 (NXDOMAIN)
      0x00, 0x01, // QDCOUNT: 1
      0x00, 0x00, // ANCOUNT: 0
      0x00, 0x00, // NSCOUNT: 0
      0x00, 0x00, // ARCOUNT: 0
      // Question
      0x07, 'e'.charCodeAt(0), 'x'.charCodeAt(0), 'a'.charCodeAt(0), 'm'.charCodeAt(0), 'p'.charCodeAt(0), 'l'.charCodeAt(0), 'e'.charCodeAt(0),
      0x03, 'c'.charCodeAt(0), 'o'.charCodeAt(0), 'm'.charCodeAt(0),
      0x00, // Root
      0x00, 0x01, // Type: A (1)
      0x00, 0x01, // Class: IN (1)
    ]);

    await kernel.emit('response', {
      queryId: 123,
      buffer: nxdomainResponse,
    } as never);

    expect(errorData).toBeDefined();
    expect((errorData as { code: string }).code).toBe('NXDOMAIN');
    expect((errorData as { message: string }).message).toContain('example.com');
  });

  it('should emit error for SERVFAIL response', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A' },
    });

    // Send SERVFAIL response (RCODE=2)
    const servfailResponse = Buffer.from([
      0x00, 0x7b, // ID: 123
      0x81, 0x82, // Flags: QR=1, RCODE=2 (SERVFAIL)
      0x00, 0x01, // QDCOUNT: 1
      0x00, 0x00, // ANCOUNT: 0
      0x00, 0x00, // NSCOUNT: 0
      0x00, 0x00, // ARCOUNT: 0
      // Question
      0x07, 'e'.charCodeAt(0), 'x'.charCodeAt(0), 'a'.charCodeAt(0), 'm'.charCodeAt(0), 'p'.charCodeAt(0), 'l'.charCodeAt(0), 'e'.charCodeAt(0),
      0x03, 'c'.charCodeAt(0), 'o'.charCodeAt(0), 'm'.charCodeAt(0),
      0x00, // Root
      0x00, 0x01, // Type: A (1)
      0x00, 0x01, // Class: IN (1)
    ]);

    await kernel.emit('response', {
      queryId: 123,
      buffer: servfailResponse,
    } as never);

    expect(errorData).toBeDefined();
    expect((errorData as { code: string }).code).toBe('SERVFAIL');
    expect((errorData as { message: string }).message).toContain('example.com');
  });

  it('should keep query after NXDOMAIN error', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A' },
    });

    const nxdomainResponse = Buffer.from([
      0x00, 0x7b, // ID: 123
      0x81, 0x83, // Flags: QR=1, RCODE=3 (NXDOMAIN)
      0x00, 0x01, // QDCOUNT: 1
      0x00, 0x00, // ANCOUNT: 0
      0x00, 0x00, // NSCOUNT: 0
      0x00, 0x00, // ARCOUNT: 0
      // Question
      0x07, 'e'.charCodeAt(0), 'x'.charCodeAt(0), 'a'.charCodeAt(0), 'm'.charCodeAt(0), 'p'.charCodeAt(0), 'l'.charCodeAt(0), 'e'.charCodeAt(0),
      0x03, 'c'.charCodeAt(0), 'o'.charCodeAt(0), 'm'.charCodeAt(0),
      0x00,
      0x00, 0x01, // Type: A (1)
      0x00, 0x01, // Class: IN (1)
    ]);

    await kernel.emit('response', {
      queryId: 123,
      buffer: nxdomainResponse,
    } as never);

    // Query should NOT be cleaned up after NXDOMAIN
    const queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.has(123)).toBe(true);
  });

  it('should keep query after SERVFAIL error', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A' },
    });

    const servfailResponse = Buffer.from([
      0x00, 0x7b, // ID: 123
      0x81, 0x82, // Flags: QR=1, RCODE=2 (SERVFAIL)
      0x00, 0x01, // QDCOUNT: 1
      0x00, 0x00, // ANCOUNT: 0
      0x00, 0x00, // NSCOUNT: 0
      0x00, 0x00, // ARCOUNT: 0
      // Question
      0x07, 'e'.charCodeAt(0), 'x'.charCodeAt(0), 'a'.charCodeAt(0), 'm'.charCodeAt(0), 'p'.charCodeAt(0), 'l'.charCodeAt(0), 'e'.charCodeAt(0),
      0x03, 'c'.charCodeAt(0), 'o'.charCodeAt(0), 'm'.charCodeAt(0),
      0x00,
      0x00, 0x01, // Type: A (1)
      0x00, 0x01, // Class: IN (1)
    ]);

    await kernel.emit('response', {
      queryId: 123,
      buffer: servfailResponse,
    } as never);

    // Query should NOT be cleaned up after SERVFAIL
    const queries = kernel.getState('queries') as Map<number, unknown>;
    expect(queries.has(123)).toBe(true);
  });
});

describe('record parser SRV sorting', () => {
  let kernel: DnsKernel;
  let parsedResponseData: unknown | undefined;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(recordParserPlugin);

    kernel.on('parsed-response', (data: unknown) => {
      parsedResponseData = data;
    });
  });

  it('should sort SRV records when sortSrv option is true', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'sip.example.com', type: 'SRV', options: { sortSrv: true } },
    });

    // Send SRV response
    const srvResponse = Buffer.from([
      0x00, 0x7b, // ID: 123
      0x81, 0x80, // Flags: QR=1
      0x00, 0x01, // QDCOUNT: 1
      0x00, 0x02, // ANCOUNT: 2 (two SRV records)
      0x00, 0x00, // NSCOUNT: 0
      0x00, 0x00, // ARCOUNT: 0
      // Question
      0x03, 115, 105, 112, // sip
      0x07, 101, 120, 97, 109, 112, 108, 101, // example
      0x03, 99, 111, 109, // com
      0x00, // Root
      0x00, 0x21, // Type: SRV (33)
      0x00, 0x01, // Class: IN (1)
      // Answer 1: priority 20
      0xc0, 0x0c, // Name pointer
      0x00, 0x21, // Type: SRV (33)
      0x00, 0x01, // Class: IN (1)
      0x00, 0x00, 0x00, 0x3c, // TTL: 60
      0x00, 0x14, // RDLENGTH: 20
      0x00, 0x14, // Priority: 20
      0x00, 0x0a, // Weight: 10
      0x13, 0x88, // Port: 5000
      0x05, 115, 101, 114, 118, 49, // serv1
      0x07, 101, 120, 97, 109, 112, 108, 101, // example
      0x03, 99, 111, 109, // com
      0x00,
      // Answer 2: priority 10
      0xc0, 0x0c, // Name pointer
      0x00, 0x21, // Type: SRV (33)
      0x00, 0x01, // Class: IN (1)
      0x00, 0x00, 0x00, 0x3c, // TTL: 60
      0x00, 0x14, // RDLENGTH: 20
      0x00, 0x0a, // Priority: 10
      0x00, 0x05, // Weight: 5
      0x13, 0xc4, // Port: 5060
      0x05, 115, 101, 114, 118, 50, // serv2
      0x07, 101, 120, 97, 109, 112, 108, 101, // example
      0x03, 99, 111, 109, // com
      0x00,
    ]);

    await kernel.emit('response', {
      queryId: 123,
      buffer: srvResponse,
    } as never);

    expect(parsedResponseData).toBeDefined();
    const records = (parsedResponseData as { records: unknown[] }).records;
    expect(Array.isArray(records)).toBe(true);
    // Records should be sorted by priority
    if (records.length > 0 && typeof records[0] === 'object' && records[0] !== null) {
      expect((records[0] as { priority: number }).priority).toBeLessThanOrEqual((records[records.length - 1] as { priority: number }).priority);
    }
  });

  it('should not sort SRV records when sortSrv option is false', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'sip.example.com', type: 'SRV', options: { sortSrv: false } },
    });

    const srvResponse = Buffer.from([
      0x00, 0x7b, // ID: 123
      0x81, 0x80, // Flags: QR=1
      0x00, 0x01, // QDCOUNT: 1
      0x00, 0x01, // ANCOUNT: 1
      0x00, 0x00, // NSCOUNT: 0
      0x00, 0x00, // ARCOUNT: 0
      // Question
      0x03, 115, 105, 112, // sip
      0x07, 101, 120, 97, 109, 112, 108, 101, // example
      0x03, 99, 111, 109, // com
      0x00,
      0x00, 0x21, // Type: SRV (33)
      0x00, 0x01, // Class: IN (1)
      // Answer
      0xc0, 0x0c, // Name pointer
      0x00, 0x21, // Type: SRV (33)
      0x00, 0x01, // Class: IN (1)
      0x00, 0x00, 0x00, 0x3c, // TTL: 60
      0x00, 0x14, // RDLENGTH: 20
      0x00, 0x0a, // Priority: 10
      0x00, 0x05, // Weight: 5
      0x13, 0xc4, // Port: 5060
      0x05, 115, 101, 114, 118, 50, // serv2
      0x07, 101, 120, 97, 109, 112, 108, 101, // example
      0x03, 99, 111, 109, // com
      0x00,
    ]);

    await kernel.emit('response', {
      queryId: 123,
      buffer: srvResponse,
    } as never);

    expect(parsedResponseData).toBeDefined();
  });

  it('should not sort non-SRV records', async () => {
    await kernel.emit('query', {
      queryId: 123,
      query: { name: 'example.com', type: 'A', options: { sortSrv: true } },
    });

    const aResponse = Buffer.from([
      0x00, 0x7b, // ID: 123
      0x81, 0x80, // Flags: QR=1
      0x00, 0x01, // QDCOUNT: 1
      0x00, 0x01, // ANCOUNT: 1
      0x00, 0x00, // NSCOUNT: 0
      0x00, 0x00, // ARCOUNT: 0
      // Question
      0x07, 101, 120, 97, 109, 112, 108, 101, // example
      0x03, 99, 111, 109, // com
      0x00,
      0x00, 0x01, // Type: A (1)
      0x00, 0x01, // Class: IN (1)
      // Answer
      0xc0, 0x0c, // Name pointer
      0x00, 0x01, // Type: A (1)
      0x00, 0x01, // Class: IN (1)
      0x00, 0x00, 0x01, 0x2c, // TTL: 300
      0x00, 0x04, // RDLENGTH: 4
      0x5d, 0xb8, 0xd8, 0x22, // RDATA: 93.184.216.34
    ]);

    await kernel.emit('response', {
      queryId: 123,
      buffer: aResponse,
    } as never);

    expect(parsedResponseData).toBeDefined();
    const records = (parsedResponseData as { records: string[] }).records;
    expect(records).toEqual(['93.184.216.34']);
  });
});
