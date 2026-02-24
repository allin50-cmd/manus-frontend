/**
 * Workflows Page
 * Typed workflow builder, manager, and runner
 */
import React, { useState, useCallback } from 'react';
import {
  Play, Pause, Archive, Plus, ChevronRight, Zap, Clock,
  CheckCircle2, XCircle, AlertTriangle, Settings2, BarChart3,
  Workflow as WorkflowIcon, Copy, Trash2, RefreshCw, Eye,
  Timer, TrendingUp, Filter,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn, formatNumber, timeAgo } from '@/lib/utils';
import { SAMPLE_WORKFLOWS, WORKFLOW_TEMPLATES, runWorkflow } from '@/services/workflowEngine';
import type { WorkflowDefinition, WorkflowStatus, StepResult, WorkflowCategory } from '@/types/workflows';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusConfig(status: WorkflowStatus) {
  return {
    active:    { label: 'Active',    variant: 'green'  as const, dot: true },
    running:   { label: 'Running',   variant: 'cyan'   as const, dot: true },
    paused:    { label: 'Paused',    variant: 'orange' as const, dot: false },
    draft:     { label: 'Draft',     variant: 'gray'   as const, dot: false },
    archived:  { label: 'Archived',  variant: 'gray'   as const, dot: false },
    completed: { label: 'Completed', variant: 'green'  as const, dot: false },
    failed:    { label: 'Failed',    variant: 'red'    as const, dot: false },
  }[status];
}

const categoryColors: Record<WorkflowCategory, string> = {
  compliance:      'text-yellow-400 bg-yellow-500/10',
  intake:          'text-cyan-400 bg-cyan-500/10',
  audit:           'text-purple-400 bg-purple-500/10',
  ai_analysis:     'text-pink-400 bg-pink-500/10',
  notifications:   'text-blue-400 bg-blue-500/10',
  data_processing: 'text-green-400 bg-green-500/10',
  document:        'text-orange-400 bg-orange-500/10',
  risk_assessment: 'text-red-400 bg-red-500/10',
};

function stepStatusIcon(status: StepResult['status']) {
  if (status === 'running')  return <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />;
  if (status === 'success')  return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
  if (status === 'error')    return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  if (status === 'skipped')  return <ChevronRight className="w-3.5 h-3.5 text-gray-600" />;
  return <div className="w-3.5 h-3.5 rounded-full border border-white/20" />;
}

// ─── Workflow Run Dialog ───────────────────────────────────────────────────────

function WorkflowRunDialog({ workflow, onClose }: { workflow: WorkflowDefinition; onClose: () => void }) {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stepResults, setStepResults] = useState<Record<string, StepResult>>({});
  const [totalTime, setTotalTime] = useState(0);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setStepResults({});
    const start = Date.now();

    try {
      await runWorkflow(workflow, {}, (stepId, result) => {
        setStepResults((prev) => ({ ...prev, [stepId]: result }));
      });
      setTotalTime(Date.now() - start);
      setCompleted(true);
    } finally {
      setRunning(false);
    }
  }, [workflow]);

  const allSteps = workflow.steps;
  const successCount = Object.values(stepResults).filter((r) => r.status === 'success').length;

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogHeader>
        <DialogTitle>Run Workflow: {workflow.name}</DialogTitle>
        <DialogClose onClose={onClose} />
      </DialogHeader>
      <DialogBody>
        {!running && !completed && (
          <div>
            <p className="text-sm text-gray-400 mb-4">{workflow.description}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-lg font-bold text-white">{allSteps.length}</p>
                <p className="text-xs text-gray-500">Steps</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-lg font-bold text-white">{workflow.runCount}</p>
                <p className="text-xs text-gray-500">Total Runs</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-lg font-bold text-white">{workflow.avgDurationMs ? `${(workflow.avgDurationMs / 1000).toFixed(1)}s` : 'N/A'}</p>
                <p className="text-xs text-gray-500">Avg Time</p>
              </div>
            </div>
          </div>
        )}

        {(running || completed) && (
          <div className="space-y-2">
            {allSteps.map((step, i) => {
              const result = stepResults[step.id];
              const status = result?.status ?? 'idle';
              return (
                <div key={step.id} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-colors', status === 'running' ? 'bg-cyan-500/5 border-cyan-500/20' : status === 'success' ? 'bg-green-500/5 border-green-500/20' : status === 'error' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/3 border-white/5')}>
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-gray-600 shrink-0">{i + 1}</div>
                  {stepStatusIcon(status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{step.name}</p>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                  <Badge variant={step.category === 'ai' ? 'purple' : step.category === 'condition' ? 'orange' : 'gray'} className="text-[10px]">
                    {step.category}
                  </Badge>
                  {result?.durationMs && <span className="text-[10px] text-gray-600 font-mono">{result.durationMs}ms</span>}
                </div>
              );
            })}

            {completed && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-semibold text-green-400">Workflow Completed</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold text-white">{successCount}/{allSteps.length}</p>
                    <p className="text-[10px] text-gray-500">Steps passed</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">{(totalTime / 1000).toFixed(1)}s</p>
                    <p className="text-[10px] text-gray-500">Total time</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">100%</p>
                    <p className="text-[10px] text-gray-500">Success rate</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {!running && !completed && (
          <Button variant="primary" onClick={handleRun} loading={running}>
            <Play className="w-3.5 h-3.5 mr-1.5" /> Run Now
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

// ─── Workflow Card ────────────────────────────────────────────────────────────

function WorkflowCard({ workflow, onRun }: { workflow: WorkflowDefinition; onRun: () => void }) {
  const cfg = statusConfig(workflow.status);
  const successRate = workflow.runCount > 0 ? Math.round((workflow.successCount / workflow.runCount) * 100) : 0;
  const colorClass = categoryColors[workflow.category] ?? 'text-gray-400 bg-gray-500/10';

  return (
    <Card className="hover:border-white/20 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}>
            {workflow.category.replace('_', ' ')}
          </div>
          <Badge variant={cfg.variant} dot={cfg.dot}>{cfg.label}</Badge>
        </div>

        <h3 className="text-sm font-semibold text-white mb-1">{workflow.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{workflow.description}</p>

        {/* Step indicator */}
        <div className="flex gap-1 mb-3">
          {workflow.steps.slice(0, 8).map((step, i) => (
            <div key={step.id} className={cn('h-1 flex-1 rounded-full', i === 0 ? 'bg-brand-purple' : 'bg-white/10')} title={step.name} />
          ))}
          {workflow.steps.length > 8 && <span className="text-[10px] text-gray-600 ml-1">+{workflow.steps.length - 8}</span>}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-white/5 rounded-lg py-1.5">
            <p className="text-sm font-bold text-white">{workflow.runCount}</p>
            <p className="text-[10px] text-gray-600">Runs</p>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5">
            <p className={cn('text-sm font-bold', successRate >= 90 ? 'text-green-400' : successRate >= 70 ? 'text-yellow-400' : 'text-red-400')}>{successRate}%</p>
            <p className="text-[10px] text-gray-600">Success</p>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5">
            <p className="text-sm font-bold text-white">{workflow.steps.length}</p>
            <p className="text-[10px] text-gray-600">Steps</p>
          </div>
        </div>

        {workflow.lastRunAt && (
          <p className="text-[10px] text-gray-600 mb-3">Last run {timeAgo(workflow.lastRunAt)}</p>
        )}

        <div className="flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" onClick={onRun}>
            <Play className="w-3 h-3 mr-1" /> Run
          </Button>
          <Button variant="ghost" size="sm">
            <Settings2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm">
            <BarChart3 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Workflows() {
  const [workflows, setWorkflows] = useState(SAMPLE_WORKFLOWS);
  const [activeTab, setActiveTab] = useState('workflows');
  const [runningWorkflow, setRunningWorkflow] = useState<WorkflowDefinition | null>(null);

  const activeCount = workflows.filter((w) => w.status === 'active').length;
  const totalRuns = workflows.reduce((s, w) => s + w.runCount, 0);

  return (
    <DashboardLayout
      title="Workflows"
      subtitle="Typed intelligent automation pipelines"
      actions={
        <Button variant="primary" size="sm">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Workflow
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Workflows', value: workflows.length, icon: WorkflowIcon, color: 'text-purple-400' },
          { label: 'Active', value: activeCount, icon: Zap, color: 'text-green-400' },
          { label: 'Total Runs', value: formatNumber(totalRuns), icon: BarChart3, color: 'text-cyan-400' },
          { label: 'Avg Success', value: `${Math.round(workflows.filter(w => w.runCount > 0).reduce((s, w) => s + w.successCount / w.runCount, 0) / workflows.filter(w => w.runCount > 0).length * 100)}%`, icon: TrendingUp, color: 'text-yellow-400' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-lg font-bold text-white tabular-nums">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
        </TabsList>

        {/* My Workflows */}
        <TabsContent value="workflows">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <WorkflowCard key={wf.id} workflow={wf} onRun={() => setRunningWorkflow(wf)} />
            ))}
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {WORKFLOW_TEMPLATES.map((tpl) => {
              const colorClass = categoryColors[tpl.category] ?? 'text-gray-400';
              return (
                <Card key={tpl.id} className="hover:border-white/20 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl ${colorClass.split(' ')[1]}`}>
                        <WorkflowIcon className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white">{tpl.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{tpl.steps.length} steps</p>
                      </div>
                      <Badge variant={tpl.difficulty === 'beginner' ? 'green' : tpl.difficulty === 'intermediate' ? 'cyan' : 'orange'} className="text-[10px] shrink-0">
                        {tpl.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{tpl.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-600 mb-3">
                      <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> ~{tpl.estimatedSetupMins} min setup</span>
                      <span className="flex items-center gap-1"><WorkflowIcon className="w-3 h-3" /> {tpl.steps.length} steps</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Use Template <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Run History */}
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {workflows.flatMap((wf) => {
                  if (!wf.lastRunAt) return [];
                  return [{
                    id: wf.id + '-run',
                    name: wf.name,
                    status: wf.failCount > 0 && wf.runCount === 1 ? 'failed' : 'completed',
                    time: wf.lastRunAt,
                    duration: wf.avgDurationMs,
                    steps: wf.steps.length,
                  }];
                }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((run) => (
                  <div key={run.id} className="flex items-center gap-4 p-3 bg-white/3 rounded-xl border border-white/5">
                    {run.status === 'completed'
                      ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{run.name}</p>
                      <p className="text-xs text-gray-600">{run.steps} steps</p>
                    </div>
                    <Badge variant={run.status === 'completed' ? 'green' : 'red'}>{run.status}</Badge>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-mono">{run.duration ? `${(run.duration / 1000).toFixed(1)}s` : '—'}</p>
                      <p className="text-[10px] text-gray-600">{timeAgo(run.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Run Dialog */}
      {runningWorkflow && (
        <WorkflowRunDialog workflow={runningWorkflow} onClose={() => setRunningWorkflow(null)} />
      )}
    </DashboardLayout>
  );
}
