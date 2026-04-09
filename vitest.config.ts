import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15_000, // Temporal TestWorkflowEnvironment cold start can take ~8-10 s
    projects: [
      {
        // Temporal workflow tests run in forked processes — their
        // TestWorkflowEnvironment leaves internal Node.js timers alive after
        // teardown which fires during other files' teardown if run in threads.
        test: {
          name: 'workflows',
          environment: 'node',
          globals: true,
          testTimeout: 15_000,
          include: ['src/tests/workflows/**/*.test.ts'],
          pool: 'forks',
        },
        resolve: {
          alias: { '@': path.resolve(__dirname, './src') },
        },
      },
      {
        // All other tests run in the default threads pool.
        test: {
          name: 'unit',
          environment: 'node',
          globals: true,
          testTimeout: 15_000,
          include: ['src/tests/**/*.test.ts'],
          exclude: ['src/tests/workflows/**/*.test.ts'],
        },
        resolve: {
          alias: { '@': path.resolve(__dirname, './src') },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/tests/**', 'src/app/**', 'src/temporal/worker.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
