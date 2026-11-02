// ============================================================================
// src/lib/tools/zscaler-firewall-rule-order-simulator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the ZIA firewall rule-order simulator
// (posture "input-caution", as the inventory has it; the manifest: "rule
// names and addresses can identify infrastructure"). The box holds rule
// lines (order | name | action | tokens), a default: line and a flow: line,
// so a link carries it as pasted with a caution line. Before a link is
// offered, the shared text check (src/lib/share/text-secrets.ts) reads it,
// since rule names and comment lines are free text: a credential blocks the
// link (code "secret"; the popover names its line), and a value whose name
// only looks like a secret is named in the caution line instead.
//
// Arrival: the box fills as a paste would and the page reads it (nothing is
// contacted). Any non-blank text without a credential is accepted, as a
// paste is (the page shows its own line-anchored error for text it cannot
// read); one holding a credential is a link this encoder never builds, and
// is ignored.
// ============================================================================

import { run, type SimResult } from "./compute"; // the page's own reading (throws a line-anchored error on text it cannot read)
import { encodeCheckedBox, findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the shared text check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface ZiaFirewallShareState {
  /** The box as pasted. */
  input: string;
} // ZiaFirewallShareState

/**
 * The page's reading of a box, as the page computes it (on the trimmed text), or null where the page shows an error.
 * @param input the box
 * @returns the reading, or null
 */
export function shareReading(input: string): SimResult | null {
  const trimmed = input.trim(); // the page reads the trimmed text
  if (trimmed === "") return null; // nothing pasted
  try { return run(trimmed); } catch { return null; } // the page shows its error instead
} // shareReading

/**
 * Encode from what the page already computed (its reading and the check's report).
 * @param input the box as pasted
 * @param report the check's report on the box, or null while the page has no reading
 * @returns the box, nothing, or blocked (code "secret", the first line and how many more)
 */
export function encodeShare(input: string, report: ShareSecretReport | null): ShareEncoding {
  if (!report) return { ok: false, reason: "empty" }; // no reading: the button is disabled
  return encodeCheckedBox(input, report); // blocked by a credential, or the box as pasted
} // encodeShare

/** The spec. */
export const ZSCALER_FIREWALL_RULE_ORDER_SHARE: ShareSpec<ZiaFirewallShareState> = Object.freeze({
  tool: "zscaler-firewall-rule-order-simulator", // the slug
  posture: "input-caution", // the box as pasted, with a caution line of the tool's own, after the shared check
  carriesKey: "share.carries", // tools.zscaler-firewall-rule-order-simulator.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: ZiaFirewallShareState): ShareEncoding {
    return encodeShare(s.input, shareReading(s.input) ? findShareSecrets(s.input) : null); // read, checked, encoded
  },
  /** Any non-blank text without a credential: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): ZiaFirewallShareState | null {
    return v.input && v.input.trim() !== "" && findShareSecrets(v.input).secrets.length === 0 ? { input: v.input } : null; // the text, or nothing
  },
});
