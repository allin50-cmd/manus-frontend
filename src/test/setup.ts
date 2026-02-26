import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ─── Mock virtual:pwa-register/react ─────────────────────────────────────────
// vite-plugin-pwa injects this virtual module at build time; it doesn't exist
// in the test environment so we provide a stable mock.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

// ─── jsdom missing APIs ───────────────────────────────────────────────────────
// jsdom doesn't implement scroll APIs used by LogViewer's auto-scroll effect.
Element.prototype.scrollIntoView = vi.fn();

// jsdom doesn't implement matchMedia — used by usePWAInstall's isInstalled check.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── Silence noisy console output in tests ───────────────────────────────────
vi.spyOn(console, 'warn').mockImplementation(() => {});
