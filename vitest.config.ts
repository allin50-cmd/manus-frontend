import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.ts'],
    // Temporal's TestWorkflowEnvironment leaves internal Node.js timers alive after
    // teardown. Running those tests in a forked process isolates their timer state
    // so they don't fire during another file's teardown phase.
    poolMatchGlobs: [
      ['**/workflows/**/*.test.ts', 'forks'],
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
