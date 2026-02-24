/**
 * Main Dashboard Page
 * Overview metrics, system status, quick actions, and activity feed
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Users, Shield, Bot, ScrollText, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Clock, Zap, FileText, Building2,
  Bell, Database, Activity, ArrowUpRight, Play, BarChart3,
  RefreshCw, Workflow, Wrench, BookOpen, Lock, ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { formatNumber, formatDateTime, timeAgo } from '@/lib/utils';
import { getQueueSize } from '@/services/auditBuffer';
import { SAMPLE_WORKFLOWS } from '@/services/workflowEngine';

// ─── Metric Types ──────────────────────────────────────────────────────────────

interface Metric {
  label: string;
  value: string | number;
  change: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: 'purple' | 'cyan' | 'gold' | 'green' | 'red';
  suffix?: string;
}

const METRICS: Metric[] = [
  { label: 'Active Clients', value: 247, change: 12, icon: Users, color: 'cyan', suffix: '' },
  { label: 'Compliance Score', value: '94%', change: 3, icon: Shield, color: 'green', changeLabel: 'vs last month' },
  { label: 'AI Queries Today', value: 1842, change: 28, icon: Bot, color: 'purple', suffix: '' },
  { label: 'Audit Events', value: formatNumber(18420), change: -2, icon: ScrollText, color: 'gold', changeLabel: 'vs yesterday' },
];

// ─── Activity Items ────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  type: 'compliance' | 'ai' | 'intake' | 'audit' | 'workflow' | 'alert';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
}

const ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'compliance', title: 'Compliance check passed', description: 'ACME TECHNOLOGIES LTD — No overdue filings detected', time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'success', user: 'FineGuard' },
  { id: '2', type: 'ai', title: 'AI risk assessment completed', description: 'Beta Corp classified as High Risk (score: 78/100)', time: new Date(Date.now() - 1000 * 60 * 12).toISOString(), status: 'warning', user: 'AI Assistant' },
  { id: '3', type: 'intake', title: 'New matter intake received', description: 'MAT-20240198 — Litigation matter, urgency: High', time: new Date(Date.now() - 1000 * 60 * 28).toISOString(), status: 'info', user: 'UltAi' },
  { id: '4', type: 'audit', title: '50 audit events flushed', description: 'Written to VaultLine WORM storage (VL-1234567)', time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), status: 'success', user: 'VaultLine' },
  { id: '5', type: 'workflow', title: 'Workflow completed', description: 'Company Compliance Check — 42 clients processed', time: new Date(Date.now() - 1000 * 60 * 90).toISOString(), status: 'success', user: 'Workflows' },
  { id: '6', type: 'alert', title: 'Filing deadline approaching', description: 'Nexus Properties Ltd — Accounts due in 14 days', time: new Date(Date.now() - 1000 * 60 * 120).toISOString(), status: 'warning', user: 'FineGuard' },
  { id: '7', type: 'compliance', title: 'Penalty risk detected', description: 'Delta Corp — Confirmation statement overdue by 18 days', time: new Date(Date.now() - 1000 * 60 * 180).toISOString(), status: 'error', user: 'FineGuard' },
];

// ─── Quick Actions ─────────────────────────────────────────────────────────────

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  gradient: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'AI Assistant', description: 'Ask the AI anything', icon: Bot, path: '/ai-assistant', color: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-600/5' },
  { label: 'New Intake', description: 'Create a client matter', icon: FileText, path: '/intake-sheet', color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-cyan-600/5' },
  { label: 'Compliance Check', description: 'Check a company', icon: Shield, path: '/compliance-bundle', color: 'text-yellow-400', gradient: 'from-yellow-500/20 to-yellow-600/5' },
  { label: 'MCP Tools', description: 'Run AI tools directly', icon: Wrench, path: '/mcp-tools', color: 'text-green-400', gradient: 'from-green-500/20 to-green-600/5' },
  { label: 'Workflows', description: 'Manage automations', icon: Workflow, path: '/workflows', color: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-600/5' },
  { label: 'Audit Log', description: 'View security events', icon: Lock, path: '/audit-log', color: 'text-orange-400', gradient: 'from-orange-500/20 to-orange-600/5' },
];

// ─── Status Bar ────────────────────────────────────────────────────────────────

const SYSTEM_STATUS = [
  { label: 'API', status: 'online', latency: '38ms' },
  { label: 'Database', status: 'online', latency: '12ms' },
  { label: 'AI Models', status: 'online', latency: '180ms' },
  { label: 'Companies House', status: 'degraded', latency: '620ms' },
  { label: 'VaultLine WORM', status: 'online', latency: '95ms' },
];

// ─── Component ────────────────────────────────────────────────────────────────

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  const isPositive = metric.change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const colorMap = {
    purple: 'text-purple-400 bg-purple-500/10',
    cyan:   'text-cyan-400 bg-cyan-500/10',
    gold:   'text-yellow-400 bg-yellow-500/10',
    green:  'text-green-400 bg-green-500/10',
    red:    'text-red-400 bg-red-500/10',
  };

  return (
    <Card className="hover:border-white/20 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${colorMap[metric.color]}`}>
            <Icon className={`w-4 h-4 ${colorMap[metric.color].split(' ')[0]}`} />
          </div>
          <span className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(metric.change)}%
          </span>
        </div>
        <p className="text-2xl font-bold text-white tabular-nums">{metric.value}</p>
        <p className="text-xs text-gray-500 mt-1">{metric.label}</p>
        {metric.changeLabel && <p className="text-[10px] text-gray-600 mt-0.5">{metric.changeLabel}</p>}
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ type, status }: { type: ActivityItem['type']; status: ActivityItem['status'] }) {
  const iconMap: Record<string, React.ElementType> = {
    compliance: Shield,
    ai: Bot,
    intake: FileText,
    audit: ScrollText,
    workflow: Workflow,
    alert: AlertTriangle,
  };
  const colorMap: Record<string, string> = {
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    error:   'bg-red-500/20 text-red-400',
    info:    'bg-blue-500/20 text-blue-400',
  };
  const Icon = iconMap[type] ?? Activity;
  return (
    <div className={`p-1.5 rounded-lg shrink-0 ${colorMap[status]}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [pendingAuditEvents, setPendingAuditEvents] = useState(getQueueSize());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const activeWorkflows = SAMPLE_WORKFLOWS.filter(w => w.status === 'active').length;

  useEffect(() => {
    const interval = setInterval(() => {
      setPendingAuditEvents(getQueueSize());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back — here's your platform overview"
    >
      {/* System Status Bar */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {SYSTEM_STATUS.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-green-400' : s.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-400">{s.label}</span>
            <span className="text-xs text-gray-600">{s.latency}</span>
          </div>
        ))}
        <button
          onClick={() => setLastRefresh(new Date())}
          className="ml-auto shrink-0 flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          {timeAgo(lastRefresh)}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {METRICS.map((m) => <MetricCard key={m.label} metric={m} />)}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-b ${action.gradient} border border-white/5 hover:border-white/15 transition-all duration-200 hover:scale-[1.02] group`}
              >
                <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">{action.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Live event feed across all services</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/audit-log')}>
                  View all <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ACTIVITY.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                    <ActivityIcon type={item.type} status={item.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium leading-tight">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-600">{timeAgo(item.time)}</p>
                      <p className="text-[10px] text-gray-700">{item.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Active Workflows */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Workflows</CardTitle>
                <Badge variant="cyan">{activeWorkflows} running</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {SAMPLE_WORKFLOWS.filter(w => w.status === 'active' || w.status === 'running').slice(0, 3).map((wf) => (
                  <div key={wf.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate('/workflows')}>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">{wf.name}</p>
                      <p className="text-[10px] text-gray-500">{wf.runCount} runs · {wf.successCount} success</p>
                    </div>
                    <Badge variant="green" className="text-[10px]">Active</Badge>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" onClick={() => navigate('/workflows')}>
                Manage workflows <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Platform Health */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'API Response Time', value: 38, max: 200, unit: 'ms', color: 'green' as const },
                  { label: 'Database Load', value: 23, max: 100, unit: '%', color: 'cyan' as const },
                  { label: 'AI Queue Depth', value: 8, max: 100, unit: 'req', color: 'purple' as const },
                  { label: 'Audit Buffer', value: pendingAuditEvents, max: 500, unit: 'events', color: pendingAuditEvents > 100 ? 'red' as const : 'gold' as const },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{stat.label}</span>
                      <span className="text-white font-mono">{stat.value}{stat.unit}</span>
                    </div>
                    <Progress value={stat.value} max={stat.max} color={stat.color} size="sm" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Usage */}
          <Card>
            <CardHeader>
              <CardTitle>AI Usage Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: 'Risk Assessments', count: 84, icon: AlertTriangle, color: 'text-orange-400' },
                  { label: 'KB Searches', count: 312, icon: BookOpen, color: 'text-blue-400' },
                  { label: 'Doc Analysis', count: 47, icon: FileText, color: 'text-purple-400' },
                  { label: 'Chat Queries', count: 1399, icon: Bot, color: 'text-cyan-400' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                      <span className="text-xs text-gray-400 flex-1">{item.label}</span>
                      <span className="text-xs font-mono text-white">{formatNumber(item.count)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
