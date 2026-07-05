// ============================================================================
// src/lib/tools/do-explainer-validator/index.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP DO (Declarative Onboarding) DECLARATION EXPLAINER + STRUCTURAL
// VALIDATOR. A {manifest, run, vectors} triple. Paste the JSON you POST to
// /mgmt/shared/declarative-onboarding and it reads back whether it is a DO
// request wrapper or a bare Device declaration, the top-level options, and the
// Common tenant's class-objects walked in the order DO onboards them, while
// checking the structural rules and documented gotchas F5 publishes.
//
// Pure and deterministic (D-49): a model of the DO schema's structure, never a
// probe. It never contacts a BIG-IP or BIG-IQ and never fetches. It is a
// structure explainer and sanity checker, not a full JSON-Schema validator.
//
// DO is the sibling of AS3 (as3-explainer-validator): AS3 configures L4-L7
// application services; DO does the L1-L3 onboarding (license, provision,
// VLANs, self IPs, routes, users, DNS/NTP, clustering) that gets the box onto
// the network and ready for AS3. Same Automation Toolchain declarative model.
// ============================================================================

import { explainDo } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { explainDo, KNOWN_CLASSES, PHASE_ORDER, PHASE_LABEL } from "./compute";
export type {
  DoResult, DocKind, RequestInfo, DeviceInfo, PhaseGroup, ObjectInfo, Finding, DoStats, Phase,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the do-explainer-validator tool. */
export const manifest = Object.freeze({
  // D-73: toolFamily MUST equal the catalogue family for this slug.
  toolFamily: "F5 automation (AS3 / DO)",
  toolSlug: "do-explainer-validator",
  canonicalAliases: ["do-explainer", "declarative-onboarding-explainer", "do-validator", "onboarding-declaration"],
  inputDetectors: [
    // A DO request wrapper (class DO, as POSTed to a BIG-IQ) is unambiguous.
    { kind: "regex", pattern: '"class"\\s*:\\s*"DO"', priority: 9, example: '{ "class": "DO", "declaration": { "class": "Device", "schemaVersion": "1.0.0" } }' },
    // A Device declaration is the bare form POSTed straight to a BIG-IP.
    { kind: "regex", pattern: '"class"\\s*:\\s*"Device"', priority: 8, example: '{ "class": "Device", "schemaVersion": "1.0.0", "Common": { "class": "Tenant" } }' },
    // A 1.x schemaVersion alongside a Common tenant is a strong DO signal.
    { kind: "regex", pattern: '"schemaVersion"\\s*:\\s*"1\\.', priority: 5, example: '{ "class": "Device", "schemaVersion": "1.36.0" }' },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // A declaration can carry hostnames, IPs, and regKeys -> shareable fragment.
  shareSafetyDefault: "fragment",

  learnLinks: [
    "learn/bigip-declarative-onboarding-do",
    "learn/as3-declaration-anatomy",
  ],
  relatedTools: ["as3-explainer-validator", "json-yaml-convert"],
  // Live-fetched 2026-07-05 from clouddocs (DO 1.47.0, doc updated 2026-01-02).
  sources: [
    { id: "do-compose", label: "F5 BIG-IP DO: Composing a Declaration for a Standalone BIG-IP (the Device/Tenant/Common model, the class list, the standalone example, the hostname mutual-exclusion, the endpoint)", url: "https://clouddocs.f5.com/products/extensions/f5-declarative-onboarding/latest/composing-a-declaration.html" },
    { id: "do-schema-ref", label: "F5 BIG-IP DO: Appendix A Schema Reference (the complete class and property catalog, defaults, and per-property version notices including the DO 1.36 allowService change)", url: "https://clouddocs.f5.com/products/extensions/f5-declarative-onboarding/latest/schema-reference.html" },
    { id: "do-cluster", label: "F5 BIG-IP DO: Composing a Declaration for a Cluster of BIG-IPs (ConfigSync, DeviceGroup, DeviceTrust, FailoverUnicast, and the owner-vs-member semantics)", url: "https://clouddocs.f5.com/products/extensions/f5-declarative-onboarding/latest/clustering.html" },
    { id: "do-network-objects", label: "F5 BIG-IP DO: Network Objects (VLAN, SelfIp with allowService port-lockdown, Route, RouteDomain, and the data-plane classes)", url: "https://clouddocs.f5.com/products/extensions/f5-declarative-onboarding/latest/declarations/network-objects.html" },
    { id: "do-bigiq", label: "F5 BIG-IQ: Declarative Onboarding API reference (the class DO request wrapper and targetHost for remote onboarding)", url: "https://clouddocs.f5.com/products/big-iq/mgmt-api/v0.0/ApiReferences/bigiq_public_api_ref/r_do_onboarding.html" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** Tool entry point. Deterministic; delegates to the pure engine. */
export function run(input: string) {
  return explainDo(input);
}

export const __selftest = verifyVectors;
