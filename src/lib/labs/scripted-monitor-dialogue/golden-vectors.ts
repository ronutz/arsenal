// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/scripted-monitor-dialogue/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Scripted monitor dialogue lab (set 2026-10-27a). Each
// case was worked by hand from F5's rules (BIG-IP 21.1.0 Monitors Settings
// Reference, Scripted monitor settings) and the protocol's RFC, then compared
// with the model: the verdict, the stop line and reason, every row's outcome
// (m matched, s sent, f fails here, u undetermined, n not reached, with @ the
// offset where a non-prefix text was found), the rules the tool flags, and the
// transcript the server produced. The offsets were counted by hand: 21 for
// ESMTP in "220 mail.example.net ESMTP ready", 72 for "250 HELP" after three
// "250-" lines, 36 for the tagged OK after IMAP's BYE line, 33 for 220 after
// FTP's 120 line, 32 for "220 " after a "220-" line. Reject vectors pin every
// error code. verifyVectors() runs them all; scripts/run-golden-vectors runs it
// at prebuild and fails the build on any drift.
// ============================================================================

import { compute, DialogueError, type DialogueErrorCode, type DialogueInput, type DialogueResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "scripted-monitor-dialogue/2026-10-27a";

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's choices. */
  input: DialogueInput;
  /** "verdict stopLine reason" with "-" for null. */
  verdict: string;
  /** The rows, as rowsOf() writes them. */
  rows: string;
  /** The rules flagged, comma-joined. */
  rules: string;
  /** The transcript lines, joined with " | ", when the case pins them. */
  transcript?: string;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Choices the model must refuse (cast: some are deliberately outside the types). */
  input: DialogueInput;
  /** The code the refusal must carry. */
  code: DialogueErrorCode;
}

/** The rows of a result as one short string: outcome letter, @offset, and a dot for a hidden row. */
export function rowsOf(r: DialogueResult): string {
  // One token per row.
  return r.rows.map((x) => `${x.outcome === "not-reached" ? "n" : x.outcome[0]}${x.foundAt !== null ? "@" + x.foundAt : ""}${x.shown ? "" : "."}`).join(" ");
}

/** The accept cases. */
export const DIALOGUE_VECTORS: readonly AcceptVector[] = Object.freeze([
  // RFC 5321: the worked SMTP script against a healthy server passes; "250" is a prefix of EHLO's multiline reply.
  { id: "smtp-healthy", input: { protocol: "smtp", server: "healthy", mistake: "none", step: 0 }, verdict: "pass - -", rows: "m s m s m", rules: "", transcript: "S: 220 mail.example.net ESMTP ready | C: EHLO bigip1.example.net | S: 250-mail.example.net greets bigip1.example.net | S: 250-8BITMIME | S: 250-SIZE | S: 250 HELP | C: QUIT | S: 221 mail.example.net Service closing transmission channel" },
  // RFC 5321 4.2.1: "250 " is not the start of a reply whose first line is "250-..."; found at 72.
  { id: "smtp-code-space", input: { protocol: "smtp", server: "healthy", mistake: "code-space", step: 0 }, verdict: "fail 3 not-prefix", rows: "m s f@72 n n", rules: "S16" },
  // A word from the middle of the greeting: a substring that is not a prefix (F5).
  { id: "smtp-not-prefix", input: { protocol: "smtp", server: "healthy", mistake: "not-prefix", step: 0 }, verdict: "fail 1 not-prefix", rows: "f@21 n n n n", rules: "" },
  // RFC 5321 3.1: a 554 greeting does not start with 220.
  { id: "smtp-refuses", input: { protocol: "smtp", server: "refuses", mistake: "none", step: 0 }, verdict: "fail 1 mismatch", rows: "f n n n n", rules: "", transcript: "S: 554 mail.example.net No SMTP service here | C: EHLO bigip1.example.net | S: 503 Bad sequence of commands | C: QUIT | S: 221 mail.example.net Service closing transmission channel" },
  // A send without CR LF: the server waits for the line end and never answers; the next expect gets no reply.
  { id: "smtp-no-crlf", input: { protocol: "smtp", server: "healthy", mistake: "no-crlf", step: 0 }, verdict: "fail 3 no-reply", rows: "m s f n n", rules: "S6", transcript: "S: 220 mail.example.net ESMTP ready | C: EHLO bigip1.example.net | C: QUIT" },
  // F5: LF, not CR-LF; the CR after the closing quotation mark breaks the match at once.
  { id: "smtp-crlf", input: { protocol: "smtp", server: "healthy", mistake: "crlf", step: 0 }, verdict: "fail 1 crlf-after-quote", rows: "f n n n n", rules: "S1" },
  // F5: exactly one space; with two, the outcome is not documented.
  { id: "pop3-two-spaces", input: { protocol: "pop3", server: "healthy", mistake: "two-spaces", step: 0 }, verdict: "undetermined 3 separator", rows: "m s u", rules: "S2" },
  // F5: characters after the closing quotation mark break the match.
  { id: "pop3-after-quote", input: { protocol: "pop3", server: "healthy", mistake: "after-quote", step: 0 }, verdict: "fail 3 after-quote", rows: "m s f", rules: "S3" },
  // "OK" without its plus sign is found at 1, not at 0.
  { id: "pop3-not-prefix", input: { protocol: "pop3", server: "healthy", mistake: "not-prefix", step: 0 }, verdict: "fail 1 not-prefix", rows: "f@1 n n", rules: "" },
  // The Example: RFC 9051 6.1.3, BYE before the tagged OK, so "a1 OK" is found at 36.
  { id: "imap-tagged-ok", input: { protocol: "imap", server: "healthy", mistake: "not-prefix", step: 0 }, verdict: "fail 3 not-prefix", rows: "m s f@36", rules: "", transcript: "S: * OK IMAP4rev2 server ready | C: a1 LOGOUT | S: * BYE IMAP4rev2 Server logging out | S: a1 OK LOGOUT completed" },
  // RFC 9051 7.1.5: a BYE greeting refuses the connection; "* OK" does not match.
  { id: "imap-refuses", input: { protocol: "imap", server: "refuses", mistake: "none", step: 0 }, verdict: "fail 1 mismatch", rows: "f n n", rules: "", transcript: "S: * BYE Too many connections, try again later | C: a1 LOGOUT" },
  // RFC 959 5.4: 120 then 220 before the client speaks; 220 is found at 33.
  { id: "ftp-slow", input: { protocol: "ftp", server: "slow", mistake: "none", step: 0 }, verdict: "fail 1 not-prefix", rows: "f@33 n n", rules: "" },
  // RFC 959 4.2: a multi-line greeting starts 220-; "220 " is found at 32.
  { id: "ftp-multiline-code-space", input: { protocol: "ftp", server: "multiline", mistake: "code-space", step: 0 }, verdict: "fail 1 not-prefix", rows: "f@32 n n", rules: "S16" },
  // The same text against a one-line greeting passes (still flagged S16): the server decides.
  { id: "ftp-healthy-code-space", input: { protocol: "ftp", server: "healthy", mistake: "code-space", step: 0 }, verdict: "pass - -", rows: "m s m", rules: "S16" },
  // The worked FTP script passes a multi-line greeting: "220" is a prefix of "220-...".
  { id: "ftp-multiline", input: { protocol: "ftp", server: "multiline", mistake: "none", step: 0 }, verdict: "pass - -", rows: "m s m", rules: "" },
  // A silent server: the first expect gets no reply (F5: a target that does not respond within the Timeout is down).
  { id: "ftp-silent", input: { protocol: "ftp", server: "silent", mistake: "none", step: 0 }, verdict: "fail 1 no-reply", rows: "f n n", rules: "", transcript: "C: QUIT" },
  // Step 2 of 3: the rows after it are hidden, the verdict is unchanged.
  { id: "step-two", input: { protocol: "imap", server: "healthy", mistake: "none", step: 2 }, verdict: "pass - -", rows: "m s m.", rules: "" },
]);

/** The reject cases, one per error code. */
export const DIALOGUE_REJECTS: readonly RejectVector[] = Object.freeze([
  // A protocol the lab does not play.
  { id: "bad-protocol", input: { protocol: "http" as never, server: "healthy", mistake: "none", step: 0 }, code: "bad-protocol" },
  // A behaviour POP3 does not offer.
  { id: "bad-server", input: { protocol: "pop3", server: "refuses", mistake: "none", step: 0 }, code: "bad-server" },
  // A mistake IMAP does not offer.
  { id: "bad-mistake", input: { protocol: "imap", server: "healthy", mistake: "code-space", step: 0 }, code: "bad-mistake" },
  // A step past the script's end.
  { id: "bad-step", input: { protocol: "pop3", server: "healthy", mistake: "none", step: 4 }, code: "bad-step" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case.
  for (const v of DIALOGUE_VECTORS) {
    // The model's answer.
    const r = compute(v.input);
    // The verdict line.
    const verdict = `${r.verdict} ${r.stopLine ?? "-"} ${r.reason ?? "-"}`;
    // Compared.
    if (verdict !== v.verdict) failures.push(`${v.id}: verdict "${verdict}", expected "${v.verdict}"`);
    // The rows.
    const rows = rowsOf(r);
    // Compared.
    if (rows !== v.rows) failures.push(`${v.id}: rows "${rows}", expected "${v.rows}"`);
    // The rules.
    const rules = r.rules.join(",");
    // Compared.
    if (rules !== v.rules) failures.push(`${v.id}: rules "${rules}", expected "${v.rules}"`);
    // The transcript, when pinned.
    if (v.transcript !== undefined && r.transcript.join(" | ") !== v.transcript) failures.push(`${v.id}: transcript "${r.transcript.join(" | ")}", expected "${v.transcript}"`);
  }
  // Each reject case: it must throw with the right code.
  for (const rj of DIALOGUE_REJECTS) {
    // The code it threw with, or null.
    let code: string | null = null;
    // Run it.
    try {
      // Should throw.
      compute(rj.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof DialogueError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal.
    if (code !== rj.code) failures.push(`${rj.id}: refused with ${String(code)}, expected ${rj.code}`);
  }
  // The report.
  const total = DIALOGUE_VECTORS.length + DIALOGUE_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
