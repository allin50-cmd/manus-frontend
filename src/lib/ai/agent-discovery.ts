import { getAnthropicClient } from './client';
import { getComplianceSystemPrompt } from './prompts';
import { config } from '@/config';
import { log } from '@/lib/logger';
import type { Company } from '@/types/company';
import type {
  Officer,
  PersonWithSignificantControl,
  Charge,
  ViabilityScore,
  DiscoveryInsights,
} from '@/types/discovery';

interface AgentDiscoveryInput {
  company: Company;
  sicCodes: string[];
  officers: Officer[];
  personsWithSignificantControl: PersonWithSignificantControl[];
  charges: Charge[];
  viability: ViabilityScore;
}

function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text.trim()) as T;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]) as T; } catch { /* fall through */ }
    }
    return null;
  }
}

/**
 * AI agent that synthesises Companies House data into actionable discovery insights:
 * - who the key contacts are and how to approach them
 * - how to engage effectively with the business
 * - a plain-English viability summary
 * - red flags and strength signals
 *
 * Returns null if the AI client is unavailable or the call fails.
 */
export async function generateDiscoveryInsights(
  input: AgentDiscoveryInput,
): Promise<DiscoveryInsights | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  const { company, sicCodes, officers, personsWithSignificantControl, charges, viability } = input;

  const activeOfficers = officers.filter((o) => !o.resignedOn);
  const activePSC = personsWithSignificantControl.filter((p) => !p.ceasedOn);
  const outstandingCharges = charges.filter(
    (c) => c.status === 'outstanding' || c.status === 'registered',
  );

  const prompt = `You are analysing a UK company to help a professional decide whether and how to do business with it.

COMPANY DATA
Name: ${company.name} (${company.number})
Status: ${company.status} | Type: ${company.type}
Incorporated: ${company.incorporationDate}
SIC codes: ${sicCodes.length > 0 ? sicCodes.join(', ') : 'not provided'}
Compliance: ${company.compliance.status} (risk: ${company.compliance.riskLevel})
Viability score: ${viability.score}/100 — ${viability.tier}

ACTIVE OFFICERS (${activeOfficers.length})
${activeOfficers.length > 0
  ? activeOfficers.map((o) => `- ${o.name} (${o.role}, appointed ${o.appointedOn})`).join('\n')
  : '(none on record)'}

BENEFICIAL OWNERS / PSC (${activePSC.length})
${activePSC.length > 0
  ? activePSC.map((p) => `- ${p.name} (${p.nationality ?? 'nationality unknown'}, notified ${p.notifiedOn})`).join('\n')
  : '(none on record)'}

OUTSTANDING CHARGES (${outstandingCharges.length})
${outstandingCharges.length > 0
  ? outstandingCharges.map((c) => `- ${c.chargeCode}: ${c.description ?? c.status} (created ${c.createdOn})`).join('\n')
  : '(none)'}

VIABILITY FACTORS
${viability.factors.map((f) => `• ${f}`).join('\n')}

Respond with ONLY this JSON — no other text:
{
  "whoToContact": [
    {"name": "<officer or PSC name>", "role": "<their role>", "context": "<1 sentence on why they are the right contact and how to approach>"}
  ],
  "howToEngage": "<2-3 sentences: recommended engagement approach for this specific business — communication style, priorities, watch-outs>",
  "viabilitySummary": "<2-3 sentences: plain-English assessment of whether this is a sound business to work with and why>",
  "redFlags": ["<specific concern>"],
  "strengthSignals": ["<specific positive>"]
}`;

  try {
    const response = await client.messages.create({
      model: config.ai.model,
      max_tokens: 1024,
      system: getComplianceSystemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return null;

    return parseJson<DiscoveryInsights>(block.text);
  } catch (err) {
    log.error('[ai] generateDiscoveryInsights failed', {
      error: String(err),
      company: company.number,
    });
    return null;
  }
}
