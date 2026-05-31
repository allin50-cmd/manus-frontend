import { z } from 'zod';

export function safeString(opts?: { min?: number; max?: number }) {
  return z
    .string()
    .refine((v) => !v.includes('\u0000'), 'String contains NULL byte')
    .refine(
      (v) => opts?.min === undefined || v.length >= opts.min,
      opts?.min ? `String must be at least ${opts.min} characters` : '',
    )
    .refine(
      (v) => opts?.max === undefined || v.length <= opts.max,
      opts?.max ? `String must be at most ${opts.max} characters` : '',
    );
}

const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
];
const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);

export function isSafeWebhookUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) return false;
  if (host === '::1' || host === '[::1]') return false;
  if (host.startsWith('[fe80:') || host.startsWith('[fc') || host.startsWith('[fd')) return false;
  if (PRIVATE_IPV4.some((re) => re.test(host))) return false;
  return true;
}

export const safeWebhookUrl = z
  .string()
  .url()
  .refine(isSafeWebhookUrl, {
    message: 'Webhook URL must be http(s) and not target private, loopback, or link-local addresses',
  });
