/**
 * DNS Kernel tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DnsKernel, createKernel } from '../../src/kernel.js';
import type { ResolverOptions } from '../../src/types.js';
import { PluginError } from '../../src/errors.js';

describe('DnsKernel', () => {
  let kernel: DnsKernel;

  beforeEach(() => {
    kernel = createKernel({ timeout: 5000 });
  });

  describe('constructor', () => {
    it('should create kernel with options', () => {
      expect(kernel.context.options.timeout).toBe(5000);
    });

    it('should initialize empty state', () => {
      expect(kernel.context.plugins.size).toBe(0);
      expect(kernel.context.listeners.size).toBe(0);
    });
  });

  describe('use', () => {
    it('should register a plugin', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
      };

      kernel.use(plugin);
      expect(kernel.has('test-plugin')).toBe(true);
    });

    it('should call plugin install', () => {
      let called = false;
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {
          called = true;
        },
      };

      kernel.use(plugin);
      expect(called).toBe(true);
    });

    it('should throw on duplicate plugin', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
      };

      kernel.use(plugin);
      expect(() => kernel.use(plugin)).toThrow(PluginError);
    });

    it('should resolve dependencies', () => {
      const plugin1 = {
        name: 'plugin1',
        version: '1.0.0',
        install: () => {},
      };

      const plugin2 = {
        name: 'plugin2',
        version: '1.0.0',
        dependencies: ['plugin1'] as const,
        install: () => {},
      };

      kernel.use(plugin1);
      kernel.use(plugin2);
      expect(kernel.has('plugin2')).toBe(true);
    });

    it('should throw on missing dependency', () => {
      const plugin = {
        name: 'plugin',
        version: '1.0.0',
        dependencies: ['missing'] as const,
        install: () => {},
      };

      expect(() => kernel.use(plugin)).toThrow(PluginError);
    });
  });

  describe('unregister', () => {
    it('should unregister a plugin', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
        onDestroy: () => {},
      };

      kernel.use(plugin);
      expect(kernel.unregister('test-plugin')).toBe(true);
      expect(kernel.has('test-plugin')).toBe(false);
    });

    it('should return false for non-existent plugin', () => {
      expect(kernel.unregister('nonexistent')).toBe(false);
    });

    it('should call onDestroy', () => {
      let destroyed = false;
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
        onDestroy: () => {
          destroyed = true;
        },
      };

      kernel.use(plugin);
      kernel.unregister('test-plugin');
      expect(destroyed).toBe(true);
    });
  });

  describe('has', () => {
    it('should return true for registered plugin', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
      };

      kernel.use(plugin);
      expect(kernel.has('test-plugin')).toBe(true);
    });

    it('should return false for non-existent plugin', () => {
      expect(kernel.has('nonexistent')).toBe(false);
    });
  });

  describe('get', () => {
    it('should return registered plugin', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
      };

      kernel.use(plugin);
      expect(kernel.get('test-plugin')).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', () => {
      expect(kernel.get('nonexistent')).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should return list of plugin names', () => {
      const plugin1 = { name: 'plugin1', version: '1.0.0', install: () => {} };
      const plugin2 = { name: 'plugin2', version: '1.0.0', install: () => {} };

      kernel.use(plugin1);
      kernel.use(plugin2);

      const list = kernel.list();
      expect(list).toContain('plugin1');
      expect(list).toContain('plugin2');
    });
  });

  describe('on and emit', () => {
    it('should register event listener', () => {
      let called = false;
      kernel.on('query', () => {
        called = true;
      });

      kernel.emit('query');
      expect(called).toBe(true);
    });

    it('should pass data to listener', () => {
      let received: unknown;
      kernel.on('query', (data) => {
        received = data;
      });

      kernel.emit('query', { test: 'data' });
      expect(received).toEqual({ test: 'data' });
    });

    it('should support multiple listeners', () => {
      let count = 0;
      kernel.on('query', () => count++);
      kernel.on('query', () => count++);

      kernel.emit('query');
      expect(count).toBe(2);
    });

    it('should return unregister function', () => {
      let called = false;
      const unregister = kernel.on('query', () => {
        called = true;
      });

      unregister();
      kernel.emit('query');
      expect(called).toBe(false);
    });
  });

  describe('getOptions and setOptions', () => {
    it('should get options', () => {
      const options = kernel.getOptions();
      expect(options.timeout).toBe(5000);
    });

    it('should set options', () => {
      kernel.setOptions({ timeout: 10000 });
      expect(kernel.getOptions().timeout).toBe(10000);
    });
  });

  describe('getState and setState', () => {
    it('should set and get state', () => {
      kernel.setState('test', 'value');
      expect(kernel.getState('test')).toBe('value');
    });

    it('should return undefined for non-existent key', () => {
      expect(kernel.getState('nonexistent')).toBeUndefined();
    });
  });

  describe('destroy', () => {
    it('should destroy all plugins', async () => {
      let destroyed1 = false;
      let destroyed2 = false;

      const plugin1 = {
        name: 'plugin1',
        version: '1.0.0',
        install: () => {},
        onDestroy: async () => {
          destroyed1 = true;
        },
      };

      const plugin2 = {
        name: 'plugin2',
        version: '1.0.0',
        install: () => {},
        onDestroy: async () => {
          destroyed2 = true;
        },
      };

      kernel.use(plugin1);
      kernel.use(plugin2);

      await kernel.destroy();
      expect(destroyed1).toBe(true);
      expect(destroyed2).toBe(true);
    });
  });

  describe('init', () => {
    it('should initialize plugins', async () => {
      let initialized = false;

      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
        onInit: async () => {
          initialized = true;
        },
      };

      kernel.use(plugin);
      await kernel.init();
      expect(initialized).toBe(true);
    });

    it('should handle dependencies in init', async () => {
      const order: string[] = [];

      const plugin1 = {
        name: 'plugin1',
        version: '1.0.0',
        install: () => {},
        onInit: async () => {
          order.push('plugin1');
        },
      };

      const plugin2 = {
        name: 'plugin2',
        version: '1.0.0',
        dependencies: ['plugin1'] as const,
        install: () => {},
        onInit: async () => {
          order.push('plugin2');
        },
      };

      kernel.use(plugin1);
      kernel.use(plugin2);

      await kernel.init();
      expect(order).toEqual(['plugin1', 'plugin2']);
    });
  });
});
