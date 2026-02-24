/**
 * Connector Card Component
 * Shows status, expiry, and actions for an MCP connector (Xero/QB/Sage/Dynamics).
 */
import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Link, Unlink } from 'lucide-react';
import type { McpConnector } from '@/services/mtdApi';

interface ConnectorCardProps {
  connector: McpConnector;
  onRefresh: (id: string) => void;
  refreshing?: boolean;
}

const PROVIDER_LABELS: Record<string, { name: string; color: string }> = {
  xero:         { name: 'Xero',          color: 'bg-blue-100 text-blue-800' },
  quickbooks:   { name: 'QuickBooks',    color: 'bg-green-100 text-green-800' },
  sage:         { name: 'Sage',          color: 'bg-yellow-100 text-yellow-800' },
  dynamics365:  { name: 'Dynamics 365',  color: 'bg-purple-100 text-purple-800' },
};

export default function ConnectorCard({ connector, onRefresh, refreshing }: ConnectorCardProps) {
  const prov = PROVIDER_LABELS[connector.provider] ?? { name: connector.provider, color: 'bg-gray-100 text-gray-800' };
  const isActive = connector.status === 'active';
  const expiresIn = connector.tokenExpiresIn ?? 0;
  const expiryWarning = expiresIn < 3600 && expiresIn > 0;
  const expired = expiresIn <= 0 && connector.tokenExpiresAt != null;

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prov.color}`}>
            {prov.name}
          </span>
          <p className="text-sm font-semibold text-gray-900 mt-1.5">
            {connector.displayName ?? connector.provider}
          </p>
          {connector.externalTenantId && (
            <p className="text-xs text-gray-500 mt-0.5">ID: {connector.externalTenantId}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isActive ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : connector.status === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <Clock className="w-4 h-4 text-gray-400" />
          )}
          <span
            className={`text-xs font-medium ${
              isActive ? 'text-green-600' : connector.status === 'error' ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {connector.status}
          </span>
        </div>
      </div>

      {connector.tokenExpiresAt && (
        <div
          className={`text-xs mt-2 flex items-center gap-1 ${
            expired ? 'text-red-600' : expiryWarning ? 'text-amber-600' : 'text-gray-500'
          }`}
        >
          <Clock className="w-3 h-3" />
          {expired
            ? 'Token expired'
            : expiryWarning
            ? `Token expires in ${Math.floor(expiresIn / 60)} min`
            : `Token valid for ${Math.floor(expiresIn / 3600)}h`}
        </div>
      )}

      {connector.lastSyncAt && (
        <p className="text-xs text-gray-400 mt-1">
          Last sync: {new Date(connector.lastSyncAt).toLocaleString('en-GB')}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onRefresh(connector.id)}
          disabled={refreshing}
          className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Token
        </button>
      </div>
    </div>
  );
}
