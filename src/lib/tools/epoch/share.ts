// ============================================================================
// src/lib/tools/epoch/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Unix time converter (posture "input": the manifest
// declares no share default, and the input, a timestamp or a date, names nothing of the
// reader's). A link carries the box as typed, once the page has a reading of
// it; an input the page refuses has no reading to share.
//
// Arrival: The value fills the box as a paste would, and the page converts it. The relative line ("in 3 days") is worked out from the opener's own clock, as for a paste. Any non-blank text is accepted, exactly as a
// paste is (a value the page refuses shows its error, as for a paste).
// ============================================================================

import { analyzeEpoch } from "./compute"; // the page's own engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (as typed when encoding, the link's text on arrival). */
export interface EpochShareState {
  /** The box as typed. */
  input: string;
}

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param read whether the page read the box (false while it is blank or refused)
 * @returns the box as typed, or nothing
 */
export function encodeEpochShare(s: EpochShareState, read: boolean): ShareEncoding {
  if (s.input.trim() === "" || !read) return { ok: false, reason: "empty" }; // no reading: nothing to share
  return { ok: true, params: { input: s.input } }; // the box as typed
} // encodeEpochShare

/** The spec. */
export const EPOCH_SHARE: ShareSpec<EpochShareState> = Object.freeze({
  tool: "epoch", // the slug
  posture: "input", // names nothing of the reader's
  carriesKey: "share.carries", // tools.epoch.share.carries
  names: ["input"], // #input=
  /** The box, or nothing (the spec reads it itself, as the page does: trimmed). */
  encode(s: EpochShareState): ShareEncoding {
    let read = false; // whether the engine reads it
    try { read = s.input.trim() !== "" && !!analyzeEpoch(s.input.trim()); } catch { read = false; } // the engine throws on what it refuses
    return encodeEpochShare(s, read); // encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): EpochShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
