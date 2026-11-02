// ============================================================================
// src/lib/tools/log-level-mapper/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the log level mapper (posture "input": the
// manifest's "safe", "a level name carries nothing private"). Two values: the
// logging system, from the page's select, and the level, typed by name or by
// the system's own number (or picked from its rungs or a preset). The link
// carries:
//   input    the level as typed (the text a reader would paste)
//   system   the system, by its stable key
// A share exists once the page places the level (a rung of that system); a
// level it does not recognise shows its own message, so it has nothing to share.
// The preset marker is not carried: it only lights the chip that was pressed.
// Arrival: the system and the level are set and the page maps them.
// ============================================================================

import { LADDERS, run } from "./compute"; // the ladders and the engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The two values. */
export interface LogLevelShareState {
  /** The system's key. */
  system: string;
  /** The level, as typed. */
  level: string;
}

/** The spec. */
export const LOG_LEVEL_SHARE: ShareSpec<LogLevelShareState> = Object.freeze({
  tool: "log-level-mapper", // the slug
  posture: "input", // a system and a level
  carriesKey: "share.carries", // tools.log-level-mapper.share.carries
  names: ["input", "system"], // the level first
  /** Both values, when the page places the level; nothing otherwise. */
  encode(s: LogLevelShareState): ShareEncoding {
    if (!run({ system: s.system, level: s.level }).chosen) return { ok: false, reason: "empty" }; // no rung: nothing to share
    return { ok: true, params: { input: s.level, system: s.system } }; // as typed, by key
  },
  /** The system strictly (a key the select offers, required); the level as typed, one line. */
  decode(v: Readonly<Record<string, string | null>>): LogLevelShareState | null {
    if (!v.system || !LADDERS.some((l) => l.key === v.system)) return null; // a system the page offers
    if (!v.input || /[\r\n]/.test(v.input)) return null; // a level, one line
    return { system: v.system, level: v.input }; // the page says so when the level is not one of the system's
  },
});
