// ============================================================================
// src/lib/tools/ssrf-url-classifier/compute.ts
// ----------------------------------------------------------------------------
// Classify where a URL points and flag SSRF (Server-Side Request Forgery) risk,
// entirely locally. Paste a URL and the tool parses it, decodes the classic
// IP-obfuscation tricks attackers use to smuggle an internal address past a
// naive filter (decimal, octal, hex, and short-form IPv4, plus IPv4-mapped
// IPv6), classifies the destination (loopback, private, link-local, cloud
// metadata, CGNAT, reserved, or public), and flags dangerous URL schemes.
//
// IT NEVER RESOLVES DNS AND NEVER ISSUES THE REQUEST (D-53): it is a classifier
// for learning and allow-list design, not a probe. A bare hostname that is not a
// known-special name is reported as "resolves at runtime" - the honest answer,
// since its address is only known after a DNS lookup we deliberately do not do.
//
// IMPORTANT: the destination host is extracted from the RAW input string, not
// from new URL().hostname. The WHATWG URL parser canonicalizes numeric hosts
// (http://2130706433/ -> hostname "127.0.0.1"), which would erase exactly the
// obfuscation this tool exists to reveal. We therefore parse the host ourselves
// and use new URL only for the surrounding structure (scheme, port, userinfo).
// ============================================================================

// ---- Types ------------------------------------------------------------------

export type HostCategory =
  | "loopback"
  | "private"
  | "link-local"
  | "cloud-metadata"
  | "cgnat"
  | "reserved"
  | "public"
  | "internal-name"
  | "unresolved";

export type RiskLevel = "high" | "medium" | "low" | "unknown";

export interface SsrfResult {
  input: string;
  /** Parsed URL parts (best-effort). */
  scheme: string | null;
  host: string | null;
  port: string | null;
  path: string | null;
  /** True if the host is (or decodes to) an IP literal. */
  isIp: boolean;
  ipVersion: 4 | 6 | null;
  /** Canonical dotted/colon form of the address, when the host is an IP. */
  canonicalIp: string | null;
  /** True if the host was an obfuscated form of an IP (e.g. 2130706433). */
  obfuscated: boolean;
  /** How the host was written, when obfuscated (decimal / octal / hex / short). */
  obfuscationForm: string | null;
  category: HostCategory;
  risk: RiskLevel;
  /** Plain-language reasons for the classification. */
  reasons: string[];
  /** Non-http(s) scheme that escalates SSRF, when present. */
  schemeFlag: string | null;
  /** True if credentials are embedded in the URL (user:pass@host). */
  hasUserinfo: boolean;
}

// ---- Raw host extraction ----------------------------------------------------
// Pull the authority's host out of the input WITHOUT canonicalizing it, so an
// obfuscated numeric host survives to be decoded below.

function extractRawHost(input: string): string {
  let s = input.trim();
  s = s.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, ""); // scheme://
  s = s.replace(/^\/\//, ""); // protocol-relative //
  s = s.split(/[/?#]/)[0]; // drop path / query / fragment
  const at = s.lastIndexOf("@");
  if (at >= 0) s = s.slice(at + 1); // drop userinfo
  if (s.startsWith("[")) {
    const close = s.indexOf("]");
    s = close >= 0 ? s.slice(1, close) : s.slice(1); // inside [ ] -> IPv6
  } else {
    const colon = s.lastIndexOf(":");
    if (colon >= 0 && /^\d*$/.test(s.slice(colon + 1))) s = s.slice(0, colon); // drop :port
  }
  return s.toLowerCase();
}

// ---- Loose IPv4 parsing (inet_aton semantics) -------------------------------
// inet_aton accepts far more than dotted-decimal: 1, 2, 3, or 4 parts, each in
// decimal, octal (leading 0), or hex (0x), with the final part filling all the
// remaining low octets. This is exactly what SSRF filter bypasses rely on, so
// decoding it is the point.

type IpForm = "dotted" | "decimal" | "octal" | "hex" | "short";

interface LooseIpv4 {
  value: number; // unsigned 32-bit
  form: IpForm;
}

function parsePart(p: string): { n: number; radix: "dec" | "oct" | "hex" } | null {
  if (p === "") return null;
  if (/^0[xX][0-9a-fA-F]+$/.test(p)) return { n: parseInt(p.slice(2), 16), radix: "hex" };
  if (/^0[0-7]+$/.test(p)) return { n: parseInt(p, 8), radix: "oct" }; // 0 + >=1 octal digit
  if (/^(0|[1-9][0-9]*)$/.test(p)) return { n: parseInt(p, 10), radix: "dec" };
  return null;
}

function parseLooseIpv4(host: string): LooseIpv4 | null {
  const parts = host.split(".");
  if (parts.length === 0 || parts.length > 4) return null;

  const parsed: { n: number; radix: "dec" | "oct" | "hex" }[] = [];
  for (const p of parts) {
    const r = parsePart(p);
    if (!r || r.n < 0 || !Number.isFinite(r.n)) return null;
    parsed.push(r);
  }

  // The last part fills the remaining (4 - (n-1)) octets and must fit in them;
  // every earlier part is a single octet (<= 255).
  const n = parsed.length;
  for (let i = 0; i < n - 1; i++) if (parsed[i].n > 255) return null;
  const lastMaxBits = (4 - (n - 1)) * 8;
  const lastMax = lastMaxBits >= 32 ? 0xffffffff : Math.pow(2, lastMaxBits) - 1;
  if (parsed[n - 1].n > lastMax) return null;

  let value = 0;
  for (let i = 0; i < n - 1; i++) value = (value + parsed[i].n * Math.pow(256, 4 - 1 - i)) >>> 0;
  value = (value + parsed[n - 1].n) >>> 0;

  // Describe the written form, by priority: any hex part -> hex; else any octal
  // part -> octal; else all-decimal, judged by how many parts were given.
  const hasHex = parsed.some((p) => p.radix === "hex");
  const hasOct = parsed.some((p) => p.radix === "oct");
  let form: IpForm;
  if (hasHex) form = "hex";
  else if (hasOct) form = "octal";
  else if (n === 4) form = "dotted";
  else form = n === 1 ? "decimal" : "short";

  return { value, form };
}

const toDotted = (v: number): string =>
  [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff].join(".");

// ---- IPv4 classification ----------------------------------------------------

// Known cloud metadata addresses (checked before the broader ranges).
const METADATA_IPV4 = new Set(["169.254.169.254", "100.100.100.200"]);

function inCidr(v: number, base: string, bits: number): boolean {
  const b = parseLooseIpv4(base)!.value;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return ((v & mask) >>> 0) === ((b & mask) >>> 0);
}

function classifyIpv4(v: number): { category: HostCategory; reason: string } {
  const dotted = toDotted(v);
  if (METADATA_IPV4.has(dotted))
    return { category: "cloud-metadata", reason: `${dotted} is a cloud instance-metadata endpoint (IMDS)` };
  if (inCidr(v, "127.0.0.0", 8)) return { category: "loopback", reason: "127.0.0.0/8 is loopback (the host itself)" };
  if (inCidr(v, "10.0.0.0", 8)) return { category: "private", reason: "10.0.0.0/8 is private (RFC 1918)" };
  if (inCidr(v, "172.16.0.0", 12)) return { category: "private", reason: "172.16.0.0/12 is private (RFC 1918)" };
  if (inCidr(v, "192.168.0.0", 16)) return { category: "private", reason: "192.168.0.0/16 is private (RFC 1918)" };
  if (inCidr(v, "169.254.0.0", 16)) return { category: "link-local", reason: "169.254.0.0/16 is link-local (RFC 3927)" };
  if (inCidr(v, "100.64.0.0", 10)) return { category: "cgnat", reason: "100.64.0.0/10 is carrier-grade NAT (RFC 6598)" };
  if (inCidr(v, "0.0.0.0", 8)) return { category: "reserved", reason: '0.0.0.0/8 is reserved ("this" network)' };
  if (inCidr(v, "192.0.2.0", 24) || inCidr(v, "198.51.100.0", 24) || inCidr(v, "203.0.113.0", 24))
    return { category: "reserved", reason: "a documentation range (TEST-NET, RFC 5737)" };
  if (inCidr(v, "198.18.0.0", 15)) return { category: "reserved", reason: "198.18.0.0/15 is benchmarking (RFC 2544)" };
  if (inCidr(v, "224.0.0.0", 4)) return { category: "reserved", reason: "224.0.0.0/4 is multicast" };
  if (inCidr(v, "240.0.0.0", 4)) return { category: "reserved", reason: "240.0.0.0/4 is reserved for future use" };
  if (dotted === "255.255.255.255") return { category: "reserved", reason: "255.255.255.255 is the broadcast address" };
  return { category: "public", reason: `${dotted} is a public, routable address` };
}

// ---- IPv6 classification ----------------------------------------------------

function normalizeIpv6(host: string): string | null {
  // Strip zone id; validate the character set and the single-"::" rule; return
  // a normalized lowercase form. Not a full expander - enough to classify.
  const h = host.replace(/%.*$/, "").toLowerCase();
  if (!/^[0-9a-f:.]+$/.test(h) || (h.match(/::/g) ?? []).length > 1) return null;
  if (!h.includes(":")) return null;
  return h;
}

function classifyIpv6(
  host: string,
): { category: HostCategory; reason: string; canonical: string; mapped?: number } | null {
  const h = normalizeIpv6(host);
  if (h === null) return null;
  if (h === "::1") return { category: "loopback", reason: "::1 is IPv6 loopback", canonical: "::1" };
  if (h === "::") return { category: "reserved", reason: ":: is the unspecified address", canonical: "::" };
  if (h === "fd00:ec2::254")
    return { category: "cloud-metadata", reason: "fd00:ec2::254 is the AWS IMDSv6 metadata endpoint", canonical: h };
  // IPv4-mapped (::ffff:a.b.c.d) - classify the embedded IPv4.
  const mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) {
    const v4 = parseLooseIpv4(mapped[1]);
    if (v4) return { category: "reserved", reason: `an IPv4-mapped IPv6 address embedding ${toDotted(v4.value)}`, canonical: h, mapped: v4.value };
  }
  if (/^f[cd]/.test(h)) return { category: "private", reason: "fc00::/7 is a unique local address (ULA)", canonical: h };
  if (/^fe[89ab]/.test(h)) return { category: "link-local", reason: "fe80::/10 is link-local", canonical: h };
  if (/^ff/.test(h)) return { category: "reserved", reason: "ff00::/8 is multicast", canonical: h };
  return { category: "public", reason: "a public, routable IPv6 address", canonical: h };
}

// ---- Hostname classification ------------------------------------------------

const METADATA_NAMES = new Set(["metadata.google.internal", "metadata"]);

function classifyHostname(host: string): { category: HostCategory; reason: string } {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (h === "localhost" || h === "localhost.localdomain")
    return { category: "loopback", reason: '"localhost" resolves to loopback' };
  if (METADATA_NAMES.has(h))
    return { category: "cloud-metadata", reason: `"${h}" is a cloud metadata hostname (resolves to the IMDS address)` };
  if (/\.(internal|local|localhost|intranet|corp|home|lan)$/.test(h))
    return { category: "internal-name", reason: `the .${h.split(".").pop()} suffix denotes an internal / non-public name` };
  return {
    category: "unresolved",
    reason: "a hostname whose address is only known after a DNS lookup, which this tool does not perform",
  };
}

// ---- Risk mapping -----------------------------------------------------------

function riskFor(category: HostCategory): RiskLevel {
  switch (category) {
    case "loopback":
    case "private":
    case "link-local":
    case "cloud-metadata":
    case "reserved":
    case "internal-name":
      return "high";
    case "cgnat":
      return "medium";
    case "public":
      return "low";
    case "unresolved":
      return "unknown";
  }
}

const DANGEROUS_SCHEMES = new Set(["file", "gopher", "dict", "ftp", "ldap", "tftp", "sftp", "netdoc", "jar"]);

function withSchemeReason(reasons: string[], schemeFlag: string | null): string[] {
  if (!schemeFlag) return reasons;
  return [...reasons, `the ${schemeFlag}:// scheme is a common SSRF escalation vector (it can reach the local filesystem or internal services)`];
}

// ---- Entry point ------------------------------------------------------------

export function classifyUrl(input: string): SsrfResult {
  const raw = input.trim();
  if (raw === "") throw new Error("Enter a URL or host to classify.");

  const hadScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw);

  // Structure (scheme / port / path / userinfo) from new URL; host from the raw
  // string so obfuscation is preserved.
  let scheme: string | null = null;
  let port: string | null = null;
  let path: string | null = null;
  let hasUserinfo = false;
  try {
    const u = new URL(hadScheme ? raw : "http://" + raw);
    scheme = hadScheme ? u.protocol.replace(/:$/, "") : null;
    port = u.port || null;
    const p = (u.pathname === "/" ? "" : u.pathname || "") + (u.search || "");
    path = p || null;
    hasUserinfo = Boolean(u.username || u.password);
  } catch {
    const m = raw.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    if (m) scheme = m[1];
  }

  const host = extractRawHost(raw);
  const schemeFlag = scheme && DANGEROUS_SCHEMES.has(scheme.toLowerCase()) ? scheme.toLowerCase() : null;
  const base = { input: raw, scheme, port, path, hasUserinfo, schemeFlag };

  // file:// (and empty-host dangerous schemes) address the local machine.
  if (schemeFlag === "file" && (host === "" || host === "localhost")) {
    return {
      ...base,
      host: host || null,
      isIp: false,
      ipVersion: null,
      canonicalIp: null,
      obfuscated: false,
      obfuscationForm: null,
      category: "loopback",
      risk: "high",
      reasons: ["the file:// scheme addresses the local filesystem directly, not a network host"],
    };
  }

  // IPv6 literal (a colon only ever appears in an IPv6 host; the port colon has
  // already been stripped by extractRawHost).
  if (host.includes(":")) {
    const v6 = classifyIpv6(host);
    if (v6) {
      const category = v6.mapped !== undefined ? classifyIpv4(v6.mapped).category : v6.category;
      const reason =
        v6.mapped !== undefined ? `${v6.reason}, which is ${classifyIpv4(v6.mapped).reason}` : v6.reason;
      const risk = schemeFlag ? "high" : riskFor(category);
      return {
        ...base,
        host,
        isIp: true,
        ipVersion: 6,
        canonicalIp: v6.canonical,
        obfuscated: false,
        obfuscationForm: null,
        category,
        risk,
        reasons: withSchemeReason([reason], schemeFlag),
      };
    }
  }

  // IPv4 literal or obfuscated IPv4.
  const v4 = parseLooseIpv4(host);
  if (v4) {
    const dotted = toDotted(v4.value);
    const obfuscated = v4.form !== "dotted";
    const { category, reason } = classifyIpv4(v4.value);
    const reasons = [reason];
    if (obfuscated)
      reasons.unshift(
        `the host is a ${v4.form} encoding of ${dotted} - a common way to hide an internal address from a filter`,
      );
    const risk = schemeFlag ? "high" : riskFor(category);
    return {
      ...base,
      host,
      isIp: true,
      ipVersion: 4,
      canonicalIp: dotted,
      obfuscated,
      obfuscationForm: obfuscated ? v4.form : null,
      category,
      risk,
      reasons: withSchemeReason(reasons, schemeFlag),
    };
  }

  // No host at all (e.g. a bare scheme).
  if (host === "") {
    return {
      ...base,
      host: null,
      isIp: false,
      ipVersion: null,
      canonicalIp: null,
      obfuscated: false,
      obfuscationForm: null,
      category: "unresolved",
      risk: schemeFlag ? "high" : "unknown",
      reasons: withSchemeReason(["no host is present in the input"], schemeFlag),
    };
  }

  // Hostname.
  const { category, reason } = classifyHostname(host);
  const risk = schemeFlag ? "high" : riskFor(category);
  return {
    ...base,
    host,
    isIp: false,
    ipVersion: null,
    canonicalIp: null,
    obfuscated: false,
    obfuscationForm: null,
    category,
    risk,
    reasons: withSchemeReason([reason], schemeFlag),
  };
}
