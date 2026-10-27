// ============================================================================
// src/lib/dev-out/doh-lookup/compute.ts
// ----------------------------------------------------------------------------
// DNS-OVER-HTTPS LOOKUP - a /dev/out resident (2026-10-27), on the pattern of
// the RDAP and ASN lookups and the Pwned Passwords check: everything that can
// be computed locally is computed here, deterministically, and pinned by
// golden vectors; the one request to the chosen resolver is sent only on the
// reader's explicit action (Ask or Enter, through the AskGate of
// src/lib/dev-out/ask.ts).
//
// WHAT HAPPENS, IN ORDER:
//   1. planLookup(): the typed name (or an IP address, for PTR) is checked and
//      turned into labels; the query is built in wire format by wire.ts (ID 0,
//      RD, AD, optionally CD; EDNS(0) with padding, optionally DO); its bytes,
//      their base64url form and the exact GET URL are shown BEFORE anything is
//      sent.
//   2. askDoh(): on Ask or Enter, one GET to the resolver's documented
//      endpoint with ?dns=<base64url> and Accept: application/dns-message
//      (RFC 8484 sections 4.1 and 6). GET with only an Accept header is a
//      "simple" cross-origin request: Accept is a CORS-safelisted request
//      header (WHATWG Fetch, read 2026-10-27), so the browser sends no
//      preflight. POST would need one (its Content-Type,
//      application/dns-message, is not safelisted), and on 2026-10-27 only one
//      of the three resolvers kept here answered that preflight, so the tool
//      asks with GET only.
//   3. decodeMessage() (wire.ts) reads the answer strictly; assessResponse()
//      checks that it answers THIS query (QR set, opcode QUERY, ID 0, the
//      same question; RFC 9619 for QDCOUNT) and works out what the page
//      explains: the DNSSEC state the resolver reports (AD, CD, a SERVFAIL as
//      a hint), the negative answer and its caching time (RFC 2308 section 5),
//      compact denial (RFC 9824), Extended DNS Errors (RFC 8914).
// A failure (HTTP status, network or CORS or policy, timeout, a body that is
// not a DNS message, a message that does not answer the query) is explained
// and never shown as an answer.
//
// THE RESOLVERS (each kept only when BOTH held on 2026-10-27):
//   - the operator documents the DoH endpoint on its own pages, read today;
//   - the endpoint answers a cross-origin GET from a browser: probed from
//     this container with Origin: https://ronutz.com, the answer carried
//     access-control-allow-origin: * (the full probe log is in the build
//     notes). Several other public resolvers answered DoH without that header,
//     so a web page cannot read their answers; they are left out.
//
// PRIME DIRECTIVE (D-19): every line commented.
// ============================================================================

// The shared egress timeout, so every red-room tool gives up after the same time.
import { ASK_TIMEOUT_MS } from "@/lib/dev-out/ask";
// The dig command builder's address checks and reverse-name derivation (vector-tested there; RFC 1035 3.5, RFC 3596 2.5).
import { isIpv4, isIpv6, reverseName } from "@/lib/tools/dig-command-builder/compute";
// The wire format, both ways.
import {
  buildQuery,
  decodeMessage,
  hexDump,
  toBase64Url,
  WireError,
  T,
  CLASS_IN,
  MAX_LABEL_OCTETS,
  MAX_NAME_OCTETS,
  MAX_MESSAGE_OCTETS,
  type Message,
  type QueryOptions,
  type WireRecord,
  type WireRefusal,
  type EdnsOption,
} from "./wire";
// Type names for the plan.
import { typeName } from "./tables";

// ----------------------------------------------------------------------------
// Provenance
// ----------------------------------------------------------------------------

/** When the documents and probes behind this module were read and run. */
export const SOURCE_SNAPSHOT = Object.freeze({
  // The day of the reads and the CORS probes.
  accessed: "2026-10-27",
  // The protocol.
  rfc8484: "https://www.rfc-editor.org/rfc/rfc8484",
});

// ----------------------------------------------------------------------------
// The resolvers
// ----------------------------------------------------------------------------

/** The resolvers offered, by id. */
export type ResolverId = "cloudflare" | "google" | "quad9";

/** One public resolver, as its operator documents it. */
export interface Resolver {
  /** The id. */
  id: ResolverId;
  /** The service's name, as the operator writes it. */
  service: string;
  /** Who operates it. */
  operator: string;
  /** The one host the page connects to (the page's Content-Security-Policy names it). */
  host: string;
  /** The documented endpoint (RFC 8484 GET appends ?dns=). */
  endpoint: string;
  /** The operator's DoH documentation, read 2026-10-27. */
  docs: string;
  /** The operator's privacy policy for the service, read 2026-10-27. */
  privacy: string;
}

/**
 * The resolvers, in the order offered. Endpoint, documentation and privacy policy as read on 2026-10-27:
 *   - Cloudflare: "DNS Wireformat" (last updated May 5, 2026) gives https://cloudflare-dns.com/dns-query for GET and
 *     POST; the 1.1.1.1 privacy page (last updated May 6, 2026).
 *   - Google: "DNS-over-HTTPS (DoH)" (last updated 2024-09-03): "https://dns.google/dns-query - RFC 8484 (GET and
 *     POST)"; the Google Public DNS privacy page (last updated 2024-09-03).
 *   - Quad9: "Service Addresses & Features": https://dns.quad9.net/dns-query under "Recommended: Malware Blocking,
 *     DNSSEC Validation"; the Data and Privacy Policy, version 1.1, published June 24, 2026.
 * Each also names this same endpoint itself: its answer to the Discovery of Designated Resolvers query
 * (_dns.resolver.arpa SVCB, RFC 9462) carried dohpath="/dns-query{?dns}" for its own host (captured 2026-10-27).
 */
export const RESOLVERS: readonly Resolver[] = Object.freeze([
  {
    // Cloudflare's public resolver.
    id: "cloudflare",
    // Its name.
    service: "1.1.1.1",
    // Its operator.
    operator: "Cloudflare",
    // The host.
    host: "cloudflare-dns.com",
    // The endpoint.
    endpoint: "https://cloudflare-dns.com/dns-query",
    // The wire-format documentation.
    docs: "https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-wireformat/",
    // The resolver's privacy commitments.
    privacy: "https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/",
  },
  {
    // Google's public resolver.
    id: "google",
    // Its name.
    service: "Google Public DNS",
    // Its operator.
    operator: "Google",
    // The host.
    host: "dns.google",
    // The endpoint.
    endpoint: "https://dns.google/dns-query",
    // The DoH documentation.
    docs: "https://developers.google.com/speed/public-dns/docs/doh",
    // The privacy statement.
    privacy: "https://developers.google.com/speed/public-dns/privacy",
  },
  {
    // Quad9's recommended service.
    id: "quad9",
    // Its name.
    service: "Quad9",
    // Its operator, as the privacy policy names it.
    operator: "Quad9 Foundation",
    // The host.
    host: "dns.quad9.net",
    // The endpoint.
    endpoint: "https://dns.quad9.net/dns-query",
    // The addresses and features page.
    docs: "https://quad9.net/service/service-addresses-and-features/",
    // The data and privacy policy.
    privacy: "https://quad9.net/privacy/policy/",
  },
] as Resolver[]);

/** The hosts the page may connect to, in the order of RESOLVERS (public/_headers names exactly these). */
export const RESOLVER_HOSTS: readonly string[] = Object.freeze(RESOLVERS.map((r) => r.host));

/**
 * A resolver by id.
 * @param id the id
 * @returns the resolver (the first one for an unknown id, so the page always has one)
 */
export function resolverById(id: string): Resolver {
  // The match, or the first resolver.
  return RESOLVERS.find((r) => r.id === id) ?? RESOLVERS[0];
}

// ----------------------------------------------------------------------------
// The record types offered
// ----------------------------------------------------------------------------

/**
 * The types the reader can ask for, in the order offered: the common data types, the DNSSEC pair, and the service
 * bindings (all three resolvers answered HTTPS and SVCB queries when probed on 2026-10-27).
 */
export const QUERY_TYPES: readonly string[] = Object.freeze([
  // Addresses and aliases.
  "A", "AAAA", "CNAME",
  // Mail, delegation, text and zone apex.
  "MX", "NS", "TXT", "SOA",
  // Certificate issuance and reverse lookups.
  "CAA", "PTR",
  // DNSSEC.
  "DS", "DNSKEY",
  // Service bindings (RFC 9460).
  "HTTPS", "SVCB",
]);

/** The type numbers of QUERY_TYPES (IANA RR TYPEs). */
const TYPE_NUMBERS: Readonly<Record<string, number>> = Object.freeze({
  // Each offered mnemonic.
  A: T.A, AAAA: T.AAAA, CNAME: T.CNAME, MX: T.MX, NS: T.NS, TXT: T.TXT, SOA: T.SOA,
  // The rest.
  CAA: T.CAA, PTR: T.PTR, DS: T.DS, DNSKEY: T.DNSKEY, HTTPS: T.HTTPS, SVCB: T.SVCB,
});

/**
 * A type mnemonic's number.
 * @param mnemonic one of QUERY_TYPES
 * @returns the number, or null for anything else
 */
export function typeNumber(mnemonic: string): number | null {
  // Only the offered types.
  return TYPE_NUMBERS[mnemonic] ?? null;
}

// ----------------------------------------------------------------------------
// The example (D-83): verbatim in the golden vectors, which pin its URL
// ----------------------------------------------------------------------------

/** The Example button's input: a documentation name (RFC 2606 section 3), type A, the first resolver. */
export const EXAMPLE = Object.freeze({
  // The name.
  name: "example.com",
  // The type.
  type: "A",
  // The resolver.
  resolver: "cloudflare" as ResolverId,
});

// ----------------------------------------------------------------------------
// Reading the input
// ----------------------------------------------------------------------------

/** Why the input cannot become a query (nothing is sent; the page explains). */
export type InputRefusal =
  // A character outside ASCII: an internationalised name must be entered as its A-label (xn--...).
  | "nonAscii"
  // A character outside letters, digits, hyphen and underscore (or a lone "*").
  | "badCharacter"
  // Two dots in a row, or a dot at the start.
  | "emptyLabel"
  // A label longer than 63 octets.
  | "labelTooLong"
  // A name longer than 255 octets in wire form.
  | "nameTooLong"
  // An IP address with a type other than PTR.
  | "addressNeedsPtr";

// One label of a name typed here: letters, digits, hyphen, underscore (service labels such as _dmarc and
// _dns.resolver.arpa), or a lone "*" (a wildcard owner). Anchored, one bounded class: linear time (ReDoS-safe).
const LABEL_RE = /^(?:\*|[A-Za-z0-9_-]+)$/;

/** The name, read. */
export type NameRead =
  // Labels ready for the query.
  | { ok: true; labels: string[] }
  // Refused, with the label to blame where there is one.
  | { ok: false; code: InputRefusal; label: string | null };

/**
 * Turn a typed name into labels. One trailing dot is accepted (an absolute name); "." alone is the root.
 * @param text the name, already trimmed
 * @returns the labels, or the refusal
 */
export function readQueryName(text: string): NameRead {
  // The root.
  if (text === ".") return { ok: true, labels: [] };
  // Anything outside ASCII: internationalised names go in as their A-label.
  if (/[^\x00-\x7f]/.test(text)) return { ok: false, code: "nonAscii", label: null };
  // One trailing dot makes the name absolute; it adds no label.
  const body = text.endsWith(".") ? text.slice(0, -1) : text;
  // The labels.
  const labels = body.split(".");
  // The name's wire length: each label and its length octet, plus the root octet.
  let total = 1;
  // Check each label.
  for (const l of labels) {
    // An empty label: two dots in a row, or a leading dot.
    if (l.length === 0) return { ok: false, code: "emptyLabel", label: null };
    // Over 63 octets (RFC 1035 section 2.3.4).
    if (l.length > MAX_LABEL_OCTETS) return { ok: false, code: "labelTooLong", label: l };
    // A character outside the label alphabet.
    if (!LABEL_RE.test(l)) return { ok: false, code: "badCharacter", label: l };
    // Count it.
    total += l.length + 1;
  }
  // Over 255 octets (RFC 1035 section 2.3.4).
  if (total > MAX_NAME_OCTETS) return { ok: false, code: "nameTooLong", label: null };
  // Ready.
  return { ok: true, labels };
}

// ----------------------------------------------------------------------------
// The plan: everything the page shows before anything is sent
// ----------------------------------------------------------------------------

/** The reader's choices. */
export interface LookupInput {
  /** The name, or an IP address for PTR. */
  name: string;
  /** The type mnemonic (one of QUERY_TYPES). */
  type: string;
  /** The resolver's id. */
  resolver: string;
  /** Add EDNS(0) with padding. */
  edns: boolean;
  /** Set DO (DNSSEC records wanted); needs EDNS. */
  dnssecOk: boolean;
  /** Set CD (checking disabled). */
  checkingDisabled: boolean;
}

/** What the page can show before any egress. */
export type LookupPlan =
  // Nothing typed.
  | { kind: "empty" }
  // The input cannot become a query.
  | { kind: "invalid"; code: InputRefusal; label: string | null }
  // Ready: the query, its encodings and the exact URL.
  | {
      kind: "ready";
      /** The resolver asked. */
      resolver: Resolver;
      /** The query name, presented (absolute). */
      qname: string;
      /** For PTR from an address: the address typed; null otherwise. */
      reverseOf: string | null;
      /** The query type's number. */
      qtype: number;
      /** Its mnemonic. */
      qtypeName: string;
      /** The options the query was built with. */
      options: QueryOptions;
      /** The query's octets (also the body a POST would carry). */
      query: Uint8Array;
      /** The octets in base64url without padding (the dns parameter). */
      dnsParam: string;
      /** The exact URL of the GET. */
      url: string;
      /** The query as a hex dump. */
      dump: string;
    };

/**
 * The deterministic pre-flight, run as the reader types: read the name, build the query, encode it, show the URL.
 * @param input the reader's choices
 * @returns the plan
 */
export function planLookup(input: LookupInput): LookupPlan {
  // Leading and trailing spaces are not part of a name.
  const text = input.name.trim();
  // Nothing typed.
  if (text === "") return { kind: "empty" };
  // The type's number; an unknown mnemonic falls back to A, the select's first entry.
  const qtype = typeNumber(input.type) ?? T.A;
  // Is the text an IP address (dig command builder's checks)?
  const isAddress = isIpv4(text) || isIpv6(text);
  // An address with any type but PTR is almost certainly a mistake: say so instead of asking for a name "1.1.1.1".
  if (isAddress && qtype !== T.PTR) return { kind: "invalid", code: "addressNeedsPtr", label: null };
  // For PTR from an address, the reverse name (in-addr.arpa or ip6.arpa); otherwise the text itself.
  const reverse = isAddress ? reverseName(text) : null;
  // The name to read.
  const read = readQueryName(reverse ?? text);
  // Refused.
  if (!read.ok) return { kind: "invalid", code: read.code, label: read.label };
  // The resolver.
  const resolver = resolverById(input.resolver);
  // The query's options: ID 0 and RD always; AD always (RFC 6840 section 5.7, so AD comes back even without DO);
  // CD as chosen; EDNS(0) with padding as chosen; DO only with EDNS.
  const options: QueryOptions = {
    // The labels.
    labels: read.labels,
    // The type.
    qtype,
    // Recursion wanted: the resolver resolves the name.
    recursionDesired: true,
    // Interested in AD.
    authenticData: true,
    // As chosen.
    checkingDisabled: input.checkingDisabled,
    // As chosen.
    edns: input.edns,
    // Only with EDNS.
    dnssecOk: input.edns && input.dnssecOk,
    // Padding whenever EDNS is on (RFC 8467 section 4.1).
    pad: input.edns,
  };
  // The octets.
  const query = buildQuery(options);
  // The dns parameter.
  const dnsParam = toBase64Url(query);
  // The plan.
  return {
    kind: "ready",
    resolver,
    // Presented as an absolute name.
    qname: read.labels.length === 0 ? "." : read.labels.join(".") + ".",
    // The address, when one was typed.
    reverseOf: reverse ? text : null,
    qtype,
    qtypeName: typeName(qtype),
    options,
    query,
    dnsParam,
    // The documented endpoint with the one variable RFC 8484 defines for GET.
    url: `${resolver.endpoint}?dns=${dnsParam}`,
    dump: hexDump(query),
  };
}

/**
 * The curl command that repeats the request from the reader's own machine (shown on failure paths). It writes the
 * binary answer to a file (curl manual, read 2026-10-27: -s silent, -H an extra header, -o write output to a file).
 * @param url the exact URL the page displayed
 * @returns a one-line shell command
 */
export function curlCommand(url: string): string {
  // Single quotes keep the shell away from the URL; base64url never contains a quote.
  return `curl -s -H 'accept: application/dns-message' -o answer.bin '${url}'`;
}

// ----------------------------------------------------------------------------
// Reading the answer against the question
// ----------------------------------------------------------------------------

/** Why a well-formed DNS message is still not an answer to this query. */
export type MismatchRefusal =
  // QR is 0: a query, not a response.
  | "notResponse"
  // The opcode is not QUERY.
  | "opcode"
  // The ID is not the 0 this tool sent.
  | "id"
  // More than one question (RFC 9619 section 4: with OPCODE 0 and QDCOUNT > 1, "MUST be treated as an incorrectly
  // formatted message").
  | "multipleQuestions"
  // The question differs from the one asked (name, type or class).
  | "otherQuestion";

/** The DNSSEC state the resolver reports, as the page explains it. */
export type DnssecState =
  // AD set: the resolver says it validated the answer and authority sections (RFC 4035 section 3.2.3).
  | "validated"
  // CD was set in the query: validation was not asked for, so AD says nothing either way.
  | "checkingDisabled"
  // SERVFAIL without CD: possibly a validation failure; asking again with CD tells (RFC 4035 section 3.2.2).
  | "servfailHint"
  // AD clear: an unsigned zone, or an answer the resolver did not validate.
  | "notValidated";

/** A negative answer and how long a resolver may cache it. */
export interface Negative {
  /** NXDOMAIN (the name does not exist) or NODATA (the name exists, the type does not). */
  kind: "nxdomain" | "nodata";
  /** The SOA record's TTL as received. */
  soaTtl: number;
  /** The SOA record's MINIMUM field. */
  minimum: number;
  /** The negative-caching time: the smaller of the two (RFC 2308 section 5). */
  ttl: number;
  /** The zone the SOA belongs to. */
  zone: string;
}

/** What the page explains about an answer. */
export interface Assessment {
  /** Why the message is not an answer to this query, or null when it is. */
  mismatch: MismatchRefusal | null;
  /** True when the message carries no question at all (RFC 9619 section 4 tells middleboxes not to treat QDCOUNT 0 as malformed). */
  noQuestion: boolean;
  /** The DNSSEC state. */
  dnssec: DnssecState;
  /** RRSIG records in the answer and authority sections. */
  signatures: number;
  /** The Extended DNS Errors carried, in order. */
  ede: EdnsOption[];
  /** The negative answer, or null. */
  negative: Negative | null;
  /** True when an NSEC or NSEC3 record at the query name lists NXNAME (compact denial, RFC 9824). */
  compactDenial: boolean;
  /** Records of the asked type in the answer section. */
  answersOfType: number;
  /** CNAME records in the answer section (the alias chain). */
  cnames: number;
  /** TC set: the message is incomplete. */
  truncated: boolean;
  /** EDNS was sent, and the answer carries no OPT record. */
  ednsDropped: boolean;
  /** The padding octets in the answer's OPT record, or null without one. */
  paddingOctets: number | null;
}

/**
 * Check that a decoded message answers the planned query, and work out what the page explains about it.
 * @param m the decoded message
 * @param options the query's options (from the plan)
 * @returns the assessment
 */
export function assessResponse(m: Message, options: QueryOptions): Assessment {
  // The asked name's comparison key (labels are ASCII; letters folded to lower case).
  const askedKey = options.labels.length === 0 ? "." : options.labels.join(".").toLowerCase() + ".";
  // The mismatch, if any, in order of how basic it is.
  let mismatch: MismatchRefusal | null = null;
  // A query, not a response.
  if (!m.header.qr) mismatch = "notResponse";
  // Another opcode.
  else if (m.header.opcode !== 0) mismatch = "opcode";
  // Another ID: this tool always sends 0.
  else if (m.header.id !== 0) mismatch = "id";
  // More than one question.
  else if (m.questions.length > 1) mismatch = "multipleQuestions";
  // One question, but not ours.
  else if (m.questions.length === 1) {
    // The one question.
    const q = m.questions[0];
    // Name, type and class must all match.
    if (q.key !== askedKey || q.qtype !== options.qtype || q.qclass !== CLASS_IN) mismatch = "otherQuestion";
  }
  // The answer and authority records together.
  const records = [...m.answer, ...m.authority];
  // DNSSEC state, from the flags the resolver set and the one this query set.
  const dnssec: DnssecState = options.checkingDisabled
    ? "checkingDisabled"
    : m.header.ad
      ? "validated"
      : m.rcode === 2
        ? "servfailHint"
        : "notValidated";
  // Signatures returned.
  const signatures = records.filter((r) => r.type === T.RRSIG).length;
  // Extended DNS Errors.
  const ede = (m.edns?.options ?? []).filter((o) => o.edeCode !== undefined);
  // Records of the asked type.
  const answersOfType = m.answer.filter((r) => r.type === options.qtype).length;
  // Aliases followed.
  const cnames = m.answer.filter((r) => r.type === T.CNAME).length;
  // Compact denial: an NSEC or NSEC3 owned by the query name (for NSEC) whose bit map lists NXNAME.
  const compactDenial = m.authority.some((r) => r.rdata.notes.includes("nxname"));
  // The SOA in the authority section, for a negative answer.
  const soa = m.authority.find((r) => r.type === T.SOA && !r.rdata.malformed);
  // A negative answer: NXDOMAIN, or NOERROR with nothing of the type and no alias.
  let negative: Negative | null = null;
  // NXDOMAIN, or NODATA.
  const negKind: Negative["kind"] | null = m.rcode === 3 ? "nxdomain" : m.rcode === 0 && answersOfType === 0 && cnames === 0 ? "nodata" : null;
  // With an SOA, the caching time follows RFC 2308 section 5.
  if (negKind && soa) {
    // The SOA's last field is MINIMUM.
    const minimum = Number(soa.rdata.text.split(" ").pop());
    // The smaller of the SOA's TTL and its MINIMUM.
    negative = { kind: negKind, soaTtl: soa.ttl, minimum, ttl: Math.min(soa.ttl, minimum), zone: soa.name };
  }
  // The padding octets the resolver added, if it sent an OPT record.
  const pad = m.edns?.options.find((o) => o.code === 12);
  // The assessment.
  return {
    mismatch,
    noQuestion: m.questions.length === 0,
    dnssec,
    signatures,
    ede,
    negative,
    compactDenial,
    answersOfType,
    cnames,
    truncated: m.header.tc,
    ednsDropped: options.edns && m.edns === null,
    paddingOctets: m.edns ? (pad ? pad.length : 0) : null,
  };
}

/** One RRset as the page shows it: the records sharing an owner, a type and a class, with the signatures over them. */
export interface RecordGroup {
  /** The owner name, presented. */
  owner: string;
  /** The type's mnemonic (RRSIG for signatures that cover no RRset in the same section). */
  typeName: string;
  /** The records, in message order. */
  records: WireRecord[];
  /** The RRSIG records whose type covered is this RRset's type, at the same owner. */
  signatures: WireRecord[];
}

/**
 * Group a section's records into RRsets (RFC 2181 section 5: records with the same owner, class and type) and attach
 * each RRSIG to the RRset it covers (RFC 4034 section 3.1.1, the Type Covered field), so the page can show one RRset
 * per card with its signatures folded away. An RRSIG that covers nothing in the section keeps a group of its own.
 * Groups keep the order in which their first record appears.
 * @param records one section's records
 * @returns the groups
 */
export function groupRecords(records: WireRecord[]): RecordGroup[] {
  // The groups, in order, and an index by owner key, class and type.
  const groups: RecordGroup[] = [];
  // owner key + class + type name -> group.
  const index = new Map<string, RecordGroup>();
  // First pass: every record that is not a signature.
  for (const r of records) {
    // Signatures wait for the second pass.
    if (r.type === T.RRSIG) continue;
    // The RRset's key.
    const k = `${r.key}|${r.klass}|${r.typeName}`;
    // An existing group, or a new one.
    let g = index.get(k);
    // New RRset.
    if (!g) {
      // Created in order of appearance.
      g = { owner: r.name, typeName: r.typeName, records: [], signatures: [] };
      // Remember it.
      index.set(k, g);
      groups.push(g);
    }
    // Add the record.
    g.records.push(r);
  }
  // Second pass: each signature joins the RRset it covers, or stands alone.
  for (const r of records) {
    // Only signatures.
    if (r.type !== T.RRSIG) continue;
    // The covered type, from the decoded RDATA (absent when the RRSIG was malformed).
    const covered = r.rdata.facts.find((f) => f.key === "covered")?.value;
    // The RRset it covers, if present in this section.
    const g = covered ? index.get(`${r.key}|${r.klass}|${covered}`) : undefined;
    // Attach.
    if (g) g.signatures.push(r);
    // Or keep it as a group of its own.
    else groups.push({ owner: r.name, typeName: r.typeName, records: [r], signatures: [] });
  }
  // Done.
  return groups;
}

/** The outcome of reading a body: a message that answers the query, or the reason it is refused. */
export type ReadOutcome =
  // Decoded and checked.
  | { ok: true; message: Message; assessment: Assessment }
  // Refused by the wire format.
  | { ok: false; reason: "wire"; code: WireRefusal; offset: number | null }
  // A well-formed message that does not answer this query.
  | { ok: false; reason: "mismatch"; code: MismatchRefusal };

/**
 * Decode and check a body in one step.
 * @param body the response octets
 * @param options the query's options
 * @returns the outcome
 */
export function readAnswer(body: Uint8Array, options: QueryOptions): ReadOutcome {
  // The message, strictly.
  let message: Message;
  try {
    // Decode.
    message = decodeMessage(body);
  } catch (e) {
    // A wire refusal: explained, never shown as an answer.
    if (e instanceof WireError) return { ok: false, reason: "wire", code: e.code, offset: e.offset };
    // Anything else is a bug.
    throw e;
  }
  // Checked against the question.
  const assessment = assessResponse(message, options);
  // Not an answer to this query.
  if (assessment.mismatch) return { ok: false, reason: "mismatch", code: assessment.mismatch };
  // The answer.
  return { ok: true, message, assessment };
}

// ----------------------------------------------------------------------------
// The one request (non-deterministic; its outcome sorting is vector-tested with a mock)
// ----------------------------------------------------------------------------

/** The request options askDoh always sends, typed as literals so a test can check every one. */
export interface DohRequestInit {
  /** GET: no preflight, and RFC 8484 calls it friendlier to HTTP caches. */
  method: "GET";
  /** Only Accept, as RFC 8484 section 4.1 asks ("SHOULD include an HTTP Accept request header"); CORS-safelisted. */
  headers: { Accept: "application/dns-message" };
  /** No cookies either way (RFC 8484 section 8.2: "HTTP cookies SHOULD NOT be accepted by DOH clients"). */
  credentials: "omit";
  /** No Referer header (W3C Referrer Policy). */
  referrerPolicy: "no-referrer";
  /** Nothing from or into the browser's HTTP cache, so the TTLs shown are the resolver's own. */
  cache: "no-store";
  /** A redirect would leave the host displayed: fail instead. */
  redirect: "error";
  /** The AskGate's controller, so an input change or the timer can abandon the request. */
  signal: AbortSignal;
}

/** The fetch signature askDoh needs, so a test can pass a mock. */
export type DohFetchLike = (input: string, init: DohRequestInit) => Promise<{
  status: number;
  ok: boolean;
  headers: { get: (name: string) => string | null };
  arrayBuffer: () => Promise<ArrayBuffer>;
}>;

/** What the request produced, before the page decodes the body. */
export type DohAskOutcome =
  // A 2xx with a DNS message body, plus the two CORS-safelisted headers worth showing.
  | { kind: "ok"; body: Uint8Array; status: number; contentType: string | null; cacheControl: string | null }
  // Any non-2xx, relayed verbatim (RFC 8484 section 4.2.1: such a response does "not contain replies").
  | { kind: "httpError"; status: number }
  // A 2xx whose Content-Type is not application/dns-message.
  | { kind: "notDnsMessage"; status: number; contentType: string | null }
  // A 2xx announcing (or delivering) more than 65535 octets.
  | { kind: "tooLarge"; status: number }
  // No answer within ASK_TIMEOUT_MS.
  | { kind: "timeout" }
  // Network failure, CORS failure, a Content-Security-Policy block or a redirect: indistinguishable to page JavaScript.
  | { kind: "network" }
  // A 2xx whose body could not be read.
  | { kind: "unreadable"; status: number };

/** The media type of a DNS message (RFC 8484 section 6). */
export const DNS_MESSAGE_TYPE = "application/dns-message";

/**
 * Send the one GET and sort the outcome. Never throws.
 * @param url the exact URL shown before the action (built by planLookup)
 * @param controller the AbortController from AskGate.begin()
 * @param fetchImpl the fetch to use (the browser's by default; a mock in tests)
 * @param timeoutMs how long to wait before abandoning the request
 * @returns the outcome
 */
export async function askDoh(
  url: string,
  controller: AbortController,
  fetchImpl: DohFetchLike = (input, init) => fetch(input, init),
  timeoutMs: number = ASK_TIMEOUT_MS,
): Promise<DohAskOutcome> {
  // Set when the timer, not the reader, aborted.
  let timedOut = false;
  // The timer that abandons a request taking too long.
  const timer = setTimeout(() => {
    // Remember why.
    timedOut = true;
    // Abandon.
    controller.abort();
  }, timeoutMs);
  try {
    // The one request.
    const res = await fetchImpl(url, {
      // GET.
      method: "GET",
      // Only Accept.
      headers: { Accept: DNS_MESSAGE_TYPE },
      // No cookies.
      credentials: "omit",
      // No Referer.
      referrerPolicy: "no-referrer",
      // No HTTP cache.
      cache: "no-store",
      // No redirects.
      redirect: "error",
      // Abortable.
      signal: controller.signal,
    });
    // Any non-2xx is relayed verbatim.
    if (!res.ok) return { kind: "httpError", status: res.status };
    // Content-Type is a CORS-safelisted response header, readable cross-origin.
    const contentType = res.headers.get("content-type");
    // Not a DNS message (the media type, parameters ignored).
    if (!contentType || contentType.split(";")[0].trim().toLowerCase() !== DNS_MESSAGE_TYPE) {
      // Refused before reading the body.
      return { kind: "notDnsMessage", status: res.status, contentType };
    }
    // Content-Length, also safelisted: refuse an announced oversize body before reading it.
    const announced = Number(res.headers.get("content-length") ?? "0");
    // More than a DNS message can hold.
    if (announced > MAX_MESSAGE_OCTETS) return { kind: "tooLarge", status: res.status };
    // The body.
    let body: Uint8Array;
    try {
      // The octets.
      body = new Uint8Array(await res.arrayBuffer());
    } catch {
      // The timer cut the body short, or it could not be read.
      return timedOut ? { kind: "timeout" } : { kind: "unreadable", status: res.status };
    }
    // A body larger than announced, or with no length announced.
    if (body.length > MAX_MESSAGE_OCTETS) return { kind: "tooLarge", status: res.status };
    // Cache-Control, also safelisted (RFC 8484 section 5.1 ties its freshness to the smallest TTL).
    const cacheControl = res.headers.get("cache-control");
    // The answer.
    return { kind: "ok", body, status: res.status, contentType, cacheControl };
  } catch {
    // The timer's abort is a timeout; anything else (network, CORS, CSP, a redirect, an input-change abort) is a
    // failure to complete. An input-change abort is dropped by the page through AskGate.isCurrent anyway.
    return timedOut ? { kind: "timeout" } : { kind: "network" };
  } finally {
    // The timer never outlives the request.
    clearTimeout(timer);
  }
}
