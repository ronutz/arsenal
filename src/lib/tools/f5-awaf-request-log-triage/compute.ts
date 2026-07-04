// ============================================================================
// src/lib/tools/f5-awaf-request-log-triage/compute.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager)
// REQUEST-LOG PARSER + FALSE-POSITIVE TRIAGE BRIDGE (arsenal-local, pure,
// deterministic). Paste an ASM request-log entry - the syslog key-value line
// or the CEF line you see in your SIEM - and this pulls out the fields that
// matter (the policy, the support ID for log correlation, the request status,
// the violation rating, the client IP, method, and URI), classifies each
// violation into a triage category, and gives F5's rating-based verdict for
// the request.
//
// WHY A LOG PARSER AND NOT A "SUPPORT-ID DECODER": the ASM support ID is an
// opaque correlation reference, NOT an encoding of the violations. The syslog
// line carries `support_id="..."` as a separate field alongside the actual
// `violations="..."` list and `violation_rating`. So the useful move is to read
// the whole log entry (which contains everything), surface the support ID for
// correlation, and hand the violations to triage. This never decodes the
// support-ID number itself, because that number does not carry the violations.
//
// The remediation for each violation lives in the false-positive triage tool;
// this tool is the parser, the rating verdict, and the bridge to it. Pure,
// decode-only (D-49): it never contacts a BIG-IP and never fetches.
//
// Sources (see index.ts): F5 ASM logging field reference (syslog key-value and
// CEF formats: policy_name, violations, support_id, violation_rating,
// request_status, ip_client, method, protocol, uri, attack_type); the ASM
// violation names; and the violation-rating scale (4-5 attack, 1-2 false
// positive) from the ASM reporting documentation.
// ============================================================================

import type { ViolationCategory } from "../f5-awaf-false-positive-triage/compute";

const MAX_INPUT = 100_000;

export type LogFormat = "kv" | "cef" | "unknown";
export type RequestStatus = "blocked" | "alarmed" | "passed" | "unknown";
export type Verdict = "likely-fp" | "investigate" | "likely-attack" | "no-rating";

export interface ParsedViolation {
  readonly name: string;
  readonly category: ViolationCategory | "unknown";
}

export interface LogFields {
  readonly policyName: string | null;
  readonly supportId: string | null;
  readonly status: RequestStatus;
  readonly violationRating: number | null;
  readonly clientIp: string | null;
  readonly method: string | null;
  readonly protocol: string | null;
  readonly uri: string | null;
  readonly attackType: string | null;
  readonly xForwardedFor: string | null;
}

export interface LogResult {
  readonly format: LogFormat;
  readonly fields: LogFields;
  readonly violations: readonly ParsedViolation[];
  readonly verdict: Verdict;
  readonly notes: readonly LogNote[];
}

export type LogNote =
  | { kind: "no-rating" }
  | { kind: "rating-attack"; rating: number }
  | { kind: "rating-fp"; rating: number }
  | { kind: "rating-investigate"; rating: number }
  | { kind: "unparsed" }
  | { kind: "support-id-opaque" }
  | { kind: "bridge-to-triage" };

// ASM violation-name -> triage category. Matched by prefix (longest first),
// because many violations share a stem ("Illegal meta character in ...").
const VIOLATION_MAP: { prefix: string; category: ViolationCategory }[] = [
  { prefix: "Attack signature detected", category: "attack-signature" },
  { prefix: "Illegal meta character", category: "meta-char" },
  { prefix: "Illegal URL length", category: "length" },
  { prefix: "Illegal request length", category: "length" },
  { prefix: "Illegal query string length", category: "length" },
  { prefix: "Illegal POST data length", category: "length" },
  { prefix: "Illegal header length", category: "length" },
  { prefix: "Illegal cookie length", category: "length" },
  { prefix: "Illegal parameter value length", category: "length" },
  { prefix: "Illegal parameter data type", category: "parameter" },
  { prefix: "Illegal parameter numeric value", category: "parameter" },
  { prefix: "Illegal parameter", category: "parameter" },
  { prefix: "Parameter value does not comply", category: "parameter" },
  { prefix: "Illegal static parameter value", category: "parameter" },
  { prefix: "Illegal URL", category: "url" },
  { prefix: "Illegal file type", category: "file-type" },
  { prefix: "Illegal file upload", category: "file-upload-signature" },
  { prefix: "Malformed JSON data", category: "xml-json-signature" },
  { prefix: "Malformed XML data", category: "xml-json-signature" },
  { prefix: "JSON data does not comply", category: "xml-json-signature" },
  { prefix: "XML data does not comply", category: "xml-json-signature" },
  { prefix: "Modified ASM cookie", category: "cookie" },
  { prefix: "Modified domain cookie", category: "cookie" },
  { prefix: "Illegal cookie", category: "cookie" },
  { prefix: "Cookie not RFC-compliant", category: "cookie" },
  { prefix: "HTTP protocol compliance failed", category: "http-compliance" },
  { prefix: "Bad HTTP version", category: "http-compliance" },
  { prefix: "Unparsable request content", category: "http-compliance" },
  { prefix: "Illegal HTTP status", category: "http-compliance" },
  { prefix: "Evasion technique detected", category: "attack-signature" },
];

function classifyViolation(name: string): ViolationCategory | "unknown" {
  const n = name.trim();
  for (const { prefix, category } of VIOLATION_MAP) {
    if (n.toLowerCase().startsWith(prefix.toLowerCase())) return category;
  }
  return "unknown";
}

// --- field extraction helpers ---------------------------------------------

/** key="value" or key=value (until comma or whitespace) extraction. */
function kvGet(raw: string, key: string): string | null {
  // Prefer quoted form: key="..."
  const q = new RegExp(`${key}\\s*=\\s*"([^"]*)"`, "i").exec(raw);
  if (q) return q[1];
  // Unquoted: key=token (stop at comma; CEF stops at next " key=")
  const u = new RegExp(`${key}\\s*=\\s*([^,\\n]+?)(?:\\s+[A-Za-z0-9_]+=|,|$)`, "i").exec(raw);
  return u ? u[1].trim() : null;
}

function statusOf(raw: string | null): RequestStatus {
  if (!raw) return "unknown";
  const s = raw.toLowerCase();
  if (s.includes("block")) return "blocked";
  if (s.includes("alarm")) return "alarmed";
  if (s.includes("pass") || s.includes("allow")) return "passed";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------
export function parseAsmLog(input: string): LogResult | null {
  const raw0 = input.trim();
  if (!raw0) return null;
  const raw = raw0.length > MAX_INPUT ? raw0.slice(0, MAX_INPUT) : raw0;

  const isCef = /\bCEF:\d\|/.test(raw) || /\|F5\|ASM\|/.test(raw);
  const format: LogFormat = isCef ? "cef" : /ASM:|policy_name\s*=|support_id\s*=/i.test(raw) ? "kv" : "unknown";

  const notes: LogNote[] = [];
  if (format === "unknown") {
    notes.push({ kind: "unparsed" });
  }

  // Both formats are key=value at heart; CEF uses different key names.
  const supportId = kvGet(raw, "support_id") ?? kvGet(raw, "externalId") ?? kvGet(raw, "suid");
  const policyName = kvGet(raw, "policy_name") ?? cefLabelled(raw, "policy_name");
  const statusRaw = kvGet(raw, "request_status") ?? kvGet(raw, "act");
  const ratingRaw = kvGet(raw, "violation_rating") ?? cefLabelled(raw, "violation_rating");
  const clientIp = kvGet(raw, "ip_client") ?? kvGet(raw, "src");
  const method = kvGet(raw, "method") ?? kvGet(raw, "requestMethod");
  const protocol = kvGet(raw, "protocol") ?? kvGet(raw, "app");
  const uri = kvGet(raw, "uri") ?? kvGet(raw, "request");
  const attackType = kvGet(raw, "attack_type") ?? cefLabelled(raw, "attack_type");
  const xff = kvGet(raw, "x_forwarded_for_header_value") ?? cefLabelled(raw, "x_forwarded_for");

  const rating = ratingRaw && /^\d+$/.test(ratingRaw.trim()) ? parseInt(ratingRaw.trim(), 10) : null;

  const fields: LogFields = {
    policyName, supportId, status: statusOf(statusRaw), violationRating: rating,
    clientIp, method, protocol, uri, attackType, xForwardedFor: xff,
  };

  // Violations: the `violations` field is a comma-separated list.
  const violationsRaw = kvGet(raw, "violations");
  const violations: ParsedViolation[] = [];
  if (violationsRaw) {
    for (const part of violationsRaw.split(",")) {
      const name = part.trim();
      if (name) violations.push({ name, category: classifyViolation(name) });
    }
  }

  // Verdict from the rating.
  let verdict: Verdict;
  if (rating === null) {
    verdict = "no-rating";
    notes.push({ kind: "no-rating" });
  } else if (rating >= 4) {
    verdict = "likely-attack";
    notes.push({ kind: "rating-attack", rating });
  } else if (rating === 3) {
    verdict = "investigate";
    notes.push({ kind: "rating-investigate", rating });
  } else {
    verdict = "likely-fp";
    notes.push({ kind: "rating-fp", rating });
  }

  if (supportId) notes.push({ kind: "support-id-opaque" });
  if (violations.length > 0) notes.push({ kind: "bridge-to-triage" });

  return { format, fields, violations, verdict, notes };
}

// CEF encodes custom fields as csN=value with a companion csNLabel=label.
// This resolves a value by its label (e.g. policy_name, attack_type).
function cefLabelled(raw: string, label: string): string | null {
  // find csNLabel=<label>, then read the matching csN=value
  const lblRe = new RegExp(`(cs\\d|c6a\\d|cn\\d)Label=${label}\\b`, "i");
  const m = lblRe.exec(raw);
  if (!m) return null;
  const field = m[1];
  return kvGet(raw, field);
}

export { classifyViolation };
