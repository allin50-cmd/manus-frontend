import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContractMetadata {
  contractType: string;
  parties: string[];
  effectiveDate: string | null;
  jurisdiction: string | null;
  governingLaw: string | null;
  termLength: string | null;
}

export interface RiskFlag {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  clause: string;
  recommendation: string;
}

export interface Obligation {
  party: string;
  description: string;
  dueDate: string | null;
  recurring: boolean;
  consequence: string | null;
}

export interface KeyDate {
  label: string;
  date: string;
  description: string;
}

export interface AnalysisResult {
  metadata: ContractMetadata;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFlags: RiskFlag[];
  obligations: Obligation[];
  keyDates: KeyDate[];
  summary: string;
  recommendations: string[];
}

export interface AnalysisRecord {
  id: string;
  fileName: string;
  status: 'processing' | 'complete' | 'failed';
  result?: AnalysisResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
  agentLog: string[];
}

// ── In-memory store ───────────────────────────────────────────────────────────

const store = new Map<string, AnalysisRecord>();

export function getAnalysis(id: string): AnalysisRecord | undefined {
  return store.get(id);
}

export function listAnalyses(): AnalysisRecord[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: 'extract_metadata',
    description:
      'Extract basic contract metadata: type, parties, dates, jurisdiction, and term length.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contractType: {
          type: 'string',
          description: 'e.g. NDA, Services Agreement, Employment Contract, Lease, SaaS Licence',
        },
        parties: {
          type: 'array',
          items: { type: 'string' },
          description: 'Legal names of all parties to the contract',
        },
        effectiveDate: { type: 'string', description: 'ISO date or null' },
        jurisdiction: { type: 'string', description: 'Country or state/region jurisdiction or null' },
        governingLaw: { type: 'string', description: 'Governing law clause value or null' },
        termLength: { type: 'string', description: 'e.g. "12 months", "perpetual", or null' },
      },
      required: ['contractType', 'parties'],
    },
  },
  {
    name: 'identify_risks',
    description:
      'Identify all contractual risk clauses with severity ratings, descriptions, and remediation advice.',
    input_schema: {
      type: 'object' as const,
      properties: {
        riskFlags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
              category: {
                type: 'string',
                description:
                  'e.g. Liability, IP Ownership, Termination, Payment, Data Protection, Jurisdiction',
              },
              description: {
                type: 'string',
                description: 'Plain-English explanation of the risk',
              },
              clause: {
                type: 'string',
                description: 'Verbatim or paraphrased clause text that creates this risk',
              },
              recommendation: {
                type: 'string',
                description: 'Specific action to mitigate this risk',
              },
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
    description: 'Extract all contractual obligations and important dates.',
    input_schema: {
      type: 'object' as const,
      properties: {
        obligations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              party: { type: 'string', description: 'The party responsible for this obligation' },
              description: {
                type: 'string',
                description: 'What must be done',
              },
              dueDate: { type: 'string', description: 'ISO date or natural language date or null' },
              recurring: {
                type: 'boolean',
                description: 'True if this obligation recurs (monthly, quarterly, annually)',
              },
              consequence: {
                type: 'string',
                description: 'Consequence of non-compliance, or null',
              },
            },
            required: ['party', 'description', 'recurring'],
          },
        },
        keyDates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'e.g. "Effective Date", "Renewal Deadline"' },
              date: { type: 'string', description: 'ISO date or natural language date' },
              description: { type: 'string' },
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
    description:
      'Finalise the analysis with an overall risk score, plain-English summary, and prioritised recommendations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        riskScore: {
          type: 'number',
          description: '0–100. Higher = greater legal and commercial risk.',
        },
        riskLevel: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Overall risk tier derived from the risk score and flag severity mix.',
        },
        summary: {
          type: 'string',
          description:
            'Two to three sentence plain-English summary of the contract and its key risk profile.',
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Prioritised list of recommended actions before signing or proceeding.',
        },
      },
      required: ['riskScore', 'riskLevel', 'summary', 'recommendations'],
    },
  },
];

// ── Agent runner ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are UltAi, an expert contract intelligence agent. You analyse legal contracts with the rigour of a senior commercial solicitor.

Your workflow is:
1. Call extract_metadata to identify what the contract is and who is party to it.
2. Call identify_risks to surface every material risk clause with severity and remediation advice.
3. Call extract_obligations to catalogue every obligation by party and all key dates.
4. Call complete_analysis to provide the overall risk score, tier, plain-English summary, and prioritised recommendations.

Be thorough and precise. If the text is short or informal, apply proportionate analysis. Always complete all four tool calls in order.`;

async function runAgent(
  record: AnalysisRecord,
  contractText: string,
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    record.status = 'failed';
    record.error = 'ANTHROPIC_API_KEY is not set';
    record.completedAt = new Date().toISOString();
    return;
  }

  const client = new Anthropic({ apiKey });

  // Accumulated results from each tool call
  let metadata: ContractMetadata | null = null;
  let riskFlags: RiskFlag[] = [];
  let obligations: Obligation[] = [];
  let keyDates: KeyDate[] = [];
  let score: number | null = null;
  let level: AnalysisResult['riskLevel'] | null = null;
  let summary = '';
  let recommendations: string[] = [];

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Analyse this contract and run all four analysis tools in sequence:\n\n---\n${contractText}\n---`,
    },
  ];

  const MAX_TURNS = 12;
  let turns = 0;

  try {
    while (turns < MAX_TURNS) {
      turns++;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      // Append assistant turn
      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'end_turn') break;

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of toolUseBlocks) {
          const input = block.input as Record<string, unknown>;
          record.agentLog.push(`[tool] ${block.name}`);

          let resultContent = 'ok';

          if (block.name === 'extract_metadata') {
            metadata = input as unknown as ContractMetadata;
          } else if (block.name === 'identify_risks') {
            riskFlags = (input.riskFlags ?? []) as RiskFlag[];
          } else if (block.name === 'extract_obligations') {
            obligations = (input.obligations ?? []) as Obligation[];
            keyDates = (input.keyDates ?? []) as KeyDate[];
          } else if (block.name === 'complete_analysis') {
            score = input.riskScore as number;
            level = input.riskLevel as AnalysisResult['riskLevel'];
            summary = input.summary as string;
            recommendations = (input.recommendations ?? []) as string[];
            resultContent = 'Analysis complete.';
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: resultContent,
          });
        }

        messages.push({ role: 'user', content: toolResults });

        // Once complete_analysis has been called, we have everything
        if (score !== null) break;
      } else {
        // Unexpected stop reason
        break;
      }
    }

    if (score === null || !metadata || !level) {
      throw new Error('Agent did not complete all required analysis steps');
    }

    record.result = {
      metadata,
      riskScore: score,
      riskLevel: level,
      riskFlags,
      obligations,
      keyDates,
      summary,
      recommendations,
    };
    record.status = 'complete';
    record.completedAt = new Date().toISOString();
  } catch (err) {
    record.status = 'failed';
    record.error = err instanceof Error ? err.message : String(err);
    record.completedAt = new Date().toISOString();
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function startAnalysis(fileName: string, contractText: string): string {
  const id = randomUUID();
  const record: AnalysisRecord = {
    id,
    fileName: fileName || 'Untitled Contract',
    status: 'processing',
    createdAt: new Date().toISOString(),
    agentLog: ['[start] Contract ingested — running UltAi agent…'],
  };
  store.set(id, record);

  // Run async, don't await
  runAgent(record, contractText).catch((err) => {
    record.status = 'failed';
    record.error = String(err);
    record.completedAt = new Date().toISOString();
  });

  return id;
}
