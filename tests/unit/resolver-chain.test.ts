/**
 * Resolver chain plugin tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DnsKernel } from '../../src/kernel.js';
import {
  resolverChainPlugin,
  getNextResolver,
  markResolverFailed,
  resetFailedResolvers,
  getResolvers,
  addResolver,
  removeResolver,
  getResolverHealth,
  setResolverHealth,
} from '../../src/plugins/core/resolver-chain.js';

describe('resolverChainPlugin', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({});
  });

  it('should install plugin', () => {
    expect(() => kernel.use(resolverChainPlugin)).not.toThrow();
  });

  it('should have plugin name and version', () => {
    expect(resolverChainPlugin.name).toBe('resolver-chain');
    expect(resolverChainPlugin.version).toBe('1.0.0');
  });

  it('should initialize with default servers', () => {
    kernel.use(resolverChainPlugin);
    const servers = getResolvers(kernel);
    expect(servers).toEqual(['8.8.8.8', '1.1.1.1']);
  });

  it('should initialize with custom servers', () => {
    kernel = new DnsKernel({ servers: ['9.9.9.9', '8.8.8.8'] });
    kernel.use(resolverChainPlugin);
    const servers = getResolvers(kernel);
    expect(servers).toEqual(['9.9.9.9', '8.8.8.8']);
  });

  it('should throw on invalid server', () => {
    expect(() => {
      const k = new DnsKernel({ servers: ['invalid:123'] });
      k.use(resolverChainPlugin);
    }).toThrow('Invalid DNS server');
  });

  it('should initialize health for all servers', () => {
    kernel.use(resolverChainPlugin);
    expect(getResolverHealth(kernel, '8.8.8.8')).toBe(true);
    expect(getResolverHealth(kernel, '1.1.1.1')).toBe(true);
  });

  it('should initialize empty failed set', () => {
    kernel.use(resolverChainPlugin);
    const failed = kernel.getState('failed') as Set<string>;
    expect(failed.size).toBe(0);
  });

  it('should initialize current index to 0', () => {
    kernel.use(resolverChainPlugin);
    expect(kernel.getState('currentIndex')).toBe(0);
  });
});

describe('getNextResolver', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ servers: ['8.8.8.8', '1.1.1.1', '9.9.9.9'] });
    kernel.use(resolverChainPlugin);
  });

  it('should return first available server with failover strategy', () => {
    const server = getNextResolver(kernel);
    expect(['8.8.8.8', '1.1.1.1', '9.9.9.9']).toContain(server);
  });

  it('should skip failed servers', () => {
    markResolverFailed(kernel, '8.8.8.8');
    const server = getNextResolver(kernel);
    expect(['1.1.1.1', '9.9.9.9']).toContain(server);
    expect(server).not.toBe('8.8.8.8');
  });

  it('should skip unhealthy servers', () => {
    setResolverHealth(kernel, '8.8.8.8', false);
    const server = getNextResolver(kernel);
    expect(['1.1.1.1', '9.9.9.9']).toContain(server);
    expect(server).not.toBe('8.8.8.8');
  });

  it('should reset failed when all servers failed', () => {
    markResolverFailed(kernel, '8.8.8.8');
    markResolverFailed(kernel, '1.1.1.1');
    markResolverFailed(kernel, '9.9.9.9');

    const server = getNextResolver(kernel);
    expect(['8.8.8.8', '1.1.1.1', '9.9.9.9']).toContain(server);
  });

  it('should use round-robin strategy', () => {
    kernel = new DnsKernel({
      servers: ['8.8.8.8', '1.1.1.1'],
      rotationStrategy: 'round-robin',
    });
    kernel.use(resolverChainPlugin);

    const servers = [];
    for (let i = 0; i < 4; i++) {
      servers.push(getNextResolver(kernel));
    }

    // Should cycle through servers
    expect(servers[0]).toBe(servers[2]);
    expect(servers[1]).toBe(servers[3]);
  });

  it('should use random strategy', () => {
    kernel = new DnsKernel({
      servers: ['8.8.8.8', '1.1.1.1', '9.9.9.9'],
      rotationStrategy: 'random',
    });
    kernel.use(resolverChainPlugin);

    const server = getNextResolver(kernel);
    expect(['8.8.8.8', '1.1.1.1', '9.9.9.9']).toContain(server);
  });
});

describe('markResolverFailed', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ servers: ['8.8.8.8', '1.1.1.1'] });
    kernel.use(resolverChainPlugin);
  });

  it('should mark server as failed', () => {
    markResolverFailed(kernel, '8.8.8.8');
    const failed = kernel.getState('failed') as Set<string>;
    expect(failed.has('8.8.8.8')).toBe(true);
  });

  it('should set health to false for failed server', () => {
    markResolverFailed(kernel, '8.8.8.8');
    expect(getResolverHealth(kernel, '8.8.8.8')).toBe(false);
  });

  it('should handle marking multiple servers as failed', () => {
    markResolverFailed(kernel, '8.8.8.8');
    markResolverFailed(kernel, '1.1.1.1');

    const failed = kernel.getState('failed') as Set<string>;
    expect(failed.has('8.8.8.8')).toBe(true);
    expect(failed.has('1.1.1.1')).toBe(true);
  });
});

describe('resetFailedResolvers', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ servers: ['8.8.8.8', '1.1.1.1'] });
    kernel.use(resolverChainPlugin);
  });

  it('should clear failed set', () => {
    markResolverFailed(kernel, '8.8.8.8');
    markResolverFailed(kernel, '1.1.1.1');

    resetFailedResolvers(kernel);

    const failed = kernel.getState('failed') as Set<string>;
    expect(failed.size).toBe(0);
  });

  it('should reset health for all servers', () => {
    setResolverHealth(kernel, '8.8.8.8', false);
    setResolverHealth(kernel, '1.1.1.1', false);

    resetFailedResolvers(kernel);

    expect(getResolverHealth(kernel, '8.8.8.8')).toBe(true);
    expect(getResolverHealth(kernel, '1.1.1.1')).toBe(true);
  });

  it('should work when no servers have failed', () => {
    expect(() => resetFailedResolvers(kernel)).not.toThrow();
    const failed = kernel.getState('failed') as Set<string>;
    expect(failed.size).toBe(0);
  });
});

describe('getResolvers', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ servers: ['8.8.8.8', '1.1.1.1'] });
    kernel.use(resolverChainPlugin);
  });

  it('should return array of servers', () => {
    const servers = getResolvers(kernel);
    expect(Array.isArray(servers)).toBe(true);
    expect(servers).toEqual(['8.8.8.8', '1.1.1.1']);
  });

  it('should return a copy of servers', () => {
    const servers1 = getResolvers(kernel);
    const servers2 = getResolvers(kernel);
    expect(servers1).not.toBe(servers2);
    expect(servers1).toEqual(servers2);
  });
});

describe('addResolver', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ servers: ['8.8.8.8'] });
    kernel.use(resolverChainPlugin);
  });

  it('should add new resolver', () => {
    addResolver(kernel, '1.1.1.1');
    const servers = getResolvers(kernel);
    expect(servers).toContain('1.1.1.1');
  });

  it('should set health for new resolver', () => {
    addResolver(kernel, '1.1.1.1');
    expect(getResolverHealth(kernel, '1.1.1.1')).toBe(true);
  });

  it('should not add duplicate resolver', () => {
    addResolver(kernel, '8.8.8.8');
    const servers = getResolvers(kernel);
    // Should only appear once
    expect(servers.filter(s => s === '8.8.8.8')).toHaveLength(1);
  });

  it('should throw on invalid server', () => {
    expect(() => addResolver(kernel, 'invalid:123')).toThrow('Invalid DNS server');
  });

  it('should add domain names as resolvers', () => {
    addResolver(kernel, 'dns.google');
    const servers = getResolvers(kernel);
    expect(servers).toContain('dns.google');
  });
});

describe('removeResolver', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ servers: ['8.8.8.8', '1.1.1.1', '9.9.9.9'] });
    kernel.use(resolverChainPlugin);
  });

  it('should remove existing resolver', () => {
    const result = removeResolver(kernel, '1.1.1.1');
    expect(result).toBe(true);

    const servers = getResolvers(kernel);
    expect(servers).not.toContain('1.1.1.1');
    expect(servers).toHaveLength(2);
  });

  it('should return false for non-existent resolver', () => {
    const result = removeResolver(kernel, '192.168.1.1');
    expect(result).toBe(false);
  });

  it('should remove health status', () => {
    removeResolver(kernel, '8.8.8.8');
    expect(getResolverHealth(kernel, '8.8.8.8')).toBeUndefined();
  });

  it('should remove from failed set', () => {
    markResolverFailed(kernel, '8.8.8.8');
    removeResolver(kernel, '8.8.8.8');

    const failed = kernel.getState('failed') as Set<string>;
    expect(failed.has('8.8.8.8')).toBe(false);
  });

  it('should reset index when removing last server', () => {
    kernel.setState('currentIndex', 2);
    removeResolver(kernel, '9.9.9.9');

    expect(kernel.getState('currentIndex')).toBe(0);
  });

  it('should not reset index when removing non-last server', () => {
    kernel.setState('currentIndex', 1);
    removeResolver(kernel, '8.8.8.8');

    expect(kernel.getState('currentIndex')).toBe(1);
  });
});

describe('getResolverHealth', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ servers: ['8.8.8.8', '1.1.1.1'] });
    kernel.use(resolverChainPlugin);
  });

  it('should return health status for existing server', () => {
    expect(getResolverHealth(kernel, '8.8.8.8')).toBe(true);
  });

  it('should return undefined for non-existent server', () => {
    expect(getResolverHealth(kernel, '192.168.1.1')).toBeUndefined();
  });

  it('should reflect failed status', () => {
    markResolverFailed(kernel, '8.8.8.8');
    expect(getResolverHealth(kernel, '8.8.8.8')).toBe(false);
  });
});

describe('setResolverHealth', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ servers: ['8.8.8.8', '1.1.1.1'] });
    kernel.use(resolverChainPlugin);
  });

  it('should set health to false', () => {
    setResolverHealth(kernel, '8.8.8.8', false);
    expect(getResolverHealth(kernel, '8.8.8.8')).toBe(false);
  });

  it('should set health to true', () => {
    setResolverHealth(kernel, '8.8.8.8', false);
    setResolverHealth(kernel, '8.8.8.8', true);
    expect(getResolverHealth(kernel, '8.8.8.8')).toBe(true);
  });

  it('should allow setting health for non-configured server', () => {
    setResolverHealth(kernel, '192.168.1.1', true);
    expect(getResolverHealth(kernel, '192.168.1.1')).toBe(true);
  });
});

describe('Resolver chain edge cases', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = new DnsKernel({ servers: ['8.8.8.8', '1.1.1.1'] });
    kernel.use(resolverChainPlugin);
  });

  it('should handle empty server list gracefully', () => {
    // Remove all servers
    removeResolver(kernel, '8.8.8.8');
    removeResolver(kernel, '1.1.1.1');

    const servers = getResolvers(kernel);
    expect(servers).toHaveLength(0);
  });

  it('should handle add after remove', () => {
    removeResolver(kernel, '8.8.8.8');
    addResolver(kernel, '9.9.9.9');

    const servers = getResolvers(kernel);
    expect(servers).toContain('9.9.9.9');
    expect(servers).not.toContain('8.8.8.8');
  });

  it('should handle multiple mark and reset cycles', () => {
    markResolverFailed(kernel, '8.8.8.8');
    resetFailedResolvers(kernel);
    markResolverFailed(kernel, '8.8.8.8');
    resetFailedResolvers(kernel);

    const failed = kernel.getState('failed') as Set<string>;
    expect(failed.size).toBe(0);
  });

  it('should preserve server order', () => {
    const servers = getResolvers(kernel);
    expect(servers[0]).toBe('8.8.8.8');
    expect(servers[1]).toBe('1.1.1.1');
  });

  it('should handle setting health then marking failed', () => {
    setResolverHealth(kernel, '8.8.8.8', true);
    markResolverFailed(kernel, '8.8.8.8');
    expect(getResolverHealth(kernel, '8.8.8.8')).toBe(false);
  });
});
