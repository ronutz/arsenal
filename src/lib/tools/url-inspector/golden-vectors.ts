// ============================================================================
// src/lib/tools/url-inspector/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden + reject vectors for the URL inspector. Each golden input asserts the
// decomposed components and the assessment reasons. verifyVectors() runs the set
// (build-time check and runnable standalone).
// ============================================================================

import { inspectUrl, UrlParseError, type UrlParseErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "url-inspector-golden-v1";

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
