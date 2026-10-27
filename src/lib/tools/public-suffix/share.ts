// ============================================================================
// src/lib/tools/public-suffix/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the registered domain (eTLD+1) tool (posture
// "input"): a link carries the host name as typed, after the "#"
// (#input=www.blog.example.co.uk), and nothing else. The manifest calls a host
// name not sensitive (shareSafetyDefault "safe"), so the popover shows the
// standard warning only.
//
// Arrival (useShareArrival in PublicSuffixTool): the name fills the field as a
// paste would and the page looks it up. Any non-blank text is accepted here;
// an IP address or a malformed name gets the page's own note, as a paste does.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the host name as typed. */
export interface PublicSuffixShareState {
  /** The text in the host name field. */
  input: string;
}

/** The spec. */
export const PUBLIC_SUFFIX_SHARE: ShareSpec<PublicSuffixShareState> = Object.freeze({
  tool: "public-suffix", // the slug
  posture: "input", // the host name as typed, with the standard warning
  carriesKey: "share.carries", // tools.public-suffix.share.carries
  names: ["input"], // #input=
  /** The name as typed, or nothing while the field is blank. */
  encode(state: PublicSuffixShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value
  },
  /** Any non-blank text: the page reads it as a paste (and answers with its own note if it is not a domain name). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
