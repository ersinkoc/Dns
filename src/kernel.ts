/**
 * DNS Micro-Kernel
 *
 * Plugin-based architecture for DNS resolution.
 *
 * @module
 */

import type {
  DnsPlugin,
  PluginContext,
  KernelEvent,
  EventListener,
  ResolverOptions,
  DnsQuery,
  DnsResponse,
} from './types.js';
import { PluginError } from './errors.js';

/**
 * Shared context type for plugins.
 *
 * @template T - Custom context type extension
 *
 * @example
 * ```typescript
 * interface MyContext {
 *   cache?: Map<string, unknown>;
 *   metrics?: { queries: number };
 * }
 *
 * const kernel = new DnsKernel<MyContext>();
 * ```
 */
export interface DnsKernelContext {
  /** Resolver options */
  options: ResolverOptions;
  /** Shared state between plugins */
  state: Record<string, unknown>;
  /** Event listeners */
  listeners: Map<KernelEvent, Set<EventListener>>;
  /** Registered plugins */
  plugins: Map<string, DnsPlugin>;
  /** Plugin initialization status */
  initialized: Set<string>;
}

/**
 * DNS Micro-Kernel class.
 *
 * Manages plugins, events, and the DNS resolution lifecycle.
 *
 * @example
 * ```typescript
 * const kernel = new DnsKernel();
 *
 * // Register a plugin
 * kernel.use({
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   install: (k) => {
 *     // Plugin initialization
 *   }
 * });
 *
 * // Initialize all plugins
 * await kernel.init();
 *
 * // Emit an event
 * await kernel.emit('query', { domain: 'example.com', type: 'A' });
 * ```
 */
export class DnsKernel<TContext = Record<string, unknown>> {
  /** Kernel context */
  readonly context: DnsKernelContext & { customState: TContext };

  /** Constructor options */
  private _options: ResolverOptions;

  /**
   * Create a new DNS kernel.
   *
   * @param options - Resolver options
   *
   * @example
   * ```typescript
   * const kernel = new DnsKernel({ timeout: 5000 });
   * ```
   */
  constructor(options: ResolverOptions = {}) {
    this._options = options;
    this.context = {
      options,
      state: {},
      customState: {} as TContext,
      listeners: new Map(),
      plugins: new Map(),
      initialized: new Set(),
    };
  }

  /**
   * Register a plugin.
   *
   * @param plugin - Plugin to register
   * @returns This kernel instance for chaining
   * @throws {PluginError} If plugin is invalid or already registered
   *
   * @example
   * ```typescript
   * kernel.use({
   *   name: 'cache',
   *   version: '1.0.0',
   *   install: (k) => {
   *     k.on('query', async (data) => {
   *       // Check cache
   *     });
   *   }
   * });
   * ```
   */
  use<C extends TContext>(
    plugin: DnsPlugin<C>,
  ): this {
    // Validate plugin
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new PluginError('unknown', 'Plugin must have a valid name');
    }

    if (this.context.plugins.has(plugin.name)) {
      throw new PluginError(plugin.name, `Plugin already registered: ${plugin.name}`);
    }

    if (!plugin.install || typeof plugin.install !== 'function') {
      throw new PluginError(plugin.name, `Plugin must have an install function`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.context.plugins.has(dep)) {
          throw new PluginError(
            plugin.name,
            `Missing dependency: ${dep}. Please register it first.`,
          );
        }
      }
    }

    // Register plugin
    this.context.plugins.set(plugin.name, plugin);

    // Install plugin
    try {
      plugin.install(this as unknown as DnsKernel<C>);
    } catch (error) {
      this.context.plugins.delete(plugin.name);
      throw new PluginError(
        plugin.name,
        `Plugin installation failed: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error as Error },
      );
    }

    return this;
  }

  /**
   * Unregister a plugin.
   *
   * @param name - Plugin name
   * @returns True if plugin was unregistered
   *
   * @example
   * ```typescript
   * kernel.unregister('cache');
   * ```
   */
  unregister(name: string): boolean {
    const plugin = this.context.plugins.get(name);
    if (!plugin) return false;

    // Call onDestroy if present
    if (plugin.onDestroy) {
      try {
        plugin.onDestroy();
      } catch (error) {
        // Log error but continue
        console.error(`Error destroying plugin ${name}:`, error);
      }
    }

    // Remove plugin
    this.context.plugins.delete(name);
    this.context.initialized.delete(name);

    // Remove all event listeners from this plugin
    for (const [event, listeners] of this.context.listeners) {
      for (const listener of listeners) {
        // @ts-expect-error - We're checking if listener has plugin property
        if (listener.plugin === name) {
          listeners.delete(listener);
        }
      }
    }

    return true;
  }

  /**
   * Check if a plugin is registered.
   *
   * @param name - Plugin name
   * @returns True if plugin is registered
   *
   * @example
   * ```typescript
   * if (kernel.has('cache')) {
   *   console.log('Cache plugin is loaded');
   * }
   * ```
   */
  has(name: string): boolean {
    return this.context.plugins.has(name);
  }

  /**
   * Get a registered plugin.
   *
   * @param name - Plugin name
   * @returns Plugin or undefined
   *
   * @example
   * ```typescript
   * const plugin = kernel.get('cache');
   * ```
   */
  get(name: string): DnsPlugin<TContext> | undefined {
    return this.context.plugins.get(name) as DnsPlugin<TContext> | undefined;
  }

  /**
   * List all registered plugins.
   *
   * @returns Array of plugin names
   *
   * @example
   * ```typescript
   * const plugins = kernel.list();
   * // ['record-parser', 'cache', 'doh']
   * ```
   */
  list(): string[] {
    return Array.from(this.context.plugins.keys());
  }

  /**
   * Initialize all registered plugins.
   *
   * Calls the `onInit` hook for each plugin.
   *
   * @returns Promise that resolves when all plugins are initialized
   *
   * @example
   * ```typescript
   * await kernel.init();
   * ```
   */
  async init(): Promise<void> {
    // Initialize plugins in dependency order
    const initialized = new Set<string>();
    const toInit = Array.from(this.context.plugins.values());

    while (toInit.length > 0) {
      let initializedAny = false;

      for (let i = toInit.length - 1; i >= 0; i--) {
        const plugin = toInit[i]!;

        // Check if dependencies are satisfied
        const depsSatisfied =
          !plugin.dependencies ||
          plugin.dependencies.every((dep: string) => initialized.has(dep));

        if (!depsSatisfied) continue;

        // Initialize plugin
        if (plugin.onInit) {
          try {
            await plugin.onInit();
          } catch (error) {
            throw new PluginError(
              plugin.name,
              `Plugin initialization failed: ${error instanceof Error ? error.message : String(error)}`,
              { cause: error as Error },
            );
          }
        }

        initialized.add(plugin.name);
        this.context.initialized.add(plugin.name);
        toInit.splice(i, 1);
        initializedAny = true;
      }

      if (!initializedAny && toInit.length > 0) {
        // Circular dependency or missing dependency
        const remaining = toInit.map((p) => p.name).join(', ');
        throw new PluginError('system', `Cannot resolve plugin dependencies: ${remaining}`);
      }
    }
  }

  /**
   * Register an event listener.
   *
   * @param event - Event name
   * @param listener - Event listener callback
   * @returns Unregister function
   *
   * @example
   * ```typescript
   * const unregister = kernel.on('query', async (data) => {
   *   console.log('Query:', data);
   * });
   *
   * // Later
   * unregister();
   * ```
   */
  on(event: KernelEvent, listener: EventListener): () => void {
    if (!this.context.listeners.has(event)) {
      this.context.listeners.set(event, new Set());
    }

    this.context.listeners.get(event)!.add(listener);

    // Return unregister function
    return () => {
      this.context.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Emit an event to all listeners.
   *
   * @param event - Event name
   * @param data - Event data
   * @returns Promise that resolves when all listeners have been called
   *
   * @example
   * ```typescript
   * await kernel.emit('query', { domain: 'example.com', type: 'A' });
   * ```
   */
  async emit(event: KernelEvent, data?: unknown): Promise<void> {
    const listeners = this.context.listeners.get(event);
    if (!listeners) return;

    const promises = Array.from(listeners).map((listener) => {
      try {
        return Promise.resolve(listener(data as never));
      } catch (error) {
        return Promise.reject(error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get the resolver options.
   *
   * @returns Resolver options
   *
   * @example
   * ```typescript
   * const options = kernel.getOptions();
   * ```
   */
  getOptions(): ResolverOptions {
    return { ...this._options };
  }

  /**
   * Update resolver options.
   *
   * @param options - New options to merge
   *
   * @example
   * ```typescript
   * kernel.setOptions({ timeout: 10000 });
   * ```
   */
  setOptions(options: Partial<ResolverOptions>): void {
    this._options = { ...this._options, ...options };
    this.context.options = this._options;
  }

  /**
   * Get a value from the shared state.
   *
   * @param key - State key
   * @returns State value or undefined
   *
   * @example
   * ```typescript
   * const cache = kernel.getState('cache');
   * ```
   */
  getState<K extends keyof TContext>(key: K): TContext[K] | undefined {
    return this.context.customState[key];
  }

  /**
   * Set a value in the shared state.
   *
   * @param key - State key
   * @param value - State value
   *
   * @example
   * ```typescript
   * kernel.setState('cache', new Map());
   * ```
   */
  setState<K extends keyof TContext>(key: K, value: TContext[K]): void {
    (this.context.customState as TContext)[key] = value;
  }

  /**
   * Destroy the kernel and all plugins.
   *
   * @returns Promise that resolves when cleanup is complete
   *
   * @example
   * ```typescript
   * await kernel.destroy();
   * ```
   */
  async destroy(): Promise<void> {
    // Destroy all plugins in reverse order
    const plugins = Array.from(this.context.plugins.values()).reverse();

    for (const plugin of plugins) {
      if (plugin.onDestroy) {
        try {
          await plugin.onDestroy();
        } catch (error) {
          console.error(`Error destroying plugin ${plugin.name}:`, error);
        }
      }
    }

    // Clear all state
    this.context.plugins.clear();
    this.context.initialized.clear();
    this.context.listeners.clear();
    (this.context.customState as TContext) = {} as TContext;
  }
}

/**
 * Create a new DNS kernel with default plugins.
 *
 * @param options - Resolver options
 * @returns New kernel instance
 *
 * @example
 * ```typescript
 * const kernel = createKernel({ timeout: 5000 });
 * ```
 */
export function createKernel<TContext = Record<string, unknown>>(
  options?: ResolverOptions,
): DnsKernel<TContext> {
  return new DnsKernel<TContext>(options);
}
