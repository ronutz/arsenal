// ============================================================================
// src/lib/tools/f5-awaf-signature-accuracy-risk/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the AWAF signature accuracy/risk interpreter. Each pins a
// documented rule: accuracy -> false-positive likelihood (low->high, medium->
// some, high->low); the accuracy x risk quadrant; blocking only when enforced;
// the system-relevance and high-accuracy-lever notes; and the discipline note
// on high-risk signatures. Checks assert on the derived result.
// ============================================================================

import { interpretSignature, DEFAULTS, LEVELS, type SigInput } from "./compute";

export const SET_ID = "f5-awaf-signature-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}
function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}
function inp(over: Partial<SigInput>): SigInput {
  return { ...DEFAULTS, ...over };
}

export const VECTORS: readonly Vector[] = [
  {
    id: "accuracy-low-high-fp",
    description: "low accuracy means a high false-positive likelihood",
    check: () => expect(interpretSignature(inp({ accuracy: "low" })).fpLikelihood === "high", "low accuracy should be high FP"),
  },
  {
    id: "accuracy-medium-some-fp",
    description: "medium accuracy means some false-positive likelihood",
    check: () => expect(interpretSignature(inp({ accuracy: "medium" })).fpLikelihood === "some", "medium accuracy should be some FP"),
  },
  {
    id: "accuracy-high-low-fp",
    description: "high accuracy means a low false-positive likelihood",
    check: () => expect(interpretSignature(inp({ accuracy: "high" })).fpLikelihood === "low", "high accuracy should be low FP"),
  },
  {
    id: "impact-equals-risk",
    description: "impact-if-real mirrors the risk level",
    check: () => {
      const a = interpretSignature(inp({ risk: "high" }));
      const b = interpretSignature(inp({ risk: "medium" }));
      return expect(a.impactIfReal === "high" && b.impactIfReal === "medium", "impact should equal risk");
    },
  },
  {
    id: "quadrant-fp-prone-low-stakes",
    description: "low accuracy + low risk is the prime relax candidate",
    check: () => expect(interpretSignature(inp({ accuracy: "low", risk: "low" })).quadrant === "fp-prone-low-stakes", "wrong quadrant"),
  },
  {
    id: "quadrant-fp-prone-dangerous",
    description: "low accuracy + high risk is FP-prone but dangerous",
    check: () => {
      const r = interpretSignature(inp({ accuracy: "low", risk: "high" }));
      return (
        expect(r.quadrant === "fp-prone-dangerous", `quadrant=${r.quadrant}`) ??
        expect(r.notes.some((n) => n.kind === "discipline-high-risk"), "missing discipline note")
      );
    },
  },
  {
    id: "quadrant-reliable-high-stakes",
    description: "high accuracy + high risk is reliable and high-stakes: do not relax",
    check: () => {
      const r = interpretSignature(inp({ accuracy: "high", risk: "high" }));
      return (
        expect(r.quadrant === "reliable-high-stakes", `quadrant=${r.quadrant}`) ??
        expect(!r.notes.some((n) => n.kind === "high-accuracy-lever"), "high-accuracy should not surface the FP lever")
      );
    },
  },
  {
    id: "quadrant-reliable-low-stakes",
    description: "high accuracy + low risk is reliable and low-stakes",
    check: () => expect(interpretSignature(inp({ accuracy: "high", risk: "low" })).quadrant === "reliable-low-stakes", "wrong quadrant"),
  },
  {
    id: "medium-risk-counts-as-stakes",
    description: "medium risk counts as stakes (dangerous quadrant with low accuracy)",
    check: () => expect(interpretSignature(inp({ accuracy: "low", risk: "medium" })).quadrant === "fp-prone-dangerous", "medium risk should be stakes"),
  },
  {
    id: "system-not-in-stack-noise",
    description: "a signature for a system not in your stack surfaces the noise note",
    check: () => expect(interpretSignature(inp({ systemRelevance: "not-in-stack" })).notes.some((n) => n.kind === "system-not-in-stack"), "missing not-in-stack note"),
  },
  {
    id: "staging-does-not-block",
    description: "a staged signature does not block",
    check: () => {
      const r = interpretSignature(inp({ enforcement: "staged" }));
      return (
        expect(r.blocksNow === false, "staged should not block") ??
        expect(r.notes.some((n) => n.kind === "staged-not-blocking"), "missing staged note")
      );
    },
  },
  {
    id: "enforced-blocks",
    description: "an enforced blocking signature blocks",
    check: () => expect(interpretSignature(inp({ enforcement: "enforced-blocking" })).blocksNow === true, "enforced should block"),
  },
  {
    id: "high-accuracy-lever-when-fp-prone",
    description: "the accuracy lever appears only for FP-prone signatures",
    check: () => {
      const lo = interpretSignature(inp({ accuracy: "low" }));
      const hi = interpretSignature(inp({ accuracy: "high" }));
      return (
        expect(lo.notes.some((n) => n.kind === "high-accuracy-lever"), "low accuracy should surface lever") ??
        expect(!hi.notes.some((n) => n.kind === "high-accuracy-lever"), "high accuracy should not")
      );
    },
  },
  {
    id: "scope-always",
    description: "the scope-it note is always present across all levels",
    check: () => {
      for (const a of LEVELS) for (const r of LEVELS) {
        const res = interpretSignature(inp({ accuracy: a, risk: r }));
        if (!res.notes.some((n) => n.kind === "scope-it")) return `${a}/${r}: missing scope-it`;
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
