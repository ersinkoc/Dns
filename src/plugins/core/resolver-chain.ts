/**
 * Resolver Chain Plugin
 *
 * Manages resolver selection and failover logic.
 *
 * @module
 */

import type { DnsPlugin, ResolverOptions } from '../../types.js';
import type { DnsKernelContext } from '../../kernel.js';
import { DnsKernel } from '../../kernel.js';
import { isValidHost } from '../../utils/ip.js';

/**
 * Resolver state.
 *
 * @internal
 */
interface ResolverState {
  /** Available servers */
  servers: string[];
  /** Current server index */
  currentIndex: number;
  /** Failed servers */
  failed: Set<string>;
  /** Server health status */
  health: Map<string, boolean>;
}

/**
 * Default DNS servers.
 *
 * @internal
 */
const DEFAULT_SERVERS = ['8.8.8.8', '1.1.1.1'];

/**
 * Resolver chain plugin.
 *
 * Manages multiple DNS resolvers with failover and rotation strategies.
 *
 * @example
 * ```typescript
 * import { resolverChainPlugin } from '@oxog/dns/plugins';
 *
 * kernel.use(resolverChainPlugin);
 * ```
 */
export const resolverChainPlugin: DnsPlugin<ResolverState & DnsKernelContext> = {
  name: 'resolver-chain',
  version: '1.0.0',

  install(kernel: DnsKernel) {
    const options = kernel.context.options;

    // Initialize servers
    const servers = options.servers ?? DEFAULT_SERVERS;

    // Validate servers
    for (const server of servers) {
      if (!isValidHost(server)) {
        throw new Error(`Invalid DNS server: ${server}`);
      }
    }

    // Initialize state
    kernel.setState('servers', servers);
    kernel.setState('currentIndex', 0);
    kernel.setState('failed', new Set());
    kernel.setState('health', new Map());

    // Initialize health for all servers
    const health = new Map<string, boolean>();
    for (const server of servers) {
      health.set(server, true);
    }
    kernel.setState('health', health);
  },

  onInit() {
    // Plugin initialized
  },

  onDestroy() {
    // Cleanup handled by kernel
  },
};

/**
 * Get the next resolver from the chain.
 *
 * @param kernel - DNS kernel
 * @returns Next resolver server address
 *
 * @example
 * ```typescript
 * const server = getNextResolver(kernel);
 * ```
 */
export function getNextResolver(
  kernel: DnsKernel<ResolverState & DnsKernelContext>,
): string {
  const state = kernel.context.customState;
  const servers = state.servers as string[];
  const strategy = kernel.context.options.rotationStrategy ?? 'failover';
  const failed = state.failed as Set<string>;
  const health = state.health as Map<string, boolean>;

  // Filter out failed and unhealthy servers
  const availableServers = servers.filter(
    (s) => !failed.has(s) && health.get(s) !== false,
  );

  if (availableServers.length === 0) {
    // Reset failed and try again
    failed.clear();
    return servers[0]!;
  }

  switch (strategy) {
    case 'round-robin': {
      const currentIndex = (state.currentIndex as number) % availableServers.length;
      state.currentIndex = currentIndex + 1;
      return availableServers[currentIndex]!;
    }

    case 'random': {
      const index = Math.floor(Math.random() * availableServers.length);
      return availableServers[index]!;
    }

    case 'failover':
    default: {
      // Return first available server
      return availableServers[0]!;
    }
  }
}

/**
 * Mark a resolver as failed.
 *
 * @param kernel - DNS kernel
 * @param server - Server address
 *
 * @example
 * ```typescript
 * markResolverFailed(kernel, '8.8.8.8');
 * ```
 */
export function markResolverFailed(
  kernel: DnsKernel<ResolverState & DnsKernelContext>,
  server: string,
): void {
  const state = kernel.context.customState;
  const failed = state.failed as Set<string>;
  const health = state.health as Map<string, boolean>;

  failed.add(server);
  health.set(server, false);
}

/**
 * Reset failed resolvers.
 *
 * @param kernel - DNS kernel
 *
 * @example
 * ```typescript
 * resetFailedResolvers(kernel);
 * ```
 */
export function resetFailedResolvers(kernel: DnsKernel<ResolverState & DnsKernelContext>): void {
  const state = kernel.context.customState;
  const failed = state.failed as Set<string>;
  const health = state.health as Map<string, boolean>;

  failed.clear();

  // Reset health for all servers
  for (const server of state.servers as string[]) {
    health.set(server, true);
  }
}

/**
 * Get all configured resolvers.
 *
 * @param kernel - DNS kernel
 * @returns Array of server addresses
 *
 * @example
 * ```typescript
 * const servers = getResolvers(kernel);
 * // ['8.8.8.8', '1.1.1.1']
 * ```
 */
export function getResolvers(kernel: DnsKernel<ResolverState & DnsKernelContext>): string[] {
  const state = kernel.context.customState;
  return Array.from(state.servers as string[]);
}

/**
 * Add a resolver to the chain.
 *
 * @param kernel - DNS kernel
 * @param server - Server address to add
 *
 * @example
 * ```typescript
 * addResolver(kernel, '9.9.9.9');
 * ```
 */
export function addResolver(kernel: DnsKernel<ResolverState & DnsKernelContext>, server: string): void {
  if (!isValidHost(server)) {
    throw new Error(`Invalid DNS server: ${server}`);
  }

  const state = kernel.context.customState;
  const servers = state.servers as string[];
  const health = state.health as Map<string, boolean>;

  if (!servers.includes(server)) {
    servers.push(server);
    health.set(server, true);
  }
}

/**
 * Remove a resolver from the chain.
 *
 * @param kernel - DNS kernel
 * @param server - Server address to remove
 * @returns True if server was removed
 *
 * @example
 * ```typescript
 * removeResolver(kernel, '9.9.9.9');
 * ```
 */
export function removeResolver(
  kernel: DnsKernel<ResolverState & DnsKernelContext>,
  server: string,
): boolean {
  const state = kernel.context.customState;
  const servers = state.servers as string[];
  const health = state.health as Map<string, boolean>;

  const index = servers.indexOf(server);
  if (index === -1) return false;

  servers.splice(index, 1);
  health.delete(server);
  (state.failed as Set<string>).delete(server);

  // Reset index if needed
  if ((state.currentIndex as number) >= servers.length) {
    state.currentIndex = 0;
  }

  return true;
}

/**
 * Get resolver health status.
 *
 * @param kernel - DNS kernel
 * @param server - Server address
 * @returns Health status or undefined if server not found
 *
 * @example
 * ```typescript
 * const healthy = getResolverHealth(kernel, '8.8.8.8');
 * ```
 */
export function getResolverHealth(
  kernel: DnsKernel<ResolverState & DnsKernelContext>,
  server: string,
): boolean | undefined {
  const state = kernel.context.customState;
  const health = state.health as Map<string, boolean>;
  return health.get(server);
}

/**
 * Set resolver health status.
 *
 * @param kernel - DNS kernel
 * @param server - Server address
 * @param healthy - Health status
 *
 * @example
 * ```typescript
 * setResolverHealth(kernel, '8.8.8.8', true);
 * ```
 */
export function setResolverHealth(
  kernel: DnsKernel<ResolverState & DnsKernelContext>,
  server: string,
  healthy: boolean,
): void {
  const state = kernel.context.customState;
  const health = state.health as Map<string, boolean>;
  health.set(server, healthy);
}
