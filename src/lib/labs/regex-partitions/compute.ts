// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/regex-partitions/compute.ts
// ----------------------------------------------------------------------------
// THE REGEX PARTITIONS LAB'S MODEL (2026-10-26), the interactive companion of
// the article "Catastrophic Backtracking and ReDoS". The pattern (a+)+$ meets
// a run of n a's followed by a "!", so it can never match, and a backtracking
// engine tries the ways of dividing the run among the repetitions of the outer
// group before it gives up. The model COUNTS those ways; it never runs a
// regular expression, so no input to the lab can make the page slow.
//
//   1. A run of n a's has n - 1 gaps between neighbouring a's.
//   2. Each gap either separates two repetitions of (a+) or does not, and
//      every choice of gaps gives a different split, so there are 2^(n - 1)
//      splits (for one a, no gap and one split).
//   3. One more a adds one gap and doubles the count.
//
// Rules 1 to 3 are arithmetic, shown step by step in the lab. The article
// states the consequence with its source: the number of paths the engine may
// try for ^(a+)+$ doubles with each additional a (OWASP, "Regular expression
// Denial of Service - ReDoS", read 2026-10-26). What the model leaves out is
// stated in the lab's scope note: time, the order in which a real engine tries
// the splits and the optimisations that can skip some, and the attempts that
// stop before the end of the run.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The shortest run the lab accepts. */
export const MIN_LENGTH = 1;
/** The longest run the lab accepts: past the article's "two dozen characters", and 2^39 is still an exact number. */
export const MAX_LENGTH = 40;
/** The longest run whose splits the lab also lists one by one (2^4 = 16 lines). */
export const MAX_LISTED = 5;

/** The reader's setting. */
export interface RegexPartitionsInput {
  /** The number of a's before the "!". */
  length: number;
}

/** The model's answer. */
export interface RegexPartitionsResult {
  /** The input the pattern meets: n a's and a "!". */
  subject: string;
  /** Rule 1: the gaps between neighbouring a's. */
  gaps: number;
  /** Rule 2: the ways the run can be split among repetitions of (a+). */
  splits: number;
  /** Rule 3: the ways with one more a. */
  nextSplits: number;
  /** Every split written with one pair of parentheses per repetition, when the run is short enough to list; otherwise null. */
  listed: string[] | null;
}

/** The stable codes an invalid input is refused with. */
export type RegexPartitionsErrorCode = "bad-length";

/** The error a refused input throws, with its stable code. */
export class RegexPartitionsError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: RegexPartitionsErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: RegexPartitionsErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** Every split of a run of n a's, one per choice of gaps, in the order of the gap mask (no cut first). */
function listSplits(n: number): string[] {
  // The splits, built one per mask.
  const out: string[] = [];
  // Each mask's bit i says whether the gap after the (i + 1)th a is a cut.
  for (let mask = 0; mask < 2 ** (n - 1); mask++) {
    // The split being written, starting with the first repetition's opening parenthesis.
    let s = "(a";
    // Walk the remaining a's, closing and opening a repetition at each cut.
    for (let i = 1; i < n; i++) s += (mask >> (i - 1)) & 1 ? ")(a" : "a";
    // Close the last repetition and keep the split.
    out.push(s + ")");
  }
  // All of them.
  return out;
}

/** Count the splits of a run of n a's among the repetitions of (a+). */
export function compute(input: RegexPartitionsInput): RegexPartitionsResult {
  // The length must be a whole number in range.
  const n = input.length;
  // A stray value is refused rather than rounded.
  if (typeof n !== "number" || !Number.isInteger(n) || n < MIN_LENGTH || n > MAX_LENGTH) throw new RegexPartitionsError("bad-length", `length must be a whole number from ${MIN_LENGTH} to ${MAX_LENGTH}: ${String(n)}`);
  // Rule 1: one gap fewer than a's.
  const gaps = n - 1;
  // The answer, every rule applied.
  return {
    subject: "a".repeat(n) + "!",
    gaps,
    // Rule 2: two choices per gap.
    splits: 2 ** gaps,
    // Rule 3: one more gap, twice the splits.
    nextSplits: 2 ** (gaps + 1),
    // The full list only while it stays short.
    listed: n <= MAX_LISTED ? listSplits(n) : null,
  };
}

/** The lab's opening state: four a's, eight splits, short enough to list. */
export const DEFAULT_INPUT: RegexPartitionsInput = { length: 4 };

/** The Example button's state: the article's two dozen a's, 8,388,608 splits. */
export const EXAMPLE_INPUT: RegexPartitionsInput = { length: 24 };
