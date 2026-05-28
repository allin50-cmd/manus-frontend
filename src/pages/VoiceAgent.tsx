import { FormEvent, useEffect, useMemo, useState } from 'react';
import ClerkOSLayout from '@/components/layout/ClerkOSLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mic,
  PhoneCall,
  RefreshCw,
  Route,
  ShieldAlert,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

type HealthResponse = {
  status: string;
  service: string;
  database: string;
};

type ProcessResponse = {
  intent: string;
  risk_level: string;
  policy_decision: 'ALLOW' | 'MODIFY' | 'DENY' | 'ESCALATE';
  next_action: string;
  audit_event_id: string;
};

const EVENT_STEPS = [
  'session_started',
  'transcript_received',
  'intent_classified',
  'policy_check_required',
  'human_escalation_required',
  'session_completed',
];

const SAMPLE_TRANSCRIPTS = [
  {
    label: 'Construction',
    transcript: 'I need a builder for a renovation in South London.',
  },
  {
    label: 'Urgent legal',
    transcript: 'Urgent legal compliance deadline today, I need help immediately.',
  },
  {
    label: 'AI delivery',
    transcript: 'We need AI automation and website design for our intake workflow.',
  },
];

const VOICE_AGENT_URL_STORAGE_KEY = 'clerkos-voice-agent-url';

const decisionClasses: Record<string, string> = {
  ALLOW: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  MODIFY: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  DENY: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  ESCALATE: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
};

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

function makeSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `voice-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `voice-${Date.now().toString(36)}`;
}

export default function VoiceAgent() {
  const defaultUrl = useMemo(
    () =>
      normalizeBaseUrl(
        typeof window !== 'undefined'
          ? localStorage.getItem(VOICE_AGENT_URL_STORAGE_KEY) ||
              import.meta.env.VITE_VOICE_AGENT_URL ||
              'http://localhost:8080'
          : import.meta.env.VITE_VOICE_AGENT_URL || 'http://localhost:8080'
      ),
    []
  );
  const [baseUrl, setBaseUrl] = useState(defaultUrl);
  const [sessionId, setSessionId] = useState(makeSessionId);
  const [caller, setCaller] = useState('+442000000000');
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPTS[0].transcript);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const liveUrl = normalizeBaseUrl(baseUrl);
  const canProcess = Boolean(liveUrl && sessionId.trim() && caller.trim() && transcript.trim());

  const updateBaseUrl = (value: string) => {
    setBaseUrl(value);
    const normalized = normalizeBaseUrl(value);
    if (normalized) {
      localStorage.setItem(VOICE_AGENT_URL_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(VOICE_AGENT_URL_STORAGE_KEY);
    }
  };

  const checkHealth = async () => {
    if (!liveUrl) {
      setHealth(null);
      setError('Enter a voice-agent URL before checking health.');
      return;
    }
    setLoadingHealth(true);
    setError('');
    try {
      const response = await fetch(`${liveUrl}/health`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Health check failed');
      setHealth(data);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : 'Unable to reach voice agent');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Intentionally only run on first mount; operators can refresh after editing the endpoint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processTranscript = async (event: FormEvent) => {
    event.preventDefault();
    if (!canProcess) {
      setError('Enter a voice-agent URL, session ID, caller, and transcript before processing.');
      return;
    }
    setProcessing(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch(`${liveUrl}/process-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, caller, transcript }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Transcript processing failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process transcript');
    } finally {
      setProcessing(false);
    }
  };

  const healthTone =
    health?.status === 'healthy'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800'
      : 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800';

  return (
    <ClerkOSLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Voice Agent Control
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  SME intake session console
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={healthTone}>
              {health?.status ?? 'unchecked'}
            </Badge>
            <Button
              type="button"
              variant="outline"
              onClick={checkHealth}
              disabled={loadingHealth}
              className="gap-2"
            >
              {loadingHealth ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] gap-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Session Input</CardTitle>
              <CardDescription>Live transcript handoff to the Python intake service</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={processTranscript} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="voice-url">Voice Agent URL</Label>
                    <Input
                      id="voice-url"
                      value={baseUrl}
                      onChange={(event) => updateBaseUrl(event.target.value)}
                      placeholder="http://localhost:8080"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-id">Session ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="session-id"
                        value={sessionId}
                        onChange={(event) => setSessionId(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSessionId(makeSessionId());
                          setResult(null);
                        }}
                        aria-label="Generate session ID"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caller">Caller</Label>
                  <Input
                    id="caller"
                    value={caller}
                    onChange={(event) => setCaller(event.target.value)}
                    placeholder="+442000000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transcript">Transcript</Label>
                  <Textarea
                    id="transcript"
                    value={transcript}
                    onChange={(event) => setTranscript(event.target.value)}
                    className="min-h-[180px]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {SAMPLE_TRANSCRIPTS.map((sample) => (
                    <Button
                      key={sample.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTranscript(sample.transcript)}
                    >
                      {sample.label}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" disabled={processing || !canProcess} className="gap-2">
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PhoneCall className="w-4 h-4" />
                    )}
                    Process Transcript
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Service Status</CardTitle>
                <CardDescription>Runtime and audit backing store</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Service</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                    {health?.service ?? 'voice-agent'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Database</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                    {health?.database ?? 'unchecked'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Endpoint</p>
                  <p className="mt-1 text-sm font-mono text-slate-700 dark:text-slate-300 break-all">{liveUrl}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Decision</CardTitle>
                <CardDescription>Latest policy outcome</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                        <Route className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-2" />
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Intent</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                          {result.intent.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                        <ShieldAlert className="w-4 h-4 text-orange-600 dark:text-orange-400 mb-2" />
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Risk</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                          {result.risk_level}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={decisionClasses[result.policy_decision] ?? decisionClasses.MODIFY}
                    >
                      {result.policy_decision}
                    </Badge>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {result.next_action}
                      </p>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-3 break-all">
                        {result.audit_event_id}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="min-h-[190px] flex items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                    No decision yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Lifecycle</CardTitle>
            <CardDescription>Meaningful events written to the append-only audit log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {EVENT_STEPS.map((eventName) => {
                const active =
                  Boolean(result) &&
                  (eventName !== 'human_escalation_required' ||
                    result?.policy_decision === 'ESCALATE');
                return (
                  <div
                    key={eventName}
                    className={[
                      'rounded-lg border p-3 min-h-[92px]',
                      active
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950',
                    ].join(' ')}
                  >
                    {active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-2" />
                    ) : (
                      <UserRoundCheck className="w-4 h-4 text-slate-400 mb-2" />
                    )}
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {eventName.replace(/_/g, ' ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ClerkOSLayout>
  );
}
