// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/retry-fan-out/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the retry fan-out lab (set 2026-10-26a). Each case is
// worked by hand from the rule in compute.ts (the calls a layer receives are
// the product of the attempts of every layer above it). The cases marked
// "checked" were also run in the original interactive guide (TRN-06) on
// 2026-10-26 and compared hop for hop: 2 x 3 x 4 gives 2, 6 and 24; 1 x 1 x 1
// gives 1; 10 x 10 x 10 gives 1,000; 11 attempts is refused. The 3 x 3 x 3 case
// is the article's own 27. Reject vectors pin the stable error code.
// verifyVectors() runs them all; scripts/run-golden-vectors runs it at prebuild
// and fails the build on any drift.
// ============================================================================

import { compute, RetryFanOutError, type RetryFanOutErrorCode, type RetryFanOutInput, type RetryFanOutResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "retry-fan-out/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: RetryFanOutInput;
  /** The fields of the result that must match. */
  expect: Partial<RetryFanOutResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (the interface's parser can produce every one of them). */
  input: RetryFanOutInput;
  /** The code the refusal must carry. */
  code: RetryFanOutErrorCode;
}

/** The accept cases. */
export const RETRY_FAN_OUT_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The article's case: three attempts at three layers reach the last service 27 times.
  { id: "article-three-cubed", input: { entry: 3, service1: 3, service2: 3 }, expect: { toService1: 3, toService2: 9, toLast: 27, totalCalls: 39, retryingLayers: 3, singlePointToLast: 3, overSinglePoint: 9 } },
  // Checked: different policies per layer still multiply.
  { id: "checked-2-3-4", input: { entry: 2, service1: 3, service2: 4 }, expect: { toService1: 2, toService2: 6, toLast: 24, totalCalls: 32, retryingLayers: 3, singlePointToLast: 2, overSinglePoint: 12 } },
  // Checked: nobody retries, one call per hop.
  { id: "checked-no-retries", input: { entry: 1, service1: 1, service2: 1 }, expect: { toService1: 1, toService2: 1, toLast: 1, totalCalls: 3, retryingLayers: 0, singlePointToLast: 1, overSinglePoint: 1 } },
  // Checked: the lab's ceiling, a thousand calls at the bottom for one failed action.
  { id: "checked-ten-cubed", input: { entry: 10, service1: 10, service2: 10 }, expect: { toService1: 10, toService2: 100, toLast: 1000, totalCalls: 1110, retryingLayers: 3, overSinglePoint: 100 } },
  // Retrying at a single point, the entry point: the last service sees exactly its attempts.
  { id: "single-point-entry", input: { entry: 3, service1: 1, service2: 1 }, expect: { toService1: 3, toService2: 3, toLast: 3, totalCalls: 9, retryingLayers: 1, singlePointToLast: 3, overSinglePoint: 1 } },
  // A single point deeper in the chain costs the bottom the same, but the comparison is still with the entry point.
  { id: "single-point-deep", input: { entry: 1, service1: 1, service2: 3 }, expect: { toService1: 1, toService2: 1, toLast: 3, retryingLayers: 1, singlePointToLast: 1, overSinglePoint: 3 } },
  // Two retrying layers: two times three.
  { id: "two-layers", input: { entry: 2, service1: 1, service2: 3 }, expect: { toService1: 2, toService2: 2, toLast: 6, totalCalls: 10, retryingLayers: 2, overSinglePoint: 3 } },
]);

/** The reject cases. */
export const RETRY_FAN_OUT_REJECTS: readonly RejectVector[] = Object.freeze([
  // Zero attempts: a layer that never calls is not a policy the lab models.
  { id: "zero", input: { entry: 0, service1: 3, service2: 3 }, code: "bad-attempts" },
  // Checked: eleven attempts is past the lab's range.
  { id: "eleven", input: { entry: 3, service1: 11, service2: 3 }, code: "bad-attempts" },
  // A fraction of an attempt.
  { id: "fraction", input: { entry: 3, service1: 3, service2: 2.5 }, code: "bad-attempts" },
  // An empty field, which the interface reads as not a number.
  { id: "empty", input: { entry: Number.NaN, service1: 3, service2: 3 }, code: "bad-attempts" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of RETRY_FAN_OUT_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof RetryFanOutResult];
      // A difference is a failure naming the case and the field (every value here is a whole number, so exact).
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of RETRY_FAN_OUT_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof RetryFanOutError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = RETRY_FAN_OUT_VECTORS.length + RETRY_FAN_OUT_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
