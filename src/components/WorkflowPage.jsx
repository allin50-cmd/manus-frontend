import React, { useState, useEffect } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Workflow, Play, Pause, Plus, Edit, Trash2, Copy, Clock, CheckCircle2, AlertCircle, Mail, MessageSquare, Bell, Database, Code, Loader2 } from 'lucide-react'

export default function WorkflowPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [workflows, setWorkflows] = useState([])
  const [triggerTypes, setTriggerTypes] = useState([])
  const [actionTypes, setActionTypes] = useState([])
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true)
  const [isLoadingTriggerTypes, setIsLoadingTriggerTypes] = useState(true)
  const [isLoadingActionTypes, setIsLoadingActionTypes] = useState(true)
  const [errorWorkflows, setErrorWorkflows] = useState(null)
  const [errorTriggerTypes, setErrorTriggerTypes] = useState(null)
  const [errorActionTypes, setErrorActionTypes] = useState(null)

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await api.get('/api/workflows');
        setWorkflows(response.data);
      } catch (err) {
        console.error('Error fetching workflows:', err);
        setErrorWorkflows('Failed to load workflows.');
      } finally {
        setIsLoadingWorkflows(false);
      }
    };

    const fetchTriggerTypes = async () => {
      try {
        const response = await api.get('/api/triggerTypes');
        setTriggerTypes(response.data);
      } catch (err) {
        console.error('Error fetching trigger types:', err);
        setErrorTriggerTypes('Failed to load trigger types.');
      } finally {
        setIsLoadingTriggerTypes(false);
      }
    };

    const fetchActionTypes = async () => {
      try {
        const response = await api.get('/api/actionTypes');
        setActionTypes(response.data);
      } catch (err) {
        console.error('Error fetching action types:', err);
        setErrorActionTypes('Failed to load action types.');
      } finally {
        setIsLoadingActionTypes(false);
      }
    };

    fetchWorkflows();
    fetchTriggerTypes();
    fetchActionTypes();
  }, []);

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

  if (isLoadingWorkflows || isLoadingTriggerTypes || isLoadingActionTypes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        <p className="text-white ml-3 text-lg">Loading workflows...</p>
      </div>
    );
  }

  if (errorWorkflows || errorTriggerTypes || errorActionTypes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-white ml-3 text-lg">Error: {errorWorkflows || errorTriggerTypes || errorActionTypes}</p>
      </div>
    );
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
                {(workflows.reduce((sum, w) => sum + w.successRate, 0) / (workflows.length || 1)).toFixed(1)}%
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
                        {triggerTypes.find(t => t.id === workflow.trigger)?.name || workflow.trigger}
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
                              {actionTypes.find(at => at.id === action.type)?.name || action.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mt-4">
                      <div>Last Run: <span className="text-white">{workflow.lastRun ? new Date(workflow.lastRun).toLocaleString() : 'N/A'}</span></div>
                      <div>Created: <span className="text-white">{workflow.created ? new Date(workflow.created).toLocaleDateString() : 'N/A'}</span></div>
                      <div>Executions: <span className="text-white">{workflow.executions}</span></div>
                      <div>Success Rate: <span className="text-white">{workflow.successRate}%</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => handleToggleWorkflow(workflow.id)}>
                      {workflow.status === 'active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => handleEditWorkflow(workflow.id)}>
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => handleDuplicateWorkflow(workflow.id)}>
                      <Copy className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500" onClick={() => handleDeleteWorkflow(workflow.id)}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
