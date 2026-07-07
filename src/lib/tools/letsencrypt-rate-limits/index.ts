// ============================================================================
// src/lib/tools/letsencrypt-rate-limits/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING LE RATE-LIMIT PLANNER — a {manifest, run, vectors} triple.
//
// run() is async and object-input { names }, because it resolves each name's
// registered domain via the Public Suffix List engine before grouping. It is
// pure local computation over a bundled list plus a dated, sourced snapshot of
// Let's Encrypt's published limits — no network, no secrets — so executionClass
// is "localOnly", dangerousInputHandling is empty, and shareSafetyDefault is
// "safe" (a list of intended hostnames is not sensitive).
// ============================================================================

import { run as computePlan, type LeRateLimitResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  LETSENCRYPT_RATE_LIMITS_GOLDEN_VECTORS,
} from "./golden-vectors";

export { GOLDEN_VECTOR_SET_ID, LETSENCRYPT_RATE_LIMITS_GOLDEN_VECTORS } from "./golden-vectors";
export { LE_LIMITS } from "./compute";
export type { LeRateLimitResult, LeDomainGroup } from "./compute";

/** The D-49 declarative manifest for the Let's Encrypt rate-limit planner. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "PKI",
  toolSlug: "letsencrypt-rate-limits",
  canonicalAliases: [
    "lets-encrypt-rate-limits",
    "le-rate-limits",
    "acme-rate-limits",
    "certificates-per-domain",
    "duplicate-certificate-limit",
    "san-limit",
    "cert-planner",
  ],
  inputDetectors: [
    {
      // A list of hostnames cannot be reliably told apart from other pasted
      // text, so this is a low-priority heuristic carrying the schema example.
      kind: "heuristic",
      priority: 1,
      example: "A list of hostnames you want on Let's Encrypt certificates",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [], // hostnames are not secrets
  shareSafetyDefault: "safe",

  // -- Teaching & provenance --
  learnLinks: ["learn/lets-encrypt", "learn/public-suffix"],
  sources: [
    {
      id: "le-ratelimits",
      label: "Let's Encrypt — Rate Limits",
      type: "reference",
      url: "https://letsencrypt.org/docs/rate-limits/",
      access_date: "2026-07-07",
      scope: "the concrete production limits: 50 certs/registered-domain/7d, 300 orders/account/3h, 5/exact-set/7d, and the registered-domain = eTLD+1 (PSL) definition",
      status: "active",
    },
    {
      id: "le-integration",
      label: "Let's Encrypt — Integration Guide",
      type: "reference",
      url: "https://letsencrypt.org/docs/integration-guide/",
      access_date: "2026-07-07",
      scope: "the up-to-100-names-per-certificate issuance policy",
      status: "active",
    },
    {
      id: "psl",
      label: "Public Suffix List — publicsuffix.org",
      type: "reference",
      url: "https://publicsuffix.org/list/",
      access_date: "2026-07-07",
      scope: "the registered-domain grouping (eTLD+1) that the per-domain limit counts against",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run — the registry-facing entry point. ASYNC and object-input: groups the
 * intended certificate names by registered domain and maps them onto the limits.
 */
export async function run(input: { names: string }): Promise<LeRateLimitResult> {
  return computePlan(input);
}

export const goldenVectors = LETSENCRYPT_RATE_LIMITS_GOLDEN_VECTORS;
export const rejectVectors = [];
