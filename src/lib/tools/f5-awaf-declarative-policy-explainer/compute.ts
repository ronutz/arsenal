// ============================================================================
// src/lib/tools/f5-awaf-declarative-policy-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE ENGINE for the F5 Advanced WAF declarative-policy explainer. Paste a
// BIG-IP Advanced WAF (ASM) declarative security policy in JSON form
// (`{ "policy": { ... } }`) and get a section-by-section, plain-language
// reading of what the policy actually does, with security-state callouts that
// interpret the values rather than echo them.
//
// DECODE-ONLY. This is a pure function of the pasted JSON plus a static,
// F5-grounded section registry. It never fetches anything, never validates
// against a live BIG-IP, and never evaluates the policy against traffic
// (zero egress, D-49). It is not a schema validator; it is an explainer.
//
// GROUNDING. Every section summary is paraphrased from F5's own published
// declarative-policy documentation, the source of truth at
//   clouddocs.f5.com/products/waf-declarative-policy/
// As of this build (verified against that index, updated 2026-07-01) F5
// publishes declarative-policy docs for FIVE versions: v16.0, v16.1, v17.0,
// v17.1, and v17.5. v17.5 is listed but is currently a stub -- its schema and
// schema-description pages are NOT yet published -- so the latest version with
// a COMPLETE published schema is v17.1, and this engine is grounded to it:
//   - schema:       .../schema_v17_1.html
//   - descriptions: .../declarative_policy_v17_1.html
//                   (cross-checked against .../declarative_policy_v16_1.html;
//                    the core-section description text is identical)
// The core sections covered here are stable across the published v16.x-v17.x
// schemas (v16.1 / v17.0 / v17.1 share the same core structure). F5 also
// states name and template are mandatory and that all adjustments are optional,
// defaulting to the template when absent -- the template-delta rule below.
// Field descriptions are F5's; the wording here is paraphrased, never verbatim.
//
// THE TEMPLATE-DELTA RULE (accuracy-critical). A declarative policy is defined
// as adjustments and modifications ON TOP OF a base template. Therefore the
// ABSENCE of a section does NOT mean a protection is disabled -- it means the
// template's default for that section applies. This engine only ever reports
// on what is EXPLICITLY present in the pasted policy, and every security
// callout is derived from a value the policy actually sets. It never infers
// "off" from absence.
//
// PAGE LANGUAGE (01/11/2026): every value-reading detail, security flag,
// reason and the template note are built as EngineTexts
// (src/lib/tools/engine-text.ts): a stable id, the English as before, and their
// values. parseAwafPolicyLocalisable() returns them as such for the page (pack
// keys tools.f5-awaf-declarative-policy-explainer.engine.<id>);
// parseAwafPolicy() returns plainText() of the same reading, so the API and the
// golden vectors are unchanged. Section labels, summaries and group names keep
// their strings; the page looks them up by section key and group name. A JSON
// syntax error is the browser's own message and stays as it comes in
// parseError (the API's field, unchanged); since 2026-11-02 the page also shows,
// in its own language, where the error is (jsonErrorLocation below), and sets
// the browser's message in code type as a detail.
// ============================================================================

import { say, listOf, plainText, type EngineText } from "../engine-text"; // sentences with ids (01/11/2026)
import { parseJson, JsonParseError } from "../json-formatter/compute"; // the site's position-tracking JSON parser, for errors the browser does not place (2026-11-02)

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

/** Relative importance of a rendered line, drives styling on the surface. */
export type Severity = "info" | "note" | "warn";

/** One explained top-level policy section. S: string (API) or EngineText (page). */
export interface SectionView<S = string> {
  /** The raw policy key, e.g. "enforcementMode". */
  key: string;
  /** Human label, e.g. "Enforcement mode". */
  label: string;
  /** Which output group this belongs to (see GROUPS). */
  group: string;
  /** F5-grounded description of what the section is (paraphrased). */
  summary: string;
  /** Interpretation of the value the policy actually set (optional). */
  detail?: S;
  /** Callout severity for `detail`, when it carries a security signal. */
  severity?: Severity;
}

/** A cross-cutting security observation, surfaced above the section list. S: string (API) or EngineText (page). */
export interface SecurityFlag<S = string> {
  severity: Severity;
  message: S;
}

/** The full decode result. S: string (API) or EngineText (page). */
export interface AwafPolicyParse<S = string> {
  /** True when the input parses as JSON and looks like a WAF policy. */
  recognized: boolean;
  /** JSON parse error message, when the input is not valid JSON. */
  parseError?: string;
  /** Reason the (valid JSON) input was not recognized as a WAF policy. */
  unrecognizedReason?: S;
  /** policy.name, when present. */
  policyName?: string;
  /** policy.template.name, when present. */
  templateName?: string;
  /** policy.enforcementMode, when present. */
  enforcement?: string;
  /** Count of recognized top-level sections present in the policy. */
  sectionCount: number;
  /** Explained sections, ordered by GROUPS then by registry order. */
  sections: SectionView<S>[];
  /** Cross-cutting security callouts. */
  securityFlags: SecurityFlag<S>[];
  /** Present policy keys that are not in the registry (acknowledged, not explained). */
  unknownKeys: string[];
  /** The standing template-delta caveat, always returned for recognized policies. */
  templateNote: S;
}

// ---------------------------------------------------------------------------
// Small safe accessors (the input is untrusted; never throw on shape)
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}
function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
/** Count entries whether the section is an array of entities or an object map. */
function countEntities(v: unknown): number {
  if (Array.isArray(v)) return v.length;
  if (isObject(v)) return Object.keys(v).length;
  return 0;
}

// ---------------------------------------------------------------------------
// Output groups (order matters -- this is the reading order on the surface)
// ---------------------------------------------------------------------------

export const GROUPS = [
  "Identity",
  "Enforcement posture",
  "Automatic learning",
  "Application context",
  "Traffic surface",
  "Protections",
  "Content profiles",
] as const;
export type Group = (typeof GROUPS)[number];

// ---------------------------------------------------------------------------
// The section registry.
//
// Each entry carries an F5-grounded summary and, for the security-relevant
// sections, an `interpret` that reads the value the policy actually set and
// returns a { detail, severity } callout. `interpret` is only called when the
// key is PRESENT in the policy, so it never speaks to absence.
// ---------------------------------------------------------------------------

interface RegistryEntry {
  label: string;
  group: Group;
  summary: string;
  interpret?: (value: unknown) => { detail?: EngineText; severity?: Severity }; // the detail with its id (01/11/2026)
}

export const REGISTRY: Record<string, RegistryEntry> = { // exported for scripts/check-engine-catalogue.mts (2026-11-02), which compares its labels and summaries with the en pack
  // ---- Identity ----------------------------------------------------------
  name: {
    label: "Policy name",
    group: "Identity",
    summary:
      "The unique, user-given name of the policy. It cannot contain spaces or special characters beyond dot, dash, colon, and underscore.",
    interpret: (v) => ({ detail: asString(v) ? say("detail.name", `Named "${asString(v)}".`, { name: asString(v)! }) : undefined }), // pack key engine.detail.name
  },
  description: {
    label: "Description",
    group: "Identity",
    summary: "A free-text description of the policy.",
    interpret: (v) => ({ detail: asString(v) ? say("detail.description", `"${asString(v)}"`, { text: asString(v)! }) : undefined }), // pack key engine.detail.description
  },
  fullPath: {
    label: "Full path",
    group: "Identity",
    summary: "The full name of the policy including its BIG-IP partition.",
    interpret: (v) => ({ detail: asString(v) ? say("detail.fullPath", `${asString(v)}`, { path: asString(v)! }) : undefined }), // pack key engine.detail.fullPath
  },
  template: {
    label: "Base template",
    group: "Identity",
    summary:
      "The base template the policy is built from. The template supplies the default protections; everything else in the policy is an adjustment on top of it. Common templates include POLICY_TEMPLATE_RAPID_DEPLOYMENT, POLICY_TEMPLATE_FUNDAMENTAL, POLICY_TEMPLATE_COMPREHENSIVE, and POLICY_TEMPLATE_API_SECURITY.",
    interpret: (v) => {
      const name = isObject(v) ? asString(v.name) : undefined;
      return name ? { detail: say("detail.template", `Built from ${name}.`, { name }) } : {}; // pack key engine.detail.template
    },
  },

  // ---- Enforcement posture ----------------------------------------------
  enforcementMode: {
    label: "Enforcement mode",
    group: "Enforcement posture",
    summary:
      "How the system handles a request that triggers a violation. In blocking mode, traffic is blocked when it causes a violation configured for blocking. In transparent mode, traffic is not blocked even when a violation is triggered.",
    interpret: (v) => {
      const mode = asString(v);
      if (mode === "blocking")
        return { detail: say("detail.enforcement.blocking", "Blocking: requests that trigger a block-configured violation are rejected."), severity: "info" }; // pack key engine.detail.enforcement.blocking
      if (mode === "transparent")
        return {
          detail:
            say("detail.enforcement.transparent", "Transparent: this policy is monitor-only. Violations are detected and logged, but no request is blocked, regardless of per-violation block flags."), // pack key engine.detail.enforcement.transparent
          severity: "warn",
        };
      return mode ? { detail: say("detail.enforcement.other", `Set to "${mode}".`, { mode }) } : {}; // pack key engine.detail.enforcement.other
    },
  },
  enablePassiveMode: {
    label: "Passive mode",
    group: "Enforcement posture",
    summary:
      "Passive Mode lets the policy attach to a Performance L4 (FastL4) virtual server. With FastL4, traffic is analysed but is not modified in any way.",
    interpret: (v) =>
      asBool(v) === true
        ? { detail: say("detail.passive.on", "On: attached via FastL4, so traffic is inspected but cannot be modified or blocked inline."), severity: "note" }
        : {},
  },
  protocolIndependent: {
    label: "Protocol independent",
    group: "Enforcement posture",
    summary:
      "Whether the policy distinguishes HTTP from HTTPS URLs. When enabled it treats them separately; when disabled it configures URLs without a specific protocol, so the same URL is not stored twice.",
    interpret: (v) =>
      asBool(v) === true
        ? { detail: say("detail.protocolIndependent.on", "On: HTTP and HTTPS URLs are treated as distinct.") }
        : asBool(v) === false
          ? { detail: say("detail.protocolIndependent.off", "Off: URLs are configured without regard to HTTP vs HTTPS.") }
          : {},
  },
  "signature-settings": {
    label: "Signature settings",
    group: "Enforcement posture",
    summary:
      "Global settings for attack signatures, including whether new and updated signatures go into staging. Staging matches signatures in a learn-only mode without enforcing them, so you can review before they can block.",
    interpret: (v) => {
      if (!isObject(v)) return {};
      const staging = asBool(v["signatureStaging"]);
      if (staging === true)
        return {
          detail: say("detail.signatureStaging.on", "Signature staging is ON: matched signatures are logged for review but do not block yet."), // pack key engine.detail.signatureStaging.on
          severity: "note",
        };
      if (staging === false)
        return {
          detail: say("detail.signatureStaging.off", "Signature staging is OFF: signatures are enforced immediately (subject to enforcement mode)."), // pack key engine.detail.signatureStaging.off
          severity: "info",
        };
      return {};
    },
  },
  general: {
    label: "General settings",
    group: "Enforcement posture",
    summary:
      "Several advanced policy settings. Notable ones are the enforcement readiness (staging) period, whether the policy trusts the X-Forwarded-For header for the client IP, and how it masks sensitive data in requests.",
    interpret: (v) => {
      if (!isObject(v)) return {};
      const bits: string[] = [];
      let severity: Severity | undefined;
      const days = asNumber(v["enforcementReadinessPeriod"]);
      if (days !== undefined) bits.push(`new entities stay in staging for ${days} day(s) before they can be enforced`);
      const xff = asBool(v["trustXff"]);
      if (xff === true) {
        bits.push("X-Forwarded-For is trusted for the client IP, so only genuinely trusted upstream proxies should be allowed to set it");
        severity = "note";
      }
      if (!bits.length) return {}; // neither setting
      const english = `${bits.join("; ")}.`; // the sentence as it has always read
      // One sentence per combination (days, XFF, or both), never the clauses as fragments.
      const detail = days !== undefined && xff === true
        ? say("detail.general.both", english, { days: String(days) }) // pack key engine.detail.general.both
        : days !== undefined
          ? say("detail.general.days", english, { days: String(days) }) // pack key engine.detail.general.days
          : say("detail.general.xff", english); // pack key engine.detail.general.xff
      return { detail, severity };
    },
  },

  // ---- Automatic learning -----------------------------------------------
  "policy-builder": {
    label: "Policy Builder",
    group: "Automatic learning",
    summary:
      "Automatic Policy Builder settings: how the system learns from live traffic to tighten or loosen the policy, and whether it applies those changes automatically.",
    interpret: (v) => {
      if (!isObject(v)) return {};
      const auto = asBool(v["autoApply"]);
      if (auto === true) return { detail: say("detail.policyBuilder.on", "Auto-apply is ON: the Policy Builder can commit learned changes automatically."), severity: "note" }; // pack key engine.detail.policyBuilder.on
      if (auto === false) return { detail: say("detail.policyBuilder.off", "Auto-apply is OFF: learned changes are suggested, not applied automatically.") }; // pack key engine.detail.policyBuilder.off
      return {};
    },
  },
  "policy-builder-central-configuration": {
    label: "Policy Builder learning location",
    group: "Automatic learning",
    summary: "Defines where the Policy Builder learns from and related central configuration.",
  },
  "policy-builder-cookie": { label: "Policy Builder: cookies", group: "Automatic learning", summary: "Policy Builder learning behaviour for cookies." },
  "policy-builder-filetype": { label: "Policy Builder: file types", group: "Automatic learning", summary: "Policy Builder learning behaviour for file types." },
  "policy-builder-header": { label: "Policy Builder: headers", group: "Automatic learning", summary: "Policy Builder learning behaviour for headers." },
  "policy-builder-parameter": { label: "Policy Builder: parameters", group: "Automatic learning", summary: "Policy Builder learning behaviour for parameters, including dynamic parameters." },
  "policy-builder-redirection-protection": { label: "Policy Builder: redirection", group: "Automatic learning", summary: "Policy Builder learning behaviour for redirection protection." },
  "policy-builder-server-technologies": { label: "Policy Builder: server technologies", group: "Automatic learning", summary: "Policy Builder learning behaviour for server technologies." },
  "policy-builder-sessions-and-logins": { label: "Policy Builder: sessions and logins", group: "Automatic learning", summary: "Policy Builder learning behaviour for sessions and logins." },
  "policy-builder-url": { label: "Policy Builder: URLs", group: "Automatic learning", summary: "Policy Builder learning behaviour for URLs." },

  // ---- Application context -----------------------------------------------
  applicationLanguage: {
    label: "Application language",
    group: "Application context",
    summary:
      "The character encoding for the web application. It determines how the policy processes character sets. The default is auto-detect.",
    interpret: (v) => (asString(v) ? { detail: say("detail.applicationLanguage", `Encoding: ${asString(v)}.`, { encoding: asString(v)! }) } : {}), // pack key engine.detail.applicationLanguage
  },
  caseInsensitive: {
    label: "Case sensitivity",
    group: "Application context",
    summary:
      "Whether the policy treats microservice URLs, file types, URLs, and parameters as case sensitive. When enabled, the system stores these elements in lowercase.",
    interpret: (v) =>
      asBool(v) === true
        ? { detail: say("detail.caseInsensitive.on", "Case-insensitive: URLs, file types, and parameters are matched without regard to case.") }
        : asBool(v) === false
          ? { detail: say("detail.caseInsensitive.off", "Case-sensitive: element matching respects letter case.") }
          : {},
  },
  "server-technologies": {
    label: "Server technologies",
    group: "Application context",
    summary:
      "The server-side applications, frameworks, web servers, or operating systems configured in the policy, so it can adapt to the checks needed for each technology.",
    interpret: (v) => {
      const names = asArray(v)
        .map((t) => (isObject(t) ? asString(t["serverTechnologyName"]) : undefined))
        .filter(Boolean) as string[];
      return names.length ? { detail: say("detail.serverTechnologies", `Declared: ${names.join(", ")}.`, { names: names.join(", ") }) } : {}; // pack key engine.detail.serverTechnologies
    },
  },

  // ---- Traffic surface (entities) ---------------------------------------
  urls: {
    label: "URLs",
    group: "Traffic surface",
    summary: "Explicit and wildcard URL entities the policy knows about, each with its own protection settings.",
    interpret: (v) => ({ detail: countEntities(v) ? say("detail.urls", `${countEntities(v)} URL entit(y/ies) defined.`, { count: String(countEntities(v)) }) : undefined }), // pack key engine.detail.urls
  },
  parameters: {
    label: "Parameters",
    group: "Traffic surface",
    summary: "The parameters the policy permits in requests, with their data types and staging state.",
    interpret: (v) => ({ detail: countEntities(v) ? say("detail.parameters", `${countEntities(v)} parameter(s) defined.`, { count: String(countEntities(v)) }) : undefined }), // pack key engine.detail.parameters
  },
  filetypes: {
    label: "File types",
    group: "Traffic surface",
    summary:
      "File types categorize request URLs by extension. They form an allow or deny list, imply per-type length limits, and decide whether response signatures are checked for that type.",
    interpret: (v) => ({ detail: countEntities(v) ? say("detail.filetypes", `${countEntities(v)} file type(s) defined.`, { count: String(countEntities(v)) }) : undefined }), // pack key engine.detail.filetypes
  },
  methods: {
    label: "HTTP methods",
    group: "Traffic surface",
    summary: "The HTTP methods the policy permits, with any act-as mappings.",
    interpret: (v) => {
      const names = asArray(v).map((m) => (isObject(m) ? asString(m["name"]) : undefined)).filter(Boolean) as string[];
      return names.length ? { detail: say("detail.methods", `Methods: ${names.join(", ")}.`, { names: names.join(", ") }) } : {}; // pack key engine.detail.methods
    },
  },
  headers: { label: "Headers", group: "Traffic surface", summary: "Header entities the policy defines, with their per-header checks." },
  cookies: {
    label: "Cookies",
    group: "Traffic surface",
    summary:
      "Cookie entities. Allowed cookies may be changed by the client; enforced cookies may not. Per-cookie security attributes cover HttpOnly, Secure, and SameSite.",
    interpret: (v) => {
      const list = asArray(v).filter(isObject);
      if (!list.length) return {};
      // Only speak to cookies the policy explicitly enforces; flag missing hardening on those.
      const weak = list.filter((c) => {
        const enforced = asString(c["enforcementType"]) === "enforced";
        const secure = asBool(c["securedOverHttpsConnection"]);
        const httpOnly = asBool(c["accessibleOnlyThroughTheHttpProtocol"]);
        return enforced && (secure === false || httpOnly === false);
      }).length;
      const detail = `${list.length} cookie(s) defined.`;
      return weak // with weak enforced cookies, or without: one sentence each
        ? { detail: say("detail.cookiesWeak", `${detail} ${weak} enforced cookie(s) set without the Secure and/or HttpOnly attribute.`, { count: String(list.length), weak: String(weak) }), severity: "note" }
        : { detail: say("detail.cookies", detail, { count: String(list.length) }) }; // pack key engine.detail.cookies
    },
  },
  "cookie-settings": { label: "Cookie length limits", group: "Traffic surface", summary: "The maximum combined length of a cookie header name and value that the system processes." },
  "header-settings": { label: "Header length limits", group: "Traffic surface", summary: "The maximum combined length of an HTTP header name and value that the system processes." },
  "character-sets": { label: "Character sets", group: "Traffic surface", summary: "Which characters are allowed in each context (URL, parameter name and value, headers, JSON, XML, and so on)." },
  "host-names": { label: "Host names", group: "Traffic surface", summary: "The host names the policy applies to." },
  microservices: { label: "Microservices", group: "Traffic surface", summary: "Per-microservice definitions, each able to override violations, evasions, and HTTP-protocol checks." },
  "navigation-parameters": { label: "Navigation parameters", group: "Traffic surface", summary: "Parameters used to track navigation through the application." },

  // ---- Protections -------------------------------------------------------
  "blocking-settings": {
    label: "Blocking settings",
    group: "Protections",
    summary:
      "Defines the policy's block, alarm, and learn behaviour across violations, evasion techniques, HTTP-protocol compliance, and web-services security.",
    interpret: (v) => {
      if (!isObject(v)) return {};
      const violations = asArray(v["violations"]).filter(isObject);
      if (!violations.length) return {};
      const blocked = violations.filter((x) => asBool(x["block"]) === true).length;
      return { detail: say("detail.blockingSettings", `${violations.length} violation setting(s) present; ${blocked} marked to block (block enforced only in blocking mode).`, { count: String(violations.length), blocked: String(blocked) }) }; // pack key engine.detail.blockingSettings
    },
  },
  "data-guard": {
    label: "Data Guard",
    group: "Protections",
    summary:
      "Data Guard prevents responses from exposing sensitive information by masking it, covering credit-card numbers, US Social Security numbers, and custom patterns.",
    interpret: (v) => {
      if (!isObject(v)) return {};
      const enabled = asBool(v["enabled"]);
      if (enabled === true) {
        const kinds: EngineText[] = []; // the data types, each a name the page translates
        if (asBool(v["creditCardNumbers"])) kinds.push(say("dataGuard.kind.cc", "credit-card numbers")); // pack key engine.dataGuard.kind.cc
        if (asBool(v["usSocialSecurityNumbers"])) kinds.push(say("dataGuard.kind.ssn", "US SSNs")); // pack key engine.dataGuard.kind.ssn
        if (countEntities(v["customPatterns"])) kinds.push(say("dataGuard.kind.custom", "custom patterns")); // pack key engine.dataGuard.kind.custom
        const what = kinds.length ? listOf(kinds, ", ") : say("dataGuard.kind.configured", "the configured data types"); // the list, or the general phrase
        return { detail: say("detail.dataGuard.on", `On: response masking for ${kinds.length ? kinds.map((k) => k.text).join(", ") : "the configured data types"}.`, { kinds: what }), severity: "info" }; // pack key engine.detail.dataGuard.on
      }
      if (enabled === false) return { detail: say("detail.dataGuard.off", "Explicitly off in this policy: responses are not masked by Data Guard."), severity: "note" }; // pack key engine.detail.dataGuard.off
      return {};
    },
  },
  "csrf-protection": {
    label: "CSRF protection",
    group: "Protections",
    summary: "Cross-Site Request Forgery protection, including token expiration and whether it applies only over SSL.",
    interpret: (v) => {
      if (!isObject(v)) return {};
      const enabled = asBool(v["enabled"]);
      if (enabled === true) return { detail: say("detail.csrf.on", "On."), severity: "info" }; // pack key engine.detail.csrf.on
      if (enabled === false) return { detail: say("detail.csrf.off", "Explicitly off in this policy."), severity: "note" }; // pack key engine.detail.csrf.off
      return {};
    },
  },
  "csrf-urls": { label: "CSRF-protected URLs", group: "Protections", summary: "The specific URLs to which CSRF protection is applied." },
  "brute-force-attack-preventions": {
    label: "Brute-force protection",
    group: "Protections",
    summary:
      "Brute Force Protection configuration. A default entry applies to all login URLs unless a specific entry exists for a given login page.",
    interpret: (v) => ({ detail: countEntities(v) ? say("detail.bruteForce", `${countEntities(v)} brute-force configuration(s) present.`, { count: String(countEntities(v)) }) : undefined }), // pack key engine.detail.bruteForce
  },
  "disallowed-geolocations": {
    label: "Disallowed geolocations",
    group: "Protections",
    summary: "Countries that may not access the web application.",
    interpret: (v) => ({ detail: countEntities(v) ? say("detail.geolocations", `${countEntities(v)} country/countries blocked.`, { count: String(countEntities(v)) }) : undefined, severity: countEntities(v) ? "info" : undefined }), // pack key engine.detail.geolocations
  },
  "ip-intelligence": { label: "IP intelligence", group: "Protections", summary: "Reputation-based blocking by IP intelligence category (for example anonymous proxies, scanners, or known bad actors)." },
  "whitelist-ips": { label: "IP exceptions", group: "Protections", summary: "IP addresses with special treatment, such as always-trusted or always-blocked sources and per-IP policy behaviour." },
  "behavioral-enforcement": { label: "Behavioural enforcement", group: "Protections", summary: "Behavioural and DoS enforcement, including which violation classes and signature accuracy levels may block." },
  "redirection-protection": { label: "Redirection protection", group: "Protections", summary: "Open-redirect protection: the set of domains the application is allowed to redirect to." },
  "redirection-protection-domains": { label: "Redirection domains", group: "Protections", summary: "The allowed redirection domains for open-redirect protection." },
  "session-tracking": { label: "Session tracking", group: "Protections", summary: "Tracks client sessions and users to detect and act on anomalies, with block-all, delayed blocking, and logging controls." },
  "session-tracking-statuses": { label: "Session tracking statuses", group: "Protections", summary: "The current tracked-session statuses (for example blocked or under investigation)." },
  "login-pages": { label: "Login pages", group: "Protections", summary: "URLs a request must pass through to reach authenticated URLs. Used to prevent forceful browsing and to enable session tracking." },
  "login-enforcement": { label: "Login enforcement", group: "Protections", summary: "Which URLs require prior authentication, plus logout URLs." },
  "sensitive-parameters": { label: "Sensitive parameters", group: "Protections", summary: "Parameters whose values are hidden in logs and interfaces (shown as asterisks). 'password' is sensitive by default." },
  antivirus: {
    label: "Antivirus (ICAP)",
    group: "Protections",
    summary: "ICAP antivirus inspection of HTTP file uploads.",
    interpret: (v) => (isObject(v) && asBool(v["inspectHttpUploads"]) === true ? { detail: say("detail.antivirus.on", "On: HTTP file uploads are sent for antivirus inspection."), severity: "info" } : {}), // pack key engine.detail.antivirus.on
  },
  "database-protection": { label: "Database protection", group: "Protections", summary: "Database security integration for the policy." },
  "ssrf-hosts": { label: "SSRF hosts", group: "Protections", summary: "Host definitions used for Server-Side Request Forgery protection." },
  "threat-campaign-settings": { label: "Threat-campaign settings", group: "Protections", summary: "Global settings for F5 Threat Campaigns, which detect specific, curated real-world attack campaigns." },
  "threat-campaigns": { label: "Threat campaigns", group: "Protections", summary: "The individual Threat Campaign entries and their enforcement state." },
  "signature-sets": { label: "Signature sets", group: "Protections", summary: "The attack-signature sets assigned to the policy, with their block and alarm state." },
  signatures: { label: "Signature overrides", group: "Protections", summary: "Per-signature overrides applied to the policy." },
  "signature-requirements": { label: "Signature requirements", group: "Protections", summary: "Minimum attack-signature set requirements for the policy." },
  "response-pages": { label: "Response pages", group: "Protections", summary: "The blocking and login response pages returned to clients when a request or response is blocked." },
  "deception-settings": { label: "Deception settings", group: "Protections", summary: "Deception (honeypot-style) features that mislead attackers." },
  "deception-response-pages": { label: "Deception response pages", group: "Protections", summary: "Response pages used by the deception feature." },
  "disabled-action-items": { label: "Disabled action items", group: "Protections", summary: "Policy-Builder suggestions that have been explicitly dismissed." },

  // ---- Content profiles --------------------------------------------------
  "json-profiles": { label: "JSON profiles", group: "Content profiles", summary: "JSON payload profiles, with their defense attributes, metacharacter overrides, sensitive data, and validation files." },
  "xml-profiles": { label: "XML profiles", group: "Content profiles", summary: "XML payload profiles, including web-services security (WSS) configuration and SOAP methods." },
  "gwt-profiles": { label: "GWT profiles", group: "Content profiles", summary: "Google Web Toolkit payload profiles." },
  "graphql-profiles": { label: "GraphQL profiles", group: "Content profiles", summary: "GraphQL payload profiles, with their defense attributes and sensitive data." },
  "plain-text-profiles": { label: "Plain-text profiles", group: "Content profiles", summary: "Plain-text payload profiles." },
  "websocket-urls": { label: "WebSocket URLs", group: "Content profiles", summary: "WebSocket URL entities, with cross-origin enforcement and metacharacter checks." },
  "open-api-files": { label: "OpenAPI files", group: "Content profiles", summary: "OpenAPI/Swagger definition files that drive the policy's allowed URLs and parameters." },
  "json-validation-files": { label: "JSON validation files", group: "Content profiles", summary: "JSON schema files used to validate JSON payloads." },
  "xml-validation-files": { label: "XML validation files", group: "Content profiles", summary: "XSD/WSDL files used to validate XML payloads." },
  webhooks: { label: "Webhooks", group: "Content profiles", summary: "Webhook targets the policy notifies on events." },
};

// ---------------------------------------------------------------------------
// The parse entry point
// ---------------------------------------------------------------------------

const TEMPLATE_NOTE =
  "A declarative WAF policy lists only its adjustments on top of a base template. Anything not shown here keeps the template's default, so an absent section means \"template default\", not \"disabled\".";

/**
 * parseAwafPolicy - decode a BIG-IP Advanced WAF declarative policy.
 * Pure and total: any input yields a result object, never a throw.
 * The API's reading (and the golden vectors'): every sentence in English, exactly as before 01/11/2026.
 */
/** Where a JSON syntax error sits in the pasted text: 1-based line and column (the page's, not part of the API's reading). */
export interface JsonErrorLocation {
  /** 1-based line in the pasted text. */
  line: number;
  /** 1-based column in that line. */
  column: number;
}

/**
 * Where the JSON syntax error behind a parseError sits in the text as pasted (2026-11-02). The browser's message is
 * read first: a 0-based "position N" (V8), else "line L column C" (Firefox); both count in the trimmed text the engine
 * parsed, so the leading white space trim() removed is added back. When the message carries neither (Safari, and V8
 * for an unexpected token), the site's own position-tracking parser (json-formatter) finds the first error. Pure; the
 * API's reading does not include it.
 * @param input the text as pasted
 * @param message the browser's JSON.parse message (parseError)
 * @returns the line and column, or null when no position can be established
 */
export function jsonErrorLocation(input: string, message: string): JsonErrorLocation | null {
  const raw = input ?? ""; // the text as pasted
  const lead = raw.length - raw.trimStart().length; // what trim() removed before the text JSON.parse saw
  const text = raw.trim(); // the text JSON.parse saw
  const pos = /\bposition (\d+)/i.exec(message); // V8: a 0-based offset
  if (pos) return lineColumnAt(raw, lead + Math.min(Number(pos[1]), text.length)); // placed by the browser
  const lc = /\bline (\d+) column (\d+)/i.exec(message); // Firefox: 1-based line and column
  if (lc) { // placed by the browser, in the trimmed text
    let offset = 0; // the start of the named line
    for (let line = 1; line < Number(lc[1]) && offset < text.length; line++) { // walk to it
      const nl = text.indexOf("\n", offset); // the end of this line
      if (nl < 0) { offset = text.length; break; } // fewer lines than named: the end
      offset = nl + 1; // the next line's start
    } // walked
    return lineColumnAt(raw, lead + Math.min(offset + Number(lc[2]) - 1, text.length)); // that column of it
  } // line and column
  try { parseJson(raw); } catch (e) { if (e instanceof JsonParseError) return { line: e.line, column: e.column }; } // the site's own scan of the text as pasted
  return null; // no position known (the two parsers disagree, or the text is too deep to scan)
} // jsonErrorLocation

/**
 * The 1-based line and column of an offset (lines end at "\n").
 * @param text the text
 * @param offset the 0-based offset
 * @returns its line and column
 */
function lineColumnAt(text: string, offset: number): JsonErrorLocation {
  let line = 1; // counted from 1
  let start = 0; // where the current line starts
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === "\n") { line++; start = i + 1; } // each line end before the offset
  return { line, column: offset - start + 1 }; // 1-based column
} // lineColumnAt

export function parseAwafPolicy(input: string): AwafPolicyParse {
  return plainText(parseAwafPolicyLocalisable(input)); // the same reading, sentences as their English
} // parseAwafPolicy

/**
 * The page's reading: the same as parseAwafPolicy(), with every sentence an EngineText (id, English, values).
 * @param input the pasted policy JSON
 * @returns the reading
 */
export function parseAwafPolicyLocalisable(input: string): AwafPolicyParse<EngineText> {
  const empty: AwafPolicyParse<EngineText> = {
    recognized: false,
    sectionCount: 0,
    sections: [],
    securityFlags: [],
    unknownKeys: [],
    templateNote: say("templateNote", TEMPLATE_NOTE), // the template-delta caveat
  };

  const trimmed = (input ?? "").trim();
  if (!trimmed) return { ...empty, unrecognizedReason: say("reason.empty", "No input. Paste a declarative WAF policy JSON.") }; // pack key engine.reason.empty

  // 1) Parse JSON (bounded by JSON.parse; never evaluates the content).
  let root: unknown;
  try {
    root = JSON.parse(trimmed);
  } catch (e) {
    return { ...empty, parseError: e instanceof Error ? e.message : "Invalid JSON." };
  }

  // 2) Locate the policy object. Accept either { "policy": {...} } (the import
  //    shape) or a bare policy object that carries recognizable keys.
  let policy: Record<string, unknown> | undefined;
  if (isObject(root) && isObject(root["policy"])) {
    policy = root["policy"] as Record<string, unknown>;
  } else if (isObject(root)) {
    policy = root;
  }
  if (!policy) {
    return { ...empty, unrecognizedReason: say("reason.notObject", "This JSON is not an object, so it is not a WAF policy.") }; // pack key engine.reason.notObject
  }

  // 3) Confirm it looks like a WAF policy: at least one registry key present,
  //    or the tell-tale name/template/enforcementMode trio.
  const presentKeys = Object.keys(policy);
  const known = presentKeys.filter((k) => k in REGISTRY);
  const hasTell = ["enforcementMode", "template", "blocking-settings", "signature-settings", "policy-builder"].some((k) => k in policy!);
  if (known.length === 0 && !hasTell) {
    return {
      ...empty,
      unrecognizedReason:
        say("reason.noSections", "This JSON has no recognisable WAF policy sections. Expected a declarative policy like { \"policy\": { \"enforcementMode\": ..., \"template\": ... } }."), // pack key engine.reason.noSections
    };
  }

  // 4) Build the section views, ordered by group then registry order.
  const groupOrder = new Map<string, number>(GROUPS.map((g, i) => [g, i]));
  const registryOrder = new Map<string, number>(Object.keys(REGISTRY).map((k, i) => [k, i]));

  const sections: SectionView<EngineText>[] = known
    .map((key) => {
      const entry = REGISTRY[key];
      const { detail, severity } = entry.interpret ? entry.interpret(policy![key]) : {};
      return { key, label: entry.label, group: entry.group, summary: entry.summary, detail, severity };
    })
    .sort((a, b) => {
      const g = (groupOrder.get(a.group) ?? 99) - (groupOrder.get(b.group) ?? 99);
      return g !== 0 ? g : (registryOrder.get(a.key) ?? 99) - (registryOrder.get(b.key) ?? 99);
    });

  // 5) Cross-cutting security flags, each derived from an explicit value.
  const flags: SecurityFlag<EngineText>[] = []; // each message with its id
  const enforcement = asString(policy["enforcementMode"]);
  if (enforcement === "transparent")
    flags.push({ severity: "warn", message: say("flag.transparent", "Policy is in transparent (monitor-only) mode: nothing is blocked, even violations flagged to block.") }); // pack key engine.flag.transparent
  if (asBool(policy["enablePassiveMode"]) === true)
    flags.push({ severity: "note", message: say("flag.passive", "Passive/FastL4 mode: the policy inspects but cannot block or modify traffic inline.") }); // pack key engine.flag.passive
  const sigStaging = isObject(policy["signature-settings"]) ? asBool((policy["signature-settings"] as Record<string, unknown>)["signatureStaging"]) : undefined;
  if (sigStaging === true)
    flags.push({ severity: "note", message: say("flag.staging", "Attack signatures are in staging: matched signatures are logged but do not block yet.") }); // pack key engine.flag.staging
  if (isObject(policy["general"]) && asBool((policy["general"] as Record<string, unknown>)["trustXff"]) === true)
    flags.push({ severity: "note", message: say("flag.xff", "The policy trusts X-Forwarded-For for the client IP; make sure only trusted proxies can set it.") }); // pack key engine.flag.xff
  const dg = policy["data-guard"];
  if (isObject(dg) && asBool(dg["enabled"]) === false)
    flags.push({ severity: "note", message: say("flag.dataGuardOff", "Data Guard is explicitly disabled: sensitive data in responses is not masked by this policy.") }); // pack key engine.flag.dataGuardOff

  const unknownKeys = presentKeys.filter((k) => !(k in REGISTRY));

  return {
    recognized: true,
    policyName: asString(policy["name"]),
    templateName: isObject(policy["template"]) ? asString((policy["template"] as Record<string, unknown>)["name"]) : undefined,
    enforcement,
    sectionCount: known.length,
    sections,
    securityFlags: flags,
    unknownKeys,
    templateNote: say("templateNote", TEMPLATE_NOTE), // the template-delta caveat
  };
}
