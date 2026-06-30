// ============================================================================
// src/lib/tools/secure-headers/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING SECURE-HEADERS MODULE - a self-contained {manifest, run, vectors}
// triple, mirroring the cipher / cidr reference modules, written so the whole
// folder could be lifted into an open library unchanged if the project is ever
// opened. For now it lives here and powers the secure-headers tool UI.
//
// This is catalogue rank 1: the merge of csp-helper + cookie-flags + http-headers.
// The manifest is a real D-49 manifest: https-only sources (OWASP, the relevant
// RFCs, and the W3C/WHATWG specs), anchored (ReDoS-safe) inputDetectors[] that
// would let an omnibox route a pasted response or header line here, and -
// because a pasted response can contain a live Set-Cookie value -
// shareSafetyDefault: "fragment" (keep the input out of the query string,
// server logs, and the Referer header).
//
// The analysis is pure and deterministic (parse + rule-based assessment), so
// its golden vectors are stable.
// ============================================================================

import { analyzeHeaders, type SecureHeadersReport } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  SECURE_HEADERS_GOLDEN_VECTORS,
  SECURE_HEADERS_REJECT_VECTORS,
} from "./golden-vectors";

// Re-export the compute surface + types at the module boundary.
export {
  analyzeHeaders,
  parseHttpHeaders,
  parseCookie,
  HeaderParseError,
  REGISTRY_SNAPSHOT,
  SECURITY_HEADERS,
} from "./compute";
export type {
  SecureHeadersReport,
  ParsedResponse,
  HeaderFinding,
  CookieFinding,
  CookieFlags,
  HeaderRating,
  OverallGrade,
  OverallResult,
  SecurityReason,
  SecurityAssessment,
  HeaderParseErrorCode,
  HeaderCategory,
  HeaderImportance,
  SecurityHeaderRecord,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  SECURE_HEADERS_GOLDEN_VECTORS,
  SECURE_HEADERS_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the secure-headers tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "secure-headers",
  canonicalAliases: [
    "security-headers",
    "http-security-headers",
    "header-analyzer",
    // The three tools merged into this one (catalogue rank 1).
    "csp-helper",
    "cookie-flags",
    "http-headers",
  ],
  inputDetectors: [
    {
      // A security-relevant response header name followed by a colon. Single
      // character classes, anchored, so it is linear and ReDoS-safe.
      kind: "regex",
      pattern:
        "(?:Content-Security-Policy|Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy|Set-Cookie|Cross-Origin-[A-Za-z-]+)\\s*:",
      priority: 9,
      example: "Strict-Transport-Security: max-age=63072000; includeSubDomains",
    },
    {
      // An HTTP response status line.
      kind: "regex",
      pattern: "HTTP/[0-9.]+\\s+[0-9]{3}\\b",
      priority: 5,
      example: "HTTP/2 200",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // pure local parse + rule evaluation; no network
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"], // anchored, linear detectors + parser
  shareSafetyDefault: "fragment", // a pasted Set-Cookie can carry a live secret

  // -- Teaching & provenance --
  learnLinks: [
    "learn/secure-headers-overview",
    "learn/content-security-policy",
    "learn/hsts-and-https",
    "learn/cookie-security-flags",
    "learn/clickjacking-and-framing",
  ],
  sources: [
    {
      id: "owasp-secure-headers",
      label: "OWASP Secure Headers Project",
      type: "guide",
      url: "https://owasp.org/www-project-secure-headers/",
      access_date: "2026-06-29",
      scope: "the recommended response-header set, recommended values, and rationale",
      status: "active",
    },
    {
      id: "mdn-http-headers",
      label: "MDN - HTTP headers reference",
      type: "docs",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers",
      access_date: "2026-06-29",
      scope: "per-header syntax, directives, and browser semantics",
      status: "active",
    },
    {
      id: "rfc6797",
      label: "RFC 6797 - HTTP Strict Transport Security (HSTS)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc6797",
      access_date: "2026-06-29",
      scope: "Strict-Transport-Security: max-age, includeSubDomains semantics",
      status: "active",
    },
    {
      id: "csp-l3",
      label: "Content Security Policy Level 3 (W3C)",
      type: "spec",
      url: "https://www.w3.org/TR/CSP3/",
      access_date: "2026-06-29",
      scope: "CSP directives, source expressions, frame-ancestors, the unsafe keywords",
      status: "active",
    },
    {
      id: "rfc6265bis",
      label: "draft-ietf-httpbis-rfc6265bis - HTTP State Management (Cookies)",
      type: "spec",
      url: "https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/",
      access_date: "2026-06-29",
      scope: "Set-Cookie attributes: Secure, HttpOnly, SameSite, and the __Host-/__Secure- prefixes",
      status: "active",
    },
    {
      id: "rfc7034",
      label: "RFC 7034 - HTTP Header Field X-Frame-Options",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7034",
      access_date: "2026-06-29",
      scope: "X-Frame-Options DENY / SAMEORIGIN; ALLOW-FROM is obsolete",
      status: "active",
    },
    {
      id: "w3c-referrer-policy",
      label: "Referrer Policy (W3C)",
      type: "spec",
      url: "https://www.w3.org/TR/referrer-policy/",
      access_date: "2026-06-29",
      scope: "Referrer-Policy tokens and their referrer-trimming behaviour",
      status: "active",
    },
    {
      id: "w3c-permissions-policy",
      label: "Permissions Policy (W3C)",
      type: "spec",
      url: "https://www.w3.org/TR/permissions-policy/",
      access_date: "2026-06-29",
      scope: "Permissions-Policy allow-list syntax (successor to Feature-Policy)",
      status: "active",
    },
    {
      id: "whatwg-html",
      label: "HTML Standard (WHATWG) - Cross-Origin-Opener-Policy",
      type: "spec",
      url: "https://html.spec.whatwg.org/multipage/browsers.html",
      access_date: "2026-06-29",
      scope: "COOP values (same-origin, same-origin-allow-popups, unsafe-none)",
      status: "active",
    },
    {
      id: "whatwg-fetch",
      label: "Fetch Standard (WHATWG)",
      type: "spec",
      url: "https://fetch.spec.whatwg.org/",
      access_date: "2026-06-29",
      scope: "Cross-Origin-Embedder-Policy and Cross-Origin-Resource-Policy; nosniff MIME checks",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Deterministic analysis only; throws a
 * HeaderParseError on empty input or input with no parseable headers (the UI
 * catches and localizes it).
 * @param input a pasted HTTP response or raw header block
 * @returns the secure-headers report (per-header findings, cookies, grade)
 */
export function run(input: string): SecureHeadersReport {
  return analyzeHeaders(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = SECURE_HEADERS_GOLDEN_VECTORS;
export const rejectVectors = SECURE_HEADERS_REJECT_VECTORS;
