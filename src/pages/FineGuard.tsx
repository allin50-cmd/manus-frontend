import { useEffect, useState, useCallback } from 'react';
import { useLocation, useSearch } from 'wouter';
import LandingView from '../components/LandingView';
import LandingSignupModal from '../components/LandingSignupModal';
import BookDemoModal from '../components/BookDemoModal';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function FineGuard() {
  usePageTitle('Home');
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();

  // Signup modal state
  const [signupOpen, setSignupOpen] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupIntent, setSignupIntent] = useState('');
  const [signupPlan, setSignupPlan] = useState('');

  // Demo modal state
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, loading, setLocation]);

  // Auto-open modals from URL params (?signup=true / ?demo=true)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const params = new URLSearchParams(search);
      if (params.get('signup') === 'true') {
        setSignupOpen(true);
        window.history.replaceState({}, '', '/');
      } else if (params.get('demo') === 'true') {
        setDemoEmail(params.get('email') || '');
        setDemoOpen(true);
        window.history.replaceState({}, '', '/');
      }
    }
  }, [search, loading, isAuthenticated]);

  // Listen for custom event from Header "Get Started" button
  const handleOpenSignup = useCallback(() => {
    setSignupEmail('');
    setSignupIntent('');
    setSignupPlan('');
    setSignupOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener('open-landing-signup', handleOpenSignup);
    return () => window.removeEventListener('open-landing-signup', handleOpenSignup);
  }, [handleOpenSignup]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  const openSignupModal = (opts: { email?: string; intent?: string; plan?: string } = {}) => {
    setSignupEmail(opts.email || '');
    setSignupIntent(opts.intent || '');
    setSignupPlan(opts.plan || '');
    setSignupOpen(true);
  };

  const openDemoModal = (email?: string) => {
    setDemoEmail(email || '');
    setDemoOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <LandingView
        onEnterVault={() => setLocation('/login')}
        onBookDemo={openDemoModal}
        onStartMonitoring={() => openSignupModal()}
        onStartWithEmail={(email) => openSignupModal({ email })}
        onStartWithIntent={(intent, plan) => openSignupModal({ intent, plan })}
      />
      <LandingSignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSuccess={() => {
          setSignupOpen(false);
          setLocation('/onboarding');
        }}
        initialEmail={signupEmail}
        initialIntent={signupIntent as any}
        selectedPlan={signupPlan}
      />
      <BookDemoModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        initialEmail={demoEmail}
      />
    </div>
  );
}
