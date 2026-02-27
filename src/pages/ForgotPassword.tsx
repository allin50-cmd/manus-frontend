import { useState, useEffect } from 'react';
import { useLocation, Link, useSearch } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { requestPasswordReset, resetPassword } from '../utils/api';
import { toast } from 'sonner';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ForgotPassword() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();

  // Determine mode from URL: ?token=<value> means reset, otherwise request
  const token = new URLSearchParams(search).get('token');
  const mode: 'request' | 'reset' = token ? 'reset' : 'request';

  usePageTitle(mode === 'request' ? 'Forgot Password' : 'Reset Password');

  // Request mode state
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset mode state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    if (isAuthenticated) setLocation('/dashboard');
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) return null;

  const pwStrength = newPassword.length === 0 ? 0 : newPassword.length < 8 ? 1 : newPassword.length < 12 ? 2 : 3;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token!, newPassword);
      setResetDone(true);
      toast.success('Password reset successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-[#5A4BFF] mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white mb-2">
            {mode === 'request' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-slate-400">
            {mode === 'request'
              ? "Enter your email and we'll send you a reset link"
              : 'Choose a new password for your account'}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          {/* REQUEST MODE — email form */}
          {mode === 'request' && !sent && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <Label htmlFor="reset-email" className="text-slate-300 mb-1.5 block">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.co.uk"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white py-3 rounded-full font-bold text-base"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {/* REQUEST MODE — success confirmation */}
          {mode === 'request' && sent && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Check your inbox</h2>
              <p className="text-slate-400 text-sm mb-6">
                If an account exists for <span className="text-white font-medium">{email}</span>, we've sent a password reset link. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Try a different email
              </button>
            </div>
          )}

          {/* RESET MODE — new password form */}
          {mode === 'reset' && !resetDone && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <Label htmlFor="new-password" className="text-slate-300 mb-1.5 block">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    autoFocus
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
                {newPassword.length > 0 && (
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
              <div>
                <Label htmlFor="confirm-password" className="text-slate-300 mb-1.5 block">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white py-3 rounded-full font-bold text-base"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* RESET MODE — success */}
          {mode === 'reset' && resetDone && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Password Reset</h2>
              <p className="text-slate-400 text-sm mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-6 py-3 rounded-full font-bold text-sm transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-slate-400">
          <Link href="/login" className="text-[#5A4BFF] font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
