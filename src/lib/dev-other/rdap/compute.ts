// ============================================================================
// src/lib/dev-other/rdap/compute.ts
// ----------------------------------------------------------------------------
// RDAP LOOKUP - the deterministic layers of the first /dev/other tool.
//
// /dev/other is the marked room for tools that ASK the live internet instead
// of computing locally, so this module is split with intent:
//
//   DETERMINISTIC (here, golden-vector-tested like any ARSENAL engine):
//     1. classifyInput  - domain / IPv4 / IPv6 / ASN detection + normalization
//                         (IDN -> punycode via the URL API, RFC 5890 A-labels)
//     2. selectEndpoint - which registry answers, resolved from VENDORED
//                         snapshots of the four IANA RDAP bootstrap registries
//                         (RFC 9224), dated in BOOTSTRAP_SNAPSHOT below
//     3. buildQueryUrl  - the exact RDAP URL (RFC 9082 path segments:
//                         domain/<name>, ip/<addr>, autnum/<number>)
//     4. parseRdapResponse - tolerant extraction from an RDAP JSON document
//                         (RFC 9083): names, status, events, entities,
//                         nameservers, DNSSEC, notices
//
//   NON-DETERMINISTIC (deliberately NOT here): the network fetch itself lives
//   in the client component. The query goes browser-direct to the registry
//   (data.iana.org and the major registries publish CORS *, verified live
//   2026-07-08: Verisign .com, Registro.br, ARIN yes; RIPE no - the no-CORS
//   case is a designed, explained failure path, not a hidden one). ronutz.com
//   infrastructure never sees the query in this v1.
//
// PRIME DIRECTIVE (D-19): commented by construction. "Compute, never guess"
// still governs every layer that CAN be deterministic; the room's green walls
// mark the one layer that cannot.
// ============================================================================

import dnsBootstrap from "./bootstrap/dns.json";
import ipv4Bootstrap from "./bootstrap/ipv4.json";
import ipv6Bootstrap from "./bootstrap/ipv6.json";
import asnBootstrap from "./bootstrap/asn.json";

/** When the four IANA bootstrap files were vendored, and their own publication
 *  stamps - surfaced in the UI so staleness is visible, never hidden. */
export const BOOTSTRAP_SNAPSHOT = Object.freeze({
  vendored: "2026-07-08",
  publications: {
    dns: (dnsBootstrap as unknown as IanaBootstrap).publication,
    ipv4: (ipv4Bootstrap as unknown as IanaBootstrap).publication,
    ipv6: (ipv6Bootstrap as unknown as IanaBootstrap).publication,
    asn: (asnBootstrap as unknown as IanaBootstrap).publication,
  },
});

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

/** The IANA bootstrap file shape (RFC 9224): services = [ [keys[], urls[]] ]. */
interface IanaBootstrap {
  publication: string;
  services: [string[], string[]][];
}

export type RdapErrorCode = "empty" | "format" | "noEndpoint";

export class RdapError extends Error {
  code: RdapErrorCode;
  constructor(code: RdapErrorCode, message?: string) {
    super(message ?? code);
    this.name = "RdapError";
    this.code = code;
  }
}

export type QueryKind = "domain" | "ipv4" | "ipv6" | "asn";

export interface ClassifiedInput {
  kind: QueryKind;
  /** Normalized query value: punycoded lowercase domain, canonical IP text,
   *  or the bare AS number as a string. */
  value: string;
  /** For domains: the final label (TLD) used against the dns bootstrap. */
  tld?: string;
}

export interface EndpointSelection {
  /** The registry's RDAP base URL, trailing slash guaranteed. */
  base: string;
  /** Which bootstrap file answered (mirrors the vendored snapshot). */
  registry: "dns" | "ipv4" | "ipv6" | "asn";
  /** The bootstrap service key that matched (TLD, CIDR block, or ASN range). */
  matchedKey: string;
}

// ----------------------------------------------------------------------------
// 1. classifyInput
// ----------------------------------------------------------------------------

// IPv4: exactly four 0-255 octets. Anchored, fixed shape - linear.
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
// ASN: "AS15169" (case-insensitive) or bare digits. Anchored.
const ASN_RE = /^(?:as)?(\d{1,10})$/i;

/** True when the dotted-quad octets are all in range. */
function isIpv4(s: string): boolean {
  const m = IPV4_RE.exec(s);
  return !!m && m.slice(1).every((o) => Number(o) <= 255);
}

/** Expand an IPv6 textual address to 8 hextets, or null if invalid.
 *  Handles :: compression and a trailing embedded IPv4. Linear scan. */
export function expandIpv6(s: string): string[] | null {
  let body = s.trim().toLowerCase();
  if (body === "") return null;
  // Embedded IPv4 tail (e.g. ::ffff:8.8.8.8) -> two hextets.
  const v4tail = /(?:^|:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(body);
  let tailHextets: string[] = [];
  if (v4tail) {
    if (!isIpv4(v4tail[1])) return null;
    const oct = v4tail[1].split(".").map(Number);
    tailHextets = [
      ((oct[0] << 8) | oct[1]).toString(16),
      ((oct[2] << 8) | oct[3]).toString(16),
    ];
    body = body.slice(0, body.length - v4tail[1].length).replace(/:$/, ":");
    if (body.endsWith(":") && !body.endsWith("::")) body = body.slice(0, -1);
  }
  const parts = body.split("::");
  if (parts.length > 2) return null;
  const head = parts[0] === "" ? [] : parts[0].split(":");
  const tail = parts.length === 2 ? (parts[1] === "" ? [] : parts[1].split(":")) : [];
  const groups = [...head, ...(parts.length === 2 ? [] : [])];
  const given = parts.length === 2 ? head.length + tail.length + tailHextets.length : head.length + tailHextets.length;
  if (parts.length === 1 && given !== 8) return null;
  if (parts.length === 2 && given > 7) return null;
  const fill = parts.length === 2 ? Array(8 - given).fill("0") : [];
  const all = parts.length === 2 ? [...head, ...fill, ...tail, ...tailHextets] : [...groups, ...tailHextets];
  if (all.length !== 8) return null;
  for (const h of all) if (!/^[0-9a-f]{1,4}$/.test(h)) return null;
  return all.map((h) => h.padStart(4, "0"));
}

/** IPv6 (or IPv4) address to a BigInt for CIDR containment math. */
export function ipToBigInt(addr: string): bigint | null {
  if (isIpv4(addr)) {
    const o = addr.split(".").map(Number);
    return BigInt(((o[0] * 256 + o[1]) * 256 + o[2]) * 256 + o[3]);
  }
  const hex = expandIpv6(addr);
  return hex ? BigInt("0x" + hex.join("")) : null;
}

/**
 * classifyInput - detect what the person pasted and normalize it.
 * Domains are lowercased, trailing-dot-stripped, and IDN-converted to
 * punycode via the URL API (available in browsers and Node alike), so
 * "café.br" and "xn--caf-dma.br" classify identically.
 */
export function classifyInput(raw: string): ClassifiedInput {
  const s = raw.trim();
  if (s === "") throw new RdapError("empty");

  if (isIpv4(s)) return { kind: "ipv4", value: s };
  if (s.includes(":") && expandIpv6(s)) return { kind: "ipv6", value: s.toLowerCase() };

  const asn = ASN_RE.exec(s);
  if (asn && !s.includes(".")) return { kind: "asn", value: asn[1] };

  if (s.includes(".")) {
    // The URL API performs IDNA/punycode conversion and LDH validation for us.
    let host: string;
    try {
      host = new URL(`http://${s.replace(/\.$/, "")}`).hostname;
    } catch {
      throw new RdapError("format", "not a valid domain name");
    }
    // Reject anything the URL API mangled into a path/port (contained slashes etc.).
    if (!/^[a-z0-9.-]+$/.test(host) || host.startsWith(".") || host.includes("..")) {
      throw new RdapError("format", "not a valid domain name");
    }
    const labels = host.split(".");
    if (labels.length < 2) throw new RdapError("format", "need at least one dot");
    return { kind: "domain", value: host, tld: labels[labels.length - 1] };
  }

  throw new RdapError("format", "not a domain, IP address, or AS number");
}

// ----------------------------------------------------------------------------
// 2. selectEndpoint - walk the vendored IANA bootstrap
// ----------------------------------------------------------------------------

/** Prefer https URLs from a bootstrap service's URL list; guarantee a
 *  trailing slash (RFC 9224 says base URLs are concatenated with segments). */
function pickBase(urls: string[]): string {
  const https = urls.find((u) => u.startsWith("https://")) ?? urls[0];
  return https.endsWith("/") ? https : https + "/";
}

/** CIDR containment for v4 and v6 using BigInt math on the vendored blocks. */
function cidrContains(cidr: string, addr: bigint, bits: number): boolean {
  const [net, lenStr] = cidr.split("/");
  const len = Number(lenStr);
  const netInt = ipToBigInt(net);
  if (netInt === null || Number.isNaN(len)) return false;
  const shift = BigInt(bits - len);
  return (netInt >> shift) === (addr >> shift);
}

/**
 * selectEndpoint - which registry's RDAP answers this query, per the vendored
 * IANA bootstrap snapshots. Deterministic: same input + same snapshot = same
 * endpoint, which is exactly what the golden vectors pin.
 */
export function selectEndpoint(input: ClassifiedInput): EndpointSelection {
  if (input.kind === "domain") {
    const boot = dnsBootstrap as unknown as IanaBootstrap;
    for (const [keys, urls] of boot.services) {
      if (keys.includes(input.tld!)) {
        return { base: pickBase(urls), registry: "dns", matchedKey: input.tld! };
      }
    }
    throw new RdapError("noEndpoint", `no RDAP endpoint published for .${input.tld}`);
  }

  if (input.kind === "ipv4" || input.kind === "ipv6") {
    const boot = (input.kind === "ipv4" ? ipv4Bootstrap : ipv6Bootstrap) as unknown as IanaBootstrap;
    const addr = ipToBigInt(input.value);
    const bits = input.kind === "ipv4" ? 32 : 128;
    if (addr === null) throw new RdapError("format");
    for (const [keys, urls] of boot.services) {
      for (const key of keys) {
        if (cidrContains(key, addr, bits)) {
          return { base: pickBase(urls), registry: input.kind, matchedKey: key };
        }
      }
    }
    throw new RdapError("noEndpoint", "address not in any RIR bootstrap block");
  }

  // ASN: keys are "start-end" ranges (or a single number).
  const boot = asnBootstrap as unknown as IanaBootstrap;
  const n = Number(input.value);
  for (const [keys, urls] of boot.services) {
    for (const key of keys) {
      const [lo, hi] = key.includes("-") ? key.split("-").map(Number) : [Number(key), Number(key)];
      if (n >= lo && n <= hi) {
        return { base: pickBase(urls), registry: "asn", matchedKey: key };
      }
    }
  }
  throw new RdapError("noEndpoint", "AS number not in any RIR bootstrap range");
}

// ----------------------------------------------------------------------------
// 3. buildQueryUrl (RFC 9082 segments)
// ----------------------------------------------------------------------------

export function buildQueryUrl(input: ClassifiedInput, endpoint: EndpointSelection): string {
  switch (input.kind) {
    case "domain":
      return `${endpoint.base}domain/${input.value}`;
    case "ipv4":
    case "ipv6":
      return `${endpoint.base}ip/${input.value}`;
    case "asn":
      return `${endpoint.base}autnum/${input.value}`;
  }
}

/** The one-call deterministic front half: classify -> select -> URL. */
export function planQuery(raw: string): {
  input: ClassifiedInput;
  endpoint: EndpointSelection;
  url: string;
} {
  const input = classifyInput(raw);
  const endpoint = selectEndpoint(input);
  return { input, endpoint, url: buildQueryUrl(input, endpoint) };
}

// ----------------------------------------------------------------------------
// 4. parseRdapResponse (RFC 9083, tolerant)
// ----------------------------------------------------------------------------

export interface RdapEntitySummary {
  roles: string[];
  /** The vCard "fn" (formatted name), when present. */
  name: string | null;
}

export interface RdapSummary {
  objectClassName: string | null;
  handle: string | null;
  /** Best display name: unicodeName > ldhName > "start - end" > "AS<n>" > name. */
  displayName: string | null;
  status: string[];
  /** eventAction -> ISO date (first occurrence wins). */
  events: Record<string, string>;
  entities: RdapEntitySummary[];
  nameservers: string[];
  /** true / false / null (not stated). */
  dnssecSigned: boolean | null;
  /** Notice titles - redaction and terms notices surface here, honestly. */
  noticeTitles: string[];
  port43: string | null;
}

/** Pull the vCard fn out of an RDAP entity's vcardArray, if present. */
function vcardFn(entity: unknown): string | null {
  const v = (entity as { vcardArray?: [string, [string, unknown, string, unknown][]] }).vcardArray;
  if (!v || !Array.isArray(v[1])) return null;
  const fn = v[1].find((row) => Array.isArray(row) && row[0] === "fn");
  return fn && typeof fn[3] === "string" ? fn[3] : null;
}

/**
 * parseRdapResponse - tolerant extraction of the fields the UI shows. Pure:
 * a JSON document in, a summary out; unknown/absent fields degrade to null or
 * empty rather than throwing, because registries vary in verbosity.
 */
export function parseRdapResponse(doc: unknown): RdapSummary {
  const d = (doc ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

  const events: Record<string, string> = {};
  if (Array.isArray(d.events)) {
    for (const e of d.events as { eventAction?: string; eventDate?: string }[]) {
      if (e?.eventAction && e?.eventDate && !(e.eventAction in events)) {
        events[e.eventAction] = e.eventDate;
      }
    }
  }

  const entities: RdapEntitySummary[] = Array.isArray(d.entities)
    ? (d.entities as { roles?: string[] }[]).map((e) => ({
        roles: Array.isArray(e?.roles) ? e.roles : [],
        name: vcardFn(e),
      }))
    : [];

  const nameservers: string[] = Array.isArray(d.nameservers)
    ? (d.nameservers as { ldhName?: string }[])
        .map((n) => (typeof n?.ldhName === "string" ? n.ldhName.toLowerCase() : null))
        .filter((x): x is string => x !== null)
    : [];

  const range =
    str(d.startAddress) && str(d.endAddress) ? `${d.startAddress} - ${d.endAddress}` : null;
  const autnum =
    typeof d.startAutnum === "number"
      ? `AS${d.startAutnum}${typeof d.endAutnum === "number" && d.endAutnum !== d.startAutnum ? `-AS${d.endAutnum}` : ""}`
      : null;

  return {
    objectClassName: str(d.objectClassName),
    handle: str(d.handle),
    displayName:
      str(d.unicodeName) ?? str(d.ldhName) ?? range ?? autnum ?? str(d.name),
    status: Array.isArray(d.status) ? (d.status as string[]).filter((s) => typeof s === "string") : [],
    events,
    entities,
    nameservers,
    dnssecSigned:
      typeof (d.secureDNS as { delegationSigned?: boolean })?.delegationSigned === "boolean"
        ? (d.secureDNS as { delegationSigned: boolean }).delegationSigned
        : null,
    noticeTitles: Array.isArray(d.notices)
      ? (d.notices as { title?: string }[]).map((n) => n?.title).filter((t): t is string => typeof t === "string")
      : [],
    port43: str(d.port43),
  };
}

/** A copy-paste curl equivalent of the browser-direct query, for the honest
 *  no-CORS failure path (RIPE-region lookups) and for scripting parity. */
export function curlCommand(url: string): string {
  return `curl -sL -H 'Accept: application/rdap+json' '${url}'`;
}
