// ============================================================================
// src/lib/tools/fortios-cli-config-explainer/fortios-secrets.ts
// ----------------------------------------------------------------------------
// THE FORTIOS SECRETS OF "SHARE RESULTS" (2026-11-01, wave 4A). The FortiGate
// and FortiOS tools of this site read configuration text, directive lines and
// command output; a link must never carry a credential written in them. This
// module holds the FortiOS rules, each from Fortinet's own documentation read
// on 2026-11-01:
//
//   password fields   the FortiOS 7.6.8 CLI reference gives every parameter a
//                     type; secrets have the types password, password-2,
//                     password-3 and password_aes256 (the syntax lines read
//                     "set psksecret {password-3}", "set password
//                     {password-2}" ...). FORTIOS_PASSWORD_FIELDS lists the
//                     fields so typed on the pages read: vpn ipsec phase1 and
//                     phase1-interface, system admin, system api-user, user
//                     local, user ldap, user radius, user tacacs+, system ha,
//                     system snmp user, vpn certificate local and certificate
//                     local, router bgp, router ospf, router key-chain,
//                     wireless-controller vap, system email-server and system
//                     sdn-connector.
//   private-key       vpn certificate local, certificate local and system
//                     sdn-connector: "PEM format key encrypted with a
//                     password" (type user); the PEM block itself is also a
//                     secret by RFC 7468 (the site's check finds it).
//   ENC values        "set <field> ENC <value>", the encrypted form FortiOS
//                     writes for those fields. Fortinet PSIRT FG-IR-19-007
//                     (CVE-2019-6693): a hard-coded key encrypts that data, so
//                     a configuration "willingly posted on a forum for
//                     troubleshooting purpose" can be decrypted to plaintext;
//                     the fix, private-data-encryption, is "disabled by
//                     default", and exposed ENC data "should currently be
//                     considered "easy to decrypt"". An ENC value is therefore
//                     treated as the secret it encrypts.
//   SNMP communities  "set name" inside config system snmp community (and the
//                     switch and wireless controllers' SNMP communities), the
//                     "Community name" (type string): RFC 1157 section 3.2.5
//                     makes a message authentic by the community it names, and
//                     RFC 3584 section 5.2.1 fails authentication when the
//                     community string matches no community, so the name is
//                     the credential.
//
// Two uses:
//   1. shareableFortios(): the COPY a derived link carries (the CLI config
//      explainer, the config diff explainer, the policy lookup explainer):
//      the value of every such setting, and of every setting whose name looks
//      like a secret by the site's own heuristic (isSecretName), becomes a
//      numbered mark "[redacted-N]". Equal values get the same number and
//      different values different numbers, so a reading that compares them (a
//      diff of two configurations) reads the same; the quotes and the ENC
//      word stay, every other character and line stays. A value that runs
//      past its line (an unclosed quote: a PEM key) cannot be replaced on its
//      line, and the copy reports it instead (the link is then blocked).
//   2. fortiosShareFindings(): extra findings for the shared text check
//      (src/lib/share/text-secrets.ts), so a box that goes as pasted (the
//      simulators' directive lines, a session list, a sniffer command) is
//      blocked on a FortiOS credential: a set line of a password field or a
//      community, and a "field=value" pair of a password field (a
//      directive line such as "phase1: ... psksecret=...").
// A finding never holds the value: its label is the setting's name.
// ============================================================================

import { isReportableValue, isSecretName } from "../code-to-image/secrets"; // the site's name heuristic and placeholder rule, reused as is
import { encodeCheckedBox, findShareSecrets, lineAt, normaliseLines, type ShareSecretFinding, type ShareSecretReport } from "../../share/text-secrets"; // the shared text check
import type { ShareEncoding } from "../../share/spec"; // what a share spec's encode returns

/** The fields the FortiOS 7.6.8 CLI reference types password, password-2, password-3 or password_aes256 (read 2026-11-01). */
export const FORTIOS_PASSWORD_FIELDS: ReadonlySet<string> = new Set([
  "psksecret", // vpn ipsec phase1(-interface): pre-shared secret, password-3
  "psksecret-remote", // vpn ipsec phase1(-interface): remote side pre-shared secret, password-3
  "ppk-secret", // vpn ipsec phase1(-interface) and user local: IKEv2 postquantum preshared key, password-3
  "group-authentication-secret", // vpn ipsec phase1(-interface): IKEv2 ID group authentication, password-3
  "authpasswd", // vpn ipsec phase1(-interface): XAuth password, password
  "password", // system admin (password-2), user ldap, system ha, router bgp, system email-server, vpn certificate local, system sdn-connector (password_aes256)
  "passwd", // user local: the user's password, password
  "api-key", // system api-user (password-2), system sdn-connector (password)
  "secret", // user radius: pre-shared secret, password
  "secondary-secret", // user radius, password
  "tertiary-secret", // user radius, password
  "rsso-secret", // user radius: RADIUS accounting secret, password
  "key", // user tacacs+, system ha, wireless-controller vap (WEP), password
  "secondary-key", // user tacacs+, password
  "tertiary-key", // user tacacs+, password
  "auth-pwd", // system snmp user: authentication protocol password, password
  "priv-pwd", // system snmp user: privacy protocol password, password
  "scep-password", // vpn certificate local: SCEP challenge password, password
  "est-http-password", // vpn certificate local: EST HTTP password, password
  "est-srp-password", // vpn certificate local: EST SRP password, password
  "acme-eab-key-hmac", // vpn certificate local: ACME External Account Binding HMAC key, password
  "authentication-key", // router ospf: authentication key, password
  "key-string", // router ospf and router key-chain: the key, password
  "passphrase", // wireless-controller vap: WPA pre-shared key, password
  "sae-password", // wireless-controller vap: WPA3 SAE password, password
  "secret-key", // system sdn-connector: AWS / ACS secret access key, password
  "client-secret", // system sdn-connector: Azure client secret, password
  "vcenter-password", // system sdn-connector: vCenter password, password_aes256
]); // the list

/** Fields that hold a key block (type user: "PEM format key encrypted with a password"). */
export const FORTIOS_KEY_FIELDS: ReadonlySet<string> = new Set(["private-key"]); // vpn certificate local, certificate local, system sdn-connector

/**
 * The mark that replaces a secret value in a copy.
 * @param n the value's number (1 for the first distinct value)
 * @returns "[redacted-N]" (the site's checks read a value starting with "[" as a placeholder, so a copy of a copy is the copy)
 */
export function fortiosMark(n: number): string {
  return `[redacted-${n}]`; // numbered
} // fortiosMark

/** A set line: indentation, the verb, the field and the rest (the FortiOS CLI reads verbs in any case). */
const SET_LINE = /^([ \t]*)(set)([ \t]+)([A-Za-z0-9_.+-]{1,96})([ \t]+)(.*)$/i; // anchored, bounded field, greedy rest: linear

/**
 * Split trailing blanks off a string by hand (a regular expression anchored at the end would rescan a long run of
 * blanks from every position in it).
 * @param s the string
 * @returns the string without its trailing blanks, and those blanks
 */
function splitTrailing(s: string): [string, string] {
  let n = s.length; // from the end
  while (n > 0 && (s[n - 1] === " " || s[n - 1] === "\t")) n--; // back over blanks and tabs
  return [s.slice(0, n), s.slice(n)]; // the text, the blanks
} // splitTrailing
/** A config line: the path it opens. */
const CONFIG_LINE = /^[ \t]*config[ \t]+(.{1,256}?)[ \t]*$/i; // anchored, linear
/** An end line: closes the innermost config block. */
const END_LINE = /^[ \t]*end[ \t]*$/i; // anchored
/** A line that separates two configurations (the diff explainer's --- and BEFORE: / AFTER: labels): the context starts again. */
const SIDE_LINE = /^[ \t]*(?:-{3,}|before[ \t]*:?|after[ \t]*:?)[ \t]*$/i; // anchored
/** An encrypted value as FortiOS writes it: the ENC word, blanks, then the value. */
const ENC_VALUE = /^(ENC[ \t]+)(\S.*)$/; // anchored; FortiOS writes ENC in capitals
/** A field=value pair of a directive line (the IPsec analyzer's "phase1: ... psksecret=..."), the value up to a comma. */
const PAIR = /(^|[\s,:;])([A-Za-z][A-Za-z0-9_-]{0,63})[ \t]*=[ \t]*([^,\n]*)/g; // global, bounded name, linear

/**
 * Whether the innermost open config block holds SNMP communities, whose "set name" is the community.
 * @param stack the open config paths, outermost first
 * @returns true inside config system snmp community, switch-controller snmp-community, wireless-controller snmp / community
 */
function inCommunity(stack: readonly string[]): boolean {
  const top = (stack[stack.length - 1] ?? "").toLowerCase(); // the innermost path
  return /community$/.test(top) && stack.join(" ").toLowerCase().includes("snmp"); // a community table under SNMP
} // inCommunity

/** How a set line's field is treated. */
type FieldKind = "password" | "key" | "community" | "name-heuristic" | null;

/**
 * Classify a set line's field.
 * @param field the field as written
 * @param stack the open config paths
 * @returns why the value is secret, or null
 */
function fieldKind(field: string, stack: readonly string[]): FieldKind {
  const f = field.toLowerCase(); // FortiOS field names are lower-case; compare so
  if (FORTIOS_PASSWORD_FIELDS.has(f)) return "password"; // typed password in the CLI reference
  if (FORTIOS_KEY_FIELDS.has(f)) return "key"; // a key block
  if (f === "name" && inCommunity(stack)) return "community"; // an SNMP community name
  if (isSecretName(f)) return "name-heuristic"; // the site's heuristic (token, secret-token, sso-password ...)
  return null; // an ordinary setting
} // fieldKind

/** The value of a set line, located: where it starts and ends in the rest, and whether it runs past the line. */
interface ValueSpan {
  /** Offset of the value in the rest. */
  start: number;
  /** End of the value in the rest (exclusive). */
  end: number;
  /** True when a quote opens and does not close on this line (a multi-line value: a PEM block). */
  open: boolean;
  /** True when the value follows the ENC word. */
  enc: boolean;
} // ValueSpan

/**
 * Locate the value in the rest of a set line: after ENC, inside one pair of quotes, or the whole rest.
 * @param rest the rest of the line after the field and its blanks (trailing blanks already removed)
 * @returns the span
 */
function locateValue(rest: string): ValueSpan {
  const enc = ENC_VALUE.exec(rest); // an encrypted value?
  if (enc) return { start: enc[1].length, end: rest.length, open: false, enc: true }; // after "ENC "
  const q = rest[0]; // a quote?
  if (q === '"' || q === "'") { // a quoted value
    for (let i = 1; i < rest.length; i++) { // find the closing quote
      if (rest[i] === "\\") { i++; continue; } // an escaped character
      if (rest[i] === q) return i === rest.length - 1 ? { start: 1, end: i, open: false, enc: false } : { start: 0, end: rest.length, open: false, enc: false }; // one quoted value, or several words: the whole rest
    } // for
    return { start: 0, end: rest.length, open: true, enc: false }; // never closed on this line
  } // quoted
  return { start: 0, end: rest.length, open: false, enc: false }; // a bare value
} // locateValue

/** A label for a finding or a blocked message: the setting's name, never the value. */
function labelOf(kind: FieldKind, field: string): string {
  return kind === "community" ? "SNMP community" : `set ${field}`; // what the popover names
} // labelOf

/** What the copy of a text came to. */
export interface FortiosCopy {
  /** The copy (every line as pasted but the replaced values). */
  copy: string;
  /** How many values were replaced. */
  replaced: number;
  /** A secret value that runs past its line and could not be replaced (its 1-based line and label), or null. */
  stuck: { line: number; label: string } | null;
} // FortiosCopy

/**
 * The copy a derived link carries: every FortiOS secret value replaced by a numbered mark (see the header).
 * @param text the box as pasted (any line ends; they are kept)
 * @returns the copy, how many values it replaced, and the first value it could not replace
 */
export function shareableFortios(text: string): FortiosCopy {
  const parts = text.split(/(\r\n|\r|\n)/); // lines and their ends, alternating
  const numbers = new Map<string, number>(); // each distinct value's number
  const stack: string[] = []; // the open config paths
  let replaced = 0; // values replaced
  let stuck: { line: number; label: string } | null = null; // the first value that could not be replaced
  for (let i = 0; i < parts.length; i += 2) { // each line (the ends sit at odd indices)
    const line = parts[i]; // the line
    if (SIDE_LINE.test(line)) { stack.length = 0; continue; } // a new configuration starts
    const cfg = CONFIG_LINE.exec(line); // a config block opens?
    if (cfg) { stack.push(cfg[1]); continue; } // remember its path
    if (END_LINE.test(line)) { stack.pop(); continue; } // the innermost block closes
    const m = SET_LINE.exec(line); // a set line?
    if (!m) continue; // nothing to replace here
    const [rest, tail] = splitTrailing(m[6]); // the value part, and its trailing blanks
    const kind = fieldKind(m[4], stack); // why its value may be secret
    const span = locateValue(rest); // where the value is
    if (kind === null && !span.enc) continue; // an ordinary setting with a plain value
    if (span.open) { if (!stuck) stuck = { line: i / 2 + 1, label: labelOf(kind, m[4]) }; continue; } // a multi-line value: cannot be replaced on this line
    const value = rest.slice(span.start, span.end); // the value
    if (!isReportableValue(value)) continue; // none, empty, a placeholder or an earlier mark
    const key = `${span.enc ? "ENC " : ""}${value}`; // equal values share a number (an ENC value and a plain one never do)
    if (!numbers.has(key)) numbers.set(key, numbers.size + 1); // a new value
    parts[i] = `${m[1]}${m[2]}${m[3]}${m[4]}${m[5]}${rest.slice(0, span.start)}${fortiosMark(numbers.get(key) as number)}${rest.slice(span.end)}${tail}`; // the line with its value replaced
    replaced++; // counted
  } // for
  return { copy: parts.join(""), replaced, stuck }; // done
} // shareableFortios

/**
 * Extra findings for the shared text check: FortiOS credentials in set lines and in field=value pairs.
 * @param norm the text with line feeds only (as the shared check hands it)
 * @returns secret findings, each with its line and a label naming the setting
 */
export function fortiosShareFindings(norm: string): ShareSecretFinding[] {
  const out: ShareSecretFinding[] = []; // the findings
  const stack: string[] = []; // the open config paths
  let offset = 0; // where the current line starts
  for (const line of norm.split("\n")) { // each line
    const base = offset; // this line's start
    offset += line.length + 1; // the next line's start
    if (SIDE_LINE.test(line)) { stack.length = 0; continue; } // a new configuration starts
    const cfg = CONFIG_LINE.exec(line); // a config block opens?
    if (cfg) { stack.push(cfg[1]); continue; } // remember its path
    if (END_LINE.test(line)) { stack.pop(); continue; } // the innermost block closes
    const m = SET_LINE.exec(line); // a set line?
    if (m) { // the set rule
      const kind = fieldKind(m[4], stack); // why its value may be secret
      if (kind === "password" || kind === "key" || kind === "community") { // a FortiOS credential by its documented type (the heuristic stays a maybe)
        const [rest] = splitTrailing(m[6]); // the value part without trailing blanks
        const span = locateValue(rest); // the value
        const value = rest.slice(span.start, span.end); // as written
        if (span.open || isReportableValue(value)) { // a value, or a multi-line one
          const start = base + m[1].length + m[2].length + m[3].length + m[4].length + m[5].length + span.start; // where the value starts
          out.push({ rule: "set-secret", kind: "secret", line: lineAt(norm, start), label: labelOf(kind, m[4]), start, end: start + (span.end - span.start) }); // no link may carry it
        } // if
      } // if
      continue; // a set line holds no directive pairs
    } // set line
    PAIR.lastIndex = 0; // the pair rule
    let p: RegExpExecArray | null; // the current pair
    while ((p = PAIR.exec(line))) { // each field=value
      const field = p[2].toLowerCase(); // the field
      if (!FORTIOS_PASSWORD_FIELDS.has(field) && !FORTIOS_KEY_FIELDS.has(field)) continue; // not a FortiOS password field
      const value = p[3].trim(); // the value up to a comma
      if (!isReportableValue(value)) continue; // a placeholder
      const start = base + p.index + p[0].length - p[3].length + (p[3].length - p[3].trimStart().length); // where it starts
      out.push({ rule: "secret-name", kind: "secret", line: lineAt(norm, start), label: `${p[2]}=`, start, end: start + value.length }); // no link may carry it
    } // while
  } // for
  return out; // in reading order
} // fortiosShareFindings

/**
 * The shared text check with the FortiOS rules added. One adjustment: the site's fortios-enc rule reports any word
 * after ENC, so it would report a copy's own mark ("set psksecret ENC [redacted-1]"); an ENC finding whose value is
 * a placeholder by the site's own rule (a mark starts with "[") is dropped, so a copy keeps the ENC word and still
 * passes the check.
 * @param text the box (any line ends)
 * @returns the secrets and maybe-secrets, or skipped when the text is over the link bound
 */
export function checkFortiosText(text: string): ShareSecretReport {
  const r = findShareSecrets(text, fortiosShareFindings); // the site's rules, the shared header rules, and FortiOS's
  if (!r.secrets.some((f) => f.rule === "fortios-enc")) return r; // nothing to adjust
  const norm = normaliseLines(text); // the offsets refer to this text (escapes are read as blanks of the same length)
  return { ...r, secrets: r.secrets.filter((f) => f.rule !== "fortios-enc" || isReportableValue(norm.slice(f.start, f.end))) }; // a mark after ENC is no secret
} // checkFortiosText

/** What a derived share of a FortiOS text comes to: the copy and its check, or the value that blocks it. */
export type FortiosShareCopy =
  | { ok: true; copy: string; replaced: number; report: ShareSecretReport } // the copy, how many values it replaced, the check on it
  | { ok: false; line: number; label: string }; // a secret value that could not be replaced (its line and label)

/**
 * Make and check the copy of a FortiOS text (a page calls this once per change, for the button and its popover).
 * @param text the box as pasted
 * @returns the copy and its check, or the value that blocks a link
 */
export function fortiosShareCopy(text: string): FortiosShareCopy {
  const c = shareableFortios(text); // the copy
  if (c.stuck) return { ok: false, line: c.stuck.line, label: c.stuck.label }; // a multi-line secret: no copy
  return { ok: true, copy: c.copy, replaced: c.replaced, report: checkFortiosText(c.copy) }; // checked
} // fortiosShareCopy

/**
 * The encoding of a copy the page already made.
 * @param c the copy and its check, or null while the page has nothing to share
 * @returns the copy, nothing, or blocked (code "secret", with the line, label and how many more places)
 */
export function encodeFortiosCopy(c: FortiosShareCopy | null): ShareEncoding {
  if (!c) return { ok: false, reason: "empty" }; // nothing to share
  if (!c.ok) return { ok: false, reason: "blocked", code: "secret", values: { field: "input", line: c.line, label: c.label, more: 0 } }; // a value that could not be replaced
  const s = c.report.secrets; // credentials still in the copy (a PEM key, a JWT, an Authorization line ...)
  if (s.length > 0) return { ok: false, reason: "blocked", code: "secret", values: { field: "input", line: s[0].line, label: s[0].label, more: new Set(s.map((f) => f.line)).size - 1 } }; // no link
  return { ok: true, params: { input: c.copy } }; // the copy
} // encodeFortiosCopy

/**
 * Whether an arriving text is one a derived link could carry: nothing left to replace, and no credential.
 * @param text the arriving text
 * @returns true for a copy the encoder could have built
 */
export function isFortiosCopy(text: string): boolean {
  const c = shareableFortios(text); // would anything be replaced?
  return c.replaced === 0 && c.stuck === null && checkFortiosText(text).secrets.length === 0; // a copy holds no secret
} // isFortiosCopy

/**
 * The encoding of a FortiOS box that goes as pasted after the check (directive lines, a session list, a command).
 * @param input the box as pasted
 * @param report the check's report on the box (from checkFortiosText), or null while the page has no reading to share
 * @returns nothing (no reading, or a blank box), blocked (code "secret", the first place and how many more), or the box
 */
export function encodeFortiosBox(input: string, report: ShareSecretReport | null): ShareEncoding {
  if (!report) return { ok: false, reason: "empty" }; // no reading yet: the button is disabled
  return encodeCheckedBox(input, report); // blocked by a credential, or the box as pasted
} // encodeFortiosBox

/**
 * Whether an arriving box is one a checked link could carry: not blank, and no credential (the encoder never builds
 * a link holding one, so an arrival holding one is malformed and ignored).
 * @param text the arriving value, or null when absent
 * @returns true for a box the encoder could have sent
 */
export function isSendableFortiosBox(text: string | null): text is string {
  return text !== null && text.trim() !== "" && checkFortiosText(text).secrets.length === 0; // not blank, no credential
} // isSendableFortiosBox
