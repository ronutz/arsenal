// ============================================================================
// src/lib/tcl84/irule-secrets.ts
// ----------------------------------------------------------------------------
// THE iRULE SECRETS CHECK FOR "SHARE RESULTS" (2026-10-27). Before a link may
// carry an iRule, a Tcl script or a box of set commands, the text is searched
// for values a link must not carry. A finding is one of two kinds:
//
//   secret  a value in a place a standard or F5's own reference defines as a
//           key or a credential. No link is offered while one is there; the
//           popover names its line, and the reader puts a placeholder in its
//           place (the reading of the rest stays the reader's to check: an
//           automatic replacement inside Tcl code could change what the page
//           reads, line lengths and substitutions included).
//           From the site's secrets check (src/lib/tools/code-to-image/
//           secrets.ts), reused as is: a PEM private key, Authorization
//           credentials written as a header line ("Authorization: Basic ..."),
//           an AWS access key ID, a JWS or JWE, a password in a URL, a FortiOS
//           ENC value. And the iRule places, each read on clouddocs.f5.com on
//           2026-10-27:
//             aes-key-literal       "AES 128|192|256 <hex>", the string form of
//                                   an AES key (AES::key: "You can replace the
//                                   functionality of AES::key by specifying a key
//                                   as a properly formatted string"; AES::encrypt's
//                                   example key "AES 128 43047ad7...");
//             aes-key-argument      the <key> of AES::encrypt or AES::decrypt
//                                   written as a literal (AES::encrypt: a key
//                                   string, "otherwise ... interpreted as a pass
//                                   phrase");
//             crypto-key            the value of -key or -keyhex on CRYPTO::encrypt,
//                                   decrypt, sign or verify ("key - key (binary
//                                   data)", "keyhex - key as hex data");
//             cookie-passphrase     the <pass phrase> of HTTP::cookie encrypt or
//                                   decrypt ("using a key generated from the pass
//                                   phrase");
//             header-authorization  the value of an Authorization or
//                                   Proxy-Authorization header written with
//                                   HTTP::header insert or replace (RFC 9110,
//                                   sections 11.6.2 and 11.7.2: "Its value consists
//                                   of credentials");
//             key-variable          a literal given with set to a variable the
//                                   text uses in one of those places (CRYPTO::
//                                   encrypt's own example: set key "abed1ddc..."
//                                   then -keyhex $key).
//   maybe   a value whose name looks like a secret, by the secrets check's own
//           heuristic (set static::api_token "...", a password keyword, a
//           secret-looking name=value in a URL), or a header with such a name
//           written with HTTP::header (X-API-Key). The link is offered, and the
//           popover names the first one so the reader checks it before sending.
//
// Findings inside comments are reported too (a commented-out key is still in
// the link), except the keyword rule's, as in the secrets check (prose uses
// those words). A finding never holds the value itself: its label is the
// command, setting or header name. Every expression is linear (single
// character classes, bounded words read by hand); lines are read one by one.
// ============================================================================

import { isReportableValue, isSecretName, scanSecrets, type SecretRule } from "../tools/code-to-image/secrets"; // the site's secrets check, reused as is
import type { ShareEncoding } from "../share/spec"; // what a share spec's encode returns

/** The iRule rules this check adds to the site's secrets check (see the header for each one's source). */
export type IruleRule = "aes-key-literal" | "aes-key-argument" | "crypto-key" | "cookie-passphrase" | "header-authorization" | "key-variable" | "header-secret";

/** One finding. */
export interface IruleSecretFinding {
  /** The rule that found it. */
  rule: SecretRule | IruleRule;
  /** "secret": no link may carry it; "maybe": a name that looks like a secret, named in the popover. */
  kind: "secret" | "maybe";
  /** The 1-based line of the value. */
  line: number;
  /** A safe label: the command, setting, header or key-block name, never the value. */
  label: string;
  /** Where the value starts in the text (UTF-16 offset), for overlaps and order. */
  start: number;
  /** Where it ends (exclusive). */
  end: number;
}

/** What the check found, each list in reading order. */
export interface IruleSecretReport {
  /** Values no link may carry. */
  secrets: IruleSecretFinding[];
  /** Values whose name looks like a secret. */
  maybe: IruleSecretFinding[];
}

/** The secrets check's rules that find a value by where it stands (a format or a field a standard defines): secrets. */
const EXACT: ReadonlySet<SecretRule> = new Set<SecretRule>(["pem-private-key", "http-authorization", "aws-access-key-id", "jwt", "url-password", "fortios-enc"]); // the rest find a value by its name: maybe

/** Rule precedence when two findings of one kind cover the same characters: the earlier rule in this list is kept. */
const RULE_RANK: readonly (SecretRule | IruleRule)[] = ["pem-private-key", "http-authorization", "aws-access-key-id", "jwt", "url-password", "fortios-enc", "aes-key-literal", "cookie-passphrase", "crypto-key", "aes-key-argument", "header-authorization", "key-variable", "set-secret", "keyword-value", "header-secret", "json-member", "shell-assignment", "assignment", "yaml-mapping"]; // most specific first

/** A Tcl word read from a line: its extent, its text without quotes or braces, and how it was written. */
interface Word {
  /** First character of the word (its quote or brace included). */
  start: number;
  /** One past its last character. */
  end: number;
  /** The text inside the quotes or braces (the whole word when bare). */
  inner: string;
  /** Where the inner text starts. */
  innerStart: number;
  /** Double-quoted, braced or bare. */
  form: "quoted" | "braced" | "bare";
}

/**
 * Read one Tcl word on a line, after any blanks (Tcl 8.4 Tcl(n) rules 4, 5 and 6, on one line only).
 * @param line the line
 * @param at where to start looking
 * @returns the word, or null at the end of the line, at a command separator or for an unterminated word
 */
function readWord(line: string, at: number): Word | null {
  let i = at; // the cursor
  while (i < line.length && (line[i] === " " || line[i] === "\t")) i++; // skip blanks
  if (i >= line.length) return null; // the end of the line
  const c = line[i]; // the first character decides the form
  if (c === ";" || c === "]" || c === "}") return null; // a separator or a closing bracket: no word here
  if (c === '"') { // a double-quoted word
    let j = i + 1; // inside the quotes
    while (j < line.length && line[j] !== '"') { // to the closing quote
      if (line[j] === "[") { // a command substitution: its own quotes do not end the word (Tcl(n) rule 4)
        let depth = 0; // bracket nesting
        for (; j < line.length; j++) { if (line[j] === "\\") { j++; continue; } if (line[j] === "[") depth++; else if (line[j] === "]" && --depth === 0) break; } // to the matching bracket
        j++; // past it
        continue; // and on
      } // substitution
      j += line[j] === "\\" ? 2 : 1; // one character, or an escape and its character
    } // while
    if (j >= line.length) return null; // unterminated on this line
    return { start: i, end: j + 1, inner: line.slice(i + 1, j), innerStart: i + 1, form: "quoted" }; // the word
  } // quoted
  if (c === "{") { // a braced word
    let depth = 0; // brace nesting
    let j = i; // the cursor
    for (; j < line.length; j++) { // to the matching brace
      if (line[j] === "\\") { j++; continue; } // an escaped character does not count
      if (line[j] === "{") depth++; // one deeper
      else if (line[j] === "}" && --depth === 0) break; // the matching brace
    } // for
    if (j >= line.length) return null; // unterminated on this line
    return { start: i, end: j + 1, inner: line.slice(i + 1, j), innerStart: i + 1, form: "braced" }; // the word
  } // braced
  let j = i; // a bare word
  while (j < line.length && line[j] !== " " && line[j] !== "\t" && line[j] !== ";" && line[j] !== "]") { // to a blank or a separator
    if (line[j] === "[") { // a command substitution inside the word: over its brackets
      let depth = 0; // bracket nesting
      for (; j < line.length; j++) { if (line[j] === "[") depth++; else if (line[j] === "]" && --depth === 0) break; } // to the matching bracket
      j++; // past it
      continue; // and on
    } // substitution
    j += line[j] === "\\" ? 2 : 1; // one character, or an escape and its character
  } // while
  const end = Math.min(j, line.length); // an escape at the very end cannot run past the line
  return { start: i, end, inner: line.slice(i, end), innerStart: i, form: "bare" }; // the word
} // readWord

/**
 * The word's value when it is written out in full: no $ or [ substitution (a braced word substitutes nothing), and
 * reportable by the secrets check (not empty, not a placeholder such as none, not already masked).
 * @param w the word
 * @returns true for a literal worth reporting
 */
function isLiteral(w: Word): boolean {
  if (w.form !== "braced" && /[$[]/.test(w.inner)) return false; // a variable or a command supplies it: not written here
  return isReportableValue(w.inner); // the secrets check's own test
} // isLiteral

/** A variable reference: $name, $::name, $static::name or ${name} (Tcl(n) rule 8, scalars only). */
const VAR_REF = /\$(?:\{([^{}]{1,128})\}|((?:::)?[A-Za-z0-9_]{1,128}(?:::[A-Za-z0-9_]{1,128}){0,8}))/g; // global, bounded

/**
 * The variables a word reads, by name, with a leading "::" removed (set ::k and $k name the same text).
 * @param w the word
 * @returns the names (none for a braced word, which substitutes nothing)
 */
function variablesIn(w: Word): string[] {
  if (w.form === "braced") return []; // braces suppress substitution
  const out: string[] = []; // the names
  VAR_REF.lastIndex = 0; // from the start
  let m: RegExpExecArray | null; // the current match
  while ((m = VAR_REF.exec(w.inner))) out.push((m[1] ?? m[2]).replace(/^::/, "")); // each reference
  return out; // done
} // variablesIn

/** The start of every line. */
function lineStarts(text: string): number[] {
  const starts = [0]; // the first line
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1); // each line after a line feed
  return starts; // done
} // lineStarts

/**
 * Whether an offset is inside a Tcl comment: a "#" where a command starts (first on its line, or after ";"), up to the
 * end of the line (Tcl(n) rule 10, one line at a time).
 * @param text the text
 * @param starts its line starts
 * @param offset the offset
 * @returns true inside a comment
 */
function inTclComment(text: string, starts: readonly number[], offset: number): boolean {
  let lo = 0, hi = starts.length - 1; // binary search for the line
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= offset) lo = mid; else hi = mid - 1; } // the line holding the offset
  const before = text.slice(starts[lo], offset); // the line up to the offset
  return /^[ \t]*#/.test(before) || /;[ \t]*#/.test(before); // a comment begins before it
} // inTclComment

/** The commands whose arguments hold keys. */
const AES_CMD = /AES::(encrypt|decrypt)[ \t]+/g; // AES::encrypt <key> <data>
/** A CRYPTO command that takes -key or -keyhex. */
const CRYPTO_CMD = /CRYPTO::(encrypt|decrypt|sign|verify)\b/; // CRYPTO::encrypt [-key[hex] <>] ...
/** The -key and -keyhex options. */
const CRYPTO_KEY = /(?:^|[ \t])(-key(?:hex)?)[ \t]+/g; // the option, then its value
/** HTTP::cookie encrypt|decrypt <name> <pass phrase>. */
const COOKIE_CMD = /HTTP::cookie[ \t]+(encrypt|decrypt)[ \t]+/g; // then two words
/** HTTP::header insert|replace [lws] <name> <value>. */
const HEADER_CMD = /HTTP::header[ \t]+(insert|replace)[ \t]+/g; // then the name and the value
/** An AES key as a string: "AES <bits> <hex>" (the hex is bits / 4 digits long). */
const AES_LITERAL = /AES[ \t]+(128|192|256)[ \t]+([0-9A-Fa-f]{32,64})/g; // global, bounded
/** set <name> <value> where a command starts. */
const SET_CMD = /(?:^|[ \t;[{])set[ \t]+((?:::)?[A-Za-z0-9_]{1,128}(?:::[A-Za-z0-9_]{1,128}){0,8})[ \t]+/g; // global, bounded

/**
 * Search an iRule, a Tcl script or set commands for keys and credentials.
 * @param text the text as typed (line feeds or CR LF)
 * @returns the secrets and the maybe-secrets, each in reading order, with overlaps removed
 */
export function findIruleSecrets(text: string): IruleSecretReport {
  const norm = text.replace(/\r\n?/g, "\n"); // one line ending; CR LF and LF give the same line numbers
  const starts = lineStarts(norm); // every line's start
  const found: IruleSecretFinding[] = []; // every finding, before overlaps are removed
  const keyVars = new Set<string>(); // variables the text uses as a key or a pass phrase
  /** Record a finding on a line. */
  const add = (rule: IruleSecretFinding["rule"], kind: "secret" | "maybe", ln: number, label: string, start: number, end: number): void => {
    if (end > start) found.push({ rule, kind, line: ln + 1, label, start, end }); // an empty value is not a finding
  }; // add

  // The site's secrets check, as is (Tcl comments for its keyword rule), over the text with Tcl's \r, \n and \t
  // escapes read as blanks of the same length, so a header line written inside a string ("...\r\nAuthorization:
  // Basic ...") stands on its own as it will on the wire; offsets and lines do not move.
  const unescaped = norm.replace(/\\[rnt]/g, "  "); // two characters for two
  for (const f of scanSecrets(unescaped, (off) => inTclComment(norm, starts, off))) { // each finding
    const first = f.spans[0]; // its first stretch
    const last = f.spans[f.spans.length - 1]; // its last stretch
    add(f.rule, EXACT.has(f.rule) ? "secret" : "maybe", f.line - 1, f.label, first.start, last.end); // kind by rule
  } // for

  // The iRule places, line by line.
  for (let ln = 0; ln < starts.length; ln++) { // each line
    const ls = starts[ln]; // the line's start
    const line = norm.slice(ls, ln + 1 < starts.length ? starts[ln + 1] - 1 : norm.length); // the line
    let m: RegExpExecArray | null; // the current match

    AES_LITERAL.lastIndex = 0; // aes-key-literal
    while ((m = AES_LITERAL.exec(line))) { // each candidate
      const before = line[m.index - 1], after = line[m.index + m[0].length]; // the neighbours
      if (before !== undefined && /[A-Za-z0-9_:]/.test(before)) continue; // part of a longer word
      if (after !== undefined && /[0-9A-Za-z]/.test(after)) continue; // a longer hex run: not this format
      if (m[2].length !== Number(m[1]) / 4) continue; // the hex is bits / 4 digits long
      const v = m.index + m[0].length - m[2].length; // the hex digits
      add("aes-key-literal", "secret", ln, `AES ${m[1]}`, ls + v, ls + v + m[2].length); // the key
    } // while

    AES_CMD.lastIndex = 0; // aes-key-argument
    while ((m = AES_CMD.exec(line))) { // each AES::encrypt or AES::decrypt
      const w = readWord(line, m.index + m[0].length); // the <key>
      if (!w) continue; // nothing there
      if (isLiteral(w)) add("aes-key-argument", "secret", ln, `AES::${m[1]}`, ls + w.innerStart, ls + w.innerStart + w.inner.length); // written out
      else for (const n of variablesIn(w)) keyVars.add(n); // supplied by a variable: remember it
    } // while

    if (CRYPTO_CMD.test(line)) { // crypto-key
      const cmd = CRYPTO_CMD.exec(line)!; // the command (tested above)
      CRYPTO_KEY.lastIndex = cmd.index; // its options follow it
      while ((m = CRYPTO_KEY.exec(line))) { // each -key or -keyhex
        const w = readWord(line, m.index + m[0].length); // the key
        if (!w) continue; // nothing there
        if (isLiteral(w)) add("crypto-key", "secret", ln, `CRYPTO::${cmd[1]} ${m[1]}`, ls + w.innerStart, ls + w.innerStart + w.inner.length); // written out
        else for (const n of variablesIn(w)) keyVars.add(n); // supplied by a variable
      } // while
    } // crypto

    COOKIE_CMD.lastIndex = 0; // cookie-passphrase
    while ((m = COOKIE_CMD.exec(line))) { // each HTTP::cookie encrypt or decrypt
      const name = readWord(line, m.index + m[0].length); // the cookie's name
      const w = name ? readWord(line, name.end) : null; // the pass phrase
      if (!w) continue; // nothing there
      if (isLiteral(w)) add("cookie-passphrase", "secret", ln, `HTTP::cookie ${m[1]}`, ls + w.innerStart, ls + w.innerStart + w.inner.length); // written out
      else for (const n of variablesIn(w)) keyVars.add(n); // supplied by a variable
    } // while

    HEADER_CMD.lastIndex = 0; // header-authorization and header-secret
    while ((m = HEADER_CMD.exec(line))) { // each HTTP::header insert or replace
      let name = readWord(line, m.index + m[0].length); // the header's name, or "lws"
      if (name && name.inner === "lws" && m[1] === "insert") name = readWord(line, name.end); // insert lws <name> <value>
      const w = name ? readWord(line, name.end) : null; // the value
      if (!name || !w) continue; // not a name and a value
      const credentials = /^(?:Proxy-)?Authorization$/i.test(name.inner); // RFC 9110 11.6.2 and 11.7.2
      if (credentials && isLiteral(w)) add("header-authorization", "secret", ln, name.inner, ls + w.innerStart, ls + w.innerStart + w.inner.length); // written out
      else if (credentials) { // built from variables or commands
        for (const n of variablesIn(w)) keyVars.add(n); // the credentials come from variables
        const b64 = /\[b64encode[ \t]+/.exec(w.inner); // "Basic [b64encode user:password]": RFC 7617 section 2's user-pass, encoded by the iRule
        const arg = b64 && w.form !== "braced" ? readWord(w.inner, b64.index + b64[0].length) : null; // the user-pass word
        if (arg && isLiteral(arg)) add("header-authorization", "secret", ln, name.inner, ls + w.innerStart + arg.innerStart, ls + w.innerStart + arg.innerStart + arg.inner.length); // written out
      } // credentials
      else if (isSecretName(name.inner) && isLiteral(w)) add("header-secret", "maybe", ln, name.inner, ls + w.innerStart, ls + w.innerStart + w.inner.length); // a secret-looking header name
    } // while
  } // for

  // key-variable: a literal set to a variable used as a key, pass phrase or credentials.
  if (keyVars.size > 0) { // some variable is used as a key
    for (let ln = 0; ln < starts.length; ln++) { // each line
      const ls = starts[ln]; // the line's start
      const line = norm.slice(ls, ln + 1 < starts.length ? starts[ln + 1] - 1 : norm.length); // the line
      SET_CMD.lastIndex = 0; // from the line's start
      let m: RegExpExecArray | null; // the current match
      while ((m = SET_CMD.exec(line))) { // each set command
        const name = m[1].replace(/^::/, ""); // the variable, without a leading ::
        if (!keyVars.has(name)) continue; // not one used as a key
        const w = readWord(line, m.index + m[0].length); // its value
        if (w && isLiteral(w)) add("key-variable", "secret", ln, `set ${m[1]}`, ls + w.innerStart, ls + w.innerStart + w.inner.length); // written out
      } // while
    } // for
  } // key variables

  // Overlaps: a secret claims its characters before a maybe; within a kind, the more specific rule wins (RULE_RANK:
  // "AES 128" says more about set key "AES 128 ..." than "set key" does), then the earlier finding.
  const rank = (f: IruleSecretFinding): number => RULE_RANK.indexOf(f.rule); // precedence
  const ordered = [...found].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "secret" ? -1 : 1) || rank(a) - rank(b) || a.start - b.start); // secrets first, then by rule, then by position
  const kept: IruleSecretFinding[] = []; // the result
  for (const f of ordered) if (!kept.some((k) => f.start < k.end && k.start < f.end)) kept.push(f); // no shared character
  const byPosition = (a: IruleSecretFinding, b: IruleSecretFinding): number => a.start - b.start; // reading order
  return { secrets: kept.filter((f) => f.kind === "secret").sort(byPosition), maybe: kept.filter((f) => f.kind === "maybe").sort(byPosition) }; // both lists
} // findIruleSecrets

/** A finding with the field it was found in (for tools with several boxes). */
export interface FieldSecretFinding extends IruleSecretFinding {
  /** The field's share name ("input", "setup", "uri" ...). */
  field: string;
}

/** The values a blocked encoding or a caution line names: the first finding, and how many more places hold one. */
export interface SecretPlace {
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
 * @param list findings of one kind, in the order to name them
 * @returns the place, or null for an empty list
 */
export function firstPlace(list: readonly (IruleSecretFinding & { field?: string })[]): SecretPlace | null {
  if (list.length === 0) return null; // nothing found
  const places = new Set(list.map((f) => `${f.field ?? "input"}\n${f.line}`)); // distinct places (a field and a line)
  const f = list[0]; // the first, in reading order
  return { field: f.field ?? "input", line: f.line, label: f.label, more: places.size - 1 }; // what the popover names
} // firstPlace

/**
 * Run the check over several fields, in the order given.
 * @param fields each field's share name and text
 * @returns the secrets and maybe-secrets of all fields, field by field, each in reading order
 */
export function findIruleSecretsIn(fields: readonly (readonly [string, string])[]): { secrets: FieldSecretFinding[]; maybe: FieldSecretFinding[] } {
  const secrets: FieldSecretFinding[] = []; // every field's secrets
  const maybe: FieldSecretFinding[] = []; // every field's maybe-secrets
  for (const [field, text] of fields) { // in the order given
    const r = findIruleSecrets(text); // this field
    for (const f of r.secrets) secrets.push({ ...f, field }); // tagged
    for (const f of r.maybe) maybe.push({ ...f, field }); // tagged
  } // for
  return { secrets, maybe }; // done
} // findIruleSecretsIn

/**
 * The Share results encoding of a tool whose one box holds an iRule (the command/context explainer, the LTM policy
 * classifier, the performance linter, the style checker): the box as pasted, nothing while it is blank, and no link
 * while it holds a key or credential (code "secret", with the place the popover names).
 * @param input the box as pasted
 * @param report the check's report on that box (the page computes it once for the button and the caution line)
 * @returns the encoding
 */
export function encodeIruleBox(input: string, report: IruleSecretReport): ShareEncoding {
  if (input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
  const block = firstPlace(report.secrets); // the first key or credential, if any
  if (block) return { ok: false, reason: "blocked", code: "secret", values: { line: block.line, label: block.label, more: block.more } }; // no link
  return { ok: true, params: { input } }; // the box as pasted
} // encodeIruleBox

/**
 * The blocked encoding for findings across several fields, or null when there is none.
 * @param secrets the secrets of every field, field by field
 * @returns the blocked encoding (code "secret", with the field, line, label and count), or null
 */
export function blockedBySecrets(secrets: readonly FieldSecretFinding[]): ShareEncoding | null {
  const block = firstPlace(secrets); // the first key or credential, if any
  if (!block) return null; // nothing blocks
  return { ok: false, reason: "blocked", code: "secret", values: { field: block.field, line: block.line, label: block.label, more: block.more } }; // no link
} // blockedBySecrets
