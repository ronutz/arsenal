// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bigip-scripted-monitor-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE BIG-IP SCRIPTED MONITOR EXPLAINER: the pure engine (2026-10-27).
//
// A BIG-IP LTM Scripted monitor reads a plain-text file of "send" and "expect"
// lines from /config/eav/ and plays it against a pool member: it sends what a
// send line says and checks that what comes back starts with what an expect
// line says. It is not Expect and not Tcl. This engine does three things with a
// script the reader pastes:
//   1. it explains every line: the keyword, the text as the monitor would read
//      it (quotation marks and escape sequences resolved), how a send ends, and
//      what a known reply or command means in its protocol;
//   2. it reports findings against rules S1 to S16, each tied to a line: first
//      every rule F5 states, then what F5 leaves open, then advice from the
//      protocols' RFCs;
//   3. given a server transcript in the RFCs' own "S:" / "C:" notation, it
//      simulates the check line by line and says whether it would pass, fail at
//      a line (with the reason), or cannot be decided at a line because F5's
//      text does not say what the monitor does there.
//
// F5'S RULES, as stated in the BIG-IP 21.1.0 LTM Monitors Reference, "Scripted
// monitor settings" (techdocs.f5.com, read 2026-10-27), quoted:
//   - "Scripts must use hard-return line endings (LF), not soft-return line
//     endings (CR-LF)."                                              (rule S1)
//   - "Exactly one character space must be used to separate the send or expect
//     instruction keywords from the text to send or match."          (rule S2)
//   - "The text to send or match extends to the end of the line, even when
//     using quotation marks. Any characters that follow a closing quotation
//     mark will break the match."                                    (rule S3)
//   - "Matching text can match the prefix of a response, but cannot match a
//     substring that is not a prefix, that is, a substring that starts other
//     than at the beginning of the response."         (the simulator's match)
//   - the escape sequences \a \b \f \n \r \t \v \\ and \' (Bell, Backspace,
//     Form feed, New line, Return, Tab, Vertical tab, Backslash, Single
//     quotation mark)                                                (rule S5)
//   - "the lines of the file are always read in the sequence specified", with
//     F5's own example: expect 220 / send "HELO bigip1.somecompany.net\r\n" /
//     expect "250" / send "quit\r\n"       (the order; golden vector f5-smtp)
//   - the keywords are send and expect                               (rule S4)
// And from the same table: "If the target does not respond within the set time
// period, the target is considered to be down" (the simulator's no-reply).
//
// WHAT F5 LEAVES OPEN, and the engine therefore never decides (the simulation
// stops with "undetermined" at that line and says why): what counts as "a
// response" when a reply has several lines; whether the comparison is
// case-sensitive; what a line with two spaces or a tab after the keyword, white
// space before the keyword, an empty text, a blank line, a comment, an unknown
// keyword, an escape not in the list, single quotation marks, a quotation mark
// inside the text or an unterminated quotation mark does; what a send line with
// characters after its closing quotation mark sends; how an unquoted line that
// ends in CR is read; whether a last line without LF is read; and what decides
// the result of a script with no expect at all. The one assumption the
// simulator makes, stated in its output and docs: an expect is compared with
// the next server reply of the transcript, and a reply is a run of "S:" lines
// that a "C:" line or a blank line ends. Wherever that assumption could change
// the verdict (a match that runs past the reply's first line), it stops with
// "undetermined" instead.
//
// THE PROTOCOL FACTS (hints, rules S6, S7, S15, S16) come from the RFCs read
// on rfc-editor.org on 2026-10-27: RFC 5321 (SMTP: lines end in CRLF, 2.3.8;
// greeting 220 or 554, 3.1 and 4.3.2; EHLO's multiline reply with "250-" on
// all but the last line, 4.1.1.1 and 4.2.1; QUIT and 221, 4.1.1.10), RFC 1939
// (POP3: commands and responses end in CRLF, +OK and -ERR in upper case,
// section 3; QUIT in the AUTHORIZATION state, section 4; USER and PASS,
// section 7), RFC 9051 (IMAP4rev2: lines end in CRLF, 2.2; LOGOUT answered by
// an untagged BYE before the tagged OK, 6.1.3; LOGIN carries a plaintext
// password, 6.2.3; the OK and BYE greetings, 7.1.1 and 7.1.5) and RFC 959
// (FTP: the Telnet end-of-line code is CRLF, section 4; replies and multi-line
// replies, 4.2; 120, 220, 221, 230, 331, 421).
//
// STATIC AND LOCAL. Nothing is sent anywhere; the transcript is text the
// reader pastes. Pure and deterministic: no clock, no randomness, no I/O. Every
// scan is a single bounded pass over a line; the only regular expressions are
// anchored and linear (ReDoS-safe).
// ============================================================================

/** The input: the script file's text and, optionally, a server transcript in "S:" / "C:" notation. */
export interface ScriptedMonitorInput {
  /** The script, as the file would hold it. */
  script: string;
  /** The server's side of a session: "S:" lines from the server, "C:" lines from the client; optional. */
  transcript?: string;
}

/** The largest script the engine reads, in characters (a monitor script is a handful of lines). */
export const SCRIPT_MAX_CHARS = 32768;
/** The largest transcript the engine reads, in characters. */
export const TRANSCRIPT_MAX_CHARS = 65536;
/** How much of a line or a reply is shown back, in characters, so a pasted log cannot flood the page. */
const SHOW_MAX = 240;

/** How serious a finding is: error = breaks a rule F5 states; warning = something F5 leaves open; info = advice. */
export type Severity = "error" | "warning" | "info";

/** The rule ids, S1 to S16 (the UI and the docs word each one). */
export type RuleId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8" | "S9" | "S10" | "S11" | "S12" | "S13" | "S14" | "S15" | "S16";

/** One finding against a rule, on a line. */
export interface Finding {
  /** The rule. */
  rule: RuleId;
  /** How serious. */
  severity: Severity;
  /** The 1-based line of the script. */
  line: number;
  /** Details for the sentence; `what` picks the variant when a rule has several. */
  params?: Record<string, string | number>;
}

/** Why the simulator cannot decide a line: each is something F5's text does not settle. */
export type OpenReason =
  | "crlf" // an unquoted line, or a send, that ends in CR
  | "separator" // two or more spaces, or a tab, after the keyword
  | "leading-space" // white space before the keyword
  | "unknown-keyword" // a first word that is not send or expect
  | "unknown-escape" // a backslash sequence not in F5's list
  | "quote-form" // single quotes, an unterminated quote, a quote inside unquoted text
  | "empty-text" // nothing to send or match
  | "blank-line" // an empty line between instructions
  | "send-after-quote" // a send with characters after its closing quote
  | "last-line-no-lf" // an expect on a last line that has no LF
  | "case-only" // the reply starts with the text in another case
  | "spans-lines" // the match runs past the end of the reply's first line
  | "no-expect"; // the script never checks anything

/** Why the simulated check fails at a line: each follows from a sentence F5 states. */
export type FailReason =
  | "not-prefix" // the text occurs in the reply, but not at its start
  | "mismatch" // the reply does not start with the text and does not contain it
  | "reply-shorter" // the reply ends before the text does
  | "after-quote" // characters after the closing quotation mark (F5: they break the match)
  | "crlf-after-quote" // the CR of a CR-LF ending sits after the closing quotation mark
  | "no-reply"; // the transcript has no further reply: the target does not respond

/** A protocol fact a reply or command matches, for the explanation (the UI words each id with its RFC). */
export type HintId =
  | "reply-220" | "reply-221" | "reply-250" | "reply-554" | "reply-421" | "reply-120" | "reply-230" | "reply-331"
  | "reply-pop-ok" | "reply-pop-err" | "reply-imap-ok" | "reply-imap-preauth" | "reply-imap-bye"
  | "cmd-helo" | "cmd-ehlo" | "cmd-quit" | "cmd-noop" | "cmd-user" | "cmd-pass" | "cmd-imap-logout" | "cmd-imap-capability" | "cmd-imap-noop" | "cmd-imap-login";

/** How a send's text ends. */
export type SendEnding = "crlf" | "lf" | "cr" | "none";

/** One line of the script, read as the monitor reads it. */
export interface ScriptLine {
  /** The 1-based line number. */
  line: number;
  /** The line as written, control characters made visible, bounded. */
  raw: string;
  /** What the line is: an instruction, a blank line, or a first word F5 does not document. */
  kind: "send" | "expect" | "blank" | "unknown";
  /** The first word as written (empty for a blank line). */
  keyword: string;
  /** The text after the keyword and its separator, as written, made visible (masked when it carries a secret). */
  written: string;
  /** Whether the text is written between double quotation marks. */
  quoted: boolean;
  /** The text as the monitor would read it (quotes removed, escapes resolved), made visible; null when F5 leaves it open. */
  decoded: string | null;
  /** The decoded text's length in bytes (characters), or null. */
  length: number | null;
  /** How a send's text ends; null for anything else or an undecided text. */
  ending: SendEnding | null;
  /** The protocol fact the text matches, or null. */
  hint: HintId | null;
  /** Whether the line sends a credential (shown masked). */
  secret: boolean;
  /** F5's rule decides that this expect cannot match (characters after the closing quote), or null. */
  breaks: "after-quote" | "crlf-after-quote" | null;
  /** The first thing F5 leaves open on this line, or null. */
  open: OpenReason | null;
}

/** One server reply or client line of the transcript. */
interface Reply {
  /** The reply's bytes: its "S:" lines, each followed by CR LF. */
  text: string;
  /** The transcript line it starts on. */
  fromLine: number;
}

/** What the transcript held. */
export interface TranscriptInfo {
  /** Server replies (runs of "S:" lines). */
  replies: number;
  /** Client lines ("C:"). */
  clientLines: number;
  /** Transcript lines that were neither "S:", "C:" nor blank, and were ignored (1-based). */
  ignoredLines: number[];
}

/** One step of the simulated check: one line of the script. */
export interface SimStep {
  /** The script line. */
  line: number;
  /** send or expect, or blank / unknown when the step stopped on such a line. */
  kind: ScriptLine["kind"];
  /** The text, visible (masked for a secret), or null when undecided. */
  text: string | null;
  /** For an expect: the server reply it was compared with, visible and bounded; null when none. */
  reply: string | null;
  /** For an expect: the 1-based number of that reply in the transcript; null when none. */
  replyNo: number | null;
  /** For a send: the matching "C:" line of the transcript, visible, or null when the transcript has none left. */
  client: string | null;
  /** For a send: the transcript shows the client sending something else. */
  clientDiffers: boolean;
  /** What happened on this line. */
  outcome: "sent" | "matched" | "failed" | "undetermined" | "skipped";
  /** For a failed expect whose text occurs later in the reply: the 0-based offset. */
  foundAt: number | null;
}

/** The simulated check's account. */
export interface Simulation {
  /** pass: every line ran and every expect matched; fail: a line fails by F5's rules; undetermined: F5 leaves a line open. */
  verdict: "pass" | "fail" | "undetermined";
  /** The line the check stops on, or null for a pass. */
  stopLine: number | null;
  /** Why it stopped (null for a pass). */
  reason: FailReason | OpenReason | null;
  /** The steps, in order, up to and including the stop. */
  steps: SimStep[];
  /** Replies the script never read. */
  unreadReplies: number;
  /** "C:" lines no send matched up with. */
  unusedClientLines: number;
  /** Things the reader should know about this run (trailing blank lines, a last send without LF, differences from the transcript). */
  notes: ("trailing-blank" | "last-send-no-lf" | "client-differs")[];
}

/** The engine's answer. */
export interface ScriptedMonitorResult {
  /** Every line, read. */
  lines: ScriptLine[];
  /** The findings, in line order then rule order. */
  findings: Finding[];
  /** Findings by severity. */
  counts: { error: number; warning: number; info: number };
  /** send lines. */
  sends: number;
  /** expect lines. */
  expects: number;
  /** Whether the file ends with LF (a last line without LF is rule S13). */
  endsWithLf: boolean;
  /** What the transcript held, or null when none was given. */
  transcript: TranscriptInfo | null;
  /** The simulated check, or null when no transcript was given. */
  simulation: Simulation | null;
}

/** The rules, for the docs and the UI legend, with the severity each carries. */
export const RULES: readonly { id: RuleId; severity: Severity }[] = Object.freeze([
  // S1: a CR in a line (CR-LF endings); F5: LF only.
  { id: "S1", severity: "error" },
  // S2: not exactly one space after the keyword; F5: exactly one.
  { id: "S2", severity: "error" },
  // S3: characters after a closing quotation mark; F5: they break the match.
  { id: "S3", severity: "error" },
  // S4: a first word that is not send or expect.
  { id: "S4", severity: "error" },
  // S5: an escape sequence not in F5's list.
  { id: "S5", severity: "warning" },
  // S6: a send with no line ending, for a line protocol.
  { id: "S6", severity: "warning" },
  // S7: a send ending in LF alone or CR alone, where the RFCs require CR LF.
  { id: "S7", severity: "info" },
  // S8: an expect text written like a pattern (no wildcards, no regex).
  { id: "S8", severity: "info" },
  // S9: a blank line.
  { id: "S9", severity: "warning" },
  // S10: white space before the keyword.
  { id: "S10", severity: "warning" },
  // S11: a quotation form F5 does not describe.
  { id: "S11", severity: "warning" },
  // S12: an empty text.
  { id: "S12", severity: "warning" },
  // S13: the last line has no LF.
  { id: "S13", severity: "warning" },
  // S14: no expect line at all.
  { id: "S14", severity: "warning" },
  // S15: a credential in a send, kept in clear in the file and on the wire.
  { id: "S15", severity: "warning" },
  // S16: an expect on a reply code and a space, which a multi-line reply's first line never has.
  { id: "S16", severity: "info" },
]);

/** The escape sequences F5 lists, mapped to the character each stands for. */
const ESCAPES: Readonly<Record<string, string>> = Object.freeze({
  // Bell.
  a: "\x07",
  // Backspace.
  b: "\b",
  // Form feed.
  f: "\f",
  // New line (LF).
  n: "\n",
  // Return (CR).
  r: "\r",
  // Tab.
  t: "\t",
  // Vertical tab.
  v: "\v",
  // Backslash.
  "\\": "\\",
  // Single quotation mark.
  "'": "'",
});

/** First words that show an Expect (Tcl) script was pasted, for rule S4's hint. */
const EXPECT_WORDS = new Set(["spawn", "set", "exp_continue", "exp_send", "interact", "expect_before", "expect_after", "expect_user", "send_user", "proc", "close", "wait", "exit", "log_user", "log_file", "puts", "if", "while", "foreach", "}", "{", "#!/usr/bin/expect"]);

/** Make text readable on a page: control characters and the backslash written as escapes. */
export function visible(text: string): string {
  // One pass, one character at a time.
  let out = "";
  // Walk the string.
  for (const c of text) {
    // The character's code.
    const code = c.charCodeAt(0);
    // The escapes F5 lists, written as F5 writes them.
    if (c === "\r") out += "\\r";
    // New line.
    else if (c === "\n") out += "\\n";
    // Tab.
    else if (c === "\t") out += "\\t";
    // Bell.
    else if (c === "\x07") out += "\\a";
    // Backspace.
    else if (c === "\b") out += "\\b";
    // Form feed.
    else if (c === "\f") out += "\\f";
    // Vertical tab.
    else if (c === "\v") out += "\\v";
    // A backslash, doubled so it cannot be mistaken for an escape.
    else if (c === "\\") out += "\\\\";
    // Any other control character, or DEL, as a hex escape (shown only; not an F5 escape).
    else if (code < 0x20 || code === 0x7f) out += "\\x" + code.toString(16).padStart(2, "0");
    // Everything else as it is.
    else out += c;
  }
  // The visible text.
  return out;
}

/** Show a line as written: the characters typed stay as typed (a written \r stays two characters), and real control
 * characters, such as the CR of a CR-LF ending or a tab, are shown as Unicode control pictures (U+2400 to U+2421). */
export function pictured(text: string): string {
  // One pass.
  let out = "";
  // Walk the string.
  for (const c of text) {
    // The character's code.
    const code = c.charCodeAt(0);
    // C0 controls: their control picture (CR is U+240D, LF U+240A, tab U+2409).
    if (code < 0x20) out += String.fromCharCode(0x2400 + code);
    // DEL: U+2421.
    else if (code === 0x7f) out += "\u2421";
    // Everything else as it is.
    else out += c;
  }
  // The pictured text.
  return out;
}

/** Cut a visible string to the display bound, marking the cut. */
function bound(s: string): string {
  // Short enough: as it is.
  if (s.length <= SHOW_MAX) return s;
  // Otherwise cut, with an ellipsis that is not part of the text.
  return s.slice(0, SHOW_MAX) + "…";
}

/** Resolve F5's escape sequences in a text; report every backslash sequence F5 does not list. */
function decodeEscapes(text: string): { value: string; unknown: string[] } {
  // The resolved text.
  let value = "";
  // Sequences not in F5's list, as written.
  const unknown: string[] = [];
  // Walk the text.
  for (let i = 0; i < text.length; i++) {
    // The character.
    const c = text[i];
    // Not a backslash: copied.
    if (c !== "\\") { value += c; continue; }
    // A backslash at the very end has nothing to escape.
    if (i + 1 >= text.length) { unknown.push("\\"); value += c; continue; }
    // The character after it.
    const n = text[i + 1];
    // One of F5's sequences: resolved.
    if (Object.prototype.hasOwnProperty.call(ESCAPES, n)) value += ESCAPES[n];
    // Anything else: kept as written and reported.
    else { unknown.push("\\" + n); value += "\\" + n; }
    // Past the pair.
    i++;
  }
  // The text and the unknown sequences.
  return { value, unknown };
}

/** The protocol fact an expect text's start matches, from the RFCs read 2026-10-27. */
function replyHint(text: string): HintId | null {
  // Three-digit reply codes of SMTP (RFC 5321) and FTP (RFC 959), by the first three characters.
  const code = text.slice(0, 3);
  // The greeting of both.
  if (code === "220") return "reply-220";
  // The reply to QUIT in both.
  if (code === "221") return "reply-221";
  // SMTP's success reply.
  if (code === "250") return "reply-250";
  // SMTP's refusal greeting.
  if (code === "554") return "reply-554";
  // Service not available.
  if (code === "421") return "reply-421";
  // FTP: ready in nnn minutes.
  if (code === "120") return "reply-120";
  // FTP: logged in.
  if (code === "230") return "reply-230";
  // FTP: user name okay, need password.
  if (code === "331") return "reply-331";
  // POP3's positive indicator (RFC 1939: always upper case).
  if (text.startsWith("+OK")) return "reply-pop-ok";
  // POP3's negative indicator.
  if (text.startsWith("-ERR")) return "reply-pop-err";
  // IMAP's untagged OK, the not-authenticated greeting (RFC 9051 7.1.1).
  if (text.startsWith("* OK")) return "reply-imap-ok";
  // IMAP's pre-authenticated greeting.
  if (text.startsWith("* PREAUTH")) return "reply-imap-preauth";
  // IMAP's BYE: a logout, or a refused connection (RFC 9051 7.1.5).
  if (text.startsWith("* BYE")) return "reply-imap-bye";
  // Nothing recognised.
  return null;
}

/** The protocol fact a send's command matches (commands are case-insensitive in all four protocols). */
function commandHint(text: string): HintId | null {
  // The first two words, upper-cased; the line ending is not part of them.
  const words = text.replace(/[\r\n]+$/, "").split(" ");
  // The first word.
  const w0 = (words[0] ?? "").toUpperCase();
  // The second word (IMAP's command, after the tag).
  const w1 = (words[1] ?? "").toUpperCase();
  // SMTP HELO.
  if (w0 === "HELO") return "cmd-helo";
  // SMTP EHLO.
  if (w0 === "EHLO") return "cmd-ehlo";
  // QUIT: SMTP, POP3 and FTP.
  if (w0 === "QUIT") return "cmd-quit";
  // NOOP: SMTP and POP3.
  if (w0 === "NOOP") return "cmd-noop";
  // USER: POP3 and FTP.
  if (w0 === "USER") return "cmd-user";
  // PASS: POP3 and FTP.
  if (w0 === "PASS") return "cmd-pass";
  // IMAP commands come after a tag.
  if (words.length >= 2 && w0 !== "") {
    // LOGOUT.
    if (w1 === "LOGOUT") return "cmd-imap-logout";
    // CAPABILITY.
    if (w1 === "CAPABILITY") return "cmd-imap-capability";
    // NOOP.
    if (w1 === "NOOP") return "cmd-imap-noop";
    // LOGIN.
    if (w1 === "LOGIN") return "cmd-imap-login";
  }
  // Nothing recognised.
  return null;
}

/** Mask the credential in a send's decoded text (PASS x, or tag LOGIN user password); null when there is none. */
function maskSecret(text: string): string | null {
  // The line ending, kept visible after the mask.
  const m = /^([\s\S]*?)(\r?\n?)$/.exec(text);
  // The body and its ending.
  const body = m ? m[1] : text;
  // Its ending.
  const end = m ? m[2] : "";
  // POP3 and FTP: PASS <password> (RFC 1939 section 7, RFC 959 4.1.1).
  const pass = /^(PASS )(.+)$/i.exec(body);
  // Masked: one bullet per character.
  if (pass) return pass[1] + "•".repeat(pass[2].length) + end;
  // IMAP: <tag> LOGIN <user> <password> (RFC 9051 6.2.3).
  const login = /^(\S+ LOGIN \S+ )(.+)$/i.exec(body);
  // Masked.
  if (login) return login[1] + "•".repeat(login[2].length) + end;
  // No credential.
  return null;
}

/** The credential a send carries (the password of PASS x, or of tag LOGIN user password), or null. */
function secretOf(text: string): string | null {
  // The text without its line ending.
  const body = text.replace(/\r?\n?$/, "");
  // PASS <password>.
  const pass = /^PASS (.+)$/i.exec(body);
  // Found.
  if (pass) return pass[1];
  // <tag> LOGIN <user> <password>.
  const login = /^\S+ LOGIN \S+ (.+)$/i.exec(body);
  // Found, or none.
  return login ? login[1] : null;
}

/** Replace the LAST occurrence of a secret in a string with bullets (the password comes after the user name, which may
 * be the same text); null when the secret is unknown or does not occur verbatim (it was written with escapes). */
function maskLast(s: string, secret: string | null): string | null {
  // Nothing to mask.
  if (secret === null || secret === "") return null;
  // Where it last occurs.
  const at = s.lastIndexOf(secret);
  // Not there verbatim.
  if (at < 0) return null;
  // The string with that occurrence masked.
  return s.slice(0, at) + "•".repeat(secret.length) + s.slice(at + secret.length);
}

/** Read one line of the script. Findings go into F; the returned record says what the line is. */
function readLine(lineNo: number, L: string, F: Finding[]): ScriptLine {
  // A finding on this line.
  const add = (rule: RuleId, severity: Severity, params?: Record<string, string | number>) => F.push({ rule, severity, line: lineNo, ...(params ? { params } : {}) });
  // The record, filled in below.
  const rec: ScriptLine = { line: lineNo, raw: bound(pictured(L)), kind: "unknown", keyword: "", written: "", quoted: false, decoded: null, length: null, ending: null, hint: null, secret: false, breaks: null, open: null };
  // Set the first open question only (later ones do not change where the simulator stops).
  const openAt = (r: OpenReason) => { if (rec.open === null) rec.open = r; };
  // A CR anywhere: the file uses CR-LF (CR at the end) or CR line endings (CR inside).
  const crAtEnd = L.endsWith("\r");
  // CR somewhere else in the line.
  const crInside = L.slice(0, crAtEnd ? -1 : undefined).includes("\r");

  // A blank line: nothing but spaces, tabs and CR.
  if (/^[ \t\r]*$/.test(L)) {
    // The record.
    rec.kind = "blank";
    // S1 too, when the blank line carries the CR of a CR-LF ending.
    if (crAtEnd) add("S1", "error", { what: "crlf", kind: "blank" });
    // S9 is added by the caller, who knows whether the line is trailing.
    return rec;
  }

  // White space before the keyword: F5 does not say how it is read.
  const lead = /^[ \t]+/.exec(L);
  // Flag it and carry on reading after it.
  if (lead) { add("S10", "warning"); openAt("leading-space"); }
  // The line without that white space.
  const body = lead ? L.slice(lead[0].length) : L;
  // The keyword: everything up to a space, a tab or a CR.
  const kw = /^[^ \t\r]*/.exec(body)![0];
  // Recorded as written.
  rec.keyword = kw;
  // What follows the keyword.
  const rest = body.slice(kw.length);

  // Not send or expect: F5 documents only those two.
  if (kw !== "send" && kw !== "expect") {
    // The kind of mistake, for the hint: a case variant, a comment, Expect's own syntax, or something else.
    const what = kw.toLowerCase() === "send" || kw.toLowerCase() === "expect" ? "case" : EXPECT_WORDS.has(kw) || kw.startsWith("#!") ? "tcl" : kw.startsWith("#") ? "comment" : "other";
    // The finding.
    add("S4", "error", { what, keyword: bound(pictured(kw)) });
    // The CR rule still applies to the line.
    if (crAtEnd || crInside) add("S1", "error", { what: crAtEnd ? "crlf" : "cr", kind: "unknown" });
    // The simulator cannot say what the monitor does with it.
    openAt("unknown-keyword");
    // The rest of the line, shown as written.
    rec.written = bound(pictured(rest.replace(/^[ \t]/, "")));
    // Done with this line.
    return rec;
  }

  // An instruction.
  rec.kind = kw;
  // The separator: exactly one space (F5), or something else.
  let text: string;
  // Nothing after the keyword at all (or only the CR): an empty text.
  if (rest === "" || rest === "\r") text = rest;
  // Two or more spaces: S2.
  else if (rest.startsWith("  ")) {
    // How many.
    const n = /^ +/.exec(rest)![0].length;
    // The finding.
    add("S2", "error", { what: "spaces", count: n });
    // Open.
    openAt("separator");
    // The text, for the explanation, after all of them.
    text = rest.slice(n);
  } else if (rest.startsWith("\t")) {
    // A tab where the space should be: S2.
    add("S2", "error", { what: "tab" });
    // Open.
    openAt("separator");
    // The text, for the explanation, after the run of blanks.
    text = rest.replace(/^[ \t]+/, "");
  } else {
    // Exactly one space: the text starts after it (F5's rule).
    text = rest.slice(1);
  }

  // The CR of a CR-LF ending, or a CR inside the line: S1 (with the detail the simulator needs).
  if (crAtEnd || crInside) add("S1", "error", { what: crAtEnd ? "crlf" : "cr", kind: kw });
  // A CR inside the line (a file with CR line endings, or a stray CR): F5 does not say how it is read.
  if (crInside) openAt("crlf");

  // The text as written, made visible (masked later if it turns out to be a secret).
  rec.written = bound(pictured(text));
  // The part between the quotes (or the whole text when unquoted), before escapes are resolved.
  let inner: string;
  // Double quotation marks: find the closing one; a backslash protects the next character.
  if (text.startsWith('"')) {
    // Quoted.
    rec.quoted = true;
    // The closing quote's index, or -1.
    let close = -1;
    // Scan after the opening quote.
    for (let i = 1; i < text.length; i++) {
      // A backslash and the character after it are one unit.
      if (text[i] === "\\") { i++; continue; }
      // The first unprotected quote closes the text.
      if (text[i] === '"') { close = i; break; }
    }
    // No closing quote: F5 does not describe it.
    if (close < 0) {
      // The finding.
      add("S11", "warning", { what: "unterminated" });
      // Open.
      openAt("quote-form");
      // The content, for the explanation.
      inner = text.slice(1).replace(/\r$/, "");
    } else {
      // The content between the quotes.
      inner = text.slice(1, close);
      // What follows the closing quote.
      const after = text.slice(close + 1);
      // The CR of a CR-LF ending alone after the quote.
      const onlyCr = after === "\r";
      // Other characters after the quote: S3 (F5: they break the match).
      const extra = crAtEnd ? after.slice(0, -1) : after;
      // Flag them.
      if (extra !== "") add("S3", "error", { after: bound(pictured(extra)), kind: kw });
      // For an expect, F5 decides: the match breaks.
      if (kw === "expect" && extra !== "") rec.breaks = "after-quote";
      // Only the CR after the quote: the match breaks too (the CR is a character after the closing quote).
      else if (kw === "expect" && onlyCr) rec.breaks = "crlf-after-quote";
      // For a send, F5 does not say what is sent.
      if (kw === "send" && extra !== "") openAt("send-after-quote");
      // A send whose quote is followed only by the CR: F5 does not say what is sent either.
      else if (kw === "send" && onlyCr) openAt("crlf");
    }
  } else if (text.startsWith("'")) {
    // Single quotation marks: F5 lists an escape for them but does not say whether they delimit a text.
    add("S11", "warning", { what: "single" });
    // Open.
    openAt("quote-form");
    // The text, as written, for the explanation.
    inner = text.replace(/\r$/, "");
  } else {
    // Unquoted: the text runs to the end of the line (F5's rule).
    inner = text;
    // A quotation mark inside an unquoted text: F5 does not say how it is read.
    if (inner.includes('"')) { add("S11", "warning", { what: "inner" }); openAt("quote-form"); }
    // An unquoted line ending in CR: F5 says LF only, but not how the CR is then read.
    if (crAtEnd || crInside) openAt("crlf");
  }

  // Resolve the escapes F5 lists; report the others.
  const dec = decodeEscapes(inner);
  // Each unknown sequence once per line.
  for (const u of Array.from(new Set(dec.unknown))) add("S5", "warning", { seq: u });
  // Unknown sequences leave the text open.
  if (dec.unknown.length > 0) openAt("unknown-escape");
  // Nothing to send or match.
  if (dec.value === "" || (dec.value === "\r" && !rec.quoted)) { add("S12", "warning"); openAt("empty-text"); }

  // The text without the file's own CR (an unquoted line of a CR-LF file), for the ending and the hints.
  const vEnd = crAtEnd && !rec.quoted ? dec.value.slice(0, -1) : dec.value;
  // A send: its ending, its command, a credential.
  if (kw === "send") {
    // The resolved text (shown with the file's CR, if any, so the reader sees it).
    const v = dec.value;
    // Whether the ending can be judged: not when an unknown escape leaves the text open.
    const judged = dec.unknown.length === 0;
    // How it ends, ignoring the file's own CR; null when it cannot be judged.
    rec.ending = !judged ? null : vEnd.endsWith("\r\n") ? "crlf" : vEnd.endsWith("\n") ? "lf" : vEnd.endsWith("\r") ? "cr" : "none";
    // No line ending: a line-protocol server waits for one (S6); skipped for an empty text, already S12.
    if (judged && rec.ending === "none" && vEnd !== "") add("S6", "warning");
    // LF alone or CR alone where the RFCs require CR LF (S7).
    if (judged && (rec.ending === "lf" || rec.ending === "cr")) add("S7", "info", { what: rec.ending });
    // The command's protocol fact.
    rec.hint = commandHint(vEnd);
    // A credential: masked everywhere, flagged (S15).
    const masked = maskSecret(v);
    // The secret itself (the password as resolved), to find it in the written form.
    const secretValue = secretOf(v);
    // Found one.
    if (masked !== null) {
      // Marked.
      rec.secret = true;
      // The finding, with the masked text.
      add("S15", "warning", { text: bound(visible(masked)) });
      // The written form is masked as well, so the secret is never shown back: the secret as typed is replaced
      // when it appears there verbatim; otherwise (it was written with escapes) the whole text is masked.
      rec.written = bound(maskLast(pictured(text), secretValue) ?? "•".repeat(Math.max(1, pictured(text).length)));
      // The line as written, the same way: the keyword and its separator, then the masked text.
      rec.raw = bound(maskLast(pictured(L), secretValue) ?? pictured(kw) + " " + rec.written);
    }
    // The decoded text for display, masked when secret.
    rec.decoded = rec.open === null || rec.open === "crlf" ? bound(visible(masked ?? v)) : null;
  } else {
    // An expect: the resolved text (shown with the file's CR, if any).
    const v = dec.value;
    // Written like a pattern: a leading ^, a trailing $, .* or .+, or an Expect flag (S8).
    if (/^\^/.test(vEnd) || /\$$/.test(vEnd) || vEnd.includes(".*") || vEnd.includes(".+") || /^-(re|gl|ex|nocase) /.test(vEnd)) add("S8", "info", { text: bound(visible(vEnd)) });
    // A reply code and a space: a multi-line reply's first line has a hyphen there (S16).
    if (/^[1-5][0-9][0-9] /.test(vEnd)) add("S16", "info", { code: vEnd.slice(0, 3) });
    // The reply's protocol fact.
    rec.hint = replyHint(vEnd);
    // The decoded text for display (kept when only the CR question is open, so the reader sees the CR).
    rec.decoded = rec.open === null || rec.open === "crlf" ? bound(visible(v)) : null;
  }
  // The decoded length, when the text is settled.
  rec.length = rec.decoded === null ? null : dec.value.length;
  // The record.
  return rec;
}

/** Split the transcript into replies (runs of "S:" lines) and client lines ("C:"). */
function readTranscript(t: string): { replies: Reply[]; client: string[]; info: TranscriptInfo } {
  // The replies.
  const replies: Reply[] = [];
  // The client lines.
  const client: string[] = [];
  // Lines that are not S:, C: or blank.
  const ignored: number[] = [];
  // The reply being built, or null.
  let cur: Reply | null = null;
  // Line by line; a CR before the LF (a transcript saved on Windows) is not part of the line.
  const lines = t.split("\n");
  // Walk them.
  for (let i = 0; i < lines.length; i++) {
    // The line without a trailing CR.
    const l = lines[i].replace(/\r$/, "");
    // "S:" or "C:", either case, then the line; the blanks after the colon are notation, not data.
    const m = /^[ \t]*([SsCc]):[ \t]*(.*)$/.exec(l);
    // A blank line ends the current reply.
    if (!m && l.trim() === "") { cur = null; continue; }
    // Anything else is ignored and reported.
    if (!m) { ignored.push(i + 1); continue; }
    // A server line: joins the current reply, or starts one; each line ends in CR LF (RFC 5321 2.3.8, RFC 1939 3, RFC 9051 2.2, RFC 959 4).
    if (m[1] === "S" || m[1] === "s") {
      // Start a reply when none is open.
      if (cur === null) { cur = { text: "", fromLine: i + 1 }; replies.push(cur); }
      // Append the line with its CR LF.
      cur.text += m[2] + "\r\n";
    } else {
      // A client line ends the current reply and is kept for comparison with the sends.
      cur = null;
      // Kept with the CR LF the client would have sent.
      client.push(m[2] + "\r\n");
    }
  }
  // The parts and the summary.
  return { replies, client, info: { replies: replies.length, clientLines: client.length, ignoredLines: ignored } };
}

/** Simulate the check against the transcript, line by line. */
function simulate(lines: ScriptLine[], decodedRaw: Map<number, string>, endsWithLf: boolean, tr: { replies: Reply[]; client: string[] }): Simulation {
  // The steps.
  const steps: SimStep[] = [];
  // The notes.
  const notes: Simulation["notes"] = [];
  // The next reply and client line to use.
  let r = 0;
  // The next client line.
  let c = 0;
  // The last line that is not blank: blank lines after it are trailing.
  let lastReal = -1;
  // Find it.
  for (let i = lines.length - 1; i >= 0; i--) if (lines[i].kind !== "blank") { lastReal = i; break; }
  // How many expects.
  const expectCount = lines.filter((l) => l.kind === "expect").length;
  // Stop with a verdict.
  const stop = (verdict: Simulation["verdict"], stopLine: number, reason: FailReason | OpenReason): Simulation => ({ verdict, stopLine, reason, steps, unreadReplies: tr.replies.length - r, unusedClientLines: tr.client.length - c, notes });

  // Line by line, in the order of the file (F5: "the lines of the file are always read in the sequence specified").
  for (let i = 0; i < lines.length; i++) {
    // The line.
    const ln = lines[i];
    // A blank line after the last instruction: noted, not a stop.
    if (ln.kind === "blank" && i > lastReal) {
      // Once.
      if (!notes.includes("trailing-blank")) notes.push("trailing-blank");
      // Next.
      continue;
    }
    // A blank line between instructions: F5 does not say how it is read.
    if (ln.kind === "blank") {
      // The step.
      steps.push({ line: ln.line, kind: "blank", text: null, reply: null, replyNo: null, client: null, clientDiffers: false, outcome: "undetermined", foundAt: null });
      // Stop.
      return stop("undetermined", ln.line, "blank-line");
    }
    // The resolved text (raw, not visible), when settled.
    const raw = decodedRaw.get(ln.line) ?? null;
    // An expect: F5's after-quote rule decides first, whatever else is open on the line.
    if (ln.kind === "expect" && ln.breaks !== null) {
      // The reply it would have read, for context.
      const rep = tr.replies[r] ?? null;
      // Consumed, as the monitor would have read it.
      if (rep) r++;
      // The step.
      steps.push({ line: ln.line, kind: "expect", text: ln.decoded, reply: rep ? bound(visible(rep.text)) : null, replyNo: rep ? r : null, client: null, clientDiffers: false, outcome: "failed", foundAt: null });
      // Stop: the match is broken.
      return stop("fail", ln.line, ln.breaks);
    }
    // Something F5 leaves open on this line: stop, saying what.
    if (ln.open !== null) {
      // The step.
      steps.push({ line: ln.line, kind: ln.kind, text: ln.decoded, reply: null, replyNo: null, client: null, clientDiffers: false, outcome: "undetermined", foundAt: null });
      // Stop.
      return stop("undetermined", ln.line, ln.open);
    }
    // A send: it goes out; the transcript's next client line is compared with it.
    if (ln.kind === "send") {
      // The client line, if the transcript has one left.
      const cl = tr.client[c] ?? null;
      // Consumed.
      if (cl !== null) c++;
      // Differs from what the script sends.
      const differs = cl !== null && raw !== null && cl !== raw;
      // Noted once.
      if (differs && !notes.includes("client-differs")) notes.push("client-differs");
      // A last line without LF that is a send: noted (the check's outcome does not depend on it).
      if (i === lines.length - 1 && !endsWithLf && !notes.includes("last-send-no-lf")) notes.push("last-send-no-lf");
      // The step (the client line masked if this send is a secret).
      steps.push({ line: ln.line, kind: "send", text: ln.decoded, reply: null, replyNo: null, client: cl === null ? null : ln.secret ? ln.decoded : bound(visible(cl)), clientDiffers: differs, outcome: "sent", foundAt: null });
      // Next line.
      continue;
    }
    // An expect on a last line without LF: F5 does not say whether it is read.
    if (i === lines.length - 1 && !endsWithLf) {
      // The step.
      steps.push({ line: ln.line, kind: "expect", text: ln.decoded, reply: null, replyNo: null, client: null, clientDiffers: false, outcome: "undetermined", foundAt: null });
      // Stop.
      return stop("undetermined", ln.line, "last-line-no-lf");
    }
    // An expect: the next reply.
    const rep = tr.replies[r] ?? null;
    // None left: the target does not respond (F5: considered down when the Timeout runs out).
    if (rep === null) {
      // The step.
      steps.push({ line: ln.line, kind: "expect", text: ln.decoded, reply: null, replyNo: null, client: null, clientDiffers: false, outcome: "failed", foundAt: null });
      // Stop.
      return stop("fail", ln.line, "no-reply");
    }
    // Consumed.
    r++;
    // The text (always settled here: open lines stopped above).
    const D = raw ?? "";
    // The reply.
    const R = rep.text;
    // The step, completed below.
    const step: SimStep = { line: ln.line, kind: "expect", text: ln.decoded, reply: bound(visible(R)), replyNo: r, client: null, clientDiffers: false, outcome: "matched", foundAt: null };
    // Recorded.
    steps.push(step);
    // A prefix of the reply (F5's rule): a match, unless it runs past the reply's first line.
    if (R.startsWith(D)) {
      // The end of the reply's first line (its LF), or -1.
      const lf = R.indexOf("\n");
      // The match ends after that LF: whether the monitor has read that far is not documented.
      if (lf >= 0 && D.length > lf + 1) { step.outcome = "undetermined"; return stop("undetermined", ln.line, "spans-lines"); }
      // Matched.
      continue;
    }
    // The same text in another case: F5 does not say whether the comparison is case-sensitive.
    if (R.toLowerCase().startsWith(D.toLowerCase())) { step.outcome = "undetermined"; return stop("undetermined", ln.line, "case-only"); }
    // The reply is a proper beginning of the text: it ends before the text does.
    if (D.startsWith(R)) { step.outcome = "failed"; return stop("fail", ln.line, "reply-shorter"); }
    // The text occurs later in the reply: a substring that is not a prefix (F5: cannot match).
    const at = R.indexOf(D);
    // Found later.
    if (at > 0) { step.outcome = "failed"; step.foundAt = at; return stop("fail", ln.line, "not-prefix"); }
    // Not there at all.
    step.outcome = "failed";
    // Stop.
    return stop("fail", ln.line, "mismatch");
  }
  // Every line ran. With no expect, nothing was checked and F5 does not say what decides the result.
  if (expectCount === 0) return { verdict: "undetermined", stopLine: null, reason: "no-expect", steps, unreadReplies: tr.replies.length - r, unusedClientLines: tr.client.length - c, notes };
  // Every expect matched its reply: the check passes.
  return { verdict: "pass", stopLine: null, reason: null, steps, unreadReplies: tr.replies.length - r, unusedClientLines: tr.client.length - c, notes };
}

/** The engine: read the script, explain it, flag it, and simulate it when a transcript is given. */
export function run(input: ScriptedMonitorInput): ScriptedMonitorResult {
  // The script, as given (line endings are NOT normalised: a CR is evidence for rule S1).
  const script = input.script ?? "";
  // The transcript, possibly empty.
  const transcript = input.transcript ?? "";
  // Refuse the oversized, with a message the page can show.
  if (script.length > SCRIPT_MAX_CHARS) throw new Error(`The script is longer than ${SCRIPT_MAX_CHARS} characters.`);
  // The transcript too.
  if (transcript.length > TRANSCRIPT_MAX_CHARS) throw new Error(`The transcript is longer than ${TRANSCRIPT_MAX_CHARS} characters.`);
  // The findings.
  const F: Finding[] = [];
  // Whether the file ends with LF.
  const endsWithLf = script.endsWith("\n");
  // The lines: split on LF only (F5's line ending); a final LF does not start another line.
  const parts = script === "" ? [] : script.split("\n");
  // Drop the empty string after a final LF.
  if (endsWithLf) parts.pop();
  // Each line read.
  const lines: ScriptLine[] = [];
  // The resolved text of each settled line, raw (the simulator compares bytes, not the visible form).
  const decodedRaw = new Map<number, string>();
  // Read them.
  for (let i = 0; i < parts.length; i++) {
    // The record.
    const rec = readLine(i + 1, parts[i], F);
    // Kept.
    lines.push(rec);
    // The raw resolved text, recomputed exactly as readLine did, for settled send and expect lines.
    if ((rec.kind === "send" || rec.kind === "expect") && (rec.open === null || rec.breaks !== null)) decodedRaw.set(rec.line, rawText(parts[i]));
  }
  // The last line that is not blank, so trailing blank lines can be told apart.
  let lastReal = -1;
  // Find it.
  for (let i = lines.length - 1; i >= 0; i--) if (lines[i].kind !== "blank") { lastReal = i; break; }
  // S9 for every blank line, with whether it is trailing.
  for (let i = 0; i < lines.length; i++) if (lines[i].kind === "blank") F.push({ rule: "S9", severity: "warning", line: lines[i].line, params: { trailing: i > lastReal ? 1 : 0 } });
  // S13: the last line has no LF (only when the file has content).
  if (lines.length > 0 && !endsWithLf) F.push({ rule: "S13", severity: "warning", line: lines.length });
  // Count the instructions.
  const sends = lines.filter((l) => l.kind === "send").length;
  // And the checks.
  const expects = lines.filter((l) => l.kind === "expect").length;
  // S14: instructions, but no expect at all.
  if (lines.some((l) => l.kind === "send" || l.kind === "expect" || l.kind === "unknown") && expects === 0) F.push({ rule: "S14", severity: "warning", line: 1 });
  // Order: by line, then by rule number.
  F.sort((a, b) => a.line - b.line || Number(a.rule.slice(1)) - Number(b.rule.slice(1)));
  // Count by severity.
  const counts = { error: 0, warning: 0, info: 0 };
  // Tally.
  for (const f of F) counts[f.severity]++;
  // The transcript, when there is one.
  const tr = transcript.trim() === "" ? null : readTranscript(transcript);
  // The simulation, when there is a transcript and a script.
  const simulation = tr && lines.length > 0 ? simulate(lines, decodedRaw, endsWithLf, tr) : null;
  // The answer.
  return { lines, findings: F, counts, sends, expects, endsWithLf, transcript: tr ? tr.info : null, simulation };
}

/** The resolved text of a settled send or expect line (one space after the keyword, quotes removed, escapes resolved). */
function rawText(L: string): string {
  // After the keyword and its single space.
  const text = L.slice(L.indexOf(" ") + 1);
  // Quoted: the content up to the first unprotected closing quote.
  if (text.startsWith('"')) {
    // Scan.
    for (let i = 1; i < text.length; i++) {
      // A backslash and the next character are one unit.
      if (text[i] === "\\") { i++; continue; }
      // The closing quote.
      if (text[i] === '"') return decodeEscapes(text.slice(1, i)).value;
    }
    // Unterminated (not reached for settled lines).
    return decodeEscapes(text.slice(1)).value;
  }
  // Unquoted: the whole rest of the line.
  return decodeEscapes(text).value;
}

// ---------------------------------------------------------------------------
// Share results: the copy a link carries (2026-10-27)
// ---------------------------------------------------------------------------
// This page never shows a PASS or LOGIN password (rule S15: one bullet per
// character, everywhere). A Share results link never carries one either:
// shareableScript() returns both boxes with each such password replaced, in the
// script as written and in the transcript's "C:" lines, by the same bullets the
// page shows. The receiving page then reads exactly what the sender's page
// showed: the same lines, findings, masks and simulation (the tool's share
// vectors compare the two results whole). A password the page could not find
// as written (it was written with escape sequences, so the page masks the
// whole text) cannot be replaced safely: the copy is refused, with the line.
// Other credentials, such as an SMTP AUTH exchange (RFC 4954), are not masked
// by the page and are not replaced here; the page says so beside the button.

/** What shareableScript gives: the copy, or the line whose password cannot be replaced. */
export type ShareableScript =
  | { ok: true; script: string; transcript: string; redacted: number } // both boxes, and how many passwords were replaced
  | { ok: false; line: number }; // a password written with escape sequences, on this line of the script

/**
 * The secret on one script line, when it is a send that carries a PASS or LOGIN password, found as readLine finds it.
 * @param L the line as written (without its LF)
 * @returns null when the line carries none; the password and whether the page finds it as written otherwise
 */
function lineSecret(L: string): { secret: string; found: boolean } | null {
  // White space before the keyword is skipped, as readLine skips it.
  const body = L.replace(/^[ \t]+/, "");
  // The keyword: everything up to a space, a tab or a CR.
  const kw = /^[^ \t\r]*/.exec(body)![0];
  // Only a send carries a credential.
  if (kw !== "send") return null;
  // What follows the keyword.
  const rest = body.slice(kw.length);
  // The text, after the separator as readLine reads it: none, two or more spaces, a tab, or exactly one space.
  const text = rest === "" || rest === "\r" ? rest : rest.startsWith("  ") ? rest.replace(/^ +/, "") : rest.startsWith("\t") ? rest.replace(/^[ \t]+/, "") : rest.slice(1);
  // The part the escapes are resolved in, as readLine takes it.
  let inner: string;
  // Double quotation marks: up to the first unprotected closing quote, or the rest when there is none.
  if (text.startsWith('"')) {
    // The closing quote's index, or -1.
    let close = -1;
    // A backslash and the character after it are one unit.
    for (let i = 1; i < text.length; i++) { if (text[i] === "\\") { i++; continue; } if (text[i] === '"') { close = i; break; } }
    // Between the quotes, or (unterminated) the rest without the file's CR.
    inner = close < 0 ? text.slice(1).replace(/\r$/, "") : text.slice(1, close);
  } else if (text.startsWith("'")) {
    // Single quotation marks: the text as written, without the file's CR.
    inner = text.replace(/\r$/, "");
  } else {
    // Unquoted: the whole rest of the line.
    inner = text;
  }
  // The resolved text.
  const v = decodeEscapes(inner).value;
  // Not a PASS or LOGIN line.
  if (maskSecret(v) === null) return null;
  // The password as resolved.
  const secret = secretOf(v) ?? "";
  // Whether the page finds it in the text as written (otherwise it masks the whole text).
  return { secret, found: maskLast(pictured(text), secret) !== null };
}

/**
 * The shareable copy of both boxes. Pure and total: it never throws, and boxes without a PASS or LOGIN password come
 * back unchanged.
 * @param input the script and the transcript as typed
 * @returns the copy and the count, or the first line whose password cannot be replaced
 */
export function shareableScript(input: ScriptedMonitorInput): ShareableScript {
  // The script's lines, split on LF only (a final LF leaves an empty last part, so the join restores it).
  const lines = (input.script ?? "").split("\n");
  // Passwords replaced.
  let redacted = 0;
  // Each line.
  for (let i = 0; i < lines.length; i++) {
    // Its password, if any.
    const s = lineSecret(lines[i]);
    // None, or already bullets (the copy of a copy).
    if (s === null || s.secret === "" || /^•+$/.test(s.secret)) continue;
    // Written with escapes: refused.
    if (!s.found) return { ok: false, line: i + 1 };
    // The last occurrence (the password follows the user name, which may contain the same text) becomes bullets.
    const at = lines[i].lastIndexOf(s.secret);
    // Replaced, one bullet per character, as the page shows it.
    lines[i] = lines[i].slice(0, at) + "•".repeat(s.secret.length) + lines[i].slice(at + s.secret.length);
    // Counted.
    redacted++;
  }
  // The transcript's lines.
  const tr = (input.transcript ?? "").split("\n");
  // Each line.
  for (let i = 0; i < tr.length; i++) {
    // A client line: its notation, its text, and a CR of a Windows file.
    const m = /^([ \t]*[Cc]:[ \t]*)(.*?)(\r?)$/.exec(tr[i]);
    // Not a client line.
    if (!m) continue;
    // PASS <password> (RFC 1939 section 7) or <tag> LOGIN <user> <password> (RFC 9051 section 6.2.3).
    const c = /^(PASS )(.+)$/i.exec(m[2]) ?? /^(\S+ LOGIN \S+ )(.+)$/i.exec(m[2]);
    // Neither.
    if (!c) continue;
    // Already bullets: nothing to replace.
    if (/^•+$/.test(c[2])) continue;
    // The password becomes bullets.
    tr[i] = m[1] + c[1] + "•".repeat(c[2].length) + m[3];
    // Counted.
    redacted++;
  }
  // The copy.
  return { ok: true, script: lines.join("\n"), transcript: tr.join("\n"), redacted };
}
