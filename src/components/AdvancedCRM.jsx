import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Users, Building2, TrendingUp, Bot, Zap, Activity, 
  CheckCircle2, AlertCircle, Clock, Mail, Phone, 
  MessageSquare, Target, BarChart3, Settings, Play, 
  Pause, RefreshCw, Database, Cloud, Cpu, Brain,
  ArrowRight, Calendar, DollarSign, Award, Filter
} from 'lucide-react';

const AdvancedCRM = () => {
  const [activeAgents, setActiveAgents] = useState([]);
  const [services, setServices] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [agentLogs, setAgentLogs] = useState([]);

  // Initialize services and agents on mount
  useEffect(() => {
    initializeServices();
    startAgents();
    loadAutomations();
  }, []);

  const initializeServices = () => {
    setServices([
      { 
        id: 'companies-house', 
        name: 'Companies House API', 
        status: 'connected', 
        icon: '🏢',
        lastSync: new Date().toISOString(),
        recordsSync: 1247
      },
      { 
        id: 'hmrc', 
        name: 'HMRC Gateway', 
        status: 'connected', 
        icon: '💷',
        lastSync: new Date().toISOString(),
        recordsSync: 892
      },
      { 
        id: 'xero', 
        name: 'Xero Accounting', 
        status: 'connected', 
        icon: '📊',
        lastSync: new Date().toISOString(),
        recordsSync: 456
      },
      { 
        id: 'quickbooks', 
        name: 'QuickBooks', 
        status: 'ready', 
        icon: '📗',
        lastSync: null,
        recordsSync: 0
      },
      { 
        id: 'sendgrid', 
        name: 'SendGrid Email', 
        status: 'connected', 
        icon: '📧',
        lastSync: new Date().toISOString(),
        recordsSync: 3421
      },
      { 
        id: 'twilio', 
        name: 'Twilio SMS', 
        status: 'connected', 
        icon: '📱',
        lastSync: new Date().toISOString(),
        recordsSync: 234
      },
      { 
        id: 'openai', 
        name: 'OpenAI GPT-4', 
        status: 'connected', 
        icon: '🤖',
        lastSync: new Date().toISOString(),
        recordsSync: 5678
      },
      { 
        id: 'stripe', 
        name: 'Stripe Payments', 
        status: 'connected', 
        icon: '💳',
        lastSync: new Date().toISOString(),
        recordsSync: 189
      }
    ]);
  };

  const startAgents = () => {
    const agents = [
      {
        id: 'lead-scorer',
        name: 'AI Lead Scoring Agent',
        status: 'running',
        type: 'ai',
        icon: '🎯',
        tasksCompleted: 342,
        accuracy: 94.5,
        lastAction: 'Scored 15 new leads',
        nextRun: '2 minutes'
      },
      {
        id: 'churn-predictor',
        name: 'Churn Prediction Agent',
        status: 'running',
        type: 'ai',
        icon: '⚠️',
        tasksCompleted: 128,
        accuracy: 91.2,
        lastAction: 'Identified 3 at-risk clients',
        nextRun: '15 minutes'
      },
      {
        id: 'compliance-monitor',
        name: 'Compliance Monitoring Agent',
        status: 'running',
        type: 'automation',
        icon: '🛡️',
        tasksCompleted: 1247,
        accuracy: 99.8,
        lastAction: 'Checked 45 deadlines',
        nextRun: '1 hour'
      },
      {
        id: 'email-automation',
        name: 'Email Campaign Agent',
        status: 'running',
        type: 'automation',
        icon: '📧',
        tasksCompleted: 892,
        accuracy: 87.3,
        lastAction: 'Sent 23 reminder emails',
        nextRun: '30 minutes'
      },
      {
        id: 'data-enrichment',
        name: 'Data Enrichment Agent',
        status: 'running',
        type: 'automation',
        icon: '🔍',
        tasksCompleted: 567,
        accuracy: 96.1,
        lastAction: 'Enriched 12 company profiles',
        nextRun: '5 minutes'
      },
      {
        id: 'nba-engine',
        name: 'Next Best Action Agent',
        status: 'running',
        type: 'ai',
        icon: '🎲',
        tasksCompleted: 234,
        accuracy: 88.9,
        lastAction: 'Generated 8 recommendations',
        nextRun: '10 minutes'
      }
    ];
    setActiveAgents(agents);
    
    // Simulate agent activity
    const interval = setInterval(() => {
      addAgentLog();
    }, 3000);
    
    return () => clearInterval(interval);
  };

  const addAgentLog = () => {
    const logs = [
      { agent: 'AI Lead Scoring Agent', action: 'Scored lead: Tech Startup Ltd - Score: 85/100', type: 'success' },
      { agent: 'Churn Prediction Agent', action: 'Alert: Global Solutions Ltd showing churn signals', type: 'warning' },
      { agent: 'Compliance Monitoring Agent', action: 'Deadline approaching: Annual Accounts for 3 companies', type: 'info' },
      { agent: 'Email Campaign Agent', action: 'Sent reminder email to Startup Ventures Ltd', type: 'success' },
      { agent: 'Data Enrichment Agent', action: 'Updated company profile: New director added', type: 'info' },
      { agent: 'Next Best Action Agent', action: 'Recommendation: Schedule call with high-value client', type: 'success' }
    ];
    
    const randomLog = logs[Math.floor(Math.random() * logs.length)];
    setAgentLogs(prev => [{
      ...randomLog,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now()
    }, ...prev].slice(0, 50));
  };

  const loadAutomations = () => {
    setAutomations([
      {
        id: 1,
        name: 'Deadline Alert Workflow',
        trigger: 'When deadline is 7 days away',
        actions: ['Send email', 'Create task', 'Update CRM'],
        status: 'active',
        runs: 234
      },
      {
        id: 2,
        name: 'New Client Onboarding',
        trigger: 'When new client is added',
        actions: ['Send welcome email', 'Create checklist', 'Assign account manager'],
        status: 'active',
        runs: 45
      },
      {
        id: 3,
        name: 'High-Risk Client Alert',
        trigger: 'When compliance score drops below 60%',
        actions: ['Alert account manager', 'Generate mitigation plan', 'Schedule review'],
        status: 'active',
        runs: 12
      },
      {
        id: 4,
        name: 'Monthly Reporting',
        trigger: 'First day of each month',
        actions: ['Generate reports', 'Email to clients', 'Update dashboard'],
        status: 'active',
        runs: 6
      },
      {
        id: 5,
        name: 'Lead Nurture Sequence',
        trigger: 'When lead score exceeds 70',
        actions: ['Add to nurture campaign', 'Assign to sales', 'Send personalized email'],
        status: 'active',
        runs: 89
      }
    ]);
  };

  const toggleAgent = (agentId) => {
    setActiveAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'running' ? 'paused' : 'running' }
        : agent
    ));
  };

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-3xl font-bold">{activeAgents.filter(a => a.status === 'running').length}</p>
              </div>
              <Bot className="h-10 w-10 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Today</p>
                <p className="text-3xl font-bold">3,492</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-3xl font-bold">93.2%</p>
              </div>
              <Target className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Services</p>
                <p className="text-3xl font-bold">{services.filter(s => s.status === 'connected').length}</p>
              </div>
              <Cloud className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-500" />
            Active AI Agents
          </CardTitle>
          <CardDescription>Real-time monitoring of autonomous agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {activeAgents.map(agent => (
              <Card key={agent.id} className="border-cyan-400/30">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{agent.icon}</div>
                      <div>
                        <h4 className="font-semibold">{agent.name}</h4>
                        <Badge variant={agent.status === 'running' ? 'default' : 'secondary'} className="mt-1">
                          {agent.status === 'running' ? (
                            <><Activity className="h-3 w-3 mr-1 animate-pulse" /> Running</>
                          ) : (
                            <><Pause className="h-3 w-3 mr-1" /> Paused</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAgent(agent.id)}
                    >
                      {agent.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasks Completed:</span>
                      <span className="font-semibold">{agent.tasksCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span className="font-semibold text-green-500">{agent.accuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Action:</span>
                      <span className="font-semibold text-xs">{agent.lastAction}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Run:</span>
                      <span className="font-semibold text-cyan-500">{agent.nextRun}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-cyan-500" />
            Live Agent Activity
          </CardTitle>
          <CardDescription>Real-time log of agent actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {agentLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className={`mt-1 ${
                  log.type === 'success' ? 'text-green-500' : 
                  log.type === 'warning' ? 'text-amber-500' : 
                  'text-blue-500'
                }`}>
                  {log.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : 
                   log.type === 'warning' ? <AlertCircle className="h-4 w-4" /> : 
                   <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{log.agent}</span>
                    <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ServicesView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-cyan-500" />
            Connected Services
          </CardTitle>
          <CardDescription>Manage integrations with external platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map(service => (
              <Card key={service.id} className="border-cyan-400/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{service.icon}</div>
                      <div>
                        <h4 className="font-semibold">{service.name}</h4>
                        <Badge variant={service.status === 'connected' ? 'default' : 'secondary'} className="mt-1">
                          {service.status === 'connected' ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Ready</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {service.status === 'connected' && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Sync:</span>
                        <span className="font-semibold">{new Date(service.lastSync).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Records Synced:</span>
                        <span className="font-semibold text-green-500">{service.recordsSync.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AutomationsView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-500" />
            AI Automation Workflows
          </CardTitle>
          <CardDescription>Automated workflows powered by AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automations.map(automation => (
              <Card key={automation.id} className="border-cyan-400/30">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{automation.name}</h4>
                        <Badge variant="default" className="bg-green-500">
                          <Activity className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span className="text-muted-foreground">Trigger:</span>
                          <span className="font-medium">{automation.trigger}</span>
                        </div>
                        
                        <div className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-cyan-500 mt-0.5" />
                          <div>
                            <span className="text-muted-foreground">Actions:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {automation.actions.map((action, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4 text-purple-500" />
                            <span className="text-muted-foreground">Runs:</span>
                            <span className="font-semibold">{automation.runs}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button className="w-full mt-4 bg-gradient-to-r from-cyan-400 to-blue-500">
            <Zap className="h-4 w-4 mr-2" />
            Create New Automation
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Advanced CRM & AI Automation
          </h1>
          <p className="text-muted-foreground">
            Autonomous agents and intelligent workflows for compliance management
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'services', label: 'Services', icon: Cloud },
            { id: 'automations', label: 'Automations', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-cyan-500 text-cyan-500'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {selectedTab === 'dashboard' && <DashboardView />}
        {selectedTab === 'services' && <ServicesView />}
        {selectedTab === 'automations' && <AutomationsView />}
      </div>
    </div>
  );
};

export default AdvancedCRM;

