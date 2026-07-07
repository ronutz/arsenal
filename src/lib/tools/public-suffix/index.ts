// ============================================================================
// src/lib/tools/public-suffix/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING PUBLIC-SUFFIX MODULE — a {manifest, run, vectors} triple.
//
// run() is async (its signature matches the rest of the toolset) and takes an
// OBJECT { host }, because a hostname alone is enough but the wrapper keeps the
// door open for options later. The computation is pure local table lookup over
// the bundled Public Suffix List — no network, no secrets — so executionClass
// is "localOnly", dangerousInputHandling is empty, and shareSafetyDefault is
// "safe" (a hostname is not sensitive and the result is reproducible).
// ============================================================================

import { run as computePublicSuffix, type PublicSuffixResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  PUBLIC_SUFFIX_GOLDEN_VECTORS,
  PUBLIC_SUFFIX_REJECT_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  PUBLIC_SUFFIX_GOLDEN_VECTORS,
  PUBLIC_SUFFIX_REJECT_VECTORS,
} from "./golden-vectors";
export type { PublicSuffixResult } from "./compute";

/** The D-49 declarative manifest for the Public Suffix / registered-domain tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking",
  toolSlug: "public-suffix",
  canonicalAliases: [
    "etld",
    "etld-plus-one",
    "etld+1",
    "registered-domain",
    "registrable-domain",
    "public-suffix-list",
    "psl",
    "base-domain",
    "apex-domain",
  ],
  inputDetectors: [
    {
      // A dotted hostname that is not an IP address and carries no scheme/path.
      kind: "regex",
      priority: 2,
      pattern: "^(?!\\d{1,3}(?:\\.\\d{1,3}){3}$)(?!.*[\\s/:@])(?=.*\\.)[A-Za-z0-9*_.-]+$",
      example: "www.example.co.uk",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [], // hostnames are not secrets; nothing to redact
  shareSafetyDefault: "safe",

  // -- Teaching & provenance --
  learnLinks: ["learn/public-suffix", "learn/lets-encrypt"],
  sources: [
    {
      id: "psl",
      label: "Public Suffix List — publicsuffix.org",
      type: "reference",
      url: "https://publicsuffix.org/list/",
      access_date: "2026-07-07",
      scope: "the list itself and the matching algorithm (exception, wildcard, and longest-match rules)",
      status: "active",
    },
    {
      id: "le-ratelimits",
      label: "Let's Encrypt — Rate Limits",
      type: "reference",
      url: "https://letsencrypt.org/docs/rate-limits/",
      access_date: "2026-07-07",
      scope: "why the registered domain (eTLD+1) is the unit for certificate rate limits",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run — the registry-facing entry point. ASYNC and object-input: resolves the
 * public suffix (eTLD) and registered domain (eTLD+1) for a hostname.
 */
export async function run(input: { host: string }): Promise<PublicSuffixResult> {
  return computePublicSuffix(input);
}

export const goldenVectors = PUBLIC_SUFFIX_GOLDEN_VECTORS;
export const rejectVectors = PUBLIC_SUFFIX_REJECT_VECTORS;
