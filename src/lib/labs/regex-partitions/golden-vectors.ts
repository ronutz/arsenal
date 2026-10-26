// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/regex-partitions/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the regex partitions lab (set 2026-10-26a). Each case is
// worked by hand from the rules in compute.ts (n a's, n - 1 gaps, 2^(n - 1)
// splits). The cases marked "checked" were also run in the original interactive
// guide (REG-03) on 2026-10-26 and compared count for count: 1 a gives 1,
// 3 a's give 4, 20 a's give 524,288. The guide refused 21; this lab's range
// runs to 40 so that it reaches the article's "two dozen characters", and 21 is
// an accept case here. Reject vectors pin the stable error code. The four-a
// listing is compared line for line. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on any
// drift.
// ============================================================================

import { compute, RegexPartitionsError, type RegexPartitionsErrorCode, type RegexPartitionsInput, type RegexPartitionsResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "regex-partitions/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared; the listing line by line). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's setting. */
  input: RegexPartitionsInput;
  /** The fields of the result that must match. */
  expect: Partial<RegexPartitionsResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** A setting outside the lab's range (the interface's parser can produce every one of them). */
  input: RegexPartitionsInput;
  /** The code the refusal must carry. */
  code: RegexPartitionsErrorCode;
}

/** The accept cases. */
export const REGEX_PARTITIONS_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: one a, no gap, one split.
  { id: "checked-one", input: { length: 1 }, expect: { subject: "a!", gaps: 0, splits: 1, nextSplits: 2, listed: ["(a)"] } },
  // Checked: three a's, two gaps, four splits.
  { id: "checked-three", input: { length: 3 }, expect: { subject: "aaa!", gaps: 2, splits: 4, nextSplits: 8, listed: ["(aaa)", "(a)(aa)", "(aa)(a)", "(a)(a)(a)"] } },
  // The opening state: four a's, eight splits, every one listed.
  { id: "four-listed", input: { length: 4 }, expect: { gaps: 3, splits: 8, listed: ["(aaaa)", "(a)(aaa)", "(aa)(aa)", "(a)(a)(aa)", "(aaa)(a)", "(a)(aa)(a)", "(aa)(a)(a)", "(a)(a)(a)(a)"] } },
  // The last length that is listed.
  { id: "five-listed-count", input: { length: 5 }, expect: { splits: 16, nextSplits: 32 } },
  // Past the listing threshold the list is withheld.
  { id: "six-not-listed", input: { length: 6 }, expect: { splits: 32, listed: null } },
  // Checked: twenty a's, 524,288 splits.
  { id: "checked-twenty", input: { length: 20 }, expect: { gaps: 19, splits: 524288, nextSplits: 1048576, listed: null } },
  // Refused by the guide, accepted here: twenty-one a's.
  { id: "twenty-one", input: { length: 21 }, expect: { splits: 1048576 } },
  // The Example: the article's two dozen a's.
  { id: "article-two-dozen", input: { length: 24 }, expect: { subject: "aaaaaaaaaaaaaaaaaaaaaaaa!", gaps: 23, splits: 8388608, nextSplits: 16777216 } },
  // The ceiling: forty a's, still an exact count.
  { id: "max-forty", input: { length: 40 }, expect: { gaps: 39, splits: 549755813888, nextSplits: 1099511627776 } },
]);

/** The reject cases. */
export const REGEX_PARTITIONS_REJECTS: readonly RejectVector[] = Object.freeze([
  // No a's at all.
  { id: "zero", input: { length: 0 }, code: "bad-length" },
  // One past the lab's range.
  { id: "forty-one", input: { length: 41 }, code: "bad-length" },
  // A fraction of a letter.
  { id: "fraction", input: { length: 3.5 }, code: "bad-length" },
  // An empty field, which the interface reads as not a number.
  { id: "empty", input: { length: Number.NaN }, code: "bad-length" },
]);

/** True when two values agree: lists element by element, anything else exactly. */
function same(have: unknown, want: unknown): boolean {
  // Two lists: same length and the same entries in the same order.
  if (Array.isArray(have) && Array.isArray(want)) return have.length === want.length && have.every((x, i) => x === want[i]);
  // Numbers, strings and null: exact.
  return have === want;
}

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of REGEX_PARTITIONS_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof RegexPartitionsResult];
      // A difference is a failure naming the case and the field.
      if (!same(have, want)) failures.push(`${v.id}: ${k} is ${JSON.stringify(have)}, expected ${JSON.stringify(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of REGEX_PARTITIONS_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof RegexPartitionsError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = REGEX_PARTITIONS_VECTORS.length + REGEX_PARTITIONS_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
