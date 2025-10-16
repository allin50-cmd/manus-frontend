import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Settings, User, Bell, Shield, CreditCard, Key, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';

export default function SettingsPage({ user, onUpdate }) {
  const [activeTab, setActiveTab] = useState('account');
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    phone: user?.phone || '',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    security: {
      twoFactor: false,
      sessionTimeout: '30'
    }
  });

  const [apiKeys, setApiKeys] = useState([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(true);
  const [errorApiKeys, setErrorApiKeys] = useState(null);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setLoadingApiKeys(true);
        const response = await api.get('/api/v1/api-keys'); // Assuming this is the endpoint for API keys
        setApiKeys(response.data);
      } catch (error) {
        console.error('Error fetching API keys:', error);
        setErrorApiKeys('Failed to load API keys.');
      } finally {
        setLoadingApiKeys(false);
      }
    };
    fetchApiKeys();
  }, []);

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'api', label: 'API Keys', icon: Key }
  ];

  const handleSave = () => {
    // Save to localStorage
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('fineguard_user', JSON.stringify(updatedUser));
    if (onUpdate) onUpdate(updatedUser);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-500" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>
        {saved && (
          <Badge className="bg-green-500 text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Saved Successfully
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl">
        {activeTab === 'account' && (
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Your Company Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="+44 20 1234 5678"
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive compliance alerts via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.email}
                  onChange={(e) => handleNestedChange('notifications', 'email', e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive urgent alerts via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.sms}
                  onChange={(e) => handleNestedChange('notifications', 'sms', e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.push}
                  onChange={(e) => handleNestedChange('notifications', 'push', e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.security.twoFactor}
                  onChange={(e) => handleNestedChange('security', 'twoFactor', e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                <select
                  value={formData.security.sessionTimeout}
                  onChange={(e) => handleNestedChange('security', 'sessionTimeout', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Change Password</label>
                <Button variant="outline" className="w-full">Change Password</Button>
              </div>
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'billing' && (
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your subscription and payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">Current Plan</p>
                  <Badge className="bg-cyan-500 text-white">{user?.subscription || 'Free'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {user?.subscription === 'free' ? 'Upgrade to unlock premium features' : 'Enjoy all premium features'}
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Payment Method</p>
                <div className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Update</Button>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Billing Information
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'api' && (
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API authentication tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingApiKeys && <p>Loading API keys...</p>}
              {errorApiKeys && <p className="text-red-500">{errorApiKeys}</p>}
              {!loadingApiKeys && !errorApiKeys && apiKeys.length === 0 && (
                <p className="text-muted-foreground">No API keys found. Generate a new one to get started.</p>
              )}
              {!loadingApiKeys && !errorApiKeys && apiKeys.length > 0 && (
                <div className="space-y-2">
                  {apiKeys.map(key => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="font-mono text-sm text-gray-700 dark:text-gray-300">{key.key}</div>
                      <Badge variant="secondary">{key.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full">
                Generate New API Key
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
