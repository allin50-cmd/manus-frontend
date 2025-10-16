import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Key, Lock, Shield, Eye, EyeOff, Plus, Trash2, RefreshCw, Clock, CheckCircle, Copy } from 'lucide-react';

export default function VaultPage() {
  const [secrets, setSecrets] = useState([]);
  const [loadingSecrets, setLoadingSecrets] = useState(true);
  const [errorSecrets, setErrorSecrets] = useState(null);

  useEffect(() => {
    const fetchSecrets = async () => {
      try {
        setLoadingSecrets(true);
        const response = await api.request('/api/secrets');
        setSecrets(response.data);
      } catch (error) {
        console.error('Error fetching secrets:', error);
        setErrorSecrets('Failed to load secrets.');
      } finally {
        setLoadingSecrets(false);
      }
    };
    fetchSecrets();
  }, []);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showValue, setShowValue] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [newSecret, setNewSecret] = useState({ key: '', value: '', service: '', description: '' });
  
  const [auditLog, setAuditLog] = useState([]);
  const [loadingAuditLog, setLoadingAuditLog] = useState(true);
  const [errorAuditLog, setErrorAuditLog] = useState(null);

  useEffect(() => {
    const fetchAuditLog = async () => {
      try {
        setLoadingAuditLog(true);
        const response = await api.request('/api/auditlog');
        setAuditLog(response.data);
      } catch (error) {
        console.error('Error fetching audit log:', error);
        setErrorAuditLog('Failed to load audit log.');
      } finally {
        setLoadingAuditLog(false);
      }
    };
    fetchAuditLog();
  }, []);
  
  const addSecret = async () => {
    if (newSecret.key && newSecret.value) {
      try {
        await api.request('/api/secrets', { method: 'POST', data: newSecret });
        setNewSecret({ key: '', value: '', service: '', description: '' });
        setShowAddModal(false);
        // Re-fetch secrets after adding a new one
        const response = await api.request('/api/secrets');
        setSecrets(response.data);
      } catch (error) {
        console.error('Error adding secret:', error);
        // Optionally, show an error message to the user
      }
    }
  };
  
  const deleteSecret = async (key) => {
    if (confirm(`Are you sure you want to delete ${key}?`)) {
      try {
        await api.request(`/api/secrets/${key}`, { method: 'DELETE' });
        // Re-fetch secrets after deleting one
        const response = await api.request('/api/secrets');
        setSecrets(response.data);
      } catch (error) {
        console.error('Error deleting secret:', error);
        // Optionally, show an error message to the user
      }
    }
  };
  
  const toggleShowValue = (key) => {
    setShowValue({ ...showValue, [key]: !showValue[key] });
  };
  
  const copyToClipboard = (key, value) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };
  
  const getServiceColor = (service) => {
    const colors = {
      companies_house: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
      email: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      sms: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      auth: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    };
    return colors[service] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
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
              <div className="text-3xl font-bold">
              {loadingSecrets ? <RefreshCw className="animate-spin" /> : secrets.length}
            </div>
              <div className="text-sm text-cyan-100">Stored Secrets</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">
              {loadingSecrets ? <RefreshCw className="animate-spin" /> : secrets.reduce((sum, s) => sum + s.access_count, 0)}
            </div>
              <div className="text-sm text-cyan-100">Total Accesses</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">🔒 AES-256</div>
              <div className="text-sm text-cyan-100">Encryption</div>
            </div>
          </div>
        </div>
        
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
            {loadingSecrets && (
              <div className="text-center py-8 dark:text-gray-300">
                <RefreshCw className="animate-spin mx-auto w-8 h-8 text-cyan-500 mb-4" />
                <p>Loading secrets...</p>
              </div>
            )}
            {errorSecrets && (
              <div className="text-center py-8 text-red-500 dark:text-red-400">
                <p>{errorSecrets}</p>
              </div>
            )}
            {!loadingSecrets && !errorSecrets && secrets.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No secrets found. Add a new secret to get started!</p>
              </div>
            )}
            {!loadingSecrets && !errorSecrets && secrets.map((secret) => (
              <div key={secret.key} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-5 h-5 text-cyan-500" />
                      <span className="font-mono font-bold dark:text-white">{secret.key}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getServiceColor(secret.metadata.service)}`}>
                        {secret.metadata.service}
                      </span>
                      {secret.key === 'COMPANIES_HOUSE_API_KEY' && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {secret.metadata.description}
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
                      onClick={() => copyToClipboard(secret.key, secret.value)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Copy to clipboard"
                    >
                      {copiedKey === secret.key ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
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
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <span className="font-mono text-sm dark:text-white break-all">{secret.value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-cyan-500" />
            <h2 className="text-2xl font-bold dark:text-white">Audit Log</h2>
          </div>
          
          <div className="space-y-2">
            {loadingAuditLog && (
              <div className="text-center py-4 dark:text-gray-300">
                <RefreshCw className="animate-spin mx-auto w-6 h-6 text-cyan-500 mb-2" />
                <p>Loading audit log...</p>
              </div>
            )}
            {errorAuditLog && (
              <div className="text-center py-4 text-red-500 dark:text-red-400">
                <p>{errorAuditLog}</p>
              </div>
            )}
            {!loadingAuditLog && !errorAuditLog && auditLog.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p>No audit log entries found.</p>
              </div>
            )}
            {!loadingAuditLog && !errorAuditLog && auditLog.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-40">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  entry.action === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  entry.action === 'SET' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {entry.action}
                </span>
                <span className="font-mono text-sm dark:text-white w-64">{entry.key}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
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
                  placeholder="API_KEY_NAME"
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
                  placeholder="email, sms, api, etc."
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Description</label>
                <input
                  type="text"
                  value={newSecret.description}
                  onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                  placeholder="Brief description"
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
