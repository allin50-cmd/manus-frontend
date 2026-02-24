import { useState } from 'react';
import { Send, Bell, CheckCircle, Loader2, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AlertTriggerPanelProps {
  companyId: string;
  companyName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function AlertTriggerPanel({ companyId, companyName, riskLevel }: AlertTriggerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    issueType: 'filing_due',
    title: '',
    description: '',
    deadline: '',
    channels: ['outlook'] as string[],
  });

  const riskColors: Record<string, { bg: string; border: string; text: string }> = {
    low: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  };

  const colors = riskColors[riskLevel];

  const handleSendAlert = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/alerts/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          companyName,
          issueType: formData.issueType,
          title: formData.title,
          description: formData.description,
          riskLevel: riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1),
          deadline: formData.deadline || undefined,
          triggerType: 'manual',
          channels: formData.channels,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        toast.error(data.error || 'Failed to send alert');
      } else {
        toast.success(`Alert sent to ${data.sentCount} recipient(s)`);
        setIsOpen(false);
        setFormData({ issueType: 'filing_due', title: '', description: '', deadline: '', channels: ['outlook'] });
      }
    } catch (err) {
      toast.error('Failed to send alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Collapsed view */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition ${colors.bg} ${colors.border}`}
        >
          <Bell size={20} className={colors.text} />
          <div className="text-left flex-1">
            <div className="font-semibold text-white">Send Compliance Alert</div>
            <div className="text-xs text-slate-400">Notify clients and advisors</div>
          </div>
          <Send size={18} className={colors.text} />
        </button>
      )}

      {/* Expanded form */}
      {isOpen && (
        <div className={`p-6 rounded-2xl border ${colors.bg} ${colors.border}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell size={20} className={colors.text} />
              Send Alert to {companyName}
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Issue Type */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Issue Type</label>
              <select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="filing_due">Filing Deadline</option>
                <option value="director_change">Director Change</option>
                <option value="accounts_filing">Accounts Filing Due</option>
                <option value="tax_return">Tax Return Due</option>
                <option value="confirmation_statement">Confirmation Statement</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Alert Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Annual Confirmation Statement Due"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the compliance issue and recommended action..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Deadline (optional)</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Delivery Channels</label>
              <div className="space-y-2">
                {[
                  { id: 'outlook', icon: Mail, label: 'Outlook Email' },
                  { id: 'teams', icon: Users, label: 'Microsoft Teams' },
                ].map(({ id, icon: Icon, label }) => (
                  <label key={id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes(id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, channels: [...formData.channels, id] });
                        } else {
                          setFormData({ ...formData, channels: formData.channels.filter((c) => c !== id) });
                        }
                      }}
                      className="rounded accent-blue-500"
                    />
                    <Icon size={16} className="text-blue-400" />
                    <span className="text-sm text-white font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recipients Info */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 flex items-center gap-2">
                <CheckCircle size={14} />
                Alert will be sent to client + assigned advisor
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSendAlert}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Alert
                  </>
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
