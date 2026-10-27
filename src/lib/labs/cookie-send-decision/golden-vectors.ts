// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/cookie-send-decision/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the cookie send-decision lab (set 2026-10-26a). Each case
// is worked by hand from the documents as read on 2026-10-26: RFC 6265 sections
// 5.1.3 (domain-match), 5.1.4 (default-path and path-match), 5.3 step 6 (a
// Domain the setting host does not domain-match is ignored) and 5.4 (host-only,
// Secure, HttpOnly), and draft-ietf-httpbis-rfc6265bis-22 sections 5.7 steps 17
// and 19 (Default SameSite; None without Secure ignored), 5.8.2 (document.cookie)
// and 5.8.3 (the SameSite check), with GET safe and POST not (RFC 9110 section
// 9.2.1). Reject vectors pin one stable code each. verifyVectors() runs them
// all; scripts/run-golden-vectors runs it at prebuild and fails on any drift.
// ============================================================================

import { compute, CookieSendError, type CookieSendErrorCode, type CookieSendInput, type CookieSendResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "cookie-send-decision/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: CookieSendInput;
  /** The fields of the result that must match (objects compared as JSON). */
  expect: Partial<CookieSendResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings the model must refuse. */
  input: CookieSendInput;
  /** The code the refusal must carry. */
  code: CookieSendErrorCode;
}

/** The base: the lab's hardened session cookie and a cross-site link into the account pages. */
const BASE: CookieSendInput = { domain: "none", path: "/", secure: true, httpOnly: true, sameSite: "lax", url: "https://www.example.com/account/orders", kind: "nav-get", context: "cross-site" };

/** The accept cases. */
export const COOKIE_SEND_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: every check passes, SameSite=Lax through its top-level GET exception.
  { id: "default-sent", input: BASE, expect: { setCookie: "session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax", stored: true, hostOnly: true, cookieDomain: "www.example.com", cookiePath: "/", host: "identical", path: "prefix-slash", secure: "secure-channel", httpOnly: "http-retrieval", sameSite: "lax-top-level-get", sent: true, decidedBy: null } },
  // The Example: the payment provider posts back; POST is not safe, so Lax keeps the cookie back.
  { id: "example-post-return", input: { ...BASE, url: "https://www.example.com/checkout/return", kind: "nav-post" }, expect: { host: "identical", path: "prefix-slash", sameSite: "lax-unsafe-method", sent: false, decidedBy: "same-site" } },
  // The same POST from a page on the same site carries it.
  { id: "same-site-post", input: { ...BASE, kind: "nav-post", context: "same-site" }, expect: { sameSite: "same-site", sent: true } },
  // Strict keeps it off even a cross-site link.
  { id: "strict-cross-get", input: { ...BASE, sameSite: "strict" }, expect: { sameSite: "strict-cross-site", sent: false, decidedBy: "same-site" } },
  // Lax keeps it off a cross-site subresource.
  { id: "lax-cross-subresource", input: { ...BASE, kind: "subresource" }, expect: { sameSite: "lax-not-top-level", sent: false, decidedBy: "same-site" } },
  // None with Secure goes everywhere the other checks allow.
  { id: "none-secure-subresource", input: { ...BASE, sameSite: "none", kind: "subresource" }, expect: { stored: true, sameSite: "flag-none", sent: true } },
  // None without Secure is never stored.
  { id: "none-without-secure", input: { ...BASE, sameSite: "none", secure: false }, expect: { setCookie: "session=abc123; Path=/; HttpOnly; SameSite=None", stored: false, storeRule: "none-without-secure", host: null, sent: false, decidedBy: "store" } },
  // No SameSite: Default enforcement, treated like Lax: the cross-site GET carries it...
  { id: "unset-cross-get", input: { ...BASE, sameSite: "unset" }, expect: { setCookie: "session=abc123; Path=/; Secure; HttpOnly", sameSite: "lax-top-level-get", sent: true } },
  // ...and the cross-site POST does not.
  { id: "unset-cross-post", input: { ...BASE, sameSite: "unset", kind: "nav-post" }, expect: { sameSite: "lax-unsafe-method", sent: false, decidedBy: "same-site" } },
  // A script in a same-site page cannot see an HttpOnly cookie.
  { id: "script-httponly", input: { ...BASE, kind: "script", context: "same-site" }, expect: { httpOnly: "hidden-from-script", sameSite: "same-site", sent: false, decidedBy: "http-only" } },
  // Without HttpOnly the same script sees it.
  { id: "script-visible", input: { ...BASE, httpOnly: false, kind: "script", context: "same-site" }, expect: { httpOnly: "not-httponly", sent: true } },
  // A page framed by another site does not see a Lax cookie through document.cookie.
  { id: "script-cross-lax", input: { ...BASE, httpOnly: false, kind: "script" }, expect: { sameSite: "cross-site-script", sent: false, decidedBy: "same-site" } },
  // It does see a SameSite=None one.
  { id: "script-cross-none", input: { ...BASE, httpOnly: false, sameSite: "none", kind: "script" }, expect: { sameSite: "flag-none", sent: true } },
  // A Secure cookie stays off plain HTTP.
  { id: "secure-over-http", input: { ...BASE, url: "http://www.example.com/account/orders" }, expect: { secure: "insecure-channel", sent: false, decidedBy: "secure" } },
  // A cookie without Secure rides plain HTTP too.
  { id: "plain-over-http", input: { ...BASE, secure: false, url: "http://www.example.com/account/orders" }, expect: { secure: "not-secure-cookie", sent: true } },
  // Host-only: a sibling host does not get it.
  { id: "host-only-sibling", input: { ...BASE, url: "https://api.example.com/account/orders" }, expect: { host: "not-identical", sent: false, decidedBy: "host" } },
  // Host names compare in lower case.
  { id: "host-case", input: { ...BASE, url: "HTTPS://WWW.Example.COM/account/orders" }, expect: { host: "identical", request: { scheme: "https", host: "www.example.com", path: "/account/orders", ip: false }, sent: true } },
  // Domain=example.com reaches a sibling...
  { id: "domain-sibling", input: { ...BASE, domain: "example.com", url: "https://api.example.com/x" }, expect: { hostOnly: false, cookieDomain: "example.com", host: "domain-match", sent: true } },
  // ...and the bare domain itself...
  { id: "domain-bare", input: { ...BASE, domain: "example.com", url: "https://example.com/x" }, expect: { host: "identical", sent: true } },
  // ...but not a host that merely ends in the same letters...
  { id: "domain-no-dot", input: { ...BASE, domain: "example.com", url: "https://notexample.com/x" }, expect: { host: "no-domain-match", sent: false, decidedBy: "host" } },
  // ...nor a look-alike that only contains it.
  { id: "domain-lookalike", input: { ...BASE, domain: "example.com", url: "https://www.example.com.evil.test/x" }, expect: { host: "no-domain-match", decidedBy: "host" } },
  // An IP address never domain-matches.
  { id: "domain-ip", input: { ...BASE, domain: "example.com", url: "https://192.0.2.1/x" }, expect: { host: "no-domain-match", request: { scheme: "https", host: "192.0.2.1", path: "/x", ip: true }, decidedBy: "host" } },
  // Domain=www.example.com is not host-only: a subdomain of www gets it.
  { id: "domain-www-not-host-only", input: { ...BASE, domain: "www.example.com", url: "https://api.www.example.com/x" }, expect: { hostOnly: false, host: "domain-match", sent: true } },
  // A Domain the setting host does not domain-match: ignored, never stored.
  { id: "domain-mismatch", input: { ...BASE, domain: "shop.example.com" }, expect: { stored: false, storeRule: "domain-mismatch", decidedBy: "store", sent: false } },
  // No Path: the default-path of /account/login is /account, which /account matches identically...
  { id: "default-path-identical", input: { ...BASE, path: "none", url: "https://www.example.com/account" }, expect: { pathDefaulted: true, cookiePath: "/account", path: "identical", sent: true } },
  // ...and /account/orders at a "/" boundary...
  { id: "default-path-child", input: { ...BASE, path: "none" }, expect: { cookiePath: "/account", path: "prefix-boundary", sent: true } },
  // ...but not /accounting...
  { id: "default-path-accounting", input: { ...BASE, path: "none", url: "https://www.example.com/accounting" }, expect: { path: "no-match", sent: false, decidedBy: "path" } },
  // ...nor the site root.
  { id: "default-path-root", input: { ...BASE, path: "none", url: "https://www.example.com/" }, expect: { path: "no-match", decidedBy: "path" } },
  // Path=/account/ does not cover /account itself.
  { id: "trailing-slash-path", input: { ...BASE, path: "/account/", url: "https://www.example.com/account" }, expect: { cookiePath: "/account/", path: "no-match", decidedBy: "path" } },
  // Path=/account/ covers what is under it.
  { id: "trailing-slash-child", input: { ...BASE, path: "/account/", url: "https://www.example.com/account/x" }, expect: { path: "prefix-slash", sent: true } },
  // The port is not part of the decision; the query is not part of the path.
  { id: "port-and-query", input: { ...BASE, path: "/admin", url: "https://www.example.com:8443/admin?next=/account" }, expect: { request: { scheme: "https", host: "www.example.com", path: "/admin", ip: false }, path: "identical", sent: true } },
  // When several checks fail, the first in the algorithm's order is named.
  { id: "first-failure-named", input: { ...BASE, path: "/admin", sameSite: "strict", url: "http://api.example.com/account" }, expect: { host: "not-identical", path: "no-match", secure: "insecure-channel", sameSite: "strict-cross-site", decidedBy: "host" } },
  // Every attribute in the header, in the order the lab writes them.
  { id: "header-text", input: { ...BASE, domain: "example.com", path: "/account/", sameSite: "strict" }, expect: { setCookie: "session=abc123; Domain=example.com; Path=/account/; Secure; HttpOnly; SameSite=Strict" } },
]);

/** The reject cases. */
export const COOKIE_SEND_REJECTS: readonly RejectVector[] = Object.freeze([
  // A request kind the control cannot produce.
  { id: "bad-choice", input: { ...BASE, kind: "xhr" as unknown as "subresource" }, code: "bad-choice" },
  // No scheme.
  { id: "bad-url", input: { ...BASE, url: "www.example.com/account" }, code: "bad-url" },
  // A scheme other than http or https.
  { id: "bad-scheme", input: { ...BASE, url: "ftp://www.example.com/account" }, code: "bad-scheme" },
  // User information in the authority.
  { id: "bad-host-userinfo", input: { ...BASE, url: "https://user@www.example.com/" }, code: "bad-host" },
  // A numeric host that is not an IPv4 address.
  { id: "bad-host-numeric", input: { ...BASE, url: "https://999.1.1.1/" }, code: "bad-host" },
  // No path at all.
  { id: "no-path", input: { ...BASE, url: "https://www.example.com" }, code: "no-path" },
  // A space in the path.
  { id: "bad-path", input: { ...BASE, url: "https://www.example.com/a b" }, code: "bad-path" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of COOKIE_SEND_VECTORS) {
    // The model's answer, or the refusal it should not have made.
    let got: CookieSendResult;
    // Run it.
    try {
      // Should not throw.
      got = compute(v.input);
    } catch (e) {
      // An accept case refused is a failure.
      failures.push(`${v.id}: refused (${e instanceof CookieSendError ? e.code : String(e)})`);
      // Next case.
      continue;
    }
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field, as JSON so objects compare by content.
      const have = JSON.stringify(got[k as keyof CookieSendResult]);
      // A difference is a failure naming the case and the field.
      if (have !== JSON.stringify(want)) failures.push(`${v.id}: ${k} is ${have}, expected ${JSON.stringify(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of COOKIE_SEND_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof CookieSendError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = COOKIE_SEND_VECTORS.length + COOKIE_SEND_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
