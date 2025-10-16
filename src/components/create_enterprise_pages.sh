#!/bin/bash

# AI Agent Management Page
cat > AIAgentManagementPage.jsx << 'EOF'
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Play, Pause, Settings, Activity, List, Terminal, BookOpen } from 'lucide-react';

const AIAgentManagementPage = () => {
  const [activeTab, setActiveTab] = useState('agents');

  const agents = [
    { id: 1, name: 'Compliance Monitor', status: 'active', tasks: 247, accuracy: 99.8 },
    { id: 2, name: 'Data Enrichment', status: 'active', tasks: 156, accuracy: 96.1 },
    { id: 3, name: 'Lead Scoring', status: 'paused', tasks: 89, accuracy: 94.5 }
  ];

  const tasks = [
    { id: 1, agent: 'Compliance Monitor', task: 'Check company filings', status: 'completed', time: '2m 15s' },
    { id: 2, agent: 'Data Enrichment', task: 'Enrich contact data', status: 'running', time: '1m 30s' },
    { id: 3, agent: 'Lead Scoring', task: 'Score new leads', status: 'queued', time: '-' }
  ];

  const activities = [
    { id: 1, agent: 'Compliance Monitor', action: 'Processed 45 companies', timestamp: '10 minutes ago' },
    { id: 2, agent: 'Data Enrichment', action: 'Enriched 23 contacts', timestamp: '25 minutes ago' },
    { id: 3, agent: 'Lead Scoring', action: 'Scored 12 leads', timestamp: '1 hour ago' }
  ];

  const commands = [
    { command: 'agent.start(name)', description: 'Start an AI agent' },
    { command: 'agent.stop(name)', description: 'Stop an AI agent' },
    { command: 'agent.status(name)', description: 'Get agent status' },
    { command: 'agent.logs(name)', description: 'View agent logs' }
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'agents':
        return (
          <div className="grid gap-4">
            {agents.map(agent => (
              <Card key={agent.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Bot className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold text-lg">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">{agent.tasks} tasks completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="font-semibold">{agent.accuracy}%</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {agent.status}
                      </span>
                      <Button size="sm" variant="ghost">
                        {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost"><Settings className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <List className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{task.task}</p>
                    <p className="text-sm text-muted-foreground">{task.agent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{task.time}</span>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'activities':
        return (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.agent}</p>
                </div>
                <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        );

      case 'commands':
        return (
          <div className="space-y-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <p>$ agent --help</p>
              <p className="mt-2 text-gray-400">Available commands:</p>
            </div>
            {commands.map((cmd, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <p className="font-mono text-sm font-semibold">{cmd.command}</p>
                <p className="text-sm text-muted-foreground mt-1">{cmd.description}</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Agent Management</h1>
          <p className="text-muted-foreground">Manage and monitor AI agents</p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {['agents', 'tasks', 'activities', 'commands'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>{renderTabContent()}</div>
    </div>
  );
};

export default AIAgentManagementPage;
EOF

# Site Map Page
cat > SiteMapPage.jsx << 'EOF'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
EOF

echo "✅ Created AI Agent Management and Site Map pages"
