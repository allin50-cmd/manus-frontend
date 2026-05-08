import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  type FunctionDeclaration,
  SchemaType,
} from '@google/generative-ai';
import type { AnalysisResult, AnalysisRecord } from './ultaiAgent.js';

// ── Tool declarations (Gemini format) ─────────────────────────────────────────

const tools: FunctionDeclaration[] = [
  {
    name: 'extract_metadata',
    description: 'Extract basic contract metadata: type, parties, dates, jurisdiction, term.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        contractType: { type: SchemaType.STRING },
        parties: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        effectiveDate: { type: SchemaType.STRING },
        jurisdiction: { type: SchemaType.STRING },
        governingLaw: { type: SchemaType.STRING },
        termLength: { type: SchemaType.STRING },
      },
      required: ['contractType', 'parties'],
    },
  },
  {
    name: 'identify_risks',
    description: 'Identify all contractual risk clauses with severity ratings and remediation.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        riskFlags: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              severity: { type: SchemaType.STRING },
              category: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              clause: { type: SchemaType.STRING },
              recommendation: { type: SchemaType.STRING },
            },
            required: ['severity', 'category', 'description', 'clause', 'recommendation'],
          },
        },
      },
      required: ['riskFlags'],
    },
  },
  {
    name: 'extract_obligations',
    description: 'Extract all contractual obligations by party and key dates.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        obligations: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              party: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              dueDate: { type: SchemaType.STRING },
              recurring: { type: SchemaType.BOOLEAN },
              consequence: { type: SchemaType.STRING },
            },
            required: ['party', 'description', 'recurring'],
          },
        },
        keyDates: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              label: { type: SchemaType.STRING },
              date: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
            },
            required: ['label', 'date', 'description'],
          },
        },
      },
      required: ['obligations', 'keyDates'],
    },
  },
  {
    name: 'complete_analysis',
    description: 'Finalise with overall risk score, summary, and recommendations.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        riskScore: { type: SchemaType.NUMBER },
        riskLevel: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
        recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['riskScore', 'riskLevel', 'summary', 'recommendations'],
    },
  },
];

const SYSTEM_PROMPT = `You are UltAi, an expert contract intelligence agent with the rigour of a senior commercial solicitor.

Workflow — call all four functions in order:
1. extract_metadata
2. identify_risks
3. extract_obligations
4. complete_analysis

Be thorough. Always complete all four calls.`;

// ── Runner ────────────────────────────────────────────────────────────────────

export async function runGeminiAgent(
  record: AnalysisRecord,
  contractText: string,
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    record.status = 'failed';
    record.error = 'GEMINI_API_KEY is not set';
    record.completedAt = new Date().toISOString();
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: tools }],
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
  });

  let metadata: AnalysisResult['metadata'] | null = null;
  let riskFlags: AnalysisResult['riskFlags'] = [];
  let obligations: AnalysisResult['obligations'] = [];
  let keyDates: AnalysisResult['keyDates'] = [];
  let score: number | null = null;
  let level: AnalysisResult['riskLevel'] | null = null;
  let summary = '';
  let recommendations: string[] = [];

  try {
    const chat = model.startChat();
    let response = await chat.sendMessage(
      `Analyse this contract and run all four analysis functions in sequence:\n\n---\n${contractText}\n---`,
    );

    const MAX_TURNS = 10;
    let turns = 0;

    while (turns < MAX_TURNS) {
      turns++;
      const parts = response.response.candidates?.[0]?.content?.parts ?? [];
      const funcCalls = parts.filter((p) => p.functionCall);

      if (funcCalls.length === 0) break;

      const funcResults = funcCalls.map((part) => {
        const fc = part.functionCall!;
        const args = fc.args as Record<string, unknown>;
        record.agentLog.push(`[tool:gemini] ${fc.name}`);

        if (fc.name === 'extract_metadata') {
          metadata = args as unknown as AnalysisResult['metadata'];
        } else if (fc.name === 'identify_risks') {
          riskFlags = (args.riskFlags ?? []) as AnalysisResult['riskFlags'];
        } else if (fc.name === 'extract_obligations') {
          obligations = (args.obligations ?? []) as AnalysisResult['obligations'];
          keyDates = (args.keyDates ?? []) as AnalysisResult['keyDates'];
        } else if (fc.name === 'complete_analysis') {
          score = args.riskScore as number;
          level = args.riskLevel as AnalysisResult['riskLevel'];
          summary = args.summary as string;
          recommendations = (args.recommendations ?? []) as string[];
        }

        return {
          functionResponse: {
            name: fc.name,
            response: { result: 'ok' },
          },
        };
      });

      if (score !== null) break;
      response = await chat.sendMessage(funcResults);
    }

    if (score === null || !metadata || !level) {
      throw new Error('Gemini agent did not complete all required analysis steps');
    }

    record.result = { metadata, riskScore: score, riskLevel: level, riskFlags, obligations, keyDates, summary, recommendations };
    record.status = 'complete';
    record.completedAt = new Date().toISOString();
  } catch (err) {
    record.status = 'failed';
    record.error = err instanceof Error ? err.message : String(err);
    record.completedAt = new Date().toISOString();
  }
}
