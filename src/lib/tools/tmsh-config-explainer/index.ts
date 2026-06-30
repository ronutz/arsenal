// ============================================================================
// src/lib/tools/tmsh-config-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING tmsh CONFIG EXPLAINER - a self-contained {manifest, run, vectors}
// triple. Paste a bigip.conf snippet and get a structure tree plus a
// plain-English breakdown of each object: what a virtual server, pool, monitor,
// profile, persistence record, SNAT, self IP, VLAN, or route is, what its key
// fields mean, and a few operational observations worth noticing.
//
// iRule bodies are Tcl, not tmsh; they are captured verbatim and never
// evaluated. The parser is bounded in depth and contacts nothing.
// ============================================================================

import { parseTmsh } from "./compute";
import { explainConfig, type ExplainResult } from "./explain";
import { GOLDEN_VECTOR_SET_ID, TMSH_VECTORS } from "./golden-vectors";

export { parseTmsh, asTopLevel, asKeyValue } from "./compute";
export type { ConfigNode, ParseResult, TopLevelObject } from "./compute";
export { explainConfig, explainObject } from "./explain";
export type { ObjectExplain, FieldExplain, ExplainResult } from "./explain";
export { GOLDEN_VECTOR_SET_ID, TMSH_VECTORS, verifyVectors } from "./golden-vectors";
export type { TmshVector } from "./golden-vectors";

/** The D-49 declarative manifest for the tmsh-config-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "tmsh-config-explainer",
  canonicalAliases: ["bigip-conf-explainer", "tmsh-explainer", "bigip-config-explainer", "f5-config-explainer", "tmsh-decoder"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*(ltm|net|sys|auth|security|gtm|pem|apm|asm|cm)\\s+[\\w-]+",
      priority: 6,
      example: "ltm virtual vip { destination 10.0.0.1:80 pool web_pool }",
    },
    {
      kind: "regex",
      pattern: "^#TMSH-VERSION:",
      priority: 7,
      example: "#TMSH-VERSION: 16.1.0",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "irule-not-executed"], // Tcl iRule bodies are captured verbatim, never run
  shareSafetyDefault: "fragment", // configs carry internal IPs, hostnames, and key paths

  // -- Teaching & provenance --
  learnLinks: ["learn/anatomy-of-bigip-conf", "learn/how-a-virtual-server-works", "learn/ltm-health-monitors"],
  sources: [
    {
      id: "tmsh-reference",
      label: "F5 BIG-IP tmsh Reference Guide",
      type: "vendor-docs",
      url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/",
      access_date: "2026-06-29",
      scope: "the tmsh object model, module/component hierarchy, and per-object fields",
      status: "active",
    },
    {
      id: "tmsh-ltm-virtual",
      label: "F5 tmsh Reference: ltm virtual",
      type: "vendor-docs",
      url: "https://clouddocs.f5.com/cli/tmsh-reference/v16/modules/ltm/ltm_virtual.html",
      access_date: "2026-06-29",
      scope: "virtual server fields (destination, pool, profiles, source-address-translation, and more)",
      status: "active",
    },
    {
      id: "tmsh-ltm-pool",
      label: "F5 tmsh Reference: ltm pool",
      type: "vendor-docs",
      url: "https://clouddocs.f5.com/cli/tmsh-reference/v14/modules/ltm/ltm_pool.html",
      access_date: "2026-06-29",
      scope: "pool fields (members, monitor, load-balancing-mode, and more)",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/**
 * run - the registry-facing entry point. Parses a bigip.conf snippet and
 * returns the explained object tree. Never throws; structural errors are
 * carried in the result.
 */
export function run(input: string): ExplainResult {
  return explainConfig(parseTmsh(input));
}

export const goldenVectors = TMSH_VECTORS;
