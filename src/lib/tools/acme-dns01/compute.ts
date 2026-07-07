// ============================================================================
// src/lib/tools/acme-dns01/compute.ts
// ----------------------------------------------------------------------------
// ACME dns-01 TXT-record computer — the compute core.
//
// WHAT IT COMPUTES (grounded in RFC 8555 and RFC 7638):
//   To pass an ACME dns-01 challenge you publish a TXT record whose value the CA
//   can recompute from your account key. The chain is:
//     1. thumbprint = base64url( SHA-256( canonical JWK ) )        [RFC 7638]
//     2. keyAuthorization = token || '.' || thumbprint             [RFC 8555 §8.1]
//     3. dns-01 TXT value = base64url( SHA-256( keyAuthorization )) [RFC 8555 §8.4]
//   and the record is placed at  _acme-challenge.<domain>  as a TXT record.
//
// The RFC 7638 canonical JWK contains ONLY the key type's required members, in
// lexicographic order, serialized with no whitespace. Only PUBLIC members feed
// the thumbprint, so a private key is never needed (and its private fields are
// ignored if pasted). The algorithm here is verified against the RFC 7638 §3.1
// known-answer test (see golden-vectors.ts).
//
// ASYNC (Web Crypto SHA-256), deterministic, local-only: no clock, no network.
// ============================================================================

/** Inputs to one dns-01 computation. */
export interface AcmeDns01Input {
  /** The challenge "token" from the ACME authorization (a base64url string). */
  token: string;
  /**
   * Either the account key as a JWK JSON object (starting with "{"), OR a
   * precomputed base64url JWK thumbprint. When a JWK is given, only its public
   * required members are used (RFC 7638); private fields are ignored.
   */
  accountKey: string;
  /** Optional domain being validated; renders the full _acme-challenge name. */
  domain?: string;
}

/** The deterministic result. */
export interface AcmeDns01Result {
  ok: boolean;
  error?: string;
  /** kty of the JWK when the thumbprint was computed from one. */
  keyType?: string;
  /** base64url JWK thumbprint (computed from the JWK, or echoed if provided). */
  thumbprint?: string;
  thumbprintSource?: "computed" | "provided";
  /** token '.' thumbprint (RFC 8555 §8.1). */
  keyAuthorization?: string;
  /** base64url(SHA-256(keyAuthorization)) — the TXT record content (§8.4). */
  txtValue?: string;
  /** _acme-challenge.<domain> (wildcard label stripped), when a domain is given. */
  recordName?: string;
}

/** RFC 7638 §3.2: the required members per key type, already in lexicographic order. */
const REQUIRED_MEMBERS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  RSA: ["e", "kty", "n"],
  EC: ["crv", "kty", "x", "y"],
  OKP: ["crv", "kty", "x"], // RFC 8037 (Ed25519/Ed448, X25519/X448)
  oct: ["k", "kty"],
});

/** base64url (RFC 4648 §5) of a byte array, with padding stripped (JWS profile). */
function base64urlFromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256 of a string's UTF-8 bytes via Web Crypto (same primitive the
 *  hash/HMAC tools use). The encoder output is passed straight to digest:
 *  enc.encode() yields Uint8Array<ArrayBuffer>, which satisfies BufferSource
 *  without widening through a plain Uint8Array parameter (the subtlety that
 *  bit the hash tool). */
async function sha256Bytes(text: string): Promise<Uint8Array> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return new Uint8Array(buffer);
}

/** A base64url string uses only A-Z a-z 0-9 - _ and carries no padding. */
function isBase64Url(s: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(s);
}

/**
 * canonicalJwkJson — RFC 7638 canonical form: only the key type's required
 * members, in lexicographic order, serialized without whitespace. Throws with a
 * readable message when the JWK is missing a required member.
 */
function canonicalJwkJson(jwk: Record<string, unknown>): string {
  const kty = jwk.kty;
  if (typeof kty !== "string" || !(kty in REQUIRED_MEMBERS)) {
    throw new Error('JWK "kty" must be one of RSA, EC, OKP, or oct.');
  }
  const members = REQUIRED_MEMBERS[kty];
  const parts: string[] = [];
  for (const m of members) {
    const v = jwk[m];
    if (typeof v !== "string" || v === "") {
      throw new Error(`JWK is missing required member "${m}" for kty=${kty}.`);
    }
    // JSON.stringify escapes the member name and value exactly as RFC 7638 wants.
    parts.push(`${JSON.stringify(m)}:${JSON.stringify(v)}`);
  }
  return `{${parts.join(",")}}`;
}

/** Compute the RFC 7638 SHA-256 JWK thumbprint (base64url) of a public JWK. */
export async function jwkThumbprint(
  jwk: Record<string, unknown>,
): Promise<{ thumbprint: string; kty: string }> {
  const canonical = canonicalJwkJson(jwk);
  const digest = await sha256Bytes(canonical);
  return { thumbprint: base64urlFromBytes(digest), kty: String(jwk.kty) };
}

/**
 * computeAcmeDns01 — the deterministic (async) entry point. Builds the key
 * authorization and the dns-01 TXT value from a challenge token and the account
 * key (JWK or precomputed thumbprint). Never throws: input problems come back as
 * { ok:false, error }.
 */
export async function computeAcmeDns01(input: AcmeDns01Input): Promise<AcmeDns01Result> {
  const token = (input.token ?? "").trim();
  const rawKey = (input.accountKey ?? "").trim();

  if (token === "" || rawKey === "") {
    return {
      ok: false,
      error: "Provide both the challenge token and the account key (a JWK, or its thumbprint).",
    };
  }
  // ACME tokens are base64url with no padding (RFC 8555 §8.3).
  if (!isBase64Url(token)) {
    return {
      ok: false,
      error: "The token must be a base64url string (A-Z a-z 0-9 - _), with no padding.",
    };
  }

  let thumbprint: string;
  let thumbprintSource: "computed" | "provided";
  let keyType: string | undefined;

  if (rawKey.startsWith("{")) {
    let jwk: Record<string, unknown>;
    try {
      jwk = JSON.parse(rawKey) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "The account key looks like JSON but did not parse. Paste a valid JWK." };
    }
    try {
      const r = await jwkThumbprint(jwk);
      thumbprint = r.thumbprint;
      keyType = r.kty;
      thumbprintSource = "computed";
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Could not compute the JWK thumbprint." };
    }
  } else {
    // Treat a non-JWK string as a precomputed base64url thumbprint.
    if (!isBase64Url(rawKey)) {
      return {
        ok: false,
        error: "The account key must be a JWK (starting with '{') or a base64url thumbprint.",
      };
    }
    thumbprint = rawKey;
    thumbprintSource = "provided";
  }

  // RFC 8555 §8.1: keyAuthorization = token || '.' || base64url(Thumbprint).
  const keyAuthorization = `${token}.${thumbprint}`;
  // RFC 8555 §8.4: the dns-01 TXT value is the base64url SHA-256 of the key auth.
  const txtValue = base64urlFromBytes(await sha256Bytes(keyAuthorization));

  // Record name: _acme-challenge.<domain>. A wildcard validates under its base
  // domain, so "*.example.com" -> _acme-challenge.example.com.
  let recordName: string | undefined;
  const domain = (input.domain ?? "").trim().replace(/\.$/, "");
  if (domain) {
    recordName = `_acme-challenge.${domain.replace(/^\*\./, "")}`;
  }

  return { ok: true, keyType, thumbprint, thumbprintSource, keyAuthorization, txtValue, recordName };
}
