// ============================================================================
// src/lib/tools/cron-expression-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// The pinned truth for the cron engine. Every accept vector fixes the parsed
// value sets, the warnings (localTime excluded - it is unconditional), and the
// next occurrences from one frozen reference instant, 2026-08-27T12:00:00Z
// (a Thursday), so the projection math can never drift silently. Each value
// was hand-computed against crontab(5) before being pinned - including the OR
// rule sequence (Mon 31 Aug, then day-1 Sep 1, then Mon Sep 7) and the
// Vixie "n/step" reading of 5/20 as 5-59/20.
// verifyVectors() runs the whole set and throws on the first drift.
// ============================================================================
import { run, CronError, type CronErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "cron-expression-explainer/2026-08-27a";
const FROM = "2026-08-27T12:00:00Z";

interface AcceptVector {
  id: string;
  input: string;
  expect: Record<string, unknown>;
}
interface RejectVector { id: string; input: string; code: CronErrorCode }

export const CRON_GOLDEN_VECTORS: readonly AcceptVector[] = [
  { id: "step-15", input: "*/15 * * * *",
    expect: { min: [0, 15, 30, 45], hourN: 24, warn: [], next0: "2026-08-27T12:15Z" } },
  { id: "uneven-step", input: "*/7 * * * *",
    expect: { min: [0, 7, 14, 21, 28, 35, 42, 49, 56], warn: ["unevenStep"], next0: "2026-08-27T12:07Z" } },
  { id: "weekday-night", input: "0 2 * * 1-5",
    expect: { min: [0], hour: [2], dow: [1, 2, 3, 4, 5], next0: "2026-08-28T02:00Z", next1: "2026-08-31T02:00Z" } },
  { id: "macro-daily", input: "@daily",
    expect: { macro: "@daily", min: [0], hour: [0], next0: "2026-08-28T00:00Z" } },
  { id: "yearly-explicit", input: "0 0 1 1 *",
    expect: { dom: [1], mon: [1], next0: "2027-01-01T00:00Z", next1: "2028-01-01T00:00Z" } },
  { id: "or-rule", input: "0 0 1 * MON",
    expect: { dom: [1], dow: [1], warn: ["orRule"], next0: "2026-08-31T00:00Z", next1: "2026-09-01T00:00Z", next2: "2026-09-07T00:00Z" } },
  { id: "sunday-seven", input: "0 0 * * 7",
    expect: { dow: [0], warn: ["sundaySeven"], next0: "2026-08-30T00:00Z" } },
  { id: "month-names-range", input: "0 12 * JAN-MAR *",
    expect: { mon: [1, 2, 3], next0: "2027-01-01T12:00Z" } },
  { id: "hour-range-step", input: "0 8-18/2 * * *",
    expect: { hour: [8, 10, 12, 14, 16, 18], next0: "2026-08-27T14:00Z" } },
  { id: "minute-list", input: "15,45 9 * * *",
    expect: { min: [15, 45], hour: [9], next0: "2026-08-28T09:15Z", next1: "2026-08-28T09:45Z" } },
  { id: "vixie-n-step", input: "5/20 * * * *",
    expect: { min: [5, 25, 45], next0: "2026-08-27T12:05Z" } },
  { id: "macro-hourly", input: "@hourly",
    expect: { macro: "@hourly", min: [0], next0: "2026-08-27T13:00Z" } },
  { id: "dow-names-list", input: "30 6 * * SAT,SUN",
    expect: { min: [30], hour: [6], dow: [0, 6], next0: "2026-08-29T06:30Z", next1: "2026-08-30T06:30Z" } },
  { id: "leap-day", input: "* * 29 2 *",
    expect: { dom: [29], mon: [2], next0: "2028-02-29T00:00Z" } },
  { id: "macro-reboot", input: "@reboot",
    expect: { macro: "@reboot", fieldsNull: true, warn: ["rebootNoSchedule"], nextCount: 0 } },
];

export const CRON_REJECT_VECTORS: readonly RejectVector[] = [
  { id: "reject-empty", input: "   ", code: "empty" },
  { id: "reject-four-fields", input: "* * * *", code: "fieldCount" },
  { id: "reject-quartz-six", input: "0 0 * * * *", code: "quartz" },
  { id: "reject-minute-61", input: "61 * * * *", code: "range" },
  { id: "reject-step-zero", input: "*/0 * * * *", code: "step" },
  { id: "reject-reversed", input: "5-1 * * * *", code: "reversedRange" },
  { id: "reject-bad-dow-name", input: "0 0 * * XYZ", code: "badName" },
  { id: "reject-bad-macro", input: "@fortnightly", code: "badMacro" },
];

/** Flatten one result into the comparison surface the vectors pin. */
function flat(input: string) {
  const r = run(input, { from: FROM, count: 3 });
  const f = r.fields;
  return {
    macro: r.macro ?? null,
    fieldsNull: f === null,
    min: f?.minute.values, hour: f?.hour.values, hourN: f?.hour.values.length,
    dom: f?.dayOfMonth.values, mon: f?.month.values, dow: f?.dayOfWeek.values,
    warn: r.warnings.filter((w) => w !== "localTime"),
    next0: r.nextRuns[0], next1: r.nextRuns[1], next2: r.nextRuns[2],
    nextCount: r.nextRuns.length,
  } as Record<string, unknown>;
}

export function verifyVectors(): { accepted: number; rejected: number } {
  for (const v of CRON_GOLDEN_VECTORS) {
    const got = flat(v.input);
    for (const [k, want] of Object.entries(v.expect)) {
      const g = got[k];
      const eq = Array.isArray(want) ? JSON.stringify(want) === JSON.stringify(g) : g === want;
      if (!eq) throw new Error(`[${v.id}] ${k}: expected ${JSON.stringify(want)}, got ${JSON.stringify(g)}`);
    }
  }
  for (const v of CRON_REJECT_VECTORS) {
    try {
      run(v.input, { from: FROM });
      throw new Error(`[${v.id}] expected rejection "${v.code}", input accepted`);
    } catch (e) {
      if (!(e instanceof CronError) || e.code !== v.code) {
        throw new Error(`[${v.id}] expected code "${v.code}", got ${e instanceof CronError ? e.code : e}`);
      }
    }
  }
  return { accepted: CRON_GOLDEN_VECTORS.length, rejected: CRON_REJECT_VECTORS.length };
}
