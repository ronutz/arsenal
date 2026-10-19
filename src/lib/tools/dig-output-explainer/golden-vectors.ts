// ============================================================================
// src/lib/tools/dig-output-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the dig parser. Every input is REAL dig 9.20.29 output,
// copied byte for byte (tabs included) from captures made on 2026-10-19:
//
//   - "relay" captures: dig 9.20.29 built from the ISC release tarball,
//     querying Cloudflare (port 5311) or Google (port 5312) public resolvers
//     through a local relay that forwards each query's exact bytes over DNS
//     over HTTPS (RFC 8484) and returns the response bytes unchanged. The
//     header, flags, OPT and sections are the resolvers' real answers; the
//     SERVER line names the local relay (127.0.0.1), not the resolver.
//   - "lab" captures: the same dig against a local named 9.20.29,
//     authoritative for a LAB copy of example.com with documentation
//     addresses (RFC 5737), or against a lab responder that answers every
//     query with RCODE 11 (no ordinary server returns it).
//
// Names that do not exist are under .invalid (RFC 6761 section 6.4: users MAY
// assume queries for "invalid" names will always return NXDOMAIN), because
// example.com no longer answers NXDOMAIN for them: it answers NOERROR with no
// data (RFC 9824 compact denial, observed 2026-10-18 and 2026-10-19; vector
// "nodata-compact-denial" pins it).
//
// Assertions are on STRUCTURE (opcode, status, id, flags, counts, per-record
// fields, TTLs in seconds, warning codes), never on UI prose, so the teaching
// copy can change freely without breaking tests.
// ============================================================================

import { parseDig, breakdownRdata, type DigParse } from "./compute"; // the engine under test

/** Identifies this vector set; bump the date when a vector is deliberately changed. */
export const GOLDEN_VECTOR_SET_ID = "dig-output-explainer/2026-10-19";

/** One vector: an id, a real dig output, and a check returning failure messages. */
export interface DigVector {
  id: string; // stable id
  input: string; // the dig output, byte for byte
  check: (p: DigParse) => string[]; // returns a list of failure messages ([] = pass)
}

/** Compare one value; return a failure message when it differs. */
function eq(label: string, got: unknown, want: unknown): string[] {
  return got === want ? [] : [`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`]; // [] on a match
}

// -- V1: a plain A lookup (relay, Cloudflare, 2026-10-19 14:37:35 -03) -------
// example.com's addresses as answered that day; no longer 93.184.216.34.
const V1 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5311 example.com A\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 26265\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n;; QUESTION SECTION:\n;example.com.\t\t\tIN\tA\n\n;; ANSWER SECTION:\nexample.com.\t\t214\tIN\tA\t172.66.147.243\nexample.com.\t\t214\tIN\tA\t104.20.23.154\n\n;; Query time: 356 msec\n;; SERVER: 127.0.0.1#5311(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:35 -03 2026\n;; MSG SIZE  rcvd: 72"; // verbatim capture (dig @127.0.0.1 -p 5311 example.com A)

// -- V2: NXDOMAIN for a name under .invalid (relay, Google, 14:37:36) --------
// The root zone's SOA in AUTHORITY: TTL 86322 (a cache counting down) against
// MINIMUM 86400, so the negative-caching TTL is 86322 (RFC 2308 section 5).
const V2 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5312 nonexistent.invalid A\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 26090\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 512\n;; QUESTION SECTION:\n;nonexistent.invalid.\t\tIN\tA\n\n;; AUTHORITY SECTION:\n.\t\t\t86322\tIN\tSOA\ta.root-servers.net. nstld.verisign-grs.com. 2026101900 1800 900 604800 86400\n\n;; Query time: 92 msec\n;; SERVER: 127.0.0.1#5312(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:36 -03 2026\n;; MSG SIZE  rcvd: 123"; // verbatim capture (dig @127.0.0.1 -p 5312 nonexistent.invalid A)

// -- V3: a DNSSEC-validated answer with an RRSIG (relay, Cloudflare, 14:42:40) -
const V3 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5311 example.com A +dnssec\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12033\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags: do; udp: 1232\n;; QUESTION SECTION:\n;example.com.\t\t\tIN\tA\n\n;; ANSWER SECTION:\nexample.com.\t\t256\tIN\tA\t172.66.147.243\nexample.com.\t\t256\tIN\tA\t104.20.23.154\nexample.com.\t\t256\tIN\tRRSIG\tA 13 2 300 20261020184156 20261018164156 34505 example.com. jzksgU47mKFefy6RWRgRS55liE8AhdV9xoPM0nAJcsmRuPEzSwpy6RfE obH97XbP2H4JV7lsrp6zM1H3itexww==\n\n;; Query time: 512 msec\n;; SERVER: 127.0.0.1#5311(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:42:41 -03 2026\n;; MSG SIZE  rcvd: 179"; // verbatim capture (dig @127.0.0.1 -p 5311 example.com A +dnssec)

// -- V4: example.com answers a nonexistent name with NOERROR and no data ------
// (relay, Cloudflare, 14:37:36): RFC 9824 compact denial, not NXDOMAIN.
const V4 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5311 nonexistent.example.com A\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 17740\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n;; QUESTION SECTION:\n;nonexistent.example.com.\tIN\tA\n\n;; AUTHORITY SECTION:\nexample.com.\t\t1800\tIN\tSOA\telliott.ns.cloudflare.com. dns.cloudflare.com. 2416374680 10000 2400 604800 1800\n\n;; Query time: 108 msec\n;; SERVER: 127.0.0.1#5311(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:36 -03 2026\n;; MSG SIZE  rcvd: 114"; // verbatim capture (dig @127.0.0.1 -p 5311 nonexistent.example.com A)

// -- V5: +ttlunits, compound units (lab named, 14:38) -------------------------
const V5 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5398 mixed.example.com A +ttlunits +norecurse\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 28860\n;; flags: qr aa; QUERY: 1, ANSWER: 1, AUTHORITY: 1, ADDITIONAL: 2\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n; COOKIE: bbb0df04d2a61a6a010000006ad65580ed2cc7a9db3035a7 (good)\n;; QUESTION SECTION:\n;mixed.example.com.\t\tIN\tA\n\n;; ANSWER SECTION:\nmixed.example.com.\t1h30m\tIN\tA\t192.0.2.20\n\n;; AUTHORITY SECTION:\nexample.com.\t\t1h\tIN\tNS\tns1.example.com.\n\n;; ADDITIONAL SECTION:\nns1.example.com.\t1h\tIN\tA\t192.0.2.53\n\n;; Query time: 4 msec\n;; SERVER: 127.0.0.1#5398(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:38:08 -03 2026\n;; MSG SIZE  rcvd: 124"; // verbatim capture (dig @127.0.0.1 -p 5398 mixed.example.com A +ttlunits +norecurse)

// -- V6: +ttlunits, weeks (lab named, 14:38) ----------------------------------
const V6 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5398 long.example.com A +ttlunits +norecurse\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 15942\n;; flags: qr aa; QUERY: 1, ANSWER: 1, AUTHORITY: 1, ADDITIONAL: 2\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n; COOKIE: fae32087990006e4010000006ad655806a3fd497c3d4466c (good)\n;; QUESTION SECTION:\n;long.example.com.\t\tIN\tA\n\n;; ANSWER SECTION:\nlong.example.com.\t2w\tIN\tA\t192.0.2.30\n\n;; AUTHORITY SECTION:\nexample.com.\t\t1h\tIN\tNS\tns1.example.com.\n\n;; ADDITIONAL SECTION:\nns1.example.com.\t1h\tIN\tA\t192.0.2.53\n\n;; Query time: 4 msec\n;; SERVER: 127.0.0.1#5398(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:38:08 -03 2026\n;; MSG SIZE  rcvd: 123"; // verbatim capture (dig @127.0.0.1 -p 5398 long.example.com A +ttlunits +norecurse)

// -- V7: +ttlunits on a negative answer, days (relay, Cloudflare, 14:37:36) ---
const V7 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5311 nonexistent.invalid A +ttlunits\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 43271\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n;; QUESTION SECTION:\n;nonexistent.invalid.\t\tIN\tA\n\n;; AUTHORITY SECTION:\n.\t\t\t1d\tIN\tSOA\ta.root-servers.net. nstld.verisign-grs.com. 2026101900 1800 900 604800 86400\n\n;; Query time: 132 msec\n;; SERVER: 127.0.0.1#5311(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:36 -03 2026\n;; MSG SIZE  rcvd: 123"; // verbatim capture (dig @127.0.0.1 -p 5311 nonexistent.invalid A +ttlunits)

// -- V8: +ttlunits, minutes and seconds (relay, Cloudflare, 14:37:36) ---------
const V8 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5311 example.com SOA +ttlunits\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 47943\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n;; QUESTION SECTION:\n;example.com.\t\t\tIN\tSOA\n\n;; ANSWER SECTION:\nexample.com.\t\t12m4s\tIN\tSOA\telliott.ns.cloudflare.com. dns.cloudflare.com. 2416374680 10000 2400 604800 1800\n\n;; Query time: 112 msec\n;; SERVER: 127.0.0.1#5311(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:36 -03 2026\n;; MSG SIZE  rcvd: 102"; // verbatim capture (dig @127.0.0.1 -p 5311 example.com SOA +ttlunits)

// -- V9: +nottlid, no TTL column (relay, Cloudflare, 14:37:36) ----------------
const V9 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5311 example.com A +nottlid\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 44152\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n;; QUESTION SECTION:\n;example.com.\t\tIN\tA\n\n;; ANSWER SECTION:\nexample.com.\t\tIN\tA\t172.66.147.243\nexample.com.\t\tIN\tA\t104.20.23.154\n\n;; Query time: 124 msec\n;; SERVER: 127.0.0.1#5311(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:37 -03 2026\n;; MSG SIZE  rcvd: 72"; // verbatim capture (dig @127.0.0.1 -p 5311 example.com A +nottlid)

// -- V10: +multiline SOA in ANSWER (relay, Cloudflare, 14:37:37) --------------
const V10 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5311 example.com SOA +multiline\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 21788\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n;; QUESTION SECTION:\n;example.com.\t\tIN SOA\n\n;; ANSWER SECTION:\nexample.com.\t\t1800 IN\tSOA elliott.ns.cloudflare.com. dns.cloudflare.com. (\n\t\t\t\t2416374680 ; serial\n\t\t\t\t10000      ; refresh (2 hours 46 minutes 40 seconds)\n\t\t\t\t2400       ; retry (40 minutes)\n\t\t\t\t604800     ; expire (1 week)\n\t\t\t\t1800       ; minimum (30 minutes)\n\t\t\t\t)\n\n;; Query time: 132 msec\n;; SERVER: 127.0.0.1#5311(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:37 -03 2026\n;; MSG SIZE  rcvd: 102"; // verbatim capture (dig @127.0.0.1 -p 5311 example.com SOA +multiline)

// -- V11: +multiline SOA in AUTHORITY of an NXDOMAIN (relay, Cloudflare, 14:37:37)
const V11 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5311 nonexistent.invalid A +multiline\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 27954\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n;; QUESTION SECTION:\n;nonexistent.invalid.\tIN A\n\n;; AUTHORITY SECTION:\n.\t\t\t86400 IN SOA a.root-servers.net. nstld.verisign-grs.com. (\n\t\t\t\t2026101900 ; serial\n\t\t\t\t1800       ; refresh (30 minutes)\n\t\t\t\t900        ; retry (15 minutes)\n\t\t\t\t604800     ; expire (1 week)\n\t\t\t\t86400      ; minimum (1 day)\n\t\t\t\t)\n\n;; Query time: 116 msec\n;; SERVER: 127.0.0.1#5311(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:37 -03 2026\n;; MSG SIZE  rcvd: 123"; // verbatim capture (dig @127.0.0.1 -p 5311 nonexistent.invalid A +multiline)

// -- V12: +multiline with +ttlunits (relay, Cloudflare, 14:37:37) -------------
const V12 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5311 example.com SOA +multiline +ttlunits\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 30095\n;; flags: qr rd ra ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n;; QUESTION SECTION:\n;example.com.\t\tIN SOA\n\n;; ANSWER SECTION:\nexample.com.\t\t30m IN SOA elliott.ns.cloudflare.com. dns.cloudflare.com. (\n\t\t\t\t2416374680 ; serial\n\t\t\t\t10000      ; refresh (2 hours 46 minutes 40 seconds)\n\t\t\t\t2400       ; retry (40 minutes)\n\t\t\t\t604800     ; expire (1 week)\n\t\t\t\t1800       ; minimum (30 minutes)\n\t\t\t\t)\n\n;; Query time: 120 msec\n;; SERVER: 127.0.0.1#5311(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:37 -03 2026\n;; MSG SIZE  rcvd: 102"; // verbatim capture (dig @127.0.0.1 -p 5311 example.com SOA +multiline +ttlunits)

// -- V13: opcode 6 (DSO) answered NOTIMP, printed RESERVED6 (relay, Google, 14:37:43)
const V13 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5312 example.com A +opcode=6\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: RESERVED6, status: NOTIMP, id: 14380\n;; flags: qr rd; QUERY: 0, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0\n;; WARNING: recursion requested but not available\n\n;; WARNING: EDNS query returned status NOTIMP - retry with '+noedns'\n\n;; Query time: 96 msec\n;; SERVER: 127.0.0.1#5312(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:44 -03 2026\n;; MSG SIZE  rcvd: 12"; // verbatim capture (dig @127.0.0.1 -p 5312 example.com A +opcode=6)

// -- V14: opcode 6 answered NOTIMP by named, with an OPT record (lab named, 14:37:53)
const V14 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5398 www.example.com A +opcode=6\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: RESERVED6, status: NOTIMP, id: 36614\n;; flags: qr; QUERY: 0, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n; COOKIE: c2a959a00eb8b0fe010000006ad655717a17dcef8d78df6a (good)\n;; Query time: 0 msec\n;; SERVER: 127.0.0.1#5398(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:53 -03 2026\n;; MSG SIZE  rcvd: 51"; // verbatim capture (dig @127.0.0.1 -p 5398 www.example.com A +opcode=6)

// -- V15: RCODE 11 (DSOTYPENI), printed RESERVED11 (lab responder, 14:37:53) --
const V15 = "; <<>> DiG 9.20.29 <<>> @127.0.0.1 -p 5313 www.example.com A +tries=1\n; (1 server found)\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: RESERVED11, id: 55040\n;; flags: qr rd; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0\n;; WARNING: recursion requested but not available\n\n;; QUESTION SECTION:\n;www.example.com.\t\tIN\tA\n\n;; Query time: 0 msec\n;; SERVER: 127.0.0.1#5313(127.0.0.1) (UDP)\n;; WHEN: Mon Oct 19 14:37:53 -03 2026\n;; MSG SIZE  rcvd: 33"; // verbatim capture (dig @127.0.0.1 -p 5313 www.example.com A +tries=1)

/** The vectors. */
export const DIG_VECTORS: DigVector[] = [
  {
    id: "plain-a-noerror", // V1
    input: V1, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("digVersion", p.digVersion, "9.20.29")); // version token
      f.push(...eq("queryArgs", p.queryArgs, "@127.0.0.1 -p 5311 example.com A")); // the command's arguments
      f.push(...eq("opcode", p.header?.opcode, "QUERY")); // opcode
      f.push(...eq("status", p.header?.status, "NOERROR")); // status
      f.push(...eq("id", p.header?.id, "26265")); // message id
      f.push(...eq("flags", p.flags?.flags.join(","), "qr,rd,ra,ad")); // flags
      f.push(...eq("answerCount", p.flags?.counts.answer, 2)); // two A records
      f.push(...eq("ednsUdp", p.opt?.udp, 1232)); // Cloudflare's advertised size
      const ans = p.sections.find((s) => s.name === "ANSWER"); // the answer section
      f.push(...eq("answerRecs", ans?.records.length, 2)); // both parsed
      f.push(...eq("ansType", ans?.records[0]?.type, "A")); // type
      f.push(...eq("ansTtl", ans?.records[0]?.ttl, 214)); // TTL in seconds
      f.push(...eq("ansTtlText", ans?.records[0]?.ttlText, undefined)); // no units printed
      f.push(...eq("ansRdata0", ans?.records[0]?.rdata, "172.66.147.243")); // first address
      f.push(...eq("ansRdata1", ans?.records[1]?.rdata, "104.20.23.154")); // second address
      const q = p.sections.find((s) => s.name === "QUESTION"); // the question
      f.push(...eq("qName", q?.records[0]?.name, "example.com.")); // its name
      f.push(...eq("qTtlNull", q?.records[0]?.ttl, null)); // no TTL on a question
      f.push(...eq("footerServer", p.footer.server, "127.0.0.1#5311(127.0.0.1) (UDP)")); // the relay
      f.push(...eq("footerMsgSize", p.footer.msgSize, "72")); // message size
      f.push(...eq("noNegative", p.negative, undefined)); // not a negative answer
      f.push(...eq("warningsEmpty", p.warnings.length, 0)); // nothing to flag
      return f; // done
    },
  },
  {
    id: "nxdomain-invalid-soa", // V2
    input: V2, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("status", p.header?.status, "NXDOMAIN")); // the name does not exist
      f.push(...eq("id", p.header?.id, "26090")); // message id
      f.push(...eq("answerCount", p.flags?.counts.answer, 0)); // no answer
      f.push(...eq("authorityCount", p.flags?.counts.authority, 1)); // one SOA
      f.push(...eq("ednsUdp", p.opt?.udp, 512)); // Google's advertised size
      const q = p.sections.find((s) => s.name === "QUESTION"); // the question
      f.push(...eq("qName", q?.records[0]?.name, "nonexistent.invalid.")); // a .invalid name
      const auth = p.sections.find((s) => s.name === "AUTHORITY"); // the authority section
      f.push(...eq("authName", auth?.records[0]?.name, ".")); // the root zone answered
      f.push(...eq("authType", auth?.records[0]?.type, "SOA")); // its SOA
      f.push(...eq("authTtl", auth?.records[0]?.ttl, 86322)); // counting down in a cache
      const soa = breakdownRdata("SOA", auth?.records[0]?.rdata ?? ""); // SOA fields
      f.push(...eq("soaFieldCount", soa?.length, 7)); // seven fields
      f.push(...eq("soaSerial", soa?.[2]?.value, "2026101900")); // serial
      f.push(...eq("soaMinimum", soa?.[6]?.value, "86400s")); // MINIMUM
      f.push(...eq("negSoaTtl", p.negative?.soaTtl, 86322)); // the SOA's own TTL
      f.push(...eq("negMinimum", p.negative?.minimum, 86400)); // the MINIMUM field
      f.push(...eq("negTtl", p.negative?.ttl, 86322)); // min(86322, 86400), RFC 2308 section 5
      f.push(...eq("hasNonzeroRcode", p.warnings.includes("nonzero-rcode"), true)); // flagged
      return f; // done
    },
  },
  {
    id: "dnssec-rrsig", // V3
    input: V3, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("status", p.header?.status, "NOERROR")); // answered
      f.push(...eq("flagsHasAd", p.flags?.flags.includes("ad"), true)); // validated
      f.push(...eq("ednsFlags", p.opt?.flags, "do")); // DO set
      f.push(...eq("answerCount", p.flags?.counts.answer, 3)); // two A and one RRSIG
      const ans = p.sections.find((s) => s.name === "ANSWER"); // the answer section
      f.push(...eq("ansRecs", ans?.records.length, 3)); // all parsed
      f.push(...eq("rec3Type", ans?.records[2]?.type, "RRSIG")); // the signature
      const sig = breakdownRdata("RRSIG", ans?.records[2]?.rdata ?? ""); // RRSIG fields
      f.push(...eq("rrsigTypeCovered", sig?.[0]?.value, "A")); // covers the A RRset
      f.push(...eq("rrsigOrigTtl", sig?.[3]?.value, "300s")); // original TTL
      f.push(...eq("rrsigKeyTag", sig?.[6]?.value, "34505")); // key tag
      f.push(...eq("rrsigSigner", sig?.[7]?.value, "example.com.")); // signer
      // ad IS set here, so the "requested-not-validated" warning must NOT fire
      f.push(...eq("noValidationWarning", p.warnings.includes("dnssec-requested-not-validated"), false));
      return f; // done
    },
  },
  {
    id: "nodata-compact-denial", // V4
    input: V4, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("status", p.header?.status, "NOERROR")); // not NXDOMAIN
      f.push(...eq("answerCount", p.flags?.counts.answer, 0)); // no data
      const q = p.sections.find((s) => s.name === "QUESTION"); // the question
      f.push(...eq("qName", q?.records[0]?.name, "nonexistent.example.com.")); // a name that does not exist
      const auth = p.sections.find((s) => s.name === "AUTHORITY"); // the authority section
      f.push(...eq("authOwner", auth?.records[0]?.name, "example.com.")); // the zone's SOA
      f.push(...eq("negTtl", p.negative?.ttl, 1800)); // min(1800, 1800)
      f.push(...eq("hasNodata", p.warnings.includes("noerror-nodata"), true)); // NODATA flagged
      f.push(...eq("noNonzero", p.warnings.includes("nonzero-rcode"), false)); // NOERROR
      return f; // done
    },
  },
  {
    id: "ttlunits-compound", // V5
    input: V5, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      const ans = p.sections.find((s) => s.name === "ANSWER"); // the answer section
      f.push(...eq("ansRecs", ans?.records.length, 1)); // parsed
      f.push(...eq("ansTtl", ans?.records[0]?.ttl, 5400)); // 1h30m = 3600 + 1800
      f.push(...eq("ansTtlText", ans?.records[0]?.ttlText, "1h30m")); // as printed
      f.push(...eq("ansClass", ans?.records[0]?.class, "IN")); // class
      f.push(...eq("ansRdata", ans?.records[0]?.rdata, "192.0.2.20")); // lab address
      f.push(...eq("flagsHasAa", p.flags?.flags.includes("aa"), true)); // authoritative lab server
      f.push(...eq("hasUnits", p.warnings.includes("ttl-units"), true)); // units flagged
      return f; // done
    },
  },
  {
    id: "ttlunits-weeks", // V6
    input: V6, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      const ans = p.sections.find((s) => s.name === "ANSWER"); // the answer section
      f.push(...eq("ansTtl", ans?.records[0]?.ttl, 1209600)); // 2w = 2 x 604800
      f.push(...eq("ansTtlText", ans?.records[0]?.ttlText, "2w")); // as printed
      f.push(...eq("ansRdata", ans?.records[0]?.rdata, "192.0.2.30")); // lab address
      return f; // done
    },
  },
  {
    id: "ttlunits-days-negative", // V7
    input: V7, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("status", p.header?.status, "NXDOMAIN")); // negative
      const auth = p.sections.find((s) => s.name === "AUTHORITY"); // the authority section
      f.push(...eq("authTtl", auth?.records[0]?.ttl, 86400)); // 1d
      f.push(...eq("authTtlText", auth?.records[0]?.ttlText, "1d")); // as printed
      f.push(...eq("authType", auth?.records[0]?.type, "SOA")); // the SOA
      f.push(...eq("negTtl", p.negative?.ttl, 86400)); // min(86400, 86400)
      return f; // done
    },
  },
  {
    id: "ttlunits-minutes-seconds", // V8
    input: V8, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      const ans = p.sections.find((s) => s.name === "ANSWER"); // the answer section
      f.push(...eq("ansTtl", ans?.records[0]?.ttl, 724)); // 12m4s = 720 + 4
      f.push(...eq("ansTtlText", ans?.records[0]?.ttlText, "12m4s")); // as printed
      const soa = breakdownRdata("SOA", ans?.records[0]?.rdata ?? ""); // SOA fields
      f.push(...eq("soaMname", soa?.[0]?.value, "elliott.ns.cloudflare.com.")); // MNAME
      f.push(...eq("soaMinimum", soa?.[6]?.value, "1800s")); // MINIMUM
      return f; // done
    },
  },
  {
    id: "nottlid", // V9
    input: V9, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      const ans = p.sections.find((s) => s.name === "ANSWER"); // the answer section
      f.push(...eq("ansRecs", ans?.records.length, 2)); // both records kept
      f.push(...eq("ansTtl", ans?.records[0]?.ttl, null)); // no TTL printed
      f.push(...eq("ansClass", ans?.records[0]?.class, "IN")); // class read from the right column
      f.push(...eq("ansType", ans?.records[0]?.type, "A")); // type read from the right column
      f.push(...eq("ansRdata", ans?.records[0]?.rdata, "172.66.147.243")); // data
      f.push(...eq("hasAbsent", p.warnings.includes("ttl-absent"), true)); // flagged
      return f; // done
    },
  },
  {
    id: "multiline-soa-answer", // V10
    input: V10, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      const ans = p.sections.find((s) => s.name === "ANSWER"); // the answer section
      f.push(...eq("ansRecs", ans?.records.length, 1)); // one joined record
      f.push(...eq("ansTtl", ans?.records[0]?.ttl, 1800)); // TTL
      f.push(...eq("ansType", ans?.records[0]?.type, "SOA")); // type
      f.push(...eq("ansRdata", ans?.records[0]?.rdata, "elliott.ns.cloudflare.com. dns.cloudflare.com. 2416374680 10000 2400 604800 1800")); // joined, comments dropped
      const soa = breakdownRdata("SOA", ans?.records[0]?.rdata ?? ""); // SOA fields
      f.push(...eq("soaSerial", soa?.[2]?.value, "2416374680")); // serial
      f.push(...eq("soaRefresh", soa?.[3]?.value, "10000s")); // refresh
      f.push(...eq("soaMinimum", soa?.[6]?.value, "1800s")); // minimum
      f.push(...eq("footerMsgSize", p.footer.msgSize, "102")); // parsing resumed after the record
      return f; // done
    },
  },
  {
    id: "multiline-soa-nxdomain", // V11
    input: V11, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      const auth = p.sections.find((s) => s.name === "AUTHORITY"); // the authority section
      f.push(...eq("authRecs", auth?.records.length, 1)); // one joined record
      f.push(...eq("authRdata", auth?.records[0]?.rdata, "a.root-servers.net. nstld.verisign-grs.com. 2026101900 1800 900 604800 86400")); // joined
      f.push(...eq("negTtl", p.negative?.ttl, 86400)); // min(86400, 86400)
      return f; // done
    },
  },
  {
    id: "multiline-ttlunits", // V12
    input: V12, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      const ans = p.sections.find((s) => s.name === "ANSWER"); // the answer section
      f.push(...eq("ansTtl", ans?.records[0]?.ttl, 1800)); // 30m
      f.push(...eq("ansTtlText", ans?.records[0]?.ttlText, "30m")); // as printed
      f.push(...eq("ansRdata", ans?.records[0]?.rdata, "elliott.ns.cloudflare.com. dns.cloudflare.com. 2416374680 10000 2400 604800 1800")); // joined
      return f; // done
    },
  },
  {
    id: "opcode-reserved6-dso", // V13
    input: V13, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("hadHeader", p.hadHeader, true)); // recognised as dig output
      f.push(...eq("opcode", p.header?.opcode, "RESERVED6")); // as dig printed it
      f.push(...eq("opcodeName", p.header?.opcodeName, "DSO")); // the IANA name (RFC 8490)
      f.push(...eq("status", p.header?.status, "NOTIMP")); // not implemented
      f.push(...eq("questionCount", p.flags?.counts.question, 0)); // the reply carried no question
      f.push(...eq("sections", p.sections.length, 0)); // no sections
      f.push(...eq("noOpt", p.opt, undefined)); // no OPT record
      f.push(...eq("hasNonzeroRcode", p.warnings.includes("nonzero-rcode"), true)); // flagged
      return f; // done
    },
  },
  {
    id: "opcode-reserved6-named", // V14
    input: V14, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("opcode", p.header?.opcode, "RESERVED6")); // as dig printed it
      f.push(...eq("opcodeName", p.header?.opcodeName, "DSO")); // the IANA name
      f.push(...eq("status", p.header?.status, "NOTIMP")); // not implemented
      f.push(...eq("ednsUdp", p.opt?.udp, 1232)); // named's size
      f.push(...eq("cookie", p.opt?.extra[0]?.startsWith("COOKIE: "), true)); // the cookie line kept
      f.push(...eq("footerQueryTime", p.footer.queryTime, "0 msec")); // footer read
      return f; // done
    },
  },
  {
    id: "rcode-reserved11-dsotypeni", // V15
    input: V15, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("hadHeader", p.hadHeader, true)); // recognised as dig output
      f.push(...eq("opcode", p.header?.opcode, "QUERY")); // a normal query
      f.push(...eq("status", p.header?.status, "RESERVED11")); // as dig printed it
      f.push(...eq("statusName", p.header?.statusName, "DSOTYPENI")); // the IANA name (RFC 8490)
      f.push(...eq("opcodeName", p.header?.opcodeName, undefined)); // QUERY needs no name
      const q = p.sections.find((s) => s.name === "QUESTION"); // the question
      f.push(...eq("qName", q?.records[0]?.name, "www.example.com.")); // echoed question
      f.push(...eq("noNegative", p.negative, undefined)); // not NXDOMAIN or NODATA
      return f; // done
    },
  },
];

/** Run every vector; the build's run-golden-vectors reads this shape. */
export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  let passed = 0; // passing vectors
  let failed = 0; // failing vectors
  const failures: string[] = []; // messages
  for (const v of DIG_VECTORS) {
    const msgs = v.check(parseDig(v.input)); // parse and check
    if (msgs.length === 0) passed++; // a pass
    else {
      failed++; // a failure
      failures.push(`[${v.id}] ${msgs.join(" | ")}`); // with detail
    }
  }
  return { passed, failed, failures }; // the report
}
