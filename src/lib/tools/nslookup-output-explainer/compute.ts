// ============================================================================
// src/lib/tools/nslookup-output-explainer/compute.ts
// ----------------------------------------------------------------------------
// Deterministic parser + reference for the nslookup-output-explainer tool.
//
// nslookup prints DNS answers in a prose-ish layout that is quite different
// from dig: a Server / Address header for the resolver used, an optional
// "Non-authoritative answer:" marker, then per-type lines such as
// "example.com  mail exchanger = 10 mail.example.com." and multi-line SOA
// blocks, plus "** server can't find NAME: RCODE" for failures.
//
// This reconstructs that into a structured result: the resolver, whether the
// answer is authoritative, each record (name / type / value, with field
// breakdowns for MX / SRV / SOA), and any errors. It parses TEXT ONLY and
// contacts nothing (zero egress, D-49). The engine is pure and time / random
// are never read, so it stays deterministic and golden-vector tested.
// ============================================================================

/** The resolver nslookup used, from the Server / Address header. */
export interface NslookupServer {
  server: string; // hostname or IP as printed on the Server: line
  address: string; // the Address: line paired with it, e.g. "8.8.8.8#53"
}

export type NslookupAuthority = "authoritative" | "non-authoritative" | "unknown";

export interface NsField {
  label: string;
  value: string;
}

/** One answer record. `fields` is present for MX / SRV / SOA breakdowns. */
export interface NslookupRecord {
  name: string;
  type: string; // A, AAAA, MX, NS, CNAME, TXT, PTR, SRV, SOA
  value: string; // the value as printed (also a fallback when fields is set)
  fields?: NsField[];
}

/** A "** server can't find NAME: CODE" style failure. */
export interface NslookupError {
  name: string; // the name that failed, or "" if not parseable
  code: string; // NXDOMAIN, SERVFAIL, REFUSED, "timed out", ...
}

export interface NslookupParse {
  server?: NslookupServer;
  authority: NslookupAuthority;
  records: NslookupRecord[];
  errors: NslookupError[];
  referralNote: boolean; // "Authoritative answers can be found from:" was present
  warnings: string[]; // STABLE codes (UI localizes them), never English prose
  recognized: boolean; // false => almost certainly not nslookup output
}

// ---------------------------------------------------------------------------
// Reference: what each record type nslookup prints actually is (concise).
// ---------------------------------------------------------------------------

export const NS_TYPE_MEANINGS: Record<string, string> = {
  A: "IPv4 address. nslookup prints it on an Address: line under the Name: (RFC 1035).",
  AAAA: "IPv6 address, also shown on an Address: line; you can tell it apart by the colons (RFC 3596).",
  MX: "Mail exchanger. The value is a preference number then a hostname; lower preference is preferred (RFC 1035).",
  NS: "Name server authoritative for the zone (RFC 1035).",
  CNAME: "Canonical name, an alias pointing this name at another name; the real records live under the target (RFC 1035).",
  TXT: "Free-form text, used for SPF, DKIM, and domain verification (RFC 1035).",
  PTR: "Pointer, the reverse mapping from an address back to a name; nslookup prints it as name = (RFC 1035).",
  SRV: "Service locator. The value is priority, weight, port, and target host (RFC 2782).",
  SOA: "Start of Authority, the zone apex record. nslookup lists its fields (origin, mail addr, serial, and the refresh / retry / expire / minimum timers) one per line (RFC 1035, RFC 2308).",
};

/** Labels for the SOA fields nslookup prints, keyed by nslookup's own key. */
export const SOA_FIELD_LABELS: Record<string, string> = {
  origin: "Primary server (origin)",
  "mail addr": "Admin mailbox (mail addr)",
  serial: "Serial",
  refresh: "Refresh",
  retry: "Retry",
  expire: "Expire",
  minimum: "Minimum / negative-cache TTL",
};

// ---------------------------------------------------------------------------
// Value breakdowns for MX and SRV (SOA is already field-wise from the parse).
// ---------------------------------------------------------------------------

export function breakdownValue(type: string, value: string): NsField[] | null {
  const t = value.trim().split(/\s+/).filter(Boolean);
  if (type === "MX" && t.length >= 2) {
    return [
      { label: "Preference", value: t[0] },
      { label: "Mail exchanger", value: t.slice(1).join(" ") },
    ];
  }
  if (type === "SRV" && t.length >= 4) {
    return [
      { label: "Priority", value: t[0] },
      { label: "Weight", value: t[1] },
      { label: "Port", value: t[2] },
      { label: "Target", value: t.slice(3).join(" ") },
    ];
  }
  return null;
}

// ---------------------------------------------------------------------------
// The parser.
// ---------------------------------------------------------------------------

// Per-type "NAME  keyword = VALUE" lines.
const KEYWORD_TYPES: { re: RegExp; type: string }[] = [
  { re: /^(\S+)\s+mail exchanger\s*=\s*(.+)$/, type: "MX" },
  { re: /^(\S+)\s+nameserver\s*=\s*(.+)$/, type: "NS" },
  { re: /^(\S+)\s+canonical name\s*=\s*(.+)$/, type: "CNAME" },
  { re: /^(\S+)\s+text\s*=\s*(.+)$/, type: "TXT" },
  { re: /^(\S+)\s+service\s*=\s*(.+)$/, type: "SRV" },
  { re: /^(\S+)\s+name\s*=\s*(.+)$/, type: "PTR" },
];

function isIPv6(addr: string): boolean {
  return addr.includes(":");
}

export function parseNslookup(input: string): NslookupParse {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const out: NslookupParse = {
    authority: "unknown",
    records: [],
    errors: [],
    referralNote: false,
    warnings: [],
    recognized: false,
  };

  let inResolverHeader = true; // true until the blank line after the Server: block
  let sawServer = false;
  let currentName = ""; // the last "Name:" seen, for the A/AAAA Address lines
  let currentSoa: NslookupRecord | null = null; // an SOA being accumulated
  let lastBareName = ""; // a bare name line, the candidate SOA owner

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");

    if (line.trim() === "") {
      if (sawServer) inResolverHeader = false; // header ends at the blank line
      currentSoa = null; // a blank line ends an SOA block
      continue;
    }

    // -- Server: line (resolver) --
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^Server:\s*(.+)$/))) {
      if (!out.server) out.server = { server: m[1].trim(), address: "" };
      sawServer = true;
      continue;
    }

    // -- Non-authoritative / authoritative markers --
    if (/^Non-authoritative answer:/i.test(line)) {
      out.authority = "non-authoritative";
      inResolverHeader = false;
      out.recognized = true;
      continue;
    }
    if (/^Authoritative answers can be found from:/i.test(line)) {
      out.referralNote = true;
      inResolverHeader = false;
      out.recognized = true;
      continue;
    }

    // -- error lines --
    if ((m = line.match(/^\*\*\s*server can'?t find\s+(.+?):\s*(.+)$/i))) {
      out.errors.push({ name: m[1].trim(), code: m[2].trim().toUpperCase() });
      out.recognized = true;
      inResolverHeader = false;
      continue;
    }
    if (/no servers could be reached|connection timed out/i.test(line)) {
      out.errors.push({ name: "", code: "TIMED OUT" });
      out.recognized = true;
      continue;
    }
    if (/^\*\*\s+(.+)$/.test(line)) {
      const em = line.match(/^\*\*\s+(.+)$/);
      out.errors.push({ name: "", code: (em ? em[1] : line).trim() });
      out.recognized = true;
      continue;
    }

    // -- Address / Addresses line --
    if ((m = line.match(/^Address(?:es)?:\s*(.+)$/))) {
      const val = m[1].trim();
      if (inResolverHeader && out.server && !out.server.address) {
        out.server.address = val; // the resolver's own address
      } else {
        // an answer address; may be comma-separated on some builds
        for (const a of val.split(",").map((x) => x.trim()).filter(Boolean)) {
          out.records.push({ name: currentName || lastBareName, type: isIPv6(a) ? "AAAA" : "A", value: a });
          out.recognized = true;
        }
      }
      continue;
    }

    // -- Name: line (starts an A/AAAA group) --
    if ((m = line.match(/^Name:\s*(.+)$/))) {
      currentName = m[1].trim();
      inResolverHeader = false;
      out.recognized = true;
      continue;
    }

    // -- SOA field (indented "key = value") --
    if ((m = rawLine.match(/^\s+(origin|mail addr|serial|refresh|retry|expire|minimum)\s*=\s*(.+?)\s*$/))) {
      if (!currentSoa) {
        currentSoa = { name: lastBareName, type: "SOA", value: "", fields: [] };
        out.records.push(currentSoa);
      }
      currentSoa.fields!.push({ label: SOA_FIELD_LABELS[m[1]] ?? m[1], value: m[2].trim() });
      out.recognized = true;
      continue;
    }

    // -- "NAME keyword = VALUE" per-type lines --
    let matchedKeyword = false;
    for (const { re, type } of KEYWORD_TYPES) {
      const km = line.match(re);
      if (km) {
        const value = km[2].trim();
        const rec: NslookupRecord = { name: km[1].trim(), type, value };
        const fields = breakdownValue(type, value);
        if (fields) rec.fields = fields;
        out.records.push(rec);
        out.recognized = true;
        matchedKeyword = true;
        break;
      }
    }
    if (matchedKeyword) continue;

    // -- a bare name line (candidate SOA owner) --
    if (/^\S[^=]*$/.test(line) && !line.includes(":")) {
      lastBareName = line.trim();
      currentSoa = null; // a new bare name resets any prior SOA block
      continue;
    }
    // anything else is ignored (bounded, never throws)
  }

  // -- derive stable warning codes --
  const codes = out.errors.map((e) => e.code);
  if (codes.some((c) => c.includes("NXDOMAIN"))) out.warnings.push("nxdomain");
  if (codes.some((c) => c.includes("SERVFAIL"))) out.warnings.push("servfail");
  if (codes.some((c) => c.includes("REFUSED"))) out.warnings.push("refused");
  if (codes.some((c) => c.includes("TIMED OUT"))) out.warnings.push("no-servers");
  if (out.authority === "non-authoritative" && out.records.length > 0) out.warnings.push("non-authoritative");

  return out;
}
