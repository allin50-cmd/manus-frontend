import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { trpc } from './lib/trpc';

// Pre-populate auth identity for local dev only — never runs in production builds
if (import.meta.env.DEV) {
  if (!localStorage.getItem('clerk-tenant')) localStorage.setItem('clerk-tenant', 'alpha');
  if (!localStorage.getItem('clerk-open-id')) localStorage.setItem('clerk-open-id', 'admin-user');
  if (!localStorage.getItem('clerk-name')) localStorage.setItem('clerk-name', 'Patricia Chen');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trpcClient = (trpc.createClient as any)({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        const openId = localStorage.getItem('clerk-open-id');
        const tenant = localStorage.getItem('clerk-tenant');
        const headers: Record<string, string> = {};
        if (openId) headers['x-user-open-id'] = openId;
        if (tenant) headers['x-tenant'] = tenant;
        return headers;
      },
    }),
  ],
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>,
);
