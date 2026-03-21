import { Shield, Bell, ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
  backLabel?: string;
}

export function Layout({ children, showBack, backTo, backLabel = 'Back' }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  function handleBack() {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  }

  return (
    <div className="min-h-screen bg-fg-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-fg-border/60 bg-fg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-fg-gold/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-fg-gold" />
            </div>
            <span className="font-semibold text-white text-sm tracking-wide">FineGuard</span>
          </Link>

          <nav className="flex items-center gap-1">
            {!isHome && showBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-fg-muted hover:text-white transition-colors px-2 py-1 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
                {backLabel}
              </button>
            )}
            <Link
              to="/alerts"
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded transition-colors ${
                location.pathname === '/alerts'
                  ? 'text-white bg-white/10'
                  : 'text-fg-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Alerts
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-fg-border/40 py-4 text-center">
        <p className="text-xs text-fg-muted/60">
          FineGuard monitors Companies House deadlines. Data sourced from Companies House.
        </p>
      </footer>
    </div>
  );
}
