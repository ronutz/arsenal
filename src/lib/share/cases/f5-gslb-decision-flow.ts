// ============================================================================
// src/lib/share/cases/f5-gslb-decision-flow.ts
// ----------------------------------------------------------------------------
// Share cases of the GSLB decision-flow explainer: the paste goes as typed (posture
// input-caution: the popover adds the tool's caution line), and a paste that
// holds a secret setting gets no link (code "secret", findTmshSecret).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { GSLB_DECISION_FLOW_SHARE, type GslbDecisionFlowShareState } from "../../tools/f5-gslb-decision-flow/share"; // the spec
import { GSLB_VECTORS } from "../../tools/f5-gslb-decision-flow/golden-vectors"; // the tool's own vectors

/**
 * A golden vector's input, byte for byte.
 * @param id the vector's id
 * @returns its input (empty when the id is missing, which fails the accept case)
 */
const pick = (id: string): string => GSLB_VECTORS.find((v) => v.id === id)?.input ?? ""; // pinned there

/** A reading this tool gives (golden vector topology-both-tiers-warning). */
const CONFIG = pick("topology-both-tiers-warning"); // the base of the extra and blocked cases
/** A whole bigip_gtm.conf excerpt: a gtm server and datacenter beside the pools hold no secret, so they go. */
const WHOLE_FILE = `gtm datacenter /Common/DC1 { }\ngtm server /Common/bigip1 {\n    datacenter /Common/DC1\n    devices {\n        bigip1 { addresses { 192.0.2.10 { } } }\n    }\n}\n${CONFIG}`; // infrastructure, under the caution line

/** The cases. */
export const GSLB_DECISION_FLOW_SHARE_CASES = defineShareCases<GslbDecisionFlowShareState, GslbDecisionFlowShareState>({
  spec: GSLB_DECISION_FLOW_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "config", state: { input: pick("topology-both-tiers-warning") }, params: { input: pick("topology-both-tiers-warning") }, restored: { input: pick("topology-both-tiers-warning") } }, // golden vector topology-both-tiers-warning, as typed
    { id: "method-name", state: { input: pick("method-qos-alias") }, params: { input: pick("method-qos-alias") }, restored: { input: pick("method-qos-alias") } }, // golden vector method-qos-alias, as typed
    { id: "catalogue", state: { input: pick("catalog-counts") }, params: { input: pick("catalog-counts") }, restored: { input: pick("catalog-counts") } }, // golden vector catalog-counts, as typed
    { id: "whole-file-no-secret", state: { input: WHOLE_FILE }, params: { input: WHOLE_FILE }, restored: { input: WHOLE_FILE } }, // more than the tool reads, and no secret
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "white-space", state: { input: "\n\t " } }, // only white space
  ],
  blocked: [ // a reading exists, but no link may carry the paste
    { id: "gtm-monitor-password", state: { input: `${CONFIG}\ngtm monitor https /Common/app_https {\n    defaults-from /Common/https\n    password $M$Jw$EXAMPLEENCRYPTED==\n    username probe\n}` }, code: "secret" }, // the tmsh reference's gtm monitor password
    { id: "send-authorization", state: { input: `${CONFIG}\ngtm monitor http /Common/app_http {\n    send "GET / HTTP/1.1\\r\\nHost: app.example.com\\r\\nAuthorization: Bearer EXAMPLETOKEN\\r\\n\\r\\n"\n}` }, code: "secret" }, // a bearer token in a send string
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " \n" } }, // only white space
  ],
});
