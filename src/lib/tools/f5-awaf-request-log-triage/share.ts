// ============================================================================
// src/lib/tools/f5-awaf-request-log-triage/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the AWAF request-log triage (posture "derived",
// raised from "input" on 2026-10-27): a link never carries the log line as
// pasted. An ASM log line can hold the whole request: F5's field reference
// ("Fields in ASM Violations event messages", BIG-IP 16.0, the latest
// edition published, read 2026-10-27) lists request ("Request string sent by
// client", its headers included, so a Cookie or Authorization line), headers,
// query_string, response, username and session_id beside the fields this page
// reads; the CEF form carries the request as cs3 (full_request). A cookie
// carries a session identifier (RFC 6265 section 8.4) and an Authorization
// value "consists of credentials" (RFC 9110 section 11.6.2), and neither can
// be cut out of a free-form line safely.
//
// So the link carries a COPY rebuilt from the fields the page reads and shows:
// the policy, the violations, the rating, the support ID, the status, the
// client address, the method, the protocol, the URI, the attack type and the
// X-Forwarded-For value, written as the syslog key-value form F5 documents
// (key="value", in F5's order), after "ASM:" for a key-value line and after a
// bare CEF header ("CEF:0|F5|ASM|||||") for a CEF line, so the page shows the
// same format. Everything else stays out: the request, its headers and body,
// the query string, the response, the user name, the session, the host
// names. Before a link is offered:
//   1. the copy is read by the page's own parser and must give the same
//      reading (format, fields, violations, verdict, notes); if it ever did
//      not, no link is offered (code "copy"), never a link that opens
//      something else;
//   2. the copy goes through the family's secrets check: a credential still in
//      a field the page shows (a token or password in the URI, a header that
//      the engine read as the URI) blocks the link (code "secret"), and a
//      secret-looking name is named in the caution line.
// Text that is not an ASM log line has no fields to copy: no link (code
// "unparsed"). The popover's caution line says the client address and the
// URI go with the copy.
//
// Arrival: the copy fills the box as a paste would and the page reads it.
// Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { parseAsmLog, type LogResult } from "./compute"; // the page's own parser
import { findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the family's secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the copy on arrival). */
export interface LogTriageShareState {
  /** The box as pasted. */
  input: string;
}

/** The status words the copy writes for each status the page reads (each reads back as itself). */
const STATUS_WORD: Readonly<Record<string, string>> = { blocked: "blocked", alarmed: "alarmed", passed: "passed", unknown: "unknown" }; // always written, so the parser never falls back to an "act=" inside another value

/**
 * One key-value pair as the parser reads it back: quoted when the value holds no double quote (the parser's
 * quoted form), bare otherwise (such a value came from the bare form, so it holds no comma, no line break and no
 * " key=" and reads back whole).
 * @param key the field's key
 * @param value its value
 * @returns the pair
 */
function pair(key: string, value: string): string {
  return value.includes('"') ? `${key}=${value}` : `${key}="${value}"`; // the form the value reads back from
} // pair

/**
 * The copy of a log line: only the fields the page read, in F5's key-value form, after the format's marker. Quoted
 * pairs come first, in F5's order, and bare pairs (values holding a double quote) after them, so the parser's search
 * for a quoted key="..." never meets one inside a bare value before the key's own pair.
 * @param r the page's reading of the line (key-value or CEF; not "unknown")
 * @returns the copy
 */
export function shareableLogLine(r: LogResult): string {
  const f = r.fields; // the fields the page read
  const pairs: string[] = []; // the copy's quoted pairs
  const bare: string[] = []; // its bare pairs, written last
  const add = (key: string, value: string | null): void => { if (value !== null) (value.includes('"') ? bare : pairs).push(pair(key, value)); }; // a field the line had
  add("policy_name", f.policyName); // the policy
  add("violations", r.violations.length > 0 ? r.violations.map((v) => v.name).join(",") : null); // the violations, as the list the page split
  add("violation_rating", f.violationRating !== null ? String(f.violationRating) : null); // the rating
  add("support_id", f.supportId); // the support ID
  add("request_status", STATUS_WORD[f.status]); // the status, as a word that reads back as itself ("unknown" too)
  add("ip_client", f.clientIp); // the client address
  add("method", f.method); // the method
  add("protocol", f.protocol); // the protocol
  add("uri", f.uri); // the URI
  add("attack_type", f.attackType); // the attack type
  add("x_forwarded_for_header_value", f.xForwardedFor); // the X-Forwarded-For value
  return `${r.format === "cef" ? "CEF:0|F5|ASM|||||" : "ASM:"}${[...pairs, ...bare].join(",")}`; // the marker of the format the page showed, then the pairs
} // shareableLogLine

/** What the share of a reading comes to: the copy and its check, or why there is none. */
export type LogShareCopy =
  | { ok: true; copy: string; report: ShareSecretReport } // the copy and what the check found in it
  | { ok: false; code: "empty" | "unparsed" | "copy" }; // nothing read, not a log line, or a copy that would read differently

/**
 * Make the copy of a reading and check it (the page calls this once per change, for the button and the caution).
 * @param r the page's reading (null for a blank box)
 * @returns the copy and its check, or why there is none
 */
export function logShareCopy(r: LogResult | null): LogShareCopy {
  if (!r) return { ok: false, code: "empty" }; // a blank box
  if (r.format === "unknown") return { ok: false, code: "unparsed" }; // no fields to copy
  const copy = shareableLogLine(r); // the copy
  if (JSON.stringify(parseAsmLog(copy)) !== JSON.stringify(r)) return { ok: false, code: "copy" }; // it must read exactly the same
  return { ok: true, copy, report: findShareSecrets(copy) }; // checked
} // logShareCopy

/**
 * The encoding of a copy the page already made.
 * @param c the copy and its check
 * @returns the copy, nothing, or blocked
 */
export function encodeLogShare(c: LogShareCopy): ShareEncoding {
  if (!c.ok) return c.code === "empty" ? { ok: false, reason: "empty" } : { ok: false, reason: "blocked", code: c.code }; // nothing, or why not
  const s = c.report.secrets[0]; // the first credential still in the copy, if any
  if (s) return { ok: false, reason: "blocked", code: "secret", values: { label: s.label, more: c.report.secrets.length - 1 } }; // no link
  return { ok: true, params: { input: c.copy } }; // the copy
} // encodeLogShare

/** The spec. */
export const LOG_TRIAGE_SHARE: ShareSpec<LogTriageShareState> = Object.freeze({
  tool: "f5-awaf-request-log-triage", // the slug
  posture: "derived", // a copy of the fields the page reads, never the line as pasted
  carriesKey: "share.carries", // tools.f5-awaf-request-log-triage.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec reads the box itself). */
  encode(s: LogTriageShareState): ShareEncoding {
    return encodeLogShare(logShareCopy(parseAsmLog(s.input))); // read, copied, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): LogTriageShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
