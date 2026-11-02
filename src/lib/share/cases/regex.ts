// ============================================================================
// src/lib/share/cases/regex.ts
// ----------------------------------------------------------------------------
// Share cases of the regex toolkit: the pattern, the flags and the test text
// as typed; a credential in the pattern or the test text blocks the link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { REGEX_SHARE, type RegexShareState } from "../../tools/regex/share"; // the spec

/** A JWS in compact form with an "alg" header, invented for this case (its signature is not a signature). */
const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXJlLW5vdC1hLXNpZ25hdHVyZQ"; // a JWT's shape

/** The cases. */
export const REGEX_SHARE_CASES = defineShareCases<RegexShareState, RegexShareState>({
  spec: REGEX_SHARE, // the spec
  accept: [
    { id: "example", state: { input: "\\d+", flags: "g", text: "a1b22c333" }, params: { input: "\\d+", flags: "g", text: "a1b22c333" }, restored: { input: "\\d+", flags: "g", text: "a1b22c333" } }, // the page's Example
    { id: "portability-example", state: { input: "(?<=user=)(?<name>\\w+)\\b", flags: "g", text: "user=admin&role=ops" }, params: { input: "(?<=user=)(?<name>\\w+)\\b", flags: "g", text: "user=admin&role=ops" }, restored: { input: "(?<=user=)(?<name>\\w+)\\b", flags: "g", text: "user=admin&role=ops" } }, // the second Example
    { id: "pattern-alone-no-flags", state: { input: "^(a+)+$", flags: "", text: "" }, params: { input: "^(a+)+$", flags: "", text: "" }, restored: { input: "^(a+)+$", flags: "", text: "" } }, // a risky pattern, no test text: Run anyway is never pressed by a link
    { id: "maybe-secret-goes", state: { input: "token=(\\w+)", flags: "gi", text: "token=abc123def\nTOKEN=zz" }, params: { input: "token=(\\w+)", flags: "gi", text: "token=abc123def\nTOKEN=zz" }, restored: { input: "token=(\\w+)", flags: "gi", text: "token=abc123def\nTOKEN=zz" } }, // a secret-looking name: a caution line
  ],
  empty: [
    { id: "no-pattern", state: { input: "", flags: "g", text: "some text" } }, // nothing to read
  ],
  blocked: [
    { id: "jwt-in-text", state: { input: "^[\\w-]+\\.[\\w-]+\\.[\\w-]*$", flags: "", text: JWT }, code: "secret" }, // a JWT in the test text
    { id: "pem-in-text", state: { input: "BEGIN", flags: "", text: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\n-----END PRIVATE KEY-----" }, code: "secret" }, // a PEM private key
  ],
  reject: [
    { id: "no-pattern", values: { input: null, text: "x" } }, // a pattern is required
    { id: "empty-pattern", values: { input: "", flags: "g" } }, // empty
    { id: "flags-too-long", values: { input: "a", flags: "g".repeat(17) } }, // not flags
  ],
});
