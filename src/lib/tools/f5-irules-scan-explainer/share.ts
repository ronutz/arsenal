// ============================================================================
// src/lib/tools/f5-irules-scan-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iRules scan explainer (posture "input"): a
// link carries the three fields as typed, each left out when empty:
//
//   input   the value to take apart (#input=, the text a reader would paste)
//   format  the scan format
//   vars    the variable names (empty: inline mode, scan returns a list)
//
// A value taken apart with scan (a time, a version, a header value) is shown
// whole on the page; the standard warning says that anyone with the link can
// read it.
//
// Arrival: the fields fill as typing would (one the link does not carry is
// emptied, as the sender had it), and the page explains the scan. Any text is
// accepted, as typing is: the page shows Tcl's own error for a bad format.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the three fields. */
export interface ScanExplainerShareState {
  /** The value to take apart. */
  input: string;
  /** The scan format. */
  format: string;
  /** The variable names. */
  vars: string;
}

/** The spec. */
export const IRULES_SCAN_EXPLAINER_SHARE: ShareSpec<ScanExplainerShareState> = Object.freeze({
  tool: "f5-irules-scan-explainer", // the slug
  posture: "input", // the fields as typed
  carriesKey: "share.carries", // tools.f5-irules-scan-explainer.share.carries
  names: ["input", "format", "vars"], // #input=12:34:56&format=%d:%d:%d&vars=h m s
  /** The non-empty fields; nothing while all three are empty. */
  encode(s: ScanExplainerShareState): ShareEncoding {
    const p: Record<string, string> = {}; // the values
    if (s.input !== "") p.input = s.input; // the value
    if (s.format !== "") p.format = s.format; // the format
    if (s.vars !== "") p.vars = s.vars; // the names
    return Object.keys(p).length === 0 ? ({ ok: false, reason: "empty" } as const) : ({ ok: true, params: p } as const); // nothing typed, or the fields
  },
  /** At least one non-empty field; an absent one is empty. */
  decode(v: Readonly<Record<string, string | null>>): ScanExplainerShareState | null {
    const s = { input: v.input ?? "", format: v.format ?? "", vars: v.vars ?? "" }; // absent fields empty
    return s.input === "" && s.format === "" && s.vars === "" ? null : s; // nothing to fill, or the fields
  },
});
