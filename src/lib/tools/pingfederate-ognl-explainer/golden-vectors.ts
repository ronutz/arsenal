// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/pingfederate-ognl-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the PingFederate OGNL expression explainer.
//
// The expressions below are ordinary shapes from attribute mappings and
// issuance criteria - the kind an administrator writes on a Tuesday. Each
// vector asserts on the DERIVED READING: which diagnostics fired and what the
// context expects. Never on internal structure.
//
// The most valuable vectors here are the ones asserting a diagnostic FIRES,
// because a diagnostic that silently stops firing is worse than one that never
// existed: the tool goes on looking helpful while saying nothing.
// ============================================================================

import { explainExpression } from "./compute";

export const SET_ID = "pingfederate-ognl-explainer-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}

const has = (msgs: string[], needle: string) => msgs.some((m) => m.includes(needle));

export const VECTORS: readonly Vector[] = [
  {
    id: "empty",
    description: "empty input reports empty and still states what the context expects",
    check: () => {
      const r = explainExpression("", "attribute-mapping");
      if (!r.empty) return "expected empty";
      return r.expects.length > 0 ? null : "expects should be stated even when empty";
    },
  },
  {
    id: "context-mapping-expects-value",
    description: "a mapping expects a value",
    check: () => {
      const r = explainExpression('#this.get("mail")', "attribute-mapping");
      return r.expects.includes("value") ? null : "mapping should expect a value";
    },
  },
  {
    id: "context-criterion-expects-boolean",
    description: "a criterion expects a boolean",
    check: () => {
      const r = explainExpression('#this.get("x") != null', "issuance-criterion");
      return r.expects.toLowerCase().includes("boolean") ? null : "criterion should expect a boolean";
    },
  },
  {
    id: "attribute-read-recognised",
    description: "an attribute read is recognised and explained",
    check: () => {
      const r = explainExpression('#this.get("mail")', "attribute-mapping");
      return r.parts.length > 0 ? null : "expected at least one recognised part";
    },
  },
  {
    id: "null-check-missing-fires",
    description: "reading attributes with no null check raises a caution naming them",
    check: () => {
      const r = explainExpression('#this.get("mail").toString()', "attribute-mapping");
      const msgs = r.diagnostics.map((d) => d.message);
      if (!has(msgs, "null check")) return "expected the null-check caution";
      return has(msgs, "mail") ? null : "the caution should name the attribute";
    },
  },
  {
    id: "null-check-present-silences",
    description: "an expression that checks for null does not raise that caution",
    check: () => {
      const r = explainExpression(
        '#this.get("mail") == null ? "none" : #this.get("mail").toString()',
        "attribute-mapping",
      );
      return has(r.diagnostics.map((d) => d.message), "no null check")
        ? "the caution fired despite a null check being present"
        : null;
    },
  },
  {
    id: "static-call-flagged",
    description: "a static Java call is flagged with the reason it is privileged",
    check: () => {
      const r = explainExpression('@java.lang.String@format("%s", #this.get("uid"))', "attribute-mapping");
      return has(r.diagnostics.map((d) => d.message), "static Java method")
        ? null
        : "expected the static-call caution";
    },
  },
  {
    id: "criterion-without-comparison",
    description: "a criterion with no comparison is called out as not returning a boolean",
    check: () => {
      const r = explainExpression('#this.get("department")', "issuance-criterion");
      return has(r.diagnostics.map((d) => d.message), "true or false")
        ? null
        : "expected the boolean caution for a criterion";
    },
  },
  {
    id: "criterion-with-comparison-silent",
    description: "a criterion that does compare is not flagged",
    check: () => {
      const r = explainExpression('#this.get("department").toString().contains("eng")', "issuance-criterion");
      return has(r.diagnostics.map((d) => d.message), "true or false")
        ? "the boolean caution fired on a criterion that does compare"
        : null;
    },
  },
  {
    id: "passthrough-noted",
    description: "a pass-through mapping is noted as achievable without an expression",
    check: () => {
      const r = explainExpression('#this.get("mail")', "attribute-mapping");
      return has(r.diagnostics.map((d) => d.message), "without an expression")
        ? null
        : "expected the pass-through note";
    },
  },
  {
    id: "conditional-recognised",
    description: "a conditional is recognised and explained as supplying a default",
    check: () => {
      const r = explainExpression('#this.get("x") == null ? "d" : #this.get("x")', "attribute-mapping");
      return r.parts.some((p) => p.meaning.includes("conditional") || p.meaning.includes("default"))
        ? null
        : "expected the conditional to be explained";
    },
  },
  {
    id: "never-evaluates",
    description: "the explainer describes arithmetic rather than computing it",
    check: () => {
      const r = explainExpression("7 * 6", "attribute-mapping");
      return JSON.stringify(r).includes("42") ? "the explainer appears to have evaluated" : null;
    },
  },
  {
    id: "deterministic",
    description: "the same expression always produces the same explanation",
    check: () => {
      const e = '#this.get("mail").toString().toLowerCase()';
      return JSON.stringify(explainExpression(e, "attribute-mapping")) ===
        JSON.stringify(explainExpression(e, "attribute-mapping"))
        ? null
        : "output is not deterministic";
    },
  },
];

export function verifyVectors(): { setId: string; passed: number; failed: string[] } {
  const failed: string[] = [];
  for (const v of VECTORS) {
    const err = v.check();
    if (err) failed.push(`${v.id}: ${err}`);
  }
  return { setId: SET_ID, passed: VECTORS.length - failed.length, failed };
}
