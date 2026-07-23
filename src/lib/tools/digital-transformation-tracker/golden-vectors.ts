// ============================================================================
// src/lib/tools/digital-transformation-tracker/golden-vectors.ts
// ----------------------------------------------------------------------------
// 14 golden vectors. Several pin the DATASET's honesty rather than the filter
// logic: every non-shipped row attributed, every contested row explained. Those
// are the vectors that matter most, because they are what stops a forecast from
// quietly becoming a fact. (D-19.)
// ============================================================================

import { track, findUnattributed, findContestedWithoutNote } from "./compute";
import type { TrackerResult } from "./compute";
import { MILESTONES } from "./milestones";

export const GOLDEN_VECTOR_SET_ID = "digital-transformation-tracker-golden-v1";

export interface TrackerVector {
  id: string;
  describe: string;
  check: () => boolean;
}

const ok = (r: ReturnType<typeof track>): r is TrackerResult => r.ok;

export const TRACKER_VECTORS: TrackerVector[] = [
  {
    id: "V01-integrity-attribution",
    describe: "every non-shipped milestone carries a source",
    check: () => findUnattributed().length === 0,
  },
  {
    id: "V02-integrity-contested-note",
    describe: "every contested milestone explains what is changing",
    check: () => findContestedWithoutNote().length === 0,
  },
  {
    id: "V03-unfiltered-returns-all",
    describe: "no filters returns the whole dataset",
    check: () => {
      const r = track();
      return ok(r) && r.milestones.length === MILESTONES.length;
    },
  },
  {
    id: "V04-chronological",
    describe: "results are ordered oldest first",
    check: () => {
      const r = track();
      if (!ok(r)) return false;
      return r.milestones.every((m, i, a) => i === 0 || a[i - 1].year <= m.year);
    },
  },
  {
    id: "V05-domain-filter",
    describe: "domain filter returns only that domain",
    check: () => {
      const r = track({ domains: ["money"] });
      return ok(r) && r.milestones.length > 0 && r.milestones.every((m) => m.domain === "money");
    },
  },
  {
    id: "V06-certainty-filter",
    describe: "certainty filter returns only that tier",
    check: () => {
      const r = track({ certainties: ["forecast"] });
      return ok(r) && r.milestones.length > 0 && r.milestones.every((m) => m.certainty === "forecast");
    },
  },
  {
    id: "V07-year-window",
    describe: "year bounds are inclusive",
    check: () => {
      const r = track({ fromYear: 2020, toYear: 2020 });
      return ok(r) && r.milestones.length > 0 && r.milestones.every((m) => m.year === 2020);
    },
  },
  {
    id: "V08-combined-filters",
    describe: "domain and certainty combine as AND",
    check: () => {
      const r = track({ domains: ["state"], certainties: ["inForce"] });
      return (
        ok(r) &&
        r.milestones.length > 0 &&
        r.milestones.every((m) => m.domain === "state" && m.certainty === "inForce")
      );
    },
  },
  {
    id: "V09-counts-sum",
    describe: "certainty counts sum to the matched total",
    check: () => {
      const r = track();
      if (!ok(r)) return false;
      const sum = Object.values(r.countsByCertainty).reduce((a, b) => a + b, 0);
      return sum === r.milestones.length;
    },
  },
  {
    id: "V10-settled-plus-forward",
    describe: "settled and forward counts partition the matched set",
    check: () => {
      const r = track();
      return ok(r) && r.settledCount + r.forwardCount === r.milestones.length;
    },
  },
  {
    id: "V11-contested-present",
    describe: "the AI Act high-risk row is contested and names both dates",
    check: () => {
      const r = track({ certainties: ["contested"] });
      if (!ok(r) || r.milestones.length === 0) return false;
      const m = r.milestones.find((x) => x.id === "ai-act-high-risk");
      return (
        !!m &&
        !!m.contestedNote &&
        m.contestedNote.includes("2 August 2026") &&
        m.contestedNote.includes("2 December 2027") &&
        m.contestedNote.includes("NOT yet law")
      );
    },
  },
  {
    id: "V12-forecast-counterweight",
    describe: "the agents-in-apps forecast also carries the abandonment counter-signal",
    check: () => {
      const m = MILESTONES.find((x) => x.id === "agents-in-apps");
      return !!m && !!m.source && m.source.includes("abandoned");
    },
  },
  {
    id: "V13-empty-result",
    describe: "an impossible window returns an empty, well-formed result",
    check: () => {
      const r = track({ fromYear: 1900, toYear: 1901 });
      return ok(r) && r.milestones.length === 0 && r.firstYear === null && r.lastYear === null;
    },
  },
  {
    id: "V14-bad-input",
    describe: "unknown domain is rejected, and an inverted window is rejected",
    check: () => {
      const a = track({ domains: ["nope" as never] });
      const b = track({ fromYear: 2030, toYear: 2000 });
      return !a.ok && !b.ok;
    },
  },
];

/** Verify every vector; returns the ids that FAILED (empty = all green). */
export function verifyVectors(): string[] {
  const bad: string[] = [];
  for (const v of TRACKER_VECTORS) {
    let pass = false;
    try {
      pass = v.check();
    } catch {
      pass = false;
    }
    if (!pass) bad.push(v.id);
  }
  return bad;
}
