// ============================================================================
// src/lib/tools/uuid/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the UUID tool (posture "input"; the manifest's
// shareSafetyDefault is "safe"). A link carries the UUID typed in the Inspect
// box, which the page reads back (version, variant, a v7's timestamp). The
// generated list is not carried: each UUID is drawn from the reader's own
// random source, and whoever opens the link presses Generate for theirs.
//
// Arrival: the value fills the Inspect box as a paste would, and the page
// reads it. Any non-blank text is accepted, exactly as a paste is (a value
// that is not a UUID shows "Invalid", as it would when typed).
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the Inspect box (as typed when encoding, the link's text on arrival). */
export interface UuidShareState {
  /** The value to inspect. */
  input: string;
}

/** The spec. */
export const UUID_SHARE: ShareSpec<UuidShareState> = Object.freeze({
  tool: "uuid", // the slug
  posture: "input", // a UUID names nothing of the reader's
  carriesKey: "share.carries", // tools.uuid.share.carries
  names: ["input"], // #input=
  /** The Inspect box, or nothing while it is blank (the page shows no reading then). */
  encode(s: UuidShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing to inspect: the button is disabled
    return { ok: true, params: { input: s.input } }; // the value as typed
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): UuidShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
