// ============================================================================
// src/lib/share/cases/pkce.ts
// ----------------------------------------------------------------------------
// Share cases of the PKCE tool: only RFC 7636 Appendix B's example verifier
// ever travels; every other verifier is blocked, and an arriving one is
// refused and stripped.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { PKCE_PUBLISHED_VERIFIER, PKCE_SHARE, type PkceShareInput, type PkceShareState } from "../../tools/pkce/share"; // the spec

/** A verifier of the generator's shape (43 base64url characters), as a real sign-in would hold. */
const REAL = "M25iVXpKU3puUjFaYWg3T1NDTDQtcW1ROUY5YXlwalNoc0hhakxifmZHag"; // made up for these cases; never published

/** The cases. */
const CASES: ShareCases<PkceShareInput, PkceShareState> = {
  spec: PKCE_SHARE, // the spec
  accept: [
    { id: "rfc7636-example", state: { verifier: PKCE_PUBLISHED_VERIFIER, hasResult: true }, params: { input: PKCE_PUBLISHED_VERIFIER }, restored: { verifier: PKCE_PUBLISHED_VERIFIER } }, // the Example
  ],
  empty: [
    { id: "blank", state: { verifier: "", hasResult: false } }, // nothing typed
    { id: "no-result-yet", state: { verifier: PKCE_PUBLISHED_VERIFIER, hasResult: false } }, // the challenge is still being derived
  ],
  blocked: [
    { id: "real-verifier", state: { verifier: REAL, hasResult: true }, code: "verifier" }, // a secret
    { id: "example-with-space", state: { verifier: `${PKCE_PUBLISHED_VERIFIER} `, hasResult: true }, code: "verifier" }, // not the example as printed
    { id: "short-invalid", state: { verifier: "abc", hasResult: true }, code: "verifier" }, // even one the RFC calls invalid
  ],
  reject: [
    { id: "real-verifier", values: { input: REAL } }, // never fills a page
    { id: "example-lower-case", values: { input: PKCE_PUBLISHED_VERIFIER.toLowerCase() } }, // byte for byte only
    { id: "empty", values: { input: "" } }, // nothing
  ],
};

/** The runner. */
export const PKCE_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
