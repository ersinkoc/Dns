/**
 * Error classes tests
 */

import { describe, it, expect } from 'vitest';
import { DnsError, ValidationError, PluginError } from '../../src/errors.js';

describe('DnsError', () => {
  describe('constructor', () => {
    it('should create error with code and message', () => {
      const error = new DnsError('TIMEOUT', 'Query timed out');
      expect(error.code).toBe('TIMEOUT');
      expect(error.message).toBe('Query timed out');
      expect(error.name).toBe('DnsError');
    });

    it('should include domain and record type', () => {
      const error = new DnsError('NXDOMAIN', 'Domain does not exist', {
        domain: 'example.com',
        recordType: 'A',
      });

      expect(error.domain).toBe('example.com');
      expect(error.recordType).toBe('A');
    });

    it('should include cause', () => {
      const cause = new Error('Original error');
      const error = new DnsError('NETWORK_ERROR', 'Network error', { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe('static factory methods', () => {
    it('should create NXDOMAIN error', () => {
      const error = DnsError.nxdomain('example.com');
      expect(error.code).toBe('NXDOMAIN');
      expect(error.domain).toBe('example.com');
      expect(error.message).toContain('example.com');
    });

    it('should create timeout error', () => {
      const error = DnsError.timeout('example.com', 'A', 5000);
      expect(error.code).toBe('TIMEOUT');
      expect(error.message).toContain('5000ms');
      expect(error.domain).toBe('example.com');
      expect(error.recordType).toBe('A');
    });

    it('should create SERVFAIL error', () => {
      const error = DnsError.servfail('example.com', '8.8.8.8');
      expect(error.code).toBe('SERVFAIL');
      expect(error.message).toContain('8.8.8.8');
    });

    it('should create DNSSEC invalid error', () => {
      const error = DnsError.dnssecInvalid('example.com', 'Signature verification failed');
      expect(error.code).toBe('DNSSEC_INVALID');
      expect(error.message).toContain('Signature verification failed');
    });

    it('should create invalid query error', () => {
      const error = DnsError.invalidQuery('', 'Domain cannot be empty');
      expect(error.code).toBe('INVALID_QUERY');
      expect(error.message).toContain('Domain cannot be empty');
    });

    it('should create network error', () => {
      const cause = new Error('ECONNREFUSED');
      const error = DnsError.networkError('example.com', cause);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.cause).toBe(cause);
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON', () => {
      const cause = new Error('Original');
      const error = new DnsError('TIMEOUT', 'Query timed out', {
        domain: 'example.com',
        recordType: 'A',
        cause,
      });

      const json = error.toJSON();
      expect(json).toEqual({
        name: 'DnsError',
        code: 'TIMEOUT',
        message: 'Query timed out',
        domain: 'example.com',
        recordType: 'A',
        cause: 'Original',
      });
    });
  });
});

describe('ValidationError', () => {
  it('should create validation error', () => {
    const error = new ValidationError('Invalid value', 'bad-value');
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid value');
    expect(error.value).toBe('bad-value');
  });
});

describe('PluginError', () => {
  it('should create plugin error', () => {
    const error = new PluginError('test-plugin', 'Plugin failed');
    expect(error.name).toBe('PluginError');
    expect(error.plugin).toBe('test-plugin');
    expect(error.message).toBe('Plugin failed');
  });

  it('should include cause', () => {
    const cause = new Error('Original error');
    const error = new PluginError('test-plugin', 'Plugin failed', { cause });
    expect(error.cause).toBe(cause);
  });
});
