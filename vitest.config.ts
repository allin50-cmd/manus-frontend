import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './os'),
    },
  },
  test: {
    environment: 'node',
    include: ['server/tests/**/*.test.ts', 'os/tests/**/*.test.ts'],
    exclude: [
      'os/tests/auth.test.ts',
      'os/tests/law-fallbacks.test.ts',
      'os/tests/webhook-signing.test.ts',
    ],
  },
});
