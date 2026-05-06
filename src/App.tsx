import { Route, Switch } from 'wouter';
import { Toaster } from 'sonner';
import FineGuard from './pages/FineGuard';
import ComplianceBundle from './pages/ComplianceBundle';
import VaultLine from './pages/VaultLine';
import UltAi from './pages/UltAi';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Team from './pages/Team';
import BookDemo from './pages/BookDemo';
import IntakeSheet from './pages/IntakeSheet';
import Admin from './pages/Admin';
import AuditLanding from './pages/AuditLanding';
import LawClerks from './pages/LawClerks';
import ClerkDashboard from './pages/ClerkDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
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
        <Route path="/audit" component={AuditLanding} />
        <Route path="/law-clerks" component={LawClerks} />
        <Route path="/clerk-dashboard" component={ClerkDashboard} />
        <Route component={NotFound} />
      </Switch>
      <Toaster richColors position="top-right" />
    </>
  );
}
