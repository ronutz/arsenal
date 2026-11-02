// ============================================================================
// src/lib/tools/f5-awaf-evasion-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 Advanced WAF evasion-technique
// explainer (posture "input-caution", raised from "input" on 2026-10-27): a
// link carries the box as typed, once the page has an answer for it:
//   - a keyword ("evasions") or a sub-violation name opens its reference
//     cards; nothing in it names the reader's site, so no caution line;
//   - a pasted evasions block or whole declarative policy opens the
//     read-back. The manifest says "a whole policy can carry internal
//     names", so the popover adds a caution line, and the AWAF policy
//     explainer's secrets check reads the box first (a credential blocks the
//     link, a secret-looking name or a webhook URL is named in the caution).
// A name the page does not know and JSON it cannot parse get no link (there
// is no answer to share).
//
// Arrival: the box fills as a paste would, and the page reads it as usual.
// Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { explainEvasions, type EvasionResult } from "./compute"; // the page's own reading
import { checkAwafPolicyText } from "../f5-awaf-declarative-policy-explainer/share"; // the AWAF policy secrets check (with the webhook rule)
import { encodeCheckedBox, type ShareSecretReport } from "../../share/text-secrets"; // the family's encoding after the check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface EvasionShareState {
  /** The box as typed. */
  input: string;
}

/**
 * Whether the page has an answer to share: reference cards, or a policy read-back that parsed.
 * @param r the page's reading (null for a blank box)
 * @returns true when a link may be offered
 */
export function evasionHasAnswer(r: EvasionResult | null): boolean {
  if (!r) return false; // a blank box
  if (r.mode === "reference") return r.cards.length > 0; // a known name or the keyword; a miss has no answer
  return !r.notes.some((n) => n.kind === "parse-error"); // a policy that parsed (with or without an evasions block)
} // evasionHasAnswer

/**
 * Encode from what the page already computed (its reading, and the check's report when the box holds a policy).
 * @param s the state
 * @param r the page's reading
 * @param report the secrets check's report on the box (only consulted for a policy)
 * @returns the box, nothing, or blocked
 */
export function encodeEvasionShare(s: EvasionShareState, r: EvasionResult | null, report: ShareSecretReport | null): ShareEncoding {
  if (!evasionHasAnswer(r)) return { ok: false, reason: "empty" }; // nothing to share
  if (r!.mode === "reference" || !report) return { ok: true, params: { input: s.input } }; // a keyword or a name: as typed
  return encodeCheckedBox(s.input, report); // a policy: blocked by a credential, or as pasted
} // encodeEvasionShare

/** The spec. */
export const EVASION_SHARE: ShareSpec<EvasionShareState> = Object.freeze({
  tool: "f5-awaf-evasion-explainer", // the slug
  posture: "input-caution", // the box as typed; a pasted policy gets the caution line and the check
  carriesKey: "share.carries", // tools.f5-awaf-evasion-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: EvasionShareState): ShareEncoding {
    const r = explainEvasions(s.input); // the reading
    return encodeEvasionShare(s, r, r && r.mode === "policy" ? checkAwafPolicyText(s.input) : null); // checked when it is a policy
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): EvasionShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
