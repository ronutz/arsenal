// ============================================================================
// src/lib/share/cases/saml-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the SAML decoder: a message the page decodes goes as pasted,
// unless it carries a signed assertion (or one inside a signed Response) or
// an EncryptedAssertion, a credential that signs its subject in (SAML 2.0
// Profiles 3.3 and 4.1.4.5): no link then. Unsigned assertions and error
// responses go. Input the page refuses has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SAML_SHARE, type SamlShareState } from "../../tools/saml-decoder/share"; // the spec
import { SAML_GOLDEN_VECTORS, SAML_REJECT_VECTORS } from "../../tools/saml-decoder/golden-vectors"; // the tool's own vectors

/** A golden vector's input by id. */
const v = (id: string): string => SAML_GOLDEN_VECTORS.find((x) => x.id === id)!.input; // pinned there
/** A reject vector's input by id. */
const r = (id: string): string => SAML_REJECT_VECTORS.find((x) => x.id === id)!.input; // pinned there
/** The page's Example: an unsigned Response with an unsigned assertion. */
const EXAMPLE = '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Issuer>https://idp.example.com</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Subject><saml:NameID>u</saml:NameID></saml:Subject><saml:Conditions><saml:AudienceRestriction><saml:Audience>https://sp.example.com</saml:Audience></saml:AudienceRestriction></saml:Conditions></saml:Assertion></samlp:Response>'; // verbatim
/** An AuthnRequest: no assertion, nothing that signs anyone in. */
const AUTHN_REQUEST = '<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_q" Version="2.0" IssueInstant="2026-06-29T11:59:00Z" Destination="https://idp.example.com/sso" AssertionConsumerServiceURL="https://sp.example.com/acs"><saml:Issuer>https://sp.example.com</saml:Issuer></samlp:AuthnRequest>'; // the request to the IdP

/** The cases. */
export const SAML_DECODER_SHARE_CASES = defineShareCases<SamlShareState, SamlShareState>({
  spec: SAML_SHARE, // the spec
  accept: [
    { id: "example-unsigned", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // anyone can write it: it signs no one in
    { id: "error-response", state: { input: v("status-not-success") }, params: { input: v("status-not-success") }, restored: { input: v("status-not-success") } }, // Profiles 4.1.4.2: no assertions in an error
    { id: "authn-request", state: { input: AUTHN_REQUEST }, params: { input: AUTHN_REQUEST }, restored: { input: AUTHN_REQUEST } }, // the SP's request
    { id: "two-unsigned-assertions", state: { input: v("multiple-assertions") }, params: { input: v("multiple-assertions") }, restored: { input: v("multiple-assertions") } }, // unsigned
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "gibberish", state: { input: r("gibberish") } }, // the page refuses it
    { id: "xxe", state: { input: r("xxe-external-entity") } }, // refused before any decoding
  ],
  blocked: [
    { id: "signed-response", state: { input: v("signed-response-full") }, code: "assertion" }, // a signed bearer assertion
    { id: "signed-base64-post", state: { input: v("base64-post-binding") }, code: "assertion" }, // the same, as the HTTP-POST binding sends it
    { id: "sha1-signed", state: { input: v("weak-sha1-signature") }, code: "assertion" }, // a weak signature is still a signature
    { id: "encrypted", state: { input: v("encrypted-assertion") }, code: "assertion" }, // the SP can open it
    { id: "bare-signed-assertion", state: { input: v("bare-assertion") }, code: "assertion" }, // an assertion alone
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "  " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
