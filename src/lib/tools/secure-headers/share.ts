// ============================================================================
// src/lib/tools/secure-headers/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the secure-headers analyser (posture "derived",
// raised from "input" on 2026-10-27; the manifest: "a pasted Set-Cookie can
// carry a live secret"). A pasted response carries cookies, whose values are
// commonly session identifiers (RFC 6265 section 8.4, read 2026-10-27), and
// other headers this page never reads (a Location with a code in its query,
// an X-CSRF-Token ...). The page grades the security headers it knows and
// each cookie's name and attributes, never a cookie's value. So a link
// carries a COPY of the response:
//   - the status line, and every header line in order, by name;
//   - the value of every header the page grades (Strict-Transport-Security,
//     Content-Security-Policy, Server, the CORS headers ...), as parsed (a
//     folded value on one line);
//   - each Set-Cookie with its value replaced by [redacted] (its name and
//     attributes kept: they are what the page grades);
//   - every other header's value replaced by [redacted].
// Lines that are not headers are left out (the page ignores them). Before a
// link is offered:
//   1. the copy is analysed again and must give the same report (status
//      line, findings, cookies, grade); if it ever did not, no link is offered
//      (code "copy"), never a link that opens something else;
//   2. the copy goes through the family's secrets check: a credential still in
//      a graded value blocks the link (code "secret"), and a secret-looking
//      name is named in a caution line.
// The popover says how many values were replaced.
//
// Arrival: the copy fills the box as a paste would and the page grades it.
// Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { analyzeHeaders, parseHttpHeaders, SECURITY_HEADERS, type SecureHeadersReport } from "./compute"; // the page's own parser and grader
import { findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the family's secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the copy on arrival). */
export interface SecureHeadersShareState {
  /** The box as pasted. */
  input: string;
}

/** What replaces a value the page does not read (the site's mark; the secrets check reads it as a placeholder). */
export const HEADERS_REDACTED = "[redacted]"; // one fixed mark

/** The headers the page grades, lower-cased (Set-Cookie is handled on its own). */
const GRADED: ReadonlySet<string> = new Set(SECURITY_HEADERS.map((r) => r.match).filter((m) => m !== "set-cookie")); // the registry's names

/**
 * A Set-Cookie value with the cookie's own value replaced: the name, the "=", and every attribute stay.
 * @param raw the header's value
 * @returns the value with the cookie's value as [redacted] (unchanged when it has none, or no name)
 */
export function redactSetCookie(raw: string): { value: string; replaced: boolean } {
  const semi = raw.indexOf(";"); // where the attributes start
  const first = semi < 0 ? raw : raw.slice(0, semi); // name=value
  const rest = semi < 0 ? "" : raw.slice(semi); // ";" and the attributes
  const eq = first.indexOf("="); // the pair's "="
  if (eq <= 0 || first.slice(eq + 1).trim() === "") return { value: raw, replaced: false }; // no name (the page shows such a pair whole) or no value
  return { value: `${first.slice(0, eq + 1)}${HEADERS_REDACTED}${rest}`, replaced: true }; // the value replaced
} // redactSetCookie

/**
 * The copy of a response: every header by name, graded values kept, cookie and other values replaced.
 * @param input the box as pasted
 * @returns the copy and how many values it replaced
 */
export function shareableHeaders(input: string): { copy: string; replaced: number } {
  const parsed = parseHttpHeaders(input); // as the page parses it
  const lines: string[] = []; // the copy's lines
  let replaced = 0; // values replaced
  if (parsed.statusLine) lines.push(parsed.statusLine); // the status line first
  for (const h of parsed.headers) { // each header, in order
    const key = h.name.toLowerCase(); // as the page matches it
    if (GRADED.has(key)) { lines.push(`${h.name}: ${h.value}`); continue; } // graded: as parsed
    if (key === "set-cookie") { const c = redactSetCookie(h.value); if (c.replaced) replaced++; lines.push(`${h.name}: ${c.value}`); continue; } // a cookie: its value replaced
    if (h.value !== "") replaced++; // a value the page does not read
    lines.push(`${h.name}: ${h.value === "" ? "" : HEADERS_REDACTED}`); // by name only
  } // for
  return { copy: lines.join("\n"), replaced }; // done
} // shareableHeaders

/** The report the page shows, without the list of headers seen (which the copy changes by design). */
function reportOf(r: SecureHeadersReport): string {
  return JSON.stringify({ statusLine: r.statusLine ?? null, findings: r.findings, cookies: r.cookies, overall: r.overall }); // what the page renders
} // reportOf

/**
 * Analyse without throwing (the page shows its own error for a blank box or one without a header line).
 * @param text the box
 * @returns the report, or null
 */
function analyse(text: string): SecureHeadersReport | null {
  try { return analyzeHeaders(text); } catch { return null; } // no report
} // analyse

/** What the share of a response comes to: the copy and its check, or why there is none. */
export type HeadersShareCopy =
  | { ok: true; copy: string; replaced: number; report: ShareSecretReport } // the copy, how many values it replaced, and the check
  | { ok: false; code: "empty" | "copy" }; // nothing graded, or a copy that would grade differently

/**
 * Make the copy of a response and check it (the page calls this once per change, for the button and the popover).
 * @param input the box as pasted
 * @param r the page's report (null when there is none)
 * @returns the copy and its check, or why there is none
 */
export function headersShareCopy(input: string, r: SecureHeadersReport | null): HeadersShareCopy {
  if (!r) return { ok: false, code: "empty" }; // nothing graded
  const c = shareableHeaders(input); // the copy
  const again = analyse(c.copy); // graded again
  if (!again || reportOf(again) !== reportOf(r)) return { ok: false, code: "copy" }; // it must grade the same
  return { ok: true, copy: c.copy, replaced: c.replaced, report: findShareSecrets(c.copy) }; // checked
} // headersShareCopy

/**
 * The encoding of a copy the page already made.
 * @param c the copy and its check
 * @returns the copy, nothing, or blocked
 */
export function encodeHeadersShare(c: HeadersShareCopy): ShareEncoding {
  if (!c.ok) return c.code === "empty" ? { ok: false, reason: "empty" } : { ok: false, reason: "blocked", code: "copy" }; // nothing, or why not
  const s = c.report.secrets[0]; // the first credential still in the copy, if any
  if (s) return { ok: false, reason: "blocked", code: "secret", values: { line: s.line, label: s.label, more: c.report.secrets.length - 1 } }; // no link
  return { ok: true, params: { input: c.copy } }; // the copy
} // encodeHeadersShare

/**
 * The response as pasted, every value included: what the popover's reveal switch carries (PRIME 01/11/2026: "Add an
 * option-toggle to display the redacted values."). The switch is off whenever the popover opens; ticked, it is the
 * reader's explicit choice to send cookie values and the rest, and the popover says so with a caution. The page offers
 * it only beside a redacted copy that replaced something, never instead of a link the secrets check blocked.
 * @param input the box as pasted
 * @param r the page's report (null when there is none)
 * @returns the text as pasted, or nothing
 */
export function encodeHeadersRevealed(input: string, r: SecureHeadersReport | null): ShareEncoding {
  if (!r) return { ok: false, reason: "empty" }; // nothing graded
  return { ok: true, params: { input } }; // as pasted
} // encodeHeadersRevealed

/** The spec. */
export const SECURE_HEADERS_SHARE: ShareSpec<SecureHeadersShareState> = Object.freeze({
  tool: "secure-headers", // the slug
  posture: "derived", // a copy with cookie values and unread values replaced, never the response as pasted
  carriesKey: "share.carries", // tools.secure-headers.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec grades the box itself). */
  encode(s: SecureHeadersShareState): ShareEncoding {
    return encodeHeadersShare(headersShareCopy(s.input, analyse(s.input))); // graded, copied, checked, encoded
  },
  /** Any non-blank text: the page grades it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): SecureHeadersShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});

/** The spec of the reveal switch: the response as pasted (posture input-caution: the reader ticked it, the popover cautions). */
export const SECURE_HEADERS_SHARE_REVEALED: ShareSpec<SecureHeadersShareState> = Object.freeze({
  tool: "secure-headers", // the slug
  posture: "input-caution", // the input as pasted, with the tool's caution, by the reader's explicit choice
  carriesKey: "share.carriesRevealed", // tools.secure-headers.share.carriesRevealed
  names: ["input"], // #input=, as the redacted copy: an arrival is the same paste either way
  /** The text as pasted, or nothing. */
  encode(s: SecureHeadersShareState): ShareEncoding {
    return encodeHeadersRevealed(s.input, analyse(s.input)); // graded, then as pasted
  },
  /** The same rule as the redacted copy's: any non-blank text. */
  decode(v: Readonly<Record<string, string | null>>): SecureHeadersShareState | null {
    return SECURE_HEADERS_SHARE.decode(v); // one rule for both
  },
});
