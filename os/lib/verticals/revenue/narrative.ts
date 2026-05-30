import OpenAI from 'openai';
import type { ScoringResult } from './scoring';

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export interface NarrativeInput {
  lead: {
    name: string;
    system?: string | null;
    sizeTier?: string | null;
    painPoints?: string[];
  };
  result: ScoringResult;
}

export async function generateRevenueNarrative(input: NarrativeInput): Promise<string> {
  const client = getOpenAI();
  if (!client) return deterministicNarrative(input);

  const system =
    'You are a senior revenue operations consultant for UK chambers and law firms. ' +
    'Write a concise (under 220 words), board-ready narrative explaining the revenue leakage ' +
    'estimate, the drivers, and the top 3 corrective actions. Use plain language, no hype.';

  const user = JSON.stringify(input);

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content?.trim() ?? deterministicNarrative(input);
  } catch (err) {
    console.error('[narrative] openai failed, falling back', err);
    return deterministicNarrative(input);
  }
}

function deterministicNarrative({ lead, result }: NarrativeInput): string {
  const { low, high } = result.estimatedLeak;
  const drivers = result.drivers.map((d) => `- ${d}`).join('\n');
  return [
    `Audit summary for ${lead.name}:`,
    `Estimated annual revenue leakage: £${low.toLocaleString()}–£${high.toLocaleString()} (${result.riskLevel} risk).`,
    `Confidence: ${(result.confidence * 100).toFixed(0)}%.`,
    '',
    'Primary drivers:',
    drivers,
    '',
    'Recommended next steps:',
    '- Close the unbilled-work loop with weekly WIP reviews.',
    '- Reduce billing lag to <14 days via automated narrative drafting.',
    '- Benchmark against sector peers and tighten lockup targets.',
  ].join('\n');
}
