import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { isAuthenticated } from './lib/auth';

// Pages
import FineGuard from './pages/FineGuard';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VATChecker from './pages/VATChecker';
import DeadlineScanner from './pages/DeadlineScanner';
import CompanyDetail from './pages/CompanyDetail';
import DocumentVault from './pages/DocumentVault';
import ComplianceBundle from './pages/ComplianceBundle';
import Pricing from './pages/Pricing';
import NotFound from './pages/NotFound';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<FineGuard />} />
        <Route path="/fineguard" element={<FineGuard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/compliance-bundle" element={<ComplianceBundle />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/vat-checker" element={<PrivateRoute><VATChecker /></PrivateRoute>} />
        <Route path="/deadline-scanner" element={<PrivateRoute><DeadlineScanner /></PrivateRoute>} />
        <Route path="/company/:id" element={<PrivateRoute><CompanyDetail /></PrivateRoute>} />
        <Route path="/documents" element={<PrivateRoute><DocumentVault /></PrivateRoute>} />
        <Route path="/documents/:companyId" element={<PrivateRoute><DocumentVault /></PrivateRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
