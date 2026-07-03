// ============================================================================
// src/lib/tools/f5-oneconnect-source-mask/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING OneConnect EXPLAINER - {manifest, run, vectors}.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, OC_VECTORS } from "./golden-vectors";

export { run } from "./compute";
export type { OneConnectResult, SettingCard, MaskSim, ReuseGroup, ToolRunResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, OC_VECTORS, verifyVectors } from "./golden-vectors";
export type { OcVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-oneconnect-source-mask",
  canonicalAliases: ["oneconnect-source-mask", "oneconnect-explainer", "oneconnect"],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*ltm\\s+profile\\s+one-connect\\b", priority: 8, example: "ltm profile one-connect my_oc { source-mask 255.255.255.0 }" },
    { kind: "regex", pattern: "\\bsource-mask\\b|\\bmax-reuse\\b|\\boneconnect\\b", priority: 6, example: "source-mask 0.0.0.0" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard"],
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/bigip-oneconnect-connection-reuse"],
  relatedTools: ["f5-lb-method-chooser", "f5-persistence-method-explainer"],
  sources: [
    { id: "tmsh-oneconnect", label: "F5 TMSH Reference v17: ltm profile one-connect (grammar, every default, the 0.0.0.0 and host-mask semantics, all three limit-type behaviors including strict's own not-recommended warning, share-pools)", type: "vendor-docs", url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_one-connect.html", access_date: "2026-07-03", scope: "the option table, defaults, and limit-type observations", status: "active" },
    { id: "k7208", label: "F5 K7208: Overview of the OneConnect profile (SNAT translation happens first; the source mask applies to the translated address)", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K7208", access_date: "2026-07-03", scope: "the SNAT-then-mask ordering observation", status: "active" },
    { id: "k5911", label: "F5 K5911 (states the same SNAT-before-mask ordering; the two articles corroborate each other)", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K5911", access_date: "2026-07-03", scope: "corroboration of the ordering", status: "active" },
    { id: "devcentral-maxsize", label: "F5 DevCentral: How OneConnect Profile's max-size works (the reuse pool divides per TMM; Current Idle counts every idle server-side connection, eligible or not)", type: "vendor-community", url: "https://community.f5.com/kb/technicalarticles/how-oneconnect-profiles-max-size-works/280848", access_date: "2026-07-03", scope: "the per-TMM and statistics-honesty observations", status: "active" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = OC_VECTORS;
