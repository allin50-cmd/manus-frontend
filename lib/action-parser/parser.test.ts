import { describe, it, expect } from 'vitest';
import { parseAction } from './parser';

describe('Parser', () => {
  it('should parse a reminder', () => {
    const result = parseAction('Remind me to call Dagon tomorrow at 2pm');
    expect(result.action).toBe('create_reminder');
    expect(result.title).toContain('call Dagon');
    expect(result.date).toBe('tomorrow');
    expect(result.time).toBe('2pm');
  });

  it('should parse a meeting', () => {
    const result = parseAction('Schedule a meeting with Chris and Dagon next Tuesday at 11am about FineGuard');
    expect(result.action).toBe('schedule_meeting');
    expect(result.participants).toEqual(['Chris', 'Dagon']);
    expect(result.date).toContain('Tuesday');
    expect(result.time).toContain('11am');
  });

  it('should mark unknown for gibberish', () => {
    const result = parseAction('Hello world');
    expect(result.action).toBe('unknown');
    expect(result.confidence).toBeLessThan(0.6);
  });
});
