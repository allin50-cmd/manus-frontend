import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import UserDashboard from '../components/UserDashboard';
import AddCompanyView from '../components/AddCompanyView';
import CompanyDetailView from '../components/CompanyDetailView';
import AlertsView from '../components/AlertsView';
import UserSettings from '../components/UserSettings';

type DashView = 'dashboard' | 'add_company' | 'company_detail' | 'alerts' | 'settings';

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<DashView>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) setLocation('/login');
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated || !user) return null;

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {view === 'dashboard' && (
        <UserDashboard
          user={user}
          onAddCompany={() => setView('add_company')}
          onViewCompany={(id) => { setSelectedCompanyId(id); setView('company_detail'); }}
          onViewAlerts={() => setView('alerts')}
          onSettings={() => setView('settings')}
          onLogout={handleLogout}
        />
      )}
      {view === 'add_company' && (
        <AddCompanyView
          onBack={() => setView('dashboard')}
          onAdded={(id) => { setSelectedCompanyId(id); setView('company_detail'); }}
        />
      )}
      {view === 'company_detail' && selectedCompanyId && (
        <CompanyDetailView
          companyId={selectedCompanyId}
          onBack={() => setView('dashboard')}
          onDeleted={() => setView('dashboard')}
        />
      )}
      {view === 'alerts' && (
        <AlertsView onBack={() => setView('dashboard')} />
      )}
      {view === 'settings' && (
        <UserSettings
          user={user}
          onBack={() => setView('dashboard')}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
