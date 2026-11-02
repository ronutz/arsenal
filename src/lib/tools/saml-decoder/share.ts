// ============================================================================
// src/lib/tools/saml-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the SAML 2.0 decoder (posture "input-caution",
// raised from "input" on 2026-10-27; the manifest: "a decoded assertion
// carries PII + a bearer token"). A link carries the message as pasted (raw
// XML, URL-encoded or base64), once the page has decoded it, with a caution
// line: a SAML message names its issuer, its audience and, in a subject, a
// person.
//
// No link while the message carries a credential (code "assertion"): an
// assertion that is signed (or sits in a signed Response), or an
// EncryptedAssertion. SAML 2.0 Profiles (OASIS, 15 March 2005, read
// 2026-10-27): section 3.3, with the bearer method "The subject of the
// assertion is the bearer of the assertion"; section 4.1.4.5, "If the HTTP
// POST binding is used to deliver the <Response>, the enclosed assertion(s)
// MUST be signed"; the service provider keeps used IDs only "for the length
// of time for which the assertion would be considered valid". So a signed
// assertion is what signs its subject in, and a link to it would hand that to
// anyone it reaches until it expires; an EncryptedAssertion (SAML 2.0 Core
// section 2.3.4) is one the service provider can open. Removing the signature
// would change what the page shows (signed, which algorithm), so the message
// is blocked, not copied. Everything else gets a link: an AuthnRequest, a
// LogoutRequest or LogoutResponse, metadata, an error Response (Profiles
// 4.1.4.2: an error "MUST NOT include any assertions"), and an assertion with
// no signature (anyone can write one; it signs no one in where signatures are
// required).
//
// Arrival: the message fills the box as a paste would and the page decodes it
// (locally; it never verifies, fetches or decrypts). Any non-blank text is
// accepted, exactly as a paste is.
// ============================================================================

import { analyzeSaml, type SamlReport } from "./compute"; // the page's own decoder
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface SamlShareState {
  /** The box as pasted. */
  input: string;
}

/**
 * Whether a decoded message carries an assertion a service provider would accept as a credential.
 * @param r the page's report
 * @returns true for a signed assertion, an assertion inside a signed Response, or an EncryptedAssertion
 */
export function samlCarriesCredential(r: SamlReport): boolean {
  if (r.encryptedAssertionCount > 0) return true; // the service provider can decrypt it
  if (r.assertions.some((a) => a.signed)) return true; // a signed assertion
  return r.signedResponse && r.assertions.length > 0; // a signed Response covers the assertions in it
} // samlCarriesCredential

/**
 * Encode from a report the page already made.
 * @param s the state
 * @param r the page's report (null while there is none: a blank box or one it refuses)
 * @returns the box, nothing, or blocked
 */
export function encodeSamlShare(s: SamlShareState, r: SamlReport | null): ShareEncoding {
  if (!r) return { ok: false, reason: "empty" }; // nothing decoded
  if (samlCarriesCredential(r)) return { ok: false, reason: "blocked", code: "assertion", values: { encrypted: r.encryptedAssertionCount > 0 ? "yes" : "no" } }; // no link
  return { ok: true, params: { input: s.input } }; // the message as pasted
} // encodeSamlShare

/** The spec. */
export const SAML_SHARE: ShareSpec<SamlShareState> = Object.freeze({
  tool: "saml-decoder", // the slug
  posture: "input-caution", // the message as pasted, with a caution line; none with a signed or encrypted assertion
  carriesKey: "share.carries", // tools.saml-decoder.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec decodes the box itself). */
  encode(s: SamlShareState): ShareEncoding {
    let r: SamlReport | null = null; // the report
    try { r = s.input.trim() === "" ? null : analyzeSaml(s.input); } catch { r = null; } // refused: the page shows its error, nothing to share
    return encodeSamlShare(s, r); // encoded
  },
  /** Any non-blank text: the page decodes it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): SamlShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
