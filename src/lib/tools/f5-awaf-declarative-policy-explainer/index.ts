// ============================================================================
// src/lib/tools/f5-awaf-declarative-policy-explainer/index.ts
// ----------------------------------------------------------------------------
// F5 ADVANCED WAF DECLARATIVE-POLICY EXPLAINER - a {manifest, run, vectors}
// triple. Paste a BIG-IP Advanced WAF (ASM) declarative security policy in JSON
// form (`{ "policy": { ... } }`) and get a section-by-section, plain-language
// reading of what it does, with security-state callouts that interpret the
// values (transparent = monitor-only, signature staging, XFF trust, Data Guard
// off, cookies missing Secure/HttpOnly) rather than echo them.
//
// Decode-only. The engine parses the JSON you paste and renders it. It never
// fetches anything, never validates against a live BIG-IP, and never evaluates
// the policy against traffic (zero egress, D-49). Grounded in F5's published,
// versioned declarative-policy schema (see `sources`).
// ============================================================================

import { parseAwafPolicy } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { parseAwafPolicy } from "./compute";
export type {
  Severity,
  SectionView,
  SecurityFlag,
  AwafPolicyParse,
  Group,
} from "./compute";
export { GROUPS } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the f5-awaf-declarative-policy-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "f5-awaf-declarative-policy-explainer",
  canonicalAliases: [
    "awaf-policy-explainer",
    "advanced-waf-policy",
    "asm-declarative-policy",
    "bigip-waf-policy",
    "declarative-waf-policy",
    "f5-waf-policy",
  ],
  inputDetectors: [
    // The template-name prefix is unique to AWAF declarative policies.
    { kind: "regex", pattern: "POLICY_TEMPLATE_[A-Z_]+", priority: 9, example: '{ "policy": { "template": { "name": "POLICY_TEMPLATE_RAPID_DEPLOYMENT" } } }' },
    // enforcementMode with its two enum values is highly specific.
    { kind: "regex", pattern: '"enforcementMode"\\s*:\\s*"(blocking|transparent)"', priority: 8, example: '{ "policy": { "enforcementMode": "blocking" } }' },
    // The distinctive hyphenated policy sections.
    { kind: "regex", pattern: '"(blocking-settings|signature-settings|policy-builder|server-technologies)"\\s*:', priority: 6, example: '{ "policy": { "signature-settings": { "signatureStaging": false } } }' },
    // The template object shape.
    { kind: "regex", pattern: '"template"\\s*:\\s*\\{\\s*"name"', priority: 5, example: '{ "policy": { "template": { "name": "..." } } }' },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // A WAF policy can carry internal hostnames, URLs, parameter and cookie names,
  // IPs, and file paths -> default to a shareable fragment, never the raw input.
  shareSafetyDefault: "fragment",

  // -- Teaching & provenance --
  learnLinks: [
    "learn/awaf-declarative-policy-structure",
    "learn/awaf-enforcement-mode-blocking-vs-transparent",
    "learn/awaf-signature-staging-and-enforcement-readiness",
    "learn/awaf-data-guard-response-masking",
  ],
  sources: [
    { id: "f5-awaf-index", label: "F5 BIG-IP WAF Declarative Policy - index (published versions v16.0, v16.1, v17.0, v17.1, v17.5)", url: "https://clouddocs.f5.com/products/waf-declarative-policy/" },
    { id: "f5-awaf-schema-v17_1", label: "F5 BIG-IP Declarative WAF v17.1 Schema (latest complete; v17.5 schema not yet published)", url: "https://clouddocs.f5.com/products/waf-declarative-policy/schema_v17_1.html" },
    { id: "f5-awaf-descriptions-v17_1", label: "F5 BIG-IP Declarative WAF v17.1 Schema Description", url: "https://clouddocs.f5.com/products/waf-declarative-policy/declarative_policy_v17_1.html" },
    { id: "f5-awaf-overview", label: "F5 Overview: WAF Policies (declarative format, templates, adjustments)", url: "https://clouddocs.f5.com/bigip-next/latest/waf_management/awaf_how_to_create_policy.html" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure, decode-only engine. */
export function run(input: string) {
  return parseAwafPolicy(input);
}

// Surface verifyVectors on the manifest namespace for the test harness.
export const __selftest = verifyVectors;
