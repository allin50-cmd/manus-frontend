/**
 * VaultLine Audit Engine
 *
 * Tamper-evident audit log using SHA-256 content hashing.
 * Every intake event is hashed at the point of creation.
 * The hash is stored alongside the payload — any modification
 * of either the payload OR the hash is detectable.
 */

import crypto from 'crypto';

export interface VaultEvent {
  intakeId: string;
  eventType: string;
  payload: unknown;
  hash: string;
  createdAt: string;
}

export function createVaultHash(payload: unknown): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
}

export function buildVaultEvent(
  intakeId: string,
  eventType: string,
  payload: unknown,
): VaultEvent {
  const createdAt = new Date().toISOString();
  // Hash includes all fields so any tampering is detectable
  const hash = createVaultHash({ intakeId, eventType, payload, createdAt });
  return { intakeId, eventType, payload, hash, createdAt };
}

export function verifyVaultEvent(event: VaultEvent): boolean {
  const { intakeId, eventType, payload, createdAt, hash } = event;
  const expected = createVaultHash({ intakeId, eventType, payload, createdAt });
  return expected === hash;
}
