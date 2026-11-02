// ============================================================================
// src/lib/share/cases/f5xc-service-policy-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC service policy explainer (2026-11-01, wave 4B): the
// policy goes as pasted once the page recognises it; an Authorization header
// matcher with a literal value blocks the link (RFC 9110 sections 11.6.2 and
// 11.7.2), as does a SecretType secret; an API key header or a cookie matcher
// is only named in the caution line; text that is not a policy has nothing
// to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SERVICE_POLICY_SHARE, type ServicePolicyShareState } from "../../tools/f5xc-service-policy-explainer/share"; // the spec

/** The page's Example, built as the component builds it. */
const EXAMPLE = JSON.stringify(
  {
    metadata: { name: "acmecorp-web", namespace: "staging" }, // the policy
    spec: {
      server_name: "database.production.customer.volterra.us", // the server scope
      rule_list: {
        rules: [
          {
            metadata: { name: "allow-api-get", description: "Allow GET to the documented API" }, // a rule
            spec: {
              action: "ALLOW", // its action
              path: { prefix_values: ["/api/"] }, // a path
              http_method: { methods: ["GET"] }, // a method
              headers: [{ name: "Accept-Encoding", item: { exact_values: ["gzip"] } }], // a harmless header
            },
          },
          {
            metadata: { name: "deny-bad-asn" }, // a rule
            spec: { action: "DENY", asn_list: { as_numbers: [64512, 65000] } }, // ASNs
          },
          { metadata: { name: "allow-all" }, spec: { action: "ALLOW" } }, // the last rule
        ],
      },
    },
  },
  null,
  2,
); // as the component holds it

/** A rule list allowing a static API key and a beta cookie: maybe-secrets, named, not blocked. */
const KEY_AND_COOKIE = JSON.stringify({ metadata: { name: "partners" }, spec: { rule_list: { rules: [{ metadata: { name: "partner-key" }, spec: { action: "ALLOW", headers: [{ name: "X-Api-Key", item: { exact_values: ["pk-sample-0001"] } }], cookie_matchers: [{ name: "beta", item: { exact_values: ["on"] } }] } }] } } }, null, 2); // two maybe lines

/** RFC 7617 section 2's credentials (read 2026-11-01). */
const BASIC = "QWxhZGRpbjpvcGVuIHNlc2FtZQ=="; // never in a link

/** The cases. */
export const F5XC_SERVICE_POLICY_SHARE_CASES = defineShareCases<ServicePolicyShareState, ServicePolicyShareState>({
  spec: SERVICE_POLICY_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "key-and-cookie-named", state: { input: KEY_AND_COOKIE }, params: { input: KEY_AND_COOKIE }, restored: { input: KEY_AND_COOKIE } }, // maybe-secrets do not block
    { id: "presence-only", state: { input: JSON.stringify({ spec: { rule_list: { rules: [{ spec: { action: "DENY", headers: [{ name: "Authorization", check_not_present: {} }] } }] } } }) }, params: { input: JSON.stringify({ spec: { rule_list: { rules: [{ spec: { action: "DENY", headers: [{ name: "Authorization", check_not_present: {} }] } }] } } }) }, restored: { input: JSON.stringify({ spec: { rule_list: { rules: [{ spec: { action: "DENY", headers: [{ name: "Authorization", check_not_present: {} }] } }] } } }) } }, // a header's presence holds no value
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "not-json", state: { input: "rule_list: []" } }, // the page's parse error
    { id: "not-a-policy", state: { input: "{\"spec\": {\"origin_servers\": []}}" } }, // not a policy
  ],
  blocked: [
    { id: "authorization-matcher", state: { input: EXAMPLE.replace("\"Accept-Encoding\"", "\"Authorization\"").replace("\"gzip\"", `"Basic ${BASIC}"`) }, code: "secret" }, // credentials in a matcher
    { id: "secret-type", state: { input: EXAMPLE.replace("\"description\": \"Allow GET to the documented API\"", "\"description\": \"Allow GET\", \"x\": {\"clear_secret_info\": {\"url\": \"string:///U2VjcmV0SW5mb3JtYXRpb24=\"}}") }, code: "secret" }, // a SecretType secret in clear
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "   " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
