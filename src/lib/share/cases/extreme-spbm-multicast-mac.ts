// ============================================================================
// src/lib/share/cases/extreme-spbm-multicast-mac.ts
// ----------------------------------------------------------------------------
// Share cases of the SPBM multicast B-MAC tool (wave 4C, 2026-11-01): build
// carries the nickname and the I-SID, decode carries the address as `input`;
// a link carrying both jobs is malformed. Values are the VOSS user guide's
// worked example (the page's Example and golden vectors).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SPBM_MAC_SHARE, type SpbmShareState } from "../../tools/extreme-spbm-multicast-mac/share"; // the spec

/** The cases. */
export const SPBM_MAC_SHARE_CASES = defineShareCases<SpbmShareState, SpbmShareState>({
  spec: SPBM_MAC_SHARE, // the spec
  accept: [
    { id: "build-example", state: { mode: "build", nickname: "0.00.10", isid: "100" }, params: { nickname: "0.00.10", isid: "100" }, restored: { mode: "build", nickname: "0.00.10", isid: "100" } }, // the guide's worked example
    { id: "decode-example", state: { mode: "decode", mac: "03:00:41:00:04:4d" }, params: { input: "03:00:41:00:04:4d" }, restored: { mode: "decode", mac: "03:00:41:00:04:4d" } }, // the same address taken apart
  ],
  empty: [
    { id: "build-half", state: { mode: "build", nickname: "0.00.10", isid: "" } }, // both are needed
    { id: "decode-blank", state: { mode: "decode", mac: " " } }, // nothing typed
    { id: "decode-unicast", state: { mode: "decode", mac: "00:00:41:00:04:4d" } }, // the page shows its error
  ],
  blocked: [],
  reject: [
    { id: "both-jobs", values: { input: "03:00:41:00:04:4d", nickname: "0.00.10", isid: "100" } }, // one job per link
    { id: "nickname-alone", values: { nickname: "0.00.10" } }, // the I-SID is missing
    { id: "line-break", values: { input: "03:00:41\n00:04:4d" } }, // a one-line field
    { id: "nothing", values: {} }, // no value at all
  ],
});
