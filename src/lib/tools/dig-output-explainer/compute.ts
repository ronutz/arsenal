// ============================================================================
// src/lib/tools/dig-output-explainer/compute.ts
// ----------------------------------------------------------------------------
// Deterministic parser + reference for the dig-output-explainer tool.
//
// Given the text `dig` prints, this reconstructs the message the way you need
// to read it: the header (opcode / status / id), the flags line and its
// section counts, the EDNS OPT pseudo-section, the four sections
// (QUESTION / ANSWER / AUTHORITY / ADDITIONAL) with every resource record
// broken into name / TTL / class / type / rdata, and the trailing stats
// (query time, server, when, message size).
//
// Output shapes handled (each pinned by a golden vector from real dig 9.20.29
// output captured 2026-10-19, see golden-vectors.ts):
//   - the default layout, TTL in seconds;
//   - +ttlunits, TTLs printed as 1h30m, 1d, 2w, 4m16s (the dig manual: units
//     s, m, h, d and w); converted to seconds, the printed form kept too;
//   - +nottlid, no TTL column at all (the record has ttl null);
//   - +multiline, records whose rdata is wrapped in "( ... )" over several
//     lines with "; comment" annotations; the lines are joined and the
//     comments dropped, so the rdata reads as on one line;
//   - opcode RESERVED6 and status RESERVED11: dig 9.20.29 has no name for
//     opcode 6 or RCODE 11 (bin/dig/dig.c opcodetext[], lib/dns/rcode.c), and
//     IANA assigned them to DNS Stateful Operations, DSO, and DSOTYPENI
//     (RFC 8490, sections 10.1 and 10.2); both names are recovered.
//
// It parses TEXT ONLY. It never resolves anything and contacts nothing
// (zero egress, D-49). Time and randomness are never read here; the engine is
// pure so the same paste always yields the same parse (golden-vector tested).
// Every pattern below is anchored or literal-led with no nested quantifiers,
// and multiline records are joined over at most MAX_CONTINUATION lines, so the
// work is linear in the size of the paste (ReDoS-safe, bounded).
// ============================================================================

/** The seven header flags dig can print on the `;; flags:` line. */
export type DigFlag = "qr" | "aa" | "tc" | "rd" | "ra" | "ad" | "cd";

/** The `;; ->>HEADER<<-` line: message-level metadata. */
export interface DigHeader {
  opcode: string; // QUERY, NOTIFY, UPDATE, RESERVED6, ... exactly as dig printed it
  status: string; // NOERROR, NXDOMAIN, SERVFAIL, RESERVED11, ... exactly as dig printed it
  id: string; // the 16-bit transaction id, as printed
  opcodeName?: string; // the IANA name when dig prints a placeholder (RESERVED6 -> DSO)
  statusName?: string; // the IANA name when dig prints a placeholder (RESERVED11 -> DSOTYPENI)
}

/** The `;; flags:` line: which flags are set plus the four section counts. */
export interface DigFlags {
  flags: DigFlag[]; // the flags dig printed, in dig's fixed order
  counts: { question: number; answer: number; authority: number; additional: number }; // the four section counts
}

/** The EDNS OPT pseudo-section (present only when EDNS is in play). */
export interface DigOpt {
  version: string; // EDNS version, usually "0"
  flags: string; // e.g. "do" (DNSSEC OK) or empty
  udp: number | null; // advertised UDP payload size
  extra: string[]; // any further OPT lines (COOKIE, NSID, EDE, ...), captured verbatim
}

/** A single resource record (or a question, which has no TTL / rdata). */
export interface DigRecord {
  name: string; // the owner name, as printed
  ttl: number | null; // TTL in seconds; null for questions and for records printed with +nottlid
  ttlText?: string; // the TTL as printed, kept only when dig printed it in units (+ttlunits)
  class: string; // IN, CH, HS, ...; empty when dig printed no class (+noclass)
  type: string; // A, AAAA, CNAME, MX, SOA, RRSIG, ...
  rdata: string; // the record data on one line (multiline records joined); empty for questions
  isQuestion: boolean; // true for a QUESTION section entry
}

/** The four section names dig prints. */
export type SectionName = "QUESTION" | "ANSWER" | "AUTHORITY" | "ADDITIONAL";

/** One section with its records, in the order dig printed them. */
export interface DigSection {
  name: SectionName; // which section
  records: DigRecord[]; // its records
}

/** The trailing `;;` statistics block. */
export interface DigFooter {
  queryTime?: string; // ";; Query time:" value
  server?: string; // ";; SERVER:" value
  when?: string; // ";; WHEN:" value
  msgSize?: string; // ";; MSG SIZE  rcvd:" value
}

/**
 * The negative-caching TTL of a negative answer (NXDOMAIN, or NOERROR with an
 * empty ANSWER section), per RFC 2308 section 5: the authoritative server sets
 * the TTL of the SOA it puts in the AUTHORITY section to "the minimum of the
 * SOA.MINIMUM field and SOA's TTL", and a cache counts it down from there.
 */
export interface DigNegativeTtl {
  owner: string; // the SOA's owner name (the zone apex that answered)
  soaTtl: number; // the TTL printed on the SOA line, in seconds
  minimum: number; // the SOA's MINIMUM field, in seconds
  ttl: number; // the smaller of the two: how long the negative answer may be cached
}

/** The whole parse. */
export interface DigParse {
  versionLine?: string; // the `; <<>> DiG ... <<>>` line, verbatim
  digVersion?: string; // "9.20.29" extracted from it
  queryArgs?: string; // the args after `<<>>` (e.g. "example.com A +dnssec")
  header?: DigHeader; // the HEADER line
  flags?: DigFlags; // the flags line
  opt?: DigOpt; // the OPT pseudo-section
  sections: DigSection[]; // the sections, in order
  footer: DigFooter; // the statistics block
  negative?: DigNegativeTtl; // the RFC 2308 negative-caching TTL, for a negative answer with an SOA
  warnings: string[]; // STABLE codes (UI localizes them), never English prose
  hadHeader: boolean; // false => almost certainly not dig output
}

// ---------------------------------------------------------------------------
// Reference tables (concise; the UI turns these into the teaching panels).
// ---------------------------------------------------------------------------

/** RCODE (status) meanings: RFC 1035 section 4.1.1, RFC 2136, RFC 2308, RFC 8490. */
export const RCODE_MEANINGS: Record<string, string> = {
  NOERROR: "No error. The query was answered normally.", // RCODE 0
  FORMERR: "Format error. The server could not interpret the query.", // RCODE 1
  SERVFAIL: "Server failure. The server could not process the query (often a broken delegation, a DNSSEC validation failure, or an upstream timeout).", // RCODE 2
  NXDOMAIN: "Non-existent domain. The queried name does not exist. The negative answer is authoritative when the aa flag is set. A resolver may cache it for the TTL of the SOA record in the AUTHORITY section, which the authoritative server sets to the minimum of the SOA record's own TTL and its MINIMUM field (RFC 2308, section 5).", // RCODE 3, TTL text per RFC 2308 section 5
  NOTIMP: "Not implemented. The server does not support the requested query type or opcode.", // RCODE 4
  REFUSED: "Refused. The server refused to answer, usually for policy reasons (access control, recursion disabled).", // RCODE 5
  YXDOMAIN: "Name exists when it should not (used by dynamic UPDATE).", // RCODE 6
  YXRRSET: "RR set exists when it should not (dynamic UPDATE).", // RCODE 7
  NXRRSET: "RR set that should exist does not (dynamic UPDATE).", // RCODE 8
  NOTAUTH: "Server not authoritative for the zone, or request not authorized.", // RCODE 9
  NOTZONE: "Name not contained in the zone (dynamic UPDATE).", // RCODE 10
  RESERVED11: "RCODE 11, DSOTYPENI (DSO-TYPE Not Implemented, RFC 8490): the receiver implements DNS Stateful Operations but not the DSO-TYPE of the request's Primary TLV. dig 9.20 has no name for RCODE 11 and prints RESERVED11.", // RCODE 11, RFC 8490 section 10.2
};

/** Opcode meanings: RFC 1035, RFC 1996 (NOTIFY), RFC 2136 (UPDATE), RFC 8490 (DSO). */
export const OPCODE_MEANINGS: Record<string, string> = {
  QUERY: "A standard query (the normal case).", // opcode 0
  IQUERY: "Inverse query (obsolete).", // opcode 1
  STATUS: "Server status request.", // opcode 2
  NOTIFY: "Zone-change notification from a primary to its secondaries.", // opcode 4
  UPDATE: "Dynamic DNS update (RFC 2136).", // opcode 5
  RESERVED6: "Opcode 6, DNS Stateful Operations (DSO, RFC 8490): messages for long-lived sessions over TCP or TLS. dig 9.20 has no name for opcode 6 and prints RESERVED6; a server that does not implement DSO answers NOTIMP.", // opcode 6, RFC 8490 section 10.1
};

/** The IANA names for the opcodes dig 9.20 prints as placeholders (RFC 8490, section 10.1). */
export const OPCODE_IANA_NAMES: Record<string, string> = {
  RESERVED6: "DSO", // DNS Stateful Operations
};

/** The IANA names for the RCODEs dig 9.20 prints as placeholders (RFC 8490, section 10.2). */
export const RCODE_IANA_NAMES: Record<string, string> = {
  RESERVED11: "DSOTYPENI", // DSO-TYPE Not Implemented
};

/** Flag meanings: RFC 1035 section 4.1.1, RFC 4035 (ad/cd). */
export const FLAG_MEANINGS: Record<DigFlag, string> = {
  qr: "Query Response. Set on a response (as opposed to a query).", // QR bit
  aa: "Authoritative Answer. The answering server is authoritative for the name; the data comes from the zone itself, not a cache.", // AA bit
  tc: "TruNCated. The message did not fit and was cut short. dig will normally retry over TCP; if you see this, the UDP answer is incomplete.", // TC bit
  rd: "Recursion Desired. The client asked the server to resolve the name fully on its behalf.", // RD bit
  ra: "Recursion Available. The server is willing and able to recurse.", // RA bit
  ad: "Authentic Data. The resolver validated the answer with DNSSEC and it checked out.", // AD bit
  cd: "Checking Disabled. The client asked the resolver to skip DNSSEC validation.", // CD bit
};

/** RR type meanings: the common ones plus the DNSSEC set. */
export const RRTYPE_MEANINGS: Record<string, string> = {
  A: "IPv4 address (RFC 1035).", // type 1
  AAAA: "IPv6 address (RFC 3596).", // type 28
  CNAME: "Canonical name - an alias pointing this name at another name (RFC 1035).", // type 5
  MX: "Mail exchanger - where mail for the domain should be delivered, with a preference value (RFC 1035).", // type 15
  NS: "Name server - a server authoritative for the zone (RFC 1035).", // type 2
  SOA: "Start of Authority - the zone's apex record carrying the primary server, admin mailbox, serial, and the refresh / retry / expire / minimum timers (RFC 1035, RFC 2308).", // type 6
  TXT: "Free-form text - used for SPF, DKIM, domain verification, and more (RFC 1035).", // type 16
  PTR: "Pointer - the reverse mapping from an address back to a name (RFC 1035).", // type 12
  SRV: "Service locator - host and port for a named service, with priority and weight (RFC 2782).", // type 33
  CAA: "Certification Authority Authorization - which CAs may issue certificates for the domain (RFC 8659).", // type 257
  NAPTR: "Naming Authority Pointer - regex-based rewriting, used by ENUM / SIP (RFC 3403).", // type 35
  SPF: "Legacy SPF record type (deprecated; SPF now lives in TXT).", // type 99
  HTTPS: "HTTPS service binding - connection parameters (ALPN, port, IP hints) for HTTP origins (RFC 9460).", // type 65
  SVCB: "General service binding, the parent of HTTPS (RFC 9460).", // type 64
  TLSA: "DANE - ties a certificate or public key to a name via DNSSEC (RFC 6698).", // type 52
  DNSKEY: "DNSSEC public key used to verify signatures in the zone (RFC 4034).", // type 48
  RRSIG: "DNSSEC signature over an RRset, with the covered type, algorithm, key tag, and validity window (RFC 4034).", // type 46
  DS: "Delegation Signer - a hash of a child zone's DNSKEY, published in the parent to build the chain of trust (RFC 4034).", // type 43
  NSEC: "Authenticated denial of existence - proves a name or type does not exist by pointing to the next name (RFC 4034).", // type 47
  NSEC3: "Hashed authenticated denial of existence - like NSEC but with hashed names to resist zone walking (RFC 5155).", // type 50
  NSEC3PARAM: "Parameters (hash, iterations, salt) for the zone's NSEC3 records (RFC 5155).", // type 51
  CDS: "Child copy of the DS the parent should publish (RFC 7344).", // type 59
  CDNSKEY: "Child copy of the DNSKEY for automated DS maintenance (RFC 7344).", // type 60
};

// ---------------------------------------------------------------------------
// Structured rdata breakdowns for the record types where the fields matter.
// Each returns an ordered list of { label, value } pairs, or null if the
// rdata does not match the expected shape (we then just show it raw).
// ---------------------------------------------------------------------------

/** One labelled rdata field. */
export interface RdataField {
  label: string; // the English label (FIELD_LABELS_PT translates it)
  value: string; // the value as printed
}

/** Split rdata into whitespace tokens (multiline rdata is already joined to one line). */
function tokens(rdata: string): string[] {
  // Trim, split on whitespace runs, drop empties.
  return rdata.trim().split(/\s+/).filter(Boolean);
}

/** Break the rdata of a known type into labelled fields; null when the shape does not match. */
export function breakdownRdata(type: string, rdata: string): RdataField[] | null {
  // Tokenise once.
  const t = tokens(rdata);
  // Dispatch on the record type.
  switch (type) {
    case "SOA": {
      // mname rname serial refresh retry expire minimum
      if (t.length < 7) return null; // not an SOA shape
      return [
        { label: "Primary server (MNAME)", value: t[0] }, // MNAME
        { label: "Admin mailbox (RNAME)", value: t[1] }, // RNAME
        { label: "Serial", value: t[2] }, // SERIAL
        { label: "Refresh", value: `${t[3]}s` }, // REFRESH
        { label: "Retry", value: `${t[4]}s` }, // RETRY
        { label: "Expire", value: `${t[5]}s` }, // EXPIRE
        { label: "Minimum / negative-cache TTL", value: `${t[6]}s` }, // MINIMUM (RFC 2308 section 4)
      ];
    }
    case "MX": {
      // preference exchange
      if (t.length < 2) return null; // not an MX shape
      return [
        { label: "Preference", value: t[0] }, // PREFERENCE
        { label: "Mail exchanger", value: t.slice(1).join(" ") }, // EXCHANGE
      ];
    }
    case "SRV": {
      // priority weight port target
      if (t.length < 4) return null; // not an SRV shape
      return [
        { label: "Priority", value: t[0] }, // priority
        { label: "Weight", value: t[1] }, // weight
        { label: "Port", value: t[2] }, // port
        { label: "Target", value: t.slice(3).join(" ") }, // target
      ];
    }
    case "CAA": {
      // flags tag value
      if (t.length < 3) return null; // not a CAA shape
      return [
        { label: "Flags", value: t[0] }, // flags
        { label: "Tag", value: t[1] }, // tag
        { label: "Value", value: t.slice(2).join(" ") }, // value
      ];
    }
    case "RRSIG": {
      // type-covered algo labels orig-ttl expiration inception keytag signer sig...
      if (t.length < 9) return null; // not an RRSIG shape
      return [
        { label: "Type covered", value: t[0] }, // type covered
        { label: "Algorithm", value: t[1] }, // algorithm
        { label: "Labels", value: t[2] }, // labels
        { label: "Original TTL", value: `${t[3]}s` }, // original TTL
        { label: "Signature expiration", value: t[4] }, // expiration
        { label: "Signature inception", value: t[5] }, // inception
        { label: "Key tag", value: t[6] }, // key tag
        { label: "Signer's name", value: t[7] }, // signer
      ];
    }
    case "DNSKEY":
    case "CDNSKEY": {
      // flags protocol algorithm key...
      if (t.length < 4) return null; // not a DNSKEY shape
      return [
        { label: "Flags", value: t[0] }, // flags
        { label: "Protocol", value: t[1] }, // protocol
        { label: "Algorithm", value: t[2] }, // algorithm
        { label: "Public key", value: `${t.slice(3).join("").slice(0, 24)}… (${t.slice(3).join("").length} chars)` }, // key, abbreviated
      ];
    }
    case "DS":
    case "CDS": {
      // keytag algorithm digesttype digest...
      if (t.length < 4) return null; // not a DS shape
      return [
        { label: "Key tag", value: t[0] }, // key tag
        { label: "Algorithm", value: t[1] }, // algorithm
        { label: "Digest type", value: t[2] }, // digest type
        { label: "Digest", value: `${t.slice(3).join("").slice(0, 24)}…` }, // digest, abbreviated
      ];
    }
    default:
      return null; // no breakdown for this type
  }
}

// ---------------------------------------------------------------------------
// TTL and class tokens.
// ---------------------------------------------------------------------------

/** Seconds per TTL unit letter, as the dig manual lists them for +ttlunits (s, m, h, d, w). */
const TTL_UNIT_SECONDS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };

/** The largest TTL a DNS record can carry (RFC 2181 section 8: an unsigned 32-bit value). */
const TTL_MAX = 4294967295;

/**
 * Read a TTL token: plain seconds ("3600") or dig's +ttlunits form ("1h30m",
 * "1d", "2w", "4m16s"). Returns the value in seconds and whether units were
 * used, or null when the token is not a TTL. A linear scan, no regex.
 */
export function parseTtlToken(tok: string): { seconds: number; units: boolean } | null {
  // An empty token or an absurdly long one is not a TTL.
  if (tok.length === 0 || tok.length > 32) return null;
  let total = 0; // running total in seconds
  let digits = ""; // digits of the current group
  let sawUnit = false; // whether any unit letter appeared
  // Walk the token one character at a time.
  for (const ch of tok) {
    if (ch >= "0" && ch <= "9") {
      digits += ch; // accumulate a digit
      continue; // next character
    }
    const unit = TTL_UNIT_SECONDS[ch.toLowerCase()]; // a unit letter?
    if (unit === undefined || digits === "") return null; // neither digit nor a unit after digits: not a TTL
    total += Number.parseInt(digits, 10) * unit; // add this group
    digits = ""; // start the next group
    sawUnit = true; // units were used
  }
  // Trailing digits: plain seconds when no unit came before, otherwise malformed ("1h30").
  if (digits !== "") {
    if (sawUnit) return null; // a units token must end with a unit letter
    total = Number.parseInt(digits, 10); // plain seconds
  }
  // The result must be a finite TTL in range.
  if (!Number.isFinite(total) || total < 0 || total > TTL_MAX) return null;
  return { seconds: total, units: sawUnit }; // done
}

/** The class mnemonics dig can print (RFC 1035 section 3.2.4, RFC 2136 NONE/ANY, RFC 3597 CLASSnn). */
function isClassToken(tok: string): boolean {
  // The named classes.
  if (tok === "IN" || tok === "CH" || tok === "HS" || tok === "CS" || tok === "NONE" || tok === "ANY") return true;
  // The generic form CLASSnn: "CLASS" then one to five digits.
  if (tok.startsWith("CLASS") && tok.length > 5 && tok.length <= 10) {
    // Every remaining character must be a digit.
    for (const ch of tok.slice(5)) if (ch < "0" || ch > "9") return false;
    return true; // CLASSnn
  }
  return false; // not a class
}

/** A plausible record type mnemonic: an uppercase letter, then uppercase letters, digits or hyphens (TYPEnn included). */
function isTypeToken(tok: string): boolean {
  // Bounded length: the longest IANA mnemonic is short.
  if (tok.length === 0 || tok.length > 16) return false;
  // First character an uppercase letter.
  if (tok[0] < "A" || tok[0] > "Z") return false;
  // The rest: uppercase letters, digits, hyphen.
  for (const ch of tok) if (!((ch >= "A" && ch <= "Z") || (ch >= "0" && ch <= "9") || ch === "-")) return false;
  return true; // looks like a type
}

// ---------------------------------------------------------------------------
// Multiline (+multiline) record joining.
// ---------------------------------------------------------------------------

/** The most continuation lines one multiline record may take before it is closed by force (bounds the work). */
const MAX_CONTINUATION = 64;

/**
 * Strip a "; comment" from one line of a record, ignoring semicolons inside
 * double-quoted strings (TXT data) and after a backslash escape. Also reports
 * the net count of "(" and ")" outside quotes, so the caller knows whether a
 * multiline record is still open. A single linear pass.
 */
function stripComment(line: string): { text: string; parens: number } {
  let inQuote = false; // inside a "..." string
  let escaped = false; // the previous character was a backslash
  let parens = 0; // "(" minus ")" outside quotes
  let out = ""; // the text kept
  // Walk the characters.
  for (const ch of line) {
    if (escaped) {
      out += ch; // an escaped character is data
      escaped = false; // escape consumed
      continue; // next
    }
    if (ch === "\\") {
      out += ch; // keep the backslash
      escaped = true; // the next character is escaped
      continue; // next
    }
    if (ch === '"') {
      inQuote = !inQuote; // toggle the string state
      out += ch; // keep the quote
      continue; // next
    }
    if (!inQuote && ch === ";") break; // a comment starts: drop the rest of the line
    if (!inQuote && ch === "(") {
      parens += 1; // a group opens
      continue; // the parenthesis itself is presentation, not data
    }
    if (!inQuote && ch === ")") {
      parens -= 1; // a group closes
      continue; // the parenthesis itself is presentation, not data
    }
    out += ch; // ordinary data
  }
  return { text: out, parens }; // the kept text and the paren balance
}

// ---------------------------------------------------------------------------
// The parser.
// ---------------------------------------------------------------------------

/** The section header lines dig prints, mapped to their names. */
const SECTION_HEADERS: Record<string, SectionName> = {
  ";; QUESTION SECTION:": "QUESTION", // question
  ";; ANSWER SECTION:": "ANSWER", // answer
  ";; AUTHORITY SECTION:": "AUTHORITY", // authority
  ";; ADDITIONAL SECTION:": "ADDITIONAL", // additional
};

/**
 * Parse one record line (already joined if it was multiline):
 *   name [TTL] [CLASS] TYPE rdata...
 * The TTL is absent with +nottlid and may carry units with +ttlunits; the
 * class is absent with +noclass. Question lines start with ';' and have no
 * TTL or rdata.
 */
function parseRecord(line: string, isQuestion: boolean): DigRecord | null {
  if (isQuestion) {
    // Question lines look like: ;name.  IN  A   (leading ';', no TTL/rdata)
    const body = line.replace(/^;/, "").trim(); // drop the leading ';'
    const parts = body.split(/\s+/); // name, class, type
    if (parts.length < 3) return null; // not a question line
    return { name: parts[0], ttl: null, class: parts[1], type: parts[2], rdata: "", isQuestion: true }; // the question
  }
  const parts = line.trim().split(/\s+/); // whitespace tokens
  if (parts.length < 3) return null; // at least name, type and one rdata token
  let i = 1; // the token after the owner name
  let ttl: number | null = null; // no TTL unless one is read
  let ttlText: string | undefined; // the printed TTL, kept when units were used
  const t = parseTtlToken(parts[i]); // is the second token a TTL?
  if (t) {
    ttl = t.seconds; // the TTL in seconds
    if (t.units) ttlText = parts[i]; // keep "1h30m" as printed
    i += 1; // move past it
  }
  let klass = ""; // no class unless one is read
  if (i < parts.length && isClassToken(parts[i])) {
    klass = parts[i]; // the class
    i += 1; // move past it
  }
  if (i >= parts.length || !isTypeToken(parts[i])) return null; // a type must follow
  const type = parts[i]; // the type
  i += 1; // move past it
  if (i >= parts.length) return null; // a record line carries rdata
  if (ttl === null && klass === "") return null; // neither a TTL nor a class: too loose to call a record
  const rec: DigRecord = { name: parts[0], ttl, class: klass, type, rdata: parts.slice(i).join(" "), isQuestion: false }; // the record
  if (ttlText !== undefined) rec.ttlText = ttlText; // the printed units form, only when present
  return rec; // done
}

/** Parse the text dig printed. Pure and deterministic. */
export function parseDig(input: string): DigParse {
  const lines = input.replace(/\r\n?/g, "\n").split("\n"); // normalise line endings, then split
  const out: DigParse = { sections: [], footer: {}, warnings: [], hadHeader: false }; // the result being built
  let current: DigSection | null = null; // the section whose records are being read
  let pending: { text: string; depth: number; lines: number } | null = null; // an open multiline record

  // Close an open multiline record: parse the joined text into the current section.
  const flushPending = () => {
    if (pending && current) {
      const rec = parseRecord(pending.text, current.name === "QUESTION"); // parse the joined line
      if (rec) current.records.push(rec); // keep it when it parses
    }
    pending = null; // nothing open any more
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, ""); // trailing whitespace off

    // -- inside a multiline record: keep joining until the parentheses balance --
    if (pending) {
      const { text, parens } = stripComment(line); // comment off, count parens
      pending.text += " " + text.trim(); // join with one space
      pending.depth += parens; // update the balance
      pending.lines += 1; // count the continuation
      if (pending.depth <= 0 || pending.lines >= MAX_CONTINUATION) flushPending(); // closed, or bounded out
      continue; // this line was part of the record
    }

    if (line.trim() === "") {
      current = null; // a blank line ends the current section body
      continue; // next line
    }

    // -- version line: ; <<>> DiG 9.x <<>> example.com A --
    const ver = line.match(/^;\s*<<>>\s*DiG\s+([^\s]+)\s*<<>>\s*(.*)$/);
    if (ver) {
      out.versionLine = line; // verbatim
      out.digVersion = ver[1]; // the version token
      out.queryArgs = ver[2].trim(); // the arguments
      current = null; // not in a section
      continue; // next line
    }

    // -- header line; opcode and status may contain digits (RESERVED6, RESERVED11) --
    const hdr = line.match(/->>HEADER<<-\s*opcode:\s*([A-Za-z0-9?]+),\s*status:\s*([A-Za-z0-9?]+),\s*id:\s*(\d+)/i);
    if (hdr) {
      const opcode = hdr[1].toUpperCase(); // as printed, upper-cased
      const status = hdr[2].toUpperCase(); // as printed, upper-cased
      out.header = { opcode, status, id: hdr[3] }; // the header
      if (OPCODE_IANA_NAMES[opcode]) out.header.opcodeName = OPCODE_IANA_NAMES[opcode]; // RESERVED6 -> DSO
      if (RCODE_IANA_NAMES[status]) out.header.statusName = RCODE_IANA_NAMES[status]; // RESERVED11 -> DSOTYPENI
      out.hadHeader = true; // this is dig output
      current = null; // not in a section
      continue; // next line
    }

    // -- flags line: ;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1 --
    const flg = line.match(/^;;\s*flags:\s*([a-z ]*);\s*QUERY:\s*(\d+),\s*ANSWER:\s*(\d+),\s*AUTHORITY:\s*(\d+),\s*ADDITIONAL:\s*(\d+)/i);
    if (flg) {
      const set = flg[1].trim().split(/\s+/).filter(Boolean) as DigFlag[]; // the flags
      out.flags = {
        flags: set, // in dig's order
        counts: {
          question: Number.parseInt(flg[2], 10), // QUERY count
          answer: Number.parseInt(flg[3], 10), // ANSWER count
          authority: Number.parseInt(flg[4], 10), // AUTHORITY count
          additional: Number.parseInt(flg[5], 10), // ADDITIONAL count
        },
      };
      current = null; // not in a section
      continue; // next line
    }

    // -- EDNS OPT pseudosection --
    if (/^;;\s*OPT PSEUDOSECTION:/i.test(line)) {
      out.opt = out.opt ?? { version: "", flags: "", udp: null, extra: [] }; // open the OPT block
      current = null; // not in a record section
      continue; // next line
    }
    const edns = line.match(/^;\s*EDNS:\s*version:\s*(\d+),\s*flags:\s*([a-z ]*);\s*udp:\s*(\d+)/i);
    if (edns) {
      out.opt = out.opt ?? { version: "", flags: "", udp: null, extra: [] }; // tolerate a missing heading
      out.opt.version = edns[1]; // EDNS version
      out.opt.flags = edns[2].trim(); // EDNS flags (do)
      out.opt.udp = Number.parseInt(edns[3], 10); // the advertised UDP size
      current = null; // not in a record section
      continue; // next line
    }

    // -- section headers --
    const sec = SECTION_HEADERS[line.trim()]; // exact header text
    if (sec) {
      current = { name: sec, records: [] }; // open the section
      out.sections.push(current); // keep it in order
      continue; // next line
    }

    // -- footer stats --
    let m: RegExpMatchArray | null; // reused match holder
    if ((m = line.match(/^;;\s*Query time:\s*(.+)$/i))) { out.footer.queryTime = m[1].trim(); continue; } // query time
    if ((m = line.match(/^;;\s*SERVER:\s*(.+)$/i))) { out.footer.server = m[1].trim(); continue; } // server
    if ((m = line.match(/^;;\s*WHEN:\s*(.+)$/i))) { out.footer.when = m[1].trim(); continue; } // when
    if ((m = line.match(/^;;\s*MSG SIZE\s+rcvd:\s*(.+)$/i))) { out.footer.msgSize = m[1].trim(); continue; } // message size

    // -- any other ';;' comment (e.g. ";; Got answer:", ";; WARNING: ...") --
    if (/^;;/.test(line)) { current = null; continue; } // ends any section

    // -- a record inside a section --
    if (current) {
      const isQ = current.name === "QUESTION"; // question lines have their own shape
      if (!isQ) {
        const { text, parens } = stripComment(line); // comment off, count parens
        if (parens > 0) {
          pending = { text: text.trim(), depth: parens, lines: 0 }; // a multiline record opens here
          continue; // keep reading its lines
        }
        const rec = parseRecord(text, false); // a one-line record (comment removed)
        if (rec) current.records.push(rec); // keep it
        continue; // next line
      }
      const rec = parseRecord(line, true); // a question
      if (rec) current.records.push(rec); // keep it
      continue; // next line
    }

    // -- an OPT extra line (COOKIE / NSID / EDE) that starts with ';' outside a section --
    if (line.startsWith(";") && out.opt) {
      out.opt.extra.push(line.replace(/^;\s*/, "")); // verbatim, without the ';'
    }
  }
  flushPending(); // a multiline record left open at the end of the paste

  // -- the RFC 2308 section 5 negative-caching TTL, for a negative answer carrying an SOA --
  const negativeAnswer = out.header?.status === "NXDOMAIN" || (out.header?.status === "NOERROR" && out.flags?.counts.answer === 0); // NXDOMAIN or NODATA
  if (negativeAnswer) {
    const auth = out.sections.find((s) => s.name === "AUTHORITY"); // the AUTHORITY section
    const soa = auth?.records.find((r) => r.type === "SOA"); // its SOA
    const minTok = soa ? tokens(soa.rdata)[6] : undefined; // the MINIMUM field (7th rdata field)
    const minimum = minTok !== undefined ? parseTtlToken(minTok) : null; // MINIMUM in seconds
    if (soa && soa.ttl !== null && minimum && !minimum.units) {
      out.negative = { owner: soa.name, soaTtl: soa.ttl, minimum: minimum.seconds, ttl: Math.min(soa.ttl, minimum.seconds) }; // min(SOA TTL, MINIMUM)
    }
  }

  // -- derive stable warning codes (the UI localizes each) --
  if (out.header && out.header.status !== "NOERROR") out.warnings.push("nonzero-rcode"); // not a normal answer
  if (out.flags?.flags.includes("tc")) out.warnings.push("truncated-tc"); // truncated
  if (out.flags && out.flags.counts.answer === 0 && out.header?.status === "NOERROR") out.warnings.push("noerror-nodata"); // NODATA
  if (out.flags && !out.flags.flags.includes("qr")) out.warnings.push("looks-like-query"); // a query, not a response
  if (out.opt?.flags.includes("do") && !out.flags?.flags.includes("ad")) out.warnings.push("dnssec-requested-not-validated"); // DO without AD
  const recs = out.sections.flatMap((s) => s.records).filter((r) => !r.isQuestion); // every non-question record
  if (recs.some((r) => r.ttlText !== undefined)) out.warnings.push("ttl-units"); // +ttlunits output, converted
  if (recs.some((r) => r.ttl === null)) out.warnings.push("ttl-absent"); // +nottlid output, no TTL column

  return out; // the parse
}
