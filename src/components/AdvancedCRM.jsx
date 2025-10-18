import React, { useState, useEffect } from 'react';
import api from '../utils/api';
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
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [automationsLoading, setAutomationsLoading] = useState(true);
  const [automationsError, setAutomationsError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [agentLogs, setAgentLogs] = useState([]);

  // Initialize services and agents on mount
  useEffect(() => {
    fetchServices();
    fetchAgents();
    fetchAutomations();
  }, []);

  // Simulate agent activity after agents are loaded
  useEffect(() => {
    if (!agentsLoading && !agentsError && activeAgents.length > 0) {
      const interval = setInterval(() => {
        addAgentLog();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeAgents, agentsLoading, agentsError]);

  const fetchServices = async () => {
    setServicesLoading(true);
    setServicesError(null);
    try {
      const response = await api.request('get', '/services');
      setServices(response);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServicesError('Failed to load services.');
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchAgents = async () => {
    setAgentsLoading(true);
    setAgentsError(null);
    try {
      const response = await api.request('get', '/agents');
      setActiveAgents(response);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgentsError("Failed to load agents.");
    } finally {
      setAgentsLoading(false);
    }
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

  const fetchAutomations = async () => {
    setAutomationsLoading(true);
    setAutomationsError(null);
    try {
      const response = await api.request("get", "/automations");
      setAutomations(response);
    } catch (error) {
      console.error("Error fetching automations:", error);
      setAutomationsError("Failed to load automations.");
    } finally {
      setAutomationsLoading(false);
    }
  };

  const toggleAgent = (agentId) => {
    setActiveAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'running' ? 'paused' : 'running' }
        : agent
    ));
  };

  const DashboardView = () => {
    if (agentsLoading || servicesLoading) return <div className="text-center py-8">Loading dashboard data...</div>;
    if (agentsError || servicesError) return <div className="text-center py-8 text-red-500">Error loading dashboard data.</div>;
    return (
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
              {!agentsLoading && !agentsError && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
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
  };

  const ServicesView = () => {
    if (servicesLoading) return <div className="text-center py-8">Loading services...</div>;
    if (servicesError) return <div className="text-center py-8 text-red-500">{servicesError}</div>;
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-500" />
              Connected Services
            </CardTitle>
            <CardDescription>Manage and monitor your data integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(service => (
                <Card key={service.id} className={service.status === 'connected' ? 'border-green-400/30' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{service.icon}</div>
                        <div>
                          <h4 className="font-semibold">{service.name}</h4>
                          <Badge variant={service.status === 'connected' ? 'default' : 'secondary'} className="mt-1">
                            {service.status === 'connected' ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                            ) : (
                              <><Cloud className="h-3 w-3 mr-1" /> Ready</>
                            )}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        {service.status === 'connected' ? <RefreshCw className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Sync:</span>
                        <span className="font-semibold">{service.lastSync ? new Date(service.lastSync).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Records Synced:</span>
                        <span className="font-semibold">{service.recordsSync}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const AutomationsView = () => {
    if (automationsLoading) return <div className="text-center py-8">Loading automations...</div>;
    if (automationsError) return <div className="text-center py-8 text-red-500">{automationsError}</div>;
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-500" />
              Automation Workflows
            </CardTitle>
            <CardDescription>Create and manage automated processes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {automations.map(automation => (
                <Card key={automation.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{automation.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{automation.trigger}</p>
                      </div>
                      <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                        {automation.status === 'active' ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                        {automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                      {automation.actions.map((action, i) => (
                        <React.Fragment key={i}>
                          <span>{action}</span>
                          {i < automation.actions.length - 1 && <ArrowRight className="h-4 w-4" />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">{automation.runs} runs</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button className="mt-6 w-full">
              <Zap className="h-4 w-4 mr-2" />
              Create New Automation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Advanced CRM & AI Automation
          </h1>
          <p className="text-muted-foreground">
            Your intelligent command center for managing clients, services, and automations.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b mb-6">
          <Button variant={selectedTab === 'dashboard' ? 'ghost' : 'ghost'} onClick={() => setSelectedTab('dashboard')} className={`rounded-none ${selectedTab === 'dashboard' ? 'border-b-2 border-primary text-primary' : ''}`}>Dashboard</Button>
          <Button variant={selectedTab === 'services' ? 'ghost' : 'ghost'} onClick={() => setSelectedTab('services')} className={`rounded-none ${selectedTab === 'services' ? 'border-b-2 border-primary text-primary' : ''}`}>Services</Button>
          <Button variant={selectedTab === 'automations' ? 'ghost' : 'ghost'} onClick={() => setSelectedTab('automations')} className={`rounded-none ${selectedTab === 'automations' ? 'border-b-2 border-primary text-primary' : ''}`}>Automations</Button>
        </div>

        {/* Tab Content */}
        {selectedTab === 'dashboard' && <DashboardView />}
        {selectedTab === 'services' && <ServicesView />}
        {selectedTab === 'automations' && <AutomationsView />}
      </div>
    </div>
  );
};

export default AdvancedCRM;
