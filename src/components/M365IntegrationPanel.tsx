import { useState, useEffect } from 'react';
import { Cloud, CheckCircle, AlertCircle, Mail, Users, Zap, ExternalLink, Loader2 } from 'lucide-react';
import { fetchM365Status, fetchM365ConfigGuide, sendM365TestNotification, type M365Status, type M365ConfigStep } from '../utils/api';
import { toast } from 'sonner';

export default function M365IntegrationPanel() {
  const [status, setStatus] = useState<M365Status | null>(null);
  const [guide, setGuide] = useState<M365ConfigStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingChannel, setTestingChannel] = useState<'outlook' | null>(null);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadM365Info();
  }, []);

  const loadM365Info = async () => {
    setLoading(true);
    try {
      const [statusData, guideData] = await Promise.all([
        fetchM365Status().catch(() => null),
        fetchM365ConfigGuide().catch(() => null),
      ]);

      if (statusData) setStatus(statusData);
      if (guideData) setGuide(guideData.steps);
    } catch (err) {
      console.error('Failed to load M365 info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!testEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setTestingChannel('outlook');
    try {
      const result = await sendM365TestNotification('outlook', testEmail.trim());
      toast.success(result.message);
      setTestEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test notification');
    } finally {
      setTestingChannel(null);
    }
  };

  const configured = status?.configured ?? false;

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30">
            <Cloud size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Microsoft 365 Integration</h3>
            <p className="text-sm text-slate-400 mt-1">
              {configured ? 'Connected and ready' : 'Not configured — set up for Teams, Outlook, and SharePoint'}
            </p>
          </div>
        </div>
        {configured && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-xs font-semibold text-green-400">CONNECTED</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : configured ? (
        <>
          {/* Services Status */}
          <div className="mb-8">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Services Available</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Microsoft Graph API', key: 'graphApi', icon: Zap },
                { name: 'Teams Bot & Notifications', key: 'teamsBot', icon: Users },
                { name: 'Outlook Email & Calendar', key: 'outlookNotifications', icon: Mail },
              ].map(({ name, key, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <Icon size={18} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{name}</span>
                  {status?.services[key as keyof typeof status.services] && (
                    <CheckCircle size={16} className="text-green-400 ml-auto flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Test Notification */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-3">Test Outlook Integration</h4>
            <p className="text-xs text-slate-400 mb-4">
              Send yourself a test email to verify the integration is working.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={testingChannel === 'outlook'}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={handleTestNotification}
                disabled={testingChannel === 'outlook'}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 font-semibold text-sm hover:bg-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testingChannel === 'outlook' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Sending...
                  </>
                ) : (
                  'Test'
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Configuration Guide */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Setup Steps</h4>
            <div className="space-y-3">
              {guide.map((step) => (
                <div
                  key={step.step}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition ${
                    step.completed
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle size={20} className="text-green-400 mt-0.5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white mt-0.5">
                        {step.step}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-400 mb-2">Setup Required</p>
              <p className="text-xs text-slate-300 mb-3">
                To enable Microsoft 365 integration, you'll need to register an app in Azure AD and configure environment variables.
              </p>
              <a
                href="https://github.com/anthropics/manus-frontend/tree/main/integrations/m365"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                View Setup Guide <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
