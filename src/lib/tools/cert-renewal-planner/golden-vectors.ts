// ============================================================================
// src/lib/tools/cert-renewal-planner/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS — fixed (notBefore, notAfter) → expected-output pairs that pin
// the renewal-planner math. Because analyzeRenewal is deterministic (no clock),
// these are stable forever and prove the SC-081v3 phase selection, validity
// length, compliance, cadence, and reuse-window outputs are correct. If the
// folder is ever lifted into an open library, the golden-vector CI runner
// replays each one and fails on any drift.
// ============================================================================

import { analyzeRenewal } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "cert-renewal-planner/v1";

export interface RenewalVector {
  name: string;
  notBefore: string;
  notAfter: string;
  expect: {
    validityDays: number;
    issuancePhaseIndex: number;
    maxAllowedDays: number;
    compliant: boolean;
    overByDays: number;
    renewalsPerYear: number;
    dcvReuseDays: number;
    siiReuseDays: number;
    recommendedLeadDays: number;
    renewByIso: string;
  };
}

export const GOLDEN_VECTORS: readonly RenewalVector[] = Object.freeze([
  {
    name: "398-era 397-day cert (status quo, compliant)",
    notBefore: "2026-01-01",
    notAfter: "2027-02-02",
    expect: {
      validityDays: 397, issuancePhaseIndex: 0, maxAllowedDays: 398, compliant: true,
      overByDays: 0, renewalsPerYear: 0.9, dcvReuseDays: 398, siiReuseDays: 825,
      recommendedLeadDays: 30, renewByIso: "2027-01-03",
    },
  },
  {
    name: "90-day cert issued in the 200-day phase (compliant)",
    notBefore: "2026-06-01",
    notAfter: "2026-08-30",
    expect: {
      validityDays: 90, issuancePhaseIndex: 1, maxAllowedDays: 200, compliant: true,
      overByDays: 0, renewalsPerYear: 4.1, dcvReuseDays: 200, siiReuseDays: 398,
      recommendedLeadDays: 30, renewByIso: "2026-07-31",
    },
  },
  {
    name: "100-day cert in the 100-day phase (compliant)",
    notBefore: "2027-06-01",
    notAfter: "2027-09-09",
    expect: {
      validityDays: 100, issuancePhaseIndex: 2, maxAllowedDays: 100, compliant: true,
      overByDays: 0, renewalsPerYear: 3.7, dcvReuseDays: 100, siiReuseDays: 398,
      recommendedLeadDays: 30, renewByIso: "2027-08-10",
    },
  },
  {
    name: "47-day cert in the final phase (compliant, 10-day DCV)",
    notBefore: "2029-04-01",
    notAfter: "2029-05-18",
    expect: {
      validityDays: 47, issuancePhaseIndex: 3, maxAllowedDays: 47, compliant: true,
      overByDays: 0, renewalsPerYear: 7.8, dcvReuseDays: 10, siiReuseDays: 398,
      recommendedLeadDays: 16, renewByIso: "2029-05-02",
    },
  },
  {
    name: "300-day cert issued in the 200-day phase (over cap)",
    notBefore: "2026-06-01",
    notAfter: "2027-03-28",
    expect: {
      validityDays: 300, issuancePhaseIndex: 1, maxAllowedDays: 200, compliant: false,
      overByDays: 100, renewalsPerYear: 1.2, dcvReuseDays: 200, siiReuseDays: 398,
      recommendedLeadDays: 30, renewByIso: "2027-02-26",
    },
  },
]);

export interface VerifyReport {
  setId: string;
  total: number;
  passed: number;
  failures: { name: string; field: string; expected: unknown; actual: unknown }[];
}

/** Replay every vector through analyzeRenewal and report any field mismatch. */
export function verifyVectors(): VerifyReport {
  const failures: VerifyReport["failures"] = [];
  for (const v of GOLDEN_VECTORS) {
    const got = analyzeRenewal(v.notBefore, v.notAfter);
    for (const k of Object.keys(v.expect) as (keyof RenewalVector["expect"])[]) {
      if (got[k] !== v.expect[k]) {
        failures.push({ name: v.name, field: k, expected: v.expect[k], actual: got[k] });
      }
    }
  }
  return {
    setId: GOLDEN_VECTOR_SET_ID,
    total: GOLDEN_VECTORS.length,
    passed: GOLDEN_VECTORS.length - failures.length,
    failures,
  };
}
