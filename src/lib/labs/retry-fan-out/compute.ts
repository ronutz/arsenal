// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/retry-fan-out/compute.ts
// ----------------------------------------------------------------------------
// THE RETRY FAN-OUT LAB'S MODEL (2026-10-26), the interactive companion of the
// article "Retries, timeouts and idempotency: when the answer never arrives".
// One user action enters a chain of four services: the entry point calls
// service 1, service 1 calls service 2, service 2 calls the last service. The
// first three each have a retry policy, set by the reader as the number of
// attempts it makes for one incoming call (1 means no retry). The last service
// is failing, so every attempt fails and every layer uses all of its attempts:
// the worst case, which is the case that matters, because the bottom of a chain
// usually fails when it is overloaded.
//
//   1. Service 1 receives as many calls as the entry point makes attempts.
//   2. Each call service 1 receives becomes that many times its own attempts
//      towards service 2, and likewise one level down: the calls a layer
//      receives are the PRODUCT of the attempts of every layer above it.
//   3. Retrying at a single point (only the entry point retries, the others
//      make one attempt each) costs the last service as many calls as the entry
//      point makes attempts.
//
// The rules are the article's own, with its source: retries multiply across
// layers, three tries at each of five layers reach the bottom 243 times, and
// retrying at a single point of the stack is the published recommendation
// (AWS Builder Center, "Timeouts, retries, and backoff with jitter", read
// 2026-10-26). What the model leaves out is stated in the lab's scope note:
// time (per-attempt timeouts, deadlines, backoff and jitter), partial failures
// and retry budgets.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The fewest attempts a layer can make: one, meaning it does not retry. */
export const MIN_ATTEMPTS = 1;
/** The most attempts a layer can make in the lab: enough to show the product running away. */
export const MAX_ATTEMPTS = 10;

/** The reader's settings: how many attempts each retrying layer makes for one incoming call. */
export interface RetryFanOutInput {
  /** Attempts the entry point makes towards service 1. */
  entry: number;
  /** Attempts service 1 makes towards service 2, for each call it receives. */
  service1: number;
  /** Attempts service 2 makes towards the last service, for each call it receives. */
  service2: number;
}

/** The model's answer for one failed user action. */
export interface RetryFanOutResult {
  /** Calls service 1 receives. */
  toService1: number;
  /** Calls service 2 receives. */
  toService2: number;
  /** Calls the last (failing) service receives. */
  toLast: number;
  /** Every call made along the chain, all three hops added up. */
  totalCalls: number;
  /** How many of the three layers retry (make more than one attempt). */
  retryingLayers: number;
  /** Calls the last service would receive if only the entry point retried, with the same attempts. */
  singlePointToLast: number;
  /** How many times more calls the last service receives than with retries at a single point. */
  overSinglePoint: number;
}

/** The stable codes an invalid input is refused with. */
export type RetryFanOutErrorCode = "bad-attempts";

/** The error a refused input throws, with its stable code. */
export class RetryFanOutError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: RetryFanOutErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: RetryFanOutErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** True when a value is a whole number of attempts within the lab's range. */
function isAttempts(v: unknown): v is number {
  // A number, whole, from one to the maximum.
  return typeof v === "number" && Number.isInteger(v) && v >= MIN_ATTEMPTS && v <= MAX_ATTEMPTS;
}

/** Count the calls one failed user action causes at every hop of the chain. */
export function compute(input: RetryFanOutInput): RetryFanOutResult {
  // Every layer's attempts must be a whole number in range.
  for (const v of [input.entry, input.service1, input.service2]) {
    // A stray value is refused rather than rounded.
    if (!isAttempts(v)) throw new RetryFanOutError("bad-attempts", `attempts must be a whole number from ${MIN_ATTEMPTS} to ${MAX_ATTEMPTS}: ${String(v)}`);
  }
  // Rule 1: service 1 receives every attempt the entry point makes.
  const toService1 = input.entry;
  // Rule 2: each of those becomes service 1's attempts towards service 2.
  const toService2 = toService1 * input.service1;
  // Rule 2 again, one level down: each of those becomes service 2's attempts towards the last service.
  const toLast = toService2 * input.service2;
  // Rule 3: with retries only at the entry point, the last service sees the entry point's attempts and no more.
  const singlePointToLast = input.entry;
  // Every answer, for the result panel.
  return {
    toService1,
    toService2,
    toLast,
    totalCalls: toService1 + toService2 + toLast,
    retryingLayers: [input.entry, input.service1, input.service2].filter((a) => a > 1).length,
    singlePointToLast,
    overSinglePoint: toLast / singlePointToLast,
  };
}

/** The lab's opening state: retries at a single point, the entry point making three attempts. */
export const DEFAULT_INPUT: RetryFanOutInput = { entry: 3, service1: 1, service2: 1 };

/** The Example button's state: three attempts at every layer, the article's 27 calls at the bottom. */
export const EXAMPLE_INPUT: RetryFanOutInput = { entry: 3, service1: 3, service2: 3 };
