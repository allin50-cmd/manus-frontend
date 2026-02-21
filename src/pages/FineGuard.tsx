import { useEffect, useState, useCallback } from 'react';
import { useLocation, useSearch } from 'wouter';
import LandingView from '../components/LandingView';
import LandingSignupModal from '../components/LandingSignupModal';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function FineGuard() {
  usePageTitle('Home');
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [signupOpen, setSignupOpen] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, loading, setLocation]);

  // Auto-open signup modal from ?signup=true query param
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const params = new URLSearchParams(search);
      if (params.get('signup') === 'true') {
        setSignupOpen(true);
        // Clean up the URL
        window.history.replaceState({}, '', '/');
      }
    }
  }, [search, loading, isAuthenticated]);

  // Listen for custom event from Header "Get Started" button
  const handleOpenSignup = useCallback(() => {
    setSignupEmail('');
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

  return (
    <div className="max-w-7xl mx-auto px-4">
      <LandingView
        onEnterVault={() => setLocation('/login')}
        onBookDemo={() => setLocation('/book-demo')}
        onStartMonitoring={() => { setSignupEmail(''); setSignupOpen(true); }}
        onStartWithEmail={(email) => { setSignupEmail(email); setSignupOpen(true); }}
      />
      <LandingSignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSuccess={() => {
          setSignupOpen(false);
          setLocation('/onboarding');
        }}
        initialEmail={signupEmail}
      />
    </div>
  );
}
