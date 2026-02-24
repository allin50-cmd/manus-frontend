/**
 * Settings Page
 * User preferences, API configuration, integrations, and security settings
 */
import React, { useState } from 'react';
import {
  Settings as SettingsIcon, User, Bell, Shield, Link, Palette,
  Key, Eye, EyeOff, Check, Copy, RefreshCw, Zap, Globe,
  Database, Lock, Brain, Save, AlertTriangle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AI_MODELS } from '@/services/aiClient';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('w-10 h-5 rounded-full transition-colors relative', checked ? 'bg-brand-purple' : 'bg-white/15')}
      >
        <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

function ApiKeyField({ label, value, placeholder }: { label: string; value: string; placeholder: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value || placeholder);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-4">
      <Label>{label}</Label>
      <div className="relative flex gap-2">
        <Input
          type={show ? 'text' : 'password'}
          defaultValue={value || placeholder}
          placeholder={placeholder}
          className="font-mono text-xs pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <button onClick={() => setShow((s) => !s)} className="p-1 text-gray-500 hover:text-white">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button onClick={copy} className="p-1 text-gray-500 hover:text-white">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    complianceAlerts: true,
    auditDigest: false,
    workflowFailures: true,
    aiUsageAlerts: false,
  });

  const [security, setSecurity] = useState({
    mfaEnabled: true,
    sessionTimeout: true,
    ipWhitelist: false,
    auditAllReads: false,
  });

  const [ai, setAi] = useState({
    defaultModel: 'claude-opus-4-6',
    streamResponses: true,
    saveHistory: true,
    autoSelectTools: true,
  });

  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = () => {
    setSavedMsg('Settings saved');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <DashboardLayout title="Settings" subtitle="Configure your VaultLine platform">
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ai">AI & Models</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Your personal account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-purple to-brand-cyan rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                      A
                    </div>
                    <div>
                      <p className="font-semibold text-white">Admin User</p>
                      <p className="text-sm text-gray-400">admin@vaultline.io</p>
                      <Badge variant="purple" className="mt-1">Platform Admin</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input defaultValue="Admin" />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input defaultValue="User" />
                    </div>
                    <div className="col-span-2">
                      <Label>Email Address</Label>
                      <Input defaultValue="admin@vaultline.io" type="email" />
                    </div>
                    <div className="col-span-2">
                      <Label>Organisation</Label>
                      <Input defaultValue="VaultLine Technologies Ltd" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label>Current Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div>
                      <Label>New Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div>
                      <Label>Confirm Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <Button variant="primary" size="sm">Update Password</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Usage This Month</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'AI Queries', value: 1842, max: 5000, color: 'purple' as const },
                      { label: 'Compliance Checks', value: 247, max: 1000, color: 'cyan' as const },
                      { label: 'Audit Events', value: 18420, max: 100000, color: 'gold' as const },
                      { label: 'Storage', value: 284, max: 1000, color: 'green' as const },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{item.label}</span>
                          <span className="text-white">{item.value.toLocaleString()} / {item.max.toLocaleString()}</span>
                        </div>
                        <Progress value={item.value} max={item.max} color={item.color} size="sm" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-xs text-red-400 font-semibold mb-1">Delete Account</p>
                      <p className="text-xs text-gray-500 mb-3">This action is permanent and cannot be undone.</p>
                      <Button variant="danger" size="sm" className="w-full">Delete Account</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="max-w-xl space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Control which events trigger email alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <Toggle checked={notifications.emailAlerts} onChange={(v) => setNotifications((p) => ({ ...p, emailAlerts: v }))} label="Email alerts enabled" />
                <Toggle checked={notifications.complianceAlerts} onChange={(v) => setNotifications((p) => ({ ...p, complianceAlerts: v }))} label="Compliance deadline alerts" />
                <Toggle checked={notifications.auditDigest} onChange={(v) => setNotifications((p) => ({ ...p, auditDigest: v }))} label="Daily audit digest" />
                <Toggle checked={notifications.workflowFailures} onChange={(v) => setNotifications((p) => ({ ...p, workflowFailures: v }))} label="Workflow failure alerts" />
                <Toggle checked={notifications.aiUsageAlerts} onChange={(v) => setNotifications((p) => ({ ...p, aiUsageAlerts: v }))} label="AI usage threshold alerts" />
              </CardContent>
            </Card>
            <Button variant="primary" onClick={handleSave}>
              {savedMsg ? <><Check className="w-3.5 h-3.5 mr-1.5" />{savedMsg}</> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save Preferences</>}
            </Button>
          </div>
        </TabsContent>

        {/* AI Models */}
        <TabsContent value="ai">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {AI_MODELS.map((model) => (
                <Card
                  key={model.id}
                  className={cn('cursor-pointer transition-all', ai.defaultModel === model.id && 'border-brand-purple/50 glow-purple')}
                  onClick={() => setAi((p) => ({ ...p, defaultModel: model.id }))}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-cyan rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      {ai.defaultModel === model.id && <Badge variant="purple" dot>Default</Badge>}
                      {model.isDefault && ai.defaultModel !== model.id && <Badge variant="gray">Recommended</Badge>}
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{model.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{model.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600">
                      <span>{(model.contextWindow / 1000).toFixed(0)}K context</span>
                      {model.supportsToolUse && <Badge variant="cyan" className="text-[10px]">Tool Use</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="max-w-xl">
              <CardHeader><CardTitle>AI Behaviour</CardTitle></CardHeader>
              <CardContent>
                <Toggle checked={ai.streamResponses} onChange={(v) => setAi((p) => ({ ...p, streamResponses: v }))} label="Stream responses (token-by-token)" />
                <Toggle checked={ai.saveHistory} onChange={(v) => setAi((p) => ({ ...p, saveHistory: v }))} label="Save conversation history" />
                <Toggle checked={ai.autoSelectTools} onChange={(v) => setAi((p) => ({ ...p, autoSelectTools: v }))} label="Auto-select relevant MCP tools" />
              </CardContent>
            </Card>
            <Button variant="primary" onClick={handleSave}>Save AI Settings</Button>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Azure / MSAL</CardTitle>
                <CardDescription>Microsoft Entra ID authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeyField label="Azure Client ID" value="" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                <ApiKeyField label="Tenant ID" value="" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                <div>
                  <Label>Redirect URI</Label>
                  <Input defaultValue={window.location.origin} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <span className="text-xs text-gray-400">Auth not configured — using mock mode</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Companies House API</CardTitle>
                <CardDescription>UK company data and compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeyField label="API Key" value="" placeholder="Enter Companies House API key" />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span className="text-xs text-gray-400">No API key configured</span>
                  </div>
                  <Button variant="secondary" size="xs">Test Connection</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>VaultLine WORM Storage</CardTitle>
                <CardDescription>Immutable audit log storage</CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeyField label="WORM Endpoint" value="" placeholder="https://vault.yourdomain.com/api" />
                <ApiKeyField label="WORM Token" value="" placeholder="Enter VaultLine write token" />
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-400">Buffering locally — auto-flush when configured</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Endpoints</CardTitle>
                <CardDescription>External notification delivery</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Label>Webhook URL</Label>
                  <Input placeholder="https://hooks.yourservice.com/webhook" />
                </div>
                <div className="mb-3">
                  <Label>Secret</Label>
                  <Input type="password" placeholder="Webhook signing secret" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Test Webhook</Button>
                  <Button variant="primary" size="sm">Save</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="max-w-xl space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Authentication & Session</CardTitle>
              </CardHeader>
              <CardContent>
                <Toggle checked={security.mfaEnabled} onChange={(v) => setSecurity((p) => ({ ...p, mfaEnabled: v }))} label="Multi-factor authentication (TOTP)" />
                <Toggle checked={security.sessionTimeout} onChange={(v) => setSecurity((p) => ({ ...p, sessionTimeout: v }))} label="30-minute inactivity timeout" />
                <Toggle checked={security.ipWhitelist} onChange={(v) => setSecurity((p) => ({ ...p, ipWhitelist: v }))} label="IP whitelist (restrict access)" />
                <Toggle checked={security.auditAllReads} onChange={(v) => setSecurity((p) => ({ ...p, auditAllReads: v }))} label="Audit all data read events" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Access Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {[
                    { name: 'Production Token', created: '2024-01-01', lastUsed: '2 hours ago' },
                    { name: 'CI/CD Token', created: '2024-02-01', lastUsed: '1 day ago' },
                  ].map((token) => (
                    <div key={token.name} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <Key className="w-4 h-4 text-brand-purple shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-white font-medium">{token.name}</p>
                        <p className="text-[10px] text-gray-600">Created {token.created} · Last used {token.lastUsed}</p>
                      </div>
                      <Button variant="danger" size="xs">Revoke</Button>
                    </div>
                  ))}
                </div>
                <Button variant="primary" size="sm">
                  <Key className="w-3.5 h-3.5 mr-1.5" /> Generate New Token
                </Button>
              </CardContent>
            </Card>

            <Button variant="primary" onClick={handleSave}>
              {savedMsg ? <><Check className="w-3.5 h-3.5 mr-1.5" />{savedMsg}</> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save Security Settings</>}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
