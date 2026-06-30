// ============================================================================
// src/lib/tools/secure-headers/registry-data.ts
// ----------------------------------------------------------------------------
// THE SECURE-HEADERS REFERENCE CATALOG - the static, sourced ruleset that the
// engine (./compute) evaluates a parsed HTTP response against. Mirrors the
// cipher/registry-data.ts pattern: a typed record set + lookup helpers, no
// logic. The per-header assessment (present / absent, value parsing, the stable
// reason codes, and the overall grade) all live in ./compute so that THIS file
// stays a pure, auditable reference that maps 1:1 to the manifest sources.
//
// This is the union of the three tools merged into secure-headers (catalogue
// rank 1): the general HTTP-header surface (http-headers), the Content-Security
// -Policy surface (csp-helper), and the Set-Cookie flag surface (cookie-flags).
//
// Every record cites its authority by id into manifest.sources (see ./index).
// Teaching strings here are the English baseline; the UI localizes them via
// tools.secureHeaders.headers.<id>.* keys, exactly like the cipher reasons.
// ============================================================================

/** The defensive concern a header belongs to (drives grouping + weighting). */
export type HeaderCategory =
  | "transport" // HTTPS enforcement (HSTS)
  | "content" // content-type / script execution control (CSP, nosniff)
  | "framing" // clickjacking / framing control (X-Frame-Options, frame-ancestors)
  | "isolation" // cross-origin isolation (COOP / COEP / CORP)
  | "cors" // cross-origin resource sharing exposure (ACAO / ACAC)
  | "referrer" // referrer leakage control (Referrer-Policy)
  | "permissions" // powerful-feature gating (Permissions-Policy)
  | "cookie" // Set-Cookie attribute hygiene
  | "caching" // sensitive-response caching (Cache-Control)
  | "legacy" // deprecated / obsolete headers that should be removed or 0
  | "info-leak"; // server / stack disclosure that should be minimized

/**
 * How much a header weighs in the overall grade. The engine converts these to a
 * numeric weight; "critical" headers gate the top grades.
 */
export type HeaderImportance = "critical" | "high" | "medium" | "low";

/**
 * Whether the FINDING is triggered by absence or by presence.
 *  - "absence":  a protective header - missing is bad (HSTS, CSP, nosniff, ...).
 *  - "presence": a leak / deprecated header - present is bad (Server version,
 *                X-Powered-By, X-XSS-Protection, Expect-CT, ...).
 */
export type HeaderFlagMode = "absence" | "presence";

export interface SecurityHeaderRecord {
  /** Stable id - also the reason-code prefix base (e.g. "hsts" -> HSTS_*). */
  id: string;
  /** Canonical, correctly-cased header name. */
  name: string;
  /** Lowercased header name, for case-insensitive matching of parsed input. */
  match: string;
  category: HeaderCategory;
  importance: HeaderImportance;
  flag: HeaderFlagMode;
  /**
   * A recommended value the UI can show as a one-click teaching example.
   * Omitted for headers whose "fix" is removal (info-leak / legacy).
   */
  recommended?: string;
  /** Source ids (into manifest.sources) that back this record. */
  sourceIds: string[];
  /** One-line English teaching note; localized in the UI. */
  summary: string;
}

// ----------------------------------------------------------------------------
// The catalog. Order is teaching order (most impactful first within concern).
// ----------------------------------------------------------------------------
export const SECURITY_HEADERS: readonly SecurityHeaderRecord[] = Object.freeze([
  // -- Transport ------------------------------------------------------------
  {
    id: "hsts",
    name: "Strict-Transport-Security",
    match: "strict-transport-security",
    category: "transport",
    importance: "critical",
    flag: "absence",
    recommended: "max-age=31536000; includeSubDomains; preload",
    sourceIds: ["rfc6797", "owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Forces browsers to use HTTPS for the host (and, with includeSubDomains, every subdomain) for the max-age duration, defeating SSL-strip downgrade attacks. A year (31536000s) plus includeSubDomains is the baseline; preload is required for the browser preload list.",
  },

  // -- Content / script execution ------------------------------------------
  {
    id: "csp",
    name: "Content-Security-Policy",
    match: "content-security-policy",
    category: "content",
    importance: "critical",
    flag: "absence",
    recommended:
      "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    sourceIds: ["csp-l3", "owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Declares which sources the browser may load and execute, the primary defence-in-depth control against XSS and data injection. Strength depends on the directives: a strict policy avoids 'unsafe-inline'/'unsafe-eval' and wildcards and sets default-src, object-src, and base-uri.",
  },
  {
    id: "csp-report-only",
    name: "Content-Security-Policy-Report-Only",
    match: "content-security-policy-report-only",
    category: "content",
    importance: "low",
    flag: "absence",
    sourceIds: ["csp-l3", "mdn-http-headers"],
    summary:
      "Evaluates a CSP and reports violations without enforcing it - useful for staging a policy, but it provides no protection on its own. It should not be mistaken for an enforced Content-Security-Policy.",
  },
  {
    id: "x-content-type-options",
    name: "X-Content-Type-Options",
    match: "x-content-type-options",
    category: "content",
    importance: "high",
    flag: "absence",
    recommended: "nosniff",
    sourceIds: ["owasp-secure-headers", "mdn-http-headers", "whatwg-fetch"],
    summary:
      "The single value 'nosniff' stops browsers from MIME-sniffing a response away from its declared Content-Type, preventing a non-script response from being executed as script and blocking some drive-by download tricks.",
  },

  // -- Framing / clickjacking ----------------------------------------------
  {
    id: "x-frame-options",
    name: "X-Frame-Options",
    match: "x-frame-options",
    category: "framing",
    importance: "high",
    flag: "absence",
    recommended: "DENY",
    sourceIds: ["rfc7034", "owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Legacy clickjacking control: DENY (or SAMEORIGIN) stops the page being framed. The modern equivalent is the CSP frame-ancestors directive; ALLOW-FROM is obsolete and ignored by modern browsers. Keep X-Frame-Options for old-browser coverage alongside frame-ancestors.",
  },

  // -- Referrer -------------------------------------------------------------
  {
    id: "referrer-policy",
    name: "Referrer-Policy",
    match: "referrer-policy",
    category: "referrer",
    importance: "medium",
    flag: "absence",
    recommended: "strict-origin-when-cross-origin",
    sourceIds: ["w3c-referrer-policy", "owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Controls how much of the URL is sent in the Referer header to other origins. strict-origin-when-cross-origin (a modern browser default) sends the full path same-origin but only the origin cross-origin, and nothing when downgrading to HTTP. unsafe-url leaks the full URL everywhere.",
  },

  // -- Permissions ----------------------------------------------------------
  {
    id: "permissions-policy",
    name: "Permissions-Policy",
    match: "permissions-policy",
    category: "permissions",
    importance: "medium",
    flag: "absence",
    recommended: "geolocation=(), camera=(), microphone=()",
    sourceIds: ["w3c-permissions-policy", "owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Allow-lists powerful browser features (camera, microphone, geolocation, etc.) per origin, the successor to Feature-Policy. An empty allow-list - feature=() - disables a feature for the page and all embedded frames, shrinking the attack surface of a compromised third-party script.",
  },

  // -- Cross-origin isolation ----------------------------------------------
  {
    id: "coop",
    name: "Cross-Origin-Opener-Policy",
    match: "cross-origin-opener-policy",
    category: "isolation",
    importance: "medium",
    flag: "absence",
    recommended: "same-origin",
    sourceIds: ["whatwg-html", "owasp-secure-headers", "mdn-http-headers"],
    summary:
      "same-origin severs the window.opener relationship with cross-origin pages, preventing tab-nabbing and cross-window scripting and (with COEP) enabling cross-origin isolation for high-resolution timers and SharedArrayBuffer.",
  },
  {
    id: "coep",
    name: "Cross-Origin-Embedder-Policy",
    match: "cross-origin-embedder-policy",
    category: "isolation",
    importance: "low",
    flag: "absence",
    recommended: "require-corp",
    sourceIds: ["whatwg-html", "whatwg-fetch", "mdn-http-headers"],
    summary:
      "require-corp makes the document load only resources that explicitly opt in (via CORP or CORS). Paired with COOP: same-origin it unlocks cross-origin isolation, but it can break third-party embeds, so it is situational rather than universally recommended.",
  },
  {
    id: "corp",
    name: "Cross-Origin-Resource-Policy",
    match: "cross-origin-resource-policy",
    category: "isolation",
    importance: "low",
    flag: "absence",
    recommended: "same-origin",
    sourceIds: ["whatwg-fetch", "mdn-http-headers"],
    summary:
      "Lets a resource declare who may embed it (same-origin / same-site / cross-origin), a defence against side-channel (Spectre-style) cross-origin reads. same-origin is the tightest; set cross-origin deliberately for assets meant to be shared (a CDN, a public API).",
  },

  // -- Cookies (the cookie-flags merge) ------------------------------------
  {
    id: "set-cookie",
    name: "Set-Cookie",
    match: "set-cookie",
    category: "cookie",
    importance: "high",
    flag: "absence",
    recommended: "<name>=<value>; Secure; HttpOnly; SameSite=Lax; Path=/",
    sourceIds: ["rfc6265bis", "owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Each cookie should carry Secure (HTTPS only), HttpOnly (no JavaScript access, blunting XSS theft), and an explicit SameSite (Lax or Strict for CSRF resistance; None requires Secure). The __Host- / __Secure- name prefixes enforce these guarantees at the browser. Analysed per cookie.",
  },

  // -- Caching of sensitive responses --------------------------------------
  {
    id: "cache-control",
    name: "Cache-Control",
    match: "cache-control",
    category: "caching",
    importance: "low",
    flag: "absence",
    recommended: "no-store",
    sourceIds: ["owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Responses carrying sensitive data should set no-store so they are not written to shared or browser caches. This is contextual - static public assets should be cacheable - so it is informational unless the response is clearly sensitive.",
  },

  // -- Legacy / deprecated (presence is the finding) -----------------------
  {
    id: "x-xss-protection",
    name: "X-XSS-Protection",
    match: "x-xss-protection",
    category: "legacy",
    importance: "low",
    flag: "presence",
    sourceIds: ["owasp-secure-headers", "mdn-http-headers"],
    summary:
      "The legacy browser XSS auditor it controlled has been removed from modern browsers and could itself introduce vulnerabilities. OWASP recommends removing it, or setting exactly '0'. Rely on Content-Security-Policy instead.",
  },
  {
    id: "expect-ct",
    name: "Expect-CT",
    match: "expect-ct",
    category: "legacy",
    importance: "low",
    flag: "presence",
    sourceIds: ["mdn-http-headers", "owasp-secure-headers"],
    summary:
      "Certificate Transparency is now enforced by browsers by default, making Expect-CT obsolete; the header is deprecated and should be removed.",
  },

  // -- Information leakage (presence is the finding) -----------------------
  {
    id: "server",
    name: "Server",
    match: "server",
    category: "info-leak",
    importance: "low",
    flag: "presence",
    sourceIds: ["owasp-secure-headers", "mdn-http-headers"],
    summary:
      "A Server header that discloses product and version (e.g. 'Apache/2.4.41') hands attackers a head start on version-specific exploits. Minimise it to the product name or remove it.",
  },
  {
    id: "x-powered-by",
    name: "X-Powered-By",
    match: "x-powered-by",
    category: "info-leak",
    importance: "low",
    flag: "presence",
    sourceIds: ["owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Advertises the framework or language behind the app (e.g. 'PHP/8.1', 'Express'). It provides no value to clients and should be removed.",
  },
  {
    id: "x-aspnet-version",
    name: "X-AspNet-Version",
    match: "x-aspnet-version",
    category: "info-leak",
    importance: "low",
    flag: "presence",
    sourceIds: ["owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Discloses the exact ASP.NET runtime version, useful only to an attacker. Remove it (along with X-AspNetMvc-Version).",
  },

  // -- Cross-origin resource sharing (CORS exposure) -----------------------
  {
    id: "access-control-allow-origin",
    name: "Access-Control-Allow-Origin",
    match: "access-control-allow-origin",
    category: "cors",
    importance: "medium",
    flag: "presence",
    sourceIds: ["whatwg-fetch", "owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Declares which origins may read the response under CORS. A wildcard '*' lets any site read it (only safe for genuinely public, credential-free data); a 'null' origin, or '*' together with credentials, exposes data to other sites. Assessed only when present.",
  },
  {
    id: "access-control-allow-credentials",
    name: "Access-Control-Allow-Credentials",
    match: "access-control-allow-credentials",
    category: "cors",
    importance: "low",
    flag: "presence",
    sourceIds: ["whatwg-fetch", "mdn-http-headers"],
    summary:
      "When 'true', the browser exposes a credentialed (cookie-bearing) cross-origin response to script. Combined with a wildcard or reflected Access-Control-Allow-Origin this is a serious data-exposure misconfiguration.",
  },

  // -- Additional content coverage -----------------------------------------
  {
    id: "x-permitted-cross-domain-policies",
    name: "X-Permitted-Cross-Domain-Policies",
    match: "x-permitted-cross-domain-policies",
    category: "content",
    importance: "low",
    flag: "absence",
    recommended: "none",
    sourceIds: ["owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Controls whether Adobe clients (Flash, Acrobat) may load cross-domain policy files from the site. 'none' is the hardened value; 'all' is the most permissive. Largely legacy, but OWASP still recommends setting it to none.",
  },
  {
    id: "clear-site-data",
    name: "Clear-Site-Data",
    match: "clear-site-data",
    category: "content",
    importance: "low",
    flag: "presence",
    sourceIds: ["owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Instructs the browser to clear cookies, storage, and/or cache for the site - useful on a logout endpoint. It is situational, so it is reported only when present.",
  },

  // -- Additional legacy / deprecated (presence is the finding) ------------
  {
    id: "feature-policy",
    name: "Feature-Policy",
    match: "feature-policy",
    category: "legacy",
    importance: "low",
    flag: "presence",
    sourceIds: ["w3c-permissions-policy", "mdn-http-headers"],
    summary:
      "The deprecated predecessor of Permissions-Policy. If present, migrate to Permissions-Policy, which supersedes it.",
  },
  {
    id: "public-key-pins",
    name: "Public-Key-Pins",
    match: "public-key-pins",
    category: "legacy",
    importance: "low",
    flag: "presence",
    sourceIds: ["mdn-http-headers", "owasp-secure-headers"],
    summary:
      "HTTP Public Key Pinning (HPKP) is deprecated and removed from browsers; a mistake here can lock users out of the site. It should be removed.",
  },
  {
    id: "public-key-pins-report-only",
    name: "Public-Key-Pins-Report-Only",
    match: "public-key-pins-report-only",
    category: "legacy",
    importance: "low",
    flag: "presence",
    sourceIds: ["mdn-http-headers", "owasp-secure-headers"],
    summary:
      "The report-only form of the deprecated HPKP mechanism; also obsolete and should be removed.",
  },

  // -- Additional information leakage (presence is the finding) ------------
  {
    id: "x-aspnetmvc-version",
    name: "X-AspNetMvc-Version",
    match: "x-aspnetmvc-version",
    category: "info-leak",
    importance: "low",
    flag: "presence",
    sourceIds: ["owasp-secure-headers", "mdn-http-headers"],
    summary:
      "Discloses the ASP.NET MVC version, useful only to an attacker. Remove it alongside X-AspNet-Version and X-Powered-By.",
  },
]);

// ----------------------------------------------------------------------------
// Lookup helpers.
// ----------------------------------------------------------------------------

/** Case-insensitive lookup by header name (lowercased match). */
export const SECURITY_HEADER_BY_MATCH: ReadonlyMap<string, SecurityHeaderRecord> =
  new Map(SECURITY_HEADERS.map((h) => [h.match, h]));

/** Header records whose FINDING is triggered by presence (leaks / deprecated). */
export const PRESENCE_FLAG_HEADERS: readonly SecurityHeaderRecord[] =
  SECURITY_HEADERS.filter((h) => h.flag === "presence");

/** Header records whose FINDING is triggered by absence (protective headers). */
export const ABSENCE_FLAG_HEADERS: readonly SecurityHeaderRecord[] =
  SECURITY_HEADERS.filter((h) => h.flag === "absence");

/** Numeric weight per importance, used by the overall-grade calculation. */
export const IMPORTANCE_WEIGHT: Readonly<Record<HeaderImportance, number>> = Object.freeze({
  critical: 5,
  high: 3,
  medium: 2,
  low: 1,
});

/** Stable identifier for this catalog snapshot (surfaced in the manifest). */
export const REGISTRY_SNAPSHOT = "secure-headers-catalog-2026-06-29" as const;
