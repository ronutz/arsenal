// ============================================================================
// src/lib/tools/fortigate-ha-failover-simulator/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the FGCP election.
//
// The cases pin the BEHAVIOUR that surprises people, not the arithmetic:
// age beating priority by default, override reversing that, monitored
// interfaces outranking both, and the serial-number tie-break. The
// counterfactual is pinned too, because naming the setting that decides the
// outcome is the tool's main output.
// ============================================================================

import { run } from "./compute";

export const SET_ID = "fortigate-ha-failover-simulator/golden@1";

export interface HaVector {
  readonly name: string;
  readonly input: string;
  readonly primary: string | null;
  readonly decidedBy: string | null;
  /** Expected counterfactual primary, or null when toggling changes nothing. */
  readonly counterfactual?: string | null;
  readonly mustFind?: string;
}

/** The classic: the preferred unit rebooted, so it has low age. */
const REBOOTED = `override: disable
member: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0
member: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0`;

export const VECTORS: readonly HaVector[] = Object.freeze([
  {
    // THE case. Higher priority does NOT win, because age is compared first.
    name: "age beats priority when override is disabled",
    input: REBOOTED,
    primary: "FGT-B",
    decidedBy: "age",
    counterfactual: "FGT-A",
    mustFind: "compares age before priority",
  },
  {
    // Same cluster, override on: priority now outranks age.
    name: "override reverses it, priority beats age",
    input: REBOOTED.replace("override: disable", "override: enable"),
    primary: "FGT-A",
    decidedBy: "priority",
    counterfactual: "FGT-B",
    mustFind: "Override is ENABLED",
  },
  {
    // Monitored interfaces outrank everything, in either override mode.
    name: "a failed monitored interface loses regardless of age and priority",
    input: `override: disable
member: name=FGT-A, serial=FG100A, priority=200, age=9000, failed=1
member: name=FGT-B, serial=FG100B, priority=100, age=100, failed=0`,
    primary: "FGT-B",
    decidedBy: "failed",
    counterfactual: null,
    mustFind: "monitored interface health",
  },
  {
    // Everything ties, so the serial decides — and the tool says that is
    // arbitrary rather than presenting it as a design choice.
    name: "serial number breaks a complete tie",
    input: `override: disable
member: name=FGT-A, serial=FG100A, priority=128, age=500, failed=0
member: name=FGT-B, serial=FG100B, priority=128, age=500, failed=0`,
    primary: "FGT-B",
    decidedBy: "serial",
    counterfactual: null,
    mustFind: "serial number decided",
  },
  {
    // Three members, and the winner is unambiguous.
    name: "three members elect on age",
    input: `override: disable
member: name=A, serial=S1, priority=100, age=10, failed=0
member: name=B, serial=S2, priority=100, age=9000, failed=0
member: name=C, serial=S3, priority=100, age=500, failed=0`,
    primary: "B",
    decidedBy: "age",
  },
  {
    name: "empty input yields the reference card",
    input: "",
    primary: null,
    decidedBy: null,
  },
  {
    name: "unrecognised input warns rather than throwing",
    input: "this is not a cluster",
    primary: null,
    decidedBy: null,
  },
]);

export function verifyVectors(): { ok: true; count: number } {
  for (const v of VECTORS) {
    const { result } = run(v.input);
    const got = result.primary ? result.primary.name : null;
    if (got !== v.primary) {
      throw new Error(`[${SET_ID}] "${v.name}": expected primary ${String(v.primary)}, got ${String(got)}`);
    }
    if (v.decidedBy !== undefined && result.decidedBy !== v.decidedBy) {
      throw new Error(`[${SET_ID}] "${v.name}": expected decidedBy ${String(v.decidedBy)}, got ${String(result.decidedBy)}`);
    }
    if (v.counterfactual !== undefined) {
      const cf = result.counterfactual ? result.counterfactual.primary : null;
      if (cf !== v.counterfactual) {
        throw new Error(`[${SET_ID}] "${v.name}": expected counterfactual ${String(v.counterfactual)}, got ${String(cf)}`);
      }
    }
    if (v.mustFind) {
      const f = result.findings.join(" | ");
      if (!f.includes(v.mustFind)) {
        throw new Error(`[${SET_ID}] "${v.name}": findings missing "${v.mustFind}". Got: ${f}`);
      }
    }
  }
  return { ok: true, count: VECTORS.length };
}
