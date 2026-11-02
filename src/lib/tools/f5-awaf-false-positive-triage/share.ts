// ============================================================================
// src/lib/tools/f5-awaf-false-positive-triage/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the AWAF false-positive triage (posture
// "input": three choices from the page's own lists, nothing of the reader's
// site). The tool is a form with nothing to paste, so a link carries named
// values only, no "input" (ROLLOUT 11.3), and it carries all three, so a
// link keeps opening the same triage even if the page's starting choices
// change later:
//   category  the violation category, by the engine's id (attack-signature,
//             meta-char, parameter, url, file-type, length,
//             file-upload-signature, xml-json-signature, cookie,
//             http-compliance)
//   rating    the average violation rating, 1 to 5
//   state     enforced-blocking, staged or transparent
//
// Arrival: the three choices are set and the page computes as it does on a
// change. An unknown category or state, or a rating outside 1 to 5, makes
// the whole share malformed: ignored.
// ============================================================================

import { CATEGORIES, DEFAULTS, type EnforcementState, type FpInput, type ViolationCategory, type ViolationRating } from "./compute"; // the form's shape, lists and starting values
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The enforcement states the form offers (the page's own list). */
export const FP_STATES: readonly EnforcementState[] = Object.freeze(["enforced-blocking", "staged", "transparent"] as EnforcementState[]); // the select's options

/** The spec. */
export const FP_TRIAGE_SHARE: ShareSpec<FpInput> = Object.freeze({
  tool: "f5-awaf-false-positive-triage", // the slug
  posture: "input", // three choices
  carriesKey: "share.carries", // tools.f5-awaf-false-positive-triage.share.carries
  names: ["category", "rating", "state"], // a form: no "input"
  /** All three choices: there is always a triage to share. */
  encode(s: FpInput): ShareEncoding {
    return { ok: true, params: { category: s.category, rating: String(s.violationRating), state: s.enforcementState } }; // by stable id
  },
  /** The three choices, each one the page lists; a choice the link lacks takes the starting value. */
  decode(v: Readonly<Record<string, string | null>>): FpInput | null {
    const category = v.category ?? DEFAULTS.category; // the category
    if (!(CATEGORIES as readonly string[]).includes(category)) return null; // one the page does not list
    const rating = v.rating ?? String(DEFAULTS.violationRating); // the rating
    if (!/^[1-5]$/.test(rating)) return null; // 1 to 5
    const state = v.state ?? DEFAULTS.enforcementState; // the state
    if (!(FP_STATES as readonly string[]).includes(state)) return null; // one the page does not list
    return { category: category as ViolationCategory, violationRating: Number(rating) as ViolationRating, enforcementState: state as EnforcementState }; // the form
  },
});
