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
  const [aiCrmEnabled, setAiCrmEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
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
              <button
                onClick={() => setActiveTab('ai-crm')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'ai-crm' 
                    ? 'border-b-2 border-cyan-400 text-cyan-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                AI CRM 🤖
              </button>
              <button
                onClick={() => setActiveTab('marketing')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'marketing' 
                    ? 'border-b-2 border-cyan-400 text-cyan-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Marketing 📧
              </button>
            </div>

            {/* Data Table */}
            <div className="space-y-4">
              {activeTab === 'ai-crm' ? (
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 rounded-lg border-2 border-cyan-200 dark:border-cyan-800">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      🤖 AI CRM Module
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Intelligent customer relationship management powered by AI. Automatically score leads, predict churn, and recommend next best actions.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">AI Lead Scoring</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Automatically score and prioritize leads based on engagement, company data, and compliance history.</p>
                          <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500">
                            Enable AI Scoring
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Churn Prediction</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Predict which clients are at risk of leaving and receive proactive retention recommendations.</p>
                          <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500">
                            Enable Churn Detection
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Next Best Action</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">AI-powered recommendations for the best next step with each client based on their compliance status.</p>
                          <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500">
                            Enable NBA Engine
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Smart Segmentation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Automatically segment clients by risk level, industry, compliance score, and engagement.</p>
                          <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500">
                            Configure Segments
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                      <h4 className="font-semibold mb-2">🔐 Premium Feature</h4>
                      <p className="text-sm text-muted-foreground">
                        AI CRM features require a FineGuard Premium license. 
                        <a href="/pricing" className="text-cyan-500 hover:underline ml-1">Upgrade now</a>
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'marketing' ? (
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      📧 Marketing Admin Module
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Automated marketing campaigns, email sequences, and client communications powered by AI copywriting.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Email Campaigns</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Create and send automated email campaigns to clients based on compliance deadlines and risk levels.</p>
                          <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                            Create Campaign
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">AI Copywriting</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Generate professional email content automatically using AI, tailored to each client's situation.</p>
                          <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                            Enable AI Writer
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">SMS & WhatsApp</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Send urgent compliance alerts via SMS and WhatsApp for critical deadlines.</p>
                          <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                            Configure Messaging
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Drip Sequences</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Set up automated email sequences for onboarding, reminders, and follow-ups.</p>
                          <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                            Create Sequence
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Track email open rates, click-through rates, and campaign performance.</p>
                          <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                            View Analytics
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Template Library</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">Access pre-built email templates for common compliance scenarios.</p>
                          <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                            Browse Templates
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                      <h4 className="font-semibold mb-2">🔐 Premium Feature</h4>
                      <p className="text-sm text-muted-foreground">
                        Marketing features require a FineGuard Premium license. 
                        <a href="/pricing" className="text-purple-500 hover:underline ml-1">Upgrade now</a>
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'companies' ? (
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

      {/* AI CRM Module - Always Visible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI CRM Module
          </CardTitle>
          <CardDescription>Intelligent customer relationship management powered by AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Lead Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Automatically score and prioritize leads based on engagement, company data, and compliance history.</p>
                <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500">
                  Enable AI Scoring
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Churn Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Predict which clients are at risk of leaving and receive proactive retention recommendations.</p>
                <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500">
                  Enable Churn Detection
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Best Action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">AI-powered recommendations for the best next step with each client based on their compliance status.</p>
                <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500">
                  Enable NBA Engine
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Smart Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Automatically segment clients by risk level, industry, compliance score, and engagement.</p>
                <Button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500">
                  Configure Segments
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 bg-muted p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">🔐 Premium Feature</h4>
            <p className="text-sm text-muted-foreground">
              AI CRM features require a FineGuard Premium license. 
              <a href="/pricing" className="text-cyan-500 hover:underline ml-1">Upgrade now</a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Admin Module - Always Visible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📧 Marketing Admin Module
          </CardTitle>
          <CardDescription>Automated marketing campaigns and client communications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Create and send automated email campaigns to clients based on compliance deadlines and risk levels.</p>
                <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Copywriting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Generate professional email content automatically using AI, tailored to each client's situation.</p>
                <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                  Enable AI Writer
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SMS & WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Send urgent compliance alerts via SMS and WhatsApp for critical deadlines.</p>
                <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                  Configure Messaging
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Drip Sequences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Set up automated email sequences for onboarding, reminders, and follow-ups.</p>
                <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                  Create Sequence
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Track email open rates, click-through rates, and campaign performance.</p>
                <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                  View Analytics
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Library</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Access pre-built email templates for common compliance scenarios.</p>
                <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500">
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 bg-muted p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">🔐 Premium Feature</h4>
            <p className="text-sm text-muted-foreground">
              Marketing features require a FineGuard Premium license. 
              <a href="/pricing" className="text-purple-500 hover:underline ml-1">Upgrade now</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;

