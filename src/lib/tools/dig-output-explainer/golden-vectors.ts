// ============================================================================
// src/lib/tools/dig-output-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the dig parser. Each pins a real-shaped `dig` output to
// the exact structure parseDig must recover. Assertions are on STRUCTURE
// (opcode, status, id, flags, counts, per-record fields, warning codes), never
// on UI prose, so the teaching copy can change freely without breaking tests.
// ============================================================================

import { parseDig, breakdownRdata, type DigParse } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "dig-output-explainer/2026-06-30";

export interface DigVector {
  id: string;
  input: string;
  check: (p: DigParse) => string[]; // returns a list of failure messages ([] = pass)
}

function eq(label: string, got: unknown, want: unknown): string[] {
  return got === want ? [] : [`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`];
}

// -- Vector 1: a plain, successful A lookup ---------------------------------
const V1 = `; <<>> DiG 9.18.1-1ubuntu1.3-Ubuntu <<>> example.com A
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4321
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;example.com.\t\t\tIN\tA

;; ANSWER SECTION:
example.com.\t\t3600\tIN\tA\t93.184.216.34

;; Query time: 12 msec
;; SERVER: 127.0.0.53#53(127.0.0.53) (UDP)
;; WHEN: Mon Jun 30 12:00:00 UTC 2026
;; MSG SIZE  rcvd: 56`;

// -- Vector 2: an NXDOMAIN with an SOA in AUTHORITY -------------------------
const V2 = `; <<>> DiG 9.18.1 <<>> nonexistent.example.com A
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 51966
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 1232
;; QUESTION SECTION:
;nonexistent.example.com.\tIN\tA

;; AUTHORITY SECTION:
example.com.\t\t3600\tIN\tSOA\tns.icann.org. noc.dns.icann.org. 2024010101 7200 3600 1209600 3600

;; Query time: 40 msec
;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)
;; WHEN: Mon Jun 30 12:00:00 UTC 2026
;; MSG SIZE  rcvd: 120`;

// -- Vector 3: a DNSSEC-validated answer with an RRSIG ----------------------
const V3 = `; <<>> DiG 9.18.1 <<>> cloudflare.com A +dnssec
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345
;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags: do; udp: 1232
;; QUESTION SECTION:
;cloudflare.com.\t\t\tIN\tA

;; ANSWER SECTION:
cloudflare.com.\t\t300\tIN\tA\t104.16.132.229
cloudflare.com.\t\t300\tIN\tRRSIG\tA 13 2 300 20260701000000 20260629000000 34505 cloudflare.com. abcDEF123==

;; Query time: 8 msec
;; SERVER: 1.1.1.1#53(1.1.1.1) (UDP)
;; WHEN: Mon Jun 30 12:00:00 UTC 2026
;; MSG SIZE  rcvd: 200`;

export const DIG_VECTORS: DigVector[] = [
  {
    id: "plain-a-noerror",
    input: V1,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("digVersion", p.digVersion, "9.18.1-1ubuntu1.3-Ubuntu"));
      f.push(...eq("queryArgs", p.queryArgs, "example.com A"));
      f.push(...eq("opcode", p.header?.opcode, "QUERY"));
      f.push(...eq("status", p.header?.status, "NOERROR"));
      f.push(...eq("id", p.header?.id, "4321"));
      f.push(...eq("flags", p.flags?.flags.join(","), "qr,rd,ra"));
      f.push(...eq("answerCount", p.flags?.counts.answer, 1));
      f.push(...eq("ednsUdp", p.opt?.udp, 65494));
      const ans = p.sections.find((s) => s.name === "ANSWER");
      f.push(...eq("answerRecs", ans?.records.length, 1));
      f.push(...eq("ansType", ans?.records[0]?.type, "A"));
      f.push(...eq("ansTtl", ans?.records[0]?.ttl, 3600));
      f.push(...eq("ansRdata", ans?.records[0]?.rdata, "93.184.216.34"));
      const q = p.sections.find((s) => s.name === "QUESTION");
      f.push(...eq("qName", q?.records[0]?.name, "example.com."));
      f.push(...eq("qTtlNull", q?.records[0]?.ttl, null));
      f.push(...eq("footerMsgSize", p.footer.msgSize, "56"));
      f.push(...eq("warningsEmpty", p.warnings.length, 0));
      return f;
    },
  },
  {
    id: "nxdomain-soa",
    input: V2,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("status", p.header?.status, "NXDOMAIN"));
      f.push(...eq("id", p.header?.id, "51966"));
      f.push(...eq("answerCount", p.flags?.counts.answer, 0));
      f.push(...eq("authorityCount", p.flags?.counts.authority, 1));
      const auth = p.sections.find((s) => s.name === "AUTHORITY");
      f.push(...eq("authType", auth?.records[0]?.type, "SOA"));
      const soa = breakdownRdata("SOA", auth?.records[0]?.rdata ?? "");
      f.push(...eq("soaFieldCount", soa?.length, 7));
      f.push(...eq("soaSerial", soa?.[2]?.value, "2024010101"));
      f.push(...eq("soaMinimum", soa?.[6]?.value, "3600s"));
      f.push(...eq("hasNonzeroRcode", p.warnings.includes("nonzero-rcode"), true));
      return f;
    },
  },
  {
    id: "dnssec-rrsig",
    input: V3,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("status", p.header?.status, "NOERROR"));
      f.push(...eq("flagsHasAd", p.flags?.flags.includes("ad"), true));
      f.push(...eq("ednsFlags", p.opt?.flags, "do"));
      f.push(...eq("answerCount", p.flags?.counts.answer, 2));
      const ans = p.sections.find((s) => s.name === "ANSWER");
      f.push(...eq("ansRecs", ans?.records.length, 2));
      f.push(...eq("rec2Type", ans?.records[1]?.type, "RRSIG"));
      const sig = breakdownRdata("RRSIG", ans?.records[1]?.rdata ?? "");
      f.push(...eq("rrsigTypeCovered", sig?.[0]?.value, "A"));
      f.push(...eq("rrsigKeyTag", sig?.[6]?.value, "34505"));
      // ad IS set here, so the "requested-not-validated" warning must NOT fire
      f.push(...eq("noValidationWarning", p.warnings.includes("dnssec-requested-not-validated"), false));
      return f;
    },
  },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];
  for (const v of DIG_VECTORS) {
    const msgs = v.check(parseDig(v.input));
    if (msgs.length === 0) passed++;
    else {
      failed++;
      failures.push(`[${v.id}] ${msgs.join(" | ")}`);
    }
  }
  return { passed, failed, failures };
}
