// ============================================================================
// src/lib/share/cases/f5-lb-method-chooser.ts
// ----------------------------------------------------------------------------
// Share cases of the LB-method chooser: the box goes as typed (posture
// input-caution), or the chooser panel's two answers go by their ids; each
// button carries one part, and an arrival fills only what the link carries.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { LB_METHOD_SHARE, type LbArrival, type LbShareState } from "../../tools/f5-lb-method-chooser/share"; // the spec

/** The page's Example: a least-connections pool with a ratio and a priority group (golden vector). */
const EXAMPLE = "ltm pool web_pool {\n    load-balancing-mode least-connections-member\n    members {\n        10.1.1.1:http {\n            address 10.1.1.1\n            ratio 3\n            priority-group 1\n        }\n        10.1.1.2:http {\n            address 10.1.1.2\n        }\n    }\n    monitor http\n}"; // verbatim

/** The cases. */
export const F5_LB_METHOD_SHARE_CASES = defineShareCases<LbShareState, LbArrival>({
  spec: LB_METHOD_SHARE, // the spec
  accept: [
    { id: "example-pool", state: { input: EXAMPLE, capacity: "", react: "" }, params: { input: EXAMPLE }, restored: { input: EXAMPLE, capacity: null, react: null } }, // the box's button
    { id: "method-name", state: { input: "observed-member", capacity: "", react: "" }, params: { input: "observed-member" }, restored: { input: "observed-member", capacity: null, react: null } }, // one method in full
    { id: "chooser", state: { input: "", capacity: "ratio", react: "connections" }, params: { capacity: "ratio", react: "connections" }, restored: { input: null, capacity: "ratio", react: "connections" } }, // the panel's button
    { id: "choose-line", state: { input: "choose capacity=measured react=response", capacity: "", react: "" }, params: { input: "choose capacity=measured react=response" }, restored: { input: "choose capacity=measured react=response", capacity: null, react: null } }, // the panel's question typed in the box
  ],
  arrive: [
    { id: "both-parts", values: { input: "methods", capacity: "equal", react: "none" }, restored: { input: "methods", capacity: "equal", react: "none" } }, // a hand-made link with both parts fills both
  ],
  empty: [
    { id: "nothing", state: { input: "", capacity: "", react: "" } }, // nothing typed or chosen
    { id: "one-answer", state: { input: "", capacity: "ratio", react: "" } }, // the panel answers only with both
  ],
  reject: [
    { id: "one-answer", values: { capacity: "ratio" } }, // one answer without the other
    { id: "unknown-capacity", values: { capacity: "fastest", react: "none" } }, // not offered
    { id: "unknown-react", values: { capacity: "equal", react: "latency" } }, // not offered
    { id: "blank-box", values: { input: "  " } }, // white space
    { id: "blank-box-with-answers", values: { input: " ", capacity: "equal", react: "none" } }, // a blank box is not a share, whatever comes with it
  ],
});
