// ============================================================================
// src/lib/tools/f5-awaf-learning-poisoning-estimator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Automatic-learning poisoning estimator
// (posture "input": the manifest says the "inputs are generic thresholds,
// not secrets"). The tool is a form with nothing to paste, so a link carries
// named values only, no "input" (ROLLOUT 11.3), and it carries every field,
// defaults included, so a link keeps opening the same estimate even if the
// page's starting values (F5's documented defaults) are revised later:
//   mode       automatic, manual or disabled (Learning Mode)
//   untrusted  1 or 0: loosen from untrusted traffic too
//   trusted    1 or 0: the attacker's sources are in the Trusted IP list
//   rating     1 to 5: the manipulation's violation rating
//   usources   untrusted different sources        (1 to 1,000,000,000)
//   usessions  untrusted different sessions       (1 to 1,000,000,000)
//   tsessions  trusted different sessions         (1 to 1,000,000,000)
//   spread     time spread in hours               (0 to 8,760)
//   factor     rating slowdown factor             (1 to 1,000)
//   asources   the attacker's distinct sources    (1 to 10,000,000)
//   rate       requests per source per hour       (1 to 1,000,000)
// Each number goes as the engine reads it: clamped to the engine's bounds
// (BOUNDS in compute.ts, repeated below), and rounded where the engine rounds
// (the sources and sessions), so the estimate a link opens is the sender's
// even when a field held a value outside them. Plain decimals only.
//
// Arrival: the whole form is set from the link (a field it lacks takes the
// page's starting value), and the page computes as it does on a change.
// An unknown mode, a switch other than 1 or 0, a rating outside 1 to 5 or a
// number outside its bounds makes the whole share malformed: ignored.
// ============================================================================

import { DEFAULTS, type LearningMode, type PoisoningInput, type ViolationRating } from "./compute"; // the form's shape and starting values
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The Learning Modes the form offers. */
const MODES: readonly LearningMode[] = ["automatic", "manual", "disabled"]; // the select's options

/** One numeric field: its link name, its key in the form, the engine's bounds, and whether the engine rounds it. */
interface NumField {
  /** The link name. */
  name: string;
  /** The form's key. */
  key: "untrustedDifferentSources" | "untrustedDifferentSessions" | "trustedDifferentSessions" | "timeSpreadHours" | "ratingSlowdownFactor" | "attackerDistinctSources" | "requestsPerSourcePerHour";
  /** The engine's lower bound. */
  min: number;
  /** The engine's upper bound. */
  max: number;
  /** True when the engine rounds it to a whole number (Math.round). */
  round: boolean;
}

/** The numeric fields, with the engine's BOUNDS (compute.ts, read 2026-10-27) and its rounding. */
export const POISONING_NUM_FIELDS: readonly NumField[] = Object.freeze([
  { name: "usources", key: "untrustedDifferentSources", min: 1, max: 1_000_000_000, round: true }, // BOUNDS.sources
  { name: "usessions", key: "untrustedDifferentSessions", min: 1, max: 1_000_000_000, round: true }, // BOUNDS.sessions
  { name: "tsessions", key: "trustedDifferentSessions", min: 1, max: 1_000_000_000, round: true }, // BOUNDS.sessions
  { name: "spread", key: "timeSpreadHours", min: 0, max: 8760, round: false }, // BOUNDS.timeHours
  { name: "factor", key: "ratingSlowdownFactor", min: 1, max: 1000, round: false }, // BOUNDS.ratingFactor
  { name: "asources", key: "attackerDistinctSources", min: 1, max: 10_000_000, round: true }, // BOUNDS.attackerSources
  { name: "rate", key: "requestsPerSourcePerHour", min: 1, max: 1_000_000, round: false }, // BOUNDS.rate
] as const);

/** A plain decimal: digits, optionally a point and up to twelve more digits (no sign, no exponent). */
const DECIMAL = /^\d{1,10}(?:\.\d{1,12})?$/; // anchored, bounded

/**
 * A number as the engine reads it, written as a plain decimal.
 * @param n the field's value
 * @param f the field
 * @returns the decimal text
 */
function asEngineReads(n: number, f: NumField): string {
  const c = Number.isFinite(n) ? Math.min(f.max, Math.max(f.min, n)) : f.min; // clamp() in compute.ts: a non-finite value reads as the minimum
  const v = f.round ? Math.round(c) : c; // rounded where the engine rounds
  const s = String(v); // its shortest decimal form
  return DECIMAL.test(s) ? s : String(Number(v.toFixed(12))); // within the bounds a value never needs an exponent; more than twelve decimals are cut
} // asEngineReads

/** The spec. */
export const POISONING_SHARE: ShareSpec<PoisoningInput> = Object.freeze({
  tool: "f5-awaf-learning-poisoning-estimator", // the slug
  posture: "input", // thresholds and counts, nothing of the reader's site
  carriesKey: "share.carries", // tools.f5-awaf-learning-poisoning-estimator.share.carries
  names: ["mode", "untrusted", "trusted", "rating", "usources", "usessions", "tsessions", "spread", "factor", "asources", "rate"], // a form: no "input"
  /** Every field, as the engine reads it: there is always an estimate to share. */
  encode(s: PoisoningInput): ShareEncoding {
    const p: Record<string, string> = { mode: s.learningMode, untrusted: s.loosenFromUntrustedTraffic ? "1" : "0", trusted: s.attackerIsTrusted ? "1" : "0", rating: String(s.targetViolationRating) }; // the choices
    for (const f of POISONING_NUM_FIELDS) p[f.name] = asEngineReads(s[f.key], f); // the numbers
    return { ok: true, params: p }; // the form
  },
  /** The form, validated: each value carried must be one the form can hold within the engine's bounds. */
  decode(v: Readonly<Record<string, string | null>>): PoisoningInput | null {
    const out: PoisoningInput = { ...DEFAULTS }; // a field the link lacks takes the starting value
    if (v.mode != null) { if (!(MODES as readonly string[]).includes(v.mode)) return null; out.learningMode = v.mode as LearningMode; } // a known mode
    if (v.untrusted != null) { if (v.untrusted !== "1" && v.untrusted !== "0") return null; out.loosenFromUntrustedTraffic = v.untrusted === "1"; } // a switch
    if (v.trusted != null) { if (v.trusted !== "1" && v.trusted !== "0") return null; out.attackerIsTrusted = v.trusted === "1"; } // a switch
    if (v.rating != null) { if (!/^[1-5]$/.test(v.rating)) return null; out.targetViolationRating = Number(v.rating) as ViolationRating; } // 1 to 5
    for (const f of POISONING_NUM_FIELDS) { // the numbers
      const raw = v[f.name]; // the value, if carried
      if (raw == null) continue; // the starting value stays
      if (!DECIMAL.test(raw)) return null; // a plain decimal only
      const n = Number(raw); // its value
      if (n < f.min || n > f.max || (f.round && !Number.isInteger(n))) return null; // outside the engine's bounds, or a fraction where it counts
      out[f.key] = n; // set
    } // for
    return out; // the form
  },
});
