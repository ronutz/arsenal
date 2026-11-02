// ============================================================================
// src/lib/tools/exos-config-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the ExtremeXOS (Switch Engine) config explainer.
// Posture "derived", raised on 2026-11-01 from the inventory's "input": the
// manifest keeps shareSafetyDefault "fragment" ("a switch config carries
// internal IPs / hostnames / port labels"), and a saved EXOS configuration
// carries credentials in plain sight, each defined in Extreme's Switch Engine
// v33.7.1 Command References (documentation.extremenetworks.com, read
// 2026-11-01, the newest edition published; 33.8.1 answers 404):
//   - create account [admin | user | lawful-intercept] account-name {encrypted
//     encrypted_password | password}: the account's password; the encrypted form
//     is what show configuration prints, and the switch "will de-crypt the
//     hashed password into the plain text password" when it is pasted into
//     another switch, so it is a credential too; configure account [all | name]
//     encrypted e-password, the same;
//   - configure snmp add community [readonly | readwrite] {encrypted
//     enc_community_name | community name | hex hex_community_name}: community
//     strings "provide a simple method of authentication between a switch and a
//     remote network manager"; configure snmpv3 add community ... name
//     community_name, the same; configure snmpv3 add user ... authentication
//     [md5 | sha] auth_password ... privacy ... priv_password ("Authentication
//     Password", "Privacy Password", or their localized-key and hex forms);
//   - configure radius ... shared-secret {encrypted} secret and configure tacacs
//     ... shared-secret {encrypted} secret ("The secret must be the same between
//     the client switch and the TACACS+ server"; "The encrypted keyword is
//     primarily for the output of the show configuration command");
//   - configure bgp neighbor ... password [none | {encrypted} tcpPassword] and
//     configure msdp peer ... password: TCP MD5 passwords;
//   - configure ospf ... authentication [simple-password ... | md5 md5-key-id
//     md5-key]; configure ospfv3 ... authentication ipsec ... key [key-string |
//     encrypted ...]; configure isis ... area-password, domain-password and
//     password [encrypted simple ... | simple password];
//   - configure mlag peer ... authentication md5 key {encrypted} auth_key;
//     create ntp key keyid [md5 | sha256] {encrypted} key_string; configure
//     keychain ... add key ... key-string [text_string | encrypted ...];
//     configure / create macsec connectivity-association ... cak: "a long-lived
//     secret key"; create netlogin local-user user-name {encrypted} password;
//     configure ldap ... bind-user user_name {encrypted encrypted_password};
//   - configure ssh2 key pregenerated <pre-generated key>: the SSH2 private host
//     key, pasted "from the saved configuration file" as colon-separated hex
//     ("a part of the key pattern is similar to 2d:2d:2d:2d:20:42:45:47:").
// The explainer shows each line as written and its summary, never a reading
// that depends on a secret's value, so replacing each value with the one word
// [redacted] keeps the reading: the same lines, categories, VLANs and notes.
//
// The link carries `input`: that copy. The popover counts the values replaced
// and keeps a caution line (the copy still names addresses, VLANs, ports and
// hosts). After the copy, the site's check (src/lib/share/text-secrets.ts) runs
// on it for secrets by their format (a PEM private key, a JWT, a password in a
// URL, Authorization credentials, an AWS access key ID): one left means no
// link, naming its line.
//
// THE REVEAL SWITCH (ANVIL, 01/11/2026): offered beside a copy that replaced
// something, never in place of a blocked link and never when the copy replaced
// a private key. A lab or class configuration with "public" and "private"
// communities is a reasonable thing to send on purpose; ticked, the link
// carries the configuration as pasted, with its own caution.
// Arrival: the text fills the box as a paste would; nothing touches a switch.
// ============================================================================

import { findShareSecrets } from "../../share/text-secrets"; // the site's text secrets check, reused as is
import { isReportableValue } from "../code-to-image/secrets"; // the site's rule for placeholders and references
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The word a replaced value becomes: one EXOS token, and a placeholder the site's checks never report. */
export const EXOS_REDACTED = "[redacted]"; // as the tmsh explainers' copy

/** The state the link carries and an arrival restores: the box. */
export interface ExosShareState {
  /** The configuration (as pasted when encoding; the copy after an arrival). */
  input: string;
}

/** What making the copy gave. */
export type ExosCopy =
  | { ok: true; copy: string; replaced: number; privateKey: boolean } // the copy, how many values it replaced, and whether one was a private key
  | { ok: false; code: "secret"; line: number; label: string }; // a secret the rules could not place

/** One token of a line: its text, where it starts and ends, and where its value starts and ends (inside quotes). */
interface Tok {
  /** The token, lower-cased, without quotes (for keyword comparison). */
  low: string;
  /** Where its value starts in the line (after an opening quote). */
  vs: number;
  /** Where its value ends (before a closing quote). */
  ve: number;
}

/**
 * Split an EXOS line into tokens: runs of non-blanks, a double-quoted string being one token.
 * @param line the line
 * @returns the tokens with their value spans
 */
function tokens(line: string): Tok[] {
  const out: Tok[] = []; // the tokens
  let i = 0; // the position
  while (i < line.length) { // each token
    while (i < line.length && (line[i] === " " || line[i] === "\t")) i++; // skip blanks
    if (i >= line.length) break; // the end
    if (line[i] === "\"") { // a quoted string
      const close = line.indexOf("\"", i + 1); // its closing quote
      const end = close < 0 ? line.length : close; // or the line's end
      out.push({ low: line.slice(i + 1, end).toLowerCase(), vs: i + 1, ve: end }); // inside the quotes
      i = close < 0 ? line.length : close + 1; // past it
    } else { // a bare token
      const s = i; // its start
      while (i < line.length && line[i] !== " " && line[i] !== "\t") i++; // to the next blank
      out.push({ low: line.slice(s, i).toLowerCase(), vs: s, ve: i }); // the token
    } // kinds
  } // tokens
  return out; // done
} // tokens

/** Keywords that never are a secret's value (what follows a secret keyword when no value does). */
const NOT_A_VALUE = new Set(["none", "encrypted", "hex", "localized-key", "store-encrypted", "vr", "user", "tag", "volatile", "privacy", "authenticate-snp", "level", "active-lifetime", "vlan-vsa", "security-profile", "simple", "simple-password", "md5", "sha", "sha256", "key", "name"]); // compared lower-cased

/** A line of colon-separated hex octets (how a pregenerated SSH2 key is pasted). */
const HEX_LINE = /^[ \t]*[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){7,}:?[ \t]*\r?$/; // at least eight octets, anchored, linear

/**
 * Whether a colon-hex line spells the start of a PEM private key ("-----BEGIN ... PRIVATE KEY").
 * @param line the line
 * @returns true when its octets decode to such a boundary
 */
function hexStartsPrivateKey(line: string): boolean {
  const text = line.trim().split(":").filter((h) => h !== "").map((h) => String.fromCharCode(parseInt(h, 16))).join(""); // the octets as Latin-1
  return /-----BEGIN [A-Z0-9 ]*PRIVATE KEY/.test(text); // RFC 7468's label, as the site's check reads it
} // hexStartsPrivateKey

/**
 * The spans of one line's secret values, by Extreme's command grammar (see the header).
 * @param line the line
 * @returns [start, end) spans inside the line, each a value to replace; "pregenerated" when the line opens a key
 */
function lineSecrets(line: string): { spans: [number, number][]; opensKey: boolean } {
  const c = /^[ \t]*[#!][ \t]*/.exec(line); // a comment's mark (the explainer skips such lines)
  if (c) { // a comment: a commented-out command still travels in the link, prose does not need the rules
    if (!/^(create|configure|enable|disable|delete|unconfigure)\b/i.test(line.slice(c[0].length))) return { spans: [], opensKey: false }; // prose
    const r = lineSecrets(line.slice(c[0].length)); // the command after the mark
    return { spans: r.spans.map(([a, b]) => [a + c[0].length, b + c[0].length] as [number, number]), opensKey: r.opensKey }; // placed back in the line
  } // comment
  const t = tokens(line); // the tokens
  const spans: [number, number][] = []; // the values
  if (t.length < 2) return { spans, opensKey: false }; // not a command
  const obj = t[1].low; // the object after the verb
  /** Replace token j when it is a value (not a keyword or placeholder); returns whether it did. */
  const take = (j: number): boolean => {
    const k = t[j]; // the token
    if (!k || NOT_A_VALUE.has(k.low) || !isReportableValue(line.slice(k.vs, k.ve)) || line.slice(k.vs, k.ve) === EXOS_REDACTED) return false; // nothing to replace
    if (!spans.some(([a]) => a === k.vs)) spans.push([k.vs, k.ve]); // once, however many rules name it
    return true; // replaced
  }; // take
  /** The value after keyword i, skipping the forms' qualifiers (encrypted, hex, localized-key). */
  const valueAfter = (i: number): void => {
    let j = i + 1; // the next token
    while (t[j] && (t[j].low === "encrypted" || t[j].low === "hex" || t[j].low === "localized-key")) j++; // qualifiers
    take(j); // the value
  }; // valueAfter
  // create account <level> <name> [<password> | encrypted <password>]; create netlogin local-user <name> [encrypted] <password>
  if (t[0].low === "create" && obj === "account") valueAfter(3); // after the account name
  if (t[0].low === "create" && obj === "netlogin" && t[2]?.low === "local-user") valueAfter(3); // after the user name
  // configure ssh2 key pregenerated <key ...>: the rest of the line, and the colon-hex lines that follow
  if (obj === "ssh2" && t[2]?.low === "key" && t[3]?.low === "pregenerated") { if (t[4]) spans.push([t[4].vs, t[t.length - 1].ve]); return { spans, opensKey: true }; } // the key, however long
  for (let i = 2; i < t.length; i++) { // the keywords
    const w = t[i].low; // this one
    if (w === "encrypted" && !["simple", "simple-password", "md5", "name", "hex"].includes(t[i + 1]?.low ?? "")) take(i + 1); // a value written in its encrypted form (show configuration's)
    else if (w === "shared-secret" || w === "key-string" || w === "cak" || w === "area-password" || w === "domain-password" || w === "simple-password") valueAfter(i); // RADIUS, TACACS+, keychains, MACsec, IS-IS, OSPF
    else if (w === "password" && t[i + 1]?.low !== "simple") valueAfter(i); // BGP and MSDP TCP MD5, IS-IS (none is kept)
    else if (w === "simple" && obj === "isis") valueAfter(i); // IS-IS simple passwords
    else if (w === "md5" && obj === "ospf") take(i + 2); // OSPF: md5 <key-id> <key>
    else if ((w === "md5" || w === "sha" || w === "sha256") && (obj === "ntp" || obj === "snmpv3")) valueAfter(i); // NTP keys, SNMPv3 authentication passwords
    else if (w === "key" && (obj === "mlag" || obj === "ospfv3")) valueAfter(i); // MLAG checkpoint keys, OSPFv3 IPsec keys
    else if (w === "privacy" && obj === "snmpv3") { let j = i + 1; if (["des", "aes"].includes(t[j]?.low ?? "")) j++; if (/^(128|192|256)(-legacy)?$/.test(t[j]?.low ?? "")) j++; valueAfter(j - 1); } // SNMPv3 privacy passwords
    else if (w === "community" && (obj === "snmp" || obj === "snmpv3")) { // community strings
      let j = i + 1; // after "community"
      if (t[j]?.low === "readonly" || t[j]?.low === "readwrite") j++; // SNMPv1/v2c access
      valueAfter(j - 1); // the community (or, for snmpv3, its index, often the same word)
    } else if (w === "name" && obj === "snmpv3" && t.some((k) => k.low === "community")) valueAfter(i); // the SNMPv3 community name
  } // keywords
  return { spans, opensKey: false }; // done
} // lineSecrets

/**
 * The shareable copy of an EXOS configuration.
 * @param raw the configuration as pasted
 * @returns the copy with each secret value as [redacted], the count, and whether a private key went; or why there is no link
 */
export function exosShareCopy(raw: string): ExosCopy {
  const lines = raw.split("\n"); // by line (a CR before the LF stays in the line, as written)
  let replaced = 0, privateKey = false; // how many values went, and whether one was a private key
  let inKey = false, keyCounted = false; // inside a pregenerated key's hex lines, and whether that key is counted yet
  const out = lines.map((line) => { // each line
    const cr = line.endsWith("\r") ? "\r" : ""; // a CR LF line end, kept as written
    const bare = cr ? line.slice(0, -1) : line; // the line without it
    if (HEX_LINE.test(line) && (inKey || hexStartsPrivateKey(line))) { // a key's hex line (after "pregenerated", or one that spells a private key's start)
      if (!inKey || !keyCounted) { replaced++; keyCounted = true; } // the key counts as one value
      inKey = true; privateKey = true; // the key goes on
      return bare.slice(0, bare.length - bare.trimStart().length) + EXOS_REDACTED + cr; // replaced whole, indentation kept
    } // hex line
    inKey = false; keyCounted = false; // any other line ends a key
    const { spans, opensKey } = lineSecrets(bare); // this line's values
    if (opensKey) { inKey = true; keyCounted = spans.length > 0; if (keyCounted) { replaced++; privateKey = true; } } // the key on this line, or on the hex lines that follow
    else replaced += spans.length; // one per value
    let s = bare; // the line
    for (const [x, y] of [...spans].sort((m, n) => n[0] - m[0])) s = s.slice(0, x) + EXOS_REDACTED + s.slice(y); // right to left, so offsets hold
    return s + cr; // the copy's line
  }); // lines
  const copy = out.join("\n"); // the copy
  const left = findShareSecrets(copy).secrets[0]; // the site's check on the copy
  if (left) return { ok: false, code: "secret", line: left.line, label: left.label }; // a secret the rules could not place
  return { ok: true, copy, replaced, privateKey }; // the copy
} // exosShareCopy

/**
 * The encoding of a configuration the page reads.
 * @param input the box as pasted
 * @param c its copy (the page makes it once, for the button, the count and the reveal switch)
 * @returns nothing (blank), blocked, or the copy
 */
export function encodeExosShare(input: string, c: ExosCopy): ShareEncoding {
  if (input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the page shows the verb reference
  if (!c.ok) return { ok: false, reason: "blocked", code: "secret", values: { line: c.line, label: c.label } }; // no link, and why
  return { ok: true, params: { input: c.copy } }; // the copy
} // encodeExosShare

/**
 * The reveal switch's encoding: the configuration as pasted, only beside a copy that replaced something and no key.
 * @param input the box as pasted
 * @param c its copy
 * @returns the configuration as pasted, or nothing (no switch)
 */
export function encodeExosRevealed(input: string, c: ExosCopy): ShareEncoding {
  if (input.trim() === "" || !c.ok || c.replaced === 0 || c.privateKey) return { ok: false, reason: "empty" }; // no switch
  return { ok: true, params: { input } }; // as pasted, by the reader's choice
} // encodeExosRevealed

/** The spec. */
export const EXOS_SHARE: ShareSpec<ExosShareState> = Object.freeze({
  tool: "exos-config-explainer", // the slug
  posture: "derived", // a copy with every secret value replaced, never the configuration as pasted
  carriesKey: "share.carries", // tools.exos-config-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked. */
  encode(s: ExosShareState): ShareEncoding {
    return encodeExosShare(s.input, exosShareCopy(s.input)); // copied, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste (the copy, or the configuration as pasted by the reveal switch). */
  decode(v: Readonly<Record<string, string | null>>): ExosShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});

/** The spec of the reveal switch: the configuration as pasted (posture input-caution: the reader ticked it, the popover cautions). */
export const EXOS_SHARE_REVEALED: ShareSpec<ExosShareState> = Object.freeze({
  tool: "exos-config-explainer", // the slug
  posture: "input-caution", // as pasted, by the reader's explicit choice, with its own caution
  carriesKey: "share.carriesRevealed", // tools.exos-config-explainer.share.carriesRevealed
  names: ["input"], // #input=, as the copy: an arrival is the same paste either way
  /** The configuration as pasted, when the copy replaced something and no private key. */
  encode(s: ExosShareState): ShareEncoding {
    return encodeExosRevealed(s.input, exosShareCopy(s.input)); // the switch's rule
  },
  /** The same rule as the copy's: any non-blank text. */
  decode(v: Readonly<Record<string, string | null>>): ExosShareState | null {
    return EXOS_SHARE.decode(v); // one rule for both
  },
});
