// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/dns-two-caches/compute.ts
// ----------------------------------------------------------------------------
// THE TWO-CACHES LAB'S MODEL (2026-10-26), the interactive companion of the
// article "Authoritative vs Non-Authoritative Answers". One name,
// www.example.com, one authoritative server and two recursive resolvers. On the
// lab's clock, resolver A cached the name at 0 s and resolver B at 20 s, both
// before the zone changed at 30 s, and nobody asked either of them since. The
// reader sets the record's TTL, the moment a client asks ("now"), the kind of
// change, whether the authority answers and whether the resolvers serve stale
// data, and the model gives the three answers a client would get at that
// moment: from the authority itself and from each resolver.
//
// The rules are the article's, each with its source there:
//   - A resolver answers from its cache while the entry is younger than its TTL
//     (RFC 1034, 5.3.3); the TTL left is the TTL minus the entry's age, and a
//     cache relaying a denial decrements its TTL the same way (RFC 2308, 6).
//   - An expired entry is fetched again from the authority; the fresh answer
//     carries the zone's full TTL. A resolver's answer has the AA bit clear,
//     however fresh; only the zone's own server sets it (RFC 1035, 4.1.1;
//     RFC 2181, 5.4.1).
//   - A negative answer's TTL is the lesser of the SOA's TTL and its MINIMUM
//     (RFC 2308, 3). The lab sets both to the record's TTL, so a denial lives
//     exactly as long as an address would.
//   - When no server of the zone answers, the lookup is a resolution failure,
//     which a recursive resolver returns as SERVFAIL (RFC 9520, 2.1 and 2.3);
//     with serve-stale, it may answer with the expired record instead, with a
//     TTL above zero, 30 seconds recommended (RFC 8767, 4).
// What the model leaves out (the lab's scope note): DNSSEC, prefetching,
// TTL capping, negative caching of the failure itself, the timers of RFC 8767
// section 5, several authoritative servers, and queries between the two fills
// and "now".
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** What happens to the name at 30 s on the authority. */
export type Change = "change" | "create" | "remove";
/** Every value the change control can take. */
export const CHANGES: readonly Change[] = ["change", "create", "remove"];

/** The address before the change. */
export const OLD_ADDRESS = "192.0.2.10";
/** The address after the change. */
export const NEW_ADDRESS = "192.0.2.20";
/** The moment the zone changes, in seconds on the lab's clock. */
export const CHANGE_AT = 30;
/** When resolver A cached the name. */
export const FILLED_A = 0;
/** When resolver B cached the name. */
export const FILLED_B = 20;
/** The TTL a resolver gives a stale answer, in seconds (RFC 8767, 4, recommended). */
export const STALE_TTL = 30;
/** The longest TTL the lab accepts: 7 days, the cap RFC 8767 suggests. */
export const MAX_TTL = 604800;
/** The latest "now" the lab accepts, in seconds: 7 days. */
export const MAX_NOW = 604800;

/** The reader's settings. */
export interface DnsTwoCachesInput {
  /** The record's TTL in seconds (also the zone's negative TTL). */
  ttl: number;
  /** The moment the client asks, in seconds on the lab's clock (from 20). */
  now: number;
  /** What happens at 30 s. */
  change: Change;
  /** True when the authoritative server answers. */
  authorityUp: boolean;
  /** True when the resolvers serve stale data on failure. */
  serveStale: boolean;
}

/** One answer: an address, a denial or a failure. */
export type Answer = typeof OLD_ADDRESS | typeof NEW_ADDRESS | "NXDOMAIN" | "SERVFAIL";
/** Where a resolver's answer came from. */
export type Source = "cache" | "fetched" | "stale" | "failed";

/** One resolver's reply at "now". */
export interface ResolverReply {
  /** "A" or "B". */
  name: "A" | "B";
  /** When it cached the name. */
  filledAt: number;
  /** The cache entry's age at "now", in seconds. */
  age: number;
  /** Where the answer came from. */
  source: Source;
  /** The answer the client gets. */
  answer: Answer;
  /** The TTL in the reply, or null for SERVFAIL. */
  ttl: number | null;
  /** The AA bit in a resolver's reply: always clear. */
  aa: false;
}

/** The model's answer. */
export interface DnsTwoCachesResult {
  /** What the zone held before the change. */
  oldAnswer: Answer;
  /** What the zone holds after the change. */
  newAnswer: Answer;
  /** The authority's own answer at "now", or null when it does not answer. */
  authority: Answer | null;
  /** The two resolvers' replies, A then B. */
  resolvers: [ResolverReply, ResolverReply];
  /** True when the two resolvers give different answers. */
  disagree: boolean;
  /** True when at least one resolver's answer differs from the zone's current data (and the authority answers). */
  behind: boolean;
}

/** The stable codes an invalid input is refused with. */
export type DnsTwoCachesErrorCode = "bad-ttl" | "bad-now" | "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class DnsTwoCachesError extends Error {
  /** The stable code. */
  readonly code: DnsTwoCachesErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: DnsTwoCachesErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Compute the three answers a client would get at "now". */
export function compute(input: DnsTwoCachesInput): DnsTwoCachesResult {
  // The TTL: a whole number of seconds from 1 to 7 days.
  if (!Number.isInteger(input.ttl) || input.ttl < 1 || input.ttl > MAX_TTL) throw new DnsTwoCachesError("bad-ttl", `ttl must be an integer from 1 to ${MAX_TTL}`);
  // "Now": a whole number of seconds, no earlier than resolver B's fill.
  if (!Number.isInteger(input.now) || input.now < FILLED_B || input.now > MAX_NOW) throw new DnsTwoCachesError("bad-now", `now must be an integer from ${FILLED_B} to ${MAX_NOW}`);
  // The selects can only send these values.
  if (!CHANGES.includes(input.change) || typeof input.authorityUp !== "boolean" || typeof input.serveStale !== "boolean") throw new DnsTwoCachesError("bad-choice", "unknown change, authority or serve-stale value");

  // Before the change: an address, or no such name when the change creates it.
  const oldAnswer: Answer = input.change === "create" ? "NXDOMAIN" : OLD_ADDRESS;
  // After the change: the new address, or no such name when the change removes it.
  const newAnswer: Answer = input.change === "remove" ? "NXDOMAIN" : NEW_ADDRESS;
  // What the zone holds at "now".
  const current: Answer = input.now >= CHANGE_AT ? newAnswer : oldAnswer;
  // The authority answers with its current data, or not at all.
  const authority = input.authorityUp ? current : null;

  /** One resolver's reply, from its fill time. */
  const reply = (name: "A" | "B", filledAt: number): ResolverReply => {
    // Seconds since it cached the name (both fills come before the change, so it cached the old answer).
    const age = input.now - filledAt;
    // Younger than its TTL: a cache hit, with the TTL counted down.
    if (age < input.ttl) return { name, filledAt, age, source: "cache", answer: oldAnswer, ttl: input.ttl - age, aa: false };
    // Expired, and the authority answers: fetched again, with the full TTL.
    if (input.authorityUp) return { name, filledAt, age, source: "fetched", answer: current, ttl: input.ttl, aa: false };
    // Expired, no authority, serve-stale on: the old answer again, with the stale TTL.
    if (input.serveStale) return { name, filledAt, age, source: "stale", answer: oldAnswer, ttl: STALE_TTL, aa: false };
    // Expired, no authority, no serve-stale: a resolution failure.
    return { name, filledAt, age, source: "failed", answer: "SERVFAIL", ttl: null, aa: false };
  };

  // Resolver A, cached at 0 s.
  const a = reply("A", FILLED_A);
  // Resolver B, cached at 20 s.
  const b = reply("B", FILLED_B);
  // The full answer.
  return {
    // Before.
    oldAnswer,
    // After.
    newAnswer,
    // The zone's own server.
    authority,
    // The two resolvers.
    resolvers: [a, b],
    // Whether the client's answer depends on which resolver it asked.
    disagree: a.answer !== b.answer,
    // Whether a resolver lags the zone (only meaningful when the zone answers).
    behind: authority !== null && (a.answer !== authority || b.answer !== authority),
  };
}

/** The opening state: TTL 60 s, asked at 70 s; A has fetched the new address, B still holds the old one. */
export const DEFAULT_INPUT: DnsTwoCachesInput = { ttl: 60, now: 70, change: "change", authorityUp: true, serveStale: false };
/** The Example: the same moment with the authority down; A fails, B still answers from its cache. */
export const EXAMPLE_INPUT: DnsTwoCachesInput = { ttl: 60, now: 70, change: "change", authorityUp: false, serveStale: false };
