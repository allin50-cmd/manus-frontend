import { describe, expect, it } from 'vitest';
import { classifyVoiceIntent, evaluateVoicePolicy, processVoiceTranscript } from './voiceAgent';

describe('voice agent bridge logic', () => {
  it('routes South London construction enquiries to Accuracy Developments', () => {
    const result = processVoiceTranscript({
      session_id: 'voice-test-1',
      caller: '+442000000000',
      transcript: 'I need a builder for a renovation in South London.',
    });

    expect(result.intent).toBe('construction_lead');
    expect(result.risk_level).toBe('low');
    expect(result.policy_decision).toBe('ALLOW');
    expect(result.next_action).toBe('Route construction enquiry to Accuracy Developments Ltd.');
    expect(result.events.map((event) => event.event_type)).toContain('session_completed');
  });

  it('escalates urgent legal compliance enquiries', () => {
    const result = processVoiceTranscript({
      session_id: 'voice-test-2',
      caller: '+442000000001',
      transcript: 'Urgent legal compliance deadline today, I need help immediately.',
    });

    expect(result.intent).toBe('urgent_issue');
    expect(result.risk_level).toBe('high');
    expect(result.policy_decision).toBe('ESCALATE');
    expect(result.events.map((event) => event.event_type)).toContain('human_escalation_required');
  });

  it('keeps audit event ids deterministic for duplicate inputs', () => {
    const input = {
      session_id: 'voice-test-3',
      caller: '+442000000002',
      transcript: 'We need AI automation and website design.',
    };

    expect(processVoiceTranscript(input).audit_event_id).toBe(processVoiceTranscript(input).audit_event_id);
  });

  it('denies irreversible actions', () => {
    const policy = evaluateVoicePolicy('general_enquiry', 'Please sign contract and transfer money.');

    expect(policy.policy_decision).toBe('DENY');
    expect(policy.risk_level).toBe('high');
  });

  it('classifies sparse transcripts as unknown', () => {
    expect(classifyVoiceIntent('Hi')).toBe('unknown');
  });
});

