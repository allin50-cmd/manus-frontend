'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'uios.apiKey';

interface ApiKeyContextValue {
  apiKey: string;
  setApiKey: (v: string) => void;
  clear: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string>('');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKeyState(stored);
  }, []);

  const setApiKey = (v: string) => {
    setApiKeyState(v);
    if (v) window.localStorage.setItem(STORAGE_KEY, v);
    else window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, clear: () => setApiKey('') }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error('useApiKey must be used inside <ApiKeyProvider>');
  return ctx;
}

export async function callApi<T = unknown>(
  path: string,
  body: unknown,
  apiKey?: string,
): Promise<{ ok: boolean; status: number; data: T | { error: string } }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const data = (await res.json().catch(() => ({}))) as T | { error: string };
  return { ok: res.ok, status: res.status, data };
}
