import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePWAInstall } from './usePWAInstall';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makePromptEvent(outcome: 'accepted' | 'dismissed') {
  return Object.assign(new Event('beforeinstallprompt'), {
    platforms: ['web'],
    userChoice: Promise.resolve({ outcome, platform: 'web' }),
    prompt: vi.fn().mockResolvedValue(undefined),
    preventDefault: vi.fn(),
  });
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('usePWAInstall', () => {
  beforeEach(() => {
    // Default: online browser, not in standalone mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(navigator, 'standalone', {
      writable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with canInstall false and no outcome', () => {
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.canInstall).toBe(false);
    expect(result.current.outcome).toBeNull();
  });

  it('sets canInstall true when beforeinstallprompt fires', () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      window.dispatchEvent(makePromptEvent('accepted'));
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('promptInstall returns null when no deferred prompt is stored', async () => {
    const { result } = renderHook(() => usePWAInstall());
    const out = await act(() => result.current.promptInstall());
    expect(out).toBeNull();
  });

  it('promptInstall calls prompt() and resolves accepted', async () => {
    const { result } = renderHook(() => usePWAInstall());
    const event = makePromptEvent('accepted');

    act(() => { window.dispatchEvent(event); });

    let outcome: string | null = null;
    await act(async () => { outcome = await result.current.promptInstall(); });

    expect(event.prompt).toHaveBeenCalledOnce();
    expect(outcome).toBe('accepted');
    expect(result.current.outcome).toBe('accepted');
  });

  it('promptInstall resolves dismissed when user declines', async () => {
    const { result } = renderHook(() => usePWAInstall());
    const event = makePromptEvent('dismissed');

    act(() => { window.dispatchEvent(event); });

    let outcome: string | null = null;
    await act(async () => { outcome = await result.current.promptInstall(); });

    expect(outcome).toBe('dismissed');
    expect(result.current.outcome).toBe('dismissed');
  });

  it('canInstall becomes false after the prompt is used', async () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => { window.dispatchEvent(makePromptEvent('accepted')); });
    expect(result.current.canInstall).toBe(true);

    await act(async () => { await result.current.promptInstall(); });
    expect(result.current.canInstall).toBe(false);
  });

  it('canInstall becomes false on appinstalled event', () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => { window.dispatchEvent(makePromptEvent('accepted')); });
    expect(result.current.canInstall).toBe(true);

    act(() => { window.dispatchEvent(new Event('appinstalled')); });
    expect(result.current.canInstall).toBe(false);
  });

  it('isInstalled is true when display-mode is standalone', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isInstalled).toBe(true);
  });

  it('isInstalled is true when navigator.standalone is true (iOS)', () => {
    Object.defineProperty(navigator, 'standalone', { writable: true, value: true });
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isInstalled).toBe(true);
  });
});
