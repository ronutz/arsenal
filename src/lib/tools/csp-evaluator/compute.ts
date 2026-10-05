// ============================================================================
// src/lib/tools/csp-evaluator/compute.ts
// ----------------------------------------------------------------------------
// THE CSP EVALUATOR (engine). Paste a Content-Security-Policy (the header value,
// the whole header line, a Report-Only header, a <meta> element, or several of
// them) and out comes each policy parsed the way CSP Level 3 parses it (2.2.1:
// split on semicolons, names lower-cased, duplicates ignored), every directive
// named and classified, every source expression read against the grammar of
// 2.3.1 (keywords, nonces, hashes, schemes, hosts with their wildcards, ports
// and paths), the EFFECTIVE policy per fetch destination through the fallback
// list of 6.8.3, and a graded list of findings, each tied to a sentence of the
// specification: 'unsafe-inline' and 'unsafe-eval', wildcard and data: and
// http: sources, missing object-src / base-uri / frame-ancestors, nonce and
// hash gaps, 'strict-dynamic' without a nonce, deprecated and unknown
// directives, directives ignored in <meta> or in Report-Only, and whether the
// policy meets the specification's own Strict CSP (8.5).
//
// Decode and grade only, offline: nothing is fetched, no page is loaded.
//
// Sources (read 2026-10-05): Content Security Policy Level 3, W3C Working
// Draft 16 September 2026 (sections 2.2.1, 2.3, 2.3.1, 3.1 to 3.3, 6.1 to 6.8,
// 7.1, 8.1 to 8.5); Mixed Content CRD 23 February 2023 (block-all-mixed-content
// obsolete); Upgrade Insecure Requests CR 8 October 2015; Trusted Types WD
// 23 June 2026 (require-trusted-types-for, trusted-types). The set of checks
// follows the model of Google's csp-evaluator (Apache-2.0), re-implemented from
// the specification's sentences; no code or host lists were copied.
// ============================================================================

/** The input. */
export interface CspInput {
  /** The policy text: a header value, one or more header lines, a <meta> element, or several policies on separate lines. */
  policy: string;
}

/** The size ceiling (characters). */
export const POLICY_MAX_CHARS = 20000;

/** How a policy reached us. */
export type Delivery = "header" | "report-only" | "meta" | "text";

/** The kinds of source expression. */
export type SourceKind =
  // 'none'
  | "none"
  // 'self'
  | "self"
  // Another quoted keyword of 2.3.1 (or the Trusted Types / webrtc keywords where the directive takes them).
  | "keyword"
  // 'nonce-...'
  | "nonce"
  // 'sha256-...' / 'sha384-...' / 'sha512-...'
  | "hash"
  // "https:" and other scheme-source expressions.
  | "scheme"
  // host-source: [scheme://]host[:port][/path], including "*" and "*.example.com".
  | "host"
  // A plain token where the directive takes one (report-to group, sandbox flags, trusted-types policy names).
  | "token"
  // A keyword written without its quotes: parsed by the grammar as a host named "unsafe-inline".
  | "unquoted-keyword"
  // A directive name sitting in a value: a semicolon is missing before it.
  | "directive-name"
  // Anything the grammar does not accept.
  | "invalid";

/** One source expression, read. */
export interface SourceRow {
  /** As written. */
  raw: string;
  /** What it is. */
  kind: SourceKind;
  /** The keyword without quotes, for keywords. */
  keyword: string | null;
  /** The scheme, for scheme-source and for host-source with a scheme. */
  scheme: string | null;
  /** The host-part, for host-source. */
  host: string | null;
  /** The port-part, for host-source. */
  port: string | null;
  /** The path-part, for host-source. */
  path: string | null;
  /** True for "*" and for "*.example.com" hosts. */
  wildcardHost: boolean;
  /** The nonce or hash value's length in characters, for nonces and hashes. */
  valueLength: number | null;
  /** The hash algorithm, for hashes. */
  algorithm: string | null;
}

/** Where a directive is defined. */
export type DirectiveStatus =
  // Defined by CSP Level 3.
  | "standard"
  // Defined by CSP Level 3 but deprecated there (report-uri).
  | "deprecated"
  // Defined by another W3C specification that extends CSP.
  | "extension"
  // Once in a CSP draft or spec, now obsolete or removed (block-all-mixed-content, plugin-types, ...).
  | "obsolete"
  // Not a directive this tool knows.
  | "unknown";

/** The category of a directive. */
export type DirectiveCategory = "fetch" | "document" | "navigation" | "reporting" | "other" | "extension" | "obsolete" | "unknown";

/** One directive of a policy. */
export interface DirectiveRow {
  /** The name, lower-cased. */
  name: string;
  /** As written (the original case). */
  rawName: string;
  /** Where it is defined. */
  status: DirectiveStatus;
  /** Its category. */
  category: DirectiveCategory;
  /** The value, token by token. */
  values: SourceRow[];
  /** True when the directive is a later duplicate the parser ignores (2.2.1). */
  ignoredDuplicate: boolean;
  /** True when the directive is ignored for this delivery (frame-ancestors, report-uri, sandbox in meta; sandbox in Report-Only). */
  ignoredHere: boolean;
}

/** One fetch destination (or document/navigation directive) with the source list that governs it. */
export interface EffectiveRow {
  /** The directive whose behaviour is described. */
  directive: string;
  /** The directive actually supplying the list (itself, a fallback, or null when nothing restricts it). */
  from: string | null;
  /** The source expressions in force, or null when unrestricted. */
  sources: string[] | null;
}

/** A finding. */
export interface Finding {
  /** The rule id. */
  rule: string;
  /** How serious: high, medium, low, info (and "good" for things done right). */
  severity: "high" | "medium" | "low" | "info" | "good";
  /** The directive concerned, or null for the policy as a whole. */
  directive: string | null;
  /** The source expression concerned, or null. */
  value: string | null;
  /** Message parameters. */
  params?: Record<string, string | number>;
}

/** One policy, evaluated. */
export interface PolicyReport {
  /** Index, 1-based. */
  index: number;
  /** How it was delivered (from the paste's shape). */
  delivery: Delivery;
  /** The serialized policy as read (header name and meta markup stripped). */
  serialized: string;
  /** Its directives in order. */
  directives: DirectiveRow[];
  /** The effective source lists. */
  effective: EffectiveRow[];
  /** The findings, most serious first. */
  findings: Finding[];
  /** The grade: strict (meets 8.5), good, fair, weak, none (nothing restricts script). */
  grade: "strict" | "good" | "fair" | "weak" | "none";
  /** What the policy does for scripts: how inline script is treated, whether eval is allowed, whether 'strict-dynamic' is on. */
  script: { inline: "allowed" | "nonce-hash" | "blocked" | "unrestricted"; eval: boolean; wasm: boolean; strictDynamic: boolean; nonces: number; hashes: number };
  /** Counts by severity. */
  counts: { high: number; medium: number; low: number; info: number; good: number };
}

/** The result. */
export interface CspResult {
  /** The policies found in the paste. */
  policies: PolicyReport[];
  /** The number of policies. */
  count: number;
}

/** The fetch directives of 6.1 plus worker-src (6.2.2). */
export const FETCH_DIRECTIVES = new Set(["child-src", "connect-src", "default-src", "font-src", "frame-src", "img-src", "manifest-src", "media-src", "object-src", "script-src", "script-src-elem", "script-src-attr", "style-src", "style-src-elem", "style-src-attr", "worker-src"]);

/** Every directive the tool knows, with status and category. */
export const DIRECTIVES: Readonly<Record<string, { status: DirectiveStatus; category: DirectiveCategory }>> = Object.freeze({
  // 6.1 fetch directives.
  "child-src": { status: "standard", category: "fetch" },
  "connect-src": { status: "standard", category: "fetch" },
  "default-src": { status: "standard", category: "fetch" },
  "font-src": { status: "standard", category: "fetch" },
  "frame-src": { status: "standard", category: "fetch" },
  "img-src": { status: "standard", category: "fetch" },
  "manifest-src": { status: "standard", category: "fetch" },
  "media-src": { status: "standard", category: "fetch" },
  "object-src": { status: "standard", category: "fetch" },
  "script-src": { status: "standard", category: "fetch" },
  "script-src-elem": { status: "standard", category: "fetch" },
  "script-src-attr": { status: "standard", category: "fetch" },
  "style-src": { status: "standard", category: "fetch" },
  "style-src-elem": { status: "standard", category: "fetch" },
  "style-src-attr": { status: "standard", category: "fetch" },
  // 6.2 other directives.
  "webrtc": { status: "standard", category: "other" },
  "worker-src": { status: "standard", category: "fetch" },
  // 6.3 document directives.
  "base-uri": { status: "standard", category: "document" },
  "sandbox": { status: "standard", category: "document" },
  // 6.4 navigation directives.
  "form-action": { status: "standard", category: "navigation" },
  "frame-ancestors": { status: "standard", category: "navigation" },
  // 6.5 reporting directives.
  "report-uri": { status: "deprecated", category: "reporting" },
  "report-to": { status: "standard", category: "reporting" },
  // 6.6 defined elsewhere.
  "upgrade-insecure-requests": { status: "extension", category: "extension" },
  "require-trusted-types-for": { status: "extension", category: "extension" },
  "trusted-types": { status: "extension", category: "extension" },
  // Obsolete, removed or never standardised.
  "block-all-mixed-content": { status: "obsolete", category: "obsolete" },
  "plugin-types": { status: "obsolete", category: "obsolete" },
  "referrer": { status: "obsolete", category: "obsolete" },
  "reflected-xss": { status: "obsolete", category: "obsolete" },
  "disown-opener": { status: "obsolete", category: "obsolete" },
  "navigate-to": { status: "obsolete", category: "obsolete" },
  "prefetch-src": { status: "obsolete", category: "obsolete" },
  "require-sri-for": { status: "obsolete", category: "obsolete" },
});

/** The keyword-source expressions of 2.3.1 (without quotes). */
export const KEYWORDS = new Set(["self", "unsafe-inline", "unsafe-eval", "strict-dynamic", "unsafe-hashes", "report-sample", "unsafe-allow-redirects", "wasm-unsafe-eval", "trusted-types-eval", "report-sha256", "report-sha384", "report-sha512", "unsafe-webtransport-hashes"]);

/** Keywords other specifications accept in their directives. */
const OTHER_KEYWORDS: Readonly<Record<string, Set<string>>> = Object.freeze({
  // webrtc 'allow' / 'block' (6.2.1).
  "webrtc": new Set(["allow", "block"]),
  // require-trusted-types-for 'script' (Trusted Types 4.2.1).
  "require-trusted-types-for": new Set(["script"]),
  // trusted-types 'allow-duplicates' / 'none' (Trusted Types 4.2.2).
  "trusted-types": new Set(["allow-duplicates", "none"]),
});

/** The iframe sandbox keywords of the HTML Standard (the values a sandbox directive may carry, 6.3.2). */
export const SANDBOX_KEYWORDS = new Set(["allow-downloads", "allow-forms", "allow-modals", "allow-orientation-lock", "allow-pointer-lock", "allow-popups", "allow-popups-to-escape-sandbox", "allow-presentation", "allow-same-origin", "allow-scripts", "allow-top-navigation", "allow-top-navigation-by-user-activation", "allow-top-navigation-to-custom-protocols"]);

/** Directives whose value is tokens, not a source list. */
const TOKEN_DIRECTIVES = new Set(["sandbox", "report-to", "report-uri", "trusted-types", "require-trusted-types-for", "webrtc", "upgrade-insecure-requests", "block-all-mixed-content", "plugin-types", "referrer", "reflected-xss", "disown-opener", "require-sri-for"]);

/** The fallback lists of 6.8.3 (most relevant first, the directive itself included). */
export const FALLBACK: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "script-src-elem": ["script-src-elem", "script-src", "default-src"],
  "script-src-attr": ["script-src-attr", "script-src", "default-src"],
  "style-src-elem": ["style-src-elem", "style-src", "default-src"],
  "style-src-attr": ["style-src-attr", "style-src", "default-src"],
  "worker-src": ["worker-src", "child-src", "script-src", "default-src"],
  "connect-src": ["connect-src", "default-src"],
  "manifest-src": ["manifest-src", "default-src"],
  "object-src": ["object-src", "default-src"],
  "frame-src": ["frame-src", "child-src", "default-src"],
  "media-src": ["media-src", "default-src"],
  "font-src": ["font-src", "default-src"],
  "img-src": ["img-src", "default-src"],
  // No fallback for these (6.3, 6.4): listed so the effective table shows them.
  "base-uri": ["base-uri"],
  "form-action": ["form-action"],
  "frame-ancestors": ["frame-ancestors"],
});

/** Directives ignored when the policy comes in a <meta> element (3.3). */
const IGNORED_IN_META = new Set(["frame-ancestors", "report-uri", "sandbox"]);

/** The rules, in the order the findings are grouped. */
export const RULES = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15", "C16", "C17", "C18", "C19", "C20", "C21", "C22", "C23", "C24", "C25", "C26"] as const;

/** The severity order for sorting. */
const SEV_ORDER: Record<Finding["severity"], number> = { high: 0, medium: 1, low: 2, info: 3, good: 4 };

/** Read one source expression against the grammar of 2.3.1. */
export function readSource(raw: string, directive: string): SourceRow {
  // The empty row to fill.
  const row: SourceRow = { raw, kind: "invalid", keyword: null, scheme: null, host: null, port: null, path: null, wildcardHost: false, valueLength: null, algorithm: null };
  // A directive name sitting in a value: a missing semicolon.
  if (raw.toLowerCase() in DIRECTIVES) { row.kind = "directive-name"; return row; }
  // Quoted expressions.
  const q = /^'(.*)'$/.exec(raw);
  if (q) {
    // The inside, lower-cased for keywords.
    const inner = q[1];
    const lower = inner.toLowerCase();
    // 'none'.
    if (lower === "none") { row.kind = "none"; row.keyword = "none"; return row; }
    // 'self'.
    if (lower === "self") { row.kind = "self"; row.keyword = "self"; return row; }
    // A nonce.
    const n = /^nonce-([A-Za-z0-9+/_-]+={0,2})$/.exec(inner);
    if (n) { row.kind = "nonce"; row.valueLength = n[1].length; return row; }
    // A hash.
    const h = /^(sha256|sha384|sha512)-([A-Za-z0-9+/_-]+={0,2})$/i.exec(inner);
    if (h) { row.kind = "hash"; row.algorithm = h[1].toLowerCase(); row.valueLength = h[2].length; return row; }
    // A keyword of 2.3.1.
    if (KEYWORDS.has(lower)) { row.kind = "keyword"; row.keyword = lower; return row; }
    // A keyword another specification gives this directive.
    if (OTHER_KEYWORDS[directive]?.has(lower)) { row.kind = "keyword"; row.keyword = lower; return row; }
    // Quoted but unknown.
    return row;
  }
  // Unquoted keywords: the grammar reads them as hosts, which is the classic mistake.
  if (KEYWORDS.has(raw.toLowerCase()) || raw.toLowerCase() === "none") { row.kind = "unquoted-keyword"; row.keyword = raw.toLowerCase(); return row; }
  // Token directives take plain tokens.
  if (TOKEN_DIRECTIVES.has(directive)) { row.kind = "token"; return row; }
  // scheme-source: "https:" (a scheme per RFC 3986 3.1, then a colon, nothing else).
  const s = /^([A-Za-z][A-Za-z0-9+.-]*):$/.exec(raw);
  if (s) { row.kind = "scheme"; row.scheme = s[1].toLowerCase(); return row; }
  // host-source: [scheme://] host-part [:port] [path].
  const m = /^(?:([A-Za-z][A-Za-z0-9+.-]*):\/\/)?(\*|(?:\*\.)?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.?)(?::(\d+|\*))?(\/[^;,\s]*)?$/.exec(raw);
  if (m) {
    // Fill.
    row.kind = "host";
    row.scheme = m[1] ? m[1].toLowerCase() : null;
    row.host = m[2];
    row.port = m[3] ?? null;
    row.path = m[4] ?? null;
    row.wildcardHost = m[2] === "*" || m[2].startsWith("*.");
    return row;
  }
  // Nothing matched.
  return row;
}

/** Whether a host-part is an IP address (which the matching algorithm never matches except 127.0.0.1). */
function looksLikeIp(host: string): boolean {
  // Four decimal octets.
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/** Split the paste into policies with their delivery. */
export function splitPolicies(text: string): { delivery: Delivery; serialized: string }[] {
  // The pieces.
  const out: { delivery: Delivery; serialized: string }[] = [];
  // meta elements anywhere in the text.
  const metaRe = /<meta\b[^>]*http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi;
  // Pull them out first.
  let rest = text;
  for (const m of text.matchAll(metaRe)) {
    // The content attribute.
    const c = /content\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[0]);
    // Record.
    if (c) out.push({ delivery: "meta", serialized: (c[1] ?? c[2] ?? c[3] ?? "").trim() });
    // Remove from the rest.
    rest = rest.replace(m[0], "\n");
  }
  // Then lines.
  for (const line of rest.split(/\r\n|\r|\n/)) {
    // Skip blanks.
    const t = line.trim();
    if (t === "") continue;
    // A header line.
    const h = /^(content-security-policy(-report-only)?)\s*:\s*(.*)$/i.exec(t);
    // The delivery and the value.
    const delivery: Delivery = h ? (h[2] ? "report-only" : "header") : "text";
    const value = h ? h[3] : t;
    // The header is a # list: commas separate policies (values cannot contain commas, 2.3).
    for (const part of value.split(",")) {
      // Skip empty members.
      if (part.trim() === "") continue;
      // One policy.
      out.push({ delivery, serialized: part.trim() });
    }
  }
  // Done.
  return out;
}

/** Parse one serialized policy per 2.2.1. */
export function parsePolicy(serialized: string, delivery: Delivery): DirectiveRow[] {
  // The directives.
  const rows: DirectiveRow[] = [];
  // Names seen.
  const seen = new Set<string>();
  // Strictly split on semicolons.
  for (const token0 of serialized.split(";")) {
    // Strip.
    const token = token0.trim();
    // Empty tokens are skipped.
    if (token === "") continue;
    // The name: up to whitespace, lower-cased.
    const sp = token.search(/\s/);
    const rawName = sp < 0 ? token : token.slice(0, sp);
    const name = rawName.toLowerCase();
    // The value tokens.
    const valueText = sp < 0 ? "" : token.slice(sp).trim();
    const values = valueText === "" ? [] : valueText.split(/\s+/).map((v) => readSource(v, name));
    // Known?
    const def = DIRECTIVES[name];
    // The row.
    rows.push({
      name,
      rawName,
      status: def ? def.status : "unknown",
      category: def ? def.category : "unknown",
      values,
      ignoredDuplicate: seen.has(name),
      ignoredHere: (delivery === "meta" && IGNORED_IN_META.has(name)) || (delivery === "report-only" && name === "sandbox"),
    });
    // Remember.
    seen.add(name);
  }
  // Done.
  return rows;
}

/** The effective rows per 6.8.3. */
function effectiveRows(active: Map<string, DirectiveRow>): EffectiveRow[] {
  // Each directive with a fallback list.
  return Object.entries(FALLBACK).map(([directive, chain]) => {
    // The first present directive of the chain.
    const from = chain.find((d) => active.has(d)) ?? null;
    // Its sources.
    return { directive, from, sources: from ? (active.get(from) as DirectiveRow).values.map((v) => v.raw) : null };
  });
}

/** run: the engine. */
export function run(input: CspInput): CspResult {
  // The text.
  const text = input.policy;
  // The ceiling.
  if (text.length > POLICY_MAX_CHARS) throw new Error(`The policy text is ${text.length.toLocaleString("en")} characters; the ceiling is ${POLICY_MAX_CHARS.toLocaleString("en")}.`);
  // The policies.
  const pieces = splitPolicies(text);
  // Evaluate each.
  const policies = pieces.map((piece, i) => evaluatePolicy(piece.serialized, piece.delivery, i + 1));
  // Done.
  return { policies, count: policies.length };
}

/** Evaluate one policy. */
export function evaluatePolicy(serialized: string, delivery: Delivery, index: number): PolicyReport {
  // Parse.
  const directives = parsePolicy(serialized, delivery);
  // The directives in force: not duplicates, not ignored here.
  const active = new Map<string, DirectiveRow>();
  for (const d of directives) if (!d.ignoredDuplicate && !d.ignoredHere) active.set(d.name, d);
  // The effective table.
  const effective = effectiveRows(active);
  // The findings.
  const findings: Finding[] = [];
  // A helper.
  const add = (rule: string, severity: Finding["severity"], directive: string | null, value: string | null, params?: Record<string, string | number>) => findings.push({ rule, severity, directive, value, params });

  // --- Parsing findings. ---
  for (const d of directives) {
    // C1: duplicate directive ignored (2.2.1).
    if (d.ignoredDuplicate) add("C1", "medium", d.name, null);
    // C2: unknown directive.
    if (d.status === "unknown") add("C2", "medium", d.name, null);
    // C3: obsolete, removed or never standardised directive.
    if (d.status === "obsolete") add("C3", d.name === "block-all-mixed-content" ? "low" : "medium", d.name, null, { which: d.name });
    // C4: deprecated report-uri (6.5.1).
    if (d.name === "report-uri" && !d.ignoredDuplicate) add("C4", active.has("report-to") ? "low" : "info", d.name, null, { withReportTo: active.has("report-to") ? "yes" : "no" });
    // C5: ignored for this delivery (3.3; 6.3.2).
    if (d.ignoredHere) add("C5", "high", d.name, null, { delivery });
    // Per value.
    for (const v of d.values) {
      // C6: a directive name in a value: a missing semicolon.
      if (v.kind === "directive-name") add("C6", "high", d.name, v.raw);
      // C7: a keyword without quotes becomes a host name.
      if (v.kind === "unquoted-keyword") add("C7", "high", d.name, v.raw, { keyword: v.keyword ?? "" });
      // C8: an expression the grammar does not accept.
      if (v.kind === "invalid") add("C8", "medium", d.name, v.raw);
    }
    // C9: 'none' beside other expressions (the grammar allows 'none' only alone; beside others it matches nothing).
    if (d.values.some((v) => v.kind === "none") && d.values.length > 1 && !d.values.some((v) => v.kind === "directive-name")) add("C9", "low", d.name, "'none'");
    // C10: an empty source-list directive (allowed, equals 'none' for fetch directives: "The value MAY be empty").
    if (!TOKEN_DIRECTIVES.has(d.name) && d.values.length === 0 && d.status !== "unknown") add("C10", "info", d.name, null);
    // C11: webrtc, upgrade-insecure-requests, require-trusted-types-for values.
    if (d.name === "webrtc" && !(d.values.length === 1 && d.values[0].kind === "keyword")) add("C11", "medium", d.name, d.values.map((v) => v.raw).join(" ") || null, { which: "webrtc" });
    if (d.name === "upgrade-insecure-requests" && d.values.length > 0) add("C11", "low", d.name, d.values.map((v) => v.raw).join(" "), { which: "upgrade-insecure-requests" });
    if (d.name === "require-trusted-types-for" && !d.values.some((v) => v.kind === "keyword" && v.keyword === "script")) add("C11", "medium", d.name, d.values.map((v) => v.raw).join(" ") || null, { which: "require-trusted-types-for" });
    if (d.name === "sandbox") for (const v of d.values) if (!SANDBOX_KEYWORDS.has(v.raw.toLowerCase())) add("C11", "medium", d.name, v.raw, { which: "sandbox" });
    // C12: frame-ancestors with expressions its grammar does not take (nonces, hashes, keywords other than 'self').
    if (d.name === "frame-ancestors") for (const v of d.values) if (v.kind === "nonce" || v.kind === "hash" || (v.kind === "keyword" && v.keyword !== "self")) add("C12", "medium", d.name, v.raw);
  }

  // --- The script picture. ---
  // The list governing script elements (script-src-elem → script-src → default-src).
  const elemFrom = FALLBACK["script-src-elem"].find((n) => active.has(n)) ?? null;
  const elem = elemFrom ? (active.get(elemFrom) as DirectiveRow).values : null;
  // The list governing eval: script-src or default-src ("script-src-attr and script-src-elem are not used when performing this check").
  const evalFrom = ["script-src", "default-src"].find((n) => active.has(n)) ?? null;
  const evalList = evalFrom ? (active.get(evalFrom) as DirectiveRow).values : null;
  // Counts.
  const nonces = elem ? elem.filter((v) => v.kind === "nonce").length : 0;
  const hashes = elem ? elem.filter((v) => v.kind === "hash").length : 0;
  const strictDynamic = elem ? elem.some((v) => v.kind === "keyword" && v.keyword === "strict-dynamic") : false;
  const unsafeInline = elem ? elem.some((v) => v.kind === "keyword" && v.keyword === "unsafe-inline") : false;
  // Inline script (6.7.3.2): unrestricted when no list; allowed when 'unsafe-inline' is not overridden by a nonce, hash or 'strict-dynamic'; nonce-hash when those exist; blocked otherwise.
  const inline: PolicyReport["script"]["inline"] = elem === null ? "unrestricted" : unsafeInline && nonces === 0 && hashes === 0 && !strictDynamic ? "allowed" : nonces > 0 || hashes > 0 ? "nonce-hash" : "blocked";
  // eval and WebAssembly.
  const evalAllowed = evalList === null ? true : evalList.some((v) => v.kind === "keyword" && (v.keyword === "unsafe-eval" || v.keyword === "trusted-types-eval"));
  const wasmAllowed = evalList === null ? true : evalList.some((v) => v.kind === "keyword" && (v.keyword === "unsafe-eval" || v.keyword === "wasm-unsafe-eval"));
  const script: PolicyReport["script"] = { inline, eval: evalAllowed, wasm: wasmAllowed, strictDynamic, nonces, hashes };

  // --- Security findings. ---
  // The three XSS-relevant effective lists: script elements, plugins, base.
  const objectFrom = FALLBACK["object-src"].find((n) => active.has(n)) ?? null;
  const object = objectFrom ? (active.get(objectFrom) as DirectiveRow).values : null;
  const base = active.get("base-uri")?.values ?? null;
  // C13: nothing restricts script.
  if (elem === null) add("C13", "high", null, null);
  else {
    // C14: 'unsafe-inline' for script, with or without a nonce/hash override.
    if (unsafeInline) {
      if (nonces > 0 || hashes > 0 || strictDynamic) add("C14", "info", elemFrom, "'unsafe-inline'", { overridden: "yes" });
      else add("C14", "high", elemFrom, "'unsafe-inline'", { overridden: "no" });
    }
    // C16: 'strict-dynamic' without any nonce or hash: nothing parser-inserted can run.
    if (strictDynamic && nonces === 0 && hashes === 0) add("C16", "high", elemFrom, "'strict-dynamic'");
    // C17: plain schemes and wildcards in the script list (unless 'strict-dynamic' makes them ignored).
    for (const v of elem) {
      if (v.kind === "scheme" && ["data", "http", "https", "blob", "filesystem"].includes(v.scheme ?? "")) add("C17", strictDynamic ? "info" : v.scheme === "blob" || v.scheme === "filesystem" ? "medium" : "high", elemFrom, v.raw, { what: "scheme", scheme: v.scheme ?? "", sd: strictDynamic ? "yes" : "no" });
      if (v.kind === "host" && v.host === "*" ) add("C17", strictDynamic ? "info" : "high", elemFrom, v.raw, { what: "star", scheme: "", sd: strictDynamic ? "yes" : "no" });
    }
    // C18: a host allowlist for script without nonces or hashes: the bypass class 8.2 and 8.5 describe.
    const hosts = elem.filter((v) => v.kind === "host" && v.host !== "*");
    if (hosts.length > 0 && nonces === 0 && hashes === 0 && !strictDynamic) add("C18", "medium", elemFrom, hosts.map((v) => v.raw).slice(0, 4).join(" "), { n: hosts.length });
    // C19: 'self' for script: fine unless the origin serves JSONP, AngularJS or user uploads (the same bypass class, lower).
    if (elem.some((v) => v.kind === "self") && nonces === 0 && hashes === 0 && !strictDynamic) add("C19", "low", elemFrom, "'self'");
  }
  // C15: 'unsafe-eval' (and 'wasm-unsafe-eval') for script.
  if (evalList) for (const v of evalList) {
    if (v.kind === "keyword" && v.keyword === "unsafe-eval") add("C15", "high", evalFrom, v.raw, { which: "unsafe-eval" });
    if (v.kind === "keyword" && v.keyword === "wasm-unsafe-eval") add("C15", "low", evalFrom, v.raw, { which: "wasm-unsafe-eval" });
    if (v.kind === "keyword" && v.keyword === "trusted-types-eval") add("C15", "low", evalFrom, v.raw, { which: "trusted-types-eval" });
  }
  // C20: object-src: missing, or open.
  if (object === null) add("C20", "high", null, null, { what: "missing" });
  else if (!object.some((v) => v.kind === "none")) {
    // Dangerous expressions in the plugin list.
    for (const v of object) if ((v.kind === "scheme" && ["data", "http", "https"].includes(v.scheme ?? "")) || (v.kind === "host" && v.host === "*")) add("C20", "high", objectFrom, v.raw, { what: "open" });
    // A plain allowlist without 'none'.
    if (!object.some((v) => (v.kind === "scheme" && ["data", "http", "https"].includes(v.scheme ?? "")) || (v.kind === "host" && v.host === "*"))) add("C20", "low", objectFrom, object.map((v) => v.raw).slice(0, 4).join(" "), { what: "allowlist" });
  } else add("C20", "good", objectFrom, "'none'", { what: "none" });
  // C21: base-uri: missing, or open.
  if (base === null) add("C21", "medium", null, null, { what: "missing" });
  else if (base.some((v) => (v.kind === "scheme" && ["data", "http", "https"].includes(v.scheme ?? "")) || (v.kind === "host" && v.host === "*"))) add("C21", "high", "base-uri", base.map((v) => v.raw).join(" "), { what: "open" });
  else if (base.some((v) => v.kind === "self" || v.kind === "none")) add("C21", "good", "base-uri", base.map((v) => v.raw).join(" "), { what: "good" });
  // C22: frame-ancestors (no fallback; ignored in meta).
  if (!active.has("frame-ancestors") && delivery !== "meta") add("C22", "medium", null, null, { what: "missing" });
  else if (active.has("frame-ancestors")) add("C22", "good", "frame-ancestors", (active.get("frame-ancestors") as DirectiveRow).values.map((v) => v.raw).join(" ") || "''", { what: "present" });
  // C23: nonces shorter than 128 bits (22 base64 characters without padding) (7.1).
  for (const d of active.values()) for (const v of d.values) if (v.kind === "nonce" && (v.valueLength ?? 0) < 22) add("C23", "medium", d.name, v.raw, { length: v.valueLength ?? 0 });
  // C24: insecure or IP sources anywhere.
  for (const d of active.values()) {
    for (const v of d.values) {
      // An insecure scheme, bare or on a host (6.7.2.9 upgrades it to https/wss, but it also admits the cleartext form).
      if ((v.kind === "scheme" && (v.scheme === "http" || v.scheme === "ws")) || (v.kind === "host" && (v.scheme === "http" || v.scheme === "ws"))) add("C24", "low", d.name, v.raw, { what: "http" });
      // An IP address: only 127.0.0.1 ever matches (2.3.1 note; 6.7.2.10).
      if (v.kind === "host" && v.host && looksLikeIp(v.host)) add("C24", v.host === "127.0.0.1" ? "info" : "medium", d.name, v.raw, { what: v.host === "127.0.0.1" ? "localhost" : "ip" });
    }
  }
  // C25: reporting.
  if (!active.has("report-to") && !active.has("report-uri")) add("C25", "info", null, null, { what: "none" });
  else if (active.has("report-to")) add("C25", "good", "report-to", (active.get("report-to") as DirectiveRow).values.map((v) => v.raw).join(" ") || null, { what: "report-to" });
  // C26: Report-Only delivery: nothing is enforced.
  if (delivery === "report-only") add("C26", "info", null, null);
  // 'unsafe-hashes' (8.3) and 'unsafe-inline' for style, as notes.
  if (elem && elem.some((v) => v.kind === "keyword" && v.keyword === "unsafe-hashes")) add("C14", "low", elemFrom, "'unsafe-hashes'", { overridden: "hashes" });
  const styleFrom = FALLBACK["style-src-elem"].find((n) => active.has(n)) ?? null;
  if (styleFrom && styleFrom !== elemFrom) {
    const style = (active.get(styleFrom) as DirectiveRow).values;
    if (style.some((v) => v.kind === "keyword" && v.keyword === "unsafe-inline") && !style.some((v) => v.kind === "nonce" || v.kind === "hash")) add("C14", "low", styleFrom, "'unsafe-inline'", { overridden: "style" });
  }
  // Trusted Types as a positive.
  if (active.has("require-trusted-types-for") && (active.get("require-trusted-types-for") as DirectiveRow).values.some((v) => v.kind === "keyword" && v.keyword === "script")) add("C11", "good", "require-trusted-types-for", "'script'", { which: "trusted-types-on" });

  // --- The grade. ---
  // Strict CSP (8.5): nonce or hash with 'strict-dynamic' for script, no effective 'unsafe-inline' (it is ignored with a nonce), base-uri 'self' or 'none', and object-src 'none' (the plugin sink closed).
  const strict = elem !== null && (nonces > 0 || hashes > 0) && strictDynamic && !evalAllowed && base !== null && base.every((v) => v.kind === "self" || v.kind === "none") && object !== null && object.some((v) => v.kind === "none");
  // Counts.
  const counts = { high: 0, medium: 0, low: 0, info: 0, good: 0 };
  for (const f of findings) counts[f.severity]++;
  // The grade.
  const grade: PolicyReport["grade"] = elem === null ? "none" : strict ? "strict" : counts.high > 0 ? "weak" : counts.medium > 0 ? "fair" : "good";
  // Sort: severity, then rule number, then directive.
  findings.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || Number(a.rule.slice(1)) - Number(b.rule.slice(1)) || (a.directive ?? "").localeCompare(b.directive ?? ""));
  // Done.
  return { index, delivery, serialized, directives, effective, findings, grade, script, counts };
}
