// ============================================================================
// src/lib/tools/terminal-stack-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the terminal stack explainer (posture "input",
// the inventory's, kept). The box takes what `tty` printed or a device path
// ("/dev/pts/3", "/dev/ttyS0", "not a tty"): a device name, nothing of who
// uses it. The link carries `input`, the box as typed. The four definitions the
// page always shows are the page itself, not part of a link.
// Arrival: the box is filled as typing would and the page explains it.
// ============================================================================

import { explainDevice } from "./compute"; // the engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state the link carries and an arrival restores: the box. */
export interface TerminalShareState {
  /** The device path or tty output, as typed. */
  input: string;
}


/** The spec. */
export const TERMINAL_SHARE: ShareSpec<TerminalShareState> = Object.freeze({
  tool: "terminal-stack-explainer", // the slug
  posture: "input", // the box as typed
  carriesKey: "share.carries", // tools.terminal-stack-explainer.share.carries
  names: ["input"], // #input=
  /** The box, when the page explains it; nothing otherwise (the button is disabled). */
  encode(s: TerminalShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing typed
    try { explainDevice(s.input); } catch { return { ok: false, reason: "empty" }; } // no answer: nothing to share
    return { ok: true, params: { input: s.input } }; // as typed
  },
  /** Any non-blank text: the page explains it as typing would, and says why when it cannot. */
  decode(v: Readonly<Record<string, string | null>>): TerminalShareState | null {
    if (!v.input || v.input.trim() === "") return null; // nothing
    return { input: v.input }; // the text
  },
});
