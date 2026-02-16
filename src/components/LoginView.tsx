import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { login } from '../utils/api';

interface LoginViewProps {
  onBack: () => void;
  onComplete: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginView({ onBack, onComplete, onSwitchToSignup }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 animate-in fade-in duration-700">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-400 hover:text-white transition mb-12"
      >
        <ArrowLeft size={20} /> Back
      </button>
      <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-12 border border-white/10 shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-4 text-center">Welcome Back</h1>
        <p className="text-slate-400 text-center mb-10">
          Log in to your FineGuard Pro dashboard.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-16 pr-6 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-16 pr-14 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-navy py-5 rounded-full font-black text-lg shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-8">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignup} className="text-blue-400 hover:text-blue-300 font-semibold">
            Sign up free
          </button>
        </p>
      </div>
    </div>
  );
}
