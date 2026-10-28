// ============================================================================
// src/lib/share/cases/f5os-restconf-path-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the F5OS RESTCONF path explainer: the path or address goes as
// typed (posture input-caution); an address with a password in its userinfo
// gets no link (RFC 3986 section 3.2.1); a user name alone goes.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { F5OS_PATH_SHARE, type F5osPathShareState } from "../../tools/f5os-restconf-path-explainer/share"; // the spec

/** The page's Example: a full address on port 8888. */
const EXAMPLE = "https://velos.example.net:8888/restconf/data/f5-tenants:tenants/tenant=tenant1/config/running-state"; // as the component holds it

/** The cases. */
export const F5OS_PATH_SHARE_CASES = defineShareCases<F5osPathShareState, F5osPathShareState>({
  spec: F5OS_PATH_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // ":", "=", "/" kept
    { id: "query", state: { input: "/restconf/data/openconfig-system:system?depth=3&content=config" }, params: { input: "/restconf/data/openconfig-system:system?depth=3&content=config" }, restored: { input: "/restconf/data/openconfig-system:system?depth=3&content=config" } }, // "?" and "&" inside the value
    { id: "user-name-only", state: { input: "https://admin@r5900.example.net:443/api/data/f5-system-slot:slots" }, params: { input: "https://admin@r5900.example.net:443/api/data/f5-system-slot:slots" }, restored: { input: "https://admin@r5900.example.net:443/api/data/f5-system-slot:slots" } }, // a user name is not a password
    { id: "empty-password", state: { input: "https://admin:@velos.example.net:8888/restconf/data/f5-cluster:cluster" }, params: { input: "https://admin:@velos.example.net:8888/restconf/data/f5-cluster:cluster" }, restored: { input: "https://admin:@velos.example.net:8888/restconf/data/f5-cluster:cluster" } }, // RFC 3986: an empty string after the colon is no password
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "white-space", state: { input: "  \n" } }, // only white space
  ],
  blocked: [ // a reading exists, but no link may carry the paste
    { id: "userinfo-password", state: { input: "https://admin:Velos-Pass1@velos.example.net:8888/restconf/data/openconfig-system:system" }, code: "password" }, // user:password@
    { id: "curl-line", state: { input: "curl -sku https://admin:secret@10.255.0.1:8888/restconf/data/f5-tenants:tenants" }, code: "password" }, // anywhere in the text
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "\n" } }, // only white space
  ],
});
