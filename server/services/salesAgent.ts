import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AuditLead {
  id: string;
  email: string;
  name?: string | null;
  chamberSize?: string | null;
  painPoints?: string | null;
}

export interface SalesPolicy {
  maxDiscountPercent: number;
  minPriceMonthly: number;
  requireApprovalAbove: number;
}

export type AgentAction = 'qualify' | 'negotiate' | 'close' | 'escalate';

export interface AgentDecision {
  action: AgentAction;
  message: string;
  priceMonthly: number;
  confidence: number;
  reasoning?: string;
}

const DEFAULT_POLICY: SalesPolicy = {
  maxDiscountPercent: 15,
  minPriceMonthly: 2000,
  requireApprovalAbove: 5000,
};

export async function runSalesAgent(
  lead: AuditLead,
  policy: SalesPolicy = DEFAULT_POLICY
): Promise<AgentDecision> {
  const painPoints = lead.painPoints ? JSON.parse(lead.painPoints) : [];

  const prompt = `You are a sales agent for VaultLine, an AI revenue recovery platform for UK legal chambers.

Lead profile:
- Email: ${lead.email}
- Name: ${lead.name ?? 'Unknown'}
- Chamber size: ${lead.chamberSize ?? 'Unknown'}
- Pain points: ${painPoints.length > 0 ? painPoints.join(', ') : 'not specified'}

Pricing policy (HARD LIMITS — do not exceed):
- Standard price: £2,500/month
- Maximum discount allowed: ${policy.maxDiscountPercent}% (floor: £${policy.minPriceMonthly}/month)
- Deals above £${policy.requireApprovalAbove}/month require human approval

Product context: VaultLine recovers £3k–£12k/month in unbilled work for chambers via AI analysis of billing patterns, time entries, and matter activity.

Your task: based on the lead profile, decide the best next action.

Respond with valid JSON only:
{
  "action": "qualify" | "negotiate" | "close" | "escalate",
  "message": "The email/message to send to this lead",
  "priceMonthly": <number — proposed monthly price in GBP>,
  "confidence": <0.0–1.0>,
  "reasoning": "Brief internal reasoning"
}

Action guide:
- qualify: Lead needs more info gathered before pricing
- negotiate: Lead is warm; offer a tailored price
- close: Lead is ready; send payment link prompt
- escalate: Unusual situation requiring human review`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  let decision: AgentDecision;

  try {
    decision = JSON.parse(raw) as AgentDecision;
  } catch {
    return escalate('Failed to parse agent response');
  }

  // Guardrails — enforce policy hard limits
  if (decision.confidence < 0.7) {
    return escalate(`Low confidence (${decision.confidence}): ${decision.reasoning ?? 'no reasoning'}`);
  }
  if (decision.priceMonthly < policy.minPriceMonthly) {
    return escalate(`Proposed price £${decision.priceMonthly} is below minimum £${policy.minPriceMonthly}`);
  }
  if (decision.action === 'close' && decision.priceMonthly > policy.requireApprovalAbove) {
    return escalate(`High-value close £${decision.priceMonthly} requires human approval`);
  }

  return decision;
}

function escalate(reason: string): AgentDecision {
  return {
    action: 'escalate',
    message: 'A member of our team will be in touch shortly.',
    priceMonthly: 0,
    confidence: 0,
    reasoning: reason,
  };
}
