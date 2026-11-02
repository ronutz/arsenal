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
//
// PAGE LANGUAGE (02/11/2026): every rule label and detail, warning and parse
// error is built as an EngineText (src/lib/tools/engine-text.ts): a stable id,
// the English as before, and its values. decideCacheLocalisable() returns them
// as such for the page (pack keys tools.nginx-proxy-cache-decision.engine.<id>);
// decideCache() returns plainText() of the same reading, and parseCacheCase()
// throws the same errors (class, message and line) carrying their sentences, so
// the API, the share spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

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

/** S is string in the API's reading and EngineText in the page's (decideCacheLocalisable). */
export interface CacheDecision<S = string> {
  /** Will this response be written to the cache? */
  stored: boolean;
  /** Will a later identical request be served from the cache? */
  servedFromCache: boolean;
  /** The computed key a lookup would use. */
  computedKey: string;
  /** Ordered reasoning, the teaching. */
  storeSteps: { rule: S; passed: boolean; detail: S }[]; // the storage walk
  serveSteps: { rule: S; passed: boolean; detail: S }[]; // the serving walk
  /** Risks worth naming regardless of the outcome. */
  warnings: S[]; // each a sentence
  input: CacheInput;
}

export class CacheParseError extends Error {
  constructor(message: string, public readonly line: number) {
    super(message);
    this.name = "CacheParseError";
  }
}

/**
 * A parse error that carries its sentence, so the page can show it in its own language.
 * @param m the sentence
 * @param line the line it concerns
 * @returns the error to throw (class, message and line as before)
 */
function parseError(m: EngineText, line: number): CacheParseError {
  return withEngineText(new CacheParseError(m.text, line), m); // the same error, plus the sentence
} // parseError

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
        if (!value) throw parseError(say("err.keyValue", `proxy_cache_key needs a value`), n); // no value
        out.cacheKey = value;
        break;
      case "proxy_cache_methods":
        out.cacheMethods = rest.map((m) => m.toUpperCase());
        break;
      case "proxy_cache_valid": {
        if (rest.length < 2) throw parseError(say("err.validArgs", `proxy_cache_valid needs a status and a time`), n); // too few values
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
        if (!m) throw parseError(say("err.request", `expected: request <METHOD> </uri>`), n); // a bad request line
        out.method = m[1];
        out.uri = m[2];
        sawRequest = true;
        break;
      }
      case "request_header":
      case "response_header": {
        const m = /^([^:]+):\s*(.*)$/.exec(value);
        if (!m) throw parseError(say("err.header", `expected: ${head} <Name>: <value>`, { head }), n); // a bad header line
        const target = head === "request_header" ? out.requestHeaders : out.responseHeaders;
        target[m[1].trim().toLowerCase()] = m[2].trim();
        break;
      }
      case "response": {
        const code = Number(value);
        if (!Number.isInteger(code)) throw parseError(say("err.response", `response needs a status code`), n); // no status code
        out.status = code;
        sawResponse = true;
        break;
      }
      default:
        throw parseError(say("err.unknown", `unknown directive "${head}"`, { head }), n); // an unknown directive
    }
  }
  if (!sawRequest) throw parseError(say("err.noRequest", `no "request <METHOD> </uri>" line`), 1); // no request line
  if (!sawResponse) throw parseError(say("err.noResponse", `no "response <status>" line`), 1); // no response line
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

// ---- STORE ----
export function decideCache(input: string): CacheDecision {
  return plainText(decideCacheLocalisable(input)); // the same reading, as English (the API's, the share spec's, the vectors')
} // decideCache

/** The page's reading: the same as decideCache(), with every sentence an EngineText (id, English, values). */
export function decideCacheLocalisable(input: string): CacheDecision<EngineText> {
  const c = parseCacheCase(input);
  const storeSteps: CacheDecision<EngineText>["storeSteps"] = []; // the storage walk, sentences with ids
  const serveSteps: CacheDecision<EngineText>["serveSteps"] = []; // the serving walk, sentences with ids
  const warnings: EngineText[] = []; // each warning with its id
  const ignored = (h: string) => c.ignoreHeaders.includes(h.toLowerCase());
  let stored = true;
  const store = (rule: EngineText, passed: boolean, detail: EngineText) => {
    storeSteps.push({ rule, passed, detail });
    if (!passed) stored = false;
  };

  store(
    say("rule.zone", "proxy_cache names a zone"), // the rule
    c.cacheZone !== null,
    c.cacheZone !== null
      ? say("store.zone", `Caching is on, using zone "${c.cacheZone}".`, { zone: c.cacheZone }) // on
      : say("store.noZone", `No proxy_cache directive, so caching is OFF entirely. Every other directive here is inert until this is set - this is the most common reason nothing is ever cached.`), // off
  );
  if (!stored) {
    return finish();
  }

  const methods = c.cacheMethods.join(", "); // the cacheable methods
  store(
    say("rule.method", "the method is cacheable"), // the rule
    c.cacheMethods.includes(c.method),
    c.cacheMethods.includes(c.method)
      ? say("store.method", `${c.method} is in proxy_cache_methods (${methods}).`, { method: c.method, methods }) // cacheable
      : say("store.noMethod", `${c.method} is not in proxy_cache_methods (${methods}). The default is GET and HEAD only, so a ${c.method} is never cached unless you add it deliberately.`, { method: c.method, methods }), // not cacheable
  );

  const setCookie = "set-cookie" in c.responseHeaders;
  store(
    say("rule.cookie", "the response carries no Set-Cookie"), // the rule
    !setCookie || ignored("set-cookie"),
    setCookie
      ? ignored("set-cookie")
        ? say("store.cookieIgnored", `The response sets a cookie, but Set-Cookie is in proxy_ignore_headers, so NGINX stores it anyway. This is the setting that turns a per-user response into a shared one.`) // ignored
        : say("store.cookie", `The response carries Set-Cookie, so NGINX will NOT store it. This default assumes the response is user-specific, and it is the reason a login page or a personalised page is never cached by accident.`) // not stored
      : say("store.noCookie", `No Set-Cookie in the response.`), // no cookie
  );

  const cc = (c.responseHeaders["cache-control"] ?? "").toLowerCase();
  const ccBlocks = /no-cache|no-store|private/.test(cc);
  store(
    say("rule.cacheControl", "upstream Cache-Control permits storage"), // the rule
    !ccBlocks || ignored("cache-control"),
    ccBlocks
      ? ignored("cache-control")
        ? say("store.ccIgnored", `Upstream says "${cc}", but Cache-Control is in proxy_ignore_headers, so NGINX overrides the origin's instruction and stores it.`, { cc }) // overridden
        : say("store.ccBlocks", `Upstream sent Cache-Control: ${cc}, which prevents storage. The origin is telling you not to cache this.`, { cc }) // prevented
      : cc
        ? say("store.ccAllows", `Upstream Cache-Control is "${cc}", which does not prevent storage.`, { cc }) // allowed
        : say("store.noCc", `No Cache-Control from upstream.`), // none
  );

  const validEntry = c.cacheValid.find(
    (v) => v.status === String(c.status) || v.status === "any",
  );
  const hasFreshness = Boolean(c.responseHeaders["expires"] || /max-age=\d+/.test(cc));
  store(
    say("rule.lifetime", "a lifetime is known for this status"), // the rule
    Boolean(validEntry) || hasFreshness,
    validEntry
      ? say("store.valid", `proxy_cache_valid gives ${c.status} a lifetime of ${validEntry.time}.`, { status: String(c.status), time: validEntry.time }) // a lifetime
      : hasFreshness
        ? say("store.freshness", `No proxy_cache_valid for ${c.status}, but the response carries its own freshness header, which supplies the lifetime.`, { status: String(c.status) }) // the headers lifetime's lifetime
        : say("store.noLifetime", `Nothing gives ${c.status} a lifetime: no matching proxy_cache_valid and no freshness header from upstream. Without a lifetime NGINX has nothing to store it under.`, { status: String(c.status) }), // no lifetime
  );
  store(
    say("rule.noCache", "proxy_no_cache does not apply"), // the rule
    !isActive(c.noCacheValue),
    isActive(c.noCacheValue)
      ? say("store.noCache", `proxy_no_cache is "${c.noCacheValue}", which is non-empty and non-zero, so this response is not stored.`, { value: String(c.noCacheValue) }) // applies
      : say("store.noCacheUnset", `proxy_no_cache is unset or evaluates to zero.`), // does not apply
  );

  return finish();

  function finish(): CacheDecision<EngineText> {
    const computedKey = renderKey(c);

    // ---- SERVE ----
    let served = true;
    const serve = (rule: EngineText, passed: boolean, detail: EngineText) => {
      serveSteps.push({ rule, passed, detail });
      if (!passed) served = false;
    };

    if (c.cacheZone === null) {
      serve(say("rule.on", "caching is on"), false, say("serve.off", `With no proxy_cache zone there is nothing to serve from.`)); // caching off
    } else {
      serve(
        say("rule.bypass", "proxy_cache_bypass does not apply"), // the rule
        !isActive(c.bypassValue),
        isActive(c.bypassValue)
          ? say("serve.bypass", `proxy_cache_bypass is "${c.bypassValue}", so this request skips the cache LOOKUP and goes upstream. Note it still STORES the result - that is the difference from proxy_no_cache, which prevents storing.`, { value: String(c.bypassValue) }) // bypassed
          : say("serve.noBypass", `proxy_cache_bypass is unset or zero, so a lookup happens.`), // a lookup
      );
      serve(
        say("rule.entry", "an entry exists under this key"), // the rule
        stored,
        stored
          ? say("serve.entry", `A later request producing the key "${computedKey}" finds this entry.`, { computedKey }) // found later
          : say("serve.noEntry", `This response was not stored, so there is nothing under "${computedKey}" to find.`, { computedKey }), // nothing to find
      );
      serve(
        say("rule.serveMethod", "the method can be served"), // the rule
        c.cacheMethods.includes(c.method),
        c.cacheMethods.includes(c.method)
          ? say("serve.method", `${c.method} is served from cache when an entry matches.`, { method: c.method }) // served
          : say("serve.noMethod", `${c.method} is not a cached method, so it always goes upstream.`, { method: c.method }), // always upstream
      );
    }

    // ---- WARNINGS: the asymmetries worth naming ----
    const keyHasQuery = /\$request_uri|\$args/.test(c.cacheKey);
    if (!keyHasQuery && c.uri.includes("?")) {
      warnings.push(say("warn.query", // the key ignores the query
        `The cache key does not include the query string, but this request has one. Two requests differing only in their query would share a cache entry, so one would be served the other's response.`,
      ));
    }
    if ("cookie" in c.requestHeaders && !/\$cookie_|\$http_cookie/.test(c.cacheKey)) {
      warnings.push(say("warn.cookieRequest", // a cookied request
        `The REQUEST carries a Cookie and the cache key ignores it. NGINX excludes cookied RESPONSES from storage by default, but it does NOT exclude cookied REQUESTS from being served a shared entry - so a logged-in user can receive another user's cached page. If responses vary per user, the key must vary too.`,
      ));
    }
    if (ignored("set-cookie") && !/\$cookie_|\$http_cookie/.test(c.cacheKey)) {
      warnings.push(say("warn.poisoning", // ignored Set-Cookie and a shared key
        `Set-Cookie is being ignored while the cache key does not vary by cookie. That combination stores a per-user response under a key every user shares, which is the classic cache-poisoning-by-configuration mistake.`,
      ));
    }
    if (c.cacheKey === DEFAULT_KEY) {
      warnings.push(say("warn.defaultKey", // the default key
        `Using the default key ${DEFAULT_KEY}. $request_uri includes the query string, so query variations are distinct entries - which is safe, and also means a cache-busting parameter defeats the cache entirely.`, { key: DEFAULT_KEY },
      ));
    }

    return { stored, servedFromCache: stored && served, computedKey, storeSteps, serveSteps, warnings, input: c };
  }
}
