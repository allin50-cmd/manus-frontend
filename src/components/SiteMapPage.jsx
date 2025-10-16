import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Home, Users, Settings, FileText, Calendar, Briefcase, Shield } from 'lucide-react';

const SiteMapPage = () => {
  const sections = [
    {
      title: 'Public Pages',
      icon: Home,
      pages: ['Home', 'About', 'How It Works', 'Features', 'Pricing', 'Testimonials', 'Contact']
    },
    {
      title: 'Dashboard',
      icon: Shield,
      pages: ['Dashboard', 'Analytics', 'Enhanced Analytics', 'Compliance Dashboard']
    },
    {
      title: 'CRM & Sales',
      icon: Users,
      pages: ['CRM', 'CRM Dashboard', 'Clients', 'Leads', 'Sales', 'Marketing']
    },
    {
      title: 'Accounting',
      icon: FileText,
      pages: ['Accounting Services', 'Accountant Team', 'Invoices', 'Tax Planning', 'Payroll']
    },
    {
      title: 'Project Management',
      icon: Briefcase,
      pages: ['Projects', 'Tasks', 'Calendar', 'Workflows', 'Reports']
    },
    {
      title: 'Administration',
      icon: Settings,
      pages: ['Admin', 'Settings', 'Team', 'User Profile', 'Admin Control Panel', 'Audit Log']
    },
    {
      title: 'Tools & Features',
      icon: Shield,
      pages: ['Vault', 'Documents', 'Integrations', 'API Manager', 'AI Agents', 'Notifications', 'Billing', 'Help', 'Support', 'Knowledge Base', 'Training']
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Site Map</h1>
        <p className="text-muted-foreground">Complete navigation structure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.pages.map((page, pidx) => (
                  <li key={pidx} className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    • {page}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Pages: 42+</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete enterprise platform with all features accessible through intuitive navigation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteMapPage;
