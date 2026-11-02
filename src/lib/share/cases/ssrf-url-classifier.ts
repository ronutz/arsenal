// ============================================================================
// src/lib/share/cases/ssrf-url-classifier.ts
// ----------------------------------------------------------------------------
// Share cases of the SSRF URL classifier: the URL goes with any password
// before its "@" replaced by [redacted] (RFC 3986 section 3.2.1), and the
// copy classifies the same; a user name alone goes as typed; a password the
// page shows in the path, a JWT or an AWS access key ID blocks the link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SSRF_SHARE, type SsrfShareState } from "../../tools/ssrf-url-classifier/share"; // the spec
import { VECTORS } from "../../tools/ssrf-url-classifier/golden-vectors"; // the tool's own vectors

/** The page's Example (the decimal-encoded metadata URL). */
const EXAMPLE = VECTORS.find((v) => v.name === "decimal-encoded metadata URL (the Example button)")!.input; // verbatim
/** A password standing in for a live one. */
const PASSWORD = "Adm1n-Pa55"; // never in a link
/** RFC 7519 section 3.1's example JWT (read 2026-10-27), standing in for a live token. */
const RFC7519_JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // three base64url segments

/** The cases. */
export const SSRF_URL_SHARE_CASES = defineShareCases<SsrfShareState, SsrfShareState>({
  spec: SSRF_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // no userinfo: the URL as typed
    { id: "password-replaced", state: { input: `http://admin:${PASSWORD}@10.0.0.5:8080/manager/html` }, params: { input: "http://admin:[redacted]@10.0.0.5:8080/manager/html" }, restored: { input: "http://admin:[redacted]@10.0.0.5:8080/manager/html" }, mustNotContain: [PASSWORD] }, // RFC 3986 3.2.1
    { id: "metadata-with-credentials", state: { input: "http://user:pass@169.254.169.254/" }, params: { input: "http://user:[redacted]@169.254.169.254/" }, restored: { input: "http://user:[redacted]@169.254.169.254/" }, mustNotContain: [":pass@"] }, // the tool's own vector "embedded credentials"
    { id: "user-name-alone", state: { input: "http://expected.example.com@127.0.0.1/" }, params: { input: "http://expected.example.com@127.0.0.1/" }, restored: { input: "http://expected.example.com@127.0.0.1/" } }, // the trick being studied goes as typed
    { id: "token-named", state: { input: "http://169.254.169.254/latest/api/token?access_token=4f3c2b1a9e" }, params: { input: "http://169.254.169.254/latest/api/token?access_token=4f3c2b1a9e" }, restored: { input: "http://169.254.169.254/latest/api/token?access_token=4f3c2b1a9e" } }, // a maybe-secret is named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "  " } }, // nothing typed
  ],
  blocked: [
    { id: "password-in-path", state: { input: "user:pass@169.254.169.254" }, code: "password" }, // no "//": the page reads "pass@..." as the path it shows
    { id: "jwt-in-query", state: { input: `https://internal.example.net/callback?id_token=${RFC7519_JWT}` }, code: "secret" }, // a JWS
    { id: "aws-access-key", state: { input: "https://bucket.s3.amazonaws.com/report.csv?X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20261027%2Fus-east-1%2Fs3%2Faws4_request" }, code: "secret" }, // AWS's documented example key ID
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
