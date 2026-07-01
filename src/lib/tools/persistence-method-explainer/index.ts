// ============================================================================
// src/lib/tools/persistence-method-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING PERSISTENCE-METHOD EXPLAINER - a self-contained {manifest, run,
// vectors} triple. Paste BIG-IP persistence profiles and/or virtual servers and
// get, per profile, the method and what it keys on, how it behaves, and the
// failure modes that bite in practice; and per virtual, the resolved primary
// and fallback persistence chain.
//
// It reuses the tmsh parser and complements the BIG-IP persistence cookie
// decoder: that tool decodes the bytes in a cookie value, this one explains the
// method choice around it. Bounded in depth, evaluates nothing, contacts
// nothing.
// ============================================================================

import { parseTmsh } from "../tmsh-config-explainer/compute";
import { extractPersistence, type PersistResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, P_VECTORS } from "./golden-vectors";

export { extractPersistence, run } from "./compute";
export type { PersistResult, MethodExplain, PersistChain, ChainStep, FieldNote } from "./compute";
export { GOLDEN_VECTOR_SET_ID, P_VECTORS, verifyVectors } from "./golden-vectors";
export type { PVector } from "./golden-vectors";

/** The D-49 declarative manifest for the persistence-method-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "persistence-method-explainer",
  canonicalAliases: ["f5-persistence-explainer", "ltm-persistence-explainer", "bigip-persistence-method", "persistence-explainer"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*ltm persistence (cookie|source-addr|dest-addr|ssl|universal|hash|msrdp|sip)\\b",
      priority: 8,
      example: "ltm persistence cookie my_cookie { method insert }",
    },
    {
      kind: "regex",
      pattern: "\\bfallback-persistence\\b",
      priority: 5,
      example: "fallback-persistence source_addr",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "irule-not-executed"], // reuses the tmsh parser; rule references are names, never executed
  shareSafetyDefault: "fragment", // persistence config carries pool, virtual, and cookie names

  // -- Teaching & provenance --
  learnLinks: ["learn/ltm-persistence-methods", "learn/choosing-a-persistence-method", "learn/fallback-persistence-and-match-across", "learn/source-address-persistence-and-mega-proxy", "learn/persistence-mirroring-and-ha"],
  sources: [
    {
      id: "k26898044",
      label: "F5 K26898044: Persistence methods available in BIG-IP",
      type: "vendor-kb",
      url: "https://my.f5.com/manage/s/article/K26898044",
      access_date: "2026-06-29",
      scope: "the supported persistence methods and what each keys on",
      status: "active",
    },
    {
      id: "ltm-persistence-profiles",
      label: "F5 LTM Profiles Reference: Session Persistence Profiles",
      type: "vendor-docs",
      url: "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/ltm-profiles-reference-13-0-0/4.html",
      access_date: "2026-06-29",
      scope: "match-across settings, cookie modes, and universal persistence",
      status: "active",
    },
    {
      id: "ssl-persistence",
      label: "F5 SSL Administration: SSL Persistence",
      type: "vendor-docs",
      url: "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/bigip-ssl-administration-11-5-0/5.html",
      access_date: "2026-06-29",
      scope: "SSL session-ID persistence and pairing it with source-address fallback",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = P_VECTORS;

// Re-export the parser entry so callers can compose without reaching across tools.
export { parseTmsh };

export type ToolRunResult = PersistResult;
