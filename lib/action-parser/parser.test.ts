import { describe, expect, it } from 'vitest';
import { parseActionRequest } from './parser';

const referenceDate = new Date('2026-07-06T12:00:00.000Z');

describe('parseActionRequest', () => {
  it('parses a reminder request', () => {
    const result = parseActionRequest('Remind me tomorrow at 2pm to call Dagon about FineGuard.', referenceDate);

    expect(result.action).toBe('create_reminder');
    expect(result.date).toBe('2026-07-07');
    expect(result.time).toBe('14:00');
    expect(result.needs_confirmation).toBe(false);
    expect(result.missing_fields).toEqual([]);
  });

  it('parses a task request without requiring a date', () => {
    const result = parseActionRequest('Create a task for Michelle to chase the Accuracy quote.', referenceDate);

    expect(result.action).toBe('create_task');
    expect(result.needs_confirmation).toBe(false);
  });

  it('parses an invoice request', () => {
    const result = parseActionRequest('Create an invoice for £450 for website updates.', referenceDate);

    expect(result.action).toBe('create_invoice');
    expect(result.amount).toBe(450);
    expect(result.currency).toBe('GBP');
  });

  it('parses a meeting request', () => {
    const result = parseActionRequest('Schedule a meeting with Chris and Dagon next Tuesday at 11am about FineGuard.', referenceDate);

    expect(result.action).toBe('schedule_meeting');
    expect(result.participants).toEqual(['Chris', 'Dagon']);
    expect(result.title).toBe('FineGuard.');
    expect(result.date).toBe('2026-07-07');
    expect(result.time).toBe('11:00');
    expect(result.needs_confirmation).toBe(false);
  });

  it('marks a meeting without participants as needing confirmation', () => {
    const result = parseActionRequest('Set up a meeting tomorrow at 3pm.', referenceDate);

    expect(result.action).toBe('schedule_meeting');
    expect(result.needs_confirmation).toBe(true);
    expect(result.missing_fields).toContain('participants');
  });

  it('fails safely for unknown requests', () => {
    const result = parseActionRequest('Book me an Uber to Croydon tomorrow at 9am.', referenceDate);

    expect(result.action).toBe('unknown');
    expect(result.needs_confirmation).toBe(true);
    expect(result.missing_fields).toEqual(['action']);
  });
});
