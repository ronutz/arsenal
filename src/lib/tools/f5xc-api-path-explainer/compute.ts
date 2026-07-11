// ============================================================================
// src/lib/tools/f5xc-api-path-explainer/compute.ts
// ----------------------------------------------------------------------------
// Deterministic explainer for an OpenAPI / Swagger specification - the artifact
// F5 Distributed Cloud (XC) API Protection imports (and API Discovery
// generates). Pure, offline. Paste an OpenAPI 2.0 (Swagger) or 3.0.x spec and
// it lists every path + operation with its method, parameters, request body,
// responses, and whether it requires authentication - the "valid endpoint,
// parameter, method, authentication and payload details" XC enforces as a
// positive security model - and flags unauthenticated operations and
// object-level (path-parameter) endpoints.
//
// Verified 2026-07-11: XC supports OpenAPI 2.0 and 3.0.X (F5 Import OpenAPI
// Specification doc); the OWASP API Security Top 10 framing (unauthenticated =
// Broken Authentication; path-param object access = Broken Object Level
// Authorization) is public ground truth. OpenAPI structure per the OpenAPI
// Specification (swagger.io/specification).
// ============================================================================

export type SpecVersion = "2.0" | "3.x" | "unknown";
export type Severity = "warn" | "info";

export interface ParamView {
  name: string;
  location: string; // path / query / header / cookie / body / formData
  required: boolean;
}

export interface OperationView {
  method: string; // GET / POST / ...
  path: string;
  summary?: string;
  operationId?: string;
  params: ParamView[];
  hasRequestBody: boolean;
  requestContentTypes: string[];
  responseCodes: string[];
  security: string[]; // effective scheme names
  authenticated: boolean;
  deprecated: boolean;
  hasPathParam: boolean;
}

export interface Flag {
  code: string;
  severity: Severity;
  params: Record<string, string>;
}

export interface SpecView {
  ok: boolean;
  error?: string;
  recognized: boolean;
  version: SpecVersion;
  title?: string;
  securitySchemes: string[];
  operations: OperationView[];
  summary: { paths: number; operations: number; unauthenticated: number; withPathParams: number; deprecated: number };
  flags: Flag[];
}

const METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asStr(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/** Resolve a local $ref ("#/a/b/c") within the document; returns the node or null. */
function resolveRef(doc: Record<string, unknown>, ref: string): unknown {
  if (!ref.startsWith("#/")) return null;
  const parts = ref.slice(2).split("/").map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  let cur: unknown = doc;
  for (const p of parts) {
    if (!isObj(cur)) return null;
    cur = cur[p];
  }
  return cur;
}

function readParam(doc: Record<string, unknown>, raw: unknown): ParamView | null {
  let p = raw;
  if (isObj(p) && typeof p.$ref === "string") p = resolveRef(doc, p.$ref);
  if (!isObj(p)) return null;
  const name = asStr(p.name);
  const location = asStr(p.in);
  if (!name || !location) return null;
  return { name, location, required: p.required === true || location === "path" };
}

/** Collect the effective security scheme names for an operation. */
function effectiveSecurity(op: Record<string, unknown>, globalSec: unknown): string[] {
  const sec = op.security !== undefined ? op.security : globalSec;
  if (!Array.isArray(sec)) return [];
  const names = new Set<string>();
  for (const req of sec) {
    if (isObj(req)) for (const k of Object.keys(req)) names.add(k);
  }
  return [...names];
}

export function explainSpec(text: string): SpecView {
  const empty: SpecView = { ok: false, recognized: false, version: "unknown", securitySchemes: [], operations: [], summary: { paths: 0, operations: 0, unauthenticated: 0, withPathParams: 0, deprecated: 0 }, flags: [] };
  const t = text.trim();
  if (t === "") return { ...empty, error: "Paste an OpenAPI 2.0 (Swagger) or 3.0.x specification (JSON)." };

  let doc: unknown;
  try {
    doc = JSON.parse(t);
  } catch {
    return { ...empty, error: "That is not valid JSON. Paste the OpenAPI/Swagger document (JSON). XC supports OpenAPI 2.0 and 3.0.x." };
  }
  if (!isObj(doc)) return { ...empty, ok: true, recognized: false };

  let version: SpecVersion = "unknown";
  if (doc.swagger === "2.0") version = "2.0";
  else if (typeof doc.openapi === "string" && doc.openapi.startsWith("3.")) version = "3.x";
  if (version === "unknown" || !isObj(doc.paths)) return { ...empty, ok: true, recognized: false, version };

  const title = isObj(doc.info) ? asStr((doc.info as Record<string, unknown>).title) : undefined;

  // defined security schemes
  let securitySchemes: string[] = [];
  if (version === "3.x") {
    const comp = isObj(doc.components) ? doc.components : {};
    if (isObj(comp.securitySchemes)) securitySchemes = Object.keys(comp.securitySchemes);
  } else if (isObj(doc.securityDefinitions)) {
    securitySchemes = Object.keys(doc.securityDefinitions);
  }

  const globalSec = doc.security;
  const operations: OperationView[] = [];
  const paths = doc.paths as Record<string, unknown>;

  for (const [pathStr, itemRaw] of Object.entries(paths)) {
    if (!isObj(itemRaw)) continue;
    const sharedParams = Array.isArray(itemRaw.parameters) ? itemRaw.parameters : [];
    const hasPathParam = /\{[^}]+\}/.test(pathStr);

    for (const m of METHODS) {
      const op = itemRaw[m];
      if (!isObj(op)) continue;

      const paramRaws = [...sharedParams, ...(Array.isArray(op.parameters) ? op.parameters : [])];
      const params: ParamView[] = paramRaws.map((p) => readParam(doc, p)).filter((p): p is ParamView => p !== null);

      // request body
      let hasRequestBody = false;
      const requestContentTypes: string[] = [];
      if (version === "3.x" && isObj(op.requestBody)) {
        hasRequestBody = true;
        const rb = op.requestBody as Record<string, unknown>;
        if (isObj(rb.content)) requestContentTypes.push(...Object.keys(rb.content));
      } else if (version === "2.0") {
        if (params.some((p) => p.location === "body" || p.location === "formData")) {
          hasRequestBody = true;
          if (Array.isArray(op.consumes)) requestContentTypes.push(...(op.consumes as unknown[]).filter((c): c is string => typeof c === "string"));
        }
      }

      const responseCodes = isObj(op.responses) ? Object.keys(op.responses) : [];
      const security = effectiveSecurity(op, globalSec);

      operations.push({
        method: m.toUpperCase(),
        path: pathStr,
        summary: asStr(op.summary),
        operationId: asStr(op.operationId),
        params,
        hasRequestBody,
        requestContentTypes,
        responseCodes,
        security,
        authenticated: security.length > 0,
        deprecated: op.deprecated === true,
        hasPathParam,
      });
    }
  }

  const summary = {
    paths: Object.keys(paths).length,
    operations: operations.length,
    unauthenticated: operations.filter((o) => !o.authenticated).length,
    withPathParams: operations.filter((o) => o.hasPathParam).length,
    deprecated: operations.filter((o) => o.deprecated).length,
  };

  const flags: Flag[] = [];
  if (securitySchemes.length === 0) flags.push({ code: "no-security-schemes", severity: "warn", params: {} });
  if (summary.operations > 0 && summary.unauthenticated === summary.operations) flags.push({ code: "all-unauthenticated", severity: "warn", params: {} });

  return {
    ok: true,
    recognized: operations.length > 0,
    version,
    title,
    securitySchemes,
    operations,
    summary,
    flags,
  };
}

/** D-49 run entrypoint: a JSON string. */
export function run(input: string): SpecView {
  return explainSpec(input);
}
