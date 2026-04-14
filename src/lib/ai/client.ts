import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/config';

let _client: Anthropic | null = null;

/**
 * Returns the shared Anthropic client, or null if ANTHROPIC_API_KEY is not set.
 * Lazy: created on first call so build phase works without a key present.
 */
export function getAnthropicClient(): Anthropic | null {
  const apiKey = config.ai.apiKey;
  if (!apiKey) return null;
  if (!_client) _client = new Anthropic({ apiKey });
  return _client;
}
