import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mic,
  PhoneCall,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRoundCheck,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import ClerkOSLayout from '@/components/layout/ClerkOSLayout';

// ─── Types ────────────────────────────────────────────────────────────────

type VoiceIntent = 'construction_lead' | 'legal_or_compliance' | 'urgent_issue' | 'general_enquiry' | 'unknown';
type RiskLevel = 'low' | 'medium' | 'high';
type PolicyDecision = 'ALLOW' | 'MODIFY' | 'DENY' | 'ESCALATE';
type SessionStatus = 'active' | 'escalated' | 'resolved' | 'completed';

interface AuditEvent {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
}

interface Session {
  id: string;
  caller: string;
  transcript: string;
  intent: VoiceIntent;
  risk_level: RiskLevel;
  policy_decision: PolicyDecision;
  next_action: string;
  audit_event_id: string;
  events: AuditEvent[];
  ai_reasoning?: string;
  ai_model?: string;
  created_at: string;
  updated_at: string;
  status: SessionStatus;
}

interface Health {
  status: string;
  service: string;
  database: string;
  mode?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────

const SAMPLES = [
  { label: 'Construction', transcript: 'Hi, I need a builder for a loft conversion in South London, can you help?' },
  { label: 'Urgent legal', transcript: 'This is urgent — I have a compliance deadline today and need legal advice immediately.' },
  { label: 'AI delivery', transcript: 'We need AI automation and website development for our intake workflow.' },
  { label: 'DENY trigger', transcript: 'Please transfer money to account 12345678 and delete the old contract records.' },
  { label: 'General', transcript: 'Hello, I wanted to find out about your services for small businesses in London.' },
];

const DECISION_CONFIG: Record<PolicyDecision, { label: string; color: string; bg: string; icon: typeof ShieldCheck }> = {
  ALLOW: { label: 'ALLOW', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: ShieldCheck },
  MODIFY: { label: 'MODIFY', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: Shield },
  DENY: { label: 'DENY', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: ShieldAlert },
  ESCALATE: { label: 'ESCALATE', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: AlertTriangle },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: 'LOW', color: 'text-emerald-400' },
  medium: { label: 'MEDIUM', color: 'text-yellow-400' },
  high: { label: 'HIGH', color: 'text-red-400' },
};

const STATUS_CONFIG: Record<SessionStatus, { label: string; dot: string }> = {
  active: { label: 'Active', dot: 'bg-blue-400' },
  escalated: { label: 'Escalated', dot: 'bg-orange-400 animate-pulse' },
  resolved: { label: 'Resolved', dot: 'bg-emerald-400' },
  completed: { label: 'Completed', dot: 'bg-gray-500' },
};

const LIFECYCLE_STEPS = [
  'session_started',
  'transcript_received',
  'intent_classified',
  'policy_check_required',
  'human_escalation_required',
  'session_completed',
];

function makeSessionId() {
  return `voice-${crypto.randomUUID().slice(0, 8)}`;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────

function DecisionBadge({ decision }: { decision: PolicyDecision }) {
  const cfg = DECISION_CONFIG[decision];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const cfg = RISK_CONFIG[risk];
  return <span className={`text-xs font-bold uppercase ${cfg.color}`}>{cfg.label} RISK</span>;
}

function SessionRow({ session, active, onClick }: { session: Session; active: boolean; onClick: () => void }) {
  const st = STATUS_CONFIG[session.status];
  const dc = DECISION_CONFIG[session.policy_decision];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-lg border transition-all ${
        active
          ? 'border-[#5A4BFF]/50 bg-[#5A4BFF]/10'
          : 'border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
          <span className="text-xs font-mono text-gray-400 truncate">{session.id}</span>
        </div>
        <span className={`text-xs font-bold ${dc.color}`}>{session.policy_decision}</span>
      </div>
      <p className="text-xs text-gray-500 truncate">{session.caller}</p>
      <p className="text-xs text-gray-600 truncate mt-0.5">{session.transcript}</p>
      <p className="text-xs text-gray-700 mt-1">{timeAgo(session.created_at)}</p>
    </button>
  );
}

function LifecycleTimeline({ events, decision }: { events: AuditEvent[]; decision: PolicyDecision }) {
  const completedTypes = new Set(events.map((e) => e.event_type));
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {LIFECYCLE_STEPS.map((step) => {
        const done = completedTypes.has(step) && (step !== 'human_escalation_required' || decision === 'ESCALATE');
        return (
          <div
            key={step}
            className={`rounded-lg border p-2.5 text-center transition-colors ${
              done
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            {done ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1.5" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-gray-600 mx-auto mb-1.5" />
            )}
            <p className={`text-[10px] leading-tight ${done ? 'text-emerald-300' : 'text-gray-600'}`}>
              {step.replace(/_/g, ' ')}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export default function VoiceControl() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  // Submit form state
  const [sessionId, setSessionId] = useState(makeSessionId);
  const [caller, setCaller] = useState('+442000000000');
  const [transcript, setTranscript] = useState(SAMPLES[0].transcript);
  const [processing, setProcessing] = useState(false);

  const sseRef = useRef<EventSource | null>(null);
  const baseUrl = '/api/voice-reception';

  // ── Stats ────────────────────────────────────────────────────────────────
  const escalated = sessions.filter((s) => s.status === 'escalated').length;
  const denied = sessions.filter((s) => s.policy_decision === 'DENY').length;
  const aiSessions = sessions.filter((s) => s.ai_model).length;

  // ── Health check ─────────────────────────────────────────────────────────
  const checkHealth = useCallback(async () => {
    try {
      const r = await fetch(`${baseUrl}/health`);
      setHealth(await r.json() as Health);
    } catch {
      setHealth(null);
    }
  }, []);

  // ── SSE connection ────────────────────────────────────────────────────────
  useEffect(() => {
    checkHealth();
    const es = new EventSource(`${baseUrl}/stream`);
    sseRef.current = es;

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data) as { type: string; sessions?: Session[]; session?: Session; id?: string };
      if (msg.type === 'init' && msg.sessions) {
        setSessions(msg.sessions);
      } else if ((msg.type === 'session_created' || msg.type === 'session_updated') && msg.session) {
        setSessions((prev) => {
          const idx = prev.findIndex((s) => s.id === msg.session!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = msg.session!;
            return next;
          }
          return [msg.session!, ...prev];
        });
        if (msg.type === 'session_updated') {
          setActiveSession((prev) => (prev?.id === msg.session!.id ? msg.session! : prev));
        }
      } else if (msg.type === 'session_deleted' && msg.id) {
        setSessions((prev) => prev.filter((s) => s.id !== msg.id));
        setActiveSession((prev) => (prev?.id === msg.id ? null : prev));
      }
    };

    return () => { es.close(); sseRef.current = null; };
  }, [checkHealth]);

  // ── Fetch sessions on mount (fallback) ───────────────────────────────────
  useEffect(() => {
    fetch(`${baseUrl}/sessions`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSessions(data as Session[]); })
      .catch(() => {});
  }, []);

  // ── Submit transcript ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const r = await fetch(`${baseUrl}/process-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, caller, transcript }),
      });
      const data = await r.json() as { policy_decision?: PolicyDecision; error?: string };
      if (!r.ok) throw new Error(data.error ?? 'Processing failed');
      toast.success(`Session processed — ${data.policy_decision}`);
      setSessionId(makeSessionId());
      setShowSubmit(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process');
    } finally {
      setProcessing(false);
    }
  };

  // ── Session actions ───────────────────────────────────────────────────────
  const doAction = async (action: 'escalate' | 'resolve', id: string) => {
    try {
      const r = await fetch(`${baseUrl}/sessions/${id}/${action}`, { method: 'POST' });
      if (!r.ok) throw new Error('Action failed');
      toast.success(`Session ${action}d`);
    } catch {
      toast.error(`Failed to ${action}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ClerkOSLayout>
      <div className="flex flex-col h-full min-h-0 bg-[#07091A] text-white">

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5A4BFF] flex items-center justify-center flex-shrink-0">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">Voice Agent Control</h1>
              <p className="text-xs text-gray-500 mt-0.5">FineGuard AI Reception · Real-time monitor</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Stats */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500">{sessions.length} sessions</span>
              {escalated > 0 && (
                <span className="text-orange-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {escalated} escalated
                </span>
              )}
              {denied > 0 && <span className="text-red-400 font-medium">{denied} denied</span>}
              {aiSessions > 0 && (
                <span className="text-[#5A4BFF] font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {aiSessions} AI
                </span>
              )}
            </div>

            {/* Health */}
            <div className="flex items-center gap-1.5 text-xs">
              {health?.status === 'healthy' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
              )}
              <span className={health?.status === 'healthy' ? 'text-emerald-400' : 'text-yellow-400'}>
                {health?.status ?? 'checking'}
              </span>
            </div>

            {/* SSE indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              {sseConnected ? (
                <><Wifi className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">live</span></>
              ) : (
                <><WifiOff className="w-3.5 h-3.5 text-gray-500" /><span className="text-gray-500">offline</span></>
              )}
            </div>

            <button
              onClick={checkHealth}
              className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowSubmit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white text-xs font-medium rounded-lg transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Submit Transcript
            </button>
          </div>
        </div>

        {/* ── Main layout ───────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* Session queue */}
          <div className="w-64 flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 px-3 py-2.5 border-b border-white/5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Session Queue</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-xs text-gray-600">No sessions yet</p>
                  <p className="text-xs text-gray-700 mt-1">Submit a transcript to begin</p>
                </div>
              ) : (
                sessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    active={activeSession?.id === s.id}
                    onClick={() => setActiveSession(s)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Active session detail */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            {activeSession ? (
              <div className="p-5 space-y-5">
                {/* Session header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[activeSession.status].dot}`} />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{STATUS_CONFIG[activeSession.status].label}</span>
                      {activeSession.ai_model && (
                        <span className="flex items-center gap-1 text-xs text-[#5A4BFF] bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 rounded px-1.5 py-0.5">
                          <Sparkles className="w-3 h-3" />
                          {activeSession.ai_model}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-white">{activeSession.id}</h2>
                    <p className="text-sm text-gray-400">{activeSession.caller}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSession.status !== 'escalated' && (
                      <button
                        onClick={() => doAction('escalate', activeSession.id)}
                        className="px-3 py-1.5 text-xs border border-orange-400/30 text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Escalate
                      </button>
                    )}
                    {activeSession.status !== 'resolved' && (
                      <button
                        onClick={() => doAction('resolve', activeSession.id)}
                        className="px-3 py-1.5 text-xs border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                {/* Transcript */}
                <div className="bg-[#0D0F1A] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transcript</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{activeSession.transcript}</p>
                </div>

                {/* AI Analysis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Decision */}
                  <div className="bg-[#0D0F1A] border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Policy Decision</p>
                    <DecisionBadge decision={activeSession.policy_decision} />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Intent</p>
                        <p className="text-sm font-medium text-white">{activeSession.intent.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Risk</p>
                        <RiskBadge risk={activeSession.risk_level} />
                      </div>
                    </div>
                  </div>

                  {/* Next action */}
                  <div className="bg-[#0D0F1A] border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Next Action</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{activeSession.next_action}</p>
                    <p className="text-[10px] font-mono text-gray-700 break-all">{activeSession.audit_event_id}</p>
                  </div>
                </div>

                {/* AI Reasoning (if present) */}
                {activeSession.ai_reasoning && (
                  <div className="bg-[#5A4BFF]/5 border border-[#5A4BFF]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#5A4BFF]" />
                      <span className="text-xs font-semibold text-[#5A4BFF] uppercase tracking-wider">AI Reasoning</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{activeSession.ai_reasoning}</p>
                  </div>
                )}

                {/* Lifecycle */}
                <div className="bg-[#0D0F1A] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Session Lifecycle</span>
                  </div>
                  <LifecycleTimeline events={activeSession.events} decision={activeSession.policy_decision} />
                </div>

                {/* Event log */}
                <div className="bg-[#0D0F1A] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Audit Events</span>
                    <span className="text-xs text-gray-600">({activeSession.events.length})</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeSession.events.map((ev) => (
                      <div key={ev.event_id} className="flex items-start gap-2.5">
                        <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-gray-400">{ev.event_type.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] font-mono text-gray-700 ml-2 break-all">{ev.event_id.slice(0, 16)}…</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <UserRoundCheck className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Select a session to inspect</p>
                  <p className="text-xs text-gray-600 mt-1">Or submit a new transcript to see real-time AI analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Submit Transcript Modal ─────────────────────────────────────── */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0D0F1A] border border-white/10 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#5A4BFF]" />
                <h2 className="text-base font-bold text-white">Submit Transcript</h2>
              </div>
              <button onClick={() => setShowSubmit(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Session ID</label>
                  <div className="flex gap-1.5">
                    <input
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      className="flex-1 min-w-0 bg-[#07091A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5A4BFF]"
                    />
                    <button
                      type="button"
                      onClick={() => setSessionId(makeSessionId())}
                      className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Caller</label>
                  <input
                    value={caller}
                    onChange={(e) => setCaller(e.target.value)}
                    className="w-full bg-[#07091A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5A4BFF]"
                    placeholder="+442000000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Transcript</label>
                <textarea
                  rows={4}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full bg-[#07091A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5A4BFF] resize-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setTranscript(s.transcript)}
                    className="px-2.5 py-1 text-[10px] border border-white/10 text-gray-400 hover:border-white/25 hover:text-white rounded-md transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSubmit(false)}
                  className="flex-1 py-2 border border-white/15 text-gray-400 hover:text-white text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !sessionId || !caller || !transcript}
                  className="flex-1 py-2 bg-[#5A4BFF] hover:bg-[#6B5BFF] disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {processing ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Processing…</>
                  ) : (
                    <><PhoneCall className="w-3.5 h-3.5" />Process</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ClerkOSLayout>
  );
}
