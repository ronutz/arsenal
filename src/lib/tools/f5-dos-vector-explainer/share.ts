// ============================================================================
// src/lib/tools/f5-dos-vector-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the AFM DoS-vector explainer (posture
// "input-caution", raised from "input" on 2026-10-27): a link carries the box
// as typed (security dos device-config or profile stanzas, a vector name, or
// "vectors"), after the "#", and nothing else. The manifest's own comment on
// its "fragment" default says "DoS thresholds describe a defense posture": the
// numbers show what the protections let through, so the popover adds the
// tool's caution line (tools.f5-dos-vector-explainer.share.caution). The
// inventory's mapping looked only for identifying or secret words there.
//
// A paste can hold more than this tool reads: it skips every stanza it does not
// explain, so a whole configuration file still gets a reading. While the paste
// holds a secret setting (a monitor's password, an Authorization header in a
// send string: findTmshSecret, tmsh-secrets.ts) there is no link, and the
// popover names the setting (code "secret", share.blocked).
//
// Arrival (useShareArrival in the component): the text fills the box as a
// paste would and the page reads it. This tool explains protections and never
// generates traffic; nothing is sent anywhere. Any non-blank text is accepted,
// exactly as a paste is: text the tool cannot read gets the page's own message.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { findTmshSecret } from "../f5-gslb-decision-flow/tmsh-secrets"; // the family's secret guard for pasted tmsh text

/** The state a share carries: the box as typed. */
export interface DosVectorShareState {
  /** The paste. */
  input: string;
}

/** The spec. */
export const DOS_VECTOR_SHARE: ShareSpec<DosVectorShareState> = Object.freeze({
  tool: "f5-dos-vector-explainer", // the slug
  posture: "input-caution", // the paste as typed, with the standard warning and a caution line
  carriesKey: "share.carries", // tools.f5-dos-vector-explainer.share.carries
  names: ["input"], // #input=
  /** The paste; nothing while the box is blank; no link while it holds a secret setting. */
  encode(state: DosVectorShareState): ShareEncoding {
    if (state.input.trim() === "") return { ok: false, reason: "empty" }; // nothing to share: the button is disabled
    const secret = findTmshSecret(state.input); // a password, a passphrase, an Authorization header...
    if (secret !== null) return { ok: false, reason: "blocked", code: "secret", values: { name: secret } }; // no link; the popover names it
    return { ok: true, params: { input: state.input } }; // the one value
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(values: Readonly<Record<string, string | null>>): DosVectorShareState | null {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
