// ============================================================================
// src/lib/tools/url-inspector/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden + reject vectors for the URL inspector. Each golden input asserts the
// decomposed components and the assessment reasons. verifyVectors() runs the set
// (build-time check and runnable standalone).
//
// 2026-10-27: share vectors added (SHARE_VECTORS, the copy a Share results link
// carries, made by shareableUrl), so the set id moved from
// "url-inspector-golden-v1" (scripts/api-sync.json records it; the re-check is
// in the wave's notes).
//
// 2026-11-01: X-Amz-Credential keeps its credential scope (only the access key
// ID goes), and a presigned URL with a session token is pinned, so the set id
// moved from "url-inspector-golden-2026-10-27".
// ============================================================================

import { inspectUrl, shareableUrl, UrlParseError, type UrlParseErrorCode, type UrlReport } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "url-inspector-golden-2026-11-01";

interface UrlExpect {
  scheme?: string | null;
  hasAuthority?: boolean;
  host?: string | null;
  hostType?: "ipv4" | "ipv6" | "registered-name" | null;
  hostUnicode?: string | null;
  hasPassword?: boolean;
  port?: number | null;
  defaultPort?: number | null;
  pathSegments?: string[];
  params?: string[]; // "key=value" or "key=" for null value
  fragment?: string | null;
  requiredReasons?: string[];
  forbiddenReasons?: string[];
}

export interface UrlGoldenVector {
  id: string;
  description: string;
  input: string;
  expect: UrlExpect;
}

export interface UrlRejectVector {
  id: string;
  description: string;
  input: string;
  expectCode: UrlParseErrorCode;
}

const paramStr = (p: { key: string; value: string | null }) => `${p.key}=${p.value === null ? "" : p.value}`;

export const URL_GOLDEN_VECTORS: UrlGoldenVector[] = [
  {
    id: "full-https",
    description: "Every component present: userinfo, host, port, path, query, fragment",
    input: "https://user:pass@www.example.com:8443/path/to/page?a=1&b=hello%20world&c#section",
    expect: {
      scheme: "https",
      hasAuthority: true,
      host: "www.example.com",
      hostType: "registered-name",
      hasPassword: true,
      port: 8443,
      defaultPort: 443,
      pathSegments: ["path", "to", "page"],
      params: ["a=1", "b=hello world", "c="],
      fragment: "section",
      requiredReasons: ["CREDENTIALS_IN_URL", "NON_DEFAULT_PORT", "PERCENT_ENCODED"],
      forbiddenReasons: ["RELATIVE_REFERENCE"],
    },
  },
  {
    id: "ipv6-host",
    description: "IPv6 literal host with a port",
    input: "https://[2001:db8::1]:8080/api/v2",
    expect: { scheme: "https", host: "[2001:db8::1]", hostType: "ipv6", port: 8080, pathSegments: ["api", "v2"] },
  },
  {
    id: "ipv4-host",
    description: "IPv4 literal host",
    input: "http://192.168.1.1:8080/admin",
    expect: { host: "192.168.1.1", hostType: "ipv4", port: 8080, requiredReasons: ["PLAINTEXT_SCHEME", "NON_DEFAULT_PORT"] },
  },
  {
    id: "idn-punycode",
    description: "Internationalized host decoded from punycode",
    input: "https://xn--mnchen-3ya.de/",
    expect: { host: "xn--mnchen-3ya.de", hostType: "registered-name", hostUnicode: "münchen.de", pathSegments: [], requiredReasons: ["IDN_HOST"] },
  },
  {
    id: "plaintext-http",
    description: "Unencrypted scheme is flagged",
    input: "http://example.com/login",
    expect: { scheme: "http", defaultPort: 80, port: null, pathSegments: ["login"], requiredReasons: ["PLAINTEXT_SCHEME"] },
  },
  {
    id: "mailto-opaque",
    description: "Scheme without authority (mailto)",
    input: "mailto:foo@bar.com",
    expect: { scheme: "mailto", hasAuthority: false, host: null, hostType: null, pathSegments: ["foo@bar.com"] },
  },
  {
    id: "relative-ref",
    description: "Relative reference with form-encoded plus",
    input: "/search?q=test+value&lang=en",
    expect: { scheme: null, hasAuthority: false, pathSegments: ["search"], params: ["q=test+value", "lang=en"], requiredReasons: ["RELATIVE_REFERENCE", "PLUS_IN_QUERY"] },
  },
  {
    id: "redundant-port",
    description: "Explicit port equal to the scheme default; root path yields no segments",
    input: "https://example.com:443/",
    expect: { port: 443, defaultPort: 443, pathSegments: [], requiredReasons: ["REDUNDANT_DEFAULT_PORT"], forbiddenReasons: ["NON_DEFAULT_PORT"] },
  },
  {
    id: "trailing-slash",
    description: "Trailing slash does not add an empty segment",
    input: "https://example.com/a/b/",
    expect: { pathSegments: ["a", "b"] },
  },
  {
    id: "flag-param",
    description: "Query key with no value",
    input: "https://example.com/?debug",
    expect: { params: ["debug="], pathSegments: [] },
  },
  {
    id: "uppercase-normalize",
    description: "Uppercase scheme and host are flagged for normalization",
    input: "HTTPS://EXAMPLE.COM/Path",
    expect: { scheme: "HTTPS", host: "EXAMPLE.COM", requiredReasons: ["UPPERCASE_SCHEME", "UPPERCASE_HOST"], pathSegments: ["Path"] },
  },
];

export const URL_REJECT_VECTORS: UrlRejectVector[] = [
  { id: "empty", description: "Empty input", input: "   ", expectCode: "empty" },
];

/** A share vector: a URL, the copy a link carries, how many values it replaces, and what must not be in it. */
export interface UrlShareVector {
  /** The vector's id. */
  id: string;
  /** What it shows. */
  note: string;
  /** The URL as typed. */
  input: string;
  /** The copy, byte for byte (null for a refusal). */
  expect: string | null;
  /** How many values are replaced. */
  redacted: number;
  /** Strings the copy must not hold. */
  secrets: string[];
  /** Notes the copy loses because they concerned only a replaced value. */
  lost?: string[];
  /** For a refusal: the rule of the secret left in the copy. */
  residual?: "pem-private-key" | "jwt" | "url-password";
}

/*
 * The share vectors' URLs and copies are constants, not field values: scripts/check-citation-fields reads a field
 * that holds an http URL as a citation for the liveness audit, and these are inputs and expected outputs.
 */
const URL_EXAMPLE = "https://user:pass@www.example.com:8443/path/to/page?a=1&b=hello%20world&c#section"; // the page's Example
const URL_EXAMPLE_COPY = "https://user:REDACTED@www.example.com:8443/path/to/page?a=1&b=hello%20world&c#section"; // its copy
const URL_BEARER = "https://server.example.com/resource?access_token=mF_9.B5f-4.1JqM&p=q"; // RFC 6750 section 2.3's example
const URL_BEARER_COPY = "https://server.example.com/resource?access_token=REDACTED&p=q"; // its copy
const URL_IMPLICIT = "http://example.com/cb#access_token=2YotnFZFEjr1zCsicMWpAA&state=xyz&token_type=example&expires_in=3600"; // RFC 6749 section 4.2.2's example
const URL_IMPLICIT_COPY = "http://example.com/cb#access_token=REDACTED&state=xyz&token_type=example&expires_in=3600"; // its copy
const URL_CODE = "https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz"; // RFC 6749 section 4.1.2's example
const URL_CODE_COPY = "https://client.example.com/cb?code=REDACTED&state=xyz"; // its copy
const URL_AWS = "https://ec2.amazonaws.com/?Action=DescribeRegions&Version=2016-11-15&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20220830%2Fus-east-1%2Fec2%2Faws4_request&X-Amz-Date=20220830T123600Z&X-Amz-SignedHeaders=host%3Bx-amz-date&X-Amz-Signature=calculated-signature"; // the IAM guide's query shape
const URL_AWS_COPY = "https://ec2.amazonaws.com/?Action=DescribeRegions&Version=2016-11-15&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=REDACTED%2F20220830%2Fus-east-1%2Fec2%2Faws4_request&X-Amz-Date=20220830T123600Z&X-Amz-SignedHeaders=host%3Bx-amz-date&X-Amz-Signature=REDACTED"; // its copy (2026-11-01: the scope stays)
const URL_AWS_STS = "https://ec2.amazonaws.com/?Action=DescribeInstances&Version=2016-11-15&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAIOSFODNN7EXAMPLE/20220830/us-east-1/ec2/aws4_request&X-Amz-Date=20220830T123600Z&X-Amz-SignedHeaders=host;x-amz-date&X-Amz-Security-Token=FwoGZXIvYXdzEXAMPLESESSIONTOKEN&X-Amz-Signature=calculated-signature"; // the IAM guide's query, slashes as written there, with a session token (2026-11-01)
const URL_AWS_STS_COPY = "https://ec2.amazonaws.com/?Action=DescribeInstances&Version=2016-11-15&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=REDACTED/20220830/us-east-1/ec2/aws4_request&X-Amz-Date=20220830T123600Z&X-Amz-SignedHeaders=host;x-amz-date&X-Amz-Security-Token=REDACTED&X-Amz-Signature=REDACTED"; // its copy
const URL_SAS = "https://myaccount.blob.core.windows.net/sascontainer/sasblob.txt?sv=2022-11-02&sr=b&sp=rw&sig=Z%2FRHIX5Xcg0Mq2rqI3OlWTjEg2tYkboXr1P9ZUXDtkk%3D"; // an Azure storage SAS
const URL_SAS_COPY = "https://myaccount.blob.core.windows.net/sascontainer/sasblob.txt?sv=2022-11-02&sr=b&sp=rw&sig=REDACTED"; // its copy
const URL_KEY = "https://language.googleapis.com/v1/documents:analyzeEntities?key=AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe"; // Google's key parameter
const URL_KEY_COPY = "https://language.googleapis.com/v1/documents:analyzeEntities?key=REDACTED"; // its copy
const URL_PLAIN = "https://example.com/search?q=hello"; // nothing to replace
const URL_USER = "ftp://anonymous@ftp.example.org/pub/"; // a user name without a password
const URL_JWT_PATH = "https://api.example.com/v1/sessions/eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl"; // a JWT in the path

/** The share vectors (2026-10-27; the AWS ones 2026-11-01). */
export const SHARE_VECTORS: readonly UrlShareVector[] = Object.freeze([
  { id: "share-example-userinfo", note: "The page's Example: the password after the userinfo's first colon goes (RFC 3986 3.2.1); the user stays", input: URL_EXAMPLE, expect: URL_EXAMPLE_COPY, redacted: 1, secrets: [":pass@"] },
  { id: "share-access-token-query", note: "RFC 6750 section 2.3: access_token in the query", input: URL_BEARER, expect: URL_BEARER_COPY, redacted: 1, secrets: ["mF_9.B5f-4.1JqM"] },
  { id: "share-implicit-fragment", note: "RFC 6749 section 4.2.2: access_token in the fragment; state, token_type and expires_in stay", input: URL_IMPLICIT, expect: URL_IMPLICIT_COPY, redacted: 1, secrets: ["2YotnFZFEjr1zCsicMWpAA"] },
  { id: "share-authorization-code", note: "RFC 6749 section 4.1.2: the code in the redirection URI", input: URL_CODE, expect: URL_CODE_COPY, redacted: 1, secrets: ["SplxlOBeZQQYbYS6WxSbIA"] },
  { id: "share-aws-signature", note: "AWS SigV4 in the query: X-Amz-Signature goes; of X-Amz-Credential only the access key ID goes, its scope (date, Region, service) stays percent-encoded as typed (2026-11-01)", input: URL_AWS, expect: URL_AWS_COPY, redacted: 2, secrets: ["calculated-signature", "AKIAIOSFODNN7EXAMPLE"] },
  { id: "share-aws-session-token", note: "Temporary credentials (AWS STS): X-Amz-Security-Token and X-Amz-Signature go whole, X-Amz-Credential keeps its scope written with plain slashes (2026-11-01)", input: URL_AWS_STS, expect: URL_AWS_STS_COPY, redacted: 3, secrets: ["ASIAIOSFODNN7EXAMPLE", "FwoGZXIvYXdzEXAMPLESESSIONTOKEN", "calculated-signature"] },
  { id: "share-azure-sas", note: "An Azure SAS: sig goes; its percent-escapes were the URL's only ones, so that note goes with it", input: URL_SAS, expect: URL_SAS_COPY, redacted: 1, secrets: ["Z%2FRHIX5Xcg0Mq2rqI3OlWTjEg2tYkboXr1P9ZUXDtkk%3D"], lost: ["PERCENT_ENCODED"] },
  { id: "share-google-key", note: "Google's key parameter", input: URL_KEY, expect: URL_KEY_COPY, redacted: 1, secrets: ["AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe"] },
  { id: "share-nothing-to-replace", note: "No credential: the copy is the URL", input: URL_PLAIN, expect: URL_PLAIN, redacted: 0, secrets: [] },
  { id: "share-user-only", note: "A user name without a password stays", input: URL_USER, expect: URL_USER, redacted: 0, secrets: [] },
  { id: "share-refused-jwt-path", note: "A JWT in the path has no name to be found by: the net finds it, and no link is offered", input: URL_JWT_PATH, expect: null, redacted: 0, secrets: [], residual: "jwt" },
]);

/** What the receiving page reads, without the values the copy replaces (and without the notes a vector says it loses). */
function readingShape(r: UrlReport, lost: readonly string[]): string {
  return JSON.stringify([r.scheme, r.isAbsolute, r.hasAuthority, r.userinfo?.user ?? null, r.userinfo?.hasPassword ?? null, r.host, r.hostType, r.hostUnicode, r.port, r.defaultPort, r.path, r.pathSegments, r.params.map((p) => [p.key, p.value === null]), r.fragment !== null, r.reasons.map((x) => x.code).filter((c) => !lost.includes(c))]); // compact
} // readingShape

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of URL_GOLDEN_VECTORS) {
    try {
      const r = inspectUrl(v.input);
      const e = v.expect;
      const errs: string[] = [];
      const eq = (name: string, got: unknown, want: unknown) => {
        if (want !== undefined && JSON.stringify(got) !== JSON.stringify(want)) errs.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
      };
      eq("scheme", r.scheme, e.scheme);
      eq("hasAuthority", r.hasAuthority, e.hasAuthority);
      eq("host", r.host, e.host);
      eq("hostType", r.hostType, e.hostType);
      eq("hostUnicode", r.hostUnicode, e.hostUnicode);
      if (e.hasPassword !== undefined) eq("hasPassword", r.userinfo?.hasPassword ?? false, e.hasPassword);
      eq("port", r.port, e.port);
      eq("defaultPort", r.defaultPort, e.defaultPort);
      eq("pathSegments", r.pathSegments, e.pathSegments);
      if (e.params !== undefined) eq("params", r.params.map(paramStr), e.params);
      eq("fragment", r.fragment, e.fragment);
      const codes = new Set(r.reasons.map((x) => x.code));
      for (const c of e.requiredReasons ?? []) if (!codes.has(c)) errs.push(`missing reason ${c}`);
      for (const c of e.forbiddenReasons ?? []) if (codes.has(c)) errs.push(`unexpected reason ${c}`);
      if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
      else passed++;
    } catch (err) {
      failures.push(`[${v.id}] threw ${err instanceof UrlParseError ? err.code : String(err)}`);
    }
  }

  // The share vectors: the copy, the count, no secret in it, the same reading on the receiving page, a stable copy.
  for (const v of SHARE_VECTORS) {
    const errs: string[] = []; // this vector's
    try {
      const out = shareableUrl(v.input); // the copy
      if (v.residual) { if (out.residual?.rule !== v.residual) errs.push(`residual ${out.residual?.rule ?? "none"} != ${v.residual}`); } // a refusal
      else {
        if (out.residual) errs.push(`unexpected residual ${out.residual.rule}`); // nothing may be left
        if (out.text !== v.expect) errs.push(`copy ${JSON.stringify(out.text)}`); // byte for byte
        if (out.redacted !== v.redacted) errs.push(`redacted ${out.redacted} != ${v.redacted}`); // the count
        for (const secret of v.secrets) if (out.text.includes(secret)) errs.push(`the copy contains ${JSON.stringify(secret)}`); // never travels
        if (readingShape(inspectUrl(v.input), v.lost ?? []) !== readingShape(inspectUrl(out.text), v.lost ?? [])) errs.push("the copy reads differently"); // the same parts
        const again = shareableUrl(out.text); // the copy of the copy
        if (again.text !== out.text || again.redacted !== 0) errs.push("the copy of the copy differs"); // stable
      }
    } catch (err) {
      errs.push(`threw ${String(err)}`); // a defect
    }
    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  for (const v of URL_REJECT_VECTORS) {
    try {
      inspectUrl(v.input);
      failures.push(`[${v.id}] expected reject ${v.expectCode} but parsed`);
    } catch (err) {
      if (err instanceof UrlParseError && err.code === v.expectCode) passed++;
      else failures.push(`[${v.id}] got ${err instanceof UrlParseError ? err.code : String(err)} want ${v.expectCode}`);
    }
  }

  return { passed, failed: failures.length, failures };
}
