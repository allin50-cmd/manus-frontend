import type { VoiceAuditEvent, VoiceIntent, VoicePolicyDecision, VoiceRiskLevel } from '../voiceAgent';
import type { Response } from 'express';

export interface StoredSession {
  id: string;
  caller: string;
  transcript: string;
  intent: VoiceIntent;
  risk_level: VoiceRiskLevel;
  policy_decision: VoicePolicyDecision;
  next_action: string;
  audit_event_id: string;
  events: VoiceAuditEvent[];
  ai_reasoning?: string;
  ai_model?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'escalated' | 'resolved' | 'completed';
}

const MAX_SESSIONS = 200;
export const sessionStore = new Map<string, StoredSession>();

export function addSession(s: StoredSession): void {
  sessionStore.set(s.id, s);
  if (sessionStore.size > MAX_SESSIONS) {
    const oldest = sessionStore.keys().next().value;
    if (oldest) sessionStore.delete(oldest);
  }
}

export function getSession(id: string): StoredSession | undefined {
  return sessionStore.get(id);
}

export function updateSession(id: string, patch: Partial<StoredSession>): StoredSession | null {
  const s = sessionStore.get(id);
  if (!s) return null;
  const updated = { ...s, ...patch, updated_at: new Date().toISOString() };
  sessionStore.set(id, updated);
  return updated;
}

export function listSessions(): StoredSession[] {
  return Array.from(sessionStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

// SSE broadcast
const sseClients = new Set<Response>();

export function addSseClient(res: Response): void {
  sseClients.add(res);
}

export function removeSseClient(res: Response): void {
  sseClients.delete(res);
}

export function broadcast(event: object): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}
