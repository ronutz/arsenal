// ============================================================================
// src/lib/share/cases/xml-formatter.ts
// ----------------------------------------------------------------------------
// Share cases of the XML formatter & validator: the document as pasted and
// the three choices, always written; the XML decoder's credentials (a
// WS-Security password, a signed SAML assertion, the shared check's) block.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { XML_FORMATTER_SHARE, type XmlFormatterShareState } from "../../tools/xml-formatter/share"; // the spec
import { SAML_COMPACT } from "../../tools/xml-formatter/golden-vectors"; // the page's Example

/** A WS-Security UsernameToken with a password in clear (OASIS UsernameToken Profile 1.1.1); invented values. */
const WSSE = "<wsse:Security xmlns:wsse=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd\"><wsse:UsernameToken><wsse:Username>svc</wsse:Username><wsse:Password>Tr0ub4dor</wsse:Password></wsse:UsernameToken></wsse:Security>"; // a credential

/** The cases. */
export const XML_FORMATTER_SHARE_CASES = defineShareCases<XmlFormatterShareState, XmlFormatterShareState>({
  spec: XML_FORMATTER_SHARE, // the spec
  accept: [
    { id: "example", state: { input: SAML_COMPACT, mode: "pretty", indent: 2, comments: "keep" }, params: { input: SAML_COMPACT, mode: "pretty", indent: "2", comments: "keep" }, restored: { input: SAML_COMPACT, mode: "pretty", indent: 2, comments: "keep" } }, // the page's Example (unsigned)
    { id: "minify-drop", state: { input: "<a>\n  <!-- c -->\n  <b x=\"1\"/>\n</a>", mode: "minify", indent: "tab", comments: "drop" }, params: { input: "<a>\n  <!-- c -->\n  <b x=\"1\"/>\n</a>", mode: "minify", indent: "tab", comments: "drop" }, restored: { input: "<a>\n  <!-- c -->\n  <b x=\"1\"/>\n</a>", mode: "minify", indent: "tab", comments: "drop" } }, // other choices
    { id: "not-well-formed", state: { input: "<a><b></a>", mode: "pretty", indent: 4, comments: "keep" }, params: { input: "<a><b></a>", mode: "pretty", indent: "4", comments: "keep" }, restored: { input: "<a><b></a>", mode: "pretty", indent: 4, comments: "keep" } }, // an error with its line is a reading too
    { id: "maybe-secret-goes", state: { input: "<config><apiKey>abc123xyz</apiKey></config>", mode: "pretty", indent: 2, comments: "keep" }, params: { input: "<config><apiKey>abc123xyz</apiKey></config>", mode: "pretty", indent: "2", comments: "keep" }, restored: { input: "<config><apiKey>abc123xyz</apiKey></config>", mode: "pretty", indent: 2, comments: "keep" } }, // a secret-looking element: a caution line
  ],
  empty: [
    { id: "blank", state: { input: "", mode: "pretty", indent: 2, comments: "keep" } }, // nothing pasted
  ],
  blocked: [
    { id: "wsse-password", state: { input: WSSE, mode: "pretty", indent: 2, comments: "keep" }, code: "secret" }, // a WS-Security password
  ],
  reject: [
    { id: "no-input", values: { input: null, mode: "pretty", indent: "2", comments: "keep" } }, // nothing to format
    { id: "unknown-indent", values: { input: "<a/>", mode: "pretty", indent: "3", comments: "keep" } }, // not offered
    { id: "unknown-comments", values: { input: "<a/>", mode: "pretty", indent: "2", comments: "strip" } }, // not offered
    { id: "no-mode", values: { input: "<a/>", indent: "2", comments: "keep" } }, // every choice is written
  ],
});
