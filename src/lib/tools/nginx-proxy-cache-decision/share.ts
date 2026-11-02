// ============================================================================
// src/lib/tools/nginx-proxy-cache-decision/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the NGINX proxy_cache decision engine (posture
// "derived", raised on 2026-11-01 from the inventory's "input"). The box
// describes one exchange, and its request and response headers are the
// lesson: a Cookie, a Set-Cookie, an Authorization. Pasted from a browser's
// developer tools they are live: cookie values are commonly session
// identifiers (RFC 6265 section 8.4, read 2026-11-01) and an Authorization
// value "consists of credentials" (RFC 9110 section 11.6.2, read 2026-11-01).
// The decision reads whether those headers are there, never their values;
// only the rendered cache key shows a value, where the key names
// $cookie_<name> or $http_<name> (nginx.org, ngx_http_core_module,
// "Embedded Variables", read 2026-11-01). So a link carries a COPY of the
// box:
//   - each cookie value of a `request_header Cookie:` line, the cookie value
//     of a `response_header Set-Cookie:` line (its name and attributes
//     stay), the credentials after the scheme of an Authorization or
//     Proxy-Authorization line (the scheme stays; a scheme alone is left as
//     it is), and the whole value of any header whose name looks secret (the
//     site's isSecretName: X-Api-Key, X-Auth-Token ...) become [redacted];
//     every other byte stays as typed;
//   - the copy must decide the same (stored, served, every rule's outcome,
//     every warning), or there is no link (code "copy"); the cache key and
//     the step that quotes it then show [redacted] where a value was;
//   - the site's check (src/lib/share/text-secrets.ts) then reads the copy:
//     a credential left in it (a JWT in the URI, a key) blocks the link (code
//     "secret"), a secret-looking name with a value is named in a maybe line.
// The popover says how many values were replaced.
//
// The reveal switch (THE REVEAL SWITCH, 01/11/2026): beside a copy that
// replaced anything, the popover offers to include the values; ticked, the
// link carries the box as typed (posture input-caution,
// PROXY_CACHE_SHARE_REVEALED), with a caution. A teaching exchange often uses
// made-up values, and a key that names a cookie shows its value.
//
// Arrival: the copy (or the box) fills as a paste would, and the page
// decides (nothing is fetched). Any non-blank text is accepted, as a paste is.
// ============================================================================

import { decideCache, type CacheDecision } from "./compute"; // the page's own decision engine (it throws on a malformed case)
import { blockedBySecret, findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check
import { isReportableValue, isSecretName } from "../code-to-image/secrets"; // the site's value and name heuristics
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding; the copy or the box on arrival). */
export interface ProxyCacheShareState {
  /** The box. */
  input: string;
}

/** What replaces a value in the copy (the site's mark; the grammar's "#" and ";" are not in it). */
export const CACHE_REDACTED = "[redacted]"; // one fixed mark

/** A header line of the grammar, split so its value can be replaced and every other byte kept. */
const HEADER_LINE = /^([ \t]*)(request_header|response_header)([ \t]+)([^:]+):([ \t]*)(.*?)([ \t]*;?[ \t]*)$/; // anchored; one line, without its comment

/**
 * Replace one value, counting it, unless it is empty or already a placeholder.
 * @param v the value
 * @param count the counter to bump
 * @returns the value or the mark
 */
function mark(v: string, count: { n: number }): string {
  if (v.trim() === "" || !isReportableValue(v)) return v; // nothing to hide
  count.n++; // one more
  return CACHE_REDACTED; // replaced
} // mark

/**
 * The value of one header line with its secrets replaced, by the header's name.
 * @param name the header name, as written
 * @param kind request_header or response_header
 * @param value the value, as written (no comment, no trailing ";")
 * @param count the counter to bump
 * @returns the value to write
 */
function redactValue(name: string, kind: string, value: string, count: { n: number }): string {
  const n = name.trim().toLowerCase(); // header names are case-insensitive
  if (kind === "request_header" && n === "cookie") return value.split(";").map((part) => { const eq = part.indexOf("="); if (eq < 0) { const lead = part.match(/^\s*/)?.[0] ?? ""; return lead + mark(part.slice(lead.length), count); } return part.slice(0, eq + 1) + mark(part.slice(eq + 1), count); }).join(";"); // every cookie value
  if (kind === "response_header" && n === "set-cookie") { const semi = value.indexOf(";"); const first = semi < 0 ? value : value.slice(0, semi); const eq = first.indexOf("="); return eq < 0 ? value : first.slice(0, eq + 1) + mark(first.slice(eq + 1), count) + (semi < 0 ? "" : value.slice(semi)); } // the cookie's value; its attributes stay
  if (n === "authorization" || n === "proxy-authorization") { const m = /^(\S+)([ \t]+)(.+)$/.exec(value); return m ? m[1] + m[2] + mark(m[3], count) : value; } // the credentials; the scheme stays, a scheme alone too
  if (isSecretName(name.trim())) return mark(value, count); // a secret-looking name: the whole value
  return value; // anything else: as typed
} // redactValue

/**
 * The copy of a box: the values above replaced, every other byte as typed.
 * @param input the box as typed
 * @returns the copy and how many values it replaced
 */
export function shareableExchange(input: string): { copy: string; replaced: number } {
  const count = { n: 0 }; // values replaced
  const copy = input.split("\n").map((line) => { // each line (a CR before the line feed stays with its line, as the grammar reads it)
    const cr = line.endsWith("\r") ? "\r" : ""; // a CR LF line end
    const body = cr ? line.slice(0, -1) : line; // the line without it
    const hash = body.indexOf("#"); // the grammar drops everything after "#"
    const code = hash < 0 ? body : body.slice(0, hash); // what the grammar reads
    const rest = hash < 0 ? "" : body.slice(hash); // the comment, kept as typed
    const m = HEADER_LINE.exec(code); // a header line?
    if (!m) return line; // anything else: as typed
    return m[1] + m[2] + m[3] + m[4] + ":" + m[5] + redactValue(m[4], m[2], m[6], count) + m[7] + rest + cr; // the value replaced
  }).join("\n"); // the lines again
  return { copy, replaced: count.n }; // done
} // shareableExchange

/**
 * What the page decides, as a comparable text: stored, served, every rule and its outcome, every warning (the step
 * details and the rendered key may show the mark where a value was).
 * @param d a decision
 * @returns its text
 */
export function cacheDecisionOf(d: CacheDecision): string {
  return JSON.stringify({ stored: d.stored, served: d.servedFromCache, store: d.storeSteps.map((s) => [s.rule, s.passed]), serve: d.serveSteps.map((s) => [s.rule, s.passed]), warnings: d.warnings }); // the decision
} // cacheDecisionOf

/**
 * Decide without throwing (the page shows its own error for a malformed case).
 * @param text the box
 * @returns the decision, or null
 */
function decide(text: string): CacheDecision | null {
  if (text.trim() === "") return null; // nothing typed
  try { return decideCache(text.trim()); } catch { return null; } // a parse error shows instead
} // decide

/** What the share of an exchange comes to: the copy and its check, or why there is none. */
export type CacheShareCopy =
  | { ok: true; copy: string; replaced: number; report: ShareSecretReport } // the copy, how many values it replaced, and the check
  | { ok: false; code: "empty" | "copy" }; // nothing decided, or a copy that would decide differently

/**
 * Make the copy of a box and check it (the page calls this once per change, with its own decision).
 * @param input the box as typed
 * @param d the page's decision (null when there is none)
 * @returns the copy and its check, or why there is none
 */
export function cacheShareCopy(input: string, d: CacheDecision | null): CacheShareCopy {
  if (!d) return { ok: false, code: "empty" }; // nothing decided
  const c = shareableExchange(input); // the copy
  if (c.replaced > 0) { const again = decide(c.copy); if (!again || cacheDecisionOf(again) !== cacheDecisionOf(d)) return { ok: false, code: "copy" }; } // it must decide the same
  return { ok: true, copy: c.copy, replaced: c.replaced, report: findShareSecrets(c.copy) }; // checked
} // cacheShareCopy

/**
 * The encoding of a copy the page already made.
 * @param c the copy and its check
 * @returns the copy, nothing, or blocked
 */
export function encodeCacheShare(c: CacheShareCopy): ShareEncoding {
  if (!c.ok) return c.code === "empty" ? { ok: false, reason: "empty" } : { ok: false, reason: "blocked", code: "copy" }; // nothing, or why not
  return blockedBySecret(c.report.secrets) ?? { ok: true, params: { input: c.copy } }; // blocked, or the copy
} // encodeCacheShare

/**
 * The box as typed, every value included: what the reveal switch carries (the page offers it only beside a copy
 * that replaced something, never in place of a link the check blocked).
 * @param input the box as typed
 * @param d the page's decision (null when there is none)
 * @returns the box as typed, or nothing
 */
export function encodeCacheRevealed(input: string, d: CacheDecision | null): ShareEncoding {
  return d ? { ok: true, params: { input } } : { ok: false, reason: "empty" }; // as typed, or nothing
} // encodeCacheRevealed

/**
 * Decode the shared box: any non-blank text, as a paste.
 * @param v the values
 * @returns the state, or null
 */
function decodeCache(v: Readonly<Record<string, string | null>>): ProxyCacheShareState | null {
  return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
} // decodeCache

/** The spec. */
export const PROXY_CACHE_SHARE: ShareSpec<ProxyCacheShareState> = Object.freeze({
  tool: "nginx-proxy-cache-decision", // the slug
  posture: "derived", // a copy with cookie values and credentials replaced, never the box as typed
  carriesKey: "share.carries", // tools.nginx-proxy-cache-decision.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec decides, copies and checks itself). */
  encode(s: ProxyCacheShareState): ShareEncoding {
    return encodeCacheShare(cacheShareCopy(s.input, decide(s.input))); // decided, copied, checked, encoded
  },
  /** Any non-blank text: the page decides it as a paste. */
  decode: decodeCache,
});

/** The spec of the reveal switch: the box as typed (posture input-caution: the reader ticked it, the popover cautions). */
export const PROXY_CACHE_SHARE_REVEALED: ShareSpec<ProxyCacheShareState> = Object.freeze({
  tool: "nginx-proxy-cache-decision", // the slug
  posture: "input-caution", // the box as typed, with the tool's caution, by the reader's explicit choice
  carriesKey: "share.carriesRevealed", // tools.nginx-proxy-cache-decision.share.carriesRevealed
  names: ["input"], // the same name: an arrival is the same paste either way
  /** The box as typed, or nothing. */
  encode(s: ProxyCacheShareState): ShareEncoding {
    return encodeCacheRevealed(s.input, decide(s.input)); // decided, then as typed
  },
  /** One decode rule for both. */
  decode: decodeCache,
});
