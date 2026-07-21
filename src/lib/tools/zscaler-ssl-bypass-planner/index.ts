// ============================================================================
// src/lib/tools/zscaler-ssl-bypass-planner/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING ZIA SSL BYPASS PLANNER - the {manifest, run, vectors}
// triple. Paste an asset list (name, pinning, governance category, path
// control) and receive a deterministic TLS inspection plan: which assets
// inspect, which are exempted by a policy Do Not Inspect rule, which get a
// Client Connector bypass - each verdict with sourced rationale, a priced
// blind-spot ledger, and the outside-backstop checklist whenever anything
// goes uninspected. Bounded, evaluates nothing, contacts nothing.
//
// Third native tool of the Zscaler program (PKG-ZSCALER v2, wave 2);
// paired article: learn/zia-ssl-inspection-policy-and-bypasses.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, SSL_PLAN_VECTORS } from "./golden-vectors";

export { run, parseAssets } from "./compute";
export type { SslAsset, PlanVerdict, PlanRow, PlanResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, SSL_PLAN_VECTORS, verifyVectors } from "./golden-vectors";
export type { SslPlanVector } from "./golden-vectors";

/** The D-49 declarative manifest for the zscaler-ssl-bypass-planner tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Zscaler Zero Trust Exchange",
  toolSlug: "zscaler-ssl-bypass-planner",
  canonicalAliases: [
    "ssl-bypass-planner",
    "do-not-inspect-planner",
    "tls-exemption-planner",
    "pinning-bypass-planner",
  ],
  inputDetectors: [
    {
      kind: "regex",
      // The tool's own asset grammar: "<name> | pinned|clean | regulated|general | agent|no-agent".
      pattern: "^[^|]+\\|\\s*(pinned|clean)\\s*\\|\\s*(regulated|general)\\s*\\|\\s*(agent|no-agent)\\s*$",
      priority: 6,
      example: "crm-desktop-app | pinned | general | agent",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["line-anchored-errors", "duplicate-detection"],
  shareSafetyDefault: "fragment", // asset names can identify internal applications

  // -- Teaching & provenance --
  learnLinks: [
    "learn/zia-ssl-inspection-policy-and-bypasses",
    "learn/zscaler-client-connector-profiles",
  ],
  sources: [
    {
      id: "zs-configuring-ssl-inspection",
      label: "Zscaler Help: Configuring the SSL/TLS Inspection Policy",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zia/configuring-ssltls-inspection-policy",
      access_date: "2026-07-21",
      scope: "Inspect / Do Not Inspect rules evaluating in ascending order, first match; destination and category scoping of exemptions; the criteria dimensions",
      status: "active",
    },
    {
      id: "zs-about-ssl-inspection",
      label: "Zscaler Help: About SSL Inspection",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zia/about-ssl-inspection",
      access_date: "2026-07-21",
      scope: "interception via certificates regenerated under the inspection CA; certificate-pinning applications failing under interception and requiring exemption; the outside backstops for uninspected flows (Untrusted Server Certificates action with TCP-reset block, OCSP via stapling, Minimum TLS Version, Block No-SNI)",
      status: "active",
    },
    {
      id: "zs-data-protection-ra",
      label: "Zscaler Reference Architecture: Data Protection with Secure Internet and SaaS Access (ZIA)",
      type: "vendor-docs",
      url: "https://help.zscaler.com/downloads/zia/reference-architecture/data-protection-secure-internet-and-saas-access/Data-Protection-with-Secure-Internet-and-SaaS-Access-ZIA-Reference-Architecture.pdf",
      access_date: "2026-07-21",
      scope: "the share of outbound traffic that is encrypted and the platform's full-TLS-inspection posture; the content engines (CASB, DLP) that only operate on inspected traffic - the price of every bypass",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = SSL_PLAN_VECTORS;
