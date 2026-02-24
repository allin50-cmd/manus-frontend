/**
 * MCP Tools Explorer Page
 * Browse, configure, and execute MCP tools directly
 */
import React, { useState, useCallback } from 'react';
import {
  Wrench, Play, CheckCircle2, Loader2, ChevronDown, ChevronRight,
  Building2, Shield, BookOpen, FileText, AlertTriangle, Bell,
  Lock, Database, BarChart3, Zap, Search, Filter, ExternalLink,
  Clock, AlertCircle, Copy,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn, formatNumber } from '@/lib/utils';
import { MCP_TOOLS, executeTool, getToolsByCategory } from '@/services/mcpTools';
import type { MCPTool, MCPToolExecution, MCPToolCategory } from '@/types/mcp';

// ─── Category Config ───────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<MCPToolCategory, { label: string; icon: React.ElementType; color: string }> = {
  compliance:      { label: 'Compliance',       icon: Shield,        color: 'text-yellow-400' },
  data_retrieval:  { label: 'Data Retrieval',   icon: Database,      color: 'text-blue-400' },
  document:        { label: 'Documents',         icon: FileText,      color: 'text-orange-400' },
  ai_analysis:     { label: 'AI Analysis',       icon: Zap,           color: 'text-purple-400' },
  notifications:   { label: 'Notifications',     icon: Bell,          color: 'text-green-400' },
  search:          { label: 'Search',            icon: Search,        color: 'text-cyan-400' },
  audit:           { label: 'Audit',             icon: Lock,          color: 'text-red-400' },
  integration:     { label: 'Integration',       icon: ExternalLink,  color: 'text-pink-400' },
  utility:         { label: 'Utility',           icon: Wrench,        color: 'text-gray-400' },
};

// ─── Simple JSON Form ─────────────────────────────────────────────────────────

function JsonSchemaForm({
  schema,
  values,
  onChange,
}: {
  schema: MCPTool['inputSchema'];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}) {
  const props = schema.properties;
  return (
    <div className="space-y-3">
      {Object.entries(props).map(([key, prop]) => {
        const isRequired = schema.required?.includes(key);
        const value = values[key] ?? prop.default ?? '';

        if (prop.type === 'boolean') {
          return (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-gray-300">
                {key.replace(/_/g, ' ')}
                {isRequired && <span className="text-red-400 ml-1">*</span>}
                {prop.description && <span className="block text-[10px] text-gray-600">{prop.description}</span>}
              </label>
              <button
                type="button"
                onClick={() => onChange({ ...values, [key]: !value })}
                className={cn('w-10 h-5 rounded-full transition-colors relative', value ? 'bg-brand-purple' : 'bg-white/10')}
              >
                <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform', value ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          );
        }

        if (prop.enum) {
          return (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">
                {key.replace(/_/g, ' ')}
                {isRequired && <span className="text-red-400 ml-1">*</span>}
              </label>
              <select
                value={String(value)}
                onChange={(e) => onChange({ ...values, [key]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple"
              >
                {prop.enum.map((opt) => (
                  <option key={String(opt)} value={String(opt)} className="bg-[#1a1d2e]">{String(opt)}</option>
                ))}
              </select>
              {prop.description && <p className="text-[10px] text-gray-600 mt-0.5">{prop.description}</p>}
            </div>
          );
        }

        return (
          <div key={key}>
            <label className="block text-xs text-gray-400 mb-1">
              {key.replace(/_/g, ' ')}
              {isRequired && <span className="text-red-400 ml-1">*</span>}
            </label>
            <Input
              value={String(value)}
              onChange={(e) => onChange({ ...values, [key]: e.target.value })}
              placeholder={prop.description ?? key}
              className="text-xs"
            />
            {prop.description && <p className="text-[10px] text-gray-600 mt-0.5">{prop.description}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tool Card ────────────────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: MCPTool }) {
  const [expanded, setExpanded] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execution, setExecution] = useState<MCPToolExecution | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const cfg = CATEGORY_CONFIG[tool.category] ?? CATEGORY_CONFIG.utility;
  const Icon = cfg.icon;

  const handleExecute = useCallback(async () => {
    setExecuting(true);
    try {
      const result = await executeTool(tool.name, formValues);
      setExecution(result);
    } finally {
      setExecuting(false);
    }
  }, [tool.name, formValues]);

  return (
    <Card className={cn('transition-all duration-200', expanded && 'border-white/20')}>
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-white/5 shrink-0`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-sm font-mono text-white">{tool.name}</h3>
              {tool.isMutating && <Badge variant="orange" className="text-[10px]">writes data</Badge>}
              {tool.requiresNetwork && <Badge variant="cyan" className="text-[10px]">network</Badge>}
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{tool.description}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {tool.avgDurationMs && (
              <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> ~{tool.avgDurationMs}ms
              </span>
            )}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
            </button>
          </div>
        </div>

        {/* Params preview */}
        <div className="flex flex-wrap gap-1 mb-3">
          {(tool.inputSchema.required ?? []).map((key) => (
            <span key={key} className="tool-chip">{key}</span>
          ))}
          {Object.keys(tool.inputSchema.properties).filter(k => !tool.inputSchema.required?.includes(k)).slice(0, 3).map((key) => (
            <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 text-gray-500 text-[10px] rounded-full font-mono">{key}</span>
          ))}
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div className="border-t border-white/5 pt-4 mt-2 space-y-4 animate-fade-in">
            {/* Input form */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Parameters</h4>
              <JsonSchemaForm
                schema={tool.inputSchema}
                values={formValues}
                onChange={setFormValues}
              />
            </div>

            {/* Execute button */}
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={handleExecute}
              loading={executing}
            >
              {!executing && <Play className="w-3.5 h-3.5 mr-1.5" />}
              Execute Tool
            </Button>

            {/* Result */}
            {execution && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    {execution.status === 'success'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      : <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    }
                    Result
                    {execution.durationMs && <span className="text-[10px] text-gray-600 font-mono normal-case">{execution.durationMs}ms</span>}
                  </h4>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(execution.output, null, 2))}
                    className="text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="code-block text-xs overflow-x-auto max-h-48 text-green-400">
                  {JSON.stringify(execution.output, null, 2)}
                </pre>
              </div>
            )}

            {/* Examples */}
            {tool.examples && tool.examples.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Example</h4>
                <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-gray-400 mb-2">{tool.examples[0].description}</p>
                  <pre className="text-[10px] text-gray-600 overflow-x-auto">Input: {JSON.stringify(tool.examples[0].input, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        {!expanded && (
          <div className="flex gap-2">
            <Button variant="outline" size="xs" onClick={() => setExpanded(true)}>
              Configure & Run
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setExpanded(true)}>
              View Schema
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MCPToolsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<MCPToolCategory | 'all'>('all');

  const categories = Array.from(new Set(MCP_TOOLS.map((t) => t.category)));

  const filtered = MCP_TOOLS.filter((t) => {
    const matchSearch = !search || t.name.includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <DashboardLayout
      title="MCP Tools"
      subtitle="Model Context Protocol — AI tool integrations"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Tools', value: MCP_TOOLS.length },
          { label: 'Categories', value: categories.length },
          { label: 'Network Tools', value: MCP_TOOLS.filter(t => t.requiresNetwork).length },
          { label: 'Write Tools', value: MCP_TOOLS.filter(t => t.isMutating).length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          leftIcon={<Search className="w-3.5 h-3.5" />}
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors shrink-0', activeCategory === 'all' ? 'bg-brand-purple border-brand-purple text-white' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20')}
          >
            All ({MCP_TOOLS.length})
          </button>
          {categories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const count = MCP_TOOLS.filter(t => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors shrink-0', activeCategory === cat ? 'bg-brand-purple border-brand-purple text-white' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20')}
              >
                {cfg?.label ?? cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <Wrench className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No tools match your filter</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
