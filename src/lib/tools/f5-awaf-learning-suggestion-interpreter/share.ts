// ============================================================================
// src/lib/tools/f5-awaf-learning-suggestion-interpreter/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the AWAF learning-suggestion interpreter
// (posture "input": five choices that describe a suggestion, nothing of the
// reader's site). The tool is a form with nothing to paste, so a link carries
// named values only, no "input" (ROLLOUT 11.3), and it carries all five, so a
// link keeps opening the same reading even if the page's starting choices
// change later:
//   action  what accepting the suggestion does, by the engine's id
//           (add-entity, add-meta-char, relax-attribute, disable-violation,
//           disable-signature, remove-wildcard, enforce-entity,
//           specify-attribute)
//   score   the learning score, 0 to 100 (a whole number)
//   rating  the violation rating, 1 to 5, or "na" (none)
//   mode    automatic or manual (Learning Mode)
//   trust   trusted, untrusted or mixed (where the traffic came from)
//
// Arrival: the five choices are set and the page computes as it does on a
// change. An unknown id, a score outside 0 to 100 or a rating other than 1 to
// 5 or "na" makes the whole share malformed: ignored.
// ============================================================================

import { ACTIONS, DEFAULTS, type ActionType, type LearningMode, type Rating, type SourceTrust, type SuggInput } from "./compute"; // the form's shape, lists and starting values
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The Learning Modes the form offers. */
const MODES: readonly LearningMode[] = ["automatic", "manual"]; // the select's options
/** Where the traffic came from, as the form offers it. */
const TRUSTS: readonly SourceTrust[] = ["trusted", "untrusted", "mixed"]; // the select's options

/** The spec. */
export const SUGGESTION_SHARE: ShareSpec<SuggInput> = Object.freeze({
  tool: "f5-awaf-learning-suggestion-interpreter", // the slug
  posture: "input", // five choices
  carriesKey: "share.carries", // tools.f5-awaf-learning-suggestion-interpreter.share.carries
  names: ["action", "score", "rating", "mode", "trust"], // a form: no "input"
  /** All five choices: there is always a reading to share. */
  encode(s: SuggInput): ShareEncoding {
    const score = String(Math.min(100, Math.max(0, Math.round(Number.isFinite(s.learningScore) ? s.learningScore : 0)))); // the slider's whole number
    return { ok: true, params: { action: s.action, score, rating: s.violationRating === null ? "na" : String(s.violationRating), mode: s.mode, trust: s.sourceTrust } }; // by stable id
  },
  /** The five choices, each one the page offers; a choice the link lacks takes the starting value. */
  decode(v: Readonly<Record<string, string | null>>): SuggInput | null {
    const action = v.action ?? DEFAULTS.action; // the action
    if (!(ACTIONS as readonly string[]).includes(action)) return null; // one the page does not list
    const scoreText = v.score ?? String(DEFAULTS.learningScore); // the score
    if (!/^\d{1,3}$/.test(scoreText) || Number(scoreText) > 100) return null; // 0 to 100
    const ratingText = v.rating ?? (DEFAULTS.violationRating === null ? "na" : String(DEFAULTS.violationRating)); // the rating
    if (ratingText !== "na" && !/^[1-5]$/.test(ratingText)) return null; // 1 to 5, or none
    const mode = v.mode ?? DEFAULTS.mode; // the mode
    if (!(MODES as readonly string[]).includes(mode)) return null; // automatic or manual
    const trust = v.trust ?? DEFAULTS.sourceTrust; // the source
    if (!(TRUSTS as readonly string[]).includes(trust)) return null; // trusted, untrusted or mixed
    return { action: action as ActionType, learningScore: Number(scoreText), violationRating: (ratingText === "na" ? null : Number(ratingText)) as Rating, mode: mode as LearningMode, sourceTrust: trust as SourceTrust }; // the form
  },
});
