// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/timezone-meeting-planner/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors use two fixed instants - one in July, one in January - so the DST
// contrast (Berlin +2 vs +1, Los Angeles -7 vs -8) is pinned explicitly.
// São Paulo is UTC-3 year-round (Brazil abolished DST in 2019).
// ============================================================================

import { run, PlannerInputError } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "timezone-meeting-planner-v1";

export interface PlannerVector {
  id: string;
  input: Parameters<typeof run>[0];
  expect: {
    perZone?: Array<{ zone: string; localTime?: string; localDate?: string; dayDelta?: number; businessHours?: boolean }>;
    errorIncludes?: string;
  };
}

export const GOLDEN_VECTORS: PlannerVector[] = [
  {
    id: "v1-july",
    input: { instant: "2026-07-18T15:00Z", zones: ["America/Sao_Paulo", "Europe/Berlin", "Asia/Tokyo", "America/Los_Angeles"] },
    expect: { perZone: [
      { zone: "America/Sao_Paulo", localTime: "12:00", dayDelta: 0 },
      { zone: "Europe/Berlin", localTime: "17:00", dayDelta: 0 },
      { zone: "Asia/Tokyo", localTime: "00:00", localDate: "2026-07-19", dayDelta: 1 },
      { zone: "America/Los_Angeles", localTime: "08:00", dayDelta: 0 },
    ] },
  },
  {
    id: "v2-january",
    // Thursday 2026-01-15: a weekday, so businessHours can be pinned too.
    input: { instant: "2026-01-15T15:00Z", zones: ["America/Sao_Paulo", "Europe/Berlin", "America/Los_Angeles"] },
    expect: { perZone: [
      { zone: "America/Sao_Paulo", localTime: "12:00", businessHours: true },
      { zone: "Europe/Berlin", localTime: "16:00", businessHours: true },
      { zone: "America/Los_Angeles", localTime: "07:00", businessHours: false },
    ] },
  },
  { id: "e1", input: { instant: "2026-07-18T15:00", zones: ["Europe/Berlin"] }, expect: { errorIncludes: "never guesses" } },
  { id: "e2", input: { instant: "2026-07-18T15:00Z", zones: ["Mars/Olympus_Mons"] }, expect: { errorIncludes: "IANA time zone" } },
];

export interface VerifyReport { pass: boolean; failures: string[] }

export function verifyVectors(): VerifyReport {
  const failures: string[] = [];
  for (const v of GOLDEN_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expect.errorIncludes) { failures.push(`${v.id}: expected error`); continue; }
      for (const exp of v.expect.perZone ?? []) {
        const z = r.readings.find((x) => x.zone === exp.zone);
        if (!z) { failures.push(`${v.id}: ${exp.zone} missing`); continue; }
        if (exp.localTime && z.localTime !== exp.localTime) failures.push(`${v.id}/${exp.zone}: time ${z.localTime} != ${exp.localTime}`);
        if (exp.localDate && z.localDate !== exp.localDate) failures.push(`${v.id}/${exp.zone}: date ${z.localDate} != ${exp.localDate}`);
        if (exp.dayDelta !== undefined && z.dayDelta !== exp.dayDelta) failures.push(`${v.id}/${exp.zone}: dayDelta ${z.dayDelta} != ${exp.dayDelta}`);
        if (exp.businessHours !== undefined && z.businessHours !== exp.businessHours) failures.push(`${v.id}/${exp.zone}: businessHours ${z.businessHours} != ${exp.businessHours}`);
      }
    } catch (e) {
      if (!(e instanceof PlannerInputError)) { failures.push(`${v.id}: unexpected ${String(e)}`); continue; }
      if (!v.expect.errorIncludes) { failures.push(`${v.id}: unexpected error ${e.message}`); continue; }
      if (!e.message.includes(v.expect.errorIncludes)) failures.push(`${v.id}: error mismatch: ${e.message}`);
    }
  }
  return { pass: failures.length === 0, failures };
}
