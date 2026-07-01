// ============================================================================
// src/lib/tools/http-request-translator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Locked cases: each curl command has expected parse facts. verifyVectors()
// checks method inference, URL parsing, header/body handling, and that each
// translation contains the load-bearing substrings.
// ============================================================================

import { parseCurl } from "./compute";

export const SET_ID = "http-request-translator/2026-07-01";

interface Vector {
  name: string;
  input: string;
  check: (p: ReturnType<typeof parseCurl>) => string | null; // null = pass, else message
}

export const VECTORS: Vector[] = [
  {
    name: "simple-get",
    input: "curl https://api.example.com/users",
    check: (p) =>
      !p.ok ? "should parse"
      : p.method !== "GET" ? "method should be GET"
      : !p.methodInferred ? "GET should be inferred"
      : p.urlParts?.host !== "api.example.com" ? "host wrong"
      : p.urlParts?.path !== "/users" ? "path wrong"
      : null,
  },
  {
    name: "post-json-d",
    input: `curl -X POST https://api.example.com/users -H "Content-Type: application/json" -d '{"name":"Alice"}'`,
    check: (p) =>
      p.method !== "POST" ? "method POST"
      : p.methodInferred ? "method explicit, not inferred"
      : !p.body?.looksJson ? "should detect JSON body"
      : p.body?.contentTypeImplicit ? "content-type was explicit"
      : !p.translations.fetch.includes(`method: 'POST'`) ? "fetch missing method"
      : !p.translations.fetch.includes("name") ? "fetch missing body"
      : !p.translations.python.includes("requests.post(") ? "python missing post"
      : null,
  },
  {
    name: "infer-post-from-data",
    input: `curl https://x.test/api -d 'a=1&b=2'`,
    check: (p) =>
      p.method !== "POST" ? "should infer POST from -d"
      : !p.methodInferred ? "should be inferred"
      : p.body?.contentType !== "application/x-www-form-urlencoded" ? "default CT wrong"
      : !p.body?.contentTypeImplicit ? "CT should be implicit"
      : null,
  },
  {
    name: "bearer-auth-header",
    input: `curl https://api.test/me -H "Authorization: Bearer abc123"`,
    check: (p) =>
      p.auth?.kind !== "bearer" ? "should detect bearer"
      : p.auth?.token !== "abc123" ? "token wrong"
      : null,
  },
  {
    name: "basic-auth-u",
    input: `curl -u alice:secret https://api.test/private`,
    check: (p) =>
      p.auth?.kind !== "basic" ? "should detect basic"
      : p.auth?.user !== "alice" ? "user wrong"
      : p.auth?.token !== "secret" ? "pass wrong"
      : !p.translations.python.includes(`auth=("alice", "secret")`) ? "python auth missing"
      : null,
  },
  {
    name: "clustered-short-flags-and-attached",
    input: `curl -sSL -XDELETE https://api.test/item/5`,
    check: (p) =>
      p.method !== "DELETE" ? "-XDELETE attached value"
      : !p.options.some((o) => o.id === "location") ? "-L in cluster missing"
      : !p.options.some((o) => o.id === "silent") ? "-s in cluster missing"
      : null,
  },
  {
    name: "insecure-and-plaintext-warnings",
    input: `curl -k http://10.0.0.1/status`,
    check: (p) =>
      !p.warnings.includes("insecureTls") ? "missing insecureTls warning"
      : !p.warnings.includes("plaintextHttp") ? "missing plaintextHttp warning"
      : null,
  },
  {
    name: "multipart-form",
    input: `curl -F name=Alice -F avatar=@pic.png https://api.test/upload`,
    check: (p) =>
      p.method !== "POST" ? "form should infer POST"
      : p.body?.kind !== "form" ? "body should be form"
      : (p.body?.fields?.length ?? 0) !== 2 ? "two fields"
      : !p.body?.fields?.some((f) => f.isFile && f.name === "avatar") ? "file field not flagged"
      : !p.translations.fetch.includes("FormData") ? "fetch missing FormData"
      : null,
  },
  {
    name: "query-string-parsed",
    input: `curl "https://api.test/search?q=hello world&page=2"`,
    check: (p) =>
      (p.urlParts?.query.length ?? 0) !== 2 ? "should parse 2 query params"
      : p.urlParts?.query[0].value !== "hello world" ? "should decode query value"
      : null,
  },
  {
    name: "not-a-curl-command",
    input: `wget https://example.com/file.zip`,
    check: (p) =>
      p.ok ? "should not parse wget as curl"
      : p.errorId !== "notCurl" ? "should flag notCurl"
      : null,
  },
];

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    try {
      const msg = v.check(parseCurl(v.input));
      if (msg) failures.push(`${v.name}: ${msg}`);
    } catch (e) {
      failures.push(`${v.name}: threw ${(e as Error).message}`);
    }
  }
  return { ok: failures.length === 0, failures };
}
