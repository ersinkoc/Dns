/**
 * Custom DNS error classes.
 *
 * @example
 * ```typescript
 * import { DnsError, DnsErrorCode } from '@oxog/dns';
 *
 * throw new DnsError(DnsErrorCode.NXDOMAIN, 'Domain does not exist', {
 *   domain: 'example.com'
 * });
 * ```
 */

import { DnsErrorCode } from './types.js';

/**
 * Base DNS error class.
 *
 * @example
 * ```typescript
 * throw new DnsError(DnsErrorCode.TIMEOUT, 'Query timed out', {
 *   domain: 'example.com',
 *   type: 'A'
 * });
 * ```
 */
export class DnsError extends Error {
  /** DNS error code */
  readonly code: DnsErrorCode;

  /** Domain that caused the error */
  readonly domain?: string;

  /** Record type being queried */
  readonly recordType?: string;

  /** Original error that caused this error */
  override readonly cause?: Error;

  constructor(
    code: DnsErrorCode,
    message: string,
    options?: {
      domain?: string;
      recordType?: string;
      cause?: Error;
    },
  ) {
    super(message);
    this.name = 'DnsError';
    this.code = code;
    this.domain = options?.domain;
    this.recordType = options?.recordType;
    this.cause = options?.cause;

    // Maintain proper stack trace
    Error.captureStackTrace?.(this, DnsError);
  }

  /**
   * Create an NXDOMAIN error.
   *
   * @param domain - Domain that does not exist
   * @returns DnsError instance
   *
   * @example
   * ```typescript
   * throw DnsError.nxdomain('example.com');
   * ```
   */
  static nxdomain(domain: string): DnsError {
    return new DnsError(DnsErrorCode.NXDOMAIN, `Domain does not exist: ${domain}`, { domain });
  }

  /**
   * Create a timeout error.
   *
   * @param domain - Domain being queried
   * @param recordType - Record type being queried
   * @param timeout - Timeout duration in milliseconds
   * @returns DnsError instance
   *
   * @example
   * ```typescript
   * throw DnsError.timeout('example.com', 'A', 5000);
   * ```
   */
  static timeout(domain: string, recordType: string, timeout: number): DnsError {
    return new DnsError(
      DnsErrorCode.TIMEOUT,
      `Query timed out after ${timeout}ms: ${domain} ${recordType}`,
      { domain, recordType },
    );
  }

  /**
   * Create a SERVFAIL error.
   *
   * @param domain - Domain being queried
   * @param server - Server that failed
   * @returns DnsError instance
   *
   * @example
   * ```typescript
   * throw DnsError.servfail('example.com', '8.8.8.8');
   * ```
   */
  static servfail(domain: string, server: string): DnsError {
    return new DnsError(
      DnsErrorCode.SERVFAIL,
      `Server failed to respond: ${server} for ${domain}`,
      { domain },
    );
  }

  /**
   * Create a DNSSEC validation error.
   *
   * @param domain - Domain being validated
   * @param reason - Validation failure reason
   * @returns DnsError instance
   *
   * @example
   * ```typescript
   * throw DnsError.dnssecInvalid('example.com', 'Signature verification failed');
   * ```
   */
  static dnssecInvalid(domain: string, reason: string): DnsError {
    return new DnsError(
      DnsErrorCode.DNSSEC_INVALID,
      `DNSSEC validation failed for ${domain}: ${reason}`,
      { domain },
    );
  }

  /**
   * Create an invalid query error.
   *
   * @param domain - Invalid domain
   * @param reason - Why the query is invalid
   * @returns DnsError instance
   *
   * @example
   * ```typescript
   * throw DnsError.invalidQuery('', 'Domain cannot be empty');
   * ```
   */
  static invalidQuery(domain: string, reason: string): DnsError {
    return new DnsError(
      DnsErrorCode.INVALID_QUERY,
      `Invalid query for ${domain}: ${reason}`,
      { domain },
    );
  }

  /**
   * Create a network error.
   *
   * @param domain - Domain being queried
   * @param cause - Original network error
   * @returns DnsError instance
   *
   * @example
   * ```typescript
   * throw DnsError.networkError('example.com', new Error('ECONNREFUSED'));
   * ```
   */
  static networkError(domain: string, cause: Error): DnsError {
    return new DnsError(
      DnsErrorCode.NETWORK_ERROR,
      `Network error while querying ${domain}: ${cause.message}`,
      { domain, cause },
    );
  }

  /**
   * Convert error to JSON.
   *
   * @returns JSON representation of the error
   *
   * @example
   * ```typescript
   * const error = DnsError.nxdomain('example.com');
   * const json = error.toJSON();
   * // { code: 'NXDOMAIN', message: '...', domain: 'example.com' }
   * ```
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      domain: this.domain,
      recordType: this.recordType,
      cause: this.cause?.message,
    };
  }
}

/**
 * Validation error for invalid input.
 *
 * @example
 * ```typescript
 * throw new ValidationError('Invalid domain name', 'example..com');
 * ```
 */
export class ValidationError extends Error {
  /** Invalid value that caused the error */
  readonly value: unknown;

  constructor(message: string, value: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.value = value;
    Error.captureStackTrace?.(this, ValidationError);
  }
}

/**
 * Plugin error for plugin-related failures.
 *
 * @example
 * ```typescript
 * throw new PluginError('cache', 'Failed to initialize cache plugin');
 * ```
 */
export class PluginError extends Error {
  /** Plugin name that caused the error */
  readonly plugin: string;

  constructor(plugin: string, message: string, options?: { cause?: Error }) {
    super(message);
    this.name = 'PluginError';
    this.plugin = plugin;
    this.cause = options?.cause;
    Error.captureStackTrace?.(this, PluginError);
  }
}
