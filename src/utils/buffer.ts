/**
 * Buffer utilities for DNS wire format encoding/decoding.
 *
 * @module
 */

/**
 * Read a 16-bit unsigned integer from buffer (big-endian).
 *
 * @param buffer - Buffer to read from
 * @param offset - Offset to start reading from
 * @returns The 16-bit unsigned integer
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from([0x01, 0x02]);
 * const value = readUInt16BE(buffer, 0); // 258
 * ```
 */
export function readUInt16BE(buffer: Buffer, offset: number): number {
  return buffer.readUInt16BE(offset);
}

/**
 * Write a 16-bit unsigned integer to buffer (big-endian).
 *
 * @param value - Value to write
 * @returns Buffer containing the value
 *
 * @example
 * ```typescript
 * const buffer = writeUInt16BE(258);
 * // Buffer <01 02>
 * ```
 */
export function writeUInt16BE(value: number): Buffer {
  const buffer = Buffer.allocUnsafe(2);
  buffer.writeUInt16BE(value);
  return buffer;
}

/**
 * Read a 32-bit unsigned integer from buffer (big-endian).
 *
 * @param buffer - Buffer to read from
 * @param offset - Offset to start reading from
 * @returns The 32-bit unsigned integer
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);
 * const value = readUInt32BE(buffer, 0); // 16909060
 * ```
 */
export function readUInt32BE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32BE(offset);
}

/**
 * Write a 32-bit unsigned integer to buffer (big-endian).
 *
 * @param value - Value to write
 * @returns Buffer containing the value
 *
 * @example
 * ```typescript
 * const buffer = writeUInt32BE(16909060);
 * // Buffer <01 02 03 04>
 * ```
 */
export function writeUInt32BE(value: number): Buffer {
  const buffer = Buffer.allocUnsafe(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

/**
 * Concatenate multiple buffers.
 *
 * @param buffers - Buffers to concatenate
 * @returns Concatenated buffer
 *
 * @example
 * ```typescript
 * const result = concatBuffers([
 *   Buffer.from([0x01]),
 *   Buffer.from([0x02])
 * ]);
 * // Buffer <01 02>
 * ```
 */
export function concatBuffers(buffers: Buffer[]): Buffer {
  return Buffer.concat(buffers);
}

/**
 * Slice a buffer with bounds checking.
 *
 * @param buffer - Buffer to slice
 * @param start - Start offset
 * @param end - End offset (exclusive)
 * @returns Sliced buffer
 * @throws {RangeError} If start or end are out of bounds
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);
 * const sliced = sliceBuffer(buffer, 1, 3);
 * // Buffer <02 03>
 * ```
 */
export function sliceBuffer(buffer: Buffer, start: number, end: number): Buffer {
  if (start < 0 || end > buffer.length || start > end) {
    throw new RangeError(`Invalid slice range: [${start}, ${end}] for buffer of length ${buffer.length}`);
  }
  return buffer.subarray(start, end);
}

/**
 * Create a buffer with repeated bytes.
 *
 * @param byte - Byte value to repeat
 * @param count - Number of times to repeat
 * @returns Buffer with repeated bytes
 *
 * @example
 * ```typescript
 * const buffer = repeatByte(0x00, 4);
 * // Buffer <00 00 00 00>
 * ```
 */
export function repeatByte(byte: number, count: number): Buffer {
  return Buffer.allocUnsafe(count).fill(byte);
}

/**
 * Compare two buffers for equality.
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns True if buffers are equal
 *
 * @example
 * ```typescript
 * const equal = buffersEqual(
 *   Buffer.from([0x01, 0x02]),
 *   Buffer.from([0x01, 0x02])
 * ); // true
 * ```
 */
export function buffersEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return a.every((byte, i) => byte === b[i]);
}

/**
 * Convert a buffer to a hex string.
 *
 * @param buffer - Buffer to convert
 * @returns Hex string representation
 *
 * @example
 * ```typescript
 * const hex = bufferToHex(Buffer.from([0x01, 0x02]));
 * // '0102'
 * ```
 */
export function bufferToHex(buffer: Buffer): string {
  return buffer.toString('hex');
}

/**
 * Convert a hex string to a buffer.
 *
 * @param hex - Hex string to convert
 * @returns Buffer
 * @throws {Error} If hex string is invalid
 *
 * @example
 * ```typescript
 * const buffer = hexToBuffer('0102');
 * // Buffer <01 02>
 * ```
 */
export function hexToBuffer(hex: string): Buffer {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string: length must be even');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Read a null-terminated string from buffer.
 *
 * @param buffer - Buffer to read from
 * @param offset - Starting offset
 * @returns Tuple of [string, newOffset]
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from('hello\0world', 'latin1');
 * const [str, offset] = readNullTerminatedString(buffer, 0);
 * // str = 'hello', offset = 6
 * ```
 */
export function readNullTerminatedString(buffer: Buffer, offset: number): [string, number] {
  const start = offset;
  while (offset < buffer.length && buffer[offset] !== 0) {
    offset++;
  }
  const str = buffer.toString('latin1', start, offset);
  return [str, offset + 1];
}

/**
 * Write a null-terminated string to buffer.
 *
 * @param str - String to write
 * @returns Buffer containing the string
 *
 * @example
 * ```typescript
 * const buffer = writeNullTerminatedString('hello');
 * // Buffer <68 65 6c 6c 6f 00>
 * ```
 */
export function writeNullTerminatedString(str: string): Buffer {
  const strBuffer = Buffer.from(str, 'latin1');
  return Buffer.concat([strBuffer, Buffer.from([0])]);
}
