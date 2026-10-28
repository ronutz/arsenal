// ============================================================================
// src/lib/tools/f5-packet-filter-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BIG-IP packet-filter explainer (posture
// "input-caution", raised on 2026-10-27 from the inventory's "input"): a link
// carries the stanzas and the optional sim: line as pasted. A packet filter
// holds no secret setting (F5's tmsh reference, net packet-filter, read
// 2026-10-27), but its rules name the networks, hosts and VLANs the device
// accepts or discards traffic from, which is a map of what gets through; the
// manifest marks the tool's subject as a security control (its D-53 review
// entry). So the popover adds the tool's own caution line.
//
// Arrival: the text fills the box as a paste would, and the page walks the
// rules and runs the simulation, as it does on a paste. Any non-empty text
// is accepted, exactly as a paste is.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box. */
export interface PacketFilterShareState {
  /** The stanzas and the sim: line, as pasted. */
  input: string;
}

/** The spec. */
export const PACKET_FILTER_SHARE: ShareSpec<PacketFilterShareState> = Object.freeze({
  tool: "f5-packet-filter-explainer", // the slug
  posture: "input-caution", // the text as pasted, with a caution line
  carriesKey: "share.carries", // tools.f5-packet-filter-explainer.share.carries
  names: ["input"], // #input=
  /** The text, when it holds something. */
  encode(s: PacketFilterShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing pasted: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): PacketFilterShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
