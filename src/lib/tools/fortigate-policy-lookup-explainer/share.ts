// ============================================================================
// src/lib/tools/fortigate-policy-lookup-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiGate firewall policy lookup explainer
// (posture "derived", raised from "input" on 2026-11-01). The page reads the
// policies of a "config firewall policy" paste (or a table) and a packet:
// line, and skips everything else, so a whole configuration pasted here still
// gets a reading, with the pre-shared keys, passwords, SNMP communities and
// ENC values of its other sections in the box (the rules and their sources
// are in ../fortios-cli-config-explainer/fortios-secrets.ts). A link carries
// a COPY with each such value replaced by a numbered mark; the page never
// reads those settings, so the lookup reads exactly the same. A value that
// runs past its line (a PEM key in quotes) blocks the link, as does any
// credential the site's check still finds in the copy. The copy keeps the
// interface, address and policy names (the manifest: "internal interface
// names, object names and topology"): the popover adds a caution line. No
// reveal switch (see the CLI explainer's spec).
//
// Arrival: the copy fills the box as a paste would and the page runs the
// lookup. Any non-blank text with nothing left to replace is accepted.
// ============================================================================

import { run, type LookupResult } from "./compute"; // the page's own lookup (throws only on oversized input)
import { encodeFortiosCopy, fortiosShareCopy, isFortiosCopy } from "../fortios-cli-config-explainer/fortios-secrets"; // the FortiOS copy and check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the copy on arrival). */
export interface PolicyLookupShareState {
  /** The box as pasted. */
  input: string;
} // PolicyLookupShareState

/**
 * Whether the page has a reading to share: at least one policy read (with or without a packet).
 * @param r the page's result, or null
 * @returns true when policies were read
 */
export function policyLookupHasReading(r: LookupResult | null): boolean {
  return !!r && r.mode === "lookup" && r.policies.length > 0; // policies read
} // policyLookupHasReading

/**
 * The page's result without throwing (an oversized box is refused with a message).
 * @param input the box
 * @returns the result, or null
 */
function reading(input: string): LookupResult | null {
  try { return run(input).result; } catch { return null; } // no result
} // reading

/** The spec. */
export const FORTIGATE_POLICY_LOOKUP_SHARE: ShareSpec<PolicyLookupShareState> = Object.freeze({
  tool: "fortigate-policy-lookup-explainer", // the slug
  posture: "derived", // a copy with every FortiOS secret value replaced, never the paste
  carriesKey: "share.carries", // tools.fortigate-policy-lookup-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec reads and copies the box itself). */
  encode(s: PolicyLookupShareState): ShareEncoding {
    return encodeFortiosCopy(policyLookupHasReading(reading(s.input)) ? fortiosShareCopy(s.input) : null); // read, copied, checked, encoded
  },
  /** Any non-blank text with nothing left to replace: the page runs the lookup as on a paste. */
  decode(v: Readonly<Record<string, string | null>>): PolicyLookupShareState | null {
    return v.input && v.input.trim() !== "" && isFortiosCopy(v.input) ? { input: v.input } : null; // a copy, or nothing
  },
});
