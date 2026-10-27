// ============================================================================
// src/lib/share/cases/cipher.ts
// ----------------------------------------------------------------------------
// Share cases of the cipher suite decoder: the suite goes as typed, as the
// #input= handoff usePrefill already reads (define.ts checks readHandoff
// reads the same value).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CIPHER_SHARE, type CipherShareState } from "../../tools/cipher/share"; // the spec

/** The cases. */
export const CIPHER_SHARE_CASES = defineShareCases<CipherShareState, CipherShareState>({
  spec: CIPHER_SHARE, // the spec
  accept: [
    { id: "example", state: { input: "TLS_CHACHA20_POLY1305_SHA256" }, params: { input: "TLS_CHACHA20_POLY1305_SHA256" }, restored: { input: "TLS_CHACHA20_POLY1305_SHA256" } }, // the Example
    { id: "openssl-name", state: { input: "ECDHE-RSA-AES128-GCM-SHA256" }, params: { input: "ECDHE-RSA-AES128-GCM-SHA256" }, restored: { input: "ECDHE-RSA-AES128-GCM-SHA256" } }, // an OpenSSL name
    { id: "code-point", state: { input: "0x13,0x01" }, params: { input: "0x13,0x01" }, restored: { input: "0x13,0x01" } }, // a code point with a comma
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // no suite
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
