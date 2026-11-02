// ============================================================================
// src/lib/tools/extreme-spbm-multicast-mac/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the SPBM multicast B-MAC tool (posture "input",
// the inventory's, kept). The page has two jobs and one answer area:
//   build   a nickname and an I-SID give the multicast B-MAC
//           -> `nickname`, `isid`, as typed
//   decode  a multicast B-MAC from the FIB is taken apart
//           -> `input`, the address as typed (the text a reader would paste)
// The presence of `input` says the job; a link carrying both kinds is
// malformed. Nicknames and I-SIDs are fabric identifiers a reader types to see
// the derivation (the VOSS user guide's own worked example is the Example),
// the same kind of value the VOSS fabric identifier decoder shares as typed;
// nothing in them is secret.
// Arrival: the fields are filled and the page computes, as typing does.
// ============================================================================

import { buildMulticastMac, decodeMulticastMac } from "./compute"; // the engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state the link carries and an arrival restores. */
export type SpbmShareState =
  | { mode: "build"; nickname: string; isid: string } // build an address
  | { mode: "decode"; mac: string }; // take one apart

/** The spec. */
export const SPBM_MAC_SHARE: ShareSpec<SpbmShareState> = Object.freeze({
  tool: "extreme-spbm-multicast-mac", // the slug
  posture: "input", // the fields as typed
  carriesKey: "share.carries", // tools.extreme-spbm-multicast-mac.share.carries
  names: ["input", "nickname", "isid"], // "input" first: the address to decode
  /** The fields of the job the page answered; nothing while it has no answer. */
  encode(s: SpbmShareState): ShareEncoding {
    try {
      if (s.mode === "decode") { if (!s.mac.trim()) return { ok: false, reason: "empty" }; decodeMulticastMac(s.mac); return { ok: true, params: { input: s.mac } }; } // the address
      if (!s.nickname.trim() || !s.isid.trim()) return { ok: false, reason: "empty" }; // both are needed
      buildMulticastMac(s.nickname, s.isid); // the page's answer
      return { ok: true, params: { nickname: s.nickname, isid: s.isid } }; // the two fields
    } catch {
      return { ok: false, reason: "empty" }; // the page shows its error instead
    } // try
  },
  /** One job: the address alone, or the nickname and the I-SID together, each one line, as typed. */
  decode(v: Readonly<Record<string, string | null>>): SpbmShareState | null {
    const lines = [v.input, v.nickname, v.isid].every((x) => x === null || x === undefined || !/[\r\n]/.test(x)); // one-line fields
    if (!lines) return null; // malformed
    if (v.input) return v.nickname || v.isid ? null : { mode: "decode", mac: v.input }; // the address alone
    if (v.nickname && v.isid) return { mode: "build", nickname: v.nickname, isid: v.isid }; // both
    return null; // one without the other
  },
});
