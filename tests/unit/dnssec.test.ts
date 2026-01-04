/**
 * DNSSEC plugin tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DnsKernel } from '../../src/kernel.js';
import { dnssecPlugin, addTrustAnchor, removeTrustAnchor, getTrustAnchors, isDnssecRequired, setDnssecEnabled, validateDnssec } from '../../src/plugins/optional/dnssec.js';

describe('DNSSEC Plugin', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
  });

  it('should install DNSSEC plugin', () => {
    expect(() => kernel.use(dnssecPlugin)).not.toThrow();
  });

  it('should have plugin name and version', () => {
    expect(dnssecPlugin.name).toBe('dnssec');
    expect(dnssecPlugin.version).toBe('1.0.0');
  });
});

describe('DNSSEC Plugin State', () => {
  it('should not initialize when disabled', () => {
    const kernel = new DnsKernel({});
    kernel.use(dnssecPlugin);

    // Plugin should not initialize state when DNSSEC is disabled
    expect(kernel.getState('enabled')).toBeUndefined();
    expect(kernel.getState('requireValid')).toBeUndefined();
    expect(kernel.getState('trustAnchors')).toBeUndefined();
  });

  it('should initialize with default values when enabled', () => {
    const kernel = new DnsKernel({ dnssec: true });
    kernel.use(dnssecPlugin);

    expect(kernel.getState('enabled')).toBe(true);
    expect(kernel.getState('requireValid')).toBe(true);
    expect(kernel.getState('trustAnchors')).toBeDefined();
    expect(Array.isArray(kernel.getState('trustAnchors'))).toBe(true);
  });

  it('should initialize with custom options', () => {
    const customKernel = new DnsKernel({
      dnssec: {
        enabled: true,
        requireValid: true,
        trustAnchors: ['root-anchor'],
      },
    });
    customKernel.use(dnssecPlugin);

    expect(customKernel.getState('enabled')).toBe(true);
    expect(customKernel.getState('requireValid')).toBe(true);
    expect(customKernel.getState('trustAnchors')).toContain('root-anchor');
  });
});

describe('Trust Anchors', () => {
  it('should add trust anchor', () => {
    const kernel = new DnsKernel({ dnssec: { enabled: true, trustAnchors: [] } });
    kernel.use(dnssecPlugin);

    addTrustAnchor(kernel, 'root-key-1');
    addTrustAnchor(kernel, 'root-key-2');

    const anchors = getTrustAnchors(kernel);
    expect(anchors).toHaveLength(2);
    expect(anchors).toContain('root-key-1');
    expect(anchors).toContain('root-key-2');
  });

  it('should remove trust anchor', () => {
    const kernel = new DnsKernel({ dnssec: { enabled: true, trustAnchors: [] } });
    kernel.use(dnssecPlugin);

    addTrustAnchor(kernel, 'root-key-1');
    addTrustAnchor(kernel, 'root-key-2');

    const removed = removeTrustAnchor(kernel, 'root-key-1');
    expect(removed).toBe(true);

    const anchors = getTrustAnchors(kernel);
    expect(anchors).toHaveLength(1);
    expect(anchors).not.toContain('root-key-1');
    expect(anchors).toContain('root-key-2');
  });

  it('should return false when removing non-existent anchor', () => {
    const kernel = new DnsKernel({ dnssec: { enabled: true, trustAnchors: [] } });
    kernel.use(dnssecPlugin);

    const removed = removeTrustAnchor(kernel, 'non-existent');
    expect(removed).toBe(false);
  });

  it('should get all trust anchors', () => {
    const kernel = new DnsKernel({ dnssec: { enabled: true, trustAnchors: [] } });
    kernel.use(dnssecPlugin);

    addTrustAnchor(kernel, 'root-key-1');
    addTrustAnchor(kernel, 'root-key-2');
    addTrustAnchor(kernel, 'root-key-3');

    const anchors = getTrustAnchors(kernel);
    expect(anchors).toHaveLength(3);
    expect(anchors).toEqual(['root-key-1', 'root-key-2', 'root-key-3']);
  });

  it('should return copy of anchors (not reference)', () => {
    const kernel = new DnsKernel({ dnssec: { enabled: true, trustAnchors: [] } });
    kernel.use(dnssecPlugin);

    addTrustAnchor(kernel, 'root-key-1');

    const anchors1 = getTrustAnchors(kernel);
    const anchors2 = getTrustAnchors(kernel);

    expect(anchors1).not.toBe(anchors2);
    expect(anchors1).toEqual(anchors2);
  });
});

describe('DNSSEC Enable/Disable', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ dnssec: true });
    kernel.use(dnssecPlugin);
  });

  it('should enable DNSSEC', () => {
    setDnssecEnabled(kernel, true);
    expect(kernel.getState('enabled')).toBe(true);
  });

  it('should disable DNSSEC', () => {
    setDnssecEnabled(kernel, true);
    setDnssecEnabled(kernel, false);
    expect(kernel.getState('enabled')).toBe(false);
  });

  it('should check if DNSSEC is required', () => {
    // When using dnssec: true, requireValid defaults to true
    expect(isDnssecRequired(kernel)).toBe(true);

    kernel.setState('requireValid', false);
    expect(isDnssecRequired(kernel)).toBe(false);
  });
});

describe('DNSSEC Plugin Options', () => {
  it('should initialize with enabled option', () => {
    const kernel = new DnsKernel({
      dnssec: { enabled: true }
    });
    kernel.use(dnssecPlugin);

    expect(kernel.getState('enabled')).toBe(true);
  });

  it('should initialize with requireValid option', () => {
    const kernel = new DnsKernel({
      dnssec: { enabled: true, requireValid: true }
    });
    kernel.use(dnssecPlugin);

    expect(kernel.getState('requireValid')).toBe(true);
  });

  it('should initialize with trust anchors from options', () => {
    const kernel = new DnsKernel({
      dnssec: {
        enabled: true,
        trustAnchors: ['anchor-1', 'anchor-2']
      }
    });
    kernel.use(dnssecPlugin);

    const anchors = getTrustAnchors(kernel);
    expect(anchors).toContain('anchor-1');
    expect(anchors).toContain('anchor-2');
  });

  it('should handle all options together', () => {
    const kernel = new DnsKernel({
      dnssec: {
        enabled: true,
        requireValid: true,
        trustAnchors: ['root-anchor']
      }
    });
    kernel.use(dnssecPlugin);

    expect(kernel.getState('enabled')).toBe(true);
    expect(kernel.getState('requireValid')).toBe(true);
    expect(getTrustAnchors(kernel)).toContain('root-anchor');
  });
});

describe('DNSSEC Plugin Boolean Option', () => {
  it('should enable when set to true', () => {
    const kernel = new DnsKernel({ dnssec: true });
    kernel.use(dnssecPlugin);

    expect(kernel.getState('enabled')).toBe(true);
  });

  it('should not enable when not set', () => {
    const kernel = new DnsKernel({});
    kernel.use(dnssecPlugin);

    // Plugin should not initialize state when DNSSEC is not set
    expect(kernel.getState('enabled')).toBeUndefined();
  });
});

describe('Trust Anchor Edge Cases', () => {
  it('should handle empty trust anchor string', () => {
    const kernel = new DnsKernel({ dnssec: { enabled: true, trustAnchors: [] } });
    kernel.use(dnssecPlugin);

    addTrustAnchor(kernel, '');

    const anchors = getTrustAnchors(kernel);
    expect(anchors).toContain('');
  });

  it('should handle duplicate trust anchors', () => {
    const kernel = new DnsKernel({ dnssec: { enabled: true, trustAnchors: [] } });
    kernel.use(dnssecPlugin);

    addTrustAnchor(kernel, 'root-key-1');
    addTrustAnchor(kernel, 'root-key-1');

    const anchors = getTrustAnchors(kernel);
    expect(anchors).toHaveLength(2); // Doesn't deduplicate
  });

  it('should remove specific occurrence of duplicate anchor', () => {
    const kernel = new DnsKernel({ dnssec: { enabled: true, trustAnchors: [] } });
    kernel.use(dnssecPlugin);

    addTrustAnchor(kernel, 'root-key-1');
    addTrustAnchor(kernel, 'root-key-1');
    addTrustAnchor(kernel, 'root-key-2');

    removeTrustAnchor(kernel, 'root-key-1');

    const anchors = getTrustAnchors(kernel);
    expect(anchors).toHaveLength(2);
    expect(anchors).toContain('root-key-1'); // One remains
    expect(anchors).toContain('root-key-2');
  });
});

describe('DNSSEC State Management', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ dnssec: true });
    kernel.use(dnssecPlugin);
  });

  it('should persist enabled state', () => {
    setDnssecEnabled(kernel, true);
    expect(kernel.getState('enabled')).toBe(true);

    setDnssecEnabled(kernel, false);
    expect(kernel.getState('enabled')).toBe(false);

    setDnssecEnabled(kernel, true);
    expect(kernel.getState('enabled')).toBe(true);
  });

  it('should persist trust anchors independently of enabled state', () => {
    addTrustAnchor(kernel, 'anchor-1');
    setDnssecEnabled(kernel, false);
    expect(getTrustAnchors(kernel)).toContain('anchor-1');

    setDnssecEnabled(kernel, true);
    expect(getTrustAnchors(kernel)).toContain('anchor-1');
  });

  it('should persist requireValid state', () => {
    kernel.setState('requireValid', true);
    expect(isDnssecRequired(kernel)).toBe(true);

    kernel.setState('requireValid', false);
    expect(isDnssecRequired(kernel)).toBe(false);
  });
});

describe('DNSSEC Validation Events', () => {
  let kernel: DnsKernel;
  let validatedData: unknown | undefined;

  beforeEach(() => {
    kernel = new DnsKernel({ dnssec: true });
    kernel.use(dnssecPlugin);

    // Track dnssec-validated events
    kernel.on('dnssec-validated', (data: unknown) => {
      validatedData = data;
    });
  });

  it('should validate DNSSEC with AD flag set', async () => {
    // Simulate a parsed-response with AD flag set (0x0020)
    await kernel.emit('parsed-response', {
      query: { name: 'example.com' },
      response: { flags: 0x8120 }, // QR=1, AD=1
    } as never);

    expect(validatedData).toBeDefined();
    expect((validatedData as { result: { secure: boolean } }).result.secure).toBe(true);
    expect((validatedData as { result: { reason: string } }).result.reason).toBe('ad-flag-set');
  });

  it('should fail DNSSEC validation without AD flag', async () => {
    await kernel.emit('parsed-response', {
      query: { name: 'example.com' },
      response: { flags: 0x8100 }, // QR=1, AD=0
    } as never);

    expect(validatedData).toBeDefined();
    expect((validatedData as { result: { secure: boolean } }).result.secure).toBe(false);
    expect((validatedData as { result: { reason: string } }).result.reason).toBe('ad-flag-not-set');
  });

  it('should not emit dnssec-validated when disabled', async () => {
    setDnssecEnabled(kernel, false);
    validatedData = undefined;

    await kernel.emit('parsed-response', {
      query: { name: 'example.com' },
      response: { flags: 0x8120 },
    } as never);

    expect(validatedData).toBeUndefined();
  });

  it('should handle multiple validations', async () => {
    await kernel.emit('parsed-response', {
      query: { name: 'secure.com' },
      response: { flags: 0x8120 },
    } as never);

    await kernel.emit('parsed-response', {
      query: { name: 'insecure.com' },
      response: { flags: 0x8100 },
    } as never);

    // Last event should be for insecure.com
    expect((validatedData as { domain: string }).domain).toBe('insecure.com');
    expect((validatedData as { result: { secure: boolean } }).result.secure).toBe(false);
  });

  it('should include domain in validated event', async () => {
    await kernel.emit('parsed-response', {
      query: { name: 'test.example.com' },
      response: { flags: 0x8120 },
    } as never);

    expect((validatedData as { domain: string }).domain).toBe('test.example.com');
  });
});

describe('validateDnssec function', () => {
  it('should return secure result when enabled', async () => {
    const kernel = new DnsKernel({ dnssec: true });
    kernel.use(dnssecPlugin);

    const result = await validateDnssec(kernel, 'example.com');
    expect(result.secure).toBe(true);
    expect(result.reason).toBe('trust-anchor-verified');
    expect(result.keyTag).toBe(20326);
  });

  it('should return insecure result when disabled', async () => {
    const kernel = new DnsKernel({ dnssec: true });
    kernel.use(dnssecPlugin);
    setDnssecEnabled(kernel, false);

    const result = await validateDnssec(kernel, 'example.com');
    expect(result.secure).toBe(false);
    expect(result.reason).toBe('dnssec-disabled');
    expect(result.keyTag).toBeUndefined();
  });

  it('should return insecure result when DNSSEC not configured', async () => {
    const kernel = new DnsKernel({});
    kernel.use(dnssecPlugin);

    const result = await validateDnssec(kernel, 'example.com');
    expect(result.secure).toBe(false);
    expect(result.reason).toBe('dnssec-disabled');
    expect(result.keyTag).toBeUndefined();
  });

  it('should handle validation for different domains', async () => {
    const kernel = new DnsKernel({ dnssec: true });
    kernel.use(dnssecPlugin);

    const result1 = await validateDnssec(kernel, 'example.com');
    const result2 = await validateDnssec(kernel, 'test.org');

    expect(result1.secure).toBe(true);
    expect(result2.secure).toBe(true);
    expect(result1.keyTag).toBe(result2.keyTag);
  });
});

describe('DNSSEC Lifecycle Hooks', () => {
  it('should handle onDestroy hook', async () => {
    const kernel = new DnsKernel({ dnssec: true });
    kernel.use(dnssecPlugin);
    await kernel.init();

    await kernel.destroy();
    // After destroy, plugins should be cleared
    expect(kernel.context.plugins.size).toBe(0);
  });
});
