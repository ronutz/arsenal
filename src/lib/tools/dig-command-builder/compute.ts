// ============================================================================
// src/lib/tools/dig-command-builder/compute.ts
// ----------------------------------------------------------------------------
// DIG COMMAND BUILDER: the pure, local engine. Takes an intent (what to look
// up, where to ask, how to ask, what to print) and deterministically assembles
// one copy-pasteable `dig` command line, every token explained, with findings
// for the combinations that are redundant, pointless or contradictory, and a
// summary of what the query will actually carry (transport, port, header
// bits, EDNS). The inverse of dig-output-explainer, which reads what dig
// printed.
//
// Nothing is executed and nothing leaves the browser (D-49 localOnly).
//
// FACTS, each from a source read on 2026-10-04 (SOURCES below):
//   BIND 9 dig manual (bind9.readthedocs.io, "latest", 9.21): the synopsis
//   `dig [@server] [options] [name] [type] [class] [queryopt...]`; -4/-6; -b
//   address[#port]; -c class (default IN; HS, CH); -k keyfile and the note
//   that -y puts the secret on the command line; -p port (default 53); -q name
//   to disambiguate a name from other arguments; -r (ignore ${HOME}/.digrc);
//   -t type (default A unless -x; AXFR; ixfr=N); -x addr (PTR under
//   in-addr.arpa, nibbles under IP6.ARPA; name, class and type not needed);
//   the IN and CH class names overlap with the IN and CH top-level domains;
//   query options are order sensitive; +bufsize[=B] 0..65535; +cd; +cookie
//   default on, also set by +trace; +dnssec sets the DO bit in the OPT record;
//   +edns default 0, +noedns clears it; +https default port 443 and endpoint
//   /dns-query; +identify shows the answering address with +short; +ignore
//   (no TCP retry on truncation; TCP retries are the default); +multiline;
//   +nsid; +nssearch; +recurse default on, disabled by +nssearch and +trace;
//   +retry default 2; +short is global; +subnet=addr[/prefix], +subnet=0;
//   +tcp (default UDP, except type any and ixfr=N default to TCP and AXFR
//   always uses TCP); +timeout default 5, less than 1 silently set to 1;
//   +tls default port 853; +trace (iterative from the root; @server affects
//   only the root query; sets +dnssec); +tries default 3, <= 0 rounded to 1;
//   +ttlunits; +yaml; +qr; +noall +answer.
//   BIND 9 source, bin/dig/dig.c: a bare word is tried as ixfr=N, then as a
//   type, then as a class, and only then taken as the name (-q sets the name
//   directly; -t and -c close the type/class reading).
//   RFC 1035: TYPE and CLASS values, port 53 over UDP and TCP, 512-octet UDP
//   limit, IN-ADDR.ARPA, labels of 63 octets and names of 255.
//   RFC 3596: AAAA (28) and the IP6.ARPA nibble form.
//   RFC 6891: EDNS(0); requestor's payload size, values under 512 treated as
//   512; 4096 as a starting point; the OPT record carries the options.
//   RFC 3225: the DNSSEC OK (DO) bit lives in the OPT record.
//   RFC 4034 and 4035: DS 43, RRSIG 46, NSEC 47, DNSKEY 48; the CD and AD bits.
//   RFC 5936 and 1995: AXFR over TCP; IXFR with the client's serial.
//   RFC 8482: a server may answer ANY minimally.
//   RFC 7858 and 8484: DNS over TLS on port 853; DNS over HTTPS.
//   RFC 5001, 7871, 7873: the NSID, Client Subnet and COOKIE EDNS options.
//   IANA DNS Parameters: the RR TYPE registry (the mnemonics the type field
//   accepts) and the EDNS option codes.
//   DNS Flag Day 2020: 1232 bytes as the minimum safe EDNS buffer size.
//   RFC 5737 and 3849: the documentation addresses used in the examples.
// ============================================================================

import { decodeIpv6, Ipv6DecodeError } from "../ipv6/compute";

// ----------------------------------------------------------------------------
// Sources
// ----------------------------------------------------------------------------

/** One source record, as the manifest publishes it. */
export interface Source {
  id: string;
  label: string;
  type: "reference" | "implementation" | "vendor-docs" | "vendor-kb" | "vendor-community";
  url: string;
  access_date: string;
  scope: string;
}

/** The day every source below was read. */
const READ = "2026-10-04";

/** Build a source record. */
const src = (id: string, label: string, type: Source["type"], url: string, scope: string): Source => ({ id, label, type, url, access_date: READ, scope });

/** Every source, in the order the manifest lists them. */
export const SOURCES: Source[] = [
  src("bind9-dig", "BIND 9 Administrator Reference Manual, Manual Pages: dig - DNS lookup utility (latest, 9.21)", "vendor-docs", "https://bind9.readthedocs.io/en/latest/manpages.html#man-dig", "the synopsis and every option and query option this builder emits: @server, -4, -6, -b, -c, -k, -p, -q, -r, -t, -x, +bufsize, +cd, +cookie, +dnssec, +edns, +https, +identify, +ignore, +multiline, +noall, +answer, +nsid, +nssearch, +qr, +recurse, +retry, +short, +subnet, +tcp, +timeout, +tls, +trace, +tries, +ttlunits, +yaml; the defaults (A, IN, port 53, UDP, RD set, AD set, EDNS 0, cookie on, timeout 5, tries 3, retry 2); the interactions (+trace sets +dnssec and +cookie and disables recursion, as does +nssearch; @server with +trace affects only the root query; type any and ixfr=N default to TCP, AXFR always uses TCP; +ignore stops the TCP retry on truncation; +short and +cmd are global); the note that only -k should be used, because -y shows the secret in ps output and shell history"),
  src("bind9-dig-c", "BIND 9 source, bin/dig/dig.c (isc-projects/bind9 on GitHub, main branch)", "implementation", "https://github.com/isc-projects/bind9/blob/main/bin/dig/dig.c", "how a bare command-line word is classified: tried as ixfr=N, then as a record type (dns_rdatatype_fromtext), then as a class (dns_rdataclass_fromtext), and only then taken as the name; -t and -c close that reading (open_type_class = false), -q sets the name directly; type ANY and ixfr=N switch tcp_mode on unless +tcp/+notcp was given"),
  src("rfc1035", "RFC 1035: Domain Names - Implementation and Specification", "reference", "https://www.rfc-editor.org/rfc/rfc1035", "section 3.2.2 TYPE values (A 1, NS 2, CNAME 5, SOA 6, PTR 12, MX 15, TXT 16), 3.2.3 QTYPEs (AXFR 252, * 255), 3.2.4 CLASS values (IN 1, CH 3, HS 4); 2.3.4 labels of 63 octets or less and names of 255 octets or less; 3.5 the IN-ADDR.ARPA domain; 4.2 UDP and TCP on server port 53, UDP messages restricted to 512 bytes; 4.1.1 the RD bit"),
  src("rfc3596", "RFC 3596: DNS Extensions to Support IP Version 6", "reference", "https://www.rfc-editor.org/rfc/rfc3596", "the AAAA type is 28; an IPv6 address is represented in the IP6.ARPA domain as a sequence of nibbles separated by dots with the suffix .IP6.ARPA"),
  src("rfc6891", "RFC 6891: Extension Mechanisms for DNS (EDNS(0))", "reference", "https://www.rfc-editor.org/rfc/rfc6891", "the OPT pseudo-RR carries the requestor's UDP payload size and the options; section 6.2.3: values lower than 512 MUST be treated as equal to 512; section 6.2.5: 4096 octets as a starting point, with a fallback around 1280 to 1410 bytes"),
  src("rfc3225", "RFC 3225: Indicating Resolver Support of DNSSEC", "reference", "https://www.rfc-editor.org/rfc/rfc3225", "the DNSSEC OK (DO) bit is the first bit of the extended flags in the EDNS0 OPT meta-RR; setting it tells the server the resolver accepts DNSSEC security RRs"),
  src("rfc4034", "RFC 4034: Resource Records for the DNS Security Extensions", "reference", "https://www.rfc-editor.org/rfc/rfc4034", "the type values DNSKEY 48, RRSIG 46, NSEC 47, DS 43"),
  src("rfc4035", "RFC 4035: Protocol Modifications for the DNS Security Extensions", "reference", "https://www.rfc-editor.org/rfc/rfc4035", "the CD (Checking Disabled) and AD (Authentic Data) header bits; a security-aware server MUST NOT set AD in a response unless the data was authenticated; the CD bit from a query is copied into the response"),
  src("rfc5936", "RFC 5936: DNS Zone Transfer Protocol (AXFR)", "reference", "https://www.rfc-editor.org/rfc/rfc5936", "AXFR is done only via TCP connections; the mechanism by which a zone is copied from the server that holds it"),
  src("rfc1995", "RFC 1995: Incremental Zone Transfer in DNS", "reference", "https://www.rfc-editor.org/rfc/rfc1995", "the IXFR query type is 251; the client sends the serial of its copy of the zone; transport may be UDP or TCP"),
  src("rfc8482", "RFC 8482: Providing Minimal-Sized Responses to DNS Queries That Have QTYPE=ANY", "reference", "https://www.rfc-editor.org/rfc/rfc8482", "a responder may answer an ANY query with a subset of the records or a synthesised HINFO record rather than everything it holds"),
  src("rfc7858", "RFC 7858: Specification for DNS over Transport Layer Security (TLS)", "reference", "https://www.rfc-editor.org/rfc/rfc7858", "DNS over TLS servers listen on and clients connect to TCP port 853 unless another port is mutually agreed"),
  src("rfc8484", "RFC 8484: DNS Queries over HTTPS (DoH)", "reference", "https://www.rfc-editor.org/rfc/rfc8484", "DNS messages carried in HTTP/2 requests with the application/dns-message media type; the URI template is the server's to publish (dig's default endpoint /dns-query comes from the dig manual)"),
  src("rfc5001", "RFC 5001: DNS Name Server Identifier (NSID) Option", "reference", "https://www.rfc-editor.org/rfc/rfc5001", "EDNS option code 3; the server returns an identifier of the instance that answered"),
  src("rfc7871", "RFC 7871: Client Subnet in DNS Queries", "reference", "https://www.rfc-editor.org/rfc/rfc7871", "EDNS option code 8; a SOURCE PREFIX-LENGTH of 0 tells the resolver not to use the client's address information"),
  src("rfc7873", "RFC 7873: Domain Name System (DNS) Cookies", "reference", "https://www.rfc-editor.org/rfc/rfc7873", "EDNS option code 10; a lightweight transaction security mechanism against off-path attackers"),
  src("iana-dns-parameters", "IANA: Domain Name System (DNS) Parameters, Resource Record (RR) TYPEs and DNS EDNS0 Option Codes", "reference", "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml", "the registry of RR TYPE mnemonics and numbers the type field accepts (A 1 to DLV 32769, with * 255 written ANY), and the EDNS option codes NSID 3, edns-client-subnet 8, COOKIE 10"),
  src("dns-flag-day-2020", "DNS Flag Day 2020", "reference", "https://www.dnsflagday.net/2020/", "defaults in DNS software should reflect the minimum safe EDNS buffer size, which is 1232 bytes, to avoid IP fragmentation"),
  src("rfc5737", "RFC 5737: IPv4 Address Blocks Reserved for Documentation", "reference", "https://www.rfc-editor.org/rfc/rfc5737", "192.0.2.0/24 (TEST-NET-1) is reserved for documentation: the resolver address in the examples here is not a real resolver"),
  src("rfc3849", "RFC 3849: IPv6 Address Prefix Reserved for Documentation", "reference", "https://www.rfc-editor.org/rfc/rfc3849", "2001:DB8::/32 is reserved for documentation: the IPv6 addresses in the examples here are not real hosts"),
];

// ----------------------------------------------------------------------------
// The input: an intent, every field optional
// ----------------------------------------------------------------------------

/** How the query travels: UDP (dig's default), TCP, DNS over TLS, DNS over HTTPS. */
export type Transport = "udp" | "tcp" | "tls" | "https";
/** Address family restriction: none, -4 or -6. */
export type Ipv = "" | "4" | "6";
/** The query class: IN (default), CH (Chaosnet), HS (Hesiod). */
export type Klass = "IN" | "CH" | "HS";
/** What dig prints: the whole message, +short, +noall +answer, or +yaml. */
export type OutputMode = "full" | "short" | "answer" | "yaml";

/** The structured input the page (or an API caller) provides. */
export interface DigInput {
  /** The owner name to look up ("example.com", "_sip._tcp.example.com", "."). */
  name?: string;
  /** The record type: a mnemonic from the IANA registry (A, AAAA, MX, ...), TYPEnn, ANY, AXFR or IXFR. Default A. */
  type?: string;
  /** For IXFR: the SOA serial of the copy the client holds (dig writes the type as ixfr=N). */
  ixfrSerial?: string;
  /** The query class. Default IN. */
  klass?: Klass;
  /** A reverse lookup (-x): an IPv4 or IPv6 address; dig builds the PTR name itself and name, type and class are not needed. */
  reverse?: string;
  /** The server to ask (@server): a host name, an IPv4 or an IPv6 address. Empty means the resolvers in /etc/resolv.conf. */
  server?: string;
  /** A non-standard port (-p). Empty means the transport's default (53, 853 for TLS, 443 for HTTPS). */
  port?: string;
  /** -4 or -6. */
  ipv?: Ipv;
  /** The source address of the query (-b address[#port]). */
  source?: string;
  /** The transport. Default UDP. */
  transport?: Transport;
  /** For DNS over HTTPS: the endpoint path (+https=/path). Empty means dig's default, /dns-query. */
  httpsEndpoint?: string;
  /** +trace: iterate from the root, following referrals. */
  trace?: boolean;
  /** +nssearch: find the zone's authoritative servers and show each one's SOA. */
  nssearch?: boolean;
  /** +norecurse: clear the RD bit. */
  norecurse?: boolean;
  /** +dnssec: set the DO bit and ask for the DNSSEC records. */
  dnssec?: boolean;
  /** +cd: set the CD bit (ask the resolver not to validate). */
  cd?: boolean;
  /** +noedns: send a query without an OPT record. */
  noedns?: boolean;
  /** +bufsize=B: the UDP payload size advertised in EDNS (0..65535). */
  bufsize?: string;
  /** +nocookie: do not send the COOKIE option (dig sends it by default). */
  nocookie?: boolean;
  /** +nsid: ask the server to identify itself. */
  nsid?: boolean;
  /** +subnet=addr[/prefix] or +subnet=0: the Client Subnet option. */
  subnet?: string;
  /** +ignore: do not retry over TCP when a UDP answer is truncated. */
  ignore?: boolean;
  /** +timeout=T seconds. */
  timeout?: string;
  /** +tries=T. */
  tries?: string;
  /** +retry=T. */
  retry?: string;
  /** What to print. Default full. */
  output?: OutputMode;
  /** +identify: with +short, also show which server answered. */
  identify?: boolean;
  /** +multiline: verbose multi-line records with comments. */
  multiline?: boolean;
  /** +ttlunits: TTLs in s, m, h, d, w. */
  ttlunits?: boolean;
  /** +qr: also print the query as it is sent. */
  qr?: boolean;
  /** -k keyfile: sign the query with a TSIG or SIG(0) key read from a file. */
  keyfile?: string;
  /** -r: do not read ${HOME}/.digrc. */
  norc?: boolean;
}

// ----------------------------------------------------------------------------
// The result
// ----------------------------------------------------------------------------

/** What a token on the command line is. */
export type PartKind = "program" | "server" | "option" | "name" | "type" | "class" | "queryopt";

/** One emitted token with the id of the message that explains it. */
export interface Part {
  /** The token exactly as it appears in the command. */
  text: string;
  /** Its role. */
  kind: PartKind;
  /** The explanation id (tools.dig-command-builder.explain.<id>). */
  explain: string;
}

/** Finding severities: error stops the build, warning marks a likely mistake, info teaches. */
export type Severity = "error" | "warning" | "info";

/** Every finding code the engine can emit. */
export type FindingCode =
  | "empty" | "bad-name" | "name-too-long" | "label-too-long" | "unknown-type" | "bad-type-number" | "ixfr-needs-serial" | "bad-serial"
  | "bad-reverse" | "bad-server" | "bad-port" | "bad-source" | "bad-bufsize" | "bad-subnet" | "bad-timeout" | "bad-tries" | "bad-retry" | "bad-endpoint" | "bad-keyfile"
  | "reverse-ignores-name" | "q-disambiguates" | "type-default" | "port-default" | "server-brackets"
  | "any-minimal" | "axfr-tcp" | "transfer-needs-server" | "tcp-default-for-type" | "ignore-no-udp"
  | "trace-server-root-only" | "trace-sets-dnssec" | "redundant-norecurse" | "noedns-conflict" | "bufsize-under-512" | "bufsize-large" | "bufsize-default" | "subnet-zero"
  | "identify-needs-short" | "ipv-mismatch" | "timeout-min" | "tries-min" | "tsig-keyfile";

/** One finding. */
export interface Finding {
  /** The code (message id tools.dig-command-builder.finding.<code>). */
  code: FindingCode;
  /** The severity. */
  severity: Severity;
  /** Values the message interpolates. */
  params?: Record<string, string>;
}

/** The question dig will put in the message. */
export interface Question {
  /** The owner name (for -x, the PTR name dig derives). */
  name: string;
  /** The type mnemonic (or ixfr=N). */
  type: string;
  /** The class. */
  klass: string;
}

/** What the query will carry, derived from the manual's defaults and interactions. */
export interface Effective {
  /** The question section. */
  question: Question;
  /** Which servers are asked. */
  servers: "given" | "resolv-conf";
  /** The transport in use (after the type and option defaults). */
  transport: "UDP" | "TCP" | "TLS" | "HTTPS";
  /** Whether a truncated UDP answer is retried over TCP. */
  tcpFallback: boolean;
  /** The port in effect. */
  port: number;
  /** The RD bit. */
  recursionDesired: boolean;
  /** Whether dig iterates from the root itself (+trace). */
  iterative: boolean;
  /** The DO bit (EDNS). */
  dnssecOk: boolean;
  /** The CD bit. */
  checkingDisabled: boolean;
  /** The AD bit (dig sets it by default). */
  authenticData: boolean;
  /** Whether an OPT record is sent. */
  edns: boolean;
  /** The advertised UDP payload size, or null for dig's default. */
  bufsize: number | null;
  /** Whether the COOKIE option is sent. */
  cookie: boolean;
  /** Whether the query is signed with a TSIG key. */
  signed: boolean;
}

/** The engine's output. */
export interface DigResult {
  /** False when an error finding stops the build. */
  ok: boolean;
  /** The single-line command (empty when !ok). */
  command: string;
  /** The tokens, in order, each explained. */
  parts: Part[];
  /** Findings, errors first then warnings then infos, in emission order within a severity. */
  findings: Finding[];
  /** What the query carries (null when !ok). */
  effective: Effective | null;
}

// ----------------------------------------------------------------------------
// Limits
// ----------------------------------------------------------------------------

/** Every free-text field is cut here before parsing (hostile input stays cheap). */
export const MAX_FIELD = 300;

// ----------------------------------------------------------------------------
// Record types: the IANA registry (read 2026-10-04), "*" written as ANY
// ----------------------------------------------------------------------------

/** Mnemonic to number, from the IANA RR TYPE registry; IXFR, AXFR and ANY are QTYPEs dig accepts as types. */
export const RR_TYPES: ReadonlyMap<string, number> = new Map<string, number>([
  ["A", 1], ["NS", 2], ["MD", 3], ["MF", 4], ["CNAME", 5], ["SOA", 6], ["MB", 7], ["MG", 8], ["MR", 9], ["NULL", 10],
  ["WKS", 11], ["PTR", 12], ["HINFO", 13], ["MINFO", 14], ["MX", 15], ["TXT", 16], ["RP", 17], ["AFSDB", 18], ["X25", 19], ["ISDN", 20],
  ["RT", 21], ["NSAP", 22], ["NSAP-PTR", 23], ["SIG", 24], ["KEY", 25], ["PX", 26], ["GPOS", 27], ["AAAA", 28], ["LOC", 29], ["NXT", 30],
  ["EID", 31], ["NIMLOC", 32], ["SRV", 33], ["ATMA", 34], ["NAPTR", 35], ["KX", 36], ["CERT", 37], ["A6", 38], ["DNAME", 39], ["SINK", 40],
  ["OPT", 41], ["APL", 42], ["DS", 43], ["SSHFP", 44], ["IPSECKEY", 45], ["RRSIG", 46], ["NSEC", 47], ["DNSKEY", 48], ["DHCID", 49], ["NSEC3", 50],
  ["NSEC3PARAM", 51], ["TLSA", 52], ["SMIMEA", 53], ["HIP", 55], ["NINFO", 56], ["RKEY", 57], ["TALINK", 58], ["CDS", 59], ["CDNSKEY", 60], ["OPENPGPKEY", 61],
  ["CSYNC", 62], ["ZONEMD", 63], ["SVCB", 64], ["HTTPS", 65], ["DSYNC", 66], ["HHIT", 67], ["BRID", 68], ["UNECE", 69], ["ISO", 70], ["SPF", 99],
  ["UINFO", 100], ["UID", 101], ["GID", 102], ["UNSPEC", 103], ["NID", 104], ["L32", 105], ["L64", 106], ["LP", 107], ["EUI48", 108], ["EUI64", 109],
  ["NXNAME", 128], ["TKEY", 249], ["TSIG", 250], ["IXFR", 251], ["AXFR", 252], ["MAILB", 253], ["MAILA", 254], ["ANY", 255], ["URI", 256], ["CAA", 257],
  ["AVC", 258], ["DOA", 259], ["AMTRELAY", 260], ["RESINFO", 261], ["WALLET", 262], ["CLA", 263], ["IPN", 264], ["TA", 32768], ["DLV", 32769],
]);

/** The types the page offers in its picker, most asked first; the free field takes any other mnemonic. */
export const COMMON_TYPES: readonly string[] = Object.freeze(["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA", "PTR", "SRV", "CAA", "DS", "DNSKEY", "RRSIG", "NSEC", "TLSA", "SVCB", "HTTPS", "NAPTR", "ANY", "AXFR", "IXFR"]);

/** The three classes dig's -c documents. */
export const CLASSES: readonly Klass[] = Object.freeze(["IN", "CH", "HS"]);

/** The default port of each transport (dig manual: 53; +tls 853; +https 443). */
export const DEFAULT_PORT: Readonly<Record<Transport, number>> = Object.freeze({ udp: 53, tcp: 53, tls: 853, https: 443 });

// ----------------------------------------------------------------------------
// Small parsers
// ----------------------------------------------------------------------------

/** Trim and cut a field. */
function field(v: string | undefined): string {
  // Undefined reads as empty; everything is cut at MAX_FIELD.
  return (v ?? "").trim().slice(0, MAX_FIELD);
}

/** A dotted-quad IPv4 address, each octet 0..255 with no leading zeros beyond a lone 0. */
const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

/** Is this a dotted-quad IPv4 address? */
export function isIpv4(s: string): boolean {
  // One anchored expression; no backtracking hazard.
  return IPV4.test(s);
}

/** Is this an IPv6 address (no prefix length)? Uses the ipv6 tool's parser. */
export function isIpv6(s: string): boolean {
  // The ipv6 engine throws on malformed text; a prefix is not an address.
  if (!s.includes(":")) return false;
  try {
    return decodeIpv6(s).prefixLength === null;
  } catch (e) {
    // Any decode error means "not an address"; other errors propagate.
    if (e instanceof Ipv6DecodeError) return false;
    throw e;
  }
}

/** A host name label: letters, digits, hyphen, underscore (SRV-style owner names), or a lone asterisk (wildcard owner). */
const LABEL = /^(\*|[\p{L}\p{N}_-]{1,63})$/u;

/** Validate an owner name; returns a finding code or null when fine. */
function checkName(name: string): FindingCode | null {
  // The root is a valid name on its own.
  if (name === ".") return null;
  // Strip one trailing dot (an absolute name) before measuring.
  const body = name.endsWith(".") ? name.slice(0, -1) : name;
  // RFC 1035 2.3.4: names of 255 octets or less; in presentation form the practical limit is 253 characters.
  if (body.length > 253) return "name-too-long";
  // Split into labels; an empty label (two dots) is malformed.
  const labels = body.split(".");
  for (const l of labels) {
    // Empty labels are malformed.
    if (l.length === 0) return "bad-name";
    // Over 63 characters is a separate, more useful message.
    if (l.length > 63) return "label-too-long";
    // Anything outside the label alphabet is malformed.
    if (!LABEL.test(l)) return "bad-name";
  }
  // Fine.
  return null;
}

/** A positive integer within [lo, hi]; null when not an integer. */
function int(s: string, lo: number, hi: number): number | null {
  // Digits only, at most ten of them (65535 and serials fit).
  if (!/^\d{1,10}$/.test(s)) return null;
  // Parse and range-check.
  const n = Number(s);
  return n >= lo && n <= hi ? n : null;
}

// ----------------------------------------------------------------------------
// Shell quoting (POSIX single quotes, only when needed)
// ----------------------------------------------------------------------------

/** Characters that need no quoting in a POSIX shell word. */
const SAFE = /^[A-Za-z0-9_@%+=:,.\/\-#\[\]]+$/;

/** Quote a token for a POSIX shell if it contains anything else. */
export function shq(v: string): string {
  // Plain tokens pass through unchanged; the rest are single-quoted with the '\'' escape.
  if (v.length > 0 && SAFE.test(v)) return v;
  return "'" + v.replace(/'/g, "'\\''") + "'";
}

// ----------------------------------------------------------------------------
// Reverse names
// ----------------------------------------------------------------------------

/** The PTR owner name dig derives from -x: in-addr.arpa for IPv4, ip6.arpa nibbles for IPv6; null when the text is neither. */
export function reverseName(addr: string): string | null {
  // IPv4: the four octets reversed under in-addr.arpa (RFC 1035 3.5; dig manual -x).
  if (isIpv4(addr)) return addr.split(".").reverse().join(".") + ".in-addr.arpa";
  // IPv6: 32 reversed nibbles under ip6.arpa (RFC 3596 2.5); the ipv6 engine computes it.
  if (isIpv6(addr)) return decodeIpv6(addr).reverseDns;
  // Neither.
  return null;
}

// ----------------------------------------------------------------------------
// The assembler
// ----------------------------------------------------------------------------

/** Build the command. Pure and deterministic: the same input always gives the same bytes. */
export function run(raw: DigInput): DigResult {
  // Normalise every field once.
  const name = field(raw.name);
  const typeIn = field(raw.type).toUpperCase();
  const serial = field(raw.ixfrSerial);
  const klass: Klass = raw.klass && CLASSES.includes(raw.klass) ? raw.klass : "IN";
  const reverse = field(raw.reverse);
  let server = field(raw.server);
  const port = field(raw.port);
  const ipv: Ipv = raw.ipv === "4" || raw.ipv === "6" ? raw.ipv : "";
  const source = field(raw.source);
  const transport: Transport = raw.transport && raw.transport in DEFAULT_PORT ? raw.transport : "udp";
  const endpoint = field(raw.httpsEndpoint);
  const bufsize = field(raw.bufsize);
  const subnet = field(raw.subnet);
  const timeout = field(raw.timeout);
  const tries = field(raw.tries);
  const retry = field(raw.retry);
  const output: OutputMode = raw.output === "short" || raw.output === "answer" || raw.output === "yaml" ? raw.output : "full";
  const keyfile = field(raw.keyfile);

  // Findings accumulate by severity so the order is stable.
  const errors: Finding[] = [];
  const warnings: Finding[] = [];
  const infos: Finding[] = [];
  // Push helpers.
  const err = (code: FindingCode, params?: Record<string, string>) => errors.push({ code, severity: "error", params });
  const warn = (code: FindingCode, params?: Record<string, string>) => warnings.push({ code, severity: "warning", params });
  const info = (code: FindingCode, params?: Record<string, string>) => infos.push({ code, severity: "info", params });

  // -- The question ---------------------------------------------------------
  // Nothing to look up at all: the page shows nothing (the Clear state).
  if (!name && !reverse) err("empty");

  // The reverse address, if any.
  let ptr: string | null = null;
  if (reverse) {
    // Derive the PTR name; a failure is an error.
    ptr = reverseName(reverse);
    if (!ptr) err("bad-reverse", { value: reverse });
    // A name alongside -x is ignored by dig's own rule (name, class and type are not needed).
    else if (name) info("reverse-ignores-name");
  }

  // The owner name (only when not reverse).
  if (name && !reverse) {
    // Validate the presentation form.
    const bad = checkName(name);
    if (bad) err(bad, { value: name });
  }

  // The type: default A; a mnemonic, TYPEnn, or IXFR with a serial.
  let type = "";
  if (!reverse) {
    if (typeIn === "" || typeIn === "A") {
      // A is dig's default and is not written.
      type = "";
      if (typeIn === "A") info("type-default");
    } else if (/^TYPE\d{1,5}$/.test(typeIn)) {
      // TYPEnn: any number up to 65535 (RFC 3597 form, accepted by dig).
      const n = int(typeIn.slice(4), 0, 65535);
      if (n === null) err("bad-type-number", { value: typeIn });
      else {
        // Known numbers are written by their mnemonic for readability; unknown stay TYPEnn.
        const known = [...RR_TYPES.entries()].find(([, v]) => v === n);
        type = known ? known[0] : typeIn;
      }
    } else if (typeIn === "*") {
      // dig spells the wildcard QTYPE "ANY".
      type = "ANY";
    } else if (RR_TYPES.has(typeIn)) {
      // A registry mnemonic.
      type = typeIn;
    } else {
      // Anything else dig would not accept.
      err("unknown-type", { value: typeIn });
    }
  }

  // IXFR needs the serial and is written ixfr=N.
  if (type === "IXFR") {
    if (!serial) err("ixfr-needs-serial");
    else if (int(serial, 0, 4294967295) === null) err("bad-serial", { value: serial });
    else type = "ixfr=" + serial;
  }

  // -- Where to ask ---------------------------------------------------------
  // Brackets around an IPv6 literal are a URL habit dig does not need: strip them and say so.
  if (server.startsWith("[") && server.endsWith("]")) {
    server = server.slice(1, -1);
    info("server-brackets");
  }
  // The server: a host name, an IPv4 or an IPv6 address.
  let serverIsV4 = false;
  let serverIsV6 = false;
  if (server) {
    serverIsV4 = isIpv4(server);
    serverIsV6 = !serverIsV4 && isIpv6(server);
    // A host name must pass the name check and must not carry a port or a path (those are -p and the endpoint).
    if (!serverIsV4 && !serverIsV6 && (checkName(server) !== null || /[@/:#]/.test(server))) err("bad-server", { value: server });
  }
  // -4 against an IPv6 literal, or -6 against an IPv4 literal, cannot connect.
  if ((ipv === "4" && serverIsV6) || (ipv === "6" && serverIsV4)) warn("ipv-mismatch", { family: ipv, server });

  // The port: 1..65535; the transport's default is not written.
  let portNumber: number | null = null;
  if (port) {
    portNumber = int(port, 1, 65535);
    if (portNumber === null) err("bad-port", { value: port });
    else if (portNumber === DEFAULT_PORT[transport]) {
      // Redundant: dig uses it anyway.
      info("port-default", { port: String(portNumber) });
      portNumber = null;
    }
  }

  // The source address: address[#port].
  if (source) {
    // Split off an optional #port.
    const hash = source.indexOf("#");
    const addr = hash >= 0 ? source.slice(0, hash) : source;
    const sport = hash >= 0 ? source.slice(hash + 1) : "";
    // The address must be IPv4 or IPv6 (or the unspecified addresses the manual names); the port 1..65535.
    if (!(isIpv4(addr) || isIpv6(addr)) || (sport !== "" && int(sport, 1, 65535) === null)) err("bad-source", { value: source });
  }

  // The HTTPS endpoint: a path starting with "/" and free of whitespace.
  if (endpoint && !(endpoint.startsWith("/") && !/\s/.test(endpoint))) err("bad-endpoint", { value: endpoint });

  // The key file: a path without whitespace or shell metacharacters that would hide a second command.
  if (keyfile && /[\s;&|<>`$]/.test(keyfile)) err("bad-keyfile", { value: keyfile });

  // -- How to ask -----------------------------------------------------------
  // EDNS buffer size: 0..65535 (manual); under 512 is treated as 512 (RFC 6891 6.2.3).
  let bufsizeNumber: number | null = null;
  if (bufsize) {
    bufsizeNumber = int(bufsize, 0, 65535);
    if (bufsizeNumber === null) err("bad-bufsize", { value: bufsize });
    else if (bufsizeNumber > 0 && bufsizeNumber < 512) warn("bufsize-under-512", { value: bufsize });
    else if (bufsizeNumber > 4096) info("bufsize-large", { value: bufsize });
    else if (bufsizeNumber === 0) info("bufsize-default");
  }

  // Client Subnet: 0, or an address with an optional prefix length.
  let subnetZero = false;
  if (subnet) {
    if (subnet === "0" || subnet === "0.0.0.0/0" || subnet === "::/0") subnetZero = true;
    else {
      // Split the prefix.
      const slash = subnet.indexOf("/");
      const addr = slash >= 0 ? subnet.slice(0, slash) : subnet;
      const plen = slash >= 0 ? subnet.slice(slash + 1) : "";
      const v4 = isIpv4(addr);
      const v6 = !v4 && isIpv6(addr);
      // The prefix length must fit the family.
      const maxLen = v4 ? 32 : 128;
      if (!(v4 || v6) || (plen !== "" && int(plen, 0, maxLen) === null)) err("bad-subnet", { value: subnet });
      else if (plen === "0") subnetZero = true;
    }
    if (subnetZero) info("subnet-zero");
  }

  // Timing: integers; the manual's silent clamps are surfaced as warnings.
  if (timeout) {
    const t = int(timeout, 0, 86400);
    if (t === null) err("bad-timeout", { value: timeout });
    else if (t < 1) warn("timeout-min");
  }
  if (tries) {
    const t = int(tries, 0, 1000);
    if (t === null) err("bad-tries", { value: tries });
    else if (t < 1) warn("tries-min");
  }
  if (retry && int(retry, 0, 1000) === null) err("bad-retry", { value: retry });

  // Mode interactions from the manual.
  const trace = !!raw.trace;
  const nssearch = !!raw.nssearch;
  const norecurse = !!raw.norecurse;
  const dnssec = !!raw.dnssec;
  // +trace sets +dnssec: asking for both is redundant.
  if (trace && dnssec) info("trace-sets-dnssec");
  // +trace and +nssearch disable recursion themselves.
  if ((trace || nssearch) && norecurse) info("redundant-norecurse");
  // @server with +trace affects only the root query.
  if (trace && server) info("trace-server-root-only");

  // EDNS-dependent options against +noedns: the OPT record must be sent, so +noedns is not written.
  const needsEdns = dnssec || trace || bufsizeNumber !== null || !!raw.nsid || !!subnet;
  let noedns = !!raw.noedns;
  if (noedns && needsEdns) {
    warn("noedns-conflict");
    noedns = false;
  }

  // Transport defaults by type (manual: any and ixfr default to TCP; AXFR always TCP).
  const isAxfr = type === "AXFR";
  const isIxfr = type.startsWith("ixfr=");
  const isAny = type === "ANY";
  if (isAny) {
    // Servers may answer minimally (RFC 8482).
    warn("any-minimal");
  }
  if (isAxfr) info("axfr-tcp");
  if ((isAxfr || isIxfr) && !server) warn("transfer-needs-server");
  if (transport === "tcp" && (isAxfr || isIxfr || isAny)) info("tcp-default-for-type", { type: isIxfr ? "IXFR" : type });
  // +ignore only matters over UDP.
  if (raw.ignore && (transport !== "udp" || isAxfr)) info("ignore-no-udp");
  // +identify shows the answering server only with +short.
  if (raw.identify && output !== "short") info("identify-needs-short");
  // A TSIG key file: the server must know the key.
  if (keyfile) info("tsig-keyfile");

  // Stop here on errors.
  if (errors.length > 0) {
    return { ok: false, command: "", parts: [], findings: [...errors, ...warnings, ...infos], effective: null };
  }

  // -- Emit, in one canonical order ------------------------------------------
  const parts: Part[] = [];
  const add = (text: string, kind: PartKind, explain: string) => parts.push({ text, kind, explain });

  // The program.
  add("dig", "program", "dig");
  // @server first, as the manual's examples write it.
  if (server) add("@" + shq(server), "server", "server");
  // Options.
  if (raw.norc) add("-r", "option", "norc");
  if (ipv === "4") add("-4", "option", "ipv4");
  if (ipv === "6") add("-6", "option", "ipv6");
  if (source) add("-b " + shq(source), "option", "source");
  if (portNumber !== null) add("-p " + String(portNumber), "option", "port");
  if (keyfile) add("-k " + shq(keyfile), "option", "keyfile");
  // The question.
  if (reverse) {
    // -x carries the address; dig derives the PTR name, type and class.
    add("-x " + shq(reverse), "name", "reverse");
  } else {
    // A name that is also a type or class mnemonic goes through -q so dig cannot misread it.
    const ambiguous = RR_TYPES.has(name.toUpperCase()) || (CLASSES as readonly string[]).includes(name.toUpperCase()) || name.toUpperCase() === "IXFR";
    if (ambiguous) {
      add("-q " + shq(name), "name", "qname");
      info("q-disambiguates", { value: name });
    } else {
      add(shq(name), "name", "name");
    }
    // The type when not the default.
    if (type) add(type, "type", isAxfr ? "type-axfr" : isIxfr ? "type-ixfr" : isAny ? "type-any" : "type");
    // The class when not IN; a non-default class after an omitted type still parses, because the class mnemonics are not type mnemonics.
    if (klass !== "IN") add(klass, "class", "class");
  }
  // Query options: transport, mode, header bits, EDNS, timing, output.
  if (transport === "tcp") add("+tcp", "queryopt", "tcp");
  if (transport === "tls") add("+tls", "queryopt", "tls");
  if (transport === "https") add(endpoint ? "+https=" + shq(endpoint) : "+https", "queryopt", "https");
  if (trace) add("+trace", "queryopt", "trace");
  if (nssearch) add("+nssearch", "queryopt", "nssearch");
  if (norecurse) add("+norecurse", "queryopt", "norecurse");
  if (dnssec) add("+dnssec", "queryopt", "dnssec");
  if (raw.cd) add("+cd", "queryopt", "cd");
  if (noedns) add("+noedns", "queryopt", "noedns");
  if (bufsizeNumber !== null) add("+bufsize=" + String(bufsizeNumber), "queryopt", "bufsize");
  if (raw.nocookie) add("+nocookie", "queryopt", "nocookie");
  if (raw.nsid) add("+nsid", "queryopt", "nsid");
  if (subnet) add("+subnet=" + shq(subnetZero ? "0" : subnet), "queryopt", "subnet");
  if (raw.ignore) add("+ignore", "queryopt", "ignore");
  if (timeout) add("+timeout=" + String(int(timeout, 0, 86400)), "queryopt", "timeout");
  if (tries) add("+tries=" + String(int(tries, 0, 1000)), "queryopt", "tries");
  if (retry) add("+retry=" + String(int(retry, 0, 1000)), "queryopt", "retry");
  if (output === "short") add("+short", "queryopt", "short");
  if (output === "short" && raw.identify) add("+identify", "queryopt", "identify");
  if (output === "answer") {
    // Order matters: +noall clears every display flag, +answer turns one back on.
    add("+noall", "queryopt", "noall");
    add("+answer", "queryopt", "answer");
  }
  if (output === "yaml") add("+yaml", "queryopt", "yaml");
  if (raw.multiline) add("+multiline", "queryopt", "multiline");
  if (raw.ttlunits) add("+ttlunits", "queryopt", "ttlunits");
  if (raw.qr) add("+qr", "queryopt", "qr");

  // -- What the query carries -------------------------------------------------
  // The transport after the type defaults.
  const effTransport: Effective["transport"] =
    transport === "tls" ? "TLS"
    : transport === "https" ? "HTTPS"
    : transport === "tcp" || isAxfr || isIxfr || isAny ? "TCP"
    : "UDP";
  // The question dig puts in the message.
  const question: Question = reverse
    ? { name: ptr as string, type: "PTR", klass: "IN" }
    : { name, type: type || "A", klass };
  // The summary.
  const effective: Effective = {
    question,
    servers: server ? "given" : "resolv-conf",
    transport: effTransport,
    tcpFallback: effTransport === "UDP" && !raw.ignore,
    port: portNumber ?? DEFAULT_PORT[transport],
    recursionDesired: !(norecurse || trace || nssearch),
    iterative: trace,
    dnssecOk: dnssec || trace,
    checkingDisabled: !!raw.cd,
    authenticData: true,
    edns: !noedns,
    bufsize: bufsizeNumber,
    cookie: !noedns && !raw.nocookie,
    signed: !!keyfile,
  };

  // The command is the tokens joined by single spaces.
  const command = parts.map((p) => p.text).join(" ");
  // Done.
  return { ok: true, command, parts, findings: [...errors, ...warnings, ...infos], effective };
}

/** The number of a type mnemonic as the IANA registry lists it, for the page's type picker; null for ixfr=N. */
export function typeNumber(mnemonic: string): number | null {
  // Direct lookup; TYPEnn parses its own number.
  const m = mnemonic.toUpperCase();
  if (RR_TYPES.has(m)) return RR_TYPES.get(m) ?? null;
  if (/^TYPE\d{1,5}$/.test(m)) return int(m.slice(4), 0, 65535);
  return null;
}
