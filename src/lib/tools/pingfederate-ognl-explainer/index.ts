// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/pingfederate-ognl-explainer/index.ts
// ----------------------------------------------------------------------------
// PINGFEDERATE OGNL EXPRESSION EXPLAINER — a {manifest, run, vectors} triple.
//
// Reads an expression from an attribute mapping or an issuance criterion and
// explains it construct by construct, then raises the diagnostics that matter
// in production: attributes read without a null check, static Java calls,
// criteria that do not return a boolean, and expressions used where a plain
// mapping would do.
//
// EXPLAIN-ONLY (D-49, zero egress). It parses and describes. It never
// evaluates, because an expression explainer that evaluated expressions would
// be a code execution service - which is precisely the property that makes
// expression authoring a separate administrative role in the product itself.
// ============================================================================

import { explainExpression } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { explainExpression } from "./compute";
export type { ExpressionContext, Part, Diagnostic, ExplainResult } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the pingfederate-ognl-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Identity & tokens",
  toolSlug: "pingfederate-ognl-explainer",
  canonicalAliases: [
    "pingfederate-expression",
    "ping-ognl",
    "pf-attribute-mapping-expression",
    "issuance-criteria-expression",
  ],
  inputDetectors: [
    { kind: "regex", pattern: '#this\\.get\\(\\s*"', priority: 9, example: '#this.get("mail").toString().toLowerCase()' },
    { kind: "regex", pattern: "#attribute|#request\\.|#session\\.", priority: 6, example: '#this.get("uid") == null ? "" : #this.get("uid")' },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // Expressions name real attributes and sometimes real group names -> share a
  // fragment rather than the pasted configuration.
  shareSafetyDefault: "fragment",

  // -- Teaching & provenance --
  learnLinks: [
    "learn/pingfederate-admin-access-and-rbac",
    "learn/pingfederate-ognl-expressions",
    "glossary/ognl",
  ],
  sources: [
    { id: "ognl-language-guide", label: "Apache Commons OGNL language guide: expression syntax, projections and static method access", url: "https://commons.apache.org/proper/commons-ognl/language-guide.html" },
    { id: "ping-expressions", label: "Ping Identity PingFederate documentation: attribute mapping expressions and the Expression Administrator role", url: "https://docs.pingidentity.com/pingfederate/latest/administrators_reference_guide/pf_attribute_mapping_expressions.html" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure, explain-only engine. */
export function run(input: string, context: "attribute-mapping" | "issuance-criterion" = "attribute-mapping") {
  return explainExpression(input, context);
}

export const __selftest = verifyVectors;
