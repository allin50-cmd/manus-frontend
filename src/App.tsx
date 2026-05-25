import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import { Route, Switch } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import About from './pages/About';
import Admin from './pages/Admin';
import BookDemo from './pages/BookDemo';
import Bundles from './pages/Bundles';
import Cases from './pages/Cases';
import ComplianceBundle from './pages/ComplianceBundle';
import Dashboard from './pages/Dashboard';
import Diary from './pages/Diary';
import Documents from './pages/Documents';
import FineGuard from './pages/FineGuard';
import Hearings from './pages/Hearings';
import IntakeSheet from './pages/IntakeSheet';
import Pricing from './pages/Pricing';
import Queue from './pages/Queue';
import Team from './pages/Team';
import UltAi from './pages/UltAi';
import VaultLine from './pages/VaultLine';

function Router() {
  return (
    <Switch>
      {/* ClerkOS operational routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/cases" component={Cases} />
      <Route path="/hearings" component={Hearings} />
      <Route path="/documents" component={Documents} />
      <Route path="/queue" component={Queue} />
      <Route path="/diary" component={Diary} />
      <Route path="/bundles" component={Bundles} />
      <Route path="/team" component={Team} />
      <Route path="/admin" component={Admin} />
      {/* P1 product landing pages */}
      <Route path="/ultai" component={UltAi} />
      <Route path="/fineguard" component={FineGuard} />
      <Route path="/vaultline" component={VaultLine} />
      {/* Conversion and intake */}
      <Route path="/intake-sheet" component={IntakeSheet} />
      <Route path="/compliance-bundle" component={ComplianceBundle} />
      <Route path="/book-demo" component={BookDemo} />
      {/* P3 parked */}
      <Route path="/pricing" component={Pricing} />
      {/* Static */}
      <Route path="/about" component={About} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
