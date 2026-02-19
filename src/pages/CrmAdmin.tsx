import { useState } from 'react';

export default function CrmAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full bg-[#0a0c0f]" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 font-mono text-sm animate-pulse">Loading FineGuard CRM...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="text-red-400 font-mono text-sm">Failed to load CRM panel</div>
          <button
            className="px-4 py-2 bg-emerald-500 text-black font-bold text-sm rounded hover:bg-emerald-400 transition-colors"
            onClick={() => { setError(false); setLoading(true); }}
          >
            Retry
          </button>
        </div>
      )}
      <iframe
        src="/crm.html"
        title="FineGuard CRM Admin"
        className="w-full border-0"
        style={{
          colorScheme: 'dark',
          display: loading || error ? 'none' : 'block',
          height: 'calc(100vh - 4rem)',
        }}
        sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
    </div>
  );
}
