// ============================================================================
// src/lib/share/cases/fortigate-policy-match-order.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiGate policy match-order explainer (input-caution):
// both fields go as typed (an empty packet line is left out of the link and
// an arrival empties it); a credential in either field blocks the link; an
// empty list has nothing to share. The secrets are invented for these cases.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIGATE_POLICY_MATCH_SHARE, type PolicyMatchShareState } from "../../tools/fortigate-policy-match-order/share"; // the spec

/** The page's Example policies (verbatim from the component). */
const POLICIES = `10 | port1 | port2 | all | all | ALL | accept
20 | port1 | port2 | web-servers | all | HTTPS | accept
30 | port1 | port2 | bad-hosts | all | ALL | deny`; // as the component holds it
/** The page's Example packet. */
const PACKET = "port1 | port2 | web-servers | all | HTTPS"; // as the component holds it
/** A VIP and a match-vip deny, with a disabled policy. */
const VIP = `5 | wan1 | dmz | bad-hosts | all | ALL | deny | match-vip
10 | wan1 | dmz | all | WebVIP | HTTPS | accept | vip
15 | wan1 | dmz | all | all | ALL | deny | disabled`; // three rows

/** The cases. */
export const FORTIGATE_POLICY_MATCH_ORDER_SHARE_CASES = defineShareCases<PolicyMatchShareState, PolicyMatchShareState>({
  spec: FORTIGATE_POLICY_MATCH_SHARE, // the spec
  accept: [
    { id: "example", state: { input: POLICIES, packet: PACKET }, params: { input: POLICIES, packet: PACKET }, restored: { input: POLICIES, packet: PACKET } }, // both fields
    { id: "no-packet", state: { input: VIP, packet: "" }, params: { input: VIP, packet: "" }, restored: { input: VIP, packet: "" } }, // the empty packet is left out, and comes back empty
    { id: "maybe-in-packet", state: { input: POLICIES, packet: "port1 | port2 | all | all | HTTPS # api_key=ask-me" }, params: { input: POLICIES, packet: "port1 | port2 | all | all | HTTPS # api_key=ask-me" }, restored: { input: POLICIES, packet: "port1 | port2 | all | all | HTTPS # api_key=ask-me" } }, // a secret-looking name: named, not blocked
  ],
  arrive: [
    { id: "packet-absent", values: { input: POLICIES, packet: null }, restored: { input: POLICIES, packet: "" } }, // an absent packet empties the field
  ],
  empty: [
    { id: "blank", state: { input: "", packet: PACKET } }, // no policy: nothing to share
    { id: "white-space", state: { input: " \n ", packet: "" } }, // no policy line
  ],
  blocked: [
    { id: "credential-in-policies", state: { input: `${POLICIES}\nset psksecret ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==`, packet: PACKET }, code: "secret" }, // an ENC value in the list
    { id: "credential-in-packet", state: { input: POLICIES, packet: "port1 | port2 | all | all | HTTPS psksecret=not-a-real-psk" }, code: "secret" }, // a pre-shared key in the packet line
  ],
  reject: [
    { id: "empty", values: { input: "", packet: PACKET } }, // no list
    { id: "absent", values: { input: null, packet: PACKET } }, // a packet alone
    { id: "credential-in-packet", values: { input: POLICIES, packet: "x psksecret=not-a-real-psk" } }, // never sent
  ],
});
