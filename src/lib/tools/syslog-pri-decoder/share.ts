// ============================================================================
// src/lib/tools/syslog-pri-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the syslog PRI decoder and encoder (posture
// "input"): a link carries one PRI, after the "#" (#input=%3C134%3E), and
// nothing else. In Decode mode it is the field as typed; in Encode mode it is
// the PRI the facility and severity make, in its wire form (<134>), so the
// link opens in Decode mode on the same facility and severity (the page's
// handoff carries one string, and a PRI is exactly the pair, losslessly).
//
// Arrival: NOT useShareArrival. SyslogPriDecoderTool already reads #input=
// with usePrefill, which fills the Decode field as a paste would; that arrival
// is kept exactly as it is. encode gives exactly what usePrefill's apply
// accepts (one string), and decode mirrors readHandoff (any non-empty value).
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: one PRI as text. */
export interface SyslogPriShareState {
  /** Decode mode: the field as typed; Encode mode: the computed wire form, for example "<134>". */
  input: string;
}

/** The spec. */
export const SYSLOG_PRI_SHARE: ShareSpec<SyslogPriShareState> = Object.freeze({
  tool: "syslog-pri-decoder", // the slug
  posture: "input", // a PRI is a non-sensitive integer (manifest: shareSafetyDefault "param")
  carriesKey: "share.carries", // tools.syslog-pri-decoder.share.carries (an ICU select on the mode)
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The PRI text, or nothing while there is none. */
  encode(state: SyslogPriShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value usePrefill's apply takes
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill (the page refuses a malformed PRI with its message). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v ? { input: v } : null; // the text, or nothing
  },
});
