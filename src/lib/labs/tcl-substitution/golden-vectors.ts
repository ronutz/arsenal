// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tcl-substitution/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Tcl substitution lab (set 2026-10-27a). Every accept
// case was RUN on 27/10/2026: each line was evaluated by Tcl 8.6.14 inside
// Expect 5.45.4 with the lab's variables set (runs r01, r09, r14 and the
// vectors' own run r16 under the helper's runs/ folder), with "list" put in
// front of the line so every word is substituted exactly as for the real
// command while the command itself does not run; whether the command exists
// was checked with `info commands`. The words, Tcl's error messages (word for
// word) and the command's existence below are what those runs printed; the
// notes are the lab's own reading for Expect writers, each tied to a run (a
// braced send's bytes in r09 test 4, the one-line braced block in r09 test 3d).
// Beyond these, the model was compared with Tcl on 11,000 generated lines with
// no difference (runs/diff-subst). Reject vectors pin one stable code each.
// ============================================================================

import { compute, TclSubstError, DEFAULT_INPUT, EXAMPLE_INPUT, LINE_MAX, type NoteCode, type TclErrorCode, type TclSubstErrorCode } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "tcl-substitution/2026-10-27a";

/** What a case must produce. */
interface Expected {
  /** command, comment or empty. */
  kind?: "command" | "comment" | "empty";
  /** The arguments' values after substitution and expansion (null for a command's result). */
  args?: (string | null)[];
  /** Tcl's error code and exact message, or null for none. */
  error?: { code: TclErrorCode; message: string; word: number | null } | null;
  /** Whether a fresh expect knows the command. */
  commandKnown?: boolean | null;
  /** The notes, as code@word. */
  notes?: string[];
}

/** An accept case. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The line. */
  line: string;
  /** What it must give. */
  expect: Expected;
}

/** A reject case. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** The line. */
  line: string;
  /** The code. */
  code: TclSubstErrorCode;
}

/** Tcl's error, tersely. */
function err(code: TclErrorCode, message: string, word: number | null): Expected["error"] {
  // The outcome object.
  return { code, message, word };
}

/** The accept cases. */
export const TCL_SUBST_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: double quotes substitute the variable and turn \r into a carriage return (r01, r09 test 4).
  { id: "lab-default", line: DEFAULT_INPUT.line, expect: { args: ["send", "netops\r"], error: null, commandKnown: true, notes: ["send-ends-cr@1"] } },
  // Braces keep $user and \r as written: the program receives a backslash and an r (r01, r09 test 4: 5c 72).
  { id: "send-braced", line: "send {$user\\r}", expect: { args: ["send", "$user\\r"], error: null, notes: ["braced-escape@1", "braced-dollar@1", "send-ends-backslash-r@1"] } },
  // The Example: in double quotes [Pp] runs as a command (r01, r09 test 3b).
  { id: "lab-example", line: EXAMPLE_INPUT.line, expect: { args: [], error: err("invalid-command", 'invalid command name "Pp"', 2) } },
  // Braced, the same pattern reaches expect untouched (r09 test 3c).
  { id: "pattern-braced", line: "expect -re {[Pp]assword: $}", expect: { args: ["expect", "-re", "[Pp]assword: $"], error: null, notes: ["braced-bracket@2"] } },
  // A name stops at the first character that cannot be in a name (r01).
  { id: "name-stops-at-at", line: "spawn ssh $user@$host", expect: { args: ["spawn", "ssh", "netops@192.0.2.10"], error: null } },
  // ${name} delimits a name followed by name characters (r01).
  { id: "braced-name", line: 'puts "${user}_backup"', expect: { args: ["puts", "netops_backup"] } },
  // Without the braces the underscore is part of the name (r01).
  { id: "name-runs-on", line: 'puts "$user_backup"', expect: { args: [], error: err("no-such-variable", `can't read "user_backup": no such variable`, 1) } },
  // {*} makes one word into four (r01, r14).
  { id: "expand-options", line: "spawn ssh {*}$sshopts $host", expect: { args: ["spawn", "ssh", "-o", "StrictHostKeyChecking=accept-new", "-p", "22", "192.0.2.10"], error: null } },
  // A value is never substituted again (rule 11): the prompt's $ and \ stay (r14).
  { id: "value-not-resubstituted", line: "expect -re $prompt", expect: { args: ["expect", "-re", "(%|#|\\$) $"], error: null } },
  // An array element with a comma in its index (r14).
  { id: "expect-out-element", line: 'send "version $expect_out(1,string)\\r"', expect: { args: ["send", "version 17.9.4\r"], notes: ["send-ends-cr@1"] } },
  // Only white space may follow a close quote (r01).
  { id: "extra-after-quote", line: 'set x "a"b', expect: { args: [], error: err("extra-after-quote", "extra characters after close-quote", 2) } },
  // # in the middle of a command is an ordinary word (r01).
  { id: "hash-not-comment", line: "puts ok # not a comment", expect: { args: ["puts", "ok", "#", "not", "a", "comment"], error: null } },
  // Hex and octal escapes (r01, r14).
  { id: "escapes", line: 'send "\\x41\\x42\\101\\r"', expect: { args: ["send", "ABA\r"] } },
  // At most two hex digits after \x, three octal digits, and octal stops before passing 0377 (r01, r14).
  { id: "escape-limits", line: 'puts "\\x414 \\1012 \\400"', expect: { args: ["puts", "A4 A2  0"] } },
  // An unknown escape drops the backslash (r01).
  { id: "escape-unknown", line: 'puts "\\q\\$user\\[x\\]"', expect: { args: ["puts", "q$user[x]"] } },
  // The braced block on one line: Expect reads it as one pattern (r09 test 3d).
  { id: "one-line-block", line: 'expect { -re {[>#] $} { send "exit\\r" } }', expect: { args: ["expect", ' -re {[>#] $} { send "exit\\r" } '], error: null, notes: ["braced-escape@1", "braced-bracket@1", "expect-one-line-block@1"] } },
  // A comment line (r01).
  { id: "comment", line: "# set timeout 30", expect: { kind: "comment", args: [] } },
  // ;# ends the command and starts a comment (r01).
  { id: "semicolon-comment", line: "set timeout 30 ;# thirty seconds", expect: { args: ["set", "timeout", "30"], notes: ["rest-comment"] } },
  // An empty expansion adds no word (r12, r14).
  { id: "empty-expansion", line: "list {*}{} x", expect: { args: ["list", "x"] } },
  // {*} followed by a space is just the word * (r14).
  { id: "star-word", line: "list {*} a", expect: { args: ["list", "*", "a"] } },
  // Command results are not run by the lab: the word holds the result (r01: Tcl gives 012).
  { id: "command-results", line: "set y [set x 0][incr x][incr x]", expect: { args: ["set", "y", null], error: null } },
  // A known command in quotes (r01: Tcl gives "len 6").
  { id: "command-in-quotes", line: 'puts "len [string length $user]"', expect: { args: ["puts", null], error: null } },
  // Braces keep the brackets (r01).
  { id: "command-in-braces", line: "puts {len [string length $user]}", expect: { args: ["puts", "len [string length $user]"], notes: ["braced-dollar@1", "braced-bracket@1"] } },
  // A missing environment variable (r14: env reads say "no such variable").
  { id: "env-missing", line: "puts $env(X)", expect: { error: err("no-such-variable", `can't read "env(X)": no such variable`, 1) } },
  // A missing element of an ordinary array (r14).
  { id: "element-missing", line: "puts $expect_out(2,string)", expect: { error: err("no-such-element", `can't read "expect_out(2,string)": no such element in array`, 1) } },
  // A scalar used as an array (r01).
  { id: "not-array", line: "puts $user(x)", expect: { error: err("not-array", `can't read "user(x)": variable isn't array`, 1) } },
  // An array used as a scalar (r14).
  { id: "is-array", line: "puts $env", expect: { error: err("variable-is-array", `can't read "env": variable is array`, 1) } },
  // Digits are a name (r01).
  { id: "digit-name", line: 'puts "cost: $5"', expect: { error: err("no-such-variable", `can't read "5": no such variable`, 1) } },
  // A dollar with no name after it is a dollar (r01, r14).
  { id: "lone-dollar", line: 'puts "a$" $', expect: { args: ["puts", "a$", "$"] } },
  // Unclosed forms (r01, r14), each Tcl's own message.
  { id: "missing-varname-brace", line: "puts ${user", expect: { error: err("missing-varname-brace", "missing close-brace for variable name", 1) } },
  { id: "missing-paren", line: "puts $env(HOME", expect: { error: err("missing-paren", "missing )", 1) } },
  { id: "missing-quote", line: 'puts "abc', expect: { error: err("missing-quote", 'missing "', 1) } },
  { id: "missing-close-brace", line: "puts {abc", expect: { error: err("missing-close-brace", "missing close-brace", 1) } },
  { id: "missing-close-bracket", line: "puts [string length abc", expect: { error: err("missing-close-bracket", "missing close-bracket", 1) } },
  { id: "extra-after-brace", line: "puts {a}b", expect: { error: err("extra-after-brace", "extra characters after close-brace", 1) } },
  // {*} reads the value as a list, with Tcl's list errors (r12).
  { id: "list-brace-extra", line: "list {*}{a {b}x}", expect: { error: err("list-brace-extra", 'list element in braces followed by "x" instead of space', 1) } },
  { id: "list-quote-extra", line: 'list {*}{a "b"x}', expect: { error: err("list-quote-extra", 'list element in quotes followed by "x" instead of space', 1) } },
  { id: "list-unmatched-brace", line: 'list {*}"a {b"', expect: { error: err("list-unmatched-brace", "unmatched open brace in list", 1) } },
  { id: "list-unmatched-quote", line: 'list {*}{a "b}', expect: { error: err("list-unmatched-quote", "unmatched open quote in list", 1) } },
  // The command itself unknown: Tcl's error after every substitution (r16).
  { id: "unknown-command", line: "foo $user", expect: { args: ["foo", "netops"], error: err("invalid-command", 'invalid command name "foo"', null), commandKnown: false } },
  // A send with no return (r09 test 4 shows what reaches the program).
  { id: "send-no-return", line: 'send "show version"', expect: { args: ["send", "show version"], notes: ["send-no-return@1"] } },
  // An empty line.
  { id: "empty", line: "   ", expect: { kind: "empty", args: [] } },
]);

/** The reject cases, one per code. */
export const TCL_SUBST_REJECTS: readonly RejectVector[] = Object.freeze([
  // One character past the limit.
  { id: "line-too-long", line: "x".repeat(LINE_MAX + 1), code: "line-too-long" },
  // A character outside printable ASCII.
  { id: "bad-char", line: "puts café", code: "bad-char" },
  // \U above U+FFFF: Tcl 8.6.14 and Tcl 9 differ (r13).
  { id: "not-modelled-unicode", line: 'puts "\\U0001F600"', code: "not-modelled-unicode" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures.
  const failures: string[] = [];
  // Each accept case.
  for (const v of TCL_SUBST_VECTORS) {
    // The model's answer.
    let got;
    try {
      got = compute({ line: v.line });
    } catch (e) {
      failures.push(`${v.id}: threw ${String(e)}`);
      continue;
    }
    // Each expected field.
    const want = v.expect;
    if (want.kind !== undefined && got.kind !== want.kind) failures.push(`${v.id}: kind ${got.kind}, expected ${want.kind}`);
    if (want.args !== undefined && JSON.stringify(got.args.map((a) => a.value)) !== JSON.stringify(want.args)) failures.push(`${v.id}: args ${JSON.stringify(got.args.map((a) => a.value))}, expected ${JSON.stringify(want.args)}`);
    if (want.error !== undefined && JSON.stringify(got.error) !== JSON.stringify(want.error)) failures.push(`${v.id}: error ${JSON.stringify(got.error)}, expected ${JSON.stringify(want.error)}`);
    if (want.commandKnown !== undefined && got.commandKnown !== want.commandKnown) failures.push(`${v.id}: commandKnown ${String(got.commandKnown)}, expected ${String(want.commandKnown)}`);
    if (want.notes !== undefined) {
      // Notes as code@word.
      const notes = got.notes.map((n: { code: NoteCode; word?: number }) => (n.word === undefined ? n.code : `${n.code}@${n.word}`));
      if (JSON.stringify(notes) !== JSON.stringify(want.notes)) failures.push(`${v.id}: notes ${JSON.stringify(notes)}, expected ${JSON.stringify(want.notes)}`);
    }
  }
  // Each reject case.
  for (const r of TCL_SUBST_REJECTS) {
    // The code it threw with.
    let code: string | null = null;
    try {
      compute({ line: r.line });
    } catch (e) {
      code = e instanceof TclSubstError ? e.code : `unexpected ${String(e)}`;
    }
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report.
  const total = TCL_SUBST_VECTORS.length + TCL_SUBST_REJECTS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - new Set(failures.map((f) => f.split(":")[0])).size, failures };
}
