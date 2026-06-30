// ============================================================================
// src/lib/tools/epoch/golden-vectors.ts
// ----------------------------------------------------------------------------
// Fixed input -> expected-output pairs pinning the converter. All inputs are
// unit-numeric or ISO-with-zone, so every expectation is deterministic and
// independent of the runner's local time zone.
// ============================================================================

import { analyzeEpoch } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "epoch-golden-2026-06-29";

export interface EpochVector {
  id: string;
  input: string;
  expect: {
    inputKind: string;
    iso8601: string;
    unixSeconds: string;
    weekday: string;
  };
}

export const GOLDEN_VECTORS: EpochVector[] = [
  {
    id: "epoch-zero",
    input: "0",
    expect: {
      inputKind: "seconds",
      iso8601: "1970-01-01T00:00:00.000Z",
      unixSeconds: "0",
      weekday: "Thursday",
    },
  },
  {
    id: "one-billion",
    input: "1000000000",
    expect: {
      inputKind: "seconds",
      iso8601: "2001-09-09T01:46:40.000Z",
      unixSeconds: "1000000000",
      weekday: "Sunday",
    },
  },
  {
    id: "negative-before-epoch",
    input: "-86400",
    expect: {
      inputKind: "seconds",
      iso8601: "1969-12-31T00:00:00.000Z",
      unixSeconds: "-86400",
      weekday: "Wednesday",
    },
  },
  {
    id: "millis-detected",
    input: "1700000000000",
    expect: {
      inputKind: "milliseconds",
      iso8601: "2023-11-14T22:13:20.000Z",
      unixSeconds: "1700000000",
      weekday: "Tuesday",
    },
  },
  {
    id: "micros-detected",
    input: "1700000000000000",
    expect: {
      inputKind: "microseconds",
      iso8601: "2023-11-14T22:13:20.000Z",
      unixSeconds: "1700000000",
      weekday: "Tuesday",
    },
  },
  {
    id: "y2038-boundary",
    input: "2147483647",
    expect: {
      inputKind: "seconds",
      iso8601: "2038-01-19T03:14:07.000Z",
      unixSeconds: "2147483647",
      weekday: "Tuesday",
    },
  },
  {
    id: "iso-with-zone",
    input: "2023-11-14T22:13:20Z",
    expect: {
      inputKind: "iso",
      iso8601: "2023-11-14T22:13:20.000Z",
      unixSeconds: "1700000000",
      weekday: "Tuesday",
    },
  },
];

export interface VerifyReport {
  setId: string;
  total: number;
  passed: number;
  failures: { id: string; reason: string }[];
}

export function verifyVectors(): VerifyReport {
  const failures: { id: string; reason: string }[] = [];
  for (const v of GOLDEN_VECTORS) {
    try {
      const r = analyzeEpoch(v.input);
      if (r.inputKind !== v.expect.inputKind)
        failures.push({ id: v.id, reason: `inputKind ${r.inputKind} != ${v.expect.inputKind}` });
      if (r.formats.iso8601 !== v.expect.iso8601)
        failures.push({ id: v.id, reason: `iso ${r.formats.iso8601} != ${v.expect.iso8601}` });
      if (r.formats.unixSeconds !== v.expect.unixSeconds)
        failures.push({ id: v.id, reason: `seconds ${r.formats.unixSeconds} != ${v.expect.unixSeconds}` });
      if (r.utc.weekday !== v.expect.weekday)
        failures.push({ id: v.id, reason: `weekday ${r.utc.weekday} != ${v.expect.weekday}` });
    } catch (err) {
      failures.push({ id: v.id, reason: `threw: ${(err as Error).message}` });
    }
  }
  return {
    setId: GOLDEN_VECTOR_SET_ID,
    total: GOLDEN_VECTORS.length,
    passed: GOLDEN_VECTORS.length - failures.length,
    failures,
  };
}
