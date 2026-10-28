// ============================================================================
// src/lib/share/cases/f5-afm-rule-context.ts
// ----------------------------------------------------------------------------
// Share cases of the AFM rule-context explainer: the paste goes as typed (posture
// input-caution: the popover adds the tool's caution line), and a paste that
// holds a secret setting gets no link (code "secret", findTmshSecret).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { AFM_RULE_CONTEXT_SHARE, type AfmRuleContextShareState } from "../../tools/f5-afm-rule-context/share"; // the spec
import { AFM_VECTORS } from "../../tools/f5-afm-rule-context/golden-vectors"; // the tool's own vectors

/**
 * A golden vector's input, byte for byte.
 * @param id the vector's id
 * @returns its input (empty when the id is missing, which fails the accept case)
 */
const pick = (id: string): string => AFM_VECTORS.find((v) => v.id === id)?.input ?? ""; // pinned there

/** A reading this tool gives (golden vector accept-decisively-skips). */
const WALK = pick("accept-decisively-skips"); // the base of the extra and blocked cases
/** A walk with a gtm monitor pasted along (a whole-file paste): password none is no secret, so it goes. */
const WITH_EMPTY_PASSWORD = `${WALK}\ngtm monitor http /Common/probe {\n    password none\n    username none\n}`; // no value set

/** The cases. */
export const AFM_RULE_CONTEXT_SHARE_CASES = defineShareCases<AfmRuleContextShareState, AfmRuleContextShareState>({
  spec: AFM_RULE_CONTEXT_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "walk", state: { input: pick("accept-decisively-skips") }, params: { input: pick("accept-decisively-skips") }, restored: { input: pick("accept-decisively-skips") } }, // golden vector accept-decisively-skips, as typed
    { id: "audit", state: { input: pick("policy-audit-conflict-ad") }, params: { input: pick("policy-audit-conflict-ad") }, restored: { input: pick("policy-audit-conflict-ad") } }, // golden vector policy-audit-conflict-ad, as typed
    { id: "reference-word", state: { input: pick("cards-contexts") }, params: { input: pick("cards-contexts") }, restored: { input: pick("cards-contexts") } }, // golden vector cards-contexts, as typed
    { id: "with-password-none", state: { input: WITH_EMPTY_PASSWORD }, params: { input: WITH_EMPTY_PASSWORD }, restored: { input: WITH_EMPTY_PASSWORD } }, // more than the tool reads, and no secret
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "white-space", state: { input: "\n\t " } }, // only white space
  ],
  blocked: [ // a reading exists, but no link may carry the paste
    { id: "ltm-monitor-password", state: { input: `${WALK}\nltm monitor http /Common/app_probe {\n    password $M$Kq$EXAMPLEENCRYPTED==\n    username probe\n}` }, code: "secret" }, // a monitor's stored password
    { id: "send-authorization", state: { input: `${WALK}\nltm monitor http /Common/app_probe {\n    send "GET /health HTTP/1.1\\r\\nAuthorization: Basic cHJvYmU6c2VjcmV0\\r\\n\\r\\n"\n}` }, code: "secret" }, // credentials inside a send string (RFC 9110 section 11.6.2)
    { id: "one-line-passphrase", state: { input: `${WALK}\nltm profile client-ssl cs { passphrase $M$aa$EXAMPLE== }` }, code: "secret" }, // tmsh on one line
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " \n" } }, // only white space
  ],
});
