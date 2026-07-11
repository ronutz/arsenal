// ============================================================================
// src/lib/tools/f5xc-api-path-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: a 3.x spec (global + per-op security, path params, request
// body, explicit public op, deprecated), a 2.0 spec (no security -> flags,
// formData body), $ref parameter resolution, and negatives.
// ============================================================================

import { explainSpec, run, type OperationView } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-api-path-explainer/2026-07-11";

const SPEC3 = JSON.stringify({
  openapi: "3.0.3",
  info: { title: "Orders API" },
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } },
  security: [{ bearerAuth: [] }],
  paths: {
    "/orders": {
      get: { summary: "List orders", operationId: "listOrders", responses: { "200": {}, "401": {} } },
      post: { summary: "Create order", requestBody: { content: { "application/json": {} } }, responses: { "201": {} } },
    },
    "/orders/{id}": {
      get: { summary: "Get order", parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {} } },
      delete: { security: [], summary: "Delete order", parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} }, deprecated: true },
    },
  },
});

const SPEC2 = JSON.stringify({
  swagger: "2.0",
  info: { title: "Legacy API" },
  paths: {
    "/ping": { get: { responses: { "200": {} } } },
    "/upload": { post: { consumes: ["multipart/form-data"], parameters: [{ name: "file", in: "formData", required: true }], responses: { "200": {} } } },
  },
});

const SPEC_REF = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "Ref API" },
  components: { parameters: { IdParam: { name: "id", in: "path", required: true } }, securitySchemes: { k: { type: "apiKey", in: "header", name: "X-Key" } } },
  paths: { "/x/{id}": { get: { parameters: [{ $ref: "#/components/parameters/IdParam" }], responses: { "200": {} } } } },
});

const find = (ops: OperationView[], method: string, path: string) => ops.find((o) => o.method === method && o.path === path);

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const ok = (name: string, cond: boolean, detail = "") => {
    if (cond) passed++;
    else failures.push(`[${name}] ${detail}`);
  };

  const s3 = explainSpec(SPEC3);
  ok("s3-version", s3.version === "3.x" && s3.title === "Orders API", JSON.stringify([s3.version, s3.title]));
  ok("s3-schemes", s3.securitySchemes.length === 1 && s3.securitySchemes[0] === "bearerAuth", JSON.stringify(s3.securitySchemes));
  ok("s3-opcount", s3.operations.length === 4, `${s3.operations.length}`);
  const getOrders = find(s3.operations, "GET", "/orders");
  ok("s3-get-auth", getOrders?.authenticated === true && getOrders?.hasPathParam === false, JSON.stringify(getOrders));
  ok("s3-get-resp", getOrders?.responseCodes.join(",") === "200,401", JSON.stringify(getOrders?.responseCodes));
  const postOrders = find(s3.operations, "POST", "/orders");
  ok("s3-post-body", postOrders?.hasRequestBody === true && postOrders?.requestContentTypes[0] === "application/json", JSON.stringify(postOrders));
  const getById = find(s3.operations, "GET", "/orders/{id}");
  ok("s3-pathparam", getById?.hasPathParam === true && getById?.params[0]?.name === "id" && getById?.params[0]?.location === "path" && getById?.params[0]?.required === true, JSON.stringify(getById?.params));
  const delById = find(s3.operations, "DELETE", "/orders/{id}");
  ok("s3-explicit-public", delById?.authenticated === false && delById?.deprecated === true, JSON.stringify(delById));
  ok("s3-summary", s3.summary.paths === 2 && s3.summary.operations === 4 && s3.summary.unauthenticated === 1 && s3.summary.withPathParams === 2 && s3.summary.deprecated === 1, JSON.stringify(s3.summary));
  ok("s3-no-flags", !s3.flags.some((f) => f.code === "no-security-schemes") && !s3.flags.some((f) => f.code === "all-unauthenticated"), JSON.stringify(s3.flags));

  const s2 = explainSpec(SPEC2);
  ok("s2-version", s2.version === "2.0", s2.version);
  ok("s2-noschemes", s2.securitySchemes.length === 0, JSON.stringify(s2.securitySchemes));
  const upload = find(s2.operations, "POST", "/upload");
  ok("s2-formdata", upload?.hasRequestBody === true && upload?.requestContentTypes[0] === "multipart/form-data", JSON.stringify(upload));
  ok("s2-all-unauth", s2.summary.unauthenticated === 2, JSON.stringify(s2.summary));
  ok("s2-flags", s2.flags.some((f) => f.code === "no-security-schemes") && s2.flags.some((f) => f.code === "all-unauthenticated"), JSON.stringify(s2.flags));

  const sr = explainSpec(SPEC_REF);
  const xById = find(sr.operations, "GET", "/x/{id}");
  ok("ref-resolve", xById?.params[0]?.name === "id" && xById?.params[0]?.location === "path", JSON.stringify(xById?.params));
  ok("ref-schemes", sr.securitySchemes[0] === "k", JSON.stringify(sr.securitySchemes));

  // run() + negatives
  ok("run-json", run(SPEC3).version === "3.x");
  ok("reject-bad-json", explainSpec("{nope").ok === false, "bad json not rejected");
  ok("reject-empty", explainSpec("").ok === false);
  ok("not-a-spec", explainSpec(JSON.stringify({ hello: "world" })).recognized === false, "non-spec not flagged");
  ok("no-paths", explainSpec(JSON.stringify({ openapi: "3.0.0", info: { title: "x" } })).recognized === false, "spec without paths not flagged");

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  "s3-version", "s3-schemes", "s3-opcount", "s3-get-auth", "s3-get-resp", "s3-post-body", "s3-pathparam", "s3-explicit-public", "s3-summary", "s3-no-flags",
  "s2-version", "s2-noschemes", "s2-formdata", "s2-all-unauth", "s2-flags", "ref-resolve", "ref-schemes",
  "run-json", "reject-bad-json", "reject-empty", "not-a-spec", "no-paths",
];
