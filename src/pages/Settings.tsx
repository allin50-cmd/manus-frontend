import { useState } from 'react';
import {
  Bell, Shield, Building2,
  Key, Smartphone, CheckCircle, Save, Eye, EyeOff, User as UserIcon
} from 'lucide-react';
import type { User as UserType } from '@/types/fineguard';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'company' | 'api';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & 2FA', icon: Shield },
    { id: 'company', label: 'Company Settings', icon: Building2 },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account and system preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab List */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'nav-item w-full',
                  activeTab === tab.id ? 'nav-item-active' : 'nav-item-inactive'
                )}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings user={user} onSave={handleSave} />}
          {activeTab === 'notifications' && <NotificationSettings onSave={handleSave} />}
          {activeTab === 'security' && <SecuritySettings onSave={handleSave} />}
          {activeTab === 'company' && <CompanySettings onSave={handleSave} />}
          {activeTab === 'api' && <APISettings />}

          {saved && activeTab !== 'api' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Settings saved successfully
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ user, onSave }: { user: UserType | null; onSave: () => void }) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Profile Information</h2>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-xl font-bold text-white">
            {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>
      </div>

      <div>
        <label className="label">Full Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label">Email Address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label">Role</label>
        <input type="text" value={user?.role?.replace('_', ' ')} readOnly className="input bg-gray-50 capitalize" />
        <p className="text-xs text-gray-400 mt-1">Role is managed by your firm administrator</p>
      </div>

      <button onClick={onSave} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" /> Save Changes
      </button>
    </div>
  );
}

function NotificationSettings({ onSave }: { onSave: () => void }) {
  const [settings, setSettings] = useState({
    vatDeadlines: true,
    complianceAlerts: true,
    receiptProcessed: true,
    stagingQueue: false,
    auditAlerts: true,
    emailDigest: 'daily' as 'daily' | 'weekly' | 'off',
  });

  const toggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(p => ({ ...p, [key]: !p[key as keyof typeof settings] }));
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>

      <div className="space-y-3">
        {[
          { key: 'vatDeadlines', label: 'VAT Return Deadlines', desc: 'Remind me 30, 14, and 7 days before due date' },
          { key: 'complianceAlerts', label: 'Compliance Alerts', desc: 'Notify on critical compliance issues' },
          { key: 'receiptProcessed', label: 'Receipt Processed', desc: 'When OCR extraction completes' },
          { key: 'stagingQueue', label: 'Staging Queue Items', desc: 'When new items need review' },
          { key: 'auditAlerts', label: 'Audit Events', desc: 'High-sensitivity action alerts' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key as keyof typeof settings)}
              className={cn(
                'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                settings[key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ease-in-out',
                  settings[key as keyof typeof settings] ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className="label">Email Digest</label>
        <select
          value={settings.emailDigest}
          onChange={e => setSettings(p => ({ ...p, emailDigest: e.target.value as 'daily' | 'weekly' | 'off' }))}
          className="input"
        >
          <option value="daily">Daily Summary</option>
          <option value="weekly">Weekly Summary</option>
          <option value="off">Off</option>
        </select>
      </div>

      <button onClick={onSave} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" /> Save Preferences
      </button>
    </div>
  );
}

function SecuritySettings({ onSave }: { onSave: () => void }) {
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(true);

  return (
    <div className="card p-6 space-y-6">
      <h2 className="text-sm font-semibold text-gray-900">Security Settings</h2>

      {/* Password Change */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Change Password</h3>
        <div>
          <label className="label">Current Password</label>
          <div className="relative">
            <input
              type={showCurrentPwd ? 'text' : 'password'}
              className="input pr-10"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPwd(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">New Password</label>
          <input type="password" className="input" placeholder="Minimum 12 characters" />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input type="password" className="input" placeholder="Repeat new password" />
        </div>
      </div>

      {/* 2FA */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication (2FA)</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Required for partner accounts and MTD submissions
            </p>
          </div>
          <button
            onClick={() => setMfaEnabled(p => !p)}
            className={cn(
              'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              mfaEnabled ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition',
                mfaEnabled ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {mfaEnabled && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
            <Smartphone className="w-4 h-4" />
            2FA is active. Authenticator app configured.
          </div>
        )}
      </div>

      <button onClick={onSave} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" /> Save Security Settings
      </button>
    </div>
  );
}

function CompanySettings({ onSave }: { onSave: () => void }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Company & VAT Settings</h2>

      <div>
        <label className="label">Default VAT Rate</label>
        <select className="input">
          <option value="20">Standard 20%</option>
          <option value="5">Reduced 5%</option>
          <option value="0">Zero-rated 0%</option>
        </select>
      </div>

      <div>
        <label className="label">OCR Confidence Threshold (%)</label>
        <input type="number" min={80} max={100} defaultValue={98} className="input" />
        <p className="text-xs text-gray-400 mt-1">
          Receipts below this threshold require manual verification before approval
        </p>
      </div>

      <div>
        <label className="label">Default MTD Return Period</label>
        <select className="input">
          <option value="quarterly">Quarterly</option>
          <option value="monthly">Monthly</option>
          <option value="annual">Annual Accounting</option>
        </select>
      </div>

      <div>
        <label className="label">HMRC Agent Reference Number</label>
        <input type="text" className="input font-mono" placeholder="e.g. 1234567" />
      </div>

      <button onClick={onSave} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" /> Save Settings
      </button>
    </div>
  );
}

function APISettings() {
  const [showKey, setShowKey] = useState(false);
  const mockKey = 'fg_live_sk_' + 'x'.repeat(32);

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">API Configuration</h2>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        ⚠ Never share your API keys. Rotate them immediately if compromised.
      </div>

      <div>
        <label className="label">FineGuard API Key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={mockKey}
            readOnly
            className="input font-mono pr-20 bg-gray-50 text-gray-600"
          />
          <button
            type="button"
            onClick={() => setShowKey(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            {showKey ? 'Hide' : 'Reveal'}
          </button>
        </div>
      </div>

      <div>
        <label className="label">Companies House API Key</label>
        <input type="text" className="input font-mono" placeholder="Enter Companies House API key" />
        <p className="text-xs text-gray-400 mt-1">
          Free API key from developer.company-information.service.gov.uk
        </p>
      </div>

      <div>
        <label className="label">HMRC MTD Client ID</label>
        <input type="text" className="input font-mono" placeholder="HMRC MTD Client ID" />
      </div>

      <div>
        <label className="label">HMRC MTD Client Secret</label>
        <input type="password" className="input font-mono" placeholder="HMRC MTD Client Secret" />
      </div>

      <div className="flex gap-2">
        <button className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> Save API Keys
        </button>
        <button className="btn-danger text-xs">Rotate Key</button>
      </div>
    </div>
  );
}
