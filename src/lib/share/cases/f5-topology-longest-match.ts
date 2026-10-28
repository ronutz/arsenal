// ============================================================================
// src/lib/share/cases/f5-topology-longest-match.ts
// ----------------------------------------------------------------------------
// Share cases of the topology longest-match scorer: the paste goes as typed (posture
// input-caution: the popover adds the tool's caution line), and a paste that
// holds a secret setting gets no link (code "secret", findTmshSecret).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TOPOLOGY_LONGEST_MATCH_SHARE, type TopologyLongestMatchShareState } from "../../tools/f5-topology-longest-match/share"; // the spec
import { TOPO_VECTORS } from "../../tools/f5-topology-longest-match/golden-vectors"; // the tool's own vectors

/**
 * A golden vector's input, byte for byte.
 * @param id the vector's id
 * @returns its input (empty when the id is missing, which fails the accept case)
 */
const pick = (id: string): string => TOPO_VECTORS.find((v) => v.id === id)?.input ?? ""; // pinned there

/** A reading this tool gives (golden vector shadowing-walkthrough). */
const RECORDS = pick("shadowing-walkthrough"); // the base of the extra and blocked cases
/** Records with a gtm monitor pasted along whose password is none: no secret, so it goes. */
const WITH_EMPTY_PASSWORD = `${RECORDS}\ngtm monitor http /Common/probe { password none }`; // no value set

/** The cases. */
export const TOPOLOGY_LONGEST_MATCH_SHARE_CASES = defineShareCases<TopologyLongestMatchShareState, TopologyLongestMatchShareState>({
  spec: TOPOLOGY_LONGEST_MATCH_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "shadowing", state: { input: pick("shadowing-walkthrough") }, params: { input: pick("shadowing-walkthrough") }, restored: { input: pick("shadowing-walkthrough") } }, // golden vector shadowing-walkthrough, as typed
    { id: "nested-region", state: { input: pick("nested-region") }, params: { input: pick("nested-region") }, restored: { input: pick("nested-region") } }, // golden vector nested-region, as typed
    { id: "sorted-only", state: { input: pick("sorted-only-mode") }, params: { input: pick("sorted-only-mode") }, restored: { input: pick("sorted-only-mode") } }, // golden vector sorted-only-mode, as typed
    { id: "with-password-none", state: { input: WITH_EMPTY_PASSWORD }, params: { input: WITH_EMPTY_PASSWORD }, restored: { input: WITH_EMPTY_PASSWORD } }, // more than the tool reads, and no secret
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "white-space", state: { input: "\n\t " } }, // only white space
  ],
  blocked: [ // a reading exists, but no link may carry the paste
    { id: "gtm-monitor-password", state: { input: `${RECORDS}\ngtm monitor http /Common/probe {\n    password $M$Jw$EXAMPLEENCRYPTED==\n}` }, code: "secret" }, // a monitor's stored password
    { id: "snmp-community", state: { input: `${RECORDS}\nsys snmp {\n    communities {\n        c1 {\n            community-name n0t-public\n        }\n    }\n}` }, code: "secret" }, // an SNMP community string
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " \n" } }, // only white space
  ],
});
