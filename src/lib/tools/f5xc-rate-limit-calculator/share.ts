// ============================================================================
// src/lib/tools/f5xc-rate-limit-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC rate-limit calculator (posture
// "input", as the inventory gives it: the manifest's "param"). A form with
// nothing to paste (ROLLOUT 11.3): a link carries every field of the
// rate limiter, always, as the calculation reads it, once the page shows a
// result (2026-11-01, wave 4B). The numbers name no system or person.
//
// Names: `number`, `per` (Seconds, Minutes, Hours), `periods`, `burst`,
// `mitigation` (Disabled, Block), `lockout` and `unit` (Seconds, Minutes,
// Hours). Every field is written every time, so an old link keeps its
// meaning if a default changes (the brief of 01/11). Numbers are written as
// the calculation reads them (Number() of the field, an empty burst as 1, an
// empty lockout as 0), so the receiver's result equals the sender's. A
// number the page would refuse, an unknown unit or a missing field makes the
// link malformed.
//
// Arrival: the fields are set as if typed; the result follows.
// ============================================================================

import { calculateRateLimit, type DurationUnit, type Mitigation, type PerPeriod } from "./compute"; // the page's own calculation
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The units, by their stable ids (the select options' values). */
const UNITS: readonly PerPeriod[] = Object.freeze(["Seconds", "Minutes", "Hours"]); // PerPeriod and DurationUnit share them
/** The mitigations, by their stable ids. */
const MITIGATIONS: readonly Mitigation[] = Object.freeze(["Disabled", "Block"]); // the select's values

/** The form, as the page holds it (the number fields as typed). */
export interface RateLimitShareState {
  /** Number (requests in the window). */
  number: string;
  /** Per Period. */
  per: PerPeriod;
  /** Periods. */
  periods: string;
  /** Burst Multiplier ("" reads as 1). */
  burst: string;
  /** Mitigation. */
  mitigation: Mitigation;
  /** The lockout value (read only when the mitigation is Block). */
  lockout: string;
  /** The lockout unit. */
  unit: DurationUnit;
}

/** A number as a link writes it (String() of a finite number): a sign, digits, a fraction, the exponent form of a huge or tiny one. */
const NUMBER_RE = /^-?\d{1,30}(?:\.\d{1,30})?(?:e[+-]\d{1,3})?$/; // bounded; the calculation then refuses what the page refuses

/**
 * The page's result for a form, as the component computes it.
 * @param s the form
 * @returns the result, or null when a required field is blank
 */
export function rateLimitResult(s: RateLimitShareState) {
  if (s.number.trim() === "" || s.periods.trim() === "") return null; // the page shows nothing
  return calculateRateLimit({ number: Number(s.number), perPeriod: s.per, periods: Number(s.periods), burstMultiplier: s.burst.trim() === "" ? 1 : Number(s.burst), mitigation: s.mitigation, lockoutValue: s.mitigation === "Block" ? Number(s.lockout) : undefined, lockoutUnit: s.unit }); // as the component calls it
} // rateLimitResult

/** The spec. */
export const RATE_LIMIT_SHARE: ShareSpec<RateLimitShareState> = Object.freeze({
  tool: "f5xc-rate-limit-calculator", // the slug
  posture: "input", // numbers and choices only
  carriesKey: "share.carries", // tools.f5xc-rate-limit-calculator.share.carries
  names: ["number", "per", "periods", "burst", "mitigation", "lockout", "unit"], // a form: no input
  /** Every field, as the calculation reads it, once the page shows a result. */
  encode(s: RateLimitShareState): ShareEncoding {
    const r = rateLimitResult(s); // the page's result
    if (!r || !r.ok) return { ok: false, reason: "empty" }; // no result (blank or refused): the button is disabled
    const num = (v: string, blank: number) => String(v.trim() === "" ? blank : Number(v)); // as read
    return { ok: true, params: { number: num(s.number, 0), per: s.per, periods: num(s.periods, 0), burst: num(s.burst, 1), mitigation: s.mitigation, lockout: num(s.lockout, 0), unit: s.unit } }; // every field
  },
  /** Every field, each well formed and within what the page accepts. */
  decode(v: Readonly<Record<string, string | null>>): RateLimitShareState | null {
    for (const n of ["number", "periods", "burst", "lockout"]) { const x = v[n]; if (typeof x !== "string" || !NUMBER_RE.test(x) || !Number.isFinite(Number(x))) return null; } // numbers
    if (!(UNITS as readonly string[]).includes(v.per ?? "") || !(UNITS as readonly string[]).includes(v.unit ?? "") || !(MITIGATIONS as readonly string[]).includes(v.mitigation ?? "")) return null; // choices
    const s: RateLimitShareState = { number: v.number as string, per: v.per as PerPeriod, periods: v.periods as string, burst: v.burst as string, mitigation: v.mitigation as Mitigation, lockout: v.lockout as string, unit: v.unit as DurationUnit }; // the form
    const r = rateLimitResult(s); // what the page would show
    return r && r.ok ? s : null; // a form encode never writes (a number under 1, a Block without a lockout) is malformed
  },
});
