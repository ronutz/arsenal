// ============================================================================
// src/lib/tools/f5-service-check-date/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the F5 service-check-date engine.
//
// Each accept vector pins a real case tied back to the authoritative F5 K7727
// table (the vendored registry-data.ts), in BOTH directions:
//   * version  -> the row it resolves to + the minimum service check date;
//   * date     -> the newest reachable version + the nearest blocked version.
// The dates and versions are cross-checked against K7727 itself (including F5's
// own worked example: a service check date of 2021-06-11 permits exactly up to
// 16.1.x), so these tie the engine to the vendor source, not to itself.
//
// Reject vectors assert that bad input throws the right stable code.
//
// verifyVectors() runs the whole set and returns a pass/fail report (used by the
// build/CI check and runnable standalone).
// ============================================================================

import {
  run,
  ServiceCheckError,
  type ServiceCheckErrorCode,
  type VersionLookupResult,
  type DateLookupResult,
} from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-service-check-date-golden-v1";

/** What a version-lookup vector asserts. */
interface VersionExpect {
  kind: "version";
  /** F5 table row label the version resolves to. */
  label: string;
  /** Minimum service check date, compact yyyymmdd. */
  dateCompact: string;
  /** True when the matched row spans a whole major.minor. */
  isMajorMinorRow: boolean;
}

/** What a date-lookup vector asserts. */
interface DateExpect {
  kind: "date";
  /** Label of the newest reachable version, or null when none are reachable. */
  newestReachableLabel: string | null;
  /** Label of the nearest blocked version, or null when none are blocked. */
  nextBlockedLabel: string | null;
}

export interface ServiceCheckGoldenVector {
  id: string;
  description: string;
  input: string;
  expect: VersionExpect | DateExpect;
}

export const SERVICE_CHECK_GOLDEN_VECTORS: ServiceCheckGoldenVector[] = [
  // -- version -> minimum service check date --
  {
    id: "v-17.1.3",
    description: "17.1.3 resolves to the 17.1.x row",
    input: "17.1.3",
    expect: { kind: "version", label: "17.1.x", dateCompact: "20230208", isMajorMinorRow: true },
  },
  {
    id: "v-21.1",
    description: "21.1 (newest branch) minimum service check date",
    input: "21.1",
    expect: { kind: "version", label: "21.1.x", dateCompact: "20260415", isMajorMinorRow: true },
  },
  {
    id: "v-16.1.x",
    description: "16.1.x minimum service check date",
    input: "16.1.x",
    expect: { kind: "version", label: "16.1.x", dateCompact: "20210611", isMajorMinorRow: true },
  },
  {
    id: "v-legacy-range",
    description: "legacy 10.2.3 falls in the 10.2.2 - 10.2.4 row",
    input: "10.2.3",
    expect: { kind: "version", label: "10.2.2 - 10.2.4", dateCompact: "20101001", isMajorMinorRow: false },
  },
  {
    id: "v-legacy-exact",
    description: "legacy 11.2.1 is its own row, distinct from 11.2.0",
    input: "11.2.1",
    expect: { kind: "version", label: "11.2.1", dateCompact: "20120820", isMajorMinorRow: false },
  },

  // -- service check date -> reachable versions --
  {
    id: "d-2023-06-15",
    description: "mid-2023 service check date reaches up to 17.1.x; 17.5.x is next-blocked",
    input: "2023-06-15",
    expect: { kind: "date", newestReachableLabel: "17.1.x", nextBlockedLabel: "17.5.x" },
  },
  {
    id: "d-20260501",
    description: "a 2026 service check date reaches the newest branch, nothing blocked",
    input: "20260501",
    expect: { kind: "date", newestReachableLabel: "21.1.x", nextBlockedLabel: null },
  },
  {
    id: "d-2020-01-01",
    description: "early-2020 reaches up to 15.1.x; 16.0.x is next-blocked",
    input: "2020-01-01",
    expect: { kind: "date", newestReachableLabel: "15.1.x", nextBlockedLabel: "16.0.x" },
  },
  {
    id: "d-k7727-example",
    description: "F5 K7727 worked example: 2021-06-11 permits exactly up to 16.1.x",
    input: "20210611",
    expect: { kind: "date", newestReachableLabel: "16.1.x", nextBlockedLabel: "17.0.x" },
  },
  {
    id: "d-too-old",
    description: "a service check date before the oldest row reaches nothing",
    input: "2005-01-01",
    expect: { kind: "date", newestReachableLabel: null, nextBlockedLabel: "9.2.0 - 9.2.5" },
  },
];

export interface ServiceCheckRejectVector {
  id: string;
  description: string;
  input: string;
  expectCode: ServiceCheckErrorCode;
}

export const SERVICE_CHECK_REJECT_VECTORS: ServiceCheckRejectVector[] = [
  { id: "r-empty", description: "empty input", input: "   ", expectCode: "empty" },
  { id: "r-garbage", description: "neither a date nor a version", input: "not a version!!", expectCode: "format" },
  { id: "r-unknown-version", description: "a version with no K7727 row", input: "99.9", expectCode: "unknownVersion" },
  { id: "r-bad-date", description: "an impossible calendar date", input: "2023-13-40", expectCode: "format" },
];

export interface VectorFailure {
  id: string;
  reason: string;
}

/** Run every vector; return a pass/fail report. */
export function verifyVectors(): { passed: number; failed: number; failures: VectorFailure[] } {
  const failures: VectorFailure[] = [];
  let passed = 0;

  for (const v of SERVICE_CHECK_GOLDEN_VECTORS) {
    try {
      const got = run(v.input);
      if (got.kind !== v.expect.kind) {
        failures.push({ id: v.id, reason: `kind ${got.kind} != ${v.expect.kind}` });
        continue;
      }
      if (v.expect.kind === "version") {
        const r = got as VersionLookupResult;
        const e = v.expect;
        if (r.matched.label !== e.label || r.minServiceCheckDateCompact !== e.dateCompact || r.isMajorMinorRow !== e.isMajorMinorRow) {
          failures.push({ id: v.id, reason: `got ${r.matched.label}/${r.minServiceCheckDateCompact}/${r.isMajorMinorRow}` });
          continue;
        }
      } else {
        const r = got as DateLookupResult;
        const e = v.expect;
        const newest = r.newestReachable ? r.newestReachable.label : null;
        const next = r.nextBlocked ? r.nextBlocked.label : null;
        if (newest !== e.newestReachableLabel || next !== e.nextBlockedLabel) {
          failures.push({ id: v.id, reason: `got newest=${newest} next=${next}` });
          continue;
        }
      }
      passed++;
    } catch (err) {
      failures.push({ id: v.id, reason: `threw ${(err as Error).message}` });
    }
  }

  for (const v of SERVICE_CHECK_REJECT_VECTORS) {
    try {
      run(v.input);
      failures.push({ id: v.id, reason: "expected throw, got result" });
    } catch (err) {
      if (err instanceof ServiceCheckError && err.code === v.expectCode) passed++;
      else failures.push({ id: v.id, reason: `wrong error: ${(err as Error).message}` });
    }
  }

  return { passed, failed: failures.length, failures };
}
