// ============================================================================
// src/lib/tools/f5-bigip-persistence-cookie/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BIG-IP persistence cookie decoder and
// encoder (posture "derived", raised from "input" on 2026-10-27). The page
// has two modes with different answers, so each has its own button, and a
// link carries one mode's values:
//   Decode  "input": a copy of the cookie the page decoded, name=value (or
//           the value alone), never the line as pasted. The page reads only
//           what comes before the first ";" of the box (after a "Set-Cookie:"
//           prefix), and the box can hold more: a Set-Cookie line's
//           attributes, or a browser's Cookie value, where a session cookie
//           follows the persistence cookie (RFC 6265 section 4.2.1's example
//           "Cookie: SID=31d4d96e407aad42; lang=en-US"; section 8.4: a
//           cookie commonly holds a session identifier; read 2026-10-27).
//           The copy is exactly the part the page reads, so the receiving
//           page decodes the same member.
//   Encode  "mode=encode", "address", "port" and "rd" (the route domain,
//           only when one is set): the values the page encoded, trimmed, the
//           numbers as the page reads them.
// The decoded or typed address is a pool member's, usually internal (the
// manifest: "decoded output reveals internal topology"), so the popover adds a
// caution line whenever the answer names one.
//
// Arrival: the mode opens, its fields fill as typing would, and the page
// decodes or encodes as usual. A value of the other mode, an unknown mode, a
// port or route domain that is not a number from 0 to 65535, or an address
// longer than 64 characters makes the whole share malformed: ignored.
// ============================================================================

import { decodeBigipCookie, encodeBigipCookie, type BigipReport } from "./compute"; // the page's own decoder and encoder
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state of either mode (the component passes the open mode's fields). */
export type BigipCookieShareState =
  | { mode: "decode"; input: string } // the box as pasted (encoding) or the copy (arrival)
  | { mode: "encode"; address: string; port: string; rd: string }; // the three fields

/** A port or a route domain: digits, 0 to 65535 (the engine's range for both). */
const UINT16 = /^\d{1,5}$/; // anchored, bounded

/**
 * The part of a decoded box the page read: name=value, or the value alone.
 * @param r the page's report
 * @returns the copy
 */
export function shareableCookie(r: BigipReport): string {
  return r.cookieName ? `${r.cookieName}=${r.rawValue}` : r.rawValue; // what parseCookieInput kept
} // shareableCookie

/**
 * Decode without throwing (the page shows its own error for a box it cannot read).
 * @param input the box
 * @returns the report, or null
 */
export function readCookie(input: string): BigipReport | null {
  try { return input.trim() === "" ? null : decodeBigipCookie(input); } catch { return null; } // refused: nothing to share
} // readCookie

/**
 * The encode mode's fields as the page reads them (trimmed; numbers as decimals), or null when the page has no
 * answer for them (a blank field, a port that is not a whole number, an address or number the encoder refuses).
 * @param s the encode mode's fields
 * @returns the values, or null
 */
export function encodeFields(s: { address: string; port: string; rd: string }): { address: string; port: string; rd: string } | null {
  const address = s.address.trim(); // as the page reads it
  if (address === "" || s.port.trim() === "") return null; // the page waits for both
  const port = Number(s.port); // as the page reads it (Number of the field)
  const rd = s.rd.trim() === "" ? undefined : Number(s.rd); // optional
  if (!Number.isInteger(port)) return null; // the page says the port is not a number
  try { encodeBigipCookie({ address, port, routeDomain: rd }); } catch { return null; } // the page shows the encoder's error
  return { address, port: String(port), rd: rd === undefined ? "" : String(rd) }; // the values
} // encodeFields

/**
 * Encode from what the page already computed (the decode report, or nothing in encode mode).
 * @param s the state
 * @param report the page's decode report (decode mode)
 * @returns the values, or nothing
 */
export function encodeCookieShare(s: BigipCookieShareState, report: BigipReport | null): ShareEncoding {
  if (s.mode === "decode") { // the decoder's answer
    if (!report) return { ok: false, reason: "empty" }; // nothing decoded
    return { ok: true, params: { input: shareableCookie(report) } }; // the copy
  } // decode
  const f = encodeFields(s); // the encoder's fields
  if (!f) return { ok: false, reason: "empty" }; // no encoded value
  const p: Record<string, string> = { mode: "encode", address: f.address, port: f.port }; // the values
  if (f.rd !== "") p.rd = f.rd; // the route domain, when set
  return { ok: true, params: p }; // the values
} // encodeCookieShare

/** The spec. */
export const BIGIP_COOKIE_SHARE: ShareSpec<BigipCookieShareState> = Object.freeze({
  tool: "f5-bigip-persistence-cookie", // the slug
  posture: "derived", // decode: the cookie the page read, never the line; encode: the fields
  carriesKey: "share.carries", // tools.f5-bigip-persistence-cookie.share.carries (an ICU select on the mode)
  names: ["input", "mode", "address", "port", "rd"], // input for Decode; mode=encode and the fields for Encode
  /** One mode's values, or nothing (the spec decodes the box itself). */
  encode(s: BigipCookieShareState): ShareEncoding {
    return encodeCookieShare(s, s.mode === "decode" ? readCookie(s.input) : null); // read, then encoded
  },
  /** One mode's values, validated. */
  decode(v: Readonly<Record<string, string | null>>): BigipCookieShareState | null {
    const has = (k: string) => v[k] !== null && v[k] !== undefined; // carried
    if (!has("mode")) { // Decode
      if (has("address") || has("port") || has("rd")) return null; // an encoder field without the mode
      return v.input && v.input.trim() !== "" ? { mode: "decode", input: v.input } : null; // the cookie, as a paste
    } // Decode
    if (v.mode !== "encode" || has("input")) return null; // an unknown mode, or a cookie in an encoder link
    const address = (v.address ?? "").trim(); // the address
    if (address === "" || address.length > 64 || /\s/.test(address)) return null; // one word, at most 64 characters
    const port = v.port ?? ""; // the port
    if (!UINT16.test(port) || Number(port) > 65535) return null; // 0 to 65535
    const rd = v.rd ?? ""; // the route domain
    if (rd !== "" && (!UINT16.test(rd) || Number(rd) > 65535)) return null; // 0 to 65535, when set
    return { mode: "encode", address, port: String(Number(port)), rd: rd === "" ? "" : String(Number(rd)) }; // the fields
  },
});
