import React, { useState } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Workflow, Play, Pause, Plus, Edit, Trash2, Copy, Clock, CheckCircle2, AlertCircle, Mail, MessageSquare, Bell, Database, Code } from 'lucide-react'

export default function WorkflowPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  
  const workflows = [
    {
      id: 1,
      name: 'Overdue Obligation Alert',
      description: 'Automatically send alerts when obligations become overdue',
      status: 'active',
      trigger: 'obligation.overdue',
      actions: [
        { type: 'email', target: 'Company Contact', template: 'Overdue Alert' },
        { type: 'sms', target: 'Account Manager', message: 'Urgent: Overdue obligation' },
        { type: 'slack', channel: '#compliance', message: 'New overdue obligation' }
      ],
      executions: 342,
      successRate: 98.5,
      lastRun: '2024-10-16T10:30:00',
      created: '2024-01-15'
    },
    {
      id: 2,
      name: 'New Company Onboarding',
      description: 'Automated workflow for new company registration',
      status: 'active',
      trigger: 'company.created',
      actions: [
        { type: 'database', action: 'Enrich company data from Companies House' },
        { type: 'email', target: 'Welcome Email', template: 'Welcome Template' },
        { type: 'crm', action: 'Create CRM record' },
        { type: 'task', action: 'Assign to account manager' }
      ],
      executions: 128,
      successRate: 99.2,
      lastRun: '2024-10-16T09:15:00',
      created: '2024-02-20'
    },
    {
      id: 3,
      name: 'Weekly Compliance Report',
      description: 'Generate and send weekly compliance summary',
      status: 'active',
      trigger: 'schedule.weekly',
      actions: [
        { type: 'report', action: 'Generate compliance report' },
        { type: 'email', target: 'All Managers', template: 'Weekly Report' },
        { type: 'database', action: 'Archive report' }
      ],
      executions: 52,
      successRate: 100,
      lastRun: '2024-10-14T09:00:00',
      created: '2024-03-10'
    },
    {
      id: 4,
      name: 'High Risk Company Alert',
      description: 'Alert when AI detects high-risk company',
      status: 'active',
      trigger: 'ai.high_risk_detected',
      actions: [
        { type: 'email', target: 'Compliance Team', template: 'Risk Alert' },
        { type: 'slack', channel: '#risk-management', message: 'High risk detected' },
        { type: 'task', action: 'Create review task' }
      ],
      executions: 45,
      successRate: 97.8,
      lastRun: '2024-10-15T16:20:00',
      created: '2024-04-05'
    },
    {
      id: 5,
      name: 'Payment Received Workflow',
      description: 'Process payment and update records',
      status: 'active',
      trigger: 'payment.received',
      actions: [
        { type: 'database', action: 'Update payment status' },
        { type: 'email', target: 'Customer', template: 'Payment Confirmation' },
        { type: 'invoice', action: 'Generate receipt' }
      ],
      executions: 892,
      successRate: 99.9,
      lastRun: '2024-10-16T11:45:00',
      created: '2024-01-20'
    },
    {
      id: 6,
      name: 'Churn Risk Mitigation',
      description: 'Engage at-risk customers automatically',
      status: 'paused',
      trigger: 'ai.churn_risk_high',
      actions: [
        { type: 'email', target: 'Customer Success', template: 'Churn Alert' },
        { type: 'task', action: 'Schedule check-in call' },
        { type: 'crm', action: 'Update customer status' }
      ],
      executions: 23,
      successRate: 95.7,
      lastRun: '2024-10-10T14:30:00',
      created: '2024-05-15'
    }
  ]
  
  const triggerTypes = [
    { id: 'obligation.overdue', name: 'Obligation Overdue', icon: AlertCircle, color: 'red' },
    { id: 'company.created', name: 'Company Created', icon: Plus, color: 'green' },
    { id: 'payment.received', name: 'Payment Received', icon: CheckCircle2, color: 'green' },
    { id: 'ai.high_risk_detected', name: 'AI Risk Detection', icon: AlertCircle, color: 'yellow' },
    { id: 'schedule.daily', name: 'Daily Schedule', icon: Clock, color: 'blue' },
    { id: 'schedule.weekly', name: 'Weekly Schedule', icon: Clock, color: 'blue' }
  ]
  
  const actionTypes = [
    { id: 'email', name: 'Send Email', icon: Mail, color: 'blue' },
    { id: 'sms', name: 'Send SMS', icon: MessageSquare, color: 'green' },
    { id: 'slack', name: 'Slack Notification', icon: Bell, color: 'purple' },
    { id: 'database', name: 'Database Action', icon: Database, color: 'yellow' },
    { id: 'webhook', name: 'Webhook', icon: Code, color: 'orange' }
  ]
  
  const getActionIcon = (type) => {
    switch(type) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'sms': return <MessageSquare className="w-4 h-4" />
      case 'slack': return <Bell className="w-4 h-4" />
      case 'database': return <Database className="w-4 h-4" />
      case 'webhook': return <Code className="w-4 h-4" />
      default: return <CheckCircle2 className="w-4 h-4" />
    }
  }
  
  const handleToggleWorkflow = (id) => {
    alert(`Toggling workflow ${id}...`)
  }
  
  const handleEditWorkflow = (id) => {
    setSelectedWorkflow(workflows.find(w => w.id === id))
    alert(`Editing workflow ${id}...`)
  }
  
  const handleDeleteWorkflow = (id) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      alert(`Deleting workflow ${id}...`)
    }
  }
  
  const handleDuplicateWorkflow = (id) => {
    alert(`Duplicating workflow ${id}...`)
  }
  
  const handleCreateWorkflow = () => {
    alert('Opening workflow builder...')
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Workflow className="w-10 h-10" />
              Workflow Automation
            </h1>
            <p className="text-gray-300">Create and manage automated workflows for your compliance processes</p>
          </div>
          <Button
            onClick={handleCreateWorkflow}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>
        
        {/* Workflow Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Workflow className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {workflows.length}
              </div>
              <div className="text-sm text-gray-300">Total Workflows</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Play className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {workflows.filter(w => w.status === 'active').length}
              </div>
              <div className="text-sm text-gray-300">Active Workflows</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {workflows.reduce((sum, w) => sum + w.executions, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-300">Total Executions</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-300">Avg Success Rate</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Workflows List */}
        <div className="space-y-4 mb-8">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{workflow.name}</h3>
                      <Badge className={workflow.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-gray-500/20 text-gray-300 border-gray-500/50'}>
                        {workflow.status === 'active' ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                        {workflow.status}
                      </Badge>
                    </div>
                    <p className="text-gray-300 mb-3">{workflow.description}</p>
                    
                    {/* Trigger */}
                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-1">Trigger:</div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                        {workflow.trigger}
                      </Badge>
                    </div>
                    
                    {/* Actions */}
                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-2">Actions ({workflow.actions.length}):</div>
                      <div className="flex flex-wrap gap-2">
                        {workflow.actions.map((action, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                            {getActionIcon(action.type)}
                            <span className="text-sm text-gray-300">
                              {action.target || action.action || action.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Statistics */}
                    <div className="flex gap-6 text-sm text-gray-300">
                      <div>
                        <span className="text-gray-400">Executions:</span> {workflow.executions}
                      </div>
                      <div>
                        <span className="text-gray-400">Success Rate:</span> {workflow.successRate}%
                      </div>
                      <div>
                        <span className="text-gray-400">Last Run:</span> {new Date(workflow.lastRun).toLocaleString()}
                      </div>
                      <div>
                        <span className="text-gray-400">Created:</span> {workflow.created}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleToggleWorkflow(workflow.id)}
                      className={`${workflow.status === 'active' ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300' : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'}`}
                      size="sm"
                    >
                      {workflow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => handleEditWorkflow(workflow.id)}
                      className="bg-white/10 hover:bg-white/20 text-white"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDuplicateWorkflow(workflow.id)}
                      className="bg-white/10 hover:bg-white/20 text-white"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Workflow Builder Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Available Triggers</CardTitle>
              <CardDescription className="text-gray-300">
                Events that can start a workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {triggerTypes.map((trigger) => {
                  const Icon = trigger.icon
                  return (
                    <div key={trigger.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <Icon className={`w-5 h-5 text-${trigger.color}-400`} />
                      <div>
                        <div className="text-white font-medium">{trigger.name}</div>
                        <code className="text-xs text-gray-400">{trigger.id}</code>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Available Actions</CardTitle>
              <CardDescription className="text-gray-300">
                Actions that can be performed in workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {actionTypes.map((action) => {
                  const Icon = action.icon
                  return (
                    <div key={action.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <Icon className={`w-5 h-5 text-${action.color}-400`} />
                      <div>
                        <div className="text-white font-medium">{action.name}</div>
                        <code className="text-xs text-gray-400">{action.id}</code>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

