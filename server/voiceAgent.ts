import { createHash, randomUUID } from 'crypto';

export type VoiceIntent =
  | 'construction_lead'
  | 'legal_or_compliance'
  | 'urgent_issue'
  | 'general_enquiry'
  | 'unknown';

export type VoiceRiskLevel = 'low' | 'medium' | 'high';
export type VoicePolicyDecision = 'ALLOW' | 'MODIFY' | 'DENY' | 'ESCALATE';

export type VoiceTranscriptInput = {
  session_id: string;
  caller: string;
  transcript: string;
};

export type VoiceAuditEvent = {
  event_id: string;
  event_type:
    | 'session_started'
    | 'transcript_received'
    | 'intent_classified'
    | 'policy_check_required'
    | 'human_escalation_required'
    | 'session_completed';
  payload: Record<string, unknown>;
};

export type VoiceTranscriptResult = {
  intent: VoiceIntent;
  risk_level: VoiceRiskLevel;
  policy_decision: VoicePolicyDecision;
  next_action: string;
  audit_event_id: string;
  events: VoiceAuditEvent[];
};

const CONSTRUCTION_TERMS = new Set([
  'build',
  'builder',
  'construction',
  'contractor',
  'extension',
  'loft',
  'renovation',
  'refurb',
  'site',
]);

const LEGAL_COMPLIANCE_TERMS = new Set([
  'compliance',
  'court',
  'fine',
  'gdpr',
  'legal',
  'policy',
  'regulation',
  'regulatory',
  'solicitor',
]);

const URGENT_TERMS = [
  'asap',
  'deadline today',
  'emergency',
  'immediately',
  'right now',
  'same day',
  'today',
  'urgent',
];

const SOUTH_LONDON_TERMS = [
  'brixton',
  'croydon',
  'dulwich',
  'lambeth',
  'lewisham',
  'london',
  'peckham',
  'south london',
  'south-london',
  'southwark',
  'wandsworth',
];

const AI_DELIVERY_TERMS = [
  'ai',
  'app',
  'automation',
  'design',
  'development',
  'software',
  'website',
];

const IRREVERSIBLE_TERMS = [
  'accept payment',
  'cancel contract',
  'delete',
  'pay invoice',
  'sign contract',
  'submit filing',
  'transfer money',
];

function words(text: string) {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

function containsAny(text: string, terms: Iterable<string>) {
  for (const term of terms) {
    if (text.includes(term)) return true;
  }
  return false;
}

export function classifyVoiceIntent(transcript: string): VoiceIntent {
  const text = transcript.trim().toLowerCase();
  if (!text) return 'unknown';

  const tokenSet = words(text);
  if (containsAny(text, URGENT_TERMS)) return 'urgent_issue';
  if ([...LEGAL_COMPLIANCE_TERMS].some((term) => tokenSet.has(term))) return 'legal_or_compliance';
  if ([...CONSTRUCTION_TERMS].some((term) => tokenSet.has(term))) return 'construction_lead';
  if (tokenSet.size >= 3) return 'general_enquiry';
  return 'unknown';
}

export function evaluateVoicePolicy(intent: VoiceIntent, transcript: string) {
  const text = transcript.toLowerCase();

  if (containsAny(text, IRREVERSIBLE_TERMS)) {
    return {
      risk_level: 'high' as const,
      policy_decision: 'DENY' as const,
      next_action: 'Do not execute irreversible action. Escalate for human review.',
    };
  }

  if (intent === 'urgent_issue') {
    return {
      risk_level: 'high' as const,
      policy_decision: 'ESCALATE' as const,
      next_action: 'Escalate urgent enquiry to a human operator immediately.',
    };
  }

  if (intent === 'legal_or_compliance') {
    return {
      risk_level: 'medium' as const,
      policy_decision: 'ESCALATE' as const,
      next_action: 'Escalate legal or compliance matter to a qualified human reviewer.',
    };
  }

  if (intent === 'construction_lead' && containsAny(text, SOUTH_LONDON_TERMS)) {
    return {
      risk_level: 'low' as const,
      policy_decision: 'ALLOW' as const,
      next_action: 'Route construction enquiry to Accuracy Developments Ltd.',
    };
  }

  if (containsAny(text, AI_DELIVERY_TERMS)) {
    return {
      risk_level: 'low' as const,
      policy_decision: 'ALLOW' as const,
      next_action: 'Route AI/design/development enquiry to UltAi / UltraTech AI.',
    };
  }

  if (intent === 'unknown') {
    return {
      risk_level: 'medium' as const,
      policy_decision: 'MODIFY' as const,
      next_action: 'Ask a clarifying question before routing.',
    };
  }

  return {
    risk_level: 'low' as const,
    policy_decision: 'ALLOW' as const,
    next_action: 'Capture enquiry details and route to SME intake queue.',
  };
}

export function processVoiceTranscript(input: VoiceTranscriptInput): VoiceTranscriptResult {
  const intent = classifyVoiceIntent(input.transcript);
  const policy = evaluateVoicePolicy(intent, input.transcript);
  const audit_event_id = createHash('sha256')
    .update(`${input.session_id}:${input.caller}:${input.transcript}`)
    .digest('hex')
    .slice(0, 32);

  const events: VoiceAuditEvent[] = [
    {
      event_id: randomUUID(),
      event_type: 'session_started',
      payload: { caller: input.caller },
    },
    {
      event_id: randomUUID(),
      event_type: 'transcript_received',
      payload: { transcript: input.transcript },
    },
    {
      event_id: randomUUID(),
      event_type: 'intent_classified',
      payload: { intent },
    },
    {
      event_id: randomUUID(),
      event_type: 'policy_check_required',
      payload: {
        intent,
        risk_level: policy.risk_level,
        policy_decision: policy.policy_decision,
      },
    },
  ];

  if (policy.policy_decision === 'ESCALATE') {
    events.push({
      event_id: randomUUID(),
      event_type: 'human_escalation_required',
      payload: { intent, reason: policy.next_action },
    });
  }

  events.push({
    event_id: randomUUID(),
    event_type: 'session_completed',
    payload: {
      intent,
      risk_level: policy.risk_level,
      policy_decision: policy.policy_decision,
      next_action: policy.next_action,
    },
  });

  return {
    intent,
    risk_level: policy.risk_level,
    policy_decision: policy.policy_decision,
    next_action: policy.next_action,
    audit_event_id,
    events,
  };
}

