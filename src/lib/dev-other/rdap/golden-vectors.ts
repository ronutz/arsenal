// ============================================================================
// src/lib/dev-other/rdap/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the RDAP lookup's DETERMINISTIC layers: classification,
// bootstrap endpoint selection (against the vendored IANA snapshots, dated in
// BOOTSTRAP_SNAPSHOT), URL construction, and RDAP JSON parsing (against two
// trimmed fixtures captured live from Verisign and ARIN on 2026-07-08).
//
// The live fetch is deliberately NOT vectored - that is the whole point of
// /dev/other: live-world results carry no golden-vector guarantee, and the
// room says so out loud. Everything that CAN be pinned, is.
// ============================================================================

import {
  planQuery,
  parseRdapResponse,
  RdapError,
  type RdapErrorCode,
  type QueryKind,
} from "./compute";

export const GOLDEN_VECTOR_SET_ID = "dev-other-rdap/2026-07-08";

interface PlanVector {
  id: string;
  description: string;
  input: string;
  expect: { kind: QueryKind; value: string; base: string; url: string };
}

interface RejectVector {
  id: string;
  description: string;
  input: string;
  expectCode: RdapErrorCode;
}

export const RDAP_PLAN_VECTORS: PlanVector[] = [
  {
    id: "domain-com",
    description: ".com routes to Verisign per the vendored dns bootstrap",
    input: "example.com",
    expect: {
      kind: "domain",
      value: "example.com",
      base: "https://rdap.verisign.com/com/v1/",
      url: "https://rdap.verisign.com/com/v1/domain/example.com",
    },
  },
  {
    id: "domain-normalized",
    description: "uppercase + trailing dot normalize to the same query",
    input: "EXAMPLE.COM.",
    expect: {
      kind: "domain",
      value: "example.com",
      base: "https://rdap.verisign.com/com/v1/",
      url: "https://rdap.verisign.com/com/v1/domain/example.com",
    },
  },
  {
    id: "domain-br",
    description: ".br routes to Registro.br",
    input: "registro.br",
    expect: {
      kind: "domain",
      value: "registro.br",
      base: "https://rdap.registro.br/",
      url: "https://rdap.registro.br/domain/registro.br",
    },
  },
  {
    id: "domain-idn-punycode",
    description: "IDN converts to punycode before routing (café.br -> xn--caf-dma.br)",
    input: "café.br",
    expect: {
      kind: "domain",
      value: "xn--caf-dma.br",
      base: "https://rdap.registro.br/",
      url: "https://rdap.registro.br/domain/xn--caf-dma.br",
    },
  },
  {
    id: "domain-dev",
    description: ".dev routes to the Google registry endpoint",
    input: "ronutz.dev",
    expect: {
      kind: "domain",
      value: "ronutz.dev",
      base: "https://pubapi.registry.google/rdap/",
      url: "https://pubapi.registry.google/rdap/domain/ronutz.dev",
    },
  },
  {
    id: "ipv4-arin",
    description: "8.8.8.8 falls in 8.0.0.0/8 -> ARIN",
    input: "8.8.8.8",
    expect: {
      kind: "ipv4",
      value: "8.8.8.8",
      base: "https://rdap.arin.net/registry/",
      url: "https://rdap.arin.net/registry/ip/8.8.8.8",
    },
  },
  {
    id: "ipv6-afrinic",
    description: "2c0f::1 falls in 2c00::/12 -> AFRINIC",
    input: "2c0f::1",
    expect: {
      kind: "ipv6",
      value: "2c0f::1",
      base: "https://rdap.afrinic.net/rdap/",
      url: "https://rdap.afrinic.net/rdap/ip/2c0f::1",
    },
  },
  {
    id: "asn-prefixed",
    description: "AS15169 (range 13312-15359) -> ARIN autnum",
    input: "AS15169",
    expect: {
      kind: "asn",
      value: "15169",
      base: "https://rdap.arin.net/registry/",
      url: "https://rdap.arin.net/registry/autnum/15169",
    },
  },
  {
    id: "asn-bare",
    description: "a bare AS number works too",
    input: "15169",
    expect: {
      kind: "asn",
      value: "15169",
      base: "https://rdap.arin.net/registry/",
      url: "https://rdap.arin.net/registry/autnum/15169",
    },
  },
];

export const RDAP_REJECT_VECTORS: RejectVector[] = [
  { id: "empty", description: "empty input", input: "   ", expectCode: "empty" },
  { id: "gibberish", description: "not a domain, IP, or ASN", input: "not a thing", expectCode: "format" },
  { id: "bad-octet", description: "999.1.1.1 is neither IPv4 nor a valid hostname", input: "999.1.1.1", expectCode: "format" },
  { id: "unknown-tld", description: "a TLD with no published RDAP endpoint is said honestly", input: "example.invalidtldxyz", expectCode: "noEndpoint" },
];

// ----------------------------------------------------------------------------
// Parse fixtures - trimmed from LIVE responses captured 2026-07-08.
// ----------------------------------------------------------------------------

/** Trimmed from https://rdap.verisign.com/com/v1/domain/EXAMPLE.COM (live). */
export const FIXTURE_DOMAIN = {
  objectClassName: "domain",
  handle: "2336799_DOMAIN_COM-VRSN",
  ldhName: "EXAMPLE.COM",
  status: ["client delete prohibited", "client transfer prohibited", "client update prohibited"],
  events: [
    { eventAction: "registration", eventDate: "1995-08-14T04:00:00Z" },
    { eventAction: "expiration", eventDate: "2026-08-13T04:00:00Z" },
    { eventAction: "last changed", eventDate: "2026-01-16T04:19:34Z" },
  ],
  entities: [
    {
      objectClassName: "entity",
      roles: ["registrar"],
      vcardArray: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "RESERVED-Internet Assigned Numbers Authority"]]],
    },
  ],
  nameservers: [
    { objectClassName: "nameserver", ldhName: "ELLIOTT.NS.CLOUDFLARE.COM" },
    { objectClassName: "nameserver", ldhName: "HERA.NS.CLOUDFLARE.COM" },
  ],
  secureDNS: { delegationSigned: true },
  notices: [{ title: "Terms of Use" }],
} as const;

/** Trimmed from https://rdap.arin.net/registry/ip/8.8.8.8 (live). */
export const FIXTURE_IP = {
  objectClassName: "ip network",
  handle: "NET-8-8-8-0-2",
  startAddress: "8.8.8.0",
  endAddress: "8.8.8.255",
  name: "GOGL",
  entities: [
    {
      objectClassName: "entity",
      roles: ["registrant"],
      vcardArray: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "Google LLC"]]],
    },
  ],
  port43: "whois.arin.net",
} as const;

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

/** Run every vector; used by the standalone check and available to CI. */
export function verifyVectors(): VectorReport {
  const failures: string[] = [];

  for (const v of RDAP_PLAN_VECTORS) {
    try {
      const r = planQuery(v.input);
      const ok =
        r.input.kind === v.expect.kind &&
        r.input.value === v.expect.value &&
        r.endpoint.base === v.expect.base &&
        r.url === v.expect.url;
      if (!ok) failures.push(`${v.id}: mismatch (got ${JSON.stringify({ kind: r.input.kind, value: r.input.value, base: r.endpoint.base, url: r.url })})`);
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of RDAP_REJECT_VECTORS) {
    try {
      planQuery(v.input);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof RdapError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }

  // Parse fixtures: the tolerant extractor against the two live-captured docs.
  const dom = parseRdapResponse(FIXTURE_DOMAIN);
  if (
    dom.displayName !== "EXAMPLE.COM" ||
    dom.events["registration"] !== "1995-08-14T04:00:00Z" ||
    dom.events["expiration"] !== "2026-08-13T04:00:00Z" ||
    dom.nameservers.join(",") !== "elliott.ns.cloudflare.com,hera.ns.cloudflare.com" ||
    dom.dnssecSigned !== true ||
    dom.status.length !== 3 ||
    dom.entities[0]?.roles[0] !== "registrar" ||
    dom.noticeTitles[0] !== "Terms of Use"
  ) {
    failures.push(`parse-domain: mismatch (got ${JSON.stringify(dom)})`);
  }
  const ip = parseRdapResponse(FIXTURE_IP);
  if (
    ip.objectClassName !== "ip network" ||
    ip.displayName !== "8.8.8.0 - 8.8.8.255" ||
    ip.entities[0]?.name !== "Google LLC" ||
    ip.port43 !== "whois.arin.net"
  ) {
    failures.push(`parse-ip: mismatch (got ${JSON.stringify(ip)})`);
  }

  const total = RDAP_PLAN_VECTORS.length + RDAP_REJECT_VECTORS.length + 2;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
