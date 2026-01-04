/**
 * DNS-over-HTTPS (DoH) Plugin
 *
 * Secure DNS resolution using HTTPS.
 *
 * @module
 */

import type { DnsPlugin, QueryOptions } from '../../types.js';
import type { DnsKernelContext } from '../../kernel.js';
import { DnsKernel } from '../../kernel.js';

/**
 * DoH plugin state.
 *
 * @internal
 */
interface DohPluginState {
  /** DoH server URL */
  server: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Custom headers */
  headers: Record<string, string>;
}

/**
 * Default DoH servers.
 *
 * @internal
 */
const DEFAULT_SERVERS = {
  cloudflare: 'https://1.1.1.1/dns-query',
  google: 'https://dns.google/dns-query',
  quad9: 'https://dns.quad9.net/dns-query',
};

/**
 * DNS-over-HTTPS plugin.
 *
 * Provides secure DNS resolution via HTTPS.
 *
 * @example
 * ```typescript
 * import { dohPlugin } from '@oxog/dns/plugins';
 *
 * kernel.use(dohPlugin);
 * ```
 */
export const dohPlugin: DnsPlugin<DohPluginState & DnsKernelContext> = {
  name: 'doh',
  version: '1.0.0',

  install(kernel) {
    const options = kernel.context.options;

    // Determine DoH server
    let server = options.server;
    if (!server) {
      const type = options.type;
      if (type === 'doh') {
        server = DEFAULT_SERVERS.cloudflare;
      }
    }

    // Initialize state
    kernel.setState('server', server ?? DEFAULT_SERVERS.cloudflare);
    kernel.setState('timeout', options.timeout ?? 5000);
    kernel.setState('headers', {
      'Accept': 'application/dns-message',
      'Content-Type': 'application/dns-message',
    });
  },

  async onInit() {
    // Plugin initialized
  },

  onDestroy() {
    // Cleanup handled by kernel
  },
};

/**
 * Execute a DoH query.
 *
 * @param kernel - DNS kernel
 * @param queryBuffer - DNS query buffer
 * @param options - Query options
 * @returns Promise resolving to response buffer
 *
 * @example
 * ```typescript
 * const buffer = await dohQuery(kernel, queryBuffer);
 * ```
 */
export async function dohQuery(
  kernel: DnsKernel<DohPluginState & DnsKernelContext>,
  queryBuffer: Buffer,
  options?: QueryOptions,
): Promise<Buffer> {
  const server = kernel.getState('server') as string;
  const timeout = options?.timeout ?? (kernel.getState('timeout') as number);
  const headers = kernel.getState('headers') as Record<string, string>;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(server, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/dns-message',
      },
      body: queryBuffer,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DoH request failed: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`DoH request timed out after ${timeout}ms`);
    }
    throw error;
    /* v8 ignore next 2 */
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Execute a DoH query via GET (with base64url encoding).
 *
 * @param kernel - DNS kernel
 * @param queryBuffer - DNS query buffer
 * @param options - Query options
 * @returns Promise resolving to response buffer
 *
 * @example
 * ```typescript
 * const buffer = await dohQueryGet(kernel, queryBuffer);
 * ```
 */
export async function dohQueryGet(
  kernel: DnsKernel<DohPluginState & DnsKernelContext>,
  queryBuffer: Buffer,
  options?: QueryOptions,
): Promise<Buffer> {
  const server = kernel.getState('server') as string;
  const timeout = options?.timeout ?? (kernel.getState('timeout') as number);

  // Encode query as base64url
  const base64url = queryBuffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const url = `${server}?dns=${base64url}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/dns-message',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DoH request failed: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`DoH request timed out after ${timeout}ms`);
    }
    throw error;
    /* v8 ignore next 2 */
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Set the DoH server URL.
 *
 * @param kernel - DNS kernel
 * @param server - Server URL
 *
 * @example
 * ```typescript
 * dohSetServer(kernel, 'https://dns.google/dns-query');
 * ```
 */
export function dohSetServer(
  kernel: DnsKernel<DohPluginState & DnsKernelContext>,
  server: string,
): void {
  kernel.setState('server', server);
}

/**
 * Get the DoH server URL.
 *
 * @param kernel - DNS kernel
 * @returns Server URL
 *
 * @example
 * ```typescript
 * const server = dohGetServer(kernel);
 * ```
 */
export function dohGetServer(
  kernel: DnsKernel<DohPluginState & DnsKernelContext>,
): string {
  return kernel.getState('server') as string;
}

/**
 * Set a custom header for DoH requests.
 *
 * @param kernel - DNS kernel
 * @param name - Header name
 * @param value - Header value
 *
 * @example
 * ```typescript
 * dohSetHeader(kernel, 'X-Custom', 'value');
 * ```
 */
export function dohSetHeader(
  kernel: DnsKernel<DohPluginState & DnsKernelContext>,
  name: string,
  value: string,
): void {
  const headers = kernel.getState('headers') as Record<string, string>;
  headers[name] = value;
}

/**
 * Get DoH configuration.
 *
 * @param kernel - DNS kernel
 * @returns DoH configuration
 *
 * @example
 * ```typescript
 * const config = dohGetConfig(kernel);
 * console.log(config); // { server: '...', timeout: 5000, headers: {...} }
 * ```
 */
export function dohGetConfig(
  kernel: DnsKernel<DohPluginState & DnsKernelContext>,
): {
  server: string;
  timeout: number;
  headers: Record<string, string>;
} {
  return {
    server: kernel.getState('server') as string,
    timeout: kernel.getState('timeout') as number,
    headers: kernel.getState('headers') as Record<string, string>,
  };
}
