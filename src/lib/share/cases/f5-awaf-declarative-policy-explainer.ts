// ============================================================================
// src/lib/share/cases/f5-awaf-declarative-policy-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the AWAF declarative-policy explainer: a policy the page
// reads goes as pasted; a credential in it (RFC 7519's example JWT, a
// password in an OpenAPI link, a Cookie line) blocks the link; a webhook URL
// or a secret-looking name is only named in the caution line, so it does not
// block; text the page does not read as a policy has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { AWAF_POLICY_SHARE, type AwafPolicyShareState } from "../../tools/f5-awaf-declarative-policy-explainer/share"; // the spec

/** RFC 7519 section 3.1's example JWT (read 2026-10-27), standing in for a live token. */
const RFC7519_JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // three base64url segments

/** The page's Example policy (transparent, signature staging, XFF trust, Data Guard). */
const EXAMPLE = JSON.stringify({ policy: { name: "shop-api-policy", description: "Storefront API", template: { name: "POLICY_TEMPLATE_API_SECURITY" }, enforcementMode: "transparent", "server-technologies": [{ serverTechnologyName: "MySQL" }, { serverTechnologyName: "Unix/Linux" }], "signature-settings": { signatureStaging: true }, general: { trustXff: true, enforcementReadinessPeriod: 7 }, "data-guard": { enabled: true, creditCardNumbers: true }, "policy-builder": { autoApply: false } } }, null, 2); // as the component builds it

/** A policy with a webhook (F5 schema v17.1: webhooks[].url). */
const WEBHOOK = JSON.stringify({ policy: { name: "p", template: { name: "POLICY_TEMPLATE_RAPID_DEPLOYMENT" }, enforcementMode: "blocking", webhooks: [{ name: "chat", url: "https://hooks.example.com/services/T000/B000/XXXX", triggerEvent: "http-request-illegal" }] } }, null, 2); // a maybe-secret

/** A small policy with Windows line ends. */
const CRLF = '{\r\n  "policy": {\r\n    "name": "crlf",\r\n    "enforcementMode": "blocking"\r\n  }\r\n}'; // CR LF kept as pasted

/** The cases. */
export const F5_AWAF_POLICY_SHARE_CASES = defineShareCases<AwafPolicyShareState, AwafPolicyShareState>({
  spec: AWAF_POLICY_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // as pasted
    { id: "webhook-named-not-blocked", state: { input: WEBHOOK }, params: { input: WEBHOOK }, restored: { input: WEBHOOK } }, // a maybe-secret is named, not blocked
    { id: "crlf", state: { input: CRLF }, params: { input: CRLF }, restored: { input: CRLF } }, // line ends as pasted
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "broken-json", state: { input: '{ "policy": ' } }, // the page shows the parse error: nothing to share
    { id: "not-a-policy", state: { input: '{ "hello": 1 }' } }, // JSON, but not a WAF policy
  ],
  blocked: [
    { id: "jwt-in-description", state: { input: JSON.stringify({ policy: { name: "p", enforcementMode: "blocking", description: `token ${RFC7519_JWT}` } }, null, 2) }, code: "secret" }, // a JWS
    { id: "password-in-openapi-link", state: { input: JSON.stringify({ policy: { name: "p", enforcementMode: "blocking", "open-api-files": [{ link: "https://svc:S3cr3t-Pa55@api.example.net/openapi.json" }] } }, null, 2) }, code: "secret" }, // RFC 3986 3.2.1
    { id: "cookie-line", state: { input: JSON.stringify({ policy: { name: "p", enforcementMode: "blocking", description: "seen with Cookie: TS01a2b3c4=0123456789abcdef" } }) }, code: "secret" }, // RFC 6265 4.2.1
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "  \n " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
