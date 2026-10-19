// ============================================================================
// src/lib/tools/nslookup-output-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the nslookup parser. Every input is REAL nslookup output
// from the BIND 9.20.29 build, copied byte for byte (tabs included) from
// captures made on 2026-10-19 through a local relay that forwarded each query's
// exact bytes to Cloudflare's resolver over DNS over HTTPS (RFC 8484) and
// returned the response bytes unchanged. The Server / Address lines therefore
// name the relay (127.0.0.1#5311), not the resolver behind it.
//
// The NXDOMAIN vector uses a name under .invalid (RFC 6761 section 6.4: users
// MAY assume queries for "invalid" names will always return NXDOMAIN), because
// example.com now answers NOERROR with no data for names that do not exist
// (RFC 9824 compact denial, observed 2026-10-18 and 2026-10-19).
//
// Assertions are on STRUCTURE (resolver, authority, record type / value /
// fields, error codes, warnings), never on UI prose, so the teaching copy can
// change without breaking tests.
// ============================================================================

import { parseNslookup, type NslookupParse } from "./compute"; // the engine under test

/** Identifies this vector set; bump the date when a vector is deliberately changed. */
export const GOLDEN_VECTOR_SET_ID = "nslookup-output-explainer/2026-10-19";

/** One vector: an id, a real nslookup output, and a check returning failure messages. */
export interface NsVector {
  id: string; // stable id
  input: string; // the nslookup output, byte for byte
  check: (p: NslookupParse) => string[]; // returns a list of failure messages ([] = pass)
}

/** Compare one value; return a failure message when it differs. */
function eq(label: string, got: unknown, want: unknown): string[] {
  return got === want ? [] : [`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`]; // [] on a match
}

// -- V1: A and AAAA, non-authoritative (2026-10-19 14:38:08 -03) --------------
// example.com's addresses as answered that day; no longer 93.184.216.34.
const V1 = "Server:\t\t127.0.0.1\nAddress:\t127.0.0.1#5311\n\nNon-authoritative answer:\nName:\texample.com\nAddress: 104.20.23.154\nName:\texample.com\nAddress: 172.66.147.243\nName:\texample.com\nAddress: 2606:4700:10::6814:179a\nName:\texample.com\nAddress: 2606:4700:10::ac42:93f3"; // verbatim capture (nslookup -port=5311 example.com 127.0.0.1)

// -- V2: an NXDOMAIN failure for a name under .invalid (14:38:09) -------------
const V2 = "Server:\t\t127.0.0.1\nAddress:\t127.0.0.1#5311\n\n** server can't find nonexistent.invalid: NXDOMAIN"; // verbatim capture (nslookup -port=5311 nonexistent.invalid 127.0.0.1)

// -- V3: an MX lookup with a referral note (14:38:09) -------------------------
// example.com publishes a null MX, preference 0 and exchange "." (RFC 7505).
const V3 = "Server:\t\t127.0.0.1\nAddress:\t127.0.0.1#5311\n\nNon-authoritative answer:\nexample.com\tmail exchanger = 0 .\n\nAuthoritative answers can be found from:"; // verbatim capture (nslookup -port=5311 -type=MX example.com 127.0.0.1)

// -- V4: an SOA lookup, printed field by field (14:38:09) ---------------------
const V4 = "Server:\t\t127.0.0.1\nAddress:\t127.0.0.1#5311\n\nNon-authoritative answer:\nexample.com\n\torigin = elliott.ns.cloudflare.com\n\tmail addr = dns.cloudflare.com\n\tserial = 2416374680\n\trefresh = 10000\n\tretry = 2400\n\texpire = 604800\n\tminimum = 1800\n\nAuthoritative answers can be found from:"; // verbatim capture (nslookup -port=5311 -type=SOA example.com 127.0.0.1)

/** The vectors. */
export const NS_VECTORS: NsVector[] = [
  {
    id: "a-aaaa-nonauth", // V1
    input: V1, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("server", p.server?.server, "127.0.0.1")); // the relay nslookup asked
      f.push(...eq("serverAddr", p.server?.address, "127.0.0.1#5311")); // with its port
      f.push(...eq("authority", p.authority, "non-authoritative")); // AA clear
      f.push(...eq("recordCount", p.records.length, 4)); // two A, two AAAA
      f.push(...eq("rec0type", p.records[0]?.type, "A")); // first A
      f.push(...eq("rec0value", p.records[0]?.value, "104.20.23.154")); // its address
      f.push(...eq("rec0name", p.records[0]?.name, "example.com")); // its name
      f.push(...eq("rec1value", p.records[1]?.value, "172.66.147.243")); // second A
      f.push(...eq("rec2type", p.records[2]?.type, "AAAA")); // first AAAA
      f.push(...eq("rec2value", p.records[2]?.value, "2606:4700:10::6814:179a")); // its address
      f.push(...eq("rec3value", p.records[3]?.value, "2606:4700:10::ac42:93f3")); // second AAAA
      f.push(...eq("hasNonAuthWarning", p.warnings.includes("non-authoritative"), true)); // flagged
      f.push(...eq("noErrors", p.errors.length, 0)); // no failure
      return f; // done
    },
  },
  {
    id: "nxdomain-invalid", // V2
    input: V2, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("serverPresent", p.server?.server, "127.0.0.1")); // the relay
      f.push(...eq("errorCount", p.errors.length, 1)); // one failure
      f.push(...eq("errorName", p.errors[0]?.name, "nonexistent.invalid")); // the .invalid name
      f.push(...eq("errorCode", p.errors[0]?.code, "NXDOMAIN")); // the status
      f.push(...eq("hasNxdomainWarning", p.warnings.includes("nxdomain"), true)); // flagged
      f.push(...eq("noRecords", p.records.length, 0)); // nothing answered
      f.push(...eq("authorityUnknown", p.authority, "unknown")); // nslookup prints no marker on a failure
      return f; // done
    },
  },
  {
    id: "mx-referral", // V3
    input: V3, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("recordCount", p.records.length, 1)); // one MX
      f.push(...eq("mxType", p.records[0]?.type, "MX")); // type
      f.push(...eq("mxName", p.records[0]?.name, "example.com")); // owner
      f.push(...eq("mxValue", p.records[0]?.value, "0 .")); // the null MX
      f.push(...eq("mxPref", p.records[0]?.fields?.[0]?.value, "0")); // preference
      f.push(...eq("mxHost", p.records[0]?.fields?.[1]?.value, ".")); // exchange: the root, no mail
      f.push(...eq("referralNote", p.referralNote, true)); // the referral line
      return f; // done
    },
  },
  {
    id: "soa-multifield", // V4
    input: V4, // real capture
    check: (p) => {
      const f: string[] = []; // failures
      f.push(...eq("recordCount", p.records.length, 1)); // one SOA
      f.push(...eq("soaType", p.records[0]?.type, "SOA")); // type
      f.push(...eq("soaName", p.records[0]?.name, "example.com")); // owner
      f.push(...eq("soaFieldCount", p.records[0]?.fields?.length, 7)); // seven fields
      f.push(...eq("soaOrigin", p.records[0]?.fields?.[0]?.value, "elliott.ns.cloudflare.com")); // origin
      f.push(...eq("soaSerial", p.records[0]?.fields?.[2]?.value, "2416374680")); // serial
      f.push(...eq("soaMinimum", p.records[0]?.fields?.[6]?.value, "1800")); // minimum
      f.push(...eq("referralNote", p.referralNote, true)); // the referral line
      return f; // done
    },
  },
];

/** Run every vector; the build's run-golden-vectors reads this shape. */
export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  let passed = 0; // passing vectors
  let failed = 0; // failing vectors
  const failures: string[] = []; // messages
  for (const v of NS_VECTORS) {
    const msgs = v.check(parseNslookup(v.input)); // parse and check
    if (msgs.length === 0) passed++; // a pass
    else {
      failed++; // a failure
      failures.push(`[${v.id}] ${msgs.join(" | ")}`); // with detail
    }
  }
  return { passed, failed, failures }; // the report
}
