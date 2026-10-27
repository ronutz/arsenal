// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bigip-scripted-monitor-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the BIG-IP Scripted monitor explainer
// (set "bigip-scripted-monitor-explainer/2026-10-27a").
//
// Each vector is a script, usually with a server transcript, and pins every
// finding (rule, severity, line, parameters), the counts, each line's reading
// (kind, quoting, resolved text, ending, hint, secret, what F5 decides or
// leaves open), what the transcript held, and the simulated check (verdict,
// stop line, reason, every step, unread replies, notes).
//
// HOW THE EXPECTED VALUES WERE MADE. Each case was worked by hand first from
// F5's text (BIG-IP 21.1.0 LTM Monitors Reference, "Scripted monitor
// settings", read 2026-10-27) and the protocols' RFCs (read the same day on
// rfc-editor.org), including the offsets of the non-prefix matches (72 for
// EHLO's last line, 36 for IMAP's tagged OK, 33 for FTP's 220 after a 120, 19
// for ESMTP in a greeting); the engine's output was then compared with that
// working and pinned where they agreed. Each vector names the sentence or the
// RFC section it tests. One vector is F5's own example script, verbatim
// (f5-smtp-example); it is also the page's Example (D-83). The secret vectors
// also check that the password never appears anywhere in the result.
//
// Reject vectors pin the two size limits. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { run, SCRIPT_MAX_CHARS, TRANSCRIPT_MAX_CHARS, type ScriptedMonitorInput, type ScriptedMonitorResult } from "./compute";

/** The set's dated id: bump the letter whenever a vector or the engine changes. */
export const GOLDEN_VECTOR_SET_ID = "bigip-scripted-monitor-explainer/2026-10-27a";

/** The fields a vector pins, in compact stable forms. */
export interface Pinned {
  /** Each finding as "rule severity line params-json". */
  findings: string[];
  /** Findings by severity. */
  counts: ScriptedMonitorResult["counts"];
  /** Each line as "kind|q or u|decoded|ending|hint|secret|breaks|open" (null shown as "-"). */
  lines: string[];
  /** The transcript as "replies/clientLines/ignored", or null. */
  transcript: string | null;
  /** The simulation as "verdict stopLine reason unread=N unused=N notes=a,b", or null. */
  verdict: string | null;
  /** Each step as "L<line> kind outcome [r<replyNo>] [@foundAt] [client-differs]". */
  steps: string[];
}

/** One vector: a name, what it tests, the input, the pinned result, and a secret that must never come back. */
export interface Vector {
  /** Short stable name. */
  id: string;
  /** What it tests and against which sentence or section. */
  note: string;
  /** The input, exactly as the tool takes it. */
  input: Required<ScriptedMonitorInput>;
  /** The pinned fields. */
  expect: Pinned;
  /** A credential the input carries, which must not appear anywhere in the result. */
  secret?: string;
}

/** A shown value, or "-" for null. */
function s(v: string | number | boolean | null): string {
  // Null as a dash; everything else as text.
  return v === null ? "-" : String(v);
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: ScriptedMonitorResult): Pinned {
  // Findings, compact.
  const findings = r.findings.map((f) => `${f.rule} ${f.severity} ${f.line}${f.params ? " " + JSON.stringify(f.params) : ""}`);
  // Lines, compact.
  const lines = r.lines.map((l) => [l.kind, l.quoted ? "q" : "u", s(l.decoded), s(l.ending), s(l.hint), l.secret ? "secret" : "-", s(l.breaks), s(l.open)].join("|"));
  // The transcript summary.
  const transcript = r.transcript ? `${r.transcript.replies}/${r.transcript.clientLines}/${r.transcript.ignoredLines.join(",")}` : null;
  // The simulation's verdict line.
  const sim = r.simulation;
  // Verdict, stop, reason, leftovers and notes.
  const verdict = sim ? `${sim.verdict} ${s(sim.stopLine)} ${s(sim.reason)} unread=${sim.unreadReplies} unused=${sim.unusedClientLines} notes=${sim.notes.join(",")}` : null;
  // The steps, compact.
  const steps = sim ? sim.steps.map((x) => [`L${x.line}`, x.kind, x.outcome, x.replyNo !== null ? `r${x.replyNo}` : "", x.foundAt !== null ? `@${x.foundAt}` : "", x.clientDiffers ? "client-differs" : ""].filter((p) => p !== "").join(" ")) : [];
  // The pinned form.
  return { findings, counts: r.counts, lines, transcript, verdict, steps };
}

/** The vectors. */
export const VECTORS: readonly Vector[] = Object.freeze([
  // F5's own SMTP example, verbatim, against an RFC 5321 session: passes.
  {
    id: "f5-smtp-example",
    note: "F5's own SMTP example, verbatim, against an RFC 5321 session: passes",
    input: { script: "expect 220\nsend \"HELO bigip1.somecompany.net\\r\\n\"\nexpect \"250\"\nsend \"quit\\r\\n\"\n", transcript: "S: 220 foo.com Simple Mail Transfer Service Ready\nC: HELO bigip1.somecompany.net\nS: 250 foo.com\nC: quit\nS: 221 foo.com Service closing transmission channel\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|u|220|-|reply-220|-|-|-","send|q|HELO bigip1.somecompany.net\\r\\n|crlf|cmd-helo|-|-|-","expect|q|250|-|reply-250|-|-|-","send|q|quit\\r\\n|crlf|cmd-quit|-|-|-"],"transcript":"3/2/","verdict":"pass - - unread=1 unused=0 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect matched r2","L4 send sent"]},
  },
  // RFC 5321 4.1.1.1: EHLO's reply starts 250-; expect "250 " is not its prefix (F5's prefix rule); S16.
  {
    id: "smtp-ehlo-code-space",
    note: "RFC 5321 4.1.1.1: EHLO's reply starts 250-; expect \"250 \" is not its prefix (F5's prefix rule); S16",
    input: { script: "expect \"220\"\nsend \"EHLO bigip1.example.net\\r\\n\"\nexpect \"250 \"\nsend \"QUIT\\r\\n\"\n", transcript: "S: 220 foo.com Simple Mail Transfer Service Ready\nC: EHLO bigip1.example.net\nS: 250-foo.com greets bigip1.example.net\nS: 250-8BITMIME\nS: 250-SIZE\nS: 250-DSN\nS: 250 HELP\nC: QUIT\nS: 221 foo.com Service closing transmission channel\n" },
    expect: {"findings":["S16 info 3 {\"code\":\"250\"}"],"counts":{"error":0,"warning":0,"info":1},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|EHLO bigip1.example.net\\r\\n|crlf|cmd-ehlo|-|-|-","expect|q|250 |-|reply-250|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-"],"transcript":"3/2/","verdict":"fail 3 not-prefix unread=1 unused=1 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect failed r2 @72"]},
  },
  // the same session with expect "250": a prefix of the multiline reply; passes.
  {
    id: "smtp-ehlo-ok",
    note: "the same session with expect \"250\": a prefix of the multiline reply; passes",
    input: { script: "expect \"220\"\nsend \"EHLO bigip1.example.net\\r\\n\"\nexpect \"250\"\nsend \"QUIT\\r\\n\"\nexpect \"221\"\n", transcript: "S: 220 foo.com Simple Mail Transfer Service Ready\nC: EHLO bigip1.example.net\nS: 250-foo.com greets bigip1.example.net\nS: 250-8BITMIME\nS: 250-SIZE\nS: 250-DSN\nS: 250 HELP\nC: QUIT\nS: 221 foo.com Service closing transmission channel\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|EHLO bigip1.example.net\\r\\n|crlf|cmd-ehlo|-|-|-","expect|q|250|-|reply-250|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-","expect|q|221|-|reply-221|-|-|-"],"transcript":"3/2/","verdict":"pass - - unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect matched r2","L4 send sent","L5 expect matched r3"]},
  },
  // RFC 5321 3.1: a 554 greeting instead of 220; expect 220 does not match.
  {
    id: "smtp-554-greeting",
    note: "RFC 5321 3.1: a 554 greeting instead of 220; expect 220 does not match",
    input: { script: "expect \"220\"\nsend \"QUIT\\r\\n\"\nexpect \"221\"\n", transcript: "S: 554 mx.example.net No SMTP service here\nC: QUIT\nS: 221 mx.example.net closing\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-","expect|q|221|-|reply-221|-|-|-"],"transcript":"2/1/","verdict":"fail 1 mismatch unread=1 unused=1 notes=","steps":["L1 expect failed r1"]},
  },
  // a word from the middle of the greeting: a substring that is not a prefix (F5: cannot match).
  {
    id: "smtp-substring",
    note: "a word from the middle of the greeting: a substring that is not a prefix (F5: cannot match)",
    input: { script: "expect \"ESMTP\"\nsend \"QUIT\\r\\n\"\n", transcript: "S: 220 mx.example.net ESMTP ready\nC: QUIT\nS: 221 bye\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|ESMTP|-|-|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-"],"transcript":"2/1/","verdict":"fail 1 not-prefix unread=1 unused=1 notes=","steps":["L1 expect failed r1 @19"]},
  },
  // RFC 9051 6.1.3: BYE comes before the tagged OK, so "a1 OK" is not a prefix.
  {
    id: "imap-logout-tagged",
    note: "RFC 9051 6.1.3: BYE comes before the tagged OK, so \"a1 OK\" is not a prefix",
    input: { script: "expect \"* OK\"\nsend \"a1 LOGOUT\\r\\n\"\nexpect \"a1 OK\"\n", transcript: "S: * OK IMAP4rev2 server ready\nC: a1 LOGOUT\nS: * BYE IMAP4rev2 Server logging out\nS: a1 OK LOGOUT completed\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|* OK|-|reply-imap-ok|-|-|-","send|q|a1 LOGOUT\\r\\n|crlf|cmd-imap-logout|-|-|-","expect|q|a1 OK|-|-|-|-|-"],"transcript":"2/1/","verdict":"fail 3 not-prefix unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect failed r2 @36"]},
  },
  // the same session, expecting the untagged BYE: passes.
  {
    id: "imap-logout-bye",
    note: "the same session, expecting the untagged BYE: passes",
    input: { script: "expect \"* OK\"\nsend \"a1 LOGOUT\\r\\n\"\nexpect \"* BYE\"\n", transcript: "S: * OK IMAP4rev2 server ready\nC: a1 LOGOUT\nS: * BYE IMAP4rev2 Server logging out\nS: a1 OK LOGOUT completed\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|* OK|-|reply-imap-ok|-|-|-","send|q|a1 LOGOUT\\r\\n|crlf|cmd-imap-logout|-|-|-","expect|q|* BYE|-|reply-imap-bye|-|-|-"],"transcript":"2/1/","verdict":"pass - - unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect matched r2"]},
  },
  // RFC 1939 section 4: greeting and QUIT in the AUTHORIZATION state, no credentials; the RFC's two spaces after S: are notation.
  {
    id: "pop3-quit",
    note: "RFC 1939 section 4: greeting and QUIT in the AUTHORIZATION state, no credentials; the RFC's two spaces after S: are notation",
    input: { script: "expect \"+OK\"\nsend \"QUIT\\r\\n\"\nexpect \"+OK\"\n", transcript: "S:  +OK POP3 server ready\nC:  QUIT\nS:  +OK dewey POP3 server signing off\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|+OK|-|reply-pop-ok|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-","expect|q|+OK|-|reply-pop-ok|-|-|-"],"transcript":"2/1/","verdict":"pass - - unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect matched r2"]},
  },
  // "+ok" against "+OK": F5 does not say whether the comparison is case-sensitive.
  {
    id: "pop3-case",
    note: "\"+ok\" against \"+OK\": F5 does not say whether the comparison is case-sensitive",
    input: { script: "expect \"+ok\"\nsend \"QUIT\\r\\n\"\n", transcript: "S: +OK POP3 server ready\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|+ok|-|-|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-"],"transcript":"1/0/","verdict":"undetermined 1 case-only unread=0 unused=0 notes=","steps":["L1 expect undetermined r1"]},
  },
  // RFC 1939 section 7: PASS carries the password; masked everywhere (S15), including the transcript comparison.
  {
    id: "pop3-user-pass-secret",
    note: "RFC 1939 section 7: PASS carries the password; masked everywhere (S15), including the transcript comparison",
    input: { script: "expect \"+OK\"\nsend \"USER monitor\\r\\n\"\nexpect \"+OK\"\nsend \"PASS s3cret-Pw\\r\\n\"\nexpect \"+OK\"\nsend \"QUIT\\r\\n\"\n", transcript: "S: +OK POP3 server ready\nC: USER monitor\nS: +OK monitor accepted\nC: PASS s3cret-Pw\nS: +OK maildrop has 0 messages (0 octets)\nC: QUIT\nS: +OK dewey POP3 server signing off (maildrop empty)\n" },
    expect: {"findings":["S15 warning 4 {\"text\":\"PASS •••••••••\\\\r\\\\n\"}"],"counts":{"error":0,"warning":1,"info":0},"lines":["expect|q|+OK|-|reply-pop-ok|-|-|-","send|q|USER monitor\\r\\n|crlf|cmd-user|-|-|-","expect|q|+OK|-|reply-pop-ok|-|-|-","send|q|PASS •••••••••\\r\\n|crlf|cmd-pass|secret|-|-","expect|q|+OK|-|reply-pop-ok|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-"],"transcript":"4/3/","verdict":"pass - - unread=1 unused=0 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect matched r2","L4 send sent","L5 expect matched r3","L6 send sent"]},
    secret: "s3cret-Pw",
  },
  // RFC 9051 6.2.3: LOGIN carries a plaintext password; the password, not the user name that contains it, is masked.
  {
    id: "imap-login-secret",
    note: "RFC 9051 6.2.3: LOGIN carries a plaintext password; the password, not the user name that contains it, is masked",
    input: { script: "expect \"* OK\"\nsend \"a1 LOGIN s3cretary s3cret\\r\\n\"\nexpect \"a1 OK\"\n", transcript: "S: * OK ready\nC: a1 LOGIN s3cretary s3cret\nS: a1 OK LOGIN completed\n" },
    expect: {"findings":["S15 warning 2 {\"text\":\"a1 LOGIN s3cretary ••••••\\\\r\\\\n\"}"],"counts":{"error":0,"warning":1,"info":0},"lines":["expect|q|* OK|-|reply-imap-ok|-|-|-","send|q|a1 LOGIN s3cretary ••••••\\r\\n|crlf|cmd-imap-login|secret|-|-","expect|q|a1 OK|-|-|-|-|-"],"transcript":"2/1/","verdict":"pass - - unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect matched r2"]},
  },
  // RFC 959: 220 on connection, 221 to QUIT; passes.
  {
    id: "ftp-quit",
    note: "RFC 959: 220 on connection, 221 to QUIT; passes",
    input: { script: "expect \"220\"\nsend \"QUIT\\r\\n\"\nexpect \"221\"\n", transcript: "S: 220 Service ready for new user.\nC: QUIT\nS: 221 Service closing control connection.\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-","expect|q|221|-|reply-221|-|-|-"],"transcript":"2/1/","verdict":"pass - - unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect matched r2"]},
  },
  // RFC 959 5.4: 120 then 220 on connection; read as one reply, 220 is not its prefix.
  {
    id: "ftp-120-greeting",
    note: "RFC 959 5.4: 120 then 220 on connection; read as one reply, 220 is not its prefix",
    input: { script: "expect \"220\"\nsend \"QUIT\\r\\n\"\nexpect \"221\"\n", transcript: "S: 120 Service ready in 2 minutes.\nS: 220 Service ready for new user.\nC: QUIT\nS: 221 Service closing control connection.\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-","expect|q|221|-|reply-221|-|-|-"],"transcript":"2/1/","verdict":"fail 1 not-prefix unread=1 unused=1 notes=","steps":["L1 expect failed r1 @33"]},
  },
  // the same, with a blank line making 120 and 220 two replies: 220 is still not the first reply's prefix.
  {
    id: "ftp-120-separate",
    note: "the same, with a blank line making 120 and 220 two replies: 220 is still not the first reply's prefix",
    input: { script: "expect \"220\"\nsend \"QUIT\\r\\n\"\nexpect \"221\"\n", transcript: "S: 120 Service ready in 2 minutes.\n\nS: 220 Service ready for new user.\nC: QUIT\nS: 221 Service closing control connection.\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-","expect|q|221|-|reply-221|-|-|-"],"transcript":"3/1/","verdict":"fail 1 mismatch unread=2 unused=1 notes=","steps":["L1 expect failed r1"]},
  },
  // F5: LF, not CR-LF; the CR follows the closing quote, which F5 says breaks the match.
  {
    id: "crlf-quoted",
    note: "F5: LF, not CR-LF; the CR follows the closing quote, which F5 says breaks the match",
    input: { script: "expect \"220\"\r\nsend \"QUIT\\r\\n\"\r\nexpect \"221\"\r\n", transcript: "S: 220 ok\nC: QUIT\nS: 221 bye\n" },
    expect: {"findings":["S1 error 1 {\"what\":\"crlf\",\"kind\":\"expect\"}","S1 error 2 {\"what\":\"crlf\",\"kind\":\"send\"}","S1 error 3 {\"what\":\"crlf\",\"kind\":\"expect\"}"],"counts":{"error":3,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|crlf-after-quote|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|crlf","expect|q|221|-|reply-221|-|crlf-after-quote|-"],"transcript":"2/1/","verdict":"fail 1 crlf-after-quote unread=1 unused=1 notes=","steps":["L1 expect failed r1"]},
  },
  // F5: LF, not CR-LF; how an unquoted line ending in CR is read is not stated.
  {
    id: "crlf-unquoted",
    note: "F5: LF, not CR-LF; how an unquoted line ending in CR is read is not stated",
    input: { script: "expect 220\r\nsend QUIT\r\n", transcript: "S: 220 ok\n" },
    expect: {"findings":["S1 error 1 {\"what\":\"crlf\",\"kind\":\"expect\"}","S1 error 2 {\"what\":\"crlf\",\"kind\":\"send\"}","S6 warning 2"],"counts":{"error":2,"warning":1,"info":0},"lines":["expect|u|220\\r|-|reply-220|-|-|crlf","send|u|QUIT\\r|none|cmd-quit|-|-|crlf"],"transcript":"1/0/","verdict":"undetermined 1 crlf unread=1 unused=0 notes=","steps":["L1 expect undetermined"]},
  },
  // F5: exactly one space after the keyword.
  {
    id: "two-spaces",
    note: "F5: exactly one space after the keyword",
    input: { script: "expect  220\nsend \"QUIT\\r\\n\"\n", transcript: "S: 220 ok\n" },
    expect: {"findings":["S2 error 1 {\"what\":\"spaces\",\"count\":2}"],"counts":{"error":1,"warning":0,"info":0},"lines":["expect|u|-|-|reply-220|-|-|separator","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-"],"transcript":"1/0/","verdict":"undetermined 1 separator unread=1 unused=0 notes=","steps":["L1 expect undetermined"]},
  },
  // F5: exactly one space; a tab is not a space.
  {
    id: "tab-separator",
    note: "F5: exactly one space; a tab is not a space",
    input: { script: "expect \"220\"\nsend\t\"QUIT\\r\\n\"\n", transcript: "S: 220 ok\n" },
    expect: {"findings":["S2 error 2 {\"what\":\"tab\"}"],"counts":{"error":1,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|-|crlf|cmd-quit|-|-|separator"],"transcript":"1/0/","verdict":"undetermined 2 separator unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send undetermined"]},
  },
  // F5: any characters after a closing quotation mark break the match.
  {
    id: "after-quote",
    note: "F5: any characters after a closing quotation mark break the match",
    input: { script: "expect \"220\" # greeting\nsend \"QUIT\\r\\n\"\n", transcript: "S: 220 ok\n" },
    expect: {"findings":["S3 error 1 {\"after\":\" # greeting\",\"kind\":\"expect\"}"],"counts":{"error":1,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|after-quote|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-"],"transcript":"1/0/","verdict":"fail 1 after-quote unread=0 unused=0 notes=","steps":["L1 expect failed r1"]},
  },
  // the same rule on a send: F5 does not say what is then sent.
  {
    id: "send-after-quote",
    note: "the same rule on a send: F5 does not say what is then sent",
    input: { script: "expect \"220\"\nsend \"QUIT\\r\\n\" now\n", transcript: "S: 220 ok\n" },
    expect: {"findings":["S3 error 2 {\"after\":\" now\",\"kind\":\"send\"}"],"counts":{"error":1,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|-|crlf|cmd-quit|-|-|send-after-quote"],"transcript":"1/0/","verdict":"undetermined 2 send-after-quote unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send undetermined"]},
  },
  // \x is not in F5's list of escape sequences.
  {
    id: "unknown-escape",
    note: "\\x is not in F5's list of escape sequences",
    input: { script: "expect \"+OK\"\nsend \"QUIT\\x0d\\x0a\"\n", transcript: "S: +OK\n" },
    expect: {"findings":["S5 warning 2 {\"seq\":\"\\\\x\"}"],"counts":{"error":0,"warning":1,"info":0},"lines":["expect|q|+OK|-|reply-pop-ok|-|-|-","send|q|-|-|-|-|-|unknown-escape"],"transcript":"1/0/","verdict":"undetermined 2 unknown-escape unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send undetermined"]},
  },
  // a send with no line ending (S6); the transcript shows the client sending CR LF.
  {
    id: "send-no-eol",
    note: "a send with no line ending (S6); the transcript shows the client sending CR LF",
    input: { script: "expect \"+OK\"\nsend \"QUIT\"\nexpect \"+OK\"\n", transcript: "S: +OK ready\nC: QUIT\nS: +OK bye\n" },
    expect: {"findings":["S6 warning 2"],"counts":{"error":0,"warning":1,"info":0},"lines":["expect|q|+OK|-|reply-pop-ok|-|-|-","send|q|QUIT|none|cmd-quit|-|-|-","expect|q|+OK|-|reply-pop-ok|-|-|-"],"transcript":"2/1/","verdict":"pass - - unread=0 unused=0 notes=client-differs","steps":["L1 expect matched r1","L2 send sent client-differs","L3 expect matched r2"]},
  },
  // a send ending in LF alone where the RFCs require CR LF (S7).
  {
    id: "send-lf-only",
    note: "a send ending in LF alone where the RFCs require CR LF (S7)",
    input: { script: "expect \"220\"\nsend \"QUIT\\n\"\nexpect \"221\"\n", transcript: "S: 220 ok\nC: QUIT\nS: 221 bye\n" },
    expect: {"findings":["S7 info 2 {\"what\":\"lf\"}"],"counts":{"error":0,"warning":0,"info":1},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|QUIT\\n|lf|cmd-quit|-|-|-","expect|q|221|-|reply-221|-|-|-"],"transcript":"2/1/","verdict":"pass - - unread=0 unused=0 notes=client-differs","steps":["L1 expect matched r1","L2 send sent client-differs","L3 expect matched r2"]},
  },
  // an expect written as a regular expression is matched literally (S8).
  {
    id: "regex-like",
    note: "an expect written as a regular expression is matched literally (S8)",
    input: { script: "expect \"^220.*\"\n", transcript: "S: 220 mx.example.net ESMTP\n" },
    expect: {"findings":["S8 info 1 {\"text\":\"^220.*\"}"],"counts":{"error":0,"warning":0,"info":1},"lines":["expect|q|^220.*|-|-|-|-|-"],"transcript":"1/0/","verdict":"fail 1 mismatch unread=0 unused=0 notes=","steps":["L1 expect failed r1"]},
  },
  // a blank line between instructions: F5 does not say how it is read.
  {
    id: "blank-between",
    note: "a blank line between instructions: F5 does not say how it is read",
    input: { script: "expect \"220\"\n\nsend \"QUIT\\r\\n\"\n", transcript: "S: 220 ok\n" },
    expect: {"findings":["S9 warning 2 {\"trailing\":0}"],"counts":{"error":0,"warning":1,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-","blank|u|-|-|-|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-"],"transcript":"1/0/","verdict":"undetermined 2 blank-line unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 blank undetermined"]},
  },
  // a blank line after the last instruction: noted; the check is decided before it.
  {
    id: "trailing-blank",
    note: "a blank line after the last instruction: noted; the check is decided before it",
    input: { script: "expect \"+OK\"\nsend \"QUIT\\r\\n\"\n\n", transcript: "S: +OK ready\n" },
    expect: {"findings":["S9 warning 3 {\"trailing\":1}"],"counts":{"error":0,"warning":1,"info":0},"lines":["expect|q|+OK|-|reply-pop-ok|-|-|-","send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-","blank|u|-|-|-|-|-|-"],"transcript":"1/0/","verdict":"pass - - unread=0 unused=0 notes=trailing-blank","steps":["L1 expect matched r1","L2 send sent"]},
  },
  // white space before the keyword: not described by F5.
  {
    id: "leading-space",
    note: "white space before the keyword: not described by F5",
    input: { script: "  expect \"220\"\n", transcript: "S: 220 ok\n" },
    expect: {"findings":["S10 warning 1"],"counts":{"error":0,"warning":1,"info":0},"lines":["expect|q|-|-|reply-220|-|-|leading-space"],"transcript":"1/0/","verdict":"undetermined 1 leading-space unread=1 unused=0 notes=","steps":["L1 expect undetermined"]},
  },
  // single quotes, an unterminated quote, a quote inside unquoted text: none described by F5.
  {
    id: "quote-forms",
    note: "single quotes, an unterminated quote, a quote inside unquoted text: none described by F5",
    input: { script: "expect '220'\nexpect \"220\nexpect 220 \"ready\"\n", transcript: "S: 220 ready\n" },
    expect: {"findings":["S11 warning 1 {\"what\":\"single\"}","S11 warning 2 {\"what\":\"unterminated\"}","S11 warning 3 {\"what\":\"inner\"}","S16 info 3 {\"code\":\"220\"}"],"counts":{"error":0,"warning":3,"info":1},"lines":["expect|u|-|-|-|-|-|quote-form","expect|q|-|-|reply-220|-|-|quote-form","expect|u|-|-|reply-220|-|-|quote-form"],"transcript":"1/0/","verdict":"undetermined 1 quote-form unread=1 unused=0 notes=","steps":["L1 expect undetermined"]},
  },
  // an expect with nothing to match.
  {
    id: "empty-text",
    note: "an expect with nothing to match",
    input: { script: "expect\nexpect \"\"\n", transcript: "S: 220 ok\n" },
    expect: {"findings":["S12 warning 1","S12 warning 2"],"counts":{"error":0,"warning":2,"info":0},"lines":["expect|u|-|-|-|-|-|empty-text","expect|q|-|-|-|-|-|empty-text"],"transcript":"1/0/","verdict":"undetermined 1 empty-text unread=1 unused=0 notes=","steps":["L1 expect undetermined"]},
  },
  // the file's last line has no LF.
  {
    id: "last-line-no-lf",
    note: "the file's last line has no LF",
    input: { script: "send \"QUIT\\r\\n\"\nexpect \"221\"", transcript: "C: QUIT\nS: 221 bye\n" },
    expect: {"findings":["S13 warning 2"],"counts":{"error":0,"warning":1,"info":0},"lines":["send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-","expect|q|221|-|reply-221|-|-|-"],"transcript":"1/1/","verdict":"undetermined 2 last-line-no-lf unread=1 unused=0 notes=","steps":["L1 send sent","L2 expect undetermined"]},
  },
  // nothing is ever checked.
  {
    id: "no-expect",
    note: "nothing is ever checked",
    input: { script: "send \"QUIT\\r\\n\"\n", transcript: "S: 220 hi\n" },
    expect: {"findings":["S14 warning 1"],"counts":{"error":0,"warning":1,"info":0},"lines":["send|q|QUIT\\r\\n|crlf|cmd-quit|-|-|-"],"transcript":"1/0/","verdict":"undetermined - no-expect unread=1 unused=0 notes=","steps":["L1 send sent"]},
  },
  // an Expect (Tcl) script is not a Scripted monitor file.
  {
    id: "expect-tcl-pasted",
    note: "an Expect (Tcl) script is not a Scripted monitor file",
    input: { script: "#!/usr/bin/expect\nspawn telnet 192.0.2.10 25\nexpect \"220\"\nsend \"QUIT\\r\"\n", transcript: "" },
    expect: {"findings":["S4 error 1 {\"what\":\"tcl\",\"keyword\":\"#!/usr/bin/expect\"}","S4 error 2 {\"what\":\"tcl\",\"keyword\":\"spawn\"}","S7 info 4 {\"what\":\"cr\"}"],"counts":{"error":2,"warning":0,"info":1},"lines":["unknown|u|-|-|-|-|-|unknown-keyword","unknown|u|-|-|-|-|-|unknown-keyword","expect|q|220|-|reply-220|-|-|-","send|q|QUIT\\r|cr|cmd-quit|-|-|-"],"transcript":null,"verdict":null,"steps":[]},
  },
  // a comment line and a capitalised keyword: F5 documents send and expect only.
  {
    id: "keyword-case-comment",
    note: "a comment line and a capitalised keyword: F5 documents send and expect only",
    input: { script: "# SMTP check\nExpect \"220\"\n", transcript: "" },
    expect: {"findings":["S4 error 1 {\"what\":\"comment\",\"keyword\":\"#\"}","S14 warning 1","S4 error 2 {\"what\":\"case\",\"keyword\":\"Expect\"}"],"counts":{"error":2,"warning":1,"info":0},"lines":["unknown|u|-|-|-|-|-|unknown-keyword","unknown|u|-|-|-|-|-|unknown-keyword"],"transcript":null,"verdict":null,"steps":[]},
  },
  // the transcript ends before the reply: the target does not respond (F5: considered down).
  {
    id: "no-reply",
    note: "the transcript ends before the reply: the target does not respond (F5: considered down)",
    input: { script: "expect \"220\"\nsend \"HELO a.example\\r\\n\"\nexpect \"250\"\n", transcript: "S: 220 mx.example ESMTP\nC: HELO a.example\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-","send|q|HELO a.example\\r\\n|crlf|cmd-helo|-|-|-","expect|q|250|-|reply-250|-|-|-"],"transcript":"1/1/","verdict":"fail 3 no-reply unread=0 unused=0 notes=","steps":["L1 expect matched r1","L2 send sent","L3 expect failed"]},
  },
  // the reply ends before the text does.
  {
    id: "reply-shorter",
    note: "the reply ends before the text does",
    input: { script: "expect \"220 mail\\r\\n250\"\n", transcript: "S: 220 mail\n" },
    expect: {"findings":["S16 info 1 {\"code\":\"220\"}"],"counts":{"error":0,"warning":0,"info":1},"lines":["expect|q|220 mail\\r\\n250|-|reply-220|-|-|-"],"transcript":"1/0/","verdict":"fail 1 reply-shorter unread=0 unused=0 notes=","steps":["L1 expect failed r1"]},
  },
  // a match that runs past the reply's first line: how much the monitor reads is not stated.
  {
    id: "spans-lines",
    note: "a match that runs past the reply's first line: how much the monitor reads is not stated",
    input: { script: "expect \"220 a\\r\\n250\"\n", transcript: "S: 220 a\nS: 250 b\n" },
    expect: {"findings":["S16 info 1 {\"code\":\"220\"}"],"counts":{"error":0,"warning":0,"info":1},"lines":["expect|q|220 a\\r\\n250|-|reply-220|-|-|-"],"transcript":"1/0/","verdict":"undetermined 1 spans-lines unread=0 unused=0 notes=","steps":["L1 expect undetermined r1"]},
  },
  // a transcript line with no S: or C: is ignored and reported.
  {
    id: "transcript-ignored",
    note: "a transcript line with no S: or C: is ignored and reported",
    input: { script: "expect \"220\"\n", transcript: "S: 220 ok\nsome note\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":["expect|q|220|-|reply-220|-|-|-"],"transcript":"1/0/2","verdict":"pass - - unread=0 unused=0 notes=","steps":["L1 expect matched r1"]},
  },
  // nothing to read.
  {
    id: "empty-script",
    note: "nothing to read",
    input: { script: "", transcript: "S: 220 ok\n" },
    expect: {"findings":[],"counts":{"error":0,"warning":0,"info":0},"lines":[],"transcript":"1/0/","verdict":null,"steps":[]},
  },
]);

/** The reject vectors: inputs the engine must refuse, with the start of the message it refuses them with. */
export const REJECTS: readonly { id: string; input: Required<ScriptedMonitorInput>; message: string }[] = Object.freeze([
  // A script over the limit.
  { id: "script-too-long", input: { script: "expect 220\n".repeat(Math.ceil((SCRIPT_MAX_CHARS + 1) / 11)), transcript: "" }, message: "The script is longer than" },
  // A transcript over the limit.
  { id: "transcript-too-long", input: { script: "expect 220\n", transcript: "S: 220 ok\n".repeat(Math.ceil((TRANSCRIPT_MAX_CHARS + 1) / 10)) }, message: "The transcript is longer than" },
]);

/** The page's Example (D-83): F5's own SMTP example and its RFC 5321 session, the input of vector f5-smtp-example. */
export const EXAMPLE: Required<ScriptedMonitorInput> = VECTORS.find((v) => v.id === "f5-smtp-example")!.input;

/** The API documentation's example body (a valid request: the same input as JSON). */
export const API_EXAMPLE = JSON.stringify(EXAMPLE);

/** The report verifyVectors() returns. */
export interface VerifyReport {
  /** The set id. */
  setId: string;
  /** Checks run: one per vector, one per reject, one per secret. */
  total: number;
  /** Checks that passed. */
  passed: number;
  /** The ones that did not, with the first difference. */
  failures: string[];
}

/** Run every vector and compare its pinned fields byte for byte; check the rejects and the secrets. */
export function verifyVectors(): VerifyReport {
  // The failures.
  const failures: string[] = [];
  // Checks run.
  let total = 0;
  // Each vector.
  for (const v of VECTORS) {
    // One check.
    total++;
    // A throw is a failure too.
    try {
      // The result.
      const r = run(v.input);
      // Pinned, as JSON.
      const got = JSON.stringify(pin(r));
      // The expectation, as JSON.
      const want = JSON.stringify(v.expect);
      // Compare.
      if (got !== want) {
        // The first differing character.
        let k = 0;
        // Walk to it.
        while (k < got.length && got[k] === want[k]) k++;
        // Record.
        failures.push(`${v.id}: differs at ${k}: got ...${got.slice(Math.max(0, k - 40), k + 60)}... want ...${want.slice(Math.max(0, k - 40), k + 60)}...`);
      }
      // The secret, when the vector carries one, must not appear anywhere in the result.
      if (v.secret !== undefined) {
        // One more check.
        total++;
        // Leaked.
        if (JSON.stringify(r).includes(v.secret)) failures.push(`${v.id}: the secret appears in the result`);
      }
    } catch (e) {
      // Record the throw.
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }
  // Each reject: it must throw with the right message.
  for (const rj of REJECTS) {
    // One check.
    total++;
    // The message it threw with, or null.
    let msg: string | null = null;
    // Run it.
    try {
      // Should throw.
      run(rj.input);
    } catch (e) {
      // The message.
      msg = (e as Error).message;
    }
    // Wrong message or no refusal.
    if (msg === null || !msg.startsWith(rj.message)) failures.push(`${rj.id}: refused with ${String(msg)}, expected "${rj.message}..."`);
  }
  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
