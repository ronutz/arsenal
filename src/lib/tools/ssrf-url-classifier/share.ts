// ============================================================================
// src/lib/tools/ssrf-url-classifier/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the SSRF URL classifier (posture "derived",
// raised from "input" on 2026-10-27). A URL is not itself a secret (the
// manifest), but one pasted from a request or a log can carry credentials:
// RFC 3986 section 3.2.1 (read 2026-10-27) deprecates "user:password" in the
// userinfo and says applications "should not render as clear text any data
// after the first colon". The page never shows the userinfo (only a flag that
// there is one), so a link carries a copy of the URL with the password, every
// character between the first ":" of the userinfo and its "@", replaced by
// [redacted]. The userinfo is found exactly as the classifier finds the host
// (after "scheme://" or "//", up to the first "/", "?" or "#", before the last
// "@"). Before a link is offered:
//   1. the copy is classified again and must give the same reading (every
//      field but the input itself); when it does not (a URL whose "password"
//      the parser reads as part of the path, which the page shows), no link
//      is offered (code "password") and the reader removes it first;
//   2. the copy goes through the family's secrets check: a credential the
//      page would still show (a JWT or an AWS access key ID in the path or
//      query, an Authorization line) blocks the link (code "secret"); a
//      secret-looking name=value in the query is named in a caution line.
// A user name alone goes as typed (a name is not a password, and it can be
// the very trick being studied, http://expected-host@internal/); the popover
// says so, in case it is a token. Without a password the copy is the URL as
// typed.
//
// Arrival: the copy fills the box as a paste would and the page classifies it
// (pure and local: no DNS, no request). Any non-blank text is accepted.
// ============================================================================

import { classifyUrl, type SsrfResult } from "./compute"; // the page's own classifier
import { findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the family's secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the copy on arrival). */
export interface SsrfShareState {
  /** The box as typed. */
  input: string;
}

/** What replaces a password before the "@" (the site's mark; the secrets check reads it as a placeholder). */
export const SSRF_REDACTED = "[redacted]"; // one fixed mark

/** Where a userinfo stands in a text: the password's span (empty when there is none) and whether there is one. */
interface Userinfo {
  /** True when the authority has an "@" (a userinfo, possibly a user name alone). */
  present: boolean;
  /** The password's first character, or -1 when there is no password. */
  start: number;
  /** One past its last character. */
  end: number;
}

/**
 * Find the userinfo the way the classifier's extractRawHost finds the host: after a "scheme://" or "//", up to the
 * first "/", "?" or "#", everything before the last "@"; the password is what follows its first ":".
 * @param text the box as typed
 * @returns the userinfo's presence and the password's span in the text
 */
export function findUserinfo(text: string): Userinfo {
  const lead = text.length - text.trimStart().length; // blanks the classifier trims
  const s = text.trim(); // as the classifier reads it
  const scheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.exec(s); // scheme://
  const from = scheme ? scheme[0].length : s.startsWith("//") ? 2 : 0; // where the authority starts
  const stop = s.slice(from).search(/[/?#]/); // where it ends
  const authority = stop < 0 ? s.slice(from) : s.slice(from, from + stop); // the authority
  const at = authority.lastIndexOf("@"); // the last "@" ends the userinfo
  if (at < 0) return { present: false, start: -1, end: -1 }; // none
  const colon = authority.indexOf(":"); // the first ":" ends the user name
  if (colon < 0 || colon >= at || colon + 1 === at) return { present: true, start: -1, end: -1 }; // a user name alone, or an empty password
  return { present: true, start: lead + from + colon + 1, end: lead + from + at }; // the password
} // findUserinfo

/** The reading the page shows, without the input itself (which the copy changes by design). */
function readingOf(r: SsrfResult): string {
  return JSON.stringify({ ...r, input: "" }); // every other field, in the engine's order
} // readingOf

/**
 * Classify without throwing (the page does the same: a blank box has no result).
 * @param text the box
 * @returns the reading, or null
 */
function classify(text: string): SsrfResult | null {
  try { return classifyUrl(text); } catch { return null; } // blank: no result
} // classify

/** What the share of a URL comes to: the copy and what was done to it, or why there is none. */
export type SsrfShareCopy =
  | { ok: true; copy: string; replaced: boolean; userOnly: boolean; report: ShareSecretReport } // the copy, whether a password was replaced, whether a user name goes, and the check
  | { ok: false; code: "empty" | "password" }; // nothing classified, or a password that cannot be replaced without changing the reading

/**
 * Make the copy of a URL and check it (the page calls this once per change, for the button and the popover lines).
 * @param input the box as typed
 * @param r the page's reading of it (null when there is none)
 * @returns the copy and its check, or why there is none
 */
export function ssrfShareCopy(input: string, r: SsrfResult | null): SsrfShareCopy {
  if (!r) return { ok: false, code: "empty" }; // nothing classified
  const u = findUserinfo(input); // the userinfo, if any
  const replaced = u.start >= 0; // a password to replace
  const copy = replaced ? input.slice(0, u.start) + SSRF_REDACTED + input.slice(u.end) : input; // the copy
  if (replaced) { const again = classify(copy); if (!again || readingOf(again) !== readingOf(r)) return { ok: false, code: "password" }; } // it must read the same
  return { ok: true, copy, replaced, userOnly: u.present && !replaced, report: findShareSecrets(copy) }; // checked
} // ssrfShareCopy

/**
 * The encoding of a copy the page already made.
 * @param c the copy and its check
 * @returns the copy, nothing, or blocked
 */
export function encodeSsrfShare(c: SsrfShareCopy): ShareEncoding {
  if (!c.ok) return c.code === "empty" ? { ok: false, reason: "empty" } : { ok: false, reason: "blocked", code: "password" }; // nothing, or the password
  const s = c.report.secrets[0]; // the first credential still in the copy, if any
  if (s) return { ok: false, reason: "blocked", code: "secret", values: { label: s.label, more: c.report.secrets.length - 1 } }; // no link
  return { ok: true, params: { input: c.copy } }; // the copy
} // encodeSsrfShare

/** The spec. */
export const SSRF_SHARE: ShareSpec<SsrfShareState> = Object.freeze({
  tool: "ssrf-url-classifier", // the slug
  posture: "derived", // the URL with any password replaced, never a password
  carriesKey: "share.carries", // tools.ssrf-url-classifier.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec classifies the box itself). */
  encode(s: SsrfShareState): ShareEncoding {
    return encodeSsrfShare(ssrfShareCopy(s.input, classify(s.input))); // classified, copied, checked, encoded
  },
  /** Any non-blank text: the page classifies it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): SsrfShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
