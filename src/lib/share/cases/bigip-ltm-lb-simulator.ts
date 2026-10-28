// ============================================================================
// src/lib/share/cases/bigip-ltm-lb-simulator.ts
// ----------------------------------------------------------------------------
// Share cases of the BIG-IP LTM load balancing simulator: a form, so the link
// carries named values only (members, method, threshold, requests), and an
// arrival replaces the whole form; anything the form would not hold is
// refused.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { LTM_LB_SHARE, type LtmShareRow, type LtmShareState } from "../../tools/bigip-ltm-lb-simulator/share"; // the spec

/** The page's Example rows (BigipLtmLbSimulatorTool's EXAMPLE). */
const EXAMPLE_ROWS: LtmShareRow[] = [
  { id: "web-1", node: "10.0.0.1", ratio: 3, nodeRatio: 2, priority: 1, persistence: 40 },
  { id: "web-2", node: "10.0.0.2", ratio: 2, nodeRatio: 2, priority: 1, persistence: 10 },
  { id: "web-3", node: "10.0.0.3", ratio: 1, nodeRatio: 1, priority: 0, persistence: 0 },
];
/** The Example rows as the members value carries them: one line each, six fields separated by tabs. */
const EXAMPLE_MEMBERS = "web-1\t10.0.0.1\t3\t2\t1\t40\nweb-2\t10.0.0.2\t2\t2\t1\t10\nweb-3\t10.0.0.3\t1\t1\t0\t0"; // exact

/** The cases. */
export const LTM_LB_SHARE_CASES = defineShareCases<LtmShareState, LtmShareState>({
  spec: LTM_LB_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { rows: EXAMPLE_ROWS, method: "round-robin", threshold: 0, requests: 100 }, params: { members: EXAMPLE_MEMBERS, method: "round-robin", threshold: "0", requests: "100" }, restored: { rows: EXAMPLE_ROWS, method: "round-robin", threshold: 0, requests: 100 } }, // the page as it opens
    { id: "priority-groups-ratio", state: { rows: EXAMPLE_ROWS, method: "ratio-member", threshold: 2, requests: 1000 }, params: { members: EXAMPLE_MEMBERS, method: "ratio-member", threshold: "2", requests: "1000" }, restored: { rows: EXAMPLE_ROWS, method: "ratio-member", threshold: 2, requests: 1000 } }, // activation on, another method
    { id: "dynamic-method", state: { rows: [EXAMPLE_ROWS[0]], method: "observed", threshold: 0, requests: 10 }, params: { members: "web-1\t10.0.0.1\t3\t2\t1\t40", method: "observed", threshold: "0", requests: "10" }, restored: { rows: [EXAMPLE_ROWS[0]], method: "observed", threshold: 0, requests: 10 } }, // explained, not simulated: still a result
    { id: "free-text-names", state: { rows: [{ id: "app #1 & co", node: "", ratio: 1, nodeRatio: 1, priority: 0, persistence: 0 }, { id: "", node: "srv=2?", ratio: 7, nodeRatio: 1, priority: 3, persistence: 999 }], method: "least-sessions", threshold: 1, requests: 0 }, params: { members: "app #1 & co\t\t1\t1\t0\t0\n\tsrv=2?\t7\t1\t3\t999", method: "least-sessions", threshold: "1", requests: "0" }, restored: { rows: [{ id: "app #1 & co", node: "", ratio: 1, nodeRatio: 1, priority: 0, persistence: 0 }, { id: "", node: "srv=2?", ratio: 7, nodeRatio: 1, priority: 3, persistence: 999 }], method: "least-sessions", threshold: 1, requests: 0 } }, // "#", "&", "=", "?", spaces and empty fields
    { id: "tab-in-a-name", state: { rows: [{ id: "a\tb", node: "10.0.0.9", ratio: 1, nodeRatio: 1, priority: 0, persistence: 0 }], method: "round-robin", threshold: 0, requests: 5 }, params: { members: "a b\t10.0.0.9\t1\t1\t0\t0", method: "round-robin", threshold: "0", requests: "5" }, restored: { rows: [{ id: "a b", node: "10.0.0.9", ratio: 1, nodeRatio: 1, priority: 0, persistence: 0 }], method: "round-robin", threshold: 0, requests: 5 } }, // a pasted tab travels as a space
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "no-rows", state: { rows: [], method: "round-robin", threshold: 0, requests: 100 } }, // the form never has none; the engine refuses it
    { id: "too-many-rows", state: { rows: Array.from({ length: 101 }, (_, i) => ({ id: `m${i}`, node: "", ratio: 1, nodeRatio: 1, priority: 0, persistence: 0 })), method: "round-robin", threshold: 0, requests: 100 } }, // the engine refuses more than 100
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "unknown-method", values: { members: EXAMPLE_MEMBERS, method: "fastest-ever", threshold: "0", requests: "100" } }, // not offered
    { id: "missing-requests", values: { members: EXAMPLE_MEMBERS, method: "round-robin", threshold: "0", requests: null } }, // every value is required
    { id: "missing-members", values: { members: null, method: "round-robin", threshold: "0", requests: "100" } }, // no rows
    { id: "five-fields", values: { members: "web-1\t10.0.0.1\t3\t2\t1", method: "round-robin", threshold: "0", requests: "100" } }, // a row needs six
    { id: "ratio-zero", values: { members: "web-1\t10.0.0.1\t0\t2\t1\t40", method: "round-robin", threshold: "0", requests: "100" } }, // ratios start at 1
    { id: "negative", values: { members: "web-1\t10.0.0.1\t3\t2\t-1\t40", method: "round-robin", threshold: "0", requests: "100" } }, // not a form value
    { id: "leading-zero", values: { members: EXAMPLE_MEMBERS, method: "round-robin", threshold: "00", requests: "100" } }, // not a decimal integer as the form writes it
    { id: "decimal", values: { members: EXAMPLE_MEMBERS, method: "round-robin", threshold: "0", requests: "1.5" } }, // whole numbers only
    { id: "too-many-rows", values: { members: Array.from({ length: 101 }, (_, i) => `m${i}\t\t1\t1\t0\t0`).join("\n"), method: "round-robin", threshold: "0", requests: "100" } }, // more than the simulator takes
  ],
});
