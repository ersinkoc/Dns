/**
 * Custom Plugin Example
 *
 * This example demonstrates how to create a custom plugin
 * for the DNS kernel.
 */

import { createKernel, type DnsPlugin } from '@oxog/dns';

// Define a custom plugin that logs query information
const loggingPlugin: DnsPlugin = {
  name: 'query-logger',
  version: '1.0.0',

  install(kernel) {
    console.log('[Plugin] Installing query logger');

    // Listen for query events
    kernel.on('query', async (data) => {
      console.log('[Plugin] Query initiated:', data);
    });

    // Listen for response events
    kernel.on('response', async (data) => {
      console.log('[Plugin] Response received:', data);
    });

    // Listen for error events
    kernel.on('error', async (error) => {
      console.error('[Plugin] Error occurred:', error);
    });
  },

  onDestroy() {
    console.log('[Plugin] Destroying query logger');
  },
};

// Define a custom plugin that measures query time
const timingPlugin: DnsPlugin = {
  name: 'query-timer',
  version: '1.0.0',

  install(kernel) {
    const startTimes = new Map<number, number>();

    kernel.on('query', async (data: { queryId: number }) => {
      startTimes.set(data.queryId, Date.now());
    });

    kernel.on('response', async (data: { queryId: number }) => {
      const start = startTimes.get(data.queryId);
      if (start) {
        const duration = Date.now() - start;
        console.log(`[Plugin] Query ${data.queryId} took ${duration}ms`);
        startTimes.delete(data.queryId);
      }
    });
  },
};

async function main() {
  // Create a kernel with custom plugins
  const kernel = createKernel({ timeout: 5000 });

  // Register custom plugins
  kernel.use(loggingPlugin);
  kernel.use(timingPlugin);

  // Initialize plugins
  await kernel.init();

  console.log('Kernel initialized with plugins:', kernel.list());

  // Clean up
  await kernel.destroy();
}

main().catch(console.error);
