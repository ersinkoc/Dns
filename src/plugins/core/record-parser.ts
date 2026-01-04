/**
 * Record Parser Plugin
 *
 * Parses DNS wire format responses into structured data.
 *
 * @module
 */

import type { DnsPlugin } from '../../types.js';
import type { DnsKernelContext } from '../../kernel.js';
import type { DnsQuery } from '../../types.js';
import { DnsKernel } from '../../kernel.js';
import { parseRecords, isNXDOMAIN, isSERVFAIL, getMinTtl, sortSRVRecords } from '../../core/parser.js';
import { decodeResponse } from '../../core/wire.js';
import { DnsError } from '../../errors.js';

/**
 * Parsed response interface.
 *
 * @internal
 */
interface ParsedResponse {
  records: unknown[];
  ttl: number;
  answers: number;
}

/**
 * Record parser plugin context.
 *
 * @internal
 */
interface ParserState {
  /** Map of query IDs to original queries */
  queries: Map<number, DnsQuery>;
  /** Map of response keys to parsed responses */
  responses?: Map<string, ParsedResponse>;
}

/**
 * Record parser plugin.
 *
 * Automatically parses DNS wire format responses.
 *
 * @example
 * ```typescript
 * import { recordParserPlugin } from '@oxog/dns/plugins';
 *
 * kernel.use(recordParserPlugin);
 * ```
 */
export const recordParserPlugin: DnsPlugin<ParserState & DnsKernelContext> = {
  name: 'record-parser',
  version: '1.0.0',

  install(kernel: DnsKernel) {
    // Initialize state
    kernel.setState('queries', new Map());

    // Listen for query events to track query IDs
    kernel.on('query', async (data: unknown) => {
      const state = kernel.getState('queries') as Map<number, DnsQuery> | undefined;
      if (state && data && typeof data === 'object' && 'queryId' in data && 'query' in data) {
        state.set((data as { queryId: number }).queryId, (data as { query: DnsQuery }).query);
      }
    });

    // Listen for response events to parse them
    kernel.on('response', async (data: unknown) => {
      const state = kernel.getState('queries') as Map<number, DnsQuery> | undefined;
      if (!state || !data || typeof data !== 'object' || !('queryId' in data) || !('buffer' in data)) return;

      const queryId = (data as { queryId: number }).queryId;
      const buffer = (data as { buffer: Buffer }).buffer;
      const query = state.get(queryId);
      if (!query) return;

      try {
        // Decode response
        const response = decodeResponse(buffer);

        // Check for NXDOMAIN
        if (isNXDOMAIN(response)) {
          await kernel.emit('error', DnsError.nxdomain(query.name));
          return;
        }

        // Check for SERVFAIL
        if (isSERVFAIL(response)) {
          await kernel.emit('error', DnsError.servfail(query.name, 'unknown'));
          return;
        }

        // Parse records
        const records = parseRecords(buffer, response, query.type);

        // Get minimum TTL
        const ttl = getMinTtl(response);

        // Sort SRV records if requested
        if (query.type === 'SRV' && query.options?.sortSrv) {
          sortSRVRecords(records as Parameters<typeof sortSRVRecords>[0]);
        }

        // Emit parsed response
        await kernel.emit('parsed-response', {
          query,
          records,
          ttl,
          response,
        } as never);

        // Clean up
        state.delete(queryId);
      } catch (error) {
        await kernel.emit('error', error);
      }
    });
  },

  onDestroy() {
    // Cleanup handled by kernel
  },
};

/**
 * Get parsed response from kernel state.
 *
 * @param kernel - DNS kernel
 * @param key - Response key
 * @returns Parsed response or undefined
 *
 * @example
 * ```typescript
 * const parsed = getParsedResponse(kernel, 'example.com:A');
 * ```
 */
export function getParsedResponse(
  kernel: DnsKernel<ParserState & DnsKernelContext>,
  key: string,
): ParsedResponse | undefined {
  const state = kernel.getState('responses');
  if (!state) return undefined;
  return state.get(key) as ParsedResponse | undefined;
}

/**
 * Store parsed response in kernel state.
 *
 * @param kernel - DNS kernel
 * @param key - Response key
 * @param response - Parsed response
 *
 * @example
 * ```typescript
 * setParsedResponse(kernel, 'example.com:A', { records, ttl, answers });
 * ```
 */
export function setParsedResponse(
  kernel: DnsKernel<ParserState & DnsKernelContext>,
  key: string,
  response: ParsedResponse,
): void {
  let state = kernel.getState('responses');
  if (!state) {
    state = new Map();
    kernel.setState('responses', state);
  }
  state.set(key, response);
}

/**
 * Clear all parsed responses.
 *
 * @param kernel - DNS kernel
 *
 * @example
 * ```typescript
 * clearParsedResponses(kernel);
 * ```
 */
export function clearParsedResponses(kernel: DnsKernel<ParserState & DnsKernelContext>): void {
  kernel.setState('responses', new Map());
}
