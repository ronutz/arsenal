// ============================================================================
// src/lib/tools/f5-awaf-request-log-triage/index.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF REQUEST-LOG PARSER + FALSE-POSITIVE TRIAGE BRIDGE.
// A {manifest, run, vectors} triple. Paste an ASM request-log entry (syslog
// key-value or CEF) and it extracts the policy, the support ID (for log
// correlation), the request status, the violation rating, the client IP,
// method, and URI, classifies each violation into a triage category, and gives
// F5's rating-based verdict, then points you at the false-positive triage tool
// for the per-violation fix.
//
// Pure, decode-only (D-49): it reads the log text you paste, never contacts a
// BIG-IP, and never fetches. It does NOT decode the support-ID number, because
// that number is an opaque correlation reference and does not carry the
// violations - the log line does.
// ============================================================================

import { parseAsmLog } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { parseAsmLog, classifyViolation } from "./compute";
export type { LogFormat, RequestStatus, Verdict, ParsedViolation, LogFields, LogResult, LogNote } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Security & WAF",
  toolSlug: "f5-awaf-request-log-triage",
  canonicalAliases: ["asm-request-log", "awaf-log-triage", "asm-support-id-log", "asm-blocking-log-parser"],
  inputDetectors: [
    { kind: "regex", pattern: "\\bASM:", priority: 8, example: 'ASM:policy_name="p",violations="Attack signature detected",support_id="123",request_status="blocked"' },
    { kind: "regex", pattern: "\\|F5\\|ASM\\|", priority: 8, example: "CEF:0|F5|ASM|17.1|1|name|5|externalId=123 act=blocked requestMethod=GET" },
    { kind: "regex", pattern: '"?support_id"?\\s*=', priority: 6, example: 'support_id="5268275531735896872"' },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // A log line carries a client IP and URI -> shareable fragment, not raw.
  shareSafetyDefault: "fragment",

  learnLinks: [
    "learn/awaf-false-positives",
    "learn/awaf-enforcement-mode-blocking-vs-transparent",
  ],
  sources: [
    { id: "f5-asm-logging-fields", label: "F5 BIG-IP ASM logging fields (syslog key-value and CEF: policy_name, violations, support_id, violation_rating, request_status, ip_client, method, uri)", url: "https://techdocs.f5.com/en-us/bigip-17-5-0/big-ip-asm-implementations/working-with-violations.html" },
    { id: "f5-asm-reporting", label: "F5 BIG-IP ASM: Displaying Reports and Monitoring ASM (violation rating 4-5 attack, 1-2 false positive; the Requests List)", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_asm/manuals/product/asm-implementations-12-1-0/13.html" },
    { id: "f5-k47045262", label: "F5 K47045262: Troubleshooting BIG-IP ASM (support ID for request/log correlation)", url: "https://my.f5.com/manage/s/article/K47045262" },
  ],
});

export function run(input: string) {
  return parseAsmLog(input);
}

export const __selftest = verifyVectors;
