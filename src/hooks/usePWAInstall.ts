import { useEffect, useState, useCallback } from 'react';

/**
 * BeforeInstallPromptEvent is not in the standard TS lib yet.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

type InstallOutcome = 'accepted' | 'dismissed' | null;

interface PWAInstallState {
  /** True when the browser's install prompt is ready to be shown. */
  canInstall: boolean;
  /** True when the app is already running in standalone (installed) mode. */
  isInstalled: boolean;
  /** Call this to trigger the native install prompt. */
  promptInstall: () => Promise<InstallOutcome>;
  /** The outcome of the most recent prompt ('accepted' | 'dismissed' | null). */
  outcome: InstallOutcome;
}

/**
 * Encapsulates the PWA install-prompt lifecycle.
 *
 * Usage:
 *   const { canInstall, isInstalled, promptInstall } = usePWAInstall();
 */
export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [outcome, setOutcome] = useState<InstallOutcome>(null);

  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari on iOS
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile Chrome
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Clean up once the app is installed
    const installedHandler = () => setDeferredPrompt(null);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferredPrompt) return null;

    await deferredPrompt.prompt();
    const { outcome: result } = await deferredPrompt.userChoice;
    setOutcome(result);
    // The prompt can only be used once
    setDeferredPrompt(null);
    return result;
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    promptInstall,
    outcome,
  };
}
