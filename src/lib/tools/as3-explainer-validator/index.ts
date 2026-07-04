// ============================================================================
// src/lib/tools/as3-explainer-validator/index.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP AS3 (Application Services 3 Extension) DECLARATION EXPLAINER +
// STRUCTURAL VALIDATOR. A {manifest, run, vectors} triple. Paste the JSON you
// POST to /mgmt/shared/appsvcs/declare and it reads back whether it is a full
// AS3 request or an ADC-only declaration, the top-level options, and the
// Tenant -> Application -> resource tree with every class named and explained,
// while checking the structural rules F5 documents.
//
// Pure and deterministic (D-49): a model of the AS3 schema's structure, never a
// probe. It never contacts a BIG-IP and never fetches. It is a structure
// explainer and sanity checker, not a full JSON-Schema validator.
// ============================================================================

import { explainAs3 } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { explainAs3, KNOWN_CLASSES, TEMPLATE_SERVICE, TEMPLATES_NO_REQUIREMENT } from "./compute";
export type {
  As3Result, DocKind, RequestInfo, AdcInfo, TenantInfo, AppInfo, ObjectInfo, ObjectCategory, As3Stats, Finding,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the as3-explainer-validator tool. */
export const manifest = Object.freeze({
  toolFamily: "F5 automation (AS3 / DO)",
  toolSlug: "as3-explainer-validator",
  canonicalAliases: ["as3-explainer", "as3-declaration-explainer", "as3-validator", "appsvcs-declaration"],
  inputDetectors: [
    // The AS3 request wrapper is unambiguous.
    { kind: "regex", pattern: '"class"\\s*:\\s*"AS3"', priority: 9, example: '{ "class": "AS3", "action": "deploy", "declaration": { "class": "ADC", "schemaVersion": "3.0.0" } }' },
    // An ADC declaration is nearly as specific.
    { kind: "regex", pattern: '"class"\\s*:\\s*"ADC"', priority: 8, example: '{ "class": "ADC", "schemaVersion": "3.0.0", "MyTenant": { "class": "Tenant" } }' },
    // schemaVersion is a strong AS3/ADC signal.
    { kind: "regex", pattern: '"schemaVersion"\\s*:\\s*"3\\.', priority: 6, example: '{ "class": "ADC", "schemaVersion": "3.45.0" }' },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // A declaration can carry internal tenant/app names -> shareable fragment.
  shareSafetyDefault: "fragment",

  learnLinks: [
    "learn/as3-declaration-anatomy",
    "learn/awaf-declarative-policy-structure",
  ],
  sources: [
    { id: "as3-compose", label: "F5 BIG-IP AS3: Composing a Declaration (AS3 class, ADC class, Tenant, Application, template/service rule)", url: "https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/composing-a-declaration.html" },
    { id: "as3-purpose", label: "F5 BIG-IP AS3: Declaration Purpose and Function (tree model, reserved names, pointers, minimum declaration)", url: "https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/declaration-purpose-function.html" },
    { id: "as3-using", label: "F5 BIG-IP AS3: Using AS3 (POST/GET/DELETE/PATCH to /mgmt/shared/appsvcs/declare; CRUD actions)", url: "https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/using-as3.html" },
    { id: "as3-schema-ref", label: "F5 BIG-IP AS3: Schema Reference (the complete class and property catalog)", url: "https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/schema-reference.html" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure engine. */
export function run(input: string) {
  return explainAs3(input);
}

export const __selftest = verifyVectors;
