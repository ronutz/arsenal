// ============================================================================
// src/lib/tools/zscaler-firewall-rule-order-simulator/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING ZIA FIREWALL RULE-ORDER SIMULATOR - the {manifest,
// run, vectors} triple. Paste a rule list (a small teaching grammar over
// protocol, ports, source, destination) plus an optional flow, and watch
// the documented semantics execute: ascending order, first match stops,
// disabled rules keep their seat, the undeletable Default rule blocks what
// fell through - with a pairwise shadow analysis naming the rules that can
// never fire and which earlier rule eclipses them. Bounded, evaluates
// nothing, contacts nothing.
//
// Second native tool of the Zscaler program (PKG-ZSCALER v2, wave 1);
// paired article: learn/zia-cloud-firewall-rule-order.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, FW_VECTORS } from "./golden-vectors";

export { run, parseInput } from "./compute";
export type {
  RuleAction,
  FwRule,
  FwFlow,
  TraceRow,
  ShadowFinding,
  SimResult,
  ParsedInput,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, FW_VECTORS, verifyVectors } from "./golden-vectors";
export type { FwVector } from "./golden-vectors";

/** The D-49 declarative manifest for the zscaler-firewall-rule-order-simulator tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Zscaler Zero Trust Exchange",
  toolSlug: "zscaler-firewall-rule-order-simulator",
  canonicalAliases: [
    "zia-firewall-simulator",
    "firewall-rule-order",
    "first-match-simulator",
    "zscaler-rule-shadowing",
  ],
  inputDetectors: [
    {
      kind: "regex",
      // The tool's own rule grammar: "<order> | <name> | allow|block|block-icmp".
      pattern: "^\\s*\\d+\\s*\\|[^|]+\\|\\s*(allow|block|block-icmp)\\b",
      priority: 6,
      example: "10 | allow-web | allow | proto=tcp port=443",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["line-anchored-errors", "numeric-bounds"],
  shareSafetyDefault: "fragment", // rule names and addresses can identify infrastructure

  // -- Teaching & provenance --
  learnLinks: ["learn/zia-cloud-firewall-rule-order", "learn/zscaler-zero-trust-exchange-architecture"],
  sources: [
    {
      id: "zs-about-firewall-filtering",
      label: "Zscaler Help: About Firewall Filtering",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zia/about-firewall-filtering",
      access_date: "2026-07-21",
      scope: "ascending-order evaluation; the Default Firewall Filtering Rule blocking all traffic when the firewall is enabled (deny-by-default); the action verb set (allow, silent block, block informing the client); the criteria dimensions",
      status: "active",
    },
    {
      id: "zs-configuring-firewall-filtering",
      label: "Zscaler Help: Configuring the Firewall Filtering Policy",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zia/configuring-firewall-filtering-policy",
      access_date: "2026-07-21",
      scope: "Rule Order as the ascending evaluation position; unset criteria meaning Any and being ignored during evaluation; Admin Rank bounding assignable orders; the criteria field inventory (network services, source/destination addresses, device trust, time windows)",
      status: "active",
    },
    {
      id: "zs-editing-default-rule",
      label: "Zscaler Help: Editing the Default Firewall Filtering Rule",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zia/editing-default-firewall-filtering-rule",
      access_date: "2026-07-21",
      scope: "the default rule handling all traffic not matching a higher-order rule; always lowest precedence; undeletable; fixed criteria; action editable by super admins only",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = FW_VECTORS;
