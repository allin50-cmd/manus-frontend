import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { trpc } from './lib/trpc';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 15_000),
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
