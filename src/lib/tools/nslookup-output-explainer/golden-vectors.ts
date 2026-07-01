// ============================================================================
// src/lib/tools/nslookup-output-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the nslookup parser. Each pins real-shaped nslookup output
// to the structure parseNslookup must recover. Assertions are on STRUCTURE
// (resolver, authority, record type / value / fields, error codes, warnings),
// never on UI prose, so the teaching copy can change without breaking tests.
// ============================================================================

import { parseNslookup, breakdownValue, type NslookupParse } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "nslookup-output-explainer/2026-07-01";

export interface NsVector {
  id: string;
  input: string;
  check: (p: NslookupParse) => string[];
}

function eq(label: string, got: unknown, want: unknown): string[] {
  return got === want ? [] : [`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`];
}

// -- V1: a plain A + AAAA lookup, non-authoritative --------------------------
const V1 = `Server:\t\t8.8.8.8
Address:\t8.8.8.8#53

Non-authoritative answer:
Name:\texample.com
Address: 93.184.216.34
Name:\texample.com
Address: 2606:2800:220:1:248:1893:25c8:1946`;

// -- V2: an NXDOMAIN failure -------------------------------------------------
const V2 = `Server:\t\t8.8.8.8
Address:\t8.8.8.8#53

** server can't find nonexistent.example.com: NXDOMAIN`;

// -- V3: an MX lookup with a referral note -----------------------------------
const V3 = `Server:\t\t8.8.8.8
Address:\t8.8.8.8#53

Non-authoritative answer:
example.com\tmail exchanger = 10 mail.example.com.

Authoritative answers can be found from:`;

// -- V4: an SOA lookup, printed field by field -------------------------------
const V4 = `Server:\t\t8.8.8.8
Address:\t8.8.8.8#53

Non-authoritative answer:
example.com
\torigin = ns.icann.org
\tmail addr = noc.dns.icann.org
\tserial = 2024010101
\trefresh = 7200
\tretry = 3600
\texpire = 1209600
\tminimum = 3600`;

export const NS_VECTORS: NsVector[] = [
  {
    id: "a-aaaa-nonauth",
    input: V1,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("server", p.server?.server, "8.8.8.8"));
      f.push(...eq("serverAddr", p.server?.address, "8.8.8.8#53"));
      f.push(...eq("authority", p.authority, "non-authoritative"));
      f.push(...eq("recordCount", p.records.length, 2));
      f.push(...eq("rec0type", p.records[0]?.type, "A"));
      f.push(...eq("rec0value", p.records[0]?.value, "93.184.216.34"));
      f.push(...eq("rec0name", p.records[0]?.name, "example.com"));
      f.push(...eq("rec1type", p.records[1]?.type, "AAAA"));
      f.push(...eq("rec1value", p.records[1]?.value, "2606:2800:220:1:248:1893:25c8:1946"));
      f.push(...eq("hasNonAuthWarning", p.warnings.includes("non-authoritative"), true));
      f.push(...eq("noErrors", p.errors.length, 0));
      return f;
    },
  },
  {
    id: "nxdomain",
    input: V2,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("serverPresent", p.server?.server, "8.8.8.8"));
      f.push(...eq("errorCount", p.errors.length, 1));
      f.push(...eq("errorName", p.errors[0]?.name, "nonexistent.example.com"));
      f.push(...eq("errorCode", p.errors[0]?.code, "NXDOMAIN"));
      f.push(...eq("hasNxdomainWarning", p.warnings.includes("nxdomain"), true));
      f.push(...eq("noRecords", p.records.length, 0));
      return f;
    },
  },
  {
    id: "mx-referral",
    input: V3,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("recordCount", p.records.length, 1));
      f.push(...eq("mxType", p.records[0]?.type, "MX"));
      f.push(...eq("mxName", p.records[0]?.name, "example.com"));
      f.push(...eq("mxValue", p.records[0]?.value, "10 mail.example.com."));
      f.push(...eq("mxPref", p.records[0]?.fields?.[0]?.value, "10"));
      f.push(...eq("mxHost", p.records[0]?.fields?.[1]?.value, "mail.example.com."));
      f.push(...eq("referralNote", p.referralNote, true));
      return f;
    },
  },
  {
    id: "soa-multifield",
    input: V4,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("recordCount", p.records.length, 1));
      f.push(...eq("soaType", p.records[0]?.type, "SOA"));
      f.push(...eq("soaName", p.records[0]?.name, "example.com"));
      f.push(...eq("soaFieldCount", p.records[0]?.fields?.length, 7));
      f.push(...eq("soaSerial", p.records[0]?.fields?.[2]?.value, "2024010101"));
      f.push(...eq("soaMinimum", p.records[0]?.fields?.[6]?.value, "3600"));
      return f;
    },
  },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];
  for (const v of NS_VECTORS) {
    const msgs = v.check(parseNslookup(v.input));
    if (msgs.length === 0) passed++;
    else {
      failed++;
      failures.push(`[${v.id}] ${msgs.join(" | ")}`);
    }
  }
  return { passed, failed, failures };
}
