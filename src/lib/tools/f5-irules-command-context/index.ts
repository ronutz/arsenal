// ============================================================================
// src/lib/tools/f5-irules-command-context/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING iRULES COMMAND/CONTEXT EXPLAINER - {manifest, run,
// vectors}. Paste an iRule for per-block event identities (the Master List's
// own one-liners), command inventories with reference links, the documented
// priority evaluation order, and the fully sourced CMP audit. Per-command
// event-validity tables are deliberately linked, not reproduced.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, CTX_VECTORS } from "./golden-vectors";

export { run, EVENTS, PRIORITY_DEFAULT, parseWhenBlocksShared, stripCommentsShared } from "./compute";
export type { IRulesContextResult, EventInfo, WhenBlock, CommandUse, RawBlock, ToolRunResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, CTX_VECTORS, verifyVectors } from "./golden-vectors";
export type { CtxVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-irules-command-context",
  canonicalAliases: ["irules-command-context", "irules-cmp-audit", "irules-events"],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*when\\s+[A-Z][A-Z0-9_]+(\\s+priority\\s+\\d+)?\\s*\\{", priority: 8, example: "when HTTP_REQUEST { pool web }" },
    { kind: "regex", pattern: "\\b(HTTP_REQUEST|CLIENT_ACCEPTED|RULE_INIT|LB_SELECTED)\\b", priority: 6, example: "HTTP_REQUEST" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "irule-not-executed"],
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/bigip-cmp-clustered-multiprocessing"],
  relatedTools: ["f5-irules-vs-ltm-policy", "f5-irules-event-order"],
  sources: [
    { id: "irules-events-master", label: "F5 iRules API Reference: Master List of iRule Events (event identities, module grouping)", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/Events.html", access_date: "2026-07-03", scope: "the curated event table's names and one-line descriptions", status: "active" },
    { id: "irules-priority", label: "F5 iRules API Reference: priority (evaluation order: 0-1000, default 500, lower first, insertion order breaks ties, rule listing order across iRules on a virtual)", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/priority.html", access_date: "2026-07-03", scope: "the multi-block ordering analysis", status: "active" },
    { id: "irules-cmp-compat", label: "F5 iRules API Reference: CMP Compatibility (global-variable demotion and the v10 validator, static:: alternative, RULE_INIT per-TMM keys, per-TMM statistics profiles)", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/CMPCompatibility.html", access_date: "2026-07-03", scope: "every CMP finding this tool raises", status: "active" },
    { id: "irules-commands-master", label: "F5 iRules API Reference: Master List of iRule Commands (module naming and per-command page links)", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/Commands.html", access_date: "2026-07-03", scope: "the command-page URL pattern each inventory entry links", status: "active" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = CTX_VECTORS;
