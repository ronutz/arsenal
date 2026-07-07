// ============================================================================
// golden-vectors.ts — F5 release cadence calendar
// (set id: "f5-release-cadence-calendar/golden@1")
//
// V1 straddles the program start: from 2026-07-01 the first cycle (2026-07-15)
// ships a release but publishes NO notification yet (the first notification is
// 2026-08-19). V2 starts mid-program (Sep-16 already past, so the next release is
// Oct-21). V3 starts before the program and is floored to the 2026-07-15 start.
// Values captured from compute.run() and cross-checked against F5's two published
// anchors (2026-07-15 first release, 2026-08-19 first notification covering it).
// ============================================================================

import type { CadenceResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-release-cadence-calendar/golden@1";

export interface CadenceGoldenVector {
  name: string;
  input: { from?: string; months?: number };
  expected: CadenceResult;
}

export const F5_RELEASE_CADENCE_CALENDAR_GOLDEN_VECTORS: CadenceGoldenVector[] = [
  {
    name: "straddles-program-start",
    input: { from: "2026-07-01", months: 4 },
    expected: {
      referenceDate: "2026-07-01",
      programStart: "2026-07-15",
      firstNotification: "2026-08-19",
      cycles: [
        { date: "2026-07-15", hardenedRelease: "2026-07-15", notificationPublished: null, notificationCovers: null },
        { date: "2026-08-19", hardenedRelease: "2026-08-19", notificationPublished: "2026-08-19", notificationCovers: "2026-07-15" },
        { date: "2026-09-16", hardenedRelease: "2026-09-16", notificationPublished: "2026-09-16", notificationCovers: "2026-08-19" },
        { date: "2026-10-21", hardenedRelease: "2026-10-21", notificationPublished: "2026-10-21", notificationCovers: "2026-09-16" },
      ],
      nextHardenedRelease: "2026-07-15",
      nextSecurityNotification: "2026-08-19",
    },
  },
  {
    name: "mid-program",
    input: { from: "2026-09-20", months: 3 },
    expected: {
      referenceDate: "2026-09-20",
      programStart: "2026-07-15",
      firstNotification: "2026-08-19",
      cycles: [
        { date: "2026-10-21", hardenedRelease: "2026-10-21", notificationPublished: "2026-10-21", notificationCovers: "2026-09-16" },
        { date: "2026-11-18", hardenedRelease: "2026-11-18", notificationPublished: "2026-11-18", notificationCovers: "2026-10-21" },
        { date: "2026-12-16", hardenedRelease: "2026-12-16", notificationPublished: "2026-12-16", notificationCovers: "2026-11-18" },
      ],
      nextHardenedRelease: "2026-10-21",
      nextSecurityNotification: "2026-10-21",
    },
  },
  {
    name: "before-program-floored",
    input: { from: "2026-06-01", months: 2 },
    expected: {
      referenceDate: "2026-06-01",
      programStart: "2026-07-15",
      firstNotification: "2026-08-19",
      cycles: [
        { date: "2026-07-15", hardenedRelease: "2026-07-15", notificationPublished: null, notificationCovers: null },
        { date: "2026-08-19", hardenedRelease: "2026-08-19", notificationPublished: "2026-08-19", notificationCovers: "2026-07-15" },
      ],
      nextHardenedRelease: "2026-07-15",
      nextSecurityNotification: "2026-08-19",
    },
  },
];
