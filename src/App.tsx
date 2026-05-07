import React, { Suspense, lazy } from 'react';
import { Route, Switch } from 'wouter';
import { Toaster } from 'sonner';

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
  <div className="flex h-screen items-center justify-center bg-[#0F1014]">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A64A] border-t-transparent" />
  </div>
);

export default function App() {
  return (
    <>
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
      <Toaster richColors position="top-right" />
    </>
  );
}
