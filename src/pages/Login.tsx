import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Shield, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Login() {
  usePageTitle('Sign In');
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [errorHint, setErrorHint] = useState('');

  useEffect(() => {
    if (isAuthenticated) setLocation('/dashboard');
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorHint('');
    try {
      await login(email, password);
      setFailedAttempts(0);
      toast.success('Welcome back!');
      setLocation('/dashboard');
    } catch (err: any) {
      const msg = (err.message || 'Login failed').toLowerCase();
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);

      if (msg.includes('not found') || msg.includes('no account')) {
        setErrorHint('No account found with this email. Check for typos or create a new account.');
      } else if (msg.includes('password') || msg.includes('invalid credentials') || msg.includes('incorrect')) {
        setErrorHint(attempts >= 3
          ? 'Multiple failed attempts. Try resetting your password.'
          : 'Incorrect password. Please try again.');
      } else if (msg.includes('locked') || msg.includes('too many')) {
        setErrorHint('Account temporarily locked due to too many failed attempts. Please try again later or reset your password.');
      } else {
        setErrorHint('Unable to sign in. Please check your credentials and try again.');
      }
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-[#5A4BFF] mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your FineGuard account</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          {errorHint && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-red-300">{errorHint}</p>
                {failedAttempts >= 3 && (
                  <Link href="/forgot-password" className="text-sm text-[#5A4BFF] hover:underline mt-1 inline-block font-medium">
                    Reset your password
                  </Link>
                )}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="login-email" className="text-slate-300 mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.co.uk"
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="login-password" className="text-slate-300 mb-1.5 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white py-3 rounded-full font-bold text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-400">
          Don't have an account?{' '}
          <Link href="/?signup=true" className="text-[#5A4BFF] font-medium hover:underline">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
