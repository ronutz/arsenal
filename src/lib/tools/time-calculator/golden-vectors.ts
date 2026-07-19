// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/time-calculator/golden-vectors.ts — arithmetic facts,
// verifiable by hand (leap day included on purpose).
// ============================================================================

import { run, parseDuration, TimeInputError } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "time-calculator-v1";

export interface TimeVector {
  id: string;
  input: Parameters<typeof run>[0];
  expect: { bIso?: string; totalSeconds?: number; iso?: string; days?: number; errorIncludes?: string };
}

export const GOLDEN_VECTORS: TimeVector[] = [
  { id: "v1", input: { mode: "shift", start: "2026-01-01T00:00Z", duration: "P1DT2H", op: "add" }, expect: { bIso: "2026-01-02T02:00:00Z" } },
  { id: "v2", input: { mode: "shift", start: "2026-01-01T00:00Z", duration: "90min", op: "add" }, expect: { bIso: "2026-01-01T01:30:00Z" } },
  { id: "v3", input: { mode: "shift", start: "2026-07-18T15:00Z", duration: "1w", op: "subtract" }, expect: { bIso: "2026-07-11T15:00:00Z" } },
  // Leap day 2024: Feb 28 -> Mar 1 spans exactly 2 days.
  { id: "v4", input: { mode: "diff", a: "2024-02-28T00:00Z", b: "2024-03-01T00:00Z" }, expect: { days: 2, iso: "P2D" } },
  { id: "v5", input: { mode: "diff", a: "2026-07-18T12:00:00-03:00", b: "2026-07-18T15:00Z" }, expect: { totalSeconds: 0, iso: "PT0S" } },
  { id: "v6", input: { mode: "diff", a: "2026-01-01T00:00Z", b: "2026-01-01T01:30:45Z" }, expect: { totalSeconds: 5445, iso: "PT1H30M45S" } },
  { id: "e1", input: { mode: "shift", start: "2026-01-01T00:00Z", duration: "P1M", op: "add" }, expect: { errorIncludes: "calendar units" } },
  { id: "e2", input: { mode: "shift", start: "nonsense", duration: "1h", op: "add" }, expect: { errorIncludes: "parseable" } },
];

export interface VerifyReport { pass: boolean; failures: string[] }

export function verifyVectors(): VerifyReport {
  const failures: string[] = [];
  if (parseDuration("PT90M") !== 5_400_000) failures.push("PT90M != 5400000 ms");
  for (const v of GOLDEN_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expect.errorIncludes) { failures.push(`${v.id}: expected error`); continue; }
      if (v.expect.bIso && r.bIso !== v.expect.bIso) failures.push(`${v.id}: bIso ${r.bIso} != ${v.expect.bIso}`);
      if (v.expect.totalSeconds !== undefined && r.totals.seconds !== v.expect.totalSeconds) failures.push(`${v.id}: seconds ${r.totals.seconds} != ${v.expect.totalSeconds}`);
      if (v.expect.iso && r.iso !== v.expect.iso) failures.push(`${v.id}: iso ${r.iso} != ${v.expect.iso}`);
      if (v.expect.days !== undefined && r.totals.days !== v.expect.days) failures.push(`${v.id}: days ${r.totals.days} != ${v.expect.days}`);
    } catch (e) {
      if (!(e instanceof TimeInputError)) { failures.push(`${v.id}: unexpected ${String(e)}`); continue; }
      if (!v.expect.errorIncludes) { failures.push(`${v.id}: unexpected error ${e.message}`); continue; }
      if (!e.message.includes(v.expect.errorIncludes)) failures.push(`${v.id}: error mismatch: ${e.message}`);
    }
  }
  return { pass: failures.length === 0, failures };
}
