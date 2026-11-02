// ============================================================================
// src/lib/share/cases/fortigate-route-selection-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiGate route selection explainer (input-caution): the box goes as
// pasted once routes are evaluated; a credential pasted beside the routes
// blocks the link; a box without a destination has nothing to share.
// The secrets are invented for these cases (the ENC value is base64 for "this
// is not a real secret") or published examples (RFC 7617 section 2).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIGATE_ROUTE_SELECTION_SHARE, type RouteShareState } from "../../tools/fortigate-route-selection-explainer/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "destination: 10.2.5.10\nroute: prefix=0.0.0.0/0, gw=192.0.2.1, dev=wan1, distance=10, priority=0\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0\nroute: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=20, priority=0"; // as the component holds it

/** The cases. */
export const FORTIGATE_ROUTE_SELECTION_EXPLAINER_SHARE_CASES = defineShareCases<RouteShareState, RouteShareState>({
  spec: FORTIGATE_ROUTE_SELECTION_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "ecmp-tie", state: { input: "destination: 10.2.5.10\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0\nroute: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=10, priority=0" }, params: { input: "destination: 10.2.5.10\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0\nroute: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=10, priority=0" }, restored: { input: "destination: 10.2.5.10\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0\nroute: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=10, priority=0" } }, // a complete tie (golden vector, verbatim)
    { id: "maybe-secret-name", state: { input: "destination: 10.2.5.10\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0\n# bgp_password=ask-the-noc" }, params: { input: "destination: 10.2.5.10\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0\n# bgp_password=ask-the-noc" }, restored: { input: "destination: 10.2.5.10\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0\n# bgp_password=ask-the-noc" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "no-destination", state: { input: "route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0" } }, // nothing to select for
  ],
  blocked: [
    { id: "bgp-neighbour-password", state: { input: "destination: 10.2.5.10\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=200, priority=0\nconfig router bgp\n    config neighbor\n        edit \"10.1.1.1\"\n            set password ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==\n        next\n    end\nend" }, code: "secret" }, // a BGP neighbour's MD5 password (CLI reference: password, type password)
    { id: "ospf-key-plain", state: { input: "destination: 10.2.5.10\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=110, priority=0\nset authentication-key not-a-real-key" }, code: "secret" }, // an OSPF authentication key in clear (type password)
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "still-enc", values: { input: "destination: 10.2.5.10\nroute: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0\nset key-string ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==" } }, // a credential: never in a link
  ],
});
