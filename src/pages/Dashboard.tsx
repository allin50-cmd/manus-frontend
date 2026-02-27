import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import UserDashboard from '../components/UserDashboard';
import AddCompanyView from '../components/AddCompanyView';
import CompanyDetailView from '../components/CompanyDetailView';
import AlertsView from '../components/AlertsView';
import UserSettings from '../components/UserSettings';
import GuidedTour from '../components/GuidedTour';
import { usePageTitle } from '../hooks/usePageTitle';

type DashView = 'dashboard' | 'add_company' | 'company_detail' | 'alerts' | 'settings';

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<DashView>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation('/login');
  }, [loading, isAuthenticated, setLocation]);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('view') as DashView | null;
    if (param && ['alerts', 'settings', 'add_company'].includes(param)) setView(param);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setLocation('/');
  }, [logout, setLocation]);

  const handleAddCompany = useCallback(() => setView('add_company'), []);
  const handleViewCompany = useCallback((id: string) => { setSelectedCompanyId(id); setView('company_detail'); }, []);
  const handleViewAlerts = useCallback(() => setView('alerts'), []);
  const handleSettings = useCallback(() => setView('settings'), []);
  const handleBackToDashboard = useCallback(() => setView('dashboard'), []);
  const handleCompanyAdded = useCallback((id: string) => { setSelectedCompanyId(id); setView('company_detail'); }, []);

  if (loading || !isAuthenticated || !user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {view === 'dashboard' && (
        <>
          <UserDashboard
            user={user}
            onAddCompany={handleAddCompany}
            onViewCompany={handleViewCompany}
            onViewAlerts={handleViewAlerts}
            onSettings={handleSettings}
            onLogout={handleLogout}
          />
          <GuidedTour />
        </>
      )}
      {view === 'add_company' && (
        <AddCompanyView
          onBack={handleBackToDashboard}
          onAdded={handleCompanyAdded}
        />
      )}
      {view === 'company_detail' && selectedCompanyId && (
        <CompanyDetailView
          companyId={selectedCompanyId}
          onBack={handleBackToDashboard}
          onDeleted={handleBackToDashboard}
        />
      )}
      {view === 'alerts' && (
        <AlertsView onBack={handleBackToDashboard} />
      )}
      {view === 'settings' && (
        <UserSettings
          user={user}
          onBack={handleBackToDashboard}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
