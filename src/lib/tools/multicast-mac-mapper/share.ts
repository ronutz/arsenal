// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/multicast-mac-mapper/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the multicast group <-> MAC mapper (posture
// "input"; the manifest's shareSafetyDefault "safe": a multicast group or a
// group MAC names a group, never a host or a person). A link carries the field
// as typed, after the "#" (#input=...), and nothing else, and only while the
// page shows a reading: an input the engine refuses (a unicast address among
// them) gets no link.
//
// Arrival (useShareArrival in MulticastMacMapperTool): the text fills the field
// as a paste would and the page maps it. Any non-blank single line within the
// tool's bound is accepted here and left to the engine, which refuses a
// malformed value with its own message exactly as a paste would be refused; a
// blank value, a value over two lines or one longer than the bound is ignored.
// ============================================================================

import { run, MAX_INPUT } from "./compute"; // the page's own engine, to know whether there is a reading
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state a share carries: the field as typed. */
export interface MulticastMacShareState {
  /** The text in the field. */
  input: string;
}

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param computed whether the page has a reading (false while blank or refused)
 * @returns the field, or nothing
 */
export function encodeMulticastMacShare(s: MulticastMacShareState, computed: boolean): ShareEncoding {
  if (!computed || s.input.trim() === "") return { ok: false, reason: "empty" }; // no reading: nothing to share
  return { ok: true, params: { input: s.input } }; // the one value
} // encodeMulticastMacShare

/** The spec. */
export const MULTICAST_MAC_SHARE: ShareSpec<MulticastMacShareState> = Object.freeze({
  tool: "multicast-mac-mapper", // the slug
  posture: "input", // the input as typed, with the standard warning
  carriesKey: "share.carries", // tools.multicast-mac-mapper.share.carries
  names: ["input"], // #input=
  /** The field, once the engine reads it (the spec asks the engine itself). */
  encode(s: MulticastMacShareState): ShareEncoding {
    let computed = false; // whether the engine reads the field
    try { computed = !!run(s.input); } catch { computed = false; } // the engine throws on what it refuses
    return encodeMulticastMacShare(s, computed); // encoded
  },
  /** Any non-blank single line within the bound: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): MulticastMacShareState | null {
    const input = v.input; // the arriving value
    if (!input || input.trim() === "") return null; // nothing to fill
    if (/[\r\n]/.test(input) || input.trim().length > MAX_INPUT) return null; // not one address on one line
    return { input }; // as typed
  },
});
