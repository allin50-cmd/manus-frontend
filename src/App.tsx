import { useEffect } from 'react';
import { Router, Route, Switch, useLocation, Redirect } from 'wouter';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';

// Pages
import FineGuard from './pages/FineGuard';
import VaultLine from './pages/VaultLine';
import UltAi from './pages/UltAi';
import BookDemo from './pages/BookDemo';
import ComplianceBundle from './pages/ComplianceBundle';
import IntakeSheet from './pages/IntakeSheet';
import Admin from './pages/Admin';
import About from './pages/About';
import Pricing from './pages/Pricing';
import Team from './pages/Team';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Help from './pages/Help';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import DevOps from './pages/DevOps';
import Acsp from './pages/Acsp';
import Workflows from './pages/Workflows';
import CrmAdmin from './pages/CrmAdmin';
import Billing from './pages/Billing';

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
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
            <Route path="/alerts"><Redirect to="/dashboard" /></Route>
            <Route path="/devops" component={DevOps} />
            <Route path="/acsp" component={Acsp} />
            <Route path="/workflows" component={Workflows} />
            <Route path="/crm" component={CrmAdmin} />
            <Route path="/billing" component={Billing} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Router>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
