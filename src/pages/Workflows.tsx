import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import {
  fetchWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  fetchWorkflowTasks, addWorkflowTask, updateWorkflowTask,
  fetchTeamMembers, addTeamMember, deleteTeamMember,
  fetchWorkflowStats,
  type Workflow, type WorkflowTask, type TeamMember, type WorkflowStats,
} from '../utils/api';
import {
  GitBranch, Plus, Users, CheckSquare, Clock, AlertTriangle, X,
  Trash2, ArrowLeft, ChevronRight, UserPlus, Play,
} from 'lucide-react';

type WfView = 'overview' | 'workflows' | 'create_workflow' | 'workflow_detail' | 'team';

export default function Workflows() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<WfView>('overview');
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [wfList, setWfList] = useState<Workflow[]>([]);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedWf, setSelectedWf] = useState<Workflow | null>(null);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Workflow form
  const [wfTitle, setWfTitle] = useState('');
  const [wfDesc, setWfDesc] = useState('');
  const [wfType, setWfType] = useState('compliance_review');
  const [wfPriority, setWfPriority] = useState('medium');
  const [wfAssignedTo, setWfAssignedTo] = useState('');
  const [wfDueDate, setWfDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskCompanyNum, setTaskCompanyNum] = useState('');
  const [taskCompanyName, setTaskCompanyName] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Team form
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  const [teamRole, setTeamRole] = useState('analyst');
  const [teamDept, setTeamDept] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation('/login');
  }, [loading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [s, w, t] = await Promise.all([
        fetchWorkflowStats().catch(() => null),
        fetchWorkflows(),
        fetchTeamMembers(),
      ]);
      if (s) setStats(s);
      setWfList(w);
      setTeam(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createWorkflow({
        title: wfTitle,
        description: wfDesc || undefined,
        workflowType: wfType,
        priority: wfPriority,
        assignedTo: wfAssignedTo || undefined,
        dueDate: wfDueDate || undefined,
      });
      setWfTitle(''); setWfDesc(''); setWfType('compliance_review');
      setWfPriority('medium'); setWfAssignedTo(''); setWfDueDate('');
      await loadData();
      setView('workflows');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWf) return;
    setSubmitting(true);
    try {
      await addWorkflowTask(selectedWf.id, {
        title: taskTitle,
        assignedTo: taskAssignedTo || undefined,
        companyNumber: taskCompanyNum || undefined,
        companyName: taskCompanyName || undefined,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
      });
      setShowTaskForm(false);
      setTaskTitle(''); setTaskAssignedTo(''); setTaskCompanyNum('');
      setTaskCompanyName(''); setTaskPriority('medium'); setTaskDueDate('');
      const t = await fetchWorkflowTasks(selectedWf.id);
      setTasks(t);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateWorkflowTask(taskId, { status: newStatus } as Partial<WorkflowTask>);
      if (selectedWf) {
        const t = await fetchWorkflowTasks(selectedWf.id);
        setTasks(t);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleWfStatusChange = async (wfId: string, newStatus: string) => {
    try {
      await updateWorkflow(wfId, { status: newStatus } as Partial<Workflow>);
      await loadData();
    } catch (err) {
      console.error('Failed to update workflow:', err);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await deleteWorkflow(id);
      await loadData();
      if (selectedWf?.id === id) {
        setSelectedWf(null);
        setView('workflows');
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addTeamMember({ name: teamName, email: teamEmail, role: teamRole, department: teamDept || undefined });
      setShowTeamForm(false);
      setTeamName(''); setTeamEmail(''); setTeamRole('analyst'); setTeamDept('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    try {
      await deleteTeamMember(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete team member:', err);
    }
  };

  const openWfDetail = async (wf: Workflow) => {
    setSelectedWf(wf);
    setView('workflow_detail');
    try {
      const t = await fetchWorkflowTasks(wf.id);
      setTasks(t);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  if (loading || !isAuthenticated || !user) return null;

  const typeLabels: Record<string, string> = {
    compliance_review: 'Compliance Review',
    company_enrichment: 'Company Enrichment',
    filing_batch: 'Filing Batch',
    risk_assessment: 'Risk Assessment',
    onboarding: 'Client Onboarding',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-700 text-slate-300',
    active: 'bg-blue-900/30 text-blue-400',
    paused: 'bg-yellow-900/30 text-yellow-400',
    completed: 'bg-emerald-900/30 text-emerald-400',
    cancelled: 'bg-red-900/30 text-red-400',
    pending: 'bg-slate-700 text-slate-300',
    in_progress: 'bg-blue-900/30 text-blue-400',
    review: 'bg-purple-900/30 text-purple-400',
    blocked: 'bg-red-900/30 text-red-400',
  };

  const priorityColors: Record<string, string> = {
    low: 'text-slate-400',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <GitBranch className="text-blue-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Workflows</h1>
            <p className="text-sm text-slate-400">Team assignments & business processes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLocation('/dashboard')}
            className="px-3 py-2 text-sm bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
            Dashboard
          </button>
          <button onClick={() => setLocation('/acsp')}
            className="px-3 py-2 text-sm bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
            ACSP
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-300"><X size={14} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-lg p-1">
        {(['overview', 'workflows', 'create_workflow', 'team'] as WfView[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}>
            {v === 'overview' ? 'Overview' : v === 'workflows' ? 'Workflows' : v === 'create_workflow' ? 'Create' : 'Team'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <div>
          {loadingData ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Workflows" value={stats.totalWorkflows} icon={<GitBranch size={20} />} color="blue" />
                <StatCard label="Active" value={stats.activeWorkflows} icon={<Play size={20} />} color="emerald" />
                <StatCard label="Completed" value={stats.completedWorkflows} icon={<CheckSquare size={20} />} color="purple" />
                <StatCard label="Team Size" value={stats.teamSize} icon={<Users size={20} />} color="amber" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Tasks" value={stats.totalTasks} icon={<CheckSquare size={20} />} color="slate" />
                <StatCard label="In Progress" value={stats.inProgressTasks} icon={<Clock size={20} />} color="blue" />
                <StatCard label="Completed Tasks" value={stats.completedTasks} icon={<CheckSquare size={20} />} color="emerald" />
                <StatCard label="Blocked" value={stats.blockedTasks} icon={<AlertTriangle size={20} />} color="red" />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <GitBranch className="mx-auto mb-4 text-slate-600" size={48} />
              <h3 className="text-lg font-semibold text-white mb-2">No workflows yet</h3>
              <p className="text-slate-400 mb-4">Create your first workflow to manage compliance tasks</p>
              <button onClick={() => setView('create_workflow')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                <Plus size={16} className="inline mr-2" />Create Workflow
              </button>
            </div>
          )}
        </div>
      )}

      {/* Workflows List */}
      {view === 'workflows' && (
        <div>
          {wfList.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="mx-auto mb-4 text-slate-600" size={48} />
              <p className="text-slate-400">No workflows created yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wfList.map(wf => (
                <div key={wf.id} onClick={() => openWfDetail(wf)}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-blue-600/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{wf.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[wf.status] || ''}`}>{wf.status}</span>
                        <span className={`text-xs ${priorityColors[wf.priority] || ''}`}>{wf.priority}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                        <span>{typeLabels[wf.workflowType] || wf.workflowType}</span>
                        {wf.dueDate && <span>Due: {wf.dueDate}</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Workflow */}
      {view === 'create_workflow' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Create Workflow</h2>
            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <input value={wfTitle} onChange={e => setWfTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea value={wfDesc} onChange={e => setWfDesc(e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Type *</label>
                  <select value={wfType} onChange={e => setWfType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white">
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                  <select value={wfPriority} onChange={e => setWfPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Assign To</label>
                  <select value={wfAssignedTo} onChange={e => setWfAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white">
                    <option value="">Unassigned</option>
                    {team.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
                  <input type="date" value={wfDueDate} onChange={e => setWfDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white" />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Workflow'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Detail */}
      {view === 'workflow_detail' && selectedWf && (
        <div>
          <button onClick={() => { setView('workflows'); setSelectedWf(null); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm">
            <ArrowLeft size={16} /> Back to Workflows
          </button>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedWf.title}</h2>
                <p className="text-sm text-slate-400">{typeLabels[selectedWf.workflowType] || selectedWf.workflowType}</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={selectedWf.status} onChange={e => handleWfStatusChange(selectedWf.id, e.target.value)}
                  className={`text-sm px-3 py-1.5 rounded-lg border-0 ${statusColors[selectedWf.status] || ''}`}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={() => handleDeleteWorkflow(selectedWf.id)}
                  className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            {selectedWf.description && (
              <p className="text-slate-300 text-sm mb-4">{selectedWf.description}</p>
            )}
            <div className="flex gap-4 text-sm text-slate-400">
              <span className={priorityColors[selectedWf.priority] || ''}>Priority: {selectedWf.priority}</span>
              {selectedWf.dueDate && <span>Due: {selectedWf.dueDate}</span>}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Tasks ({tasks.length})</h3>
              <button onClick={() => setShowTaskForm(!showTaskForm)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">
                <Plus size={14} className="inline mr-1" />Add Task
              </button>
            </div>

            {showTaskForm && (
              <form onSubmit={handleAddTask} className="bg-slate-900/50 rounded-lg p-4 mb-4 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Task Title *</label>
                  <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Assign To</label>
                    <select value={taskAssignedTo} onChange={e => setTaskAssignedTo(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm">
                      <option value="">Unassigned</option>
                      {team.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Priority</label>
                    <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Due Date</label>
                    <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Company Number</label>
                    <input value={taskCompanyNum} onChange={e => setTaskCompanyNum(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                    <input value={taskCompanyName} onChange={e => setTaskCompanyName(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
                    {submitting ? 'Adding...' : 'Add Task'}
                  </button>
                  <button type="button" onClick={() => setShowTaskForm(false)}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-sm">Cancel</button>
                </div>
              </form>
            )}

            {tasks.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No tasks yet. Add one to get started.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(t => {
                  const assignee = team.find(m => m.id === t.assignedTo);
                  return (
                    <div key={t.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{t.title}</span>
                          <span className={`text-xs ${priorityColors[t.priority] || ''}`}>{t.priority}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          {assignee && <span>@{assignee.name}</span>}
                          {t.companyName && <span>{t.companyName} ({t.companyNumber})</span>}
                          {t.dueDate && <span>Due: {t.dueDate}</span>}
                        </div>
                      </div>
                      <select value={t.status} onChange={e => handleTaskStatusChange(t.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border-0 ${statusColors[t.status] || ''}`}>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Management */}
      {view === 'team' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Team Members ({team.length})</h2>
            <button onClick={() => setShowTeamForm(!showTeamForm)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">
              <UserPlus size={14} className="inline mr-1" />Add Member
            </button>
          </div>

          {showTeamForm && (
            <form onSubmit={handleAddTeamMember} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Name *</label>
                  <input value={teamName} onChange={e => setTeamName(e.target.value)} required
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email *</label>
                  <input type="email" value={teamEmail} onChange={e => setTeamEmail(e.target.value)} required
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Role</label>
                  <select value={teamRole} onChange={e => setTeamRole(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="analyst">Analyst</option>
                    <option value="reviewer">Reviewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Department</label>
                  <input value={teamDept} onChange={e => setTeamDept(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm" placeholder="e.g. Compliance" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
                <button type="button" onClick={() => setShowTeamForm(false)}
                  className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-sm">Cancel</button>
              </div>
            </form>
          )}

          {team.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto mb-4 text-slate-600" size={48} />
              <p className="text-slate-400">No team members yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {team.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div>
                    <h3 className="font-semibold text-white">{m.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                      <span>{m.email}</span>
                      <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs">{m.role}</span>
                      {m.department && <span>{m.department}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteTeamMember(m.id)}
                    className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-900/20',
    emerald: 'text-emerald-400 bg-emerald-900/20',
    purple: 'text-purple-400 bg-purple-900/20',
    amber: 'text-amber-400 bg-amber-900/20',
    red: 'text-red-400 bg-red-900/20',
    slate: 'text-slate-400 bg-slate-900/20',
  };
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`p-2 rounded-lg ${colorMap[color] || colorMap.slate}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
