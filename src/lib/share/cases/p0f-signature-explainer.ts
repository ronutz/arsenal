// ============================================================================
// src/lib/share/cases/p0f-signature-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the p0f signature explainer (wave 4C, 2026-11-01): the link
// carries the signature as typed. Signatures are the tool's golden vectors
// (p0f's reference signatures).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { P0F_SHARE, type P0fShareState } from "../../tools/p0f-signature-explainer/share"; // the spec

/** The cases. */
export const P0F_SHARE_CASES = defineShareCases<P0fShareState, P0fShareState>({
  spec: P0F_SHARE, // the spec
  accept: [
    { id: "example-linux", state: { input: "4:64:0:*:mss*20,7:mss,sok,ts,nop,ws:df,id+:0" }, params: { input: "4:64:0:*:mss*20,7:mss,sok,ts,nop,ws:df,id+:0" }, restored: { input: "4:64:0:*:mss*20,7:mss,sok,ts,nop,ws:df,id+:0" } }, // the Example (golden vector v1)
    { id: "windows", state: { input: "4:128:0:*:65535,8:mss,nop,ws,nop,nop,sok:df,id+:0" }, params: { input: "4:128:0:*:65535,8:mss,nop,ws,nop,nop,sok:df,id+:0" }, restored: { input: "4:128:0:*:65535,8:mss,nop,ws,nop,nop,sok:df,id+:0" } }, // golden vector v2
    { id: "labelled", state: { input: "label = *:64:0:*:mss*10,6:mss,ts,nop,ws:df:0" }, params: { input: "label = *:64:0:*:mss*10,6:mss,ts,nop,ws:df:0" }, restored: { input: "label = *:64:0:*:mss*10,6:mss,ts,nop,ws:df:0" } }, // the "label = sig" form, as typed
  ],
  empty: [
    { id: "blank", state: { input: "  " } }, // nothing typed
    { id: "bad-window", state: { input: "4:64:0:*:mss*20:mss,ws:df:0" } }, // the engine refuses it (golden vector e1)
  ],
  blocked: [],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "   " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
