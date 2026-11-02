// ============================================================================
// src/lib/tools/f5xc-security-event-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC security event explainer (posture
// "derived", raised on 2026-11-01 from the inventory's "input-caution"). F5's
// Security Events Reference (docs.cloud.f5.com/docs-v2/platform/reference/
// security-events-reference, last modified 2026-10-28, read 2026-11-01) lists
// what an event can carry: req_headers ("Request headers"), req_body
// ("Request body"), req_parameters, user ("User identifier as configured in
// User Identification Policy"), tenant, and the client's address and
// location. Request headers hold cookies and Authorization values, a body
// can hold a password. The page reads a fixed set of fields. So a link
// carries a COPY of the event holding only those fields:
//   - the event's type and name, action, result and recommendation;
//   - the request context the page shows (method, host, path, client
//     address, load balancer and its type, namespace, request id, time);
//   - the reason: each signature's id, name, accuracy and attack type (never
//     its matching_info, which can quote the request), each violation's name
//     and context, the attack types, the bot classification and verdict, the
//     service policy and rule, the API policy, rule, result and OpenAPI
//     statuses;
//   - nothing else: headers, body, parameters, user, tenant, location, TLS
//     fingerprints and the rest stay out. An envelope ({ message }, an
//     { events } page, a list) gives the one event the page reads.
// The copy is read again by the page's own decoder and must give the same
// reading, or there is no link (code "copy"); then the site's check (with
// the F5 XC findings) reads it: a credential in a field the page shows (a
// token in a path) blocks the link (code "secret"), a secret-looking name
// with a value is named in a maybe line. A caution line says what the copy
// still names: host, path, client address, load balancer and namespace.
//
// Arrival: the copy fills the box as a paste would, and the page reads it.
// Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { explainSecurityEvent, type SecEventView } from "./compute"; // the page's own decoder
import { blockedBySecret, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check: the blocked encoding
import { checkXcBox } from "../f5xc-object-linter/xc-share-secrets"; // the site's check with the F5 XC findings
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding; the copy on arrival). */
export interface SecEventShareState {
  /** The box. */
  input: string;
}

/** The top-level fields the decoder reads as text (strings or numbers), in the order a copy writes them. */
const TOP_TEXT: readonly string[] = Object.freeze([
  "sec_event_type", "sec_event_name", "action", "calculated_action", "recommended_action", "result", // what happened
  "method", "authority", "domain", "req_path", "original_path", "api_endpoint", "uri", "src_ip", "src", // the request
  "vh_name", "vh_type", "namespace", "req_id", "support_id", "time", "@timestamp", // where and when
  "policy", "policy_rule", "policy_set", "rate_limiter_action", "malicious_user_mitigation_action", // service policy
  "oas_req_status", "oas_rsp_status", // API validation
]); // TOP_TEXT

/** The members the decoder reads inside each object it reads. */
const INNER: Readonly<Record<string, readonly string[]>> = Object.freeze({
  signatures: ["id", "name", "id_name", "accuracy", "attack_type"], // decodeSignatures
  violations: ["name", "context"], // decodeViolations
  bot_defense: ["insight", "automation_type", "recommendation"], // the bot verdict
  bot_info: ["classification"], // the WAF event's bot classification
  policy_hits: ["policy", "policy_rule", "result"], // the API policy hit
}); // INNER

/**
 * Whether a parsed JSON value is a plain object.
 * @param v any parsed value
 * @returns true for an object that is not an array or null
 */
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v); // a plain object
} // isObj

/**
 * The members an object keeps in a copy: the named ones whose value the decoder reads (a string or a number).
 * @param o the object
 * @param names the members it reads
 * @returns a new object with those members only
 */
function keep(o: Record<string, unknown>, names: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}; // the kept members
  for (const n of names) if (typeof o[n] === "string" || typeof o[n] === "number") out[n] = o[n]; // text the decoder reads
  return out; // the object
} // keep

/**
 * The event object the page reads, across the envelopes it accepts (as the decoder locates it).
 * @param root the parsed paste
 * @returns the event, or null
 */
function locate(root: unknown): Record<string, unknown> | null {
  if (isObj(root)) { // an object
    if (typeof root.message === "string") { try { const inner = JSON.parse(root.message); if (isObj(inner)) return inner; } catch { /* not JSON: the object itself */ } } // { message: "<json>" }
    if (Array.isArray(root.events) && root.events.length && isObj(root.events[0])) return root.events[0] as Record<string, unknown>; // { events: [...] }: the first
    return root; // the event itself
  } // object
  if (Array.isArray(root) && root.length && isObj(root[0])) return root[0] as Record<string, unknown>; // a list: the first
  return null; // none
} // locate

/**
 * The copy of an event: only the fields the page reads, as an indented JSON object.
 * @param input the box as pasted
 * @returns the copy, or null when the box is not JSON or holds no event object
 */
export function secEventCopyText(input: string): string | null {
  let root: unknown; // the parsed paste
  try { root = JSON.parse(input.trim()); } catch { return null; } // not JSON
  const o = locate(root); // the event
  if (!o) return null; // none
  const copy: Record<string, unknown> = keep(o, TOP_TEXT); // the text fields
  for (const k of ["signatures", "violations"]) { const a = o[k]; if (Array.isArray(a)) copy[k] = a.filter(isObj).map((e) => keep(e, INNER[k])); } // lists of objects: the members read
  const at = o.attack_types; // a list or a comma-separated string
  if (Array.isArray(at)) copy.attack_types = at.filter((x) => typeof x === "string" || typeof x === "number"); else if (typeof at === "string" || typeof at === "number") copy.attack_types = at; // as read
  for (const k of ["bot_defense", "bot_info"]) { const b = o[k]; if (isObj(b)) copy[k] = keep(b, INNER[k]); } // objects: the members read
  if (o.policy_hits !== undefined) copy.policy_hits = isObj(o.policy_hits) ? keep(o.policy_hits, INNER.policy_hits) : null; // its presence matters; an object's members are read
  return JSON.stringify(copy, null, 2); // indented, as the page's Example is
} // secEventCopyText

/** What the share of an event comes to: the copy and its check, or why there is none. */
export type SecEventShareCopy =
  | { ok: true; copy: string; report: ShareSecretReport } // the copy and the check on it
  | { ok: false; code: "empty" | "copy" }; // nothing read, or a copy that would read differently

/**
 * Make the copy of an event and check it (the page calls this once per change, with its own reading).
 * @param input the box as pasted
 * @param r the page's reading (null when there is none)
 * @returns the copy and its check, or why there is none
 */
export function secEventShareCopy(input: string, r: SecEventView | null): SecEventShareCopy {
  if (!r || !r.recognized) return { ok: false, code: "empty" }; // nothing read
  const copy = secEventCopyText(input); // the copy
  if (copy === null || JSON.stringify(explainSecurityEvent(copy)) !== JSON.stringify(r)) return { ok: false, code: "copy" }; // it must read the same
  return { ok: true, copy, report: checkXcBox(copy) }; // checked
} // secEventShareCopy

/**
 * The encoding of a copy the page already made.
 * @param c the copy and its check
 * @returns the copy, nothing, or blocked
 */
export function encodeSecEventShare(c: SecEventShareCopy): ShareEncoding {
  if (!c.ok) return c.code === "empty" ? { ok: false, reason: "empty" } : { ok: false, reason: "blocked", code: "copy" }; // nothing, or why not
  return blockedBySecret(c.report.secrets) ?? { ok: true, params: { input: c.copy } }; // blocked, or the copy
} // encodeSecEventShare

/** The spec. */
export const SEC_EVENT_SHARE: ShareSpec<SecEventShareState> = Object.freeze({
  tool: "f5xc-security-event-explainer", // the slug
  posture: "derived", // a copy holding only the fields the page reads, never the event as pasted
  carriesKey: "share.carries", // tools.f5xc-security-event-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec reads, copies and checks itself). */
  encode(s: SecEventShareState): ShareEncoding {
    const r = s.input.trim() === "" ? null : explainSecurityEvent(s.input); // the reading
    return encodeSecEventShare(secEventShareCopy(s.input, r)); // copied, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): SecEventShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
