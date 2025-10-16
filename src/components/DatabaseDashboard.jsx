import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Database, Users, Building2, Bot, FileText, ClipboardList, DollarSign, Calendar, RefreshCw } from 'lucide-react';

export default function DatabaseDashboard() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [agents, setAgents] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        usersData,
        companiesData,
        agentsData,
        obligationsData,
        documentsData,
        tasksData,
        invoicesData,
        clientsData,
        projectsData,
        leadsData,
        statsData
      ] = await Promise.all([
        api.request('/api/users'),
        api.request('/api/companies'),
        api.request('/api/agents'),
        api.request('/api/obligations'),
        api.request('/api/documents'),
        api.request('/api/tasks'),
        api.request('/api/invoices'),
        api.request('/api/clients'),
        api.request('/api/projects'),
        api.request('/api/leads'),
        api.request('/api/dashboard/stats')
      ]);

      setUsers(usersData);
      setCompanies(companiesData);
      setAgents(agentsData);
      setObligations(obligationsData);
      setDocuments(documentsData);
      setTasks(tasksData);
      setInvoices(invoicesData);
      setClients(clientsData);
      setProjects(projectsData);
      setLeads(leadsData);
      setStats(statsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load data from database: ' + err.message);
      console.error('Database load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-500" />
          <p className="text-lg">Loading data from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Database Connection Error</h2>
          <p className="text-red-600">{error}</p>
          <Button onClick={loadAllData} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-500" />
            Live Database Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            All data loaded from real database • Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={loadAllData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users || users.length}</div>
            <Badge variant="outline" className="mt-2">From Database</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_companies || companies.length}</div>
            <Badge variant="outline" className="mt-2">From Database</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_agents || agents.length}</div>
            <Badge variant="outline" className="mt-2">From Database</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obligations</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_obligations || obligations.length}</div>
            <Badge variant="outline" className="mt-2">From Database</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({users.length})
            </CardTitle>
            <CardDescription>Live data from /api/users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge>{user.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Companies ({companies.length})
            </CardTitle>
            <CardDescription>Live data from /api/companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {companies.map(company => (
                <div key={company.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-muted-foreground">#{company.number}</div>
                  </div>
                  <Badge variant={company.risk === 'low' ? 'default' : 'destructive'}>
                    {company.risk}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Obligations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Obligations ({obligations.length})
            </CardTitle>
            <CardDescription>Live data from /api/obligations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {obligations.slice(0, 5).map(obligation => (
                <div key={obligation.id} className="p-2 border rounded">
                  <div className="font-medium">{obligation.title}</div>
                  <div className="text-sm text-muted-foreground">Due: {obligation.due_date}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents ({documents.length})
            </CardTitle>
            <CardDescription>Live data from /api/documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.slice(0, 5).map(doc => (
                <div key={doc.id} className="p-2 border rounded">
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-sm text-muted-foreground">{doc.type}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Tasks ({tasks.length})
            </CardTitle>
            <CardDescription>Live data from /api/tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="p-2 border rounded">
                  <div className="font-medium">{task.title}</div>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Invoices ({invoices.length})
            </CardTitle>
            <CardDescription>Live data from /api/invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{invoice.number}</div>
                    <div className="text-sm text-muted-foreground">£{invoice.amount}</div>
                  </div>
                  <Badge>{invoice.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Data Counts */}
      <Card>
        <CardHeader>
          <CardTitle>All Database Tables</CardTitle>
          <CardDescription>Complete overview of all connected data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-cyan-600">{clients.length}</div>
              <div className="text-sm text-muted-foreground">Clients</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-cyan-600">{projects.length}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-cyan-600">{leads.length}</div>
              <div className="text-sm text-muted-foreground">Leads</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-cyan-600">{agents.length}</div>
              <div className="text-sm text-muted-foreground">AI Agents</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-muted-foreground">All Connected</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

