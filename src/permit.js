import { hash } from "./canonical.js";
import { normalizeIntent } from "./intent.js";

export function createPermit({ intent, decisionId, policyHash, evaluatedAt, ttlSeconds }) {
  const issuedAtMs = Date.parse(evaluatedAt);
  const ttl = Number(ttlSeconds);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(ttl) || ttl <= 0) {
    throw new TypeError("A valid evaluation time and positive permit TTL are required");
  }

  const body = {
    schemaVersion: "mandate.permit.v1",
    decisionId,
    policyHash,
    intentHash: hash(normalizeIntent(intent)),
    accountId: intent.accountId,
    venue: intent.venue,
    issuedAt: new Date(issuedAtMs).toISOString(),
    expiresAt: new Date(issuedAtMs + ttl * 1000).toISOString(),
  };

  return { ...body, permitId: hash(body) };
}

export function verifyPermit(permit, intent, at = new Date().toISOString()) {
  if (!permit || permit.schemaVersion !== "mandate.permit.v1") {
    return { valid: false, reason: "invalid_permit" };
  }

  let intentHash;
  try {
    intentHash = hash(normalizeIntent(intent));
  } catch {
    return { valid: false, reason: "invalid_intent" };
  }

  if (intentHash !== permit.intentHash) {
    return { valid: false, reason: "intent_mismatch" };
  }

  const atMs = Date.parse(at);
  const expiryMs = Date.parse(permit.expiresAt);
  if (!Number.isFinite(atMs) || !Number.isFinite(expiryMs) || atMs > expiryMs) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, reason: "valid" };
}

export class PermitLedger {
  #consumed = new Map();

  consume(permit, intent, at = new Date().toISOString()) {
    const verification = verifyPermit(permit, intent, at);
    if (!verification.valid) return verification;
    if (this.#consumed.has(permit.permitId)) {
      return { valid: false, reason: "already_consumed" };
    }
    this.#consumed.set(permit.permitId, at);
    return { valid: true, reason: "consumed", consumedAt: at };
  }

  consumedAt(permitId) {
    return this.#consumed.get(permitId) || null;
  }
}
