import { useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Key,
  Copy,
  RefreshCw,
  Plus,
  Check,
} from 'lucide-react';

// ─── Toggle component ────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        on ? 'bg-[#5A4BFF]' : 'bg-white/10'
      }`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── NotificationRow ─────────────────────────────────────────────────────────
function NotificationRow({
  label,
  description,
  defaultOn,
}: {
  label: string;
  description: string;
  defaultOn: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <Toggle on={on} onToggle={() => setOn((v) => !v)} />
    </div>
  );
}

// ─── ApiKeyRow ────────────────────────────────────────────────────────────────
function ApiKeyRow({ label, masked }: { label: string; masked: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(masked).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-300 w-36">{label}</span>
        <code className="text-sm font-mono text-gray-100 bg-white/5 px-3 py-1 rounded">
          {masked}
        </code>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-gray-400 hover:text-white hover:bg-white/5 gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/5 gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}

// ─── Main Settings page ───────────────────────────────────────────────────────
export default function Settings() {
  const [, navigate] = useLocation();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0F1014] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/portal')}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-[#1A1D28] border border-white/10 p-1 h-auto">
            <TabsTrigger
              value="profile"
              className="gap-1.5 data-[state=active]:bg-[#5A4BFF] data-[state=active]:text-white text-gray-400"
            >
              <User className="w-3.5 h-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="gap-1.5 data-[state=active]:bg-[#5A4BFF] data-[state=active]:text-white text-gray-400"
            >
              <Shield className="w-3.5 h-3.5" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="gap-1.5 data-[state=active]:bg-[#5A4BFF] data-[state=active]:text-white text-gray-400"
            >
              <Bell className="w-3.5 h-3.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="apikeys"
              className="gap-1.5 data-[state=active]:bg-[#5A4BFF] data-[state=active]:text-white text-gray-400"
            >
              <Key className="w-3.5 h-3.5" />
              API Keys
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Profile ─────────────────────────────────────────────── */}
          <TabsContent value="profile">
            <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-6 space-y-6">
              {/* Avatar + identity */}
              <div className="flex items-center gap-5">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                  style={{ backgroundColor: '#5A4BFF' }}
                >
                  AC
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Alex Chen</p>
                  <Badge className="mt-1 bg-[#5A4BFF]/20 text-[#8B7FFF] border-[#5A4BFF]/40 border text-xs">
                    Senior Compliance Officer
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2">Last sign-in: Today at 09:14 AM</p>
                </div>
              </div>

              <hr className="border-white/5" />

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Full name
                  </label>
                  <input
                    type="text"
                    defaultValue="Alex Chen"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#5A4BFF] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="alex.chen@vaultline.io"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#5A4BFF] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Job title
                  </label>
                  <input
                    type="text"
                    defaultValue="Senior Compliance Officer"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#5A4BFF] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Organisation
                  </label>
                  <input
                    type="text"
                    defaultValue="Meridian Capital Group"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#5A4BFF] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Timezone
                  </label>
                  <select
                    defaultValue="Europe/London"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5A4BFF] transition-colors appearance-none"
                  >
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Language
                  </label>
                  <select
                    defaultValue="en-GB"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5A4BFF] transition-colors appearance-none"
                  >
                    <option value="en-GB">English (UK)</option>
                    <option value="en-US">English (US)</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="es-ES">Spanish</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-6"
                >
                  Save changes
                </Button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-400">
                    <Check className="w-4 h-4" />
                    Changes saved
                  </span>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 2: Security ─────────────────────────────────────────────── */}
          <TabsContent value="security">
            <div className="space-y-4">
              {/* Password */}
              <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-1">Password</h3>
                <p className="text-xs text-gray-400 mb-4">Last changed 42 days ago</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  Change password
                </Button>
              </div>

              {/* 2FA */}
              <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">Authenticator app configured</p>
                    <Badge className="bg-green-500/15 text-green-400 border-green-500/30 border text-xs">
                      Enabled
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white flex-shrink-0"
                  >
                    Manage 2FA
                  </Button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Active Sessions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Device</th>
                        <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Location</th>
                        <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">Last active</th>
                        <th className="text-left text-xs text-gray-400 font-medium pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5">
                        <td className="py-3 pr-4 text-white">
                          Chrome on macOS
                          <Badge className="ml-2 bg-[#5A4BFF]/20 text-[#8B7FFF] border-[#5A4BFF]/30 border text-xs">
                            current
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-gray-400">London, UK</td>
                        <td className="py-3 pr-4 text-gray-400">Just now</td>
                        <td className="py-3">
                          <span className="text-gray-600 text-xs">—</span>
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3 pr-4 text-white">Safari on iPhone</td>
                        <td className="py-3 pr-4 text-gray-400">London, UK</td>
                        <td className="py-3 pr-4 text-gray-400">2h ago</td>
                        <td className="py-3">
                          <button className="text-xs text-red-400 hover:text-red-300 transition-colors">
                            Revoke
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 text-white">Chrome on Windows</td>
                        <td className="py-3 pr-4 text-gray-400">Manchester, UK</td>
                        <td className="py-3 pr-4 text-gray-400">3 days ago</td>
                        <td className="py-3">
                          <button className="text-xs text-red-400 hover:text-red-300 transition-colors">
                            Revoke
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 3: Notifications ────────────────────────────────────────── */}
          <TabsContent value="notifications">
            <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-1">Notification preferences</h3>
              <p className="text-xs text-gray-400 mb-6">
                Choose which events trigger email or in-app notifications.
              </p>

              <NotificationRow
                label="Case status changes"
                description="Get notified when a case moves to a new status"
                defaultOn={true}
              />
              <NotificationRow
                label="New hearings scheduled"
                description="Receive alerts when hearings are added to your docket"
                defaultOn={true}
              />
              <NotificationRow
                label="Bundle generation complete"
                description="Know when a compliance bundle is ready to download"
                defaultOn={true}
              />
              <NotificationRow
                label="Compliance alerts (FineGuard)"
                description="Immediate notifications for FineGuard risk flags"
                defaultOn={true}
              />
              <NotificationRow
                label="Weekly digest email"
                description="A summary of activity sent every Monday morning"
                defaultOn={false}
              />
              <NotificationRow
                label="System maintenance notices"
                description="Scheduled downtime and update announcements"
                defaultOn={false}
              />
            </div>
          </TabsContent>

          {/* ── Tab 4: API Keys ─────────────────────────────────────────────── */}
          <TabsContent value="apikeys">
            <div className="space-y-4">
              {/* Keys list */}
              <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">API Keys</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Keep these secret — they grant full API access.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create new key
                  </Button>
                </div>

                <ApiKeyRow
                  label="Production key"
                  masked="vl_live_••••••••••••••••4f2a"
                />
                <ApiKeyRow
                  label="Development key"
                  masked="vl_dev_••••••••••••••••9b1c"
                />
              </div>

              {/* Usage stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-gray-400 mb-1">API calls this month</p>
                  <p className="text-2xl font-bold text-white">12,847</p>
                </div>
                <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-gray-400 mb-1">Rate limit</p>
                  <p className="text-2xl font-bold text-white">10,000<span className="text-sm font-normal text-gray-400">/hour</span></p>
                </div>
                <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-gray-400 mb-2">Current usage</p>
                  <p className="text-2xl font-bold text-white mb-2">23%</p>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-[#5A4BFF]"
                      style={{ width: '23%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Code snippet */}
              <div className="bg-[#1A1D28] border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Authentication header</h3>
                <div className="bg-[#0F1014] border border-white/5 rounded-lg p-4">
                  <code className="text-sm font-mono text-gray-300">
                    <span className="text-gray-500">Authorization: </span>
                    <span className="text-[#8B7FFF]">Bearer</span>
                    <span className="text-gray-300"> vl_live_••••••••••••••••4f2a</span>
                  </code>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Include this header on every request to the VaultLine API.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
