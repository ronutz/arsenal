// ============================================================================
// src/lib/dev-out/doh-lookup/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the local layers of the DNS-over-HTTPS lookup. As with
// the other red-room tools, the LIVE answer carries no golden-vector guarantee
// (the room's notice says so); everything computed on the device is pinned
// here: the query in wire format, its base64url form and URL, the reading of
// typed names and addresses, the decoding of answers, the refusal of
// malformed and hostile messages, the check that an answer answers the query
// asked, the DNSSEC and negative-answer assessment, and the sorting of the
// request's outcomes (driven by a mock fetch, so no vector touches the
// network).
//
// WHERE THE EXPECTATIONS COME FROM (2026-10-27), never from this module:
//   - RFC 8484 section 4.1.1: the two GET examples (www.example.com A, and the
//     94-octet query whose base64url shows "-"), byte for byte; section
//     4.2.2: the 61-octet AAAA answer with its compression pointer.
//   - Cloudflare's "DNS Wireformat" page (read 2026-10-27): its example query
//     (ID 0xabcd, base64url q80B...) and its 64-octet example answer.
//   - dig 9.18.39 in this container: eight queries captured from the wire by a
//     local listener (dig +noedns, +bufsize=4096 +nocookie with +dnssec,
//     +adflag, +cdflag and +padding=128, and -x for IPv4 and IPv6); dig picks
//     a random ID, so those comparisons skip the first two octets.
//   - fixtures.ts: 21 real answers from the three resolvers, each decoded by
//     dig (see that file's header).
//   - RFC 4648 section 10 (base64 and base32hex test vectors), RFC 5952
//     section 4 (IPv6 text examples), RFC 4034 Appendix B through dig's own
//     key ids for the example.com DNSKEYs (36315, 9776, 34505, 2371).
// The hostile messages are built here from the RFC 8484 answer or from
// scratch, each changed in one documented way.
// ============================================================================

// The wire format.
import {
  buildQuery,
  decodeMessage,
  decodeRdata,
  readName,
  toBase64,
  toBase64Url,
  fromBase64,
  toBase32Hex,
  toHex,
  ipv6ToText,
  hexDump,
  keyTag,
  nameToText,
  WireError,
  MAX_MESSAGE_OCTETS,
  type Message,
  type QueryOptions,
  type WireRefusal,
} from "./wire";
// The plan, the assessment and the request.
import {
  planLookup,
  readQueryName,
  readAnswer,
  assessResponse,
  askDoh,
  curlCommand,
  groupRecords,
  resolverById,
  EXAMPLE,
  RESOLVER_HOSTS,
  type DohFetchLike,
  type DohRequestInit,
  type LookupInput,
} from "./compute";
// The recorded answers.
import { RECORDED } from "./fixtures";

// Dated so a change of expectations is visible in review.
export const GOLDEN_VECTOR_SET_ID = "dev-out-doh-lookup/2026-10-27";

// ---- helpers ----------------------------------------------------------------

/**
 * Hex text (spaces allowed) to bytes.
 * @param h the hex text
 * @returns the octets
 */
function hx(h: string): Uint8Array {
  // Drop spaces and line breaks.
  const s = h.replace(/\s+/g, "");
  // Two digits per octet.
  const out = new Uint8Array(s.length / 2);
  // Each pair.
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  // Done.
  return out;
}

/**
 * base64 text to bytes, failing loudly (fixtures are trusted to be base64).
 * @param s the base64 text
 * @returns the octets
 */
function b64(s: string): Uint8Array {
  // Decode.
  const out = fromBase64(s);
  // A fixture that is not base64 is a broken vector file.
  if (!out) throw new Error("fixture is not base64");
  // Done.
  return out;
}

/**
 * A copy of a message with some octets replaced.
 * @param base the message
 * @param edits offset to new octet value
 * @returns the changed copy
 */
function patch(base: Uint8Array, edits: Record<number, number>): Uint8Array {
  // Copy.
  const out = Uint8Array.from(base);
  // Apply each edit.
  for (const [k, v] of Object.entries(edits)) out[Number(k)] = v;
  // Done.
  return out;
}

/**
 * A record in presentation form, the way the expectations write it.
 * @param m the message
 * @returns one line per record: name TTL class type RDATA
 */
function lines(m: Message): string[] {
  // Every record but OPT, in section order.
  return [...m.answer, ...m.authority, ...m.additional].map((r) => `${r.name} ${r.ttl} ${r.className} ${r.typeName} ${r.rdata.text}`);
}

/**
 * The dig-style flag list of a header.
 * @param m the message
 * @returns the set flags, in dig's order
 */
function flagList(m: Message): string[] {
  // dig's order.
  const order = ["qr", "aa", "tc", "rd", "ra", "ad", "cd"] as const;
  // Those set.
  return order.filter((f) => m.header[f]);
}

/**
 * Which refusal decoding produces.
 * @param buf the octets
 * @returns the refusal code, or "accepted"
 */
function refusal(buf: Uint8Array): WireRefusal | "accepted" {
  try {
    // Decode.
    decodeMessage(buf);
    // No refusal.
    return "accepted";
  } catch (e) {
    // The code.
    if (e instanceof WireError) return e.code;
    // Anything else is a bug.
    throw e;
  }
}

/**
 * A raw message from parts, for hostile cases (deliberately not wire.ts's encoder).
 * @param p header words and the sections' raw octets
 * @returns the octets
 */
function raw(p: { id?: number; flags?: number; qd?: number; an?: number; ns?: number; ar?: number; body: number[] }): Uint8Array {
  // The header.
  const h = [p.id ?? 0, p.flags ?? 0x8180, p.qd ?? 0, p.an ?? 0, p.ns ?? 0, p.ar ?? 0].flatMap((w) => [(w >> 8) & 0xff, w & 0xff]);
  // Header then body.
  return Uint8Array.from([...h, ...p.body]);
}

/**
 * A resource record's octets: an owner (raw octets), TYPE, CLASS, TTL and RDATA.
 * @param owner the owner name's octets
 * @param type TYPE
 * @param klass CLASS
 * @param ttl TTL
 * @param rdata RDATA octets
 * @returns the record
 */
function rr(owner: number[], type: number, klass: number, ttl: number, rdata: number[]): number[] {
  // Owner, the fixed fields, RDLENGTH, RDATA.
  return [...owner, type >> 8, type & 0xff, klass >> 8, klass & 0xff, (ttl >>> 24) & 0xff, (ttl >> 16) & 0xff, (ttl >> 8) & 0xff, ttl & 0xff, rdata.length >> 8, rdata.length & 0xff, ...rdata];
}

/**
 * A name's wire octets from dotted ASCII text (test scaffolding).
 * @param text the name, without a trailing dot ("" for the root)
 * @returns the octets
 */
function wn(text: string): number[] {
  // The root.
  if (text === "") return [0];
  // Each label with its length, then the root.
  return [...text.split(".").flatMap((l) => [l.length, ...Array.from(l, (c) => c.charCodeAt(0))]), 0];
}

/** The query options for www.example.com AAAA, matching the RFC 8484 section 4.2.2 answer. */
const RFC_AAAA_OPTIONS: QueryOptions = {
  // The labels.
  labels: ["www", "example", "com"],
  // AAAA.
  qtype: 28,
  // As in the RFC's query.
  recursionDesired: true,
  authenticData: false,
  checkingDisabled: false,
  edns: false,
  dnssecOk: false,
  pad: false,
};

// The RFC 8484 section 4.2.2 example answer: www.example.com AAAA 2001:db8:abcd:12:1:2:3:4, TTL 3709, 61 octets.
const RFC_ANSWER = hx(`00 00 81 80 00 01 00 01 00 00 00 00 03 77 77 77 07 65 78 61 6d 70 6c 65 03 63 6f 6d 00 00 1c 00
01 c0 0c 00 1c 00 01 00 00 0e 7d 00 10 20 01 0d b8 ab cd 00 12 00 01 00 02 00 03 00 04`);

// Cloudflare's documented example answer: www.example.com A 192.0.2.1, TTL 128, 64 octets, no compression.
const CF_DOC_ANSWER = hx(`00 00 81 80 00 01 00 01 00 00 00 00 03 77 77 77 07 65 78 61 6d 70 6c 65 03 63 6f 6d 00 00 01 00
01 03 77 77 77 07 65 78 61 6d 70 6c 65 03 63 6f 6d 00 00 01 00 01 00 00 00 80 00 04 C0 00 02 01`);

/** The queries dig 9.18.39 put on the wire (first two octets, the random ID, are not compared). */
const DIG_QUERIES: { id: string; options: Omit<QueryOptions, "recursionDesired">; hex: string }[] = [
  // dig +noedns +noadflag www.example.com A.
  { id: "noedns-www-A", options: { labels: ["www", "example", "com"], qtype: 1, authenticData: false, checkingDisabled: false, edns: false, dnssecOk: false, pad: false }, hex: "8d8f0100000100000000000003777777076578616d706c6503636f6d0000010001" },
  // dig +noedns +noadflag example.com MX.
  { id: "noedns-MX", options: { labels: ["example", "com"], qtype: 15, authenticData: false, checkingDisabled: false, edns: false, dnssecOk: false, pad: false }, hex: "e36201000001000000000000076578616d706c6503636f6d00000f0001" },
  // dig +bufsize=4096 +nocookie +dnssec +adflag example.com DNSKEY.
  { id: "edns-do-ad-DNSKEY", options: { labels: ["example", "com"], qtype: 48, authenticData: true, checkingDisabled: false, edns: true, dnssecOk: true, pad: false }, hex: "9cef01200001000000000001076578616d706c6503636f6d00003000010000291000000080000000" },
  // dig +bufsize=4096 +nocookie +adflag +cdflag example.org AAAA.
  { id: "edns-cd-AAAA", options: { labels: ["example", "org"], qtype: 28, authenticData: true, checkingDisabled: true, edns: true, dnssecOk: false, pad: false }, hex: "e23f01300001000000000001076578616d706c65036f726700001c00010000291000000000000000" },
  // dig +tcp +bufsize=4096 +nocookie +adflag +padding=128 example.com A.
  { id: "edns-pad-A", options: { labels: ["example", "com"], qtype: 1, authenticData: true, checkingDisabled: false, edns: true, dnssecOk: false, pad: true }, hex: "3cb701200001000000000001076578616d706c6503636f6d00000100010000291000000000000058000c0054" + "00".repeat(84) },
  // dig +tcp +bufsize=4096 +nocookie +adflag +dnssec +padding=128 example.com HTTPS.
  { id: "edns-pad-do-HTTPS", options: { labels: ["example", "com"], qtype: 65, authenticData: true, checkingDisabled: false, edns: true, dnssecOk: true, pad: true }, hex: "49fc01200001000000000001076578616d706c6503636f6d00004100010000291000000080000058000c0054" + "00".repeat(84) },
];

/** dig -x queries (no EDNS, no AD): the reverse name dig derives, compared with this tool's plan for the address. */
const DIG_REVERSE: { address: string; hex: string }[] = [
  // dig +noedns +noadflag -x 192.0.2.1.
  { address: "192.0.2.1", hex: "5e57010000010000000000000131013201300331393207696e2d61646472046172706100000c0001" },
  // dig +noedns +noadflag -x 2001:db8::1.
  { address: "2001:db8::1", hex: "f493010000010000000000000131013001300130013001300130013001300130013001300130013001300130013001300130013001300130013001300138016201640130013101300130013203697036046172706100000c0001" },
];

/** A recorded fetch call. */
interface Recorded {
  /** The URL. */
  url: string;
  /** The options. */
  init: DohRequestInit;
}

/**
 * A mock fetch: records each call and answers as told.
 * @param behaviour what to do
 * @param log where calls are recorded
 * @returns the mock
 */
function mockFetch(
  behaviour:
    | { status: number; body: Uint8Array; headers: Record<string, string> }
    | "reject"
    | "hang"
    | { status: number; badBody: true; headers: Record<string, string> },
  log: Recorded[],
): DohFetchLike {
  // The mock.
  return (url, init) => {
    // Record the call.
    log.push({ url, init });
    // A network, CORS or policy failure.
    if (behaviour === "reject") return Promise.reject(new TypeError("Failed to fetch"));
    // Never answers, but honours the abort signal, as fetch does.
    if (behaviour === "hang") {
      // Rejects when aborted.
      return new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
    }
    // The header lookup, case-insensitive like Headers.get.
    const headers = { get: (n: string) => behaviour.headers[n.toLowerCase()] ?? null };
    // A body that cannot be read.
    if ("badBody" in behaviour) {
      // The response.
      return Promise.resolve({ status: behaviour.status, ok: behaviour.status >= 200 && behaviour.status < 300, headers, arrayBuffer: () => Promise.reject(new TypeError("body")) });
    }
    // A normal answer.
    return Promise.resolve({
      // Status.
      status: behaviour.status,
      // 2xx.
      ok: behaviour.status >= 200 && behaviour.status < 300,
      // Headers.
      headers,
      // A copy of the body.
      arrayBuffer: () => Promise.resolve(Uint8Array.from(behaviour.body).buffer),
    });
  };
}

/** The defaults of a lookup input, for the planning vectors. */
const BASE_INPUT: LookupInput = { name: "example.com", type: "A", resolver: "cloudflare", edns: true, dnssecOk: false, checkingDisabled: false };

// ---- the run ----------------------------------------------------------------

/** The report. */
export interface VectorReport {
  /** GOLDEN_VECTOR_SET_ID. */
  setId: string;
  /** Checks run. */
  total: number;
  /** Checks passed. */
  passed: number;
  /** One line per failure. */
  failures: string[];
}

/**
 * Run every vector.
 * @returns the report
 */
export async function verifyVectors(): Promise<VectorReport> {
  // Failures, one line each.
  const failures: string[] = [];
  // Checks run.
  let total = 0;
  /**
   * Run one check.
   * @param id the check's name
   * @param fn returns null on success, a reason on failure
   */
  const check = async (id: string, fn: () => string | null | Promise<string | null>): Promise<void> => {
    // Count it.
    total++;
    try {
      // Run.
      const r = await fn();
      // Record a failure.
      if (r !== null) failures.push(`${id}: ${r}`);
    } catch (e) {
      // An exception is a failure too.
      failures.push(`${id}: threw ${(e as Error).message}`);
    }
  };

  // ---- encoding: the RFC and Cloudflare examples, byte for byte ----

  // RFC 8484 4.1.1: www.example.com A, ID 0, RD only.
  await check("query/rfc8484-get", () => {
    // Build.
    const q = buildQuery({ labels: ["www", "example", "com"], qtype: 1, recursionDesired: true, authenticData: false, checkingDisabled: false, edns: false, dnssecOk: false, pad: false });
    // The RFC's 33 octets and its base64url.
    const hexOk = toHex(q, false) === "00000100000100000000000003777777076578616d706c6503636f6d0000010001";
    // The dns parameter, as printed in the RFC.
    const b64Ok = toBase64Url(q) === "AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB";
    // Both.
    return hexOk && b64Ok ? null : `hex ${hexOk} b64 ${b64Ok}`;
  });

  // RFC 8484 4.1.1: the 94-octet query whose base64url uses "-" and no padding.
  await check("query/rfc8484-base64url-distinct", () => {
    // The 62-character label.
    const label = "62characterlabel-makes-base64url-distinct-from-standard-base64";
    // Build.
    const q = buildQuery({ labels: ["a", label, "example", "com"], qtype: 1, recursionDesired: true, authenticData: false, checkingDisabled: false, edns: false, dnssecOk: false, pad: false });
    // The RFC's text, its three lines joined.
    const want = "AAABAAABAAAAAAAAAWE-NjJjaGFyYWN0ZXJsYWJlbC1tYWtlcy1iYXNlNjR1cmwtZGlzdGluY3QtZnJvbS1zdGFuZGFyZC1iYXNlNjQHZXhhbXBsZQNjb20AAAEAAQ";
    // 94 octets and the same text.
    return q.length === 94 && toBase64Url(q) === want ? null : `len ${q.length} b64 ${toBase64Url(q)}`;
  });

  // Cloudflare's documented query (ID 0xabcd) matches this tool's after the ID.
  await check("query/cloudflare-doc", () => {
    // Cloudflare's example, decoded.
    const cf = b64("q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB");
    // This tool's, with ID 0.
    const q = buildQuery({ labels: ["www", "example", "com"], qtype: 1, recursionDesired: true, authenticData: false, checkingDisabled: false, edns: false, dnssecOk: false, pad: false });
    // The ID is the only difference.
    return cf[0] === 0xab && cf[1] === 0xcd && toHex(cf.subarray(2)) === toHex(q.subarray(2)) ? null : "differs";
  });

  // dig's queries, after the ID.
  for (const v of DIG_QUERIES) {
    // One check each.
    await check(`query/dig-${v.id}`, () => {
      // Build with RD on, as dig does.
      const q = buildQuery({ ...v.options, recursionDesired: true });
      // Compare after the two ID octets; this tool's ID is 0.
      return q[0] === 0 && q[1] === 0 && toHex(q.subarray(2), false) === v.hex.slice(4) ? null : `got ${toHex(q, false)}`;
    });
  }

  // dig -x: the plan for an address builds the same reverse name (compared on a no-EDNS, no-AD build).
  for (const v of DIG_REVERSE) {
    // One check each.
    await check(`query/dig-x-${v.address}`, () => {
      // The plan.
      const p = planLookup({ ...BASE_INPUT, name: v.address, type: "PTR", edns: false });
      // Must be ready.
      if (p.kind !== "ready") return `plan ${p.kind}`;
      // The same query without AD, as dig +noadflag sent it.
      const q = buildQuery({ ...p.options, authenticData: false });
      // Compare after the ID.
      return toHex(q.subarray(2), false) === v.hex.slice(4) ? null : `got ${toHex(q, false)}`;
    });
  }

  // The Example button's exact URL: dig's padded A query with ID 0, base64url, on Cloudflare's endpoint.
  await check("plan/example-url", () => {
    // The plan for the example.
    const p = planLookup({ ...BASE_INPUT, name: EXAMPLE.name, type: EXAMPLE.type, resolver: EXAMPLE.resolver });
    // Must be ready.
    if (p.kind !== "ready") return `plan ${p.kind}`;
    // dig's padded query for example.com A, ID set to 0.
    const dig = hx("0000" + DIG_QUERIES[4].hex.slice(4));
    // The URL the page must show.
    const want = `https://cloudflare-dns.com/dns-query?dns=${toBase64Url(dig)}`;
    // Exactly.
    return p.url === want && p.query.length === 128 ? null : `got ${p.url}`;
  });

  // The recorded probes' queries: this tool's plan builds the very octets the probe script sent.
  for (const f of RECORDED) {
    // One check each.
    await check(`plan/recorded-query-${f.id}`, () => {
      // The plan for the same input.
      const p = planLookup({ name: f.name, type: f.type, resolver: f.resolver, edns: f.edns, dnssecOk: f.dnssecOk, checkingDisabled: f.checkingDisabled });
      // Must be ready.
      if (p.kind !== "ready") return `plan ${p.kind}`;
      // The same octets.
      return toBase64(p.query) === f.query ? null : `got ${toBase64(p.query)}`;
    });
  }

  // Padding: every EDNS query is a multiple of 128 octets, from the root to a 255-octet name.
  for (const name of [".", "a", "example.com", `${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`]) {
    // One check each.
    await check(`query/padded-${name.length}`, () => {
      // The plan.
      const p = planLookup({ ...BASE_INPUT, name, type: "DNSKEY", dnssecOk: true });
      // Must be ready.
      if (p.kind !== "ready") return `plan ${p.kind}`;
      // A whole number of blocks.
      return p.query.length % 128 === 0 ? null : `length ${p.query.length}`;
    });
  }

  // DO needs EDNS: without EDNS there is no OPT record, so DO cannot be set.
  await check("plan/do-needs-edns", () => {
    // DO asked, EDNS off.
    const p = planLookup({ ...BASE_INPUT, edns: false, dnssecOk: true });
    // Ready, no OPT (ARCOUNT 0), 29 octets.
    return p.kind === "ready" && !p.options.dnssecOk && p.query[11] === 0 && p.query.length === 29 ? null : "OPT present";
  });

  // Every resolver's URL starts with its documented endpoint, and its host is in the CSP list.
  for (const id of ["cloudflare", "google", "quad9"]) {
    // One check each.
    await check(`plan/resolver-${id}`, () => {
      // The plan.
      const p = planLookup({ ...BASE_INPUT, resolver: id });
      // Must be ready.
      if (p.kind !== "ready") return `plan ${p.kind}`;
      // Endpoint, ?dns=, and a host the page's policy names.
      return p.url.startsWith(`${p.resolver.endpoint}?dns=`) && RESOLVER_HOSTS.includes(new URL(p.url).host) ? null : p.url;
    });
  }

  // The hosts list is exactly the three, in order (public/_headers names these).
  await check("resolvers/hosts", () => (JSON.stringify(RESOLVER_HOSTS) === JSON.stringify(["cloudflare-dns.com", "dns.google", "dns.quad9.net"]) ? null : JSON.stringify(RESOLVER_HOSTS)));

  // An unknown resolver id falls back to the first.
  await check("resolvers/fallback", () => (resolverById("nope").id === "cloudflare" ? null : "no fallback"));

  // The curl twin.
  await check("curl/command", () => {
    // For the RFC URL on Cloudflare.
    const c = curlCommand("https://cloudflare-dns.com/dns-query?dns=AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB");
    // Exactly.
    return c === "curl -s -H 'accept: application/dns-message' -o answer.bin 'https://cloudflare-dns.com/dns-query?dns=AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB'" ? null : c;
  });

  // ---- reading typed names ----

  // Accepted names and the labels they become.
  const nameOk: [string, string[]][] = [
    // A plain name.
    ["example.com", ["example", "com"]],
    // Absolute.
    ["example.com.", ["example", "com"]],
    // The root.
    [".", []],
    // A service label.
    ["_dmarc.example.com", ["_dmarc", "example", "com"]],
    // A wildcard owner.
    ["*.example.com", ["*", "example", "com"]],
    // An A-label.
    ["xn--mnchen-3ya.de", ["xn--mnchen-3ya", "de"]],
    // Upper case is kept as typed.
    ["WWW.Example.COM", ["WWW", "Example", "COM"]],
  ];
  // One check each.
  for (const [text, labels] of nameOk) await check(`name/ok-${text}`, () => {
    // Read.
    const r = readQueryName(text);
    // Accepted with these labels.
    return r.ok && JSON.stringify(r.labels) === JSON.stringify(labels) ? null : JSON.stringify(r);
  });
  // Refused names and why.
  const nameBad: [string, string][] = [
    // Non-ASCII: enter the A-label.
    ["münchen.de", "nonAscii"],
    // A space.
    ["exa mple.com", "badCharacter"],
    // A wildcard inside a label.
    ["a*.example.com", "badCharacter"],
    // Two dots.
    ["a..b", "emptyLabel"],
    // A leading dot.
    [".example.com", "emptyLabel"],
    // A 64-octet label.
    [`${"a".repeat(64)}.com`, "labelTooLong"],
    // 4 x 63-octet labels: 257 octets on the wire.
    [`${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(63)}`, "nameTooLong"],
  ];
  // One check each.
  for (const [text, code] of nameBad) await check(`name/refused-${code}-${text.length}`, () => {
    // Read.
    const r = readQueryName(text);
    // Refused with this code.
    return !r.ok && r.code === code ? null : JSON.stringify(r);
  });
  // A 255-octet name is the most allowed.
  await check("name/255-octets", () => {
    // 3 x 63 + 61: 3*64 + 62 + 1 = 255.
    const r = readQueryName(`${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`);
    // Accepted.
    return r.ok ? null : JSON.stringify(r);
  });

  // The plan: empty, an address with a non-PTR type, an address with PTR (IPv4 and IPv6), trimming.
  await check("plan/empty", () => (planLookup({ ...BASE_INPUT, name: "   " }).kind === "empty" ? null : "not empty"));
  // An address asked as A.
  await check("plan/address-needs-ptr", () => {
    // The plan.
    const p = planLookup({ ...BASE_INPUT, name: "1.1.1.1", type: "A" });
    // Refused with the hint.
    return p.kind === "invalid" && p.code === "addressNeedsPtr" ? null : p.kind;
  });
  // An IPv4 address as PTR.
  await check("plan/ptr-ipv4", () => {
    // The plan.
    const p = planLookup({ ...BASE_INPUT, name: " 9.9.9.9 ", type: "PTR" });
    // The reverse name and the address kept.
    return p.kind === "ready" && p.qname === "9.9.9.9.in-addr.arpa." && p.reverseOf === "9.9.9.9" ? null : JSON.stringify(p);
  });
  // An IPv6 address as PTR.
  await check("plan/ptr-ipv6", () => {
    // The plan.
    const p = planLookup({ ...BASE_INPUT, name: "2001:db8::1", type: "PTR" });
    // 32 nibbles under ip6.arpa.
    return p.kind === "ready" && p.qname === "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa." ? null : JSON.stringify(p);
  });
  // A reverse name typed as a name is used as it is.
  await check("plan/ptr-name", () => {
    // The plan.
    const p = planLookup({ ...BASE_INPUT, name: "1.1.1.1.in-addr.arpa", type: "PTR" });
    // Kept, no address recorded.
    return p.kind === "ready" && p.qname === "1.1.1.1.in-addr.arpa." && p.reverseOf === null ? null : JSON.stringify(p);
  });

  // ---- encodings ----

  // RFC 4648 section 10, base64 and base32hex (padding removed for base32hex, as NSEC3 writes it).
  const words = ["", "f", "fo", "foo", "foob", "fooba", "foobar"];
  // The RFC's base64 results.
  const want64 = ["", "Zg==", "Zm8=", "Zm9v", "Zm9vYg==", "Zm9vYmE=", "Zm9vYmFy"];
  // The RFC's base32hex results.
  const want32 = ["", "CO======", "CPNG====", "CPNMU===", "CPNMUOG=", "CPNMUOJ1", "CPNMUOJ1E8======"];
  // One check per word.
  for (let i = 0; i < words.length; i++) await check(`encode/rfc4648-${words[i] || "empty"}`, () => {
    // The ASCII octets.
    const bytes = Uint8Array.from(words[i], (c) => c.charCodeAt(0));
    // base64 with padding, base32hex without.
    const ok = toBase64(bytes) === want64[i] && toBase32Hex(bytes) === want32[i].replace(/=+$/, "");
    // And base64 back.
    const back = fromBase64(want64[i]);
    // Report.
    return ok && back !== null && toHex(back) === toHex(bytes) ? null : `${toBase64(bytes)} ${toBase32Hex(bytes)}`;
  });
  // fromBase64 refuses non-base64.
  await check("encode/base64-refuses", () => (fromBase64("ab$d") === null && fromBase64("a") === null ? null : "accepted"));

  // RFC 5952 section 4 examples.
  const v6: [string, string][] = [
    // 4.1: leading zeros suppressed.
    ["20010db8000000000000000000000001", "2001:db8::1"],
    // 4.2.1: shortened as much as possible.
    ["20010db8000000000000000000020001", "2001:db8::2:1"],
    // 4.2.2: one zero field is not shortened.
    ["20010db8000000010001000100010001", "2001:db8:0:1:1:1:1:1"],
    // 4.2.3: the longest run.
    ["20010000000000010000000000000001", "2001:0:0:1::1"],
    // 4.2.3: equal runs, the first.
    ["20010db8000000000001000000000001", "2001:db8::1:0:0:1"],
    // Section 5: IPv4-mapped in mixed notation.
    ["00000000000000000000ffffc0000201", "::ffff:192.0.2.1"],
    // All zeros.
    ["00000000000000000000000000000000", "::"],
  ];
  // One check each.
  for (const [h, want] of v6) await check(`ipv6/${want}`, () => (ipv6ToText(hx(h)) === want ? null : ipv6ToText(hx(h))));

  // Presentation escapes: a dot, a space and 0xff inside a label (RFC 1035 section 5.1).
  await check("present/label-escapes", () => {
    // The labels.
    const t = nameToText([Uint8Array.from([0x61, 0x2e, 0x62, 0x20, 0xff]), Uint8Array.from([0x63])]);
    // a\.b\032\255.c.
    return t === "a\\.b\\032\\255.c." ? null : t;
  });
  // A TXT with a quote, a backslash and a line feed.
  await check("present/txt-escapes", () => {
    // RDATA: one string of 7 octets: a " b \ c LF d.
    const rd = Uint8Array.from([7, 0x61, 0x22, 0x62, 0x5c, 0x63, 0x0a, 0x64]);
    // Decode as TXT.
    const r = decodeRdata(rd, 16, 0, rd.length);
    // "a\"b\\c\010d".
    return r.text === '"a\\"b\\\\c\\010d"' ? null : r.text;
  });

  // The hex dump: the RFC 8484 query.
  await check("present/hexdump", () => {
    // The dump.
    const d = hexDump(buildQuery({ labels: ["www", "example", "com"], qtype: 1, recursionDesired: true, authenticData: false, checkingDisabled: false, edns: false, dnssecOk: false, pad: false }));
    // Three lines: 16, 16 and 1 octets.
    const want = [
      // Octets 0 to 15.
      "00000000  00 00 01 00 00 01 00 00  00 00 00 00 03 77 77 77  |.............www|",
      // Octets 16 to 31.
      "00000010  07 65 78 61 6d 70 6c 65  03 63 6f 6d 00 00 01 00  |.example.com....|",
      // Octet 32.
      "00000020  01                                                |.|",
    ].join("\n");
    // Exactly.
    return d === want ? null : d;
  });

  // ---- decoding: the RFC and Cloudflare examples ----

  // RFC 8484 4.2.2.
  await check("decode/rfc8484-answer", () => {
    // Decode and check against the AAAA question.
    const out = readAnswer(RFC_ANSWER, RFC_AAAA_OPTIONS);
    // Must be an answer.
    if (!out.ok) return `${out.reason} ${out.code}`;
    // One record, one compression pointer, flags qr rd ra.
    const want = ["www.example.com. 3709 IN AAAA 2001:db8:abcd:12:1:2:3:4"];
    // Compare.
    return JSON.stringify(lines(out.message)) === JSON.stringify(want) && out.message.pointers === 1 && flagList(out.message).join(" ") === "qr rd ra" ? null : JSON.stringify(lines(out.message));
  });
  // Cloudflare's documented answer.
  await check("decode/cloudflare-doc-answer", () => {
    // Decode.
    const m = decodeMessage(CF_DOC_ANSWER);
    // One A record, no pointers.
    return JSON.stringify(lines(m)) === JSON.stringify(["www.example.com. 128 IN A 192.0.2.1"]) && m.pointers === 0 ? null : JSON.stringify(lines(m));
  });

  // ---- decoding: the recorded answers, against dig ----

  // Each fixture.
  for (const f of RECORDED) {
    // Integrity first: the body is the one captured.
    await check(`recorded/${f.id}/sha256`, async () => {
      // The digest by Web Crypto (over a copy backed by its own ArrayBuffer, the type digest() takes).
      const d = await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array(b64(f.body)));
      // Hex.
      return toHex(new Uint8Array(d), false) === f.sha256 ? null : "digest differs";
    });
    // Then dig's decoding.
    await check(`recorded/${f.id}/decode`, () => {
      // The plan's options, as the page would hold them.
      const p = planLookup({ name: f.name, type: f.type, resolver: f.resolver, edns: f.edns, dnssecOk: f.dnssecOk, checkingDisabled: f.checkingDisabled });
      // Must be ready.
      if (p.kind !== "ready") return `plan ${p.kind}`;
      // Read as the page reads it.
      const out = readAnswer(b64(f.body), p.options);
      // Must be an answer to this query.
      if (!out.ok) return `${out.reason} ${out.code}`;
      // Status, flags and every record.
      const got = lines(out.message);
      // Compare all three.
      const ok = out.message.rcodeName === f.status && flagList(out.message).join(" ") === f.flags.join(" ") && JSON.stringify(got) === JSON.stringify(f.expect);
      // Report.
      return ok ? null : `${out.message.rcodeName} ${flagList(out.message)} ${JSON.stringify(got)}`;
    });
  }

  /**
   * A recorded answer, read against its own query.
   * @param id the fixture id
   * @returns the outcome
   */
  const recorded = (id: string) => {
    // The fixture.
    const f = RECORDED.find((x) => x.id === id);
    // Missing fixture: a broken vector file.
    if (!f) throw new Error(`no fixture ${id}`);
    // The plan.
    const p = planLookup({ name: f.name, type: f.type, resolver: f.resolver, edns: f.edns, dnssecOk: f.dnssecOk, checkingDisabled: f.checkingDisabled });
    // Must be ready.
    if (p.kind !== "ready") throw new Error("plan not ready");
    // Read.
    const out = readAnswer(b64(f.body), p.options);
    // Must be an answer.
    if (!out.ok) throw new Error(`${out.reason} ${out.code}`);
    // The message and its assessment.
    return out;
  };

  // DNSSEC states on real answers.
  await check("assess/validated", () => (recorded("cf-a").assessment.dnssec === "validated" ? null : recorded("cf-a").assessment.dnssec));
  // CD in the query.
  await check("assess/checking-disabled", () => {
    // The CD answer.
    const o = recorded("cf-a-cd");
    // CD echoed, AD clear, state checkingDisabled.
    return o.assessment.dnssec === "checkingDisabled" && o.message.header.cd && !o.message.header.ad ? null : o.assessment.dnssec;
  });
  // AD clear on an unsigned reverse zone.
  await check("assess/not-validated", () => (recorded("cf-ptr").assessment.dnssec === "notValidated" ? null : recorded("cf-ptr").assessment.dnssec));
  // RRSIGs counted with DO.
  await check("assess/signatures", () => (recorded("q9-a-do").assessment.signatures === 1 && recorded("cf-dnskey-do").assessment.signatures === 1 ? null : "count"));
  // The DNSKEY key tags against dig's key ids (RFC 4034 Appendix B), and the KSK note on 2371.
  await check("assess/key-tags", () => {
    // The DNSKEY records.
    const keys = recorded("cf-dnskey-do").message.answer.filter((r) => r.type === 48);
    // Their tags.
    const tags = keys.map((k) => k.rdata.facts.find((x) => x.key === "keyTag")?.value);
    // The SEP key.
    const sep = keys.filter((k) => k.rdata.notes.includes("keySep")).map((k) => k.rdata.facts.find((x) => x.key === "keyTag")?.value);
    // dig's key ids, in record order, and 2371 as the KSK.
    return JSON.stringify(tags) === JSON.stringify(["36315", "9776", "34505", "2371"]) && JSON.stringify(sep) === JSON.stringify(["2371"]) ? null : `${tags} ${sep}`;
  });
  // keyTag directly on the KSK's RDATA.
  await check("keytag/2371", () => {
    // The KSK's RDATA: flags 257, protocol 3, algorithm 13, and the key from the fixture.
    const key = fromBase64("mdsswUyr3DPW132mOi8V9xESWE8jTo0dxCjjnopKl+GqJxpVXckHAeF+KkxLbxILfDLUT0rAK9iUzy1L53eKGQ==");
    // Missing key: broken vector.
    if (!key) return "key not base64";
    // The RDATA.
    const rd = Uint8Array.from([0x01, 0x01, 3, 13, ...key]);
    // The tag.
    return keyTag(rd) === 2371 ? null : String(keyTag(rd));
  });
  // NXDOMAIN with its negative caching time (RFC 2308 section 5: the smaller of SOA TTL and MINIMUM).
  await check("assess/nxdomain", () => {
    // The root zone's answer.
    const a = recorded("cf-nxdomain-do").assessment;
    // NXDOMAIN, SOA TTL 86400, MINIMUM 86400, zone ".".
    return a.negative?.kind === "nxdomain" && a.negative.ttl === 86400 && a.negative.zone === "." && a.signatures === 3 ? null : JSON.stringify(a.negative);
  });
  // NODATA: the CAA query for a name without CAA.
  await check("assess/nodata", () => {
    // The answer.
    const a = recorded("cf-caa-nodata").assessment;
    // NODATA, 1800.
    return a.negative?.kind === "nodata" && a.negative.ttl === 1800 && a.negative.zone === "example.com." ? null : JSON.stringify(a.negative);
  });
  // Compact denial.
  await check("assess/compact-denial", () => {
    // The answer.
    const o = recorded("cf-compact-denial");
    // NOERROR, NODATA, NXNAME seen.
    return o.message.rcode === 0 && o.assessment.compactDenial && o.assessment.negative?.kind === "nodata" ? null : JSON.stringify(o.assessment);
  });
  // The Extended DNS Error from Quad9.
  await check("assess/ede", () => {
    // The answer.
    const a = recorded("q9-nxdomain-ede").assessment;
    // EDE 29, Synthesized, with its text.
    return a.ede.length === 1 && a.ede[0].edeCode === 29 && a.ede[0].edeName === "Synthesized" && a.ede[0].edeText === "Result synthesized by root-nx-trust" ? null : JSON.stringify(a.ede);
  });
  // Padding: Cloudflare padded to 468 octets.
  await check("assess/padding", () => {
    // The answer.
    const o = recorded("cf-a");
    // 468 octets with 392 of padding.
    return o.message.size === 468 && o.assessment.paddingOctets === 392 ? null : `${o.message.size} ${o.assessment.paddingOctets}`;
  });
  // EDNS sent, none returned (Google's discovery answer).
  await check("assess/edns-dropped", () => {
    // The answer.
    const o = recorded("gg-svcb-ddr");
    // No OPT; AA set.
    return o.assessment.ednsDropped && o.message.edns === null && o.message.header.aa ? null : "edns present";
  });
  // No EDNS asked: none returned, not counted as dropped.
  await check("assess/no-edns", () => {
    // The answer.
    const o = recorded("cf-a-noedns");
    // No OPT and not "dropped".
    return o.message.edns === null && !o.assessment.ednsDropped && o.assessment.paddingOctets === null ? null : "flagged";
  });
  // RRsets: the root zone's NXDOMAIN proof groups into SOA, NSEC at events. and NSEC at the root, one signature each.
  await check("group/nxdomain-authority", () => {
    // The groups.
    const g = groupRecords(recorded("cf-nxdomain-do").message.authority);
    // Type, owner, record count and signature count per group.
    const got = g.map((x) => `${x.typeName} ${x.owner} ${x.records.length}+${x.signatures.length}`);
    // As dig lists them, regrouped.
    return JSON.stringify(got) === JSON.stringify(["SOA . 1+1", "NSEC events. 1+1", "NSEC . 1+1"]) ? null : JSON.stringify(got);
  });
  // RRsets: four DNSKEYs in one RRset with its one signature.
  await check("group/dnskey-answer", () => {
    // The groups.
    const g = groupRecords(recorded("cf-dnskey-do").message.answer);
    // One group of four, one signature.
    return g.length === 1 && g[0].records.length === 4 && g[0].signatures.length === 1 ? null : JSON.stringify(g.map((x) => [x.typeName, x.records.length, x.signatures.length]));
  });
  // RRsets: an RRSIG whose covered RRset is absent keeps a group of its own; distinct owners stay apart.
  await check("group/orphan-signature", () => {
    // The DS answer with its signature, minus the DS record itself.
    const ans = recorded("cf-ds-do").message.answer.filter((r) => r.typeName === "RRSIG");
    // Grouped.
    const g = groupRecords(ans);
    // One group, typed RRSIG, holding the signature.
    return g.length === 1 && g[0].typeName === "RRSIG" && g[0].records.length === 1 ? null : JSON.stringify(g.map((x) => x.typeName));
  });
  // RRsets: the discovery answer's additional section holds two RRsets (A and AAAA) at one owner.
  await check("group/additional-a-aaaa", () => {
    // The groups.
    const g = groupRecords(recorded("cf-svcb-ddr").message.additional);
    // A x2, AAAA x2.
    return JSON.stringify(g.map((x) => `${x.typeName}x${x.records.length}`)) === JSON.stringify(["Ax2", "AAAAx2"]) ? null : JSON.stringify(g.map((x) => x.typeName));
  });

  // The null MX and the CAA critical flag.
  await check("assess/null-mx", () => (recorded("cf-mx").message.answer[0].rdata.notes.includes("nullMx") ? null : "no note"));
  // The CAA with flag 128.
  await check("assess/caa-critical", () => {
    // The CAA records' notes.
    const notes = recorded("gg-caa").message.answer.map((r) => r.rdata.notes.includes("caaCritical"));
    // The second is critical.
    return JSON.stringify(notes) === "[false,true]" ? null : JSON.stringify(notes);
  });

  // ---- refusals: malformed and hostile messages ----

  // Each refusal case.
  const hostile: [string, Uint8Array, WireRefusal][] = [
    // Eleven octets: no full header.
    ["too-short", RFC_ANSWER.subarray(0, 11), "tooShort"],
    // One octet over the media type's limit.
    ["too-large", new Uint8Array(MAX_MESSAGE_OCTETS + 1), "tooLarge"],
    // An extra octet after the last record.
    ["trailing-byte", Uint8Array.from([...RFC_ANSWER, 0]), "trailingBytes"],
    // The last RDATA octet missing.
    ["rdata-cut", RFC_ANSWER.subarray(0, RFC_ANSWER.length - 1), "truncatedRecord"],
    // ANCOUNT 2 with one record: the second owner name runs past the end.
    ["count-overstated", patch(RFC_ANSWER, { 7: 2 }), "truncatedName"],
    // The answer's owner pointer aimed at itself (offset 33).
    ["pointer-self", patch(RFC_ANSWER, { 33: 0xc0, 34: 33 }), "badPointer"],
    // The answer's owner pointer aimed forward, past itself.
    ["pointer-forward", patch(RFC_ANSWER, { 34: 50 }), "badPointer"],
    // A label length with the reserved 01 bits.
    ["label-type-01", patch(RFC_ANSWER, { 12: 0x43 }), "badLabelType"],
    // A label length with the reserved 10 bits.
    ["label-type-10", patch(RFC_ANSWER, { 12: 0x83 }), "badLabelType"],
    // A label longer than what is left.
    ["label-past-end", raw({ qd: 1, body: [10, 0x61, 0x62] }), "truncatedName"],
    // A 257-octet name (four 63-octet labels).
    ["name-257", raw({ qd: 1, body: [...wn(`${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(63)}`), 0, 1, 0, 1] }), "nameTooLong"],
    // A two-name cycle: the question's "a" then a pointer forward to a record name that points back.
    ["pointer-cycle", raw({ qd: 1, an: 1, body: [1, 0x61, 0xc0, 18, 0, 1, 0, 1, ...rr([0xc0, 12], 1, 1, 60, [192, 0, 2, 1])] }), "badPointer"],
    // RDLENGTH past the end.
    ["rdlength-overrun", patch(RFC_ANSWER, { 44: 0x20 }), "truncatedRecord"],
    // An OPT record in the answer section.
    ["opt-in-answer", raw({ an: 1, body: rr([0], 41, 4096, 0, []) }), "optOutsideAdditional"],
    // Two OPT records.
    ["opt-twice", raw({ ar: 2, body: [...rr([0], 41, 4096, 0, []), ...rr([0], 41, 4096, 0, [])] }), "multipleOpt"],
    // An OPT record owned by a name other than the root.
    ["opt-not-root", raw({ ar: 1, body: rr(wn("a"), 41, 4096, 0, []) }), "optNotRoot"],
    // An option longer than the OPT record.
    ["opt-option-overrun", raw({ ar: 1, body: rr([0], 41, 4096, 0, [0, 12, 0, 9, 0, 0]) }), "badOption"],
  ];
  // The long pointer chain: 130 pointers, each to the one before, inside a NULL record, then an owner using the last.
  const chain: number[] = [0];
  // Pointer k (at RDATA offset 1 + 2k) points to the octet before it began (offset 2k - 1, or the root at 0).
  for (let k = 0; k < 130; k++) {
    // The RDATA starts at offset 12 + 11 = 23 (root owner, ten fixed octets).
    const target = 23 + (k === 0 ? 0 : 1 + 2 * (k - 1));
    // The pointer.
    chain.push(0xc0 | (target >> 8), target & 0xff);
  }
  // The second record's owner is a pointer to the last pointer in the chain.
  const lastPointer = 23 + 1 + 2 * 129;
  // Add it.
  hostile.push(["pointer-chain-too-long", raw({ an: 2, body: [...rr([0], 10, 1, 0, chain), ...rr([0xc0 | (lastPointer >> 8), lastPointer & 0xff], 1, 1, 0, [192, 0, 2, 1])] }), "tooManyPointers"]);
  // One check each.
  for (const [id, buf, code] of hostile) await check(`refuse/${id}`, () => (refusal(buf) === code ? null : `got ${refusal(buf)}`));

  // A legitimate chain of two backward pointers is read.
  await check("decode/pointer-chain-ok", () => {
    // Question example.com at 12; answer owner www + pointer to 12 (at 29); a second owner a + pointer to 29.
    const m = decodeMessage(raw({ qd: 1, an: 2, body: [...wn("example.com"), 0, 1, 0, 1, ...rr([3, 0x77, 0x77, 0x77, 0xc0, 12], 1, 1, 60, [192, 0, 2, 1]), ...rr([1, 0x61, 0xc0, 29], 1, 1, 60, [192, 0, 2, 2])] }));
    // Names and pointers.
    return m.answer[1].name === "a.www.example.com." && m.pointers === 3 ? null : `${m.answer[1].name} ${m.pointers}`;
  });
  // A name of exactly 255 octets decodes.
  await check("decode/name-255", () => {
    // The query built for it, read back.
    const q = buildQuery({ labels: ["a".repeat(63), "b".repeat(63), "c".repeat(63), "d".repeat(61)], qtype: 1, recursionDesired: true, authenticData: false, checkingDisabled: false, edns: false, dnssecOk: false, pad: false });
    // Read the question name.
    const n = readName(q, 12, q.length);
    // Four labels, 255 octets.
    return n.labels.length === 4 && n.next === 12 + 255 ? null : `${n.labels.length} ${n.next}`;
  });

  // ---- malformed RDATA: the record is kept, marked, and shown in the generic form ----

  // Each malformed RDATA.
  const badRdata: [string, number, number[], string][] = [
    // An A with five octets.
    ["a-5", 1, [192, 0, 2, 1, 9], "\\# 5 C000020109"],
    // An AAAA with fifteen.
    ["aaaa-15", 28, new Array(15).fill(0), `\\# 15 ${"00".repeat(15)}`],
    // An MX whose name stops before the RDATA does.
    ["mx-trailing", 15, [0, 10, 0, 7], "\\# 4 000A0007"],
    // An empty TXT.
    ["txt-empty", 16, [], "\\# 0"],
    // A DS without a digest.
    ["ds-4", 43, [9, 67, 13, 2], "\\# 4 09430D02"],
    // A CAA tag with a hyphen.
    ["caa-tag", 257, [0, 2, 0x61, 0x2d, 0x78], "\\# 5 0002612D78"],
    // An SVCB whose keys decrease (port, then alpn).
    ["svcb-key-order", 64, [0, 1, 0, 0, 3, 0, 2, 1, 187, 0, 1, 0, 3, 2, 0x68, 0x32], "\\# 16 0001000003000201BB00010003026832"],
    // An HTTPS alpn with an empty identifier.
    ["https-alpn-empty", 65, [0, 1, 0, 0, 1, 0, 1, 0], "\\# 8 0001000001000100"],
    // An RRSIG whose signer is compressed (forbidden, RFC 4034 section 3.1.7).
    ["rrsig-compressed", 46, [0, 1, 13, 2, 0, 0, 1, 44, 0, 0, 0, 1, 0, 0, 0, 0, 9, 67, 0xc0, 12, 1], "\\# 21 00010D020000012C00000001000000000943C00C01"],
    // An NSEC bit map with a zero-length window.
    ["nsec-window-0", 47, [0, 0, 0], "\\# 3 000000"],
  ];
  // One check each.
  for (const [id, type, rd, text] of badRdata) await check(`rdata/malformed-${id}`, () => {
    // A message with the question example.com and one record of this type (owner: pointer to the question).
    const m = decodeMessage(raw({ qd: 1, an: 1, body: [...wn("example.com"), 0, type & 0xff, 0, 1, ...rr([0xc0, 12], type, 1, 60, rd)] }));
    // The record.
    const r = m.answer[0];
    // Marked malformed, shown generically.
    return r.rdata.malformed && r.rdata.text === text ? null : `${r.rdata.malformed} ${r.rdata.text}`;
  });

  // A TTL with its top bit set reads as zero (RFC 2181 section 8).
  await check("rdata/ttl-top-bit", () => {
    // The RFC answer with TTL 0x80000E7D.
    const m = decodeMessage(patch(RFC_ANSWER, { 39: 0x80 }));
    // Zero, with the note.
    return m.answer[0].ttl === 0 && m.answer[0].rdata.notes.includes("ttlTopBit") ? null : String(m.answer[0].ttl);
  });

  // ---- an answer to another question is refused ----

  // Each mismatch.
  const mismatches: [string, Uint8Array, string][] = [
    // QR clear.
    ["not-response", patch(RFC_ANSWER, { 2: 0x01 }), "notResponse"],
    // Opcode STATUS (2).
    ["opcode", patch(RFC_ANSWER, { 2: 0x91 }), "opcode"],
    // ID 1.
    ["id", patch(RFC_ANSWER, { 1: 1 }), "id"],
    // QDCOUNT 2 (the second question is the record's owner and fixed fields, read as a question; then counts break),
    // built cleanly instead: two questions, no records.
    ["two-questions", raw({ qd: 2, body: [...wn("www.example.com"), 0, 28, 0, 1, ...wn("www.example.com"), 0, 28, 0, 1] }), "multipleQuestions"],
    // Another name (wwx).
    ["other-name", patch(RFC_ANSWER, { 15: 0x78 }), "otherQuestion"],
    // Another type (A).
    ["other-type", patch(RFC_ANSWER, { 30: 0x01 }), "otherQuestion"],
    // Another class (CH).
    ["other-class", patch(RFC_ANSWER, { 32: 0x03 }), "otherQuestion"],
  ];
  // One check each.
  for (const [id, buf, code] of mismatches) await check(`mismatch/${id}`, () => {
    // Read against the AAAA question.
    const out = readAnswer(buf, RFC_AAAA_OPTIONS);
    // Refused for this reason.
    return !out.ok && out.reason === "mismatch" && out.code === code ? null : JSON.stringify(out.ok ? "accepted" : out);
  });
  // Case does not matter (RFC 4343).
  await check("mismatch/case-insensitive", () => {
    // WWW.EXAMPLE.COM in the question.
    const buf = patch(RFC_ANSWER, { 13: 0x57, 14: 0x57, 15: 0x57, 17: 0x45 });
    // Read.
    const out = readAnswer(buf, RFC_AAAA_OPTIONS);
    // Accepted.
    return out.ok ? null : `${out.reason} ${out.code}`;
  });
  // No question at all is accepted and flagged.
  await check("mismatch/no-question", () => {
    // A FORMERR answer with QDCOUNT 0.
    const out = readAnswer(raw({ flags: 0x8181, body: [] }), RFC_AAAA_OPTIONS);
    // Accepted, flagged, FORMERR.
    return out.ok && out.assessment.noQuestion && out.message.rcodeName === "FORMERR" ? null : "refused";
  });

  // ---- flags and response codes ----

  // TC: kept and flagged.
  await check("flags/tc", () => {
    // The RFC answer with TC.
    const out = readAnswer(patch(RFC_ANSWER, { 2: 0x83 }), RFC_AAAA_OPTIONS);
    // Flagged.
    return out.ok && out.assessment.truncated && out.message.header.tc ? null : "not flagged";
  });
  // Each four-bit RCODE, by name.
  const rcodes = ["NOERROR", "FORMERR", "SERVFAIL", "NXDOMAIN", "NOTIMP", "REFUSED", "YXDOMAIN", "YXRRSET", "NXRRSET", "NOTAUTH", "NOTZONE", "DSOTYPENI", "RCODE12"];
  // One check each.
  for (let rc = 0; rc < rcodes.length; rc++) await check(`rcode/${rc}`, () => {
    // The RFC answer with this RCODE.
    const m = decodeMessage(patch(RFC_ANSWER, { 3: 0x80 | rc }));
    // Named.
    return m.rcode === rc && m.rcodeName === rcodes[rc] ? null : `${m.rcode} ${m.rcodeName}`;
  });
  // Extended RCODEs through the OPT record: 1 << 4 | 0 = 16 BADVERS, 1 << 4 | 7 = 23 BADCOOKIE.
  for (const [low, ext, name] of [[0, 1, "BADVERS"], [7, 1, "BADCOOKIE"]] as [number, number, string][]) {
    // One check each.
    await check(`rcode/extended-${name}`, () => {
      // A header with the low bits, an OPT with the high bits.
      const m = decodeMessage(raw({ flags: 0x8180 | low, ar: 1, body: rr([0], 41, 1232, ext << 24, []) }));
      // The full RCODE.
      return m.rcodeName === name && m.edns?.extendedRcode === ext ? null : `${m.rcode} ${m.rcodeName}`;
    });
  }
  // SERVFAIL without CD: the hint; with an EDE 6 and its text.
  await check("assess/servfail-hint", () => {
    // SERVFAIL, the question, an OPT with EDE 6 "signature mismatch".
    const text = Array.from("signature mismatch", (c) => c.charCodeAt(0));
    // The message.
    const buf = raw({ flags: 0x8182, qd: 1, ar: 1, body: [...wn("www.example.com"), 0, 28, 0, 1, ...rr([0], 41, 1232, 0x8000, [0, 15, 0, 2 + text.length, 0, 6, ...text])] });
    // Read.
    const out = readAnswer(buf, RFC_AAAA_OPTIONS);
    // The hint and the EDE.
    return out.ok && out.assessment.dnssec === "servfailHint" && out.assessment.ede[0].edeName === "DNSSEC Bogus" && out.assessment.ede[0].edeText === "signature mismatch" ? null : JSON.stringify(out.ok ? out.assessment : out);
  });
  // The same SERVFAIL asked with CD: no hint.
  await check("assess/servfail-with-cd", () => {
    // SERVFAIL with CD set in the answer.
    const buf = raw({ flags: 0x8192, qd: 1, body: [...wn("www.example.com"), 0, 28, 0, 1] });
    // Read against a CD query.
    const out = readAnswer(buf, { ...RFC_AAAA_OPTIONS, checkingDisabled: true });
    // checkingDisabled, not the hint.
    return out.ok && out.assessment.dnssec === "checkingDisabled" ? null : "hint shown";
  });
  // EDE control characters are escaped.
  await check("edns/ede-escapes", () => {
    // EDE 0 with a line feed in its text.
    const m = decodeMessage(raw({ ar: 1, body: rr([0], 41, 1232, 0, [0, 15, 0, 5, 0, 0, 0x61, 0x0a, 0x62]) }));
    // "a\010b".
    return m.edns?.options[0].edeText === "a\\010b" ? null : String(m.edns?.options[0].edeText);
  });

  // ---- the request ----

  // The URL the tests ask.
  const url = "https://cloudflare-dns.com/dns-query?dns=AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB";
  // The headers of a good answer.
  const goodHeaders = { "content-type": "application/dns-message", "content-length": String(CF_DOC_ANSWER.length), "cache-control": "max-age=128" };
  // The exact request, and the outcome carrying the body and the two headers.
  await check("ask/ok-and-request-shape", async () => {
    // The log.
    const log: Recorded[] = [];
    // Ask.
    const out = await askDoh(url, new AbortController(), mockFetch({ status: 200, body: CF_DOC_ANSWER, headers: goodHeaders }, log));
    // One call.
    if (log.length !== 1) return `${log.length} calls`;
    // What was sent.
    const { url: u, init } = log[0];
    // Every option.
    const shapeOk =
      u === url &&
      init.method === "GET" &&
      JSON.stringify(init.headers) === JSON.stringify({ Accept: "application/dns-message" }) &&
      init.credentials === "omit" &&
      init.referrerPolicy === "no-referrer" &&
      init.cache === "no-store" &&
      init.redirect === "error" &&
      !("body" in init);
    // The outcome.
    const outOk = out.kind === "ok" && toHex(out.body) === toHex(CF_DOC_ANSWER) && out.cacheControl === "max-age=128" && out.contentType === "application/dns-message";
    // Both.
    return shapeOk && outOk ? null : `shape ${shapeOk} out ${JSON.stringify(out)}`;
  });
  // Non-2xx statuses are relayed (Google documents 400, 413, 414, 415, 429, 500, 501, 502).
  for (const status of [400, 415, 429, 502]) {
    // One check each.
    await check(`ask/http-${status}`, async () => {
      // Ask.
      const out = await askDoh(url, new AbortController(), mockFetch({ status, body: new Uint8Array(0), headers: {} }, []));
      // Relayed.
      return out.kind === "httpError" && out.status === status ? null : JSON.stringify(out);
    });
  }
  // A 200 that is not a DNS message.
  await check("ask/not-dns-message", async () => {
    // An HTML page.
    const out = await askDoh(url, new AbortController(), mockFetch({ status: 200, body: Uint8Array.from([0x3c]), headers: { "content-type": "text/html; charset=utf-8" } }, []));
    // Refused before reading.
    return out.kind === "notDnsMessage" && out.contentType === "text/html; charset=utf-8" ? null : JSON.stringify(out);
  });
  // A media type with a parameter still counts.
  await check("ask/media-type-parameter", async () => {
    // application/dns-message; charset ignored.
    const out = await askDoh(url, new AbortController(), mockFetch({ status: 200, body: CF_DOC_ANSWER, headers: { "content-type": "Application/DNS-Message; x=1" } }, []));
    // Accepted.
    return out.kind === "ok" ? null : out.kind;
  });
  // An announced oversize body.
  await check("ask/too-large-announced", async () => {
    // 70000 octets announced.
    const out = await askDoh(url, new AbortController(), mockFetch({ status: 200, body: new Uint8Array(1), headers: { "content-type": "application/dns-message", "content-length": "70000" } }, []));
    // Refused.
    return out.kind === "tooLarge" ? null : out.kind;
  });
  // An oversize body without an announcement.
  await check("ask/too-large-delivered", async () => {
    // 65536 octets, no length.
    const out = await askDoh(url, new AbortController(), mockFetch({ status: 200, body: new Uint8Array(65536), headers: { "content-type": "application/dns-message" } }, []));
    // Refused.
    return out.kind === "tooLarge" ? null : out.kind;
  });
  // Network, CORS or policy.
  await check("ask/network", async () => {
    // Ask.
    const out = await askDoh(url, new AbortController(), mockFetch("reject", []));
    // Sorted as network.
    return out.kind === "network" ? null : out.kind;
  });
  // An unreadable body.
  await check("ask/unreadable", async () => {
    // Ask.
    const out = await askDoh(url, new AbortController(), mockFetch({ status: 200, badBody: true, headers: { "content-type": "application/dns-message" } }, []));
    // Sorted as unreadable.
    return out.kind === "unreadable" && out.status === 200 ? null : JSON.stringify(out);
  });
  // A timeout (a 25 ms limit stands in for the page's 12 s).
  await check("ask/timeout", async () => {
    // Ask a resolver that never answers.
    const out = await askDoh(url, new AbortController(), mockFetch("hang", []), 25);
    // Sorted as a timeout.
    return out.kind === "timeout" ? null : out.kind;
  });
  // An abort by an input change is not a timeout.
  await check("ask/aborted-by-input-change", async () => {
    // The gate's controller.
    const controller = new AbortController();
    // Start.
    const pending = askDoh(url, controller, mockFetch("hang", []), 10_000);
    // The input changes.
    controller.abort();
    // The outcome.
    const out = await pending;
    // A failure to complete; the page drops it anyway.
    return out.kind === "network" ? null : out.kind;
  });
  // The assessment helper on its own (not through readAnswer) agrees.
  await check("assess/direct", () => {
    // The RFC answer.
    const a = assessResponse(decodeMessage(RFC_ANSWER), RFC_AAAA_OPTIONS);
    // An answer, AD clear, one record of the type.
    return a.mismatch === null && a.dnssec === "notValidated" && a.answersOfType === 1 ? null : JSON.stringify(a);
  });

  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
