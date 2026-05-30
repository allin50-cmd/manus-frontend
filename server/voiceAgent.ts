import { createHash } from 'crypto';
import OpenAI from 'openai';

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

function deterministicUuid(seed: string): string {
  const chars = createHash('sha256').update(seed).digest('hex').slice(0, 32).split('');
  chars[12] = '5';
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);

  return [
    chars.slice(0, 8).join(''),
    chars.slice(8, 12).join(''),
    chars.slice(12, 16).join(''),
    chars.slice(16, 20).join(''),
    chars.slice(20, 32).join(''),
  ].join('-');
}

function lifecycleEvent(
  auditEventId: string,
  eventType: VoiceAuditEvent['event_type'],
  payload: Record<string, unknown>,
): VoiceAuditEvent {
  return {
    event_id: deterministicUuid(`${auditEventId}:${eventType}`),
    event_type: eventType,
    payload,
  };
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
    lifecycleEvent(audit_event_id, 'session_started', { caller: input.caller }),
    lifecycleEvent(audit_event_id, 'transcript_received', { transcript: input.transcript }),
    lifecycleEvent(audit_event_id, 'intent_classified', { intent }),
    lifecycleEvent(audit_event_id, 'policy_check_required', {
      intent,
      risk_level: policy.risk_level,
      policy_decision: policy.policy_decision,
    }),
  ];

  if (policy.policy_decision === 'ESCALATE') {
    events.push(lifecycleEvent(audit_event_id, 'human_escalation_required', { intent, reason: policy.next_action }));
  }

  events.push(
    lifecycleEvent(audit_event_id, 'session_completed', {
      intent,
      risk_level: policy.risk_level,
      policy_decision: policy.policy_decision,
      next_action: policy.next_action,
    }),
  );

  return {
    intent,
    risk_level: policy.risk_level,
    policy_decision: policy.policy_decision,
    next_action: policy.next_action,
    audit_event_id,
    events,
  };
}

const AI_SYSTEM_PROMPT = `You are a voice call intake classifier for FineGuard Service.
Given a caller phone number and transcript, classify intent and apply a policy gate.

Intents (pick one): construction_lead | legal_or_compliance | urgent_issue | general_enquiry | unknown
Risk levels: low | medium | high
Policy decisions: ALLOW | MODIFY | DENY | ESCALATE

Rules:
- Irreversible actions (delete, transfer money, sign contract, submit filing, accept payment) → DENY, high
- Urgent phrases (urgent, emergency, deadline today, asap, immediately) → ESCALATE, high
- Legal/compliance (compliance, gdpr, court, fine, regulation, solicitor) → ESCALATE, medium
- Construction in South London → ALLOW, low
- AI/software/automation → ALLOW, low
- Unknown intent → MODIFY, medium
- Default → ALLOW, low

Respond with JSON only matching this shape exactly:
{"intent":"...","risk_level":"...","policy_decision":"...","next_action":"...","reasoning":"..."}`;

export type VoiceTranscriptResultAI = VoiceTranscriptResult & {
  ai_reasoning?: string;
  ai_model?: string;
};

const VALID_INTENTS = new Set<string>(['construction_lead', 'legal_or_compliance', 'urgent_issue', 'general_enquiry', 'unknown']);
const VALID_RISKS = new Set<string>(['low', 'medium', 'high']);
const VALID_DECISIONS = new Set<string>(['ALLOW', 'MODIFY', 'DENY', 'ESCALATE']);

export async function processVoiceTranscriptAI(
  input: VoiceTranscriptInput,
): Promise<VoiceTranscriptResultAI> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Caller: ${input.caller}\nTranscript: ${input.transcript}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
        temperature: 0,
      });
      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error('Empty OpenAI response content');
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      // Runtime validation — fall back if any required field is missing or out-of-enum
      if (
        !VALID_INTENTS.has(parsed.intent as string) ||
        !VALID_RISKS.has(parsed.risk_level as string) ||
        !VALID_DECISIONS.has(parsed.policy_decision as string) ||
        typeof parsed.next_action !== 'string' ||
        !parsed.next_action
      ) {
        throw new Error(`Invalid AI response shape: ${raw}`);
      }

      let intent = parsed.intent as VoiceIntent;
      let risk_level = parsed.risk_level as VoiceRiskLevel;
      let policy_decision = parsed.policy_decision as VoicePolicyDecision;
      let next_action = parsed.next_action as string;
      const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : undefined;

      // Hardcoded safety guard — IRREVERSIBLE_TERMS always DENY regardless of AI decision
      if (containsAny(input.transcript.toLowerCase(), IRREVERSIBLE_TERMS)) {
        intent = 'unknown';
        risk_level = 'high';
        policy_decision = 'DENY';
        next_action = 'Do not execute irreversible action. Escalate for human review.';
      }

      // Reuse the shared audit-event builder
      const base = processVoiceTranscript(input);
      const audit_event_id = base.audit_event_id;
      const events: VoiceAuditEvent[] = [
        lifecycleEvent(audit_event_id, 'session_started', { caller: input.caller }),
        lifecycleEvent(audit_event_id, 'transcript_received', { transcript: input.transcript }),
        lifecycleEvent(audit_event_id, 'intent_classified', { intent, model: 'gpt-4o' }),
        lifecycleEvent(audit_event_id, 'policy_check_required', { intent, risk_level, policy_decision }),
      ];
      if (policy_decision === 'ESCALATE') {
        events.push(lifecycleEvent(audit_event_id, 'human_escalation_required', { intent, reason: next_action }));
      }
      events.push(lifecycleEvent(audit_event_id, 'session_completed', { intent, risk_level, policy_decision, next_action }));

      return { intent, risk_level, policy_decision, next_action, audit_event_id, events, ai_reasoning: reasoning, ai_model: 'gpt-4o' };
    } catch (err) {
      console.error('[voiceAgent] OpenAI error, falling back to keyword matching:', err);
    }
  }
  return processVoiceTranscript(input);
}
