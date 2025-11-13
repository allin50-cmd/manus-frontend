import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Database, Settings, Users, FileText, Plus, Trash2, Edit, Save, X, Shield, Bot, Mail } from 'lucide-react';
import api from '../utils/api';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  
  // State with REAL data from API
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [agents, setAgents] = useState([]);
  const [settings, setSettings] = useState({
    siteName: 'FineGuard',
    adminEmail: 'admin@fineguard.com',
    enableNotifications: true,
    enableAI: true,
    maintenanceMode: false,
    maxUsers: 100
  });

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const data = await api.getUsers();
        setUsers(data);
      } else if (activeTab === 'companies') {
        const data = await api.getCompanies();
        setCompanies(data);
      } else if (activeTab === 'agents') {
        // Agents endpoint
        const response = await fetch('https://8000-ikoeu54axz2kkjnwr9zzk-5807ad40.manusvm.computer/api/agents');
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data from server');
    }
    setLoading(false);
  };

  // Handle add new item
  const handleAdd = () => {
    if (activeTab === 'users') {
      setFormData({ name: '', email: '', role: 'User', status: 'active', created: new Date().toISOString().split('T')[0] });
    } else if (activeTab === 'companies') {
      setFormData({ name: '', number: '', status: 'active', fineguard: 100, risk: 'low' });
    } else if (activeTab === 'agents') {
      setFormData({ name: '', status: 'paused', tasks: 0, accuracy: 0, enabled: 0 });
    }
    setEditingItem('new');
  };

  // Handle save
  const handleSave = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        if (editingItem === 'new') {
          await api.createUser(formData);
        } else {
          await api.updateUser(editingItem, formData);
        }
        await loadData();
      } else if (activeTab === 'companies') {
        if (editingItem === 'new') {
          await api.createCompany(formData);
        } else {
          await api.updateCompany(editingItem, formData);
        }
        await loadData();
      } else if (activeTab === 'agents') {
        const url = editingItem === 'new' 
          ? 'https://8000-ikoeu54axz2kkjnwr9zzk-5807ad40.manusvm.computer/api/agents'
          : `https://8000-ikoeu54axz2kkjnwr9zzk-5807ad40.manusvm.computer/api/agents/${editingItem}`;
        await fetch(url, {
          method: editingItem === 'new' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        await loadData();
      }
      setEditingItem(null);
      setFormData({});
      alert('Saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save: ' + error.message);
    }
    setLoading(false);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    setLoading(true);
    try {
      if (activeTab === 'users') {
        await api.deleteUser(id);
      } else if (activeTab === 'companies') {
        await api.deleteCompany(id);
      } else if (activeTab === 'agents') {
        await fetch(`https://8000-ikoeu54axz2kkjnwr9zzk-5807ad40.manusvm.computer/api/agents/${id}`, {
          method: 'DELETE'
        });
      }
      await loadData();
      alert('Deleted successfully!');
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete: ' + error.message);
    }
    setLoading(false);
  };

  // Handle edit
  const handleEdit = (item) => {
    setEditingItem(item.id);
    setFormData(item);
  };

  // Handle settings update
  const handleSettingsUpdate = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  // Render form based on active tab
  const renderForm = () => {
    if (!editingItem) return null;

    return (
      <Card className="mb-6 border-2 border-primary">
        <CardHeader>
          <CardTitle>{editingItem === 'new' ? 'Add New' : 'Edit'} {activeTab.slice(0, -1)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {activeTab === 'users' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={formData.role || 'User'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'companies' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Number</label>
                  <input
                    type="text"
                    value={formData.number || ''}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter company number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">FineGuard Score</label>
                  <input
                    type="number"
                    value={formData.fineguard || 100}
                    onChange={(e) => setFormData({ ...formData, fineguard: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Risk Level</label>
                  <select
                    value={formData.risk || 'low'}
                    onChange={(e) => setFormData({ ...formData, risk: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'agents' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Agent Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter agent name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status || 'paused'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="running">Running</option>
                    <option value="paused">Paused</option>
                    <option value="stopped">Stopped</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.enabled === 1}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Enabled</span>
                  </label>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={() => { setEditingItem(null); setFormData({}); }} variant="outline" disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
          {!loading && !error && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
        </CardContent>
      </Card>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    if (loading && !editingItem) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (activeTab === 'users') {
      return (
        <div className="space-y-4">
          {users.map(user => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Created: {user.created}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(user)} disabled={loading}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(user.id)} disabled={loading}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (activeTab === 'companies') {
      return (
        <div className="space-y-4">
          {companies.map(company => (
            <Card key={company.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Database className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">#{company.number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">FineGuard</p>
                      <p className="font-semibold">{company.fineguard}%</p>
                    </div>
                    <Badge variant={
                      company.risk === 'low' ? 'default' : 
                      company.risk === 'medium' ? 'secondary' : 
                      'destructive'
                    }>
                      {company.risk} risk
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(company)} disabled={loading}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(company.id)} disabled={loading}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (activeTab === 'agents') {
      return (
        <div className="space-y-4">
          {agents.map(agent => (
            <Card key={agent.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Bot className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.tasks} tasks • {agent.accuracy}% accuracy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={agent.status === 'running' ? 'default' : 'secondary'}>{agent.status}</Badge>
                    <Badge variant={agent.enabled ? 'default' : 'secondary'}>
                      {agent.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(agent)} disabled={loading}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(agent.id)} disabled={loading}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleSettingsUpdate('siteName', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Admin Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => handleSettingsUpdate('adminEmail', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Users</label>
                <input
                  type="number"
                  value={settings.maxUsers}
                  onChange={(e) => handleSettingsUpdate('maxUsers', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent">
                <span className="font-medium">Enable Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingsUpdate('enableNotifications', e.target.checked)}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent">
                <span className="font-medium">Enable AI Features</span>
                <input
                  type="checkbox"
                  checked={settings.enableAI}
                  onChange={(e) => handleSettingsUpdate('enableAI', e.target.checked)}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent">
                <span className="font-medium">Maintenance Mode</span>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingsUpdate('maintenanceMode', e.target.checked)}
                  className="w-5 h-5"
                />
              </label>
            </CardContent>
          </Card>

          <Button className="w-full bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Control Panel</h1>
          <p className="text-muted-foreground">Manage users, companies, AI agents, and settings</p>
          <p className="text-xs text-green-600 mt-1">✅ Connected to live database</p>
        </div>
        {activeTab !== 'settings' && (
          <Button onClick={handleAdd} className="bg-primary" disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Agents</p>
                <p className="text-2xl font-bold">{agents.length}</p>
              </div>
              <Bot className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{agents.filter(a => a.status === 'running').length}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {['users', 'companies', 'agents', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-colors ${
              activeTab === tab 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Form (if editing) */}
      {renderForm()}

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default AdminPage;

