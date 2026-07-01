// ============================================================================
// src/lib/tools/f5xc-service-policy-explainer/compute.ts
// ----------------------------------------------------------------------------
// Deterministic decoder for an F5 Distributed Cloud (XC) service_policy spec
// (ves.io.schema.service_policy). Paste the JSON and get its match logic spelled
// out: the server scope, the rule disposition, and for a rule_list every rule's
// action and its AND-combined predicates, each matcher rendered with its
// exact/regex/prefix criteria, and/or logic, inversion, and case-sensitivity.
//
// Field names and shapes follow the official OpenAPI schema. The decoder is
// local and zero-egress (D-49): it parses the JSON you paste and renders it,
// nothing is fetched, resolved, or evaluated against live traffic. It never
// throws; malformed input is reported.
//
// Semantics (from F5 docs): predicates are AND-combined and any predicate not
// specified is implicitly true; a request matches a rule only if all its
// predicates are true. Rules in a rule_list are evaluated top to bottom
// (FIRST_MATCH by default). If nothing matches, the request is denied.
// ============================================================================

export type RuleAction = "ALLOW" | "DENY" | "NEXT_POLICY" | string;

export interface MatchLine {
  op: string; // exact | regex | prefix | suffix | methods | present | absent | asn | prefixes | refs | classes | excluded | keys | selector | ports | categories | literal | raw
  values: string[];
  subject?: string; // for header/cookie/arg/jwt/query: the name/key
  note?: string;
}

export interface PredicateView {
  key: string; // raw field name
  label: string; // friendly label
  lines: MatchLine[];
  inverted: boolean;
  caseSensitiveExact: boolean; // exact values present without a case transformer
}

export interface RuleView {
  name: string | null;
  description: string | null;
  action: RuleAction;
  predicates: PredicateView[];
  actionModifiers: string[]; // waf_action, bot_action, rate_limiters, etc.
  expired: boolean;
  expirationTimestamp: string | null;
}

export interface SourceListView {
  lines: MatchLine[];
  defaultAction: string | null;
}

export interface ServerScope {
  kind: "any_server" | "server_name" | "server_name_matcher" | "server_selector";
  lines: MatchLine[];
}

export interface Disposition {
  kind: "allow_all" | "deny_all" | "allow_list" | "deny_list" | "rule_list" | "legacy_rule_list" | "unknown";
  sourceList?: SourceListView;
  legacyRefs?: string[];
}

export interface ServicePolicyParse {
  recognized: boolean;
  parseError: string | null;
  name: string | null;
  namespace: string | null;
  serverScope: ServerScope | null;
  disposition: Disposition;
  ruleCombiningAlgorithm: string | null;
  rules: RuleView[];
  warnings: string[]; // stable codes
}

const CASE_TRANSFORMERS = new Set(["LOWER_CASE", "UPPER_CASE"]);

// Fields on a rule spec that are actions/modifiers or metadata, not predicates.
const ACTION_MODIFIER_FIELDS = new Set([
  "waf_action", "bot_action", "mum_action", "ip_reputation_action", "malware_protection_action",
  "malware_protection_settings", "challenge_action", "rate_limiters", "rate_limiter_specs",
  "openapi_validation_action", "response_masking_config", "content_rewrite_action",
  "shape_protected_endpoint_action", "graphql_settings", "threat_mesh_action",
  "mobile_identifier_matcher_action", "origin_server_subsets_action", "bot_advanced_endpoint_matcher",
]);
const META_FIELDS = new Set([
  "action", "name", "description", "expiration_timestamp", "log_rule_evaluation",
  "metric_name_label", "goto_policy",
]);

// Friendly labels for predicate fields (superset of GlobalSpecType + SimpleRule).
const PREDICATE_LABELS: Record<string, string> = {
  any_client: "Client", any_ip: "Source IP", any_asn: "Source ASN", any_server: "Server",
  client_name: "Client name", client_name_matcher: "Client name", client_selector: "Client selector (labels)",
  client_role: "Client role", ip_threat_category_list: "IP threat categories",
  ip_prefix_list: "Source IP prefixes", ip_matcher: "Source IP prefix sets",
  dst_ip_prefix_list: "Destination IP prefixes", dst_ip_matcher: "Destination IP prefix sets",
  asn_list: "Source ASNs", asn_matcher: "Source ASN sets",
  dst_asn_list: "Destination ASNs", dst_asn_matcher: "Destination ASN sets",
  api_group_matcher: "API group", additional_api_group_matchers: "API group (additional)",
  arg_matchers: "POST arguments", body_matcher: "Request body", cookie_matchers: "Cookies",
  domain_matcher: "Domain", headers: "HTTP headers", http_method: "HTTP method",
  ja4_tls_fingerprint: "JA4 TLS fingerprint", jwt_claims: "JWT claims", label_matcher: "Label keys",
  path: "HTTP path", port_matcher: "Port", query_params: "HTTP query parameters",
  tls_fingerprint_matcher: "TLS fingerprint (JA3)", user_identity_matcher: "User identity",
  request_constraints: "Request constraints", segment_policy: "Segments", scheme: "Scheme",
  url_matcher: "URL", virtual_host_matcher: "Virtual host", server_name: "Server name",
  server_name_matcher: "Server name", server_selector: "Server selector (labels)",
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x : typeof x === "number" ? String(x) : JSON.stringify(x)));
}
function refStr(r: unknown): string {
  if (!isObj(r)) return String(r);
  const ns = typeof r.namespace === "string" ? r.namespace : "";
  const nm = typeof r.name === "string" ? r.name : "";
  const kind = typeof r.kind === "string" ? r.kind : "";
  return [kind, ns, nm].filter(Boolean).join("/") || JSON.stringify(r);
}

// Render a MatcherType-like object (exact_values / regex_values / prefix_values /
// suffix_values / match / transformers). Returns the lines plus case-sensitivity.
function renderMatcherBody(v: Record<string, unknown>): { lines: MatchLine[]; caseSensitiveExact: boolean } {
  const lines: MatchLine[] = [];
  const transformers = strArr(v.transformers);
  const hasCaseTransform = transformers.some((t) => CASE_TRANSFORMERS.has(t));
  let hasExact = false;
  if (Array.isArray(v.prefix_values) && v.prefix_values.length) lines.push({ op: "prefix", values: strArr(v.prefix_values) });
  if (Array.isArray(v.exact_values) && v.exact_values.length) { lines.push({ op: "exact", values: strArr(v.exact_values) }); hasExact = true; }
  if (Array.isArray(v.match) && v.match.length) { lines.push({ op: "exact", values: strArr(v.match) }); hasExact = true; }
  if (Array.isArray(v.suffix_values) && v.suffix_values.length) lines.push({ op: "suffix", values: strArr(v.suffix_values) });
  if (Array.isArray(v.regex_values) && v.regex_values.length) lines.push({ op: "regex", values: strArr(v.regex_values) });
  if (transformers.length) lines.push({ op: "transformers", values: transformers });
  if (v.encoded_path_matcher === true) lines.push({ op: "note", values: ["encoded-path"] });
  return { lines, caseSensitiveExact: hasExact && !hasCaseTransform };
}

// Render an array of subject-matchers (headers/cookies/args/jwt/query_params).
function renderSubjectMatchers(arr: unknown[], subjectKey: "name" | "key"): { lines: MatchLine[]; inverted: boolean; caseSensitiveExact: boolean } {
  const lines: MatchLine[] = [];
  let inverted = false;
  let caseSensitiveExact = false;
  for (const it of arr) {
    if (!isObj(it)) continue;
    const subject = typeof it[subjectKey] === "string" ? (it[subjectKey] as string) : "?";
    if (it.invert_matcher === true) inverted = true;
    if (it.check_present !== undefined) {
      lines.push({ op: "present", values: [], subject });
    } else if (it.check_not_present !== undefined) {
      lines.push({ op: "absent", values: [], subject });
    } else if (isObj(it.item)) {
      const body = renderMatcherBody(it.item);
      if (body.caseSensitiveExact) caseSensitiveExact = true;
      for (const ln of body.lines) lines.push({ ...ln, subject });
    } else {
      lines.push({ op: "present", values: [], subject });
    }
  }
  return { lines, inverted, caseSensitiveExact };
}

// Turn one rule-spec field into a PredicateView (or null if not a predicate).
function renderPredicate(key: string, v: unknown): PredicateView | null {
  const label = PREDICATE_LABELS[key] ?? key;
  const base: PredicateView = { key, label, lines: [], inverted: false, caseSensitiveExact: false };

  // any_* choice -> no constraint
  if (key.startsWith("any_")) {
    base.lines.push({ op: "note", values: ["any"] });
    return base;
  }
  // plain string predicates (client_name, server_name)
  if (typeof v === "string") {
    base.lines.push({ op: "literal", values: [v] });
    return base;
  }
  // subject-matcher arrays
  if (Array.isArray(v)) {
    const subjectKey = key === "query_params" ? "key" : "name";
    const r = renderSubjectMatchers(v, subjectKey as "name" | "key");
    base.lines = r.lines;
    base.inverted = r.inverted;
    base.caseSensitiveExact = r.caseSensitiveExact;
    return base;
  }
  if (!isObj(v)) return null;

  if (v.invert_matcher === true || v.invert_match === true) base.inverted = true;

  // http_method
  if (Array.isArray(v.methods)) { base.lines.push({ op: "methods", values: strArr(v.methods) }); return base; }
  // label selector (expressions)
  if (Array.isArray(v.expressions)) { base.lines.push({ op: "selector", values: strArr(v.expressions) }); return base; }
  // label matcher (keys)
  if (Array.isArray(v.keys)) { base.lines.push({ op: "keys", values: strArr(v.keys) }); return base; }
  // asn list
  if (Array.isArray(v.as_numbers)) { base.lines.push({ op: "asn", values: strArr(v.as_numbers) }); return base; }
  // asn matcher / ip matcher (refs)
  if (Array.isArray(v.asn_sets)) { base.lines.push({ op: "refs", values: (v.asn_sets as unknown[]).map(refStr) }); return base; }
  if (Array.isArray(v.prefix_sets)) { base.lines.push({ op: "refs", values: (v.prefix_sets as unknown[]).map(refStr) }); return base; }
  // ip prefix list
  if (Array.isArray(v.ip_prefixes) || Array.isArray(v.ipv6_prefixes) || Array.isArray(v.prefixes)) {
    const p = [...strArr(v.prefixes), ...strArr(v.ip_prefixes), ...strArr(v.ipv6_prefixes)];
    base.lines.push({ op: "prefixes", values: p });
    return base;
  }
  // ip threat categories
  if (Array.isArray(v.ip_threat_categories)) { base.lines.push({ op: "categories", values: strArr(v.ip_threat_categories) }); return base; }
  // port matcher
  if (Array.isArray(v.ports)) { base.lines.push({ op: "ports", values: strArr(v.ports) }); return base; }
  // TLS fingerprint matcher
  if (Array.isArray(v.classes) || Array.isArray(v.excluded_values)) {
    if (Array.isArray(v.classes) && v.classes.length) base.lines.push({ op: "classes", values: strArr(v.classes) });
    if (Array.isArray(v.exact_values) && v.exact_values.length) base.lines.push({ op: "exact", values: strArr(v.exact_values) });
    if (Array.isArray(v.excluded_values) && v.excluded_values.length) base.lines.push({ op: "excluded", values: strArr(v.excluded_values) });
    return base;
  }
  // role matcher (single match string)
  if (typeof v.match === "string") { base.lines.push({ op: "literal", values: [v.match] }); return base; }
  // generic MatcherType body (exact_values/regex_values/prefix_values/suffix_values/match[]/transformers)
  const body = renderMatcherBody(v);
  if (body.lines.length) {
    base.lines = body.lines;
    base.caseSensitiveExact = body.caseSensitiveExact;
    return base;
  }
  // request_constraints / segment_policy / other structured -> summarize keys that are set
  const setKeys = Object.keys(v).filter((k) => v[k] !== undefined && v[k] !== null && !k.endsWith("_none"));
  if (setKeys.length) { base.lines.push({ op: "raw", values: setKeys }); return base; }
  return base;
}

function renderSourceList(sl: Record<string, unknown>): SourceListView {
  const lines: MatchLine[] = [];
  if (isObj(sl.prefix_list)) {
    const p = [...strArr((sl.prefix_list as Record<string, unknown>).prefixes), ...strArr((sl.prefix_list as Record<string, unknown>).ipv6_prefixes)];
    if (p.length) lines.push({ op: "prefixes", values: p });
  }
  if (Array.isArray(sl.ip_prefix_set)) lines.push({ op: "refs", values: (sl.ip_prefix_set as unknown[]).map(refStr) });
  if (isObj(sl.asn_list) && Array.isArray((sl.asn_list as Record<string, unknown>).as_numbers)) lines.push({ op: "asn", values: strArr((sl.asn_list as Record<string, unknown>).as_numbers) });
  if (Array.isArray(sl.asn_set)) lines.push({ op: "refs", values: (sl.asn_set as unknown[]).map(refStr) });
  if (Array.isArray(sl.country_list)) lines.push({ op: "categories", values: strArr(sl.country_list) });
  if (Array.isArray(sl.tls_fingerprint_classes)) lines.push({ op: "classes", values: strArr(sl.tls_fingerprint_classes) });
  if (Array.isArray(sl.tls_fingerprint_values)) lines.push({ op: "exact", values: strArr(sl.tls_fingerprint_values) });
  let defaultAction: string | null = null;
  if (sl.default_action_allow !== undefined) defaultAction = "ALLOW";
  else if (sl.default_action_deny !== undefined) defaultAction = "DENY";
  else if (sl.default_action_next_policy !== undefined) defaultAction = "NEXT_POLICY";
  return { lines, defaultAction };
}

function readServerScope(spec: Record<string, unknown>): ServerScope | null {
  if (spec.any_server !== undefined) return { kind: "any_server", lines: [{ op: "note", values: ["any"] }] };
  if (typeof spec.server_name === "string") return { kind: "server_name", lines: [{ op: "literal", values: [spec.server_name] }] };
  if (isObj(spec.server_name_matcher)) return { kind: "server_name_matcher", lines: renderMatcherBody(spec.server_name_matcher).lines };
  if (isObj(spec.server_selector) && Array.isArray((spec.server_selector as Record<string, unknown>).expressions))
    return { kind: "server_selector", lines: [{ op: "selector", values: strArr((spec.server_selector as Record<string, unknown>).expressions) }] };
  return null;
}

function readRule(r: unknown): RuleView {
  const rule: RuleView = { name: null, description: null, action: "DENY", predicates: [], actionModifiers: [], expired: false, expirationTimestamp: null };
  if (!isObj(r)) return rule;
  const meta = isObj(r.metadata) ? r.metadata : {};
  rule.name = typeof meta.name === "string" ? meta.name : typeof r.name === "string" ? r.name : null;
  rule.description = typeof meta.description === "string" ? meta.description : typeof r.description === "string" ? r.description : null;
  const spec = isObj(r.spec) ? r.spec : r; // GlobalSpecType, or SimpleRule (flat)
  if (typeof spec.action === "string") rule.action = spec.action;
  if (typeof spec.name === "string" && !rule.name) rule.name = spec.name;
  if (typeof spec.description === "string" && !rule.description) rule.description = spec.description;
  if (typeof spec.expiration_timestamp === "string") {
    rule.expirationTimestamp = spec.expiration_timestamp;
    const t = Date.parse(spec.expiration_timestamp);
    if (!Number.isNaN(t) && t < Date.now()) rule.expired = true;
  }
  for (const [k, v] of Object.entries(spec)) {
    if (META_FIELDS.has(k)) continue;
    if (ACTION_MODIFIER_FIELDS.has(k)) { rule.actionModifiers.push(k); continue; }
    if (v === undefined || v === null) continue;
    const pred = renderPredicate(k, v);
    if (pred) rule.predicates.push(pred);
  }
  return rule;
}

export function parseServicePolicy(input: string): ServicePolicyParse {
  const out: ServicePolicyParse = {
    recognized: false, parseError: null, name: null, namespace: null,
    serverScope: null, disposition: { kind: "unknown" }, ruleCombiningAlgorithm: null,
    rules: [], warnings: [],
  };
  const text = input.trim();
  if (!text) return out;

  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch (e) {
    out.parseError = e instanceof Error ? e.message : "invalid JSON";
    return out;
  }
  if (!isObj(root)) return out;

  // locate metadata + spec across the common envelope shapes
  const meta = isObj(root.metadata) ? root.metadata : undefined;
  if (meta) {
    if (typeof meta.name === "string") out.name = meta.name;
    if (typeof meta.namespace === "string") out.namespace = meta.namespace;
  }
  let spec: Record<string, unknown> | undefined;
  if (isObj(root.spec)) spec = root.spec;
  else if (isObj(root.get_spec)) spec = root.get_spec;
  else if (isObj(root.create_form) && isObj((root.create_form as Record<string, unknown>).spec)) spec = (root.create_form as Record<string, unknown>).spec as Record<string, unknown>;
  else spec = root; // bare spec

  if (!spec) return out;

  // rule combining algorithm may appear at spec or rule_list level in some forms
  const algo = spec.rule_combining_algorithm ?? spec.algo ?? (isObj(spec.rule_list) ? (spec.rule_list as Record<string, unknown>).rule_combining_algorithm : undefined);
  if (typeof algo === "string") out.ruleCombiningAlgorithm = algo;

  out.serverScope = readServerScope(spec);

  // rule_choice
  if (spec.allow_all_requests !== undefined) {
    out.recognized = true;
    out.disposition = { kind: "allow_all" };
    out.warnings.push("allow-all-policy");
  } else if (spec.deny_all_requests !== undefined) {
    out.recognized = true;
    out.disposition = { kind: "deny_all" };
  } else if (isObj(spec.allow_list)) {
    out.recognized = true;
    out.disposition = { kind: "allow_list", sourceList: renderSourceList(spec.allow_list) };
  } else if (isObj(spec.deny_list)) {
    out.recognized = true;
    out.disposition = { kind: "deny_list", sourceList: renderSourceList(spec.deny_list) };
  } else if (isObj(spec.legacy_rule_list)) {
    out.recognized = true;
    const refs = Array.isArray((spec.legacy_rule_list as Record<string, unknown>).rules) ? ((spec.legacy_rule_list as Record<string, unknown>).rules as unknown[]).map(refStr) : [];
    out.disposition = { kind: "legacy_rule_list", legacyRefs: refs };
  } else if (isObj(spec.rule_list)) {
    out.recognized = true;
    out.disposition = { kind: "rule_list" };
    const rules = Array.isArray((spec.rule_list as Record<string, unknown>).rules) ? ((spec.rule_list as Record<string, unknown>).rules as unknown[]) : [];
    out.rules = rules.map(readRule);
    if (out.rules.length === 0) out.warnings.push("no-rules");
    for (const r of out.rules) {
      if (r.action === "ALLOW" && r.predicates.length === 0) out.warnings.push("allow-all-rule");
      if (r.expired) out.warnings.push("expired-rule");
      if (r.predicates.some((p) => p.caseSensitiveExact)) out.warnings.push("case-sensitive-exact");
      if (r.predicates.some((p) => p.inverted)) out.warnings.push("inverted-matcher");
    }
    // de-dupe warnings
    out.warnings = Array.from(new Set(out.warnings));
  } else if (out.serverScope) {
    // recognized as a service_policy shell even if rule_choice is absent
    out.recognized = true;
  }

  return out;
}
