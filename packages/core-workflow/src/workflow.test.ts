import { describe, it, expect } from 'vitest';
import {
  WorkflowState,
  ALL_STATES,
  VALID_TRANSITIONS,
  isValidTransition,
  InvalidTransitionError,
  transition,
  advance,
  isTerminal,
  nextStates,
} from './index';

// ─── State set completeness ───────────────────────────────────────────────────

describe('WorkflowState', () => {
  it('defines exactly 10 states', () => {
    expect(ALL_STATES).toHaveLength(10);
  });

  it('transition table covers every state', () => {
    for (const state of ALL_STATES) {
      expect(VALID_TRANSITIONS).toHaveProperty(state);
    }
  });
});

// ─── Happy-path forward transitions ──────────────────────────────────────────

describe('transition(): valid forward paths', () => {
  const happyPath: [WorkflowState, WorkflowState][] = [
    [WorkflowState.CAPTURED, WorkflowState.ANALYSED],
    [WorkflowState.ANALYSED, WorkflowState.ESTIMATED],
    [WorkflowState.ESTIMATED, WorkflowState.VERIFIED],
    [WorkflowState.VERIFIED, WorkflowState.CONFIRMED],
    [WorkflowState.CONFIRMED, WorkflowState.APPROVED],
    [WorkflowState.APPROVED, WorkflowState.EXECUTED],
    [WorkflowState.EXECUTED, WorkflowState.RECORDED],
    [WorkflowState.RECORDED, WorkflowState.CLOSED],
  ];

  it.each(happyPath)('%s → %s does not throw', (from, to) => {
    expect(() => transition(from, to)).not.toThrow();
  });

  it.each(happyPath)('advance(%s, %s) returns the new state', (from, to) => {
    expect(advance(from, to)).toBe(to);
  });
});

// ─── HITL_REQUIRED paths ──────────────────────────────────────────────────────

describe('transition(): HITL_REQUIRED paths', () => {
  const hitlEntries: WorkflowState[] = [
    WorkflowState.ANALYSED,
    WorkflowState.ESTIMATED,
    WorkflowState.VERIFIED,
    WorkflowState.CONFIRMED,
  ];

  it.each(hitlEntries)('%s → HITL_REQUIRED is valid', (from) => {
    expect(() => transition(from, WorkflowState.HITL_REQUIRED)).not.toThrow();
  });

  it('HITL_REQUIRED → APPROVED is valid (human approves)', () => {
    expect(() => transition(WorkflowState.HITL_REQUIRED, WorkflowState.APPROVED)).not.toThrow();
  });

  it('HITL_REQUIRED → CLOSED is valid (human rejects)', () => {
    expect(() => transition(WorkflowState.HITL_REQUIRED, WorkflowState.CLOSED)).not.toThrow();
  });

  it('HITL_REQUIRED → CAPTURED is invalid (no backwards travel)', () => {
    expect(() => transition(WorkflowState.HITL_REQUIRED, WorkflowState.CAPTURED)).toThrow(
      InvalidTransitionError,
    );
  });
});

// ─── Early closure ────────────────────────────────────────────────────────────

describe('transition(): early closure', () => {
  it('CAPTURED → CLOSED is valid (rejected at intake)', () => {
    expect(() => transition(WorkflowState.CAPTURED, WorkflowState.CLOSED)).not.toThrow();
  });

  it('ANALYSED → CLOSED is valid (abandoned after analysis)', () => {
    expect(() => transition(WorkflowState.ANALYSED, WorkflowState.CLOSED)).not.toThrow();
  });
});

// ─── Invalid transitions throw ────────────────────────────────────────────────

describe('transition(): invalid transitions throw InvalidTransitionError', () => {
  const invalid: [WorkflowState, WorkflowState][] = [
    [WorkflowState.CAPTURED, WorkflowState.CAPTURED],   // self-loop
    [WorkflowState.CAPTURED, WorkflowState.EXECUTED],   // skip-ahead
    [WorkflowState.ANALYSED, WorkflowState.CAPTURED],   // backwards
    [WorkflowState.APPROVED, WorkflowState.CONFIRMED],  // backwards
    [WorkflowState.RECORDED, WorkflowState.ANALYSED],   // backwards skip
    [WorkflowState.CLOSED, WorkflowState.CAPTURED],     // out of terminal
    [WorkflowState.CLOSED, WorkflowState.CLOSED],       // self-loop on terminal
  ];

  it.each(invalid)('%s → %s throws InvalidTransitionError', (from, to) => {
    expect(() => transition(from, to)).toThrow(InvalidTransitionError);
  });

  it('error message names the illegal transition', () => {
    try {
      transition(WorkflowState.CLOSED, WorkflowState.CAPTURED);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTransitionError);
      const e = err as InvalidTransitionError;
      expect(e.message).toContain('CLOSED');
      expect(e.message).toContain('CAPTURED');
      expect(e.from).toBe(WorkflowState.CLOSED);
      expect(e.to).toBe(WorkflowState.CAPTURED);
    }
  });

  it('error on terminal state mentions "(none — terminal state)"', () => {
    try {
      transition(WorkflowState.CLOSED, WorkflowState.ANALYSED);
    } catch (err) {
      expect((err as InvalidTransitionError).message).toContain('terminal state');
    }
  });
});

// ─── Helper functions ─────────────────────────────────────────────────────────

describe('isTerminal()', () => {
  it('CLOSED is terminal', () => {
    expect(isTerminal(WorkflowState.CLOSED)).toBe(true);
  });

  it('no other state is terminal', () => {
    const nonTerminal = ALL_STATES.filter(s => s !== WorkflowState.CLOSED);
    for (const s of nonTerminal) {
      expect(isTerminal(s)).toBe(false);
    }
  });
});

describe('nextStates()', () => {
  it('returns empty array for CLOSED', () => {
    expect(nextStates(WorkflowState.CLOSED)).toHaveLength(0);
  });

  it('returns correct options from CONFIRMED', () => {
    const next = nextStates(WorkflowState.CONFIRMED);
    expect(next).toContain(WorkflowState.APPROVED);
    expect(next).toContain(WorkflowState.HITL_REQUIRED);
  });
});

describe('isValidTransition()', () => {
  it('returns true for valid pair', () => {
    expect(isValidTransition(WorkflowState.CAPTURED, WorkflowState.ANALYSED)).toBe(true);
  });

  it('returns false for invalid pair', () => {
    expect(isValidTransition(WorkflowState.CLOSED, WorkflowState.CAPTURED)).toBe(false);
  });
});
