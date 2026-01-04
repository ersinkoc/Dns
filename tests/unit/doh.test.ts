/**
 * DNS-over-HTTPS (DoH) plugin tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DnsKernel } from '../../src/kernel.js';
import { dohPlugin, dohQuery, dohQueryGet, dohSetServer, dohGetServer, dohSetHeader, dohGetConfig } from '../../src/plugins/optional/doh.js';

describe('DoH Plugin', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
  });

  it('should install DoH plugin', () => {
    expect(() => kernel.use(dohPlugin)).not.toThrow();
  });

  it('should have plugin name and version', () => {
    expect(dohPlugin.name).toBe('doh');
    expect(dohPlugin.version).toBe('1.0.0');
  });
});

describe('DoH Plugin State', () => {
  it('should initialize with default Cloudflare server', () => {
    const kernel = new DnsKernel({});
    kernel.use(dohPlugin);

    expect(kernel.getState('server')).toBe('https://1.1.1.1/dns-query');
    expect(kernel.getState('timeout')).toBe(5000);
    expect(kernel.getState('headers')).toBeDefined();
  });

  it('should use Cloudflare server when type is doh', () => {
    const kernel = new DnsKernel({ type: 'doh' });
    kernel.use(dohPlugin);

    expect(kernel.getState('server')).toBe('https://1.1.1.1/dns-query');
  });

  it('should initialize with custom server from options', () => {
    const customServer = 'https://custom-doh.example.com/dns-query';
    const kernel = new DnsKernel({ server: customServer });
    kernel.use(dohPlugin);

    expect(kernel.getState('server')).toBe(customServer);
  });

  it('should initialize with custom timeout', () => {
    const kernel = new DnsKernel({ timeout: 10000 });
    kernel.use(dohPlugin);

    expect(kernel.getState('timeout')).toBe(10000);
  });

  it('should initialize with default headers', () => {
    const kernel = new DnsKernel({});
    kernel.use(dohPlugin);

    const headers = kernel.getState('headers') as Record<string, string>;
    expect(headers['Accept']).toBe('application/dns-message');
    expect(headers['Content-Type']).toBe('application/dns-message');
  });
});

describe('DoH Server Management', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(dohPlugin);
  });

  it('should set DoH server', () => {
    dohSetServer(kernel, 'https://dns.google/dns-query');
    expect(dohGetServer(kernel)).toBe('https://dns.google/dns-query');
  });

  it('should get DoH server', () => {
    const server = dohGetServer(kernel);
    expect(server).toBe('https://1.1.1.1/dns-query');
  });

  it('should allow changing server multiple times', () => {
    dohSetServer(kernel, 'https://server1.com/dns-query');
    expect(dohGetServer(kernel)).toBe('https://server1.com/dns-query');

    dohSetServer(kernel, 'https://server2.com/dns-query');
    expect(dohGetServer(kernel)).toBe('https://server2.com/dns-query');
  });
});

describe('DoH Headers', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(dohPlugin);
  });

  it('should set custom header', () => {
    dohSetHeader(kernel, 'X-Custom', 'custom-value');

    const config = dohGetConfig(kernel);
    expect(config.headers['X-Custom']).toBe('custom-value');
  });

  it('should overwrite existing header', () => {
    dohSetHeader(kernel, 'Accept', 'application/json');

    const config = dohGetConfig(kernel);
    expect(config.headers['Accept']).toBe('application/json');
  });

  it('should set multiple custom headers', () => {
    dohSetHeader(kernel, 'X-First', 'first');
    dohSetHeader(kernel, 'X-Second', 'second');

    const config = dohGetConfig(kernel);
    expect(config.headers['X-First']).toBe('first');
    expect(config.headers['X-Second']).toBe('second');
  });
});

describe('DoH Configuration', () => {
  it('should get complete DoH config', () => {
    const kernel = new DnsKernel({ timeout: 3000 });
    kernel.use(dohPlugin);
    dohSetServer(kernel, 'https://dns.quad9.net/dns-query');
    dohSetHeader(kernel, 'X-Test', 'test');

    const config = dohGetConfig(kernel);
    expect(config.server).toBe('https://dns.quad9.net/dns-query');
    expect(config.timeout).toBe(3000);
    expect(config.headers['Accept']).toBe('application/dns-message');
    expect(config.headers['X-Test']).toBe('test');
  });
});

describe('DoH Plugin Lifecycle', () => {
  it('should handle onInit hook', async () => {
    const kernel = new DnsKernel({});
    kernel.use(dohPlugin);
    await kernel.init();

    // Plugin should be initialized
    expect(kernel.context.initialized.has('doh')).toBe(true);
  });

  it('should handle onDestroy hook', async () => {
    const kernel = new DnsKernel({});
    kernel.use(dohPlugin);
    await kernel.init();
    await kernel.destroy();

    expect(kernel.context.plugins.size).toBe(0);
  });
});

describe('dohQuery function', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(dohPlugin);
  });

  it('should send POST request to DoH server', async () => {
    const mockResponse = new Response(new Uint8Array([0x00, 0x01, 0x02, 0x03]), {
      status: 200,
      headers: { 'Content-Type': 'application/dns-message' },
    });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

    const queryBuffer = Buffer.from([0x00, 0x01, 0x00, 0x00]);
    const result = await dohQuery(kernel, queryBuffer);

    expect(fetch).toHaveBeenCalledWith(
      'https://1.1.1.1/dns-query',
      expect.objectContaining({
        method: 'POST',
        body: queryBuffer,
      }),
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should throw error on HTTP error response', async () => {
    const mockResponse = new Response(null, { status: 500, statusText: 'Internal Server Error' });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

    const queryBuffer = Buffer.from([0x00, 0x01, 0x00, 0x00]);
    await expect(dohQuery(kernel, queryBuffer)).rejects.toThrow('DoH request failed: 500 Internal Server Error');
  });

  it('should throw timeout error on AbortError', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(abortError);

    const queryBuffer = Buffer.from([0x00, 0x01, 0x00, 0x00]);
    await expect(dohQuery(kernel, queryBuffer)).rejects.toThrow('DoH request timed out');
  });

  it('should rethrow non-abort errors', async () => {
    const networkError = new Error('Network error');
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(networkError);

    const queryBuffer = Buffer.from([0x00, 0x01, 0x00, 0x00]);
    await expect(dohQuery(kernel, queryBuffer)).rejects.toThrow('Network error');
  });

  it('should use custom timeout from options', async () => {
    const mockResponse = new Response(new Uint8Array([0x00]), { status: 200 });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

    const queryBuffer = Buffer.from([0x00, 0x01]);
    await dohQuery(kernel, queryBuffer, { timeout: 1000 });

    // Verify fetch was called
    expect(fetch).toHaveBeenCalled();
  });
});

describe('dohQueryGet function', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
    kernel.use(dohPlugin);
  });

  it('should send GET request with base64url encoded query', async () => {
    const mockResponse = new Response(new Uint8Array([0x00, 0x01, 0x02, 0x03]), {
      status: 200,
      headers: { 'Content-Type': 'application/dns-message' },
    });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

    const queryBuffer = Buffer.from([0x00, 0x01, 0x00, 0x00]);
    const result = await dohQueryGet(kernel, queryBuffer);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://1.1.1.1/dns-query?dns='),
      expect.objectContaining({
        headers: { Accept: 'application/dns-message' },
      }),
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should correctly encode base64url (replace +, /, =)', async () => {
    const mockResponse = new Response(new Uint8Array([0x00]), { status: 200 });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

    // Buffer that would produce +, /, and = in base64
    const queryBuffer = Buffer.from([0xfb, 0xef, 0xbe, 0xff, 0xff]);
    await dohQueryGet(kernel, queryBuffer);

    const callArg = (fetch as unknown as { mock: { calls: string[][] } }).mock.calls[0][0] as string;
    // Extract just the encoded part after ?dns=
    const dnsParam = callArg.split('?dns=')[1];
    // Check that base64url encoding was applied (no +, /, = in the encoded data)
    expect(dnsParam).not.toContain('+');
    expect(dnsParam).not.toContain('/');
    expect(dnsParam).not.toContain('=');
  });

  it('should throw error on HTTP error response', async () => {
    const mockResponse = new Response(null, { status: 404, statusText: 'Not Found' });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

    const queryBuffer = Buffer.from([0x00, 0x01, 0x00, 0x00]);
    await expect(dohQueryGet(kernel, queryBuffer)).rejects.toThrow('DoH request failed: 404 Not Found');
  });

  it('should throw timeout error on AbortError', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(abortError);

    const queryBuffer = Buffer.from([0x00, 0x01, 0x00, 0x00]);
    await expect(dohQueryGet(kernel, queryBuffer)).rejects.toThrow('DoH request timed out');
  });

  it('should rethrow non-abort errors', async () => {
    const networkError = new Error('Connection refused');
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(networkError);

    const queryBuffer = Buffer.from([0x00, 0x01, 0x00, 0x00]);
    await expect(dohQueryGet(kernel, queryBuffer)).rejects.toThrow('Connection refused');
  });

  it('should use custom timeout from options', async () => {
    const mockResponse = new Response(new Uint8Array([0x00]), { status: 200 });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

    const queryBuffer = Buffer.from([0x00, 0x01]);
    await dohQueryGet(kernel, queryBuffer, { timeout: 2000 });

    expect(fetch).toHaveBeenCalled();
  });
});

describe('DoH Default Servers', () => {
  it('should support Google DoH server', () => {
    const kernel = new DnsKernel({});
    kernel.use(dohPlugin);
    dohSetServer(kernel, 'https://dns.google/dns-query');

    expect(dohGetServer(kernel)).toBe('https://dns.google/dns-query');
  });

  it('should support Quad9 DoH server', () => {
    const kernel = new DnsKernel({});
    kernel.use(dohPlugin);
    dohSetServer(kernel, 'https://dns.quad9.net/dns-query');

    expect(dohGetServer(kernel)).toBe('https://dns.quad9.net/dns-query');
  });
});
