// ============================================================================
// src/lib/tools/acme-dns01/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the ACME dns-01 TXT computer (posture
// "derived", raised from "input" on 2026-10-27): a link carries the challenge
// token, the account key's RFC 7638 thumbprint (computed by the engine, or the
// one the reader typed) and the domain, and never the account key as pasted.
// The key box takes a JWK, and an account key file holds the private member
// "d" beside the public ones; the engine reads only the public members, and
// so does the link. Nothing it carries is secret: RFC 8555 section 8.3 has
// the key authorization (token "." thumbprint) served in clear at
// /.well-known/acme-challenge/<token>, and RFC 7638 section 3.2.1 makes the
// thumbprint of a private key that of its public key.
//
// The state this spec encodes holds the pasted key only so the central
// harness (src/lib/share/cases/acme-dns01.ts) can prove it never reaches a
// link: encode reads the token, the domain and the engine's thumbprint.
//
// Arrival: the token and the domain fill their boxes and the thumbprint fills
// the key box (which takes a thumbprint), and the record is computed as a
// paste would compute it (Web Crypto, in the page; nothing is sent). A token
// or thumbprint outside the base64url alphabet the engine requires makes the
// whole share malformed: ignored, never half applied.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** What the page encodes: its three boxes and the thumbprint its last computation gave (null without a result). */
export interface AcmeDns01ShareInput {
  /** The challenge token box. */
  token: string;
  /** The account key box as pasted (a JWK, possibly private, or a thumbprint): never carried. */
  accountKey: string;
  /** The domain box (optional). */
  domain: string;
  /** The engine's thumbprint for the key box, or null when there is no result. */
  thumbprint: string | null;
}

/** What an arrival restores. */
export interface AcmeDns01ShareState {
  /** The challenge token. */
  token: string;
  /** The account key's thumbprint, which the key box accepts in place of the key. */
  thumbprint: string;
  /** The domain, or "" when none was given. */
  domain: string;
}

/** The base64url alphabet with no padding, as the engine requires of a token and of a thumbprint (RFC 8555 section 8.4). */
const BASE64URL = /^[A-Za-z0-9_-]+$/; // anchored, one class: linear

/** The longest domain an arrival accepts: a DNS name is at most 253 characters (with a wildcard label, 255). */
const MAX_DOMAIN = 255; // characters

/** The spec. */
export const ACME_DNS01_SHARE: ShareSpec<AcmeDns01ShareInput, AcmeDns01ShareState> = Object.freeze({
  tool: "acme-dns01", // the slug
  posture: "derived", // the thumbprint stands in for the key
  carriesKey: "share.carries", // tools.acme-dns01.share.carries
  names: ["input", "thumbprint", "domain"], // #input=<token>&thumbprint=...&domain=...
  /** The token, the thumbprint and the domain, when the page has a result; never the key box. */
  encode(s: AcmeDns01ShareInput): ShareEncoding {
    const token = s.token.trim(); // as the engine reads it
    if (s.thumbprint === null || token === "" || !BASE64URL.test(s.thumbprint)) return { ok: false, reason: "empty" } as const; // no result: nothing to share
    const domain = s.domain.trim(); // as the engine reads it
    return { ok: true, params: domain ? { input: token, thumbprint: s.thumbprint, domain } : { input: token, thumbprint: s.thumbprint } } as const; // the derived values only
  },
  /** A base64url token and thumbprint, and an optional domain of a DNS name's length. */
  decode(v: Readonly<Record<string, string | null>>): AcmeDns01ShareState | null {
    const token = v.input; // the token
    const thumbprint = v.thumbprint; // the thumbprint
    if (!token || !thumbprint || !BASE64URL.test(token) || !BASE64URL.test(thumbprint)) return null; // the engine would refuse it: malformed
    const domain = v.domain ?? ""; // absent: no domain
    if (domain.length > MAX_DOMAIN || /[\s]/.test(domain)) return null; // not a domain name
    return { token, thumbprint, domain }; // the state to fill
  },
});
