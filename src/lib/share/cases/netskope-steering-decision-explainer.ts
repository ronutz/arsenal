// ============================================================================
// src/lib/share/cases/netskope-steering-decision-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the Netskope steering decision explainer (2026-11-01, wave
// 4B): the spec goes as typed once the page has a decision, with a caution
// line; a spec the page refuses has nothing to share; a JWT in it blocks the
// link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { STEERING_DECISION_SHARE, type SteeringDecisionShareState } from "../../tools/netskope-steering-decision-explainer/share"; // the spec

/** The page's Example: Fail Close rescued by a domain exception. */
const EXAMPLE = `mode: web
tunnel: down
fail-close: on
flow: web login.example.com
exception: domain login.example.com
flow-matches: domain`; // as the component holds it

/** RFC 7519 section 3.1's example JWT (read 2026-11-01). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link

/** The cases. */
export const NETSKOPE_STEERING_DECISION_SHARE_CASES = defineShareCases<SteeringDecisionShareState, SteeringDecisionShareState>({
  spec: STEERING_DECISION_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as typed
    { id: "tunnel-up", state: { input: "mode: all\ntunnel: up\nflow: app crm.corp.example" }, params: { input: "mode: all\ntunnel: up\nflow: app crm.corp.example" }, restored: { input: "mode: all\ntunnel: up\nflow: app crm.corp.example" } }, // an internal app goes, with the caution line
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "unknown-key", state: { input: "mode: web\ncolour: blue" } }, // the page's line-anchored error
  ],
  blocked: [
    { id: "jwt-in-flow", state: { input: `mode: web\nflow: web sso.example.com/cb?t=${JWT}` }, code: "secret" }, // a JWS
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "\n " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
