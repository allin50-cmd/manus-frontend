import { Switch, Route } from 'wouter';
import FineGuard from './pages/FineGuard';
import VaultLine from './pages/VaultLine';
import UltAi from './pages/UltAi';
import ComplianceBundle from './pages/ComplianceBundle';
import BookDemo from './pages/BookDemo';
import About from './pages/About';
import Team from './pages/Team';
import Pricing from './pages/Pricing';
import IntakeSheet from './pages/IntakeSheet';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={FineGuard} />
      <Route path="/fineguard" component={FineGuard} />
      <Route path="/vaultline" component={VaultLine} />
      <Route path="/ultai" component={UltAi} />
      <Route path="/compliance-bundle" component={ComplianceBundle} />
      <Route path="/book-demo" component={BookDemo} />
      <Route path="/about" component={About} />
      <Route path="/team" component={Team} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/intake" component={IntakeSheet} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}
