// ============================================================================
// src/lib/tools/f5xc-rate-limit-calculator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: pure arithmetic + mitigation semantics. The rate math
// (including F5's [1,Seconds,60] == [1,Minutes,1] equivalence), the burst
// ceiling (Number x Multiplier), and the 48h lockout cap were verified against
// F5 documentation before authoring.
// ============================================================================

import { calculateRateLimit, type RateLimitInput } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-rate-limit-calculator/2026-07-11";

interface Vec {
  id: string;
  input: RateLimitInput;
  ok: boolean;
  windowSeconds?: number;
  ratePerSecond?: number;
  ratePerMinute?: number;
  ratePerHour?: number;
  burstCeiling?: number;
  lockoutSeconds?: number | null;
  lockoutExceedsMax?: boolean;
  mitigation?: string;
  errorIncludes?: string;
}

const VECTORS: Vec[] = [
  { id: "one-per-minute-seconds", input: { number: 1, perPeriod: "Seconds", periods: 60 }, ok: true, windowSeconds: 60, ratePerMinute: 1, ratePerHour: 60 },
  { id: "one-per-minute-minutes", input: { number: 1, perPeriod: "Minutes", periods: 1 }, ok: true, windowSeconds: 60, ratePerMinute: 1 },
  { id: "fifteen-per-sec-burst3", input: { number: 15, perPeriod: "Seconds", periods: 1, burstMultiplier: 3 }, ok: true, windowSeconds: 1, ratePerSecond: 15, burstCeiling: 45 },
  { id: "five-per-two-sec", input: { number: 5, perPeriod: "Seconds", periods: 2 }, ok: true, windowSeconds: 2, ratePerSecond: 2.5 },
  { id: "hundred-per-hour", input: { number: 100, perPeriod: "Hours", periods: 1 }, ok: true, windowSeconds: 3600, ratePerHour: 100 },
  { id: "block-30s", input: { number: 20, perPeriod: "Seconds", periods: 1, mitigation: "Block", lockoutValue: 30, lockoutUnit: "Seconds" }, ok: true, lockoutSeconds: 30, mitigation: "Block" },
  { id: "disabled-not-bypass", input: { number: 40, perPeriod: "Seconds", periods: 1, mitigation: "Disabled" }, ok: true, mitigation: "Disabled" },
  { id: "lockout-over-48h", input: { number: 10, perPeriod: "Seconds", periods: 1, mitigation: "Block", lockoutValue: 50, lockoutUnit: "Hours" }, ok: true, lockoutSeconds: 180000, lockoutExceedsMax: true },
  { id: "reject-zero-number", input: { number: 0, perPeriod: "Seconds", periods: 1 }, ok: false, errorIncludes: "at least 1" },
  { id: "reject-block-no-lockout", input: { number: 10, perPeriod: "Seconds", periods: 1, mitigation: "Block" }, ok: false, errorIncludes: "lockout duration" },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  for (const v of VECTORS) {
    const r = calculateRateLimit(v.input);
    const e: string[] = [];
    if (r.ok !== v.ok) e.push(`ok: got ${r.ok} want ${v.ok}`);
    if (v.windowSeconds !== undefined && r.windowSeconds !== v.windowSeconds) e.push(`windowSeconds: got ${r.windowSeconds} want ${v.windowSeconds}`);
    if (v.ratePerSecond !== undefined && r.ratePerSecond !== v.ratePerSecond) e.push(`ratePerSecond: got ${r.ratePerSecond} want ${v.ratePerSecond}`);
    if (v.ratePerMinute !== undefined && r.ratePerMinute !== v.ratePerMinute) e.push(`ratePerMinute: got ${r.ratePerMinute} want ${v.ratePerMinute}`);
    if (v.ratePerHour !== undefined && r.ratePerHour !== v.ratePerHour) e.push(`ratePerHour: got ${r.ratePerHour} want ${v.ratePerHour}`);
    if (v.burstCeiling !== undefined && r.burstCeiling !== v.burstCeiling) e.push(`burstCeiling: got ${r.burstCeiling} want ${v.burstCeiling}`);
    if (v.lockoutSeconds !== undefined && r.lockoutSeconds !== v.lockoutSeconds) e.push(`lockoutSeconds: got ${r.lockoutSeconds} want ${v.lockoutSeconds}`);
    if (v.lockoutExceedsMax !== undefined && r.lockoutExceedsMax !== v.lockoutExceedsMax) e.push(`lockoutExceedsMax: got ${r.lockoutExceedsMax} want ${v.lockoutExceedsMax}`);
    if (v.mitigation !== undefined && r.mitigation !== v.mitigation) e.push(`mitigation: got ${r.mitigation} want ${v.mitigation}`);
    if (v.errorIncludes !== undefined && !(r.error ?? "").includes(v.errorIncludes)) e.push(`error missing ${JSON.stringify(v.errorIncludes)}`);
    if (e.length) failures.push(`[${v.id}] ${e.join("; ")}`);
    else passed++;
  }
  return { passed, failed: failures.length, failures };
}

export const goldenVectors = VECTORS.map((v) => v.id);
