// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/cookie-send-decision/compute.ts
// ----------------------------------------------------------------------------
// THE COOKIE SEND-DECISION LAB'S MODEL (2026-10-26), the interactive companion
// of the articles "HTTP Cookies: State Over a Stateless Protocol" and "Cookie
// Security Flags". One cookie, session=abc123, set by a response to
// https://www.example.com/account/login (a top-level, same-site navigation over
// HTTPS, so none of the storage rules about cross-site or insecure setting
// apply). The reader picks its Domain, Path, Secure, HttpOnly and SameSite
// attributes, types the URL of a later request, and says what kind of request
// it is (a top-level navigation by GET or by POST, a subresource or fetch, or a
// script reading document.cookie in the page at that URL) and whether it is
// same-site or cross-site. The model answers whether the cookie goes, check by
// check, naming the first rule that keeps it back:
//
//   0. Stored at all? A Domain that the setting host does not domain-match
//      makes the browser ignore the cookie (RFC 6265 section 5.3 step 6;
//      draft-ietf-httpbis-rfc6265bis-22 section 5.7 step 10), and so does
//      SameSite=None without Secure (draft section 5.7 step 19). With no
//      Domain the cookie is host-only for www.example.com; with no Path its
//      path is the default-path of /account/login, which is /account
//      (RFC 6265 section 5.1.4).
//   1. Host: a host-only cookie needs the identical host; otherwise the host
//      must domain-match the cookie's domain: identical, or ending in it right
//      after a dot, and not an IP address (RFC 6265 sections 5.1.3, 5.4).
//   2. Path: the request path must path-match the cookie's path: identical, or
//      the cookie path is a prefix and ends in "/" or is followed by "/" in
//      the request path (RFC 6265 section 5.1.4), compared character for
//      character (erratum 3663, folded into the draft's 5.1.4).
//   3. Secure: a Secure cookie needs a secure channel; the lab takes https as
//      secure and http as not (RFC 6265 section 5.4 and its note).
//   4. HttpOnly: left out when the cookie-string is built for a non-HTTP API
//      (RFC 6265 section 5.4), which document.cookie is (WHATWG HTML).
//   5. SameSite (not in RFC 6265; draft-ietf-httpbis-rfc6265bis-22, an
//      Internet-Draft in the RFC Editor's queue when read on 2026-10-26,
//      section 5.8.3): a cookie that is not SameSite=None is left out of a
//      cross-site retrieval unless the retrieval is an HTTP one, the cookie is
//      Lax or has no SameSite ("Default", section 5.7 step 17), the method is
//      safe (GET is, POST is not: RFC 9110 section 9.2.1), and the request
//      navigates a top-level traversable. For document.cookie the retrieval is
//      cross-site when the page's "site for cookies" is not same-site with the
//      top-level origin, that is, when another site frames it (section 5.8.2).
//
// What the model leaves out (the lab's scope note): working out same-site from
// the two URLs (the reader says which), cookie lifetime, name prefixes, the
// public suffix list, the Lax-allowing-unsafe mode a browser MAY apply to
// recently created Default cookies (draft section 5.6.7.2, worded in the lab as
// a note), reload navigations, redirects, the Fetch standard's credentials mode,
// third-party cookie policies, and whether a given browser applies the draft's
// Default enforcement at all.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The URL whose response set the cookie. */
export const SET_BY_URL = "https://www.example.com/account/login";
/** Its host, canonicalised (lower case). */
export const SET_BY_HOST = "www.example.com";
/** Its path. */
export const SET_BY_PATH = "/account/login";
/** The cookie's name and value. */
export const COOKIE_PAIR = "session=abc123";
/** The longest request URL the lab reads, in characters. */
export const MAX_URL_LENGTH = 200;

/** The Domain attribute: absent (host-only) or one of three values. */
export type DomainChoice = "none" | "example.com" | "www.example.com" | "shop.example.com";
/** Every value the Domain control can take. */
export const DOMAIN_CHOICES: readonly DomainChoice[] = ["none", "example.com", "www.example.com", "shop.example.com"];
/** The Path attribute: absent (default-path) or one of three values. */
export type PathChoice = "none" | "/" | "/account/" | "/admin";
/** Every value the Path control can take. */
export const PATH_CHOICES: readonly PathChoice[] = ["none", "/", "/account/", "/admin"];
/** The SameSite attribute: absent, or one of its three values. */
export type SameSiteChoice = "unset" | "strict" | "lax" | "none";
/** Every value the SameSite control can take. */
export const SAMESITE_CHOICES: readonly SameSiteChoice[] = ["unset", "strict", "lax", "none"];
/** The kind of retrieval: a top-level navigation by GET or POST, a subresource or fetch, or a script reading document.cookie. */
export type RequestKind = "nav-get" | "nav-post" | "subresource" | "script";
/** Every value the request-kind control can take. */
export const REQUEST_KINDS: readonly RequestKind[] = ["nav-get", "nav-post", "subresource", "script"];
/** Same-site or cross-site (draft section 5.2), as the reader states it. */
export type SiteContext = "same-site" | "cross-site";
/** Every value the context control can take. */
export const SITE_CONTEXTS: readonly SiteContext[] = ["same-site", "cross-site"];

/** The reader's settings. */
export interface CookieSendInput {
  /** The Domain attribute. */
  domain: DomainChoice;
  /** The Path attribute. */
  path: PathChoice;
  /** True when the cookie carries Secure. */
  secure: boolean;
  /** True when the cookie carries HttpOnly. */
  httpOnly: boolean;
  /** The SameSite attribute. */
  sameSite: SameSiteChoice;
  /** The URL of the request, or of the page whose script reads document.cookie, as typed. */
  url: string;
  /** What kind of retrieval it is. */
  kind: RequestKind;
  /** Whether it is same-site or cross-site. */
  context: SiteContext;
}

/** Why the cookie was or was not stored. */
export type StoreRule = "stored" | "domain-mismatch" | "none-without-secure";
/** How the host check went (an IP address never domain-matches, RFC 6265 section 5.1.3). */
export type HostHow = "identical" | "not-identical" | "domain-match" | "no-domain-match";
/** How the path check went. */
export type PathHow = "identical" | "prefix-slash" | "prefix-boundary" | "no-match";
/** How the Secure check went. */
export type SecureHow = "not-secure-cookie" | "secure-channel" | "insecure-channel";
/** How the HttpOnly check went. */
export type HttpOnlyHow = "not-httponly" | "http-retrieval" | "hidden-from-script";
/** How the SameSite check went. */
export type SameSiteHow = "flag-none" | "same-site" | "lax-top-level-get" | "strict-cross-site" | "lax-unsafe-method" | "lax-not-top-level" | "cross-site-script";
/** The check that kept the cookie back, in the order the algorithm applies them. */
export type Decider = "store" | "host" | "path" | "secure" | "http-only" | "same-site";

/** The parsed request URL. */
export interface ParsedUrl {
  /** "http" or "https". */
  scheme: "http" | "https";
  /** The host, in lower case, without the port. */
  host: string;
  /** The path, from its first "/" up to any "?" or "#". */
  path: string;
  /** True when the host is an IPv4 address. */
  ip: boolean;
}

/** The model's answer. */
export interface CookieSendResult {
  /** The Set-Cookie header the attributes make. */
  setCookie: string;
  /** True when the browser stored the cookie. */
  stored: boolean;
  /** Why it was or was not stored. */
  storeRule: StoreRule;
  /** True when the cookie is host-only (no Domain attribute). */
  hostOnly: boolean;
  /** The cookie's domain. */
  cookieDomain: string;
  /** The cookie's path. */
  cookiePath: string;
  /** True when the path is the default-path (no Path attribute). */
  pathDefaulted: boolean;
  /** The parsed request URL. */
  request: ParsedUrl;
  /** The host check (null when the cookie was never stored). */
  host: HostHow | null;
  /** The path check. */
  path: PathHow | null;
  /** The Secure check. */
  secure: SecureHow | null;
  /** The HttpOnly check. */
  httpOnly: HttpOnlyHow | null;
  /** The SameSite check. */
  sameSite: SameSiteHow | null;
  /** True when the cookie goes with the request (or is visible to the script). */
  sent: boolean;
  /** The first check that kept it back, or null when it goes. */
  decidedBy: Decider | null;
}

/** The stable codes an invalid input is refused with. */
export type CookieSendErrorCode = "bad-choice" | "bad-url" | "bad-scheme" | "bad-host" | "no-path" | "bad-path";

/** The error a refused input throws, with its stable code. */
export class CookieSendError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: CookieSendErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: CookieSendErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** True when every label is decimal and the four make an IPv4 address. */
function isIpv4(host: string): boolean {
  // Four dot-separated labels.
  const parts = host.split(".");
  // Exactly four, each one to three digits, each at most 255.
  return parts.length === 4 && parts.every((p) => /^[0-9]{1,3}$/.test(p) && Number(p) <= 255);
}

/** Parse the request URL: scheme, host (lower case, port dropped), path; a linear scan, no backtracking. */
export function parseUrl(raw: string): ParsedUrl {
  // Surrounding spaces are not part of a URL.
  const s = raw.trim();
  // Empty or too long.
  if (s.length === 0 || s.length > MAX_URL_LENGTH) throw new CookieSendError("bad-url", "empty or too long");
  // The scheme separator.
  const sep = s.indexOf("://");
  // No scheme.
  if (sep <= 0) throw new CookieSendError("bad-url", "no scheme");
  // The scheme, in lower case.
  const lower = s.slice(0, sep).toLowerCase();
  // Only the two web schemes.
  if (lower !== "http" && lower !== "https") throw new CookieSendError("bad-scheme", `scheme ${lower}`);
  // Narrowed to the two the lab reads.
  const scheme: "http" | "https" = lower;
  // Everything after "://".
  const rest = s.slice(sep + 3);
  // The authority ends at the first "/", "?" or "#".
  let end = rest.length;
  // Find it.
  for (let i = 0; i < rest.length; i++) {
    // A delimiter.
    if (rest[i] === "/" || rest[i] === "?" || rest[i] === "#") {
      // The end of the authority.
      end = i;
      // Stop.
      break;
    }
  }
  // The authority.
  let authority = rest.slice(0, end);
  // The rest: path, query, fragment.
  const tail = rest.slice(end);
  // User information is not modelled.
  if (authority.includes("@")) throw new CookieSendError("bad-host", "userinfo");
  // A port, dropped: cookies do not isolate by port.
  const colon = authority.lastIndexOf(":");
  // Present.
  if (colon >= 0) {
    // Digits only, one to five.
    if (!/^[0-9]{1,5}$/.test(authority.slice(colon + 1))) throw new CookieSendError("bad-host", "port");
    // Without it.
    authority = authority.slice(0, colon);
  }
  // The host, canonicalised to lower case.
  const host = authority.toLowerCase();
  // Every label: letters, digits, hyphens, 1 to 63 characters; 253 in all.
  if (host.length === 0 || host.length > 253 || !host.split(".").every((l) => /^[a-z0-9-]{1,63}$/.test(l))) throw new CookieSendError("bad-host", `host ${host}`);
  // All-numeric labels must make an IPv4 address.
  const numeric = host.split(".").every((l) => /^[0-9]+$/.test(l));
  // A numeric host that is not an address.
  if (numeric && !isIpv4(host)) throw new CookieSendError("bad-host", `not an IPv4 address: ${host}`);
  // The path must be written, at least "/".
  if (!tail.startsWith("/")) throw new CookieSendError("no-path", "no path");
  // The path ends at "?" or "#".
  let pEnd = tail.length;
  // Find it.
  for (let i = 0; i < tail.length; i++) {
    // A delimiter.
    if (tail[i] === "?" || tail[i] === "#") {
      // The end of the path.
      pEnd = i;
      // Stop.
      break;
    }
  }
  // The path.
  const path = tail.slice(0, pEnd);
  // No spaces or control characters.
  for (const c of path) if (c.charCodeAt(0) <= 0x20 || c.charCodeAt(0) === 0x7f) throw new CookieSendError("bad-path", "space or control character in the path");
  // The parsed URL.
  return { scheme, host, path, ip: isIpv4(host) };
}

/** RFC 6265 section 5.1.4: the default-path of a request-uri path. */
export function defaultPath(uriPath: string): string {
  // Empty or not starting with "/": "/".
  if (uriPath === "" || uriPath[0] !== "/") return "/";
  // At most one "/": "/".
  if (uriPath.indexOf("/", 1) < 0) return "/";
  // Up to, not including, the right-most "/".
  return uriPath.slice(0, uriPath.lastIndexOf("/"));
}

/** RFC 6265 section 5.1.3: how a host relates to a cookie domain ("identical", "domain-match", or neither). */
export function domainMatch(host: string, domain: string, hostIsIp: boolean): "identical" | "domain-match" | "no" {
  // The same string.
  if (host === domain) return "identical";
  // A suffix at a dot boundary, on a host name.
  if (!hostIsIp && host.length > domain.length && host.endsWith(domain) && host[host.length - domain.length - 1] === ".") return "domain-match";
  // Neither.
  return "no";
}

/** RFC 6265 section 5.1.4: how a request path relates to a cookie path. */
export function pathMatch(requestPath: string, cookiePath: string): PathHow {
  // Identical.
  if (requestPath === cookiePath) return "identical";
  // Not even a prefix.
  if (!requestPath.startsWith(cookiePath)) return "no-match";
  // A prefix ending in "/".
  if (cookiePath.endsWith("/")) return "prefix-slash";
  // A prefix followed by "/" in the request path.
  if (requestPath[cookiePath.length] === "/") return "prefix-boundary";
  // A prefix that stops mid-segment.
  return "no-match";
}

/** The Set-Cookie header the attributes make. */
function setCookieHeader(input: CookieSendInput): string {
  // The name and value first.
  const parts = [COOKIE_PAIR];
  // Domain, when set.
  if (input.domain !== "none") parts.push(`Domain=${input.domain}`);
  // Path, when set.
  if (input.path !== "none") parts.push(`Path=${input.path}`);
  // Secure.
  if (input.secure) parts.push("Secure");
  // HttpOnly.
  if (input.httpOnly) parts.push("HttpOnly");
  // SameSite, capitalised as usually written.
  if (input.sameSite !== "unset") parts.push(`SameSite=${input.sameSite[0].toUpperCase()}${input.sameSite.slice(1)}`);
  // Joined as a header value.
  return parts.join("; ");
}

/** Decide whether the cookie goes with the request, check by check. */
export function compute(input: CookieSendInput): CookieSendResult {
  // Every select must hold one of its values.
  if (
    !DOMAIN_CHOICES.includes(input.domain) ||
    !PATH_CHOICES.includes(input.path) ||
    !SAMESITE_CHOICES.includes(input.sameSite) ||
    !REQUEST_KINDS.includes(input.kind) ||
    !SITE_CONTEXTS.includes(input.context) ||
    typeof input.secure !== "boolean" ||
    typeof input.httpOnly !== "boolean"
  )
    throw new CookieSendError("bad-choice", "unknown attribute or request choice");
  // The request URL.
  const request = parseUrl(input.url);
  // The header, for display.
  const setCookie = setCookieHeader(input);
  // Host-only when there is no Domain.
  const hostOnly = input.domain === "none";
  // The cookie's domain: the setting host, or the attribute.
  const cookieDomain = hostOnly ? SET_BY_HOST : input.domain;
  // No Path: the default-path of the setting URL.
  const pathDefaulted = input.path === "none";
  // The cookie's path.
  const cookiePath = pathDefaulted ? defaultPath(SET_BY_PATH) : input.path;

  // Step 0: storage. A Domain the setting host does not domain-match is ignored entirely.
  const storeRule: StoreRule =
    !hostOnly && domainMatch(SET_BY_HOST, cookieDomain, false) === "no" ? "domain-mismatch" : input.sameSite === "none" && !input.secure ? "none-without-secure" : "stored";
  // Stored or not.
  const stored = storeRule === "stored";
  // Never stored: nothing to send.
  if (!stored) return { setCookie, stored, storeRule, hostOnly, cookieDomain, cookiePath, pathDefaulted, request, host: null, path: null, secure: null, httpOnly: null, sameSite: null, sent: false, decidedBy: "store" };

  // Step 1: the host.
  const dm = domainMatch(request.host, cookieDomain, request.ip);
  // Host-only needs identity; a Domain cookie needs a domain-match.
  const host: HostHow = hostOnly
    ? dm === "identical"
      ? "identical"
      : "not-identical"
    : dm === "identical"
      ? "identical"
      : dm === "domain-match"
        ? "domain-match"
        : "no-domain-match";
  // Step 2: the path.
  const path = pathMatch(request.path, cookiePath);
  // Step 3: Secure.
  const secure: SecureHow = !input.secure ? "not-secure-cookie" : request.scheme === "https" ? "secure-channel" : "insecure-channel";
  // Step 4: HttpOnly.
  const httpOnly: HttpOnlyHow = !input.httpOnly ? "not-httponly" : input.kind === "script" ? "hidden-from-script" : "http-retrieval";
  // Step 5: SameSite.
  const sameSite: SameSiteHow =
    input.sameSite === "none"
      ? "flag-none"
      : input.context === "same-site"
        ? "same-site"
        : input.sameSite === "strict"
          ? "strict-cross-site"
          : input.kind === "script"
            ? "cross-site-script"
            : input.kind === "nav-post"
              ? "lax-unsafe-method"
              : input.kind === "subresource"
                ? "lax-not-top-level"
                : "lax-top-level-get";
  // The first failing check, in the algorithm's order.
  const decidedBy: Decider | null =
    host === "not-identical" || host === "no-domain-match"
      ? "host"
      : path === "no-match"
        ? "path"
        : secure === "insecure-channel"
          ? "secure"
          : httpOnly === "hidden-from-script"
            ? "http-only"
            : sameSite === "strict-cross-site" || sameSite === "cross-site-script" || sameSite === "lax-unsafe-method" || sameSite === "lax-not-top-level"
              ? "same-site"
              : null;
  // The full answer.
  return { setCookie, stored, storeRule, hostOnly, cookieDomain, cookiePath, pathDefaulted, request, host, path, secure, httpOnly, sameSite, sent: decidedBy === null, decidedBy };
}

/** The opening state: a hardened session cookie, and a link from another site into the account pages; Lax lets it through. */
export const DEFAULT_INPUT: CookieSendInput = { domain: "none", path: "/", secure: true, httpOnly: true, sameSite: "lax", url: "https://www.example.com/account/orders", kind: "nav-get", context: "cross-site" };

/** The Example: the same cookie when a payment provider's page posts the shopper back; POST is not safe, so Lax keeps it back. */
export const EXAMPLE_INPUT: CookieSendInput = { domain: "none", path: "/", secure: true, httpOnly: true, sameSite: "lax", url: "https://www.example.com/checkout/return", kind: "nav-post", context: "cross-site" };
