// ============================================================================
// src/lib/share/text-secrets.ts
// ----------------------------------------------------------------------------
// THE SECRETS CHECK FOR "SHARE RESULTS" OF THE SECURITY & WAF TEXT TOOLS
// (2026-10-27). Before a link may carry a pasted text (a declarative WAF
// policy, a pair of them, an evasions block, a Content-Security-Policy, an
// XML document) or a copy derived from one (an ASM log line, a URL, an HTTP
// response), the text is searched for values a link must not carry. It lives
// with the declarative-policy explainer, the first of the AWAF policy
// readers, and serves this family's text tools (the AWAF readers, the CSP
// evaluator, the XML decoder, the request-log, URL and headers copies).
// MOVED 01/11/2026 from src/lib/tools/f5-awaf-declarative-policy-explainer/
// share-secrets.ts to the share library, beside the specs that use it: eight
// tools of several families read it, and the next waves may too.
// A finding is one of two kinds:
//
//   secret  a value in a place a standard defines as a credential or a key.
//           No link is offered while one is there; the popover names its
//           line and what it is, and the reader replaces it and presses again.
//           From the site's secrets check (src/lib/tools/code-to-image/
//           secrets.ts), reused as is: a PEM private key, Authorization
//           credentials with Basic or Bearer, an AWS access key ID, a JWS or
//           JWE (RFC 7519 section 1: a JWT is one of these), a password in a
//           URL, a FortiOS ENC value. And two header lines it does not read,
//           each defined by an RFC read on 2026-10-27:
//             authorization-header  an Authorization or Proxy-Authorization
//                                   line with any scheme and credentials (RFC
//                                   9110 sections 11.6.2 and 11.7.2: the value
//                                   "consists of credentials"; the site's check
//                                   reads Basic and Bearer only);
//             cookie-header         a Cookie or Set-Cookie line with a cookie
//                                   pair whose value is not empty (RFC 6265
//                                   sections 4.1.1 and 4.2.1, the cookie-pair
//                                   grammar; section 8.4: servers "commonly
//                                   store a nonce (or "session identifier") in
//                                   a cookie").
//   maybe   a value whose name looks like a secret, by the site's check's own
//           heuristic (a JSON member such as "token", a name=value in a URL's
//           query, a password keyword ...). The link is offered, and the
//           popover names the first one so the reader checks it before sending.
//           Tools add their own maybe or secret findings (the XML decoder's
//           WS-Security password, a policy's webhook URL) through `extra`.
//
// Escapes: the two-character escapes \r, \n and \t (a backslash and a letter)
// are read as two blanks before the search, so a header line written inside a
// quoted value (an ASM log's request="GET / HTTP/1.1\r\nCookie: ...", a JSON
// string) is found as a line of its own; offsets and lines do not move.
//
// Bound: a text longer than the link bound (MAX_SHARE_CHARS) is not read at
// all, because no link can carry it (the button says how long it is). The
// site's check reads a run of base64url characters in time that grows with
// the square of its length when no dot follows it (280 ms for one run of
// 16,384 characters, 4 ms for 2,000, measured 2026-10-27); within the bound
// that stays a fraction of a second even for that worst case.
// A finding never holds the value itself: its label is the header, member,
// rule or element name.
// ============================================================================

import { isReportableValue, scanSecrets, type SecretRule } from "../tools/code-to-image/secrets"; // the site's secrets check, reused as is
import { MAX_SHARE_CHARS } from "./format"; // the link bound
import type { ShareEncoding } from "./spec"; // what a share spec's encode returns

/** The rules this check adds to the site's check (see the header for each one's source), and the tools' own. */
export type ShareSecretRule = SecretRule | "authorization-header" | "cookie-header" | "webhook-url" | "wsse-password" | "saml-assertion" | "secret-name";

/** One finding. */
export interface ShareSecretFinding {
  /** The rule that found it. */
  rule: ShareSecretRule;
  /** "secret": no link may carry it; "maybe": a name that looks like a secret, named in the popover. */
  kind: "secret" | "maybe";
  /** The 1-based line of the value in the text as pasted (line feeds, CR LF or CR all end a line). */
  line: number;
  /** A safe label: the header, member, rule or element name, never the value. */
  label: string;
  /** Where the value starts in the normalised text (UTF-16 offset), for order and overlaps. */
  start: number;
  /** Where it ends (exclusive). */
  end: number;
}

/** What the check found, each list in reading order. */
export interface ShareSecretReport {
  /** Values no link may carry. */
  secrets: ShareSecretFinding[];
  /** Values whose name looks like a secret. */
  maybe: ShareSecretFinding[];
  /** True when the text was over the link bound and was not read (no link can carry it anyway). */
  skipped: boolean;
}

/** The site's check's rules that find a value by where it stands (a format a standard defines): secrets. */
const EXACT: ReadonlySet<SecretRule> = new Set<SecretRule>(["pem-private-key", "http-authorization", "aws-access-key-id", "jwt", "url-password", "fortios-enc"]); // the rest find a value by its name: maybe

/** An Authorization or Proxy-Authorization line: the name, a scheme (an RFC 9110 token) and credentials after it. */
const AUTHZ_ANY = /(?:^|[^A-Za-z0-9-])((?:Proxy-)?Authorization)[ \t]*:[ \t]*([A-Za-z][A-Za-z0-9!#$%&'*+.^_`|~-]{0,63})[ \t]+([^\s"'<>]{1,4096})/gi; // global, case-insensitive, bounded
/** A Cookie or Set-Cookie line: the name, then the rest of the line (its cookie pairs). */
const COOKIE_LINE = /(?:^|[^A-Za-z0-9-])(Set-Cookie|Cookie)[ \t]*:([^\n]{0,8192})/gi; // global, case-insensitive, bounded
/** One cookie pair at the start of a ";"-separated part: cookie-name "=" cookie-value (RFC 6265 sections 4.1.1, 4.2.1). */
const COOKIE_PAIR = /^[ \t]*([!#$%&'*+.^_`|~0-9A-Za-z-]{1,256})=([^\s;,"'<>]{0,4096})/; // anchored, bounded

/**
 * Normalise line ends to line feeds, keeping every offset's line (CR LF becomes one character fewer, so offsets
 * refer to the normalised text; lines are counted the same way a textarea shows them).
 * @param text the text as pasted
 * @returns the text with line feeds only
 */
export function normaliseLines(text: string): string {
  return text.replace(/\r\n?/g, "\n"); // CR LF and CR to LF
} // normaliseLines

/**
 * The 1-based line of an offset in a normalised text.
 * @param text the normalised text
 * @param offset the offset
 * @returns its line
 */
export function lineAt(text: string, offset: number): number {
  let n = 1; // the first line
  for (let i = 0; i < offset && i < text.length; i++) if (text.charCodeAt(i) === 10) n++; // one per line feed before it
  return n; // the line
} // lineAt

/**
 * Search a text for values a link must not carry, and for values whose name looks like a secret.
 * @param text the text (any line ends)
 * @param extra findings a tool adds (on the normalised text), merged in by kind
 * @returns the secrets and maybe-secrets in reading order, or skipped when the text is over the link bound
 */
export function findShareSecrets(text: string, extra: (norm: string) => ShareSecretFinding[] = () => []): ShareSecretReport {
  if (text.length > MAX_SHARE_CHARS) return { secrets: [], maybe: [], skipped: true }; // no link can carry it: not read
  const norm = normaliseLines(text); // line feeds only, as the site's check expects
  const scan = norm.replace(/\\[rnt]/g, "  "); // escaped line ends and tabs as two blanks: same length, same lines
  const found: ShareSecretFinding[] = []; // every finding before overlaps are removed
  for (const f of scanSecrets(scan, () => false)) { // the site's check; none of these formats has comments to honour
    const sp = f.spans[0]; // the first masked stretch
    const end = f.spans[f.spans.length - 1].end; // the last one's end
    found.push({ rule: f.rule, kind: EXACT.has(f.rule) ? "secret" : "maybe", line: f.line, label: f.label, start: sp.start, end }); // classified
  } // for
  let m: RegExpExecArray | null; // the current match
  AUTHZ_ANY.lastIndex = 0; // authorization-header, any scheme
  while ((m = AUTHZ_ANY.exec(scan))) { // each line
    const start = m.index + m[0].length - m[3].length; // the credentials
    if (isReportableValue(m[3])) found.push({ rule: "authorization-header", kind: "secret", line: lineAt(scan, start), label: `${m[1]}: ${m[2]}`, start, end: start + m[3].length }); // not a placeholder
  } // while
  COOKIE_LINE.lastIndex = 0; // cookie-header
  while ((m = COOKIE_LINE.exec(scan))) { // each line
    const rest = m[2]; // after the colon
    let off = m.index + m[0].length - rest.length; // where it starts
    const parts = /^set-cookie$/i.test(m[1]) ? [rest.split(";")[0]] : rest.split(";"); // Set-Cookie sets one cookie (attributes follow); Cookie sends several
    for (const part of parts) { // each pair
      const p = COOKIE_PAIR.exec(part); // name=value
      if (p && p[2] !== "" && isReportableValue(p[2])) { const start = off + p[0].length - p[2].length; found.push({ rule: "cookie-header", kind: "secret", line: lineAt(scan, start), label: m[1], start, end: start + p[2].length }); break; } // the first value, not "[redacted]" or empty: one finding per line
      off += part.length + 1; // past the part and its ";"
    } // for
  } // while
  found.push(...extra(norm)); // the tool's own
  const ordered = [...found].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "secret" ? -1 : 1) || a.start - b.start); // secrets claim their characters first
  const kept: ShareSecretFinding[] = []; // without overlaps
  for (const f of ordered) if (!kept.some((k) => f.start < k.end && k.start < f.end)) kept.push(f); // no shared character
  const byPosition = (a: ShareSecretFinding, b: ShareSecretFinding): number => a.start - b.start; // reading order
  return { secrets: kept.filter((f) => f.kind === "secret").sort(byPosition), maybe: kept.filter((f) => f.kind === "maybe").sort(byPosition), skipped: false }; // both lists
} // findShareSecrets

/** The values a blocked encoding or a caution line names: the first finding, and how many more places hold one. */
export interface SharePlace {
  /** The field the first finding is in ("input" for a tool with one box). */
  field: string;
  /** Its line in that field. */
  line: number;
  /** Its safe label. */
  label: string;
  /** How many other places (a field and a line) hold a finding of the same kind. */
  more: number;
}

/**
 * The first finding of a list and how many other places hold one, for a popover line.
 * @param list findings of one kind, in the order to name them, each with its field when a tool has several boxes
 * @returns the place, or null for an empty list
 */
export function firstSharePlace(list: readonly (ShareSecretFinding & { field?: string })[]): SharePlace | null {
  if (list.length === 0) return null; // nothing found
  const places = new Set(list.map((f) => `${f.field ?? "input"}\n${f.line}`)); // distinct places (a field and a line)
  const f = list[0]; // the first, in reading order
  return { field: f.field ?? "input", line: f.line, label: f.label, more: places.size - 1 }; // what the popover names
} // firstSharePlace

/**
 * Run the check over several fields, in the order given.
 * @param fields each field's share name and text
 * @returns the secrets and maybe-secrets of all fields, field by field, and whether any field was over the bound
 */
export function findShareSecretsIn(fields: readonly (readonly [string, string])[]): { secrets: (ShareSecretFinding & { field: string })[]; maybe: (ShareSecretFinding & { field: string })[]; skipped: boolean } {
  const total = fields.reduce((n, [, t]) => n + t.length, 0); // the link carries them together
  if (total > MAX_SHARE_CHARS) return { secrets: [], maybe: [], skipped: true }; // no link can carry them: not read
  const secrets: (ShareSecretFinding & { field: string })[] = []; // every field's secrets
  const maybe: (ShareSecretFinding & { field: string })[] = []; // every field's maybe-secrets
  for (const [field, text] of fields) { // in the order given
    const r = findShareSecrets(text); // this field
    for (const f of r.secrets) secrets.push({ ...f, field }); // tagged
    for (const f of r.maybe) maybe.push({ ...f, field }); // tagged
  } // for
  return { secrets, maybe, skipped: false }; // done
} // findShareSecretsIn

/**
 * The blocked encoding for secret findings, or null when there is none.
 * @param secrets the secrets, in the order to name them (field by field for several boxes)
 * @returns blocked with code "secret" and the place the popover names (field, line, label, more), or null
 */
export function blockedBySecret(secrets: readonly (ShareSecretFinding & { field?: string })[]): ShareEncoding | null {
  const p = firstSharePlace(secrets); // the first, and how many more places
  if (!p) return null; // nothing blocks
  return { ok: false, reason: "blocked", code: "secret", values: { field: p.field, line: p.line, label: p.label, more: p.more } }; // no link
} // blockedBySecret

/**
 * The Share results encoding of a tool whose one box goes as pasted after this check: nothing while it is blank,
 * no link while it holds a secret, the box otherwise (a box over the bound goes too: the button says it is too long).
 * @param input the box as pasted
 * @param report the check's report on that box (the page computes it once for the button and the caution line)
 * @returns the encoding
 */
export function encodeCheckedBox(input: string, report: ShareSecretReport): ShareEncoding {
  if (input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
  return blockedBySecret(report.secrets) ?? { ok: true, params: { input } }; // blocked, or the box as pasted
} // encodeCheckedBox
