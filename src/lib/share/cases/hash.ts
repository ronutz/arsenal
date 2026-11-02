// ============================================================================
// src/lib/share/cases/hash.ts
// ----------------------------------------------------------------------------
// Share cases of the hash tool. Text: the text as typed, the algorithm when
// not SHA-256, and the compare box when it compares with the text; a text
// holding a credential is blocked. File: only the file's digest, in the
// compare box's place; never the file, never its name.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { HASH_SHARE, type HashShareInput, type HashShareState } from "../../tools/hash/share"; // the spec

/** SHA-256 of "abc" (the page's Example, from the tool's golden vectors). */
const ABC_SHA256 = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"; // hex
/** SHA-1 of "abc". */
const ABC_SHA1 = "a9993e364706816aba3e25717850c26c9cd0d89d"; // hex
/** A file's SHA-384 (of no particular file; the spec carries whatever the page computed). */
const FILE_SHA384 = "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b"; // SHA-384 of the empty string
/** A file's name, which never travels. */
const FILE_NAME = "Q3-salaries.xlsx"; // the kind of name a link must not reveal
/** A sha256sum line for the compare box. */
const SUM_LINE = `${ABC_SHA256}  abc.txt`; // two spaces, as sha256sum prints

/** The cases. */
const CASES: ShareCases<HashShareInput, HashShareState> = {
  spec: HASH_SHARE, // the spec
  accept: [
    { // the Example, default algorithm, empty compare box
      id: "text-example", state: { part: "text", text: "abc", algorithm: "SHA-256", expected: "", hasResult: true, compareText: true },
      params: { input: "abc" }, restored: { text: "abc", algorithm: "SHA-256", expected: null },
    },
    { // SHA-1 shown, a sha256sum line in the compare box (trimmed, as the box reads it)
      id: "text-sha1-compare", state: { part: "text", text: "abc", algorithm: "SHA-1", expected: `  ${SUM_LINE} `, hasResult: true, compareText: true },
      params: { input: "abc", algorithm: "SHA-1", expected: SUM_LINE }, restored: { text: "abc", algorithm: "SHA-1", expected: SUM_LINE },
    },
    { // a compare box that compares with a file stays out of a text link
      id: "text-compare-with-file", state: { part: "text", text: "line 1\r\nline 2\n", algorithm: "SHA-512", expected: ABC_SHA1, hasResult: true, compareText: false },
      params: { input: "line 1\r\nline 2\n", algorithm: "SHA-512" }, restored: { text: "line 1\r\nline 2\n", algorithm: "SHA-512", expected: null },
    },
    { // a file: only its digest, never its bytes or its name
      id: "file-sha384", state: { part: "file", hex: FILE_SHA384, algorithm: "SHA-384" },
      params: { expected: FILE_SHA384, algorithm: "SHA-384" }, restored: { text: null, algorithm: "SHA-384", expected: FILE_SHA384 },
      mustNotContain: [FILE_NAME],
    },
    { // a file with the default algorithm
      id: "file-sha256", state: { part: "file", hex: ABC_SHA256, algorithm: "SHA-256" },
      params: { expected: ABC_SHA256 }, restored: { text: null, algorithm: "SHA-256", expected: ABC_SHA256 },
    },
  ],
  empty: [
    { id: "text-blank", state: { part: "text", text: "", algorithm: "SHA-256", expected: "", hasResult: false, compareText: true } }, // nothing typed
    { id: "text-hashing", state: { part: "text", text: "abc", algorithm: "SHA-256", expected: "", hasResult: false, compareText: true } }, // not hashed yet
    { id: "no-file", state: { part: "file", hex: null, algorithm: "SHA-256" } }, // no file hashed
  ],
  blocked: [
    { id: "jwt-in-text", state: { part: "text", text: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c", algorithm: "SHA-256", expected: "", hasResult: true, compareText: true }, code: "secret" }, // a token hashed for a log
    { id: "authorization-header", state: { part: "text", text: "GET / HTTP/1.1\nAuthorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==\n", algorithm: "SHA-256", expected: "", hasResult: true, compareText: true }, code: "secret" }, // RFC 7617's example credentials
    { id: "password-assignment", state: { part: "text", text: "db_password=hunter2", algorithm: "SHA-256", expected: "", hasResult: true, compareText: true }, code: "secret" }, // a value set to a secret-looking name
  ],
  reject: [
    { id: "unknown-algorithm", values: { input: "abc", algorithm: "MD5", expected: null } }, // not offered
    { id: "two-line-compare", values: { input: "abc", algorithm: null, expected: `${ABC_SHA256}\nother` } }, // the box holds one line
    { id: "file-not-a-digest", values: { input: null, algorithm: null, expected: "abc.txt" } }, // a file link carries a digest
    { id: "file-wrong-length", values: { input: null, algorithm: "SHA-384", expected: ABC_SHA256 } }, // a SHA-256 digest is not a SHA-384 one
    { id: "file-upper-case", values: { input: null, algorithm: null, expected: ABC_SHA256.toUpperCase() } }, // the page writes lower-case hex
    { id: "secret-text", values: { input: "Authorization: Bearer mF_9.B5f-4.1JqM", algorithm: null, expected: null } }, // RFC 6750's example token: never fills a page
    { id: "nothing", values: { input: null, algorithm: "SHA-1", expected: null } }, // neither part
  ],
};

/** The runner. */
export const HASH_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
