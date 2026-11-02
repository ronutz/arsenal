// ============================================================================
// src/lib/share/cases/json-formatter.ts
// ----------------------------------------------------------------------------
// Share cases of the JSON formatter & validator: the box as pasted and the
// three choices, always written; a credential (the shared check's, or one of
// the five members a standard defines) blocks the link; a secret-looking
// name does not.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { JSON_FORMATTER_SHARE, type JsonFormatterShareState } from "../../tools/json-formatter/share"; // the spec

/** A small declaration with a secret-looking member: a caution, not a block. */
const WITH_PASSWORD = "{\n  \"user\": \"admin\",\n  \"password\": \"changeme\"\n}"; // "password" is a maybe
/** An OAuth token response: access_token is a credential by RFC 6749 sections 1.4 and 5.1 (values invented). */
const TOKEN_RESPONSE = "{\"access_token\":\"2YotnFZFEjr1zCsicMWpAA\",\"token_type\":\"Bearer\",\"expires_in\":3600}"; // RFC 6749 section 5.1's example value

/** The cases. */
export const JSON_FORMATTER_SHARE_CASES = defineShareCases<JsonFormatterShareState, JsonFormatterShareState>({
  spec: JSON_FORMATTER_SHARE, // the spec
  accept: [
    { id: "example", state: { input: "  42  ", mode: "pretty", indent: 2, sortKeys: false }, params: { input: "  42  ", mode: "pretty", indent: "2", sort: "0" }, restored: { input: "  42  ", mode: "pretty", indent: 2, sortKeys: false } }, // the page's Example, every choice written
    { id: "minify-tab-sorted", state: { input: "{\"b\":1,\"a\":[true,null]}", mode: "minify", indent: "tab", sortKeys: true }, params: { input: "{\"b\":1,\"a\":[true,null]}", mode: "minify", indent: "tab", sort: "1" }, restored: { input: "{\"b\":1,\"a\":[true,null]}", mode: "minify", indent: "tab", sortKeys: true } }, // other choices
    { id: "parse-error", state: { input: "{\"a\": 1,}", mode: "pretty", indent: 4, sortKeys: false }, params: { input: "{\"a\": 1,}", mode: "pretty", indent: "4", sort: "0" }, restored: { input: "{\"a\": 1,}", mode: "pretty", indent: 4, sortKeys: false } }, // an error with its line and column is a reading too
    { id: "maybe-secret-goes", state: { input: WITH_PASSWORD, mode: "pretty", indent: 2, sortKeys: false }, params: { input: WITH_PASSWORD, mode: "pretty", indent: "2", sort: "0" }, restored: { input: WITH_PASSWORD, mode: "pretty", indent: 2, sortKeys: false } }, // a secret-looking name: a caution line
  ],
  empty: [
    { id: "blank", state: { input: "", mode: "pretty", indent: 2, sortKeys: false } }, // nothing pasted
    { id: "spaces", state: { input: "  \n ", mode: "pretty", indent: 2, sortKeys: false } }, // white space
  ],
  blocked: [
    { id: "access-token", state: { input: TOKEN_RESPONSE, mode: "pretty", indent: 2, sortKeys: false }, code: "secret" }, // a member a standard defines as a credential
    { id: "client-secret", state: { input: "{\n  \"client_id\": \"s6BhdRkqt3\",\n  \"client_secret\": \"7Fjfp0ZBr1KtDRbnfVdmIw\"\n}", mode: "pretty", indent: 2, sortKeys: false }, code: "secret" }, // RFC 7591 section 3.2.1 (values RFC 6749 section 2.3.1's example)
    { id: "url-password", state: { input: "{\"dsn\": \"postgres://app:Pq7-secret@db.internal:5432/app\"}", mode: "pretty", indent: 2, sortKeys: false }, code: "secret" }, // a password in a URL
  ],
  reject: [
    { id: "no-input", values: { input: null, mode: "pretty", indent: "2", sort: "0" } }, // nothing to format
    { id: "unknown-mode", values: { input: "1", mode: "compact", indent: "2", sort: "0" } }, // not pretty or minify
    { id: "unknown-indent", values: { input: "1", mode: "pretty", indent: "8", sort: "0" } }, // not offered
    { id: "proto-indent", values: { input: "1", mode: "pretty", indent: "constructor", sort: "0" } }, // own keys only
    { id: "no-sort", values: { input: "1", mode: "pretty", indent: "2" } }, // every choice is written
  ],
});
