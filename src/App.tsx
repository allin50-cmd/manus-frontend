import { Switch, Route } from 'wouter';
import VaultLine from './pages/VaultLine';
import UltAi from './pages/UltAi';
import FineGuard from './pages/FineGuard';
import BookDemo from './pages/BookDemo';
import IntakeSheet from './pages/IntakeSheet';
import ComplianceBundle from './pages/ComplianceBundle';
import Admin from './pages/Admin';
import About from './pages/About';
import Pricing from './pages/Pricing';
import Team from './pages/Team';
import LegalTemplates from './pages/LegalTemplates';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={VaultLine} />
      <Route path="/vaultline" component={VaultLine} />
      <Route path="/ultai" component={UltAi} />
      <Route path="/fineguard" component={FineGuard} />
      <Route path="/book-demo" component={BookDemo} />
      <Route path="/intake" component={IntakeSheet} />
      <Route path="/compliance-bundle" component={ComplianceBundle} />
      <Route path="/admin" component={Admin} />
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/team" component={Team} />
      <Route path="/legal-templates" component={LegalTemplates} />
      <Route component={NotFound} />
    </Switch>
  );
}
