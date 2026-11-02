// ============================================================================
// src/lib/tools/jwt/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the JWT decoder (posture "derived", raised from
// "input-caution" on 2026-10-27). A JWT is a bearer credential while it is
// valid: RFC 6750 section 1.2 defines a bearer token as one that "any party in
// possession of" can use, and RFC 7519 section 1 carries a JWT's claims as
// "the payload of a JSON Web Signature (JWS) structure". So a link never
// carries the token as pasted. It carries the header and the claims, the
// first two segments exactly as pasted, followed by an empty signature segment
// ("header.payload."), and one flag saying whether the pasted token had a
// signature. Without its signature the token is no longer one any verifier
// accepts (RFC 7515 section 5.2, step 10: when no signature validates, "the
// JWS MUST be considered invalid"), and the link gives no material for
// guessing a weak HMAC secret
// offline either, because nothing signed travels with the signing input.
// The verification secret is never part of the state this spec encodes.
//
// The reading survives: the page decodes the same header and claims and shows
// the same times; the signature panel says the signature was left out of the
// link (the flag) instead of showing it. The engine is unchanged: the copy is
// built from the segments decodeJwt already returns.
//
// One blocked case: a header whose "jwk" member holds private key material
// (RFC 7515 section 4.1.3 has "jwk" carry the PUBLIC key; a private member in
// it is a key a link must not carry), code "private-key".
//
// Arrival: the copy fills the box and decodes as a paste would; nothing is
// verified, fetched or sent. A value that is not the copy's shape, does not
// decode, says "signed" for an alg "none" token, or holds a private "jwk", is
// malformed: ignored, and stripped from the address either way.
// ============================================================================

import { decodeJwt, type DecodedJwt } from "./compute"; // the engine's own decoder
import { jwkPrivateMembers } from "../jwks-explainer/compute"; // the private members a JWK holds (RFC 7518, RFC 8037)
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** What the page encodes: the box and what the engine decoded from it (null without a result). */
export interface JwtShareInput {
  /** The box as typed (never carried). */
  input: string;
  /** The engine's decode of the box, or null while there is none (empty or malformed). */
  decoded: DecodedJwt | null;
}

/** What an arrival restores. */
export interface JwtShareState {
  /** The copy: "header.payload." exactly as the sender's token had them. */
  input: string;
  /** True when the sender's token had a signature segment, which the link left out. */
  signed: boolean;
}

/** The shape of the copy: two base64url segments and an empty signature (RFC 7515 section 7.1's compact form). */
const COPY_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.$/; // anchored, two classes with a literal between: linear

/**
 * The private members of a decoded header's "jwk" member, if any.
 * @param header the decoded JOSE header
 * @returns the member names ([] when there is no jwk or it holds only public members)
 */
export function headerPrivateMembers(header: Readonly<Record<string, unknown>>): string[] {
  return jwkPrivateMembers(header.jwk); // RFC 7515 section 4.1.3: "jwk" is the public key; anything private is a leak
} // headerPrivateMembers

/**
 * The shareable copy of a decoded token: its first two segments as pasted, and an empty signature.
 * @param decoded the engine's decode
 * @returns "header.payload."
 */
export function shareableToken(decoded: DecodedJwt): string {
  return `${decoded.segments.header}.${decoded.segments.payload}.`; // the signature segment left empty
} // shareableToken

/** The spec. */
export const JWT_SHARE: ShareSpec<JwtShareInput, JwtShareState> = Object.freeze({
  tool: "jwt", // the slug
  posture: "derived", // the header and the claims, never the signature or the verification secret
  carriesKey: "share.carries", // tools.jwt.share.carries
  names: ["input", "signed"], // #input=<header.payload.>&signed=1
  /** The copy and the flag, when the page decoded the box; blocked for a private "jwk" in the header. */
  encode(s: JwtShareInput): ShareEncoding {
    const d = s.decoded; // the decode
    if (d === null) return { ok: false, reason: "empty" } as const; // nothing decoded: nothing to share
    const priv = headerPrivateMembers(d.header); // a private key in the header?
    if (priv.length > 0) return { ok: false, reason: "blocked", code: "private-key", values: { members: priv.join(", ") } } as const; // never a key in a link
    const input = shareableToken(d); // the copy
    return { ok: true, params: d.signature !== "" ? { input, signed: "1" } : { input } } as const; // the flag only when there was a signature
  },
  /** Only the copy's shape, decodable, with a flag that agrees with its alg. */
  decode(v: Readonly<Record<string, string | null>>): JwtShareState | null {
    const input = v.input; // the copy
    if (!input || !COPY_SHAPE.test(input)) return null; // not the copy this spec builds: a whole token never opens
    const flag = v.signed; // the flag
    if (flag !== null && flag !== undefined && flag !== "1") return null; // "1" or absent only
    let d: DecodedJwt; // the decode
    try {
      d = decodeJwt(input); // the engine's own parser
    } catch {
      return null; // a copy that does not decode was not built here
    } // try
    const signed = flag === "1"; // the flag as a boolean
    if (signed && d.alg === "none") return null; // an unsecured token has no signature to leave out (RFC 7519 section 6.1)
    if (headerPrivateMembers(d.header).length > 0) return null; // never a key
    return { input, signed }; // the state to fill
  },
});
