// ============================================================================
// src/lib/tools/pyproject-toml-explainer/url-credentials.ts
// ----------------------------------------------------------------------------
// CREDENTIALS IN AN INDEX OR PACKAGE URL, for "Share results" (2026-11-01).
// Python packaging tools take the credentials of a private index in the URL
// itself. pip's "Authentication" page (pip.pypa.io/en/stable/topics/
// authentication/, read 2026-11-01): "providing the username (and optionally
// password) in the URL: https://username:password@pypi.company.com/simple",
// and "For indexes that only require single-part authentication tokens,
// provide the token as the "username" and do not provide a password:
// https://0123456789abcdef@pypi.company.com/simple". uv's "Package indexes"
// page (docs.astral.sh/uv/concepts/indexes/, read 2026-11-01): "credentials
// can be embedded directly in the index definition", url =
// "https://public:koala@example.com/simple". RFC 3986 section 3.2.1 (read
// 2026-11-01): "Use of the format "user:password" in the userinfo field is
// deprecated."
//
// So in an http or https URL (a VCS URL such as git+https included) the part
// before the "@" is a credential in both of its forms:
//   user:password   the password is the secret (the site's base check, rule
//                   url-password, finds it too); the user name stays;
//   token           a lone user name may be a single-part token, and nothing
//                   in the text tells a token from a name, so all of it is.
// An ssh URL's user (git+ssh://git@github.com/...) is a login name, not a
// credential: only http and https schemes are read. A whole reference such as
// ${PYPI_TOKEN} is a placeholder, not a value (the base check's own test).
//
// Two uses: the pyproject.toml explainer replaces each credential in its share
// copy (redactUrlCredentials); the wheel filename explainer, whose reading
// needs only the file name, refuses a link while one is there
// (findUrlCredentials).
// ============================================================================

import { isReportableValue } from "../code-to-image/secrets"; // the site's placeholder test
import { lineAt, normaliseLines, type ShareSecretFinding } from "../../share/text-secrets"; // the shared finding shape and line counting

/**
 * What stands in for a credential in a copy: eight bullets, whatever its length (so the copy does not tell how long
 * it was). The site's checks read bullets as a value already masked, so a copy of the copy is the copy.
 */
export const URL_CREDENTIAL_REDACTED = "••••••••"; // the replacement

/**
 * A scheme, "://", the userinfo, then "@". The userinfo is RFC 3986's characters (unreserved, percent-encoded,
 * sub-delims, ":"), here anything but blanks, quotes, angle brackets and the delimiters / ? # @, so a backslash
 * escape written inside it is replaced with it. Bounded: linear.
 */
const URL_USERINFO = /([A-Za-z][A-Za-z0-9+.-]{0,30}):\/\/([^\s/?#@"'<>]{1,512})@/g; // global, bounded
/** The schemes whose userinfo is an HTTP credential: http, https, and a VCS form of either (git+https ...). */
const HTTP_SCHEME = /^(?:[A-Za-z0-9]+\+)?https?$/i; // anchored

/** One credential found in a URL. */
interface UrlCredential {
  /** Where the replaced part starts in the normalised text. */
  start: number;
  /** Where it ends (exclusive). */
  end: number;
  /** The scheme, for the label. */
  scheme: string;
  /** "password" (user:password) or "token" (a lone user name). */
  form: "password" | "token";
}

/**
 * Every credential in the http and https URLs of a text.
 * @param norm the text with line feeds only
 * @returns each credential's span and form, in reading order
 */
function scanUrlCredentials(norm: string): UrlCredential[] {
  const out: UrlCredential[] = []; // the credentials
  let m: RegExpExecArray | null; // the current match
  URL_USERINFO.lastIndex = 0; // from the start
  while ((m = URL_USERINFO.exec(norm))) { // each scheme://userinfo@
    if (!HTTP_SCHEME.test(m[1])) continue; // an ssh user name and the like: a login, not a credential
    const info = m[2]; // the userinfo
    const at = m.index + m[1].length + 3; // where it starts
    const colon = info.indexOf(":"); // user:password, or a lone user name
    if (colon >= 0 && colon < info.length - 1) { // a password after the colon
      const pw = info.slice(colon + 1); // the password
      if (isReportableValue(pw)) out.push({ start: at + colon + 1, end: at + info.length, scheme: m[1], form: "password" }); // the password only; the user name stays
    } else { // no password: the user name may be a single-part token
      const user = colon >= 0 ? info.slice(0, colon) : info; // without an empty password's colon
      if (isReportableValue(user)) out.push({ start: at, end: at + user.length, scheme: m[1], form: "token" }); // the whole name
    } // if
  } // while
  return out; // in reading order
} // scanUrlCredentials

/**
 * The credentials of a text's http and https URLs, as share findings (secrets: no link may carry them).
 * @param norm the text with line feeds only
 * @returns one finding per credential; the label names the scheme and the form, never the value
 */
export function findUrlCredentials(norm: string): ShareSecretFinding[] {
  return scanUrlCredentials(norm).map((c) => ({ rule: "url-password" as const, kind: "secret" as const, line: lineAt(norm, c.start), label: c.form === "password" ? `${c.scheme}://user:...@` : `${c.scheme}://...@`, start: c.start, end: c.end })); // the shared finding shape
} // findUrlCredentials

/** What redactUrlCredentials gives. */
export interface RedactedUrls {
  /** The text with every credential replaced (line feeds only when anything was replaced; the text itself otherwise). */
  copy: string;
  /** How many were replaced. */
  replaced: number;
}

/**
 * Replace every credential in a text's http and https URLs with URL_CREDENTIAL_REDACTED.
 * @param text the text as pasted
 * @returns the copy and the count
 */
export function redactUrlCredentials(text: string): RedactedUrls {
  const norm = normaliseLines(text); // offsets refer to this
  const found = scanUrlCredentials(norm); // the credentials
  if (found.length === 0) return { copy: text, replaced: 0 }; // nothing to replace: the text as pasted
  let copy = norm; // built from the end, so earlier offsets stay true
  for (let i = found.length - 1; i >= 0; i--) copy = copy.slice(0, found[i].start) + URL_CREDENTIAL_REDACTED + copy.slice(found[i].end); // each one
  return { copy, replaced: found.length }; // done
} // redactUrlCredentials
