// ============================================================================
// src/lib/tools/bigip-scripted-monitor-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BIG-IP Scripted monitor explainer (posture
// "derived", raised on 2026-10-27 from the inventory's "input-caution"): this
// page never shows a PASS or LOGIN password (rule S15, masked everywhere), so
// a link never carries one. shareableScript() in compute.ts replaces each such
// password, in the script and in the transcript's "C:" lines, with the bullets
// the page shows; the receiving page then reads exactly the sender's result
// (the tool's share vectors compare the two whole). Names: "input" for the
// script (the text a reader pastes) and "transcript" for the optional second
// box. A password written with escape sequences cannot be found as written,
// so no copy is made: blocked, "escaped", with the line. Other credentials,
// such as an SMTP AUTH exchange (RFC 4954), go as typed; the popover says so.
//
// Arrival: both boxes fill as a paste would (a transcript the link does not
// carry is emptied: the sender had none), and the page reads them. Nothing is
// connected to or run. Any non-empty script is accepted, as a paste is.
// ============================================================================

import { shareableScript } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: both boxes (as typed when encoding, the copy on arrival). */
export interface ScriptedMonitorShareState {
  /** The script file's text. */
  script: string;
  /** The server transcript, possibly empty. */
  transcript: string;
}

/** The spec. */
export const SCRIPTED_MONITOR_SHARE: ShareSpec<ScriptedMonitorShareState> = Object.freeze({
  tool: "bigip-scripted-monitor-explainer", // the slug
  posture: "derived", // both boxes with every PASS and LOGIN password as bullets
  carriesKey: "share.carries", // tools.bigip-scripted-monitor-explainer.share.carries
  names: ["input", "transcript"], // the script first
  /** The copy, when the script holds something; blocked when a password cannot be replaced. */
  encode(s: ScriptedMonitorShareState): ShareEncoding {
    if (s.script.trim() === "") return { ok: false, reason: "empty" } as const; // no script: the button is disabled
    const copy = shareableScript({ script: s.script, transcript: s.transcript }); // the copy
    if (!copy.ok) return { ok: false, reason: "blocked", code: "escaped", values: { line: copy.line } } as const; // a password written with escapes
    const params: Record<string, string> = { input: copy.script }; // the script's copy
    if (copy.transcript.trim() !== "") params.transcript = copy.transcript; // the transcript's copy, when there is one
    return { ok: true, params } as const; // the values
  },
  /** A non-empty script, and the transcript or none. */
  decode(v: Readonly<Record<string, string | null>>): ScriptedMonitorShareState | null {
    if (!v.input || v.input.trim() === "") return null; // a share always has a script
    return { script: v.input, transcript: v.transcript ?? "" }; // an absent transcript is an empty one
  },
});
