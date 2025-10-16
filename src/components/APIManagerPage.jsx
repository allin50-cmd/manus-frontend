import React, { useState } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Code, Key, Activity, CheckCircle2, XCircle, AlertCircle, Copy, RefreshCw, Eye, EyeOff, Plus, Trash2, BarChart3 } from 'lucide-react'

export default function APIManagerPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState(null)
  
  const apiKeys = [
    {
      id: 1,
      name: 'Production API Key',
      key: 'fg_prod_k3j4h5g6f7d8s9a0',
      created: '2024-01-15',
      lastUsed: '2024-10-16',
      requests: 45230,
      status: 'active',
      permissions: ['read', 'write', 'delete']
    },
    {
      id: 2,
      name: 'Development API Key',
      key: 'fg_dev_a1b2c3d4e5f6g7h8',
      created: '2024-03-20',
      lastUsed: '2024-10-15',
      requests: 12450,
      status: 'active',
      permissions: ['read', 'write']
    },
    {
      id: 3,
      name: 'Testing API Key',
      key: 'fg_test_x9y8z7w6v5u4t3s2',
      created: '2024-06-10',
      lastUsed: '2024-09-30',
      requests: 3200,
      status: 'inactive',
      permissions: ['read']
    }
  ]
  
  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/companies',
      description: 'List all companies',
      requests: 15420,
      avgResponseTime: 45,
      successRate: 99.8,
      rateLimit: '100/min'
    },
    {
      method: 'POST',
      path: '/api/v1/companies',
      description: 'Create new company',
      requests: 892,
      avgResponseTime: 120,
      successRate: 98.5,
      rateLimit: '50/min'
    },
    {
      method: 'GET',
      path: '/api/v1/companies/{id}',
      description: 'Get company details',
      requests: 23150,
      avgResponseTime: 38,
      successRate: 99.9,
      rateLimit: '100/min'
    },
    {
      method: 'PUT',
      path: '/api/v1/companies/{id}',
      description: 'Update company',
      requests: 3420,
      avgResponseTime: 95,
      successRate: 99.2,
      rateLimit: '50/min'
    },
    {
      method: 'DELETE',
      path: '/api/v1/companies/{id}',
      description: 'Delete company',
      requests: 234,
      avgResponseTime: 52,
      successRate: 100,
      rateLimit: '20/min'
    },
    {
      method: 'GET',
      path: '/api/v1/obligations',
      description: 'List obligations',
      requests: 18920,
      avgResponseTime: 62,
      successRate: 99.5,
      rateLimit: '100/min'
    },
    {
      method: 'POST',
      path: '/api/v1/obligations',
      description: 'Create obligation',
      requests: 1560,
      avgResponseTime: 110,
      successRate: 98.9,
      rateLimit: '50/min'
    },
    {
      method: 'GET',
      path: '/api/v1/analytics',
      description: 'Get analytics data',
      requests: 5670,
      avgResponseTime: 180,
      successRate: 99.1,
      rateLimit: '30/min'
    }
  ]
  
  const webhooks = [
    {
      id: 1,
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/...',
      events: ['obligation.overdue', 'payment.received'],
      status: 'active',
      lastTriggered: '2024-10-16T10:30:00',
      successRate: 99.5
    },
    {
      id: 2,
      name: 'CRM Integration',
      url: 'https://api.crm.example.com/webhook',
      events: ['company.created', 'company.updated'],
      status: 'active',
      lastTriggered: '2024-10-16T09:15:00',
      successRate: 98.2
    },
    {
      id: 3,
      name: 'Analytics Pipeline',
      url: 'https://analytics.example.com/ingest',
      events: ['*'],
      status: 'inactive',
      lastTriggered: '2024-10-10T14:20:00',
      successRate: 95.8
    }
  ]
  
  const usageStats = {
    totalRequests: 71446,
    requestsToday: 2340,
    avgResponseTime: 78,
    successRate: 99.3,
    rateLimit: '1000 requests/hour',
    remaining: 756
  }
  
  const getMethodColor = (method) => {
    switch(method) {
      case 'GET': return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      case 'POST': return 'bg-green-500/20 text-green-300 border-green-500/50'
      case 'PUT': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'DELETE': return 'bg-red-500/20 text-red-300 border-red-500/50'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }
  
  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key)
    alert('API key copied to clipboard!')
  }
  
  const handleRegenerateKey = (id) => {
    if (confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) {
      alert(`Regenerating API key ${id}...`)
    }
  }
  
  const handleRevokeKey = (id) => {
    if (confirm('Are you sure you want to revoke this API key?')) {
      alert(`Revoking API key ${id}...`)
    }
  }
  
  const handleCreateKey = () => {
    alert('Creating new API key...')
  }
  
  const handleTestEndpoint = (endpoint) => {
    setSelectedEndpoint(endpoint)
    alert(`Testing endpoint: ${endpoint.method} ${endpoint.path}`)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Code className="w-10 h-10" />
            API Integration Manager
          </h1>
          <p className="text-gray-300">Manage API keys, endpoints, and integrations</p>
        </div>
        
        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-purple-400" />
                <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                  Active
                </Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {usageStats.totalRequests.toLocaleString()}
              </div>
              <div className="text-sm text-gray-300">Total Requests</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {usageStats.requestsToday.toLocaleString()}
              </div>
              <div className="text-sm text-gray-300">Requests Today</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {usageStats.avgResponseTime}ms
              </div>
              <div className="text-sm text-gray-300">Avg Response Time</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {usageStats.successRate}%
              </div>
              <div className="text-sm text-gray-300">Success Rate</div>
            </CardContent>
          </Card>
        </div>
        
        {/* API Keys */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your API authentication keys
                </CardDescription>
              </div>
              <Button
                onClick={handleCreateKey}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{apiKey.name}</h3>
                        <Badge className={apiKey.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-gray-500/20 text-gray-300 border-gray-500/50'}>
                          {apiKey.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="px-3 py-1 bg-black/30 rounded text-purple-300 font-mono text-sm">
                          {showApiKey ? apiKey.key : '••••••••••••••••••••'}
                        </code>
                        <Button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="bg-white/10 hover:bg-white/20 text-white"
                          size="sm"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          onClick={() => handleCopyKey(apiKey.key)}
                          className="bg-white/10 hover:bg-white/20 text-white"
                          size="sm"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-300">
                        <span>Created: {apiKey.created}</span>
                        <span>Last used: {apiKey.lastUsed}</span>
                        <span>Requests: {apiKey.requests.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {apiKey.permissions.map((perm, idx) => (
                          <Badge key={idx} className="bg-purple-500/20 text-purple-300 border-purple-500/50 text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRegenerateKey(apiKey.id)}
                        className="bg-white/10 hover:bg-white/20 text-white"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleRevokeKey(apiKey.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* API Endpoints */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">API Endpoints</CardTitle>
            <CardDescription className="text-gray-300">
              Available API endpoints and their performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Method</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Endpoint</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Description</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Requests</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Avg Time</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Success</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Rate Limit</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((endpoint, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-purple-300 font-mono text-sm">{endpoint.path}</code>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{endpoint.description}</td>
                      <td className="py-3 px-4 text-right text-white">{endpoint.requests.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-white">{endpoint.avgResponseTime}ms</td>
                      <td className="py-3 px-4 text-right text-white">{endpoint.successRate}%</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                          {endpoint.rateLimit}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          onClick={() => handleTestEndpoint(endpoint)}
                          className="bg-white/10 hover:bg-white/20 text-white text-sm"
                          size="sm"
                        >
                          Test
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Webhooks */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Webhooks</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure webhook endpoints for event notifications
                </CardDescription>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                        <Badge className={webhook.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-gray-500/20 text-gray-300 border-gray-500/50'}>
                          {webhook.status}
                        </Badge>
                      </div>
                      <code className="text-sm text-purple-300 font-mono">{webhook.url}</code>
                      <div className="flex gap-2 mt-3">
                        {webhook.events.map((event, idx) => (
                          <Badge key={idx} className="bg-blue-500/20 text-blue-300 border-blue-500/50 text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-300 mt-2">
                        <span>Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}</span>
                        <span>Success rate: {webhook.successRate}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-white/10 hover:bg-white/20 text-white" size="sm">
                        Edit
                      </Button>
                      <Button className="bg-red-500/20 hover:bg-red-500/30 text-red-300" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

