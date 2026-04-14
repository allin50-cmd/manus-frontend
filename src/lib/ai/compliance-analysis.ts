import { getAnthropicClient } from './client';
import { getComplianceSystemPrompt } from './prompts';
import { config } from '@/config';
import { log } from '@/lib/logger';
import type { Company } from '@/types/company';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AICompanyAnalysis {
  analysis: string;
  recommendations: string[];
}

export type AIRiskScore = 'low' | 'medium' | 'high' | 'critical';

export interface AIFullAnalysis {
  analysis: string;
  riskScore: AIRiskScore;
  recommendations: string[];
  generatedAt: string;
}

export interface AIEmailContent {
  subject: string;
  body: string;
}

export interface GenerateEmailInput {
  companyName: string;
  obligationType: string;
  daysRemaining: number;
  urgency: string;
  dueDate: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text.trim()) as T;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function deriveRiskScore(company: Company): AIRiskScore {
  const { overdueFilings, accounts, confirmationStatement } = company.compliance;

  if (overdueFilings.length > 1) return 'critical';

  const mostOverdue = overdueFilings[0];
  if (mostOverdue && mostOverdue.daysOverdue > 30) return 'critical';
  if (mostOverdue && mostOverdue.daysOverdue > 0) return 'high';

  const minDays = Math.min(accounts.daysUntilDue, confirmationStatement.daysUntilDue);
  if (minDays < 14) return 'high';
  if (minDays <= 30) return 'medium';
  return 'low';
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Quick single-call analysis for the Companies House lookup route.
 * Returns null if AI is unavailable or the call fails.
 */
export async function analyseCompany(company: Company): Promise<AICompanyAnalysis | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  const prompt = `Analyse this UK company's compliance position and respond with JSON only.

Company: ${company.name} (${company.number})
Status: ${company.status}
Accounts due: ${company.compliance.accounts.nextDue} (${company.compliance.accounts.daysUntilDue} days, overdue: ${company.compliance.accounts.overdue})
Confirmation statement due: ${company.compliance.confirmationStatement.nextDue} (${company.compliance.confirmationStatement.daysUntilDue} days, overdue: ${company.compliance.confirmationStatement.overdue})
Overdue filings: ${JSON.stringify(company.compliance.overdueFilings)}
Risk level: ${company.compliance.riskLevel}

Respond with this JSON structure only, no other text:
{"analysis":"<2-3 sentence summary>","recommendations":["<action 1>","<action 2>"]}`;

  try {
    const response = await client.messages.create({
      model: config.ai.model,
      max_tokens: 512,
      system: getComplianceSystemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return null;

    return parseJson<AICompanyAnalysis>(block.text);
  } catch (err) {
    log.error('[ai] analyseCompany failed', { error: String(err), company: company.number });
    return null;
  }
}

/**
 * Full compliance analysis with risk scoring — used by the dedicated AI endpoint.
 * Returns null if AI is unavailable or the call fails.
 */
export async function fullComplianceAnalysis(
  company: Company,
  context?: string,
): Promise<AIFullAnalysis | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  const riskScore = deriveRiskScore(company);

  const prompt = `Provide a detailed compliance analysis for this UK company. Respond with JSON only.

Company: ${company.name} (${company.number})
Status: ${company.status}, Type: ${company.type}
Incorporated: ${company.incorporationDate}
Accounts due: ${company.compliance.accounts.nextDue} (${company.compliance.accounts.daysUntilDue} days, overdue: ${company.compliance.accounts.overdue})
Confirmation statement due: ${company.compliance.confirmationStatement.nextDue} (${company.compliance.confirmationStatement.daysUntilDue} days, overdue: ${company.compliance.confirmationStatement.overdue})
Overdue filings: ${JSON.stringify(company.compliance.overdueFilings)}
Penalties: ${JSON.stringify(company.compliance.penalties)}
Risk level: ${company.compliance.riskLevel}${context ? `\nAdditional context: ${context}` : ''}

Respond with this JSON structure only, no other text:
{"analysis":"<detailed 3-4 sentence analysis>","recommendations":["<specific action 1>","<specific action 2>","<specific action 3>"]}`;

  try {
    const response = await client.messages.create({
      model: config.ai.model,
      max_tokens: 1024,
      system: getComplianceSystemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return null;

    const parsed = parseJson<{ analysis: string; recommendations: string[] }>(block.text);
    if (!parsed) return null;

    return {
      analysis: parsed.analysis,
      riskScore,
      recommendations: parsed.recommendations,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    log.error('[ai] fullComplianceAnalysis failed', { error: String(err), company: company.number });
    return null;
  }
}

/**
 * Generate AI-written email subject and body for a compliance alert.
 * Returns null if AI is unavailable or the call fails.
 */
export async function generateEmailContent(
  input: GenerateEmailInput,
): Promise<AIEmailContent | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  const prompt = `Write a compliance alert email for a UK company director. Respond with JSON only.

Company: ${input.companyName}
Obligation: ${input.obligationType}
Due date: ${input.dueDate}
Days remaining: ${input.daysRemaining}
Urgency: ${input.urgency}

Respond with this JSON structure only, no other text:
{"subject":"<concise subject line>","body":"<email body in plain text, 3-4 short paragraphs>"}`;

  try {
    const response = await client.messages.create({
      model: config.ai.model,
      max_tokens: 512,
      system: getComplianceSystemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return null;

    return parseJson<AIEmailContent>(block.text);
  } catch (err) {
    log.error('[ai] generateEmailContent failed', { error: String(err), company: input.companyName });
    return null;
  }
}
