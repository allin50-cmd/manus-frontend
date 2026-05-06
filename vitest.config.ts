import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['server/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules/**'],
    environmentMatchGlobs: [
      ['server/**/*.test.ts', 'node'],
      ['src/**/*.test.ts', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
