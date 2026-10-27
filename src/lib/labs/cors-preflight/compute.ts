// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/cors-preflight/compute.ts
// ----------------------------------------------------------------------------
// THE CORS PREFLIGHT LAB'S MODEL (2026-10-26), the interactive companion of the
// article "CORS Explained: The Border Control of the Browser". A script on
// https://app.example calls fetch("https://api.example/orders", ...). The reader
// sets the request (method, Content-Type, one more request header, credentials
// mode) and the server's answers (Access-Control-Allow-Origin, -Credentials,
// -Methods, -Headers, -Max-Age, sent alike on the preflight response and on the
// actual response). The model says whether the browser sends a preflight and
// why, the preflight request it sends, whether the preflight and then the
// actual response pass, and what the script can read.
//
// Every rule is the WHATWG Fetch Standard, read from fetch.spec.whatwg.org on
// 2026-10-26 ("Last Updated 19 October 2026"); anchors in brackets:
//   - fetch() with a URL string uses mode "cors" and credentials mode
//     "same-origin" by default [#request-class]; "include" always sends
//     credentials [#concept-request-credentials-mode].
//   - CORS-safelisted methods are GET, HEAD and POST [#cors-safelisted-method].
//   - A request header is CORS-safelisted only if its value is at most 128
//     bytes and: Accept has no CORS-unsafe request-header byte; Accept-Language
//     and Content-Language use only 0-9 A-Z a-z, space and * , - . ; =;
//     Content-Type has no unsafe byte and its MIME type essence is
//     application/x-www-form-urlencoded, multipart/form-data or text/plain
//     (Range has its own rule, not offered here); any other name is not
//     safelisted [#cors-safelisted-request-header, #cors-unsafe-request-header-byte].
//   - The CORS-unsafe request-header names are the names of headers that are
//     not safelisted (all of them when the safelisted values add up to more
//     than 1024 bytes), lower-cased and sorted [#cors-unsafe-request-header-names].
//   - With an empty preflight cache, a preflight is sent when the method is
//     not safelisted or when any CORS-unsafe request-header name exists
//     [#http-fetch].
//   - The preflight is OPTIONS with Accept: */*, Access-Control-Request-Method
//     and, when there are unsafe names, Access-Control-Request-Headers (the
//     names joined by "," with no space) [#cors-preflight-fetch-0]; it never
//     carries credentials [#cors-protocol-and-credentials].
//   - The CORS check: no Access-Control-Allow-Origin fails; "*" passes when the
//     credentials mode is not "include"; otherwise the value must equal the
//     serialized origin, and with "include" Access-Control-Allow-Credentials
//     must be exactly `true` [#cors-check, #cors-protocol-and-credentials].
//   - A preflight passes when its response passes the CORS check (with the
//     request's credentials mode) with an ok status, the method is listed, is
//     safelisted or is covered by "*" (not with "include"), Authorization is
//     listed by name (a CORS non-wildcard request-header name, never covered by
//     "*"), and every other unsafe name is listed or covered by "*" (not with
//     "include"). Access-Control-Max-Age gives the seconds the result may be
//     cached, 5 when absent, capped by "an imposed limit" the standard leaves
//     to the browser [#cors-preflight-fetch-0, #cors-non-wildcard-request-header-name,
//     #http-responses, #cors-preflight-cache].
//   - A failed preflight is a network error and the actual request is never
//     sent; the actual response is then CORS-checked and a failure is a network
//     error too; fetch() rejects with a TypeError on a network error
//     [#http-fetch, #fetch-method].
//   - A response that passes is a CORS filtered response: the script reads the
//     status, the body and the CORS-safelisted response headers (Cache-Control,
//     Content-Language, Content-Length, Content-Type, Expires, Last-Modified,
//     Pragma) plus those Access-Control-Expose-Headers names
//     [#concept-filtered-response-cors, #cors-safelisted-response-header-name].
// What the model leaves out (the lab's scope note): the preflight cache across
// requests, the use-CORS-preflight flag (upload listeners, streamed bodies),
// the body and the Content-Type a browser adds for it, Range, redirects, a
// preflight answered with a non-ok status, Access-Control-Expose-Headers, the
// cookie rules that decide which cookies "include" sends, and any browser's
// own ceiling on Max-Age (no browser vendor document was read to source one).
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The page that runs the script, as its serialized origin (no trailing slash). */
export const PAGE_ORIGIN = "https://app.example";
/** The URL the script fetches. */
export const TARGET_URL = "https://api.example/orders";

/** The methods the lab offers. */
export type Method = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "PATCH";
/** Every method the method control can take. */
export const METHODS: readonly Method[] = ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH"];
/** The CORS-safelisted methods [#cors-safelisted-method]. */
export const SAFELISTED_METHODS: readonly Method[] = ["GET", "HEAD", "POST"];

/** The Content-Type the script sets, or none. */
export type ContentTypeChoice = "none" | "form" | "multipart" | "text" | "json";
/** Every value the Content-Type control can take. */
export const CONTENT_TYPES: readonly ContentTypeChoice[] = ["none", "form", "multipart", "text", "json"];
/** The header value each Content-Type choice sets. */
export const CONTENT_TYPE_VALUES: Readonly<Record<Exclude<ContentTypeChoice, "none">, string>> = {
  // A form's default encoding.
  form: "application/x-www-form-urlencoded",
  // A form with files.
  multipart: "multipart/form-data",
  // What a browser sends for a string body: a parameter does not change the essence.
  text: "text/plain;charset=UTF-8",
  // The value people assume is harmless.
  json: "application/json",
};

/** One more request header the script sets, or none. */
export type ExtraHeader = "none" | "accept-json" | "accept-long" | "content-language" | "authorization" | "x-requested-with";
/** Every value the extra-header control can take. */
export const EXTRA_HEADERS: readonly ExtraHeader[] = ["none", "accept-json", "accept-long", "content-language", "authorization", "x-requested-with"];
/** An Accept value longer than 128 bytes, made only of safe bytes (so its length alone decides). */
export const LONG_ACCEPT =
  "application/json, application/vnd.example.orders+json, application/vnd.example.invoices+json, application/vnd.example.customers+json, text/plain";
/** The [name, value] each extra-header choice sets. */
export const EXTRA_HEADER_VALUES: Readonly<Record<Exclude<ExtraHeader, "none">, readonly [string, string]>> = {
  // Asking for JSON: still safelisted.
  "accept-json": ["Accept", "application/json"],
  // The same name, but a value past the 128-byte limit.
  "accept-long": ["Accept", LONG_ACCEPT],
  // A safelisted name with a value in its allowed bytes.
  "content-language": ["Content-Language", "pt-BR"],
  // A token: never safelisted, and never covered by a wildcard.
  authorization: ["Authorization", "Bearer 4f9c2e"],
  // A custom header, as some libraries add.
  "x-requested-with": ["X-Requested-With", "XMLHttpRequest"],
};

/** The request's credentials mode as the lab offers it (fetch's default, or "include"). */
export type Credentials = "same-origin" | "include";
/** Every value the credentials control can take. */
export const CREDENTIALS: readonly Credentials[] = ["same-origin", "include"];

/** The server's Access-Control-Allow-Origin. */
export type AllowOrigin = "absent" | "star" | "exact" | "trailing-slash" | "other";
/** Every value the allow-origin control can take. */
export const ALLOW_ORIGINS: readonly AllowOrigin[] = ["absent", "star", "exact", "trailing-slash", "other"];
/** The header value of each allow-origin choice (absent has none). */
export const ALLOW_ORIGIN_VALUES: Readonly<Record<Exclude<AllowOrigin, "absent">, string>> = {
  // The wildcard.
  star: "*",
  // The caller's serialized origin, exactly.
  exact: PAGE_ORIGIN,
  // The same origin written with a trailing slash: not the serialized origin.
  "trailing-slash": `${PAGE_ORIGIN}/`,
  // Some other origin the server trusts.
  other: "https://admin.example",
};

/** The server's Access-Control-Allow-Credentials. */
export type AllowCredentials = "absent" | "true";
/** Every value the allow-credentials control can take. */
export const ALLOW_CREDENTIALS: readonly AllowCredentials[] = ["absent", "true"];

/** The server's Access-Control-Allow-Methods. */
export type AllowMethods = "absent" | "put-delete" | "star";
/** Every value the allow-methods control can take. */
export const ALLOW_METHODS: readonly AllowMethods[] = ["absent", "put-delete", "star"];
/** The header value of each allow-methods choice. */
export const ALLOW_METHODS_VALUES: Readonly<Record<Exclude<AllowMethods, "absent">, string>> = { "put-delete": "PUT, DELETE", star: "*" };

/** The server's Access-Control-Allow-Headers. */
export type AllowHeaders = "absent" | "content-type" | "content-type-authorization" | "star";
/** Every value the allow-headers control can take. */
export const ALLOW_HEADERS: readonly AllowHeaders[] = ["absent", "content-type", "content-type-authorization", "star"];
/** The header value of each allow-headers choice. */
export const ALLOW_HEADERS_VALUES: Readonly<Record<Exclude<AllowHeaders, "absent">, string>> = {
  // One name.
  "content-type": "Content-Type",
  // Two names.
  "content-type-authorization": "Content-Type, Authorization",
  // The wildcard.
  star: "*",
};

/** The server's Access-Control-Max-Age. */
export type MaxAge = "absent" | "600" | "86400";
/** Every value the max-age control can take. */
export const MAX_AGES: readonly MaxAge[] = ["absent", "600", "86400"];

/** The reader's settings. */
export interface CorsInput {
  /** The request's method. */
  method: Method;
  /** The Content-Type the script sets. */
  contentType: ContentTypeChoice;
  /** One more header the script sets. */
  extraHeader: ExtraHeader;
  /** The request's credentials mode. */
  credentials: Credentials;
  /** The server's Access-Control-Allow-Origin. */
  allowOrigin: AllowOrigin;
  /** The server's Access-Control-Allow-Credentials. */
  allowCredentials: AllowCredentials;
  /** The server's Access-Control-Allow-Methods (read on the preflight response only). */
  allowMethods: AllowMethods;
  /** The server's Access-Control-Allow-Headers (read on the preflight response only). */
  allowHeaders: AllowHeaders;
  /** The server's Access-Control-Max-Age (read on the preflight response only). */
  maxAge: MaxAge;
}

/** Why a request header is or is not CORS-safelisted. */
export type HeaderVerdict = "safelisted" | "too-long" | "unsafe-byte" | "bad-bytes" | "content-type-essence" | "not-safelisted-name" | "over-total";

/** One header the script set, judged. */
export interface JudgedHeader {
  /** The header name as the script wrote it. */
  name: string;
  /** Its value. */
  value: string;
  /** Its length in bytes (the lab's values are ASCII, one byte per character). */
  length: number;
  /** The verdict. */
  verdict: HeaderVerdict;
  /** The MIME type essence, for Content-Type; null otherwise. */
  essence: string | null;
}

/** Why a CORS check or a preflight failed. */
export type CorsFailure =
  | "acao-missing"
  | "acao-wildcard-credentials"
  | "acao-mismatch"
  | "acac-missing"
  | "method-not-allowed"
  | "method-wildcard-credentials"
  | "authorization-not-listed"
  | "header-not-allowed"
  | "header-wildcard-credentials";

/** How the exchange ends for the script. */
export type CorsOutcome = "readable" | "blocked-response" | "blocked-preflight";

/** The model's answer. */
export interface CorsResult {
  /** True when the method is CORS-safelisted. */
  safelistedMethod: boolean;
  /** Every header the script set, judged, in the order it set them. */
  headers: JudgedHeader[];
  /** The CORS-unsafe request-header names, lower-cased and sorted. */
  unsafeNames: string[];
  /** True when a preflight is sent first. */
  preflight: boolean;
  /** The preflight's headers, in the order the standard appends them after Origin, or null. */
  preflightRequest: [string, string][] | null;
  /** True when the preflight passes, false when it fails, null when none is sent. */
  preflightOk: boolean | null;
  /** Why the preflight failed, or null. */
  preflightFailure: CorsFailure | null;
  /** The header name a header failure is about, or null. */
  failedHeader: string | null;
  /** Seconds the preflight result may be cached (before any browser ceiling), or null when no preflight passed. */
  maxAge: number | null;
  /** True when the server sent no Max-Age and the standard's 5 seconds apply. */
  maxAgeDefault: boolean;
  /** True when the actual request is sent. */
  actualSent: boolean;
  /** True when the actual request carries the user's credentials (cookies). */
  credentialsSent: boolean;
  /** True when the actual response passes the CORS check, false when it fails, null when it is never sent. */
  actualOk: boolean | null;
  /** Why the actual response failed, or null. */
  actualFailure: CorsFailure | null;
  /** How it ends for the script. */
  outcome: CorsOutcome;
}

/** The stable code an invalid input is refused with. */
export type CorsErrorCode = "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class CorsError extends Error {
  /** The stable code. */
  readonly code: CorsErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: CorsErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** The CORS-unsafe request-header bytes, other than the control characters [#cors-unsafe-request-header-byte]. */
const UNSAFE_BYTES = new Set(['"', "(", ")", ":", "<", ">", "?", "@", "[", "\\", "]", "{", "}", "\u007f"]);

/** True when a value holds a CORS-unsafe request-header byte. */
function hasUnsafeByte(value: string): boolean {
  // Each character of an ASCII value is one byte.
  for (const ch of value) {
    // The code unit.
    const c = ch.charCodeAt(0);
    // Controls other than HT, or one of the listed punctuation bytes.
    if ((c < 0x20 && c !== 0x09) || UNSAFE_BYTES.has(ch)) return true;
  }
  // None found.
  return false;
}

/** The MIME type essence of a Content-Type value ("type/subtype", lower-cased), or null when it does not parse. */
function essenceOf(value: string): string | null {
  // The part before any parameter, trimmed of spaces and tabs.
  const head = value.split(";")[0].replace(/^[ \t]+|[ \t]+$/g, "");
  // A type and a subtype made of token characters; enough for the lab's fixed values.
  return /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(head) ? head.toLowerCase() : null;
}

/** The three Content-Type essences that stay safelisted [#cors-safelisted-request-header]. */
const SAFE_ESSENCES = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];

/** Judge one header the way #cors-safelisted-request-header does, for the names the lab offers. */
function judge(name: string, value: string): Omit<JudgedHeader, "name" | "value" | "length"> {
  // A value longer than 128 bytes is never safelisted, whatever the name.
  if (value.length > 128) return { verdict: "too-long", essence: null };
  // The switch is on the lower-cased name.
  switch (name.toLowerCase()) {
    case "accept":
      // Accept: no CORS-unsafe request-header byte.
      return { verdict: hasUnsafeByte(value) ? "unsafe-byte" : "safelisted", essence: null };
    case "accept-language":
    case "content-language":
      // Only digits, letters, space and * , - . ; =.
      return { verdict: /^[0-9A-Za-z *,\-.;=]*$/.test(value) ? "safelisted" : "bad-bytes", essence: null };
    case "content-type": {
      // No unsafe byte first.
      if (hasUnsafeByte(value)) return { verdict: "unsafe-byte", essence: null };
      // Then the essence must be one of three.
      const essence = essenceOf(value);
      // A value that does not parse, or another essence, is not safelisted.
      return { verdict: essence !== null && SAFE_ESSENCES.includes(essence) ? "safelisted" : "content-type-essence", essence };
    }
    default:
      // Any other name the lab offers (Authorization, X-Requested-With) is not safelisted.
      return { verdict: "not-safelisted-name", essence: null };
  }
}

/** The CORS check of a response, for the request's credentials mode [#cors-check]. */
function corsCheck(input: CorsInput): CorsFailure | null {
  // No Access-Control-Allow-Origin: failure.
  if (input.allowOrigin === "absent") return "acao-missing";
  // The value the server sent.
  const origin = ALLOW_ORIGIN_VALUES[input.allowOrigin];
  // The credentials mode decides what "*" means.
  const include = input.credentials === "include";
  // "*" without credentials: success.
  if (!include && origin === "*") return null;
  // Otherwise the value must be the serialized origin; "*" with credentials is named for what it is.
  if (origin !== PAGE_ORIGIN) return origin === "*" ? "acao-wildcard-credentials" : "acao-mismatch";
  // Without credentials, an exact origin is enough.
  if (!include) return null;
  // With credentials, Access-Control-Allow-Credentials must be exactly `true`.
  return input.allowCredentials === "true" ? null : "acac-missing";
}

/** Split a header's value into its comma-separated items, trimmed (extracting header list values, simplified). */
function items(value: string): string[] {
  // Comma-separated, spaces trimmed, empties dropped.
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Decide everything for the reader's settings. */
export function compute(input: CorsInput): CorsResult {
  // Every select can only send one of its offered values; anything else is refused, not guessed at.
  if (
    !METHODS.includes(input.method) ||
    !CONTENT_TYPES.includes(input.contentType) ||
    !EXTRA_HEADERS.includes(input.extraHeader) ||
    !CREDENTIALS.includes(input.credentials) ||
    !ALLOW_ORIGINS.includes(input.allowOrigin) ||
    !ALLOW_CREDENTIALS.includes(input.allowCredentials) ||
    !ALLOW_METHODS.includes(input.allowMethods) ||
    !ALLOW_HEADERS.includes(input.allowHeaders) ||
    !MAX_AGES.includes(input.maxAge)
  ) {
    // One code covers every stray value.
    throw new CorsError("bad-choice", "a setting is outside the values the lab offers");
  }

  // The headers the script set, in order: Content-Type first, then the extra one.
  const set: [string, string][] = [];
  // The Content-Type, when one is chosen.
  if (input.contentType !== "none") set.push(["Content-Type", CONTENT_TYPE_VALUES[input.contentType]]);
  // The extra header, when one is chosen.
  if (input.extraHeader !== "none") set.push([...EXTRA_HEADER_VALUES[input.extraHeader]]);
  // Each judged on its own.
  const headers: JudgedHeader[] = set.map(([name, value]) => ({ name, value, length: value.length, ...judge(name, value) }));
  // The safelisted values add up; past 1024 bytes every one of them becomes unsafe [#cors-unsafe-request-header-names].
  const safelistValueSize = headers.filter((h) => h.verdict === "safelisted").reduce((n, h) => n + h.length, 0);
  // Mark them so when the total is too large (out of reach with the lab's values, kept for fidelity).
  if (safelistValueSize > 1024) for (const h of headers) if (h.verdict === "safelisted") h.verdict = "over-total";
  // The unsafe names: lower-cased, de-duplicated, sorted.
  const unsafeNames = [...new Set(headers.filter((h) => h.verdict !== "safelisted").map((h) => h.name.toLowerCase()))].sort();

  // The method's standing.
  const safelistedMethod = SAFELISTED_METHODS.includes(input.method);
  // An empty preflight cache: a preflight when the method is not safelisted or any unsafe name exists [#http-fetch].
  const preflight = !safelistedMethod || unsafeNames.length > 0;
  // With "include" the wildcards stop counting [#cors-protocol-and-credentials].
  const include = input.credentials === "include";

  // The preflight's own headers, after Origin, in the order the standard appends them [#cors-preflight-fetch-0].
  let preflightRequest: [string, string][] | null = null;
  // Its outcome.
  let preflightOk: boolean | null = null;
  // Why it failed.
  let preflightFailure: CorsFailure | null = null;
  // The header a failure names.
  let failedHeader: string | null = null;
  // The cache lifetime.
  let maxAge: number | null = null;
  // Whether the 5-second default applied.
  let maxAgeDefault = false;

  // Only when a preflight is needed.
  if (preflight) {
    // Origin is on every CORS request; Accept, the method and the unsafe names follow.
    preflightRequest = [
      ["Origin", PAGE_ORIGIN],
      ["Accept", "*/*"],
      ["Access-Control-Request-Method", input.method],
    ];
    // The unsafe names joined by "," with no space, when there are any.
    if (unsafeNames.length > 0) preflightRequest.push(["Access-Control-Request-Headers", unsafeNames.join(",")]);
    // First, the CORS check on the preflight response, with the request's credentials mode.
    preflightFailure = corsCheck(input);
    // Then the methods, when the CORS check passed.
    if (preflightFailure === null) {
      // The listed methods.
      const methods = input.allowMethods === "absent" ? [] : items(ALLOW_METHODS_VALUES[input.allowMethods]);
      // Not listed, not safelisted, and not covered by a usable "*".
      if (!methods.includes(input.method) && !safelistedMethod && (include || !methods.includes("*"))) {
        // A "*" that credentials disabled is named as such.
        preflightFailure = methods.includes("*") ? "method-wildcard-credentials" : "method-not-allowed";
      }
    }
    // Then the headers.
    if (preflightFailure === null) {
      // The listed header names, compared case-insensitively.
      const names = (input.allowHeaders === "absent" ? [] : items(ALLOW_HEADERS_VALUES[input.allowHeaders])).map((s) => s.toLowerCase());
      // Authorization must be listed by name: "*" never covers it [#cors-non-wildcard-request-header-name].
      if (headers.some((h) => h.name.toLowerCase() === "authorization") && !names.includes("authorization")) {
        // The failure and the header it names.
        preflightFailure = "authorization-not-listed";
        // Authorization, as written.
        failedHeader = "Authorization";
      } else {
        // Every other unsafe name: listed, or covered by a usable "*".
        for (const n of unsafeNames) {
          // Listed by name: fine.
          if (names.includes(n)) continue;
          // Covered by "*" without credentials: fine.
          if (!include && names.includes("*")) continue;
          // Otherwise the preflight fails on this name.
          preflightFailure = names.includes("*") ? "header-wildcard-credentials" : "header-not-allowed";
          // The name, as the script wrote it.
          failedHeader = headers.find((h) => h.name.toLowerCase() === n)?.name ?? n;
          // The first failing name decides.
          break;
        }
      }
    }
    // The outcome.
    preflightOk = preflightFailure === null;
    // A passing preflight may be cached for Max-Age seconds, 5 when absent [#cors-preflight-fetch-0].
    if (preflightOk) {
      // The default applies when the header is absent.
      maxAgeDefault = input.maxAge === "absent";
      // The seconds.
      maxAge = maxAgeDefault ? 5 : Number(input.maxAge);
    }
  }

  // The actual request leaves only when no preflight was needed or the preflight passed.
  const actualSent = !preflight || preflightOk === true;
  // It carries the user's credentials only in "include" (the target is cross-origin).
  const credentialsSent = actualSent && include;
  // Its response is CORS-checked [#http-fetch].
  const actualFailure = actualSent ? corsCheck(input) : null;
  // Its outcome.
  const actualOk = actualSent ? actualFailure === null : null;
  // How it ends for the script.
  const outcome: CorsOutcome = !actualSent ? "blocked-preflight" : actualOk ? "readable" : "blocked-response";

  // The full answer.
  return {
    safelistedMethod,
    headers,
    unsafeNames,
    preflight,
    preflightRequest,
    preflightOk,
    preflightFailure,
    failedHeader,
    maxAge,
    maxAgeDefault,
    actualSent,
    credentialsSent,
    actualOk,
    actualFailure,
    outcome,
  };
}

/** The response headers a script can read without Access-Control-Expose-Headers [#cors-safelisted-response-header-name]. */
export const SAFELISTED_RESPONSE_HEADERS: readonly string[] = ["Cache-Control", "Content-Language", "Content-Length", "Content-Type", "Expires", "Last-Modified", "Pragma"];

/** The opening state: a GET asking for JSON, no credentials, and a server that names the caller. */
export const DEFAULT_INPUT: CorsInput = {
  method: "GET",
  contentType: "none",
  extraHeader: "accept-json",
  credentials: "same-origin",
  allowOrigin: "exact",
  allowCredentials: "absent",
  allowMethods: "absent",
  allowHeaders: "absent",
  maxAge: "absent",
};

/** The Example: a POST with Content-Type: application/json to the same server; the preflight fails on content-type. */
export const EXAMPLE_INPUT: CorsInput = {
  method: "POST",
  contentType: "json",
  extraHeader: "none",
  credentials: "same-origin",
  allowOrigin: "exact",
  allowCredentials: "absent",
  allowMethods: "absent",
  allowHeaders: "absent",
  maxAge: "absent",
};
