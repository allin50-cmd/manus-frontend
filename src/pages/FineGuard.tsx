import { useEffect } from 'react';
import { useLocation } from 'wouter';
import LandingView from '../components/LandingView';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function FineGuard() {
  usePageTitle('Home');
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, loading, setLocation]);

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
        onStartMonitoring={() => setLocation('/signup')}
      />
    </div>
  );
}
