// ============================================================================
// src/lib/tools/f5-bigip-persistence-cookie/compute.ts
// ----------------------------------------------------------------------------
// THE F5 BIG-IP PERSISTENCE COOKIE DECODER ENGINE.
//
// Decodes the value of a BIGipServer<pool> cookie into the backend pool member's
// IP address and port. Four unencrypted encodings are handled, each with its own
// byte-order rules (this is the subtle part, verified against F5 K6917 and the
// drwetter reference implementation):
//
//   default IPv4    2263487148.3013.0000
//       address: decimal -> 4 bytes, taken LITTLE-ENDIAN (reversed)
//       port:    decimal field, bytes SWAPPED
//   IPv4 route dom  rd5o00000000000000000000ffffc0000201o80
//       address: the 8 hex after the ...ffff marker, STRAIGHT (big-endian)
//       port:    decimal after the last 'o', STRAIGHT
//   IPv6            vi20010112000000000000000000000030.20480
//       address: 32 hex, STRAIGHT, canonicalized (RFC 5952)
//       port:    decimal after the dot, bytes SWAPPED
//   IPv6 route dom  rd3o20010112000000000000000000000030o80
//       address: 32 hex, STRAIGHT, canonicalized
//       port:    decimal after the last 'o', STRAIGHT
//
// plus the AES-encrypted form (!<base64>=...), which cannot be decoded without
// the BIG-IP's key and is the recommended secure configuration.
//
// Pure, deterministic, offline. It only reads a string the user already has; it
// never contacts a BIG-IP and never decrypts anything.
// ============================================================================

import {
  IPV4_INTERNAL_RANGES,
  IPV6_INTERNAL_PREFIXES,
} from "./registry-data";

// -- Errors -------------------------------------------------------------------
export type BigipParseErrorCode = "empty" | "unrecognized";

export class BigipParseError extends Error {
  code: BigipParseErrorCode;
  constructor(code: BigipParseErrorCode, message?: string) {
    super(message ?? code);
    this.name = "BigipParseError";
    this.code = code;
  }
}

// -- Public report shape ------------------------------------------------------
export type BigipFormat =
  | "ipv4"
  | "ipv4-routedomain"
  | "ipv6"
  | "ipv6-routedomain"
  | "encrypted";

export interface BigipReason {
  code: string;
  value?: string;
}

export interface BigipReport {
  cookieName?: string;
  rawValue: string;
  format: BigipFormat;
  addressType?: "ipv4" | "ipv6";
  address?: string;
  port?: number;
  routeDomain?: number;
  endpoint?: string;
  isInternal?: boolean;
  internalLabel?: string;
  reasons: BigipReason[];
}

// -- Input parsing ------------------------------------------------------------
/**
 * Accept a bare cookie value, a name=value pair, or a full Set-Cookie header
 * line, and return the cookie name (if given) and the value to decode.
 */
function parseCookieInput(input: string): { cookieName?: string; value: string } {
  let s = input.trim();
  // Strip a leading "Set-Cookie:" (case-insensitive).
  s = s.replace(/^set-cookie:\s*/i, "");
  // Drop cookie attributes after the first ';'.
  const semi = s.indexOf(";");
  if (semi >= 0) s = s.slice(0, semi);
  s = s.trim();
  // Split on the FIRST '=' into name / value, but only when the left side looks
  // like a cookie-name token. An encrypted value is bare base64 that ends in '='
  // padding, which must NOT be read as a name=value separator.
  const eq = s.indexOf("=");
  if (eq >= 0) {
    const candName = s.slice(0, eq).trim();
    const candValue = s.slice(eq + 1).trim();
    if (candValue && /^[A-Za-z0-9_~.\-]+$/.test(candName)) {
      return { cookieName: candName || undefined, value: candValue };
    }
    // The '=' belongs to a bare value (e.g. base64 padding); decode it whole.
    return { value: s };
  }
  return { value: s };
}

// -- Address / port helpers ---------------------------------------------------
/** Default-IPv4 address: decimal -> 4 bytes taken little-endian (reversed). */
function ipv4FromDecimalLE(n: number): string {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff].join(".");
}

/** Straight (big-endian) IPv4 from 8 hex characters, e.g. "c0000201". */
function ipv4FromHex(hex8: string): string {
  return [
    parseInt(hex8.slice(0, 2), 16),
    parseInt(hex8.slice(2, 4), 16),
    parseInt(hex8.slice(4, 6), 16),
    parseInt(hex8.slice(6, 8), 16),
  ].join(".");
}

/** Swap the two bytes of a 16-bit port field. Symmetric: decode == encode. */
function swapPort(n: number): number {
  return (((n & 0xff) << 8) | ((n >>> 8) & 0xff)) >>> 0;
}

/** Canonicalize 32 hex chars into an RFC 5952 IPv6 string + its raw hextets. */
function canonicalIpv6(hex32: string): { canonical: string; hextets: string[] } {
  const hextets: string[] = [];
  for (let i = 0; i < 32; i += 4) hextets.push(hex32.slice(i, i + 4).toLowerCase());
  const stripped = hextets.map((g) => g.replace(/^0+/, "") || "0");

  // Longest run of all-zero groups (>= 2) is compressed to "::"; first wins.
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (stripped[i] === "0") {
      if (curStart < 0) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  let canonical: string;
  if (bestLen >= 2) {
    const head = stripped.slice(0, bestStart).join(":");
    const tail = stripped.slice(bestStart + bestLen).join(":");
    canonical = `${head}::${tail}`;
  } else {
    canonical = stripped.join(":");
  }
  return { canonical, hextets };
}

// -- Classification -----------------------------------------------------------
function classifyIpv4(dotted: string): { internal: boolean; label?: string } {
  const parts = dotted.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return { internal: false };
  }
  const n = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  for (const r of IPV4_INTERNAL_RANGES) {
    if (n >= r.start && n <= r.end) return { internal: true, label: r.label };
  }
  return { internal: false };
}

function classifyIpv6(hextets: string[]): { internal: boolean; label?: string } {
  for (const p of IPV6_INTERNAL_PREFIXES) {
    if (p.test(hextets)) return { internal: true, label: p.label };
  }
  return { internal: false };
}

// -- Format patterns ----------------------------------------------------------
const RE_DEFAULT_IPV4 = /^(\d{1,10})\.(\d{1,5})\.0000$/;
const RE_IPV4_RD = /^rd(\d{1,5})o0{20}f{4}([0-9a-f]{8})o(\d{1,5})$/i;
const RE_IPV6 = /^vi([0-9a-f]{32})\.(\d{1,5})$/i;
const RE_IPV6_RD = /^rd(\d{1,5})o([0-9a-f]{32})o(\d{1,5})$/i;

// -- Reason assembly ----------------------------------------------------------
function disclosureReasons(internal: boolean, internalLabel: string | undefined, routeDomain: number | undefined): BigipReason[] {
  const reasons: BigipReason[] = [{ code: "INFO_DISCLOSURE" }];
  if (internal && internalLabel) reasons.push({ code: "INTERNAL_ADDRESS", value: internalLabel });
  if (routeDomain !== undefined) reasons.push({ code: "ROUTE_DOMAIN", value: String(routeDomain) });
  return reasons;
}

// -- Entry point --------------------------------------------------------------
/**
 * decodeBigipCookie - the engine entry point.
 * @param input a BIGipServer cookie (bare value, name=value, or Set-Cookie line)
 * @returns the decoded report
 * @throws {BigipParseError} on empty input or a value matching no known format
 */
export function decodeBigipCookie(input: string): BigipReport {
  if (!input || !input.trim()) throw new BigipParseError("empty");
  const { cookieName, value } = parseCookieInput(input);
  if (!value) throw new BigipParseError("empty");

  // Encrypted form: starts with '!'.
  if (value.startsWith("!")) {
    return {
      cookieName,
      rawValue: value,
      format: "encrypted",
      reasons: [{ code: "ENCRYPTED" }],
    };
  }

  // 1. Default IPv4: <addr-decimal>.<port-decimal>.0000
  const m1 = RE_DEFAULT_IPV4.exec(value);
  if (m1) {
    const addrN = Number(m1[1]);
    const portField = Number(m1[2]);
    if (addrN <= 0xffffffff && portField <= 0xffff) {
      const address = ipv4FromDecimalLE(addrN >>> 0);
      const port = swapPort(portField);
      const cls = classifyIpv4(address);
      return {
        cookieName,
        rawValue: value,
        format: "ipv4",
        addressType: "ipv4",
        address,
        port,
        endpoint: `${address}:${port}`,
        isInternal: cls.internal,
        internalLabel: cls.label,
        reasons: disclosureReasons(cls.internal, cls.label, undefined),
      };
    }
  }

  // 2. IPv4 in a route domain: rd<rd>o0{20}ffff<8hex>o<port>
  const m2 = RE_IPV4_RD.exec(value);
  if (m2) {
    const routeDomain = Number(m2[1]);
    const address = ipv4FromHex(m2[2].toLowerCase());
    const port = Number(m2[3]);
    if (port <= 0xffff) {
      const cls = classifyIpv4(address);
      return {
        cookieName,
        rawValue: value,
        format: "ipv4-routedomain",
        addressType: "ipv4",
        address,
        port,
        routeDomain,
        endpoint: `${address}%${routeDomain}:${port}`,
        isInternal: cls.internal,
        internalLabel: cls.label,
        reasons: disclosureReasons(cls.internal, cls.label, routeDomain),
      };
    }
  }

  // 3. IPv6: vi<32hex>.<port>
  const m3 = RE_IPV6.exec(value);
  if (m3) {
    const { canonical, hextets } = canonicalIpv6(m3[1].toLowerCase());
    const portField = Number(m3[2]);
    if (portField <= 0xffff) {
      const port = swapPort(portField);
      const cls = classifyIpv6(hextets);
      return {
        cookieName,
        rawValue: value,
        format: "ipv6",
        addressType: "ipv6",
        address: canonical,
        port,
        endpoint: `[${canonical}]:${port}`,
        isInternal: cls.internal,
        internalLabel: cls.label,
        reasons: disclosureReasons(cls.internal, cls.label, undefined),
      };
    }
  }

  // 4. IPv6 in a route domain: rd<rd>o<32hex>o<port>
  //    (checked after IPv4-RD, whose 32 hex also match [0-9a-f]{32})
  const m4 = RE_IPV6_RD.exec(value);
  if (m4) {
    const routeDomain = Number(m4[1]);
    const { canonical, hextets } = canonicalIpv6(m4[2].toLowerCase());
    const port = Number(m4[3]);
    if (port <= 0xffff) {
      const cls = classifyIpv6(hextets);
      return {
        cookieName,
        rawValue: value,
        format: "ipv6-routedomain",
        addressType: "ipv6",
        address: canonical,
        port,
        routeDomain,
        endpoint: `[${canonical}%${routeDomain}]:${port}`,
        isInternal: cls.internal,
        internalLabel: cls.label,
        reasons: disclosureReasons(cls.internal, cls.label, routeDomain),
      };
    }
  }

  throw new BigipParseError("unrecognized");
}

// ============================================================================
// ENCODE DIRECTION (PRIME ruling: this tool is "decode + encode").
// Given a pool member address + port (+ optional route domain), produce the
// BIGipServer cookie value. The inverse of each decode path above, so an
// encode followed by a decode round-trips. Uses only public F5 documentation.
// ============================================================================

export type BigipEncodeErrorCode = "address" | "port" | "routedomain";

export class BigipEncodeError extends Error {
  code: BigipEncodeErrorCode;
  constructor(code: BigipEncodeErrorCode, message?: string) {
    super(message ?? code);
    this.name = "BigipEncodeError";
    this.code = code;
  }
}

export interface BigipEncodeInput {
  address: string;
  port: number;
  routeDomain?: number;
}

export interface BigipEncodeResult {
  value: string;
  format: BigipFormat;
  addressType: "ipv4" | "ipv6";
}

/** Parse a dotted IPv4 string into 4 octets, or null. */
function parseIpv4(address: string): number[] | null {
  const parts = address.trim().split(".");
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n < 0 || n > 255) return null;
    octets.push(n);
  }
  return octets;
}

/** Expand an IPv6 string (with optional "::") into 32 lowercase hex chars, or null. */
function expandIpv6ToHex32(address: string): string | null {
  let a = address.trim().toLowerCase();
  a = a.replace(/^\[/, "").replace(/\]$/, "");
  // Drop a route-domain / zone suffix if the caller left one on.
  const pct = a.indexOf("%");
  if (pct >= 0) a = a.slice(0, pct);
  if (!/^[0-9a-f:]+$/.test(a)) return null;

  let groups: string[];
  const dbl = a.indexOf("::");
  if (dbl >= 0) {
    if (a.indexOf("::", dbl + 2) >= 0) return null; // at most one "::"
    const left = a.slice(0, dbl);
    const right = a.slice(dbl + 2);
    const head = left ? left.split(":") : [];
    const tail = right ? right.split(":") : [];
    const missing = 8 - head.length - tail.length;
    if (missing < 1) return null; // "::" must stand for at least one zero group
    groups = [...head, ...Array(missing).fill("0"), ...tail];
  } else {
    groups = a.split(":");
  }
  if (groups.length !== 8) return null;

  let hex = "";
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    hex += g.padStart(4, "0");
  }
  return hex;
}

/**
 * encodeBigipCookie - build a BIGipServer cookie value from an address + port.
 * @throws {BigipEncodeError} on an invalid address, port, or route domain
 */
export function encodeBigipCookie(input: BigipEncodeInput): BigipEncodeResult {
  const { address, port, routeDomain } = input;
  if (!Number.isInteger(port) || port < 0 || port > 0xffff) throw new BigipEncodeError("port");
  if (routeDomain !== undefined && (!Number.isInteger(routeDomain) || routeDomain < 0 || routeDomain > 0xffff)) {
    throw new BigipEncodeError("routedomain");
  }

  const v4 = parseIpv4(address);
  if (v4) {
    if (routeDomain !== undefined && routeDomain !== 0) {
      const hex8 = v4.map((o) => o.toString(16).padStart(2, "0")).join("");
      return { value: `rd${routeDomain}o00000000000000000000ffff${hex8}o${port}`, format: "ipv4-routedomain", addressType: "ipv4" };
    }
    const dec = (v4[0] + v4[1] * 256 + v4[2] * 65536 + v4[3] * 16777216) >>> 0;
    return { value: `${dec}.${swapPort(port)}.0000`, format: "ipv4", addressType: "ipv4" };
  }

  const hex32 = expandIpv6ToHex32(address);
  if (hex32) {
    if (routeDomain !== undefined && routeDomain !== 0) {
      return { value: `rd${routeDomain}o${hex32}o${port}`, format: "ipv6-routedomain", addressType: "ipv6" };
    }
    return { value: `vi${hex32}.${swapPort(port)}`, format: "ipv6", addressType: "ipv6" };
  }

  throw new BigipEncodeError("address");
}
