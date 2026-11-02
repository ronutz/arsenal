// ============================================================================
// src/lib/share/cases/f5xc-object-linter-revealed.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC object linter's reveal switch (2026-11-01, wave 4B;
// THE REVEAL SWITCH of 01/11/2026). Ticked in the popover, the link carries
// the object as pasted, its added header and cookie values included. It is
// offered only when the copy replaced such values alone: never beside a
// SecretType secret or an Authorization value, never when nothing was
// replaced.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { OBJECT_LINTER_SHARE_REVEALED, type ObjectLinterShareState } from "../../tools/f5xc-object-linter/share"; // the spec

/** A load balancer that adds a response header and a request cookie (as in the redacted copy's cases). */
const HEADERS = JSON.stringify({ metadata: { name: "edge-lb" }, spec: { domains: ["shop.example.com"], https_auto_cert: { http_redirect: true }, app_firewall: { name: "waf" }, response_headers_to_add: [{ name: "X-Frame-Options", value: "DENY" }], request_cookies_to_add: [{ name: "region", value: "eu" }] } }, null, 2); // two values a reader may send
/** The same load balancer adding an X-Api-Key header: a secret-looking name, never revealed. */
const API_KEY = JSON.stringify({ metadata: { name: "edge-lb" }, spec: { domains: ["shop.example.com"], app_firewall: { name: "waf" }, http: {}, request_headers_to_add: [{ name: "X-Api-Key", value: "k-123-sample" }] } }, null, 2); // replaced, not revealable
/** An origin pool whose mTLS key is blindfolded (the XC Wingman guide's sample, read 2026-11-01). */
const POOL_BLINDFOLD = JSON.stringify({ spec: { origin_servers: [{ public_ip: { ip: "203.0.113.10" } }], use_tls: { use_mtls: { tls_certificates: [{ certificate_url: "string:///LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t", private_key: { blindfold_secret_info: { location: "string:///AAAACWN1c3RvbWVyMQAAAAEAAAAAAAAAaAIAAAAFA6ur/XkAAAEArc3DxZa69sWeIn9NRrHGcZlZaXLHWYjc57jIS76Z47AcU0jDmodz3lNEysVO2s" } } }] } } } }, null, 2); // a SecretType secret

/** The cases. */
export const F5XC_OBJECT_LINTER_REVEALED_SHARE_CASES = defineShareCases<ObjectLinterShareState, ObjectLinterShareState>({
  spec: OBJECT_LINTER_SHARE_REVEALED, // the spec
  variant: "revealed", // registers as f5xc-object-linter:revealed
  accept: [
    { id: "headers-as-pasted", state: { input: HEADERS }, params: { input: HEADERS }, restored: { input: HEADERS } }, // the values included, by choice
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "secret-looking-header", state: { input: API_KEY } }, // never revealed
    { id: "blindfolded-key", state: { input: POOL_BLINDFOLD } }, // never revealed
    { id: "nothing-replaced", state: { input: "{\"spec\": {\"monitoring\": {}}}" } }, // nothing to reveal
  ],
  blocked: [],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
