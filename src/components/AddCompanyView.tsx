import React, { useState } from 'react';
import { ArrowLeft, Search, Building, CheckCircle, AlertCircle, Loader2, StickyNote } from 'lucide-react';
import { addCompany, type ComplianceDetail } from '../utils/api';

interface AddCompanyViewProps {
  onBack: () => void;
  onAdded: (companyId: string) => void;
}

export default function AddCompanyView({ onBack, onAdded }: AddCompanyViewProps) {
  const [companyNumber, setCompanyNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ companyId: string; companyName: string; compliance: ComplianceDetail } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await addCompany(companyNumber.trim(), notes.trim() || undefined);
      setResult({
        companyId: data.company.id,
        companyName: data.company.companyName,
        compliance: data.compliance,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-lg mx-auto py-16 animate-in fade-in duration-500">
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Company Added</h2>
          <p className="text-slate-400 mb-8">{result.companyName} is now being monitored.</p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Compliance Status</span>
              <span className={`font-bold capitalize ${
                result.compliance.status === 'compliant' ? 'text-green-400' :
                result.compliance.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>{result.compliance.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Risk Level</span>
              <span className={`font-bold capitalize ${
                result.compliance.riskLevel === 'high' ? 'text-red-400' :
                result.compliance.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
              }`}>{result.compliance.riskLevel}</span>
            </div>
            {result.compliance.overdueFilings.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Overdue Filings</span>
                <span className="font-bold text-red-400">{result.compliance.overdueFilings.length}</span>
              </div>
            )}
            {result.compliance.upcomingDeadlines.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Upcoming Deadlines</span>
                <span className="font-bold text-yellow-400">{result.compliance.upcomingDeadlines.length}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => { setResult(null); setCompanyNumber(''); setNotes(''); }}
              className="flex-1 bg-white/10 border border-white/20 text-white py-4 rounded-full font-bold hover:bg-white/20 transition"
            >
              Add Another
            </button>
            <button
              onClick={() => onAdded(result.companyId)}
              className="flex-1 bg-blue-500 text-navy py-4 rounded-full font-bold hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 animate-in fade-in duration-500">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-400 hover:text-white transition mb-10"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12">
        <div className="text-center mb-10">
          <Building size={48} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-2">Add Company</h2>
          <p className="text-slate-400">Enter a Companies House number to start monitoring.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
            <input
              type="text"
              placeholder="Company number (e.g. 12345678)"
              value={companyNumber}
              onChange={(e) => setCompanyNumber(e.target.value)}
              required
              maxLength={8}
              pattern="[A-Za-z0-9]{2,8}"
              className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-16 pr-6 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-lg tracking-wider"
            />
          </div>
          <div className="relative">
            <StickyNote className="absolute left-6 top-5 text-slate-500" size={24} />
            <textarea
              placeholder="Notes (optional) - e.g. client name, priority"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-16 pr-6 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || companyNumber.trim().length < 2}
            className="w-full bg-blue-500 text-navy py-5 rounded-full font-black text-lg shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Looking up company...
              </>
            ) : (
              <>
                <Search size={20} />
                Search & Monitor
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-600 text-center mt-8">
          We'll fetch real-time data from Companies House and begin compliance monitoring immediately.
        </p>
      </div>
    </div>
  );
}
