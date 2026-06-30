// ============================================================================
// src/lib/tools/diff/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the diff tool (set id: "diff-golden-v1").
//
// Hand-checkable cases, each reproduced exactly by the engine before freezing:
// a pure insertion, a pure deletion, a change (delete + insert), a
// whitespace-insensitive match, an empty-vs-text insertion, an identical pair,
// and one inline word diff whose parts rejoin to the original A and B. There are
// no reject vectors: diffLines only throws on inputs past the multi-million-cell
// budget, which is impractical (and pointless) to encode as a fixture.
// ============================================================================

import type { DiffLine, DiffOptions, DiffStats, WordPart } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "diff-golden-v1";

/** A line-diff case: diffLines(a, b, opts) must produce `expected` + `stats`. */
export interface DiffGoldenVector {
  name: string;
  a: string;
  b: string;
  opts?: DiffOptions;
  expected: DiffLine[];
  stats: DiffStats;
}

/** A word-diff case: diffWords(a, b) must produce `expected`. */
export interface WordGoldenVector {
  name: string;
  a: string;
  b: string;
  expected: WordPart[];
}

export const DIFF_GOLDEN_VECTORS: DiffGoldenVector[] = [
  {
    name: "pure-insertion",
    a: "line1\nline2",
    b: "line1\nline2\nline3",
    expected: [
      { op: "equal", text: "line1", aLine: 1, bLine: 1 },
      { op: "equal", text: "line2", aLine: 2, bLine: 2 },
      { op: "insert", text: "line3", aLine: null, bLine: 3 },
    ],
    stats: { added: 1, removed: 0, unchanged: 2 },
  },
  {
    name: "pure-deletion",
    a: "a\nb\nc",
    b: "a\nc",
    expected: [
      { op: "equal", text: "a", aLine: 1, bLine: 1 },
      { op: "delete", text: "b", aLine: 2, bLine: null },
      { op: "equal", text: "c", aLine: 3, bLine: 2 },
    ],
    stats: { added: 0, removed: 1, unchanged: 2 },
  },
  {
    name: "change-delete-then-insert",
    a: "hello\nworld",
    b: "hello\nthere",
    expected: [
      { op: "equal", text: "hello", aLine: 1, bLine: 1 },
      { op: "delete", text: "world", aLine: 2, bLine: null },
      { op: "insert", text: "there", aLine: null, bLine: 2 },
    ],
    stats: { added: 1, removed: 1, unchanged: 1 },
  },
  {
    name: "ignore-whitespace-matches",
    a: "foo  bar",
    b: "foo bar",
    opts: { ignoreWhitespace: true },
    expected: [{ op: "equal", text: "foo  bar", aLine: 1, bLine: 1 }],
    stats: { added: 0, removed: 0, unchanged: 1 },
  },
  {
    name: "empty-a-is-pure-insert",
    a: "",
    b: "x",
    expected: [{ op: "insert", text: "x", aLine: null, bLine: 1 }],
    stats: { added: 1, removed: 0, unchanged: 0 },
  },
  {
    name: "identical",
    a: "same\ntext",
    b: "same\ntext",
    expected: [
      { op: "equal", text: "same", aLine: 1, bLine: 1 },
      { op: "equal", text: "text", aLine: 2, bLine: 2 },
    ],
    stats: { added: 0, removed: 0, unchanged: 2 },
  },
];

export const DIFF_WORD_GOLDEN_VECTORS: WordGoldenVector[] = [
  {
    name: "inline-word-change",
    a: "the quick brown fox",
    b: "the slow brown fox",
    expected: [
      { op: "equal", text: "the " },
      { op: "delete", text: "quick" },
      { op: "insert", text: "slow" },
      { op: "equal", text: " brown fox" },
    ],
  },
];
