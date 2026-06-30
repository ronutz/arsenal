// ============================================================================
// src/lib/tools/diff/compute.ts
// ----------------------------------------------------------------------------
// TEXT DIFF - the compute core for the diff tool.
//
// Both the line view and the inline word view reduce to ONE operation: compute
// the Longest Common Subsequence (LCS) of two token arrays, then walk it to
// produce a minimal edit script of equal / delete / insert steps. Tokens are
// whole lines for the line diff and word/space/punctuation runs for the inline
// diff. This is the LCS at the heart of the Myers diff algorithm; the output is
// a valid minimal-length edit script, made deterministic by a fixed tie-break
// (prefer "delete" when the two directions are equally good).
//
// DETERMINISM (D-49): a pure function of its inputs - no clock, no randomness,
// no network. The whole tool runs in the browser; nothing is sent anywhere. A
// single golden-vector set pins it.
//
// COMPLEXITY: the LCS table is O(n*m) in time and memory (n, m = token counts).
// That is fine for the interactive inputs a diff tool sees; beyond a generous
// cell budget the engine throws `diff_too_large` so a pathological paste cannot
// hang the tab, and the inline word diff degrades to a whole-line replace rather
// than throwing.
// ============================================================================

/** The three edit operations, shared by the line and word diffs. */
export type DiffOp = "equal" | "insert" | "delete";

/** One line in the rendered diff. Line numbers are 1-based and null on the side
 *  where the line does not exist (null bLine for a deletion, null aLine for an
 *  insertion). */
export interface DiffLine {
  op: DiffOp;
  text: string;
  aLine: number | null;
  bLine: number | null;
}

/** One run in an inline (word-level) diff, used to highlight what changed
 *  inside a modified line. Joining every `text` in order rebuilds the side. */
export interface WordPart {
  op: DiffOp;
  text: string;
}

/** Counts for the summary line. */
export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

/** Comparison options. They affect EQUALITY only; the text shown is always the
 *  original, so e.g. ignoreWhitespace hides whitespace-only changes without
 *  rewriting the user's content. */
export interface DiffOptions {
  /** Collapse runs of whitespace and trim ends before comparing. */
  ignoreWhitespace?: boolean;
  /** Compare case-insensitively. */
  ignoreCase?: boolean;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: DiffStats;
}

/** Largest LCS table we will allocate (cells = n*m). ~2M cells of Int32 is a
 *  few MB; past this the input is too large for an in-browser full diff. */
const MAX_CELLS = 2_000_000;

/** Normalise a token for COMPARISON only (never for display). */
function normalize(s: string, opts: DiffOptions): string {
  let x = s;
  if (opts.ignoreCase) x = x.toLowerCase();
  if (opts.ignoreWhitespace) x = x.replace(/\s+/g, " ").trim();
  return x;
}

/**
 * lcsOps - the shared core. Given two token arrays and a comparison key, return
 * the edit script as a flat op list referencing source indices.
 *
 * The DP table holds suffix-LCS lengths: dp[i][j] = LCS(a[i:], b[j:]). It is
 * filled from the end, then the script is read off from the front. The tie-break
 * `dp[i+1][j] >= dp[i][j+1]` makes a unique, stable choice when a delete and an
 * insert are equally good, which is what lets golden vectors pin the output.
 */
function lcsOps(
  aKeys: string[],
  bKeys: string[]
): Array<{ op: DiffOp; aIdx: number; bIdx: number }> {
  const n = aKeys.length;
  const m = bKeys.length;

  // dp has n+1 rows of Int32Array(m+1), all zero-initialised (the last row and
  // column are the base cases: an empty suffix shares nothing).
  const dp: Int32Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Int32Array(m + 1);
  for (let i = n - 1; i >= 0; i--) {
    const ai = aKeys[i];
    const rowI = dp[i];
    const rowI1 = dp[i + 1];
    for (let j = m - 1; j >= 0; j--) {
      rowI[j] = ai === bKeys[j] ? rowI1[j + 1] + 1 : Math.max(rowI1[j], rowI[j + 1]);
    }
  }

  const ops: Array<{ op: DiffOp; aIdx: number; bIdx: number }> = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aKeys[i] === bKeys[j]) {
      ops.push({ op: "equal", aIdx: i, bIdx: j });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ op: "delete", aIdx: i, bIdx: -1 });
      i++;
    } else {
      ops.push({ op: "insert", aIdx: -1, bIdx: j });
      j++;
    }
  }
  while (i < n) ops.push({ op: "delete", aIdx: i++, bIdx: -1 });
  while (j < m) ops.push({ op: "insert", aIdx: -1, bIdx: j++ });
  return ops;
}

/** Split into lines, treating CRLF and LF alike. A trailing newline yields a
 *  final empty line, which is kept so a trailing-newline change is still
 *  visible. */
function splitLines(text: string): string[] {
  if (text === "") return [];
  return text.split(/\r\n|\r|\n/);
}

/**
 * diffLines - the primary entry point. Diff A against B line by line.
 * Throws Error("diff_too_large") when the LCS table would exceed MAX_CELLS.
 */
export function diffLines(a: string, b: string, opts: DiffOptions = {}): DiffResult {
  const aLines = splitLines(a);
  const bLines = splitLines(b);

  if (aLines.length * bLines.length > MAX_CELLS) {
    throw new Error("diff_too_large");
  }

  const aKeys = aLines.map((l) => normalize(l, opts));
  const bKeys = bLines.map((l) => normalize(l, opts));
  const ops = lcsOps(aKeys, bKeys);

  const lines: DiffLine[] = [];
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 };
  let aNum = 0;
  let bNum = 0;
  for (const o of ops) {
    if (o.op === "equal") {
      aNum++;
      bNum++;
      lines.push({ op: "equal", text: aLines[o.aIdx], aLine: aNum, bLine: bNum });
      stats.unchanged++;
    } else if (o.op === "delete") {
      aNum++;
      lines.push({ op: "delete", text: aLines[o.aIdx], aLine: aNum, bLine: null });
      stats.removed++;
    } else {
      bNum++;
      lines.push({ op: "insert", text: bLines[o.bIdx], aLine: null, bLine: bNum });
      stats.added++;
    }
  }
  return { lines, stats };
}

/** Tokenise a line into runs of whitespace, word characters, or other
 *  punctuation, keeping every character so the runs rejoin to the original. */
function tokenizeWords(text: string): string[] {
  return text.match(/\s+|[A-Za-z0-9_]+|[^\sA-Za-z0-9_]+/g) ?? [];
}

/**
 * diffWords - inline diff of two single lines, for highlighting what changed
 * within a modified line. Consecutive same-op tokens are merged into one part.
 * If the token product is too large, it degrades to a whole-line replace rather
 * than throwing (the caller is rendering, not validating).
 */
export function diffWords(a: string, b: string, opts: DiffOptions = {}): WordPart[] {
  const aTok = tokenizeWords(a);
  const bTok = tokenizeWords(b);

  if (aTok.length * bTok.length > MAX_CELLS) {
    return [
      { op: "delete", text: a },
      { op: "insert", text: b },
    ];
  }

  const aKeys = aTok.map((t) => normalize(t, opts));
  const bKeys = bTok.map((t) => normalize(t, opts));
  const ops = lcsOps(aKeys, bKeys);

  const parts: WordPart[] = [];
  for (const o of ops) {
    const text = o.op === "insert" ? bTok[o.bIdx] : aTok[o.aIdx];
    const last = parts[parts.length - 1];
    if (last && last.op === o.op) last.text += text;
    else parts.push({ op: o.op, text });
  }
  return parts;
}
