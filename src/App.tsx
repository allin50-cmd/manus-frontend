import React, { Suspense, lazy } from 'react';
import { Route, Switch } from 'wouter';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';

const FineGuard = lazy(() => import('./pages/FineGuard'));
const ComplianceBundle = lazy(() => import('./pages/ComplianceBundle'));
const VaultLine = lazy(() => import('./pages/VaultLine'));
const UltAi = lazy(() => import('./pages/UltAi'));
const Pricing = lazy(() => import('./pages/Pricing'));
const About = lazy(() => import('./pages/About'));
const Team = lazy(() => import('./pages/Team'));
const BookDemo = lazy(() => import('./pages/BookDemo'));
const IntakeSheet = lazy(() => import('./pages/IntakeSheet'));
const Admin = lazy(() => import('./pages/Admin'));
const AuditLanding = lazy(() => import('./pages/AuditLanding'));
const LawClerks = lazy(() => import('./pages/LawClerks'));
const ClerkDashboard = lazy(() => import('./pages/ClerkDashboard'));
const LegalSuite = lazy(() => import('./pages/LegalSuite'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageSpinner = (
  <div className="min-h-screen bg-[#0F1014] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[#5A4BFF] border-t-transparent animate-spin" />
      <p className="text-gray-500 text-sm">Loading…</p>
    </div>
  </div>
);

export default function App() {
  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={PageSpinner}>
          <Switch>
            <Route path="/" component={FineGuard} />
            <Route path="/fineguard" component={FineGuard} />
            <Route path="/compliance-bundle" component={ComplianceBundle} />
            <Route path="/vaultline" component={VaultLine} />
            <Route path="/ultai" component={UltAi} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/about" component={About} />
            <Route path="/team" component={Team} />
            <Route path="/book-demo" component={BookDemo} />
            <Route path="/intake" component={IntakeSheet} />
            <Route path="/intake-sheet" component={IntakeSheet} />
            <Route path="/admin" component={Admin} />
            <Route path="/audit" component={AuditLanding} />
            <Route path="/legal" component={LegalSuite} />
            <Route path="/law-clerks" component={LawClerks} />
            <Route path="/clerk-dashboard" component={ClerkDashboard} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </ErrorBoundary>
      <Toaster richColors position="top-right" />
    </>
  );
}
