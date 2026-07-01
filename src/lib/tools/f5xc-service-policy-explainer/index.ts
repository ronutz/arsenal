// ============================================================================
// src/lib/tools/f5xc-service-policy-explainer/index.ts
// ----------------------------------------------------------------------------
// F5 XC SERVICE POLICY EXPLAINER - a {manifest, run, vectors} triple. Paste an
// F5 Distributed Cloud service_policy spec (ves.io.schema.service_policy) and
// get its match logic spelled out: server scope, rule disposition, and for a
// rule_list every rule's action plus its AND-combined predicates, each matcher
// rendered with its exact/regex/prefix criteria, and/or logic, inversion, and
// case-sensitivity. "iRules for XC," decoded.
//
// Decode-only: the engine parses the JSON you paste and renders it. It never
// fetches anything and never evaluates the policy against live traffic (zero
// egress, D-49). Grounded in the official OpenAPI schema.
// ============================================================================

import { parseServicePolicy } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { parseServicePolicy } from "./compute";
export type {
  RuleAction,
  MatchLine,
  PredicateView,
  RuleView,
  SourceListView,
  ServerScope,
  Disposition,
  ServicePolicyParse,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the f5xc-service-policy-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-service-policy-explainer",
  canonicalAliases: [
    "xc-service-policy",
    "f5xc-service-policy",
    "service-policy-explainer",
    "ves-service-policy",
    "distributed-cloud-service-policy",
  ],
  inputDetectors: [
    { kind: "regex", pattern: '"rule_list"\\s*:', priority: 8, example: '{ "spec": { "rule_list": { "rules": [ ... ] } } }' },
    { kind: "regex", pattern: '"(allow_all_requests|deny_all_requests|allow_list|deny_list|legacy_rule_list)"\\s*:', priority: 7, example: '{ "spec": { "allow_all_requests": {} } }' },
    { kind: "regex", pattern: "ves\\.io\\.schema\\.service_policy", priority: 6, example: '"x-ves-proto-message": "ves.io.schema.service_policy..."' },
    { kind: "regex", pattern: '"(server_name|any_server|server_selector)"\\s*:', priority: 4, example: '{ "spec": { "any_server": {} } }' },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  shareSafetyDefault: "fragment", // a policy can carry internal hostnames, IP prefixes, ASNs, header/cookie names

  // -- Teaching & provenance --
  learnLinks: [
    "learn/how-xc-service-policies-match",
    "learn/xc-rule-combining-algorithms",
    "learn/xc-service-policy-predicates-and-logic",
    "learn/xc-matcher-case-sensitivity-and-transformers",
    "learn/xc-service-policy-vs-irules",
    "learn/xc-service-policy-actions-and-default-deny",
  ],
  sources: [
    { id: "xc-service-policy", label: "F5 Distributed Cloud - API for ves.io.schema.service_policy", url: "https://docs.cloud.f5.com/docs-v2/api/service-policy" },
    { id: "xc-service-policy-rule", label: "F5 Distributed Cloud - API for ves.io.schema.service_policy_rule", url: "https://docs.cloud.f5.com/docs-v2/api/service-policy-rule" },
    { id: "xc-create-service-policy", label: "F5 Distributed Cloud - Create Service Policy", url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/app-security/service-policy" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure, decode-only engine. */
export function run(input: string) {
  return parseServicePolicy(input);
}

// Surface verifyVectors on the manifest namespace for the test harness.
export const __selftest = verifyVectors;
