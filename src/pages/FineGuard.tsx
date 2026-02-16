import { useState } from 'react';
import { useLocation } from 'wouter';
import LandingView from '../components/LandingView';
import SignupView from '../components/SignupView';
import { VIEWS, ViewType } from '../utils/constants';

export default function FineGuard() {
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<ViewType>(VIEWS.LANDING);
  const [hologram] = useState<string | undefined>(undefined);

  const handleBookDemo = () => {
    // Opens Calendly link; falls back to the existing book-demo page
    window.open('https://calendly.com/fineguard/demo', '_blank');
  };

  const handleStartMonitoring = () => {
    setCurrentView(VIEWS.SIGNUP);
  };

  const handleSignupComplete = () => {
    // Navigate to the compliance bundle (vault) after signup
    setLocation('/compliance-bundle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0B14] via-[#111327] to-[#0A0B14]">
      <div className="max-w-7xl mx-auto px-4">
        {currentView === VIEWS.LANDING && (
          <LandingView
            onEnterVault={() => setLocation('/compliance-bundle')}
            onBookDemo={handleBookDemo}
            onStartMonitoring={handleStartMonitoring}
            hologram={hologram}
          />
        )}
        {currentView === VIEWS.SIGNUP && (
          <SignupView
            onBack={() => setCurrentView(VIEWS.LANDING)}
            onComplete={handleSignupComplete}
          />
        )}
      </div>
    </div>
  );
}
