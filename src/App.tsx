import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch } from 'wouter';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';

// Route-level code splitting — each page loads only when navigated to
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const Cases            = lazy(() => import('./pages/Cases'));
const CaseDetail       = lazy(() => import('./pages/CaseDetail'));
const Hearings         = lazy(() => import('./pages/Hearings'));
const Documents        = lazy(() => import('./pages/Documents'));
const Queue            = lazy(() => import('./pages/Queue'));
const Diary            = lazy(() => import('./pages/Diary'));
const Bundles          = lazy(() => import('./pages/Bundles'));
const LegalDashboard   = lazy(() => import('./pages/LegalDashboard'));
const VaultLine        = lazy(() => import('./pages/VaultLine'));
const UltAi            = lazy(() => import('./pages/UltAi'));
const FineGuard        = lazy(() => import('./pages/FineGuard'));
const About            = lazy(() => import('./pages/About'));
const Team             = lazy(() => import('./pages/Team'));
const Pricing          = lazy(() => import('./pages/Pricing'));
const BookDemo         = lazy(() => import('./pages/BookDemo'));
const IntakeSheet      = lazy(() => import('./pages/IntakeSheet'));
const ComplianceBundle   = lazy(() => import('./pages/ComplianceBundle'));
const Portal             = lazy(() => import('./pages/Portal'));
const VaultDashboard     = lazy(() => import('./pages/VaultDashboard'));
const UltAiDashboard     = lazy(() => import('./pages/UltAiDashboard'));
const FineGuardDashboard = lazy(() => import('./pages/FineGuardDashboard'));
const UltAiIntake        = lazy(() => import('./pages/UltAiIntake'));
const UltAiResult        = lazy(() => import('./pages/UltAiResult'));
const Settings           = lazy(() => import('./pages/Settings'));
const LunarIntake        = lazy(() => import('./pages/LunarIntake'));
const LunarDashboard     = lazy(() => import('./pages/LunarDashboard'));
const Admin              = lazy(() => import('./pages/Admin'));
const NotFound           = lazy(() => import('./pages/NotFound'));

function PageSpinner() {
  return (
    <div className="min-h-screen bg-[#0F1014] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#5A4BFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset}>
          <Suspense fallback={<PageSpinner />}>
            <Switch>
              {/* ClerkOS app routes */}
              <Route path="/" component={Dashboard} />
              <Route path="/cases" component={Cases} />
              <Route path="/cases/:id" component={CaseDetail} />
              <Route path="/hearings" component={Hearings} />
              <Route path="/documents" component={Documents} />
              <Route path="/queue" component={Queue} />
              <Route path="/diary" component={Diary} />
              <Route path="/bundles" component={Bundles} />
              <Route path="/legal" component={LegalDashboard} />

              {/* Marketing / product pages */}
              <Route path="/vaultline" component={VaultLine} />
              <Route path="/ultai" component={UltAi} />
              <Route path="/fineguard" component={FineGuard} />
              <Route path="/about" component={About} />
              <Route path="/team" component={Team} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/book-demo" component={BookDemo} />
              <Route path="/intake" component={IntakeSheet} />
              <Route path="/intake-sheet" component={IntakeSheet} />
              <Route path="/compliance-bundle" component={ComplianceBundle} />

              {/* Product app dashboards + shared pages */}
              <Route path="/portal" component={Portal} />
              <Route path="/vault-dashboard" component={VaultDashboard} />
              <Route path="/ultai-dashboard" component={UltAiDashboard} />
              <Route path="/ultai-intake" component={UltAiIntake} />
              <Route path="/ultai-analysis/:id" component={UltAiResult} />
              <Route path="/fineguard-dashboard" component={FineGuardDashboard} />
              <Route path="/settings" component={Settings} />
              <Route path="/lunar-intake" component={LunarIntake} />
              <Route path="/lunar-dashboard" component={LunarDashboard} />
              <Route path="/admin" component={Admin} />

              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
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
