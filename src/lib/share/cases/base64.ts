// ============================================================================
// src/lib/share/cases/base64.ts
// ----------------------------------------------------------------------------
// Share cases of the Base64, Base32, Hex and Percent codec: the text goes as
// typed with the choices that differ from the defaults; an unknown choice
// makes the share malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { BASE64_SHARE, type Base64ShareState } from "../../tools/base64/share"; // the spec

/** The cases. */
export const BASE64_SHARE_CASES = defineShareCases<Base64ShareState, Base64ShareState>({
  spec: BASE64_SHARE, // the spec
  accept: [
    { id: "example", state: { text: "foobar", direction: "encode", codec: "base64", layers: 1 }, params: { text: "foobar" }, restored: { text: "foobar", direction: "encode", codec: "base64", layers: 1 } }, // the Example: defaults left out
    { id: "basic-decode", state: { text: "QWxhZGRpbjpvcGVuIHNlc2FtZQ==", direction: "decode", codec: "base64", layers: 1 }, params: { text: "QWxhZGRpbjpvcGVuIHNlc2FtZQ==", direction: "decode" }, restored: { text: "QWxhZGRpbjpvcGVuIHNlc2FtZQ==", direction: "decode", codec: "base64", layers: 1 } }, // RFC 7617's example credentials: "=" and "+" survive
    { id: "base16-two-layers", state: { text: "foo bar", direction: "encode", codec: "base16", layers: 2 }, params: { text: "foo bar", codec: "base16", layers: "2" }, restored: { text: "foo bar", direction: "encode", codec: "base16", layers: 2 } }, // a space is data when encoding
    { id: "percent-decode-three", state: { text: "%2525%2541", direction: "decode", codec: "percent", layers: 3 }, params: { text: "%2525%2541", direction: "decode", codec: "percent", layers: "3" }, restored: { text: "%2525%2541", direction: "decode", codec: "percent", layers: 3 } }, // percent signs stay text
    { id: "trailing-newline", state: { text: "line\n", direction: "encode", codec: "base64url", layers: 1 }, params: { text: "line\n", codec: "base64url" }, restored: { text: "line\n", direction: "encode", codec: "base64url", layers: 1 } }, // white space kept as typed
  ],
  arrive: [
    { id: "defaults", values: { text: "x", direction: null, codec: null, layers: null }, restored: { text: "x", direction: "encode", codec: "base64", layers: 1 } }, // absent choices take the defaults
  ],
  empty: [
    { id: "nothing", state: { text: "", direction: "decode", codec: "base32", layers: 2 } }, // no text, whatever the choices
  ],
  reject: [
    { id: "no-text", values: { text: null, direction: "decode", codec: null, layers: null } }, // choices alone
    { id: "unknown-direction", values: { text: "x", direction: "both", codec: null, layers: null } }, // not offered
    { id: "unknown-codec", values: { text: "x", direction: null, codec: "base58", layers: null } }, // not offered
    { id: "layers-zero", values: { text: "x", direction: null, codec: null, layers: "0" } }, // the page offers 1 to 3
    { id: "layers-four", values: { text: "x", direction: null, codec: null, layers: "4" } }, // the page offers 1 to 3
    { id: "layers-not-integer", values: { text: "x", direction: null, codec: null, layers: "1.0" } }, // only the three plain digits
    { id: "codec-prototype-name", values: { text: "x", direction: null, codec: "constructor", layers: null } }, // not an offered codec
  ],
});
