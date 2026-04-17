import OpenAI from 'openai';
import type { DocumentType } from './documents';

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export interface ExtractedTask {
  description: string;
  deadline?: string;
  owner?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ExtractedBillingEntry {
  description: string;
  hours: number;
  value: number;
}

export interface ComplianceFlag {
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  detail?: string;
}

export interface ExtractionResult {
  tasks: ExtractedTask[];
  parties: string[];
  deadlines: { description: string; date?: string }[];
  billingEntries: ExtractedBillingEntry[];
  complianceFlags: ComplianceFlag[];
  summary?: string;
}

const SYSTEM_PROMPT =
  'You are a senior legal assistant in a UK chambers / law firm. ' +
  'Given a legal document, extract: (1) action items with owners and deadlines, ' +
  '(2) named parties, (3) explicit deadlines with dates, (4) professional billing entries ' +
  'with realistic hour estimates at the supplied hourly rate, (5) compliance flags covering ' +
  'GDPR, court procedure, conflict, privilege, and regulatory risk. Be precise and conservative.';

export async function extractFromDocument(
  text: string,
  documentType: DocumentType,
  ratePerHour: number = 250,
): Promise<ExtractionResult> {
  const client = getOpenAI();
  if (!client || text.trim().length === 0) {
    return deterministicExtract(text, ratePerHour);
  }

  const truncated = text.slice(0, 18_000);
  const user = JSON.stringify({ documentType, ratePerHour, text: truncated });

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
            `Return JSON with this shape:
{
  "tasks": [{"description": string, "deadline": string?, "owner": string?, "priority": "low"|"medium"|"high"}],
  "parties": [string],
  "deadlines": [{"description": string, "date": string?}],
  "billingEntries": [{"description": string, "hours": number, "value": number}],
  "complianceFlags": [{"type": string, "severity": "Low"|"Medium"|"High", "detail": string?}],
  "summary": string
}
Document: ${user}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<ExtractionResult>;
    return normalise(parsed, ratePerHour);
  } catch (err) {
    console.error('[law.extract] openai failed, falling back', err);
    return deterministicExtract(text, ratePerHour);
  }
}

function normalise(raw: Partial<ExtractionResult>, ratePerHour: number): ExtractionResult {
  const billingEntries = (raw.billingEntries ?? []).map((e) => ({
    description: String(e.description ?? 'Unspecified work'),
    hours: Number(e.hours ?? 0),
    value: Number(e.value ?? Number(e.hours ?? 0) * ratePerHour),
  }));

  return {
    tasks: (raw.tasks ?? []).map((t) => ({
      description: String(t.description ?? ''),
      deadline: t.deadline,
      owner: t.owner,
      priority: t.priority,
    })),
    parties: (raw.parties ?? []).map(String),
    deadlines: (raw.deadlines ?? []).map((d) => ({
      description: String(d.description ?? ''),
      date: d.date,
    })),
    billingEntries,
    complianceFlags: (raw.complianceFlags ?? []).map((f) => ({
      type: String(f.type ?? 'unspecified'),
      severity: (f.severity as ComplianceFlag['severity']) ?? 'Low',
      detail: f.detail,
    })),
    summary: raw.summary,
  };
}

function deterministicExtract(text: string, ratePerHour: number): ExtractionResult {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const taskRegex = /\b(must|shall|will|to be|should|please)\b/i;
  const tasks: ExtractedTask[] = sentences
    .filter((s) => taskRegex.test(s))
    .slice(0, 10)
    .map((s) => ({ description: s.slice(0, 240) }));

  const dateRegex = /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}|\d{4}-\d{2}-\d{2})\b/gi;
  const deadlines = Array.from(text.matchAll(dateRegex)).slice(0, 10).map((m) => ({
    description: `Date reference: ${m[0]}`,
    date: m[0],
  }));

  const partyRegex = /\b(Claimant|Defendant|Respondent|Appellant|Applicant|Plaintiff)[:\s]+([A-Z][A-Za-z&.\s]{2,80})/g;
  const parties = Array.from(new Set(Array.from(text.matchAll(partyRegex)).map((m) => m[2].trim()))).slice(0, 10);

  const flags: ComplianceFlag[] = [];
  if (/personal data|GDPR|data protection/i.test(text))
    flags.push({ type: 'gdpr', severity: 'Medium', detail: 'Personal data references detected' });
  if (/court deadline|file by|lodge by|service deadline/i.test(text))
    flags.push({ type: 'court_deadline', severity: 'High', detail: 'Procedural deadline referenced' });
  if (/without prejudice|privileged/i.test(text))
    flags.push({ type: 'privilege', severity: 'Low', detail: 'Privileged/without-prejudice material' });

  const wordCount = text.split(/\s+/).length;
  const hours = Math.max(0.25, Math.round((wordCount / 600) * 4) / 4);
  const billingEntries: ExtractedBillingEntry[] = wordCount
    ? [
        {
          description: 'Review and annotate document',
          hours,
          value: Math.round(hours * ratePerHour),
        },
      ]
    : [];

  return {
    tasks,
    parties,
    deadlines,
    billingEntries,
    complianceFlags: flags,
    summary: sentences.slice(0, 3).join(' '),
  };
}
