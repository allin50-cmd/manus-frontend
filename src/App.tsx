/**
 * App Router
 * Central routing for VaultLine Brand Suite — dashboard + landing pages
 */
import React, { Suspense, lazy } from 'react';
import { Router, Switch, Route } from 'wouter';
import { ToastProvider } from '@/components/ui/toast';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────

// Dashboard pages
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const AIAssistant     = lazy(() => import('./pages/AIAssistant'));
const Workflows       = lazy(() => import('./pages/Workflows'));
const MCPToolsPage    = lazy(() => import('./pages/MCPTools'));
const KnowledgeBase   = lazy(() => import('./pages/KnowledgeBase'));
const AuditLog        = lazy(() => import('./pages/AuditLog'));
const SettingsPage    = lazy(() => import('./pages/Settings'));

// Existing product/landing pages
const VaultLine       = lazy(() => import('./pages/VaultLine'));
const UltAi           = lazy(() => import('./pages/UltAi'));
const FineGuard       = lazy(() => import('./pages/FineGuard'));
const IntakeSheet     = lazy(() => import('./pages/IntakeSheet'));
const ComplianceBundle = lazy(() => import('./pages/ComplianceBundle'));
const BookDemo        = lazy(() => import('./pages/BookDemo'));
const Pricing         = lazy(() => import('./pages/Pricing'));
const Team            = lazy(() => import('./pages/Team'));
const About           = lazy(() => import('./pages/About'));
const Admin           = lazy(() => import('./pages/Admin'));
const NotFound        = lazy(() => import('./pages/NotFound'));

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#5A4BFF] to-[#06b6d4] rounded-xl animate-pulse" />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[#5A4BFF] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            {/* ── Dashboard (default redirect) ──────────────────────────── */}
            <Route path="/dashboard"    component={Dashboard} />
            <Route path="/ai-assistant" component={AIAssistant} />
            <Route path="/workflows"    component={Workflows} />
            <Route path="/mcp-tools"    component={MCPToolsPage} />
            <Route path="/knowledge-base" component={KnowledgeBase} />
            <Route path="/audit-log"    component={AuditLog} />
            <Route path="/settings"     component={SettingsPage} />

            {/* ── Product / Landing pages ───────────────────────────────── */}
            <Route path="/"                  component={VaultLineLanding} />
            <Route path="/ultai"             component={UltAi} />
            <Route path="/fineguard"         component={FineGuard} />
            <Route path="/intake-sheet"      component={IntakeSheet} />
            <Route path="/compliance-bundle" component={ComplianceBundle} />
            <Route path="/book-demo"         component={BookDemo} />
            <Route path="/pricing"           component={Pricing} />
            <Route path="/team"              component={Team} />
            <Route path="/about"             component={About} />
            <Route path="/admin"             component={Admin} />

            {/* ── 404 ──────────────────────────────────────────────────── */}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}

/**
 * VaultLine Landing — wraps the VaultLine page with a dashboard CTA banner
 */
function VaultLineLanding() {
  return (
    <>
      {/* Dashboard entry banner */}
      <div className="bg-gradient-to-r from-[#5A4BFF]/90 to-[#06b6d4]/90 text-white text-center py-2.5 px-4 text-sm font-medium">
        ✦ New: Full AI Dashboard available —{' '}
        <a href="/dashboard" className="underline underline-offset-2 hover:opacity-80 transition-opacity">
          Enter Dashboard →
        </a>
      </div>
      <Suspense fallback={<PageLoader />}>
        <VaultLine />
      </Suspense>
    </>
  );
}
