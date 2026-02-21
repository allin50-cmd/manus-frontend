import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Shield, User, Mail, Lock, Building2, ArrowRight, ArrowLeft,
  Eye, EyeOff, Calculator, FileText, X, CheckCircle, Sparkles,
  Users, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const intents = [
  {
    key: 'accountant',
    icon: Calculator,
    title: 'Accountant / Advisor',
    description: 'Manage client compliance across your practice',
  },
  {
    key: 'business_owner',
    icon: Building2,
    title: 'Business Owner',
    description: 'Monitor your own company compliance',
  },
  {
    key: 'acsp_provider',
    icon: Shield,
    title: 'ACSP Provider',
    description: 'Corporate service provider compliance tools',
  },
  {
    key: 'company_secretary',
    icon: FileText,
    title: 'Company Secretary',
    description: 'Filing and governance management',
  },
] as const;

type IntentKey = (typeof intents)[number]['key'] | 'individual' | '';

interface LandingSignupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Pre-fill email and skip to step 2 */
  initialEmail?: string;
  /** Pre-select intent and skip to step 2 */
  initialIntent?: IntentKey;
  /** Show a plan badge on the form (e.g. "Professional") */
  selectedPlan?: string;
}

export default function LandingSignupModal({
  open,
  onClose,
  onSuccess,
  initialEmail,
  initialIntent,
  selectedPlan,
}: LandingSignupModalProps) {
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedIntent, setSelectedIntent] = useState<IntentKey>('');
  const [advancingFrom, setAdvancingFrom] = useState<IntentKey>(''); // card being auto-advanced
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset and configure when modal opens
  useEffect(() => {
    if (open) {
      setName('');
      setEmail(initialEmail || '');
      setCompany('');
      setPassword('');
      setShowPassword(false);
      setLoading(false);
      setAdvancingFrom('');

      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }

      const hasSkipToStep2 = initialEmail || initialIntent;
      if (hasSkipToStep2) {
        setSelectedIntent(initialIntent || 'individual');
        setStep(2);
      } else {
        setSelectedIntent('');
        setStep(1);
      }
    } else {
      // Clear any pending timer on close
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        setAdvancingFrom('');
      }
    }
  }, [open, initialEmail, initialIntent]);

  // Auto-focus name input when step 2 appears
  useEffect(() => {
    if (open && step === 2) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, step]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && step !== 3) {
      onClose();
    }
  }, [onClose, step]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const companyRequired = selectedIntent === 'accountant' || selectedIntent === 'acsp_provider';
  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;

  // Click a card: highlight it and auto-advance after a short delay
  const handleCardClick = (key: IntentKey) => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setSelectedIntent(key);
    setAdvancingFrom(key);
    autoAdvanceTimer.current = setTimeout(() => {
      setAdvancingFrom('');
      setStep(2);
    }, 380);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (companyRequired && !company.trim()) {
      toast.error('Company name is required for your account type');
      return;
    }
    setLoading(true);
    try {
      await register(email, name, password, company || undefined, selectedIntent || undefined);
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const intentLabel = intents.find((i) => i.key === selectedIntent)?.title;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Create account">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={step === 3 ? undefined : onClose}
      />

      {/* Modal — full-screen on mobile, card on sm+ */}
      <div className="relative w-full sm:max-w-lg sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-[#0F1019] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-[#5A4BFF]/10 animate-in slide-in-from-bottom-4 fade-in duration-300">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Close button */}
        {step !== 3 && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 sm:p-8">
          {/* Header */}
          {step !== 3 && (
            <div className="text-center mb-6">
              <Shield className="w-10 h-10 text-[#5A4BFF] mx-auto mb-3" />
              <h2 className="text-2xl font-black text-white mb-1">Get Started Free</h2>
              {/* Plan badge */}
              {selectedPlan && step === 2 && (
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 text-xs font-bold text-[#5A4BFF] uppercase tracking-wide">
                  <Star className="w-3 h-3" /> {selectedPlan} plan selected
                </div>
              )}
              <p className="text-slate-400 text-sm mt-1">
                {step === 1 ? 'What best describes you?' : intentLabel ? `Signing up as: ${intentLabel}` : 'Create your account'}
              </p>
            </div>
          )}

          {/* Step indicator */}
          {step !== 3 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#5A4BFF]' : 'bg-white/10'}`} />
              <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#5A4BFF]' : 'bg-white/10'}`} />
            </div>
          )}

          {/* Step 1: Intent Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {intents.map(({ key, icon: Icon, title, description }) => {
                  const isSelected = selectedIntent === key;
                  const isAdvancing = advancingFrom === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCardClick(key)}
                      disabled={!!advancingFrom}
                      className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${
                        isSelected
                          ? 'border-[#5A4BFF] bg-[#5A4BFF]/10'
                          : 'border-white/10 bg-white/5 hover:border-[#5A4BFF]/40'
                      }`}
                    >
                      {/* Advancing overlay */}
                      {isAdvancing && (
                        <div className="absolute inset-0 bg-[#5A4BFF]/10 flex items-center justify-center rounded-2xl animate-in fade-in duration-150">
                          <CheckCircle className="w-8 h-8 text-[#5A4BFF] animate-in zoom-in duration-200" />
                        </div>
                      )}
                      <Icon className={`w-7 h-7 mb-2 transition-colors ${isSelected ? 'text-[#5A4BFF]' : 'text-slate-400'}`} />
                      <div className="text-white font-bold text-sm">{title}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{description}</div>
                    </button>
                  );
                })}
              </div>

              {/* Manual continue (fallback if no card selected yet) */}
              {!advancingFrom && (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedIntent}
                  className="w-full bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white py-3 rounded-full font-bold text-base mt-2"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {advancingFrom && (
                <div className="w-full py-3 rounded-full bg-[#5A4BFF]/20 text-center text-sm text-[#5A4BFF] font-bold animate-pulse">
                  Setting up your account…
                </div>
              )}

              <button
                type="button"
                onClick={() => { setSelectedIntent('individual'); setStep(2); }}
                disabled={!!advancingFrom}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
              >
                Skip this step
              </button>
              {/* Trust signal */}
              <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5" />
                <span>Join 5,000+ companies already using FineGuard</span>
              </div>
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="modal-name" className="text-slate-300 mb-1.5 block">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    ref={nameInputRef}
                    id="modal-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="modal-email" className="text-slate-300 mb-1.5 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="modal-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@company.co.uk"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="modal-company" className="text-slate-300 mb-1.5 block">
                  Company {companyRequired ? <span className="text-red-400">*</span> : <span className="text-slate-500 font-normal">(optional)</span>}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="modal-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Ltd"
                    required={companyRequired}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="modal-password" className="text-slate-300 mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          pwStrength >= level
                            ? level === 1 ? 'bg-red-500' : level === 2 ? 'bg-amber-500' : 'bg-green-500'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">
                      {pwStrength === 1 ? 'Weak' : pwStrength === 2 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => { setAdvancingFrom(''); setStep(1); }}
                  variant="outline"
                  className="border-white/10 text-slate-300 hover:bg-white/5 rounded-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white py-3 rounded-full font-bold text-base"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-2">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-[#5A4BFF] hover:underline">Terms</Link> and{' '}
                <Link href="/privacy" className="text-[#5A4BFF] hover:underline">Privacy Policy</Link>.
              </p>
              <div className="flex items-center justify-center gap-4 pt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 256-bit SSL</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> No credit card</span>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Welcome to FineGuard!</h2>
              <p className="text-slate-400 mb-8">
                Your account is ready. Let's set up your first company to monitor.
              </p>
              <Button
                onClick={onSuccess}
                className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-3 rounded-full font-bold text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" /> Start Onboarding <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Sign in link */}
          {step !== 3 && (
            <p className="text-center mt-4 text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-[#5A4BFF] font-medium hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
