import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (['react', 'react-dom', 'react/jsx-runtime'].some(pkg => id.includes(`/node_modules/${pkg}/`) || id.includes(`/node_modules/${pkg.replace('/', path.sep)}/`))) {
              return 'vendor';
            }
            if (id.includes('/node_modules/wouter/')) return 'router';
            if (
              id.includes('/node_modules/lucide-react/') ||
              id.includes('/node_modules/@radix-ui/')
            ) return 'ui';
            if (
              id.includes('/node_modules/clsx/') ||
              id.includes('/node_modules/tailwind-merge/') ||
              id.includes('/node_modules/class-variance-authority/') ||
              id.includes('/node_modules/sonner/')
            ) return 'utils';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
