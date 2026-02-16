import React, { useState } from 'react';
import { ArrowLeft, Mail, Building, Lock } from 'lucide-react';

interface SignupViewProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function SignupView({ onBack, onComplete }: SignupViewProps) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Send data to backend or create Firebase user
    await new Promise(resolve => setTimeout(resolve, 1000)); // simulate
    setLoading(false);
    onComplete(); // proceed to vault
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
        <h1 className="text-4xl font-black text-white mb-4 text-center">Start Monitoring</h1>
        <p className="text-slate-400 text-center mb-10">
          Enter your details to begin protecting your companies.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
            <input
              type="email"
              placeholder="Work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-16 pr-6 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Building className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
            <input
              type="text"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-16 pr-6 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-navy py-5 rounded-full font-black text-lg shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? 'Creating account...' : 'Start Free Monitoring'}
            {!loading && <Lock size={20} />}
          </button>
        </form>
        <p className="text-xs text-slate-600 text-center mt-8">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
