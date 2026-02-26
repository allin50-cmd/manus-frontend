import { Switch, Route } from 'wouter';

// Marketing / brand pages
import FineGuard        from '@/pages/FineGuard';
import VaultLine        from '@/pages/VaultLine';
import UltAi            from '@/pages/UltAi';
import ComplianceBundle from '@/pages/ComplianceBundle';
import IntakeSheet      from '@/pages/IntakeSheet';
import BookDemo         from '@/pages/BookDemo';
import About            from '@/pages/About';
import Pricing          from '@/pages/Pricing';
import Team             from '@/pages/Team';
import Admin            from '@/pages/Admin';
import NotFound         from '@/pages/NotFound';

// FineGuard app (installer portal)
import Dashboard           from '@/pages/fineguard/Dashboard';
import Deploy              from '@/pages/fineguard/Deploy';
import DeploymentHistory   from '@/pages/fineguard/DeploymentHistory';
import DeploymentDetails   from '@/pages/fineguard/DeploymentDetails';
import SettingsDomains     from '@/pages/fineguard/SettingsDomains';
import SettingsCopilot     from '@/pages/fineguard/SettingsCopilot';
import SettingsTeams       from '@/pages/fineguard/SettingsTeams';
import SettingsPowerAutomate from '@/pages/fineguard/SettingsPowerAutomate';
import Help                from '@/pages/fineguard/Help';
import PartnerOverview     from '@/pages/fineguard/PartnerOverview';
import TenantOverview      from '@/pages/fineguard/TenantOverview';

export default function App() {
  return (
    <Switch>
      {/* Brand / marketing */}
      <Route path="/"                   component={FineGuard} />
      <Route path="/fineguard"          component={FineGuard} />
      <Route path="/vaultline"          component={VaultLine} />
      <Route path="/ultai"              component={UltAi} />
      <Route path="/compliance-bundle"  component={ComplianceBundle} />
      <Route path="/intake-sheet"       component={IntakeSheet} />
      <Route path="/book-demo"          component={BookDemo} />
      <Route path="/about"              component={About} />
      <Route path="/pricing"            component={Pricing} />
      <Route path="/team"               component={Team} />
      <Route path="/admin"              component={Admin} />

      {/* FineGuard installer portal */}
      <Route path="/app"                component={Dashboard} />
      <Route path="/app/dashboard"      component={Dashboard} />
      <Route path="/app/deploy"         component={Deploy} />
      <Route path="/app/history"        component={DeploymentHistory} />
      <Route path="/app/history/:id"    component={DeploymentDetails} />
      <Route path="/app/settings/domains"       component={SettingsDomains} />
      <Route path="/app/settings/copilot"       component={SettingsCopilot} />
      <Route path="/app/settings/teams"         component={SettingsTeams} />
      <Route path="/app/settings/power-automate" component={SettingsPowerAutomate} />
      <Route path="/app/help"           component={Help} />
      <Route path="/app/partners"       component={PartnerOverview} />
      <Route path="/app/tenants/:id"    component={TenantOverview} />

      <Route component={NotFound} />
    </Switch>
  );
}
