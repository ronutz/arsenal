// ============================================================================
// src/lib/tools/cron-expression-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the cron expression explainer (posture "input";
// the manifest: "schedules are non-sensitive"). A link carries the schedule as
// typed, once the page has read it. The page reads only a schedule: five time
// fields or an @macro. A crontab line with its command (where an inline
// password or token would sit) is refused with a field-count error, so it has
// no reading and no link: no command ever travels.
//
// Arrival: the schedule fills the box as a paste would, and the page explains
// it. The next runs are worked out from the opener's own clock, as for a
// paste. Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { run } from "./compute"; // the page's own engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (as typed when encoding, the link's text on arrival). */
export interface CronShareState {
  /** The schedule as typed. */
  input: string;
}

/** A fixed instant for the spec's own check, so encode stays pure (the projection it computes is not used). */
const FROM = "2026-01-01T00:00:00Z"; // any valid instant

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param read whether the page read the schedule (false while blank or refused)
 * @returns the schedule as typed, or nothing
 */
export function encodeCronShare(s: CronShareState, read: boolean): ShareEncoding {
  if (s.input.trim() === "" || !read) return { ok: false, reason: "empty" }; // no reading: nothing to share
  return { ok: true, params: { input: s.input } }; // the schedule as typed
} // encodeCronShare

/** The spec. */
export const CRON_SHARE: ShareSpec<CronShareState> = Object.freeze({
  tool: "cron-expression-explainer", // the slug
  posture: "input", // a schedule
  carriesKey: "share.carries", // tools.cron-expression-explainer.share.carries
  names: ["input"], // #input=
  /** The schedule, or nothing (the spec reads it itself, from a fixed instant). */
  encode(s: CronShareState): ShareEncoding {
    let read = false; // whether the engine reads it
    try { read = s.input.trim() !== "" && !!run(s.input.trim(), { from: FROM, count: 1 }); } catch { read = false; } // the engine throws on what it refuses
    return encodeCronShare(s, read); // encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): CronShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
