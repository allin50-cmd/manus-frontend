import { useEffect, lazy, Suspense } from 'react';
import { Router, Route, Switch, useLocation } from 'wouter';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';

// Eagerly loaded: landing page (first paint) and lightweight redirects
import FineGuard from './pages/FineGuard';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';

// Lazy-loaded pages — split into separate chunks to reduce initial bundle
const VaultLine = lazy(() => import('./pages/VaultLine'));
const UltAi = lazy(() => import('./pages/UltAi'));
const BookDemo = lazy(() => import('./pages/BookDemo'));
const ComplianceBundle = lazy(() => import('./pages/ComplianceBundle'));
const IntakeSheet = lazy(() => import('./pages/IntakeSheet'));
const Admin = lazy(() => import('./pages/Admin'));
const About = lazy(() => import('./pages/About'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Team = lazy(() => import('./pages/Team'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Help = lazy(() => import('./pages/Help'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DevOps = lazy(() => import('./pages/DevOps'));
const Acsp = lazy(() => import('./pages/Acsp'));
const Workflows = lazy(() => import('./pages/Workflows'));
const CrmAdmin = lazy(() => import('./pages/CrmAdmin'));
const Billing = lazy(() => import('./pages/Billing'));

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#5A4BFF]/30 border-t-[#5A4BFF] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function AlertsRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation('/dashboard?view=alerts'); }, [setLocation]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Router>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={FineGuard} />
              <Route path="/fineguard" component={FineGuard} />
              <Route path="/vaultline" component={VaultLine} />
              <Route path="/ultai" component={UltAi} />
              <Route path="/book-demo" component={BookDemo} />
              <Route path="/compliance-bundle" component={ComplianceBundle} />
              <Route path="/intake-sheet" component={IntakeSheet} />
              <Route path="/admin" component={Admin} />
              <Route path="/about" component={About} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/team" component={Team} />
              <Route path="/contact" component={Contact} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/terms" component={Terms} />
              <Route path="/help" component={Help} />
              <Route path="/reports" component={Reports} />
              <Route path="/profile" component={Profile} />
              <Route path="/onboarding" component={Onboarding} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/settings" component={Profile} />
              <Route path="/alerts" component={AlertsRedirect} />
              <Route path="/devops" component={DevOps} />
              <Route path="/acsp" component={Acsp} />
              <Route path="/workflows" component={Workflows} />
              <Route path="/crm" component={CrmAdmin} />
              <Route path="/billing" component={Billing} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
