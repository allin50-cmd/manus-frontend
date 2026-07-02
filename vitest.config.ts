import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'lib/__tests__/**/*.test.ts',
      'app/**/__tests__/**/*.test.ts',
      'server/**/__tests__/**/*.test.ts',
    ],
    exclude: ['node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
