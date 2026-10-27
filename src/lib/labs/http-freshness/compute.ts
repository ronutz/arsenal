// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/http-freshness/compute.ts
// ----------------------------------------------------------------------------
// THE HTTP FRESHNESS LAB'S MODEL (2026-10-26), the interactive companion of the
// article "HTTP caching and personalised content". One stored response: a 200
// to a GET, with no Authorization on the request. The reader sets its
// Cache-Control field value as typed, its Date, Age, Expires and Last-Modified
// (as seconds on one timeline whose zero is the moment the cache received the
// response), the kind of cache (shared or private), the heuristic the cache
// chooses when nothing explicit is present, and how long ago the response was
// received. The model answers, step by step, with the rule that decided:
//
//   1. May the cache store it? (RFC 9111 section 3) Not with no-store; not in
//      a shared cache with private. A 200 is heuristically cacheable (RFC 9110
//      section 15.1), so section 3's last condition always holds here and
//      public changes nothing (RFC 9111 section 5.2.2.9).
//   2. Its freshness lifetime (section 4.2.1, first match): s-maxage if the
//      cache is shared, then max-age, then Expires minus Date; a private cache
//      ignores s-maxage (5.2.2.10); max-age makes every cache ignore Expires and
//      s-maxage makes a shared cache ignore it (5.3). Only with no explicit
//      expiration may the cache use a heuristic (4.2.2); the specification
//      names 10% of the interval since Last-Modified only as "a typical
//      setting", so the heuristic is the cache's choice, which the reader
//      makes, and the model computes it as no more than 10% of Date minus
//      Last-Modified (rounded down, so never more).
//   3. Its current age (section 4.2.3): apparent_age = max(0, response_time -
//      date_value); corrected_age_value = age_value + response_delay (the lab
//      takes the response delay as zero); corrected_initial_age = the larger of
//      the two (the RFC's conservative form); current_age = that plus the
//      resident time.
//   4. Fresh when freshness_lifetime > current_age (section 4.2).
//   5. Whether it may be reused without contacting the origin (sections 4 and
//      4.2.4): not with no-cache, fresh or not (5.2.2.4); yes when fresh, with
//      an Age equal to its current age (section 4); when stale, only if the
//      cache is disconnected, and never then if must-revalidate (an error,
//      SHOULD be 504, 5.2.2.2), or, in a shared cache, proxy-revalidate or
//      s-maxage (5.2.2.8, 5.2.2.10). Validation sends Last-Modified as
//      If-Modified-Since when there is one (4.3.1).
//
// Parsing the Cache-Control value follows section 5.2: a comma-separated list
// of token [ "=" ( token / quoted-string ) ], names compared case-insensitively,
// unrecognised directives ignored (5.2.3), and a delta-seconds value too large
// to represent taken as 2147483648 (1.2.2). The model REFUSES, with a stable
// code, what the RFC leaves to the cache: a directive given twice (section
// 4.2.1 lets the cache use the first or treat the response as stale), an
// invalid max-age or s-maxage (4.2.1 encourages treating it as stale), an
// argument on a directive that takes none (5.2: "nor allowed"), and the
// qualified forms of no-cache and private, which the lab does not model.
//
// Left out, as the lab's scope note says: request directives, Vary and the
// cache key, Authorization, status codes other than 200, the response delay,
// ETag, must-understand, and extensions such as stale-while-revalidate.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The kind of cache holding the response (RFC 9111 section 1). */
export type CacheKind = "shared" | "private";
/** Every value the cache control can take. */
export const CACHE_KINDS: readonly CacheKind[] = ["shared", "private"];
/** The cache's own heuristic for a response with no explicit expiration: none, or 10% of the time since Last-Modified. */
export type Heuristic = "none" | "ten-percent";
/** Every value the heuristic control can take. */
export const HEURISTICS: readonly Heuristic[] = ["none", "ten-percent"];

/** The largest delta-seconds value the lab handles, and the value an overflow is taken as (RFC 9111 section 1.2.2). */
export const MAX_SECONDS = 2147483648;
/** The longest Cache-Control value the lab parses, in characters. */
export const MAX_CC_LENGTH = 256;

/** The reader's settings. */
export interface HttpFreshnessInput {
  /** Shared (a CDN, a reverse proxy) or private (a browser's own). */
  cache: CacheKind;
  /** The Cache-Control field value as typed; empty means the response has none. */
  cacheControl: string;
  /** Seconds the Date header lies before the moment of receipt (response_time - date_value); may be negative. */
  dateLag: number;
  /** The Age header in seconds, or null when the response has none. */
  age: number | null;
  /** Expires minus Date in seconds (negative: before Date), or null when there is no Expires. */
  expires: number | null;
  /** Date minus Last-Modified in seconds, or null when there is no Last-Modified. */
  lastModified: number | null;
  /** The heuristic this cache uses when nothing explicit is present. */
  heuristic: Heuristic;
  /** Seconds since the cache received the response (the resident time). */
  received: number;
}

/** One directive as parsed: its lower-cased name, its argument (unquoted) or null, and whether the lab recognises it. */
export interface Directive {
  /** The name, lower-cased. */
  name: string;
  /** The argument, without quotes, or null when there is none. */
  value: string | null;
  /** True for the eight response directives the model applies. */
  recognised: boolean;
}

/** Why the cache may or may not store the response. */
export type StoreRule = "no-store" | "private-shared" | "private-private" | "allowed";
/** Where the freshness lifetime came from. */
export type LifetimeSource = "s-maxage" | "max-age" | "expires" | "heuristic" | "none";
/** What the cache does with a request when the origin answers. */
export type Online = "not-stored" | "serve" | "validate-no-cache" | "validate-stale";
/** What the cache does with a request when it is disconnected from the origin. */
export type Offline = "not-stored" | "serve" | "cannot-no-cache" | "error-must-revalidate" | "cannot-shared-revalidate" | "serve-stale";

/** The model's answer, every step of it. */
export interface HttpFreshnessResult {
  /** The directives in the order they were written. */
  directives: Directive[];
  /** The names of the directives the cache ignores because it does not recognise them. */
  ignored: string[];
  /** True when the cache may store the response. */
  storable: boolean;
  /** The rule that decided storage. */
  storeRule: StoreRule;
  /** True when public is present and changes nothing (the 200 is storable anyway). */
  publicNoEffect: boolean;
  /** The freshness lifetime in seconds, or null when there is none. */
  lifetime: number | null;
  /** Which rule gave the lifetime. */
  lifetimeSource: LifetimeSource;
  /** True when s-maxage is present but this cache is private, which ignores it. */
  sMaxageIgnored: boolean;
  /** Which directive made the cache ignore Expires, or null when Expires is used or absent. */
  expiresIgnoredBy: "max-age" | "s-maxage" | null;
  /** True when the cache chose a heuristic but an explicit expiration exists, so the heuristic is not used. */
  heuristicBlocked: boolean;
  /** True when the cache chose the 10% heuristic, nothing explicit exists, and there is no Last-Modified to apply it to. */
  heuristicNoLastModified: boolean;
  /** True when a delta-seconds value was larger than 2147483648 and was taken as 2147483648. */
  clamped: boolean;
  /** max(0, response_time - date_value). */
  apparentAge: number;
  /** age_value + response_delay (zero here). */
  correctedAgeValue: number;
  /** The larger of the two. */
  correctedInitialAge: number;
  /** corrected_initial_age + resident_time. */
  currentAge: number;
  /** True when freshness_lifetime > current_age. */
  fresh: boolean;
  /** Seconds of freshness left when fresh, else null. */
  remaining: number | null;
  /** Seconds past the lifetime when stale with a lifetime, else null. */
  staleBy: number | null;
  /** The decision when the origin answers. */
  online: Online;
  /** The decision when the cache is disconnected. */
  offline: Offline;
  /** Which directive forbids a shared cache to serve it stale, when offline is cannot-shared-revalidate. */
  sharedRevalidateBy: "proxy-revalidate" | "s-maxage" | null;
  /** The precondition a validation request carries: If-Modified-Since from Last-Modified, or none. */
  validator: "if-modified-since" | "none";
}

/** The stable codes an invalid input is refused with. */
export type HttpFreshnessErrorCode =
  | "bad-choice"
  | "bad-date"
  | "bad-age"
  | "bad-expires"
  | "bad-last-modified"
  | "bad-received"
  | "cc-too-long"
  | "cc-syntax"
  | "cc-duplicate"
  | "cc-seconds"
  | "cc-argument"
  | "cc-qualified";

/** The error a refused input throws, with its stable code and the directive it concerns, if any. */
export class HttpFreshnessError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: HttpFreshnessErrorCode;
  /** The directive name the refusal is about, or an empty string. */
  readonly directive: string;
  /** Build the error from its code, a message for developers and the directive it concerns. */
  constructor(code: HttpFreshnessErrorCode, message: string, directive = "") {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
    // The directive, for the reader's message.
    this.directive = directive;
  }
}

/** The response directives the model applies (RFC 9111 section 5.2.2). */
const RECOGNISED = new Set(["max-age", "s-maxage", "no-cache", "no-store", "private", "public", "must-revalidate", "proxy-revalidate"]);
/** The recognised directives that take a delta-seconds argument. */
const TAKES_SECONDS = new Set(["max-age", "s-maxage"]);
/** The recognised directives whose argument is a field-name list (the qualified form, not modelled). */
const QUALIFIABLE = new Set(["no-cache", "private"]);
/** The characters a token may hold besides letters and digits (RFC 9110 section 5.6.2, tchar). */
const TCHAR_EXTRA = "!#$%&'*+-.^_`|~";

/** True when a character is a tchar. */
function isTchar(c: string): boolean {
  // Letters and digits, by code point, or one of the listed symbols.
  return /^[A-Za-z0-9]$/.test(c) || TCHAR_EXTRA.includes(c);
}

/** Parse a Cache-Control field value into directives; a linear scan, no backtracking. */
export function parseCacheControl(raw: string): Directive[] {
  // Too long to be a field value worth typing here.
  if (raw.length > MAX_CC_LENGTH) throw new HttpFreshnessError("cc-too-long", `Cache-Control longer than ${MAX_CC_LENGTH} characters`);
  // The parsed directives, in order.
  const out: Directive[] = [];
  // The cursor.
  let i = 0;
  // The length.
  const n = raw.length;
  // One list element per pass.
  while (i < n) {
    // Optional whitespace before an element.
    while (i < n && (raw[i] === " " || raw[i] === "\t")) i++;
    // The end, after trailing whitespace.
    if (i >= n) break;
    // An empty list element is allowed and skipped.
    if (raw[i] === ",") {
      // Past the comma.
      i++;
      // Next element.
      continue;
    }
    // The directive's name: one or more tchar.
    const start = i;
    // Read the token.
    while (i < n && isTchar(raw[i])) i++;
    // No token where one was expected.
    if (i === start) throw new HttpFreshnessError("cc-syntax", `unexpected character at ${i}`);
    // Names compare case-insensitively (RFC 9111 section 5.2).
    const name = raw.slice(start, i).toLowerCase();
    // No argument unless an "=" follows at once.
    let value: string | null = null;
    // An argument.
    if (i < n && raw[i] === "=") {
      // Past the "=".
      i++;
      // A quoted-string argument.
      if (i < n && raw[i] === '"') {
        // Past the opening quote.
        i++;
        // The unquoted content.
        let v = "";
        // Closed yet?
        let closed = false;
        // Until the closing quote.
        while (i < n) {
          // A backslash quotes the next character.
          if (raw[i] === "\\" && i + 1 < n) {
            // Keep the quoted character.
            v += raw[i + 1];
            // Past both.
            i += 2;
          } else if (raw[i] === '"') {
            // Past the closing quote.
            i++;
            // Done.
            closed = true;
            // Stop reading.
            break;
          } else {
            // An ordinary character.
            v += raw[i];
            // Next.
            i++;
          }
        }
        // An unterminated quoted-string.
        if (!closed) throw new HttpFreshnessError("cc-syntax", "unterminated quoted-string");
        // The argument.
        value = v;
      } else {
        // A token argument.
        const vs = i;
        // Read it.
        while (i < n && isTchar(raw[i])) i++;
        // An "=" with nothing after it.
        if (i === vs) throw new HttpFreshnessError("cc-syntax", `empty argument for ${name}`);
        // The argument.
        value = raw.slice(vs, i);
      }
    }
    // Optional whitespace after the element.
    while (i < n && (raw[i] === " " || raw[i] === "\t")) i++;
    // The element must end at a comma or the end.
    if (i < n && raw[i] !== ",") throw new HttpFreshnessError("cc-syntax", `unexpected character at ${i}`);
    // Keep it.
    out.push({ name, value, recognised: RECOGNISED.has(name) });
  }
  // Every element, in order.
  return out;
}

/** Read a delta-seconds argument; values beyond 2^31 are taken as 2^31 (section 1.2.2). */
function deltaSeconds(name: string, value: string | null): { seconds: number; clamped: boolean } {
  // Missing or not 1*DIGIT: invalid freshness information.
  if (value === null || !/^[0-9]+$/.test(value)) throw new HttpFreshnessError("cc-seconds", `${name} needs a whole number of seconds`, name);
  // Leading zeros carry no value.
  const digits = value.replace(/^0+(?=[0-9])/, "");
  // More than ten digits is certainly beyond 2^31.
  if (digits.length > 10) return { seconds: MAX_SECONDS, clamped: true };
  // The number.
  const v = Number(digits);
  // Beyond 2^31: taken as 2^31.
  return v > MAX_SECONDS ? { seconds: MAX_SECONDS, clamped: true } : { seconds: v, clamped: false };
}

/** True when a value is a whole number within [min, max]. */
function wholeIn(v: unknown, min: number, max: number): v is number {
  // A finite integer in range.
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

/** Decide storage, freshness and reuse for one stored response. */
export function compute(input: HttpFreshnessInput): HttpFreshnessResult {
  // The two selects must hold one of their values.
  if (!CACHE_KINDS.includes(input.cache) || !HEURISTICS.includes(input.heuristic)) throw new HttpFreshnessError("bad-choice", "unknown cache kind or heuristic");
  // Date may lie before or after receipt, within 2^31 seconds.
  if (!wholeIn(input.dateLag, -MAX_SECONDS, MAX_SECONDS)) throw new HttpFreshnessError("bad-date", "Date lag must be a whole number of seconds");
  // Age is delta-seconds when present.
  if (input.age !== null && !wholeIn(input.age, 0, MAX_SECONDS)) throw new HttpFreshnessError("bad-age", "Age must be a whole number of seconds");
  // Expires may lie before or after Date.
  if (input.expires !== null && !wholeIn(input.expires, -MAX_SECONDS, MAX_SECONDS)) throw new HttpFreshnessError("bad-expires", "Expires offset must be a whole number of seconds");
  // Last-Modified may not be later than Date (RFC 9110 section 8.8.2.1).
  if (input.lastModified !== null && !wholeIn(input.lastModified, 0, MAX_SECONDS)) throw new HttpFreshnessError("bad-last-modified", "Last-Modified must be zero or more seconds before Date");
  // The resident time is never negative.
  if (!wholeIn(input.received, 0, MAX_SECONDS)) throw new HttpFreshnessError("bad-received", "received must be a whole number of seconds");

  // The directives as written.
  const directives = parseCacheControl(input.cacheControl);
  // The recognised ones by name, refusing repeats.
  const seen = new Map<string, Directive>();
  // Each recognised directive once.
  for (const d of directives) {
    // Unrecognised directives are ignored, repeats included (section 5.2.3).
    if (!d.recognised) continue;
    // A repeat: the RFC lets the cache use the first or call the response stale, so the lab refuses.
    if (seen.has(d.name)) throw new HttpFreshnessError("cc-duplicate", `${d.name} appears more than once`, d.name);
    // Remember it.
    seen.set(d.name, d);
  }
  // Every clamped value is reported.
  let clamped = false;
  // The two delta-seconds directives, validated.
  const seconds: Record<string, number | null> = { "max-age": null, "s-maxage": null };
  // Each recognised directive's argument rules.
  for (const d of seen.values()) {
    // max-age and s-maxage need delta-seconds.
    if (TAKES_SECONDS.has(d.name)) {
      // Parse, clamping beyond 2^31.
      const r = deltaSeconds(d.name, d.value);
      // Keep it.
      seconds[d.name] = r.seconds;
      // Note a clamp.
      clamped = clamped || r.clamped;
    } else if (d.value !== null) {
      // A field-name list on no-cache or private is the qualified form, not modelled.
      if (QUALIFIABLE.has(d.name)) throw new HttpFreshnessError("cc-qualified", `${d.name} with a field-name list`, d.name);
      // Any other argument is not allowed (section 5.2).
      throw new HttpFreshnessError("cc-argument", `${d.name} takes no argument`, d.name);
    }
  }
  // The flags.
  const has = (name: string): boolean => seen.has(name);
  // Shared or private.
  const shared = input.cache === "shared";
  // The names of the ignored directives, each once.
  const ignored = [...new Set(directives.filter((d) => !d.recognised).map((d) => d.name))];

  // Step 1: storage (section 3, with a GET, a 200 and no Authorization).
  const storeRule: StoreRule = has("no-store") ? "no-store" : shared && has("private") ? "private-shared" : !shared && has("private") ? "private-private" : "allowed";
  // Stored unless no-store, or private in a shared cache.
  const storable = storeRule === "allowed" || storeRule === "private-private";

  // Step 2: the freshness lifetime, first match (section 4.2.1).
  const sMaxage = seconds["s-maxage"];
  // max-age, when present.
  const maxAge = seconds["max-age"];
  // The lifetime and its source.
  let lifetime: number | null = null;
  // Where it came from.
  let lifetimeSource: LifetimeSource = "none";
  // s-maxage, in a shared cache only.
  if (shared && sMaxage !== null) {
    // The shared cache's own maximum age.
    lifetime = sMaxage;
    // Named.
    lifetimeSource = "s-maxage";
  } else if (maxAge !== null) {
    // max-age for every cache.
    lifetime = maxAge;
    // Named.
    lifetimeSource = "max-age";
  } else if (input.expires !== null) {
    // Expires minus Date.
    lifetime = input.expires;
    // Named.
    lifetimeSource = "expires";
  } else if (input.heuristic === "ten-percent" && input.lastModified !== null) {
    // No more than 10% of the interval since Last-Modified, rounded down.
    lifetime = Math.floor(input.lastModified / 10);
    // Named.
    lifetimeSource = "heuristic";
  }
  // An explicit expiration is any of s-maxage (shared), max-age or Expires.
  const explicit = (shared && sMaxage !== null) || maxAge !== null || input.expires !== null;
  // Expires present but overridden.
  const expiresIgnoredBy = input.expires === null ? null : maxAge !== null ? "max-age" : shared && sMaxage !== null ? "s-maxage" : null;

  // Step 3: the current age (section 4.2.3), with a zero response delay.
  const apparentAge = Math.max(0, input.dateLag);
  // Age plus the response delay.
  const correctedAgeValue = input.age ?? 0;
  // The conservative form.
  const correctedInitialAge = Math.max(apparentAge, correctedAgeValue);
  // Plus the time spent in this cache.
  const currentAge = correctedInitialAge + input.received;

  // Step 4: fresh while the lifetime exceeds the age (section 4.2).
  const fresh = lifetime !== null && lifetime > currentAge;

  // Step 5: reuse (sections 4 and 4.2.4).
  const noCache = has("no-cache");
  // A shared cache may not serve it stale with proxy-revalidate or s-maxage.
  const sharedRevalidateBy = shared ? (has("proxy-revalidate") ? "proxy-revalidate" : sMaxage !== null ? "s-maxage" : null) : null;
  // With the origin answering.
  const online: Online = !storable ? "not-stored" : noCache ? "validate-no-cache" : fresh ? "serve" : "validate-stale";
  // Disconnected.
  const offline: Offline = !storable
    ? "not-stored"
    : noCache
      ? "cannot-no-cache"
      : fresh
        ? "serve"
        : has("must-revalidate")
          ? "error-must-revalidate"
          : sharedRevalidateBy !== null
            ? "cannot-shared-revalidate"
            : "serve-stale";

  // Every step, for the result panel.
  return {
    directives,
    ignored,
    storable,
    storeRule,
    publicNoEffect: has("public"),
    lifetime,
    lifetimeSource,
    sMaxageIgnored: !shared && sMaxage !== null,
    expiresIgnoredBy,
    heuristicBlocked: input.heuristic === "ten-percent" && explicit,
    heuristicNoLastModified: input.heuristic === "ten-percent" && !explicit && input.lastModified === null,
    clamped,
    apparentAge,
    correctedAgeValue,
    correctedInitialAge,
    currentAge,
    fresh,
    remaining: fresh && lifetime !== null ? lifetime - currentAge : null,
    staleBy: !fresh && lifetime !== null ? currentAge - lifetime : null,
    online,
    offline,
    sharedRevalidateBy: offline === "cannot-shared-revalidate" ? sharedRevalidateBy : null,
    validator: input.lastModified !== null ? "if-modified-since" : "none",
  };
}

/** The opening state: a CDN holding a five-minute response that came through another cache, a minute after it arrived; fresh. */
export const DEFAULT_INPUT: HttpFreshnessInput = { cache: "shared", cacheControl: "public, max-age=300", dateLag: 2, age: 30, expires: null, lastModified: 86400, heuristic: "none", received: 60 };

/** The Example: s-maxage overrules max-age (and Expires) in a shared cache only, and brings revalidation with it. */
export const EXAMPLE_INPUT: HttpFreshnessInput = { cache: "shared", cacheControl: "max-age=600, s-maxage=60", dateLag: 0, age: null, expires: 3600, lastModified: 86400, heuristic: "none", received: 120 };
