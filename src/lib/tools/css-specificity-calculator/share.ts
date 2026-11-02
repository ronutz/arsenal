// ============================================================================
// src/lib/tools/css-specificity-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the CSS specificity calculator (posture
// "input", the inventory's: shareSafetyDefault "safe"). A link carries the
// selectors as typed, one per line or a whole stylesheet; the ranking is
// computed from them alone, so the receiving page shows the same table.
//
// Arrival: the selectors replace the box (the page opens on an Example) as a
// paste would, and the page calculates; nothing is sent. Any non-blank text
// is accepted, as a paste is (a selector that does not parse gets the page's
// own message).
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box. */
export interface CssSpecificityShareState {
  /** The selectors as typed. */
  input: string;
}

/** The spec. */
export const CSS_SPECIFICITY_SHARE: ShareSpec<CssSpecificityShareState> = Object.freeze({
  tool: "css-specificity-calculator", // the slug
  posture: "input", // the selectors as typed
  carriesKey: "share.carries", // tools.css-specificity-calculator.share.carries
  names: ["input"], // #input=
  /** The selectors, or nothing while the box is blank. */
  encode(s: CssSpecificityShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } }; // as typed
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): CssSpecificityShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the selectors, or nothing
  },
});
