import { z } from 'zod';

export const AlertEventType = z.enum([
  'CREATED',
  'ESCALATED',
  'CLOSED',
  'REOPENED',
  'OWNER_CHANGED',
  'SEVERITY_CHANGED',
  'ACKNOWLEDGED',
  'NOTE_ADDED',
]);
export type AlertEventType = z.infer<typeof AlertEventType>;

export interface AlertState {
  status: string;
  severity: string;
  owner_id: string | null;
  acknowledged_at: string | null;
  status_changed_at: string;
}

export interface AlertEvent {
  id: string;
  alert_id: string;
  company_id: string;
  event_type: AlertEventType;
  previous_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export function applyEvent(state: AlertState, event: AlertEvent): AlertState {
  const next = { ...state };
  switch (event.event_type) {
    case 'CREATED':
      Object.assign(next, event.new_value);
      break;
    case 'ESCALATED':
    case 'CLOSED':
    case 'REOPENED':
      next.status = event.new_value.status as string;
      next.status_changed_at = event.created_at;
      break;
    case 'SEVERITY_CHANGED':
      next.severity = event.new_value.severity as string;
      break;
    case 'OWNER_CHANGED':
      next.owner_id = event.new_value.owner_id as string | null;
      break;
    case 'ACKNOWLEDGED':
      next.acknowledged_at = (event.new_value.acknowledged_at as string) || event.created_at;
      if (!next.owner_id && event.new_value.owner_id) {
        next.owner_id = event.new_value.owner_id as string;
      }
      break;
    case 'NOTE_ADDED':
      break;
  }
  return next;
}

export function replayState(events: AlertEvent[]): AlertState {
  if (events.length === 0) throw new Error('No events to replay');
  let state: AlertState = {
    status: 'OPEN',
    severity: 'LOW',
    owner_id: null,
    acknowledged_at: null,
    status_changed_at: events[0].created_at,
  };
  for (const ev of events) {
    state = applyEvent(state, ev);
  }
  return state;
}

export function replayStateAtTime(events: AlertEvent[], targetTime: Date): AlertState {
  return replayState(events.filter(e => new Date(e.created_at) <= targetTime));
}
