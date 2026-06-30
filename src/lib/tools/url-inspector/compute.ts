// ============================================================================
// src/lib/tools/url-inspector/compute.ts
// ----------------------------------------------------------------------------
// THE URL INSPECTOR ENGINE.
//
// Dissects a URL into its named RFC 3986 components and breaks the query string
// out into individual, percent-decoded parameters. It parses the URL exactly as
// written (it does not silently normalize), then annotates what it found: the
// host type, the scheme's default port, whether credentials are embedded, an
// internationalized (punycode) host decoded to Unicode, and so on.
//
// Pure and deterministic. It runs entirely in the browser and contacts nothing.
//
// Grammar: RFC 3986 Appendix B regular expression for the five top-level parts,
// then a hand-written authority split. Punycode decoding follows RFC 3492.
// ============================================================================

// -- Errors -------------------------------------------------------------------
export type UrlParseErrorCode = "empty";

export class UrlParseError extends Error {
  code: UrlParseErrorCode;
  constructor(code: UrlParseErrorCode, message?: string) {
    super(message ?? code);
    this.name = "UrlParseError";
    this.code = code;
  }
}

// -- Public report shape ------------------------------------------------------
export interface QueryParam {
  rawKey: string;
  rawValue: string | null;
  key: string; // percent-decoded
  value: string | null; // percent-decoded
}

export type HostType = "ipv4" | "ipv6" | "registered-name";

export interface UrlReason {
  code: string;
  value?: string;
}

export interface UrlReport {
  input: string;
  scheme: string | null;
  isAbsolute: boolean;
  hasAuthority: boolean;
  userinfo: { user: string; hasPassword: boolean } | null;
  host: string | null;
  hostType: HostType | null;
  hostUnicode: string | null; // set when the host is an IDN (punycode)
  isIdn: boolean;
  port: number | null;
  defaultPort: number | null; // for the scheme, when known
  path: string;
  pathSegments: string[];
  query: string | null;
  params: QueryParam[];
  fragment: string | null;
  reasons: UrlReason[];
}

// -- Scheme tables ------------------------------------------------------------
const DEFAULT_PORTS: Record<string, number> = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21,
  ftps: 990,
  ssh: 22,
  sftp: 22,
  telnet: 23,
  smtp: 25,
  ldap: 389,
  ldaps: 636,
  rdp: 3389,
};

// Schemes whose traffic is not encrypted in transit.
const PLAINTEXT_SCHEMES = new Set(["http", "ws", "ftp", "telnet", "smtp", "ldap"]);

// -- Percent-decoding (tolerant, UTF-8 aware) ---------------------------------
/** Decode %XX escapes as UTF-8; leave malformed escapes and other bytes intact. */
function percentDecode(s: string): string {
  const out: string[] = [];
  let bytes: number[] = [];
  const flush = () => {
    if (bytes.length) {
      out.push(new TextDecoder().decode(new Uint8Array(bytes)));
      bytes = [];
    }
  };
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "%" && i + 2 < s.length && /^[0-9a-fA-F]{2}$/.test(s.slice(i + 1, i + 3))) {
      bytes.push(parseInt(s.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      flush();
      out.push(s[i]);
    }
  }
  flush();
  return out.join("");
}

// -- Punycode (RFC 3492) decode ----------------------------------------------
function adaptBias(delta: number, numPoints: number, firstTime: boolean): number {
  const base = 36;
  const tmin = 1;
  const tmax = 26;
  const skew = 38;
  const damp = 700;
  delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
  delta += Math.floor(delta / numPoints);
  let k = 0;
  while (delta > ((base - tmin) * tmax) >> 1) {
    delta = Math.floor(delta / (base - tmin));
    k += base;
  }
  return k + Math.floor(((base - tmin + 1) * delta) / (delta + skew));
}

/** Decode a single punycode label (the part after "xn--"), or null on error. */
function punycodeDecodeLabel(input: string): string | null {
  const base = 36;
  const tmin = 1;
  const tmax = 26;
  const initialBias = 72;
  const initialN = 128;
  const output: number[] = [];
  let n = initialN;
  let bias = initialBias;
  let i = 0;

  const lastDelim = input.lastIndexOf("-");
  const basicEnd = lastDelim < 0 ? 0 : lastDelim;
  for (let j = 0; j < basicEnd; j++) {
    const c = input.charCodeAt(j);
    if (c >= 0x80) return null;
    output.push(c);
  }

  let idx = lastDelim < 0 ? 0 : lastDelim + 1;
  while (idx < input.length) {
    const oldi = i;
    let w = 1;
    for (let k = base; ; k += base) {
      if (idx >= input.length) return null;
      const c = input.charCodeAt(idx++);
      let digit: number;
      if (c - 48 < 10) digit = c - 22;
      else if (c - 65 < 26) digit = c - 65;
      else if (c - 97 < 26) digit = c - 97;
      else return null;
      if (digit >= base) return null;
      i += digit * w;
      const t = k <= bias ? tmin : k >= bias + tmax ? tmax : k - bias;
      if (digit < t) break;
      w *= base - t;
    }
    const outLen = output.length + 1;
    bias = adaptBias(i - oldi, outLen, oldi === 0);
    n += Math.floor(i / outLen);
    i %= outLen;
    output.splice(i, 0, n);
    i++;
  }

  try {
    return String.fromCodePoint(...output);
  } catch {
    return null;
  }
}

/** Decode every xn-- label in a host; returns the Unicode host, or null if none changed. */
function decodeIdnHost(host: string): string | null {
  if (!/(^|\.)xn--/i.test(host)) return null;
  const labels = host.split(".");
  let changed = false;
  const decoded = labels.map((label) => {
    if (/^xn--/i.test(label)) {
      const u = punycodeDecodeLabel(label.slice(4));
      if (u !== null) {
        changed = true;
        return u;
      }
    }
    return label;
  });
  return changed ? decoded.join(".") : null;
}

// -- Host classification ------------------------------------------------------
function classifyHost(host: string): HostType {
  if (host.startsWith("[") && host.endsWith("]")) return "ipv6";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const ok = host.split(".").every((o) => Number(o) <= 255);
    if (ok) return "ipv4";
  }
  return "registered-name";
}

// -- Authority split: [userinfo@]host[:port] ----------------------------------
function parseAuthority(authority: string): {
  userinfo: { user: string; hasPassword: boolean } | null;
  host: string | null;
  port: number | null;
  portRaw: string | null;
} {
  let rest = authority;
  let userinfo: { user: string; hasPassword: boolean } | null = null;

  const at = rest.lastIndexOf("@");
  if (at >= 0) {
    const ui = rest.slice(0, at);
    rest = rest.slice(at + 1);
    const colon = ui.indexOf(":");
    userinfo = { user: colon >= 0 ? ui.slice(0, colon) : ui, hasPassword: colon >= 0 };
  }

  let host: string | null = null;
  let portRaw: string | null = null;

  if (rest.startsWith("[")) {
    // IPv6 literal: host is up to and including ']', then optional :port.
    const close = rest.indexOf("]");
    if (close >= 0) {
      host = rest.slice(0, close + 1);
      const tail = rest.slice(close + 1);
      if (tail.startsWith(":")) portRaw = tail.slice(1);
    } else {
      host = rest;
    }
  } else {
    const colon = rest.lastIndexOf(":");
    if (colon >= 0) {
      host = rest.slice(0, colon);
      portRaw = rest.slice(colon + 1);
    } else {
      host = rest;
    }
  }

  const port = portRaw !== null && /^\d+$/.test(portRaw) ? Number(portRaw) : null;
  return { userinfo, host: host || null, port, portRaw };
}

// -- Query split --------------------------------------------------------------
function parseQuery(query: string): QueryParam[] {
  if (query === "") return [];
  return query.split("&").map((pair) => {
    const eq = pair.indexOf("=");
    const rawKey = eq >= 0 ? pair.slice(0, eq) : pair;
    const rawValue = eq >= 0 ? pair.slice(eq + 1) : null;
    return {
      rawKey,
      rawValue,
      key: percentDecode(rawKey),
      value: rawValue === null ? null : percentDecode(rawValue),
    };
  });
}

// -- Entry point --------------------------------------------------------------
// RFC 3986 Appendix B: scheme(2) authority(4) path(5) query(7) fragment(9).
const RFC3986 = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/;

/**
 * inspectUrl - dissect a URL string into named components.
 * @throws {UrlParseError} only on empty input
 */
export function inspectUrl(input: string): UrlReport {
  if (!input || !input.trim()) throw new UrlParseError("empty");
  const raw = input.trim();
  const m = RFC3986.exec(raw);
  // The regex matches any string, but guard anyway.
  if (!m) throw new UrlParseError("empty");

  const scheme = m[2] ? m[2] : null;
  const hasAuthority = m[3] !== undefined;
  const authority = m[4] ?? "";
  const path = m[5] ?? "";
  const query = m[7] !== undefined ? m[7] : null;
  const fragment = m[9] !== undefined ? m[9] : null;

  let userinfo: UrlReport["userinfo"] = null;
  let host: string | null = null;
  let port: number | null = null;
  if (hasAuthority) {
    const a = parseAuthority(authority);
    userinfo = a.userinfo;
    host = a.host;
    port = a.port;
  }

  const hostType = host ? classifyHost(host) : null;
  const hostUnicode = host && hostType === "registered-name" ? decodeIdnHost(host) : null;
  const isIdn = hostUnicode !== null;

  const schemeLower = scheme ? scheme.toLowerCase() : null;
  const defaultPort = schemeLower && schemeLower in DEFAULT_PORTS ? DEFAULT_PORTS[schemeLower] : null;

  const trimmedPath = path.replace(/^\//, "");
  let pathSegments = trimmedPath === "" ? [] : trimmedPath.split("/");
  if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1] === "") {
    pathSegments = pathSegments.slice(0, -1); // drop the empty segment from a trailing slash
  }
  const params = query !== null ? parseQuery(query) : [];

  // -- Assessment -------------------------------------------------------------
  const reasons: UrlReason[] = [];
  if (!scheme && !hasAuthority) reasons.push({ code: "RELATIVE_REFERENCE" });
  else if (!scheme) reasons.push({ code: "NO_SCHEME" });
  if (userinfo) {
    reasons.push(userinfo.hasPassword ? { code: "CREDENTIALS_IN_URL" } : { code: "USERINFO_PRESENT" });
  }
  if (schemeLower && PLAINTEXT_SCHEMES.has(schemeLower)) reasons.push({ code: "PLAINTEXT_SCHEME", value: schemeLower });
  if (port !== null && defaultPort !== null) {
    reasons.push(port === defaultPort ? { code: "REDUNDANT_DEFAULT_PORT", value: String(port) } : { code: "NON_DEFAULT_PORT", value: String(port) });
  }
  if (isIdn) reasons.push({ code: "IDN_HOST" });
  if (scheme && scheme !== schemeLower) reasons.push({ code: "UPPERCASE_SCHEME" });
  if (host && hostType === "registered-name" && host !== host.toLowerCase()) reasons.push({ code: "UPPERCASE_HOST" });
  if (/%[0-9a-fA-F]{2}/.test(raw)) reasons.push({ code: "PERCENT_ENCODED" });
  if (query && query.includes("+")) reasons.push({ code: "PLUS_IN_QUERY" });

  return {
    input: raw,
    scheme,
    isAbsolute: scheme !== null,
    hasAuthority,
    userinfo,
    host,
    hostType,
    hostUnicode,
    isIdn,
    port,
    defaultPort,
    path,
    pathSegments,
    query,
    params,
    fragment,
    reasons,
  };
}
