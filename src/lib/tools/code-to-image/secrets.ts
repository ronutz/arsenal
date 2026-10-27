// ============================================================================
// src/lib/tools/code-to-image/secrets.ts
// ----------------------------------------------------------------------------
// The secrets check of the code-to-image tool. Before an image is made, the
// text is searched for values the reader may not mean to publish, and each
// finding is masked in the image unless the reader unticks it. The check is a
// list of named rules, each taken from the documentation of the format it
// looks for, read on 2026-10-27; it is not a complete secret scanner and the
// page never says it is. It looks for:
//
//   pem-private-key      a PEM private key block: "-----BEGIN ... PRIVATE KEY-----"
//                        (RFC 7468 sections 2, 3, 10 and 11: the encapsulation
//                        boundaries, the label grammar, "PRIVATE KEY" and
//                        "ENCRYPTED PRIVATE KEY"; OpenSSL 3.5 PEM_read_bio_PrivateKey(3):
//                        the traditional "RSA PRIVATE KEY" form with Proc-Type and
//                        DEK-Info headers; OpenSSH sshkey.c: "OPENSSH PRIVATE KEY").
//                        The body between the boundary lines is masked; a block
//                        written on one line with "\n" escapes is masked between
//                        its markers.
//   http-authorization   an Authorization or Proxy-Authorization header with the
//                        Bearer or Basic scheme (RFC 9110 sections 5.1 and 11.1:
//                        field names and schemes are case-insensitive; 11.4 the
//                        token68 credentials; RFC 6750 section 2.1 b64token;
//                        RFC 7617 section 2). The credentials are masked.
//   aws-access-key-id    an AWS access key ID: the prefix AKIA (access key) or ASIA
//                        (temporary AWS STS access key) from IAM's table of unique
//                        ID prefixes, followed by 16 upper-case letters or digits,
//                        the 20-character shape of every example in AWS's IAM and
//                        CLI documentation (AKIAIOSFODNN7EXAMPLE).
//   jwt                  a JWS or JWE in compact serialisation: three or five
//                        base64url segments joined by dots (RFC 7515 section 7.1,
//                        RFC 7516 section 7.1) whose first segment decodes to a JSON
//                        object with an "alg" member (RFC 7515 4.1.1, RFC 7516
//                        4.1.1; JWTs use these serialisations, RFC 7519 section 1).
//   url-password         a password in the userinfo of a URL, "scheme://user:password@"
//                        (RFC 3986 section 3.2.1, which deprecates the form).
//   fortios-enc          a FortiOS "set <field> ENC <value>" line: the encrypted
//                        form a configuration backup holds (Fortinet Technical Tip
//                        "Command fail while copying the preshare key from another
//                        configuration": set psksecret ENC ...).
//   set-secret           "set <name> <value>" where the name looks like a secret:
//                        FortiOS field subcommands (Subcommands: set <field> <value>;
//                        config system admin: set password) and Tcl's set command
//                        (set(n)), which Expect scripts and iRules use.
//   keyword-value        a secret attribute followed by its value: tmsh's password,
//                        passphrase, encrypted-password and proxy-ca-passphrase
//                        (TMSH Reference v17: auth user, sys file ssl-key, ltm
//                        profile client-ssl, ltm monitor http), and Cisco IOS XE's
//                        "password [type] value" and "secret [type] value"
//                        (username ... secret 9 ..., enable secret; Controlling
//                        Switch Access with Passwords, IOS XE 17.18).
//   json-member          a JSON member whose name looks like a secret and whose value
//                        is a string (RFC 8259 sections 4 and 7; RFC 6749 section
//                        5.1's access_token and refresh_token are examples).
//   yaml-mapping         a YAML mapping entry, block or flow, whose key looks like a
//                        secret (YAML 1.2.2 sections 7.3, 7.4, 8.2.2).
//   shell-assignment     NAME=value where the name looks like a secret (POSIX 2.10.2
//                        assignment words; AWS CLI credentials files use the same
//                        name=value shape: aws_secret_access_key=...).
//   assignment           name = "string" (Python 3.15 assignment statements, 7.2,
//                        with a string literal on the right; the same shape covers
//                        TOML- and INI-style files).
//
// "Looks like a secret" is this tool's own heuristic, not a standard: the last
// word of the name (split at underscores, hyphens, dots and camelCase) is one
// of password, passwd, pass, passphrase, secret, token, psk, psksecret, apikey,
// accesskey, secretkey, privatekey, credential or credentials, or the name ends
// in "key" after api, access, private, secret, signing, client, auth,
// encryption, master or session. A value that is empty, a placeholder (none,
// null, true, false, enable, disable ...), a whole reference ($VAR, ${...},
// $(cmd), $env(NAME), a Tcl [command], {{ ... }}, <...>), already masked (only
// *, x or bullets) or without any letter or digit ("==") is not reported. A
// crypt-style hash such as "$6$salt$hash" or Cisco's "$9$..." is not a
// reference and is reported.
// keyword-value findings inside a comment are not reported either, because
// prose in comments uses those words ("change the password before ..."); every
// other rule reports findings inside comments too.
//
// Every pattern is linear: sticky or global expressions over character
// classes whose repetitions cannot overlap, bounded quantifiers, and lines
// limited by compute.ts to a few hundred characters.
// ============================================================================

/** A rule id (see the header for each rule's source). */
export type SecretRule = "pem-private-key" | "http-authorization" | "aws-access-key-id" | "jwt" | "url-password" | "fortios-enc" | "set-secret" | "keyword-value" | "json-member" | "yaml-mapping" | "shell-assignment" | "assignment";

/** Rule precedence when two findings cover the same characters: the earlier rule in this list is kept. */
export const RULE_ORDER: readonly SecretRule[] = Object.freeze(["pem-private-key", "http-authorization", "aws-access-key-id", "jwt", "url-password", "fortios-enc", "set-secret", "keyword-value", "json-member", "shell-assignment", "assignment", "yaml-mapping"]); // most specific first (a Python annotation "name: type = '...'" is an assignment, not YAML)

/** One masked stretch: [start, end) in the normalised text, never across a line break. */
export interface MaskSpan { start: number; end: number }

/** A finding: what was found, where, and which characters the image masks. */
export interface SecretFinding {
  /** The rule that found it. */
  rule: SecretRule;
  /** The 1-based line of the finding's first character. */
  line: number;
  /** The 1-based column (code points) of the first masked character. */
  column: number;
  /** A safe label: the header, attribute or key name, or the PEM label; never the secret itself. */
  label: string;
  /** How many code points of secret the masks hide (for the PEM rule, across all body lines). */
  length: number;
  /** The stretches the mask replaces, one per line. */
  spans: MaskSpan[];
}

// ---------------------------------------------------------------------------
// Names and values.
// ---------------------------------------------------------------------------

/** Last words that mark a secret-looking name. */
const SECRET_LAST = new Set(["password", "passwd", "pass", "passphrase", "secret", "token", "psk", "psksecret", "apikey", "accesskey", "secretkey", "privatekey", "credential", "credentials"]); // the heuristic
/** Words that, before a final "key", make it a secret key. */
const KEY_QUALIFIERS = new Set(["api", "access", "private", "secret", "signing", "client", "auth", "encryption", "master", "session"]); // the heuristic

/**
 * Whether a name looks like it holds a secret (this tool's heuristic, stated in the header).
 * @param name an attribute, key, field or variable name
 * @returns true when the name looks like a secret
 */
export function isSecretName(name: string): boolean {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w !== ""); // camelCase and separators split into words
  const last = words[words.length - 1]; // the last word
  if (last === undefined) return false; // no word at all
  if (SECRET_LAST.has(last)) return true; // password, secret, token ...
  return last === "key" && words.length > 1 && KEY_QUALIFIERS.has(words[words.length - 2]); // api_key, private_key, aws_secret_access_key
} // isSecretName

/** Values that are settings or placeholders, not secrets. */
const NOT_SECRET_VALUES = new Set(["", "none", "null", "nil", "~", "true", "false", "yes", "no", "enable", "disable", "enabled", "disabled", "required", "optional", "default", "enc"]); // compared lower-cased

/**
 * Whether a value is worth reporting: not empty, not a placeholder, not a reference, not already masked.
 * @param value the value as written, without its quotes
 * @returns true when it may be a secret
 */
export function isReportableValue(value: string): boolean {
  const v = value.trim(); // ignore surrounding blanks
  if (NOT_SECRET_VALUES.has(v.toLowerCase())) return false; // a placeholder or a setting
  if (/^\$(?:\{[^}]*\}|\([^)]*\)|[A-Za-z_][A-Za-z0-9_:]*(?:\([^)]*\))?)$/.test(v)) return false; // a whole reference: $VAR, ${VAR}, $(cmd), $env(PW); "$6$salt$hash" is not one
  if (v.startsWith("[") || v.startsWith("{{") || (v.startsWith("<") && v.endsWith(">"))) return false; // a Tcl [command substitution], a template or a <placeholder>
  if (/^[*xX•]+$/.test(v)) return false; // already masked
  if (!/[\p{L}\p{N}]/u.test(v)) return false; // no letter or digit at all: an operator such as "==", not a value
  return true; // possibly a secret
} // isReportableValue

// ---------------------------------------------------------------------------
// The rules.
// ---------------------------------------------------------------------------

/** A PEM boundary with a private-key label (RFC 7468 label grammar, restricted to labels ending in "PRIVATE KEY"). */
const PEM_BEGIN = /-----BEGIN ((?:[A-Z0-9]+[ -])*)PRIVATE KEY-----/g; // global, linear
/** The matching end boundary. */
const PEM_END = /-----END ((?:[A-Z0-9]+[ -])*)PRIVATE KEY-----/g; // global, linear
/** Authorization or Proxy-Authorization with Bearer or Basic and token68 credentials. */
const AUTHZ = /(?:^|[^A-Za-z0-9-])((?:Proxy-)?Authorization)[ \t]*:[ \t]*(Bearer|Basic)[ \t]+([A-Za-z0-9\-._~+/]+=*)/gi; // global, case-insensitive
/** An AWS access key ID candidate; its boundaries are checked in code (no look-behind, for older browsers). */
const AWS_KEY = /(AKIA|ASIA)[A-Z0-9]{16}/g; // global
/** A run of dot-joined base64url segments (a JWS or JWE candidate). */
const DOTTED_B64URL = /[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]*)+/g; // global; each repetition starts with a dot
/** scheme://user:password@ (RFC 3986 3.1 scheme, 3.2.1 userinfo). */
const URL_USERINFO = /([A-Za-z][A-Za-z0-9+.-]{0,30}):\/\/([^\s/?#@:]{0,256}):([^\s/?#@]{1,256})@/g; // global, bounded
/** FortiOS set <field> ENC <value>. */
const FORTIOS_ENC = /(?:^|[ \t])set[ \t]+([A-Za-z0-9_-]{1,64})[ \t]+ENC[ \t]+(\S{1,4096})/g; // global
/** set <name> <value> (FortiOS and Tcl): a double-quoted, single-quoted, braced or bare value. */
const SET_VALUE = /(?:^|[ \t;[{])set[ \t]+([A-Za-z0-9_:()-]{1,128})[ \t]+("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|\{[^{}\n]*\}|[^\s;\]]+)/g; // global
/** A secret keyword (tmsh, Cisco) followed by an optional Cisco type digit and a value. */
const KEYWORD_VALUE = /(?:^|[ \t{])(password|passphrase|secret|encrypted-password|proxy-ca-passphrase)[ \t]+(?:([0-9])[ \t]+)?("(?:[^"\\\n]|\\.)*"|\S+)/g; // global
/** A JSON member with a string value. */
const JSON_MEMBER = /"((?:[^"\\\n]|\\.){1,128})"[ \t]*:[ \t]*"((?:[^"\\\n]|\\.)*)"/g; // global
/** A YAML block mapping entry: indentation, optional sequence entries, a plain or quoted key, ":" and the rest of the line. */
const YAML_BLOCK = /^[ \t]*(?:-[ \t]+)*(["']?)([A-Za-z0-9_.-]{1,128})\1[ \t]*:[ \t]+(\S.*)$/; // anchored; the backreference repeats the key's quote
/** A YAML flow mapping entry inside { }: "{ key: value" or ", key: value". */
const YAML_FLOW = /[{,][ \t]*([A-Za-z0-9_.-]{1,128})[ \t]*:[ \t]+([^,}\s][^,}]*)/g; // global
/** NAME=value in the shell, with a double-quoted, single-quoted or bare value. */
const SHELL_ASSIGN = /(?:^|[ \t;&|(?])([A-Za-z_][A-Za-z0-9_]{0,127})=("(?:[^"\\\n]|\\.)*"|'[^'\n]*'|[^\s;&|"'`]+)/g; // global; "?" and "&" also find name=value in a URL's query
/** name = "string" (Python and TOML- or INI-like files), an optional annotation, an optional string prefix. */
const ASSIGN_STRING = /(?:^|[ \t;])([A-Za-z_][A-Za-z0-9_]{0,127})[ \t]*(?::[^=\n]{1,64})?=[ \t]*[rRbBuU]{0,2}("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g; // global

/** Strip one pair of matching quotes or braces from a value and return the inner offset and text. */
function unquote(v: string): { off: number; text: string } {
  const q = v[0]; // the first character
  if (v.length >= 2 && ((q === '"' && v.endsWith('"')) || (q === "'" && v.endsWith("'")) || (q === "{" && v.endsWith("}")))) return { off: 1, text: v.slice(1, -1) }; // inside the pair
  return { off: 0, text: v }; // a bare value
} // unquote

/**
 * Decode base64url (RFC 4648 section 5, without padding, as RFC 7515 section 2 uses it) to a string, or null.
 * @param seg the segment
 * @returns the decoded text (Latin-1 bytes are enough to test for a JSON object), or null when it is not base64url
 */
function b64urlDecode(seg: string): string | null {
  if (seg.length % 4 === 1 || seg.length > 2736) return null; // an impossible length, or a header far longer than any real one
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"; // the base64url alphabet
  let bits = 0, acc = 0, out = ""; // the bit buffer and the output
  for (const ch of seg) {
    const v = alphabet.indexOf(ch); // the six-bit value
    if (v < 0) return null; // not base64url
    acc = (acc << 6) | v; bits += 6; // append six bits
    if (bits >= 8) { bits -= 8; out += String.fromCharCode((acc >> bits) & 0xff); } // emit a byte
  } // for
  return out; // the bytes as a string
} // b64urlDecode

/**
 * Whether a dotted run is a JWS (3 segments) or JWE (5 segments) whose protected header is a JSON object with "alg".
 * @param token the run
 * @returns true for a JWT-shaped string
 */
function isJoseCompact(token: string): boolean {
  const parts = token.split("."); // the segments
  if (parts.length !== 3 && parts.length !== 5) return false; // JWS has three, JWE five (RFC 7515 7.1, RFC 7516 7.1)
  if (parts[0].length < 4 || parts[1].length === 0) return false; // a header and a second segment are required
  const header = b64urlDecode(parts[0]); // the protected header
  if (header === null || !/^\s*\{/.test(header)) return false; // not a JSON object
  try {
    const obj: unknown = JSON.parse(header); // parse it
    return typeof obj === "object" && obj !== null && !Array.isArray(obj) && typeof (obj as Record<string, unknown>).alg === "string"; // "alg" is required (4.1.1)
  } catch {
    return false; // not JSON
  } // try
} // isJoseCompact

/** The line structure of the text: the start offset of every line. */
function lineStarts(text: string): number[] {
  const starts = [0]; // the first line
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1); // each line after a line feed
  return starts; // the starts
} // lineStarts

/** Count code points in text[a, b). */
function codePoints(text: string, a: number, b: number): number {
  let n = 0; // the count
  for (let i = a; i < b; i++) { const c = text.charCodeAt(i); if (c < 0xdc00 || c > 0xdfff) n++; } // a low surrogate continues the previous code point
  return n; // the count
} // codePoints

/**
 * Search a text for the secrets the rules describe.
 * @param text the normalised text (line feeds only)
 * @param inComment whether the character at an offset is inside a comment, as the chosen language's highlighter sees it
 * @returns the findings, ordered by position, with overlaps removed (the earlier rule in RULE_ORDER wins)
 */
export function scanSecrets(text: string, inComment: (offset: number) => boolean): SecretFinding[] {
  const starts = lineStarts(text); // every line's start
  const raw: SecretFinding[] = []; // the findings before overlaps are removed
  const lineOf = (off: number): number => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1; } return lo; }; // the 0-based line of an offset
  /** Record a finding over one or more spans. */
  const add = (rule: SecretRule, label: string, spans: MaskSpan[]): void => {
    const real = spans.filter((sp) => sp.end > sp.start); // drop empty spans
    if (real.length === 0) return; // nothing to mask
    const first = real[0]; // the first masked character
    const ln = lineOf(first.start); // its line
    raw.push({ rule, line: ln + 1, column: codePoints(text, starts[ln], first.start) + 1, label, length: real.reduce((n, sp) => n + codePoints(text, sp.start, sp.end), 0), spans: real }); // the finding
  }; // add

  // pem-private-key: multi-line blocks, and blocks written on one line.
  for (let ln = 0; ln < starts.length; ln++) {
    const ls = starts[ln]; // the line start
    const le = ln + 1 < starts.length ? starts[ln + 1] - 1 : text.length; // the line end
    const line = text.slice(ls, le); // the line
    PEM_BEGIN.lastIndex = 0; // scan this line
    const b = PEM_BEGIN.exec(line); // a BEGIN boundary?
    if (!b) continue; // none here
    const label = `${b[1]}PRIVATE KEY`; // e.g. "RSA PRIVATE KEY"
    const afterBegin = b.index + b[0].length; // where the body would start on this line
    PEM_END.lastIndex = afterBegin; // an END on the same line?
    const sameLineEnd = PEM_END.exec(line); // e.g. a JSON string with \n escapes
    if (sameLineEnd) { add("pem-private-key", label, [{ start: ls + afterBegin, end: ls + sameLineEnd.index }]); continue; } // mask between the markers
    const spans: MaskSpan[] = []; // the body, one span per line
    const restStart = afterBegin; // text after BEGIN on this line
    const rest = line.slice(restStart); // e.g. "\n" escapes then base64 in a one-line string with no END
    if (rest.trim() !== "" && !/^["',\s]*$/.test(rest)) spans.push({ start: ls + restStart, end: le }); // body text on the BEGIN line itself
    let k = ln + 1; // the body lines
    for (; k < starts.length; k++) {
      const bs = starts[k]; // the body line start
      const be = k + 1 < starts.length ? starts[k + 1] - 1 : text.length; // its end
      const body = text.slice(bs, be); // the body line
      PEM_END.lastIndex = 0; // look for the END boundary
      const e = PEM_END.exec(body); // found?
      if (e) { const lead = body.slice(0, e.index); const t = lead.trimStart(); if (t.trim() !== "") spans.push({ start: bs + (lead.length - t.length), end: bs + e.index }); break; } // body text before END, then stop
      if (body.trim() === "" && spans.length > 0) continue; // a blank line inside the body
      const t0 = body.length - body.trimStart().length; // keep the indentation
      const t1 = body.trimEnd().length; // and drop trailing blanks
      if (!/^[A-Za-z0-9+/=:,\-\s"']*$/.test(body.slice(t0, t1)) && !/^(Proc-Type|DEK-Info):/.test(body.slice(t0))) break; // not base64 or a header: the block was cut short
      if (t1 > t0) spans.push({ start: bs + t0, end: bs + t1 }); // a body line
    } // for
    add("pem-private-key", label, spans); // one finding for the block
    ln = Math.max(ln, k - 1); // continue after the block
  } // for

  // The per-line rules.
  for (let ln = 0; ln < starts.length; ln++) {
    const ls = starts[ln]; // the line start
    const le = ln + 1 < starts.length ? starts[ln + 1] - 1 : text.length; // the line end
    const line = text.slice(ls, le); // the line
    let m: RegExpExecArray | null; // the current match

    AUTHZ.lastIndex = 0; // http-authorization
    while ((m = AUTHZ.exec(line))) { const v = m.index + m[0].length - m[3].length; add("http-authorization", `${m[1]}: ${m[2]}`, [{ start: ls + v, end: ls + v + m[3].length }]); } // the credentials

    AWS_KEY.lastIndex = 0; // aws-access-key-id
    while ((m = AWS_KEY.exec(line))) {
      const before = line[m.index - 1], after = line[m.index + 20]; // the neighbours
      if ((before === undefined || !/[A-Za-z0-9]/.test(before)) && (after === undefined || !/[A-Za-z0-9]/.test(after))) add("aws-access-key-id", m[1], [{ start: ls + m.index, end: ls + m.index + 20 }]); // a whole ID
    } // while

    DOTTED_B64URL.lastIndex = 0; // jwt
    while ((m = DOTTED_B64URL.exec(line))) if (isJoseCompact(m[0])) add("jwt", m[0].split(".").length === 5 ? "JWE" : "JWS", [{ start: ls + m.index, end: ls + m.index + m[0].length }]); // the whole token

    URL_USERINFO.lastIndex = 0; // url-password
    while ((m = URL_USERINFO.exec(line))) { if (!isReportableValue(m[3])) continue; const v = m.index + m[1].length + 3 + m[2].length + 1; add("url-password", `${m[1]}://${m[2]}:`, [{ start: ls + v, end: ls + v + m[3].length }]); } // the password

    FORTIOS_ENC.lastIndex = 0; // fortios-enc
    while ((m = FORTIOS_ENC.exec(line))) { const v = m.index + m[0].length - m[2].length; add("fortios-enc", `set ${m[1]} ENC`, [{ start: ls + v, end: ls + v + m[2].length }]); } // the encrypted value

    SET_VALUE.lastIndex = 0; // set-secret
    while ((m = SET_VALUE.exec(line))) {
      if (!isSecretName(m[1].replace(/\(.*$/, ""))) continue; // not a secret-looking name (an array element's index is ignored)
      const u = unquote(m[2]); // the value without its quotes or braces
      if (!isReportableValue(u.text)) continue; // a placeholder or reference
      const v = m.index + m[0].length - m[2].length + u.off; // its offset
      add("set-secret", `set ${m[1]}`, [{ start: ls + v, end: ls + v + u.text.length }]); // the value
    } // while

    KEYWORD_VALUE.lastIndex = 0; // keyword-value
    while ((m = KEYWORD_VALUE.exec(line))) {
      const kw = m[0].length - m[0].trimStart().length + m.index; // where the keyword text begins (after the separator)
      if (inComment(ls + kw)) continue; // prose in a comment
      const u = unquote(m[3]); // the value
      if (!isReportableValue(u.text)) continue; // none, a reference ...
      const v = m.index + m[0].length - m[3].length + u.off; // its offset
      add("keyword-value", m[2] !== undefined ? `${m[1]} ${m[2]}` : m[1], [{ start: ls + v, end: ls + v + u.text.length }]); // the value
    } // while

    JSON_MEMBER.lastIndex = 0; // json-member
    while ((m = JSON_MEMBER.exec(line))) {
      if (!isSecretName(m[1]) || !isReportableValue(m[2])) continue; // not a secret-looking member
      const v = m.index + m[0].length - m[2].length - 1; // inside the value's quotes
      add("json-member", `"${m[1]}"`, [{ start: ls + v, end: ls + v + m[2].length }]); // the value
    } // while

    const yb = YAML_BLOCK.exec(line); // yaml-mapping (block)
    if (yb && isSecretName(yb[2])) {
      let value = yb[3]; // the rest of the line
      const hash = value.search(/[ \t]#/); // a comment after the value
      if (!/^["']/.test(value) && hash >= 0) value = value.slice(0, hash); // drop it from a plain value
      value = value.trimEnd(); // and trailing blanks
      const u = unquote(value); // the value without quotes
      const v = line.length - yb[3].length + u.off; // its offset
      if (isReportableValue(u.text) && !/^[|>][0-9+-]*$/.test(u.text) && !/^[&*!]/.test(u.text)) add("yaml-mapping", `${yb[2]}:`, [{ start: ls + v, end: ls + v + u.text.length }]); // not a block scalar header, an anchor, an alias or a tag
    } // block mapping
    YAML_FLOW.lastIndex = 0; // yaml-mapping (flow)
    while ((m = YAML_FLOW.exec(line))) {
      if (!isSecretName(m[1])) continue; // not a secret-looking key
      const raw2 = m[2].trimEnd(); // the value
      const u = unquote(raw2); // without quotes
      if (!isReportableValue(u.text)) continue; // a placeholder
      const v = m.index + m[0].length - m[2].length + u.off; // its offset
      add("yaml-mapping", `${m[1]}:`, [{ start: ls + v, end: ls + v + u.text.length }]); // the value
    } // flow mapping

    SHELL_ASSIGN.lastIndex = 0; // shell-assignment
    while ((m = SHELL_ASSIGN.exec(line))) {
      if (!isSecretName(m[1])) continue; // not a secret-looking name
      const u = unquote(m[2]); // the value
      if (!isReportableValue(u.text)) continue; // a reference such as $DB_PASSWORD
      const v = m.index + m[0].length - m[2].length + u.off; // its offset
      add("shell-assignment", `${m[1]}=`, [{ start: ls + v, end: ls + v + u.text.length }]); // the value
    } // while

    ASSIGN_STRING.lastIndex = 0; // assignment
    while ((m = ASSIGN_STRING.exec(line))) {
      if (!isSecretName(m[1])) continue; // not a secret-looking name
      const u = unquote(m[2]); // the string's content
      if (!isReportableValue(u.text)) continue; // a placeholder
      const v = m.index + m[0].length - m[2].length + u.off; // its offset
      add("assignment", `${m[1]} =`, [{ start: ls + v, end: ls + v + u.text.length }]); // the value
    } // while
  } // for

  // Remove overlaps: the more specific rules claim their characters first; a finding that touches a kept one is dropped.
  const rank = (r: SecretRule): number => RULE_ORDER.indexOf(r); // precedence
  const kept: SecretFinding[] = []; // the result
  const taken: MaskSpan[] = []; // the characters already masked
  for (const f of raw.sort((a, b) => rank(a.rule) - rank(b.rule) || a.spans[0].start - b.spans[0].start)) { // by precedence, then position
    if (f.spans.some((sp) => taken.some((t) => sp.start < t.end && t.start < sp.end))) continue; // overlaps a kept finding
    kept.push(f); taken.push(...f.spans); // keep it
  } // for
  return kept.sort((a, b) => a.spans[0].start - b.spans[0].start || rank(a.rule) - rank(b.rule)); // in reading order
} // scanSecrets
