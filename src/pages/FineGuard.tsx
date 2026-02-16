import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import LandingView from '../components/LandingView';
import SignupView from '../components/SignupView';
import LoginView from '../components/LoginView';
import UserDashboard from '../components/UserDashboard';
import AddCompanyView from '../components/AddCompanyView';
import CompanyDetailView from '../components/CompanyDetailView';
import AlertsView from '../components/AlertsView';
import UserSettings from '../components/UserSettings';
import { VIEWS, ViewType } from '../utils/constants';
import { getToken, getSavedUser, fetchMe, logout, clearAuth, type UserProfile } from '../utils/api';

export default function FineGuard() {
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<ViewType>(VIEWS.LANDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [hologram] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await fetchMe();
        setUser(me);
        setCurrentView(VIEWS.DASHBOARD);
      } catch {
        // Token expired or invalid
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleBookDemo = () => {
    window.open('https://calendly.com/fineguard/demo', '_blank');
  };

  const handleStartMonitoring = () => {
    setCurrentView(VIEWS.SIGNUP);
  };

  const handleAuthComplete = async () => {
    const savedUser = getSavedUser();
    if (savedUser) {
      setUser(savedUser);
      setCurrentView(VIEWS.DASHBOARD);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setCurrentView(VIEWS.LANDING);
  };

  const handleViewCompany = (id: string) => {
    setSelectedCompanyId(id);
    setCurrentView(VIEWS.COMPANY_DETAIL);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0B14] via-[#111327] to-[#0A0B14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading FineGuard Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0B14] via-[#111327] to-[#0A0B14]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Public views */}
        {currentView === VIEWS.LANDING && (
          <LandingView
            onEnterVault={() => setCurrentView(VIEWS.LOGIN)}
            onBookDemo={handleBookDemo}
            onStartMonitoring={handleStartMonitoring}
            hologram={hologram}
          />
        )}

        {currentView === VIEWS.SIGNUP && (
          <SignupView
            onBack={() => setCurrentView(VIEWS.LANDING)}
            onComplete={handleAuthComplete}
            onSwitchToLogin={() => setCurrentView(VIEWS.LOGIN)}
          />
        )}

        {currentView === VIEWS.LOGIN && (
          <LoginView
            onBack={() => setCurrentView(VIEWS.LANDING)}
            onComplete={handleAuthComplete}
            onSwitchToSignup={() => setCurrentView(VIEWS.SIGNUP)}
          />
        )}

        {/* Authenticated views */}
        {currentView === VIEWS.DASHBOARD && user && (
          <UserDashboard
            user={user}
            onAddCompany={() => setCurrentView(VIEWS.ADD_COMPANY)}
            onViewCompany={handleViewCompany}
            onViewAlerts={() => setCurrentView(VIEWS.ALERTS)}
            onSettings={() => setCurrentView(VIEWS.SETTINGS)}
            onLogout={handleLogout}
          />
        )}

        {currentView === VIEWS.ADD_COMPANY && (
          <AddCompanyView
            onBack={() => setCurrentView(VIEWS.DASHBOARD)}
            onAdded={(id) => { setSelectedCompanyId(id); setCurrentView(VIEWS.COMPANY_DETAIL); }}
          />
        )}

        {currentView === VIEWS.COMPANY_DETAIL && selectedCompanyId && (
          <CompanyDetailView
            companyId={selectedCompanyId}
            onBack={() => setCurrentView(VIEWS.DASHBOARD)}
            onDeleted={() => setCurrentView(VIEWS.DASHBOARD)}
          />
        )}

        {currentView === VIEWS.ALERTS && (
          <AlertsView onBack={() => setCurrentView(VIEWS.DASHBOARD)} />
        )}

        {currentView === VIEWS.SETTINGS && user && (
          <UserSettings
            user={user}
            onBack={() => setCurrentView(VIEWS.DASHBOARD)}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}
