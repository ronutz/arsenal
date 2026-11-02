// ============================================================================
// src/lib/share/cases/f5xc-origin-pool-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC origin pool explainer (2026-11-01, wave 4B): a copy
// goes, with every SecretType secret (an mTLS key, in clear or blindfolded) as
// [redacted], and reads as the paste does; a private key written outside
// SecretType blocks the link; text that is not a pool has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ORIGIN_POOL_SHARE, type OriginPoolShareState } from "../../tools/f5xc-origin-pool-explainer/share"; // the spec

/** The page's Example, built as the component builds it. */
const EXAMPLE = JSON.stringify(
  {
    metadata: { name: "buytime-pool" }, // the pool
    spec: {
      origin_servers: [
        { public_name: { dns_name: "webserver.example.com" }, labels: { tier: "web" } }, // a public name
        { k8s_service: { service_name: "frontend.hipster", site_locator: { site: { name: "ce-site-1" } } } }, // a Kubernetes service on a site
      ],
      port: 443, // the pool port
      loadbalancer_algorithm: "ROUND_ROBIN", // the algorithm
      endpoint_selection: "LOCAL_PREFERRED", // endpoint selection
      healthcheck: [{ name: "http-hc" }], // a health check
      use_tls: { tls_config: { default_security: {} }, use_host_header_as_sni: {}, volterra_trusted_ca: {}, no_mtls: {} }, // TLS to origin
    },
  },
  null,
  2,
); // as the component holds it

/** The XC API reference's own example of a clear secret (read 2026-11-01). */
const XC_CLEAR = "string:///U2VjcmV0SW5mb3JtYXRpb24="; // never in a link
/** The XC Wingman guide's sample Blindfold secret (read 2026-11-01). */
const XC_BLINDFOLD = "string:///AAAACWN1c3RvbWVyMQAAAAEAAAAAAAAAaAIAAAAFA6ur/XkAAAEArc3DxZa69sWeIn9NRrHGcZlZaXLHWYjc57jIS76Z47AcU0jDmodz3lNEysVO2s"; // never in a link

/** A pool with mTLS to origin: two client certificates, one key in clear and one blindfolded. */
const MTLS = JSON.stringify({ metadata: { name: "pay-pool" }, spec: { origin_servers: [{ private_ip: { ip: "10.1.2.3", site_locator: { site: { name: "dc-1" } } } }], port: 8443, use_tls: { tls_config: { medium_security: {} }, sni: "pay.internal.example", use_server_verification: {}, use_mtls: { tls_certificates: [{ certificate_url: "string:///LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t", private_key: { clear_secret_info: { url: XC_CLEAR } } }, { certificate_url: "string:///LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t", private_key: { blindfold_secret_info: { location: XC_BLINDFOLD } } }] } } } }, null, 2); // two values replaced

/** The cases. */
export const F5XC_ORIGIN_POOL_SHARE_CASES = defineShareCases<OriginPoolShareState, OriginPoolShareState>({
  spec: ORIGIN_POOL_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // nothing to replace: the copy is the paste
    { id: "mtls-keys", state: { input: MTLS }, params: { input: MTLS.replace(XC_CLEAR, "[redacted]").replace(XC_BLINDFOLD, "[redacted]") }, restored: { input: MTLS.replace(XC_CLEAR, "[redacted]").replace(XC_BLINDFOLD, "[redacted]") }, mustNotContain: [XC_CLEAR, XC_BLINDFOLD, "U2VjcmV0SW5mb3JtYXRpb24="] }, // both kinds of SecretType secret
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "not-json", state: { input: "origin_servers: []" } }, // the page's parse error
    { id: "not-a-pool", state: { input: "{\"domains\": [\"a.example.com\"]}" } }, // no spec and no origin servers
  ],
  blocked: [
    { id: "pem-outside-secret-type", state: { input: EXAMPLE.replace("\"port\": 443", "\"port\": 443,\n    \"x-key\": \"-----BEGIN PRIVATE KEY-----\\nMIIBVgIBADANBgkqhkiG9w0BAQEFAASCAUAwggE8AgEAAkEA\\n-----END PRIVATE KEY-----\"") }, code: "secret" }, // RFC 7468 section 10's label, in a plain string
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
