import OpenAI from 'openai';
import type { ExtractedBillingEntry } from './extraction';

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export interface GenerateBillingInput {
  text: string;
  ratePerHour: number;
}

export interface GenerateBillingResult {
  entries: ExtractedBillingEntry[];
  totalValue: number;
  totalHours: number;
  source: 'ai' | 'deterministic';
}

const SYSTEM_PROMPT =
  'You convert legal work notes into professional chargeable narrative entries. ' +
  'Use UK chambers conventions: short descriptive verb-led narratives (e.g. "Review of", ' +
  '"Drafting of", "Attendance upon"), realistic hour estimates in 0.1 or 0.25 increments. ' +
  'Never invent work not implied by the notes. Output strict JSON.';

export async function generateBilling(
  input: GenerateBillingInput,
): Promise<GenerateBillingResult> {
  const client = getOpenAI();
  if (!client || input.text.trim().length === 0) {
    return deterministicBilling(input);
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Rate: £${input.ratePerHour}/hour.\n` +
            `Output JSON: { "entries": [{"description": string, "hours": number, "value": number}] }\n` +
            `Notes:\n${input.text.slice(0, 12_000)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as { entries?: unknown[] };
    const entries = (parsed.entries ?? []).map((e) => {
      const entry = e as Partial<ExtractedBillingEntry>;
      const hours = Number(entry.hours ?? 0);
      const value = Number(entry.value ?? hours * input.ratePerHour);
      return {
        description: String(entry.description ?? 'Unspecified work'),
        hours,
        value: Math.round(value),
      };
    });

    return summarise(entries, 'ai');
  } catch (err) {
    console.error('[law.billing] openai failed, falling back', err);
    return deterministicBilling(input);
  }
}

function summarise(
  entries: ExtractedBillingEntry[],
  source: 'ai' | 'deterministic',
): GenerateBillingResult {
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const totalValue = entries.reduce((s, e) => s + e.value, 0);
  return {
    entries,
    totalHours: Number(totalHours.toFixed(2)),
    totalValue: Math.round(totalValue),
    source,
  };
}

function deterministicBilling(input: GenerateBillingInput): GenerateBillingResult {
  const lines = input.text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const entries: ExtractedBillingEntry[] = lines.map((line) => {
    const explicit = line.match(/\b(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours)\b/i);
    const hours = explicit
      ? Number(explicit[1])
      : Math.max(0.1, Math.round((line.split(/\s+/).length / 30) * 10) / 10);
    return {
      description: line.replace(/\b\d+(?:\.\d+)?\s*(?:h|hr|hrs|hours)\b/i, '').trim(),
      hours,
      value: Math.round(hours * input.ratePerHour),
    };
  });

  return summarise(entries, 'deterministic');
}
