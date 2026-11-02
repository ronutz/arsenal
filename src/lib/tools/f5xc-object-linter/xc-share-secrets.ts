// ============================================================================
// src/lib/tools/f5xc-object-linter/xc-share-secrets.ts
// ----------------------------------------------------------------------------
// THE F5 DISTRIBUTED CLOUD SECRETS RULES FOR "SHARE RESULTS" (2026-11-01,
// wave 4B). The F5 XC tools of this site read JSON objects as the Console's
// JSON view or the API gives them (http_loadbalancer, origin_pool,
// app_firewall, service_policy, the routes of a load balancer, a list of load
// balancers and their domains, an OpenAPI file). Before a Share results link
// carries such an object, or a copy of it, this module says where XC's own
// schema puts a secret and where an object names a credential in a value.
// It lives with the object linter, the XC tool that reads all three kinds of
// object, and serves the F5 XC family (the route, linter and origin pool
// copies; the service policy, domain, OpenAPI and CE file boxes).
//
// What F5's documentation defines, read on 2026-11-01:
//   - SecretType, "used in an object to indicate a sensitive/confidential
//     field" (XC API reference, ves.io.schema.views.http_loadbalancer and
//     ves.io.schema.views.origin_pool, docs.cloud.f5.com/docs-v2/api/...).
//     Exactly one of two members holds the secret:
//       clear_secret_info.url       "URL of the secret ... For string:///
//                                   scheme, Secret needs to be encoded Base64
//                                   format" (a key or password in clear, only
//                                   encoded);
//       blindfold_secret_info.location
//                                   the secret encrypted by Blindfold, "in url
//                                   format for string:///" (the same reference;
//                                   Platform concepts, "Secrets Management and
//                                   Blindfold"; Wingman API reference,
//                                   "Blindfold secrets").
//     The load balancer schema uses SecretType for a TLS certificate's
//     private_key ("TLS Private Key data in unencrypted PEM format ... may be
//     optionally secured using BlindFold"), for the secret_value of a header or
//     cookie it adds, and for API testing credentials (password, token, an API
//     key's value, a login payload); the origin pool schema for the private_key
//     of its mTLS certificates.
//   - The header and cookie values a load balancer adds (request_headers_to_add,
//     response_headers_to_add, request_cookies_to_add, response_cookies_to_add):
//     each entry holds a plain value "Exclusive with [secret_value]", the
//     member XC gives for a secret; a plain value is still where an origin's
//     shared secret or an Authorization value is often written.
//   - API tokens are sent as "Authorization: APIToken <token value>", and API
//     certificates are PKCS #12 files opened with a password (XC
//     "Credentials", docs.cloud.f5.com/docs/how-to/user-mgmt/credentials):
//     the site's check (src/lib/share/text-secrets.ts) already finds an
//     Authorization line with any scheme, so they need no rule here.
//
// Two uses:
//   1. A COPY (the three derived tools: the route explainer, the linter, the
//      origin pool explainer). Every SecretType secret and every header or
//      cookie value added becomes SHARE_REDACTED, through the JSON scanner the
//      AS3, DO and TS explainers share (as3-explainer-validator/
//      json-secrets.ts, reused as is): only those string tokens change, the
//      copy parses to the same structure, and none of the three pages shows
//      any of them (each spec checks that its page reads the copy the same).
//   2. FINDINGS for a box sent as pasted (and for the residual check on a
//      copy): a SecretType secret still in clear text, an Authorization or
//      Proxy-Authorization header matcher with a literal value (RFC 9110
//      sections 11.6.2 and 11.7.2: the value "consists of credentials"), and,
//      as maybe-secrets, a Cookie header or cookie matcher with a literal
//      value (RFC 6265 section 8.4) or a header, query or argument matcher
//      whose name looks secret (the site's isSecretName). They feed the site's
//      check as its `extra` findings, so a box names the line and blocks or
//      cautions exactly as the family's other text tools do.
// A finding never holds the value: its label is the member or matcher name.
// ============================================================================

import { shareableJson, SHARE_REDACTED, type JsonSecretRules } from "../as3-explainer-validator/json-secrets"; // the JSON scanner the F5 automation explainers share
import { findShareSecrets, lineAt, type ShareSecretFinding, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check
import { isReportableValue, isSecretName } from "../code-to-image/secrets"; // the site's value and name heuristics

/** The mark that replaces a value in a copy (the F5 family's word, from json-secrets.ts). */
export const XC_REDACTED = SHARE_REDACTED; // "[redacted]"

/** SecretType's two holders and the member of each that holds the secret (XC API reference, read 2026-11-01). */
const SECRET_TYPE_WITHIN: Readonly<Record<string, ReadonlySet<string>>> = Object.freeze({
  clear_secret_info: new Set(["url"]), // the secret, Base64 after string:///
  blindfold_secret_info: new Set(["location"]), // the Blindfold ciphertext, after string:///
}); // SecretType

/** Only the SecretType rules: the values XC's schema itself calls secret. */
export const XC_SECRET_TYPE_RULES: JsonSecretRules = Object.freeze({
  keys: new Set<string>(), // no member is a secret by its name alone
  containers: new Set<string>(), // no container of secrets
  within: SECRET_TYPE_WITHIN, // url and location inside SecretType
  byClass: Object.freeze({}), // XC objects have no "class" member
}); // XC_SECRET_TYPE_RULES

/** The copy's rules: SecretType, and the plain value of every header or cookie a load balancer adds. */
export const XC_SHARE_RULES: JsonSecretRules = Object.freeze({
  keys: new Set<string>(), // no member is a secret by its name alone
  containers: new Set<string>(), // no container of secrets
  within: Object.freeze({
    ...SECRET_TYPE_WITHIN, // the secrets XC defines
    request_headers_to_add: new Set(["value"]), // HeaderManipulationOptionType.value
    response_headers_to_add: new Set(["value"]), // HeaderManipulationOptionType.value
    request_cookies_to_add: new Set(["value"]), // CookieValueOption.value
    response_cookies_to_add: new Set(["value"]), // SetCookieValueOption.value
  }),
  byClass: Object.freeze({}), // XC objects have no "class" member
}); // XC_SHARE_RULES

/** A SecretType holder with its secret member and a string value (flat objects: no brace inside them). */
const SECRET_TYPE_VALUE = /"(clear_secret_info|blindfold_secret_info)"[ \t\n]*:[ \t\n]*\{[^{}]{0,8192}?"(url|location)"[ \t\n]*:[ \t\n]*"((?:[^"\\\n]|\\.){0,131072})"/g; // global, bounded (131,072 bytes: the schema's max_bytes)

/** Matcher lists whose entries name a subject (name or key) and may hold a literal value. */
const MATCHER_LISTS: ReadonlySet<string> = new Set(["headers", "cookie_matchers", "query_params", "arg_matchers"]); // service policy rules and route matches

/** Headers whose value is a credential (RFC 9110 sections 11.6.2 and 11.7.2). */
const CREDENTIAL_HEADERS: ReadonlySet<string> = new Set(["authorization", "proxy-authorization"]); // lower-cased

/**
 * Whether a parsed JSON value is a plain object.
 * @param v any parsed value
 * @returns true for an object that is not an array or null
 */
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v); // a plain object
} // isObj

/**
 * The literal value a matcher entry compares with, if any: a route match's `exact`, or the first string of a service
 * policy matcher's `item.exact_values` (a regular expression is not a literal value and is left alone).
 * @param entry a matcher entry
 * @returns the literal, or null
 */
function literalOf(entry: Record<string, unknown>): string | null {
  if (typeof entry.exact === "string") return entry.exact; // HeaderMatcherType.exact (routes)
  const item = entry.item; // MatcherType (service policy)
  if (isObj(item) && Array.isArray(item.exact_values)) { const s = item.exact_values.find((x) => typeof x === "string"); if (typeof s === "string") return s; } // its first exact value
  return null; // none
} // literalOf

/**
 * Where a value stands in the text: the first place its JSON spelling occurs (a token is unique in practice), or the
 * subject's, or the start; used only for the line the popover names and for overlaps.
 * @param norm the normalised text
 * @param value the value
 * @param subject the matcher's subject, as a fallback
 * @returns the start offset and the end offset
 */
function placeOf(norm: string, value: string, subject: string): { start: number; end: number } {
  const spelt = JSON.stringify(value); // as JSON writes it
  let at = norm.indexOf(spelt); // the first occurrence
  if (at >= 0) return { start: at + 1, end: at + spelt.length - 1 }; // inside its quotes
  at = norm.indexOf(JSON.stringify(subject)); // the subject instead
  return at >= 0 ? { start: at, end: at + subject.length + 2 } : { start: 0, end: 0 }; // or the start
} // placeOf

/**
 * The matcher findings of a JSON text: an Authorization or Proxy-Authorization matcher with a literal value is a
 * secret; a Cookie header matcher, a cookie matcher, or a header, query or argument matcher with a secret-looking
 * name and a literal value is a maybe. Text that is not JSON gives none. The walk uses an explicit stack.
 * @param norm the normalised text (line feeds only)
 * @returns the findings
 */
export function xcMatcherFindings(norm: string): ShareSecretFinding[] {
  let doc: unknown; // the parsed text
  try { doc = JSON.parse(norm); } catch { return []; } // not JSON: nothing structured to read
  const out: ShareSecretFinding[] = []; // the findings
  const stack: { v: unknown; key: string | null }[] = [{ v: doc, key: null }]; // values to visit, with the member name they are under
  while (stack.length > 0) { // until every value is visited
    const { v, key } = stack.pop() as { v: unknown; key: string | null }; // the next one
    if (Array.isArray(v)) { for (const x of v) stack.push({ v: x, key }); continue; } // an array's elements stand under the array's name
    if (!isObj(v)) continue; // a string, number, boolean or null
    if (key !== null && MATCHER_LISTS.has(key)) { // an entry of a matcher list
      const subject = typeof v.name === "string" ? v.name : typeof v.key === "string" ? v.key : null; // what it matches
      const literal = literalOf(v); // the value it compares with
      if (subject !== null && literal !== null && isReportableValue(literal)) { // a real value
        const lower = subject.toLowerCase(); // header names are case-insensitive
        const label = `${key}: ${subject}`; // the list and the subject, never the value
        const at = placeOf(norm, literal, subject); // where it stands
        const line = lineAt(norm, at.start); // its line
        if (key === "headers" && CREDENTIAL_HEADERS.has(lower)) out.push({ rule: "authorization-header", kind: "secret", line, label, ...at }); // credentials (RFC 9110)
        else if ((key === "headers" && (lower === "cookie" || isSecretName(subject))) || key === "cookie_matchers" || ((key === "query_params" || key === "arg_matchers") && isSecretName(subject))) out.push({ rule: "secret-name", kind: "maybe", line, label, ...at }); // may be a secret
      } // a real value
    } // a matcher entry
    for (const [k, c] of Object.entries(v)) stack.push({ v: c, key: k }); // its members
  } // walk
  return out; // the findings
} // xcMatcherFindings

/**
 * The SecretType findings of a text: a clear_secret_info url or a blindfold_secret_info location with a value
 * (already replaced values, such as [redacted], are not values). Works on text that does not parse too.
 * @param norm the normalised text
 * @returns the findings, each a secret
 */
export function xcSecretTypeFindings(norm: string): ShareSecretFinding[] {
  const out: ShareSecretFinding[] = []; // the findings
  SECRET_TYPE_VALUE.lastIndex = 0; // from the start
  let m: RegExpExecArray | null; // the current match
  while ((m = SECRET_TYPE_VALUE.exec(norm))) { // each holder
    const value = m[3]; // the value as written, without its quotes
    if (value === "" || !isReportableValue(value)) continue; // empty, or already replaced
    const start = m.index + m[0].length - 1 - value.length; // inside its quotes
    out.push({ rule: "secret-name", kind: "secret", line: lineAt(norm, start), label: `${m[1]}.${m[2]}`, start, end: start + value.length }); // a secret XC defines
  } // holders
  return out; // the findings
} // xcSecretTypeFindings

/**
 * Every XC finding of a text, for the site's check (its `extra`): SecretType secrets and matcher values.
 * @param norm the normalised text
 * @returns the findings
 */
export function xcExtraFindings(norm: string): ShareSecretFinding[] {
  return [...xcSecretTypeFindings(norm), ...xcMatcherFindings(norm)]; // both kinds
} // xcExtraFindings

/**
 * The site's check with the XC findings, for a box an XC tool sends as pasted.
 * @param text the box as pasted
 * @returns the secrets and maybe-secrets in reading order (skipped over the link bound)
 */
export function checkXcBox(text: string): ShareSecretReport {
  return findShareSecrets(text, xcExtraFindings); // the site's rules and XC's
} // checkXcBox

/** What the copy of an object comes to. */
export type XcObjectCopy =
  | { ok: true; copy: string; replaced: number; secretTypes: number; report: ShareSecretReport } // the copy, how many values it replaced (and how many of them SecretType), and the check on it
  | { ok: false }; // no copy could be made safely (text that is not JSON and names a rule's holder)

/**
 * The copy of a pasted XC object: SecretType secrets and added header and cookie values replaced, then the site's
 * check (with the XC findings) on what is left. Pure; never throws.
 * @param input the box as pasted
 * @returns the copy and its check, or no copy
 */
export function xcObjectCopy(input: string): XcObjectCopy {
  const all = shareableJson(input, XC_SHARE_RULES); // every value the copy replaces
  if (!all.ok) return { ok: false }; // not JSON, and it names clear_secret_info, a header list ...: no copy
  const st = shareableJson(input, XC_SECRET_TYPE_RULES); // how many of them XC's schema calls secret
  const secretTypes = st.ok ? st.redacted : 0; // SecretType values replaced
  return { ok: true, copy: all.text, replaced: all.redacted, secretTypes, report: findShareSecrets(all.text, xcExtraFindings) }; // checked
} // xcObjectCopy

/** The lists of header and cookie values a load balancer adds (the copy replaces their plain values). */
const ADDED_VALUE_LISTS: ReadonlySet<string> = new Set(["request_headers_to_add", "response_headers_to_add", "request_cookies_to_add", "response_cookies_to_add"]); // HeaderManipulationOptionType, CookieValueOption, SetCookieValueOption

/**
 * The names of the headers and cookies whose plain value a copy replaced (walked with an explicit stack).
 * @param input the box as pasted (JSON)
 * @returns each entry's list and name, or null when the text does not parse
 */
export function xcAddedValueNames(input: string): { list: string; name: string }[] | null {
  let doc: unknown; // the parsed text
  try { doc = JSON.parse(input); } catch { return null; } // not JSON
  const out: { list: string; name: string }[] = []; // the entries
  const stack: { v: unknown; key: string | null }[] = [{ v: doc, key: null }]; // values to visit
  while (stack.length > 0) { // every value
    const { v, key } = stack.pop() as { v: unknown; key: string | null }; // the next one
    if (Array.isArray(v)) { for (const x of v) stack.push({ v: x, key }); continue; } // elements stand under the array's name
    if (!isObj(v)) continue; // not an object
    if (key !== null && ADDED_VALUE_LISTS.has(key) && typeof v.value === "string" && v.value !== "") out.push({ list: key, name: typeof v.name === "string" ? v.name : "" }); // a plain value the copy replaces
    for (const [k, c] of Object.entries(v)) stack.push({ v: c, key: k }); // its members
  } // walk
  return out; // the entries
} // xcAddedValueNames

/**
 * Whether the popover may offer its reveal switch beside a copy (PRIME 01/11/2026; the brief: only where the copy
 * replaced values a reader may reasonably want to send on purpose, never in place of a link a credential blocked).
 * Offered when the copy replaced something, none of it a SecretType secret, none of it the value of a header or
 * cookie whose name is a credential's (Authorization, Proxy-Authorization) or looks secret, and the object as
 * pasted holds nothing the site's check calls a secret.
 * @param input the box as pasted
 * @param c its copy
 * @returns true when the switch may be offered
 */
export function xcRevealable(input: string, c: XcObjectCopy): boolean {
  if (!c.ok || c.replaced === 0 || c.secretTypes > 0) return false; // nothing replaced, or a secret XC defines
  const names = xcAddedValueNames(input); // whose values were replaced
  if (names === null || names.some((e) => CREDENTIAL_HEADERS.has(e.name.toLowerCase()) || isSecretName(e.name))) return false; // a credential's value
  return checkXcBox(input).secrets.length === 0; // and nothing else secret in the paste
} // xcRevealable
