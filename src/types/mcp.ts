/**
 * Model Context Protocol (MCP) Types
 * Defines the typed interface for AI tool use and MCP integrations
 */

/** MCP JSON schema property types */
export type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';

export interface JsonSchemaProperty {
  type: JsonSchemaType | JsonSchemaType[];
  description?: string;
  enum?: unknown[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

/** MCP tool input schema */
export interface MCPToolInputSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

/** MCP tool categories */
export type MCPToolCategory =
  | 'data_retrieval'
  | 'compliance'
  | 'document'
  | 'ai_analysis'
  | 'notifications'
  | 'search'
  | 'audit'
  | 'integration'
  | 'utility';

/** MCP tool definition */
export interface MCPTool {
  name: string;
  description: string;
  category: MCPToolCategory;
  icon: string;
  inputSchema: MCPToolInputSchema;
  /** Whether this tool needs live network access */
  requiresNetwork?: boolean;
  /** Whether this tool writes/mutates data */
  isMutating?: boolean;
  /** Typical execution time in ms */
  avgDurationMs?: number;
  /** Rate limit per minute */
  rateLimit?: number;
  examples?: Array<{
    description: string;
    input: Record<string, unknown>;
    output: unknown;
  }>;
}

/** MCP tool use request */
export interface MCPToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** MCP tool result block */
export interface MCPToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Array<{ type: 'text'; text: string }>;
  is_error?: boolean;
}

/** AI message content block */
export type ContentBlock =
  | { type: 'text'; text: string }
  | MCPToolUseBlock
  | MCPToolResultBlock;

/** AI conversation message */
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: ContentBlock[] | string;
  model?: string;
  stopReason?: 'end_turn' | 'tool_use' | 'max_tokens';
  usage?: { inputTokens: number; outputTokens: number };
  createdAt: string;
}

/** MCP tool execution result */
export interface MCPToolExecution {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: 'pending' | 'running' | 'success' | 'error';
}

/** AI session / conversation */
export interface AISession {
  id: string;
  title: string;
  model: string;
  systemPrompt?: string;
  messages: AIMessage[];
  activatedTools: string[];
  createdAt: string;
  updatedAt: string;
  totalTokens: number;
}

/** AI model options */
export interface AIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  supportsToolUse: boolean;
  isDefault?: boolean;
}
