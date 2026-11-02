// ============================================================================
// src/lib/share/cases/f5xc-domain-sni-match-resolver.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC domain / SNI match resolver (2026-11-01, wave 4B):
// the list and the host name go as typed once the page resolves; a credential
// in either blocks the link; a missing field, a list that does not parse or a
// blank host has nothing to share; both names are required on arrival.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { DOMAIN_SNI_SHARE, type DomainSniShareState } from "../../tools/f5xc-domain-sni-match-resolver/share"; // the spec

/** The page's Example list, built as the component builds it. */
const EXAMPLE_LBS = JSON.stringify(
  [
    { name: "app-b", domains: ["app-b.domain.com"] }, // an exact domain
    { name: "wildcard", domains: ["*.domain.com"], default: true }, // a wildcard, the default
    { name: "apex", domains: ["domain.com"] }, // the apex
  ],
  null,
  2,
); // as the component holds it
/** The page's Example host name. */
const EXAMPLE_HOST = "other.domain.com"; // the wildcard wins

/** An envelope with a load balancer whose name carries RFC 7519 section 3.1's example JWT (read 2026-11-01). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link

/** The cases. */
export const F5XC_DOMAIN_SNI_SHARE_CASES = defineShareCases<DomainSniShareState, DomainSniShareState>({
  spec: DOMAIN_SNI_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE_LBS, host: EXAMPLE_HOST }, params: { input: EXAMPLE_LBS, host: EXAMPLE_HOST }, restored: { input: EXAMPLE_LBS, host: EXAMPLE_HOST } }, // the Example
    { id: "envelope-exact", state: { input: "{\"loadBalancers\": [{\"name\": \"lb1\", \"domains\": [\"app.example.com:8443\"]}]}", host: "app.example.com:8443" }, params: { input: "{\"loadBalancers\": [{\"name\": \"lb1\", \"domains\": [\"app.example.com:8443\"]}]}", host: "app.example.com:8443" }, restored: { input: "{\"loadBalancers\": [{\"name\": \"lb1\", \"domains\": [\"app.example.com:8443\"]}]}", host: "app.example.com:8443" } }, // the envelope and a port
    { id: "no-match-goes", state: { input: EXAMPLE_LBS.replace("\"default\": true", "\"default\": false"), host: "elsewhere.example.org" }, params: { input: EXAMPLE_LBS.replace("\"default\": true", "\"default\": false"), host: "elsewhere.example.org" }, restored: { input: EXAMPLE_LBS.replace("\"default\": true", "\"default\": false"), host: "elsewhere.example.org" } }, // "no load balancer" is a resolution too
  ],
  empty: [
    { id: "blank-list", state: { input: "", host: EXAMPLE_HOST } }, // no list
    { id: "blank-host", state: { input: EXAMPLE_LBS, host: "  " } }, // no host name
    { id: "not-json", state: { input: "app-b: app-b.domain.com", host: EXAMPLE_HOST } }, // the page's parse error
    { id: "not-a-list", state: { input: "{\"name\": \"lb1\"}", host: EXAMPLE_HOST } }, // an object without a list
  ],
  blocked: [
    { id: "jwt-in-list", state: { input: `[{"name": "Bearer ${JWT}", "domains": ["a.example.com"]}]`, host: "a.example.com" }, code: "secret" }, // a JWS in the list
    { id: "jwt-in-host", state: { input: EXAMPLE_LBS, host: JWT }, code: "secret" }, // a JWS in the host name
  ],
  reject: [
    { id: "no-host", values: { input: EXAMPLE_LBS, host: null } }, // both are needed
    { id: "no-list", values: { input: null, host: EXAMPLE_HOST } }, // both are needed
    { id: "blank-host", values: { input: EXAMPLE_LBS, host: " " } }, // white space
    { id: "empty", values: { input: "", host: "" } }, // nothing
  ],
});
