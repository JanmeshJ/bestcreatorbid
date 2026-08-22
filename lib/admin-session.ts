import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Shared-password admin auth: no accounts, no email, no per-admin identity.
// Whoever holds ADMIN_PASSWORD can moderate the board. This is deliberately
// simpler than a user system because bidders never authenticate at all —
// the only thing behind a login is the /admin moderation panel.

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("Missing ADMIN_SESSION_SECRET");
  return value;
}

function hmac(input: string) {
  return createHmac("sha256", secret()).update(input).digest();
}

/** Builds `expiry.signature`. The signature covers the expiry so the cookie can't be re-dated. */
export function createAdminSessionToken() {
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${hmac(expiresAt).toString("hex")}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expiresAt, signatureHex] = token.split(".");
  if (!expiresAt || !signatureHex) return false;

  let signature: Buffer;
  try {
    signature = Buffer.from(signatureHex, "hex");
  } catch {
    return false;
  }
  const expected = hmac(expiresAt);
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    return false;
  }

  const expiresAtMs = Number(expiresAt);
  return Number.isFinite(expiresAtMs) && Date.now() < expiresAtMs;
}

/**
 * Constant-time password check. Both sides are HMAC'd first (rather than
 * compared raw) so the buffers are always equal length — timingSafeEqual
 * throws on a length mismatch, and comparing raw lengths first would leak
 * the password's length through timing.
 */
export function checkAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(hmac(candidate), hmac(expected));
}
