import { describe, it, expect } from 'vitest';
import {
  replayState,
  replayStateAtTime,
  applyEvent,
  type AlertEvent,
  type AlertState,
} from '../lib/events';

function makeEvent(
  overrides: Partial<AlertEvent> & Pick<AlertEvent, 'event_type' | 'new_value'>
): AlertEvent {
  return {
    id: crypto.randomUUID(),
    alert_id: 'alert-1',
    company_id: 'company-1',
    previous_value: {},
    created_by: 'test',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('applyEvent', () => {
  it('CREATED — sets initial state from new_value', () => {
    const initial: AlertState = { status: 'OPEN', severity: 'LOW', owner_id: null, acknowledged_at: null, status_changed_at: new Date().toISOString() };
    const event = makeEvent({ event_type: 'CREATED', new_value: { status: 'OPEN', severity: 'HIGH', source: 'api', title: 'Test alert' } });
    const next = applyEvent(initial, event);
    expect(next.severity).toBe('HIGH');
    expect(next.status).toBe('OPEN');
  });

  it('ESCALATED — updates status and status_changed_at', () => {
    const ts = '2024-01-01T10:00:00.000Z';
    const initial: AlertState = { status: 'OPEN', severity: 'HIGH', owner_id: null, acknowledged_at: null, status_changed_at: ts };
    const eventTs = '2024-01-01T10:15:00.000Z';
    const event = makeEvent({ event_type: 'ESCALATED', new_value: { status: 'ESCALATED' }, created_at: eventTs });
    const next = applyEvent(initial, event);
    expect(next.status).toBe('ESCALATED');
    expect(next.status_changed_at).toBe(eventTs);
  });

  it('CLOSED — updates status, leaves other fields intact', () => {
    const initial: AlertState = { status: 'ESCALATED', severity: 'CRITICAL', owner_id: 'user-1', acknowledged_at: '2024-01-01T10:05:00.000Z', status_changed_at: '2024-01-01T10:00:00.000Z' };
    const next = applyEvent(initial, makeEvent({ event_type: 'CLOSED', new_value: { status: 'CLOSED' } }));
    expect(next.status).toBe('CLOSED');
    expect(next.severity).toBe('CRITICAL');
    expect(next.owner_id).toBe('user-1');
  });

  it('SEVERITY_CHANGED — updates severity only', () => {
    const initial: AlertState = { status: 'OPEN', severity: 'LOW', owner_id: null, acknowledged_at: null, status_changed_at: new Date().toISOString() };
    const next = applyEvent(initial, makeEvent({ event_type: 'SEVERITY_CHANGED', new_value: { severity: 'CRITICAL' } }));
    expect(next.severity).toBe('CRITICAL');
    expect(next.status).toBe('OPEN');
  });

  it('OWNER_CHANGED — updates owner_id', () => {
    const initial: AlertState = { status: 'OPEN', severity: 'MEDIUM', owner_id: null, acknowledged_at: null, status_changed_at: new Date().toISOString() };
    const next = applyEvent(initial, makeEvent({ event_type: 'OWNER_CHANGED', new_value: { owner_id: 'user-42' } }));
    expect(next.owner_id).toBe('user-42');
  });

  it('ACKNOWLEDGED — sets acknowledged_at and auto-assigns owner when null', () => {
    const initial: AlertState = { status: 'OPEN', severity: 'HIGH', owner_id: null, acknowledged_at: null, status_changed_at: new Date().toISOString() };
    const ackTs = '2024-01-01T10:10:00.000Z';
    const next = applyEvent(initial, makeEvent({ event_type: 'ACKNOWLEDGED', new_value: { acknowledged_at: ackTs, owner_id: 'user-99' }, created_at: ackTs }));
    expect(next.acknowledged_at).toBe(ackTs);
    expect(next.owner_id).toBe('user-99');
  });

  it('ACKNOWLEDGED — does NOT overwrite existing owner', () => {
    const initial: AlertState = { status: 'OPEN', severity: 'HIGH', owner_id: 'existing-owner', acknowledged_at: null, status_changed_at: new Date().toISOString() };
    const next = applyEvent(initial, makeEvent({ event_type: 'ACKNOWLEDGED', new_value: { acknowledged_at: new Date().toISOString(), owner_id: 'new-owner' } }));
    expect(next.owner_id).toBe('existing-owner');
  });

  it('NOTE_ADDED — does not change state', () => {
    const initial: AlertState = { status: 'OPEN', severity: 'MEDIUM', owner_id: 'user-1', acknowledged_at: null, status_changed_at: '2024-01-01T10:00:00.000Z' };
    const next = applyEvent(initial, makeEvent({ event_type: 'NOTE_ADDED', new_value: { note: 'Investigating' } }));
    expect(next).toEqual(initial);
  });
});

describe('replayState', () => {
  it('throws if no events', () => {
    expect(() => replayState([])).toThrow('No events to replay');
  });

  it('CREATED event — produces correct initial state', () => {
    const createdAt = '2024-01-01T09:00:00.000Z';
    const state = replayState([makeEvent({ event_type: 'CREATED', new_value: { status: 'OPEN', severity: 'HIGH', title: 'Test' }, created_at: createdAt })]);
    expect(state.status).toBe('OPEN');
    expect(state.severity).toBe('HIGH');
    expect(state.owner_id).toBeNull();
    expect(state.acknowledged_at).toBeNull();
  });

  it('CREATED → ESCALATED — produces escalated state', () => {
    const t1 = '2024-01-01T09:00:00.000Z';
    const t2 = '2024-01-01T09:20:00.000Z';
    const state = replayState([
      makeEvent({ event_type: 'CREATED', new_value: { status: 'OPEN', severity: 'HIGH' }, created_at: t1 }),
      makeEvent({ event_type: 'ESCALATED', new_value: { status: 'ESCALATED' }, created_at: t2, previous_value: { status: 'OPEN' } }),
    ]);
    expect(state.status).toBe('ESCALATED');
    expect(state.status_changed_at).toBe(t2);
  });

  it('ACKNOWLEDGED with auto-assignment — owner set when previously null', () => {
    const t1 = '2024-01-01T09:00:00.000Z';
    const t2 = '2024-01-01T09:10:00.000Z';
    const state = replayState([
      makeEvent({ event_type: 'CREATED', new_value: { status: 'OPEN', severity: 'MEDIUM' }, created_at: t1 }),
      makeEvent({ event_type: 'ACKNOWLEDGED', new_value: { acknowledged_at: t2, owner_id: 'user-10' }, created_at: t2 }),
    ]);
    expect(state.acknowledged_at).toBe(t2);
    expect(state.owner_id).toBe('user-10');
  });

  it('immutability — events array is not mutated by replay', () => {
    const events: AlertEvent[] = [
      makeEvent({ event_type: 'CREATED', new_value: { status: 'OPEN', severity: 'LOW' } }),
      makeEvent({ event_type: 'ESCALATED', new_value: { status: 'ESCALATED' } }),
    ];
    const originalLength = events.length;
    const originalFirstId = events[0].id;
    replayState(events);
    expect(events.length).toBe(originalLength);
    expect(events[0].id).toBe(originalFirstId);
  });
});

describe('replayStateAtTime', () => {
  it('filters events up to target time', () => {
    const t1 = '2024-01-01T09:00:00.000Z';
    const t2 = '2024-01-01T09:30:00.000Z';
    const t3 = '2024-01-01T10:00:00.000Z';
    const events: AlertEvent[] = [
      makeEvent({ event_type: 'CREATED', new_value: { status: 'OPEN', severity: 'LOW' }, created_at: t1 }),
      makeEvent({ event_type: 'ESCALATED', new_value: { status: 'ESCALATED' }, created_at: t2 }),
      makeEvent({ event_type: 'CLOSED', new_value: { status: 'CLOSED' }, created_at: t3 }),
    ];
    expect(replayStateAtTime(events, new Date(t2)).status).toBe('ESCALATED');
    expect(replayStateAtTime(events, new Date(t1)).status).toBe('OPEN');
  });
});
