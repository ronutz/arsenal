// ============================================================================
// src/lib/tools/jwks-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the JWKS explainer (posture "derived", raised
// from "input-caution" on 2026-10-27). The manifest's reason for its
// "ephemeral" default is "a pasted JWKS may contain private key material":
// RFC 7518 defines an RSA private key's "d", "p", "q", "dp", "dq", "qi" and
// "oth" members (section 6.3.2), an elliptic-curve private key's "d"
// (section 6.2.2) and a symmetric key's "k" (section 6.4.1); RFC 8037
// (section 2) gives OKP keys a private "d". So a link carries the key set
// with every such value replaced by "[redacted]" (shareableJwks in compute.ts,
// pinned by the share vectors in golden-vectors.ts), never as pasted. The
// member names stay, so the receiving page flags the same private material
// and explains every key exactly as the sender's did: it never shows those
// values.
//
// In Match mode the link also carries the JWT box's HEADER only: the page
// reads nothing else of the token (parseJwtHeader decodes its first
// segment), and the token itself is a bearer credential (RFC 6750 section
// 1.2). A box whose first segment does not decode to a JSON header carries
// nothing (an opaque access token must not travel in its place); a header
// whose "jwk" member holds private members is blocked ("private-key").
//
// Arrival: the copy fills the key set box, Match mode opens when the link
// says so, and the header fills the JWT box; the page explains and matches as
// for a paste, in the browser, and never fetches a jwks_uri. A key set that
// does not parse, or still holds a private value, a mode the page does not
// offer, a header outside Match mode, or a header that does not decode, makes
// the whole link malformed: ignored, and stripped from the address either way.
// ============================================================================

import { jwkPrivateMembers, parseJwks, parseJwtHeader, shareableJwks } from "./compute"; // the engine, its copy and its header reader
import type { ShareableJson } from "../as3-explainer-validator/json-secrets"; // what the copy is
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The page's two modes. */
export type JwksShareMode = "explain" | "match";

/** What the page encodes. */
export interface JwksShareInput {
  /** The key set box as typed. */
  jwks: string;
  /** True when the page parsed it (it shows keys). */
  parsedOk: boolean;
  /** The mode shown. */
  mode: JwksShareMode;
  /** The JWT box as typed (Match mode). */
  jwt: string;
  /** shareableJwks(jwks), when the page has it already (it shows the count of replaced values). */
  copy?: ShareableJson;
}

/** What an arrival restores. */
export interface JwksShareState {
  /** The key set's copy. */
  jwks: string;
  /** The mode. */
  mode: JwksShareMode;
  /** Match mode: the header to fill the JWT box with ("" when the link carried none); null in Explain mode (kept). */
  jwt: string | null;
}

/**
 * The part of the JWT box a link may carry: its header, as the page reads it.
 * @param jwt the box as typed
 * @returns the header (a raw JSON header as typed, or the token's first segment), "" for nothing to carry, or null when
 *   the header holds a private key
 */
export function shareableJwtHeader(jwt: string): string | null {
  const trimmed = jwt.trim(); // as the page reads it
  if (trimmed === "") return ""; // nothing typed
  const h = parseJwtHeader(trimmed); // the engine's own reading
  if (!h.ok || h.header === undefined) return ""; // not a header: carry nothing (an opaque token must not travel)
  if (jwkPrivateMembers(h.header.jwk).length > 0) return null; // a private key in the header
  return trimmed.startsWith("{") ? trimmed : trimmed.split(".")[0]; // the header alone, never the payload or the signature
} // shareableJwtHeader

/** The spec. */
export const JWKS_SHARE: ShareSpec<JwksShareInput, JwksShareState> = Object.freeze({
  tool: "jwks-explainer", // the slug
  posture: "derived", // the key set with private values replaced; a token's header only
  carriesKey: "share.carries", // tools.jwks-explainer.share.carries (a select on the mode)
  names: ["input", "mode", "header"], // #input=<copy>&mode=match&header=<first segment>
  /** The copy, the mode when it is Match, and the JWT's header in Match mode. */
  encode(s: JwksShareInput): ShareEncoding {
    if (!s.parsedOk) return { ok: false, reason: "empty" } as const; // no keys explained: nothing to share
    const copy = s.copy ?? shareableJwks(s.jwks); // the derived form
    if (!copy.ok || !copy.parsed) return { ok: false, reason: "empty" } as const; // defensive: a parsed set always gives a copy
    const p: Record<string, string> = { input: copy.text }; // the copy
    if (s.mode === "match") { // Match mode
      p.mode = "match"; // say so
      const header = shareableJwtHeader(s.jwt); // the header only
      if (header === null) return { ok: false, reason: "blocked", code: "private-key", values: { members: jwkPrivateMembers(parseJwtHeader(s.jwt.trim()).header?.jwk).join(", ") } } as const; // never a key; the popover names its members
      if (header !== "") p.header = header; // when there is one
    } // match
    return { ok: true, params: p } as const; // the values
  },
  /** A key set that parses and holds no private value; an offered mode; a header that decodes, in Match mode only. */
  decode(v: Readonly<Record<string, string | null>>): JwksShareState | null {
    const jwks = v.input; // the key set
    if (!jwks || !parseJwks(jwks).ok) return null; // not one the page explains
    const copy = shareableJwks(jwks); // what a link would carry of it
    if (!copy.ok || copy.text !== jwks) return null; // a private value still in it: only a copy opens
    const mode = v.mode === null || v.mode === undefined ? "explain" : v.mode; // absent: Explain
    if (mode !== "explain" && mode !== "match") return null; // not offered
    const header = v.header ?? null; // the header, if any
    if (mode === "explain") return header === null ? { jwks, mode, jwt: null } : null; // a header belongs to Match mode
    if (header === null) return { jwks, mode, jwt: "" }; // Match mode with an empty JWT box
    if (header.includes(".") && !header.trim().startsWith("{")) return null; // one segment only, never a whole token
    if (shareableJwtHeader(header) !== header) return null; // decodes, holds no key, and is already the header alone
    return { jwks, mode, jwt: header }; // the state to fill
  },
});
