// ============================================================================
// src/lib/share/cases/xml-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the XML decoder: a document the page reads goes as pasted;
// a WS-Security UsernameToken password, a signed SAML assertion, a PEM
// private key or a JWT blocks the link; a secret-looking element or attribute
// is only named in the caution line; text the page does not read as XML has
// nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { XML_SHARE, type XmlShareState } from "../../tools/xml-decoder/share"; // the spec
import { SAML_GOLDEN_VECTORS } from "../../tools/saml-decoder/golden-vectors"; // a signed SAML response, pinned there

/** The page's Example: a catalogue with a DOCTYPE, an entity, a comment and CDATA. */
const EXAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE catalog [
  <!ENTITY company "Acme Corp">
]>
<catalog xmlns="http://example.com/cat" xmlns:meta="http://example.com/meta">
  <book id="bk101" meta:rating="5">
    <title>XML Guide</title>
    <author>&company;</author>
    <!-- first edition -->
    <summary><![CDATA[Uses <tags> & symbols freely]]></summary>
  </book>
</catalog>`; // verbatim
/** A configuration with a secret-looking attribute and element: named in the caution line, not blocked. */
const CONFIG = '<config>\n  <db host="db.internal" password="change-me-42"/>\n  <apiKey>k-12345</apiKey>\n</config>'; // maybe-secrets
/** A WS-Security header with a UsernameToken (OASIS UsernameToken Profile 1.1.1): its Password is a secret. */
const WSS = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">\n  <soap:Header>\n    <wsse:Security>\n      <wsse:UsernameToken>\n        <wsse:Username>svc-orders</wsse:Username>\n        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">Tr0ub4dor-3</wsse:Password>\n      </wsse:UsernameToken>\n    </wsse:Security>\n  </soap:Header>\n  <soap:Body/>\n</soap:Envelope>'; // a password in clear
/** RFC 7519 section 3.1's example JWT (read 2026-10-27), standing in for a live token. */
const RFC7519_JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // three base64url segments

/** The cases. */
export const XML_DECODER_SHARE_CASES = defineShareCases<XmlShareState, XmlShareState>({
  spec: XML_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "maybe-secrets-named", state: { input: CONFIG }, params: { input: CONFIG }, restored: { input: CONFIG } }, // named in the caution line, not blocked
    { id: "username-without-password", state: { input: WSS.replace(/\s*<wsse:Password[^]*?<\/wsse:Password>/, "") }, params: { input: WSS.replace(/\s*<wsse:Password[^]*?<\/wsse:Password>/, "") }, restored: { input: WSS.replace(/\s*<wsse:Password[^]*?<\/wsse:Password>/, "") } }, // a user name alone goes
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "not-xml", state: { input: "plain words, no markup" } }, // the page does not read it as XML
  ],
  blocked: [
    { id: "wss-password", state: { input: WSS }, code: "secret" }, // UsernameToken Profile: Password
    { id: "signed-saml-response", state: { input: SAML_GOLDEN_VECTORS.find((x) => x.id === "signed-response-full")!.input }, code: "secret" }, // a signed bearer assertion
    { id: "jwt-in-element", state: { input: `<token-response><id_token>${RFC7519_JWT}</id_token></token-response>` }, code: "secret" }, // a JWS
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
