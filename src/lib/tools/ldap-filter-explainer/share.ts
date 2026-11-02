// ============================================================================
// src/lib/tools/ldap-filter-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the LDAP filter explainer (posture
// "input-caution", raised from "input" on 2026-10-27). The manifest says
// "filters may contain internal attribute names", and a filter's values name
// users, mail domains and groups, whose distinguished names spell out the
// directory's structure; ROLLOUT section 11.2 raises a tool whose input names
// users and internal names to a caution line. A link carries the filter as
// typed, and a filter the page cannot parse too: its anchored error is the
// reading the sender wants to show.
//
// One blocked case ("password"): a filter that asserts a value of a password
// attribute, which would put the password (or a part of it) in the link:
// userPassword (RFC 4519 section 2.41, OID 2.5.4.35: "octet strings that are
// known only to the user and the system"; its EQUALITY rule makes such a
// filter valid), authPassword (RFC 3112, OID 1.3.6.1.4.1.4203.1.3.4) and
// Active Directory's unicodePwd (Microsoft's AD schema, attribute ID
// 1.2.840.113556.1.4.90). Attribute descriptions are compared without case
// and without options (RFC 4512 section 2.5: descriptions are case-insensitive,
// options follow a ";"), by name or by OID. A presence test, "(userPassword=*)",
// carries no value and goes. The check reads the text, not the parsed tree, so
// it also covers a filter the page cannot parse.
//
// Arrival: the filter fills the box and the page explains it, as for a paste;
// nothing is sent to a directory. An empty value, or a filter asserting a
// password, is malformed: ignored, and stripped from the address either way.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** Password attributes by lower-cased name and by OID (RFC 4519 2.41, RFC 3112, Microsoft's unicodePwd). */
export const LDAP_PASSWORD_ATTRIBUTES: ReadonlySet<string> = new Set([
  "userpassword", // RFC 4519 section 2.41
  "2.5.4.35", // its OID
  "authpassword", // RFC 3112
  "1.3.6.1.4.1.4203.1.3.4", // its OID
  "unicodepwd", // Active Directory (Microsoft AD schema, Unicode-Pwd)
  "1.2.840.113556.1.4.90", // its attribute ID
]);

/** Characters that end an attribute description in a filter item (RFC 4515 section 3: =, ~=, >=, <=, :=, and the parentheses). */
const DESC_END = "=~<>:()"; // a description never holds them

/**
 * The attribute description of the first item that asserts a value of a password attribute.
 * Items start right after "(" (RFC 4515 section 3) or at the very start of the text (a bare item); each scan stops at
 * the next delimiter, at the latest the next "(", so the whole text is read in linear time.
 * @param text the filter as typed
 * @returns the description as written (for the message), or null when there is none
 */
export function findPasswordAssertion(text: string): string | null {
  for (let i = 0; i < text.length; i++) { // each possible item start
    if (i > 0 && text[i - 1] !== "(") continue; // only after "(" or at the start
    let j = i; // the end of the description
    while (j < text.length && !DESC_END.includes(text[j])) j++; // read it
    if (j >= text.length || j === i) continue; // no operator follows, or no description
    const desc = text.slice(i, j).trim(); // the description as written
    if (!LDAP_PASSWORD_ATTRIBUTES.has(desc.split(";")[0].toLowerCase())) continue; // not a password attribute
    const op = text[j]; // what follows it
    if (op === "(" || op === ")") continue; // not an item
    if (op === "=" && text[j + 1] === "*" && (j + 2 >= text.length || text[j + 2] === ")")) continue; // a presence test: no value
    return desc; // a value is asserted
  } // starts
  return null; // none
} // findPasswordAssertion

/** What the page encodes and an arrival restores. */
export interface LdapShareState {
  /** The filter as typed. */
  input: string;
}

/** The spec. */
export const LDAP_FILTER_SHARE: ShareSpec<LdapShareState> = Object.freeze({
  tool: "ldap-filter-explainer", // the slug
  posture: "input-caution", // the filter as typed, with a caution
  carriesKey: "share.carries", // tools.ldap-filter-explainer.share.carries
  names: ["input"], // #input=<filter>
  /** The filter as typed, parsed or not; blocked when it asserts a password. */
  encode(s: LdapShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing explained
    const attr = findPasswordAssertion(s.input); // a password in it?
    if (attr !== null) return { ok: false, reason: "blocked", code: "password", values: { attribute: attr } } as const; // never in a link
    return { ok: true, params: { input: s.input } } as const; // as typed
  },
  /** Any non-blank filter, as a paste, except one asserting a password. */
  decode(v: Readonly<Record<string, string | null>>): LdapShareState | null {
    const input = v.input; // the filter
    if (!input || input.trim() === "" || findPasswordAssertion(input) !== null) return null; // never a password
    return { input }; // the state to fill
  },
});
