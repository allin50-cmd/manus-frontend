import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'FineGuard – Compliance Automation',
        short_name: 'FineGuard',
        description:
          'Microsoft 365-native compliance automation for UK accountancy firms.',
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
        // Cache the app shell (HTML, JS, CSS, fonts)
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            // API calls: network-first, fall back to cache (1 min)
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fineguard-api',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Static assets: cache-first
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fineguard-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
        // Skip waiting so updates apply immediately
        skipWaiting: true,
        clientsClaim: true,
        // Offline fallback page
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        // Enable SW in dev so you can test it locally
        enabled: true,
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
});
