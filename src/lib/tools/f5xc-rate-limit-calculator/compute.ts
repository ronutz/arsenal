// ============================================================================
// src/lib/tools/f5xc-rate-limit-calculator/compute.ts
// ----------------------------------------------------------------------------
// F5 Distributed Cloud (XC) rate-limit calculator. Pure logic. Reproduces F5's
// own rate math and mitigation semantics so you can see exactly what a rate
// limiter will do before you configure it.
//
// Grounded in F5 documentation (live-verified 2026-07-11; sources in manifest):
//   - Rate limiter = Number requests per (Periods x Per-Period). F5's worked
//     equivalence: [1, Seconds, 60] == [1, Minutes, 1] = 1 request/minute.
//   - Burst Multiplier = the maximum burst of requests, as a multiple of the
//     rate (default 1). "15 req/s with 3x burst" allows a 45-request burst.
//   - Enforcement is a leaky bucket returning HTTP 429 on overflow.
//   - Mitigation "Disabled" still returns 429 (it is NOT a bypass); it only
//     omits the extra lockout timer. "Block" adds a lockout the user stays in
//     until the timer expires, even if the bucket drains (max 48h).
//   - Distributed per-RE / per-proxy counting can briefly overshoot (K000157944).
// ============================================================================

export type PerPeriod = "Seconds" | "Minutes" | "Hours";
export type Mitigation = "Disabled" | "Block";
export type DurationUnit = "Seconds" | "Minutes" | "Hours";

export interface RateLimitInput {
  number: number; // total requests allowed in the window
  perPeriod: PerPeriod;
  periods: number; // count of per-period units
  burstMultiplier?: number; // default 1
  mitigation?: Mitigation; // default "Disabled"
  lockoutValue?: number; // only when mitigation === "Block"
  lockoutUnit?: DurationUnit; // only when mitigation === "Block"
}

export interface RateLimitResult {
  ok: boolean;
  error?: string;
  code?: string;
  windowSeconds?: number;
  ratePerSecond?: number;
  ratePerMinute?: number;
  ratePerHour?: number;
  equivalence?: string;
  burstMultiplier?: number;
  burstCeiling?: number;
  mitigation?: Mitigation;
  lockoutSeconds?: number | null;
  lockoutExceedsMax?: boolean;
}

const PER_SECONDS: Record<PerPeriod, number> = { Seconds: 1, Minutes: 60, Hours: 3600 };
const UNIT_SECONDS: Record<DurationUnit, number> = { Seconds: 1, Minutes: 60, Hours: 3600 };
const MAX_LOCKOUT_SECONDS = 48 * 3600; // F5: maximum blocking time is 48 hours

function r4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Format a compact "N requests per window" string, echoing F5's own phrasing. */
function equivalence(n: number, windowSeconds: number): string {
  const plural = n === 1 ? "request" : "requests";
  if (windowSeconds === 1) return `${n} ${plural} per second`;
  if (windowSeconds === 60) return `${n} ${plural} per 60 seconds (= ${n} per minute)`;
  if (windowSeconds === 3600) return `${n} ${plural} per 3600 seconds (= ${n} per hour)`;
  return `${n} ${plural} per ${windowSeconds} seconds`;
}

export function calculateRateLimit(input: RateLimitInput): RateLimitResult {
  const { number, perPeriod, periods } = input;
  const burstMultiplier = input.burstMultiplier ?? 1;
  const mitigation = input.mitigation ?? "Disabled";

  // -- validate --
  if (!Number.isFinite(number) || number < 1) return { ok: false, error: "Number must be an integer of at least 1.", code: "min-number" };
  if (!Number.isFinite(periods) || periods < 1) return { ok: false, error: "Periods must be an integer of at least 1.", code: "min-periods" };
  if (!(perPeriod in PER_SECONDS)) return { ok: false, error: "Per Period must be Seconds, Minutes, or Hours.", code: "per-period" };
  if (!Number.isFinite(burstMultiplier) || burstMultiplier < 1) return { ok: false, error: "Burst Multiplier must be at least 1 (default 1).", code: "min-burst" };

  const windowSeconds = periods * PER_SECONDS[perPeriod];
  const ratePerSecond = number / windowSeconds;

  // -- mitigation / lockout --
  let lockoutSeconds: number | null = null;
  let lockoutExceedsMax = false;
  if (mitigation === "Block") {
    const lv = input.lockoutValue;
    const lu = input.lockoutUnit ?? "Seconds";
    if (!Number.isFinite(lv as number) || (lv as number) < 1) {
      return { ok: false, error: "Block mitigation needs a lockout duration of at least 1.", code: "block-lockout" };
    }
    lockoutSeconds = (lv as number) * UNIT_SECONDS[lu];
    lockoutExceedsMax = lockoutSeconds > MAX_LOCKOUT_SECONDS;
  }

  // The behavior narrative is built by the caller from these structured fields
  // (mitigation, lockoutSeconds, lockoutExceedsMax) so it can be localized.
  return {
    ok: true,
    windowSeconds,
    ratePerSecond: r4(ratePerSecond),
    ratePerMinute: r4(ratePerSecond * 60),
    ratePerHour: r4(ratePerSecond * 3600),
    equivalence: equivalence(number, windowSeconds),
    burstMultiplier,
    burstCeiling: r4(number * burstMultiplier),
    mitigation,
    lockoutSeconds,
    lockoutExceedsMax,
  };
}

export const RATE_LIMIT_MAX_LOCKOUT_SECONDS = MAX_LOCKOUT_SECONDS;
