// ============================================================
// FineGuard — Auth Middleware
// ============================================================
//
// Shared authentication helper used by both the main server
// and the modular route files (e.g. alerts, compliance).
// ============================================================

import { Request } from 'express';
import { db } from '../db/index';
import { sessions, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthResult {
  userId: string;
  user?: {
    id: string;
    email: string;
    name: string;
    company: string | null;
    role: string;
  };
}

/**
 * Validate a Bearer token from the Authorization header.
 * Returns the authenticated user's ID and profile, or null if invalid.
 */
export async function authenticateRequest(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session || new Date(session.expiresAt) < new Date()) return null;

  // Optionally load user profile for alert routing
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      company: users.company,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return {
    userId: session.userId,
    user: user ?? undefined,
  };
}
