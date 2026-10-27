// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/http-freshness/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the HTTP freshness lab (set 2026-10-26a). Each case is
// worked by hand from RFC 9111 as read on 2026-10-26: storage (section 3), the
// first-match lifetime order (4.2.1: s-maxage for a shared cache, max-age,
// Expires minus Date, then a heuristic only when nothing explicit exists,
// 4.2.2), the age arithmetic (4.2.3, with the conservative corrected initial
// age and a zero response delay), fresh when lifetime > age (4.2), and reuse
// (4, 4.2.4, 5.2.2.2, 5.2.2.4, 5.2.2.8, 5.2.2.10). Arrays are compared as JSON.
// Reject vectors pin one stable code each. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { compute, HttpFreshnessError, type HttpFreshnessErrorCode, type HttpFreshnessInput, type HttpFreshnessResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "http-freshness/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: HttpFreshnessInput;
  /** The fields of the result that must match. */
  expect: Partial<HttpFreshnessResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings the model must refuse (cast where the interface could never send them). */
  input: HttpFreshnessInput;
  /** The code the refusal must carry. */
  code: HttpFreshnessErrorCode;
}

/** A base input every vector starts from: a private cache, no headers but Date, just received. */
const BASE: HttpFreshnessInput = { cache: "private", cacheControl: "", dateLag: 0, age: null, expires: null, lastModified: null, heuristic: "none", received: 0 };

/** The accept cases. */
export const HTTP_FRESHNESS_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: max-age 300; Age 30 beats an apparent age of 2; 30 + 60 = 90 < 300, fresh with 210 s left; public changes nothing.
  { id: "default-fresh", input: { cache: "shared", cacheControl: "public, max-age=300", dateLag: 2, age: 30, expires: null, lastModified: 86400, heuristic: "none", received: 60 }, expect: { storable: true, storeRule: "allowed", publicNoEffect: true, lifetime: 300, lifetimeSource: "max-age", apparentAge: 2, correctedAgeValue: 30, correctedInitialAge: 30, currentAge: 90, fresh: true, remaining: 210, online: "serve", offline: "serve", validator: "if-modified-since" } },
  // The Example in a shared cache: s-maxage 60 wins over max-age 600 and Expires; 120 s old, stale by 60; offline it may not be served stale (s-maxage carries proxy-revalidate).
  { id: "example-shared", input: { cache: "shared", cacheControl: "max-age=600, s-maxage=60", dateLag: 0, age: null, expires: 3600, lastModified: 86400, heuristic: "none", received: 120 }, expect: { lifetime: 60, lifetimeSource: "s-maxage", sMaxageIgnored: false, expiresIgnoredBy: "max-age", currentAge: 120, fresh: false, staleBy: 60, online: "validate-stale", offline: "cannot-shared-revalidate", sharedRevalidateBy: "s-maxage", validator: "if-modified-since" } },
  // The same response in a private cache: s-maxage ignored, max-age 600 applies, fresh with 480 s left.
  { id: "example-private", input: { cache: "private", cacheControl: "max-age=600, s-maxage=60", dateLag: 0, age: null, expires: 3600, lastModified: 86400, heuristic: "none", received: 120 }, expect: { lifetime: 600, lifetimeSource: "max-age", sMaxageIgnored: true, expiresIgnoredBy: "max-age", fresh: true, remaining: 480, online: "serve", offline: "serve", sharedRevalidateBy: null } },
  // no-cache: stored and fresh, yet every reuse is validated, and a disconnected cache cannot use it.
  { id: "no-cache-fresh", input: { ...BASE, cache: "shared", cacheControl: "no-cache, max-age=3600", received: 10 }, expect: { storable: true, lifetime: 3600, fresh: true, remaining: 3590, online: "validate-no-cache", offline: "cannot-no-cache", validator: "none" } },
  // no-store: nothing is stored, in any cache.
  { id: "no-store", input: { ...BASE, cacheControl: "no-store" }, expect: { storable: false, storeRule: "no-store", online: "not-stored", offline: "not-stored" } },
  // private in a shared cache: not stored.
  { id: "private-shared", input: { ...BASE, cache: "shared", cacheControl: "private, max-age=60" }, expect: { storable: false, storeRule: "private-shared", online: "not-stored" } },
  // private in a private cache: stored, 30 s into 60, fresh.
  { id: "private-private", input: { ...BASE, cacheControl: "private, max-age=60", received: 30 }, expect: { storable: true, storeRule: "private-private", lifetime: 60, fresh: true, remaining: 30, online: "serve" } },
  // must-revalidate, stale and disconnected: an error rather than the stale response.
  { id: "must-revalidate-offline", input: { ...BASE, cacheControl: "max-age=60, must-revalidate", received: 100 }, expect: { fresh: false, staleBy: 40, online: "validate-stale", offline: "error-must-revalidate" } },
  // must-revalidate does nothing while the response is fresh.
  { id: "must-revalidate-fresh", input: { ...BASE, cacheControl: "max-age=60, must-revalidate", received: 59 }, expect: { fresh: true, remaining: 1, online: "serve", offline: "serve" } },
  // Stale with no prohibition: validate when the origin answers, may serve stale when disconnected.
  { id: "stale-offline-allowed", input: { ...BASE, cacheControl: "max-age=60", received: 100 }, expect: { fresh: false, staleBy: 40, online: "validate-stale", offline: "serve-stale" } },
  // proxy-revalidate binds a shared cache when disconnected...
  { id: "proxy-revalidate-shared", input: { ...BASE, cache: "shared", cacheControl: "max-age=60, proxy-revalidate", received: 100 }, expect: { offline: "cannot-shared-revalidate", sharedRevalidateBy: "proxy-revalidate" } },
  // ...and not a private one.
  { id: "proxy-revalidate-private", input: { ...BASE, cacheControl: "max-age=60, proxy-revalidate", received: 100 }, expect: { offline: "serve-stale", sharedRevalidateBy: null } },
  // Expires minus Date gives the lifetime when no max-age is present.
  { id: "expires-lifetime", input: { ...BASE, expires: 600, received: 100 }, expect: { lifetime: 600, lifetimeSource: "expires", expiresIgnoredBy: null, fresh: true, remaining: 500 } },
  // An Expires before Date: already stale on arrival.
  { id: "expires-past", input: { ...BASE, expires: -60 }, expect: { lifetime: -60, lifetimeSource: "expires", currentAge: 0, fresh: false, staleBy: 60 } },
  // A shared cache with s-maxage ignores Expires even without max-age.
  { id: "expires-ignored-by-s-maxage", input: { ...BASE, cache: "shared", cacheControl: "s-maxage=30", expires: 600 }, expect: { lifetime: 30, lifetimeSource: "s-maxage", expiresIgnoredBy: "s-maxage" } },
  // The cache's 10% heuristic: a day since Last-Modified gives 8,640 s.
  { id: "heuristic-ten-percent", input: { ...BASE, lastModified: 86400, heuristic: "ten-percent", received: 1000 }, expect: { lifetime: 8640, lifetimeSource: "heuristic", heuristicBlocked: false, fresh: true, remaining: 7640 } },
  // The heuristic is rounded down, never above 10%.
  { id: "heuristic-floor", input: { ...BASE, lastModified: 99, heuristic: "ten-percent" }, expect: { lifetime: 9, lifetimeSource: "heuristic" } },
  // No heuristic chosen and nothing explicit: no lifetime, so the response needs validation.
  { id: "no-lifetime", input: { ...BASE, lastModified: 86400, heuristic: "none", received: 5 }, expect: { lifetime: null, lifetimeSource: "none", fresh: false, staleBy: null, online: "validate-stale", offline: "serve-stale" } },
  // An explicit max-age=0 forbids the heuristic and is stale at once.
  { id: "heuristic-blocked", input: { ...BASE, cacheControl: "max-age=0", lastModified: 86400, heuristic: "ten-percent" }, expect: { lifetime: 0, lifetimeSource: "max-age", heuristicBlocked: true, fresh: false, staleBy: 0 } },
  // The heuristic needs Last-Modified in this lab.
  { id: "heuristic-no-last-modified", input: { ...BASE, heuristic: "ten-percent" }, expect: { lifetime: null, heuristicNoLastModified: true } },
  // A private cache ignores s-maxage, so the response has no explicit expiration there and the heuristic applies.
  { id: "s-maxage-only-private", input: { ...BASE, cacheControl: "s-maxage=60", lastModified: 86400, heuristic: "ten-percent" }, expect: { sMaxageIgnored: true, heuristicBlocked: false, lifetime: 8640, lifetimeSource: "heuristic" } },
  // The apparent age wins when it is larger than Age.
  { id: "apparent-age-wins", input: { ...BASE, cacheControl: "max-age=100", dateLag: 50, age: 20, received: 10 }, expect: { apparentAge: 50, correctedAgeValue: 20, correctedInitialAge: 50, currentAge: 60, fresh: true, remaining: 40 } },
  // A Date ahead of the receiving clock gives an apparent age of zero, never negative.
  { id: "date-ahead", input: { ...BASE, cacheControl: "max-age=100", dateLag: -30, received: 10 }, expect: { apparentAge: 0, correctedInitialAge: 0, currentAge: 10 } },
  // A delta-seconds value beyond 2^31 is taken as 2147483648.
  { id: "clamp", input: { ...BASE, cacheControl: "max-age=99999999999" }, expect: { lifetime: 2147483648, clamped: true, fresh: true } },
  // The quoted form of max-age is accepted by a recipient.
  { id: "quoted-max-age", input: { ...BASE, cacheControl: 'max-age="60"' }, expect: { lifetime: 60, lifetimeSource: "max-age" } },
  // Directive names are case-insensitive.
  { id: "case-insensitive", input: { ...BASE, cacheControl: "Max-Age=60, NO-CACHE" }, expect: { lifetime: 60, online: "validate-no-cache" } },
  // Unrecognised directives are ignored and listed.
  { id: "ignored-extensions", input: { ...BASE, cacheControl: "max-age=60, stale-while-revalidate=30, immutable" }, expect: { ignored: ["stale-while-revalidate", "immutable"], lifetime: 60 } },
  // Empty list elements and surrounding whitespace are allowed.
  { id: "empty-elements", input: { ...BASE, cacheControl: " , max-age=10 ,," }, expect: { lifetime: 10, ignored: [] } },
]);

/** The reject cases. */
export const HTTP_FRESHNESS_REJECTS: readonly RejectVector[] = Object.freeze([
  // A cache kind the control cannot produce.
  { id: "bad-choice", input: { ...BASE, cache: "public" as unknown as "shared" }, code: "bad-choice" },
  // A fractional Date lag.
  { id: "bad-date", input: { ...BASE, dateLag: 1.5 }, code: "bad-date" },
  // A negative Age.
  { id: "bad-age", input: { ...BASE, age: -1 }, code: "bad-age" },
  // An Expires offset that is not a number.
  { id: "bad-expires", input: { ...BASE, expires: Number.NaN }, code: "bad-expires" },
  // A Last-Modified later than Date.
  { id: "bad-last-modified", input: { ...BASE, lastModified: -5 }, code: "bad-last-modified" },
  // A negative resident time.
  { id: "bad-received", input: { ...BASE, received: -1 }, code: "bad-received" },
  // A Cache-Control value over 256 characters.
  { id: "cc-too-long", input: { ...BASE, cacheControl: "a".repeat(257) }, code: "cc-too-long" },
  // Two tokens with no comma between them.
  { id: "cc-syntax", input: { ...BASE, cacheControl: "max-age 60" }, code: "cc-syntax" },
  // An unterminated quoted-string.
  { id: "cc-syntax-quote", input: { ...BASE, cacheControl: 'max-age="60' }, code: "cc-syntax" },
  // max-age given twice.
  { id: "cc-duplicate", input: { ...BASE, cacheControl: "max-age=60, max-age=120" }, code: "cc-duplicate" },
  // max-age that is not delta-seconds.
  { id: "cc-seconds", input: { ...BASE, cacheControl: "max-age=-1" }, code: "cc-seconds" },
  // max-age with no argument at all.
  { id: "cc-seconds-missing", input: { ...BASE, cacheControl: "s-maxage" }, code: "cc-seconds" },
  // An argument on a directive that takes none.
  { id: "cc-argument", input: { ...BASE, cacheControl: "no-store=1" }, code: "cc-argument" },
  // The qualified form of no-cache.
  { id: "cc-qualified", input: { ...BASE, cacheControl: 'no-cache="Set-Cookie"' }, code: "cc-qualified" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of HTTP_FRESHNESS_VECTORS) {
    // The model's answer, or the refusal it should not have made.
    let got: HttpFreshnessResult;
    // Run it.
    try {
      // Should not throw.
      got = compute(v.input);
    } catch (e) {
      // An accept case refused is a failure.
      failures.push(`${v.id}: refused (${e instanceof HttpFreshnessError ? e.code : String(e)})`);
      // Next case.
      continue;
    }
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field, as JSON so arrays compare by content.
      const have = JSON.stringify(got[k as keyof HttpFreshnessResult]);
      // A difference is a failure naming the case and the field.
      if (have !== JSON.stringify(want)) failures.push(`${v.id}: ${k} is ${have}, expected ${JSON.stringify(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of HTTP_FRESHNESS_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof HttpFreshnessError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = HTTP_FRESHNESS_VECTORS.length + HTTP_FRESHNESS_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
