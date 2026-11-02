// ============================================================================
// src/lib/tools/f5xc-domain-sni-match-resolver/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC domain / SNI match resolver (posture
// "input-caution", raised on 2026-11-01 from the inventory's "input": the
// list names the load balancers and the domains they serve, which can be an
// organisation's internal hosts, and a pasted XC object can name tenants,
// namespaces and hosts; the brief of wave 4B calls for a caution, not a
// block). A link carries the list as pasted and the host name typed, once
// the page has a resolution. The resolution reads every name and domain, so
// nothing is cut out; a credential in either field blocks the link (the
// site's check, src/lib/share/text-secrets.ts, with the F5 XC findings of
// f5xc-object-linter/xc-share-secrets.ts), and a secret-looking name with a
// value is named in the caution line instead.
//
// Names: `input` (the list, JSON) and `host` (the test host name), both
// required.
//
// Arrival: both fields fill as a paste would, and the page resolves. Any
// non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { resolve, type LB } from "./compute"; // the page's own resolver
import { blockedBySecret, type ShareSecretFinding } from "../../share/text-secrets"; // the site's share check: the blocked encoding
import { checkXcBox } from "../f5xc-object-linter/xc-share-secrets"; // the site's check with the F5 XC findings
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the list and the host name. */
export interface DomainSniShareState {
  /** The load balancer list, as pasted (JSON). */
  input: string;
  /** The test host name, as typed. */
  host: string;
}

/**
 * The load balancers of a pasted list, exactly as the page reads them (an array, or { loadBalancers: [...] }; each
 * object's name, string domains and default flag), or null when the text is not such a list.
 * @param text the list as pasted
 * @returns the load balancers, or null
 */
export function lbListOf(text: string): LB[] | null {
  if (text.trim() === "") return null; // nothing pasted
  let j: unknown; // the parsed text
  try { j = JSON.parse(text); } catch { return null; } // not JSON: the page shows its parse error
  const o = j as { loadBalancers?: unknown } | null; // the envelope, if any
  const arr = Array.isArray(j) ? j : o && typeof o === "object" && Array.isArray(o.loadBalancers) ? o.loadBalancers : null; // the list
  if (!Array.isArray(arr)) return null; // not a list: the page shows its parse error
  return arr
    .filter((x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null) // objects only
    .map((x) => ({
      name: typeof x.name === "string" ? x.name : "(unnamed)", // as the page names an unnamed one
      domains: Array.isArray(x.domains) ? (x.domains as unknown[]).filter((d): d is string => typeof d === "string") : [], // string domains
      default: x.default === true, // the default flag
    })); // as the page reads them
} // lbListOf

/** The findings of both fields, tagged with the field they are in (the list first). */
export interface DomainSniShareCheck {
  /** Credentials, field by field. */
  secrets: (ShareSecretFinding & { field: string })[];
  /** Secret-looking names with a value, field by field. */
  maybe: (ShareSecretFinding & { field: string })[];
}

/**
 * Run the check on both fields.
 * @param s the state
 * @returns the findings, tagged
 */
export function checkDomainSni(s: DomainSniShareState): DomainSniShareCheck {
  const a = checkXcBox(s.input); // the list
  const b = checkXcBox(s.host); // the host name
  const tag = (field: string) => (f: ShareSecretFinding) => ({ ...f, field }); // with its field
  return { secrets: [...a.secrets.map(tag("input")), ...b.secrets.map(tag("host"))], maybe: [...a.maybe.map(tag("input")), ...b.maybe.map(tag("host"))] }; // both
} // checkDomainSni

/**
 * Encode from what the page already computed (whether it resolved, and the check of both fields).
 * @param s the state
 * @param resolved true when the page shows a resolution
 * @param check the findings of both fields
 * @returns both values, nothing, or blocked (values: field, line, label, more)
 */
export function encodeDomainSniShare(s: DomainSniShareState, resolved: boolean, check: DomainSniShareCheck): ShareEncoding {
  if (!resolved) return { ok: false, reason: "empty" }; // no resolution: nothing to share
  return blockedBySecret(check.secrets) ?? { ok: true, params: { input: s.input, host: s.host } }; // blocked, or both values
} // encodeDomainSniShare

/** The spec. */
export const DOMAIN_SNI_SHARE: ShareSpec<DomainSniShareState> = Object.freeze({
  tool: "f5xc-domain-sni-match-resolver", // the slug
  posture: "input-caution", // both fields as typed, with a caution line, after the check
  carriesKey: "share.carries", // tools.f5xc-domain-sni-match-resolver.share.carries
  names: ["input", "host"], // #input=&host=
  /** Both values, nothing, or blocked (the spec parses, resolves and checks itself). */
  encode(s: DomainSniShareState): ShareEncoding {
    const lbs = lbListOf(s.input); // the list, as the page reads it
    const resolved = lbs !== null && s.host.trim() !== "" && resolve(lbs, s.host).ok; // a resolution shows
    return encodeDomainSniShare(s, resolved, resolved ? checkDomainSni(s) : { secrets: [], maybe: [] }); // resolved, checked, encoded
  },
  /** Both values, each non-blank. */
  decode(v: Readonly<Record<string, string | null>>): DomainSniShareState | null {
    if (!v.input || v.input.trim() === "" || !v.host || v.host.trim() === "") return null; // both are needed
    return { input: v.input, host: v.host }; // the state
  },
});
