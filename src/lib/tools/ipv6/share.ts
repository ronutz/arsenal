// ============================================================================
// src/lib/tools/ipv6/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the IPv6 toolkit (posture "input"): a link
// carries the address field as typed, after the "#" (#input=...), and nothing
// else. The manifest calls an address publishable (shareSafetyDefault "safe"),
// so the popover shows the standard warning only.
//
// Arrival (useShareArrival in Ipv6Tool): the text fills the field as a paste
// would and the page decodes it. Any non-blank text is accepted here and the
// page refuses it with its own message if it is not an address, exactly as a
// paste would be refused; a blank value is ignored.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the address field as typed. */
export interface Ipv6ShareState {
  /** The text in the address field. */
  input: string;
}

/** The spec. */
export const IPV6_SHARE: ShareSpec<Ipv6ShareState> = Object.freeze({
  tool: "ipv6", // the slug
  posture: "input", // the input as typed, with the standard warning
  carriesKey: "share.carries", // tools.ipv6.share.carries
  names: ["input"], // #input=
  /** The field as typed, or nothing while it is blank. */
  encode(state: Ipv6ShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value
  },
  /** Any non-blank text: the page reads it as a paste (and refuses it there, with the reason, if it is not an address). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
