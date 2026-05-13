import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import { Route, Switch } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import Bundles from './pages/Bundles';
import Cases from './pages/Cases';
import Dashboard from './pages/Dashboard';
import Diary from './pages/Diary';
import Documents from './pages/Documents';
import Hearings from './pages/Hearings';
import Queue from './pages/Queue';
import UltAiIntakeWizard from './pages/UltAiIntakeWizard';
import UltAiAdminDashboard from './pages/UltAiAdminDashboard';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/cases" component={Cases} />
      <Route path="/hearings" component={Hearings} />
      <Route path="/documents" component={Documents} />
      <Route path="/queue" component={Queue} />
      <Route path="/diary" component={Diary} />
      <Route path="/bundles" component={Bundles} />
      <Route path="/ultai-intake" component={UltAiIntakeWizard} />
      <Route path="/admin" component={UltAiAdminDashboard} />
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
