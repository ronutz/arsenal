// ============================================================================
// src/lib/tools/pkce/compute.ts
// ----------------------------------------------------------------------------
// OAUTH 2.0 PKCE (RFC 7636) - the compute core for the PKCE tool.
//
// PKCE protects the OAuth authorization-code flow for public clients. The
// client picks a random `code_verifier`, derives a `code_challenge`, and sends
// the challenge up front; at the token step it sends the verifier and the
// server re-derives and compares.
//
//   S256 (recommended):  code_challenge = BASE64URL( SHA256( ASCII(verifier) ) )
//   plain (discouraged): code_challenge = verifier
//
// computeChallenge() is the deterministic (async, SHA-256) entry point and is
// golden-vector-tested against RFC 7636 Appendix B. generateVerifier() is the
// NON-deterministic helper (crypto.getRandomValues) the UI uses for the
// "Generate" button; it is deliberately not part of run/vectors.
// ============================================================================

/** RFC 7636 bounds for a code_verifier: 43-128 unreserved characters. */
export const PKCE_MIN_LENGTH = 43;
export const PKCE_MAX_LENGTH = 128;

/** The unreserved character set (RFC 3986 2.3) a verifier may use. */
const UNRESERVED_RE = /^[A-Za-z0-9._~-]*$/;

/** The deterministic result for one code_verifier. */
export interface PkceResult {
  codeVerifier: string;
  /** Character length of the verifier. */
  length: number;
  /** length is within [43, 128]. */
  lengthValid: boolean;
  /** verifier uses only the unreserved set. */
  charsetValid: boolean;
  /** lengthValid AND charsetValid. */
  valid: boolean;
  /** code_challenge for method "S256" (the recommended method). */
  s256Challenge: string;
  /** code_challenge for method "plain" (equal to the verifier; discouraged). */
  plainChallenge: string;
}

/** base64url (RFC 4648 5): standard base64, +/ -> -_, padding stripped. */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * computeChallenge - the deterministic (async) entry point. Validates the
 * verifier against RFC 7636 and derives both the S256 and plain challenges.
 * Never throws: a non-compliant verifier is reported via the validity flags,
 * and the S256 challenge is still computed (SHA-256 accepts any input).
 * @param codeVerifier the PKCE code_verifier
 */
export async function computeChallenge(codeVerifier: string): Promise<PkceResult> {
  const verifier = codeVerifier ?? "";
  const length = verifier.length;
  const lengthValid = length >= PKCE_MIN_LENGTH && length <= PKCE_MAX_LENGTH;
  const charsetValid = UNRESERVED_RE.test(verifier);

  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const s256Challenge = base64UrlEncode(new Uint8Array(digest));

  return {
    codeVerifier: verifier,
    length,
    lengthValid,
    charsetValid,
    valid: lengthValid && charsetValid,
    s256Challenge,
    plainChallenge: verifier,
  };
}

/**
 * generateVerifier - a cryptographically random, RFC-compliant code_verifier.
 * NON-DETERMINISTIC (crypto.getRandomValues), so it is intentionally excluded
 * from run/golden-vectors. Follows RFC 7636 4.1: 32 random octets, base64url
 * encoded, yielding a 43-character verifier with ~256 bits of entropy.
 */
export function generateVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}
