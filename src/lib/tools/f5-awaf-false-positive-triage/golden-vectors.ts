// ============================================================================
// src/lib/tools/f5-awaf-false-positive-triage/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for AWAF false-positive triage. Each pins a documented rule:
// the rating-based verdict (4-5 blocks and should be cleared, not relaxed; 3
// investigate; 1-2 accept if a confirmed false positive), the "blocks even
// with Block off" behaviour for 4-5, staging/transparent not blocking, and the
// category -> scoped remediation mapping. Checks assert on the derived result.
// ============================================================================

import { triageFalsePositive, DEFAULTS, CATEGORIES, type FpInput } from "./compute";

export const SET_ID = "f5-awaf-fp-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}
function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}
function inp(over: Partial<FpInput>): FpInput {
  return { ...DEFAULTS, ...over };
}

export const VECTORS: readonly Vector[] = [
  {
    id: "rating-1-2-likely-fp",
    description: "ratings 1 and 2 are likely false positives: accept if confirmed",
    check: () => {
      const a = triageFalsePositive(inp({ violationRating: 1 }));
      const b = triageFalsePositive(inp({ violationRating: 2 }));
      return (
        expect(a.triage === "likely-fp" && a.action === "accept-if-confirmed", `r1 triage=${a.triage} action=${a.action}`) ??
        expect(b.triage === "likely-fp", `r2 triage=${b.triage}`)
      );
    },
  },
  {
    id: "rating-3-investigate",
    description: "rating 3 must be investigated before any change",
    check: () => {
      const r = triageFalsePositive(inp({ violationRating: 3 }));
      return expect(r.triage === "investigate" && r.action === "investigate-first", `triage=${r.triage} action=${r.action}`);
    },
  },
  {
    id: "rating-4-5-clear-not-relax",
    description: "ratings 4 and 5 are likely attacks: clear the suggestion, do not relax",
    check: () => {
      const a = triageFalsePositive(inp({ violationRating: 4 }));
      const b = triageFalsePositive(inp({ violationRating: 5 }));
      return (
        expect(a.triage === "likely-attack" && a.action === "clear-do-not-relax", `r4 triage=${a.triage} action=${a.action}`) ??
        expect(b.action === "clear-do-not-relax", `r5 action=${b.action}`) ??
        expect(a.notes.some((n) => n.kind === "rating-blocks"), "missing rating-blocks note")
      );
    },
  },
  {
    id: "rating-5-blocks-when-enforced",
    description: "rating 5 blocks when enforced+blocking (even with Block flags off)",
    check: () => {
      const r = triageFalsePositive(inp({ violationRating: 5, enforcementState: "enforced-blocking" }));
      return expect(r.blocksNow === true, "rating-5 enforced should block");
    },
  },
  {
    id: "staged-does-not-block",
    description: "a staged signature does not block, even at rating 5",
    check: () => {
      const r = triageFalsePositive(inp({ violationRating: 5, enforcementState: "staged" }));
      return (
        expect(r.blocksNow === false, "staged should not block") ??
        expect(r.notes.some((n) => n.kind === "staged-not-blocking"), "missing staged note")
      );
    },
  },
  {
    id: "transparent-does-not-block",
    description: "Transparent mode blocks nothing, even at rating 5",
    check: () => {
      const r = triageFalsePositive(inp({ violationRating: 5, enforcementState: "transparent" }));
      return (
        expect(r.blocksNow === false, "transparent should not block") ??
        expect(r.notes.some((n) => n.kind === "transparent-not-blocking"), "missing transparent note")
      );
    },
  },
  {
    id: "signature-remediation-scoped",
    description: "an attack-signature FP offers a scoped disable and Potential FP Detection",
    check: () => {
      const r = triageFalsePositive(inp({ category: "attack-signature", violationRating: 2 }));
      return (
        expect(r.remediations.includes("disableSignatureScoped"), "missing scoped disable") ??
        expect(r.remediations.includes("potentialFpDetection"), "missing potential-fp-detection remediation") ??
        expect(r.notes.some((n) => n.kind === "potential-fp-detection"), "missing potential-fp note")
      );
    },
  },
  {
    id: "meta-char-remediation",
    description: "an illegal-meta-char FP maps to allowing the character on that entity",
    check: () => {
      const r = triageFalsePositive(inp({ category: "meta-char", violationRating: 1 }));
      return expect(r.remediations.includes("allowMetaChar"), `remediations=${r.remediations.join(",")}`);
    },
  },
  {
    id: "file-upload-remediation",
    description: "a file-upload signature FP maps to marking the file-upload parameter",
    check: () => {
      const r = triageFalsePositive(inp({ category: "file-upload-signature", violationRating: 2 }));
      return expect(r.remediations[0] === "markFileUploadParam", `first remediation=${r.remediations[0]}`);
    },
  },
  {
    id: "discipline-and-scope-always",
    description: "the discipline and scope-it notes are always present",
    check: () => {
      for (const c of CATEGORIES) {
        const r = triageFalsePositive(inp({ category: c, violationRating: 2 }));
        if (!r.notes.some((n) => n.kind === "discipline")) return `${c}: missing discipline`;
        if (!r.notes.some((n) => n.kind === "scope-it")) return `${c}: missing scope-it`;
        if (r.remediations.length === 0) return `${c}: no remediation`;
      }
      return null;
    },
  },
];

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check();
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.id}: ${msg}`);
  }
  return { ok: failures.length === 0, failures };
}
