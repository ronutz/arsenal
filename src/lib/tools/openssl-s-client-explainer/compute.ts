// ============================================================================
// src/lib/tools/openssl-s-client-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE ENGINE of the openssl s_client explainer. Two inputs, either or both:
//   1. an `openssl s_client` command line: every option is named, explained
//      and checked (value present, known option, combinations the manual
//      forbids), and the defaults that apply because an option is ABSENT are
//      spelled out (the SNI rule, verification that never aborts, the port
//      4433 when -connect has no port, no host name check);
//   2. the text s_client printed: every block is recognised and explained
//      (CONNECTED, the depth/verify lines, the certificate chain, the server
//      certificate, peer signature and temp key, the handshake byte counts,
//      the cipher line, ALPN, OCSP, the Verify return code, the SSL-Session
//      block and TLS 1.3's post-handshake New Session Tickets, -brief, -state,
//      -msg and -debug lines), then findings worth flagging are drawn.
//
// Basis: OpenSSL 3.5, the long-term-support release (3.5.9; supported until
// 2030-04-08, openssl-library.org/policies/releasestrat, read 2026-10-27).
// Lines that only OpenSSL 3.0 or 3.6 print are still read; each is marked
// "kept" next to its pattern with the tag whose source shows it, so output
// from those releases is explained too.
//
// It reads text only: nothing is connected to, resolved or executed, and no
// clock is read (zero egress, D-49). Every pattern is anchored or literal with
// bounded repetition and no nested quantifiers (ReDoS-safe), and the input is
// capped (MAX_* below), so the work is linear in the size of the paste.
//
// Facts, all read on 2026-10-27 (ids are the manifest's source ids):
//   - the options and their defaults: options.ts (s_client-3.5 and the pages
//     it points to);
//   - the output layout: OpenSSL's own source at tag openssl-3.5.9
//     (apps/s_client.c print_stuff, print_cert_key_info, ocsp_resp_cb and
//     new_session_cb; apps/lib/s_cb.c verify_callback, ssl_print_sigalgs,
//     ssl_print_tmp_key, ssl_print_secure_renegotiation_notes,
//     print_verify_detail, print_ssl_summary; apps/lib/s_socket.c init_client;
//     apps/lib/apps.c get_nameopt; ssl/ssl_txt.c SSL_SESSION_print), because
//     the manual pages do not describe the output. Kept older and newer lines
//     come from the same files at tags openssl-3.0.13 and openssl-3.6.5;
//   - the verification codes: verify-codes.ts;
//   - the protocol facts behind the findings: RFC 9846 (TLS 1.3, July 2026,
//     obsoletes RFC 8446 and RFC 5246), RFC 8996, RFC 9325, RFC 6066, RFC 7301,
//     RFC 5746, RFC 5246, RFC 9155 and RFC 6960.
// ============================================================================

import { OPTION_BY_NAME, STARTTLS_PROTOCOLS, type Bilingual, type OptionGroup } from "./options"; // the option table
import { VERIFY_CODE_BY_NUMBER, type VerifyCode } from "./verify-codes"; // the verification codes

// ---------------------------------------------------------------------------
// Limits (bounded parse).
// ---------------------------------------------------------------------------
export const MAX_COMMAND_LENGTH = 8000; // a command line longer than this is cut
export const MAX_OUTPUT_LENGTH = 1_000_000; // characters of output read at most
export const MAX_OUTPUT_LINES = 20000; // lines of output read at most
export const MAX_LINE_LENGTH = 4000; // a longer line is kept but cut
const MAX_TOKENS = 600; // shell words read from a command at most

// ---------------------------------------------------------------------------
// Shared types.
// ---------------------------------------------------------------------------

/** The manifest source a finding or an explanation rests on. */
export type SourceId =
  | "s_client-3.5" // openssl-s_client(1), OpenSSL 3.5 (the basis)
  | "s_client-3.6" // openssl-s_client(1), OpenSSL 3.6 (only for what 3.6 added)
  | "s_client-3.0" // openssl-s_client(1), OpenSSL 3.0
  | "s_client-4.1" // openssl-s_client(1), OpenSSL 4.1
  | "openssl-verify-3.5" // openssl-verify(1)
  | "x509-store-ctx-get-error-3.5" // X509_STORE_CTX_get_error(3)
  | "verification-options-3.5" // openssl-verification-options(1)
  | "ssl-conf-cmd-3.5" // SSL_CONF_cmd(3)
  | "ssl-ctx-set1-curves-3.5" // SSL_CTX_set1_groups_list(3)
  | "openssl-3.5" // openssl(1)
  | "ssl-ctx-set-verify-3.5" // SSL_CTX_set_verify(3)
  | "ssl-cipher-get-name-3.5" // SSL_CIPHER_get_name(3)
  | "ssl-get-peer-signature-nid-3.5" // SSL_get_peer_signature_nid(3)
  | "security-level-3.5" // SSL_CTX_set_security_level(3)
  | "err-print-errors-3.5" // ERR_print_errors(3)
  | "passphrase-options-3.5" // openssl-passphrase-options(1)
  | "bio-parse-hostserv-3.5" // BIO_parse_hostserv(3)
  | "openssl-ciphers-3.5" // openssl-ciphers(1)
  | "openssl-src-3.5.9" // OpenSSL source, tag openssl-3.5.9 (the basis)
  | "openssl-src-3.6.5" // OpenSSL source, tag openssl-3.6.5 (kept 3.6 lines)
  | "openssl-src-3.0.13" // OpenSSL source, tag openssl-3.0.13 (kept 3.0 lines)
  | "openssl-releases" // OpenSSL release strategy and downloads (support dates)
  | "rfc9846" // TLS 1.3
  | "rfc6066" // TLS extensions (SNI, status_request)
  | "rfc7301" // ALPN
  | "rfc8996" // deprecating TLS 1.0 and 1.1
  | "rfc9325" // BCP 195 recommendations
  | "rfc5246" // TLS 1.2
  | "rfc5746" // renegotiation indication
  | "rfc9155" // MD5 and SHA-1 in TLS 1.2 signatures
  | "rfc6960"; // OCSP

/** How loudly a finding speaks. */
export type Severity = "high" | "warn" | "info";

/** Stable ids of every finding the engine can raise. */
export type FindingId =
  | "noCommandFound" // the command box held no openssl s_client
  | "unknownOption" // an option the OpenSSL 3.5 page does not list (nor 3.6's additions)
  | "missingValue" // an option that needs a value had none
  | "unexpectedValue" // a flag given a value with =
  | "extraArguments" // words after the target
  | "connectAndTarget" // -connect and a target word together
  | "servernameAndNoservername" // both SNI options
  | "nextprotonegTls13" // -nextprotoneg with -tls1_3
  | "quicWithoutAlpn" // -quic without -alpn
  | "versionAndNo" // a -tlsX_Y with a -no_* option
  | "twoVersions" // two -tlsX_Y options
  | "starttlsUnknown" // a -starttls keyword not in the list
  | "connectNoPort" // -connect without a port: 4433
  | "defaultTarget" // no target at all: localhost:4433
  | "sniFromIp" // IP target, no -servername: no SNI
  | "sniSuppressed" // -noservername
  | "sniDiffers" // -servername differs from the -connect host
  | "noHostnameCheck" // no -verify_hostname / -verify_ip / DANE
  | "verifyNotEnforced" // no -verify_return_error
  | "defaultTrustStore" // no -CAfile / -CApath / -CAstore
  | "oldProtocolForced" // -ssl3 / -tls1 / -tls1_1
  | "seclevelZero" // @SECLEVEL=0 in a cipher string, or -auth_level 0
  | "cipherWithTls13Only" // -cipher while only TLS 1.3 is allowed
  | "ciphersuitesWithTls12Only" // -ciphersuites while only TLS 1.2 or older is allowed
  | "crlDownloadIgnored" // -crl_download without -crl_check
  | "keylogFile" // -keylogfile writes secrets
  | "passOnCommandLine" // pass:password on the command line
  | "proxyBasicAuth" // -proxy_user: Basic in the clear
  | "inputClosedEarly" // stdin closed and no -ign_eof
  | "deprecatedOption" // an option the page marks deprecated
  | "newerOption" // an option OpenSSL 3.5 does not have (added later)
  | "removedIn4" // -engine (removed in 4.0), -ssl3 (not on the 4.1 page)
  | "notSClientOutput" // the output box held nothing s_client prints
  | "handshakeFailed" // (NONE) cipher or an error stack
  | "abortedOnVerify" // certificate verify failed in the error stack
  | "readZero" // the server sent nothing back
  | "verifyFailed" // final verify code not 0
  | "connectedDespiteErrors" // verify failed but the handshake went on
  | "missingIntermediate" // error 20/21 with the chain the server sent
  | "untrustedRoot" // error 19
  | "selfSignedLeaf" // error 18
  | "expired" // error 10
  | "notYetValid" // error 9
  | "nameMismatch" // error 62, 63 or 64
  | "hostnameNotChecked" // code 0 with no Verified peername
  | "hostnameVerified" // a Verified peername line
  | "oldProtocol" // SSLv3, TLSv1, TLSv1.1 negotiated
  | "cipherLineVersion" // "New, TLSv1.0" while the session is TLSv1.1, and the like
  | "weakCipher" // RC4, NULL, export, DES, 3DES, anonymous
  | "staticRsa" // RSA key transport, no forward secrecy
  | "dheTls12" // finite-field DHE suite in TLS 1.2
  | "cbcCipher" // CBC suite in TLS 1.2 or older
  | "sha1Signature" // SHA1 or MD5 signing digest in TLS 1.2
  | "secretsPrinted" // Master-Key or Resumption PSK in the output
  | "ocspNotStapled" // -status asked, nothing stapled
  | "ocspGood" // stapled, good
  | "ocspRevoked" // stapled, revoked
  | "ocspUnknown" // stapled, unknown
  | "chainOrder" // chain entries out of order
  | "rootSent" // the server sends its self-signed root
  | "renegNotSecure" // TLS 1.2 without RFC 5746
  | "renegTls13Note" // OpenSSL 3.0 says IS NOT supported under TLS 1.3
  | "emsNoTls12" // TLS 1.2 without extended master secret
  | "emsNoTls13Note" // "Extended master secret: no" under TLS 1.3
  | "tls13Tickets" // tickets arrived after the handshake
  | "resumed"; // a Reused line: resumption worked

/** One finding. */
export interface Finding {
  id: FindingId; // stable code
  severity: Severity; // how loud
  text: Bilingual; // the finding, in both languages
  source: SourceId; // where the rule comes from
}

// ---------------------------------------------------------------------------
// Small helpers.
// ---------------------------------------------------------------------------

/** Build a two-language text. */
function bi(en: string, pt: string): Bilingual {
  return { en, pt }; // plain pair
}

/** Build a finding. */
function finding(id: FindingId, severity: Severity, source: SourceId, en: string, pt: string): Finding {
  return { id, severity, source, text: bi(en, pt) }; // one row
}

/** True when the text is an IPv4 or bracketed/plain IPv6 literal. */
export function isIpLiteral(host: string): boolean {
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true; // IPv4 dotted quad
  const h = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host; // strip IPv6 brackets
  return h.includes(":") && /^[0-9A-Fa-f:.]{2,45}$/.test(h); // IPv6 text (hex, colons, an embedded IPv4)
}

/** True when the text looks like a DNS name (letters, digits, hyphens, dots, with at least one letter). */
function isDnsName(host: string): boolean {
  return /^[A-Za-z0-9_](?:[A-Za-z0-9_.-]{0,252})$/.test(host) && /[A-Za-z]/.test(host) && !isIpLiteral(host); // bounded class, no nesting
}

// ---------------------------------------------------------------------------
// PART 1: THE COMMAND LINE.
// ---------------------------------------------------------------------------

/** A shell token: a word (quotes removed) or an operator. */
interface ShellToken {
  kind: "word" | "op"; // a word or one of | || & && ; < > >> 2> 2>&1 <<<
  value: string; // the word without quotes, or the operator
}

/**
 * Split a command line the way a POSIX shell would, enough for reading an
 * s_client invocation: single and double quotes, backslash escapes, line
 * continuations (backslash, caret or backtick at the end of a line), and the
 * operators that end a command. Linear: one pass, bounded token count.
 */
export function tokenizeShell(input: string): ShellToken[] {
  const text = input.slice(0, MAX_COMMAND_LENGTH).replace(/[\\^`]\r?\n/g, " "); // join continued lines (bash \, cmd ^, PowerShell `)
  const out: ShellToken[] = []; // the tokens
  let cur = ""; // the word being built
  let inWord = false; // whether a word is open (an empty "" still makes a word)
  let i = 0; // read position
  const push = () => { if (inWord) out.push({ kind: "word", value: cur }); cur = ""; inWord = false; }; // close the open word
  while (i < text.length && out.length < MAX_TOKENS) { // one pass over the characters
    const ch = text[i]; // the current character
    if (ch === "'") { // single quotes: literal up to the next '
      const end = text.indexOf("'", i + 1); // the closing quote
      cur += end === -1 ? text.slice(i + 1) : text.slice(i + 1, end); // the quoted text
      inWord = true; // a word, even when empty
      i = end === -1 ? text.length : end + 1; // past the quote
      continue; // next character
    }
    if (ch === '"') { // double quotes: backslash escapes " \ $ `
      let j = i + 1; // inside the quotes
      while (j < text.length && text[j] !== '"') { // up to the closing quote
        if (text[j] === "\\" && j + 1 < text.length && '"\\$`'.includes(text[j + 1])) { cur += text[j + 1]; j += 2; continue; } // escaped character
        cur += text[j]; // ordinary character
        j += 1; // next
      }
      inWord = true; // a word, even when empty
      i = j + 1; // past the closing quote
      continue; // next character
    }
    if (ch === "\\" && i + 1 < text.length) { cur += text[i + 1]; inWord = true; i += 2; continue; } // backslash escape outside quotes
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") { push(); i += 1; continue; } // whitespace ends a word
    if (ch === "|" || ch === "&" || ch === ";" || ch === "<" || ch === ">") { // an operator
      const fd = inWord && /^[0-9]$/.test(cur) && ch === ">" ? cur : ""; // "2>" glued to its file descriptor is one redirection
      if (fd) { cur = ""; inWord = false; } else push(); // take the descriptor, or close the word before the operator
      const two = text.slice(i, i + 2); // a possible two-character operator
      const op = two === ">&" || two === ">>" || two === "||" || two === "&&" || two === "<<" ? two : ch; // the operator read
      out.push({ kind: "op", value: fd + op }); // e.g. "|", "2>", "2>&", "<"
      i += op.length; // past it
      continue; // next character
    }
    cur += ch; // an ordinary character
    inWord = true; // the word is open
    i += 1; // next
  }
  push(); // close the last word
  return out; // the tokens
}

/** One option of the command, as read and explained. */
export interface ExplainedOption {
  typed: string; // as written, e.g. "--servername" or "-connect"
  name: string; // the canonical single-dash name, e.g. "-servername"
  value: string | null; // its value, or null for a flag
  known: boolean; // in the option table (the OpenSSL 3.5 page, plus the options 3.6 added)
  group: OptionGroup | "unknown"; // where the explainer shows it
  text: Bilingual | null; // what it does (null when unknown)
  dflt: Bilingual | null; // what happens when it is absent (for reference)
  since: string | null; // the release that added it, when known
  deprecated: boolean; // marked deprecated
  notIn35: boolean; // not in OpenSSL 3.5 (added later; see since)
  problem: "missingValue" | "unexpectedValue" | null; // a parse problem on this option
}

/** Where the connection goes, as s_client works it out. */
export interface TargetView {
  raw: string | null; // the -connect value or the target word
  from: "connect" | "positional" | "host-port" | "default"; // where it came from
  host: string | null; // the host part
  port: string | null; // the port or service part
  portDefaulted: boolean; // true when no port was given and 4433 applies
  hostIsIp: boolean; // the host is an IP literal
}

/** What goes in the SNI extension. */
export interface SniView {
  mode: "explicit" | "suppressed" | "from-host" | "none-ip" | "localhost" | "dane"; // how it was chosen
  value: string | null; // the name sent, or null when none
  text: Bilingual; // the explanation
}

/** The command line, explained. */
export interface CommandExplanation {
  found: boolean; // an openssl s_client invocation was found
  program: string | null; // the program word as typed (openssl, /usr/bin/openssl, openssl.exe)
  options: ExplainedOption[]; // every option in order
  target: TargetView; // where it connects
  sni: SniView; // the SNI decision
  stdinClosed: boolean; // input is closed or piped (</dev/null, echo |, printf |)
  inputFrom: string | null; // the command or file feeding standard input
  outputTo: string | null; // what the output is piped to, when piped
  absent: { name: string; text: Bilingual }[]; // defaults that apply because an option is missing
  findings: Finding[]; // what is worth flagging
}

/** The options that take no explanation row of their own but name a protocol version. */
const VERSION_ONLY = ["-ssl3", "-tls1", "-tls1_1", "-tls1_2", "-tls1_3", "-dtls1", "-dtls1_2"]; // "only this version"

/** Parse "host:port", "[v6]:port", "host" the way BIO_parse_hostserv(3) does with host priority. */
function parseHostPort(raw: string): { host: string | null; port: string | null } {
  if (raw.startsWith("[")) { // bracketed IPv6
    const close = raw.indexOf("]"); // end of the address
    if (close === -1) return { host: raw, port: null }; // malformed: keep it all as host
    const host = raw.slice(0, close + 1); // with brackets
    const rest = raw.slice(close + 1); // ":port" or ""
    return { host, port: rest.startsWith(":") && rest.length > 1 && rest !== ":*" ? rest.slice(1) : null }; // port or none
  }
  const colon = raw.lastIndexOf(":"); // the host:service separator
  if (colon === -1) return { host: raw, port: null }; // host alone: the service is left untouched
  const host = raw.slice(0, colon) || null; // ":service" has no host
  const svc = raw.slice(colon + 1); // the service part
  return { host: host === "*" ? null : host, port: svc && svc !== "*" ? svc : null }; // "*" and "" mean none
}

/**
 * Find the `openssl s_client` invocation in a command line and explain it.
 * The words before it (a prompt, `echo |`) and after it (`| openssl x509`,
 * `2>&1`, `</dev/null`) are read for what they do to standard input and
 * output, and otherwise ignored.
 */
export function explainCommand(input: string): CommandExplanation {
  const tokens = tokenizeShell(input); // the shell words
  const findings: Finding[] = []; // what we will flag
  // Locate the program word followed by "s_client".
  let at = -1; // index of the program word
  for (let k = 0; k + 1 < tokens.length; k++) { // scan pairs
    const t = tokens[k]; // candidate program word
    if (t.kind === "word" && /(?:^|[\\/])openssl(?:\.exe)?$/i.test(t.value) && tokens[k + 1].kind === "word" && tokens[k + 1].value === "s_client") { at = k; break; } // found
  }
  const emptyTarget: TargetView = { raw: null, from: "default", host: null, port: null, portDefaulted: false, hostIsIp: false }; // placeholder
  if (at === -1) { // nothing to explain
    if (input.trim() !== "") findings.push(finding("noCommandFound", "info", "s_client-3.5", "No \"openssl s_client\" command was found in the command box; paste the whole line, starting with openssl.", "Não foi encontrado comando \"openssl s_client\" na caixa do comando; cole a linha inteira, começando por openssl.")); // tell why
    return { found: false, program: null, options: [], target: emptyTarget, sni: { mode: "localhost", value: null, text: bi("", "") }, stdinClosed: false, inputFrom: null, outputTo: null, absent: [], findings }; // empty explanation
  }
  // What feeds standard input: a pipe before the program, or a < redirection after it.
  let inputFrom: string | null = null; // the producer
  let stdinClosed = false; // input closed or finite
  const pipeBefore = at > 0 && tokens[at - 1].kind === "op" && tokens[at - 1].value === "|"; // "... | openssl s_client"
  if (pipeBefore) { // find the producer's first word
    let s = at - 2; // walk back over the producer's words
    while (s > 0 && tokens[s - 1].kind === "word") s -= 1; // to the start of that command
    inputFrom = tokens.slice(Math.max(s, 0), at - 1).filter((t) => t.kind === "word" && !["$", "#", "%", ">"].includes(t.value)).map((t) => t.value).join(" ") || null; // e.g. "echo", without a shell prompt
    stdinClosed = true; // a pipe ends when the producer ends
  }
  // Read the options after "s_client" up to the first shell operator.
  const options: ExplainedOption[] = []; // the explained options
  const positional: string[] = []; // words after the options
  let outputTo: string | null = null; // where output goes
  let k = at + 2; // first word after "s_client"
  let optionsDone = false; // a "--" or a non-option word ends the options
  for (; k < tokens.length; k++) { // the s_client words
    const t = tokens[k]; // this token
    if (t.kind === "op") break; // the command ends at an operator
    if (optionsDone || !t.value.startsWith("-") || t.value === "-") { optionsDone = true; positional.push(t.value); continue; } // a target or extra word
    if (t.value === "--") { optionsDone = true; continue; } // "--" ends the options (apps/lib/opt.c)
    const body = t.value.startsWith("--") ? t.value.slice(2) : t.value.slice(1); // -opt and --opt are the same (opt.c)
    const eq = body.indexOf("="); // "--opt=value" form (opt.c)
    const bare = eq === -1 ? body : body.slice(0, eq); // the option name
    const name = "-" + (bare === "h" ? "help" : bare); // canonical single-dash spelling; -h is -help
    const info = OPTION_BY_NAME.get(name); // the table row
    let value: string | null = eq === -1 ? null : body.slice(eq + 1); // inline value, if any
    let problem: ExplainedOption["problem"] = null; // parse problem
    if (info && info.arg !== null && value === null) { // needs a value from the next word
      const next = tokens[k + 1]; // the next token
      if (next && next.kind === "word") { value = next.value; k += 1; } // consume it
      else problem = "missingValue"; // none available
    }
    if (info && info.arg === null && value !== null) problem = "unexpectedValue"; // a flag given =value
    options.push({ // record the option
      typed: t.value, // as typed
      name, // canonical
      value, // its value
      known: !!info, // listed or not
      group: info ? info.group : "unknown", // display group
      text: info ? info.text : null, // explanation
      dflt: info?.dflt ?? null, // absent default
      since: info?.since ?? null, // added in
      deprecated: !!info?.deprecated, // deprecated flag
      notIn35: !!info?.notIn35, // added after 3.5
      problem, // parse problem
    });
  }
  // Read the operators after the command: redirections and pipes.
  for (; k < tokens.length; k++) { // the rest of the line
    const t = tokens[k]; // this token
    if (t.kind !== "op") continue; // words are operands, read with their operator
    const operand = tokens[k + 1]?.kind === "word" ? tokens[k + 1].value : null; // the word after it
    if (t.value === "<" && operand) { stdinClosed = true; inputFrom = inputFrom ?? operand; } // "< /dev/null" or "< file"
    if (t.value === "<<") { stdinClosed = true; inputFrom = inputFrom ?? "<<<"; } // a here-string or here-document
    if (t.value === "|") { outputTo = operand; break; } // the next program in the pipeline; what follows is its business
    if (t.value === ";" || t.value === "&&" || t.value === "||" || t.value === "&") break; // a new command ends our reading of redirections
  }
  const has = (n: string) => options.some((x) => x.name === n); // option present
  const valueOf = (n: string) => { const x = options.find((y) => y.name === n); return x ? x.value : null; }; // its value

  // ---- per-option problems ----
  for (const x of options) { // each option
    if (!x.known) findings.push(finding("unknownOption", "warn", "s_client-3.5", `${x.typed} is not listed on the OpenSSL 3.5 openssl-s_client(1) page; an openssl that does not know it stops with a usage error.`, `${x.typed} não está na página openssl-s_client(1) do OpenSSL 3.5; um openssl que não a conheça para com erro de uso.`)); // unknown
    if (x.problem === "missingValue") findings.push(finding("missingValue", "high", "openssl-src-3.5.9", `${x.typed} needs a value and none follows it; s_client answers "needs a value" and stops.`, `${x.typed} precisa de um valor e nada vem depois; o s_client responde "needs a value" e para.`)); // missing value
    if (x.problem === "unexpectedValue") findings.push(finding("unexpectedValue", "high", "openssl-src-3.5.9", `${x.typed} is a flag and takes no value; s_client answers "does not take a value" and stops.`, `${x.typed} é um flag e não recebe valor; o s_client responde "does not take a value" e para.`)); // flag with =value
    if (x.known && x.deprecated && x.name !== "-engine") findings.push(finding("deprecatedOption", "info", "s_client-3.5", `${x.name} is marked deprecated on the OpenSSL 3.5 page.`, `${x.name} está marcada como depreciada na página do OpenSSL 3.5.`)); // deprecated
    if (x.known && x.notIn35) findings.push(finding("newerOption", "warn", "s_client-3.6", `${x.name} was added in OpenSSL ${x.since ?? "3.6"}: OpenSSL 3.5, the long-term-support release, does not know it and stops with a usage error.`, `${x.name} foi acrescentada no OpenSSL ${x.since ?? "3.6"}: o OpenSSL 3.5, a versão de suporte de longo prazo, não a conhece e para com erro de uso.`)); // newer than 3.5
  }
  if (has("-engine")) findings.push(finding("removedIn4", "warn", "s_client-4.1", "-engine was deprecated in OpenSSL 3.0 and removed in OpenSSL 4.0: the command fails on a 4.x openssl.", "-engine foi depreciada no OpenSSL 3.0 e removida no OpenSSL 4.0: o comando falha num openssl 4.x.")); // removed in 4.0
  if (has("-ssl3")) findings.push(finding("removedIn4", "warn", "s_client-4.1", "-ssl3 is no longer listed on the OpenSSL 4.1 page.", "-ssl3 não aparece mais na página do OpenSSL 4.1.")); // not on the 4.1 page

  // ---- the target ----
  let target: TargetView; // where it connects
  const connect = valueOf("-connect"); // -connect value
  if (connect !== null && positional.length > 0) findings.push(finding("connectAndTarget", "high", "openssl-src-3.5.9", "Both -connect and a target word were given; s_client refuses that (\"cannot provide both -connect option and target parameter\").", "Foram dados -connect e uma palavra de destino; o s_client recusa (\"cannot provide both -connect option and target parameter\").")); // both
  if (positional.length > 1) findings.push(finding("extraArguments", "high", "openssl-src-3.5.9", `s_client takes at most one target word after the options; ${positional.slice(1).join(" ")} would be refused.`, `O s_client aceita no máximo uma palavra de destino depois das opções; ${positional.slice(1).join(" ")} seria recusado.`)); // extra words
  const rawTarget = connect ?? positional[0] ?? null; // the target text
  if (rawTarget !== null) { // a target was given
    const hp = parseHostPort(rawTarget); // split it
    target = { raw: rawTarget, from: connect !== null ? "connect" : "positional", host: hp.host, port: hp.port ?? "4433", portDefaulted: hp.port === null, hostIsIp: !!hp.host && isIpLiteral(hp.host) }; // the view
  } else if (has("-host") || has("-port")) { // the deprecated pair
    const h = valueOf("-host"); // host
    const p = valueOf("-port"); // port
    target = { raw: null, from: "host-port", host: h, port: p ?? "4433", portDefaulted: p === null, hostIsIp: !!h && isIpLiteral(h) }; // the view
  } else { // nothing: localhost:4433
    target = { raw: null, from: "default", host: "localhost", port: "4433", portDefaulted: true, hostIsIp: false }; // the documented default
    if (!has("-unix")) findings.push(finding("defaultTarget", "warn", "s_client-3.5", "No -connect and no target word: s_client connects to the local host on port 4433, its documented default.", "Sem -connect e sem palavra de destino: o s_client conecta no host local, porta 4433, o padrão documentado.")); // default target
  }
  if (target.from !== "default" && target.portDefaulted && !has("-unix")) findings.push(finding("connectNoPort", "high", "bio-parse-hostserv-3.5", `"${target.raw ?? target.host}" has no port, so the default port 4433 stays in place: s_client does not assume 443. Write ${target.host ?? "host"}:443 for HTTPS.`, `"${target.raw ?? target.host}" não tem porta, então fica a porta padrão 4433: o s_client não supõe 443. Escreva ${target.host ?? "host"}:443 para HTTPS.`)); // the 4433 trap

  // ---- SNI ----
  let sni: SniView; // the SNI decision
  const servername = valueOf("-servername"); // explicit name
  if (has("-servername") && has("-noservername")) findings.push(finding("servernameAndNoservername", "high", "s_client-3.5", "-servername and -noservername cannot be used together; s_client refuses the command.", "-servername e -noservername não podem ser usadas juntas; o s_client recusa o comando.")); // contradiction
  if (has("-noservername")) { // suppressed
    sni = { mode: "suppressed", value: null, text: bi("No SNI is sent (-noservername). A server hosting several names answers with its default certificate.", "Nenhum SNI é enviado (-noservername). Um servidor com vários nomes responde com o certificado padrão dele.") }; // suppressed
    findings.push(finding("sniSuppressed", "info", "rfc6066", "-noservername sends no Server Name Indication: a server hosting several sites cannot tell which one you want and presents its default certificate.", "-noservername não envia Server Name Indication: um servidor com vários sites não sabe qual você quer e apresenta o certificado padrão.")); // explain
  } else if (servername !== null) { // explicit
    sni = { mode: "explicit", value: servername, text: bi(`SNI is "${servername}", as given by -servername.`, `O SNI é "${servername}", como passado em -servername.`) }; // explicit
    if (target.host && !target.hostIsIp && target.host.replace(/^\[|\]$/g, "").toLowerCase() !== servername.toLowerCase()) findings.push(finding("sniDiffers", "info", "s_client-3.5", `The SNI (${servername}) differs from the host connected to (${target.host}). That is the usual way to test one site on a given address; just know which name the server is answering for.`, `O SNI (${servername}) difere do host conectado (${target.host}). É o jeito comum de testar um site num endereço específico; só saiba para qual nome o servidor está respondendo.`)); // differs
  } else if (has("-dane_tlsa_domain")) { // DANE provides it
    const d = valueOf("-dane_tlsa_domain"); // the DANE domain
    sni = { mode: "dane", value: d, text: bi(`SNI defaults to the DANE base domain, ${d}.`, `O SNI padrão é o domínio base do DANE, ${d}.`) }; // DANE
  } else if (target.host && target.from !== "default") { // from the host
    if (target.hostIsIp) { // an IP literal: no SNI
      sni = { mode: "none-ip", value: null, text: bi(`No SNI is sent: the host is an IP address, and s_client only copies the -connect host into SNI when it has the form of a DNS name.`, `Nenhum SNI é enviado: o host é um endereço IP, e o s_client só copia o host do -connect para o SNI quando ele tem forma de nome DNS.`) }; // none
      findings.push(finding("sniFromIp", "warn", "s_client-3.5", `You connect to an IP address (${target.host}) without -servername, so no SNI goes out (RFC 6066 forbids IP literals in SNI). A server hosting several sites will present its default certificate, which may not be the one your users see; add -servername with the site's name.`, `Você conecta num endereço IP (${target.host}) sem -servername, então nenhum SNI sai (a RFC 6066 proíbe IP literal no SNI). Um servidor com vários sites vai apresentar o certificado padrão, que pode não ser o que seus usuários veem; acrescente -servername com o nome do site.`)); // flag
    } else if (isDnsName(target.host)) { // a DNS name: copied
      sni = { mode: "from-host", value: target.host, text: bi(`SNI is "${target.host}", copied from -connect because no -servername was given (OpenSSL 1.1.1 and later).`, `O SNI é "${target.host}", copiado do -connect porque não houve -servername (OpenSSL 1.1.1 em diante).`) }; // copied
    } else { // something else: as the code would do, not copied
      sni = { mode: "none-ip", value: null, text: bi(`"${target.host}" does not have the form of a DNS name, so it is not copied into SNI.`, `"${target.host}" não tem forma de nome DNS, então não é copiado para o SNI.`) }; // not copied
    }
  } else { // no -connect at all
    sni = { mode: "localhost", value: "localhost", text: bi("SNI is \"localhost\": with no -connect and no -servername, that is what s_client sends.", "O SNI é \"localhost\": sem -connect e sem -servername, é o que o s_client envia.") }; // localhost
  }

  // ---- verification ----
  const nameCheck = has("-verify_hostname") || has("-verify_ip") || has("-verify_email") || has("-dane_tlsa_domain"); // any name check
  if (!nameCheck) findings.push(finding("noHostnameCheck", "warn", "verification-options-3.5", "Nothing in this command checks the certificate against a host name: -servername only chooses the SNI. A certificate for any other name would still give \"Verify return code: 0 (ok)\". Add -verify_hostname with the name you expect.", "Nada neste comando confere o certificado contra um hostname: o -servername só escolhe o SNI. Um certificado de qualquer outro nome ainda daria \"Verify return code: 0 (ok)\". Acrescente -verify_hostname com o nome esperado.")); // the classic gap
  if (!has("-verify_return_error")) findings.push(finding("verifyNotEnforced", "info", "s_client-3.5", has("-verify") ? "-verify turns verification on but, without -verify_return_error, the handshake still completes after a verification error: a \"CONNECTED\" or \"New, ... Cipher is\" line proves the TLS handshake worked, not that the certificate was trusted. Read the Verify return code." : "Without -verify_return_error, s_client finishes the handshake whatever the certificate check says: a \"CONNECTED\" or \"New, ... Cipher is\" line proves the TLS handshake worked, not that the certificate was trusted. Read the Verify return code.", has("-verify") ? "-verify liga a verificação mas, sem -verify_return_error, o handshake ainda termina depois de um erro de verificação: uma linha \"CONNECTED\" ou \"New, ... Cipher is\" prova que o handshake TLS funcionou, não que o certificado foi confiável. Leia o Verify return code." : "Sem -verify_return_error, o s_client termina o handshake seja qual for o resultado da checagem do certificado: uma linha \"CONNECTED\" ou \"New, ... Cipher is\" prova que o handshake TLS funcionou, não que o certificado foi confiável. Leia o Verify return code.")); // not enforced
  const trustGiven = ["-CAfile", "-CApath", "-CAstore", "-verifyCAfile", "-verifyCApath", "-verifyCAstore"].some(has); // explicit trust
  if (!trustGiven) findings.push(finding("defaultTrustStore", "info", "verification-options-3.5", "No -CAfile, -CApath or -CAstore: the result depends on the default trust store of this openssl build. OpenSSL ships none of its own; Linux distributions usually point it at the system store, so the same command can verify on one machine and fail on another.", "Sem -CAfile, -CApath ou -CAstore: o resultado depende do trust store padrão desta compilação do openssl. O OpenSSL não traz um próprio; distribuições Linux costumam apontá-lo para o store do sistema, então o mesmo comando pode verificar numa máquina e falhar em outra.")); // default store
  if (has("-crl_download") && !has("-crl_check") && !has("-crl_check_all")) findings.push(finding("crlDownloadIgnored", "warn", "s_client-3.5", "-crl_download is ignored without -crl_check (the page says so).", "-crl_download é ignorada sem -crl_check (a página diz isso).")); // ignored
  const authLevel = valueOf("-auth_level"); // the chain security level
  if (authLevel !== null && /^-?0$|^-\d+$/.test(authLevel.trim())) findings.push(finding("seclevelZero", "warn", "verification-options-3.5", `-auth_level ${authLevel}: at 0 or lower every signature and key size is accepted in the chain.`, `-auth_level ${authLevel}: em 0 ou menos, toda assinatura e tamanho de chave são aceitos na cadeia.`)); // level 0

  // ---- protocol versions ----
  const versions = options.filter((x) => VERSION_ONLY.includes(x.name)); // "only this version" options
  const nos = options.filter((x) => /^-no_(ssl3|tls1(_[123])?)$/.test(x.name)); // -no_* options
  if (versions.length > 1) findings.push(finding("twoVersions", "high", "openssl-3.5", `Only one version option may be given; this command has ${versions.map((v) => v.name).join(" and ")}.`, `Só pode haver uma opção de versão; este comando tem ${versions.map((v) => v.name).join(" e ")}.`)); // two versions
  if (versions.length > 0 && nos.length > 0) findings.push(finding("versionAndNo", "high", "openssl-3.5", `${versions[0].name} cannot be combined with ${nos.map((v) => v.name).join(", ")}.`, `${versions[0].name} não pode ser combinada com ${nos.map((v) => v.name).join(", ")}.`)); // version with -no_*
  const old = versions.find((v) => v.name === "-ssl3" || v.name === "-tls1" || v.name === "-tls1_1"); // a deprecated version forced
  const minProto = valueOf("-min_protocol"); // -min_protocol value
  const maxProto = valueOf("-max_protocol"); // -max_protocol value
  if (old || (maxProto && /^(SSLv3|TLSv1|TLSv1\.1)$/i.test(maxProto))) findings.push(finding("oldProtocolForced", "warn", "rfc8996", `${old ? old.name : "-max_protocol " + maxProto} asks for a protocol RFC 8996 deprecated (TLS 1.0 and 1.1) or that is older still. OpenSSL refuses it from security level 1 up, so it usually also needs a cipher string with @SECLEVEL=0; use it to test a legacy server, never as a fix.`, `${old ? old.name : "-max_protocol " + maxProto} pede um protocolo que a RFC 8996 depreciou (TLS 1.0 e 1.1) ou ainda mais antigo. O OpenSSL o recusa a partir do nível de segurança 1, então normalmente também exige uma cipher string com @SECLEVEL=0; use para testar um servidor legado, nunca como correção.`)); // old version
  const tls13Only = has("-tls1_3") || (minProto !== null && /^TLSv1\.3$/i.test(minProto)); // nothing below 1.3
  const tls12OrLowerOnly = versions.some((v) => v.name !== "-tls1_3") || (maxProto !== null && /^(SSLv3|TLSv1|TLSv1\.1|TLSv1\.2)$/i.test(maxProto)) || has("-no_tls1_3"); // nothing at 1.3
  if (tls13Only && has("-cipher") && !has("-ciphersuites")) findings.push(finding("cipherWithTls13Only", "warn", "ssl-conf-cmd-3.5", "-cipher only sets the TLS 1.2-and-below list; with TLS 1.3 forced it changes nothing. TLS 1.3 suites are chosen with -ciphersuites.", "-cipher só define a lista do TLS 1.2 para baixo; com TLS 1.3 forçado ela não muda nada. As suites do TLS 1.3 se escolhem com -ciphersuites.")); // cipher useless
  if (tls12OrLowerOnly && has("-ciphersuites") && !has("-tls1_3")) findings.push(finding("ciphersuitesWithTls12Only", "warn", "ssl-conf-cmd-3.5", "-ciphersuites only sets TLS 1.3 suites, and this command does not allow TLS 1.3, so it changes nothing. Use -cipher for TLS 1.2 and below.", "-ciphersuites só define suites do TLS 1.3, e este comando não permite TLS 1.3, então ela não muda nada. Use -cipher para TLS 1.2 e anteriores.")); // ciphersuites useless
  const cipherStr = valueOf("-cipher") ?? ""; // the cipher string
  if (/@SECLEVEL=0\b/i.test(cipherStr)) findings.push(finding("seclevelZero", "warn", "security-level-3.5", "The cipher string sets @SECLEVEL=0: security level 0 permits everything, including the protocol versions, key sizes and signatures levels 1 and up refuse. Fine for testing a legacy server; a real client should not connect like this.", "A cipher string define @SECLEVEL=0: o nível de segurança 0 permite tudo, inclusive versões de protocolo, tamanhos de chave e assinaturas que os níveis 1 em diante recusam. Serve para testar um servidor legado; um cliente de verdade não deveria conectar assim.")); // seclevel 0
  if (has("-nextprotoneg") && has("-tls1_3")) findings.push(finding("nextprotonegTls13", "high", "s_client-3.5", "-nextprotoneg cannot be used with -tls1_3; s_client refuses it.", "-nextprotoneg não pode ser usada com -tls1_3; o s_client recusa.")); // NPN with 1.3
  if (has("-quic") && !has("-alpn")) findings.push(finding("quicWithoutAlpn", "high", "s_client-3.5", "-quic requires -alpn as well.", "-quic exige também -alpn.")); // QUIC needs ALPN
  const starttls = valueOf("-starttls"); // STARTTLS keyword
  if (starttls !== null && !STARTTLS_PROTOCOLS.includes(starttls)) findings.push(finding("starttlsUnknown", "high", "s_client-3.5", `"${starttls}" is not a -starttls keyword. The page lists: ${STARTTLS_PROTOCOLS.join(", ")}.`, `"${starttls}" não é palavra do -starttls. A página lista: ${STARTTLS_PROTOCOLS.join(", ")}.`)); // unknown keyword

  // ---- secrets on the command line ----
  if (has("-keylogfile")) findings.push(finding("keylogFile", "warn", "s_client-3.5", `-keylogfile ${valueOf("-keylogfile") ?? ""} writes the connection's TLS secrets in the format Wireshark and similar tools use to decrypt it. Keep that file private and delete it when the capture is done.`, `-keylogfile ${valueOf("-keylogfile") ?? ""} grava os segredos TLS da conexão no formato que o Wireshark e ferramentas parecidas usam para decifrá-la. Mantenha o arquivo privado e apague-o ao fim da captura.`)); // key log
  for (const n of ["-pass", "-proxy_pass"]) { // password sources
    const v = valueOf(n); // its value
    if (v !== null && v.startsWith("pass:")) findings.push(finding("passOnCommandLine", "warn", "passphrase-options-3.5", `${n} pass:... puts the password on the command line, where other users can see it with ps; prefer env:, file: or fd:.`, `${n} pass:... coloca a senha na linha de comando, onde outros usuários a veem com ps; prefira env:, file: ou fd:.`)); // visible password
  }
  if (has("-proxy_user")) findings.push(finding("proxyBasicAuth", "warn", "s_client-3.5", "-proxy_user authenticates to the proxy with Basic authentication, sent as reversible base64 before any TLS exists: anyone on the path to the proxy can read it.", "-proxy_user autentica no proxy com Basic, enviado em base64 reversível antes de existir qualquer TLS: qualquer um no caminho até o proxy consegue ler.")); // Basic auth

  // ---- standard input ----
  if (stdinClosed && !has("-ign_eof") && !has("-quiet")) findings.push(finding("inputClosedEarly", "info", "s_client-3.5", `Standard input comes from ${inputFrom ?? "a pipe or a file"} and ends at once, and there is no -ign_eof: the page warns that a non-interactive run may close the connection prematurely, especially with TLS 1.3, so session tickets or the server's reply can be missing from the output.`, `A entrada padrão vem de ${inputFrom ?? "um pipe ou um arquivo"} e acaba na hora, e não há -ign_eof: a página avisa que uma execução sem terminal pode fechar a conexão cedo demais, sobretudo com TLS 1.3, então tickets de sessão ou a resposta do servidor podem faltar na saída.`)); // early close

  // ---- defaults that apply because something is absent ----
  const absent: { name: string; text: Bilingual }[] = []; // the list
  for (const n of ["-connect", "-servername", "-verify", "-verify_return_error", "-verify_hostname", "-CAfile", "-alpn", "-showcerts", "-groups", "-sigalgs", "-cert", "-ign_eof"]) { // the defaults worth stating
    if (n === "-connect" && (connect !== null || positional.length > 0)) continue; // a target was given
    if (n === "-servername" && (has("-servername") || has("-noservername"))) continue; // SNI was set
    if (n === "-verify" && (has("-verify") || has("-verify_return_error"))) continue; // verification was set
    if (n === "-CAfile" && trustGiven) continue; // trust was set
    if (n === "-verify_hostname" && nameCheck) continue; // a name check was set
    if (n === "-groups" && has("-curves")) continue; // the synonym was set
    if (n === "-ign_eof" && (has("-ign_eof") || has("-quiet") || !stdinClosed)) continue; // only relevant with closed input
    if (has(n)) continue; // present: not a default
    const info = OPTION_BY_NAME.get(n); // its row
    if (info?.dflt) absent.push({ name: n, text: info.dflt }); // state the default
  }
  if (!versions.length && !minProto && !maxProto && nos.length === 0) { const d = OPTION_BY_NAME.get("-tls1_3")?.dflt; if (d) absent.push({ name: "-tls1_2 / -tls1_3", text: d }); } // the version default

  return { found: true, program: tokens[at].value, options, target, sni, stdinClosed, inputFrom, outputTo, absent, findings }; // the explanation
}

// ---------------------------------------------------------------------------
// PART 2: THE OUTPUT.
// ---------------------------------------------------------------------------

/** Every kind of line or block the parser recognises. */
export type ItemKind =
  | "connected" | "verify-depth" | "verify-error" | "verify-return" | "verify-issuer" | "verify-not-before" | "verify-not-after"
  | "verify-depth-is" | "verify-ocsp-none" | "error-stack" | "separator" | "chain-header" | "chain-entry" | "pem"
  | "server-certificate" | "subject" | "issuer" | "no-peer-cert" | "ca-names-none" | "ca-names" | "client-cert-types"
  | "sigalgs" | "peer-signing-digest" | "peer-signature-type" | "temp-key" | "negotiated-group" | "scts" | "sct-status"
  | "handshake-bytes" | "verification-ok" | "verification-error" | "verified-peername" | "dane" | "cipher-line"
  | "protocol-line" | "server-public-key" | "secure-reneg" | "compression" | "expansion" | "alpn" | "no-alpn" | "npn"
  | "srtp" | "early-data" | "verify-return-code" | "keying-material" | "ssl-session" | "ticket-arrived" | "ocsp-none"
  | "ocsp-response" | "brief-established" | "brief-protocol" | "brief-ciphersuite" | "brief-peer-cert" | "brief-hash"
  | "brief-sigtype" | "brief-no-peer" | "point-formats" | "state" | "alert" | "msg" | "msg-hex" | "debug" | "hex-dump"
  | "tlsext" | "read-block" | "done" | "closed" | "reconnect" | "renegotiating" | "keyupdate" | "closed-by-server"
  | "errno" | "connect-errno" | "ktls" | "local-port" | "connecting" | "rpk" | "blank" | "data";

/** One recognised line or block of the output. */
export interface OutputItem {
  kind: ItemKind; // what it is
  start: number; // first line (1-based)
  end: number; // last line (1-based)
  text: string; // the lines, as pasted
  fields: Record<string, string>; // the values read from it
  connection: number; // which connection it belongs to (1-based; -reconnect makes several)
  explain: Bilingual; // what it means
  detail: Bilingual | null; // a reading of this item's own values, when there is one
}

/** One certificate of the "Certificate chain" list. */
export interface ChainEntry {
  depth: number; // the number s_client prints (0 is the server's own certificate)
  subject: string; // s:
  issuer: string; // i:
  keyType: string | null; // a:PKEY type ("RSA", "EC" in 3.5; "rsaEncryption", "id-ecPublicKey" in 3.0)
  keyBits: number | null; // a:PKEY bits (not printed for EC keys in 3.5)
  keyCurve: string | null; // a:PKEY curve, for EC keys in 3.5 ("prime256v1")
  sigalg: string | null; // a: sigalg
  notBefore: string | null; // v:NotBefore
  notAfter: string | null; // v:NotAfter
  pem: boolean; // a PEM block followed it (-showcerts)
}

/** One verify error line with its depth and subject. */
export interface VerifyErrorSeen {
  num: number; // the code
  text: string; // the printed text
  depth: number | null; // from the depth= line before it
  subject: string | null; // from the depth= line before it
}

/** What one connection (one handshake) printed, summarised. */
export interface ConnectionSummary {
  index: number; // 1-based
  connected: boolean; // a CONNECTED(...) or CONNECTION ESTABLISHED line
  reused: boolean | null; // "Reused," vs "New,"
  cipherLineVersion: string | null; // the version on the "New, ..." line
  cipher: string | null; // the cipher (or suite)
  protocol: string | null; // the negotiated protocol version
  verifyCode: number | null; // the Verify return code
  verifyText: string | null; // its text
  verification: "ok" | "error" | null; // the Verification: line
  verifiedPeername: string | null; // Verified peername
  verifyErrors: VerifyErrorSeen[]; // verify error lines
  chain: ChainEntry[]; // the Certificate chain list
  serverSubject: string | null; // subject= after Server certificate (or brief Peer certificate)
  serverIssuer: string | null; // issuer= after Server certificate
  noPeerCertificate: boolean; // "no peer certificate available"
  peerSignatureType: string | null; // Peer signature type / Signature type
  peerSigningDigest: string | null; // Peer signing digest / Hash used
  tempKey: string | null; // Server/Peer Temp Key or Negotiated TLS1.3 group
  serverKeyBits: number | null; // Server public key is N bit
  handshakeRead: number | null; // bytes read during the handshake
  handshakeWritten: number | null; // bytes written during the handshake
  alpn: string | null; // the ALPN protocol, "" when "No ALPN negotiated"
  secureReneg: "supported" | "not-supported" | "forbidden" | null; // renegotiation line
  ems: "yes" | "no" | null; // Extended master secret
  ocsp: "none" | "stapled" | null; // OCSP line, when -status was used
  ocspCertStatus: string | null; // Cert Status in a stapled response
  tickets: number; // post-handshake New Session Tickets
  secretsPrinted: string[]; // "Master-Key", "Resumption PSK" lines with a value
  errorReasons: string[]; // reason strings of the OpenSSL error stack
}

/** The output, explained. */
export interface OutputExplanation {
  recognised: boolean; // something s_client prints was found
  layout: "full" | "brief" | "unknown"; // the default report or -brief
  lines: number; // lines read
  truncated: boolean; // the input hit a cap
  items: OutputItem[]; // every line or block, in order
  connections: ConnectionSummary[]; // one per handshake
  findings: Finding[]; // what is worth flagging
}

/** A fresh, empty connection summary. */
function newConnection(index: number): ConnectionSummary {
  return { // all unknown
    index, connected: false, reused: null, cipherLineVersion: null, cipher: null, protocol: null, verifyCode: null, verifyText: null, // handshake
    verification: null, verifiedPeername: null, verifyErrors: [], chain: [], serverSubject: null, serverIssuer: null, noPeerCertificate: false, // certificate
    peerSignatureType: null, peerSigningDigest: null, tempKey: null, serverKeyBits: null, handshakeRead: null, handshakeWritten: null, // crypto
    alpn: null, secureReneg: null, ems: null, ocsp: null, ocspCertStatus: null, tickets: 0, secretsPrinted: [], errorReasons: [], // the rest
  };
}

// ---- the patterns: anchored, bounded, no nested quantifiers ----
const RE_CONNECTED = /^CONNECTED\(([0-9A-Fa-f]{1,16})\)$/; // CONNECTED(00000003)
const RE_DEPTH = /^depth=(-?\d{1,4}) (.*)$/; // 3.5: depth=2 C=US, O=...; kept 3.0: depth=2 C = US, O = ...
const RE_VERIFY_ERROR = /^verify error:num=(\d{1,5}):(.*)$/; // verify error:num=20:unable to get local issuer certificate
const RE_VERIFY_RETURN = /^verify return:(-?\d{1,3})$/; // verify return:1
const RE_VERIFY_DEPTH_IS = /^verify depth is (-?\d{1,6})$/; // verify depth is 5
const RE_NOT_BEFORE = /^notBefore=(.{1,80})$/; // after error 9
const RE_NOT_AFTER = /^notAfter=(.{1,80})$/; // after error 10
const RE_VERIFY_ISSUER = /^issuer= (.*)$/; // after error 2 (note the space)
const RE_ERR_STACK = /^([0-9A-Fa-f]{1,32}):error:([0-9A-Fa-f]{1,8}):([^:]{0,80}):([^:]{0,120}):([^:]{0,200}):(.*)$/; // ERR_print_errors format
const RE_CHAIN_S = /^ {0,3}(\d{1,3}) s:(.*)$/; // " 0 s:CN = ..."
const RE_CHAIN_I = /^ {1,8}i:(.*)$/; // "   i:CN = ..."
const RE_CHAIN_A = /^ {1,8}a:PKEY: ([^,]{1,64}), (?:(\d{1,6}) \(bit\)|\(([^)]{1,64})\)); sigalg: (.{1,128})$/; // 3.5: "   a:PKEY: RSA, 2048 (bit); sigalg: sha256WithRSAEncryption" or "EC, (prime256v1)"; kept 3.0: "rsaEncryption, 2048 (bit); sigalg: RSA-SHA256"
const RE_CHAIN_V = /^ {1,8}v:NotBefore: (.{1,64}); NotAfter: (.{1,64})$/; // "   v:NotBefore: ...; NotAfter: ..."
const RE_PEM_BEGIN = /^-----BEGIN ([A-Z0-9 ]{1,40})-----$/; // PEM start
const RE_PEM_END = /^-----END ([A-Z0-9 ]{1,40})-----$/; // PEM end
const RE_SUBJECT = /^subject=(.*)$/; // after the server certificate
const RE_ISSUER = /^issuer=(.*)$/; // after the server certificate
const RE_SIGALGS = /^(?:(?:Shared|Requested) ){0,2}Signature Algorithms: (.*)$/; // the sigalgs lists
const RE_PEER_DIGEST = /^Peer signing digest: (.{1,64})$/; // Peer signing digest: SHA256
const RE_PEER_SIGTYPE = /^Peer signature type: (.{1,64})$/; // 3.5: Peer signature type: rsa_pss_rsae_sha256; kept 3.0: RSA-PSS
const RE_TEMP_KEY = /^(Server|Peer) Temp Key: (.{1,96})$/; // 3.5: Peer Temp Key: X25519, 253 bits; kept 3.0: Server Temp Key
const RE_NEG_GROUP = /^Negotiated TLS1\.3 group: (.{1,64})$/; // 3.5: Negotiated TLS1.3 group: X25519MLKEM768
const RE_SCTS = /^SCTs present \((\d{1,4})\)$/; // -ct
const RE_SCT_STATUS = /^SCT validation status: (.{1,64})$/; // -ct
const RE_HANDSHAKE = /^SSL handshake has read (\d{1,20}) bytes and written (\d{1,20}) bytes$/; // the byte counts
const RE_VERIF_ERROR = /^Verification error: (.{1,200})$/; // print_verify_detail
const RE_PEERNAME = /^Verified peername: (.{1,255})$/; // print_verify_detail with a name check
const RE_DANE = /^DANE TLSA (\d{1,3}) (\d{1,3}) (\d{1,3}) (.{1,200})$/; // DANE result
const RE_CIPHER_LINE = /^(New|Reused), ([A-Za-z0-9.()/ -]{1,32}), Cipher is (\S{1,80})$/; // New, TLSv1.3, Cipher is ...
const RE_PROTOCOL_LINE = /^Protocol: (\S{1,32})$/; // 3.5: Protocol: TLSv1.3 (3.0 has no such line)
const RE_PUBKEY = /^Server public key is (\d{1,6}) bit$/; // Server public key is 2048 bit
const RE_COMPRESSION = /^Compression: (.{1,64})$/; // Compression: NONE
const RE_EXPANSION = /^Expansion: (.{1,64})$/; // Expansion: NONE
const RE_ALPN = /^ALPN protocol: (.{1,255})$/; // ALPN protocol: h2
const RE_NPN = /^Next protocol: \((-?\d{1,3})\) ?(.{0,255})$/; // NPN
const RE_SRTP = /^SRTP Extension negotiated, profile=(.{1,64})$/; // SRTP
const RE_EARLY = /^Early data was (not sent|rejected|accepted)$/; // TLS 1.3 early data
const RE_VERIFY_CODE = /^ {0,4}Verify return code: (\d{1,5}) \((.{0,200})\)$/; // Verify return code: 0 (ok)
const RE_SESSION_FIELD = /^ {4}([A-Za-z][A-Za-z -]{0,40}):(.*)$/; // "    Protocol  : TLSv1.3"
const RE_TICKET_HEX = /^ {4}[0-9a-f]{4} - /; // "    0000 - c1 a5 ..."
const RE_OCSP_LINE = /^OCSP responses?: ?(.*)$/; // OCSP response: ... / OCSP responses: ...
const RE_OCSP_FIELD = /^ {2,6}(OCSP Response Status|Cert Status|This Update|Next Update|Revocation Time|Revocation Reason|Responder Id|Produced At): (.{0,200})$/; // inside the OCSP block
const RE_BRIEF_PROTOCOL = /^Protocol version: (.{1,32})$/; // -brief
const RE_BRIEF_SUITE = /^Ciphersuite: (.{1,80})$/; // -brief
const RE_BRIEF_PEER = /^Peer certificate: (.{0,512})$/; // -brief
const RE_BRIEF_HASH = /^Hash used: (.{1,64})$/; // -brief
const RE_BRIEF_SIGTYPE = /^Signature type: (.{1,64})$/; // -brief
const RE_POINT_FORMATS = /^Supported Elliptic Curve Point Formats: (.{1,200})$/; // -brief, TLS 1.2
const RE_STATE = /^SSL_connect:(.{1,200})$/; // -state
const RE_ALERT = /^SSL3 alert (read|write):([a-z]{1,16}):(.{1,80})$/; // -state alerts
const RE_MSG = /^(>>>|<<<) ([^,\[]{1,24}), ([^\[]{1,40}) \[length ([0-9A-Fa-f]{1,8})\](.{0,120})$/; // -msg
const RE_MSG_HEX = /^ {3}(?: [0-9a-f]{2}){1,16}(?: \.\.\.)?$/; // -msg hex lines
const RE_DEBUG = /^(read from|write to) 0x[0-9a-f]{1,16} \[0x[0-9a-f]{1,16}\] \((.{1,80})\)$/; // -debug
const RE_HEX_DUMP = /^[0-9a-f]{4} - /; // BIO_dump lines (-debug, -tlsextdebug)
const RE_TLSEXT = /^TLS (client|server) extension "(.{1,64})" \(id=(\d{1,5})\), len=(\d{1,6})$/; // -tlsextdebug
const RE_ERRNO = /^(read|write):errno=(-?\d{1,6})$/; // socket errors
const RE_CONNECT_ERRNO = /^connect:errno=(\d{1,6})$/; // connect failure
const RE_LOCAL_PORT = /^LOCAL PORT is (\d{1,5})$/; // with TLS tracing
const RE_CONNECTING = /^Connecting to (\S{1,255})$/; // 3.5 (apps/lib/s_socket.c init_client): the address connected to; 3.0 has no such line

/** Fixed lines: exact text -> kind. */
const FIXED: ReadonlyMap<string, ItemKind> = new Map<string, ItemKind>([
  ["---", "separator"], // block separator
  ["Certificate chain", "chain-header"], // the chain list
  ["Server certificate", "server-certificate"], // the server certificate
  ["no peer certificate available", "no-peer-cert"], // no certificate
  ["No client certificate CA names sent", "ca-names-none"], // no CertificateRequest CA list
  ["Acceptable client certificate CA names", "ca-names"], // the CA list follows
  ["Verification: OK", "verification-ok"], // print_verify_detail
  ["Secure Renegotiation IS supported", "secure-reneg"], // RFC 5746 yes
  ["Secure Renegotiation IS NOT supported", "secure-reneg"], // RFC 5746 no
  ["This TLS version forbids renegotiation.", "secure-reneg"], // 3.5 wording under TLS 1.3 (3.0 printed IS NOT supported)
  ["No ALPN negotiated", "no-alpn"], // no ALPN
  ["Post-Handshake New Session Ticket arrived:", "ticket-arrived"], // TLS 1.3 ticket
  ["CONNECTION ESTABLISHED", "brief-established"], // -brief
  ["No peer certificate", "brief-no-peer"], // -brief, kept 3.0
  ["No peer certificate or raw public key", "brief-no-peer"], // -brief, 3.5
  ["read R BLOCK", "read-block"], // a read would block (data still expected)
  ["DONE", "done"], // end of the session
  ["closed", "closed"], // the connection is closed
  ["drop connection and then reconnect", "reconnect"], // -reconnect
  ["RENEGOTIATING", "renegotiating"], // the R command
  ["KEYUPDATE", "keyupdate"], // the k/K command
  ["CONNECTION CLOSED BY SERVER", "closed-by-server"], // the server closed
  ["no OCSP response(s) for certificate(s) found.", "verify-ocsp-none"], // kept 3.6 verify callback (not in 3.5)
  ["Using Kernel TLS for sending", "ktls"], // -ktls
  ["Using Kernel TLS for receiving", "ktls"], // -ktls
  ["Keying material exporter:", "keying-material"], // -keymatexport
  ["Connecting via TFO", "connecting"], // 3.5 with -tfo
  ["RECONNECTING", "reconnect"], // 3.5: the {reconnect} command
  ["Client-to-server raw public key negotiated", "rpk"], // 3.5 raw public keys (RFC 7250)
  ["Server-to-client raw public key negotiated", "rpk"], // 3.5 raw public keys
  ["Server raw public key", "rpk"], // 3.5 with -enable_server_rpk; the key follows
  ["no peer rpk available", "rpk"], // 3.5 with -enable_server_rpk
  ["Peer used raw public key", "rpk"], // 3.5 -brief
  ["", "blank"], // empty line
]);

/** The fixed explanation of each kind (the item's own values are read in `detail`). */
const EXPLAIN: Readonly<Record<ItemKind, Bilingual>> = Object.freeze({
  connected: bi("The TCP connection is open; the hexadecimal number is only the socket's file descriptor. Nothing about TLS has been decided yet: the handshake comes next.", "A conexão TCP está aberta; o número em hexadecimal é só o descritor do socket. Nada do TLS foi decidido ainda: o handshake vem a seguir."), // CONNECTED
  "verify-depth": bi("The verification callback reports on one certificate of the chain: depth 0 is the server's own certificate, 1 its issuer, and so on up. OpenSSL walks from the top (the root) down to depth 0, and may visit a depth twice when an error is found.", "O callback de verificação relata um certificado da cadeia: profundidade 0 é o certificado do próprio servidor, 1 o emissor dele, e assim por diante. O OpenSSL percorre do topo (a raiz) até a profundidade 0, e pode passar duas vezes por uma profundidade quando acha um erro."), // depth=
  "verify-error": bi("A verification error on the certificate named by the depth= line just above: the number is the X509_V_ERR code and the text its message.", "Um erro de verificação no certificado indicado pela linha depth= logo acima: o número é o código X509_V_ERR e o texto, a mensagem dele."), // verify error
  "verify-return": bi("What the callback answered for this certificate: 1 means carry on. s_client answers 1 even after an error unless -verify_return_error was given, which is why the handshake continues.", "O que o callback respondeu para este certificado: 1 quer dizer seguir. O s_client responde 1 mesmo depois de um erro, a menos que haja -verify_return_error, e é por isso que o handshake continua."), // verify return
  "verify-issuer": bi("For error 2 (unable to get issuer certificate), the issuer name OpenSSL was looking for.", "No erro 2 (unable to get issuer certificate), o nome do emissor que o OpenSSL procurava."), // issuer=
  "verify-not-before": bi("For a not-yet-valid certificate, its notBefore date.", "Para um certificado ainda não válido, a data notBefore dele."), // notBefore=
  "verify-not-after": bi("For an expired certificate, its notAfter date.", "Para um certificado expirado, a data notAfter dele."), // notAfter=
  "verify-depth-is": bi("Printed by -verify: the maximum chain depth asked for.", "Impresso pelo -verify: a profundidade máxima de cadeia pedida."), // verify depth is
  "verify-ocsp-none": bi("OpenSSL 3.6 only (3.5 has neither the line nor the options): with -ocsp_check_leaf or -ocsp_check_all, no OCSP response could be found for the certificates checked.", "Só no OpenSSL 3.6 (o 3.5 não tem a linha nem as opções): com -ocsp_check_leaf ou -ocsp_check_all, não se achou resposta OCSP para os certificados conferidos."), // no OCSP
  "error-stack": bi("An entry of OpenSSL's error queue: process or thread id, \"error\", an 8-digit hexadecimal code, the library, the function, the reason, then the source file and line. The reason field is the part to read.", "Uma entrada da fila de erros do OpenSSL: id do processo ou thread, \"error\", um código hexadecimal de 8 dígitos, a biblioteca, a função, o motivo, e depois arquivo e linha do código-fonte. O campo de motivo é o que importa."), // error stack
  separator: bi("A separator s_client prints between blocks.", "Um separador que o s_client imprime entre blocos."), // ---
  "chain-header": bi("The certificates the server sent, in the order it sent them, with depth 0 first. This is the list as received, not a verified chain: a missing intermediate is simply absent.", "Os certificados que o servidor enviou, na ordem em que vieram, com a profundidade 0 primeiro. É a lista como recebida, não uma cadeia verificada: uma intermediária ausente simplesmente não aparece."), // Certificate chain
  "chain-entry": bi("One certificate the server sent: s: is its subject, i: its issuer, a: its public key and the algorithm that signed it, v: its validity dates. Each i: should equal the next entry's s:, ending at a root the client already holds.", "Um certificado que o servidor enviou: s: é o subject, i: o emissor, a: a chave pública e o algoritmo que o assinou, v: as datas de validade. Cada i: deveria ser igual ao s: da entrada seguinte, terminando numa raiz que o cliente já tem."), // chain entry
  pem: bi("A certificate in PEM (base64 of its DER encoding). Paste it into the X.509 inspector to read every field, or several of them into the certificate chain builder to order and verify them.", "Um certificado em PEM (base64 da codificação DER). Cole no X.509 inspector para ler cada campo, ou vários no certificate chain builder para ordená-los e verificá-los."), // PEM
  "server-certificate": bi("The server's own certificate (depth 0). Without -showcerts it is printed in PEM here; with -showcerts it was already printed in the chain list.", "O certificado do próprio servidor (profundidade 0). Sem -showcerts ele sai em PEM aqui; com -showcerts já saiu na lista da cadeia."), // Server certificate
  subject: bi("The subject name of the server's certificate.", "O subject do certificado do servidor."), // subject=
  issuer: bi("The issuer name of the server's certificate: the CA that signed it.", "O issuer do certificado do servidor: a CA que o assinou."), // issuer=
  "no-peer-cert": bi("No server certificate was received or kept: the handshake failed before (or because of) the certificate step.", "Nenhum certificado do servidor foi recebido ou mantido: o handshake falhou antes (ou por causa) da etapa do certificado."), // no peer cert
  "ca-names-none": bi("The server did not ask for a client certificate with a list of acceptable CAs (it may not have asked for a client certificate at all).", "O servidor não pediu certificado de cliente com uma lista de CAs aceitas (pode nem ter pedido certificado de cliente)."), // no CA names
  "ca-names": bi("The server asks for a client certificate and lists the CAs it accepts; the names follow. A client certificate from another CA will be refused.", "O servidor pede certificado de cliente e lista as CAs que aceita; os nomes vêm a seguir. Um certificado de cliente de outra CA será recusado."), // CA names
  "client-cert-types": bi("The client certificate key types the server's request allows.", "Os tipos de chave de certificado de cliente que o pedido do servidor permite."), // cert types
  sigalgs: bi("Signature algorithms the server listed in its certificate request (Requested) or that both sides share (Shared).", "Algoritmos de assinatura que o servidor listou no pedido de certificado (Requested) ou que os dois lados compartilham (Shared)."), // sigalgs
  "peer-signing-digest": bi("The hash the server used in its handshake signature (CertificateVerify in TLS 1.3, ServerKeyExchange in TLS 1.2).", "O hash que o servidor usou na assinatura do handshake (CertificateVerify no TLS 1.3, ServerKeyExchange no TLS 1.2)."), // digest
  "peer-signature-type": bi("The signature algorithm the server used to prove it holds the certificate's private key during the handshake. OpenSSL 3.5 prints its IANA signature scheme name (rsa_pss_rsae_sha256, ecdsa_secp256r1_sha256...); OpenSSL 3.0 printed a short type (RSA-PSS, ECDSA).", "O algoritmo de assinatura que o servidor usou para provar, durante o handshake, que tem a chave privada do certificado. O OpenSSL 3.5 imprime o nome IANA do signature scheme (rsa_pss_rsae_sha256, ecdsa_secp256r1_sha256...); o OpenSSL 3.0 imprimia um tipo curto (RSA-PSS, ECDSA)."), // sig type
  "temp-key": bi("The server's ephemeral key for the key exchange: the group or curve and its size as OpenSSL reports it. A fresh key per connection is what gives forward secrecy. OpenSSL 3.5 says \"Peer Temp Key\"; OpenSSL 3.0 said \"Server Temp Key\".", "A chave efêmera do servidor para a troca de chaves: o group ou a curva e o tamanho como o OpenSSL relata. Uma chave nova por conexão é o que dá forward secrecy. O OpenSSL 3.5 diz \"Peer Temp Key\"; o OpenSSL 3.0 dizia \"Server Temp Key\"."), // temp key
  "negotiated-group": bi("OpenSSL 3.5 under TLS 1.3, when no temporary key object is available: the key-exchange group that was negotiated (X25519MLKEM768 is the hybrid post-quantum group first in OpenSSL 3.5's default list).", "OpenSSL 3.5 no TLS 1.3, quando não há objeto de chave temporária: o group de troca de chaves negociado (X25519MLKEM768 é o group híbrido pós-quântico que lidera a lista padrão do OpenSSL 3.5)."), // negotiated group
  scts: bi("With -ct: how many Certificate Transparency SCTs came with the certificate.", "Com -ct: quantos SCTs de Certificate Transparency vieram com o certificado."), // SCTs
  "sct-status": bi("With -ct: the validation status of one SCT.", "Com -ct: o status de validação de um SCT."), // SCT status
  "handshake-bytes": bi("How many bytes s_client read from and wrote to the socket during the handshake. Reading 0 bytes means the server sent nothing back.", "Quantos bytes o s_client leu e escreveu no socket durante o handshake. Ler 0 bytes quer dizer que o servidor não devolveu nada."), // handshake bytes
  "verification-ok": bi("The chain verified against the trust store. It does not mean a host name was checked: that only happens with -verify_hostname or -verify_ip, and then a Verified peername line follows.", "A cadeia foi verificada contra o trust store. Não quer dizer que um hostname foi conferido: isso só acontece com -verify_hostname ou -verify_ip, e aí vem uma linha Verified peername."), // Verification: OK
  "verification-error": bi("The chain did not verify; the text is the message of the last verification error.", "A cadeia não foi verificada; o texto é a mensagem do último erro de verificação."), // Verification error
  "verified-peername": bi("The name the certificate was matched against, because -verify_hostname (or -verify_ip, or DANE) asked for a name check and it passed.", "O nome contra o qual o certificado foi conferido, porque -verify_hostname (ou -verify_ip, ou DANE) pediu checagem de nome e ela passou."), // Verified peername
  dane: bi("DANE TLSA result: the record (usage, selector, matching type, the tail of the data) and what it matched.", "Resultado do DANE TLSA: o registro (usage, selector, matching type, o fim dos dados) e o que ele casou."), // DANE
  "cipher-line": bi("\"New\" is a full handshake, \"Reused\" a resumed session. Careful: the version on this line is the protocol version that first defined the cipher (SSL_CIPHER_get_version), not necessarily the version negotiated; the negotiated one is the Protocol line or the SSL-Session block.", "\"New\" é um handshake completo, \"Reused\" uma sessão retomada. Atenção: a versão nesta linha é a versão do protocolo que definiu o cipher pela primeira vez (SSL_CIPHER_get_version), não necessariamente a versão negociada; a negociada é a linha Protocol ou o bloco SSL-Session."), // New, ...
  "protocol-line": bi("The protocol version actually negotiated (OpenSSL 3.5 prints this line; 3.0 did not).", "A versão do protocolo efetivamente negociada (o OpenSSL 3.5 imprime esta linha; o 3.0 não imprimia)."), // Protocol:
  "server-public-key": bi("The size of the public key in the server's certificate.", "O tamanho da chave pública do certificado do servidor."), // public key
  "secure-reneg": bi("Whether the server supports secure renegotiation (the renegotiation_info extension of RFC 5746). TLS 1.3 has no renegotiation at all: OpenSSL 3.5 prints \"This TLS version forbids renegotiation.\" there; OpenSSL 3.0 printed \"IS NOT supported\".", "Se o servidor suporta renegociação segura (a extensão renegotiation_info da RFC 5746). O TLS 1.3 não tem renegociação: o OpenSSL 3.5 imprime \"This TLS version forbids renegotiation.\" nesse caso; o OpenSSL 3.0 imprimia \"IS NOT supported\"."), // renegotiation
  compression: bi("TLS-level compression; NONE is expected (off by default since OpenSSL 1.1.0).", "Compressão no nível do TLS; NONE é o esperado (desligada por padrão desde o OpenSSL 1.1.0)."), // Compression
  expansion: bi("The decompression side of TLS compression; NONE is expected.", "O lado de descompressão da compressão TLS; NONE é o esperado."), // Expansion
  alpn: bi("The application protocol the server picked from the -alpn list (RFC 7301): h2 is HTTP/2, http/1.1 is HTTP/1.1.", "O protocolo de aplicação que o servidor escolheu da lista do -alpn (RFC 7301): h2 é HTTP/2, http/1.1 é HTTP/1.1."), // ALPN
  "no-alpn": bi("No application protocol was negotiated: either the command sent no -alpn, or the server chose none of the offered protocols.", "Nenhum protocolo de aplicação foi negociado: ou o comando não mandou -alpn, ou o servidor não escolheu nenhum dos oferecidos."), // no ALPN
  npn: bi("The protocol negotiated through NPN (-nextprotoneg), the predecessor of ALPN.", "O protocolo negociado via NPN (-nextprotoneg), o antecessor do ALPN."), // NPN
  srtp: bi("The SRTP profile negotiated (-use_srtp).", "O perfil SRTP negociado (-use_srtp)."), // SRTP
  "early-data": bi("TLS 1.3 0-RTT early data: whether any was sent and what the server did with it.", "Early data 0-RTT do TLS 1.3: se algo foi enviado e o que o servidor fez com isso."), // early data
  "verify-return-code": bi("The final result of the certificate verification: 0 (ok) or the code of the error (see the list of codes). s_client prints it whether or not the handshake was allowed to go on.", "O resultado final da verificação do certificado: 0 (ok) ou o código do erro (veja a lista de códigos). O s_client imprime isso tendo ou não permitido que o handshake seguisse."), // Verify return code
  "keying-material": bi("Output of -keymatexport: the label, the length and the exported keying material.", "Saída do -keymatexport: o label, o tamanho e o keying material exportado."), // keying material
  "ssl-session": bi("The session parameters (SSL_SESSION_print). In TLS 1.2 they are printed once after the handshake; in TLS 1.3 once per New Session Ticket. Master-Key (TLS 1.2) and Resumption PSK (TLS 1.3) are secrets of this session.", "Os parâmetros da sessão (SSL_SESSION_print). No TLS 1.2 saem uma vez depois do handshake; no TLS 1.3, uma vez por New Session Ticket. Master-Key (TLS 1.2) e Resumption PSK (TLS 1.3) são segredos desta sessão."), // SSL-Session
  "ticket-arrived": bi("TLS 1.3 servers send session tickets after the handshake, encrypted like application data (RFC 9846, section 4.7.1); s_client prints the session each ticket stands for. Several tickets per connection are normal.", "Servidores TLS 1.3 enviam session tickets depois do handshake, cifrados como dados de aplicação (RFC 9846, seção 4.7.1); o s_client imprime a sessão que cada ticket representa. Vários tickets por conexão são normais."), // ticket
  "ocsp-none": bi("-status asked the server to staple an OCSP response (the status_request extension, RFC 6066 section 8) and none came back.", "-status pediu ao servidor uma resposta OCSP via stapling (a extensão status_request, RFC 6066 seção 8) e nada voltou."), // OCSP none
  "ocsp-response": bi("The OCSP response the server stapled, printed in full between the ===== lines: read the response status, the Cert Status (good, revoked or unknown, RFC 6960) and the This Update / Next Update window.", "A resposta OCSP que o servidor enviou via stapling, impressa por inteiro entre as linhas =====: leia o status da resposta, o Cert Status (good, revoked ou unknown, RFC 6960) e a janela This Update / Next Update."), // OCSP response
  "brief-established": bi("-brief: the handshake finished; a short summary follows.", "-brief: o handshake terminou; segue um resumo curto."), // CONNECTION ESTABLISHED
  "brief-protocol": bi("-brief: the protocol version negotiated.", "-brief: a versão do protocolo negociada."), // Protocol version
  "brief-ciphersuite": bi("-brief: the cipher suite negotiated.", "-brief: a cipher suite negociada."), // Ciphersuite
  "brief-peer-cert": bi("-brief: the subject of the server's certificate.", "-brief: o subject do certificado do servidor."), // Peer certificate
  "brief-hash": bi("-brief: the hash in the server's handshake signature.", "-brief: o hash da assinatura do servidor no handshake."), // Hash used
  "brief-sigtype": bi("-brief: the server's handshake signature algorithm (in OpenSSL 3.5 its IANA signature scheme name).", "-brief: o algoritmo de assinatura do servidor no handshake (no OpenSSL 3.5, o nome IANA do signature scheme)."), // Signature type
  "brief-no-peer": bi("-brief: the server presented no certificate.", "-brief: o servidor não apresentou certificado."), // no peer
  "point-formats": bi("TLS 1.2: the elliptic-curve point formats the server supports.", "TLS 1.2: os formatos de ponto de curva elíptica que o servidor suporta."), // point formats
  state: bi("-state: one step of the client's handshake state machine.", "-state: um passo da máquina de estados do handshake do cliente."), // state
  alert: bi("-state: a TLS alert read or written, with its level and description. A close notify warning is the normal end of a connection.", "-state: um alerta TLS lido ou escrito, com nível e descrição. Um close notify de nível warning é o fim normal de uma conexão."), // alert
  msg: bi("-msg: one protocol message: >>> sent, <<< received, the record version, the content type, its length in hex and, for handshake messages, which one.", "-msg: uma mensagem do protocolo: >>> enviada, <<< recebida, a versão do record, o content type, o tamanho em hex e, para mensagens de handshake, qual delas."), // msg
  "msg-hex": bi("-msg: the bytes of the message above, in hex.", "-msg: os bytes da mensagem acima, em hex."), // msg hex
  debug: bi("-debug: one read from or write to the socket, with the number of bytes.", "-debug: uma leitura ou escrita no socket, com o número de bytes."), // debug
  "hex-dump": bi("A hex dump (offset, bytes, printable characters).", "Um dump em hex (offset, bytes, caracteres imprimíveis)."), // hex dump
  tlsext: bi("-tlsextdebug: one TLS extension the server sent, with its number and length; its bytes follow.", "-tlsextdebug: uma extensão TLS que o servidor enviou, com número e tamanho; os bytes vêm a seguir."), // tlsext
  "read-block": bi("A read would have blocked: s_client is waiting for more data from the server.", "Uma leitura teria bloqueado: o s_client está esperando mais dados do servidor."), // read R BLOCK
  done: bi("s_client has finished with the connection.", "O s_client terminou com a conexão."), // DONE
  closed: bi("The connection is closed (the input ended or the server closed it).", "A conexão está fechada (a entrada acabou ou o servidor fechou)."), // closed
  reconnect: bi("-reconnect: the connection is dropped and a new one opened to try resuming the session.", "-reconnect: a conexão é derrubada e outra é aberta para tentar retomar a sessão."), // reconnect
  renegotiating: bi("The R command: a renegotiation was started (TLS 1.2 and below).", "O comando R: começou uma renegociação (TLS 1.2 e anteriores)."), // renegotiating
  keyupdate: bi("The k or K command: a TLS 1.3 KeyUpdate was sent.", "O comando k ou K: um KeyUpdate do TLS 1.3 foi enviado."), // keyupdate
  "closed-by-server": bi("The server closed the connection.", "O servidor fechou a conexão."), // closed by server
  errno: bi("A socket read or write failed with this system error number.", "Uma leitura ou escrita no socket falhou com este número de erro do sistema."), // errno
  "connect-errno": bi("The TCP connection failed with this system error number (for example connection refused or timed out): TLS never started.", "A conexão TCP falhou com este número de erro do sistema (por exemplo conexão recusada ou timeout): o TLS nem começou."), // connect errno
  ktls: bi("Kernel TLS is in use for this direction (-ktls).", "O TLS do kernel está em uso nesta direção (-ktls)."), // ktls
  connecting: bi("OpenSSL 3.5: the address the TCP connection was opened to, printed on standard error once it is open (with a host name, it shows which of its addresses answered). OpenSSL 3.0 printed no such line.", "OpenSSL 3.5: o endereço para o qual a conexão TCP foi aberta, impresso na saída de erro assim que ela abre (com um nome de host, mostra qual dos endereços respondeu). O OpenSSL 3.0 não imprimia esta linha."), // Connecting to
  rpk: bi("A raw public key (RFC 7250) was negotiated or offered in place of an X.509 certificate (OpenSSL 3.2 and later; options -enable_server_rpk and -enable_client_rpk).", "Uma raw public key (RFC 7250) foi negociada ou oferecida no lugar de um certificado X.509 (OpenSSL 3.2 em diante; opções -enable_server_rpk e -enable_client_rpk)."), // raw public keys
  "local-port": bi("The local port of the connection (printed with TLS tracing).", "A porta local da conexão (impressa com trace de TLS)."), // local port
  blank: bi("An empty line.", "Uma linha vazia."), // blank
  data: bi("Not part of s_client's report: most likely data the server sent after the handshake (an HTTP response, an SMTP banner) or text this explainer does not recognise. It is kept as is.", "Não faz parte do relatório do s_client: muito provavelmente dados que o servidor enviou depois do handshake (uma resposta HTTP, um banner SMTP) ou texto que este explicador não reconhece. Fica como está."), // data
});

/** Explanations of the SSL-Session fields (by the label before the colon). */
export const SESSION_FIELDS: Readonly<Record<string, Bilingual>> = Object.freeze({
  Protocol: bi("The protocol version of the session: the version actually negotiated.", "A versão do protocolo da sessão: a versão efetivamente negociada."), // Protocol
  Cipher: bi("The cipher suite of the session.", "A cipher suite da sessão."), // Cipher
  "Session-ID": bi("The session identifier. In TLS 1.3 it is not sent on the wire for resumption; OpenSSL still shows one.", "O identificador da sessão. No TLS 1.3 ele não vai na rede para retomada; o OpenSSL ainda mostra um."), // Session-ID
  "Session-ID-ctx": bi("The session ID context (empty in a client).", "O contexto do session ID (vazio num cliente)."), // Session-ID-ctx
  "Master-Key": bi("The TLS 1.2 master secret (48 bytes, RFC 5246 section 8.1): every traffic key of this session derives from it (section 6.3). Together with a capture of the traffic it decrypts the session; never share it.", "O master secret do TLS 1.2 (48 bytes, RFC 5246 seção 8.1): toda chave de tráfego desta sessão deriva dele (seção 6.3). Junto com uma captura do tráfego, ele decifra a sessão; nunca compartilhe."), // Master-Key
  "Resumption PSK": bi("The TLS 1.3 pre-shared key this ticket stands for (RFC 9846, section 4.7.1): whoever holds it and the ticket can resume the session as this client. Treat it like a password.", "A pre-shared key do TLS 1.3 que este ticket representa (RFC 9846, seção 4.7.1): quem tiver ela e o ticket consegue retomar a sessão como este cliente. Trate como senha."), // Resumption PSK
  "PSK identity": bi("The PSK identity, when a PSK suite was used.", "A identidade PSK, quando se usou uma suite PSK."), // PSK identity
  "PSK identity hint": bi("The server's PSK identity hint, when a PSK suite was used.", "A dica de identidade PSK do servidor, quando se usou uma suite PSK."), // PSK identity hint
  "SRP username": bi("The SRP user name, when SRP was used.", "O usuário SRP, quando se usou SRP."), // SRP username
  "TLS session ticket lifetime hint": bi("How long the server says the ticket may be used, in seconds (TLS 1.3 caps it at 7 days, RFC 9846 section 4.7.1).", "Por quanto tempo o servidor diz que o ticket pode ser usado, em segundos (o TLS 1.3 limita a 7 dias, RFC 9846 seção 4.7.1)."), // lifetime hint
  "TLS session ticket": bi("The ticket itself, an opaque value only the server can read; the hex dump follows.", "O ticket em si, um valor opaco que só o servidor lê; o dump em hex vem a seguir."), // ticket
  Compression: bi("The compression method of the session, when not null.", "O método de compressão da sessão, quando não é nulo."), // Compression
  "Start Time": bi("When the session started, in seconds since 1970 (Unix time).", "Quando a sessão começou, em segundos desde 1970 (Unix time)."), // Start Time
  Timeout: bi("How long the client keeps the session for resumption, in seconds.", "Por quanto tempo o cliente guarda a sessão para retomada, em segundos."), // Timeout
  "Verify return code": bi("The certificate verification result stored with the session.", "O resultado da verificação do certificado guardado com a sessão."), // Verify return code
  "Extended master secret": bi("Whether the session used the extended master secret (RFC 7627, renamed extended main secret by RFC 9846). For TLS 1.2 it should say yes (RFC 9325 section 3.5); under TLS 1.3 OpenSSL prints no, but TLS 1.3 always binds its secrets to the handshake transcript (RFC 9846, Appendix E).", "Se a sessão usou o extended master secret (RFC 7627, renomeado extended main secret pela RFC 9846). No TLS 1.2 deveria dizer yes (RFC 9325 seção 3.5); no TLS 1.3 o OpenSSL imprime no, mas o TLS 1.3 sempre amarra os segredos à transcrição do handshake (RFC 9846, Apêndice E)."), // EMS
  "Max Early Data": bi("How many bytes of 0-RTT early data this ticket allows (0: none).", "Quantos bytes de early data 0-RTT este ticket permite (0: nenhum)."), // Max Early Data
});

/** Explanations of the -state lines that matter most (by the text after SSL_connect:). */
const STATE_HINTS: ReadonlyArray<[RegExp, Bilingual]> = [
  [/^before SSL initialization$/, bi("The client is about to start the handshake.", "O cliente está para começar o handshake.")], // start
  [/write client hello$/, bi("The ClientHello went out (versions, cipher suites, SNI, ALPN, key shares).", "O ClientHello saiu (versões, cipher suites, SNI, ALPN, key shares).")], // ClientHello
  [/read server hello$/, bi("The ServerHello arrived: version and cipher suite are chosen.", "O ServerHello chegou: versão e cipher suite estão escolhidas.")], // ServerHello
  [/read encrypted extensions$/, bi("TLS 1.3: the server's encrypted extensions (ALPN among them) arrived.", "TLS 1.3: as extensões cifradas do servidor (ALPN entre elas) chegaram.")], // EncryptedExtensions
  [/read server certificate$/, bi("The server's certificate chain arrived.", "A cadeia de certificados do servidor chegou.")], // Certificate
  [/read server certificate verify$/, bi("TLS 1.3: the server proved it holds the certificate's private key.", "TLS 1.3: o servidor provou que tem a chave privada do certificado.")], // CertificateVerify
  [/read server key exchange$/, bi("TLS 1.2: the server's ephemeral key share arrived, signed.", "TLS 1.2: o key share efêmero do servidor chegou, assinado.")], // ServerKeyExchange
  [/read finished$/, bi("The peer's Finished message arrived and checked out.", "A mensagem Finished do outro lado chegou e conferiu.")], // Finished in
  [/write finished$/, bi("The client's Finished message went out.", "A mensagem Finished do cliente saiu.")], // Finished out
  [/write change cipher spec$/, bi("A ChangeCipherSpec went out (in TLS 1.3, only the middlebox-compatibility dummy).", "Um ChangeCipherSpec saiu (no TLS 1.3, só o falso de compatibilidade com middleboxes).")], // CCS
  [/read server session ticket$/, bi("A session ticket arrived.", "Chegou um session ticket.")], // ticket
  [/SSL negotiation finished successfully$/, bi("The handshake is complete.", "O handshake está completo.")], // done
  [/^(failed|error) in /, bi("The handshake failed at this step; the error stack says why.", "O handshake falhou neste passo; a fila de erros diz o porquê.")], // failure
];

/** Every pattern a line can match, for telling s_client's lines from server data. */
const LINE_PATTERNS: readonly RegExp[] = [
  RE_CONNECTED, RE_DEPTH, RE_VERIFY_ERROR, RE_VERIFY_RETURN, RE_VERIFY_DEPTH_IS, RE_NOT_BEFORE, RE_NOT_AFTER, RE_VERIFY_ISSUER, // verify lines
  RE_ERR_STACK, RE_PEM_BEGIN, RE_SIGALGS, RE_PEER_DIGEST, RE_PEER_SIGTYPE, RE_TEMP_KEY, RE_NEG_GROUP, RE_SCTS, RE_SCT_STATUS, // certificate and keys
  RE_HANDSHAKE, RE_VERIF_ERROR, RE_PEERNAME, RE_DANE, RE_CIPHER_LINE, RE_PROTOCOL_LINE, RE_PUBKEY, RE_COMPRESSION, RE_EXPANSION, // report
  RE_ALPN, RE_NPN, RE_SRTP, RE_EARLY, RE_VERIFY_CODE, RE_OCSP_LINE, RE_BRIEF_PROTOCOL, RE_BRIEF_SUITE, RE_BRIEF_PEER, RE_BRIEF_HASH, // report and -brief
  RE_BRIEF_SIGTYPE, RE_POINT_FORMATS, RE_STATE, RE_ALERT, RE_MSG, RE_MSG_HEX, RE_DEBUG, RE_HEX_DUMP, RE_TLSEXT, RE_ERRNO, // -brief, -state, -msg, -debug
  RE_CONNECT_ERRNO, RE_LOCAL_PORT, RE_CONNECTING, // errors, tracing, the address
];

/** True when a line is one s_client prints (a fixed line, the SSL-Session header, or any pattern above). */
function isRecognisedLine(s: string): boolean {
  return FIXED.has(s) || s === "SSL-Session:" || LINE_PATTERNS.some((re) => re.test(s)); // bounded: a fixed set of anchored patterns
}

/**
 * Explain the text s_client printed. Pure: the same text always gives the
 * same items, summaries and findings.
 */
export function explainOutput(input: string): OutputExplanation {
  const truncated = input.length > MAX_OUTPUT_LENGTH; // hit the size cap
  let lines = input.slice(0, MAX_OUTPUT_LENGTH).split(/\r?\n/); // the lines
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop(); // a final newline adds no line
  const lineCapped = lines.length > MAX_OUTPUT_LINES; // hit the line cap
  if (lineCapped) lines = lines.slice(0, MAX_OUTPUT_LINES); // keep the head
  lines = lines.map((l) => (l.length > MAX_LINE_LENGTH ? l.slice(0, MAX_LINE_LENGTH) : l)); // cut long lines
  const items: OutputItem[] = []; // the result
  const conns: ConnectionSummary[] = [newConnection(1)]; // one connection to start with
  let cur = conns[0]; // the current connection
  let lastDepth: { depth: number; subject: string } | null = null; // the depth= line before a verify error
  let recognised = 0; // count of s_client lines
  let brief = false; // a -brief layout was seen
  let full = false; // the full layout was seen
  let inChain = false; // inside "Certificate chain"
  let afterServerCert = false; // after "Server certificate", before the next ---
  let ticketPending = false; // a ticket arrived, its SSL-Session follows
  let ocspAsked = false; // an OCSP line was seen (for this connection)

  /** Append an item. */
  const add = (kind: ItemKind, start: number, end: number, fields: Record<string, string> = {}, detail: Bilingual | null = null) => {
    items.push({ kind, start: start + 1, end: end + 1, text: lines.slice(start, end + 1).join("\n"), fields, connection: cur.index, explain: EXPLAIN[kind], detail }); // 1-based lines
    if (kind !== "data" && kind !== "blank") recognised += 1; // count what s_client prints
  };
  /** Start a new connection when this one has already connected. */
  const nextConnection = () => { cur = newConnection(conns.length + 1); conns.push(cur); ocspAsked = false; }; // a new handshake

  let i = 0; // the line being read
  while (i < lines.length) { // one pass, with blocks consuming several lines
    const line = lines[i]; // this line
    let m: RegExpMatchArray | null; // a match

    // ---- PEM blocks (inside the chain with -showcerts, after Server certificate, or anywhere) ----
    if ((m = line.match(RE_PEM_BEGIN))) { // a PEM block starts
      let j = i + 1; // look for its end
      while (j < lines.length && !RE_PEM_END.test(lines[j]) && j - i < 400) j += 1; // bounded search
      const end = j < lines.length && RE_PEM_END.test(lines[j]) ? j : i; // the END line, or a lone BEGIN
      if (inChain && cur.chain.length > 0) cur.chain[cur.chain.length - 1].pem = true; // -showcerts: belongs to the last chain entry
      add("pem", i, end, { type: m[1], lines: String(end - i + 1) }, null); // the block
      i = end + 1; // past it
      continue; // next line
    }

    // ---- the chain list ----
    if (inChain && (m = line.match(RE_CHAIN_S))) { // " 0 s:..."
      const entry: ChainEntry = { depth: Number(m[1]), subject: m[2], issuer: "", keyType: null, keyBits: null, keyCurve: null, sigalg: null, notBefore: null, notAfter: null, pem: false }; // new entry
      let j = i + 1; // read its i:, a:, v: lines
      let mm: RegExpMatchArray | null; // sub-match
      if (j < lines.length && (mm = lines[j].match(RE_CHAIN_I))) { entry.issuer = mm[1]; j += 1; } // issuer
      if (j < lines.length && (mm = lines[j].match(RE_CHAIN_A))) { entry.keyType = mm[1]; entry.keyBits = mm[2] ? Number(mm[2]) : null; entry.keyCurve = mm[3] ?? null; entry.sigalg = mm[4]; j += 1; } // key and signature
      if (j < lines.length && (mm = lines[j].match(RE_CHAIN_V))) { entry.notBefore = mm[1]; entry.notAfter = mm[2]; j += 1; } // validity
      cur.chain.push(entry); // keep it
      const selfIssued = entry.subject === entry.issuer; // a root or self-signed certificate
      add("chain-entry", i, j - 1, { depth: m[1], subject: entry.subject, issuer: entry.issuer, keyType: entry.keyType ?? "", keyBits: entry.keyBits === null ? "" : String(entry.keyBits), keyCurve: entry.keyCurve ?? "", sigalg: entry.sigalg ?? "", notBefore: entry.notBefore ?? "", notAfter: entry.notAfter ?? "" }, // the item
        selfIssued ? bi(`Depth ${m[1]} is self-issued (subject equals issuer): a root, or a self-signed certificate.`, `A profundidade ${m[1]} é auto-emitida (subject igual ao issuer): uma raiz, ou um certificado auto-assinado.`) // root detail
          : entry.depth === 0 ? bi(`Depth 0 is the server's own certificate, issued by ${entry.issuer}.`, `A profundidade 0 é o certificado do próprio servidor, emitido por ${entry.issuer}.`) // leaf detail
            : bi(`Depth ${m[1]} is an intermediate (or cross-signed) CA certificate, issued by ${entry.issuer}.`, `A profundidade ${m[1]} é um certificado de CA intermediária (ou cross-signed), emitido por ${entry.issuer}.`)); // intermediate detail
      i = j; // past the entry
      continue; // next line
    }

    // ---- the OCSP line and its block ----
    if ((m = line.match(RE_OCSP_LINE))) { // OCSP response(s):
      ocspAsked = true; // -status was used
      const rest = m[1].trim(); // what follows the colon
      if (/^no( OCSP)? responses?( sent| received)?$/i.test(rest) || /^no responses sent$/i.test(rest)) { // nothing stapled (3.5 and 3.0: "no response sent"; kept 3.6 wordings)
        cur.ocsp = "none"; // none
        add("ocsp-none", i, i, { text: rest }); // the item
        i += 1; // next line
        continue; // done
      }
      // A stapled response: the block runs between two lines of "=" signs.
      let j = i + 1; // the opening ===== line, normally right after
      if (j < lines.length && /^={10,80}$/.test(lines[j])) { // opening rule
        let k2 = j + 1; // search the closing rule
        while (k2 < lines.length && !/^={10,80}$/.test(lines[k2]) && k2 - j < 2000) k2 += 1; // bounded
        const end = k2 < lines.length ? k2 : lines.length - 1; // the closing rule or the end
        const fields: Record<string, string> = { text: rest }; // the values read inside
        for (let x = j + 1; x < end; x++) { const f = lines[x].match(RE_OCSP_FIELD); if (f && !(f[1] in fields)) fields[f[1]] = f[2]; } // first value of each label
        cur.ocsp = "stapled"; // stapled
        cur.ocspCertStatus = fields["Cert Status"] ?? null; // good, revoked, unknown
        add("ocsp-response", i, end, fields, fields["Cert Status"] ? bi(`Cert Status: ${fields["Cert Status"]}${fields["Next Update"] ? `; valid until ${fields["Next Update"]} (Next Update)` : ""}.`, `Cert Status: ${fields["Cert Status"]}${fields["Next Update"] ? `; válida até ${fields["Next Update"]} (Next Update)` : ""}.`) : null); // the item
        i = end + 1; // past the block
        continue; // next line
      }
      add("ocsp-response", i, i, { text: rest }); // an OCSP line we cannot read further
      i += 1; // next line
      continue; // done
    }

    // ---- SSL-Session block ----
    if (line === "SSL-Session:") { // the session block
      const fields: Record<string, string> = {}; // label -> value
      let j = i + 1; // its lines
      while (j < lines.length && (lines[j].startsWith("    ") || lines[j] === "")) { // indented lines and the blank after the ticket dump
        if (lines[j] === "" && !(j + 1 < lines.length && lines[j + 1].startsWith("    "))) break; // a blank line not followed by more fields ends it
        const f = lines[j].match(RE_SESSION_FIELD); // "    Label: value"
        if (f && !RE_TICKET_HEX.test(lines[j])) fields[f[1].trim()] = f[2].trim(); // keep the field (not a hex line)
        j += 1; // next
      }
      const end = j - 1; // last line of the block
      if (fields.Protocol) cur.protocol = fields.Protocol; // the negotiated version
      if (fields.Cipher && !cur.cipher) cur.cipher = fields.Cipher; // the suite
      if (fields["Extended master secret"]) cur.ems = fields["Extended master secret"] === "yes" ? "yes" : "no"; // EMS
      if (fields["Verify return code"] && cur.verifyCode === null) { const vc = fields["Verify return code"].match(/^(\d{1,5}) \((.*)\)$/); if (vc) { cur.verifyCode = Number(vc[1]); cur.verifyText = vc[2]; } } // the code (TLS 1.2 report)
      for (const s of ["Master-Key", "Resumption PSK"]) if (fields[s] && /^[0-9A-Fa-f]{16,}$/.test(fields[s]) && !cur.secretsPrinted.includes(s)) cur.secretsPrinted.push(s); // secrets
      if (ticketPending) { cur.tickets += 1; ticketPending = false; } // a TLS 1.3 ticket's session
      add("ssl-session", i, end, fields, fields.Protocol ? bi(`Protocol ${fields.Protocol}, cipher ${fields.Cipher ?? "?"}${fields["TLS session ticket lifetime hint"] ? `, ticket lifetime hint ${fields["TLS session ticket lifetime hint"]}` : ""}.`, `Protocolo ${fields.Protocol}, cipher ${fields.Cipher ?? "?"}${fields["TLS session ticket lifetime hint"] ? `, dica de vida do ticket ${fields["TLS session ticket lifetime hint"]}` : ""}.`) : null); // the item
      full = true; // the full layout
      i = end + 1; // past the block
      continue; // next line
    }

    // ---- consecutive hex lines become one item ----
    if (RE_MSG_HEX.test(line)) { let j = i; while (j + 1 < lines.length && RE_MSG_HEX.test(lines[j + 1])) j += 1; add("msg-hex", i, j, { lines: String(j - i + 1) }); i = j + 1; continue; } // -msg bytes
    if (RE_HEX_DUMP.test(line)) { let j = i; while (j + 1 < lines.length && RE_HEX_DUMP.test(lines[j + 1])) j += 1; add("hex-dump", i, j, { lines: String(j - i + 1) }); i = j + 1; continue; } // BIO_dump lines

    // ---- fixed lines ----
    const fixed = FIXED.get(line); // exact text
    if (fixed !== undefined) { // a known fixed line
      if (fixed === "chain-header") { inChain = true; full = true; } // the chain list starts
      if (fixed === "separator") { inChain = false; afterServerCert = false; } // a block ends
      if (fixed === "server-certificate") { afterServerCert = true; inChain = false; } // the server certificate follows
      if (fixed === "no-peer-cert") cur.noPeerCertificate = true; // no certificate
      if (fixed === "verification-ok") cur.verification = "ok"; // chain verified
      if (fixed === "no-alpn") cur.alpn = ""; // none
      if (fixed === "secure-reneg") cur.secureReneg = line.includes("IS NOT") ? "not-supported" : line.startsWith("This TLS") ? "forbidden" : "supported"; // renegotiation
      if (fixed === "ticket-arrived") ticketPending = true; // its SSL-Session follows
      if (fixed === "brief-established") { if (cur.connected) nextConnection(); cur.connected = true; brief = true; } // -brief handshake done
      if (fixed === "brief-no-peer") cur.noPeerCertificate = true; // -brief: none
      if (fixed === "reconnect") { nextConnection(); } // -reconnect: a new connection follows
      if (fixed === "ca-names") { // the CA names follow until a separator or a known line
        let j = i + 1; // the names
        while (j < lines.length && lines[j] !== "---" && !/^(Client Certificate Types|Requested Signature|Shared Requested|Shared Signature|Peer signing|Peer signature|Server Temp|Peer Temp|Negotiated TLS1)/.test(lines[j]) && j - i < 500) j += 1; // bounded
        add("ca-names", i, j - 1, { count: String(j - i - 1) }); // the list
        i = j; // past it
        continue; // next line
      }
      add(fixed, i, i, fixed === "secure-reneg" ? { value: line } : {}); // the item
      i += 1; // next line
      continue; // done
    }

    // ---- pattern lines ----
    if ((m = line.match(RE_CONNECTED))) { if (cur.connected) nextConnection(); cur.connected = true; full = true; add("connected", i, i, { fd: m[1] }); i += 1; continue; } // CONNECTED(...)
    if ((m = line.match(RE_DEPTH))) { lastDepth = { depth: Number(m[1]), subject: m[2] }; add("verify-depth", i, i, { depth: m[1], subject: m[2] }, bi(Number(m[1]) === 0 ? "Depth 0: the server's own certificate." : `Depth ${m[1]}: a CA certificate above the server's.`, Number(m[1]) === 0 ? "Profundidade 0: o certificado do próprio servidor." : `Profundidade ${m[1]}: um certificado de CA acima do servidor.`)); i += 1; continue; } // depth=
    if ((m = line.match(RE_VERIFY_ERROR))) { // verify error:num=
      const num = Number(m[1]); // the code
      cur.verifyErrors.push({ num, text: m[2], depth: lastDepth?.depth ?? null, subject: lastDepth?.subject ?? null }); // remember it
      const vc = VERIFY_CODE_BY_NUMBER.get(num); // its row
      add("verify-error", i, i, { num: m[1], text: m[2], constant: vc?.constant ?? "" }, vc ? vc.meaning : null); // the item, with the code's meaning
      i += 1; // next line
      continue; // done
    }
    if ((m = line.match(RE_VERIFY_RETURN))) { add("verify-return", i, i, { value: m[1] }); i += 1; continue; } // verify return:1
    if ((m = line.match(RE_VERIFY_DEPTH_IS))) { add("verify-depth-is", i, i, { depth: m[1] }); i += 1; continue; } // verify depth is N
    if ((m = line.match(RE_NOT_BEFORE))) { add("verify-not-before", i, i, { date: m[1] }); i += 1; continue; } // notBefore=
    if ((m = line.match(RE_NOT_AFTER))) { add("verify-not-after", i, i, { date: m[1] }); i += 1; continue; } // notAfter=
    if ((m = line.match(RE_VERIFY_ISSUER))) { add("verify-issuer", i, i, { issuer: m[1] }); i += 1; continue; } // issuer= (error 2)
    if ((m = line.match(RE_ERR_STACK))) { cur.errorReasons.push(m[5]); add("error-stack", i, i, { id: m[1], code: m[2], library: m[3], func: m[4], reason: m[5], where: m[6] }, bi(`Reason: ${m[5]} (library: ${m[3]}; function: ${m[4]}).`, `Motivo: ${m[5]} (biblioteca: ${m[3]}; função: ${m[4]}).`)); i += 1; continue; } // error stack
    if (afterServerCert && (m = line.match(RE_SUBJECT))) { cur.serverSubject = m[1]; add("subject", i, i, { name: m[1] }); i += 1; continue; } // subject=
    if (afterServerCert && (m = line.match(RE_ISSUER))) { cur.serverIssuer = m[1]; add("issuer", i, i, { name: m[1] }); i += 1; continue; } // issuer=
    if ((m = line.match(/^Client Certificate Types: (.{0,200})$/))) { add("client-cert-types", i, i, { types: m[1] }); i += 1; continue; } // cert types
    if ((m = line.match(RE_SIGALGS))) { add("sigalgs", i, i, { list: m[1] }); i += 1; continue; } // sigalgs
    if ((m = line.match(RE_PEER_DIGEST))) { cur.peerSigningDigest = m[1]; add("peer-signing-digest", i, i, { digest: m[1] }); i += 1; continue; } // digest
    if ((m = line.match(RE_PEER_SIGTYPE))) { cur.peerSignatureType = m[1]; add("peer-signature-type", i, i, { type: m[1] }); i += 1; continue; } // sig type
    if ((m = line.match(RE_TEMP_KEY))) { cur.tempKey = m[2]; add("temp-key", i, i, { who: m[1], key: m[2] }); i += 1; continue; } // temp key
    if ((m = line.match(RE_NEG_GROUP))) { cur.tempKey = m[1]; add("negotiated-group", i, i, { group: m[1] }); i += 1; continue; } // negotiated group
    if ((m = line.match(RE_SCTS))) { add("scts", i, i, { count: m[1] }); i += 1; continue; } // SCTs
    if ((m = line.match(RE_SCT_STATUS))) { add("sct-status", i, i, { status: m[1] }); i += 1; continue; } // SCT status
    if ((m = line.match(RE_HANDSHAKE))) { cur.handshakeRead = Number(m[1]); cur.handshakeWritten = Number(m[2]); full = true; add("handshake-bytes", i, i, { read: m[1], written: m[2] }); i += 1; continue; } // byte counts
    if ((m = line.match(RE_VERIF_ERROR))) { cur.verification = "error"; add("verification-error", i, i, { text: m[1] }); i += 1; continue; } // Verification error
    if ((m = line.match(RE_PEERNAME))) { cur.verifiedPeername = m[1]; add("verified-peername", i, i, { name: m[1] }); i += 1; continue; } // Verified peername
    if ((m = line.match(RE_DANE))) { add("dane", i, i, { usage: m[1], selector: m[2], mtype: m[3], rest: m[4] }); i += 1; continue; } // DANE
    if ((m = line.match(RE_CIPHER_LINE))) { // New, ... / Reused, ...
      cur.reused = m[1] === "Reused"; // resumed or not
      cur.cipherLineVersion = m[2]; // the cipher's version
      cur.cipher = m[3]; // the cipher
      full = true; // the full layout
      add("cipher-line", i, i, { kind: m[1], version: m[2], cipher: m[3] }, m[3] === "(NONE)" ? bi("No cipher: the handshake did not complete.", "Nenhum cipher: o handshake não se completou.") : null); // the item
      i += 1; // next line
      continue; // done
    }
    if ((m = line.match(RE_PROTOCOL_LINE))) { cur.protocol = m[1]; add("protocol-line", i, i, { protocol: m[1] }); i += 1; continue; } // Protocol: (3.5)
    if ((m = line.match(RE_PUBKEY))) { cur.serverKeyBits = Number(m[1]); add("server-public-key", i, i, { bits: m[1] }); i += 1; continue; } // public key
    if ((m = line.match(RE_COMPRESSION))) { add("compression", i, i, { value: m[1] }); i += 1; continue; } // Compression
    if ((m = line.match(RE_EXPANSION))) { add("expansion", i, i, { value: m[1] }); i += 1; continue; } // Expansion
    if ((m = line.match(RE_ALPN))) { cur.alpn = m[1]; add("alpn", i, i, { protocol: m[1] }); i += 1; continue; } // ALPN
    if ((m = line.match(RE_NPN))) { add("npn", i, i, { status: m[1], protocol: m[2] }); i += 1; continue; } // NPN
    if ((m = line.match(RE_SRTP))) { add("srtp", i, i, { profile: m[1] }); i += 1; continue; } // SRTP
    if ((m = line.match(RE_EARLY))) { add("early-data", i, i, { status: m[1] }); i += 1; continue; } // early data
    if ((m = line.match(RE_VERIFY_CODE))) { // Verify return code (top level)
      cur.verifyCode = Number(m[1]); // the code
      cur.verifyText = m[2]; // its text
      const vc: VerifyCode | undefined = VERIFY_CODE_BY_NUMBER.get(Number(m[1])); // its row
      add("verify-return-code", i, i, { code: m[1], text: m[2], constant: vc?.constant ?? "" }, vc ? vc.meaning : null); // the item
      i += 1; // next line
      continue; // done
    }
    if ((m = line.match(RE_BRIEF_PROTOCOL))) { cur.protocol = m[1]; brief = true; add("brief-protocol", i, i, { protocol: m[1] }); i += 1; continue; } // -brief protocol
    if ((m = line.match(RE_BRIEF_SUITE))) { cur.cipher = m[1]; brief = true; add("brief-ciphersuite", i, i, { cipher: m[1] }); i += 1; continue; } // -brief suite
    if ((m = line.match(RE_BRIEF_PEER))) { cur.serverSubject = m[1]; add("brief-peer-cert", i, i, { name: m[1] }); i += 1; continue; } // -brief peer
    if ((m = line.match(RE_BRIEF_HASH))) { cur.peerSigningDigest = m[1]; add("brief-hash", i, i, { digest: m[1] }); i += 1; continue; } // -brief hash
    if ((m = line.match(RE_BRIEF_SIGTYPE))) { cur.peerSignatureType = m[1]; add("brief-sigtype", i, i, { type: m[1] }); i += 1; continue; } // -brief sig type
    if ((m = line.match(RE_POINT_FORMATS))) { add("point-formats", i, i, { formats: m[1] }); i += 1; continue; } // point formats
    if ((m = line.match(RE_STATE))) { const hint = STATE_HINTS.find(([re]) => re.test(m![1])); add("state", i, i, { state: m[1] }, hint ? hint[1] : null); i += 1; continue; } // -state
    if ((m = line.match(RE_ALERT))) { add("alert", i, i, { direction: m[1], level: m[2], description: m[3] }); i += 1; continue; } // alert
    if ((m = line.match(RE_MSG))) { add("msg", i, i, { direction: m[1], version: m[2].trim(), type: m[3].trim(), length: m[4], message: m[5].replace(/^, /, "").trim() }); i += 1; continue; } // -msg
    if ((m = line.match(RE_DEBUG))) { add("debug", i, i, { op: m[1], detail: m[2] }); i += 1; continue; } // -debug
    if ((m = line.match(RE_TLSEXT))) { add("tlsext", i, i, { side: m[1], name: m[2], id: m[3], len: m[4] }); i += 1; continue; } // -tlsextdebug
    if ((m = line.match(RE_ERRNO))) { add("errno", i, i, { op: m[1], errno: m[2] }); i += 1; continue; } // errno
    if ((m = line.match(RE_CONNECT_ERRNO))) { add("connect-errno", i, i, { errno: m[1] }); i += 1; continue; } // connect errno
    if ((m = line.match(RE_LOCAL_PORT))) { add("local-port", i, i, { port: m[1] }); i += 1; continue; } // local port
    if ((m = line.match(RE_CONNECTING))) { add("connecting", i, i, { address: m[1] }); i += 1; continue; } // 3.5: Connecting to 127.0.0.1

    // ---- anything else: data from the server, or text we do not know ----
    let j = i; // group consecutive unknown lines
    while (j + 1 < lines.length && !isRecognisedLine(lines[j + 1]) && j - i < 2000) j += 1; // bounded; stops before any line another branch reads
    add("data", i, j, { lines: String(j - i + 1) }); // the block
    i = j + 1; // past it
  }

  const layout: OutputExplanation["layout"] = full ? "full" : brief ? "brief" : "unknown"; // which layout
  const usedConns = conns.filter((c, idx) => idx === 0 || c.connected || c.cipher !== null); // drop an empty trailing connection
  const out: OutputExplanation = { recognised: recognised > 0, layout, lines: lines.length, truncated: truncated || lineCapped, items, connections: usedConns, findings: [] }; // the result
  out.findings = outputFindings(out, ocspAsked); // draw the findings
  return out; // done
}

// ---------------------------------------------------------------------------
// PART 3: FINDINGS FROM THE OUTPUT.
// ---------------------------------------------------------------------------

/** The OpenSSL names of TLS 1.2-and-older suites that carry their own key exchange prefix. */
const KX_PREFIX = /^(ECDHE|DHE|EDH|ECDH|DH|ADH|AECDH|PSK|RSA-PSK|DHE-PSK|ECDHE-PSK|SRP|SRP-RSA|SRP-DSS)-/; // explicit key exchange

/** Read the weaknesses of a cipher name (OpenSSL or IANA spelling). */
function cipherWeaknesses(cipher: string, protocol: string | null): { weak: string | null; staticRsa: boolean; dhe: boolean; cbc: boolean } {
  const c = cipher.toUpperCase(); // case-insensitive
  const tls13 = c.startsWith("TLS_AES_") || c.startsWith("TLS_CHACHA20_") || protocol === "TLSv1.3"; // TLS 1.3 suites have none of these issues
  if (tls13) return { weak: null, staticRsa: false, dhe: false, cbc: false }; // nothing to flag
  let weak: string | null = null; // the worst weakness
  if (/(^|[-_])NULL([-_]|$)/.test(c)) weak = "NULL"; // no encryption
  else if (/RC4/.test(c)) weak = "RC4"; // RC4
  else if (/(^|[-_])EXP/.test(c) || /EXPORT/.test(c)) weak = "EXPORT"; // export grade
  else if (/DES-CBC3|3DES/.test(c)) weak = "3DES"; // 3DES (112 effective bits)
  else if (/(^|[-_])DES([-_]|$)|DES-CBC-|_DES_CBC_/.test(c)) weak = "DES"; // single DES
  else if (/^(ADH|AECDH)-|_ANON_/.test(c)) weak = "anonymous"; // no authentication
  const staticRsa = !KX_PREFIX.test(c) && !/^TLS_/.test(c) && !/PSK|SRP/.test(c) && weak !== "anonymous"; // OpenSSL names without a kx prefix are RSA key transport (openssl-ciphers(1))
  const staticRsaIana = /^TLS_RSA_WITH_/.test(c); // the IANA spelling
  const dhe = /^(DHE|EDH)-/.test(c) || /^TLS_DHE_/.test(c); // finite-field ephemeral DH
  const cbc = !/GCM|CCM|CHACHA20|POLY1305/.test(c) && !weak; // not an AEAD suite (and not already flagged)
  return { weak, staticRsa: staticRsa || staticRsaIana, dhe, cbc }; // the reading
}

/** Draw the findings from a parsed output. */
function outputFindings(out: OutputExplanation, ocspAsked: boolean): Finding[] {
  const f: Finding[] = []; // the findings
  if (!out.recognised) { // nothing s_client prints
    f.push(finding("notSClientOutput", "info", "openssl-src-3.5.9", "Nothing in the output box looks like what openssl s_client prints (no CONNECTED, Certificate chain, Verify return code, SSL-Session or -brief lines).", "Nada na caixa de saída parece com o que o openssl s_client imprime (nenhuma linha CONNECTED, Certificate chain, Verify return code, SSL-Session ou de -brief).")); // not s_client
    return f; // nothing else to say
  }
  const first = out.connections[0]; // the first handshake carries the certificate story
  const all = out.connections; // every handshake
  const protocol = first.protocol; // negotiated version
  const failed = first.cipher === "(NONE)" || (first.errorReasons.length > 0 && !first.cipher) || (first.errorReasons.length > 0 && first.noPeerCertificate); // handshake failure

  // ---- the handshake itself ----
  if (failed) { // the handshake did not complete
    const reasons = Array.from(new Set(first.errorReasons)).join("; "); // distinct reasons
    f.push(finding("handshakeFailed", "high", "err-print-errors-3.5", `The handshake did not complete${reasons ? `: OpenSSL's error queue says ${reasons}` : ""}. Lines printed after the failure (a chain, a cipher of (NONE)) describe what was received before it stopped.`, `O handshake não se completou${reasons ? `: a fila de erros do OpenSSL diz ${reasons}` : ""}. As linhas impressas depois da falha (uma cadeia, um cipher (NONE)) descrevem o que foi recebido antes de parar.`)); // failed
  }
  if (first.errorReasons.some((r) => /certificate verify failed/i.test(r))) f.push(finding("abortedOnVerify", "high", "s_client-3.5", "The handshake was aborted because the certificate did not verify: -verify_return_error (or a library default) turned the verification error into a fatal one, the way a real client behaves.", "O handshake foi abortado porque o certificado não passou na verificação: -verify_return_error (ou um padrão da biblioteca) transformou o erro de verificação em fatal, como um cliente de verdade faz.")); // verify abort
  if (first.handshakeRead === 0) f.push(finding("readZero", "high", "openssl-src-3.5.9", "The server sent nothing back during the handshake (0 bytes read): wrong port, a firewall, or a service that does not start with TLS (for SMTP, IMAP, POP3, LDAP and the like, try -starttls).", "O servidor não devolveu nada durante o handshake (0 bytes lidos): porta errada, um firewall, ou um serviço que não começa em TLS (para SMTP, IMAP, POP3, LDAP e afins, tente -starttls).")); // nothing read

  // ---- verification ----
  const code = first.verifyCode; // the final code
  const errNums = new Set(first.verifyErrors.map((e) => e.num)); // every error seen
  if (code !== null && code !== 0) { // verification failed
    const vc = VERIFY_CODE_BY_NUMBER.get(code); // the row
    f.push(finding("verifyFailed", "high", "x509-store-ctx-get-error-3.5", `Verify return code ${code} (${first.verifyText ?? vc?.text ?? ""})${vc ? `, ${vc.constant}: ${vc.meaning.en}` : "."}`, `Verify return code ${code} (${first.verifyText ?? vc?.text ?? ""})${vc ? `, ${vc.constant}: ${vc.meaning.pt}` : "."}`)); // failed
    if (!failed && first.cipher && first.cipher !== "(NONE)") f.push(finding("connectedDespiteErrors", "warn", "s_client-3.5", "The handshake still completed (a cipher was negotiated) although verification failed: s_client carries on by design unless -verify_return_error is given. A browser or any careful client would have refused this server.", "O handshake ainda se completou (um cipher foi negociado) embora a verificação tenha falhado: o s_client segue por projeto, a menos que haja -verify_return_error. Um browser ou qualquer cliente cuidadoso teria recusado este servidor.")); // went on anyway
  }
  if (code === null && first.verification === "error") { // -brief: the text only
    const text = (out.items.find((x) => x.kind === "verification-error" && x.connection === 1)?.fields.text ?? "").trim(); // the message
    const vc = Array.from(VERIFY_CODE_BY_NUMBER.values()).find((v) => v.text === text || v.text36 === text); // the code it belongs to (3.5 text, or 3.6's for code 9)
    f.push(finding("verifyFailed", "high", "x509-store-ctx-get-error-3.5", `Verification error: ${text}${vc ? ` (code ${vc.code}, ${vc.constant}): ${vc.meaning.en}` : "."}`, `Verification error: ${text}${vc ? ` (código ${vc.code}, ${vc.constant}): ${vc.meaning.pt}` : "."}`)); // failed
    if (vc) errNums.add(vc.code); // let the specific findings below fire
  }
  const chain = first.chain; // what the server sent
  const last = chain.length > 0 ? chain[chain.length - 1] : null; // the top of what was sent
  if (errNums.has(20) || errNums.has(21) || code === 20 || code === 21) { // issuer not found
    if (last && last.subject !== last.issuer) { // the top of the list is not a root
      const n = chain.length; // how many were sent
      f.push(finding("missingIntermediate", "high", "x509-store-ctx-get-error-3.5", `The server sent ${n} certificate${n === 1 ? "" : "s"}, and the last one (${last.subject}) was issued by ${last.issuer}, which is neither among them nor in the trust store. If that issuer is an intermediate CA, the server is not sending it: add it to the server's chain, right after the server certificate. If it is a root, the client lacks it (give it with -CAfile). Clients that do not fetch missing intermediates by themselves will fail the same way.`, `O servidor enviou ${n} certificado${n === 1 ? "" : "s"}, e o último (${last.subject}) foi emitido por ${last.issuer}, que não está entre eles nem no trust store. Se esse emissor é uma CA intermediária, o servidor não a está enviando: acrescente-a à cadeia do servidor, logo depois do certificado do servidor. Se é uma raiz, falta ao cliente (passe-a com -CAfile). Clientes que não buscam intermediárias sozinhos vão falhar do mesmo jeito.`)); // missing intermediate
    } else if (!last) { // no chain list (e.g. -brief)
      f.push(finding("missingIntermediate", "high", "x509-store-ctx-get-error-3.5", "Error 20 or 21: the issuer of a certificate the server sent is in neither the server's list nor the trust store. Run again without -brief and with -showcerts to see what the server sends; the usual cause is a missing intermediate.", "Erro 20 ou 21: o emissor de um certificado enviado pelo servidor não está nem na lista do servidor nem no trust store. Rode de novo sem -brief e com -showcerts para ver o que o servidor envia; a causa comum é uma intermediária ausente.")); // generic
    }
  }
  if (errNums.has(19) || code === 19) f.push(finding("untrustedRoot", "high", "x509-store-ctx-get-error-3.5", `The chain ends in a self-signed root this client does not trust${last && last.subject === last.issuer ? ` (${last.subject}, sent by the server itself)` : ""}. For a private CA, give its root to s_client with -CAfile; if a public site shows this, something between you and it (a proxy, an inspection device) may be presenting its own chain.`, `A cadeia termina numa raiz auto-assinada em que este cliente não confia${last && last.subject === last.issuer ? ` (${last.subject}, enviada pelo próprio servidor)` : ""}. Para uma CA privada, passe a raiz ao s_client com -CAfile; se um site público mostra isso, algo entre você e ele (um proxy, um equipamento de inspeção) pode estar apresentando a própria cadeia.`)); // untrusted root
  if (errNums.has(18) || code === 18) f.push(finding("selfSignedLeaf", "high", "x509-store-ctx-get-error-3.5", "The server presents a self-signed certificate that is not in the trust store: fine for a lab, never for a service others rely on. Either install a CA-issued certificate or trust this exact certificate explicitly with -CAfile.", "O servidor apresenta um certificado auto-assinado que não está no trust store: serve para laboratório, nunca para um serviço de que outros dependem. Instale um certificado emitido por CA ou confie explicitamente neste certificado com -CAfile.")); // self-signed leaf
  if (errNums.has(10) || code === 10) { const e = first.verifyErrors.find((x) => x.num === 10); f.push(finding("expired", "high", "x509-store-ctx-get-error-3.5", `A certificate has expired${e?.depth !== null && e?.depth !== undefined ? ` at depth ${e.depth}${e.depth === 0 ? " (the server's own)" : " (a CA certificate)"}` : ""}. If the dates look right, check the clock of the machine that ran s_client, or whether -attime was used.`, `Um certificado expirou${e?.depth !== null && e?.depth !== undefined ? ` na profundidade ${e.depth}${e.depth === 0 ? " (o do próprio servidor)" : " (um certificado de CA)"}` : ""}. Se as datas parecem certas, confira o relógio da máquina que rodou o s_client, ou se foi usado -attime.`)); } // expired
  if (errNums.has(9) || code === 9) f.push(finding("notYetValid", "high", "x509-store-ctx-get-error-3.5", "A certificate is not valid yet: its notBefore date is in the future, or the clock of the machine that ran s_client is behind.", "Um certificado ainda não é válido: a data notBefore está no futuro, ou o relógio da máquina que rodou o s_client está atrasado.")); // not yet valid
  if ([62, 63, 64].some((n) => errNums.has(n) || code === n)) f.push(finding("nameMismatch", "high", "verification-options-3.5", "The certificate is not valid for the name (or address) you asked s_client to check: look at its Subject Alternative Name list with the X.509 inspector, and check that the right SNI was sent.", "O certificado não vale para o nome (ou endereço) que você pediu ao s_client para conferir: veja a lista Subject Alternative Name dele no X.509 inspector, e confira se foi enviado o SNI certo.")); // name mismatch
  if ((code === 0 || (code === null && first.verification === "ok")) && first.verifiedPeername === null && !first.verifyErrors.length) f.push(finding("hostnameNotChecked", "warn", "verification-options-3.5", "\"Verify return code: 0 (ok)\" covers the chain only. No \"Verified peername\" line was printed, so no host name was checked: a valid certificate for any other name would look exactly the same. Run again with -verify_hostname and the name you expect.", "\"Verify return code: 0 (ok)\" cobre só a cadeia. Não saiu linha \"Verified peername\", então nenhum hostname foi conferido: um certificado válido de qualquer outro nome pareceria idêntico. Rode de novo com -verify_hostname e o nome esperado.")); // no name check
  if (first.verifiedPeername !== null) f.push(finding("hostnameVerified", "info", "verification-options-3.5", `The certificate was checked against the name ${first.verifiedPeername} and matched.`, `O certificado foi conferido contra o nome ${first.verifiedPeername} e casou.`)); // name checked

  // ---- the chain as sent ----
  for (let k = 0; k + 1 < chain.length; k++) { // each link
    if (chain[k].issuer !== chain[k + 1].subject) { // the next one does not certify this one
      f.push(finding("chainOrder", "warn", "rfc9846", `In the list the server sent, certificate ${chain[k].depth} was issued by ${chain[k].issuer}, but the next one is ${chain[k + 1].subject}. RFC 9846 (section 4.5.1) says each certificate after the first SHOULD certify the one before; many clients cope with a shuffled or padded list, strict ones do not.`, `Na lista que o servidor enviou, o certificado ${chain[k].depth} foi emitido por ${chain[k].issuer}, mas o seguinte é ${chain[k + 1].subject}. A RFC 9846 (seção 4.5.1) diz que cada certificado depois do primeiro SHOULD certificar o anterior; muitos clientes toleram uma lista embaralhada ou com sobras, os estritos não.`)); // order
      break; // one finding is enough
    }
  }
  if (chain.length > 1 && last && last.subject === last.issuer) f.push(finding("rootSent", "info", "rfc9846", `The server sends its root (${last.subject}) as the last certificate. RFC 9846 lets a server leave the trust anchor out, since clients must already have it; sending it costs bytes and makes no client trust it.`, `O servidor envia a raiz (${last.subject}) como último certificado. A RFC 9846 permite deixar a âncora de confiança de fora, já que o cliente precisa tê-la; enviá-la custa bytes e não faz cliente nenhum confiar nela.`)); // root sent

  // ---- protocol and cipher ----
  if (protocol && /^(SSLv3|TLSv1|TLSv1\.1)$/.test(protocol)) f.push(finding("oldProtocol", "high", "rfc8996", `${protocol} was negotiated. TLS 1.0 and 1.1 are deprecated (RFC 8996) and SSL 3.0 is older still; OpenSSL refuses them from security level 1 up, so this connection also means the security level was lowered on this side.`, `${protocol} foi negociado. TLS 1.0 e 1.1 estão depreciados (RFC 8996) e o SSL 3.0 é ainda mais antigo; o OpenSSL os recusa a partir do nível de segurança 1, então esta conexão também significa que o nível de segurança foi rebaixado deste lado.`)); // old protocol
  if (protocol && first.cipherLineVersion && first.cipherLineVersion !== protocol && first.cipher !== "(NONE)") f.push(finding("cipherLineVersion", "info", "ssl-cipher-get-name-3.5", `The line "New, ${first.cipherLineVersion}, Cipher is ${first.cipher}" names ${first.cipherLineVersion}, but the session's protocol is ${protocol}. Not a contradiction: that line prints the version that first defined the cipher (SSL_CIPHER_get_version), not the version negotiated.`, `A linha "New, ${first.cipherLineVersion}, Cipher is ${first.cipher}" cita ${first.cipherLineVersion}, mas o protocolo da sessão é ${protocol}. Não é contradição: essa linha imprime a versão que definiu o cipher pela primeira vez (SSL_CIPHER_get_version), não a versão negociada.`)); // the cipher-line trap
  if (first.cipher && first.cipher !== "(NONE)") { // a cipher was negotiated
    const w = cipherWeaknesses(first.cipher, protocol); // its weaknesses
    if (w.weak) f.push(finding("weakCipher", "high", "rfc9325", `${first.cipher} uses ${w.weak === "anonymous" ? "no server authentication at all" : w.weak}. RFC 9325 (BCP 195) says implementations MUST NOT negotiate NULL, RC4 or export-grade suites, SHOULD NOT negotiate those below 128 bits of security (3DES counts as 112), and anonymous suites authenticate nobody.`, `${first.cipher} usa ${w.weak === "anonymous" ? "nenhuma autenticação do servidor" : w.weak}. A RFC 9325 (BCP 195) diz que implementações MUST NOT negociar suites NULL, RC4 ou export, SHOULD NOT negociar as abaixo de 128 bits de segurança (3DES conta como 112), e suites anônimas não autenticam ninguém.`)); // weak
    if (w.staticRsa) f.push(finding("staticRsa", "warn", "rfc9325", `${first.cipher} uses RSA key transport (no ECDHE or DHE in its name; openssl-ciphers(1) notes such names imply RSA): no forward secrecy, and RFC 9325 says it SHOULD NOT be negotiated.`, `${first.cipher} usa transporte de chave RSA (sem ECDHE ou DHE no nome; o openssl-ciphers(1) observa que nomes assim implicam RSA): sem forward secrecy, e a RFC 9325 diz que SHOULD NOT ser negociada.`)); // static RSA
    if (w.dhe) f.push(finding("dheTls12", "warn", "rfc9325", `${first.cipher} is a finite-field DHE suite; RFC 9325 says TLS 1.2 implementations SHOULD NOT negotiate them, citing the fragility of the construction.`, `${first.cipher} é uma suite DHE de corpo finito; a RFC 9325 diz que implementações TLS 1.2 SHOULD NOT negociá-las, citando a fragilidade da construção.`)); // DHE
    if (w.cbc) f.push(finding("cbcCipher", "warn", "rfc9325", `${first.cipher} is a CBC suite. RFC 9325 says a CBC suite SHOULD NOT be used unless encrypt-then-mac is negotiated, which this output does not show; prefer the ECDHE suites with AES-GCM it recommends.`, `${first.cipher} é uma suite CBC. A RFC 9325 diz que uma suite CBC SHOULD NOT ser usada a menos que se negocie encrypt-then-mac, o que esta saída não mostra; prefira as suites ECDHE com AES-GCM que ela recomenda.`)); // CBC
  }
  if (protocol === "TLSv1.2" && first.peerSigningDigest && /^(SHA1|MD5|MD5-SHA1)$/i.test(first.peerSigningDigest)) f.push(finding("sha1Signature", "warn", "rfc9155", `The server signed the TLS 1.2 handshake with ${first.peerSigningDigest}; RFC 9155 deprecates MD5 and SHA-1 in TLS 1.2 signatures.`, `O servidor assinou o handshake TLS 1.2 com ${first.peerSigningDigest}; a RFC 9155 deprecia MD5 e SHA-1 em assinaturas do TLS 1.2.`)); // SHA-1 signature
  if (first.secureReneg === "not-supported" && protocol && protocol !== "TLSv1.3") f.push(finding("renegNotSecure", "warn", "rfc9325", "The server does not support secure renegotiation (RFC 5746). RFC 9325 (section 3.5) requires it for TLS 1.2 and tells clients to abort when the server does not acknowledge it.", "O servidor não suporta renegociação segura (RFC 5746). A RFC 9325 (seção 3.5) exige isso no TLS 1.2 e manda o cliente abortar quando o servidor não reconhece a extensão.")); // reneg
  if (first.secureReneg === "not-supported" && protocol === "TLSv1.3") f.push(finding("renegTls13Note", "info", "rfc9846", "\"Secure Renegotiation IS NOT supported\" under TLS 1.3 is expected: TLS 1.3 forbids renegotiation altogether (RFC 9846). OpenSSL 3.5 prints \"This TLS version forbids renegotiation.\" here instead; this line comes from OpenSSL 3.0.", "\"Secure Renegotiation IS NOT supported\" no TLS 1.3 é o esperado: o TLS 1.3 proíbe renegociação (RFC 9846). O OpenSSL 3.5 imprime \"This TLS version forbids renegotiation.\" nesse lugar; esta linha vem do OpenSSL 3.0.")); // TLS 1.3 note
  if (first.ems === "no" && protocol === "TLSv1.2") f.push(finding("emsNoTls12", "warn", "rfc9325", "The TLS 1.2 session did not use the extended master secret; RFC 9325 (section 3.5) says TLS 1.2 implementations MUST support it, against the triple handshake attack.", "A sessão TLS 1.2 não usou o extended master secret; a RFC 9325 (seção 3.5) diz que implementações TLS 1.2 MUST suportá-lo, contra o ataque de triple handshake.")); // EMS TLS 1.2
  if (first.ems === "no" && protocol === "TLSv1.3") f.push(finding("emsNoTls13Note", "info", "rfc9846", "\"Extended master secret: no\" in a TLS 1.3 session is not a weakness: TLS 1.3 always hashes the handshake transcript into its secrets (RFC 9846, Appendix E, which asks APIs to report it as in use; OpenSSL prints no).", "\"Extended master secret: no\" numa sessão TLS 1.3 não é fraqueza: o TLS 1.3 sempre mistura a transcrição do handshake nos segredos (RFC 9846, Apêndice E, que pede às APIs para reportá-lo como em uso; o OpenSSL imprime no).")); // EMS TLS 1.3

  // ---- secrets, tickets, OCSP, ALPN, resumption ----
  const secrets = Array.from(new Set(all.flatMap((c) => c.secretsPrinted))); // which secrets appear
  if (secrets.length) { // session secrets were printed
    const mk = secrets.includes("Master-Key"); // TLS 1.2 master secret present
    const psk = secrets.includes("Resumption PSK"); // TLS 1.3 resumption PSK present
    const en = [mk ? "with a capture of the traffic, a Master-Key decrypts its TLS 1.2 session" : "", psk ? "a Resumption PSK together with its ticket lets anyone resume the TLS 1.3 session as this client" : ""].filter(Boolean).join("; "); // what each one allows
    const pt = [mk ? "com uma captura do tráfego, um Master-Key decifra a sessão TLS 1.2 dele" : "", psk ? "um Resumption PSK junto com o ticket deixa qualquer um retomar a sessão TLS 1.3 como este cliente" : ""].filter(Boolean).join("; "); // the same in Portuguese
    f.push(finding("secretsPrinted", "warn", mk ? "rfc5246" : "rfc9846", `This output contains ${secrets.join(" and ")} values, secrets of these sessions: ${en}. Blank them out before sharing the output.`, `Esta saída contém valores de ${secrets.join(" e ")}, segredos destas sessões: ${pt}. Apague-os antes de compartilhar a saída.`)); // secrets
  }
  const tickets = all.reduce((s, c) => s + c.tickets, 0); // tickets seen
  if (tickets > 0) f.push(finding("tls13Tickets", "info", "rfc9846", `${tickets} New Session Ticket${tickets === 1 ? "" : "s"} arrived after the handshake. That is TLS 1.3's normal resumption mechanism (RFC 9846, section 4.7.1), not a second handshake.`, `${tickets} New Session Ticket${tickets === 1 ? "" : "s"} chegaram depois do handshake. É o mecanismo normal de retomada do TLS 1.3 (RFC 9846, seção 4.7.1), não um segundo handshake.`)); // tickets
  const reused = all.filter((c) => c.reused === true).length; // resumed handshakes
  if (reused > 0) f.push(finding("resumed", "info", "s_client-3.5", `${reused} of ${all.length} handshakes say "Reused": session resumption works on this server.`, `${reused} de ${all.length} handshakes dizem "Reused": a retomada de sessão funciona neste servidor.`)); // resumption
  if (ocspAsked || all.some((c) => c.ocsp !== null)) { // OCSP was asked
    const st = first.ocspCertStatus?.toLowerCase() ?? null; // the stapled status
    if (first.ocsp === "none") f.push(finding("ocspNotStapled", "info", "rfc6066", "The client asked for OCSP stapling and the server stapled nothing. Not an error by itself; it only means the revocation status did not come with the handshake.", "O cliente pediu OCSP stapling e o servidor não enviou resposta nenhuma. Não é erro por si só; só quer dizer que o status de revogação não veio com o handshake.")); // not stapled
    if (st === "good") f.push(finding("ocspGood", "info", "rfc6960", "The stapled OCSP response says the certificate is good (RFC 6960: a positive answer to the status inquiry). Check that the Next Update date has not passed.", "A resposta OCSP recebida via stapling diz que o certificado está good (RFC 6960: resposta positiva à consulta de status). Confira se a data Next Update não passou.")); // good
    if (st === "revoked") f.push(finding("ocspRevoked", "high", "rfc6960", "The stapled OCSP response says the certificate is REVOKED: its issuer has withdrawn it. Replace it.", "A resposta OCSP recebida via stapling diz que o certificado está REVOGADO: o emissor o retirou. Substitua-o.")); // revoked
    if (st === "unknown") f.push(finding("ocspUnknown", "warn", "rfc6960", "The stapled OCSP response says unknown: the responder does not know this certificate.", "A resposta OCSP recebida via stapling diz unknown: o responder não conhece este certificado.")); // unknown
  }
  return f; // done
}

// ---------------------------------------------------------------------------
// PART 4: BOTH TOGETHER, AND THE SINGLE-STRING ENTRY POINT.
// ---------------------------------------------------------------------------

/** The whole explanation. */
export interface SClientExplanation {
  command: CommandExplanation | null; // the command, when one was given or found
  output: OutputExplanation | null; // the output, when some was given
  findings: Finding[]; // command and output findings together, most severe first
  splitFromOutput: boolean; // the command was found at the top of the output box
}

/** Severity order for sorting. */
const RANK: Record<Severity, number> = { high: 0, warn: 1, info: 2 }; // most severe first

/**
 * Separate a pasted command line from the output under it: the first line that
 * runs `openssl s_client` (after an optional prompt) and its continuation lines
 * are the command, everything else is the output.
 */
export function splitInput(text: string): { command: string; output: string } {
  const lines = text.slice(0, MAX_OUTPUT_LENGTH).split(/\r?\n/); // the lines
  const idx = lines.findIndex((l, n) => n < 50 && /openssl(?:\.exe)?[ \t]+s_client(?:[ \t]|$)/i.test(l.slice(0, MAX_LINE_LENGTH))); // the command line, near the top
  if (idx === -1) return { command: "", output: text }; // no command: all output
  let end = idx; // continuation lines
  while (end + 1 < lines.length && /[\\^`]\s*$/.test(lines[end]) && end - idx < 50) end += 1; // backslash, caret or backtick continuations
  const command = lines.slice(idx, end + 1).join("\n"); // the command text
  const output = [...lines.slice(0, idx), ...lines.slice(end + 1)].join("\n"); // the rest
  return { command, output }; // both
}

/**
 * Explain a command, an output, or both. When the command box is empty and the
 * output box starts with the command line, the two are separated first.
 */
export function explain(input: { command?: string; output?: string }): SClientExplanation {
  let command = (input.command ?? "").trim(); // the command box
  let output = input.output ?? ""; // the output box
  let splitFromOutput = false; // whether we separated them
  if (command === "" && output.trim() !== "") { // try to find the command in the output
    const s = splitInput(output); // separate
    if (s.command !== "") { command = s.command; output = s.output; splitFromOutput = true; } // found one
  }
  const cmd = command !== "" ? explainCommand(command) : null; // the command explanation
  const out = output.trim() !== "" ? explainOutput(output) : null; // the output explanation
  const findings: Finding[] = [...(cmd?.findings ?? []), ...(out?.findings ?? [])]; // together
  // When the output proves a host name was checked, the command-side warning is moot; when the output already says
  // "hostname not checked", the command-side one says the same thing, so keep only one of the pair.
  const outIds = new Set((out?.findings ?? []).map((x) => x.id)); // output finding ids
  const merged = findings.filter((x) => !(x.id === "noHostnameCheck" && (outIds.has("hostnameNotChecked") || outIds.has("hostnameVerified")))); // drop the duplicate
  merged.sort((a, b) => RANK[a.severity] - RANK[b.severity]); // most severe first (stable sort keeps the order within a level)
  return { command: cmd, output: out, findings: merged, splitFromOutput }; // the explanation
}

/**
 * The single-string entry point (the API and the registry): the text may hold
 * the command, the output, or the command on its first line followed by the
 * output, exactly as a terminal shows them.
 */
export function run(input: string): SClientExplanation {
  const { command, output } = splitInput(input); // separate them
  return explain({ command, output }); // explain both
}

// ---------------------------------------------------------------------------
// PART 5: THE SHAREABLE COPY (Share results, PRIME 27/10/2026).
// ---------------------------------------------------------------------------
// A Share results link carries the two boxes with every secret value replaced
// by SHARE_REDACTED, never as pasted. The secrets are the ones this engine
// already names, and nothing else:
//   - the session secrets SSL_SESSION_print writes, Master-Key (the TLS 1.2
//     master secret) and Resumption PSK (the TLS 1.3 resumption key), the two
//     values the "secretsPrinted" finding tells the reader to blank out;
//   - the command-line values the OpenSSL 3.5 manual makes secrets: a pass
//     phrase given to -pass or -proxy_pass in the "pass:password" form
//     (openssl-passphrase-options(1): "The actual password is password"; the
//     env:, file:, fd: and stdin forms name a source, not the password, and
//     stay), the key of -psk ("given as a hexadecimal number"), and the
//     password of -srppass.
// Host names, addresses, certificates, file paths and the session ticket stay
// (a ticket cannot resume a session without its secret: RFC 9846, sections
// 4.7.1 and 4.3.11.2). Both rules run over both boxes, because the output box
// may also hold the command line (splitInput). Every expression is linear: its
// alternatives start with characters that cannot overlap.
// ---------------------------------------------------------------------------

/** What replaces a secret value in the shareable copy (the mark the traceback explainer's redacted copy uses). */
export const SHARE_REDACTED = "[redacted]"; // ASCII, and not hex, so the copy is never read as a secret again

/** A session secret line: its label, colon and spaces (kept), then the value (replaced), to the end of the line. */
const RE_SHARE_SESSION_SECRET = /^([ \t]*(?:Master-Key|Resumption PSK)[ \t]*:[ \t]*)(\S[^\r\n]*)$/gm; // multiline, global

/**
 * A command-line secret: one of the four options (one or two dashes, as opt.c reads them), its separator (an "=",
 * spaces, or a line continuation), then one shell word: quoted parts, escaped characters and plain characters.
 */
const RE_SHARE_OPTION_SECRET = /(^|\s)(--?(?:pass|proxy_pass|psk|srppass))(=|(?:[ \t]|[\\^`]\r?\n)+)((?:'[^'\n]*'|"(?:[^"\\\n]|\\.)*"|\\.|[^\s'"\\])+)/g; // global

/**
 * Any other word in the "pass:password" form, after a space or an "=" (another command's -passin or -passout in a
 * pasted terminal session, say): its password goes too. A value already replaced is left as it is.
 */
const RE_SHARE_PASS_WORD = /(^|[\s=])(['"]?)pass:((?:\\.|[^\s'"\\])+)/g; // global

/** A shell word without its quotes and escapes, to read what the option receives. */
function unquoteWord(word: string): string {
  return word.replace(/'([^'\n]*)'|"((?:[^"\\\n]|\\.)*)"|\\(.)/g, (_m, s: string | undefined, d: string | undefined, e: string | undefined) => s ?? (d !== undefined ? d.replace(/\\(.)/g, "$1") : e ?? "")); // each quoted part or escape, unwrapped
} // unquoteWord

/**
 * Replace the secrets of one box.
 * @param text the box as pasted
 * @returns the text with each secret value replaced, and how many were replaced
 */
function redactSClientText(text: string): { text: string; redacted: number } {
  let redacted = 0; // replacements made
  // The session secrets: the label stays, the value goes.
  let out = text.replace(RE_SHARE_SESSION_SECRET, (_m, head: string) => { redacted += 1; return `${head}${SHARE_REDACTED}`; }); // one per line
  // The command-line secrets: the option and its separator stay, the value goes (a pass phrase keeps its "pass:" form).
  out = out.replace(RE_SHARE_OPTION_SECRET, (m, lead: string, opt: string, sep: string, word: string) => {
    const name = opt.replace(/^--?/, ""); // pass, proxy_pass, psk or srppass
    const value = unquoteWord(word); // what OpenSSL receives
    if ((name === "pass" || name === "proxy_pass") && !value.startsWith("pass:")) return m; // env:, file:, fd:, stdin: a source, not a secret
    redacted += 1; // one more
    return `${lead}${opt}${sep}${name === "pass" || name === "proxy_pass" ? "pass:" : ""}${SHARE_REDACTED}`; // the value replaced
  });
  // Any other "pass:password" word: the form stays, the password goes.
  out = out.replace(RE_SHARE_PASS_WORD, (m, lead: string, quote: string, value: string) => {
    if (value === SHARE_REDACTED) return m; // replaced by the rule above
    redacted += 1; // one more
    return `${lead}${quote}pass:${SHARE_REDACTED}`; // the password replaced
  });
  return { text: out, redacted }; // the copy
} // redactSClientText

/** The copy a Share results link carries. */
export interface ShareableSClient {
  /** The command box, with its secrets replaced. */
  command: string;
  /** The output box, with its secrets replaced. */
  output: string;
  /** How many values were replaced in the two boxes together. */
  redacted: number;
}

/**
 * The shareable copy of the two boxes: every secret value replaced by SHARE_REDACTED, everything else as pasted.
 * Pure and total: it never throws, and text without secrets comes back unchanged.
 * @param input the two boxes as pasted
 * @returns the copy, and how many values it replaced
 */
export function shareableSClient(input: { command: string; output: string }): ShareableSClient {
  const c = redactSClientText(input.command); // the command box
  const o = redactSClientText(input.output); // the output box (which may hold the command line too)
  return { command: c.text, output: o.text, redacted: c.redacted + o.redacted }; // both
} // shareableSClient
