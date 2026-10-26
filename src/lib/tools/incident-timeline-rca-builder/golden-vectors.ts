// ============================================================================
// src/lib/tools/incident-timeline-rca-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// RULE-FIRING SNAPSHOT VECTORS - the advisory-verification ruling (D-86 §3.1),
// as set by the FHB pilot and reused across the fieldcraft cluster.
//
// For each structured input, assert: the exact fired rule ids (registry
// order), the exact ordered timeline event ids, the exact milestone bands
// (id + events spanned), the exact candidate list (id + user-confirmed flag),
// the exact structural-risk ids, and the exact warning ids. Any drift breaks
// the build. The D-49 manifest carries `verificationModel:
// "rule-firing-snapshot"`.
// ============================================================================

import { run, runFromJson, RcaError, type RcaInput } from "./compute";

// Bumped from 2026-07-08 when the optional per-event clock check was added.
// The four clock vectors reproduce cases checked by hand that day, written in
// NTP's sign (RFC 5905 theta: reference minus source), so a source 100 ms fast
// carries an offset of -100.
export const GOLDEN_VECTOR_SET_ID = "incident-timeline-rca-builder/2026-10-26";

interface RcaSnapshotVector {
  id: string;
  description: string;
  input: RcaInput;
  expect: {
    firedRuleIds: string[];
    timelineIds: string[];
    bands: [string, number][];
    candidates: [string, boolean][];
    riskIds: string[];
    warningIds: string[];
    /** Clock checks as [fromId, toId, relation, fromInterval, toInterval]; empty when no pair is clocked. */
    clockChecks?: [string, string, string, [number, number], [number, number]][];
  };
}

interface RejectVector {
  id: string;
  description: string;
  json: string;
  expectCode: "empty" | "format";
}

export const RCA_SNAPSHOT_VECTORS: RcaSnapshotVector[] = [
  {
    id: "change-caused-detect-gap",
    description:
      "A change-caused outage with a detection gap and one user-confirmed factor. The D-83 Example: full milestones, recent-change candidate confirmed by the user, monitoring-gap surfaced by the detection gap, the long-detect-gap risk.",
    input: {
      events: [
        { id: "e1", kind: "change-made", order: 10, note: "Deployed v2.3 to the API tier" },
        { id: "e2", kind: "symptom-began", order: 20, note: "5xx rate climbing" },
        { id: "e3", kind: "investigation-step", order: 25 },
        { id: "e4", kind: "alert-fired", order: 30 },
        { id: "e5", kind: "detected", order: 40, note: "On-call paged" },
        { id: "e6", kind: "mitigated", order: 50, note: "Rolled back v2.3" },
        { id: "e7", kind: "resolved", order: 60 },
      ],
      factors: [
        { domain: "recent-change", confirmed: true },
        { domain: "monitoring-gap", confirmed: false },
      ],
    },
    expect: {
      firedRuleIds: ["R-OBSERVED-FACTORS", "R-CHANGE-IN-TIMELINE", "R-DETECT-GAP"],
      timelineIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7"],
      bands: [["B-SYMPTOM-DETECT", 2], ["B-DETECT-MITIGATE", 0], ["B-MITIGATE-RESOLVE", 0]],
      candidates: [["F-recent-change", true], ["F-monitoring-gap", false]],
      riskIds: ["RK-LONG-DETECT-GAP"],
      warningIds: [],
    },
  },
  {
    id: "minimal-unknown",
    description:
      "A two-event timeline with no observed factors and no change. The honest-scaffold path: the still-unknown candidate, no-resolution and no-change structural notes, and the sparse-timeline caution.",
    input: {
      events: [
        { id: "e1", kind: "symptom-began", order: 1 },
        { id: "e2", kind: "detected", order: 2 },
      ],
      factors: [],
    },
    expect: {
      firedRuleIds: ["R-NO-RESOLVE", "R-NO-CHANGE", "R-STILL-UNKNOWN"],
      timelineIds: ["e1", "e2"],
      bands: [["B-SYMPTOM-DETECT", 0]],
      candidates: [["F-unknown-still", false]],
      riskIds: ["RK-NO-RESOLVE", "RK-NO-CHANGE-EVENT"],
      warningIds: ["W-SPARSE"],
    },
  },
  {
    id: "dependency-and-provider",
    description:
      "Two observed factors (dependency and external provider), prompt detection, full milestones, no change recorded. Exercises two user-observed candidates and the no-change structural note without the still-unknown candidate.",
    input: {
      events: [
        { id: "e1", kind: "symptom-began", order: 5 },
        { id: "e2", kind: "alert-fired", order: 6 },
        { id: "e3", kind: "detected", order: 7 },
        { id: "e4", kind: "escalated", order: 8 },
        { id: "e5", kind: "mitigated", order: 9 },
        { id: "e6", kind: "resolved", order: 10 },
      ],
      factors: [
        { domain: "dependency-failure", confirmed: false },
        { domain: "external-provider", confirmed: false },
      ],
    },
    expect: {
      firedRuleIds: ["R-OBSERVED-FACTORS", "R-NO-CHANGE"],
      timelineIds: ["e1", "e2", "e3", "e4", "e5", "e6"],
      bands: [["B-SYMPTOM-DETECT", 1], ["B-DETECT-MITIGATE", 1], ["B-MITIGATE-RESOLVE", 0]],
      candidates: [["F-dependency-failure", false], ["F-external-provider", false]],
      riskIds: ["RK-NO-CHANGE-EVENT"],
      warningIds: [],
    },
  },
  {
    id: "two-confirmed-no-resolve",
    description:
      "Two user-confirmed factors and no resolution milestone. Exercises the multi-confirmed caution (each confirmation needs its own evidence) and the no-resolution structural note; the change-in-timeline candidate joins the two observed ones.",
    input: {
      events: [
        { id: "e1", kind: "change-made", order: 1 },
        { id: "e2", kind: "symptom-began", order: 2 },
        { id: "e3", kind: "detected", order: 3 },
        { id: "e4", kind: "mitigated", order: 4 },
      ],
      factors: [
        { domain: "recent-change", confirmed: true },
        { domain: "configuration-error", confirmed: true },
      ],
    },
    expect: {
      firedRuleIds: ["R-OBSERVED-FACTORS", "R-CHANGE-IN-TIMELINE", "R-NO-RESOLVE"],
      timelineIds: ["e1", "e2", "e3", "e4"],
      bands: [["B-SYMPTOM-DETECT", 0], ["B-DETECT-MITIGATE", 0]],
      candidates: [["F-recent-change", true], ["F-configuration-error", true]],
      riskIds: ["RK-NO-RESOLVE"],
      warningIds: ["W-MULTI-CONFIRMED"],
    },
  },
  {
    id: "change-after-symptom",
    description:
      "The change is ordered after the symptom began. Exercises the change-after-symptom caution (a change that did not precede the symptom is unlikely to be a factor) and the detect-to-resolve fallback band when no mitigation is recorded.",
    input: {
      events: [
        { id: "e1", kind: "symptom-began", order: 1 },
        { id: "e2", kind: "change-made", order: 2 },
        { id: "e3", kind: "detected", order: 3 },
        { id: "e4", kind: "resolved", order: 4 },
      ],
      factors: [],
    },
    expect: {
      firedRuleIds: ["R-CHANGE-IN-TIMELINE"],
      timelineIds: ["e1", "e2", "e3", "e4"],
      bands: [["B-SYMPTOM-DETECT", 1], ["B-DETECT-RESOLVE", 0]],
      candidates: [["F-recent-change", false]],
      riskIds: [],
      warningIds: ["W-CHANGE-AFTER-SYMPTOM"],
    },
  },
  {
    id: "cert-expiry",
    description:
      "A certificate expiry with no change, prompt detection, full milestones. Exercises a single user-confirmed expired-credential candidate and the no-change structural note.",
    input: {
      events: [
        { id: "e1", kind: "symptom-began", order: 10, note: "TLS handshake failures" },
        { id: "e2", kind: "detected", order: 11 },
        { id: "e3", kind: "mitigated", order: 12, note: "Renewed cert" },
        { id: "e4", kind: "resolved", order: 13 },
      ],
      factors: [{ domain: "expired-credential", confirmed: true }],
    },
    expect: {
      firedRuleIds: ["R-OBSERVED-FACTORS", "R-NO-CHANGE"],
      timelineIds: ["e1", "e2", "e3", "e4"],
      bands: [["B-SYMPTOM-DETECT", 0], ["B-DETECT-MITIGATE", 0], ["B-MITIGATE-RESOLVE", 0]],
      candidates: [["F-expired-credential", true]],
      riskIds: ["RK-NO-CHANGE-EVENT"],
      warningIds: [],
    },
  },
  // ---- Clock check (2026-10-26) ----
  {
    id: "clock-intervals-touch",
    description:
      "Symptom logged at 1000 ms by a source 100 ms fast (offset -100) and detection at 1100 ms by a reference-synced source, each +/-100 ms: 800-1000 vs 1000-1200. Touching intervals cannot order the two, so W-CLOCK-ORDER-UNSUPPORTED.",
    input: {
      events: [
        { id: "e1", kind: "symptom-began", order: 1, clock: { reportedMs: 1000, offsetMs: -100, uncertaintyMs: 100 } },
        { id: "e2", kind: "detected", order: 2, clock: { reportedMs: 1100, offsetMs: 0, uncertaintyMs: 100 } },
        { id: "e3", kind: "resolved", order: 3 },
      ],
      factors: [],
    },
    expect: {
      firedRuleIds: ["R-NO-CHANGE", "R-STILL-UNKNOWN"],
      timelineIds: ["e1", "e2", "e3"],
      bands: [["B-SYMPTOM-DETECT", 0], ["B-DETECT-RESOLVE", 0]],
      candidates: [["F-unknown-still", false]],
      riskIds: ["RK-NO-CHANGE-EVENT"],
      warningIds: ["W-CLOCK-ORDER-UNSUPPORTED"],
      clockChecks: [["e1", "e2", "not-established", [800, 1000], [1000, 1200]]],
    },
  },
  {
    id: "clock-order-supported",
    description:
      "Same pair, the first source 300 ms fast (offset -300): 600-800 ends before 1000-1200 starts, so the clocks support the order and no clock caution is raised.",
    input: {
      events: [
        { id: "e1", kind: "symptom-began", order: 1, clock: { reportedMs: 1000, offsetMs: -300, uncertaintyMs: 100 } },
        { id: "e2", kind: "detected", order: 2, clock: { reportedMs: 1100, offsetMs: 0, uncertaintyMs: 100 } },
        { id: "e3", kind: "resolved", order: 3 },
      ],
      factors: [],
    },
    expect: {
      firedRuleIds: ["R-NO-CHANGE", "R-STILL-UNKNOWN"],
      timelineIds: ["e1", "e2", "e3"],
      bands: [["B-SYMPTOM-DETECT", 0], ["B-DETECT-RESOLVE", 0]],
      candidates: [["F-unknown-still", false]],
      riskIds: ["RK-NO-CHANGE-EVENT"],
      warningIds: [],
      clockChecks: [["e1", "e2", "consistent", [600, 800], [1000, 1200]]],
    },
  },
  {
    id: "clock-order-contradicted",
    description:
      "Symptom logged at 1500 ms with no offset, detection at 1100 ms: 1400-1600 lies wholly after 1000-1200, so the clocks contradict the order given and W-CLOCK-CONTRADICTS is raised.",
    input: {
      events: [
        { id: "e1", kind: "symptom-began", order: 1, clock: { reportedMs: 1500, offsetMs: 0, uncertaintyMs: 100 } },
        { id: "e2", kind: "detected", order: 2, clock: { reportedMs: 1100, offsetMs: 0, uncertaintyMs: 100 } },
        { id: "e3", kind: "resolved", order: 3 },
      ],
      factors: [],
    },
    expect: {
      firedRuleIds: ["R-NO-CHANGE", "R-STILL-UNKNOWN"],
      timelineIds: ["e1", "e2", "e3"],
      bands: [["B-SYMPTOM-DETECT", 0], ["B-DETECT-RESOLVE", 0]],
      candidates: [["F-unknown-still", false]],
      riskIds: ["RK-NO-CHANGE-EVENT"],
      warningIds: ["W-CLOCK-CONTRADICTS"],
      clockChecks: [["e1", "e2", "contradicts", [1400, 1600], [1000, 1200]]],
    },
  },
  {
    id: "clock-slow-source-skips-unclocked",
    description:
      "A change logged at 1000 ms by a source 500 ms SLOW (offset +500, NTP sign) is really at 1450-1550, after a symptom at 1050-1150. The unclocked event between them is skipped: the check compares consecutive clocked events.",
    input: {
      events: [
        { id: "e1", kind: "change-made", order: 1, clock: { reportedMs: 1000, offsetMs: 500, uncertaintyMs: 50 } },
        { id: "e2", kind: "investigation-step", order: 2 },
        { id: "e3", kind: "symptom-began", order: 3, clock: { reportedMs: 1100, offsetMs: 0, uncertaintyMs: 50 } },
      ],
      factors: [],
    },
    expect: {
      firedRuleIds: ["R-CHANGE-IN-TIMELINE", "R-NO-DETECT", "R-NO-RESOLVE"],
      timelineIds: ["e1", "e2", "e3"],
      bands: [],
      candidates: [["F-recent-change", false]],
      riskIds: ["RK-NO-DETECT", "RK-NO-RESOLVE"],
      warningIds: ["W-CLOCK-CONTRADICTS"],
      clockChecks: [["e1", "e3", "contradicts", [1450, 1550], [1050, 1150]]],
    },
  },
];

export const RCA_REJECT_VECTORS: RejectVector[] = [
  { id: "empty", description: "empty API input", json: "   ", expectCode: "empty" },
  { id: "not-json", description: "non-JSON API input", json: "{not json", expectCode: "format" },
  { id: "no-events", description: "events array is empty", json: '{"events":[],"factors":[]}', expectCode: "format" },
  { id: "bad-event-kind", description: "an out-of-vocabulary event kind is a format error", json: '{"events":[{"id":"e1","kind":"exploded","order":1}],"factors":[]}', expectCode: "format" },
  { id: "bad-factor-domain", description: "an out-of-vocabulary factor domain is a format error", json: '{"events":[{"id":"e1","kind":"symptom-began","order":1}],"factors":[{"domain":"gremlins","confirmed":false}]}', expectCode: "format" },
  { id: "missing-order", description: "an event without a numeric order is a format error", json: '{"events":[{"id":"e1","kind":"detected"}],"factors":[]}', expectCode: "format" },
  // Clock evidence (2026-10-26): whole milliseconds, and an uncertainty that is never negative.
  { id: "clock-negative-uncertainty", description: "a negative clock uncertainty is a format error", json: '{"events":[{"id":"e1","kind":"detected","order":1,"clock":{"reportedMs":1000,"offsetMs":0,"uncertaintyMs":-5}}],"factors":[]}', expectCode: "format" },
  { id: "clock-fractional-ms", description: "a fractional millisecond is a format error", json: '{"events":[{"id":"e1","kind":"detected","order":1,"clock":{"reportedMs":1000.5,"offsetMs":0,"uncertaintyMs":5}}],"factors":[]}', expectCode: "format" },
];

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

/** Run every snapshot + reject vector; used by the standalone check and CI. */
export function verifyVectors(): VectorReport {
  const failures: string[] = [];

  for (const v of RCA_SNAPSHOT_VECTORS) {
    try {
      const r = run(v.input);
      const firedOk = JSON.stringify(r.firedRuleIds) === JSON.stringify(v.expect.firedRuleIds);
      const timelineOk = JSON.stringify(r.timeline.map((t) => t.id)) === JSON.stringify(v.expect.timelineIds);
      const bandsOk = JSON.stringify(r.bands.map((b) => [b.id, b.eventsSpanned])) === JSON.stringify(v.expect.bands);
      const candOk = JSON.stringify(r.candidates.map((c) => [c.id, c.userConfirmed])) === JSON.stringify(v.expect.candidates);
      const riskOk = JSON.stringify(r.risks.map((x) => x.id)) === JSON.stringify(v.expect.riskIds);
      const warnOk = JSON.stringify(r.warnings.map((w) => w.id)) === JSON.stringify(v.expect.warningIds);
      // Language-discipline invariant: no candidate is confirmed unless the
      // input said so. (A confirmed candidate must trace to a confirmed input.)
      const confirmedInputs = new Set(v.input.factors.filter((f) => f.confirmed).map((f) => `F-${f.domain}`));
      const noPhantomConfirm = r.candidates.every((c) => !c.userConfirmed || confirmedInputs.has(c.id));
      // Clock checks: pinned exactly when the vector lists them, otherwise there must be none.
      const gotClock = r.clockChecks.map((c) => [c.fromId, c.toId, c.relation, c.fromInterval, c.toInterval]);
      const clockOk = JSON.stringify(gotClock) === JSON.stringify(v.expect.clockChecks ?? []);
      if (!firedOk || !timelineOk || !bandsOk || !candOk || !riskOk || !warnOk || !noPhantomConfirm || !clockOk) {
        failures.push(
          `${v.id}: fired=${firedOk} timeline=${timelineOk} bands=${bandsOk} cand=${candOk} risk=${riskOk} warn=${warnOk} noPhantomConfirm=${noPhantomConfirm} clock=${clockOk} (got clock=${JSON.stringify(gotClock)} fired=${JSON.stringify(r.firedRuleIds)} bands=${JSON.stringify(r.bands.map((b) => [b.id, b.eventsSpanned]))} cand=${JSON.stringify(r.candidates.map((c) => [c.id, c.userConfirmed]))} risk=${JSON.stringify(r.risks.map((x) => x.id))} warn=${JSON.stringify(r.warnings.map((w) => w.id))})`,
        );
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of RCA_REJECT_VECTORS) {
    try {
      runFromJson(v.json);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof RcaError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }

  const total = RCA_SNAPSHOT_VECTORS.length + RCA_REJECT_VECTORS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
