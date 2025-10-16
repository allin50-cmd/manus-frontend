import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Database, Settings, Users, FileText, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Plus, Trash2, Edit } from 'lucide-react';
import { createConnector } from '../DatabaseConnector';

/**
 * Admin Page Component
 * Provides database management interface with support for Firebase and Supabase
 */
const AdminPage = () => {
  const [dbProvider, setDbProvider] = useState('firebase');
  const [connector, setConnector] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [activeTab, setActiveTab] = useState('companies');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Database configurations
  const dbConfigs = {
    firebase: {
      provider: 'firebase',
      firebaseConfig: {
        apiKey: "demo-api-key",
        authDomain: "fineguard-demo.firebaseapp.com",
        projectId: "fineguard-demo",
        storageBucket: "fineguard-demo.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef"
      }
    },
    supabase: {
      provider: 'supabase',
      supabaseConfig: {
        url: 'https://your-project.supabase.co',
        anonKey: 'your-anon-key-here'
      }
    },
    azure: {
      provider: 'azure',
      azureConfig: {
        endpoint: 'https://your-account.documents.azure.com:443/',
        key: 'your-azure-key-here',
        databaseId: 'FineGuardDB'
      }
    }
  };

  /**
   * Connect to database
   */
  const connectToDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const config = dbConfigs[dbProvider];
      const newConnector = createConnector(config);
      const { auth, db } = await newConnector.connect();
      
      // Sign in
      await auth.signIn();
      
      setConnector({ auth, db });
      setIsConnected(true);
      
      // Load initial data
      await loadData(db);
    } catch (err) {
      setError(err.message || 'Failed to connect to database');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data from database
   */
  const loadData = async (db) => {
    try {
      const companiesData = await db.read('companies');
      const obligationsData = await db.read('obligations');
      
      setCompanies(companiesData || []);
      setObligations(obligationsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from database');
    }
  };

  /**
   * Disconnect from database
   */
  const disconnectFromDatabase = async () => {
    if (connector) {
      try {
        await connector.auth.signOut();
        setConnector(null);
        setIsConnected(false);
        setCompanies([]);
        setObligations([]);
      } catch (err) {
        console.error('Disconnect error:', err);
      }
    }
  };

  /**
   * Add new item
   */
  const handleAdd = () => {
    if (activeTab === 'companies') {
      setFormData({
        name: '',
        companyNumber: '',
        address: '',
        riskLevel: 'low',
        complianceScore: 100
      });
    } else {
      setFormData({
        companyId: '',
        title: '',
        description: '',
        dueDate: '',
        status: 'pending',
        penalty: 0
      });
    }
    setEditingItem('new');
  };

  /**
   * Save item to database
   */
  const handleSave = async () => {
    if (!connector) return;
    
    setLoading(true);
    try {
      const collection = activeTab === 'companies' ? 'companies' : 'obligations';
      const id = editingItem === 'new' ? `${Date.now()}` : editingItem;
      
      await connector.db.write(collection, id, formData);
      await loadData(connector.db);
      
      setEditingItem(null);
      setFormData({});
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete item from database
   */
  const handleDelete = async (id) => {
    if (!connector || !confirm('Are you sure you want to delete this item?')) return;
    
    setLoading(true);
    try {
      const collection = activeTab === 'companies' ? 'companies' : 'obligations';
      await connector.db.delete(collection, id);
      await loadData(connector.db);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Edit item
   */
  const handleEdit = (item) => {
    setEditingItem(item.id);
    setFormData(item);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage database connections and data</p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"} className="text-lg px-4 py-2">
          {isConnected ? (
            <><CheckCircle2 className="h-4 w-4 mr-2" /> Connected</>
          ) : (
            <><XCircle className="h-4 w-4 mr-2" /> Disconnected</>
          )}
        </Badge>
      </div>

      {/* Database Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Connection
          </CardTitle>
          <CardDescription>Choose your database provider and connect</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <label className="font-medium">Provider:</label>
            <select 
              value={dbProvider} 
              onChange={(e) => setDbProvider(e.target.value)}
              disabled={isConnected}
              className="px-4 py-2 border rounded-lg bg-background"
            >
              <option value="firebase">Firebase</option>
              <option value="supabase">Supabase</option>
              <option value="azure">Azure Cosmos DB</option>
            </select>
            
            {!isConnected ? (
              <Button 
                onClick={connectToDatabase} 
                disabled={loading}
                className="bg-gradient-to-r from-cyan-400 to-blue-500"
              >
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
                Connect
              </Button>
            ) : (
              <Button 
                onClick={disconnectFromDatabase}
                variant="destructive"
              >
                Disconnect
              </Button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {isConnected && (
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-600 dark:text-green-400">
                Connected to {dbProvider.charAt(0).toUpperCase() + dbProvider.slice(1)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      {isConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Data Management
                </CardTitle>
                <CardDescription>View and manage your compliance data</CardDescription>
              </div>
              <Button onClick={handleAdd} className="bg-gradient-to-r from-cyan-400 to-blue-500">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setActiveTab('companies')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'companies' 
                    ? 'border-b-2 border-cyan-400 text-cyan-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Companies ({companies.length})
              </button>
              <button
                onClick={() => setActiveTab('obligations')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'obligations' 
                    ? 'border-b-2 border-cyan-400 text-cyan-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Obligations ({obligations.length})
              </button>
            </div>

            {/* Data Table */}
            <div className="space-y-4">
              {activeTab === 'companies' ? (
                companies.length > 0 ? (
                  companies.map(company => (
                    <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">#{company.companyNumber}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={company.riskLevel === 'critical' ? 'destructive' : 'default'}>
                            {company.riskLevel}
                          </Badge>
                          <Badge variant="outline">
                            {company.complianceScore}% Compliance
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(company)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(company.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No companies found</p>
                )
              ) : (
                obligations.length > 0 ? (
                  obligations.map(obligation => (
                    <div key={obligation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{obligation.title}</h3>
                        <p className="text-sm text-muted-foreground">{obligation.companyName}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={obligation.status === 'overdue' ? 'destructive' : 'default'}>
                            {obligation.status}
                          </Badge>
                          <Badge variant="outline">
                            Due: {obligation.dueDate}
                          </Badge>
                          {obligation.penalty > 0 && (
                            <Badge variant="destructive">
                              £{obligation.penalty} penalty
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(obligation)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(obligation.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No obligations found</p>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingItem(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{editingItem === 'new' ? 'Add New' : 'Edit'} {activeTab === 'companies' ? 'Company' : 'Obligation'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTab === 'companies' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Number</label>
                    <input
                      type="text"
                      value={formData.companyNumber || ''}
                      onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Risk Level</label>
                    <select
                      value={formData.riskLevel || 'low'}
                      onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Compliance Score</label>
                    <input
                      type="number"
                      value={formData.complianceScore || 100}
                      onChange={(e) => setFormData({ ...formData, complianceScore: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-lg bg-background"
                      min="0"
                      max="100"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate || ''}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={formData.status || 'pending'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background"
                    >
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Penalty (£)</label>
                    <input
                      type="number"
                      value={formData.penalty || 0}
                      onChange={(e) => setFormData({ ...formData, penalty: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-lg bg-background"
                      min="0"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500">
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Save
                </Button>
                <Button onClick={() => setEditingItem(null)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPage;

