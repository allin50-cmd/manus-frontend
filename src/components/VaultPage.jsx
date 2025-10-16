import React, { useState } from 'react';
import { Key, Lock, Shield, Eye, EyeOff, Plus, Trash2, RefreshCw, Clock } from 'lucide-react';

export default function VaultPage() {
  const [secrets, setSecrets] = useState([
    { key: 'SENDGRID_API_KEY', created_at: '2025-10-16T10:00:00', access_count: 12, metadata: { service: 'email' } },
    { key: 'TWILIO_SID', created_at: '2025-10-16T10:00:00', access_count: 8, metadata: { service: 'sms' } },
    { key: 'COMPANIES_HOUSE_API_KEY', created_at: '2025-10-16T10:00:00', access_count: 45, metadata: { service: 'compliance' } },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showValue, setShowValue] = useState({});
  const [newSecret, setNewSecret] = useState({ key: '', value: '', service: '' });
  
  const [auditLog] = useState([
    { timestamp: '2025-10-16T10:05:01', action: 'GET', key: 'SENDGRID_API_KEY', message: 'Secret accessed' },
    { timestamp: '2025-10-16T10:04:30', action: 'SET', key: 'TWILIO_SID', message: 'Secret stored' },
    { timestamp: '2025-10-16T10:03:15', action: 'ROTATE', key: 'JWT_SECRET', message: 'Secret rotated' },
  ]);
  
  const addSecret = () => {
    if (newSecret.key && newSecret.value) {
      setSecrets([...secrets, {
        key: newSecret.key,
        created_at: new Date().toISOString(),
        access_count: 0,
        metadata: { service: newSecret.service }
      }]);
      setNewSecret({ key: '', value: '', service: '' });
      setShowAddModal(false);
    }
  };
  
  const deleteSecret = (key) => {
    setSecrets(secrets.filter(s => s.key !== key));
  };
  
  const toggleShowValue = (key) => {
    setShowValue({ ...showValue, [key]: !showValue[key] });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold">Secret Vault</h1>
              <p className="text-cyan-100">Secure API Key Management with AES-256 Encryption</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{secrets.length}</div>
              <div className="text-sm text-cyan-100">Stored Secrets</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{secrets.reduce((sum, s) => sum + s.access_count, 0)}</div>
              <div className="text-sm text-cyan-100">Total Accesses</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">🔒 AES-256</div>
              <div className="text-sm text-cyan-100">Encryption</div>
            </div>
          </div>
        </div>
        
        {/* Secrets List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-white">Secrets</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-full hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              Add Secret
            </button>
          </div>
          
          <div className="space-y-4">
            {secrets.map((secret) => (
              <div key={secret.key} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-5 h-5 text-cyan-500" />
                      <span className="font-mono font-bold dark:text-white">{secret.key}</span>
                      <span className="text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded">
                        {secret.metadata.service}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Created: {new Date(secret.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Accessed: {secret.access_count} times</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleShowValue(secret.key)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      title="View secret"
                    >
                      {showValue[secret.key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Rotate secret"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteSecret(secret.key)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition text-red-600"
                      title="Delete secret"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {showValue[secret.key] && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded font-mono text-sm">
                    ••••••••••••••••••••••••••••
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Audit Log */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-cyan-500" />
            <h2 className="text-2xl font-bold dark:text-white">Audit Log</h2>
          </div>
          
          <div className="space-y-2">
            {auditLog.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  entry.action === 'GET' ? 'bg-blue-100 text-blue-700' :
                  entry.action === 'SET' ? 'bg-green-100 text-green-700' :
                  entry.action === 'ROTATE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {entry.action}
                </span>
                <span className="font-mono text-sm dark:text-white">{entry.key}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Add Secret Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-6 dark:text-white">Add New Secret</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Secret Key</label>
                <input
                  type="text"
                  value={newSecret.key}
                  onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value })}
                  placeholder="SENDGRID_API_KEY"
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Secret Value</label>
                <input
                  type="password"
                  value={newSecret.value}
                  onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Service</label>
                <input
                  type="text"
                  value={newSecret.service}
                  onChange={(e) => setNewSecret({ ...newSecret, service: e.target.value })}
                  placeholder="email, sms, etc."
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addSecret}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition"
              >
                Add Secret
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
