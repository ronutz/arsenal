// ============================================================================
// src/lib/tools/f5-gslb-decision-flow/tmsh-secrets.ts
// ----------------------------------------------------------------------------
// THE SECRET GUARD FOR PASTED tmsh TEXT (Share results, 2026-10-27). Four
// explainers of the GTM, AFM and DoS family read tmsh stanzas (the GSLB
// decision flow, the topology scorer, the AFM context walk and the DoS-vector
// explainer) and skip every stanza they do not explain. A reader who pastes a
// whole bigip_gtm.conf or bigip.conf therefore gets a reading, and a link of
// the paste as typed would carry everything else in it, a monitor's password
// included: the tmsh reference for gtm monitor http (read 2026-10-27) lists
// "password [none | [password] ]" ("the password if the monitored target
// requires authentication") beside the free-text send string, which can hold
// an HTTP Authorization header (RFC 9110 section 11.6.2: its value "consists
// of credentials"). None of the four pages shows those values, and cutting
// them out of tmsh text safely would need the whole tmsh grammar, so the four
// tools offer no link while the paste holds one: the popover names the
// setting, the reader removes it and presses again.
//
// What counts: a tmsh attribute named password, passphrase or secret, or a
// hyphenated name ending in one of them (encrypted-password, auth-password,
// privacy-password, proxy-ca-passphrase, shared-secret...), plus bind-pw (an
// LDAP bind password) and community-name (an SNMP community string), when it
// is followed by a value other than none; and an Authorization header
// anywhere in the text. Linear: one tokenising pass and one bounded search.
// ============================================================================

/** An attribute name whose value is a secret: password, passphrase, secret, or a hyphenated name ending in one. */
const SECRET_NAME_RE = /^(?:[a-z0-9]+-)*(?:password|passphrase|secret)$/; // the hyphenated segments cannot overlap: linear

/** Secret attributes whose names do not end in password, passphrase or secret. */
const SECRET_NAMES = new Set(["bind-pw", "community-name"]); // tmsh auth ldap bind-pw; sys snmp community-name

/** One tmsh token: a quoted string (to the closing quote or the line end), a bare word, or a brace. */
const TOKEN_RE = /"(?:[^"\\\n]|\\.)*"?|[^\s{}"]+|[{}]/g; // alternatives start with distinct characters: linear

/** An HTTP Authorization header with a value (inside a monitor's send string, say). */
const AUTH_HEADER_RE = /authorization:[ \t]*[A-Za-z0-9]/i; // no word boundary before it: in tmsh text it follows a literal \r\n

/**
 * The first secret a pasted tmsh text holds, by the name of its setting.
 * @param text the paste, as typed
 * @returns the setting's name ("password", "proxy-ca-passphrase", "Authorization"...), or null when there is none
 */
export function findTmshSecret(text: string): string | null {
  const tokens = text.match(TOKEN_RE) ?? []; // the text as tmsh tokens
  for (let i = 0; i + 1 < tokens.length; i++) { // each token that has a next one
    const name = tokens[i]; // a candidate attribute name
    if (!SECRET_NAME_RE.test(name) && !SECRET_NAMES.has(name)) continue; // not a secret's name
    const value = tokens[i + 1]; // what follows it
    if (value === "{" || value === "}" || value === "none" || value === "\"\"") continue; // a block, the end, or no value set
    return name; // a secret value follows
  } // tokens
  return AUTH_HEADER_RE.test(text) ? "Authorization" : null; // a header with credentials, or nothing
} // findTmshSecret
