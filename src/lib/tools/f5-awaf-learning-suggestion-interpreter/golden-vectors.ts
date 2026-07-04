// ============================================================================
// src/lib/tools/f5-awaf-learning-suggestion-interpreter/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the AWAF learning-suggestion interpreter. Each pins a
// documented rule: loosening vs tightening by action; a violation-relaxing
// loosening judged by rating (1-2 FP fix, 3 investigate, 4-5 relaxing an
// attack); a plain legitimate add treated separately; the poisoning vector
// (Automatic + relaxing loosening + untrusted + climbing score); auto-enforce
// at 100% only in Automatic; and the discipline note on enforcement-relaxing
// loosenings. Checks assert on the derived result.
// ============================================================================

import { interpretSuggestion, DEFAULTS, ACTIONS, type SuggInput } from "./compute";

export const SET_ID = "f5-awaf-suggestion-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}
function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}
function inp(over: Partial<SuggInput>): SuggInput {
  return { ...DEFAULTS, ...over };
}

export const VECTORS: readonly Vector[] = [
  {
    id: "tightening-is-beneficial",
    description: "remove-wildcard and specify-attribute are tightening and beneficial",
    check: () => {
      const a = interpretSuggestion(inp({ action: "remove-wildcard", violationRating: null }));
      const b = interpretSuggestion(inp({ action: "specify-attribute", violationRating: null }));
      return (
        expect(a.direction === "tightening" && a.assessment === "beneficial-tightening", `remove-wildcard: dir=${a.direction} ass=${a.assessment}`) ??
        expect(b.direction === "tightening", `specify-attribute dir=${b.direction}`) ??
        expect(a.notes.some((n) => n.kind === "tightening-safe"), "missing tightening-safe note")
      );
    },
  },
  {
    id: "enforce-entity-check-fp",
    description: "enforce-entity is tightening but warns to check for false positives first",
    check: () => {
      const r = interpretSuggestion(inp({ action: "enforce-entity", violationRating: null }));
      return (
        expect(r.direction === "tightening", `dir=${r.direction}`) ??
        expect(r.notes.some((n) => n.kind === "enforce-check-fp"), "missing enforce-check-fp note")
      );
    },
  },
  {
    id: "add-entity-legitimate",
    description: "adding a valid entity is a loosening but treated as a legitimate add, not a relaxation",
    check: () => {
      const r = interpretSuggestion(inp({ action: "add-entity", violationRating: null }));
      return (
        expect(r.direction === "loosening", `dir=${r.direction}`) ??
        expect(r.assessment === "add-legitimate", `ass=${r.assessment}`) ??
        expect(!r.notes.some((n) => n.kind === "fp-discipline"), "add-entity should not carry the relax discipline")
      );
    },
  },
  {
    id: "relaxing-loosen-low-rating-fp",
    description: "disabling a signature for a rating-2 request is a false-positive fix",
    check: () => {
      const r = interpretSuggestion(inp({ action: "disable-signature", violationRating: 2, mode: "manual", sourceTrust: "trusted" }));
      return (
        expect(r.direction === "loosening", `dir=${r.direction}`) ??
        expect(r.assessment === "fp-fix", `ass=${r.assessment}`) ??
        expect(r.notes.some((n) => n.kind === "fp-discipline"), "missing discipline note")
      );
    },
  },
  {
    id: "relaxing-loosen-rating-3-investigate",
    description: "a rating-3 relaxing loosening should be investigated",
    check: () => {
      const r = interpretSuggestion(inp({ action: "disable-violation", violationRating: 3 }));
      return expect(r.assessment === "investigate", `ass=${r.assessment}`);
    },
  },
  {
    id: "relaxing-loosen-high-rating-attack",
    description: "a rating-5 relaxing loosening is relaxing an attack",
    check: () => {
      const r = interpretSuggestion(inp({ action: "add-meta-char", violationRating: 5 }));
      return expect(r.assessment === "likely-relaxing-attack", `ass=${r.assessment}`);
    },
  },
  {
    id: "poisoning-vector-flagged",
    description: "Automatic + relaxing loosening + untrusted + score >= 50 flags the poisoning vector",
    check: () => {
      const r = interpretSuggestion(inp({ action: "disable-signature", learningScore: 80, mode: "automatic", sourceTrust: "untrusted" }));
      return (
        expect(r.autoApplyRisk === true, "should flag autoApplyRisk") ??
        expect(r.notes.some((n) => n.kind === "poisoning-vector"), "missing poisoning-vector note") ??
        expect(r.willAutoEnforceAt100 === true, "should auto-enforce at 100 in automatic")
      );
    },
  },
  {
    id: "trusted-no-poisoning",
    description: "the same loosening from trusted traffic is not the poisoning vector",
    check: () => {
      const r = interpretSuggestion(inp({ action: "disable-signature", learningScore: 80, mode: "automatic", sourceTrust: "trusted" }));
      return expect(r.autoApplyRisk === false, "trusted should not be poisoning vector");
    },
  },
  {
    id: "manual-no-auto-enforce",
    description: "Manual learning never auto-enforces; a human must accept",
    check: () => {
      const r = interpretSuggestion(inp({ mode: "manual" }));
      return (
        expect(r.willAutoEnforceAt100 === false, "manual should not auto-enforce") ??
        expect(r.autoApplyRisk === false, "manual should not be poisoning vector") ??
        expect(r.notes.some((n) => n.kind === "manual-human"), "missing manual-human note")
      );
    },
  },
  {
    id: "score-near-accept-note",
    description: "a score at or above 75 surfaces the near-accept note",
    check: () => {
      const hi = interpretSuggestion(inp({ learningScore: 90 }));
      const lo = interpretSuggestion(inp({ learningScore: 40 }));
      return (
        expect(hi.notes.some((n) => n.kind === "score-near-accept"), "missing near-accept at 90") ??
        expect(!lo.notes.some((n) => n.kind === "score-near-accept"), "should not show near-accept at 40")
      );
    },
  },
  {
    id: "direction-covers-all-actions",
    description: "every action classifies as exactly one direction without throwing",
    check: () => {
      for (const a of ACTIONS) {
        const r = interpretSuggestion(inp({ action: a, violationRating: a === "add-entity" ? null : 2 }));
        if (r.direction !== "loosening" && r.direction !== "tightening") return `${a}: bad direction`;
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
