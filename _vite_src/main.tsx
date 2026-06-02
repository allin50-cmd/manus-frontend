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
        const openId = localStorage.getItem('clerk-open-id') ?? 'fineguard-operator';
        const tenant = localStorage.getItem('clerk-tenant') ?? 'system';
        const headers: Record<string, string> = {};
        headers['x-user-open-id'] = openId;
        headers['x-tenant'] = tenant;
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
