// ============================================================================
// src/lib/share/cases/routing-table-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the routing table explainer: the table goes as #input=, the
// destination (when typed) as destination; posture input-caution.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { ROUTING_TABLE_SHARE, type RoutingTableShareState } from "../../tools/routing-table-explainer/share"; // the spec and its state
import { ROUTING_VECTORS } from "../../tools/routing-table-explainer/golden-vectors"; // the tool's own vectors

/** The page's Example: golden vector sandbox-ip-route-show (a "$" prompt, trailing spaces, line breaks). */
const EXAMPLE = ROUTING_VECTORS.find((v) => v.id === "sandbox-ip-route-show"); // the vector
/** Another vector: policy-routing tables. */
const TABLES = ROUTING_VECTORS.find((v) => v.id === "sandbox-ip-route-show-table-all"); // the vector

/** The cases. */
export const ROUTING_TABLE_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<RoutingTableShareState, RoutingTableShareState>>({ // typed, so cases carrying different values check as one list
  spec: ROUTING_TABLE_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example-with-destination", state: { input: EXAMPLE?.input ?? "", destination: "192.0.2.77" }, params: { input: EXAMPLE?.input ?? "", destination: "192.0.2.77" }, restored: { input: EXAMPLE?.input ?? "", destination: "192.0.2.77" } }, // the page's Example and its destination
    { id: "table-only", state: { input: TABLES?.input ?? "", destination: "" }, params: { input: TABLES?.input ?? "" }, restored: { input: TABLES?.input ?? "", destination: "" } }, // no destination: not carried
    { id: "blank-destination", state: { input: EXAMPLE?.input ?? "", destination: "  " }, params: { input: EXAMPLE?.input ?? "" }, restored: { input: EXAMPLE?.input ?? "", destination: "" } }, // a blank destination is not carried
  ],
  arrive: [ // decode only: defaults of absent optional values
    { id: "destination-absent", values: { input: "default via 192.0.2.1 dev eth0", destination: null }, restored: { input: "default via 192.0.2.1 dev eth0", destination: "" } }, // none: the field is cleared
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "", destination: "192.0.2.77" } }, // no table: a destination alone is nothing
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "absent", values: { input: null, destination: null } }, // not there
    { id: "destination-only", values: { input: null, destination: "192.0.2.77" } }, // no table
    { id: "blank-table", values: { input: "\n", destination: null } }, // a blank table
  ],
}));
