// ============================================================================
// src/lib/tools/panos-policy-evaluation-order/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING PAN-OS / PRISMA ACCESS POLICY EVALUATION MODULE.
//
// Paste a rule list that spans Panorama layers and local firewall rules, and it
// puts them in true evaluation order, traces a flow through them, and reports
// which rules are shadowed by rules above them.
//
// WHY IT EXISTS: Palo Alto's own security policy best-practices document says
// "Commit and Push doesn't provide shadowing information." The vendor names the
// gap; this fills it, before the commit rather than after the incident.
//
// AUTHORIZATION: this site claims NO Palo Alto Networks authorization or
// partnership. The tool reasons about publicly documented evaluation order from
// docs.paloaltonetworks.com. It is analysis of a published specification, not
// vendor material, and carries no vendor endorsement.
//
// Pure and offline: it reads the text you paste and contacts nothing. A policy
// rulebase names zones, subnets and users, which is exactly the kind of internal
// detail that should never leave the browser - hence shareSafetyDefault
// "fragment".
// ============================================================================

import {
  run,
  evaluate,
  parseRules,
  orderRules,
  PanosPolicyError,
  LAYER_ORDER,
  LAYER_LABEL,
} from "./compute";
import type {
  PolicyRule,
  RuleLayer,
  RuleAction,
  Traffic,
  PanosPolicyReport,
  PanosErrorCode,
  ShadowFinding,
  EvaluationStep,
} from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  PANOS_GOLDEN_VECTORS,
  PANOS_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Networking",
  toolSlug: "panos-policy-evaluation-order",
  canonicalAliases: [
    "pan-os-policy-order",
    "prisma-access-policy-order",
    "panorama-rule-order",
    "pre-rules-post-rules",
    "security-policy-shadowing",
  ],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*(shared-pre|dg-pre|local|dg-post|shared-post)\\s*\\|",
      priority: 9,
      example: "shared-pre | block-tor | deny | from=any to=any app=tor",
    },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-input"],
  shareSafetyDefault: "fragment",

  learnLinks: ["learn/sse-five-vendors-one-decision"],

  sources: [
    {
      id: "device-groups",
      label:
        "Palo Alto Networks, Device Groups: a firewall evaluates policy rules by layer and by type, top to bottom; local firewall rules display between the pre-rules and post-rules",
      url: "https://docs.paloaltonetworks.com/panorama/getting-started/panorama-overview/centrally-manage-firewall-configuration-and-updates-with-panorama/device-groups",
    },
    {
      id: "rulebase-best-practices",
      label:
        "Palo Alto Networks, Security Policy Rulebase Best Practices: first match wins and comparison stops; 'Commit and Push doesn't provide shadowing information'",
      url: "https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices/security-policy-best-practices/deploy-security-policy-best-practices/security-policy-rulebase-best-practices",
    },
    {
      id: "rule-best-practices",
      label:
        "Palo Alto Networks, Security Policy Rule Best Practices: shadowing defined; intrazone-default allows and interzone-default denies",
      url: "https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices/security-policy-best-practices/deploy-security-policy-best-practices/security-policy-rule-best-practices",
    },
    {
      id: "panorama-policies",
      label:
        "Palo Alto Networks, Defining Policies on Panorama: pre-rules are added to the top of the rule order and evaluated first; post-rules are evaluated last",
      url: "https://docs.paloaltonetworks.com/pan-os/11-1/pan-os-web-interface-help/panorama-web-interface/defining-policies-on-panorama",
    },
  ],
});

export {
  run,
  evaluate,
  parseRules,
  orderRules,
  PanosPolicyError,
  LAYER_ORDER,
  LAYER_LABEL,
  GOLDEN_VECTOR_SET_ID,
  PANOS_GOLDEN_VECTORS,
  PANOS_REJECT_VECTORS,
  verifyVectors,
};
export type {
  PolicyRule,
  RuleLayer,
  RuleAction,
  Traffic,
  PanosPolicyReport,
  PanosErrorCode,
  ShadowFinding,
  EvaluationStep,
};
