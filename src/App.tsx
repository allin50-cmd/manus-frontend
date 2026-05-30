import { Route, Switch } from 'wouter';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import FineGuard from './pages/FineGuard';
import ComplianceBundle from './pages/ComplianceBundle';
import VaultLine from './pages/VaultLine';
import UltAi from './pages/UltAi';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Team from './pages/Team';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AlertsDashboard from './pages/AlertsDashboard';
import VoiceControl from './pages/VoiceControl';
import BookDemo from './pages/BookDemo';
import IntakeSheet from './pages/IntakeSheet';
import Admin from './pages/Admin';
import AuditLanding from './pages/AuditLanding';
import PieDashboard from './pages/PieDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={() => <Layout><Home /></Layout>} />
        <Route path="/fineguard" component={() => <Layout><FineGuard /></Layout>} />
        <Route path="/vaultline" component={() => <Layout><VaultLine /></Layout>} />
        <Route path="/ultai" component={() => <Layout><UltAi /></Layout>} />
        <Route path="/pricing" component={() => <Layout><Pricing /></Layout>} />
        <Route path="/about" component={() => <Layout><About /></Layout>} />
        <Route path="/team" component={() => <Layout><Team /></Layout>} />
        <Route path="/contact" component={() => <Layout><Contact /></Layout>} />
        <Route path="/privacy" component={() => <Layout><Privacy /></Layout>} />
        <Route path="/terms" component={() => <Layout><Terms /></Layout>} />
        <Route path="/alerts" component={() => <Layout><AlertsDashboard /></Layout>} />
        <Route path="/voice-reception" component={VoiceControl} />
        <Route path="/compliance-bundle" component={() => <Layout><ComplianceBundle /></Layout>} />
        <Route path="/book-demo" component={() => <Layout><BookDemo /></Layout>} />
        <Route path="/intake" component={() => <Layout><IntakeSheet /></Layout>} />
        <Route path="/admin" component={() => <Layout><Admin /></Layout>} />
        <Route path="/audit" component={() => <Layout><AuditLanding /></Layout>} />
        <Route path="/pie" component={() => <Layout><PieDashboard /></Layout>} />
        <Route component={() => <Layout><NotFound /></Layout>} />
      </Switch>
      <Toaster richColors position="top-right" />
    </>
  );
}
