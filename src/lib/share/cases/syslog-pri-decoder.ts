// ============================================================================
// src/lib/share/cases/syslog-pri-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the syslog PRI decoder and encoder: one PRI goes, as the
// #input= handoff usePrefill reads (Decode mode: as typed; Encode mode: the
// wire form the page computed, so the link opens decoded on the same pair).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SYSLOG_PRI_SHARE } from "../../tools/syslog-pri-decoder/share"; // the spec

/** The cases. */
export const SYSLOG_PRI_SHARE_CASES = defineShareCases(Object.freeze({
  spec: SYSLOG_PRI_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "decode-example", state: { input: "<34>" }, params: { input: "<34>" }, restored: { input: "<34>" } }, // the page's Example: "<" and ">" travel encoded
    { id: "decode-bare", state: { input: "134" }, params: { input: "134" }, restored: { input: "134" } }, // a bare PRI
    { id: "encode-local0-info", state: { input: "<134>" }, params: { input: "<134>" }, restored: { input: "<134>" } }, // Encode mode, local0 (16) and informational (6): 16 x 8 + 6
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank field
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
