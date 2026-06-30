// ============================================================================
// src/lib/tools/secure-headers/compute.ts
// ----------------------------------------------------------------------------
// THE SECURE-HEADERS ENGINE - pure, deterministic analysis of an HTTP response.
// Mirrors the cipher/compute.ts contract: a typed error class with stable codes,
// a {rating, reasons[]} assessment whose reasons are STABLE CODES (localized in
// the UI via tools.secureHeaders.reasons.<code>, never English prose), and a
// single entry point with stable golden vectors.
//
// All parsing is linear and ReDoS-safe: header splitting is by line and by the
// first colon (indexOf), token checks use String.includes / split, and the only
// regexes used are single-quantifier and anchored (e.g. max-age=(\d+)). The
// manifest therefore advertises dangerousInputHandling: ["redos-guard"].
//
// Scope = the union of the three merged tools (catalogue rank 1):
//   http-headers  -> the general protective/leak header surface,
//   csp-helper    -> Content-Security-Policy directive inspection,
//   cookie-flags  -> per-cookie Set-Cookie attribute hygiene.
// ============================================================================

import {
  SECURITY_HEADERS,
  SECURITY_HEADER_BY_MATCH,
  IMPORTANCE_WEIGHT,
  REGISTRY_SNAPSHOT,
  type SecurityHeaderRecord,
  type HeaderCategory,
  type HeaderImportance,
} from "./registry-data";

export { REGISTRY_SNAPSHOT } from "./registry-data";
export type { HeaderCategory, HeaderImportance, SecurityHeaderRecord } from "./registry-data";

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------

export type HeaderParseErrorCode = "empty" | "no-headers";

export class HeaderParseError extends Error {
  code: HeaderParseErrorCode;
  constructor(code: HeaderParseErrorCode, message?: string) {
    super(message ?? code);
    this.name = "HeaderParseError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Result shape
// ----------------------------------------------------------------------------

/**
 * Per-item rating.
 *  - "strong":   present with a best-practice value.
 *  - "adequate": present and acceptable, but improvable.
 *  - "weak":     present but misconfigured or risky.
 *  - "missing":  a protective header that is absent (a real finding).
 *  - "info":     informational (report-only, a leak/deprecated note, or a
 *                contextual header whose absence is not by itself a problem).
 */
export type HeaderRating = "strong" | "adequate" | "weak" | "missing" | "info";

/** Overall letter grade for the response (the securityheaders.com mental model). */
export type OverallGrade = "A" | "B" | "C" | "D" | "F";

/**
 * One reason behind a rating, as a STABLE CODE (localized in the UI via
 * tools.secureHeaders.reasons.<code>), optionally carrying a value (e.g. a
 * max-age count or an algorithm token). Codes keep compute deterministic and
 * the teaching surface translatable across every locale.
 */
export interface SecurityReason {
  code: string;
  value?: string;
}

export interface SecurityAssessment {
  reasons: SecurityReason[];
}

/** A single header's finding. */
export interface HeaderFinding {
  /** Catalog id (also the reason-code prefix base). */
  id: string;
  /** Canonical header name. */
  name: string;
  category: HeaderCategory;
  importance: HeaderImportance;
  present: boolean;
  /** Raw value(s) as seen; multiple instances joined for display. */
  value?: string;
  rating: HeaderRating;
  reasons: SecurityReason[];
  /** Recommended value (from the catalog) for the quick-fix surface. */
  recommended?: string;
}

/** Parsed Set-Cookie attribute set. */
export interface CookieFlags {
  secure: boolean;
  httpOnly: boolean;
  /** "Strict" | "Lax" | "None" | null (absent). */
  sameSite: "Strict" | "Lax" | "None" | null;
  /** Name prefix, if any. */
  prefix: "__Host-" | "__Secure-" | null;
  path: string | null;
  domain: string | null;
}

/** Per-cookie finding (the cookie-flags surface). */
export interface CookieFinding {
  name: string;
  rating: HeaderRating;
  reasons: SecurityReason[];
  flags: CookieFlags;
}

export interface OverallResult {
  grade: OverallGrade;
  /** Points earned over the protective max (0..max). */
  score: number;
  max: number;
  /** Stable reason codes summarizing why the grade landed here. */
  reasons: SecurityReason[];
}

export interface SecureHeadersReport {
  /** The status line if one was present (e.g. "HTTP/2 200"). */
  statusLine?: string;
  /** Every header parsed, in order, for transparency. */
  headersSeen: { name: string; value: string }[];
  /** Catalog-driven per-header findings. */
  findings: HeaderFinding[];
  /** Per-cookie findings; empty if the response set no cookies. */
  cookies: CookieFinding[];
  /** Overall grade + the reasons that drove it. */
  overall: OverallResult;
}

// ----------------------------------------------------------------------------
// Parsing (linear, ReDoS-safe)
// ----------------------------------------------------------------------------

export interface ParsedResponse {
  statusLine?: string;
  /** Headers in original order. */
  headers: { name: string; value: string }[];
  /** Lowercased-name -> list of values (Set-Cookie and others may repeat). */
  map: Map<string, string[]>;
}

const STATUS_LINE = /^HTTP\/[0-9.]+\s+\d{3}\b/i; // anchored, linear

/**
 * Parse a pasted HTTP response or raw header block. Accepts an optional status
 * line, CRLF or LF line endings, and obsolete line folding (continuation lines
 * beginning with whitespace). Splitting is by line and by the first colon only.
 */
export function parseHttpHeaders(input: string): ParsedResponse {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const headers: { name: string; value: string }[] = [];
  const map = new Map<string, string[]>();
  let statusLine: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;

    // Status line (only honored as the first non-empty line).
    if (headers.length === 0 && !statusLine && STATUS_LINE.test(line.trim())) {
      statusLine = line.trim();
      continue;
    }

    // Obsolete folding: a leading space/tab continues the previous header value.
    if ((line[0] === " " || line[0] === "\t") && headers.length > 0) {
      const prev = headers[headers.length - 1];
      prev.value = `${prev.value} ${line.trim()}`;
      const list = map.get(prev.name.toLowerCase());
      if (list && list.length) list[list.length - 1] = prev.value;
      continue;
    }

    const colon = line.indexOf(":");
    if (colon <= 0) continue; // not a header line; ignore
    const name = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (name === "") continue;

    headers.push({ name, value });
    const key = name.toLowerCase();
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  }

  return { statusLine, headers, map };
}

// ----------------------------------------------------------------------------
// Small parsing helpers
// ----------------------------------------------------------------------------

const MAX_AGE = /max-age\s*=\s*(\d+)/i; // single quantifier, linear

/** Tokenize a directive/attribute list on ";" and trim. */
function splitList(value: string): string[] {
  return value
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Whether a CSP contains a usable frame-ancestors directive (not 'none' only is fine). */
function cspHasFrameAncestors(csp: string): boolean {
  return /(?:^|;)\s*frame-ancestors\b/i.test(csp);
}

// ----------------------------------------------------------------------------
// Per-header assessment (present headers). Each branch emits stable codes.
// ----------------------------------------------------------------------------

interface AssessContext {
  cspEnforced: boolean;
  cspFrameAncestors: boolean;
  corsCredentials: boolean;
}

const HSTS_MIN_STRONG = 31536000; // 1 year
const HSTS_MIN_OK = 15768000; // 6 months

function assessPresent(
  record: SecurityHeaderRecord,
  values: string[],
  ctx: AssessContext,
): { rating: HeaderRating; reasons: SecurityReason[] } {
  const reasons: SecurityReason[] = [];
  const add = (code: string, value?: string) =>
    reasons.push(value !== undefined ? { code, value } : { code });
  const value = values[0] ?? "";
  const lower = value.toLowerCase();

  switch (record.id) {
    case "hsts": {
      const m = MAX_AGE.exec(lower);
      const maxAge = m ? parseInt(m[1], 10) : 0;
      const sub = /includesubdomains/i.test(lower);
      const preload = /preload/i.test(lower);
      if (!m || maxAge === 0) {
        add("HSTS_MAXAGE_ZERO", String(maxAge));
        return { rating: "weak", reasons };
      }
      if (maxAge < HSTS_MIN_OK) add("HSTS_MAXAGE_LOW", String(maxAge));
      else if (maxAge < HSTS_MIN_STRONG) add("HSTS_MAXAGE_OK", String(maxAge));
      else add("HSTS_MAXAGE_STRONG", String(maxAge));
      add(sub ? "HSTS_SUBDOMAINS" : "HSTS_NO_SUBDOMAINS");
      if (preload) add("HSTS_PRELOAD");
      const strong = maxAge >= HSTS_MIN_STRONG && sub;
      const weak = maxAge < HSTS_MIN_OK;
      return { rating: weak ? "weak" : strong ? "strong" : "adequate", reasons };
    }

    case "csp": {
      const directives = splitList(value);
      const names = new Set(directives.map((d) => d.split(/\s+/)[0].toLowerCase()));
      const unsafeInline = /'unsafe-inline'/i.test(value);
      const unsafeEval = /'unsafe-eval'/i.test(value);
      // A bare wildcard source token in a fetch directive.
      const wildcard = directives.some((d) => /\s\*(\s|$)/.test(` ${d} `));
      if (names.has("default-src")) add("CSP_HAS_DEFAULT_SRC");
      else add("CSP_NO_DEFAULT_SRC");
      if (names.has("object-src")) add("CSP_HAS_OBJECT_SRC");
      if (names.has("base-uri")) add("CSP_HAS_BASE_URI");
      if (cspHasFrameAncestors(value)) add("CSP_FRAME_ANCESTORS");
      if (unsafeInline) add("CSP_UNSAFE_INLINE");
      if (unsafeEval) add("CSP_UNSAFE_EVAL");
      if (wildcard) add("CSP_WILDCARD");
      const risky = unsafeInline || unsafeEval || wildcard;
      const solid = names.has("default-src") && !risky;
      return { rating: risky ? "weak" : solid ? "strong" : "adequate", reasons };
    }

    case "csp-report-only": {
      add(ctx.cspEnforced ? "CSP_RO_WITH_ENFORCED" : "CSP_RO_ONLY");
      return { rating: "info", reasons };
    }

    case "x-content-type-options": {
      if (lower.includes("nosniff")) {
        add("XCTO_NOSNIFF");
        return { rating: "strong", reasons };
      }
      add("XCTO_INVALID", value);
      return { rating: "weak", reasons };
    }

    case "x-frame-options": {
      if (lower === "deny") {
        add("XFO_DENY");
        return { rating: "strong", reasons };
      }
      if (lower === "sameorigin") {
        add("XFO_SAMEORIGIN");
        return { rating: "adequate", reasons };
      }
      if (lower.startsWith("allow-from")) {
        add("XFO_ALLOWFROM_DEPRECATED");
        return { rating: "weak", reasons };
      }
      add("XFO_INVALID", value);
      return { rating: "weak", reasons };
    }

    case "referrer-policy": {
      const strongVals = [
        "no-referrer",
        "strict-origin",
        "strict-origin-when-cross-origin",
        "same-origin",
      ];
      const weakVals = [
        "origin",
        "origin-when-cross-origin",
        "no-referrer-when-downgrade",
      ];
      // A policy can be a comma list; take the last token the browser would honor.
      const tokens = lower.split(",").map((t) => t.trim()).filter(Boolean);
      const effective = tokens[tokens.length - 1] ?? lower;
      if (effective === "unsafe-url") {
        add("REFERRER_UNSAFE_URL");
        return { rating: "weak", reasons };
      }
      if (strongVals.includes(effective)) {
        add("REFERRER_STRONG", effective);
        return { rating: "strong", reasons };
      }
      if (weakVals.includes(effective)) {
        add("REFERRER_WEAK", effective);
        return { rating: "adequate", reasons };
      }
      add("REFERRER_OTHER", effective);
      return { rating: "adequate", reasons };
    }

    case "permissions-policy": {
      add("PERMISSIONS_PRESENT");
      return { rating: "strong", reasons };
    }

    case "coop": {
      if (lower === "same-origin") {
        add("COOP_SAME_ORIGIN");
        return { rating: "strong", reasons };
      }
      if (lower === "same-origin-allow-popups") {
        add("COOP_ALLOW_POPUPS");
        return { rating: "adequate", reasons };
      }
      add("COOP_UNSAFE_NONE");
      return { rating: "weak", reasons };
    }

    case "coep": {
      add("COEP_PRESENT", lower);
      return { rating: "strong", reasons };
    }

    case "corp": {
      if (lower === "same-origin") {
        add("CORP_SAME_ORIGIN");
        return { rating: "strong", reasons };
      }
      if (lower === "same-site") {
        add("CORP_SAME_SITE");
        return { rating: "adequate", reasons };
      }
      add("CORP_CROSS_ORIGIN");
      return { rating: "info", reasons };
    }

    case "cache-control": {
      if (/(no-store|no-cache|private)/i.test(lower)) {
        add("CACHE_RESTRICTED");
        return { rating: "strong", reasons };
      }
      add("CACHE_PERMISSIVE");
      return { rating: "info", reasons };
    }

    // Leak / deprecated headers (presence is the finding).
    case "server": {
      // Disclosing a version (any digit) is the concern; a bare product is minor.
      if (/\d/.test(value)) {
        add("SERVER_VERSION_DISCLOSED", value);
        return { rating: "weak", reasons };
      }
      add("SERVER_PRODUCT_DISCLOSED", value);
      return { rating: "info", reasons };
    }
    case "x-powered-by": {
      add("XPOWEREDBY_PRESENT", value);
      return { rating: "weak", reasons };
    }
    case "x-aspnet-version": {
      add("XASPNETVERSION_PRESENT", value);
      return { rating: "weak", reasons };
    }
    case "x-xss-protection": {
      if (lower.trim() === "0") {
        add("XSS_PROTECTION_DISABLED_OK");
        return { rating: "info", reasons };
      }
      add("XSS_PROTECTION_LEGACY", value);
      return { rating: "weak", reasons };
    }
    case "expect-ct": {
      add("EXPECT_CT_OBSOLETE", value);
      return { rating: "info", reasons };
    }

    // CORS exposure (assessed only when present).
    case "access-control-allow-origin": {
      if (value === "*") {
        if (ctx.corsCredentials) {
          add("CORS_WILDCARD_CREDENTIALS");
          return { rating: "weak", reasons };
        }
        add("CORS_WILDCARD");
        return { rating: "info", reasons };
      }
      if (lower === "null") {
        add("CORS_NULL_ORIGIN");
        return { rating: "weak", reasons };
      }
      add("CORS_SPECIFIC_ORIGIN", value);
      return { rating: "info", reasons };
    }
    case "access-control-allow-credentials": {
      add(lower === "true" ? "CORS_CREDENTIALS_TRUE" : "CORS_CREDENTIALS_OTHER", value);
      return { rating: "info", reasons };
    }

    case "x-permitted-cross-domain-policies": {
      if (lower === "none") {
        add("XPCDP_NONE");
        return { rating: "strong", reasons };
      }
      if (lower === "all") {
        add("XPCDP_ALL");
        return { rating: "weak", reasons };
      }
      add("XPCDP_OTHER", value);
      return { rating: "adequate", reasons };
    }
    case "clear-site-data": {
      add("CLEAR_SITE_DATA_PRESENT", value);
      return { rating: "info", reasons };
    }

    case "feature-policy": {
      add("FEATURE_POLICY_DEPRECATED");
      return { rating: "info", reasons };
    }
    case "public-key-pins":
    case "public-key-pins-report-only": {
      add("HPKP_DEPRECATED");
      return { rating: "weak", reasons };
    }
    case "x-aspnetmvc-version": {
      add("XASPNETMVCVERSION_PRESENT", value);
      return { rating: "weak", reasons };
    }

    default: {
      add("HEADER_PRESENT");
      return { rating: "adequate", reasons };
    }
  }
}

// ----------------------------------------------------------------------------
// Cookie analysis (the cookie-flags surface)
// ----------------------------------------------------------------------------

export function parseCookie(raw: string): { name: string; flags: CookieFlags } {
  const parts = splitList(raw);
  const nameValue = parts[0] ?? "";
  const eq = nameValue.indexOf("=");
  const name = eq > 0 ? nameValue.slice(0, eq).trim() : nameValue.trim();

  const flags: CookieFlags = {
    secure: false,
    httpOnly: false,
    sameSite: null,
    prefix: null,
    path: null,
    domain: null,
  };

  if (name.startsWith("__Host-")) flags.prefix = "__Host-";
  else if (name.startsWith("__Secure-")) flags.prefix = "__Secure-";

  for (let i = 1; i < parts.length; i++) {
    const attr = parts[i];
    const lower = attr.toLowerCase();
    if (lower === "secure") flags.secure = true;
    else if (lower === "httponly") flags.httpOnly = true;
    else if (lower.startsWith("samesite=")) {
      const v = attr.slice(attr.indexOf("=") + 1).trim().toLowerCase();
      flags.sameSite = v === "strict" ? "Strict" : v === "lax" ? "Lax" : v === "none" ? "None" : null;
    } else if (lower.startsWith("path=")) flags.path = attr.slice(attr.indexOf("=") + 1).trim();
    else if (lower.startsWith("domain=")) flags.domain = attr.slice(attr.indexOf("=") + 1).trim();
  }

  return { name, flags };
}

function assessCookie(raw: string): CookieFinding {
  const { name, flags } = parseCookie(raw);
  const reasons: SecurityReason[] = [];
  const add = (code: string, value?: string) =>
    reasons.push(value !== undefined ? { code, value } : { code });

  // Secure / HttpOnly / SameSite hygiene.
  add(flags.secure ? "COOKIE_SECURE" : "COOKIE_NO_SECURE");
  add(flags.httpOnly ? "COOKIE_HTTPONLY" : "COOKIE_NO_HTTPONLY");
  if (flags.sameSite === "None") {
    add(flags.secure ? "COOKIE_SAMESITE_NONE" : "COOKIE_SAMESITE_NONE_INSECURE");
  } else if (flags.sameSite === "Strict") add("COOKIE_SAMESITE_STRICT");
  else if (flags.sameSite === "Lax") add("COOKIE_SAMESITE_LAX");
  else add("COOKIE_NO_SAMESITE");

  // Prefix guarantees.
  if (flags.prefix === "__Host-") {
    const ok = flags.secure && flags.path === "/" && !flags.domain;
    add(ok ? "COOKIE_HOST_PREFIX_OK" : "COOKIE_HOST_PREFIX_VIOLATION");
  } else if (flags.prefix === "__Secure-") {
    add(flags.secure ? "COOKIE_SECURE_PREFIX_OK" : "COOKIE_SECURE_PREFIX_VIOLATION");
  }

  // Rating: SameSite=None-without-Secure or no Secure is the worst; Secure +
  // HttpOnly + a real SameSite is strong; in between is adequate.
  const sameSiteNoneInsecure = flags.sameSite === "None" && !flags.secure;
  const hostPrefixViolation = flags.prefix === "__Host-" && !(flags.secure && flags.path === "/" && !flags.domain);
  let rating: HeaderRating;
  if (sameSiteNoneInsecure || !flags.secure || hostPrefixViolation) rating = "weak";
  else if (flags.secure && flags.httpOnly && (flags.sameSite === "Lax" || flags.sameSite === "Strict")) rating = "strong";
  else rating = "adequate";

  return { name, rating, reasons, flags };
}

// ----------------------------------------------------------------------------
// Overall grade (weighted, with the critical-header gate)
// ----------------------------------------------------------------------------

const GRADE_ORDER: OverallGrade[] = ["F", "D", "C", "B", "A"];
function capGrade(grade: OverallGrade, cap: OverallGrade): OverallGrade {
  return GRADE_ORDER.indexOf(grade) <= GRADE_ORDER.indexOf(cap) ? grade : cap;
}

const RATING_CREDIT: Record<HeaderRating, number> = {
  strong: 1,
  adequate: 0.6,
  weak: 0.3,
  missing: 0,
  info: 0,
};

function gradeOverall(findings: HeaderFinding[], cookies: CookieFinding[]): OverallResult {
  const reasons: SecurityReason[] = [];
  const add = (code: string, value?: string) =>
    reasons.push(value !== undefined ? { code, value } : { code });

  // Scored set = protective headers of importance critical/high/medium.
  let earned = 0;
  let max = 0;
  const missingCritical: string[] = [];
  for (const f of findings) {
    const scored =
      f.importance !== "low" &&
      f.id !== "set-cookie" &&
      f.id !== "csp-report-only" &&
      f.category !== "info-leak" &&
      f.category !== "legacy" &&
      f.category !== "cors";
    if (!scored) continue;
    const weight = IMPORTANCE_WEIGHT[f.importance];
    max += weight;
    earned += weight * RATING_CREDIT[f.rating];
    if (f.importance === "critical" && (f.rating === "missing" || f.rating === "weak")) {
      missingCritical.push(f.name);
    }
  }

  // Penalties: each present leak/deprecated header, and any weak cookie.
  const leakCount = findings.filter(
    (f) => (f.category === "info-leak" || f.category === "legacy") && f.rating !== "info" && f.present,
  ).length;
  const weakCookies = cookies.filter((c) => c.rating === "weak").length;
  const corsRisk = findings.some((f) => f.reasons.some((r) => r.code === "CORS_WILDCARD_CREDENTIALS"));
  earned = Math.max(0, earned - leakCount - (weakCookies > 0 ? 1 : 0) - (corsRisk ? 1 : 0));

  const ratio = max > 0 ? earned / max : 0;
  let grade: OverallGrade =
    ratio >= 0.9 ? "A" : ratio >= 0.75 ? "B" : ratio >= 0.55 ? "C" : ratio >= 0.35 ? "D" : "F";

  // Critical-header gate: no top grades without HSTS and an enforced CSP.
  const hsts = findings.find((f) => f.id === "hsts");
  const csp = findings.find((f) => f.id === "csp");
  const hstsBad = !hsts || hsts.rating === "missing" || hsts.rating === "weak";
  const cspBad = !csp || csp.rating === "missing";
  if (hstsBad || cspBad) grade = capGrade(grade, "C");
  if (hstsBad && cspBad) grade = capGrade(grade, "D");
  // A response that sets an insecure cookie cannot earn a top grade.
  if (weakCookies > 0) grade = capGrade(grade, "B");
  // A dangerous CORS exposure (wildcard origin + credentials) likewise caps it.
  if (corsRisk) grade = capGrade(grade, "B");

  // Summary reasons.
  if (missingCritical.length) add("OVERALL_MISSING_CRITICAL", missingCritical.join(", "));
  if (leakCount > 0) add("OVERALL_INFO_LEAK", String(leakCount));
  if (weakCookies > 0) add("OVERALL_WEAK_COOKIES", String(weakCookies));
  if (corsRisk) add("OVERALL_CORS_RISK");
  if (grade === "A" || grade === "B") add("OVERALL_STRONG");
  else if (grade === "F") add("OVERALL_POOR");

  return { grade, score: Math.round(earned * 100) / 100, max, reasons };
}

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

/**
 * analyzeHeaders - parse an HTTP response and produce a full secure-headers
 * report. Throws HeaderParseError("empty") on blank input and
 * HeaderParseError("no-headers") when no header line can be parsed at all
 * (the UI catches and localizes both). Everything else yields a report.
 */
export function analyzeHeaders(input: string): SecureHeadersReport {
  if (input == null || input.trim() === "") {
    throw new HeaderParseError("empty");
  }
  const parsed = parseHttpHeaders(input);
  if (parsed.headers.length === 0) {
    throw new HeaderParseError("no-headers");
  }

  // Cookies first (so the set-cookie finding can summarize them).
  const cookieValues = parsed.map.get("set-cookie") ?? [];
  const cookies = cookieValues.map(assessCookie);

  // Context for cross-header logic (XFO superseded-by-CSP, report-only).
  const cspValue = (parsed.map.get("content-security-policy") ?? [])[0] ?? "";
  const acac = (parsed.map.get("access-control-allow-credentials") ?? [])[0] ?? "";
  const ctx: AssessContext = {
    cspEnforced: parsed.map.has("content-security-policy"),
    cspFrameAncestors: cspValue ? cspHasFrameAncestors(cspValue) : false,
    corsCredentials: acac.trim().toLowerCase() === "true",
  };

  const findings: HeaderFinding[] = [];
  for (const record of SECURITY_HEADERS) {
    const values = parsed.map.get(record.match) ?? [];
    const present = values.length > 0;

    // Set-Cookie: only surface a finding when cookies exist; reflect the worst.
    if (record.id === "set-cookie") {
      if (!present) continue;
      const worst = cookies.some((c) => c.rating === "weak")
        ? "weak"
        : cookies.some((c) => c.rating === "adequate")
          ? "adequate"
          : "strong";
      const reasons: SecurityReason[] = [{ code: "COOKIE_COUNT", value: String(cookies.length) }];
      const weakN = cookies.filter((c) => c.rating === "weak").length;
      if (weakN > 0) reasons.push({ code: "COOKIE_WEAK_COUNT", value: String(weakN) });
      findings.push({
        id: record.id,
        name: record.name,
        category: record.category,
        importance: record.importance,
        present: true,
        value: `${cookies.length} cookie(s)`,
        rating: worst as HeaderRating,
        reasons,
        recommended: record.recommended,
      });
      continue;
    }

    if (!present) {
      // Absent leak/deprecated header = good, and not worth reporting.
      if (record.flag === "presence") continue;
      // Absent protective header. Low-importance/contextual -> info, else missing.
      const rating: HeaderRating = record.importance === "low" ? "info" : "missing";
      findings.push({
        id: record.id,
        name: record.name,
        category: record.category,
        importance: record.importance,
        present: false,
        rating,
        reasons: [{ code: rating === "missing" ? `${codeBase(record.id)}_MISSING` : `${codeBase(record.id)}_ABSENT` }],
        recommended: record.recommended,
      });
      continue;
    }

    // Special case: XFO absent but CSP frame-ancestors present is handled above
    // (XFO is only in this branch when present). Present headers -> assess.
    const { rating, reasons } = assessPresent(record, values, ctx);
    findings.push({
      id: record.id,
      name: record.name,
      category: record.category,
      importance: record.importance,
      present: true,
      value: values.length > 1 ? values.join("  |  ") : values[0],
      rating,
      reasons,
      recommended: record.recommended,
    });
  }

  const overall = gradeOverall(findings, cookies);

  return {
    statusLine: parsed.statusLine,
    headersSeen: parsed.headers,
    findings,
    cookies,
    overall,
  };
}

/** Reason-code base for a header id (e.g. "x-frame-options" -> "XFO" mapping). */
function codeBase(id: string): string {
  const MAP: Record<string, string> = {
    hsts: "HSTS",
    csp: "CSP",
    "csp-report-only": "CSP_RO",
    "x-content-type-options": "XCTO",
    "x-frame-options": "XFO",
    "referrer-policy": "REFERRER",
    "permissions-policy": "PERMISSIONS",
    coop: "COOP",
    coep: "COEP",
    corp: "CORP",
    "cache-control": "CACHE",
    "x-permitted-cross-domain-policies": "XPCDP",
    "set-cookie": "COOKIE",
  };
  return MAP[id] ?? id.toUpperCase().replace(/-/g, "_");
}

// Re-export the catalog so the UI and tool page can render the reference list.
export { SECURITY_HEADERS } from "./registry-data";
