// ============================================================================
// src/lib/tools/f5os-restconf-path-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5OS RESTCONF path explainer (posture
// "input-caution", raised from "input" on 2026-10-27): a link carries the path
// or address as pasted, after the "#", and nothing else. The page shows a full
// address's host and port first ("Host and port first, because the port is
// the F5OS-specific thing a reader most often needs explained"), and that host
// is a platform's management address, so the popover adds the tool's caution
// line (tools.f5os-restconf-path-explainer.share.caution).
//
// A full address can also hold a password in its userinfo
// (https://admin:secret@host:8888/...). RFC 3986 section 3.2.1 (read
// 2026-10-27): 'Use of the format "user:password" in the userinfo field is
// deprecated', and applications "should not render as clear text any data
// after the first colon". This page would show it as part of the host, so no
// link is offered while the paste holds one (code "password"); the reader
// removes it and presses again. A user name alone (admin@host) is not a
// password and goes, under the caution line.
//
// Arrival (useShareArrival in the component): the text fills the box as a
// paste would and the page decodes it. Nothing is contacted. Any non-blank
// text is accepted, exactly as a paste is.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state a share carries: the box as typed. */
export interface F5osPathShareState {
  /** The paste. */
  input: string;
}

/** A userinfo with something after its first colon, anywhere in the text: "://user:password@". */
const USERINFO_PASSWORD_RE = /:\/\/[^/\s@:]*:[^/\s@]+@/; // each attempt stops at the next "/", "@" or white space: linear

/** The spec. */
export const F5OS_PATH_SHARE: ShareSpec<F5osPathShareState> = Object.freeze({
  tool: "f5os-restconf-path-explainer", // the slug
  posture: "input-caution", // the paste as typed, with the standard warning and a caution line
  carriesKey: "share.carries", // tools.f5os-restconf-path-explainer.share.carries
  names: ["input"], // #input=
  /** The paste; nothing while the box is blank; no link while the address holds a password. */
  encode(state: F5osPathShareState): ShareEncoding {
    if (state.input.trim() === "") return { ok: false, reason: "empty" }; // nothing to share: the button is disabled
    if (USERINFO_PASSWORD_RE.test(state.input)) return { ok: false, reason: "blocked", code: "password" }; // RFC 3986 section 3.2.1
    return { ok: true, params: { input: state.input } }; // the one value
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(values: Readonly<Record<string, string | null>>): F5osPathShareState | null {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
