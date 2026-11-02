// ============================================================================
// src/lib/share/cases/f5-awaf-evasion-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the AWAF evasion-technique explainer: a keyword or a known
// sub-violation name goes as typed; a pasted evasions block or policy goes as
// pasted unless it holds a credential; a name the page does not know and JSON
// it cannot parse have no answer to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { EVASION_SHARE, type EvasionShareState } from "../../tools/f5-awaf-evasion-explainer/share"; // the spec

/** A policy with an evasions block (two sub-violations set, one with its pass count). */
const BLOCK = JSON.stringify({ policy: { name: "p", "blocking-settings": { evasions: [{ description: "Bad unescape", enabled: false }, { description: "Multiple decoding", enabled: true, maxDecodingPasses: 4 }] } } }, null, 2); // the read-back
/** A policy that parses but has no evasions block (the template's defaults apply). */
const NO_BLOCK = '{ "policy": { "name": "p", "enforcementMode": "blocking" } }'; // still an answer
/** RFC 7519 section 3.1's example JWT (read 2026-10-27), standing in for a live token. */
const RFC7519_JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // three base64url segments

/** The cases. */
export const F5_AWAF_EVASION_SHARE_CASES = defineShareCases<EvasionShareState, EvasionShareState>({
  spec: EVASION_SHARE, // the spec
  accept: [
    { id: "keyword", state: { input: "evasions" }, params: { input: "evasions" }, restored: { input: "evasions" } }, // the Example: the eight cards
    { id: "one-name", state: { input: "Directory traversals" }, params: { input: "Directory traversals" }, restored: { input: "Directory traversals" } }, // one card
    { id: "policy-block", state: { input: BLOCK }, params: { input: BLOCK }, restored: { input: BLOCK } }, // the read-back, as pasted
    { id: "policy-without-block", state: { input: NO_BLOCK }, params: { input: NO_BLOCK }, restored: { input: NO_BLOCK } }, // "no evasions block" is an answer too
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "unknown-name", state: { input: "Unicode slash" } }, // a miss: no card
    { id: "broken-json", state: { input: '{ "policy": { "blocking-settings": ' } }, // the page shows the parse error
  ],
  blocked: [
    { id: "jwt-in-policy", state: { input: JSON.stringify({ policy: { name: "p", description: `bearer ${RFC7519_JWT}`, "blocking-settings": { evasions: [{ description: "Bad unescape", enabled: true }] } } }) }, code: "secret" }, // a JWS
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
