// ============================================================================
// src/lib/tools/acme-dns01/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING ACME dns-01 MODULE — a {manifest, run, vectors} triple.
//
// run() is async (Web Crypto SHA-256) and takes an OBJECT (token + account key
// + optional domain), because the computation chains a token with the account
// key's thumbprint. It cannot be routed from a single pasted string, so its
// inputDetector is a low-priority heuristic carrying the schema's example.
//
// The account key uses only its PUBLIC required members (RFC 7638); private key
// material is never needed and never echoed, so dangerousInputHandling includes
// secret-redaction and shareSafetyDefault is "fragment" (keep any pasted input
// out of indexable permalinks). The dns-01 outputs are public by design (they
// are published in DNS), so this is not a secret-bearing tool the way HMAC is.
// ============================================================================

import { computeAcmeDns01, type AcmeDns01Input, type AcmeDns01Result } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  ACME_DNS01_GOLDEN_VECTORS,
  ACME_DNS01_REJECT_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  ACME_DNS01_GOLDEN_VECTORS,
  ACME_DNS01_REJECT_VECTORS,
} from "./golden-vectors";
export { jwkThumbprint } from "./compute";
export type { AcmeDns01Input, AcmeDns01Result } from "./compute";

/** The D-49 declarative manifest for the ACME dns-01 tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "PKI",
  toolSlug: "acme-dns01",
  canonicalAliases: [
    "acme",
    "dns-01",
    "acme-challenge",
    "acme-txt",
    "lets-encrypt-dns",
    "certbot-dns",
    "key-authorization",
  ],
  inputDetectors: [
    {
      // Needs a token AND an account key, so it cannot be routed from one pasted
      // string; a low-priority heuristic carries the example the schema requires.
      kind: "heuristic",
      priority: 1,
      example: "ACME dns-01 token + account key JWK",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["secret-redaction"], // only public JWK members used; key never echoed
  shareSafetyDefault: "fragment",

  // -- Teaching & provenance --
  learnLinks: ["learn/acme-protocol"],
  sources: [
    {
      id: "rfc8555",
      label: "RFC 8555 — Automatic Certificate Management Environment (ACME)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc8555",
      access_date: "2026-07-07",
      scope: "the ACME protocol; key authorization (§8.1) and dns-01 (§8.4)",
      status: "active",
    },
    {
      id: "rfc7638",
      label: "RFC 7638 — JSON Web Key (JWK) Thumbprint",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7638",
      access_date: "2026-07-07",
      scope: "the SHA-256 JWK thumbprint and its canonical member ordering",
      status: "active",
    },
    {
      id: "rfc4648",
      label: "RFC 4648 — The Base16, Base32, and Base64 Data Encodings",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4648",
      access_date: "2026-07-07",
      scope: "base64url (§5), the encoding used for the token, thumbprint, and TXT value",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run — the registry-facing entry point. ASYNC and object-input: computes the
 * key authorization and the dns-01 TXT value from the token and account key.
 */
export async function run(input: AcmeDns01Input): Promise<AcmeDns01Result> {
  return computeAcmeDns01(input);
}

export const goldenVectors = ACME_DNS01_GOLDEN_VECTORS;
export const rejectVectors = ACME_DNS01_REJECT_VECTORS;
