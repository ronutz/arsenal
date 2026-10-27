// ============================================================================
// src/lib/share/cases/f5-cipher-string-expander.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 cipher-string explainer: the string goes as typed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { F5_CIPHER_STRING_SHARE, type F5CipherStringShareState } from "../../tools/f5-cipher-string-expander/share"; // the spec

/** The cases. */
export const F5_CIPHER_STRING_SHARE_CASES = defineShareCases<F5CipherStringShareState, F5CipherStringShareState>({
  spec: F5_CIPHER_STRING_SHARE, // the spec
  accept: [
    { id: "example", state: { input: "ECDHE:RSA:!SSLv3:!RC4:!EXP:!DES:!MD5:@STRENGTH" }, params: { input: "ECDHE:RSA:!SSLv3:!RC4:!EXP:!DES:!MD5:@STRENGTH" }, restored: { input: "ECDHE:RSA:!SSLv3:!RC4:!EXP:!DES:!MD5:@STRENGTH" } }, // the Example: ":", "!" and "@" survive
    { id: "rule-name", state: { input: "f5-secure" }, params: { input: "f5-secure" }, restored: { input: "f5-secure" } }, // a pre-built rule name
    { id: "plus-and-minus", state: { input: "DEFAULT:+SHA:-RSA" }, params: { input: "DEFAULT:+SHA:-RSA" }, restored: { input: "DEFAULT:+SHA:-RSA" } }, // "+" must not read as a space
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // no string
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
