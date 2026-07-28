// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/nginx-proxy-cache-decision/compute.ts
// ----------------------------------------------------------------------------
// THE NGINX proxy_cache DECISION ENGINE.
//
// Answers the two questions people actually have, which are different
// questions and get confused with each other constantly:
//
//   1. Will THIS RESPONSE be STORED in the cache?
//   2. Will a LATER REQUEST be SERVED from it?
//
// A response can be perfectly cacheable and still never served, because the
// cache key differs. A response can be served from cache when it should not
// be, because the key ignores something that mattered - which is the failure
// that leaks one user's page to another, and the reason this tool exists.
//
// THE STORE RULES, in the order NGINX applies them:
//   * caching is OFF unless proxy_cache names a zone - the single most common
//     "why is nothing cached";
//   * only the methods in proxy_cache_methods are cached, and the default is
//     GET and HEAD only, so a POST is never cached by default;
//   * a response carrying Set-Cookie is NOT stored - NGINX assumes it is
//     user-specific. This is a safety default and turning it off with
//     proxy_ignore_headers is how people create the leak;
//   * upstream Cache-Control of no-cache, no-store or private, and Expires in
//     the past, prevent storage - unless those headers are ignored;
//   * a status with no proxy_cache_valid entry and no upstream freshness
//     header is not stored, because NGINX has no lifetime for it;
//   * proxy_no_cache with a non-empty, non-zero value prevents storage.
//
// THE SERVE RULES:
//   * the cache key decides which stored entry a request looks for. The
//     default is $scheme$proxy_host$request_uri, and $request_uri INCLUDES
//     the query string;
//   * proxy_cache_bypass with a non-empty, non-zero value fetches from
//     upstream and still stores the result - it bypasses the LOOKUP, not the
//     STORE, which is the distinction from proxy_no_cache;
//   * a request whose key matches a stored entry is served from it, whether
//     or not that request carries a Cookie - NGINX does not exclude cookied
//     REQUESTS by default, only cookied RESPONSES.
//
// That last pair is the dangerous asymmetry, and it is stated plainly rather
// than left for someone to discover in production.
//
// LIMITS: no proxy_cache_use_stale, no proxy_cache_lock, no revalidation, no
// Vary handling, no min_uses accounting. This answers store-and-serve for one
// exchange, not the whole cache lifecycle.
// ============================================================================

export interface CacheInput {
  /** Directives as configured. */
  cacheZone: string | null;
  cacheKey: string;
  cacheMethods: string[];
  cacheValid: { status: string; time: string }[];
  ignoreHeaders: string[];
  noCacheValue: string | null;
  bypassValue: string | null;
  /** The request under test. */
  method: string;
  uri: string;
  requestHeaders: Record<string, string>;
  /** The upstream response. */
  status: number;
  responseHeaders: Record<string, string>;
}

export interface CacheDecision {
  /** Will this response be written to the cache? */
  stored: boolean;
  /** Will a later identical request be served from the cache? */
  servedFromCache: boolean;
  /** The computed key a lookup would use. */
  computedKey: string;
  /** Ordered reasoning, the teaching. */
  storeSteps: { rule: string; passed: boolean; detail: string }[];
  serveSteps: { rule: string; passed: boolean; detail: string }[];
  /** Risks worth naming regardless of the outcome. */
  warnings: string[];
  input: CacheInput;
}

export class CacheParseError extends Error {
  constructor(message: string, public readonly line: number) {
    super(message);
    this.name = "CacheParseError";
  }
}

const DEFAULT_KEY = "$scheme$proxy_host$request_uri";
const DEFAULT_METHODS = ["GET", "HEAD"];

/**
 * Grammar, one per line; blanks and # comments ignored:
 *   proxy_cache <zone>;              proxy_cache_key <key>;
 *   proxy_cache_methods GET HEAD;    proxy_cache_valid <status> <time>;
 *   proxy_ignore_headers <h> ...;    proxy_no_cache <value>;
 *   proxy_cache_bypass <value>;
 *   request <METHOD> <uri>           request_header <Name>: <value>
 *   response <status>                response_header <Name>: <value>
 */
export function parseCacheCase(input: string): CacheInput {
  const out: CacheInput = {
    cacheZone: null,
    cacheKey: DEFAULT_KEY,
    cacheMethods: [...DEFAULT_METHODS],
    cacheValid: [],
    ignoreHeaders: [],
    noCacheValue: null,
    bypassValue: null,
    method: "GET",
    uri: "/",
    requestHeaders: {},
    status: 200,
    responseHeaders: {},
  };
  let sawRequest = false;
  let sawResponse = false;

  const lines = input.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const n = i + 1;
    const raw = lines[i].split("#")[0].trim().replace(/;$/, "");
    if (!raw) continue;
    const [head, ...rest] = raw.split(/\s+/);
    const value = rest.join(" ");

    switch (head) {
      case "proxy_cache":
        out.cacheZone = value || null;
        break;
      case "proxy_cache_key":
        if (!value) throw new CacheParseError(`proxy_cache_key needs a value`, n);
        out.cacheKey = value;
        break;
      case "proxy_cache_methods":
        out.cacheMethods = rest.map((m) => m.toUpperCase());
        break;
      case "proxy_cache_valid": {
        if (rest.length < 2) throw new CacheParseError(`proxy_cache_valid needs a status and a time`, n);
        const time = rest[rest.length - 1];
        const statuses = rest.slice(0, -1);
        for (const s of statuses) out.cacheValid.push({ status: s, time });
        break;
      }
      case "proxy_ignore_headers":
        out.ignoreHeaders.push(...rest.map((h) => h.toLowerCase()));
        break;
      case "proxy_no_cache":
        out.noCacheValue = value;
        break;
      case "proxy_cache_bypass":
        out.bypassValue = value;
        break;
      case "request": {
        const m = /^([A-Z]+)\s+(\/\S*)$/.exec(value);
        if (!m) throw new CacheParseError(`expected: request <METHOD> </uri>`, n);
        out.method = m[1];
        out.uri = m[2];
        sawRequest = true;
        break;
      }
      case "request_header":
      case "response_header": {
        const m = /^([^:]+):\s*(.*)$/.exec(value);
        if (!m) throw new CacheParseError(`expected: ${head} <Name>: <value>`, n);
        const target = head === "request_header" ? out.requestHeaders : out.responseHeaders;
        target[m[1].trim().toLowerCase()] = m[2].trim();
        break;
      }
      case "response": {
        const code = Number(value);
        if (!Number.isInteger(code)) throw new CacheParseError(`response needs a status code`, n);
        out.status = code;
        sawResponse = true;
        break;
      }
      default:
        throw new CacheParseError(`unknown directive "${head}"`, n);
    }
  }
  if (!sawRequest) throw new CacheParseError(`no "request <METHOD> </uri>" line`, 1);
  if (!sawResponse) throw new CacheParseError(`no "response <status>" line`, 1);
  return out;
}

/** A directive value counts as "set" when it is non-empty and not "0". */
const isActive = (v: string | null): boolean => v !== null && v !== "" && v !== "0";

/** Render the cache key with the values we know. */
function renderKey(c: CacheInput): string {
  return c.cacheKey
    .replace(/\$scheme/g, "http")
    .replace(/\$proxy_host/g, "backend")
    .replace(/\$request_uri/g, c.uri)
    .replace(/\$uri/g, c.uri.split("?")[0])
    .replace(/\$args/g, c.uri.includes("?") ? c.uri.split("?")[1] : "")
    .replace(/\$host/g, c.requestHeaders["host"] ?? "backend")
    .replace(/\$http_([a-z_]+)/g, (_m, h) => c.requestHeaders[h.replace(/_/g, "-")] ?? "")
    .replace(/\$cookie_([a-z_]+)/g, (_m, name) => {
      const cookie = c.requestHeaders["cookie"] ?? "";
      const found = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`).exec(cookie);
      return found ? found[1] : "";
    });
}

export function decideCache(input: string): CacheDecision {
  const c = parseCacheCase(input);
  const storeSteps: CacheDecision["storeSteps"] = [];
  const serveSteps: CacheDecision["serveSteps"] = [];
  const warnings: string[] = [];
  const ignored = (h: string) => c.ignoreHeaders.includes(h.toLowerCase());

  // ---- STORE ----
  let stored = true;
  const store = (rule: string, passed: boolean, detail: string) => {
    storeSteps.push({ rule, passed, detail });
    if (!passed) stored = false;
  };

  store(
    "proxy_cache names a zone",
    c.cacheZone !== null,
    c.cacheZone !== null
      ? `Caching is on, using zone "${c.cacheZone}".`
      : `No proxy_cache directive, so caching is OFF entirely. Every other directive here is inert until this is set - this is the most common reason nothing is ever cached.`,
  );
  if (!stored) {
    return finish();
  }

  store(
    "the method is cacheable",
    c.cacheMethods.includes(c.method),
    c.cacheMethods.includes(c.method)
      ? `${c.method} is in proxy_cache_methods (${c.cacheMethods.join(", ")}).`
      : `${c.method} is not in proxy_cache_methods (${c.cacheMethods.join(", ")}). The default is GET and HEAD only, so a ${c.method} is never cached unless you add it deliberately.`,
  );

  const setCookie = "set-cookie" in c.responseHeaders;
  store(
    "the response carries no Set-Cookie",
    !setCookie || ignored("set-cookie"),
    setCookie
      ? ignored("set-cookie")
        ? `The response sets a cookie, but Set-Cookie is in proxy_ignore_headers, so NGINX stores it anyway. This is the setting that turns a per-user response into a shared one.`
        : `The response carries Set-Cookie, so NGINX will NOT store it. This default assumes the response is user-specific, and it is the reason a login page or a personalised page is never cached by accident.`
      : `No Set-Cookie in the response.`,
  );

  const cc = (c.responseHeaders["cache-control"] ?? "").toLowerCase();
  const ccBlocks = /no-cache|no-store|private/.test(cc);
  store(
    "upstream Cache-Control permits storage",
    !ccBlocks || ignored("cache-control"),
    ccBlocks
      ? ignored("cache-control")
        ? `Upstream says "${cc}", but Cache-Control is in proxy_ignore_headers, so NGINX overrides the origin's instruction and stores it.`
        : `Upstream sent Cache-Control: ${cc}, which prevents storage. The origin is telling you not to cache this.`
      : cc
        ? `Upstream Cache-Control is "${cc}", which does not prevent storage.`
        : `No Cache-Control from upstream.`,
  );

  const validEntry = c.cacheValid.find(
    (v) => v.status === String(c.status) || v.status === "any",
  );
  const hasFreshness = Boolean(c.responseHeaders["expires"] || /max-age=\d+/.test(cc));
  store(
    "a lifetime is known for this status",
    Boolean(validEntry) || hasFreshness,
    validEntry
      ? `proxy_cache_valid gives ${c.status} a lifetime of ${validEntry.time}.`
      : hasFreshness
        ? `No proxy_cache_valid for ${c.status}, but the response carries its own freshness header, which supplies the lifetime.`
        : `Nothing gives ${c.status} a lifetime: no matching proxy_cache_valid and no freshness header from upstream. Without a lifetime NGINX has nothing to store it under.`,
  );

  store(
    "proxy_no_cache does not apply",
    !isActive(c.noCacheValue),
    isActive(c.noCacheValue)
      ? `proxy_no_cache is "${c.noCacheValue}", which is non-empty and non-zero, so this response is not stored.`
      : `proxy_no_cache is unset or evaluates to zero.`,
  );

  return finish();

  function finish(): CacheDecision {
    const computedKey = renderKey(c);

    // ---- SERVE ----
    let served = true;
    const serve = (rule: string, passed: boolean, detail: string) => {
      serveSteps.push({ rule, passed, detail });
      if (!passed) served = false;
    };

    if (c.cacheZone === null) {
      serve("caching is on", false, `With no proxy_cache zone there is nothing to serve from.`);
    } else {
      serve(
        "proxy_cache_bypass does not apply",
        !isActive(c.bypassValue),
        isActive(c.bypassValue)
          ? `proxy_cache_bypass is "${c.bypassValue}", so this request skips the cache LOOKUP and goes upstream. Note it still STORES the result - that is the difference from proxy_no_cache, which prevents storing.`
          : `proxy_cache_bypass is unset or zero, so a lookup happens.`,
      );
      serve(
        "an entry exists under this key",
        stored,
        stored
          ? `A later request producing the key "${computedKey}" finds this entry.`
          : `This response was not stored, so there is nothing under "${computedKey}" to find.`,
      );
      serve(
        "the method can be served",
        c.cacheMethods.includes(c.method),
        c.cacheMethods.includes(c.method)
          ? `${c.method} is served from cache when an entry matches.`
          : `${c.method} is not a cached method, so it always goes upstream.`,
      );
    }

    // ---- WARNINGS: the asymmetries worth naming ----
    const keyHasQuery = /\$request_uri|\$args/.test(c.cacheKey);
    if (!keyHasQuery && c.uri.includes("?")) {
      warnings.push(
        `The cache key does not include the query string, but this request has one. Two requests differing only in their query would share a cache entry, so one would be served the other's response.`,
      );
    }
    if ("cookie" in c.requestHeaders && !/\$cookie_|\$http_cookie/.test(c.cacheKey)) {
      warnings.push(
        `The REQUEST carries a Cookie and the cache key ignores it. NGINX excludes cookied RESPONSES from storage by default, but it does NOT exclude cookied REQUESTS from being served a shared entry - so a logged-in user can receive another user's cached page. If responses vary per user, the key must vary too.`,
      );
    }
    if (ignored("set-cookie") && !/\$cookie_|\$http_cookie/.test(c.cacheKey)) {
      warnings.push(
        `Set-Cookie is being ignored while the cache key does not vary by cookie. That combination stores a per-user response under a key every user shares, which is the classic cache-poisoning-by-configuration mistake.`,
      );
    }
    if (c.cacheKey === DEFAULT_KEY) {
      warnings.push(
        `Using the default key ${DEFAULT_KEY}. $request_uri includes the query string, so query variations are distinct entries - which is safe, and also means a cache-busting parameter defeats the cache entirely.`,
      );
    }

    return { stored, servedFromCache: stored && served, computedKey, storeSteps, serveSteps, warnings, input: c };
  }
}
