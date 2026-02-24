/**
 * AI Assistant Page
 * Full-featured chat interface with MCP tool integration and streaming
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, RotateCcw, Settings2, Plus, Wrench,
  CheckCircle2, Loader2, ChevronDown, Copy, ChevronRight,
  Zap, Brain, MessageSquare, ToggleLeft, ToggleRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectOption } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { cn, timeAgo, generateId } from '@/lib/utils';
import { aiClient, AI_MODELS } from '@/services/aiClient';
import { MCP_TOOLS } from '@/services/mcpTools';
import type { MCPToolExecution } from '@/types/mcp';

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  toolExecutions?: MCPToolExecution[];
  createdAt: string;
  tokens?: number;
}

const STARTER_PROMPTS = [
  'Check compliance status for company 12345678',
  'Search knowledge base for late filing penalties',
  'Assess risk for a new corporate client in fintech',
  'Analyze this contract for high-risk clauses',
  'What are the Companies House filing deadlines for a private company?',
  'Create a compliance summary report for the last 30 days',
];

const MODEL_OPTIONS: SelectOption[] = AI_MODELS.map((m) => ({
  value: m.id,
  label: m.name,
  description: m.description,
}));

// ─── Markdown renderer (minimal) ─────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let codeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!codeBlock) {
        codeBlock = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        elements.push(
          <div key={`code-${i}`} className="code-block my-2 relative group">
            {codeLang && <span className="absolute right-2 top-2 text-[10px] text-gray-600">{codeLang}</span>}
            <pre className="text-green-400 text-xs overflow-x-auto">{codeLines.join('\n')}</pre>
          </div>
        );
        codeBlock = false;
        codeLines = [];
      }
      continue;
    }

    if (codeBlock) { codeLines.push(line); continue; }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-semibold text-white mt-3 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-bold text-white mt-4 mb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={i} className="text-sm font-semibold text-white">{line.slice(2, -2)}</p>);
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} className="flex items-start gap-1.5 text-sm text-gray-300 my-0.5">
          <span className="text-brand-purple mt-1.5 shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
        </div>
      );
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      const rest = line.replace(/^\d+\. /, '');
      elements.push(
        <div key={i} className="flex items-start gap-2 text-sm text-gray-300 my-0.5">
          <span className="text-brand-purple shrink-0 font-mono">{num}.</span>
          <span>{rest}</span>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-white/10 text-cyan-300 px-1 rounded text-xs font-mono">$1</code>') }}
        />
      );
    }
  }
  return elements;
}

// ─── Tool Execution Display ────────────────────────────────────────────────────

function ToolExecutionCard({ execution }: { execution: MCPToolExecution }) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = execution.status === 'running';

  return (
    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/3 transition-colors text-left"
      >
        {isRunning ? (
          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-cyan-300 font-mono truncate">{execution.toolName}</p>
          {execution.durationMs && (
            <p className="text-[10px] text-gray-600">{execution.durationMs}ms</p>
          )}
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-600 transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 animate-fade-in">
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Input</p>
            <pre className="text-xs text-gray-400 bg-black/20 rounded-lg p-2 overflow-x-auto">
              {JSON.stringify(execution.input, null, 2)}
            </pre>
          </div>
          {execution.output && (
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Output</p>
              <pre className="text-xs text-green-400 bg-black/20 rounded-lg p-2 overflow-x-auto max-h-40">
                {JSON.stringify(execution.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [selectedModel, setSelectedModel] = useState('claude-opus-4-6');
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set(MCP_TOOLS.map((t) => t.name)));
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [toolExecutions, setToolExecutions] = useState<MCPToolExecution[]>([]);
  const [pendingExecs, setPendingExecs] = useState<MCPToolExecution[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const session = aiClient.getSession();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const sendMessage = useCallback(async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');
    setLoading(true);
    setStreamingText('');
    setPendingExecs([]);

    const userMsg: ChatMessage = { id: generateId('msg'), role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);

    // Placeholder assistant message while streaming
    const assistantId = generateId('msg');
    const currentExecs: MCPToolExecution[] = [];

    try {
      aiClient.setActivatedTools(Array.from(activeTools));

      await aiClient.sendMessage(
        text,
        (token) => setStreamingText((prev) => prev + token),
        (exec) => {
          const idx = currentExecs.findIndex((e) => e.id === exec.id);
          if (idx >= 0) { currentExecs[idx] = exec; } else { currentExecs.push(exec); }
          setPendingExecs([...currentExecs]);
        }
      );

      const finalSession = aiClient.getSession();
      const lastMsg = finalSession.messages[finalSession.messages.length - 1];

      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: typeof lastMsg.content === 'string' ? lastMsg.content : '',
        toolExecutions: currentExecs.length > 0 ? [...currentExecs] : undefined,
        createdAt: lastMsg.createdAt,
        tokens: lastMsg.usage?.outputTokens,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setToolExecutions((prev) => [...prev, ...currentExecs]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setStreamingText('');
      setPendingExecs([]);
    }
  }, [input, loading, activeTools]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingText('');
    aiClient.clearHistory();
  };

  const totalTokens = session.totalTokens;

  return (
    <DashboardLayout
      title="AI Assistant"
      subtitle="Powered by Claude — with MCP tool access"
      actions={
        <div className="flex items-center gap-2">
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            options={MODEL_OPTIONS}
            className="w-44 hidden md:block"
          />
          <Button variant="ghost" size="icon" onClick={() => setShowToolPanel((p) => !p)}>
            <Wrench className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={clearChat}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-purple to-brand-cyan rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">VaultLine AI Assistant</h2>
                <p className="text-sm text-gray-500 max-w-md mb-6">
                  Ask me anything about compliance, documents, or client matters. I have access to {activeTools.size} AI tools.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-left px-3 py-2 text-xs text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  msg.role === 'assistant' ? 'bg-gradient-to-br from-brand-purple to-brand-cyan' : 'bg-gradient-to-br from-pink-500 to-purple-500'
                )}>
                  {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <span className="text-[10px] font-bold text-white">U</span>}
                </div>
                <div className={cn('max-w-2xl flex-1', msg.role === 'user' && 'flex justify-end')}>
                  {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {msg.toolExecutions.map((exec) => (
                        <ToolExecutionCard key={exec.id} execution={exec} />
                      ))}
                    </div>
                  )}
                  <div className={cn('px-4 py-3 rounded-2xl', msg.role === 'user' ? 'msg-user' : 'msg-assistant')}>
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : (
                      <p className="text-sm text-white">{msg.content}</p>
                    )}
                  </div>
                  <div className={cn('flex items-center gap-2 mt-1 px-1', msg.role === 'user' && 'justify-end')}>
                    <span className="text-[10px] text-gray-600">{timeAgo(msg.createdAt)}</span>
                    {msg.tokens && <span className="text-[10px] text-gray-700">{msg.tokens} tokens</span>}
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      className="text-gray-700 hover:text-gray-400 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 max-w-2xl">
                  {pendingExecs.map((exec) => (
                    <ToolExecutionCard key={exec.id} execution={exec} />
                  ))}
                  <div className="msg-assistant px-4 py-3 rounded-2xl mt-1">
                    {streamingText ? renderMarkdown(streamingText) : (
                      <div className="flex gap-1 py-1">
                        <div className="typing-dot" style={{ animationDelay: '0ms' }} />
                        <div className="typing-dot" style={{ animationDelay: '150ms' }} />
                        <div className="typing-dot" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                    {streamingText && <span className="inline-block w-0.5 h-4 bg-brand-purple animate-pulse ml-0.5 align-text-bottom" />}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 mt-2">
            <div className="bg-[#1a1d2e] border border-white/10 rounded-2xl overflow-hidden focus-within:border-brand-purple/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything — or select a starter prompt above..."
                rows={3}
                className="w-full bg-transparent px-4 pt-3 text-sm text-white placeholder:text-gray-600 resize-none focus:outline-none"
                disabled={loading}
              />
              <div className="flex items-center justify-between px-3 pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="gray" className="text-[10px]">{activeTools.size} tools</Badge>
                  {totalTokens > 0 && <span className="text-[10px] text-gray-600">{totalTokens.toLocaleString()} tokens used</span>}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  loading={loading}
                >
                  {!loading && <Send className="w-3.5 h-3.5 mr-1" />}
                  Send
                </Button>
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-700 mt-2">
              Press Enter to send · Shift+Enter for new line · AI can make mistakes
            </p>
          </div>
        </div>

        {/* Tool Panel */}
        {showToolPanel && (
          <div className="w-72 shrink-0 hidden lg:flex flex-col gap-3 animate-slide-in">
            <Card className="flex-1 overflow-hidden flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>MCP Tools</CardTitle>
                  <Badge variant="cyan">{activeTools.size} active</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pt-0">
                <div className="space-y-1">
                  {MCP_TOOLS.map((tool) => {
                    const isActive = activeTools.has(tool.name);
                    return (
                      <div
                        key={tool.name}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setActiveTools((prev) => {
                          const next = new Set(prev);
                          if (next.has(tool.name)) next.delete(tool.name);
                          else next.add(tool.name);
                          return next;
                        })}
                      >
                        {isActive ? (
                          <ToggleRight className="w-4 h-4 text-brand-purple shrink-0" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-600 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-mono truncate', isActive ? 'text-white' : 'text-gray-500')}>
                            {tool.name}
                          </p>
                          <p className="text-[10px] text-gray-600 truncate">{tool.description.slice(0, 45)}...</p>
                        </div>
                        {tool.isMutating && <Badge variant="orange" className="text-[10px]">writes</Badge>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
