/**
 * AI Client Service
 * Handles AI chat sessions with MCP tool integration
 */
import type { AIMessage, AISession, AIModel, MCPToolExecution } from '@/types/mcp';
import { generateId, sleep } from '@/lib/utils';
import { executeTool, MCP_TOOLS } from './mcpTools';

// ─── Available Models ──────────────────────────────────────────────────────────

export const AI_MODELS: AIModel[] = [
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    description: 'Most capable model. Best for complex analysis and reasoning.',
    contextWindow: 200000,
    supportsToolUse: true,
    isDefault: true,
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    description: 'Balanced performance and speed for everyday tasks.',
    contextWindow: 200000,
    supportsToolUse: true,
  },
  {
    id: 'claude-haiku-3-5',
    name: 'Claude Haiku 3.5',
    description: 'Fastest model, ideal for quick queries and simple tasks.',
    contextWindow: 200000,
    supportsToolUse: true,
  },
];

// ─── Mock AI Responses ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert AI assistant integrated into VaultLine Brand Suite — a professional platform for UK companies covering compliance (FineGuard), secure client intake (UltAi), and immutable audit logging (VaultLine).

You have access to powerful tools for:
- Querying Companies House data and checking compliance status
- Searching the legal and compliance knowledge base
- Analyzing documents for risk and entity extraction
- Classifying risk levels for clients and matters
- Creating intake matters, sending notifications, and writing audit events

Always be precise, professional, and cite specific tools you use. Format responses clearly with structure when appropriate.`;

interface MockResponseConfig {
  text: string;
  toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
}

function getMockResponse(userMessage: string, activatedTools: string[]): MockResponseConfig {
  const msg = userMessage.toLowerCase();

  if (msg.includes('company') || msg.includes('compliance') || msg.includes('filing')) {
    return {
      text: "I'll check the company's compliance status right away.",
      toolCalls: activatedTools.includes('check_compliance_status')
        ? [{ name: 'check_compliance_status', input: { company_number: '12345678' } }]
        : [],
    };
  }

  if (msg.includes('search') || msg.includes('knowledge') || msg.includes('article')) {
    return {
      text: "Let me search the knowledge base for relevant information.",
      toolCalls: activatedTools.includes('search_knowledge_base')
        ? [{ name: 'search_knowledge_base', input: { query: userMessage, top_k: 3 } }]
        : [],
    };
  }

  if (msg.includes('risk') || msg.includes('assess') || msg.includes('classify')) {
    return {
      text: "I'll run a comprehensive risk assessment.",
      toolCalls: activatedTools.includes('classify_risk')
        ? [{ name: 'classify_risk', input: { entity_name: 'Target Entity', entity_type: 'company' } }]
        : [],
    };
  }

  if (msg.includes('document') || msg.includes('analyse') || msg.includes('analyze') || msg.includes('contract')) {
    return {
      text: "I'll analyze that document for you.",
      toolCalls: activatedTools.includes('analyze_document')
        ? [{ name: 'analyze_document', input: { document_text: userMessage, summarize: true, identify_risks: true } }]
        : [],
    };
  }

  // Default responses
  const responses = [
    "I'm your VaultLine AI assistant. I can help you with:\n\n- **Compliance checking** — verify filing deadlines and penalties for any UK company\n- **Knowledge base search** — find relevant legal and compliance guidance\n- **Document analysis** — extract entities and risk clauses from contracts\n- **Risk classification** — assess client and matter risk levels\n- **Matter intake** — create and manage client intake records\n\nWhat would you like to do?",
    "I understand. Let me help you with that. Based on the VaultLine platform, I can access company data, compliance records, and your knowledge base to provide accurate guidance. Could you provide more specific details?",
    "That's a great question. Under UK corporate law, companies must file annual accounts within 9 months of their financial year end (for private companies) or 6 months (for public companies). Late filing attracts automatic penalties ranging from £150 to £1,500 depending on how late the accounts are filed.",
    "I've reviewed the available data. The risk assessment indicates medium exposure across regulatory dimensions. I'd recommend obtaining updated financial statements and reviewing any outstanding FCA correspondence before proceeding.",
  ];

  return {
    text: responses[Math.floor(Math.random() * responses.length)],
    toolCalls: [],
  };
}

// ─── AI Client ─────────────────────────────────────────────────────────────────

export class AIClient {
  private session: AISession;

  constructor(model = 'claude-opus-4-6', activatedTools: string[] = []) {
    this.session = {
      id: generateId('session'),
      title: 'New Conversation',
      model,
      systemPrompt: SYSTEM_PROMPT,
      messages: [],
      activatedTools,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalTokens: 0,
    };
  }

  getSession(): AISession {
    return { ...this.session };
  }

  setActivatedTools(tools: string[]) {
    this.session.activatedTools = tools;
  }

  async sendMessage(
    text: string,
    onToken?: (token: string) => void,
    onToolCall?: (execution: MCPToolExecution) => void
  ): Promise<AIMessage> {
    const userMsg: AIMessage = {
      id: generateId('msg'),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    this.session.messages.push(userMsg);

    // Simulate thinking
    await sleep(600 + Math.random() * 400);

    const { text: responseText, toolCalls } = getMockResponse(text, this.session.activatedTools);

    // Execute tool calls first
    const toolResults: MCPToolExecution[] = [];
    for (const tc of toolCalls ?? []) {
      const execution: MCPToolExecution = {
        id: generateId('exec'),
        toolName: tc.name,
        input: tc.input,
        startedAt: new Date().toISOString(),
        status: 'running',
      };
      onToolCall?.(execution);

      const result = await executeTool(tc.name, tc.input);
      toolResults.push(result);
      onToolCall?.(result);
    }

    // Stream the text response
    if (onToken) {
      const words = responseText.split(' ');
      for (const word of words) {
        onToken(word + ' ');
        await sleep(20 + Math.random() * 30);
      }
    }

    // Build final response with tool results appended
    let finalText = responseText;
    for (const result of toolResults) {
      finalText += `\n\n**Tool Result: \`${result.toolName}\`**\n\`\`\`json\n${JSON.stringify(result.output, null, 2)}\n\`\`\``;
    }

    const assistantMsg: AIMessage = {
      id: generateId('msg'),
      role: 'assistant',
      content: finalText,
      model: this.session.model,
      stopReason: 'end_turn',
      usage: {
        inputTokens: text.split(' ').length * 2,
        outputTokens: finalText.split(' ').length,
      },
      createdAt: new Date().toISOString(),
    };

    this.session.messages.push(assistantMsg);
    this.session.totalTokens += (assistantMsg.usage?.inputTokens ?? 0) + (assistantMsg.usage?.outputTokens ?? 0);
    this.session.updatedAt = new Date().toISOString();

    if (this.session.messages.length === 2) {
      this.session.title = text.slice(0, 50);
    }

    return assistantMsg;
  }

  clearHistory() {
    this.session.messages = [];
    this.session.totalTokens = 0;
  }
}

// Singleton instance
export const aiClient = new AIClient('claude-opus-4-6', MCP_TOOLS.map((t) => t.name));
