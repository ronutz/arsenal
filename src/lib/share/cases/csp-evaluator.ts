// ============================================================================
// src/lib/share/cases/csp-evaluator.ts
// ----------------------------------------------------------------------------
// Share cases of the CSP evaluator: the box goes as pasted once the page has
// read a policy; a Cookie, Set-Cookie or Authorization line (a whole response
// pasted here) blocks the link; a token in a report endpoint is only named in
// the caution line; a box with no policy in it has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CSP_SHARE, type CspShareState } from "../../tools/csp-evaluator/share"; // the spec
import { VECTORS } from "../../tools/csp-evaluator/golden-vectors"; // the tool's own vectors

/** A vector's policy by id. */
const policy = (id: string): string => VECTORS.find((v) => v.id === id)!.input.policy; // pinned there
/** The page's Example (legacy-allowlist). */
const EXAMPLE = policy("legacy-allowlist"); // verbatim
/** A nonce-based strict policy (strict-nonce). */
const STRICT = policy("strict-nonce"); // verbatim
/** A header line whose report endpoint has a token in its query: a maybe-secret, named, not blocked. */
const REPORT_TOKEN = "Content-Security-Policy: default-src 'self'; report-uri https://reports.example.com/csp?token=7f3a9c21"; // one header line
/** RFC 6265 section 4.2.1's session identifier, standing in for a live one. */
const SID = "31d4d96e407aad42"; // never in a link

/** The cases. */
export const CSP_EVALUATOR_SHARE_CASES = defineShareCases<CspShareState, CspShareState>({
  spec: CSP_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example
    { id: "strict-nonce", state: { input: STRICT }, params: { input: STRICT }, restored: { input: STRICT } }, // a nonce goes with the caution line
    { id: "report-token-named", state: { input: REPORT_TOKEN }, params: { input: REPORT_TOKEN }, restored: { input: REPORT_TOKEN } }, // a maybe-secret does not block
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "no-policy", state: { input: ",, ," } }, // no policy read
  ],
  blocked: [
    { id: "response-with-cookie", state: { input: `HTTP/1.1 200 OK\nContent-Security-Policy: ${EXAMPLE}\nSet-Cookie: SID=${SID}; Path=/; Secure; HttpOnly` }, code: "secret" }, // RFC 6265 4.1.1
    { id: "authorization-line", state: { input: `${EXAMPLE}\nAuthorization: Negotiate YIIBhgYGKwYBBQUCoIIBejCCAXagGDAWBgkqhkiC9xIBAgIGCSqGSIb3EgECAg` }, code: "secret" }, // RFC 9110 11.6.2: any scheme
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "\n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
