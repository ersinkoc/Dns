/**
 * Buffer utility tests
 */

import { describe, it, expect } from 'vitest';
import {
  sliceBuffer,
  repeatByte,
  readNullTerminatedString,
  writeNullTerminatedString,
  readUInt16BE,
  writeUInt16BE,
  readUInt32BE,
  writeUInt32BE,
  concatBuffers,
  buffersEqual,
  bufferToHex,
  hexToBuffer,
} from '../../src/utils/buffer.js';

describe('sliceBuffer', () => {
  it('should slice buffer correctly', () => {
    const buffer = Buffer.from([0, 1, 2, 3, 4]);
    const result = sliceBuffer(buffer, 1, 4);
    expect(result).toEqual(Buffer.from([1, 2, 3]));
  });

  it('should throw RangeError for invalid start', () => {
    const buffer = Buffer.from([0, 1, 2, 3, 4]);
    expect(() => sliceBuffer(buffer, -1, 4)).toThrow(RangeError);
  });

  it('should throw RangeError for invalid end beyond buffer length', () => {
    const buffer = Buffer.from([0, 1, 2, 3, 4]);
    expect(() => sliceBuffer(buffer, 0, 10)).toThrow(RangeError);
  });

  it('should throw RangeError for start greater than end', () => {
    const buffer = Buffer.from([0, 1, 2, 3, 4]);
    expect(() => sliceBuffer(buffer, 3, 2)).toThrow(RangeError);
  });

  it('should handle zero-length slice', () => {
    const buffer = Buffer.from([0, 1, 2, 3, 4]);
    const result = sliceBuffer(buffer, 2, 2);
    expect(result.length).toBe(0);
  });

  it('should handle full buffer slice', () => {
    const buffer = Buffer.from([0, 1, 2, 3, 4]);
    const result = sliceBuffer(buffer, 0, buffer.length);
    expect(result).toEqual(buffer);
  });
});

describe('repeatByte', () => {
  it('should repeat byte correctly', () => {
    const buffer = repeatByte(0xFF, 4);
    expect(buffer).toEqual(Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]));
  });

  it('should handle zero count', () => {
    const buffer = repeatByte(0xAB, 0);
    expect(buffer.length).toBe(0);
  });

  it('should handle single byte', () => {
    const buffer = repeatByte(0x00, 1);
    expect(buffer).toEqual(Buffer.from([0x00]));
  });

  it('should handle large count', () => {
    const buffer = repeatByte(0x55, 1000);
    expect(buffer.length).toBe(1000);
    expect(buffer[0]).toBe(0x55);
    expect(buffer[999]).toBe(0x55);
  });
});

describe('readNullTerminatedString', () => {
  it('should read null terminated string', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x57, 0x6f, 0x72, 0x6c, 0x64]);
    const [str, offset] = readNullTerminatedString(buffer, 0);
    expect(str).toBe('Hello');
    expect(offset).toBe(6);
  });

  it('should handle string at offset', () => {
    const buffer = Buffer.from([0x00, 0x00, 0x48, 0x69, 0x00]);
    const [str, offset] = readNullTerminatedString(buffer, 2);
    expect(str).toBe('Hi');
    expect(offset).toBe(5);
  });

  it('should read to end of buffer if no null terminator', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    const [str, offset] = readNullTerminatedString(buffer, 0);
    expect(str).toBe('Hello');
    expect(offset).toBe(6); // 5 (buffer.length) + 1 for the +1 in return
  });

  it('should handle empty string', () => {
    const buffer = Buffer.from([0x00, 0x41]);
    const [str, offset] = readNullTerminatedString(buffer, 0);
    expect(str).toBe('');
    expect(offset).toBe(1);
  });

  it('should handle binary data', () => {
    const buffer = Buffer.from([0x01, 0x02, 0x03, 0x00, 0xFF]);
    const [str, offset] = readNullTerminatedString(buffer, 0);
    expect(str).toBe('\x01\x02\x03');
    expect(offset).toBe(4);
  });
});

describe('writeNullTerminatedString', () => {
  it('should write null terminated string', () => {
    const buffer = writeNullTerminatedString('Hello');
    expect(buffer).toEqual(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00]));
  });

  it('should write empty string', () => {
    const buffer = writeNullTerminatedString('');
    expect(buffer).toEqual(Buffer.from([0x00]));
  });

  it('should handle unicode characters', () => {
    const buffer = writeNullTerminatedString('café');
    expect(buffer[buffer.length - 1]).toBe(0x00); // null terminator
  });
});

describe('readUInt16BE', () => {
  it('should read 16-bit big-endian unsigned integer', () => {
    const buffer = Buffer.from([0x12, 0x34]);
    expect(readUInt16BE(buffer, 0)).toBe(0x1234);
  });

  it('should handle zero', () => {
    const buffer = Buffer.from([0x00, 0x00]);
    expect(readUInt16BE(buffer, 0)).toBe(0);
  });

  it('should handle max value', () => {
    const buffer = Buffer.from([0xFF, 0xFF]);
    expect(readUInt16BE(buffer, 0)).toBe(0xFFFF);
  });
});

describe('writeUInt16BE', () => {
  it('should write 16-bit big-endian unsigned integer', () => {
    const buffer = writeUInt16BE(0x1234);
    expect(buffer[0]).toBe(0x12);
    expect(buffer[1]).toBe(0x34);
  });

  it('should handle zero', () => {
    const buffer = writeUInt16BE(0);
    expect(buffer[0]).toBe(0);
    expect(buffer[1]).toBe(0);
  });

  it('should handle max value', () => {
    const buffer = writeUInt16BE(0xFFFF);
    expect(buffer[0]).toBe(0xFF);
    expect(buffer[1]).toBe(0xFF);
  });
});

describe('writeUInt32BE', () => {
  it('should write 32-bit big-endian unsigned integer', () => {
    const buffer = writeUInt32BE(0x12345678);
    expect(buffer[0]).toBe(0x12);
    expect(buffer[1]).toBe(0x34);
    expect(buffer[2]).toBe(0x56);
    expect(buffer[3]).toBe(0x78);
  });

  it('should handle zero', () => {
    const buffer = writeUInt32BE(0);
    expect(buffer[0]).toBe(0);
    expect(buffer[1]).toBe(0);
    expect(buffer[2]).toBe(0);
    expect(buffer[3]).toBe(0);
  });

  it('should handle max value', () => {
    const buffer = writeUInt32BE(0xFFFFFFFF);
    expect(buffer[0]).toBe(0xFF);
    expect(buffer[1]).toBe(0xFF);
    expect(buffer[2]).toBe(0xFF);
    expect(buffer[3]).toBe(0xFF);
  });
});

describe('readUInt32BE', () => {
  it('should read 32-bit big-endian unsigned integer', () => {
    const buffer = Buffer.from([0x12, 0x34, 0x56, 0x78]);
    expect(readUInt32BE(buffer, 0)).toBe(0x12345678);
  });

  it('should handle zero', () => {
    const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    expect(readUInt32BE(buffer, 0)).toBe(0);
  });

  it('should handle max value', () => {
    const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
    expect(readUInt32BE(buffer, 0)).toBe(0xFFFFFFFF);
  });
});

describe('concatBuffers', () => {
  it('should concatenate buffers', () => {
    const buf1 = Buffer.from([1, 2]);
    const buf2 = Buffer.from([3, 4]);
    const result = concatBuffers([buf1, buf2]);
    expect(result).toEqual(Buffer.from([1, 2, 3, 4]));
  });

  it('should handle empty array', () => {
    const result = concatBuffers([]);
    expect(result.length).toBe(0);
  });

  it('should handle single buffer', () => {
    const buf = Buffer.from([1, 2, 3]);
    const result = concatBuffers([buf]);
    expect(result).toEqual(buf);
  });

  it('should handle multiple buffers', () => {
    const buf1 = Buffer.from([1]);
    const buf2 = Buffer.from([2]);
    const buf3 = Buffer.from([3]);
    const result = concatBuffers([buf1, buf2, buf3]);
    expect(result).toEqual(Buffer.from([1, 2, 3]));
  });
});

describe('buffersEqual', () => {
  it('should return true for equal buffers', () => {
    const buf1 = Buffer.from([1, 2, 3]);
    const buf2 = Buffer.from([1, 2, 3]);
    expect(buffersEqual(buf1, buf2)).toBe(true);
  });

  it('should return false for different buffers', () => {
    const buf1 = Buffer.from([1, 2, 3]);
    const buf2 = Buffer.from([1, 2, 4]);
    expect(buffersEqual(buf1, buf2)).toBe(false);
  });

  it('should return false for different lengths', () => {
    const buf1 = Buffer.from([1, 2, 3]);
    const buf2 = Buffer.from([1, 2]);
    expect(buffersEqual(buf1, buf2)).toBe(false);
  });

  it('should return true for empty buffers', () => {
    const buf1 = Buffer.alloc(0);
    const buf2 = Buffer.alloc(0);
    expect(buffersEqual(buf1, buf2)).toBe(true);
  });
});

describe('bufferToHex', () => {
  it('should convert buffer to hex string', () => {
    const buffer = Buffer.from([0x12, 0x34, 0xAB, 0xCD]);
    expect(bufferToHex(buffer)).toBe('1234abcd');
  });

  it('should handle empty buffer', () => {
    const buffer = Buffer.alloc(0);
    expect(bufferToHex(buffer)).toBe('');
  });
});

describe('hexToBuffer', () => {
  it('should convert hex string to buffer', () => {
    const buffer = hexToBuffer('1234abcd');
    expect(buffer).toEqual(Buffer.from([0x12, 0x34, 0xAB, 0xCD]));
  });

  it('should handle uppercase hex', () => {
    const buffer = hexToBuffer('1234ABCD');
    expect(buffer).toEqual(Buffer.from([0x12, 0x34, 0xAB, 0xCD]));
  });

  it('should handle mixed case hex', () => {
    const buffer = hexToBuffer('12Ab34Cd');
    expect(buffer).toEqual(Buffer.from([0x12, 0xAB, 0x34, 0xCD]));
  });

  it('should throw error for odd length hex', () => {
    expect(() => hexToBuffer('123')).toThrow('Invalid hex string');
  });

  it('should handle empty string', () => {
    const buffer = hexToBuffer('');
    expect(buffer.length).toBe(0);
  });
});
