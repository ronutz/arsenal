// ============================================================================
// src/lib/share/cases/f5xc-object-linter.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC object linter (2026-11-01, wave 4B): a copy goes,
// with every SecretType secret and every added header or cookie value as
// [redacted], and lints as the paste does; a credential left in it (an
// Authorization matcher in a service policy) blocks the link; text that is not
// an XC object the linter knows has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { OBJECT_LINTER_SHARE, type ObjectLinterShareState } from "../../tools/f5xc-object-linter/share"; // the spec

/** The page's Example, built as the component builds it. */
const EXAMPLE = JSON.stringify(
  {
    metadata: { name: "public-app" }, // the load balancer
    spec: {
      domains: ["*.example.com", "example.com"], // wildcard and apex
      http: {}, // cleartext
      routes: [{ simple_route: { path: { prefix: "/" } } }, { simple_route: { path: { prefix: "/api" } } }], // a shadowed route
    },
  },
  null,
  2,
); // as the component holds it

/** The XC API reference's own example of a clear secret (read 2026-11-01). */
const XC_CLEAR = "string:///U2VjcmV0SW5mb3JtYXRpb24="; // never in a link
/** RFC 7519 section 3.1's example JWT (read 2026-11-01). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link

/** An origin pool with mTLS to origin, its client key in clear. */
const POOL_MTLS = JSON.stringify({ metadata: { name: "pay-pool" }, spec: { origin_servers: [{ public_name: { dns_name: "pay.example.com" } }], port: 443, use_tls: { tls_config: { default_security: {} }, use_mtls: { tls_certificates: [{ certificate_url: "string:///LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t", private_key: { clear_secret_info: { url: XC_CLEAR } } }] }, skip_server_verification: {} } } }, null, 2); // one value replaced

/** A load balancer that adds a response header and a request cookie: values a reader may send by choice. */
const LINTER_HEADERS = JSON.stringify({ metadata: { name: "edge-lb" }, spec: { domains: ["shop.example.com"], https_auto_cert: { http_redirect: true }, app_firewall: { name: "waf" }, response_headers_to_add: [{ name: "X-Frame-Options", value: "DENY" }], request_cookies_to_add: [{ name: "region", value: "eu" }] } }, null, 2); // two values replaced

/** The cases. */
export const F5XC_OBJECT_LINTER_SHARE_CASES = defineShareCases<ObjectLinterShareState, ObjectLinterShareState>({
  spec: OBJECT_LINTER_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // nothing to replace: the copy is the paste
    { id: "pool-mtls-key", state: { input: POOL_MTLS }, params: { input: POOL_MTLS.replace(XC_CLEAR, "[redacted]") }, restored: { input: POOL_MTLS.replace(XC_CLEAR, "[redacted]") }, mustNotContain: [XC_CLEAR, "U2VjcmV0SW5mb3JtYXRpb24="] }, // a SecretType secret in clear
    { id: "headers-and-cookies", state: { input: LINTER_HEADERS }, params: { input: LINTER_HEADERS.replace("\"value\": \"DENY\"", "\"value\": \"[redacted]\"").replace("\"value\": \"eu\"", "\"value\": \"[redacted]\"") }, restored: { input: LINTER_HEADERS.replace("\"value\": \"DENY\"", "\"value\": \"[redacted]\"").replace("\"value\": \"eu\"", "\"value\": \"[redacted]\"") } }, // added values replaced
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "not-json", state: { input: "metadata: {name: x}" } }, // the page's parse error
    { id: "unknown-object", state: { input: "{\"spec\": {\"something\": true}}" } }, // not an object the linter knows
  ],
  blocked: [
    { id: "policy-authorization-matcher", state: { input: JSON.stringify({ metadata: { name: "allow-ci" }, spec: { rules: [{ spec: { action: "ALLOW", headers: [{ name: "Authorization", item: { exact_values: [`Bearer ${JWT}`] } }] } }] } }, null, 2) }, code: "secret" }, // a service policy's credential
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "\t" } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
