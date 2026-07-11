// ============================================================================
// src/lib/tools/ja3-tls-fingerprint/index.ts
// ----------------------------------------------------------------------------
// THE JA3 / JA3N PASSIVE TLS FINGERPRINT - a {manifest, run, vectors} triple.
// Paste a JA3 string; get the JA3 MD5, the permutation-stable JA3N, a field
// decode, and GREASE flags. Pinned to Salesforce's own published vectors.
// The passive-fingerprint entry point toward the SSE/identity hubs; pairs with
// the JA4 fingerprint decoder (the modern successor). Pure and offline.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { computeJa3, run, GREASE_VALUES } from "./compute";
export type { Ja3Result } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "Fingerprinting",
  toolSlug: "ja3-tls-fingerprint",
  canonicalAliases: ["ja3", "ja3n", "ja3-fingerprint", "tls-client-fingerprint", "passive-tls-fingerprint", "ja3-hash-calculator"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "manual",

  learnLinks: ["learn/passive-tls-fingerprinting-ja3"],
  sources: [
    {
      id: "salesforce-ja3",
      label: "Salesforce Engineering: Open Sourcing JA3 (field order, delimiters, empty fields, MD5; published string->hash examples)",
      type: "article",
      url: "https://engineering.salesforce.com/tls-fingerprinting-with-ja3-and-ja3s-247362855967/",
      access_date: "2026-07-11",
      scope: "the authoritative JA3 construction: SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats, commas between fields and dashes within, empty fields left empty, MD5 to 32 hex; the two example hashes pinned as golden vectors",
      status: "active",
    },
    {
      id: "rfc-8701-grease",
      label: "RFC 8701: Applying GREASE to TLS Extensibility (the reserved 0x?a?a values excluded from JA3)",
      type: "reference",
      url: "https://www.rfc-editor.org/rfc/rfc8701",
      access_date: "2026-07-11",
      scope: "the GREASE values (0x0a0a ... 0xfafa) that modern browsers insert and that JA3 strips before hashing for stability",
      status: "active",
    },
    {
      id: "ja3-churn-ja3n",
      label: "TLS extension permutation and JA3N (Chrome/Firefox randomize extension order; JA3N sorts extensions for a stable hash; JA4 is the successor)",
      type: "reference",
      url: "https://www.systemshardening.com/articles/network/tls-fingerprinting-ja3-ja4/",
      access_date: "2026-07-11",
      scope: "why JA3 churns (extension-order randomization) and how JA3N (sorted extensions) restores stability; context for preferring JA4",
      status: "active",
    },
  ],
  credits: [
    { handle: "salesforce", display_name: "Salesforce Engineering (JA3 authors)", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
