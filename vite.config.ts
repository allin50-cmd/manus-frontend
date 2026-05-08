import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // prompt-to-update rather than silently replacing active sessions
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'FineGuard – Compliance Automation',
        short_name: 'FineGuard',
        description: 'Microsoft 365-native compliance automation for UK accountancy firms.',
        theme_color: '#1d4ed8',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/app',
        id: 'fineguard-installer',
        categories: ['business', 'productivity', 'finance'],
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'New Deployment',
            short_name: 'Deploy',
            description: 'Start a new FineGuard deployment',
            url: '/app/deploy',
            icons: [{ src: '/icons/shortcut-deploy.svg', sizes: 'any' }],
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View deployment dashboard',
            url: '/app',
            icons: [{ src: '/icons/shortcut-dashboard.svg', sizes: 'any' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fineguard-api',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fineguard-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
        // skipWaiting: false (default) — new SW waits for all tabs to close before activating,
        // preventing in-flight compliance workflows from being disrupted mid-session.
        skipWaiting: false,
        clientsClaim: false,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        // Only enable SW in dev when explicitly opted in — avoids stale-cache debugging confusion.
        enabled: process.env.VITE_SW_DEV === 'true',
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              ['react', 'react-dom', 'react/jsx-runtime'].some(
                (pkg) =>
                  id.includes(`/node_modules/${pkg}/`) ||
                  id.includes(`/node_modules/${pkg.replace('/', path.sep)}/`),
              )
            ) {
              return 'vendor';
            }
            if (id.includes('/node_modules/wouter/')) return 'router';
            if (
              id.includes('/node_modules/lucide-react/') ||
              id.includes('/node_modules/@radix-ui/')
            )
              return 'ui';
            if (
              id.includes('/node_modules/clsx/') ||
              id.includes('/node_modules/tailwind-merge/') ||
              id.includes('/node_modules/class-variance-authority/') ||
              id.includes('/node_modules/sonner/')
            )
              return 'utils';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
});
