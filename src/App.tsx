import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import MTDControlCentre from '@/pages/MTDControlCentre';
import Companies from '@/pages/Companies';
import VATReturns from '@/pages/VATReturns';
import Receipts from '@/pages/Receipts';
import Scanner from '@/pages/Scanner';
import Ledger from '@/pages/Ledger';
import StagingQueue from '@/pages/StagingQueue';
import Documents from '@/pages/Documents';
import Reconciliation from '@/pages/Reconciliation';
import ComplianceAlerts from '@/pages/ComplianceAlerts';
import AuditTrail from '@/pages/AuditTrail';
import CompaniesHouseLookup from '@/pages/CompaniesHouseLookup';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="mtd" element={<MTDControlCentre />} />
        <Route path="companies" element={<Companies />} />
        <Route path="vat" element={<VATReturns />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="scan" element={<Scanner />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="staging" element={<StagingQueue />} />
        <Route path="documents" element={<Documents />} />
        <Route path="reconciliation" element={<Reconciliation />} />
        <Route path="alerts" element={<ComplianceAlerts />} />
        <Route path="audit" element={<AuditTrail />} />
        <Route path="companies-house" element={<CompaniesHouseLookup />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineProvider>
          <AppRoutes />
        </OfflineProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
