import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, User, Mail, MessageSquare, X, CheckCircle, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BookDemoModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill the email field (e.g. from the hero capture form) */
  initialEmail?: string;
}

export default function BookDemoModal({ open, onClose, initialEmail }: BookDemoModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setName('');
      setEmail(initialEmail || '');
      setMessage('');
      setLoading(false);
      setSubmitted(false);
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  }, [open, initialEmail]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key + focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, source: 'demo_request' }),
      });
      if (!res.ok) {
        throw new Error('Request failed');
      }
      setSubmitted(true);
    } catch {
      toast.error('Something went wrong. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Book a demo"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        ref={modalRef}
        className="relative w-full sm:max-w-md sm:mx-4 bg-[#0F1019] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-[#5A4BFF]/10 animate-in slide-in-from-bottom-4 fade-in duration-300"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <CalendarClock className="w-10 h-10 text-[#5A4BFF] mx-auto mb-3" />
            <h2 className="text-2xl font-black text-white mb-1">Book a Demo</h2>
            <p className="text-slate-400 text-sm">
              See FineGuard in action with a personalised walkthrough.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="demo-name" className="text-slate-300 mb-1.5 block">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    ref={nameInputRef}
                    id="demo-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="demo-email" className="text-slate-300 mb-1.5 block">
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="demo-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.co.uk"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="demo-message" className="text-slate-300 mb-1.5 block">
                  What would you like to see?{' '}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    id="demo-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. ACSP client management, bulk import, alerts…"
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#5A4BFF]/60 focus:ring-2 focus:ring-[#5A4BFF]/20 transition-all resize-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white py-3 rounded-full font-bold text-base"
              >
                {loading ? 'Submitting…' : 'Request Demo'}
              </Button>

              <div className="flex items-center justify-center gap-4 pt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> No spam, ever
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Typically reply within 1 business day
                </span>
              </div>
            </form>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Request received!</h3>
              <p className="text-slate-400 mb-8">
                We'll be in touch within one business day to arrange your personalised demo.
              </p>
              <Button
                onClick={onClose}
                className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-3 rounded-full font-bold"
              >
                Back to FineGuard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
