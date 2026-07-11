// ============================================================================
// src/lib/tools/f5xc-http-lb-route-explainer/compute.ts
// ----------------------------------------------------------------------------
// Deterministic decoder for the routes block of an F5 Distributed Cloud (XC)
// HTTP load balancer (ves.io.schema.views.http_loadbalancer). Pure, offline.
//
// Paste a full http_loadbalancer spec, just its `routes` array, or a console
// envelope; the decoder locates the routes and, for each one in order, explains:
//   - route type: simple / redirect / direct-response / custom
//   - the match: HTTP method, path (prefix vs exact vs regex), header + query
//     conditions
//   - the action: origin pool(s) with weights, redirect params, direct response
//   - path rewrite, request/response header mutations, host-rewrite override
//   - the per-route WAF attachment: inherit-from-LB (default), a specific app
//     firewall, or disabled
// It also simulates first-match evaluation for a test method + path, because XC
// evaluates routes IN ORDER (first match wins) - the reason F5's own guidance is
// to "drag a route to the top to ensure it is evaluated first".
//
// Schema keys verified 2026-07-11 against F5's Create HTTP Load Balancer guide,
// the ves.io.schema.route API doc, the per-route WAF article, and the host-
// rewrite KB (K000146653). The decoder is DEFENSIVE: it renders the keys it
// recognizes and flags anything it does not, rather than asserting blindly.
// ============================================================================

export type RouteType = "simple" | "redirect" | "direct_response" | "custom" | "unknown";
export type PathKind = "prefix" | "exact" | "regex" | "any";
export type WafMode = "inherit" | "app_firewall" | "disabled";
export type HostRewrite = "inherit" | "auto" | "value" | "disabled";

export interface HeaderCond {
  name: string;
  op: "exact" | "regex" | "presence" | "absence" | "other";
  value?: string;
}
export interface HeaderMutation {
  name: string;
  value?: string;
  append?: boolean;
}
export interface PoolRef {
  name: string;
  weight?: number;
  priority?: number;
}
export interface RouteView {
  index: number;
  type: RouteType;
  disabled: boolean;
  method: string; // "ANY" when unset
  path: { kind: PathKind; value: string };
  headers: HeaderCond[];
  queryParams: number;
  // action
  pools: PoolRef[];
  redirect?: { host?: string; pathRewrite?: string; responseCode?: number; proto?: string };
  directResponse?: { responseCode?: number; hasBody: boolean };
  customRef?: string;
  // modifiers
  pathRewrite?: { kind: "prefix" | "regex"; value: string };
  requestHeadersAdd: HeaderMutation[];
  requestHeadersRemove: string[];
  responseHeadersAdd: HeaderMutation[];
  responseHeadersRemove: string[];
  hostRewrite: HostRewrite;
  hostRewriteValue?: string;
  waf: WafMode;
  wafRef?: string;
  notes: string[];
}

export interface ExplainResult {
  ok: boolean;
  error?: string;
  recognized: boolean;
  routes: RouteView[];
  warnings: string[];
}

// -- small type guards --
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asStr(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function asNum(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

/** Best-effort human name from an XC object-ref ({name,namespace,tenant} or {name}). */
function refName(v: unknown): string {
  if (typeof v === "string") return v;
  if (isObj(v)) {
    if (typeof v.name === "string") return v.name;
    if (Array.isArray(v.refs) && v.refs.length && isObj(v.refs[0]) && typeof (v.refs[0] as Record<string, unknown>).name === "string")
      return (v.refs[0] as Record<string, unknown>).name as string;
  }
  return "(ref)";
}

/** Locate the routes array across the common envelope shapes. */
function locateRoutes(root: unknown): unknown[] | null {
  if (Array.isArray(root)) return root; // pasted the routes array directly
  if (!isObj(root)) return null;
  // spec | get_spec | create_form.spec | replace_form.spec
  const specs: unknown[] = [root.spec, root.get_spec];
  if (isObj(root.create_form)) specs.push((root.create_form as Record<string, unknown>).spec);
  if (isObj(root.replace_form)) specs.push((root.replace_form as Record<string, unknown>).spec);
  for (const s of specs) {
    if (isObj(s) && Array.isArray(s.routes)) return s.routes;
  }
  if (Array.isArray(root.routes)) return root.routes; // {routes:[...]}
  return null;
}

const METHODS = ["ANY", "GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"];

function readPath(m: Record<string, unknown>): { kind: PathKind; value: string } {
  const p = m.path;
  if (isObj(p)) {
    if (typeof p.prefix === "string") return { kind: "prefix", value: p.prefix };
    if (typeof p.path === "string") return { kind: "exact", value: p.path };
    if (typeof p.regex === "string") return { kind: "regex", value: p.regex };
  }
  return { kind: "any", value: "(any path)" };
}

function readHeaders(m: Record<string, unknown>): HeaderCond[] {
  if (!Array.isArray(m.headers)) return [];
  return m.headers.filter(isObj).map((h) => {
    const name = asStr((h as Record<string, unknown>).name) ?? "(header)";
    const hh = h as Record<string, unknown>;
    const invert = hh.invert_match === true || hh.invert_matcher === true;
    if (typeof hh.exact === "string") return { name, op: invert ? "other" : "exact", value: hh.exact } as HeaderCond;
    if (typeof hh.regex === "string") return { name, op: "regex", value: hh.regex } as HeaderCond;
    if (hh.presence === true) return { name, op: invert ? "absence" : "presence" } as HeaderCond;
    return { name, op: "other" } as HeaderCond;
  });
}

function readHeaderMutations(list: unknown): HeaderMutation[] {
  if (!Array.isArray(list)) return [];
  return list.filter(isObj).map((h) => {
    const hh = h as Record<string, unknown>;
    return { name: asStr(hh.name) ?? "(header)", value: asStr(hh.value), append: hh.append === true };
  });
}
function strList(list: unknown): string[] {
  return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
}

function readAdvanced(view: RouteView, adv: Record<string, unknown>): void {
  view.requestHeadersAdd = readHeaderMutations(adv.request_headers_to_add);
  view.requestHeadersRemove = strList(adv.request_headers_to_remove);
  view.responseHeadersAdd = readHeaderMutations(adv.response_headers_to_add);
  view.responseHeadersRemove = strList(adv.response_headers_to_remove);
  // per-route WAF: app_firewall (specific) / disable_waf / inherit_waf (default)
  if (isObj(adv.app_firewall)) {
    view.waf = "app_firewall";
    view.wafRef = refName(adv.app_firewall);
  } else if (adv.disable_waf !== undefined) {
    view.waf = "disabled";
  } // else inherit (default)
  // path rewrite
  if (typeof adv.prefix_rewrite === "string") view.pathRewrite = { kind: "prefix", value: adv.prefix_rewrite };
  else if (isObj(adv.regex_rewrite)) {
    const pat = asStr((adv.regex_rewrite as Record<string, unknown>).pattern);
    if (pat) view.pathRewrite = { kind: "regex", value: pat };
  }
  if (adv.disable === true) view.disabled = true;
}

function readHostRewrite(view: RouteView, r: Record<string, unknown>): void {
  if (r.auto_host_rewrite !== undefined) view.hostRewrite = "auto";
  else if (typeof r.host_rewrite === "string") {
    view.hostRewrite = "value";
    view.hostRewriteValue = r.host_rewrite;
  } else if (r.disable_host_rewrite !== undefined) view.hostRewrite = "disabled";
}

function readPools(r: Record<string, unknown>): PoolRef[] {
  const list = r.origin_pools;
  if (!Array.isArray(list)) return [];
  return list.filter(isObj).map((p) => {
    const pp = p as Record<string, unknown>;
    const poolRef = pp.pool ?? pp.cluster ?? pp;
    return { name: refName(poolRef), weight: asNum(pp.weight), priority: asNum(pp.priority) };
  });
}

function decodeRoute(raw: unknown, index: number): RouteView {
  const view: RouteView = {
    index,
    type: "unknown",
    disabled: false,
    method: "ANY",
    path: { kind: "any", value: "(any path)" },
    headers: [],
    queryParams: 0,
    pools: [],
    requestHeadersAdd: [],
    requestHeadersRemove: [],
    responseHeadersAdd: [],
    responseHeadersRemove: [],
    hostRewrite: "inherit",
    waf: "inherit",
    notes: [],
  };
  if (!isObj(raw)) {
    view.notes.push("route entry is not an object");
    return view;
  }

  // pick the route-type sub-object
  let body: Record<string, unknown> | null = null;
  if (isObj(raw.simple_route)) {
    view.type = "simple";
    body = raw.simple_route;
  } else if (isObj(raw.redirect_route)) {
    view.type = "redirect";
    body = raw.redirect_route;
  } else if (isObj(raw.direct_response_route)) {
    view.type = "direct_response";
    body = raw.direct_response_route;
  } else if (isObj(raw.custom_route_object)) {
    view.type = "custom";
    body = raw.custom_route_object;
    view.customRef = refName((raw.custom_route_object as Record<string, unknown>).route_ref ?? raw.custom_route_object);
    return view; // custom routes carry no inline match/action
  } else {
    view.notes.push("unrecognized route type (expected simple_route / redirect_route / direct_response_route / custom_route_object)");
    return view;
  }

  // method
  const method = asStr(body.http_method);
  if (method && METHODS.includes(method.toUpperCase())) view.method = method.toUpperCase();
  else if (method) view.method = method;

  // match
  view.path = readPath(body);
  view.headers = readHeaders(body);
  if (Array.isArray(body.query_params)) view.queryParams = body.query_params.length;

  // action by type
  if (view.type === "simple") {
    view.pools = readPools(body);
    readHostRewrite(view, body);
    if (isObj(body.advanced_options)) readAdvanced(view, body.advanced_options);
    if (view.pools.length === 0) view.notes.push("no origin pool on this simple route - traffic would fall through to the default pool");
  } else if (view.type === "redirect") {
    const rr = isObj(body.route_redirect) ? body.route_redirect : {};
    view.redirect = {
      host: asStr(rr.host_redirect),
      pathRewrite: asStr(rr.path_redirect) ?? asStr(rr.prefix_rewrite),
      responseCode: asNum(rr.response_code),
      proto: asStr(rr.proto_redirect),
    };
  } else if (view.type === "direct_response") {
    const dr = isObj(body.route_direct_response) ? body.route_direct_response : {};
    view.directResponse = { responseCode: asNum(dr.response_code), hasBody: typeof dr.response_body === "string" && dr.response_body.length > 0 };
  }

  return view;
}

export function explainRoutes(text: string): ExplainResult {
  const t = text.trim();
  if (t === "") return { ok: false, error: "Paste an F5XC HTTP load balancer spec, or just its routes array.", recognized: false, routes: [], warnings: [] };

  let root: unknown;
  try {
    root = JSON.parse(t);
  } catch {
    return { ok: false, error: "That is not valid JSON. Paste the object from the XC Console (JSON view) or the API.", recognized: false, routes: [], warnings: [] };
  }

  const rawRoutes = locateRoutes(root);
  if (rawRoutes === null) return { ok: true, recognized: false, routes: [], warnings: ["no `routes` array found - paste the http_loadbalancer spec, its routes array, or a create/get envelope"] };

  const routes = rawRoutes.map(decodeRoute);
  const warnings: string[] = [];
  if (routes.length === 0) warnings.push("empty routes list - all traffic uses the load balancer's default origin pool");
  // structural cautions
  routes.forEach((r) => {
    if (r.type === "simple" && r.path.kind === "regex") {
      try {
        // eslint-disable-next-line no-new
        new RegExp(r.path.value);
      } catch {
        warnings.push(`route ${r.index + 1}: path regex does not compile`);
      }
    }
    if (r.disabled) warnings.push(`route ${r.index + 1} is disabled`);
    if (r.waf === "disabled") warnings.push(`route ${r.index + 1} disables WAF`);
  });
  // catch-all-before-specific ordering hint (first-match): a prefix "/" or regex ".*" that precedes later routes
  const catchAllIdx = routes.findIndex((r) => (r.path.kind === "prefix" && r.path.value === "/") || (r.path.kind === "regex" && (r.path.value === ".*" || r.path.value === "/.*")));
  if (catchAllIdx >= 0 && catchAllIdx < routes.length - 1 && routes[catchAllIdx].headers.length === 0) {
    warnings.push(`route ${catchAllIdx + 1} matches everything and comes before route(s) below it; because evaluation is first-match, those later routes may never be reached`);
  }

  return { ok: true, recognized: true, routes, warnings: Array.from(new Set(warnings)) };
}

// ---- First-match simulation for a test request (method + path) ----------------
export interface MatchResult {
  matchedIndex: number | null;
  routeType?: RouteType;
  needsHeaders?: HeaderCond[];
  needsQuery?: number;
  note: string;
}

function pathMatches(kind: PathKind, value: string, reqPath: string): boolean {
  if (kind === "any") return true;
  if (kind === "prefix") return reqPath.startsWith(value);
  if (kind === "exact") return reqPath === value;
  if (kind === "regex") {
    try {
      return new RegExp(value).test(reqPath);
    } catch {
      return false;
    }
  }
  return false;
}

export function simulateRequest(routes: RouteView[], method: string, reqPath: string): MatchResult {
  const m = method.trim().toUpperCase() || "GET";
  let customBefore = 0;
  for (const r of routes) {
    if (r.disabled) continue;
    if (r.type === "custom") {
      customBefore++;
      continue; // match conditions live in the referenced route object, not here
    }
    const methodOk = r.method === "ANY" || r.method === m;
    const pathOk = pathMatches(r.path.kind, r.path.value, reqPath);
    if (methodOk && pathOk) {
      const needsHeaders = r.headers.length ? r.headers : undefined;
      const needsQuery = r.queryParams || undefined;
      let note =
        needsHeaders || needsQuery
          ? "matches on method + path; this route ALSO has header/query conditions the simulator cannot check without those values, so the real match may differ"
          : "matches on method + path";
      if (customBefore > 0) note += `; note: ${customBefore} custom route(s) earlier reference external route objects whose conditions are not in this JSON and could match first`;
      return { matchedIndex: r.index, routeType: r.type, needsHeaders, needsQuery, note };
    }
  }
  let note = "no route matches on method + path; the request would use the load balancer's default origin pool";
  if (customBefore > 0) note += ` (excluding ${customBefore} custom route(s) whose conditions are external)`;
  return { matchedIndex: null, note };
}

/** D-49 run entrypoint: parse the pasted routes/LB spec (string). */
export function run(input: string): ExplainResult {
  return explainRoutes(input);
}
