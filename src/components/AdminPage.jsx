import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Database, Settings, Users, FileText, Plus, Trash2, Edit, Save, X, Shield, Bot, Mail } from 'lucide-react';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Sample data with state management
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', created: '2024-10-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', created: '2024-10-05' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive', created: '2024-10-10' }
  ]);

  const [companies, setCompanies] = useState([
    { id: 1, name: 'Tech Corp Ltd', number: '12345678', status: 'active', compliance: 95, risk: 'low' },
    { id: 2, name: 'Finance Solutions', number: '87654321', status: 'active', compliance: 78, risk: 'medium' },
    { id: 3, name: 'Retail Group', number: '11223344', status: 'inactive', compliance: 45, risk: 'high' }
  ]);

  const [agents, setAgents] = useState([
    { id: 1, name: 'Compliance Monitor', status: 'running', tasks: 247, accuracy: 99.8, enabled: true },
    { id: 2, name: 'Data Enrichment', status: 'running', tasks: 156, accuracy: 96.1, enabled: true },
    { id: 3, name: 'Lead Scoring', status: 'paused', tasks: 89, accuracy: 94.5, enabled: false }
  ]);

  const [settings, setSettings] = useState({
    siteName: 'FineGuard',
    adminEmail: 'admin@fineguard.com',
    enableNotifications: true,
    enableAI: true,
    maintenanceMode: false,
    maxUsers: 100
  });

  // Handle add new item
  const handleAdd = () => {
    if (activeTab === 'users') {
      setFormData({ name: '', email: '', role: 'User', status: 'active' });
    } else if (activeTab === 'companies') {
      setFormData({ name: '', number: '', status: 'active', compliance: 100, risk: 'low' });
    } else if (activeTab === 'agents') {
      setFormData({ name: '', status: 'paused', tasks: 0, accuracy: 0, enabled: false });
    }
    setEditingItem('new');
  };

  // Handle save
  const handleSave = () => {
    if (activeTab === 'users') {
      if (editingItem === 'new') {
        setUsers([...users, { ...formData, id: Date.now(), created: new Date().toISOString().split('T')[0] }]);
      } else {
        setUsers(users.map(u => u.id === editingItem ? { ...u, ...formData } : u));
      }
    } else if (activeTab === 'companies') {
      if (editingItem === 'new') {
        setCompanies([...companies, { ...formData, id: Date.now() }]);
      } else {
        setCompanies(companies.map(c => c.id === editingItem ? { ...c, ...formData } : c));
      }
    } else if (activeTab === 'agents') {
      if (editingItem === 'new') {
        setAgents([...agents, { ...formData, id: Date.now() }]);
      } else {
        setAgents(agents.map(a => a.id === editingItem ? { ...a, ...formData } : a));
      }
    }
    setEditingItem(null);
    setFormData({});
  };

  // Handle delete
  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    if (activeTab === 'users') {
      setUsers(users.filter(u => u.id !== id));
    } else if (activeTab === 'companies') {
      setCompanies(companies.filter(c => c.id !== id));
    } else if (activeTab === 'agents') {
      setAgents(agents.filter(a => a.id !== id));
    }
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
                  <label className="block text-sm font-medium mb-2">Compliance Score</label>
                  <input
                    type="number"
                    value={formData.compliance || 100}
                    onChange={(e) => setFormData({ ...formData, compliance: parseInt(e.target.value) })}
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
                      checked={formData.enabled || false}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Enabled</span>
                  </label>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={() => { setEditingItem(null); setFormData({}); }} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
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
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(user.id)}>
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
                      <p className="text-sm text-muted-foreground">Compliance</p>
                      <p className="font-semibold">{company.compliance}%</p>
                    </div>
                    <Badge variant={
                      company.risk === 'low' ? 'default' : 
                      company.risk === 'medium' ? 'secondary' : 
                      'destructive'
                    }>
                      {company.risk} risk
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(company)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(company.id)}>
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
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(agent)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(agent.id)}>
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
        </div>
        {activeTab !== 'settings' && (
          <Button onClick={handleAdd} className="bg-primary">
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

