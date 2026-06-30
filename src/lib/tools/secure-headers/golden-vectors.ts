// ============================================================================
// src/lib/tools/secure-headers/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the secure-headers analyzer.
//
// Each accept vector pins a real-world response shape and asserts the stable
// outputs a knowledgeable reviewer would expect against the OWASP Secure
// Headers Project, RFC 6797 (HSTS), CSP Level 3, and RFC 6265bis (cookies):
// the overall letter grade, selected per-header ratings, and reason codes that
// MUST be present. Because the grade and ratings follow published guidance
// (not the tool's own opinion), these tie the engine to an external reference.
//
// Reject vectors assert that unparseable input throws the right stable code.
//
// verifyVectors() runs the whole set and returns a pass/fail report (used by
// the build check and runnable standalone via tsx).
// ============================================================================

import {
  analyzeHeaders,
  HeaderParseError,
  type HeaderParseErrorCode,
  type HeaderRating,
  type OverallGrade,
  type SecureHeadersReport,
} from "./compute";

export const GOLDEN_VECTOR_SET_ID = "secure-headers-golden-v1";

// -- Reusable header fragments (a strong baseline) ---------------------------
const STATUS = "HTTP/2 200";
const H = {
  hsts: "strict-transport-security: max-age=63072000; includeSubDomains; preload",
  csp: "content-security-policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  xcto: "x-content-type-options: nosniff",
  xfo: "x-frame-options: DENY",
  referrer: "referrer-policy: strict-origin-when-cross-origin",
  permissions: "permissions-policy: geolocation=(), camera=(), microphone=()",
  coop: "cross-origin-opener-policy: same-origin",
  corp: "cross-origin-resource-policy: same-origin",
};
const STRONG_HEADERS = [H.hsts, H.csp, H.xcto, H.xfo, H.referrer, H.permissions, H.coop, H.corp].join("\n");
const STRONG_BASE = `${STATUS}\n${STRONG_HEADERS}`;

/** The subset of report fields a golden vector asserts. */
export interface SecureHeadersExpectation {
  grade: OverallGrade;
  /** Required per-header ratings, keyed by catalog id. */
  ratings?: Record<string, HeaderRating>;
  /** Reason codes that MUST appear somewhere (findings, cookies, or overall). */
  reasons?: string[];
  /** Expected number of parsed cookies, when relevant. */
  cookieCount?: number;
}

export interface SecureHeadersGoldenVector {
  id: string;
  description: string;
  input: string;
  expect: SecureHeadersExpectation;
}

export const SECURE_HEADERS_GOLDEN_VECTORS: SecureHeadersGoldenVector[] = [
  {
    id: "hardened-full",
    description: "Full OWASP-recommended set + a __Host- cookie -> A",
    input: `${STRONG_BASE}\nset-cookie: __Host-session=abc; Secure; HttpOnly; SameSite=Lax; Path=/`,
    expect: {
      grade: "A",
      ratings: { hsts: "strong", csp: "strong", "x-frame-options": "strong", "set-cookie": "strong" },
      reasons: ["HSTS_PRELOAD", "CSP_FRAME_ANCESTORS", "COOKIE_HOST_PREFIX_OK", "OVERALL_STRONG"],
      cookieCount: 1,
    },
  },
  {
    id: "strong-core-only",
    description: "HSTS + CSP + nosniff + XFO + Referrer, no Permissions/COOP -> B",
    input: [STATUS, H.hsts, H.csp, H.xcto, H.xfo, H.referrer].join("\n"),
    expect: {
      grade: "B",
      ratings: { hsts: "strong", csp: "strong", "permissions-policy": "missing", coop: "missing" },
      reasons: ["PERMISSIONS_MISSING", "COOP_MISSING"],
    },
  },
  {
    id: "csp-unsafe-inline",
    description: "CSP weakened by 'unsafe-inline' -> CSP weak, grade B",
    input: [
      STATUS,
      H.hsts,
      "content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline'",
      H.xcto,
      H.xfo,
      H.referrer,
      H.permissions,
      H.coop,
    ].join("\n"),
    expect: {
      grade: "B",
      ratings: { csp: "weak", hsts: "strong" },
      reasons: ["CSP_UNSAFE_INLINE"],
    },
  },
  {
    id: "hsts-missing-gate",
    description: "Strong CSP etc. but HSTS absent -> critical gate caps at C",
    input: [STATUS, H.csp, H.xcto, H.xfo, H.referrer, H.permissions, H.coop].join("\n"),
    expect: {
      grade: "C",
      ratings: { hsts: "missing", csp: "strong" },
      reasons: ["HSTS_MISSING", "OVERALL_MISSING_CRITICAL"],
    },
  },
  {
    id: "poor-leaky",
    description: "No HSTS/CSP, version leaks, legacy XSS header, insecure cookie -> F",
    input: [
      "HTTP/1.1 200 OK",
      "server: Apache/2.4.41 (Ubuntu)",
      "x-powered-by: PHP/8.1.2",
      "x-xss-protection: 1; mode=block",
      "content-type: text/html",
      "set-cookie: sid=xyz; SameSite=None",
    ].join("\n"),
    expect: {
      grade: "F",
      ratings: {
        hsts: "missing",
        csp: "missing",
        server: "weak",
        "x-powered-by": "weak",
        "set-cookie": "weak",
      },
      reasons: [
        "OVERALL_MISSING_CRITICAL",
        "OVERALL_INFO_LEAK",
        "SERVER_VERSION_DISCLOSED",
        "XPOWEREDBY_PRESENT",
        "XSS_PROTECTION_LEGACY",
        "COOKIE_SAMESITE_NONE_INSECURE",
      ],
      cookieCount: 1,
    },
  },
  {
    id: "minimal-xfo-nosniff",
    description: "Only X-Frame-Options SAMEORIGIN + nosniff -> F (both critical missing)",
    input: [STATUS, "x-frame-options: SAMEORIGIN", H.xcto].join("\n"),
    expect: {
      grade: "F",
      ratings: { "x-content-type-options": "strong", "x-frame-options": "adequate", hsts: "missing", csp: "missing" },
      reasons: ["XFO_SAMEORIGIN", "OVERALL_MISSING_CRITICAL"],
    },
  },
  {
    id: "cookie-samesite-none-insecure",
    description: "Strong headers but SameSite=None without Secure -> cookie weak, grade capped to B",
    input: `${STRONG_BASE}\nset-cookie: sid=xyz; SameSite=None`,
    expect: {
      grade: "B",
      ratings: { "set-cookie": "weak" },
      reasons: ["COOKIE_SAMESITE_NONE_INSECURE", "OVERALL_WEAK_COOKIES"],
      cookieCount: 1,
    },
  },
  {
    id: "cookie-host-prefix-violation",
    description: "__Host- cookie without Path=/ violates the prefix contract -> cookie weak",
    input: `${STRONG_BASE}\nset-cookie: __Host-id=1; Secure; HttpOnly; SameSite=Lax`,
    expect: {
      grade: "B",
      ratings: { "set-cookie": "weak" },
      reasons: ["COOKIE_HOST_PREFIX_VIOLATION"],
      cookieCount: 1,
    },
  },
  {
    id: "cookie-secure-prefix-ok",
    description: "Properly-formed __Secure- cookie -> cookie strong, grade A",
    input: `${STRONG_BASE}\nset-cookie: __Secure-id=1; Secure; HttpOnly; SameSite=Strict; Path=/`,
    expect: {
      grade: "A",
      ratings: { "set-cookie": "strong" },
      reasons: ["COOKIE_SECURE_PREFIX_OK", "COOKIE_SAMESITE_STRICT"],
      cookieCount: 1,
    },
  },
  {
    id: "referrer-unsafe-url",
    description: "Referrer-Policy: unsafe-url leaks full URLs -> referrer weak",
    input: [STATUS, H.hsts, H.csp, H.xcto, H.xfo, "referrer-policy: unsafe-url", H.permissions, H.coop].join("\n"),
    expect: {
      grade: "A",
      ratings: { "referrer-policy": "weak" },
      reasons: ["REFERRER_UNSAFE_URL"],
    },
  },
  {
    id: "cors-wildcard-credentials",
    description: "Wildcard CORS origin together with credentials -> CORS weak, grade capped to B",
    input: `${STRONG_BASE}\naccess-control-allow-origin: *\naccess-control-allow-credentials: true`,
    expect: {
      grade: "B",
      ratings: { "access-control-allow-origin": "weak" },
      reasons: ["CORS_WILDCARD_CREDENTIALS", "OVERALL_CORS_RISK"],
    },
  },
  {
    id: "raw-block-no-status",
    description: "Header block with no status line still parses -> A",
    input: STRONG_HEADERS,
    expect: {
      grade: "A",
      ratings: { hsts: "strong", csp: "strong" },
    },
  },
];

export interface SecureHeadersRejectVector {
  id: string;
  description: string;
  input: string;
  expectCode: HeaderParseErrorCode;
}

export const SECURE_HEADERS_REJECT_VECTORS: SecureHeadersRejectVector[] = [
  { id: "empty", description: "blank input", input: "   ", expectCode: "empty" },
  { id: "no-headers", description: "text with no header line", input: "this is not http at all", expectCode: "no-headers" },
  { id: "status-only", description: "a status line but no headers", input: "HTTP/2 200", expectCode: "no-headers" },
];

export interface VectorFailure {
  id: string;
  field: string;
  expected: unknown;
  actual: unknown;
}

/** Collect every reason code emitted across a report (findings + cookies + overall). */
function allReasonCodes(report: SecureHeadersReport): Set<string> {
  const codes = new Set<string>();
  for (const f of report.findings) for (const r of f.reasons) codes.add(r.code);
  for (const c of report.cookies) for (const r of c.reasons) codes.add(r.code);
  for (const r of report.overall.reasons) codes.add(r.code);
  return codes;
}

/** Run all vectors; returns counts + structured failures. */
export function verifyVectors(): { passed: number; failed: number; failures: VectorFailure[] } {
  const failures: VectorFailure[] = [];
  let passed = 0;

  for (const v of SECURE_HEADERS_GOLDEN_VECTORS) {
    let report: SecureHeadersReport;
    try {
      report = analyzeHeaders(v.input);
    } catch (e) {
      failures.push({ id: v.id, field: "throw", expected: "report", actual: String(e) });
      continue;
    }
    let ok = true;

    if (report.overall.grade !== v.expect.grade) {
      failures.push({ id: v.id, field: "grade", expected: v.expect.grade, actual: report.overall.grade });
      ok = false;
    }

    if (v.expect.ratings) {
      for (const [id, rating] of Object.entries(v.expect.ratings)) {
        const finding = report.findings.find((f) => f.id === id);
        const actual = finding ? finding.rating : "(no finding)";
        if (actual !== rating) {
          failures.push({ id: v.id, field: `rating:${id}`, expected: rating, actual });
          ok = false;
        }
      }
    }

    if (v.expect.reasons) {
      const codes = allReasonCodes(report);
      for (const code of v.expect.reasons) {
        if (!codes.has(code)) {
          failures.push({ id: v.id, field: `reason:${code}`, expected: "present", actual: "absent" });
          ok = false;
        }
      }
    }

    if (v.expect.cookieCount !== undefined && report.cookies.length !== v.expect.cookieCount) {
      failures.push({ id: v.id, field: "cookieCount", expected: v.expect.cookieCount, actual: report.cookies.length });
      ok = false;
    }

    if (ok) passed++;
  }

  for (const v of SECURE_HEADERS_REJECT_VECTORS) {
    try {
      analyzeHeaders(v.input);
      failures.push({ id: v.id, field: "noThrow", expected: v.expectCode, actual: "parsed ok" });
    } catch (e) {
      const code = e instanceof HeaderParseError ? e.code : "(other error)";
      if (code === v.expectCode) passed++;
      else failures.push({ id: v.id, field: "code", expected: v.expectCode, actual: code });
    }
  }

  return { passed, failed: failures.length, failures };
}
