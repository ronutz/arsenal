// ============================================================================
// src/lib/tools/http-message-decoder/http-secrets.ts
// ----------------------------------------------------------------------------
// THE HTTP SECRETS RULES OF "SHARE RESULTS" (2026-10-27). The HTTP & web tools
// that read a request, a response, a curl command or a URL can share a copy of
// what was pasted in which every credential is replaced (posture "derived",
// ROLLOUT section 11.2: the secret goes, the reading stays). This file holds
// the rules they share; each tool's engine applies them to its own grammar
// (the curl explainer to shell words, the translator and the decoder to
// message lines, the URL inspector to a URL, the builder to its form) and pins
// the result in its own share vectors. Every source was read on 2026-11-01
// (most also on 2026-10-27; what these rules rely on had not changed).
//
// 2026-11-01 (follow-up): an AWS Signature Version 4 credential keeps its scope.
// "Create a signed AWS API request" (docs.aws.amazon.com, read 2026-11-01)
// gives Credential as "your access key ID and your credential scope
// components" (AKIAIOSFODNN7EXAMPLE/YYYYMMDD/region/service/aws4_request): in
// X-Amz-Credential (a presigned query) and in an AWS4-HMAC-SHA256 or
// AWS4-ECDSA-P256-SHA256 Authorization's Credential= only the access key ID
// goes, so the copy still shows the date and Region a presigned request fails
// on; SignedHeaders stays; Signature, X-Amz-Signature and X-Amz-Security-Token
// go whole, as before.
//
// WHAT IS REPLACED, AND WHY (the value goes, its name stays):
//   - Authorization and Proxy-Authorization: the value "consists of
//     credentials" (RFC 9110 sections 11.6.2 and 11.7.2). The scheme word
//     stays; for Basic the user-id stays and only the password goes (RFC 7617
//     section 2: the credentials are base64 of user-id ":" password, and the
//     copy is base64 of user-id ":REDACTED"); for a JWT (a JWS or JWE in
//     compact form, RFC 7519 section 1, RFC 7515 section 7.1) the protected
//     header stays and the claims and the signature go; any other credentials
//     go whole.
//   - Cookie: every cookie-value of the cookie-string (RFC 6265 section 4.2.1);
//     Set-Cookie: the cookie-value of its cookie-pair, attributes kept (4.1.1).
//   - A password in a URL's userinfo, the text after its first colon (RFC 3986
//     section 3.2.1: applications "should not render as clear text any data
//     after the first colon").
//   - A parameter (in a query, a fragment, a form body or a JSON member) whose
//     name holds a secret: the site's own heuristic for secret-looking names
//     (isSecretName in src/lib/tools/code-to-image/secrets.ts: access_token,
//     refresh_token, client_secret, password, api_key, X-Auth-Token ...), and
//     the names HTTP's own standards and vendors define as credentials:
//       code            the authorization code (RFC 6749 section 4.1.2)
//       code_verifier   the PKCE secret (RFC 7636 section 4.5)
//       assertion       an assertion grant (RFC 7521 section 4.1)
//       client_assertion  an assertion for client authentication (RFC 7521 4.2)
//       authorization, proxy_authorization, cookie, set_cookie  the field names
//                       above, when a JSON body or a parameter carries them
//       key             Google's API key parameter ("?key=API_KEY", "Use API
//                       keys to access APIs", cloud.google.com)
//       sig             the signature of an Azure storage SAS ("sig=<signature>
//                       Used to authorize access to the blob", "Create a service
//                       SAS", learn.microsoft.com)
//       signature, x_amz_signature  a request signature (AWS SigV4 query-string
//                       authentication puts X-Amz-Signature in the URL, "Create
//                       a signed AWS API request", docs.aws.amazon.com; its
//                       X-Amz-Security-Token is caught by the "token" rule)
//     A value that is empty, a placeholder (none, null, true ...), a reference
//     ($TOKEN, ${PASS}, {{token}}, <token>) or already masked is kept: the
//     site's isReportableValue decides, so a copy of a copy is the copy.
//   - Any other header whose name holds a secret (X-API-Key, X-Auth-Token,
//     X-Amz-Security-Token, Private-Token ...): its value goes whole.
//
// HOW A VALUE GOES. As the word REDACTED, which every place a value can stand
// in these grammars accepts unescaped: a URL (unreserved characters, RFC 3986
// section 2.3), a token68 or a cookie-octet, a form or JSON value, a shell word
// (no glob or quote character, so a shared curl command parses the same).
// Where a tool reads a value's length (the decoder's cookie table, and any
// body, whose length is Content-Length and the chunk sizes), the value is
// instead filled with "*" for each of its UTF-8 octets, so the framing reads
// the same.
//
// THE NET. After the rules, findResidualSecret runs the site's secrets check
// on the copy for the three formats that need no name to be found: a PEM
// private key (RFC 7468), a JWS or JWE (RFC 7515, 7516), and a password in a
// URL (RFC 3986 3.2.1). One left (a token in a URL path, a key pasted into a
// body without a name) means the tool offers no link and says why.
//
// Every scan here is linear: hand-written loops that visit each character a
// bounded number of times, and expressions over single character classes.
// ============================================================================

import { isReportableValue, isSecretName, scanSecrets } from "../code-to-image/secrets"; // the site's secrets check and its name heuristic

/** The word a replaced value becomes. */
export const SHARE_REDACTED = "REDACTED"; // capitals and letters only: valid unescaped in a URL, a token68, a cookie, a form, JSON and a shell word

/** How a value is replaced: by the word, or by "*" for each UTF-8 octet (where a tool reads the length). */
export type Fill = "word" | "length";

/** One replacement: text[start, end) becomes `with`. */
export interface Edit {
  /** Where the replaced text starts (UTF-16 offset). */
  start: number;
  /** Where it ends (exclusive). */
  end: number;
  /** What replaces it. */
  with: string;
}

/** A redaction: the copy, how many values were replaced, and the edits that made it. */
export interface Redaction {
  /** The copy. */
  text: string;
  /** How many values were replaced. */
  redacted: number;
  /** The edits, in order, not overlapping (offsets into the original text). */
  edits: Edit[];
}

/** Names HTTP's standards and vendors define as credentials, beyond the site's heuristic (normalised: a-z and 0-9). */
const HTTP_SECRET_NAMES: ReadonlySet<string> = new Set([
  "code", // RFC 6749 section 4.1.2: the authorization code
  "codeverifier", // RFC 7636 section 4.5: code_verifier
  "assertion", // RFC 7521 section 4.1
  "clientassertion", // RFC 7521 section 4.2
  "authorization", // RFC 9110 section 11.6.2, when a body or a parameter carries the field
  "proxyauthorization", // RFC 9110 section 11.7.2
  "cookie", // RFC 6265 section 4.2: a cookie-string
  "setcookie", // RFC 6265 section 4.1
  "key", // Google: "?key=API_KEY"
  "sig", // Azure storage SAS: "sig=<signature>"
  "signature", // a request signature
  "xamzsignature", // AWS SigV4 query-string authentication: X-Amz-Signature
]); // the HTTP names

/**
 * Whether a header, parameter or member name holds a secret.
 * @param name the name as written (percent-decoding is the caller's)
 * @returns true for the site's secret-looking names and the HTTP names above
 */
export function isHttpSecretName(name: string): boolean {
  if (isSecretName(name)) return true; // password, token, api_key, client_secret ...
  return HTTP_SECRET_NAMES.has(name.toLowerCase().replace(/[^a-z0-9]/g, "")); // code, code_verifier, sig, X-Amz-Signature ...
} // isHttpSecretName

/**
 * Whether a value is worth replacing: not empty, not a placeholder or reference, not already replaced or masked.
 * @param value the value as written, without quotes
 * @returns true when it may be a secret
 */
export function isReplaceable(value: string): boolean {
  if (value.trim() === SHARE_REDACTED) return false; // already replaced
  return isReportableValue(value); // the site's rule: empty, none, $VAR, {{x}}, <x>, *** are kept
} // isReplaceable

/**
 * The UTF-8 octets of a string (what Content-Length and chunk sizes count).
 * @param s the text
 * @returns its length in UTF-8 octets
 */
export function utf8Octets(s: string): number {
  let n = 0; // the count
  for (let i = 0; i < s.length; i++) { // each UTF-16 unit
    const c = s.charCodeAt(i); // its value
    if (c < 0x80) n += 1; // ASCII
    else if (c < 0x800) n += 2; // two octets
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) { n += 4; i++; } // a surrogate pair: four octets
    else n += 3; // three octets
  } // for
  return n; // the octets
} // utf8Octets

/**
 * What a value becomes.
 * @param value the value as written
 * @param fill the word, or "*" per UTF-8 octet
 * @returns the replacement
 */
export function maskValue(value: string, fill: Fill): string {
  return fill === "word" ? SHARE_REDACTED : "*".repeat(utf8Octets(value)); // one or the other
} // maskValue

/**
 * Apply edits to a text.
 * @param text the original
 * @param edits ordered, non-overlapping edits on it
 * @returns the edited text
 */
export function applyEdits(text: string, edits: readonly Edit[]): string {
  let out = "", at = 0; // the result and the position reached
  for (const e of edits) { out += text.slice(at, e.start) + e.with; at = e.end; } // each edit
  return out + text.slice(at); // the rest
} // applyEdits

/**
 * Merge edit lists: ordered by start, an edit overlapping one already kept is dropped (the earlier list wins a tie).
 * @param lists the lists, most specific first
 * @returns one ordered, non-overlapping list
 */
export function mergeEdits(...lists: readonly (readonly Edit[])[]): Edit[] {
  const all = lists.flatMap((l, rank) => l.map((e) => ({ e, rank }))); // every edit with its list's rank
  all.sort((a, b) => a.e.start - b.e.start || a.rank - b.rank); // by position, then by rank
  const kept: Edit[] = []; // the result
  for (const { e } of all) { // each edit
    const last = kept[kept.length - 1]; // the last kept
    if (last && e.start < last.end) continue; // overlaps it: dropped
    kept.push(e); // kept
  } // for
  return kept; // ordered, non-overlapping
} // mergeEdits

/**
 * Shift edits by an offset.
 * @param edits edits on a part of a text
 * @param by where that part starts
 * @returns the same edits on the whole text
 */
export function shiftEdits(edits: readonly Edit[], by: number): Edit[] {
  return edits.map((e) => ({ start: e.start + by, end: e.end + by, with: e.with })); // moved
} // shiftEdits

/** A redaction from edits. */
function done(text: string, edits: Edit[]): Redaction {
  return { text: applyEdits(text, edits), redacted: edits.length, edits }; // one value per edit
} // done

/** Decode %XX escapes and "+" for a name or value (tolerant: a stray "%" stays). */
function formDecode(s: string): string {
  const plus = s.replace(/\+/g, " "); // form encoding's space
  try { return decodeURIComponent(plus); } catch { return plus.replace(/%([0-9A-Fa-f]{2})/g, (_m, h: string) => String.fromCharCode(parseInt(h, 16))); } // per escape when the whole will not decode
} // formDecode

// ---------------------------------------------------------------------------
// AWS Signature Version 4 credentials (2026-11-01).
// ---------------------------------------------------------------------------

/** Where an AWS credential's access key ID ends: the first "/", written as is, as "%2F" (a query) or as "\/" (JSON). */
const AWS_KEY_END = /\\?\/|%2[Ff]/; // one of the three spellings of the slash

/**
 * Whether a parameter, member or field name is AWS SigV4's X-Amz-Credential.
 * @param name the name, decoded
 * @returns true for X-Amz-Credential in any case or punctuation
 */
function isAwsCredentialName(name: string): boolean {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "") === "xamzcredential"; // normalised as HTTP_SECRET_NAMES are
} // isAwsCredentialName

/**
 * The secret of an AWS SigV4 credential ("AKIAIOSFODNN7EXAMPLE/20220830/us-east-1/ec2/aws4_request"): the access key
 * ID. The credential scope after it (date, Region, service, aws4_request) stays, since a presigned request's failures
 * (expired, wrong Region) are read from it; a value with no scope goes whole.
 * @param v the value as written (percent-encoded in a query)
 * @param fill the word, or the length kept
 * @returns the edit on the access key ID, or nothing
 */
export function awsCredentialEdits(v: string, fill: Fill): Edit[] {
  const m = AWS_KEY_END.exec(v); // the end of the access key ID
  const key = m ? v.slice(0, m.index) : v; // the key ID, or the whole value when no scope follows
  return isReplaceable(formDecode(key)) ? [{ start: 0, end: key.length, with: maskValue(key, fill) }] : []; // replaced, unless already a copy
} // awsCredentialEdits

/**
 * The credentials of an AWS4-HMAC-SHA256 or AWS4-ECDSA-P256-SHA256 Authorization ("Credential=..., SignedHeaders=...,
 * Signature=..."; the AWS page: "There is no comma between the algorithm and Credential. However, the other elements
 * must be separated by commas."): Credential keeps its scope, SignedHeaders stays, Signature and anything else go.
 * @param rest the credentials after the scheme
 * @param fill the word, or the length kept
 * @returns the edits on rest
 */
function awsAuthorizationEdits(rest: string, fill: Fill): Edit[] {
  const edits: Edit[] = []; // the result
  let start = 0; // the current element
  for (let i = 0; i <= rest.length; i++) { // to the end, inclusive
    if (i < rest.length && rest[i] !== ",") continue; // inside an element
    const seg = rest.slice(start, i); // the element
    const lead = seg.length - seg.trimStart().length; // blanks before it
    const body = seg.trim(); // name=value
    const eq = body.indexOf("="); // the name ends here
    const at = start + lead; // where the element starts
    if (eq < 0) { if (isReplaceable(body)) edits.push({ start: at, end: at + body.length, with: maskValue(body, fill) }); } // no name: the whole element goes
    else { // a named element
      const name = body.slice(0, eq).toLowerCase(); // its name
      const value = body.slice(eq + 1); // its value
      const vAt = at + eq + 1; // where the value starts
      if (name === "credential") edits.push(...shiftEdits(awsCredentialEdits(value, fill), vAt)); // the access key ID only
      else if (name !== "signedheaders" && isReplaceable(value)) edits.push({ start: vAt, end: vAt + value.length, with: maskValue(value, fill) }); // Signature and any other element: whole
    } // named
    start = i + 1; // the next element
  } // for
  return edits; // in order
} // awsAuthorizationEdits

// ---------------------------------------------------------------------------
// Credentials (Authorization, Proxy-Authorization).
// ---------------------------------------------------------------------------

/** The base64 alphabet (RFC 4648 section 4). */
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; // standard alphabet

/** Decode standard base64 (padding optional) to bytes, or null. */
function b64Bytes(s: string): number[] | null {
  const t = s.replace(/=+$/, ""); // padding off
  if (t.length === 0 || t.length % 4 === 1) return null; // empty or an impossible length
  const out: number[] = []; // the bytes
  let acc = 0, bits = 0; // the bit buffer
  for (const ch of t) { // each character
    const v = B64.indexOf(ch); // its six bits
    if (v < 0) return null; // not base64
    acc = ((acc << 6) | v) & 0xffffff; bits += 6; // appended (kept within 24 bits)
    if (bits >= 8) { bits -= 8; out.push((acc >> bits) & 0xff); } // a byte out
  } // for
  return out; // the bytes
} // b64Bytes

/** Encode bytes as standard base64 with padding. */
function b64Encode(bytes: readonly number[]): string {
  let out = ""; // the text
  for (let i = 0; i < bytes.length; i += 3) { // three bytes at a time
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0); // 24 bits
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : "=") + (i + 2 < bytes.length ? B64[n & 63] : "="); // four characters
  } // for
  return out; // done
} // b64Encode

/** UTF-8 bytes of a string. */
function utf8Bytes(s: string): number[] {
  return Array.from(new TextEncoder().encode(s)); // the encoder every runtime has
} // utf8Bytes

/** A JWS or JWE in compact form whose first segment decodes to a JSON object with "alg" (RFC 7515 4.1.1). */
function isCompactJose(token: string): boolean {
  const parts = token.split("."); // the segments
  if (parts.length !== 3 && parts.length !== 5) return false; // JWS three, JWE five
  if (!parts.every((p) => /^[A-Za-z0-9_-]*$/.test(p)) || parts[0].length < 4) return false; // base64url segments, a real header
  const bytes = b64Bytes(parts[0].replace(/-/g, "+").replace(/_/g, "/")); // the header's octets
  if (!bytes) return false; // not base64url
  try { const h: unknown = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes))); return typeof h === "object" && h !== null && !Array.isArray(h) && typeof (h as Record<string, unknown>).alg === "string"; } catch { return false; } // a JSON object with alg
} // isCompactJose

/** Scheme names that stand alone with nothing after them (a folded field puts the credentials on the next line). */
const SCHEME_ONLY = /^(?:basic|bearer|digest|negotiate|ntlm)$/i; // RFC 7617, RFC 6750, RFC 7616, RFC 4559 and NTLM's

/**
 * The credentials of an Authorization or Proxy-Authorization value: the scheme stays; Basic keeps its user-id, a JWT
 * its protected header; anything else goes whole.
 * @param value the field value as written (blanks around it are kept)
 * @param fill the word (with the Basic and JWT forms), or "*" per octet where the length is read (a body)
 * @returns the edits on the value
 */
export function credentialEdits(value: string, fill: Fill = "word"): Edit[] {
  const m = /^(\s*)(\S+)(\s+)(\S(?:.*\S)?)?\s*$/.exec(value); // blanks, scheme, blanks, credentials, blanks
  if (!m || m[4] === undefined) { // one word or none
    const w = /^(\s*)(\S+)\s*$/.exec(value); // a single word
    if (w && !SCHEME_ONLY.test(w[2]) && isReplaceable(w[2])) return [{ start: w[1].length, end: w[1].length + w[2].length, with: maskValue(w[2], fill) }]; // a bare token (some APIs send no scheme): the word goes
    return []; // nothing, or a scheme alone
  } // one word
  const rest = m[4]; // the credentials
  if (!isReplaceable(rest)) return []; // a reference such as $TOKEN
  const at = m[1].length + m[2].length + m[3].length; // where they start
  if (/^AWS4-[A-Za-z0-9-]+$/.test(m[2]) && rest.includes("=")) return shiftEdits(awsAuthorizationEdits(rest, fill), at); // AWS SigV4 or SigV4a: the scope stays (2026-11-01)
  if (fill === "length") return [{ start: at, end: at + rest.length, with: maskValue(rest, fill) }]; // the length kept
  if (m[2].toLowerCase() === "basic") { // RFC 7617: base64(user-id ":" password)
    const bytes = b64Bytes(rest); // decoded
    if (bytes) { // base64 indeed
      const text = new TextDecoder().decode(new Uint8Array(bytes)); // the user-pass
      const colon = text.indexOf(":"); // the user-id ends at the first colon (a user-id cannot hold one)
      if (colon >= 0 && !isReplaceable(text.slice(colon + 1))) return []; // no password, or a placeholder: nothing to replace
      if (colon >= 0) return [{ start: at, end: at + rest.length, with: b64Encode(utf8Bytes(text.slice(0, colon + 1) + SHARE_REDACTED)) }]; // user-id kept
    } // base64
    return [{ start: at, end: at + rest.length, with: SHARE_REDACTED }]; // not user-pass: the whole
  } // basic
  if (isCompactJose(rest)) { // a JWT
    const parts = rest.split("."); // the segments
    if (parts.slice(1).every((p) => p === SHARE_REDACTED)) return []; // already a copy: nothing to replace
    return [{ start: at, end: at + rest.length, with: [parts[0], ...parts.slice(1).map(() => SHARE_REDACTED)].join(".") }]; // header kept
  } // jwt
  return [{ start: at, end: at + rest.length, with: SHARE_REDACTED }]; // any other credentials: whole
} // credentialEdits

// ---------------------------------------------------------------------------
// Cookies.
// ---------------------------------------------------------------------------

/**
 * The cookie-values of a cookie-string ("a=1; b=2"), each replaced; names and separators stay.
 * @param value the Cookie value (or curl -b data)
 * @param fill the word, or the length kept
 * @returns the edits on it
 */
export function cookieEdits(value: string, fill: Fill): Edit[] {
  const edits: Edit[] = []; // the result
  let start = 0; // the start of the current pair
  for (let i = 0; i <= value.length; i++) { // to the end, inclusive
    if (i < value.length && value[i] !== ";") continue; // inside a pair
    const pair = value.slice(start, i); // the pair
    const eq = pair.indexOf("="); // name = value
    if (eq >= 0) { // a pair with a value
      const raw = pair.slice(eq + 1); // the value as written
      const lead = raw.length - raw.trimStart().length; // blanks before it
      let v = raw.trim(); // the value
      let off = start + eq + 1 + lead; // where it starts
      if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) { v = v.slice(1, -1); off += 1; } // a quoted value: inside the quotes (RFC 6265 4.1.1)
      if (isReplaceable(v)) edits.push({ start: off, end: off + v.length, with: maskValue(v, fill) }); // replaced
    } // a value
    start = i + 1; // the next pair
  } // for
  return edits; // done
} // cookieEdits

/**
 * The cookie-value of a Set-Cookie value; the attributes stay.
 * @param value the Set-Cookie value
 * @param fill the word, or the length kept
 * @returns the edits on it
 */
export function setCookieEdits(value: string, fill: Fill): Edit[] {
  const semi = value.indexOf(";"); // the pair ends at the first ";"
  return cookieEdits(semi >= 0 ? value.slice(0, semi) : value, fill); // the pair only
} // setCookieEdits

// ---------------------------------------------------------------------------
// URLs.
// ---------------------------------------------------------------------------

/**
 * The secret parameters of a query or a fragment ("a=1&token=x"), split on "&" as RFC 6749 Appendix B and the URL
 * inspector read them.
 * @param qs the query or fragment, without "?" or "#"
 * @param fill the word, or the length kept
 * @returns the edits on it
 */
export function queryEdits(qs: string, fill: Fill): Edit[] {
  const edits: Edit[] = []; // the result
  let start = 0; // the current pair
  for (let i = 0; i <= qs.length; i++) { // to the end, inclusive
    if (i < qs.length && qs[i] !== "&") continue; // inside a pair
    const pair = qs.slice(start, i); // the pair
    const eq = pair.indexOf("="); // name = value
    if (eq > 0) { // a named value
      const v = pair.slice(eq + 1); // the value as written
      const name = formDecode(pair.slice(0, eq)); // the name, decoded
      if (isAwsCredentialName(name)) edits.push(...shiftEdits(awsCredentialEdits(v, fill), start + eq + 1)); // X-Amz-Credential: the access key ID only (2026-11-01)
      else if (isHttpSecretName(name) && isReplaceable(formDecode(v))) edits.push({ start: start + eq + 1, end: i, with: maskValue(v, fill) }); // replaced
    } // named
    start = i + 1; // the next pair
  } // for
  return edits; // done
} // queryEdits

/** RFC 3986 Appendix B: scheme(2) authority(4) path(5) query(7) fragment(9). */
const RFC3986 = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/; // matches any string, linearly

/**
 * A URL's secrets: the userinfo's password (RFC 3986 3.2.1), and the secret parameters of the query and the fragment.
 * @param url the URL as written (blanks around it are allowed)
 * @param opts schemeless: read a leading "user:password@host" without a scheme as an authority, as curl does
 * @returns the edits on it
 */
export function urlEdits(url: string, opts: { schemeless?: boolean } = {}): Edit[] {
  const lead = url.length - url.trimStart().length; // blanks before it
  const u = url.trim(); // the URL
  const m = RFC3986.exec(u); // its parts
  if (!m) return []; // cannot happen: the expression matches any string
  const edits: Edit[] = []; // the result
  let authority: string | null = m[4] ?? null; // the authority, when there is one
  let authStart = m[3] !== undefined ? (m[1]?.length ?? 0) + 2 : -1; // where it starts
  if (authority === null && opts.schemeless) { const e = u.search(/[/?#]/); authority = e < 0 ? u : u.slice(0, e); authStart = 0; } // curl: "user:pass@host/path" (the expression reads "user:" as a scheme; curl does not)
  if (authority !== null && authority.includes("@")) { // a userinfo (up to the last "@", as the URL inspector reads it)
    const ui = authority.slice(0, authority.lastIndexOf("@")); // user:password
    const colon = ui.indexOf(":"); // the first colon
    if (colon >= 0 && isReplaceable(formDecode(ui.slice(colon + 1)))) edits.push({ start: lead + authStart + colon + 1, end: lead + authStart + ui.length, with: SHARE_REDACTED }); // the password
  } // userinfo
  const qAt = m[6] !== undefined ? u.indexOf("?", (m[1]?.length ?? 0) + (m[3]?.length ?? 0) + (m[5]?.length ?? 0)) : -1; // the "?"
  if (qAt >= 0) edits.push(...shiftEdits(queryEdits(m[7] ?? "", "word"), lead + qAt + 1)); // the query
  if (m[8] !== undefined) edits.push(...shiftEdits(queryEdits(m[9] ?? "", "word"), lead + u.length - (m[9] ?? "").length)); // the fragment (RFC 6749 4.2.2 puts access_token there)
  return mergeEdits(edits); // ordered
} // urlEdits

/** scheme://user:password@ anywhere in a text (the secrets check's url-password shape). */
const URL_USERINFO = /([A-Za-z][A-Za-z0-9+.-]{0,30}):\/\/([^\s/?#@:]{0,256}):([^\s/?#@]{1,256})@/g; // global, bounded

// ---------------------------------------------------------------------------
// Bodies and free text.
// ---------------------------------------------------------------------------

/** Characters of a parameter name in free text (a form body, a URL inside JSON, PHP's user[password]). */
const NAME_CHAR = /[A-Za-z0-9_.%~[\]-]/; // one character
/** Characters that end a parameter value in free text. */
const VALUE_END = /[&\s"'<>#;,)}]/; // one character

/**
 * name=value pairs anywhere in a text whose name holds a secret: a form body, a query inside JSON or HTML, a URL in a
 * header value. Each "=" is looked at once; the name is the run of name characters before it (at most 128).
 * @param text the text
 * @param fill the word, or the length kept
 * @returns the edits on it
 */
export function pairEdits(text: string, fill: Fill): Edit[] {
  const edits: Edit[] = []; // the result
  let i = text.indexOf("="); // the first "="
  while (i >= 0) { // each "="
    let s = i; // the name's start
    while (s > 0 && i - s < 128 && NAME_CHAR.test(text[s - 1])) s--; // back over the name (at most 128 characters)
    const name = text.slice(s, i); // the name
    const whole = name !== "" && (s === 0 || !NAME_CHAR.test(text[s - 1])); // the whole name, not the tail of a longer run
    if (!whole || !isHttpSecretName(formDecode(name))) { i = text.indexOf("=", i + 1); continue; } // not a secret name: the next "="
    let e = i + 1; // the value's end, read only for a secret name, so each character is read forward once
    while (e < text.length && !VALUE_END.test(text[e])) e++; // forward over the value
    const v = text.slice(i + 1, e); // the value
    if (isAwsCredentialName(formDecode(name))) edits.push(...shiftEdits(awsCredentialEdits(v, fill), i + 1)); // X-Amz-Credential: the access key ID only (2026-11-01)
    else if (isReplaceable(formDecode(v))) edits.push({ start: i + 1, end: e, with: maskValue(v, fill) }); // replaced
    i = text.indexOf("=", e); // past the value
  } // while
  return edits; // done
} // pairEdits

/** Read a JSON string from the quote at `at`: its end (after the closing quote) and its raw content, or null. */
function jsonString(text: string, at: number): { end: number; raw: string } | null {
  let i = at + 1; // after the opening quote
  while (i < text.length) { // to the closing quote
    const c = text[i]; // the character
    if (c === "\\") { i += 2; continue; } // an escape and its character
    if (c === '"') return { end: i + 1, raw: text.slice(at + 1, i) }; // closed
    if (c === "\n") return null; // a JSON string never spans a line
    i++; // next
  } // while
  return null; // unterminated
} // jsonString

/** Unescape a JSON string's raw content well enough to compare a name (\", \\, \/, \uXXXX). */
function jsonUnescape(raw: string): string {
  return raw.replace(/\\(u[0-9A-Fa-f]{4}|.)/g, (_m, e: string) => (e.length === 5 ? String.fromCharCode(parseInt(e.slice(1), 16)) : e === "n" ? "\n" : e === "t" ? "\t" : e)); // each escape
} // jsonUnescape

/**
 * JSON members ("name": "value") anywhere in a text whose name holds a secret and whose value is a string (RFC 8259
 * section 4). The text need not be valid JSON (a body cut by chunks still has its members). Each character is read once.
 * @param text the text
 * @param fill the word, or the length kept
 * @returns the edits on it (the content between the value's quotes)
 */
export function jsonEdits(text: string, fill: Fill): Edit[] {
  const edits: Edit[] = []; // the result
  let i = 0; // the position
  while (i < text.length) { // the whole text
    if (text[i] !== '"') { i++; continue; } // not a string
    const s1 = jsonString(text, i); // a string
    if (!s1) { i++; continue; } // not one
    let j = s1.end; // after it
    while (j < text.length && (text[j] === " " || text[j] === "\t" || text[j] === "\r" || text[j] === "\n")) j++; // blanks
    if (text[j] !== ":") { i = s1.end; continue; } // a value, not a member name
    let k = j + 1; // after the colon
    while (k < text.length && (text[k] === " " || text[k] === "\t" || text[k] === "\r" || text[k] === "\n")) k++; // blanks
    if (text[k] !== '"') { i = k; continue; } // the value is not a string
    const s2 = jsonString(text, k); // the value
    if (!s2) { i = k + 1; continue; } // unterminated
    const member = jsonUnescape(s1.raw); // the member's name
    if (isAwsCredentialName(member)) edits.push(...shiftEdits(awsCredentialEdits(s2.raw, fill), k + 1)); // X-Amz-Credential: the access key ID only (2026-11-01)
    else if (isHttpSecretName(member) && isReplaceable(s2.raw)) edits.push({ start: k + 1, end: s2.end - 1, with: maskValue(s2.raw, fill) }); // replaced
    i = s2.end; // past the value
  } // while
  return edits; // done
} // jsonEdits

/**
 * A body or a free text: JSON members first, then name=value pairs, then a URL's userinfo password.
 * @param text the text
 * @param fill the word, or the length kept (a body whose length is read)
 * @returns the redaction
 */
export function redactBody(text: string, fill: Fill): Redaction {
  const userinfo: Edit[] = []; // scheme://user:password@
  URL_USERINFO.lastIndex = 0; // from the start
  let m: RegExpExecArray | null; // the current match
  while ((m = URL_USERINFO.exec(text))) if (isReplaceable(m[3])) { const v = m.index + m[1].length + 3 + m[2].length + 1; userinfo.push({ start: v, end: v + m[3].length, with: maskValue(m[3], fill) }); } // each password
  return done(text, mergeEdits(jsonEdits(text, fill), pairEdits(text, fill), userinfo)); // merged
} // redactBody

// ---------------------------------------------------------------------------
// Header fields.
// ---------------------------------------------------------------------------

/** How a field's values are filled. */
export interface FieldFill {
  /** Cookie and Set-Cookie values: the word, or the length kept (the decoder's cookie table shows lengths). */
  cookies: Fill;
  /** Every other value: the word, or the length kept (a field read inside a body, whose length counts). */
  others: Fill;
}

/** Whether a field's whole value is a secret by its name (credentials, cookies, X-API-Key ...). */
export function isSecretField(name: string): boolean {
  const n = name.trim().toLowerCase(); // names are case-insensitive (RFC 9110 5.1)
  return n === "authorization" || n === "proxy-authorization" || n === "cookie" || n === "set-cookie" || isHttpSecretName(name.trim()); // by name
} // isSecretField

/**
 * The secrets of one header field's value, by its name: credentials, cookies, a secret-named field whole, and in any
 * other field a URL's password or a secret parameter (a Referer or a Location can carry a token).
 * @param name the field name
 * @param value the field value as written
 * @param fill how values are filled
 * @returns the edits on the value
 */
export function headerEdits(name: string, value: string, fill: FieldFill = { cookies: "word", others: "word" }): Edit[] {
  const n = name.trim().toLowerCase(); // names are case-insensitive (RFC 9110 5.1)
  if (n === "authorization" || n === "proxy-authorization") return credentialEdits(value, fill.others); // RFC 9110 11.6.2, 11.7.2
  if (n === "cookie") return cookieEdits(value, fill.cookies); // RFC 6265 4.2.1
  if (n === "set-cookie") return setCookieEdits(value, fill.cookies); // RFC 6265 4.1.1
  if (isHttpSecretName(name.trim())) { // X-API-Key, X-Auth-Token ...
    const lead = value.length - value.trimStart().length; // blanks before it
    const v = value.trim(); // the value
    if (isAwsCredentialName(name)) return shiftEdits(awsCredentialEdits(v, fill.others), lead); // X-Amz-Credential as a field: the access key ID only (2026-11-01)
    return isReplaceable(v) ? [{ start: lead, end: lead + v.length, with: maskValue(v, fill.others) }] : []; // whole
  } // secret-named
  return redactBody(value, fill.others).edits; // a URL or a parameter inside any other value
} // headerEdits

// ---------------------------------------------------------------------------
// A raw HTTP/1.1 message (the translator's request, the decoder's request or response).
// ---------------------------------------------------------------------------

/** How a message's values are filled. */
export interface MessageFill {
  /** Cookie and Set-Cookie values in the header section. */
  cookies: Fill;
  /** The body (its length is Content-Length and the chunk sizes). */
  body: Fill;
}

/** A field name (RFC 9110 section 5.1: a token) followed by a colon, at the start of a line. */
const FIELD_LINE = /^([!#$%&'*+.^_`|~0-9A-Za-z-]{1,128})[ \t]*:/; // anchored, bounded

/**
 * A raw HTTP/1.1 message: the request target's password and secret parameters, every header field by its name (a
 * folded continuation line goes with its field, RFC 9112 section 5.2), the body's parameters and members, and any
 * field-shaped line inside the body (chunked trailer fields). Lines end at CR LF, LF or a bare CR, a superset of how
 * the translator (which reads a bare CR as a line end) and the decoder (which keeps it inside the line) read them, so
 * no secret escapes either reading; every line ending is kept as written.
 * @param raw the message as pasted
 * @param fill how cookie values and the body are filled
 * @returns the redaction
 */
export function redactMessage(raw: string, fill: MessageFill): Redaction {
  const lines: { s: number; e: number }[] = []; // each line's content, [s, e)
  let from = 0; // the current line's start
  for (let i = 0; i < raw.length; i++) { // each character
    if (raw[i] === "\n") { lines.push({ s: from, e: i }); from = i + 1; } // LF
    else if (raw[i] === "\r") { lines.push({ s: from, e: i }); if (raw[i + 1] === "\n") i++; from = i + 1; } // CR LF, or a bare CR
  } // for
  lines.push({ s: from, e: raw.length }); // the last line
  const line = (k: number): string => raw.slice(lines[k].s, lines[k].e); // a line's text
  const all: Edit[][] = []; // the edits, by part
  let k = 0; // the current line
  while (k < lines.length && line(k).trim() === "") k++; // leading empty lines (RFC 9112 section 2.2)
  if (k < lines.length) { // the start line
    const m = /^([ \t]*[^ \t]+[ \t]+)([^ \t]+)/.exec(line(k)); // method and request target
    if (m && !/^\s*HTTP\//i.test(line(k))) all.push(shiftEdits(urlEdits(m[2]), lines[k].s + m[1].length)); // a request: the target's secrets
    k++; // past it
  } // start line
  let field: string | null = null; // the field a continuation line belongs to
  for (; k < lines.length; k++) { // the header section
    const l = line(k); // the line
    if (l.trim() === "") { k++; break; } // the empty line: the body follows
    if (/^[ \t]/.test(l) && field !== null) { // a continuation of the previous field (obs-fold)
      const lead = l.length - l.trimStart().length; // its blanks
      const content = l.trim(); // what the decoder appends to the value
      const n = field.toLowerCase(); // the field it belongs to
      const e = n === "cookie" || n === "set-cookie" ? cookieEdits(content, fill.cookies) : isSecretField(field) ? (isReplaceable(content) ? [{ start: 0, end: content.length, with: SHARE_REDACTED }] : []) : redactBody(content, "word").edits; // by its field
      all.push(shiftEdits(e, lines[k].s + lead)); // placed
      continue; // next line
    } // continuation
    const colon = l.indexOf(":"); // name ":" value
    if (colon <= 0) { field = null; continue; } // not a field line
    field = l.slice(0, colon).trim(); // the name
    all.push(shiftEdits(headerEdits(field, l.slice(colon + 1), { cookies: fill.cookies, others: "word" }), lines[k].s + colon + 1)); // its value
  } // header section
  if (k < lines.length) { // a body
    const bodyStart = lines[k].s; // where it starts
    all.push(shiftEdits(redactBody(raw.slice(bodyStart), fill.body).edits, bodyStart)); // its parameters and members
    for (; k < lines.length; k++) { // field-shaped lines in it (trailer fields)
      const l = line(k); // the line
      const f = FIELD_LINE.exec(l); // a field name and a colon?
      if (!f || !isSecretField(f[1])) continue; // not a secret field
      all.push(shiftEdits(headerEdits(f[1], l.slice(f[0].length), { cookies: fill.body, others: fill.body }), lines[k].s + f[0].length)); // its value, filled as the body
    } // body lines
  } // body
  return done(raw, mergeEdits(...all)); // merged, earlier parts first
} // redactMessage

// ---------------------------------------------------------------------------
// The net.
// ---------------------------------------------------------------------------

/** What the net found: the rule, a safe label (never the value) and its line. */
export interface ResidualSecret {
  /** pem-private-key, jwt or url-password. */
  rule: "pem-private-key" | "jwt" | "url-password";
  /** The PEM label, JWS or JWE, or the URL's scheme and user. */
  label: string;
  /** The 1-based line. */
  line: number;
}

/**
 * Search a copy for a secret the rules could not place: a PEM private key, a JWS or JWE, a password in a URL. A JWT
 * whose claims and signature are already REDACTED (an Authorization header's copy) and a REDACTED password are not
 * findings.
 * @param copy the copy
 * @returns the first one left, or null
 */
export function findResidualSecret(copy: string): ResidualSecret | null {
  const text = copy.replace(/\r\n?/g, "\n"); // the check reads line feeds only (same length per line)
  for (const f of scanSecrets(text, () => false)) { // each finding, in order
    const s = text.slice(f.spans[0].start, f.spans[f.spans.length - 1].end); // its text
    if (f.rule === "pem-private-key") return { rule: f.rule, label: f.label, line: f.line }; // a private key
    if (f.rule === "jwt" && !s.split(".").slice(1).every((p) => p === SHARE_REDACTED)) return { rule: f.rule, label: f.label, line: f.line }; // a token
    if (f.rule === "url-password" && s !== SHARE_REDACTED) return { rule: f.rule, label: f.label, line: f.line }; // a password
  } // for
  return null; // nothing left
} // findResidualSecret
