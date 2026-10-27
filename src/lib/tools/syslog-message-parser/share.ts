// ============================================================================
// src/lib/tools/syslog-message-parser/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the syslog message parser (posture
// "input-caution"): a link carries the message as pasted, after the "#", and
// nothing else. The manifest says "a log line may carry hostnames and user
// names; the reader decides" (shareSafetyDefault "ask"), so the popover adds
// the tool's own caution line to the standard warning.
//
// Arrival (useShareArrival in SyslogMessageParserTool): the text replaces the
// box as a paste would (the page opens on the Example; an arrival replaces it)
// and the page reads it. Any non-blank text is accepted: the parser reads
// anything and says what it found, as it does for a paste.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the box as pasted. */
export interface SyslogMessageShareState {
  /** The message or frame text. */
  input: string;
}

/** The spec. */
export const SYSLOG_MESSAGE_SHARE: ShareSpec<SyslogMessageShareState> = Object.freeze({
  tool: "syslog-message-parser", // the slug
  posture: "input-caution", // the paste as typed, with the standard warning and a caution line
  carriesKey: "share.carries", // tools.syslog-message-parser.share.carries
  names: ["input"], // #input=
  /** The paste, or nothing while the box is blank. */
  encode(state: SyslogMessageShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
