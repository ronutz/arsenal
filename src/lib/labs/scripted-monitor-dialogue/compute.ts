// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/scripted-monitor-dialogue/compute.ts
// ----------------------------------------------------------------------------
// THE SCRIPTED MONITOR DIALOGUE LAB'S MODEL (2026-10-27), the interactive
// companion of the article "BIG-IP LTM Scripted monitors". The reader picks a
// protocol (SMTP, POP3, IMAP, FTP), how the server behaves, and a mistake to
// make in the script; the model writes the script, plays a server that follows
// the protocol's RFC against it, and walks the two side by side, line by line,
// with the outcome of each line and where (and why) the check stops.
//
// THE SCRIPTS are the article's worked scripts, each built from its RFC (read
// on rfc-editor.org on 2026-10-27): SMTP greeting 220, EHLO answered by a
// multiline 250 reply, QUIT answered by 221 (RFC 5321 3.1, 4.1.1.1, 4.1.1.10,
// 4.2.1); POP3 greeting +OK and QUIT in the AUTHORIZATION state answered by
// +OK (RFC 1939 sections 3 and 4); IMAP greeting "* OK" and LOGOUT answered by
// an untagged BYE before the tagged OK (RFC 9051 6.1.3, 7.1.1, 7.1.5); FTP
// greeting 220 and QUIT answered by 221 (RFC 959 4.2, 5.4). No script logs in.
//
// THE SERVERS follow the same RFCs: healthy; refusing at connection (SMTP 554,
// RFC 5321 3.1; IMAP's BYE greeting, RFC 9051 7.1.5; FTP 421, RFC 959 5.4);
// slow to greet (FTP 120 before 220, RFC 959 5.4); a multi-line greeting (FTP
// "220-" lines, RFC 959 4.2); silent (it accepts the connection and sends
// nothing; RFC 5321 4.5.3.2.1 notes servers that delay the greeting). Every
// server reads a command only when its line ends in CR LF (RFC 5321 2.3.8;
// RFC 1939 section 3; RFC 9051 2.2; RFC 959 section 4), so a command sent
// without one gets no reply.
//
// THE MATCHING is not re-implemented here: the script and the server's
// transcript are handed to the BIG-IP Scripted monitor explainer's engine
// (src/lib/tools/bigip-scripted-monitor-explainer/compute.ts), which applies
// F5's rules from the BIG-IP 21.1.0 Monitors Settings Reference (LF line
// endings, exactly one space after the keyword, characters after a closing
// quotation mark break the match, a match only on a prefix of the response)
// and says "undetermined" wherever F5's text leaves the outcome open. The lab
// and the tool therefore cannot disagree.
//
// WHAT IT LEAVES OUT (the scope note): the monitor's timing (Interval and
// Timeout; the f5-monitor-timing lab models them), TLS, logging in, other
// commands, servers that answer partly, and anything F5 does not document.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

import { run, type FailReason, type OpenReason } from "@/lib/tools/bigip-scripted-monitor-explainer/compute";

/** The protocols the lab plays. */
export type Protocol = "smtp" | "pop3" | "imap" | "ftp";
/** How the server behaves. */
export type ServerKind = "healthy" | "refuses" | "slow" | "multiline" | "silent";
/** The mistake made in the script. */
export type Mistake = "none" | "crlf" | "two-spaces" | "after-quote" | "not-prefix" | "code-space" | "no-crlf";

/** The reader's choices. */
export interface DialogueInput {
  /** The protocol. */
  protocol: Protocol;
  /** The server's behaviour (each protocol offers its own list). */
  server: ServerKind;
  /** The mistake (each protocol offers its own list). */
  mistake: Mistake;
  /** How many script lines to show, from the first; 0 shows them all. */
  step: number;
}

/** The protocols, in the order the lab offers them. */
export const PROTOCOLS: readonly Protocol[] = ["smtp", "pop3", "imap", "ftp"];
/** The server behaviours each protocol offers (only those its RFC describes). */
export const SERVERS: Readonly<Record<Protocol, readonly ServerKind[]>> = {
  // SMTP: healthy, refusing with 554, silent.
  smtp: ["healthy", "refuses", "silent"],
  // POP3: healthy, silent (RFC 1939 describes no refusing greeting).
  pop3: ["healthy", "silent"],
  // IMAP: healthy, refusing with a BYE greeting, silent.
  imap: ["healthy", "refuses", "silent"],
  // FTP: healthy, refusing with 421, slow (120 then 220), a multi-line greeting, silent.
  ftp: ["healthy", "refuses", "slow", "multiline", "silent"],
};
/** The mistakes each protocol offers (code-space only where replies start with a three-digit code). */
export const MISTAKES: Readonly<Record<Protocol, readonly Mistake[]>> = {
  // SMTP.
  smtp: ["none", "crlf", "two-spaces", "after-quote", "not-prefix", "code-space", "no-crlf"],
  // POP3.
  pop3: ["none", "crlf", "two-spaces", "after-quote", "not-prefix", "no-crlf"],
  // IMAP.
  imap: ["none", "crlf", "two-spaces", "after-quote", "not-prefix", "no-crlf"],
  // FTP.
  ftp: ["none", "crlf", "two-spaces", "after-quote", "not-prefix", "code-space", "no-crlf"],
};

/** One line of a worked script: the keyword, the text as written (between quotes), and the command a send carries. */
interface ScriptLineDef {
  /** send or expect. */
  kind: "send" | "expect";
  /** The text between the quotation marks, escapes as written (\r\n typed as four characters). */
  text: string;
  /** For a send: the command's verb, which the server answers. */
  verb?: string;
}

/** A worked script per protocol, from its RFC; no line logs in. */
const SCRIPTS: Readonly<Record<Protocol, readonly ScriptLineDef[]>> = {
  // RFC 5321: greeting, EHLO, QUIT.
  smtp: [
    { kind: "expect", text: "220" },
    { kind: "send", text: "EHLO bigip1.example.net\\r\\n", verb: "EHLO" },
    { kind: "expect", text: "250" },
    { kind: "send", text: "QUIT\\r\\n", verb: "QUIT" },
    { kind: "expect", text: "221" },
  ],
  // RFC 1939: greeting, QUIT in the AUTHORIZATION state.
  pop3: [
    { kind: "expect", text: "+OK" },
    { kind: "send", text: "QUIT\\r\\n", verb: "QUIT" },
    { kind: "expect", text: "+OK" },
  ],
  // RFC 9051: greeting, LOGOUT, the untagged BYE.
  imap: [
    { kind: "expect", text: "* OK" },
    { kind: "send", text: "a1 LOGOUT\\r\\n", verb: "LOGOUT" },
    { kind: "expect", text: "* BYE" },
  ],
  // RFC 959: greeting, QUIT.
  ftp: [
    { kind: "expect", text: "220" },
    { kind: "send", text: "QUIT\\r\\n", verb: "QUIT" },
    { kind: "expect", text: "221" },
  ],
};

/** For the not-prefix mistake: the line it changes and the text it puts there (a substring of the reply, not its start). */
const NOT_PREFIX: Readonly<Record<Protocol, { line: number; text: string }>> = {
  // A word from the middle of the SMTP greeting.
  smtp: { line: 1, text: "ESMTP" },
  // OK without the plus sign.
  pop3: { line: 1, text: "OK" },
  // The tagged OK, which comes after the untagged BYE.
  imap: { line: 3, text: "a1 OK" },
  // Words from the middle of the FTP greeting.
  ftp: { line: 1, text: "Service ready" },
};

/** For the code-space mistake: the line it changes and the text (the code and a space). */
const CODE_SPACE: Readonly<Partial<Record<Protocol, { line: number; text: string }>>> = {
  // EHLO's multiline reply starts 250-.
  smtp: { line: 3, text: "250 " },
  // A multi-line greeting starts 220-.
  ftp: { line: 1, text: "220 " },
};

/** The server's replies: the greeting (one reply, possibly several lines) and the answer to each verb. */
interface ServerDef {
  /** The greeting lines, sent on connection; empty for a silent server. */
  greeting: string[];
  /** The reply lines to each verb, or null when the server has closed or keeps silent. */
  answers: Readonly<Record<string, string[]>> | null;
}

/** The servers, per protocol and behaviour; the replies follow the RFCs' formats (texts are the RFCs' examples or plain words). */
function serverOf(p: Protocol, s: ServerKind): ServerDef {
  // A silent server: the connection opens, nothing ever comes.
  if (s === "silent") return { greeting: [], answers: null };
  // SMTP.
  if (p === "smtp") {
    // RFC 5321 3.1: 554 instead of 220; the server still waits for QUIT and answers it.
    if (s === "refuses") return { greeting: ["554 mail.example.net No SMTP service here"], answers: { EHLO: ["503 Bad sequence of commands"], QUIT: ["221 mail.example.net Service closing transmission channel"] } };
    // Healthy: the greeting, EHLO's multiline reply (Appendix D.1's shape), 221 to QUIT.
    return { greeting: ["220 mail.example.net ESMTP ready"], answers: { EHLO: ["250-mail.example.net greets bigip1.example.net", "250-8BITMIME", "250-SIZE", "250 HELP"], QUIT: ["221 mail.example.net Service closing transmission channel"] } };
  }
  // POP3: RFC 1939's own example texts.
  if (p === "pop3") return { greeting: ["+OK POP3 server ready"], answers: { QUIT: ["+OK dewey POP3 server signing off"] } };
  // IMAP.
  if (p === "imap") {
    // RFC 9051 7.1.5: a BYE greeting refuses the connection, which closes at once.
    if (s === "refuses") return { greeting: ["* BYE Too many connections, try again later"], answers: null };
    // Healthy: the OK greeting; LOGOUT answered by BYE, then the tagged OK (6.1.3).
    return { greeting: ["* OK IMAP4rev2 server ready"], answers: { LOGOUT: ["* BYE IMAP4rev2 Server logging out", "a1 OK LOGOUT completed"] } };
  }
  // FTP: RFC 959's reply texts.
  if (s === "refuses") return { greeting: ["421 Service not available, closing control connection."], answers: null };
  // 120 first, then 220, before the client has said anything (5.4).
  if (s === "slow") return { greeting: ["120 Service ready in 2 minutes.", "220 Service ready for new user."], answers: { QUIT: ["221 Service closing control connection."] } };
  // A multi-line greeting: 220- on the first line, 220 and a space on the last (4.2).
  if (s === "multiline") return { greeting: ["220-Welcome to ftp.example.net", "220 Service ready for new user."], answers: { QUIT: ["221 Service closing control connection."] } };
  // Healthy.
  return { greeting: ["220 Service ready for new user."], answers: { QUIT: ["221 Service closing control connection."] } };
}

/** One row of the side-by-side account: a script line and what happened to it. */
export interface DialogueRow {
  /** The 1-based line. */
  line: number;
  /** The line as written, control characters shown as pictures (the CR of a CR-LF ending as U+240D). */
  written: string;
  /** send or expect. */
  kind: "send" | "expect";
  /** The server reply an expect was compared with (escapes visible), or null. */
  reply: string | null;
  /** What happened to the line. */
  outcome: "sent" | "matched" | "failed" | "undetermined" | "not-reached";
  /** For a substring that is not a prefix: where in the reply the text was found. */
  foundAt: number | null;
  /** Whether the reader's step setting shows this row. */
  shown: boolean;
}

/** The model's answer. */
export interface DialogueResult {
  /** The script, line by line, as written (for the side-by-side view). */
  script: string[];
  /** The session the server produced, in the RFCs' S: / C: notation. */
  transcript: string[];
  /** One row per script line. */
  rows: DialogueRow[];
  /** pass, fail or undetermined (the tool's engine decides). */
  verdict: "pass" | "fail" | "undetermined";
  /** The line the check stops on, or null for a pass. */
  stopLine: number | null;
  /** Why it stopped, or null for a pass. */
  reason: FailReason | OpenReason | null;
  /** How many rows exist (for the step control). */
  totalSteps: number;
  /** The rule ids the tool flags in this script (S1 to S16), each once, in order. */
  rules: string[];
}

/** The stable codes an invalid input is refused with. */
export type DialogueErrorCode = "bad-protocol" | "bad-server" | "bad-mistake" | "bad-step";

/** An invalid input, refused with a stable code. */
export class DialogueError extends Error {
  /** The stable code. */
  readonly code: DialogueErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: DialogueErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Unescape the two escapes the worked scripts use (\r and \n), to know what a send really sends. */
function sent(text: string): string {
  // Only \r and \n appear in the worked scripts' sends.
  return text.replace(/\\r/g, "\r").replace(/\\n/g, "\n");
}

/** Write the script and play the server; then hand both to the tool's engine and lay the result out side by side. */
export function compute(input: DialogueInput): DialogueResult {
  // The protocol must be one the lab plays.
  if (!PROTOCOLS.includes(input.protocol)) throw new DialogueError("bad-protocol", "protocol must be smtp, pop3, imap or ftp");
  // The server behaviour must be one this protocol offers.
  if (!SERVERS[input.protocol].includes(input.server)) throw new DialogueError("bad-server", `server ${String(input.server)} is not offered for ${input.protocol}`);
  // The mistake must be one this protocol offers.
  if (!MISTAKES[input.protocol].includes(input.mistake)) throw new DialogueError("bad-mistake", `mistake ${String(input.mistake)} is not offered for ${input.protocol}`);
  // The worked script's lines, copied so the mistake can change one.
  const defs = SCRIPTS[input.protocol].map((d) => ({ ...d }));
  // The step: 0 (all) up to the number of lines.
  if (!Number.isInteger(input.step) || input.step < 0 || input.step > defs.length) throw new DialogueError("bad-step", `step must be a whole number from 0 to ${defs.length}`);

  // The not-prefix mistake: one expect's text replaced by a substring of its reply.
  if (input.mistake === "not-prefix") defs[NOT_PREFIX[input.protocol].line - 1].text = NOT_PREFIX[input.protocol].text;
  // The code-space mistake: one expect's text becomes the code and a space.
  const cs = CODE_SPACE[input.protocol];
  // Applied where offered.
  if (input.mistake === "code-space" && cs) defs[cs.line - 1].text = cs.text;
  // The no-crlf mistake: the first send loses its \r\n.
  if (input.mistake === "no-crlf") {
    // The first send.
    const first = defs.find((d) => d.kind === "send");
    // Its text without the escapes at the end.
    if (first) first.text = first.text.replace(/\\r\\n$/, "");
  }
  // The script's lines as written: keyword, separator, quoted text, and the mistakes that change the form.
  const lines = defs.map((d, i) => {
    // Two spaces after the keyword on line 3 (an expect in every worked script).
    const sep = input.mistake === "two-spaces" && i === 2 ? "  " : " ";
    // Characters after the closing quotation mark on line 3.
    const tail = input.mistake === "after-quote" && i === 2 ? " OK" : "";
    // The line.
    return `${d.kind}${sep}"${d.text}"${tail}`;
  });
  // The file: LF line endings, or CR-LF for that mistake.
  const script = lines.map((l) => l + (input.mistake === "crlf" ? "\r\n" : "\n")).join("");

  // The server plays the session against the sends, in order.
  const srv = serverOf(input.protocol, input.server);
  // The transcript lines.
  const transcript: string[] = [];
  // The greeting, as one reply.
  for (const g of srv.greeting) transcript.push(`S: ${g}`);
  // Whether the server still answers (a closed or silent server, or one waiting for a line end, does not).
  let answering = srv.answers !== null && srv.greeting.length > 0;
  // Each send, in order.
  for (const d of defs) {
    // Only sends reach the server.
    if (d.kind !== "send" || !d.verb) continue;
    // What the client sends, escapes resolved.
    const bytes = sent(d.text);
    // The client line, as the transcript writes it (without its CR LF, which the notation implies).
    transcript.push(`C: ${bytes.replace(/\r\n$/, "")}`);
    // A command without CR LF is not a line yet: the server waits, and answers nothing from here on.
    if (!bytes.endsWith("\r\n")) answering = false;
    // The answer, when the server answers.
    if (answering && srv.answers) for (const a of srv.answers[d.verb] ?? []) transcript.push(`S: ${a}`);
  }

  // The tool's engine decides, with F5's rules.
  const r = run({ script, transcript: transcript.join("\n") + "\n" });
  // The simulation always exists here (a script and a transcript are given); an empty transcript still yields one.
  const sim = r.simulation ?? { verdict: "undetermined" as const, stopLine: null, reason: null, steps: [], unreadReplies: 0, unusedClientLines: 0, notes: [] };
  // One row per script line: the engine's step where it ran, "not reached" after the stop.
  const rows: DialogueRow[] = r.lines.map((l, i) => {
    // The engine's step for this line, if the check got there.
    const st = sim.steps.find((s) => s.line === l.line);
    // The row.
    return {
      line: l.line,
      written: l.raw,
      kind: defs[i].kind,
      reply: st ? st.reply : null,
      outcome: st ? (st.outcome === "skipped" ? "not-reached" : st.outcome) : "not-reached",
      foundAt: st ? st.foundAt : null,
      shown: input.step === 0 || l.line <= input.step,
    };
  });
  // The rules the tool flags, each once.
  const rules = Array.from(new Set(r.findings.map((f) => f.rule)));
  // The answer.
  return { script: r.lines.map((l) => l.raw), transcript, rows, verdict: sim.verdict, stopLine: sim.stopLine, reason: sim.reason, totalSteps: defs.length, rules };
}

/** The opening state: SMTP, a healthy server, the worked script as it should be, every line shown. */
export const DEFAULT_INPUT: DialogueInput = { protocol: "smtp", server: "healthy", mistake: "none", step: 0 };

/** The Example: IMAP, a healthy server, a script that expects the tagged OK, which never starts the reply to LOGOUT. */
export const EXAMPLE_INPUT: DialogueInput = { protocol: "imap", server: "healthy", mistake: "not-prefix", step: 0 };
