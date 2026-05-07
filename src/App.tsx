import React, { lazy, Suspense } from 'react';
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
const NotFound = lazy(() => import('./pages/NotFound'));

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-6 py-2 rounded-lg"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#5A4BFF] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
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
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </ErrorBoundary>
      <Toaster richColors position="top-right" />
    </>
  );
}
