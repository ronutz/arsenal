// ============================================================================
// src/lib/tools/html-structure-explainer/markup-secrets.ts
// ----------------------------------------------------------------------------
// THE MARKUP SECRETS CHECK FOR "SHARE RESULTS" (2026-10-27). The three tools
// that read pasted HTML (the HTML structure explainer, the meta, Open Graph and
// JSON-LD inspector, the CSS selector tester) share it as typed (posture
// "input-caution"): their readings depend on every character of the markup
// (lines, attribute values, text), so nothing in it can be replaced without
// changing what the page says. A page saved from a signed-in session can
// still carry a credential (an inline script with a token, a link with a
// password in its address), so before a link is offered the text goes through
// the site's secrets check (src/lib/tools/code-to-image/secrets.ts, reused as
// is, every rule sourced in its header). A finding is one of two kinds, as in
// the iRule check of 2026-10-27 (src/lib/tcl84/irule-secrets.ts):
//
//   secret  a value whose format alone makes it one: a PEM private key (RFC
//           7468 sections 10 and 11), Authorization credentials written as a
//           header line (RFC 9110 section 11.6.2), an AWS access key ID, a JWS
//           or JWE (RFC 7515 section 7.1, RFC 7516 section 7.1; JWTs use these
//           serialisations, RFC 7519 section 1), a password in a URL's userinfo
//           (RFC 3986 section 3.2.1), a FortiOS ENC value. No link is offered
//           while one is there; the popover names its line and the reader puts a
//           placeholder in its place.
//   maybe   a value whose name only looks like a secret (a JSON member, an
//           assignment or a name=value whose name ends in token, password,
//           secret, api_key ...). The link is offered, and the popover names the
//           first one so the reader checks it before sending.
//
// The check never reports a value: a finding's label is the rule's (the header
// name, "JWS", the PEM label or the key's name). Every expression in the
// secrets check is linear.
// ============================================================================

import { scanSecrets, type SecretRule } from "../code-to-image/secrets"; // the site's secrets check, reused as is

/** Rules whose findings are secrets by their format (the rest find a value by its name: maybe). */
const EXACT: ReadonlySet<SecretRule> = new Set<SecretRule>(["pem-private-key", "http-authorization", "aws-access-key-id", "jwt", "url-password", "fortios-enc"]); // as the iRule check

/** The first finding of a kind and how many more lines hold one. */
export interface MarkupSecretPlace {
  /** The 1-based line of the first finding. */
  line: number;
  /** A safe label: the rule's (header name, JWS, PEM label, key name), never the value. */
  label: string;
  /** How many more lines hold a finding of this kind. */
  more: number;
}

/** What the check found in one text. */
export interface MarkupSecretReport {
  /** The first secret, or null. */
  secret: MarkupSecretPlace | null;
  /** The first maybe-secret, or null. */
  maybe: MarkupSecretPlace | null;
}

/**
 * Search pasted markup (or selectors) for secrets.
 * @param text the text as pasted (CR LF and CR read as LF, so line numbers match the page's)
 * @returns the first secret and the first maybe-secret, each with how many more lines hold one
 */
export function findMarkupSecrets(text: string): MarkupSecretReport {
  const norm = text.replace(/\r\n?/g, "\n"); // one line ending
  const findings = scanSecrets(norm, () => false); // every finding, comments included (a commented-out token is still in the link)
  const place = (exact: boolean): MarkupSecretPlace | null => { // the first of a kind
    const list = findings.filter((f) => EXACT.has(f.rule) === exact); // this kind, in reading order
    if (list.length === 0) return null; // none
    const lines = new Set(list.map((f) => f.line)); // the lines that hold one
    return { line: list[0].line, label: list[0].label, more: lines.size - 1 }; // the first, and how many more lines
  }; // place
  return { secret: place(true), maybe: place(false) }; // both kinds
} // findMarkupSecrets
