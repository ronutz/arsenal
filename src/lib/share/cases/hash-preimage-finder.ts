// ============================================================================
// src/lib/share/cases/hash-preimage-finder.ts
// ----------------------------------------------------------------------------
// Share cases of the hash preimage finder: the hash (trimmed), the alphabet
// and the length go; a search result never does, and an arrival never starts
// a search (the component's part; these cases pin the link).
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { PREIMAGE_SHARE, type PreimageShareState } from "../../tools/hash-preimage-finder/share"; // the spec

/** MD5 of the empty string (the page's Example). */
const MD5_EMPTY = "d41d8cd98f00b204e9800998ecf8427e"; // the Example, verbatim from the tool's golden vectors
/** SHA-1 of "abc", written in capitals as some tools print it. */
const SHA1_ABC_UPPER = "A9993E364706816ABA3E25717850C26C9CD0D89D"; // the page reads hex in any case
/** SHA-256 of "abc". */
const SHA256_ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"; // hex

/** The cases. */
const CASES: ShareCases<PreimageShareState, PreimageShareState> = {
  spec: PREIMAGE_SHARE, // the spec
  accept: [
    { id: "example", state: { hash: MD5_EMPTY, charset: "digits", length: 6 }, params: { input: MD5_EMPTY, charset: "digits", length: "6" }, restored: { hash: MD5_EMPTY, charset: "digits", length: 6 } }, // the page's defaults
    { id: "sha1-upper-trimmed", state: { hash: `  ${SHA1_ABC_UPPER}\t`, charset: "lower", length: 3 }, params: { input: SHA1_ABC_UPPER, charset: "lower", length: "3" }, restored: { hash: SHA1_ABC_UPPER, charset: "lower", length: 3 } }, // trimmed as the page reads it
    { id: "sha256-mixed-alnum", state: { hash: SHA256_ABC, charset: "mixed-alnum", length: 5 }, params: { input: SHA256_ABC, charset: "mixed-alnum", length: "5" }, restored: { hash: SHA256_ABC, charset: "mixed-alnum", length: 5 } }, // the largest alphabet at its ceiling
  ],
  empty: [
    { id: "blank", state: { hash: "", charset: "digits", length: 6 } }, // nothing typed
    { id: "not-a-hash", state: { hash: "hello", charset: "digits", length: 6 } }, // the page cannot tell the algorithm
    { id: "33-hex-digits", state: { hash: `${MD5_EMPTY}0`, charset: "digits", length: 6 } }, // no algorithm has that length
  ],
  reject: [
    { id: "unknown-charset", values: { input: MD5_EMPTY, charset: "emoji", length: "4" } }, // not offered
    { id: "prototype-name", values: { input: MD5_EMPTY, charset: "constructor", length: "4" } }, // an object's own property, not an alphabet
    { id: "over-ceiling", values: { input: MD5_EMPTY, charset: "mixed-alnum", length: "6" } }, // that alphabet stops at 5
    { id: "length-zero", values: { input: MD5_EMPTY, charset: "digits", length: "0" } }, // at least 1
    { id: "length-missing", values: { input: MD5_EMPTY, charset: "digits", length: null } }, // required
    { id: "not-a-hash", values: { input: "password", charset: "lower", length: "7" } }, // a password is not a hash
    { id: "spaces-around", values: { input: ` ${MD5_EMPTY}`, charset: "digits", length: "6" } }, // the link carries the trimmed hash
  ],
};

/** The runner. */
export const HASH_PREIMAGE_FINDER_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
