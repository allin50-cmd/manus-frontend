import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { addCompany, updateProfile, updateAlertPreferences } from '../utils/api';
import { toast } from 'sonner';
import {
  Building2, Bell, CheckCircle, ArrowRight,
  ArrowLeft, Sparkles, Search, Loader2, AlertCircle, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clsx } from 'clsx';
import { usePageTitle } from '../hooks/usePageTitle';

import { Cloud } from 'lucide-react';

const steps = [
  { id: 1, title: 'Welcome', icon: Sparkles },
  { id: 2, title: 'Add Company', icon: Building2 },
  { id: 3, title: 'Alerts', icon: Bell },
  { id: 4, title: 'Microsoft 365', icon: Cloud },
  { id: 5, title: 'Ready', icon: CheckCircle },
];

export default function Onboarding() {
  usePageTitle('Get Started');
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [companyNumber, setCompanyNumber] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [companyAdded, setCompanyAdded] = useState(false);
  const [alertPrefs, setAlertPrefs] = useState({
    filingDeadlines: true,
    overdueAlerts: true,
    directorChanges: true,
    weeklyDigest: false,
  });

  if (!isAuthenticated) {
    setLocation('/signup');
    return null;
  }

  const intent = user?.userIntent;
  const isAdvisor = intent === 'accountant' || intent === 'acsp_provider';

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const prev = () => { setCompanyError(''); setStep((s) => Math.max(s - 1, 1)); };

  const handleStep2Continue = async () => {
    if (!companyNumber.trim()) {
      next();
      return;
    }
    if (companyAdded) {
      next();
      return;
    }
    setAddingCompany(true);
    setCompanyError('');
    try {
      await addCompany(companyNumber.trim());
      setCompanyAdded(true);
      toast.success('Company added to monitoring!');
      next();
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : 'Failed to add company');
    } finally {
      setAddingCompany(false);
    }
  };

  const handleComplete = async () => {
    try {
      await updateProfile({ onboardingComplete: true });
      await refreshUser();
    } catch {
      toast.error('Could not save profile — your progress may not be saved');
    }
    try {
      await updateAlertPreferences(alertPrefs);
    } catch {
      toast.error('Could not save alert preferences — you can update them later in Settings');
    }
    if (isAdvisor) {
      setLocation('/acsp');
    } else {
      setLocation('/dashboard');
    }
  };

  const handleSkip = async () => {
    try {
      await updateProfile({ onboardingComplete: true });
    } catch {
      toast.error('Could not save profile — your progress may not be saved');
    }
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                step >= s.id ? 'bg-[#5A4BFF] text-white shadow-lg shadow-[#5A4BFF]/30' : 'bg-white/5 text-slate-500 border border-white/10'
              )}>
                <s.icon className="w-5 h-5" />
              </div>
              {i < steps.length - 1 && (
                <div className={clsx('w-12 sm:w-16 h-0.5 rounded-full transition-all', step > s.id ? 'bg-[#5A4BFF]' : 'bg-white/10')} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10">
          {step === 1 && (
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
              <h2 className="text-3xl font-black text-white mb-4">
                Welcome, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                {isAdvisor
                  ? "Let's set up your FineGuard account. You'll be managing client compliance in no time."
                  : "Let's set up your FineGuard account in under 2 minutes. You'll be monitoring your first company before you know it."
                }
              </p>
              <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
                {(isAdvisor ? [
                  'Add your first client company',
                  'Configure alert preferences',
                  'Access ACSP management tools',
                ] : [
                  'Add your first company to monitor',
                  'Configure alert preferences',
                  'Start receiving compliance updates',
                ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <Building2 className="w-12 h-12 text-[#5A4BFF] mx-auto mb-6" />
              <h2 className="text-2xl font-black text-white mb-2 text-center">Add Your First Company</h2>
              <p className="text-slate-400 text-center mb-8">Enter a Companies House number to start monitoring.</p>
              <div className="max-w-sm mx-auto">
                {companyError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{companyError}</p>
                  </div>
                )}
                {companyAdded && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-green-400 text-sm">Company added successfully!</p>
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={companyNumber}
                    onChange={(e) => {
                      setCompanyNumber(e.target.value);
                      setCompanyError('');
                      setCompanyAdded(false);
                    }}
                    placeholder="e.g. 12345678"
                    disabled={addingCompany}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-center"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">You can always add more companies later from your dashboard.</p>
                {isAdvisor && (
                  <div className="mt-4 p-3 bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-[#5A4BFF]">
                      <Upload className="w-4 h-4" />
                      <span className="font-medium">Managing many clients?</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      After setup, use the ACSP Import tool to bulk-import clients from a spreadsheet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <Bell className="w-12 h-12 text-[#5A4BFF] mx-auto mb-6" />
              <h2 className="text-2xl font-black text-white mb-2 text-center">Alert Preferences</h2>
              <p className="text-slate-400 text-center mb-8">Choose how you want to be notified.</p>
              <div className="space-y-3 max-w-sm mx-auto">
                {([
                  { key: 'filingDeadlines' as const, label: 'Filing deadline reminders', desc: '7 days before due' },
                  { key: 'overdueAlerts' as const, label: 'Overdue filing alerts', desc: 'Immediately when overdue' },
                  { key: 'directorChanges' as const, label: 'Director changes', desc: 'When changes are detected' },
                  { key: 'weeklyDigest' as const, label: 'Weekly digest email', desc: 'Summary every Monday' },
                ]).map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                    <div>
                      <p className="text-sm font-medium text-white">{pref.label}</p>
                      <p className="text-xs text-slate-500">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertPrefs[pref.key]}
                        onChange={() => setAlertPrefs((prev) => ({ ...prev, [pref.key]: !prev[pref.key] }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#5A4BFF] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <Cloud className="w-12 h-12 text-[#5A4BFF] mx-auto mb-6" />
              <h2 className="text-2xl font-black text-white mb-2 text-center">Microsoft 365 Integration</h2>
              <p className="text-slate-400 text-center mb-8">Connect FineGuard with Teams, Outlook, and Power Automate (optional).</p>
              <div className="max-w-sm mx-auto space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-white">Get alerts in Teams chat</p>
                  </div>
                  <p className="text-xs text-slate-400">Compliance alerts delivered to your team directly in Microsoft Teams.</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-white">Email reminders in Outlook</p>
                  </div>
                  <p className="text-xs text-slate-400">Filing deadline reminders sent to your inbox with calendar integration.</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-white">Power Automate flows</p>
                  </div>
                  <p className="text-xs text-slate-400">Trigger custom workflows and integrations with your cloud services.</p>
                </div>
              </div>
              <p className="text-center text-xs text-slate-500 mt-6">
                You can skip this step and set up M365 later from your dashboard.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">You're All Set!</h2>
              <p className="text-lg text-slate-400 mb-8">
                {isAdvisor
                  ? 'Your account is ready. Head to the ACSP management panel to start managing clients.'
                  : 'Your FineGuard account is ready. Head to your dashboard to start monitoring companies.'
                }
              </p>
              <Button
                onClick={handleComplete}
                className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-3 rounded-full font-bold text-lg"
              >
                {isAdvisor ? 'Go to ACSP Panel' : 'Go to Dashboard'} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex items-center justify-between mt-10">
              {step > 1 ? (
                <button onClick={prev} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}
              <Button
                onClick={step === 2 ? handleStep2Continue : next}
                disabled={addingCompany}
                className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-6 py-2.5 rounded-full font-bold"
              >
                {addingCompany ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                ) : (
                  <>{step === 1 ? "Let's Go" : 'Continue'} <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Skip */}
        {step < 5 && (
          <p className="text-center mt-6">
            <button onClick={handleSkip} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Skip setup and go to dashboard
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
