// ============================================================================
// src/lib/tools/oidc/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the OIDC decoder (posture "derived", raised from
// "input" on 2026-10-27). The box takes two different things:
//
//   - An ID TOKEN, a JWT (OpenID Connect Core 1.0, section 2) that the token
//     endpoint returns beside a bearer access token (section 3.1.3.3), and
//     that some APIs wrongly accept as one. A link never carries it as pasted:
//     like the JWT decoder's (src/lib/tools/jwt/share.ts), it carries the
//     header and the claims exactly as pasted with an empty signature segment
//     ("header.payload."), and a flag saying the pasted token was signed, so
//     the receiving page shows the same claims, times, findings and "Signed"
//     badge, and says the signature stayed out of the link.
//   - A DISCOVERY DOCUMENT, which a provider "MUST make ... available at the
//     path formed by concatenating the string /.well-known/openid-configuration
//     to the Issuer" (OpenID Connect Discovery 1.0, section 4): public by
//     design, so it goes as typed. A paste that also holds a credential, as an
//     application's own settings file often does, gets no link (blocked
//     "secret", naming the member): client_secret (RFC 7591 section 3.2.1),
//     registration_access_token (RFC 7592 section 3), access_token and
//     refresh_token (RFC 6749 section 5.1), id_token (OpenID Connect Core 1.0,
//     section 3.1.3.3), or a JWK holding private members (RFC 7518, RFC 8037).
//     The page never shows those members, but a link of the paste would carry
//     them; a discovery document never has them, so blocking costs a real
//     document nothing.
//
// A token whose header "jwk" holds private members is blocked too
// ("private-key"), as on the JWT decoder.
//
// Arrival: the value fills the box and decodes as a paste would; nothing is
// fetched (the page never calls the jwks_uri or any endpoint). Anything this
// spec would not build is malformed: ignored, and stripped either way.
// ============================================================================

import { CREDENTIAL_MEMBERS } from "../../share/credential-members"; // the five credential member names, shared
import { analyzeOidc, type OidcReport } from "./compute"; // the engine
import { decodeJwt, type DecodedJwt } from "../jwt/compute"; // the JWT engine the OIDC engine reads tokens with
import { jwkPrivateMembers } from "../jwks-explainer/compute"; // the private members a JWK holds
import { headerPrivateMembers, shareableToken } from "../jwt/share"; // the JWT decoder's copy and header check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** What the page encodes: the box and the engine's report (null without a result). */
export interface OidcShareInput {
  /** The box as typed. */
  input: string;
  /** The engine's report for it, or null while there is none (empty or refused). */
  report: OidcReport | null;
}

/** What an arrival restores. */
export interface OidcShareState {
  /** The token's copy ("header.payload.") or the discovery document as typed. */
  input: string;
  /** For a token: true when the sender's token had a signature segment. Always false for a document. */
  signed: boolean;
}

/** Member names that hold a credential, never a discovery document's own: the shared list (src/lib/share/credential-members.ts, sources there). */
export const OIDC_SECRET_MEMBERS: ReadonlySet<string> = CREDENTIAL_MEMBERS; // one list for every JSON reader

/** The shape of a token's copy: two base64url segments and an empty signature. */
const COPY_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.$/; // anchored: linear

/**
 * The first credential a parsed JSON document holds: a member named in OIDC_SECRET_MEMBERS (at any depth), or a
 * private member of an object that has a "kty" (a JWK). Walked with an explicit stack, so depth costs no recursion.
 * @param doc the parsed document
 * @returns the member's name, or null when there is none
 */
export function findSecretMember(doc: unknown): string | null {
  const stack: unknown[] = [doc]; // what is left to look at
  while (stack.length > 0) { // until everything was seen
    const node = stack.pop(); // the next value
    if (Array.isArray(node)) { for (const v of node) stack.push(v); continue; } // an array: its elements
    if (typeof node !== "object" || node === null) continue; // a scalar holds no member
    const obj = node as Record<string, unknown>; // an object
    for (const name of Object.keys(obj)) if (OIDC_SECRET_MEMBERS.has(name)) return name; // a credential by name
    if (typeof obj.kty === "string") { const priv = jwkPrivateMembers(obj); if (priv.length > 0) return priv[0]; } // a private JWK
    for (const v of Object.values(obj)) stack.push(v); // its values
  } // walk
  return null; // nothing found
} // findSecretMember

/**
 * Parse a discovery document's text, as the engine does (trimmed, JSON.parse).
 * @param text the box
 * @returns the parsed value, or undefined when it does not parse
 */
function parseDoc(text: string): unknown {
  try {
    return JSON.parse(text.trim()) as unknown; // the engine's own reading
  } catch {
    return undefined; // not JSON
  } // try
} // parseDoc

/**
 * Decode a token without throwing.
 * @param text the token
 * @returns the decode, or null
 */
function tryDecode(text: string): DecodedJwt | null {
  try {
    return decodeJwt(text); // the JWT engine
  } catch {
    return null; // refused
  } // try
} // tryDecode

/** The spec. */
export const OIDC_SHARE: ShareSpec<OidcShareInput, OidcShareState> = Object.freeze({
  tool: "oidc", // the slug
  posture: "derived", // a token's header and claims; a discovery document as typed
  carriesKey: "share.carries", // tools.oidc.share.carries
  names: ["input", "signed"], // #input=...&signed=1
  /** A token's copy and flag, or the document as typed; blocked on a credential or a private key. */
  encode(s: OidcShareInput): ShareEncoding {
    const r = s.report; // the report
    if (r === null) return { ok: false, reason: "empty" } as const; // nothing decoded: nothing to share
    if (r.mode === "discovery") { // a public document
      const secret = findSecretMember(parseDoc(s.input)); // a credential beside it?
      if (secret !== null) return { ok: false, reason: "blocked", code: "secret", values: { name: secret } } as const; // never a credential in a link
      return { ok: true, params: { input: s.input } } as const; // as typed
    } // discovery
    const d = tryDecode(s.input); // the token's segments (the engine accepted it, so this decodes)
    if (d === null) return { ok: false, reason: "empty" } as const; // defensive: no segments, no copy
    const priv = headerPrivateMembers(d.header); // a private key in the header?
    if (priv.length > 0) return { ok: false, reason: "blocked", code: "private-key", values: { members: priv.join(", ") } } as const; // never a key
    const input = shareableToken(d); // the copy
    return { ok: true, params: d.signature !== "" ? { input, signed: "1" } : { input } } as const; // the flag only when signed
  },
  /** A token's copy (with a flag that agrees with its alg), or a discovery document without credentials. */
  decode(v: Readonly<Record<string, string | null>>): OidcShareState | null {
    const input = v.input; // the value
    if (!input) return null; // nothing to fill
    const flag = v.signed; // the flag
    if (flag !== null && flag !== undefined && flag !== "1") return null; // "1" or absent only
    let r: OidcReport; // the engine's reading
    try {
      r = analyzeOidc(input); // the engine
    } catch {
      return null; // refused by the engine: this spec never builds such a link
    } // try
    if (r.mode === "discovery") { // a document
      if (flag === "1") return null; // a document has no signature
      if (findSecretMember(parseDoc(input)) !== null) return null; // never a credential
      return { input, signed: false }; // as typed
    } // discovery
    if (!COPY_SHAPE.test(input)) return null; // a whole token never opens: only the copy
    const d = tryDecode(input); // its header
    if (d === null || headerPrivateMembers(d.header).length > 0) return null; // never a key
    if (flag === "1" && d.alg === "none") return null; // an unsecured token has no signature to leave out
    return { input, signed: flag === "1" }; // the state to fill
  },
});
