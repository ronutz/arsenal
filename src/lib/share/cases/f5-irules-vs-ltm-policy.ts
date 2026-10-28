// ============================================================================
// src/lib/share/cases/f5-irules-vs-ltm-policy.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules vs LTM policy classifier: the box goes as pasted;
// an iRule with a key or credential written out gets no link (the iRule
// secrets check, pinned rule by rule in the command/context explainer's
// cases).
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_VS_LTM_POLICY_SHARE, type IrulesVsLtmPolicyShareState } from "../../tools/f5-irules-vs-ltm-policy/share"; // the spec and its state

/** The page's Example (IrulesVsLtmPolicyTool's EXAMPLE). */
const EXAMPLE = `when HTTP_REQUEST {
    if { [HTTP::uri] contains "cmd.exe" } {
        reject
    }
    if { [HTTP::uri] starts_with "/api" } {
        pool api_pool
    }
}
when HTTP_REQUEST {
    HTTP::redirect "https://www.example.com/"
}
when CLIENT_ACCEPTED {
    table set -subtable conns [IP::client_addr] 1
}`;

/** The cases. */
export const IRULES_VS_LTM_POLICY_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<IrulesVsLtmPolicyShareState, IrulesVsLtmPolicyShareState>>({ // typed, so the cases check as one list
  spec: IRULES_VS_LTM_POLICY_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the page's Example
    { id: "strategies", state: { input: "strategies" }, params: { input: "strategies" }, restored: { input: "strategies" } }, // the keyword the page answers
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // an empty box
  ],
  blocked: [ // a key or credential written out: no link
    { id: "authorization-literal", state: { input: `when HTTP_REQUEST {\n    HTTP::header replace Authorization "Bearer 0123456789abcdef"\n    pool api_pool\n}` }, code: "secret" }, // RFC 9110 11.6.2
    { id: "redirect-with-password", state: { input: `when HTTP_REQUEST {\n    HTTP::redirect "https://ops:hunter2@intranet.example/"\n}` }, code: "secret" }, // RFC 3986 3.2.1
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
