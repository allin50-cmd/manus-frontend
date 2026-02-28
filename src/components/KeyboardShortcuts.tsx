import { useEffect, useState, useCallback } from 'react';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: ['Ctrl', 'K'], description: 'Search companies (on dashboard)' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close dialogs and menus' },
  { keys: ['G', 'D'], description: 'Go to Dashboard' },
  { keys: ['G', 'R'], description: 'Go to Reports' },
  { keys: ['G', 'A'], description: 'Go to ACSP' },
  { keys: ['G', 'W'], description: 'Go to Workflows' },
  { keys: ['G', 'H'], description: 'Go to Help' },
];

interface Props {
  onNavigate?: (path: string) => void;
}

export default function KeyboardShortcuts({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [pendingG, setPendingG] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (e.key === 'Escape' && open) {
      setOpen(false);
      return;
    }

    if (isInput) return;

    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setOpen((v) => !v);
      return;
    }

    // "G then X" navigation shortcuts
    if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
      setPendingG(true);
      setTimeout(() => setPendingG(false), 800);
      return;
    }

    if (pendingG && onNavigate) {
      const routes: Record<string, string> = {
        d: '/dashboard',
        r: '/reports',
        a: '/acsp',
        w: '/workflows',
        h: '/help',
      };
      const path = routes[e.key];
      if (path) {
        e.preventDefault();
        onNavigate(path);
      }
      setPendingG(false);
    }
  }, [open, pendingG, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative bg-[#0F1021] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Keyboard size={20} className="text-[#5A4BFF]" />
            <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
          {shortcuts.map((s) => (
            <div key={s.description} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-slate-600 text-xs mx-0.5">+</span>}
                    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 rounded-md bg-white/10 border border-white/10 text-xs font-mono text-slate-300">
                      {k}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-400 font-mono text-[10px]">?</kbd> to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
}
