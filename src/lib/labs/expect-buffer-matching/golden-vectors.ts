// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/expect-buffer-matching/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the expect buffer-matching lab (set 2026-10-27a). Every
// accept case was RUN on Expect 5.45.4 with Tcl 8.6.14 on 27/10/2026 and the
// fields below are what that run printed (the run and test are named in each
// comment: r03 to r10 under the helper's runs/ folder, and the vectors' own run
// r15). Cases fed "in one read" come from a file opened with spawn -open, so the
// text arrives in one read after expect starts and no terminal translates it;
// the pseudo-terminal and one-character-at-a-time cases come from programs
// spawned on a pty (r04). Beyond these, the model was compared with the real
// expect on 15,000 generated cases and its regular-expression engine with Tcl's
// regexp on 13,000 more, with no difference (runs/diff and runs/diff-tcl).
// Reject vectors pin one stable code each. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { compute, BufferMatchError, DEFAULT_INPUT, EXAMPLE_INPUT, OUTPUT_MAX, PATTERN_MAX, type BufferMatchErrorCode, type BufferMatchInput, type BufferMatchResult, type PatternRow } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "expect-buffer-matching/2026-10-27a";

/** A case the model must answer exactly so (each listed field compared; lists element by element). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The settings. */
  input: BufferMatchInput;
  /** The fields that must match. */
  expect: Partial<Pick<BufferMatchResult, "winner" | "match" | "groups" | "expectOutBuffer" | "left" | "arrived" | "backslashLetterRows" | "nocaseBracketRows" | "emptyAtStart">>;
}

/** A case the model must refuse with a given code (and row, when the code concerns one). */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** The settings. */
  input: BufferMatchInput;
  /** The code. */
  code: BufferMatchErrorCode;
  /** The row, when the refusal names one. */
  row?: number;
  /** The detail, when the refusal carries one. */
  detail?: string;
}

/** Build settings tersely: the output, the rows as [kind, nocase, text], the arrival, the terminal. */
function cfg(output: string, rows: [PatternRow["kind"], boolean, string][], arrival: BufferMatchInput["arrival"] = "one-read", pty = false): BufferMatchInput {
  // The rows as objects.
  return { output, pty, arrival, patterns: rows.map(([kind, nocase, text]) => ({ kind, nocase, text })) };
}

/** The accept cases. */
export const EXPECT_BUFFER_VECTORS: readonly AcceptVector[] = Object.freeze([
  // r03 test 1, the manual's own example: expect "cd" on abcdefgh\n.
  { id: "manual-cd", input: cfg("abcdefgh\n", [["glob", false, "cd"]]), expect: { winner: 0, match: "cd", expectOutBuffer: "abcd", left: "efgh\n" } },
  // r03 test 2, the manual's -indices example: the subexpressions follow Tcl's preferences.
  { id: "manual-indices", input: cfg("abbbcabkkkka\n", [["re", false, "b(b*).*(k+)"]]), expect: { winner: 0, match: "bbbcabkkkk", groups: ["bb", "k"], expectOutBuffer: "abbbcabkkkk", left: "a\n" } },
  // r03 test 3a: the first pattern LISTED wins, and "login:" is swallowed into expect_out(buffer).
  { id: "order-listed-first", input: cfg("login: Password: ", [["glob", false, "assword:"], ["glob", false, "login:"]]), expect: { winner: 0, match: "assword:", expectOutBuffer: "login: Password:", left: " " } },
  // r03 test 3b: the same text with the patterns the other way round.
  { id: "order-reversed", input: cfg("login: Password: ", [["glob", false, "login:"], ["glob", false, "assword:"]]), expect: { winner: 0, match: "login:", expectOutBuffer: "login:", left: " Password: " } },
  // r03 test 3c: "c" listed before "a" wins on abc and takes everything.
  { id: "order-c-then-a", input: cfg("abc", [["glob", false, "c"], ["glob", false, "a"]]), expect: { winner: 0, match: "c", expectOutBuffer: "abc", left: "" } },
  // r03 test 5a: a glob star takes the longest run.
  { id: "glob-star-longest", input: cfg("xxaXbXc tail", [["glob", false, "a*X"]]), expect: { winner: 0, match: "aXbX", expectOutBuffer: "xxaXbX", left: "c tail" } },
  // r03 test 5b: a trailing star takes everything that has arrived.
  { id: "glob-trailing-star", input: cfg("user> rest of line", [["glob", false, "user>*"]]), expect: { winner: 0, match: "user> rest of line", left: "" } },
  // r03 test 5c: a backslash makes ? ordinary.
  { id: "glob-escaped-question", input: cfg("a?b", [["glob", false, "a\\?b"]]), expect: { winner: 0, match: "a?b" } },
  // r03 test 5d: a range.
  { id: "glob-range", input: cfg("x1y", [["glob", false, "x[0-9]y"]]), expect: { winner: 0, match: "x1y" } },
  // r03 test 6a: ^ anchors at the start of the buffer.
  { id: "glob-caret", input: cfg("xabc", [["glob", false, "^abc"]]), expect: { winner: null, match: null, left: "xabc" } },
  // r03 test 6b: $ as the last character anchors at the end of the buffer.
  { id: "glob-dollar-end", input: cfg("router# ", [["glob", false, "# $"]]), expect: { winner: 0, match: "# ", expectOutBuffer: "router# " } },
  // r03 test 6c: text after the prompt and the anchored pattern fails.
  { id: "glob-dollar-not-end", input: cfg("router# x", [["glob", false, "# $"]]), expect: { winner: null } },
  // r03 test 6d: a $ that is not last is an ordinary character.
  { id: "glob-dollar-middle", input: cfg("cost a$b", [["glob", false, "a$b"]]), expect: { winner: 0, match: "a$b" } },
  // r03 test 6e: a $ after a star never matches in 5.45.4.
  { id: "glob-star-dollar", input: cfg("abc", [["glob", false, "a*$"]]), expect: { winner: null } },
  // r03 test 6f: $ alone matches the empty buffer before anything is read.
  { id: "glob-dollar-alone-empty", input: cfg("user$ ", [["glob", false, "$"]]), expect: { winner: 0, match: "", expectOutBuffer: "", left: "user$ ", arrived: 0 } },
  // r03 test 6f2: $ alone on text already waiting never matches.
  { id: "glob-dollar-alone-waiting", input: cfg(" ", [["glob", false, "$"]], "waiting"), expect: { winner: null } },
  // r03 test 6h: \$ is a literal dollar.
  { id: "glob-escaped-dollar", input: cfg("user$", [["glob", false, "\\$"]]), expect: { winner: 0, match: "$", expectOutBuffer: "user$" } },
  // r03 test 7a: in -re, ^ is the start of the buffer, not of a line.
  { id: "re-caret-buffer", input: cfg("line1\r\nRouter>", [["re", false, "^Router>"]]), expect: { winner: null } },
  // r03 test 7b: the prompt pattern anchored at the end of what arrived.
  { id: "re-prompt-anchored", input: cfg("line1\r\nRouter>", [["re", false, "[>#] ?$"]]), expect: { winner: 0, match: ">", expectOutBuffer: "line1\r\nRouter>" } },
  // r03 test 7c: $ is the end of the buffer, so foo$ misses foo\r\n.
  { id: "re-dollar-crlf", input: cfg("foo\r\n", [["re", false, "foo$"]]), expect: { winner: null } },
  // r03 test 7d: "." matches the newline.
  { id: "re-dot-newline", input: cfg("a\r\nb", [["re", false, "a.+b"]]), expect: { winner: 0, match: "a\r\nb" } },
  // r03 test 8a: -ex takes every character literally.
  { id: "ex-literal", input: cfg("a*b^c$", [["ex", false, "*b^c$"]]), expect: { winner: 0, match: "*b^c$", expectOutBuffer: "a*b^c$" } },
  // r03 test 8b: -ex is never anchored, so ^ is a character.
  { id: "ex-caret", input: cfg("abc", [["ex", false, "^a"]]), expect: { winner: null } },
  // r03 test 9a: -nocase compares the output as lower case.
  { id: "nocase-glob", input: cfg("PASSWORD: ", [["glob", true, "password:"]]), expect: { winner: 0, match: "PASSWORD:", left: " " } },
  // r03 test 9b: in 5.45.4 an upper-case letter in the pattern is folded too.
  { id: "nocase-glob-upper-pattern", input: cfg("PASSWORD: ", [["glob", true, "Password:"]]), expect: { winner: 0, match: "PASSWORD:" } },
  // r03 test 9d: but a bracket under -nocase never matches an upper-case letter of the output.
  { id: "nocase-bracket-quirk", input: cfg("Password: ", [["glob", true, "[P]assword:"]]), expect: { winner: null, nocaseBracketRows: [0] } },
  // r03 test 9e: even with the bracket in lower case.
  { id: "nocase-bracket-quirk-lower", input: cfg("Password: ", [["glob", true, "[p]assword:"]]), expect: { winner: null } },
  // r03 test 9f: -nocase with -re folds both sides; the group keeps the output's case.
  { id: "nocase-re", input: cfg("PASSWORD: ", [["re", true, "Pass(word):"]]), expect: { winner: 0, match: "PASSWORD:", groups: ["WORD"] } },
  // r03 test 9g: -nocase with -ex.
  { id: "nocase-ex", input: cfg("PASSWORD: ", [["ex", true, "Password:"]]), expect: { winner: 0, match: "PASSWORD:" } },
  // r03 test 10a: "*" on an empty buffer matches at once.
  { id: "star-empty", input: cfg("", [["glob", false, "*"]]), expect: { winner: 0, match: "", expectOutBuffer: "", arrived: 0 } },
  // r03 test 10b: -re .* flushes without reading: it matches the empty buffer before the text arrives.
  { id: "re-dotstar-flush", input: cfg("abc", [["re", false, ".*"]]), expect: { winner: 0, match: "", expectOutBuffer: "", left: "abc", arrived: 0, emptyAtStart: false } },
  // r03 test 12a: two branches prefer the longest match.
  { id: "re-alternation-longest", input: cfg("yes", [["re", false, "y|yes"]]), expect: { winner: 0, match: "yes" } },
  // r03 test 12c: a non-greedy quantifier first makes the whole match shortest.
  { id: "re-lazy", input: cfg("xaaay", [["re", false, "a+?"]]), expect: { winner: 0, match: "a", expectOutBuffer: "xa", left: "aay" } },
  // r03 test 12d: a version number captured in two groups.
  { id: "re-version-groups", input: cfg("version 17.9.4a ready", [["re", false, "([0-9.]+)([a-z]*)"]]), expect: { winner: 0, match: "17.9.4a", groups: ["17.9.4", "a"], left: " ready" } },
  // r04 test 1: through a terminal, printf "foo\nbar\n" arrives as foo\r\nbar\r\n.
  { id: "pty-crlf", input: cfg("foo\nbar\n", [["re", false, "foo\\r\\nbar"]], "one-read", true), expect: { winner: 0, match: "foo\r\nbar", left: "\r\n" } },
  // r04 test 4a: one character at a time, "Pass*" matches as soon as "Pass" is there.
  { id: "per-char-trailing-star", input: cfg("Password: \n", [["glob", false, "Pass*"], ["glob", false, "Password: "]], "per-char", true), expect: { winner: 0, match: "Pass", arrived: 4, left: "word: \r\n" } },
  // r04 test 4c: one character at a time, the anchored pattern matches at the colon, before the space arrives.
  { id: "per-char-anchored", input: cfg("Password: \n", [["re", false, "assword: ?$"]], "per-char", true), expect: { winner: 0, match: "assword:", expectOutBuffer: "Password:", left: " \r\n", arrived: 9 } },
  // r09 test 2a: in braces \r reaches a glob as backslash-r, which is the letter r.
  { id: "glob-braced-backslash-r", input: cfg("foo\nbar", [["glob", false, "foo\\r\\nbar"]], "one-read", true), expect: { winner: null, backslashLetterRows: [0] } },
  // r09 test 2b: and it matches the letters.
  { id: "glob-backslash-r-letters", input: cfg("foorn bar", [["glob", false, "foo\\r\\n"]]), expect: { winner: 0, match: "foorn", backslashLetterRows: [0] } },
  // r10 test 1: an empty group at the very start reads back as the whole buffer.
  { id: "re-empty-group-at-start", input: cfg("abc", [["re", false, "(^)a"]]), expect: { winner: 0, match: "a", groups: ["abc"], expectOutBuffer: "a", left: "bc", emptyAtStart: true } },
  // r15: the lab's opening state.
  { id: "lab-default", input: DEFAULT_INPUT, expect: { winner: 0, match: "# ", expectOutBuffer: "show clock\r\n09:41:07.123 UTC Tue Oct 27 2026\r\nswitch# ", left: "" } },
  // r15: the Example: "login:" matches the banner's "Last login:", and the anchored row listed third never runs.
  { id: "lab-example", input: EXAMPLE_INPUT, expect: { winner: 1, match: "login:", expectOutBuffer: "Last login:", left: " Mon Oct 26 18:02:11 2026\r\nlogin: " } },
]);

/** The reject cases, one per code. */
export const EXPECT_BUFFER_REJECTS: readonly RejectVector[] = Object.freeze([
  // One character past the limit.
  { id: "output-too-long", input: cfg("x".repeat(OUTPUT_MAX + 1), [["glob", false, "x"]]), code: "output-too-long" },
  // A character outside ASCII.
  { id: "bad-output-char", input: cfg("café", [["glob", false, "x"]]), code: "bad-output-char" },
  // Five rows.
  { id: "too-many-rows", input: cfg("x", [["glob", false, "a"], ["glob", false, "b"], ["glob", false, "c"], ["glob", false, "d"], ["glob", false, "e"]]), code: "too-many-rows" },
  // A pattern past the limit.
  { id: "pattern-too-long", input: cfg("x", [["glob", false, "y".repeat(PATTERN_MAX + 1)]]), code: "pattern-too-long", row: 0 },
  // A tab in a pattern.
  { id: "bad-pattern-char", input: cfg("x", [["glob", false, "a\tb"]]), code: "bad-pattern-char", row: 0 },
  // Every row empty.
  { id: "no-pattern", input: cfg("x", [["glob", false, ""]]), code: "no-pattern" },
  // Tcl refuses a quantifier with nothing to repeat (r08: "quantifier operand invalid").
  { id: "re-invalid", input: cfg("x", [["glob", false, "x"], ["re", false, "*a"]]), code: "re-invalid", row: 1, detail: "quantifier operand invalid" },
  // A back-reference is outside the modelled subset.
  { id: "re-not-modelled", input: cfg("x", [["re", false, "(a)\\1"]]), code: "re-not-modelled", row: 0, detail: "backreference" },
  // Six hundred characters one at a time against a pattern that rescans them all: past the work budget.
  { id: "too-complex", input: cfg("a".repeat(OUTPUT_MAX), [["re", false, "(?:a|aa)*(?:a|aa)*(?:a|aa)*b"]], "per-char"), code: "too-complex" },
]);

/** True when two values agree: lists element by element, anything else exactly. */
function same(have: unknown, want: unknown): boolean {
  // Two lists.
  if (Array.isArray(have) && Array.isArray(want)) return have.length === want.length && have.every((x, i) => x === want[i]);
  // Anything else.
  return have === want;
}

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures.
  const failures: string[] = [];
  // Each accept case.
  for (const v of EXPECT_BUFFER_VECTORS) {
    // The model's answer, or the failure of throwing.
    let got: BufferMatchResult;
    try {
      got = compute(v.input);
    } catch (e) {
      failures.push(`${v.id}: threw ${String(e)}`);
      continue;
    }
    // Each expected field.
    for (const [k, want] of Object.entries(v.expect)) {
      const have = got[k as keyof BufferMatchResult];
      if (!same(have, want)) failures.push(`${v.id}: ${k} is ${JSON.stringify(have)}, expected ${JSON.stringify(want)}`);
    }
  }
  // Each reject case.
  for (const r of EXPECT_BUFFER_REJECTS) {
    // What it threw.
    let err: BufferMatchError | null = null;
    let other: string | null = null;
    try {
      compute(r.input);
    } catch (e) {
      if (e instanceof BufferMatchError) err = e;
      else other = String(e);
    }
    // Wrong code, wrong row, wrong detail, or no refusal.
    if (!err) failures.push(`${r.id}: ${other ? `threw ${other}` : "was not refused"}, expected ${r.code}`);
    else if (err.code !== r.code) failures.push(`${r.id}: refused with ${err.code}, expected ${r.code}`);
    else if (r.row !== undefined && err.row !== r.row) failures.push(`${r.id}: row ${String(err.row)}, expected ${r.row}`);
    else if (r.detail !== undefined && err.detail !== r.detail) failures.push(`${r.id}: detail ${String(err.detail)}, expected ${r.detail}`);
  }
  // The report.
  const total = EXPECT_BUFFER_VECTORS.length + EXPECT_BUFFER_REJECTS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - new Set(failures.map((f) => f.split(":")[0])).size, failures };
}
