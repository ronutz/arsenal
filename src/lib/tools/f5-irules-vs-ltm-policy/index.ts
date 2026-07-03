// ============================================================================
// src/lib/tools/f5-irules-vs-ltm-policy/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING iRULES-vs-LTM-POLICY CLASSIFIER - {manifest, run,
// vectors}. Per when block: policy-expressible against the vendor's own
// example grammar, verify-on-version where the sources did not demonstrate
// a construct, or iRule-required with the blockers named.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, POL_VECTORS } from "./golden-vectors";

export { run } from "./compute";
export type { PolicyCompareResult, BlockVerdict, Verdict, ToolRunResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, POL_VECTORS, verifyVectors } from "./golden-vectors";
export type { PolVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-irules-vs-ltm-policy",
  canonicalAliases: ["irules-vs-ltm-policy", "ltm-policy-classifier", "policy-or-irule"],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*when\\s+HTTP_(REQUEST|RESPONSE)\\b", priority: 7, example: "when HTTP_REQUEST { pool web }" },
    { kind: "regex", pattern: "\\bltm policy\\b|first-match|best-match|all-match", priority: 6, example: "strategy first-match" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "irule-not-executed"],
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/bigip-cmp-clustered-multiprocessing"],
  relatedTools: ["f5-irules-command-context", "f5-tmsh-config-explainer"],
  sources: [
    { id: "tmsh-policy-strategy", label: "F5 TMSH Reference: ltm policy-strategy (first-match / all-match / best-match semantics verbatim; the built-in precedence table; user-defined strategies)", type: "vendor-docs", url: "https://clouddocs.f5.com/cli/tmsh-reference/v14/modules/ltm/ltm_policy-strategy.html", access_date: "2026-07-03", scope: "the strategies mode's semantics and precedence head", status: "active" },
    { id: "ltm-policies-examples", label: "BIG-IP Local Traffic Management: Getting Started with Policies 12.1 - the examples chapter (the policy grammar this tool's verified sets and sketches reproduce; the vendor's own iRule-equivalent examples; draft/publish/attach lifecycle)", type: "vendor-docs", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/local-traffic-policies-getting-started-12-1-0/2.html", access_date: "2026-07-03", scope: "the policy-expressible grammar sets, the tcl: substitution exception, the sketch shape", status: "active" },
    { id: "devcentral-ltm-policy-strategies", label: "F5 DevCentral: LTM Policy - Matching Strategies (policy anatomy: rules as condition/action if-thens; the no-programming, highly performant framing; best-match tie-breaking)", type: "vendor-community", url: "https://community.f5.com/t5/technical-articles/ltm-policy-matching-strategies/ta-p/276312", access_date: "2026-07-03", scope: "the summary's performance framing and tie-break narrative", status: "active" },
    { id: "irules-cmp-compat", label: "F5 iRules API Reference: CMP Compatibility (the demotion hazards a policy migration retires)", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/CMPCompatibility.html", access_date: "2026-07-03", scope: "the global-variable blocker's CMP note", status: "active" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = POL_VECTORS;
