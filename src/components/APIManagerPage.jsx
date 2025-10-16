import React, { useState, useEffect } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Code, Key, Activity, CheckCircle2, XCircle, AlertCircle, Copy, RefreshCw, Eye, EyeOff, Plus, Trash2, BarChart3 } from 'lucide-react'

export default function APIManagerPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState(null)
  
  const [apiKeys, setApiKeys] = useState([])
  const [loadingApiKeys, setLoadingApiKeys] = useState(true)
  const [apiKeysError, setApiKeysError] = useState(null)

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setLoadingApiKeys(true)
        const response = await api.request('/api/v1/api-keys')
        setApiKeys(response.data)
      } catch (error) {
        console.error('Error fetching API keys:', error)
        setApiKeysError('Failed to load API keys.')
      } finally {
        setLoadingApiKeys(false)
      }
    }
    fetchApiKeys()
  }, [])

  const [endpoints, setEndpoints] = useState([])
  const [loadingEndpoints, setLoadingEndpoints] = useState(true)
  const [endpointsError, setEndpointsError] = useState(null)

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        setLoadingEndpoints(true)
        const response = await api.request('/api/v1/endpoints')
        setEndpoints(response.data)
      } catch (error) {
        console.error('Error fetching endpoints:', error)
        setEndpointsError('Failed to load endpoints.')
      } finally {
        setLoadingEndpoints(false)
      }
    }
    fetchEndpoints()
  }, [])

  const [webhooks, setWebhooks] = useState([])
  const [loadingWebhooks, setLoadingWebhooks] = useState(true)
  const [webhooksError, setWebhooksError] = useState(null)

  useEffect(() => {
    const fetchWebhooks = async () => {
      try {
        setLoadingWebhooks(true)
        const response = await api.request('/api/v1/webhooks')
        setWebhooks(response.data)
      } catch (error) {
        console.error('Error fetching webhooks:', error)
        setWebhooksError('Failed to load webhooks.')
      } finally {
        setLoadingWebhooks(false)
      }
    }
    fetchWebhooks()
  }, [])

  const [usageStats, setUsageStats] = useState({
    totalRequests: 0,
    requestsToday: 0,
    avgResponseTime: 0,
    successRate: 0,
    rateLimit: '',
    remaining: 0,
  })
  const [loadingUsageStats, setLoadingUsageStats] = useState(true)
  const [usageStatsError, setUsageStatsError] = useState(null)

  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        setLoadingUsageStats(true)
        const response = await api.request('/api/v1/usage-stats')
        setUsageStats(response.data)
      } catch (error) {
        console.error('Error fetching usage stats:', error)
        setUsageStatsError('Failed to load usage stats.')
      } finally {
        setLoadingUsageStats(false)
      }
    }
    fetchUsageStats()
  }, [])

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
                {loadingUsageStats ? '...' : usageStats.totalRequests.toLocaleString()}
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
                {loadingUsageStats ? '...' : usageStats.requestsToday.toLocaleString()}
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
                {loadingUsageStats ? '...' : usageStats.avgResponseTime}ms
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
                {loadingUsageStats ? '...' : usageStats.successRate}%
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
              {loadingApiKeys ? (
                <p className="text-gray-400">Loading API keys...</p>
              ) : apiKeysError ? (
                <p className="text-red-400">{apiKeysError}</p>
              ) : apiKeys.length === 0 ? (
                <p className="text-gray-400">No API keys found.</p>
              ) : 
                apiKeys.map((apiKey) => (
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

        {/* Endpoints */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              API Endpoints
            </CardTitle>
            <CardDescription className="text-gray-300">
              Explore available API endpoints and their usage statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 text-gray-300 font-medium">Endpoint</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Requests</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Avg. Response</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Success Rate</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingEndpoints ? (
                <p className="text-gray-400">Loading endpoints...</p>
              ) : endpointsError ? (
                <p className="text-red-400">{endpointsError}</p>
              ) : endpoints.length === 0 ? (
                <p className="text-gray-400">No endpoints found.</p>
              ) : (
                endpoints.map((endpoint, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <code className="ml-3 text-purple-300 font-mono">{endpoint.path}</code>
                        <p className="text-xs text-gray-400 mt-1 ml-3">{endpoint.description}</p>
                      </td>
                      <td className="text-center py-3 px-4 text-white">{endpoint.requests.toLocaleString()}</td>
                      <td className="text-center py-3 px-4 text-white">{endpoint.avgResponseTime}ms</td>
                      <td className="text-center py-3 px-4 text-green-400">{endpoint.successRate}%</td>
                      <td className="text-center py-3 px-4">
                        <Button
                          onClick={() => handleTestEndpoint(endpoint)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                          size="sm"
                        >
                          Test
                        </Button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Webhooks
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your webhook integrations for real-time notifications
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
              {loadingWebhooks ? (
                <p className="text-gray-400">Loading webhooks...</p>
              ) : webhooksError ? (
                <p className="text-red-400">{webhooksError}</p>
              ) : webhooks.length === 0 ? (
                <p className="text-gray-400">No webhooks found.</p>
              ) : (
                webhooks.map((webhook) => (
                <div key={webhook.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                        <Badge className={webhook.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-gray-500/20 text-gray-300 border-gray-500/50'}>
                          {webhook.status}
                        </Badge>
                      </div>
                      <code className="text-sm text-purple-300 font-mono break-all">{webhook.url}</code>
                      <p className="text-xs text-gray-400 mt-2">Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}</p>
                      <div className="mt-3">
                        <p className="text-sm text-gray-300 mb-2">Subscribed events:</p>
                        <div className="flex flex-wrap gap-2">
                          {webhook.events.map((event, idx) => (
                            <Badge key={idx} className="bg-gray-500/20 text-gray-300 border-gray-500/50 text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                       <Button
                        className="bg-white/10 hover:bg-white/20 text-white"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
