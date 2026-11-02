// ============================================================================
// src/lib/tools/http-header-order-fingerprint/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the HTTP header-order fingerprint. Posture
// "derived", raised on 2026-11-01 from the inventory's "input": a header block
// copied from devtools, a capture or curl -v nearly always carries a Cookie
// line, and often Authorization credentials or an API key header, and a link is
// a copy anyone it reaches can replay. The reading needs none of those values:
// the engine reads the header NAMES (their order, their casing, which common
// ones are missing) and one value, the User-Agent (a library token in it is
// decisive). So the value can go and the reading stays (ROLLOUT 11.2).
//
// The link carries `input`: a copy of the block in which every credential is
// replaced by the word REDACTED, by the HTTP rules the HTTP & web tools share
// (src/lib/tools/http-message-decoder/http-secrets.ts, reused as is):
//   - Authorization and Proxy-Authorization: the credentials go, the scheme
//     stays (RFC 9110 sections 11.6.2 and 11.7.2: the value "consists of
//     credentials"); Basic keeps its user-id (RFC 7617 section 2);
//   - Cookie: every cookie-value, names kept (RFC 6265 section 4.2.1);
//   - any other header whose name holds a secret (X-API-Key, X-Auth-Token ...)
//     goes whole, and a URL's password or a secret parameter inside any other
//     value (a Referer with a token) goes;
//   - the request line's target loses its password and secret parameters.
// Names, their order and casing, the User-Agent and every other value stay.
// After the copy, the rules' net (findResidualSecret: a PEM private key, a JWT,
// a URL password left anywhere) means no link, naming the line; and the copy
// must give the same reading as the paste (the same order hash, client hint,
// casing note, missing headers and per-header notes), or there is no link
// either (a guard; no case reaches it, since nothing the engine reads changes).
//
// No reveal switch: what the copy replaces are credentials (cookies, tokens,
// API keys), which no link should carry (ANVIL, 01/11/2026: never a live
// credential), and nothing of the reading depends on them.
// Arrival: the copy fills the box as a paste would; nothing is sent.
// ============================================================================

import { applyEdits, findResidualSecret, headerEdits, mergeEdits, shiftEdits, urlEdits, type Edit } from "../http-message-decoder/http-secrets"; // the HTTP rules the HTTP & web tools share
import { analyzeHeaders, type HeaderAnalysis } from "./compute"; // the engine, to compare the copy's reading
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state the link carries and an arrival restores: the box. */
export interface HeaderOrderShareState {
  /** The header block (as pasted when encoding; the copy after an arrival). */
  input: string;
}

/** What making the copy gave. */
export type HeaderOrderCopy =
  | { ok: true; copy: string; replaced: number } // the copy and how many values it replaced
  | { ok: false; code: "secret"; line: number; label: string } // a secret the rules could not place
  | { ok: false; code: "copy" }; // the copy would read differently (a guard)

/** A request line, as the engine reads one (method, target, HTTP version). */
const REQUEST_LINE = /^([ \t]*[A-Z]+[ \t]+)(\S+)[ \t]+HTTP\/[\d.]+[ \t]*\r?$/; // anchored, linear

/**
 * The parts of a reading the page shows, to compare a copy's with the paste's.
 * @param a the engine's analysis
 * @returns a canonical text of what the page shows
 */
function shown(a: HeaderAnalysis): string {
  return JSON.stringify([a.method, a.version, a.orderHash, a.orderList, a.casingNote, a.hostFirst, a.clientHint, a.missingCommon, a.orderNotes]); // never a value but the User-Agent's verdict
} // shown

/**
 * The shareable copy of a header block.
 * @param raw the block as pasted
 * @returns the copy and the count, or why there is no link
 */
export function headerBlockCopy(raw: string): HeaderOrderCopy {
  const all: Edit[][] = []; // the edits, line by line
  let at = 0; // the current line's start
  for (const line of raw.split("\n")) { // each line (a CR before the LF stays part of it, as written)
    const rl = REQUEST_LINE.exec(line); // a request line?
    if (rl) all.push(shiftEdits(urlEdits(rl[2]), at + rl[1].length)); // its target's password and secret parameters
    else { // a header line
      const colon = line.indexOf(":"); // name ":" value
      if (colon > 0) all.push(shiftEdits(headerEdits(line.slice(0, colon), line.slice(colon + 1).replace(/\r$/, "")), at + colon + 1)); // its value, by its name
    } // header
    at += line.length + 1; // past the line and its LF
  } // lines
  const edits = mergeEdits(...all); // ordered, non-overlapping
  const copy = applyEdits(raw, edits); // the copy
  const left = findResidualSecret(copy); // the net
  if (left) return { ok: false, code: "secret", line: left.line, label: left.label }; // a token or key the rules could not place
  try {
    if (shown(analyzeHeaders(copy)) !== shown(analyzeHeaders(raw))) return { ok: false, code: "copy" }; // a different reading: no link
  } catch {
    return { ok: false, code: "copy" }; // the paste reads but the copy does not (cannot happen: names never change)
  } // try
  return { ok: true, copy, replaced: edits.length }; // one value per edit
} // headerBlockCopy

/**
 * The encoding of a block the page reads.
 * @param input the box as pasted
 * @param c its copy (the page makes it once, for the button and the count)
 * @returns the copy, or blocked
 */
export function encodeHeaderOrderShare(input: string, c: HeaderOrderCopy): ShareEncoding {
  if (input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted
  if (!c.ok) return c.code === "secret" ? { ok: false, reason: "blocked", code: "secret", values: { line: c.line, label: c.label } } : { ok: false, reason: "blocked", code: "copy" }; // no link, and why
  return { ok: true, params: { input: c.copy } }; // the copy
} // encodeHeaderOrderShare

/** The spec. */
export const HEADER_ORDER_SHARE: ShareSpec<HeaderOrderShareState> = Object.freeze({
  tool: "http-header-order-fingerprint", // the slug
  posture: "derived", // a copy with every credential replaced, never the block as pasted
  carriesKey: "share.carries", // tools.http-header-order-fingerprint.share.carries
  names: ["input"], // #input=
  /** The copy of a block the engine reads; nothing for a blank or unreadable box. */
  encode(s: HeaderOrderShareState): ShareEncoding {
    try { analyzeHeaders(s.input); } catch { return { ok: false, reason: "empty" }; } // no reading: nothing to share
    return encodeHeaderOrderShare(s.input, headerBlockCopy(s.input)); // copied, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste (and says why when it cannot). */
  decode(v: Readonly<Record<string, string | null>>): HeaderOrderShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
