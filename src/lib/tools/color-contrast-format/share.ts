// ============================================================================
// src/lib/tools/color-contrast-format/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the colour contrast & format tool (posture
// "input", the inventory's: shareSafetyDefault "safe"). A link carries the two
// colours as typed, by the names the page gives the fields: `foreground` and
// `background`. Neither is the one text a reader pastes (the pair is the
// question), so the link has no `input` (ROLLOUT section 1, rule 3: a field
// is named as the reader knows it; section 11.3: named values only). The
// ratio, the levels, every notation and the fixes are computed from the pair
// alone, so the receiving page shows the same reading. Which preset was
// loaded is not carried (it only marks a button).
//
// Arrival: both fields are replaced (the page opens on an Example) as typing
// would fill them, and the page computes; nothing is sent. Any non-blank text
// is accepted in each, as typing is (a colour the page cannot read gets its
// own message, naming the side).
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the two fields. */
export interface ColorContrastShareState {
  /** The foreground colour as typed. */
  foreground: string;
  /** The background colour as typed. */
  background: string;
}

/** The spec. */
export const COLOR_CONTRAST_SHARE: ShareSpec<ColorContrastShareState> = Object.freeze({
  tool: "color-contrast-format", // the slug
  posture: "input", // the pair as typed
  carriesKey: "share.carries", // tools.color-contrast-format.share.carries
  names: ["foreground", "background"], // no "input": a pair, named as the page names the fields
  /** The pair, or nothing while either field is blank (the page has no reading then). */
  encode(s: ColorContrastShareState): ShareEncoding {
    if (s.foreground.trim() === "" || s.background.trim() === "") return { ok: false, reason: "empty" }; // half a pair: the button is disabled
    return { ok: true, params: { foreground: s.foreground, background: s.background } }; // as typed
  },
  /** Both colours, non-blank; one missing makes the share malformed. */
  decode(v: Readonly<Record<string, string | null>>): ColorContrastShareState | null {
    if (!v.foreground || v.foreground.trim() === "") return null; // no foreground
    if (!v.background || v.background.trim() === "") return null; // no background
    return { foreground: v.foreground, background: v.background }; // the pair
  },
});
