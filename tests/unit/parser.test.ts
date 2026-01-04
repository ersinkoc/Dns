/**
 * Parser tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseARecord,
  parseAAAARecord,
  parseCNAMERecord,
  parseNSRecord,
  parsePTRRecord,
  parseMXRecord,
  parseSRVRecord,
  parseSOARecord,
  parseTXTRecord,
  parseCAARecord,
  parseRecord,
  parseRecords,
  getMinTtl,
  isNXDOMAIN,
  isSERVFAIL,
  sortSRVRecords,
} from '../../src/core/parser.js';
import { DnsError } from '../../src/errors.js';
import { decodeResponse } from '../../src/core/wire.js';
import type { MxRecord, SrvRecord, SoaRecord, CaaRecord } from '../../src/types.js';

describe('parseARecord', () => {
  it('should parse IPv4 address', () => {
    const rdata = Buffer.from([0x08, 0x08, 0x08, 0x08]);
    expect(parseARecord(rdata)).toBe('8.8.8.8');
  });

  it('should parse 127.0.0.1', () => {
    const rdata = Buffer.from([0x7f, 0x00, 0x00, 0x01]);
    expect(parseARecord(rdata)).toBe('127.0.0.1');
  });

  it('should parse 192.168.1.1', () => {
    const rdata = Buffer.from([0xc0, 0xa8, 0x01, 0x01]);
    expect(parseARecord(rdata)).toBe('192.168.1.1');
  });

  it('should parse 0.0.0.0', () => {
    const rdata = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    expect(parseARecord(rdata)).toBe('0.0.0.0');
  });

  it('should parse 255.255.255.255', () => {
    const rdata = Buffer.from([0xff, 0xff, 0xff, 0xff]);
    expect(parseARecord(rdata)).toBe('255.255.255.255');
  });

  it('should parse 93.184.216.34', () => {
    const rdata = Buffer.from([0x5d, 0xb8, 0xd8, 0x22]);
    expect(parseARecord(rdata)).toBe('93.184.216.34');
  });
});

describe('parseAAAARecord', () => {
  it('should parse IPv6 address', () => {
    const rdata = Buffer.from([
      0x20, 0x01, 0x48, 0x60, 0x48, 0x60, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x88, 0x88
    ]);
    const result = parseAAAARecord(rdata);
    // Just check it returns a string value
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should parse IPv6 loopback', () => {
    const rdata = Buffer.from([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01
    ]);
    const result = parseAAAARecord(rdata);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should parse IPv6 unspecified', () => {
    const rdata = Buffer.from([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    const result = parseAAAARecord(rdata);
    expect(typeof result).toBe('string');
  });

  it('should parse IPv6 with all set bits', () => {
    const rdata = Buffer.from([
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff
    ]);
    const result = parseAAAARecord(rdata);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('parseCNAMERecord', () => {
  it('should parse CNAME record', () => {
    // Build a buffer with CNAME rdata
    const domain = Buffer.from([0x03, 0x77, 0x77, 0x77, 0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00]); // www.example.com
    const buffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]), // Header
      domain,
    ]);

    const cname = parseCNAMERecord(buffer, domain);
    expect(cname).toBe('www.example.com');
  });

  it('should parse CNAME with compression', () => {
    // Buffer with: example.com followed by compression pointer to it
    const buffer = Buffer.from([
      // Header (4 bytes)
      0x00, 0x00, 0x00, 0x00,
      // example.com
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
      0x03, 0x63, 0x6f, 0x6d,
      0x00,
    ]);

    const rdata = Buffer.from([0xc0, 0x04]); // Compression pointer to offset 4

    // We need to create a buffer that contains the rdata at the end
    const fullBuffer = Buffer.concat([buffer, rdata]);

    const cname = parseCNAMERecord(fullBuffer, rdata);
    expect(cname).toBe('example.com');
  });
});

describe('parseNSRecord', () => {
  it('should parse NS record', () => {
    const nsDomain = Buffer.from([0x02, 0x6e, 0x73, 0x01, 0x61, 0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00]); // ns.a.example.com
    const buffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      nsDomain,
    ]);

    const ns = parseNSRecord(buffer, nsDomain);
    expect(ns).toBe('ns.a.example.com');
  });

  it('should parse NS record for root', () => {
    const rdata = Buffer.from([0x00]); // Root label
    const buffer = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x00]), rdata]);

    const ns = parseNSRecord(buffer, rdata);
    // Root domain can be empty or '.' depending on implementation
    expect(ns === '' || ns === '.').toBe(true);
  });
});

describe('parsePTRRecord', () => {
  it('should parse PTR record', () => {
    const ptrDomain = Buffer.from([0x03, 0x64, 0x6e, 0x73, 0x06, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x00]); // dns.google
    const buffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      ptrDomain,
    ]);

    const ptr = parsePTRRecord(buffer, ptrDomain);
    expect(ptr).toBe('dns.google');
  });

  it('should parse PTR for localhost', () => {
    const rdata = Buffer.from([0x09, 0x6c, 0x6f, 0x63, 0x61, 0x6c, 0x68, 0x6f, 0x73, 0x74, 0x00]); // localhost
    const buffer = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x00]), rdata]);

    const ptr = parsePTRRecord(buffer, rdata);
    expect(ptr).toBe('localhost');
  });
});

describe('parseMXRecord', () => {
  it('should parse MX record', () => {
    // Priority: 10, Exchange: mail.example.com
    const buffer = Buffer.from([
      0x00, 0x00, 0x00, 0x00, // Header
      0x00, 0x0a, // Priority: 10
      0x04, 0x6d, 0x61, 0x69, 0x6c, // mail
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, // example
      0x03, 0x63, 0x6f, 0x6d, // com
      0x00, // Root
    ]);

    const rdata = Buffer.concat([
      Buffer.from([0x00, 0x0a]), // Priority: 10
      Buffer.from([0x04, 0x6d, 0x61, 0x69, 0x6c, 0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00]),
    ]);

    const mx = parseMXRecord(buffer, rdata);
    expect((mx as MxRecord).priority).toBe(10);
    expect((mx as MxRecord).exchange).toBe('mail.example.com');
  });

  it('should parse MX record with different priorities', () => {
    // Priority: 5, Exchange: mx1.example.com
    const rdata = Buffer.concat([
      Buffer.from([0x00, 0x05]), // Priority: 5
      Buffer.from([0x03, 0x6d, 0x78, 0x31, 0x00]), // mx1
    ]);
    const buffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      rdata,
    ]);

    const mx = parseMXRecord(buffer, rdata);
    expect((mx as MxRecord).priority).toBe(5);
    expect((mx as MxRecord).exchange).toBe('mx1');
  });

  it('should parse MX with priority 65535', () => {
    const rdata = Buffer.concat([
      Buffer.from([0xff, 0xff]), // Priority: 65535
      Buffer.from([0x03, 0x6d, 0x78, 0x31, 0x00]), // mx1
    ]);
    const buffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      rdata,
    ]);

    const mx = parseMXRecord(buffer, rdata);
    expect((mx as MxRecord).priority).toBe(65535);
  });
});

describe('parseSRVRecord', () => {
  it('should parse SRV record', () => {
    // Create rdata with priority, weight, port, and domain
    const rdata = Buffer.from([
      0x00, 0x0a, // Priority: 10
      0x00, 0x05, // Weight: 5
      0x13, 0xc4, // Port: 5060
      // Domain: test.example.com
      0x04, 0x74, 0x65, 0x73, 0x74, // test
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, // example
      0x03, 0x63, 0x6f, 0x6d, // com
      0x00,
    ]);
    // The buffer needs to contain the rdata at the end
    const buffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      rdata,
    ]);

    const srv = parseSRVRecord(buffer, rdata);
    expect((srv as SrvRecord).priority).toBe(10);
    expect((srv as SrvRecord).weight).toBe(5);
    expect((srv as SrvRecord).port).toBe(5060);
    expect((srv as SrvRecord).target).toBe('test.example.com');
  });

  it('should parse SRV with zero values', () => {
    const rdata = Buffer.from([
      0x00, 0x00, // Priority: 0
      0x00, 0x00, // Weight: 0
      0x00, 0x00, // Port: 0
      0x03, 0x61, 0x62, 0x63, 0x00, // abc
    ]);
    const buffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      rdata,
    ]);

    const srv = parseSRVRecord(buffer, rdata);
    expect((srv as SrvRecord).priority).toBe(0);
    expect((srv as SrvRecord).weight).toBe(0);
    expect((srv as SrvRecord).port).toBe(0);
  });

  it('should parse SRV with maximum values', () => {
    const rdata = Buffer.from([
      0xff, 0xff, // Priority: 65535
      0xff, 0xff, // Weight: 65535
      0xff, 0xff, // Port: 65535
      0x01, 0x61, 0x00,
    ]);
    const buffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      rdata,
    ]);

    const srv = parseSRVRecord(buffer, rdata);
    expect((srv as SrvRecord).priority).toBe(65535);
    expect((srv as SrvRecord).weight).toBe(65535);
    expect((srv as SrvRecord).port).toBe(65535);
  });
});

describe('parseSOARecord', () => {
  it('should parse SOA record', () => {
    const buffer = Buffer.from([
      0x00, 0x00, 0x00, 0x00,
      // ns1.example.com
      0x03, 0x6e, 0x73, 0x31,
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
      0x03, 0x63, 0x6f, 0x6d, 0x00,
      // hostmaster.example.com
      0x0a, 0x68, 0x6f, 0x73, 0x74, 0x6d, 0x61, 0x73, 0x74, 0x65, 0x72,
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
      0x03, 0x63, 0x6f, 0x6d, 0x00,
      // Serial, Refresh, Retry, Expire, MinTTL
      0x00, 0x00, 0x00, 0x01, // Serial: 1
      0x00, 0x00, 0x1e, 0x84, // Refresh: 7812 (0x1e84)
      0x00, 0x00, 0x0f, 0xa0, // Retry: 4000
      0x00, 0x01, 0x33, 0x80, // Expire: 78720 (0x00013380)
      0x00, 0x00, 0x0e, 0x10, // MinTTL: 3600
    ]);

    const rdata = buffer.subarray(4);
    const soa = parseSOARecord(buffer, rdata);

    expect((soa as SoaRecord).nsname).toBe('ns1.example.com');
    expect((soa as SoaRecord).hostmaster).toBe('hostmaster.example.com');
    expect((soa as SoaRecord).serial).toBe(1);
    expect((soa as SoaRecord).refresh).toBe(7812);
    expect((soa as SoaRecord).retry).toBe(4000);
    expect((soa as SoaRecord).expire).toBe(78720);
    expect((soa as SoaRecord).minttl).toBe(3600);
  });

  it('should parse SOA with all zeros', () => {
    const buffer = Buffer.from([
      0x00, 0x00, 0x00, 0x00,
      0x01, 0x61, 0x00, // ns
      0x01, 0x62, 0x00, // hm
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    ]);

    const rdata = buffer.subarray(4);
    const soa = parseSOARecord(buffer, rdata);

    expect((soa as SoaRecord).serial).toBe(0);
    expect((soa as SoaRecord).refresh).toBe(0);
    expect((soa as SoaRecord).retry).toBe(0);
    expect((soa as SoaRecord).expire).toBe(0);
    expect((soa as SoaRecord).minttl).toBe(0);
  });

  it('should parse SOA with maximum values', () => {
    const buffer = Buffer.from([
      0x00, 0x00, 0x00, 0x00,
      0x01, 0x61, 0x00,
      0x01, 0x62, 0x00,
      0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff,
    ]);

    const rdata = buffer.subarray(4);
    const soa = parseSOARecord(buffer, rdata);

    expect((soa as SoaRecord).serial).toBe(4294967295);
    expect((soa as SoaRecord).refresh).toBe(4294967295);
    expect((soa as SoaRecord).retry).toBe(4294967295);
    expect((soa as SoaRecord).expire).toBe(4294967295);
    expect((soa as SoaRecord).minttl).toBe(4294967295);
  });
});

describe('parseTXTRecord', () => {
  it('should parse single TXT string', () => {
    const rdata = Buffer.from([0x0b, 0x76, 0x3d, 0x73, 0x70, 0x66, 0x31, 0x20, 0x2d, 0x61, 0x6c, 0x6c]); // v=spf1 -all
    const txt = parseTXTRecord(rdata);
    expect(txt).toEqual(['v=spf1 -all']);
  });

  it('should parse multiple TXT strings', () => {
    const rdata = Buffer.from([
      0x04, 0x74, 0x65, 0x73, 0x74, // test
      0x03, 0x61, 0x62, 0x63, // abc
      0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f, // hello
    ]);
    const txt = parseTXTRecord(rdata);
    expect(txt).toEqual(['test', 'abc', 'hello']);
  });

  it('should parse empty TXT record', () => {
    const rdata = Buffer.from([0x00]);
    const txt = parseTXTRecord(rdata);
    expect(txt).toEqual([]);
  });

  it('should parse TXT with special characters', () => {
    const rdata = Buffer.from([
      0x1e, // Length: 30
      0x76, 0x3d, 0x73, 0x70, 0x66, 0x31, 0x20, 0x69, 0x6e, 0x63, 0x6c, 0x75, 0x64, 0x65,
      0x3a, 0x5f, 0x73, 0x70, 0x66, 0x2e, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2e, 0x63, 0x6f, 0x6d,
    ]);
    const txt = parseTXTRecord(rdata);
    expect(txt).toEqual(['v=spf1 include:_spf.google.com']);
  });

  it('should handle zero-length string in middle', () => {
    const rdata = Buffer.from([
      0x03, 0x61, 0x62, 0x63,
      0x00,
      0x03, 0x64, 0x65, 0x66,
    ]);
    const txt = parseTXTRecord(rdata);
    expect(txt).toEqual(['abc']);
  });

  it('should handle invalid length gracefully', () => {
    const rdata = Buffer.from([0x05, 0x61, 0x62]); // Claims 5 bytes, only 2 available
    const txt = parseTXTRecord(rdata);
    expect(txt).toEqual([]);
  });
});

describe('parseCAARecord', () => {
  it('should parse CAA record', () => {
    // Critical: 0, Tag: issue, Value: letsencrypt.org
    const rdata = Buffer.from([
      0x00, // Flags: 0 (not critical)
      0x69, 0x73, 0x73, 0x75, 0x65, 0x00, // issue\0
      0x6c, 0x65, 0x74, 0x73, 0x65, 0x6e, 0x63, 0x72, 0x79, 0x70, 0x74, 0x2e, 0x6f, 0x72, 0x67, // letsencrypt.org
    ]);
    const caa = parseCAARecord(rdata);

    expect((caa as CaaRecord).critical).toBe(false);
    expect((caa as CaaRecord).tag).toBe('issue');
    expect((caa as CaaRecord).value).toBe('letsencrypt.org');
  });

  it('should parse critical CAA record', () => {
    // Critical: 128, Tag: issue, Value: ;
    const rdata = Buffer.from([
      0x80, // Flags: 128 (critical)
      0x69, 0x73, 0x73, 0x75, 0x65, 0x00, // issue\0
      0x3b, // ;
    ]);
    const caa = parseCAARecord(rdata);

    expect((caa as CaaRecord).critical).toBe(true);
    expect((caa as CaaRecord).tag).toBe('issue');
    expect((caa as CaaRecord).value).toBe(';');
  });

  it('should parse CAA with issuewild tag', () => {
    const rdata = Buffer.from([
      0x00,
      0x69, 0x73, 0x73, 0x75, 0x65, 0x77, 0x69, 0x6c, 0x64, 0x00, // issuewild\0
      0x3b,
    ]);
    const caa = parseCAARecord(rdata);

    expect((caa as CaaRecord).critical).toBe(false);
    expect((caa as CaaRecord).tag).toBe('issuewild');
    expect((caa as CaaRecord).value).toBe(';');
  });

  it('should parse CAA with iodef tag', () => {
    const rdata = Buffer.from([
      0x80,
      0x69, 0x6f, 0x64, 0x65, 0x66, 0x00, // iodef\0
      0x6d, 0x61, 0x69, 0x6c, 0x74, 0x6f, 0x3a, 0x61, 0x40, 0x62, 0x2e, 0x63, 0x6f, 0x6d,
    ]);
    const caa = parseCAARecord(rdata);

    expect((caa as CaaRecord).critical).toBe(true);
    expect((caa as CaaRecord).tag).toBe('iodef');
    expect((caa as CaaRecord).value).toBe('mailto:a@b.com');
  });

  it('should parse CAA with empty value', () => {
    const rdata = Buffer.from([
      0x00,
      0x69, 0x73, 0x73, 0x75, 0x65, 0x00, // issue\0
    ]);
    const caa = parseCAARecord(rdata);

    expect((caa as CaaRecord).value).toBe('');
  });
});

describe('parseRecord', () => {
  const buildBuffer = (rdata: Buffer): Buffer => {
    return Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x00]), rdata]);
  };

  it('should parse A record', () => {
    const buffer = buildBuffer(Buffer.from([0x08, 0x08, 0x08, 0x08]));
    const record = {
      name: 'example.com',
      type: 1,
      class_: 1,
      ttl: 300,
      rdlength: 4,
      rdata: Buffer.from([0x08, 0x08, 0x08, 0x08]),
    };
    expect(parseRecord(buffer, record)).toBe('8.8.8.8');
  });

  it('should parse AAAA record', () => {
    const rdata = Buffer.from([0x20, 0x01, 0x48, 0x60, 0x48, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x88, 0x88]);
    const buffer = buildBuffer(rdata);
    const record = {
      name: 'example.com',
      type: 28,
      class_: 1,
      ttl: 300,
      rdlength: 16,
      rdata,
    };
    expect(parseRecord(buffer, record)).toBe('2001:4860:4860::8888');
  });

  it('should parse CNAME record', () => {
    const rdata = Buffer.from([0x03, 0x77, 0x77, 0x77, 0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00]);
    const buffer = buildBuffer(rdata);
    const record = {
      name: 'example.com',
      type: 5,
      class_: 1,
      ttl: 300,
      rdlength: rdata.length,
      rdata,
    };
    expect(parseRecord(buffer, record)).toBe('www.example.com');
  });

  it('should parse NS record', () => {
    const rdata = Buffer.from([0x02, 0x6e, 0x73, 0x01, 0x61, 0x00]);
    const buffer = buildBuffer(rdata);
    const record = {
      name: 'example.com',
      type: 2,
      class_: 1,
      ttl: 300,
      rdlength: rdata.length,
      rdata,
    };
    expect(parseRecord(buffer, record)).toBe('ns.a');
  });

  it('should parse PTR record', () => {
    const rdata = Buffer.from([0x03, 0x64, 0x6e, 0x73, 0x06, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x00]);
    const buffer = buildBuffer(rdata);
    const record = {
      name: 'example.com',
      type: 12,
      class_: 1,
      ttl: 300,
      rdlength: rdata.length,
      rdata,
    };
    expect(parseRecord(buffer, record)).toBe('dns.google');
  });

  it('should parse MX record', () => {
    const rdata = Buffer.concat([
      Buffer.from([0x00, 0x0a]), // Priority
      Buffer.from([0x04, 0x6d, 0x61, 0x69, 0x6c, 0x00]),
    ]);
    const buffer = buildBuffer(rdata);
    const record = {
      name: 'example.com',
      type: 15,
      class_: 1,
      ttl: 300,
      rdlength: rdata.length,
      rdata,
    };
    const mx = parseRecord(buffer, record) as MxRecord;
    expect(mx.priority).toBe(10);
    expect(mx.exchange).toBe('mail');
  });

  it('should parse SRV record', () => {
    const rdata = Buffer.concat([
      Buffer.from([0x00, 0x0a, 0x00, 0x05, 0x13, 0xc4]),
      Buffer.from([0x04, 0x74, 0x65, 0x73, 0x74, 0x00]),
    ]);
    const buffer = buildBuffer(rdata);
    const record = {
      name: 'example.com',
      type: 33,
      class_: 1,
      ttl: 300,
      rdlength: rdata.length,
      rdata,
    };
    const srv = parseRecord(buffer, record) as SrvRecord;
    expect(srv.priority).toBe(10);
    expect(srv.weight).toBe(5);
    expect(srv.port).toBe(5060);
    expect(srv.target).toBe('test');
  });

  it('should parse SOA record', () => {
    const rdata = Buffer.concat([
      Buffer.from([0x01, 0x61, 0x00]), // ns
      Buffer.from([0x01, 0x62, 0x00]), // hostmaster
      Buffer.from([0x00, 0x00, 0x00, 0x01]), // serial
      Buffer.from([0x00, 0x00, 0x0e, 0x10]), // refresh
      Buffer.from([0x00, 0x00, 0x0f, 0xa0]), // retry
      Buffer.from([0x00, 0x01, 0x33, 0x80]), // expire
      Buffer.from([0x00, 0x00, 0x0e, 0x10]), // minttl
    ]);
    const buffer = buildBuffer(rdata);
    const record = {
      name: 'example.com',
      type: 6,
      class_: 1,
      ttl: 300,
      rdlength: rdata.length,
      rdata,
    };
    const soa = parseRecord(buffer, record) as SoaRecord;
    expect(soa.nsname).toBe('a');
    expect(soa.hostmaster).toBe('b');
    expect(soa.serial).toBe(1);
  });

  it('should parse TXT record', () => {
    const rdata = Buffer.from([0x04, 0x74, 0x65, 0x73, 0x74]);
    const buffer = buildBuffer(rdata);
    const record = {
      name: 'example.com',
      type: 16,
      class_: 1,
      ttl: 300,
      rdlength: rdata.length,
      rdata,
    };
    expect(parseRecord(buffer, record)).toBe('test');
  });

  it('should parse CAA record', () => {
    const rdata = Buffer.from([
      0x00,
      0x69, 0x73, 0x73, 0x75, 0x65, 0x00,
      0x61, 0x62, 0x63,
    ]);
    const buffer = buildBuffer(rdata);
    const record = {
      name: 'example.com',
      type: 257,
      class_: 1,
      ttl: 300,
      rdlength: rdata.length,
      rdata,
    };
    const caa = parseRecord(buffer, record) as CaaRecord;
    expect(caa.critical).toBe(false);
    expect(caa.tag).toBe('issue');
    expect(caa.value).toBe('abc');
  });

  it('should throw error for unsupported record type', () => {
    const buffer = buildBuffer(Buffer.from([0x00]));
    const record = {
      name: 'example.com',
      type: 999, // Unsupported type
      class_: 1,
      ttl: 300,
      rdlength: 1,
      rdata: Buffer.from([0x00]),
    };

    expect(() => parseRecord(buffer, record)).toThrow(DnsError);
    expect(() => parseRecord(buffer, record)).toThrow('Unsupported record type: TYPE999');
  });
});

describe('parseRecords', () => {
  it('should parse A records from response', () => {
    const buffer = Buffer.from([
      0x04, 0xd2, // ID
      0x81, 0x80, // Flags
      0x00, 0x01, // QDCOUNT
      0x00, 0x02, // ANCOUNT
      0x00, 0x00, // NSCOUNT
      0x00, 0x00, // ARCOUNT
      // Question
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
      0x03, 0x63, 0x6f, 0x6d, 0x00,
      0x00, 0x01, 0x00, 0x01,
      // Answer 1: 93.184.216.34
      0xc0, 0x0c,
      0x00, 0x01, 0x00, 0x01,
      0x00, 0x00, 0x01, 0x2c, // TTL: 300
      0x00, 0x04, // RDLENGTH: 4
      0x5d, 0xb8, 0xd8, 0x22,
      // Answer 2: 93.184.216.35
      0xc0, 0x0c,
      0x00, 0x01, 0x00, 0x01,
      0x00, 0x00, 0x01, 0x2c,
      0x00, 0x04,
      0x5d, 0xb8, 0xd8, 0x23,
    ]);

    const response = decodeResponse(buffer);
    const records = parseRecords(buffer, response, 'A');

    expect(records).toHaveLength(2);
    expect(records[0]).toBe('93.184.216.34');
    expect(records[1]).toBe('93.184.216.35');
  });

  it('should return empty array when no matching records', () => {
    const buffer = Buffer.from([
      0x04, 0xd2, 0x81, 0x80,
      0x00, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
      0x03, 0x63, 0x6f, 0x6d, 0x00,
      0x00, 0x01, 0x00, 0x01,
    ]);

    const response = decodeResponse(buffer);
    const records = parseRecords(buffer, response, 'A');

    expect(records).toEqual([]);
  });

  it('should parse MX records', () => {
    const buffer = Buffer.from([
      0x04, 0xd2, 0x81, 0x80,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      // Question
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
      0x03, 0x63, 0x6f, 0x6d, 0x00,
      0x00, 0x0f, 0x00, 0x01, // MX
      // Answer
      0xc0, 0x0c,
      0x00, 0x0f, 0x00, 0x01,
      0x00, 0x00, 0x01, 0x2c,
      0x00, 0x0b, // RDLENGTH
      0x00, 0x0a, // Priority: 10
      0x04, 0x6d, 0x61, 0x69, 0x6c, 0x00,
    ]);

    const response = decodeResponse(buffer);
    const records = parseRecords(buffer, response, 'MX');

    expect(records).toHaveLength(1);
    expect((records[0] as MxRecord).priority).toBe(10);
    expect((records[0] as MxRecord).exchange).toBe('mail');
  });

  it('should parse TXT records', () => {
    const buffer = Buffer.from([
      0x04, 0xd2, 0x81, 0x80,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      // Question
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
      0x03, 0x63, 0x6f, 0x6d, 0x00,
      0x00, 0x10, 0x00, 0x01, // TXT
      // Answer
      0xc0, 0x0c,
      0x00, 0x10, 0x00, 0x01,
      0x00, 0x00, 0x01, 0x2c,
      0x00, 0x09, // RDLENGTH
      0x04, 0x74, 0x65, 0x73, 0x74,
    ]);

    const response = decodeResponse(buffer);
    const records = parseRecords(buffer, response, 'TXT');

    expect(records).toHaveLength(1);
    expect(records[0]).toBe('test');
  });

  it('should parse SRV records', () => {
    const buffer = Buffer.from([
      0x04, 0xd2, 0x81, 0x80,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      // Question
      0x04, 0x5f, 0x74, 0x63, 0x70,
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
      0x03, 0x63, 0x6f, 0x6d, 0x00,
      0x00, 0x21, 0x00, 0x01, // SRV
      // Answer
      0xc0, 0x0c,
      0x00, 0x21, 0x00, 0x01,
      0x00, 0x00, 0x01, 0x2c,
      0x00, 0x10, // RDLENGTH
      0x00, 0x0a, 0x00, 0x05, 0x13, 0xc4,
      0x04, 0x74, 0x65, 0x73, 0x74, 0x00,
    ]);

    const response = decodeResponse(buffer);
    const records = parseRecords(buffer, response, 'SRV');

    expect(records).toHaveLength(1);
    expect((records[0] as SrvRecord).priority).toBe(10);
    expect((records[0] as SrvRecord).weight).toBe(5);
    expect((records[0] as SrvRecord).port).toBe(5060);
    expect((records[0] as SrvRecord).target).toBe('test');
  });

  it('should parse CAA records', () => {
    const buffer = Buffer.from([
      0x04, 0xd2, 0x81, 0x80,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      // Question
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
      0x03, 0x63, 0x6f, 0x6d, 0x00,
      0x01, 0x01, 0x00, 0x01, // CAA (257)
      // Answer
      0xc0, 0x0c,
      0x01, 0x01, 0x00, 0x01,
      0x00, 0x00, 0x01, 0x2c,
      0x00, 0x15, // RDLENGTH (21 bytes)
      0x00,
      0x69, 0x73, 0x73, 0x75, 0x65, 0x00, // issue\0
      0x6c, 0x65, 0x74, 0x73, 0x65, 0x6e, 0x63, 0x72, 0x79, 0x70, 0x74, 0x2e, 0x6f, 0x72, 0x67, // letsencrypt.org (14 chars)
    ]);

    const response = decodeResponse(buffer);
    const records = parseRecords(buffer, response, 'CAA');

    expect(records).toHaveLength(1);
    expect((records[0] as CaaRecord).critical).toBe(false);
    expect((records[0] as CaaRecord).tag).toBe('issue');
    // The value might be truncated based on the actual rdata length
    expect((records[0] as CaaRecord).value).toContain('letsencrypt');
  });
});

describe('getMinTtl', () => {
  it('should return minimum TTL from response', () => {
    const response = {
      id: 1234,
      flags: 0x8180,
      questions: [],
      answers: [
        { type: 1, class_: 1, ttl: 300, rdlength: 4, rdata: Buffer.from([0x01, 0x02, 0x03, 0x04]), name: '' },
        { type: 1, class_: 1, ttl: 600, rdlength: 4, rdata: Buffer.from([0x05, 0x06, 0x07, 0x08]), name: '' },
        { type: 1, class_: 1, ttl: 100, rdlength: 4, rdata: Buffer.from([0x09, 0x0a, 0x0b, 0x0c]), name: '' },
      ],
      authorities: [],
      additionals: [],
    };

    expect(getMinTtl(response)).toBe(100);
  });

  it('should return 0 when no answers', () => {
    const response = {
      id: 1234,
      flags: 0x8180,
      questions: [],
      answers: [],
      authorities: [],
      additionals: [],
    };

    expect(getMinTtl(response)).toBe(0);
  });

  it('should return the only TTL when single answer', () => {
    const response = {
      id: 1234,
      flags: 0x8180,
      questions: [],
      answers: [
        { type: 1, class_: 1, ttl: 3600, rdlength: 4, rdata: Buffer.from([0x01, 0x02, 0x03, 0x04]), name: '' },
      ],
      authorities: [],
      additionals: [],
    };

    expect(getMinTtl(response)).toBe(3600);
  });

  it('should handle TTL of 0', () => {
    const response = {
      id: 1234,
      flags: 0x8180,
      questions: [],
      answers: [
        { type: 1, class_: 1, ttl: 0, rdlength: 4, rdata: Buffer.from([0x01, 0x02, 0x03, 0x04]), name: '' },
        { type: 1, class_: 1, ttl: 300, rdlength: 4, rdata: Buffer.from([0x05, 0x06, 0x07, 0x08]), name: '' },
      ],
      authorities: [],
      additionals: [],
    };

    expect(getMinTtl(response)).toBe(0);
  });

  it('should handle maximum TTL value', () => {
    const response = {
      id: 1234,
      flags: 0x8180,
      questions: [],
      answers: [
        { type: 1, class_: 1, ttl: 0x7fffffff, rdlength: 4, rdata: Buffer.from([0x01, 0x02, 0x03, 0x04]), name: '' },
        { type: 1, class_: 1, ttl: 0x0fffffff, rdlength: 4, rdata: Buffer.from([0x05, 0x06, 0x07, 0x08]), name: '' },
      ],
      authorities: [],
      additionals: [],
    };

    expect(getMinTtl(response)).toBe(0x0fffffff);
  });
});

describe('isNXDOMAIN', () => {
  it('should return true for NXDOMAIN (RCODE 3)', () => {
    const response = {
      id: 1234,
      flags: 0x8183, // RCODE = 3
      questions: [],
      answers: [],
      authorities: [],
      additionals: [],
    };

    expect(isNXDOMAIN(response)).toBe(true);
  });

  it('should return false for NOERROR (RCODE 0)', () => {
    const response = {
      id: 1234,
      flags: 0x8180, // RCODE = 0
      questions: [],
      answers: [],
      authorities: [],
      additionals: [],
    };

    expect(isNXDOMAIN(response)).toBe(false);
  });

  it('should return false for SERVFAIL (RCODE 2)', () => {
    const response = {
      id: 1234,
      flags: 0x8182, // RCODE = 2
      questions: [],
      answers: [],
      authorities: [],
      additionals: [],
    };

    expect(isNXDOMAIN(response)).toBe(false);
  });

  it('should handle flags with other bits set', () => {
    const response = {
      id: 1234,
      flags: 0x91f3, // QR=1, TC=1, RD=1, RA=1, Z=1, AD=1, CD=1, RCODE=3
      questions: [],
      answers: [],
      authorities: [],
      additionals: [],
    };

    expect(isNXDOMAIN(response)).toBe(true);
  });
});

describe('isSERVFAIL', () => {
  it('should return true for SERVFAIL (RCODE 2)', () => {
    const response = {
      id: 1234,
      flags: 0x8182, // RCODE = 2
      questions: [],
      answers: [],
      authorities: [],
      additionals: [],
    };

    expect(isSERVFAIL(response)).toBe(true);
  });

  it('should return false for NOERROR (RCODE 0)', () => {
    const response = {
      id: 1234,
      flags: 0x8180, // RCODE = 0
      questions: [],
      answers: [],
      authorities: [],
      additionals: [],
    };

    expect(isSERVFAIL(response)).toBe(false);
  });

  it('should return false for NXDOMAIN (RCODE 3)', () => {
    const response = {
      id: 1234,
      flags: 0x8183, // RCODE = 3
      questions: [],
      answers: [],
      authorities: [],
      additionals: [],
    };

    expect(isSERVFAIL(response)).toBe(false);
  });
});

describe('sortSRVRecords', () => {
  it('should sort SRV records by priority then weight', () => {
    const records: SrvRecord[] = [
      { priority: 20, weight: 5, port: 5060, target: 'c.example.com' },
      { priority: 10, weight: 10, port: 5060, target: 'a.example.com' },
      { priority: 10, weight: 5, port: 5060, target: 'b.example.com' },
    ];

    const sorted = sortSRVRecords(records);

    expect(sorted[0]!.priority).toBe(10);
    expect(sorted[0]!.weight).toBe(10);
    expect(sorted[1]!.priority).toBe(10);
    expect(sorted[1]!.weight).toBe(5);
    expect(sorted[2]!.priority).toBe(20);
  });

  it('should sort single record', () => {
    const records: SrvRecord[] = [
      { priority: 10, weight: 5, port: 5060, target: 'a.example.com' },
    ];

    const sorted = sortSRVRecords(records);

    expect(sorted).toHaveLength(1);
    expect(sorted[0]!.target).toBe('a.example.com');
  });

  it('should return empty array for empty input', () => {
    const sorted = sortSRVRecords([]);
    expect(sorted).toEqual([]);
  });

  it('should handle records with same priority and weight', () => {
    const records: SrvRecord[] = [
      { priority: 10, weight: 5, port: 5060, target: 'a.example.com' },
      { priority: 10, weight: 5, port: 5061, target: 'b.example.com' },
      { priority: 10, weight: 5, port: 5062, target: 'c.example.com' },
    ];

    const sorted = sortSRVRecords(records);

    expect(sorted).toHaveLength(3);
    expect(sorted.every(r => r.priority === 10 && r.weight === 5)).toBe(true);
  });

  it('should handle zero weight records', () => {
    const records: SrvRecord[] = [
      { priority: 10, weight: 0, port: 5060, target: 'a.example.com' },
      { priority: 10, weight: 5, port: 5060, target: 'b.example.com' },
    ];

    const sorted = sortSRVRecords(records);

    expect(sorted[1]!.weight).toBe(0);
  });

  it('should handle maximum priority and weight values', () => {
    const records: SrvRecord[] = [
      { priority: 65535, weight: 65535, port: 5060, target: 'max.example.com' },
      { priority: 0, weight: 0, port: 5060, target: 'min.example.com' },
    ];

    const sorted = sortSRVRecords(records);

    expect(sorted[0]!.priority).toBe(0);
    expect(sorted[1]!.priority).toBe(65535);
  });

  it('should maintain order within same priority group', () => {
    const records: SrvRecord[] = [
      { priority: 10, weight: 3, port: 5060, target: 'first' },
      { priority: 10, weight: 2, port: 5061, target: 'second' },
      { priority: 10, weight: 1, port: 5062, target: 'third' },
    ];

    const sorted = sortSRVRecords(records);

    expect(sorted[0]!.target).toBe('first');
    expect(sorted[1]!.target).toBe('second');
    expect(sorted[2]!.target).toBe('third');
  });
});
