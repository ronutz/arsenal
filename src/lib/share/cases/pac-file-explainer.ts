// ============================================================================
// src/lib/share/cases/pac-file-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the PAC file explainer (2026-11-01, wave 4B): the file goes as
// pasted once the page reads it, with a caution line (internal hosts, a
// tenant); a secret-looking variable is only named in that line; a JWT
// blocks the link; an empty box (the reference) has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PAC_SHARE, type PacShareState } from "../../tools/pac-file-explainer/share"; // the spec

/** The page's Example: Netskope's Cloud Explicit Proxy template, as the component holds it. */
const EXAMPLE = `function FindProxyForURL(url, host) {
  url = url.toLowerCase();
  host = host.toLowerCase();
  if (isPlainHostName(host)) {
    return "DIRECT";
  }
  if (shExpMatch(host, "*.login.microsoftonline.com")) {
    return "DIRECT";
  }
  if (url.substring(0, 5) == "http:" || url.substring(0, 6) == "https:") {
    return "PROXY eproxy-acme.goskope.com:8081";
  }
  return "DIRECT";
}`; // verbatim

/** A file with a variable whose name looks secret: named in the caution line, not blocked. */
const TOKEN_VAR = `var token = "t-0001-sample";\nfunction FindProxyForURL(url, host) {\n  if (dnsDomainIs(host, ".corp.example")) return "DIRECT";\n  return "PROXY proxy.corp.example:3128; DIRECT";\n}`; // a failover chain

/** RFC 7519 section 3.1's example JWT (read 2026-11-01). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link

/** The cases. */
export const PAC_FILE_SHARE_CASES = defineShareCases<PacShareState, PacShareState>({
  spec: PAC_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "token-variable-named", state: { input: TOKEN_VAR }, params: { input: TOKEN_VAR }, restored: { input: TOKEN_VAR } }, // a maybe-secret does not block
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // the reference, not a reading
    { id: "white-space", state: { input: "\n  \n" } }, // the reference too
  ],
  blocked: [
    { id: "jwt-in-a-comment", state: { input: `// sso: ${JWT}\n${EXAMPLE}` }, code: "secret" }, // a JWS
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
