import type { NextRequest } from 'next/server';

export interface SessionPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  plan: string;
  exp: number;
}

const COOKIE_NAME = 'uios_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = 4 - (s.length % 4 || 4);
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + (pad < 4 ? '='.repeat(pad) : ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET || process.env.WEBHOOK_SIGNING_SECRET;
  if (!s || s === 'placeholder') throw new Error('SESSION_SECRET not configured');
  return s;
}

async function hmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  const enc = new TextEncoder();
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const body: SessionPayload = { ...payload, exp };
  const header = b64urlEncode(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const data = b64urlEncode(enc.encode(JSON.stringify(body)));
  const key = await hmacKey();
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${data}`)));
  return `${header}.${data}.${b64urlEncode(sig)}`;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, data, sig] = parts;
  try {
    const enc = new TextEncoder();
    const key = await hmacKey();
    const expected = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${data}`)),
    );
    const provided = b64urlDecode(sig);
    if (!timingSafeEqual(expected, provided)) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(data))) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
