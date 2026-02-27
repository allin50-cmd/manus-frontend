import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import {
  addCompany, updateProfile, updateAlertPreferences,
  searchCompanies, addTeamMember,
} from '../utils/api';
import type { CompanySearchResult } from '../utils/api';
import { toast } from 'sonner';
import {
  Building2, Bell, CheckCircle, ArrowRight,
  ArrowLeft, Sparkles, Search, Loader2, AlertCircle, Upload,
  ChevronDown, ChevronUp, UserPlus, Mail, Lightbulb,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clsx } from 'clsx';
import { usePageTitle } from '../hooks/usePageTitle';

// ---------------------------------------------------------------------------
// Step definitions (3 steps)
// ---------------------------------------------------------------------------

const steps = [
  { id: 1, title: 'Setup', icon: Sparkles },
  { id: 2, title: 'Preferences', icon: Bell },
  { id: 3, title: 'Ready', icon: CheckCircle },
];

// ---------------------------------------------------------------------------
// Progress persistence helpers
// ---------------------------------------------------------------------------

const PROGRESS_KEY = 'fineguard_onboarding_progress';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

interface AlertPrefsState {
  filingDeadlines: boolean;
  overdueAlerts: boolean;
  directorChanges: boolean;
  weeklyDigest: boolean;
}

interface OnboardingProgress {
  userId: string;
  currentStep: number;
  companyNumber: string;
  companyAdded: boolean;
  alertPrefs: AlertPrefsState;
  teamEmail: string;
  updatedAt: number;
}

function loadProgress(userId: string): Partial<OnboardingProgress> | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const p: OnboardingProgress = JSON.parse(raw);
    if (p.userId !== userId) return null;
    if (Date.now() - p.updatedAt > SEVEN_DAYS) {
      localStorage.removeItem(PROGRESS_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

function saveProgress(data: OnboardingProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch { /* quota exceeded — ignore */ }
}

function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

// ---------------------------------------------------------------------------
// Alert‐preference defaults by intent
// ---------------------------------------------------------------------------

function getDefaultAlertPrefs(intent?: string): AlertPrefsState {
  const isAdvisor = intent === 'accountant' || intent === 'acsp_provider';
  return {
    filingDeadlines: true,
    overdueAlerts: true,
    directorChanges: isAdvisor || intent === 'company_secretary',
    weeklyDigest: isAdvisor,
  };
}

// ---------------------------------------------------------------------------
// Personalisation content
// ---------------------------------------------------------------------------

function getChecklist(isAdvisor: boolean, intent?: string) {
  if (isAdvisor) {
    return [
      'Add your first client company',
      'Configure alert preferences',
      'Access ACSP management tools',
    ];
  }
  if (intent === 'company_secretary') {
    return [
      'Add the company you manage',
      'Configure filing alerts',
      'Set up governance reminders',
    ];
  }
  return [
    'Add your first company to monitor',
    'Configure alert preferences',
    'Start receiving compliance updates',
  ];
}

function getGreeting(isAdvisor: boolean, intent?: string) {
  if (isAdvisor) return "Let's set up your FineGuard account. You'll be managing client compliance in no time.";
  if (intent === 'company_secretary') return "Let's set up your governance dashboard. Filing and compliance tracking starts here.";
  return "Let's set up your FineGuard account in under 2 minutes. You'll be monitoring your first company before you know it.";
}

function getSearchPlaceholder(isAdvisor: boolean, intent?: string) {
  if (isAdvisor) return 'Search for a client company…';
  if (intent === 'company_secretary') return 'Search for the company you manage…';
  return 'Search for your company…';
}

function getQuickTips(isAdvisor: boolean, intent?: string) {
  if (isAdvisor) {
    return [
      'Import clients in bulk via the ACSP panel',
      'Set up team roles for your practice',
      'Review your compliance dashboard',
    ];
  }
  if (intent === 'company_secretary') {
    return [
      'Review upcoming filing deadlines',
      'Set up director change alerts',
      'Add governance contacts to your team',
    ];
  }
  return [
    "Check your company's compliance status",
    'Set up a weekly digest for updates',
    'Add more companies from your dashboard',
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Onboarding() {
  usePageTitle('Get Started');
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [, setLocation] = useLocation();

  // Step & direction
  const [step, setStep] = useState(1);
  const directionRef = useRef<'forward' | 'backward'>('forward');

  // Step 1 — company search
  const [searchMode, setSearchMode] = useState<'name' | 'number'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [companyAdded, setCompanyAdded] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);

  // Step 2 — alert prefs
  const [alertPrefs, setAlertPrefs] = useState(() => getDefaultAlertPrefs(user?.userIntent));

  // Step 2 — optional team invite
  const [showTeamInvite, setShowTeamInvite] = useState(false);
  const [teamEmail, setTeamEmail] = useState('');

  // Completion loading
  const [completing, setCompleting] = useState(false);

  // ------ Auth guard ------
  useEffect(() => {
    if (!isAuthenticated) setLocation('/?signup=true');
  }, [isAuthenticated, setLocation]);

  // ------ Restore progress ------
  useEffect(() => {
    if (!user?.id) return;
    const p = loadProgress(user.id);
    if (p) {
      if (p.currentStep && p.currentStep >= 1 && p.currentStep <= 3) setStep(p.currentStep);
      if (p.companyNumber) setCompanyNumber(p.companyNumber);
      if (p.companyAdded) setCompanyAdded(true);
      if (p.alertPrefs) setAlertPrefs(p.alertPrefs);
      if (p.teamEmail) setTeamEmail(p.teamEmail);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ------ Persist progress on step/state changes ------
  const persistProgress = useCallback(() => {
    if (!user?.id) return;
    saveProgress({
      userId: user.id,
      currentStep: step,
      companyNumber,
      companyAdded,
      alertPrefs,
      teamEmail,
      updatedAt: Date.now(),
    });
  }, [user?.id, step, companyNumber, companyAdded, alertPrefs, teamEmail]);

  useEffect(() => { persistProgress(); }, [persistProgress]);

  // ------ Company name search (debounced) ------
  useEffect(() => {
    if (searchMode !== 'name' || searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchCompanies(searchQuery, 8, 'name');
        setSearchResults(results);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, searchMode]);

  // ------ Keyboard navigation for search dropdown ------
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? searchResults.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectCompany(searchResults[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setHighlightedIndex(-1);
    }
  };

  // Reset highlight when results change
  useEffect(() => { setHighlightedIndex(-1); }, [searchResults]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && resultListRef.current) {
      const el = resultListRef.current.children[highlightedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // ------ Click outside to close dropdown ------
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isAuthenticated) return null;

  const intent = user?.userIntent;
  const isAdvisor = intent === 'accountant' || intent === 'acsp_provider';

  // ------ Navigation helpers ------
  const next = () => {
    directionRef.current = 'forward';
    setStep((s) => Math.min(s + 1, 3));
  };
  const prev = () => {
    directionRef.current = 'backward';
    setCompanyError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  // ------ Select a company from search results ------
  const handleSelectCompany = (result: CompanySearchResult) => {
    setCompanyNumber(result.companyNumber);
    setSelectedCompanyName(result.companyName);
    setSearchQuery(result.companyName);
    setShowResults(false);
    setCompanyError('');
    setCompanyAdded(false);
  };

  // ------ Add selected company ------
  const handleAddCompany = async () => {
    const num = companyNumber.trim();
    if (!num) {
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
      await addCompany(num);
      setCompanyAdded(true);
      toast.success('Company added to monitoring!');
      next();
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : 'Failed to add company');
    } finally {
      setAddingCompany(false);
    }
  };

  // ------ Complete onboarding ------
  const handleComplete = async () => {
    setCompleting(true);
    try {
      await updateProfile({ onboardingComplete: true });
      await refreshUser();
    } catch {
      toast.error('Could not save profile — your progress may not be saved');
    }
    try {
      await updateAlertPreferences({ ...alertPrefs });
    } catch {
      toast.error('Could not save alert preferences — you can update them later in Settings');
    }
    // Optional team invite
    if (teamEmail.trim()) {
      try {
        await addTeamMember({ name: teamEmail.trim().split('@')[0], email: teamEmail.trim() });
        toast.success('Team invite sent!');
      } catch {
        toast.error('Could not send team invite — you can add members later');
      }
    }
    clearProgress();
    setCompleting(false);
    if (isAdvisor) {
      setLocation('/acsp');
    } else {
      setLocation('/dashboard');
    }
  };

  // ------ Skip entire onboarding ------
  const handleSkip = async () => {
    try {
      await updateProfile({ onboardingComplete: true });
    } catch {
      toast.error('Could not save profile — your progress may not be saved');
    }
    clearProgress();
    setLocation('/dashboard');
  };

  // ------ Slide animation class ------
  const slideClass = directionRef.current === 'forward' ? 'step-forward' : 'step-backward';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress bar — 3 circles with labels */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  step >= s.id
                    ? 'bg-[#5A4BFF] text-white shadow-lg shadow-[#5A4BFF]/30'
                    : 'bg-white/5 text-slate-500 border border-white/10',
                )}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={clsx(
                  'text-[10px] font-medium transition-colors duration-300',
                  step >= s.id ? 'text-[#5A4BFF]' : 'text-slate-600',
                )}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={clsx(
                  'w-16 sm:w-20 h-0.5 rounded-full transition-all duration-300 mb-5',
                  step > s.id ? 'bg-[#5A4BFF]' : 'bg-white/10',
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step content — animated */}
        <div key={step} className={slideClass}>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10">

            {/* ═══════════════════════════════════════ */}
            {/* STEP 1: Welcome + Add Company           */}
            {/* ═══════════════════════════════════════ */}
            {step === 1 && (
              <div>
                {/* Welcome section */}
                <div className="text-center mb-8">
                  <Sparkles className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
                  <h2 className="text-3xl font-black text-white mb-4">
                    Welcome, {user?.name?.split(' ')[0]}!
                  </h2>
                  <p className="text-lg text-slate-400 leading-relaxed">
                    {getGreeting(isAdvisor, intent)}
                  </p>
                </div>

                {/* Checklist */}
                <div className="space-y-3 max-w-sm mx-auto mb-8">
                  {getChecklist(isAdvisor, intent).map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Company search section */}
                <div className="border-t border-white/10 pt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-[#5A4BFF]" />
                    <h3 className="text-lg font-bold text-white">
                      {isAdvisor ? 'Add Your First Client' : 'Add Your Company'}
                    </h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">
                    {searchMode === 'name'
                      ? 'Search by company name to find it in the Companies House register.'
                      : 'Enter the 8-digit Companies House number directly.'}
                  </p>

                  {/* Error / Success messages */}
                  {companyError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{companyError}</p>
                    </div>
                  )}
                  {companyAdded && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <p className="text-green-400 text-sm">
                        {selectedCompanyName ? `${selectedCompanyName} added successfully!` : 'Company added successfully!'}
                      </p>
                    </div>
                  )}

                  {/* Search by name */}
                  {searchMode === 'name' && (
                    <div ref={searchContainerRef} className="relative max-w-sm mx-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
                      <Input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCompanyError('');
                          setCompanyAdded(false);
                          setCompanyNumber('');
                          setSelectedCompanyName('');
                        }}
                        onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder={getSearchPlaceholder(isAdvisor, intent)}
                        disabled={addingCompany}
                        className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                        role="combobox"
                        aria-expanded={showResults && searchResults.length > 0}
                        aria-activedescendant={highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined}
                      />

                      {/* Search results dropdown */}
                      {showResults && searchResults.length > 0 && (
                        <div
                          ref={resultListRef}
                          role="listbox"
                          className="absolute z-20 top-full mt-1 w-full bg-[#111327] border border-white/10 rounded-xl shadow-xl max-h-64 overflow-y-auto"
                        >
                          {searchResults.map((r, idx) => (
                            <button
                              key={r.companyNumber}
                              id={`search-result-${idx}`}
                              role="option"
                              aria-selected={highlightedIndex === idx}
                              type="button"
                              onClick={() => handleSelectCompany(r)}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              className={clsx(
                                'w-full text-left px-4 py-3 transition-colors border-b border-white/5 last:border-b-0',
                                highlightedIndex === idx ? 'bg-white/10' : 'hover:bg-white/5',
                              )}
                            >
                              <p className="text-sm font-medium text-white truncate">{r.companyName}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-slate-500">{r.companyNumber}</span>
                                {r.companyStatus && (
                                  <span className={clsx(
                                    'text-xs',
                                    r.companyStatus.toLowerCase() === 'active' ? 'text-green-400' : 'text-amber-400',
                                  )}>
                                    {r.companyStatus}
                                  </span>
                                )}
                                {r.postTown && <span className="text-xs text-slate-500">{r.postTown}</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-[#111327] border border-white/10 rounded-xl shadow-xl px-4 py-3">
                          <p className="text-sm text-slate-400">No companies found. Try a different search or enter the number directly.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Search by number (fallback) */}
                  {searchMode === 'number' && (
                    <div className="relative max-w-sm mx-auto">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                  )}

                  {/* Selected company preview */}
                  {companyNumber && !companyAdded && searchMode === 'name' && selectedCompanyName && (
                    <div className="max-w-sm mx-auto mt-3 p-3 bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{selectedCompanyName}</p>
                        <p className="text-xs text-slate-400">{companyNumber}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-[#5A4BFF]" />
                    </div>
                  )}

                  {/* Mode toggle */}
                  <div className="max-w-sm mx-auto mt-3 text-center">
                    <button
                      onClick={() => {
                        setSearchMode(searchMode === 'name' ? 'number' : 'name');
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowResults(false);
                        setCompanyError('');
                      }}
                      className="text-xs text-[#5A4BFF] hover:text-[#6B5BFF] transition-colors"
                    >
                      {searchMode === 'name' ? 'Know the company number? Enter it directly' : 'Search by company name instead'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 text-center">
                    You can always add more companies later from your dashboard.
                  </p>

                  {/* Advisor bulk-import callout */}
                  {isAdvisor && (
                    <div className="max-w-sm mx-auto mt-4 p-3 bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 rounded-xl">
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

            {/* ═══════════════════════════════════════ */}
            {/* STEP 2: Alert Preferences + Team Invite */}
            {/* ═══════════════════════════════════════ */}
            {step === 2 && (
              <div>
                <Bell className="w-12 h-12 text-[#5A4BFF] mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white mb-2 text-center">Alert Preferences</h2>
                <p className="text-slate-400 text-center mb-8">Choose how you want to be notified about compliance changes.</p>

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

                {/* Optional team invite */}
                <div className="max-w-sm mx-auto mt-6">
                  <button
                    onClick={() => setShowTeamInvite(!showTeamInvite)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite a team member</span>
                    {showTeamInvite ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                  </button>

                  {showTeamInvite && (
                    <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl animate-in">
                      <p className="text-xs text-slate-400 mb-3">They'll get an invite to join your team on FineGuard.</p>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={teamEmail}
                          onChange={(e) => setTeamEmail(e.target.value)}
                          type="email"
                          placeholder="colleague@company.co.uk"
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* STEP 3: All Set + Quick Tips             */}
            {/* ═══════════════════════════════════════ */}
            {step === 3 && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 pulse-glow" style={{ '--tw-shadow-color': 'rgba(34, 197, 94, 0.2)' } as React.CSSProperties}>
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">You're All Set!</h2>
                <p className="text-lg text-slate-400 mb-8">
                  {isAdvisor
                    ? 'Your account is ready. Head to the ACSP management panel to start managing clients.'
                    : 'Your FineGuard account is ready. Head to your dashboard to start monitoring companies.'}
                </p>

                {/* Quick-start tips */}
                <div className="text-left max-w-sm mx-auto mb-8 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">Quick-start tips</span>
                  </div>
                  {getQuickTips(isAdvisor, intent).map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 pl-1">
                      <span className="text-xs text-[#5A4BFF] font-bold mt-0.5">{i + 1}.</span>
                      <span className="text-sm text-slate-400">{tip}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={completing}
                  className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-3 rounded-full font-bold text-lg"
                >
                  {completing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Finishing…</>
                  ) : (
                    <>{isAdvisor ? 'Go to ACSP Panel' : 'Go to Dashboard'} <ArrowRight className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              </div>
            )}

            {/* Navigation buttons (steps 1 & 2) */}
            {step < 3 && (
              <div className="flex items-center justify-between mt-10">
                {step > 1 ? (
                  <button onClick={prev} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div />
                )}
                <Button
                  onClick={step === 1 ? handleAddCompany : next}
                  disabled={addingCompany}
                  className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-6 py-2.5 rounded-full font-bold"
                >
                  {addingCompany ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…</>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Skip link */}
          {step < 3 && (
            <p className="text-center mt-6">
              <button onClick={handleSkip} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Skip setup and go to dashboard
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
