// ============================================================================
// src/lib/tools/json-formatter/share-secrets.ts
// ----------------------------------------------------------------------------
// THE SECRETS CHECK FOR "SHARE RESULTS" OF THE JSON AND YAML TOOLS
// (2026-11-01): the JSON formatter and the JSON <-> YAML converter. Both send
// the box as pasted (a formatter's or converter's reading is the text itself,
// every value included), so a value cannot be replaced without changing what
// the reader sees; a credential blocks the link instead.
//
// The check is the shared one (src/lib/share/text-secrets.ts, the site's base
// check reused as is), with one change for structured text: a member or key
// whose name a standard defines as holding a credential is a secret, not only
// a name that looks like one. The site's base check finds such members by its
// name heuristic (json-member, yaml-mapping: "maybe"); these five are promoted
// to "secret", so a token response or an application's settings file gets no
// link while they hold a value:
//   access_token, refresh_token  RFC 6749 section 1.4 ("Access tokens are
//                                credentials used to access protected
//                                resources"), 1.5 ("Refresh tokens are
//                                credentials used to obtain access tokens"),
//                                5.1 (the token response's members);
//   id_token                     OpenID Connect Core 1.0, section 3.1.3.3 (the
//                                token response's ID Token);
//   client_secret                RFC 7591 section 3.2.1 ("OAuth 2.0 client
//                                secret string");
//   registration_access_token    RFC 7592 section 3.
// All read 2026-11-01. The OIDC decoder blocks the same five in a pasted
// document (src/lib/tools/oidc/share.ts); since 01/11/2026 both read the one
// list in src/lib/share/credential-members.ts, a leaf module that loads no
// token decoder.
// Every other secret-looking name ("password", "apiKey") stays a "maybe": the
// popover names its line and the link is offered.
// ============================================================================

import { findShareSecrets, type ShareSecretFinding, type ShareSecretReport } from "../../share/text-secrets"; // the shared check
import { CREDENTIAL_MEMBERS as SHARED_CREDENTIAL_MEMBERS } from "../../share/credential-members"; // the five names

/** Member and key names a standard defines as holding a credential: the shared list (src/lib/share/credential-members.ts). */
export const CREDENTIAL_MEMBERS: ReadonlySet<string> = SHARED_CREDENTIAL_MEMBERS; // re-exported under the name this module's readers use

/**
 * The bare name of a json-member or yaml-mapping finding, from its label ("name" in quotes, or name: for YAML).
 * @param f the finding
 * @returns the name, or null for a finding of another rule
 */
function memberName(f: ShareSecretFinding): string | null {
  if (f.rule === "json-member") return f.label.replace(/^"|"$/g, ""); // "access_token" -> access_token
  if (f.rule === "yaml-mapping") return f.label.replace(/:$/, ""); // access_token: -> access_token
  return null; // another rule
} // memberName

/**
 * The shared check, with the five credential members promoted from "maybe" to "secret".
 * @param text the box as pasted (JSON, YAML, or anything else)
 * @returns the report (secrets and maybe-secrets in reading order, or skipped over the link bound)
 */
export function checkStructuredText(text: string): ShareSecretReport {
  const r = findShareSecrets(text); // the shared check
  const promoted = r.maybe.filter((f) => CREDENTIAL_MEMBERS.has(memberName(f) ?? "")); // the members a standard names
  if (promoted.length === 0) return r; // nothing to move
  const secrets = [...r.secrets, ...promoted.map((f) => ({ ...f, kind: "secret" as const }))].sort((a, b) => a.start - b.start); // in reading order
  return { secrets, maybe: r.maybe.filter((f) => !promoted.includes(f)), skipped: r.skipped }; // moved
} // checkStructuredText
