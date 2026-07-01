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
// It parses TEXT ONLY. It never resolves anything and contacts nothing
// (zero egress, D-49). Time and randomness are never read here; the engine is
// pure so the same paste always yields the same parse (golden-vector tested).
// ============================================================================

/** The seven header flags dig can print on the `;; flags:` line. */
export type DigFlag = "qr" | "aa" | "tc" | "rd" | "ra" | "ad" | "cd";

/** The `;; ->>HEADER<<-` line: message-level metadata. */
export interface DigHeader {
  opcode: string; // QUERY, NOTIFY, UPDATE, ...
  status: string; // NOERROR, NXDOMAIN, SERVFAIL, REFUSED, ...
  id: string; // the 16-bit transaction id, as printed
}

/** The `;; flags:` line: which flags are set plus the four section counts. */
export interface DigFlags {
  flags: DigFlag[];
  counts: { question: number; answer: number; authority: number; additional: number };
}

/** The EDNS OPT pseudo-section (present only when EDNS is in play). */
export interface DigOpt {
  version: string; // EDNS version, usually "0"
  flags: string; // e.g. "do" (DNSSEC OK) or empty
  udp: number | null; // advertised UDP payload size
  extra: string[]; // any further OPT lines (COOKIE, NSID, ...), captured verbatim
}

/** A single resource record (or a question, which has no TTL / rdata). */
export interface DigRecord {
  name: string;
  ttl: number | null; // null for question records
  class: string; // IN, CH, HS, ...
  type: string; // A, AAAA, CNAME, MX, SOA, RRSIG, ...
  rdata: string; // the record data, joined; empty for question records
  isQuestion: boolean;
}

export type SectionName = "QUESTION" | "ANSWER" | "AUTHORITY" | "ADDITIONAL";

export interface DigSection {
  name: SectionName;
  records: DigRecord[];
}

/** The trailing `;;` statistics block. */
export interface DigFooter {
  queryTime?: string;
  server?: string;
  when?: string;
  msgSize?: string;
}

export interface DigParse {
  versionLine?: string; // the `; <<>> DiG ... <<>>` line, verbatim
  digVersion?: string; // "9.18.1-..." extracted from it
  queryArgs?: string; // the args after `<<>>` (e.g. "example.com A +dnssec")
  header?: DigHeader;
  flags?: DigFlags;
  opt?: DigOpt;
  sections: DigSection[];
  footer: DigFooter;
  warnings: string[]; // STABLE codes (UI localizes them), never English prose
  hadHeader: boolean; // false => almost certainly not dig output
}

// ---------------------------------------------------------------------------
// Reference tables (concise; the UI turns these into the teaching panels).
// ---------------------------------------------------------------------------

/** RCODE (status) meanings — RFC 1035 §4.1.1 + RFC 2308 + RFC 6891 extensions. */
export const RCODE_MEANINGS: Record<string, string> = {
  NOERROR: "No error. The query was answered normally.",
  FORMERR: "Format error. The server could not interpret the query.",
  SERVFAIL: "Server failure. The server could not process the query (often a broken delegation, a DNSSEC validation failure, or an upstream timeout).",
  NXDOMAIN: "Non-existent domain. The queried name does not exist. The negative answer is authoritative when the aa flag is set, and its TTL comes from the SOA minimum (RFC 2308).",
  NOTIMP: "Not implemented. The server does not support the requested query type or opcode.",
  REFUSED: "Refused. The server refused to answer, usually for policy reasons (access control, recursion disabled).",
  YXDOMAIN: "Name exists when it should not (used by dynamic UPDATE).",
  YXRRSET: "RR set exists when it should not (dynamic UPDATE).",
  NXRRSET: "RR set that should exist does not (dynamic UPDATE).",
  NOTAUTH: "Server not authoritative for the zone, or request not authorized.",
  NOTZONE: "Name not contained in the zone (dynamic UPDATE).",
};

/** Opcode meanings. */
export const OPCODE_MEANINGS: Record<string, string> = {
  QUERY: "A standard query (the normal case).",
  IQUERY: "Inverse query (obsolete).",
  STATUS: "Server status request.",
  NOTIFY: "Zone-change notification from a primary to its secondaries.",
  UPDATE: "Dynamic DNS update (RFC 2136).",
};

/** Flag meanings — RFC 1035 §4.1.1 + RFC 4035 (ad/cd). */
export const FLAG_MEANINGS: Record<DigFlag, string> = {
  qr: "Query Response. Set on a response (as opposed to a query).",
  aa: "Authoritative Answer. The answering server is authoritative for the name; the data comes from the zone itself, not a cache.",
  tc: "TruNCated. The message did not fit and was cut short. dig will normally retry over TCP; if you see this, the UDP answer is incomplete.",
  rd: "Recursion Desired. The client asked the server to resolve the name fully on its behalf.",
  ra: "Recursion Available. The server is willing and able to recurse.",
  ad: "Authentic Data. The resolver validated the answer with DNSSEC and it checked out.",
  cd: "Checking Disabled. The client asked the resolver to skip DNSSEC validation.",
};

/** RR type meanings — the common ones plus the DNSSEC set. */
export const RRTYPE_MEANINGS: Record<string, string> = {
  A: "IPv4 address (RFC 1035).",
  AAAA: "IPv6 address (RFC 3596).",
  CNAME: "Canonical name — an alias pointing this name at another name (RFC 1035).",
  MX: "Mail exchanger — where mail for the domain should be delivered, with a preference value (RFC 1035).",
  NS: "Name server — a server authoritative for the zone (RFC 1035).",
  SOA: "Start of Authority — the zone's apex record carrying the primary server, admin mailbox, serial, and the refresh / retry / expire / minimum timers (RFC 1035, RFC 2308).",
  TXT: "Free-form text — used for SPF, DKIM, domain verification, and more (RFC 1035).",
  PTR: "Pointer — the reverse mapping from an address back to a name (RFC 1035).",
  SRV: "Service locator — host and port for a named service, with priority and weight (RFC 2782).",
  CAA: "Certification Authority Authorization — which CAs may issue certificates for the domain (RFC 8659).",
  NAPTR: "Naming Authority Pointer — regex-based rewriting, used by ENUM / SIP (RFC 3403).",
  SPF: "Legacy SPF record type (deprecated; SPF now lives in TXT).",
  HTTPS: "HTTPS service binding — connection parameters (ALPN, port, IP hints) for HTTP origins (RFC 9460).",
  SVCB: "General service binding, the parent of HTTPS (RFC 9460).",
  TLSA: "DANE — ties a certificate or public key to a name via DNSSEC (RFC 6698).",
  DNSKEY: "DNSSEC public key used to verify signatures in the zone (RFC 4034).",
  RRSIG: "DNSSEC signature over an RRset, with the covered type, algorithm, key tag, and validity window (RFC 4034).",
  DS: "Delegation Signer — a hash of a child zone's DNSKEY, published in the parent to build the chain of trust (RFC 4034).",
  NSEC: "Authenticated denial of existence — proves a name or type does not exist by pointing to the next name (RFC 4034).",
  NSEC3: "Hashed authenticated denial of existence — like NSEC but with hashed names to resist zone walking (RFC 5155).",
  NSEC3PARAM: "Parameters (hash, iterations, salt) for the zone's NSEC3 records (RFC 5155).",
  CDS: "Child copy of the DS the parent should publish (RFC 7344).",
  CDNSKEY: "Child copy of the DNSKEY for automated DS maintenance (RFC 7344).",
};

// ---------------------------------------------------------------------------
// Structured rdata breakdowns for the record types where the fields matter.
// Each returns an ordered list of { label, value } pairs, or null if the
// rdata does not match the expected shape (we then just show it raw).
// ---------------------------------------------------------------------------

export interface RdataField {
  label: string;
  value: string;
}

/** Split rdata into whitespace tokens (rdata never contains newlines here). */
function tokens(rdata: string): string[] {
  return rdata.trim().split(/\s+/).filter(Boolean);
}

export function breakdownRdata(type: string, rdata: string): RdataField[] | null {
  const t = tokens(rdata);
  switch (type) {
    case "SOA": {
      // mname rname serial refresh retry expire minimum
      if (t.length < 7) return null;
      return [
        { label: "Primary server (MNAME)", value: t[0] },
        { label: "Admin mailbox (RNAME)", value: t[1] },
        { label: "Serial", value: t[2] },
        { label: "Refresh", value: `${t[3]}s` },
        { label: "Retry", value: `${t[4]}s` },
        { label: "Expire", value: `${t[5]}s` },
        { label: "Minimum / negative-cache TTL", value: `${t[6]}s` },
      ];
    }
    case "MX": {
      if (t.length < 2) return null;
      return [
        { label: "Preference", value: t[0] },
        { label: "Mail exchanger", value: t.slice(1).join(" ") },
      ];
    }
    case "SRV": {
      if (t.length < 4) return null;
      return [
        { label: "Priority", value: t[0] },
        { label: "Weight", value: t[1] },
        { label: "Port", value: t[2] },
        { label: "Target", value: t.slice(3).join(" ") },
      ];
    }
    case "CAA": {
      if (t.length < 3) return null;
      return [
        { label: "Flags", value: t[0] },
        { label: "Tag", value: t[1] },
        { label: "Value", value: t.slice(2).join(" ") },
      ];
    }
    case "RRSIG": {
      // type-covered algo labels orig-ttl expiration inception keytag signer sig...
      if (t.length < 9) return null;
      return [
        { label: "Type covered", value: t[0] },
        { label: "Algorithm", value: t[1] },
        { label: "Labels", value: t[2] },
        { label: "Original TTL", value: `${t[3]}s` },
        { label: "Signature expiration", value: t[4] },
        { label: "Signature inception", value: t[5] },
        { label: "Key tag", value: t[6] },
        { label: "Signer's name", value: t[7] },
      ];
    }
    case "DNSKEY":
    case "CDNSKEY": {
      // flags protocol algorithm key...
      if (t.length < 4) return null;
      return [
        { label: "Flags", value: t[0] },
        { label: "Protocol", value: t[1] },
        { label: "Algorithm", value: t[2] },
        { label: "Public key", value: `${t.slice(3).join("").slice(0, 24)}\u2026 (${t.slice(3).join("").length} chars)` },
      ];
    }
    case "DS":
    case "CDS": {
      // keytag algorithm digesttype digest...
      if (t.length < 4) return null;
      return [
        { label: "Key tag", value: t[0] },
        { label: "Algorithm", value: t[1] },
        { label: "Digest type", value: t[2] },
        { label: "Digest", value: `${t.slice(3).join("").slice(0, 24)}\u2026` },
      ];
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// The parser.
// ---------------------------------------------------------------------------

const SECTION_HEADERS: Record<string, SectionName> = {
  ";; QUESTION SECTION:": "QUESTION",
  ";; ANSWER SECTION:": "ANSWER",
  ";; AUTHORITY SECTION:": "AUTHORITY",
  ";; ADDITIONAL SECTION:": "ADDITIONAL",
};

/** Parse one non-question record line: name TTL CLASS TYPE rdata... */
function parseRecord(line: string, isQuestion: boolean): DigRecord | null {
  if (isQuestion) {
    // Question lines look like: ;name.  IN  A   (leading ';', no TTL/rdata)
    const body = line.replace(/^;/, "").trim();
    const parts = body.split(/\s+/);
    if (parts.length < 3) return null;
    return { name: parts[0], ttl: null, class: parts[1], type: parts[2], rdata: "", isQuestion: true };
  }
  const parts = line.trim().split(/\s+/);
  // name ttl class type rdata...
  if (parts.length < 5) return null;
  const ttl = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(ttl)) return null;
  return {
    name: parts[0],
    ttl,
    class: parts[2],
    type: parts[3],
    rdata: parts.slice(4).join(" "),
    isQuestion: false,
  };
}

export function parseDig(input: string): DigParse {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const out: DigParse = { sections: [], footer: {}, warnings: [], hadHeader: false };
  let current: DigSection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (line.trim() === "") {
      current = null; // a blank line ends the current section body
      continue;
    }

    // -- version line: ; <<>> DiG 9.x <<>> example.com A --
    const ver = line.match(/^;\s*<<>>\s*DiG\s+([^\s]+)\s*<<>>\s*(.*)$/);
    if (ver) {
      out.versionLine = line;
      out.digVersion = ver[1];
      out.queryArgs = ver[2].trim();
      current = null;
      continue;
    }

    // -- header line --
    const hdr = line.match(/->>HEADER<<-\s*opcode:\s*([A-Z]+),\s*status:\s*([A-Z]+),\s*id:\s*(\d+)/i);
    if (hdr) {
      out.header = { opcode: hdr[1].toUpperCase(), status: hdr[2].toUpperCase(), id: hdr[3] };
      out.hadHeader = true;
      current = null;
      continue;
    }

    // -- flags line: ;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1 --
    const flg = line.match(/^;;\s*flags:\s*([a-z ]*);\s*QUERY:\s*(\d+),\s*ANSWER:\s*(\d+),\s*AUTHORITY:\s*(\d+),\s*ADDITIONAL:\s*(\d+)/i);
    if (flg) {
      const set = flg[1].trim().split(/\s+/).filter(Boolean) as DigFlag[];
      out.flags = {
        flags: set,
        counts: {
          question: Number.parseInt(flg[2], 10),
          answer: Number.parseInt(flg[3], 10),
          authority: Number.parseInt(flg[4], 10),
          additional: Number.parseInt(flg[5], 10),
        },
      };
      current = null;
      continue;
    }

    // -- EDNS OPT pseudosection --
    if (/^;;\s*OPT PSEUDOSECTION:/i.test(line)) {
      out.opt = out.opt ?? { version: "", flags: "", udp: null, extra: [] };
      current = null;
      continue;
    }
    const edns = line.match(/^;\s*EDNS:\s*version:\s*(\d+),\s*flags:\s*([a-z ]*);\s*udp:\s*(\d+)/i);
    if (edns) {
      out.opt = out.opt ?? { version: "", flags: "", udp: null, extra: [] };
      out.opt.version = edns[1];
      out.opt.flags = edns[2].trim();
      out.opt.udp = Number.parseInt(edns[3], 10);
      current = null;
      continue;
    }

    // -- section headers --
    const sec = SECTION_HEADERS[line.trim()];
    if (sec) {
      current = { name: sec, records: [] };
      out.sections.push(current);
      continue;
    }

    // -- footer stats --
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^;;\s*Query time:\s*(.+)$/i))) { out.footer.queryTime = m[1].trim(); continue; }
    if ((m = line.match(/^;;\s*SERVER:\s*(.+)$/i))) { out.footer.server = m[1].trim(); continue; }
    if ((m = line.match(/^;;\s*WHEN:\s*(.+)$/i))) { out.footer.when = m[1].trim(); continue; }
    if ((m = line.match(/^;;\s*MSG SIZE\s+rcvd:\s*(.+)$/i))) { out.footer.msgSize = m[1].trim(); continue; }

    // -- any other ';;' comment (e.g. ";; Got answer:", ";; global options:") --
    if (/^;;/.test(line)) { current = null; continue; }

    // -- a record inside a section --
    if (current) {
      const isQ = current.name === "QUESTION";
      const rec = parseRecord(line, isQ);
      if (rec) current.records.push(rec);
      else if (isQ && line.startsWith(";")) {
        // tolerate a bare ";name IN TYPE" that split oddly; ignore silently
      }
      continue;
    }

    // -- an OPT extra line (COOKIE / NSID) that starts with ';' outside a section --
    if (line.startsWith(";") && out.opt) {
      out.opt.extra.push(line.replace(/^;\s*/, ""));
    }
  }

  // -- derive stable warning codes (the UI localizes each) --
  if (out.header && out.header.status !== "NOERROR") out.warnings.push("nonzero-rcode");
  if (out.flags?.flags.includes("tc")) out.warnings.push("truncated-tc");
  if (out.flags && out.flags.counts.answer === 0 && out.header?.status === "NOERROR") out.warnings.push("noerror-nodata");
  if (out.flags && !out.flags.flags.includes("qr")) out.warnings.push("looks-like-query");
  if (out.opt?.flags.includes("do") && !out.flags?.flags.includes("ad")) out.warnings.push("dnssec-requested-not-validated");

  return out;
}
