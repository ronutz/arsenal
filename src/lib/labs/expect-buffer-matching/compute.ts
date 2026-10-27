// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/expect-buffer-matching/compute.ts
// ----------------------------------------------------------------------------
// THE EXPECT BUFFER-MATCHING LAB'S MODEL (2026-10-27), the interactive
// companion of the article "Expect's patterns and its buffer". One expect
// command with up to four patterns meets a program's output. The reader types
// the output, says whether it comes through a pseudo-terminal and how it
// arrives, and writes the patterns as Expect receives them (as if braced: Tcl
// has already done its substitutions). The model says which pattern matches,
// when, what lands in expect_out(0,string), expect_out(1..9,string) and
// expect_out(buffer), and what stays in the buffer for the next expect.
//
// THE RULES, each stated in the article with its source and proved on Expect
// 5.45.4 with Tcl 8.6.14 on 27/10/2026 (scripts and transcripts under the
// helper's runs/ folder):
//   1. Order. "Each time new output arrives, it is compared to each pattern in
//      the order they are listed"; "In the event that multiple patterns match,
//      the one appearing first is used" (expect(1)). The first pattern in the
//      list that matches anywhere in the buffer wins, even when a later one
//      matches earlier text.
//   2. When. The patterns are tried on what is already in the buffer before
//      anything is read, then again after each read. A pattern that matches an
//      empty buffer ("*", -re ".*") therefore returns at once: "The pattern "*"
//      (and -re ".*") will flush the output buffer without reading any more
//      output from the process." Three arrival models: the text is already
//      waiting; it arrives in one read after expect starts; it arrives one
//      character at a time.
//   3. The terminal. "Newlines are usually converted to carriage return,
//      linefeed sequences when output by the terminal driver" (expect(1)); with
//      the pseudo-terminal option every \n becomes \r\n.
//   4. Glob. Expect's own matcher (exp_glob.c, "Based on Tcl's glob functions
//      but modified to support anchors"), reproduced here from its source at the
//      expect-5-45-4 tag: unanchored; "^" anchors only as the first character
//      and "$" only as the last; "*" takes the LONGEST run (it searches back from
//      the end of the buffer); "?" one character; "[...]" a set or range; "\x"
//      the character x. Its quirks are kept because the runs show them: a "$"
//      after a "*" can never match, "$" alone matches only an empty buffer, and
//      under -nocase a bracket's characters are lowered but the output's are
//      not, so [P] or [A-Z] never matches an upper-case letter.
//   5. -ex. The first place the exact string occurs; nothing is special;
//      "Exact patterns are always unanchored."
//   6. -re. Tcl's Advanced Regular Expressions with Tcl's match preferences
//      (src/lib/labs/expect-buffer-matching/are.ts, a stated subset). "^" and
//      "$" are the ends of the buffer, not of a line: "because expect is not
//      line oriented, these characters match the beginning and end of the data
//      (as opposed to lines) currently in the expect matching buffer."
//   7. -nocase. The output is compared as lower case. In 5.45.4 the pattern is
//      folded too for glob literals, -ex and -re (the manual's "The pattern is
//      not affected" does not hold for them in the runs); bracket sets in glob
//      are the exception in rule 4.
//   8. expect_out. "Upon matching a pattern ... any matching and previously
//      unmatched output is saved in the variable expect_out(buffer)"; the match
//      is expect_out(0,string); "Up to 9 regexp substring matches are saved in
//      the variables expect_out(1,string) through expect_out(9,string)"; the
//      text after the match stays in the buffer for the next expect.
//   9. A quirk of 5.45.4 on Tcl 8.6, kept because the run shows it: when a -re
//      match or group is EMPTY and sits at the very start of the buffer, its
//      expect_out(N,string) holds the whole buffer as it stood, while
//      expect_out(buffer) is empty (expect.c asks Tcl for the range 0 to -1).
//
// WHAT IT LEAVES OUT (the scope note says so): timeout, eof and the keywords,
// match_max and full_buffer (the buffer here is far below 2,000 characters),
// expect_before and expect_after, -notransfer and -indices, nulls, reads that
// split the output at other places than the three arrival models, characters
// outside ASCII, and the -re constructs are.ts refuses.
//
// Pure and deterministic; every refusal carries a stable code; a work budget
// bounds the matchers so no input can stall the page.
// ============================================================================

import { AreRefusal, compileAre, execAre, type AreInvalidReason, type AreNotModelled, type CompiledAre, type WorkBudget } from "./are";

/** How a pattern is given to expect: the default glob, -re or -ex. */
export type PatternKind = "glob" | "re" | "ex";

/** One pattern row; a row with empty text is not used. */
export interface PatternRow {
  /** Glob, -re or -ex. */
  kind: PatternKind;
  /** Whether -nocase is given. */
  nocase: boolean;
  /** The pattern as Expect receives it (after Tcl's substitutions). */
  text: string;
}

/** How the output reaches expect. */
export type Arrival = "waiting" | "one-read" | "per-char";

/** The reader's settings. */
export interface BufferMatchInput {
  /** What the program prints. */
  output: string;
  /** Whether it comes through a pseudo-terminal (each \n becomes \r\n). */
  pty: boolean;
  /** How it arrives. */
  arrival: Arrival;
  /** The patterns, in the order the expect command lists them. */
  patterns: PatternRow[];
}

/** The most characters of output the lab accepts. */
export const OUTPUT_MAX = 600;
/** The most characters in one pattern. */
export const PATTERN_MAX = 120;
/** The most pattern rows. */
export const ROWS_MAX = 4;
/** The work the whole computation may spend before refusing (shared by every match attempt). */
export const TOTAL_BUDGET = 2_000_000;

/** The stable codes an input is refused with. */
export type BufferMatchErrorCode =
  | "output-too-long"
  | "bad-output-char"
  | "too-many-rows"
  | "pattern-too-long"
  | "bad-pattern-char"
  | "no-pattern"
  | "re-invalid"
  | "re-not-modelled"
  | "too-complex";

/** A refusal, with the row it concerns when there is one and Tcl's reason or the construct for -re. */
export class BufferMatchError extends Error {
  /** The stable code. */
  readonly code: BufferMatchErrorCode;
  /** The 0-based row, when the refusal is about one pattern. */
  readonly row: number | null;
  /** Tcl's reason (re-invalid) or the construct (re-not-modelled), else null. */
  readonly detail: AreInvalidReason | AreNotModelled | null;
  /** Build a refusal. */
  constructor(code: BufferMatchErrorCode, row: number | null = null, detail: AreInvalidReason | AreNotModelled | null = null) {
    // The message for developers.
    super(`${code}${row === null ? "" : ` (row ${row + 1})`}${detail ? `: ${detail}` : ""}`);
    // The code.
    this.code = code;
    // The row.
    this.row = row;
    // The detail.
    this.detail = detail;
  }
}

/** One used row at the moment the decision was made: matched or not, and where. */
export interface RowTrial {
  /** The 0-based row. */
  row: number;
  /** Whether it matched the buffer as it stood. */
  matched: boolean;
  /** Where the match starts (when matched). */
  start: number;
  /** Where it ends, exclusive (when matched). */
  end: number;
}

/** The model's answer. */
export interface BufferMatchResult {
  /** The whole output as expect receives it (after the terminal's translation). */
  buffer: string;
  /** How many times the patterns were tried. */
  checks: number;
  /** How many characters had arrived when the decision was made (the whole buffer when nothing matched). */
  arrived: number;
  /** The row that matched, or null. */
  winner: number | null;
  /** expect_out(0,string): the matched text, or null. */
  match: string | null;
  /** Where the match starts and ends in the buffer, or null. */
  span: [number, number] | null;
  /** expect_out(1..9,string) for -re, in order (empty for glob and -ex). */
  groups: string[];
  /** expect_out(buffer): everything up to the end of the match, or null. */
  expectOutBuffer: string | null;
  /** What the next expect finds: the text after the match, whether it had arrived or not (the whole buffer when nothing matched). */
  left: string;
  /** Each used row at the deciding check. */
  trials: RowTrial[];
  /** Rows written as glob or -ex that hold \r, \n or \t as two characters (a backslash and a letter). */
  backslashLetterRows: number[];
  /** Rows written as glob with -nocase and a bracket expression (the 5.45.4 bracket quirk). */
  nocaseBracketRows: number[];
  /** Rule 9 applied: a -re match or group that is empty at the very start of a non-empty buffer reads back whole. */
  emptyAtStart: boolean;
}

/** Lower-case one ASCII character (Tcl_UniCharToLower for ASCII). */
function lower(c: string): string {
  // Only A to Z change.
  return c >= "A" && c <= "Z" ? String.fromCharCode(c.charCodeAt(0) + 32) : c;
}

/** Lower-case one ASCII code. */
function lowerCode(c: number): number {
  // Only A to Z change.
  return c >= 65 && c <= 90 ? c + 32 : c;
}

/** Spend work from the shared budget; refuse past it. */
function spend(budget: WorkBudget, k = 1): void {
  // Spend.
  budget.left -= k;
  // Past it: refuse.
  if (budget.left < 0) throw new BufferMatchError("too-complex");
}

/**
 * Expect's glob from a fixed position (Exp_StringCaseMatch2 in exp_glob.c, Expect 5.45.4): where the match that
 * starts at `si0` ends, or -1. The pattern need not reach the end of the subject. Memoised by (position, pattern
 * position), since the result depends on nothing else, so a pattern with many stars cannot take exponential time.
 */
function globEnd(s: string, si0: number, p: string, pi0: number, nocase: boolean, memo: Map<number, number>, budget: WorkBudget): number {
  // The subject's and the pattern's lengths.
  const n = s.length;
  const plen = p.length;
  // The cursors.
  let si = si0;
  let pi = pi0;
  while (true) {
    // One step of work.
    spend(budget);
    // The pattern is used up: success, ending here.
    if (pi >= plen) return si;
    // A "$" that is the pattern's LAST character: the subject must be used up too.
    if (p[pi] === "$" && pi + 1 >= plen) return si === n ? si : -1;
    // A star (or a run of stars).
    if (p[pi] === "*") {
      // Skip every star in the run.
      while (pi < plen && p[pi] === "*") pi++;
      // Stars at the end take everything that has arrived.
      if (pi >= plen) return n;
      // The character after the stars, lowered under -nocase.
      const pch = nocase ? lower(p[pi]) : p[pi];
      // Search back from the subject's last character: the LONGEST match is found first.
      let tail = n - 1;
      while (true) {
        // When the next pattern character is an ordinary one, skip back to the last place it occurs.
        if (pch !== "[" && pch !== "?" && pch !== "\\") {
          // Under -nocase the subject's character is compared both as it is and lowered.
          if (nocase) while (tail >= si && pch !== s[tail] && pch !== lower(s[tail])) tail--;
          // Otherwise exactly.
          else while (tail >= si && pch !== s[tail]) tail--;
        }
        // Backed up past where the star started: no match.
        if (tail < si) break;
        // Try the rest of the pattern from here (memoised).
        const key = tail * (plen + 1) + pi;
        let rc = memo.get(key);
        if (rc === undefined) {
          rc = globEnd(s, tail, p, pi, nocase, memo, budget);
          memo.set(key, rc);
        }
        // It matched: done.
        if (rc !== -1) return rc;
        // Nowhere left to back up to.
        if (tail === si) break;
        // One character further back.
        tail--;
      }
      // No place worked.
      return -1;
    }
    // Every other pattern character needs one subject character.
    if (si >= n) return -1;
    // "?" takes any one character.
    if (p[pi] === "?") {
      pi++;
      si++;
      continue;
    }
    // "[": a set of characters and ranges.
    if (p[pi] === "[") {
      // Past "[".
      pi++;
      // The subject's character, NOT lowered (the 5.45.4 code lowers only the set's characters).
      const ch = s.charCodeAt(si);
      si++;
      while (true) {
        // The set ended (or the pattern did) without a member matching.
        if (pi >= plen || p[pi] === "]") return -1;
        // The first character of a member, lowered under -nocase.
        let start = p.charCodeAt(pi++);
        if (nocase) start = lowerCode(start);
        // A range.
        if (p[pi] === "-") {
          // Past "-"; a range cut off by the end of the pattern fails.
          pi++;
          if (pi >= plen) return -1;
          // Its other end, lowered under -nocase.
          let end = p.charCodeAt(pi++);
          if (nocase) end = lowerCode(end);
          // Either order of the ends is accepted.
          if ((start <= ch && ch <= end) || (end <= ch && ch <= start)) break;
        } else if (start === ch) break;
      }
      // Skip to the end of the set.
      while (pi < plen && p[pi] !== "]") pi++;
      // And past its "]" when there is one.
      if (pi < plen) pi++;
      continue;
    }
    // A backslash makes the next character ordinary; a trailing backslash fails.
    if (p[pi] === "\\") {
      pi++;
      if (pi >= plen) return -1;
    }
    // An ordinary character must be the same (both lowered under -nocase).
    const c1 = s[si++];
    const c2 = p[pi++];
    if (nocase ? lower(c1) !== lower(c2) : c1 !== c2) return -1;
  }
}

/** Expect's unanchored glob search (Exp_StringCaseMatch): the first start where the pattern matches, and its end. */
export function globSearch(s: string, pattern: string, nocase: boolean, budget: WorkBudget = { left: TOTAL_BUDGET }): [number, number] | null {
  // A leading "^" anchors; a leading "*" makes other starts pointless.
  const caret = pattern[0] === "^";
  const star = !caret && pattern[0] === "*";
  // The pattern without its caret.
  const p = caret ? pattern.slice(1) : pattern;
  // One memo for this subject and pattern.
  const memo = new Map<number, number>();
  // The first position is tried even when the subject is empty.
  const first = globEnd(s, 0, p, 0, nocase, memo, budget);
  if (first >= 0) return [0, first];
  // Anchored, or led by a star: no other start.
  if (caret || star) return null;
  // An empty subject has no other start.
  if (s.length === 0) return null;
  // Every later start except the very end (the 5.45.4 loop stops before it).
  for (let st = 1; st < s.length; st++) {
    // Try from here.
    const e = globEnd(s, st, p, 0, nocase, memo, budget);
    if (e !== -1) return [st, e];
  }
  // Nowhere.
  return null;
}

/** Expect's -ex search (string_first, string_case_first): the first place the text occurs. */
export function exactSearch(s: string, pattern: string, nocase: boolean): [number, number] | null {
  // Fold both under -nocase.
  const hay = nocase ? s.toLowerCase() : s;
  const needle = nocase ? pattern.toLowerCase() : pattern;
  // The 5.45.4 loop starts at each position before the end, so an empty subject never matches.
  if (s.length === 0) return null;
  // The first occurrence.
  const at = hay.indexOf(needle);
  // Found, with its end.
  return at < 0 ? null : [at, at + pattern.length];
}

/** Check the settings; throw the first problem found. */
function validate(input: BufferMatchInput): void {
  // The output's size.
  if (typeof input.output !== "string" || input.output.length > OUTPUT_MAX) throw new BufferMatchError("output-too-long");
  // Printable ASCII, tab, newline and carriage return only.
  if (/[^\t\n\r\x20-\x7e]/.test(input.output)) throw new BufferMatchError("bad-output-char");
  // At most four rows.
  if (!Array.isArray(input.patterns) || input.patterns.length > ROWS_MAX) throw new BufferMatchError("too-many-rows");
  // Each row's text.
  input.patterns.forEach((r, i) => {
    // Too long.
    if (r.text.length > PATTERN_MAX) throw new BufferMatchError("pattern-too-long", i);
    // Printable ASCII only (a pattern is typed on one line).
    if (/[^\x20-\x7e]/.test(r.text)) throw new BufferMatchError("bad-pattern-char", i);
  });
  // At least one used row.
  if (!input.patterns.some((r) => r.text !== "")) throw new BufferMatchError("no-pattern");
}

/** Compile every -re row; a refusal names the row. */
function compileRows(rows: PatternRow[]): (CompiledAre | null)[] {
  // One entry per row.
  return rows.map((r, i) => {
    // Only used -re rows compile.
    if (r.text === "" || r.kind !== "re") return null;
    try {
      // Compile with the row's case rule.
      return compileAre(r.text, r.nocase);
    } catch (e) {
      // Tcl's refusal or the lab's.
      if (e instanceof AreRefusal) {
        // Invalid in Tcl.
        if (e.kind === "invalid") throw new BufferMatchError("re-invalid", i, e.detail as AreInvalidReason);
        // Outside the subset.
        if (e.kind === "not-modelled") throw new BufferMatchError("re-not-modelled", i, e.detail as AreNotModelled);
        // Too costly.
        throw new BufferMatchError("too-complex", i);
      }
      // Anything else is a bug and must surface.
      throw e;
    }
  });
}

/** Try one row against the buffer as it stands: its span and groups, or null. */
function tryRow(row: PatternRow, re: CompiledAre | null, s: string, budget: WorkBudget): { span: [number, number]; groups: [number, number][] } | null {
  // Glob.
  if (row.kind === "glob") {
    const m = globSearch(s, row.text, row.nocase, budget);
    return m ? { span: m, groups: [] } : null;
  }
  // -ex.
  if (row.kind === "ex") {
    // A little work for the search.
    spend(budget, s.length + 1);
    const m = exactSearch(s, row.text, row.nocase);
    return m ? { span: m, groups: [] } : null;
  }
  // -re, through the shared budget.
  try {
    const m = execAre(re as CompiledAre, s, budget);
    return m ? { span: [m.start, m.end], groups: m.groups } : null;
  } catch (e) {
    // The matcher's budget ran out.
    if (e instanceof AreRefusal) throw new BufferMatchError("too-complex");
    // Anything else is a bug.
    throw e;
  }
}

/** Run the model. */
export function compute(input: BufferMatchInput): BufferMatchResult {
  // Refuse bad settings first.
  validate(input);
  // Compile the -re rows (refusals name their row).
  const compiled = compileRows(input.patterns);
  // Rule 3: through a terminal every newline arrives as \r\n.
  const buffer = input.pty ? input.output.replace(/\n/g, "\r\n") : input.output;
  // Rule 2: the moments the patterns are tried, as numbers of characters arrived.
  const points = input.arrival === "waiting" ? [buffer.length] : input.arrival === "one-read" ? [0, buffer.length] : Array.from({ length: buffer.length + 1 }, (_, k) => k);
  // The used rows, in order.
  const used = input.patterns.map((r, i) => ({ r, i })).filter((x) => x.r.text !== "");
  // One work allowance for the whole computation.
  const budget: WorkBudget = { left: TOTAL_BUDGET };
  // The notes that do not depend on the outcome.
  const backslashLetterRows = used.filter((x) => x.r.kind !== "re" && /\\[rnt]/.test(x.r.text)).map((x) => x.i);
  const nocaseBracketRows = used.filter((x) => x.r.kind === "glob" && x.r.nocase && x.r.text.includes("[")).map((x) => x.i);
  // The trials at the last check made.
  let trials: RowTrial[] = [];
  // Each moment in turn.
  for (let c = 0; c < points.length; c++) {
    // What had arrived.
    const k = points[c];
    const s = buffer.slice(0, k);
    // Rule 1: each used row in order; the first that matches wins.
    trials = [];
    let won: { row: number; span: [number, number]; groups: [number, number][] } | null = null;
    for (const { r, i } of used) {
      // This row against the buffer as it stands.
      const m = tryRow(r, compiled[i], s, budget);
      // Record the trial.
      trials.push({ row: i, matched: m !== null, start: m ? m.span[0] : -1, end: m ? m.span[1] : -1 });
      // The first match decides; later rows are not tried.
      if (m && !won) {
        won = { row: i, span: m.span, groups: m.groups };
        break;
      }
    }
    // A match: the answer.
    if (won) {
      // The span.
      const [a, b] = won.span;
      // Rule 9: for -re, an empty span at the very start reads back as the whole buffer as it stood (5.45.4 asks Tcl
      // for the range 0 to -1, which Tcl 8.6 returns whole; run r10). Glob and -ex use a length and stay empty.
      const isRe = input.patterns[won.row].kind === "re";
      const text = (x: number, y: number) => (isRe && x === 0 && y === 0 ? s : s.slice(x, y));
      return {
        buffer,
        checks: c + 1,
        arrived: k,
        winner: won.row,
        match: text(a, b),
        span: [a, b],
        groups: won.groups.map(([x, y]) => (x < 0 ? "" : text(x, y))),
        expectOutBuffer: s.slice(0, b),
        left: buffer.slice(b),
        trials,
        backslashLetterRows,
        nocaseBracketRows,
        emptyAtStart: isRe && s.length > 0 && ((a === 0 && b === 0) || won.groups.some(([x, y]) => x === 0 && y === 0)),
      };
    }
  }
  // No match at any moment: expect is still waiting with the whole buffer.
  return {
    buffer,
    checks: points.length,
    arrived: buffer.length,
    winner: null,
    match: null,
    span: null,
    groups: [],
    expectOutBuffer: null,
    left: buffer,
    trials,
    backslashLetterRows,
    nocaseBracketRows,
    emptyAtStart: false,
  };
}

/** The lab's opening state: a switch prompt after a command's echo; the anchored prompt pattern waits for the end. */
export const DEFAULT_INPUT: BufferMatchInput = {
  output: "show clock\n09:41:07.123 UTC Tue Oct 27 2026\nswitch# ",
  pty: true,
  arrival: "one-read",
  patterns: [
    { kind: "re", nocase: false, text: "[>#] ?$" },
    { kind: "glob", nocase: false, text: "" },
    { kind: "glob", nocase: false, text: "" },
    { kind: "glob", nocase: false, text: "" },
  ],
};

/** The Example: a login whose order trap the reader can see; "login:" is listed second and lost. */
export const EXAMPLE_INPUT: BufferMatchInput = {
  output: "Last login: Mon Oct 26 18:02:11 2026\nlogin: ",
  pty: true,
  arrival: "waiting",
  patterns: [
    { kind: "glob", nocase: true, text: "*assword:*" },
    { kind: "glob", nocase: false, text: "login:" },
    { kind: "re", nocase: false, text: "login: $" },
    { kind: "glob", nocase: false, text: "" },
  ],
};
