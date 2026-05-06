import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { AutoSync } from './components/AutoSync';
import { HealthAlerts } from './components/HealthAlerts';
import { SyncQueuePanel } from './components/SyncQueuePanel';
import { SystemMonitor } from './components/SystemMonitor';
import { SwarmProvider } from './contexts/SwarmContext';
import { SyncQueueProvider } from './contexts/SyncQueueContext';
import { ThemeProvider } from './contexts/ThemeContext';

declare global {
  interface Window {
    __SYSTEM_METRICS?: Array<Record<string, unknown>>;
  }
}

const About = lazy(() => import('./pages/About'));
const Admin = lazy(() => import('./pages/Admin'));
const BookDemo = lazy(() => import('./pages/BookDemo'));
const Bundles = lazy(() => import('./pages/Bundles'));
const Cases = lazy(() => import('./pages/Cases'));
const ComplianceBundle = lazy(() => import('./pages/ComplianceBundle'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Diary = lazy(() => import('./pages/Diary'));
const Documents = lazy(() => import('./pages/Documents'));
const FineGuard = lazy(() => import('./pages/FineGuard'));
const Hearings = lazy(() => import('./pages/Hearings'));
const IntakeSheet = lazy(() => import('./pages/IntakeSheet'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Queue = lazy(() => import('./pages/Queue'));
const Status = lazy(() => import('./pages/Status'));
const Team = lazy(() => import('./pages/Team'));
const UltAi = lazy(() => import('./pages/UltAi'));
const VaultLine = lazy(() => import('./pages/VaultLine'));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1014]">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/cases" component={Cases} />
        <Route path="/hearings" component={Hearings} />
        <Route path="/documents" component={Documents} />
        <Route path="/queue" component={Queue} />
        <Route path="/diary" component={Diary} />
        <Route path="/bundles" component={Bundles} />
        <Route path="/admin" component={Admin} />
        <Route path="/fineguard" component={FineGuard} />
        <Route path="/ultai" component={UltAi} />
        <Route path="/vaultline" component={VaultLine} />
        <Route path="/book-demo" component={BookDemo} />
        <Route path="/compliance-bundle" component={ComplianceBundle} />
        <Route path="/intake-sheet" component={IntakeSheet} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/about" component={About} />
        <Route path="/team" component={Team} />
        <Route path="/status" component={Status} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <SwarmProvider>
          <SyncQueueProvider>
            <TooltipProvider>
              <Toaster richColors position="top-right" />
              <SystemMonitor />
              <AutoSync />
              <HealthAlerts />
              <Router />
              <SyncQueuePanel />
            </TooltipProvider>
          </SyncQueueProvider>
        </SwarmProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
