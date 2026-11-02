// ============================================================================
// src/lib/tools/zcc-forwarding-decision-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the ZCC forwarding decision explainer
// (posture "input", as the inventory has it). The box holds the page's
// settings, one per line (network =, zia-action =, tunnel =, web-split =,
// zpa-action =), each value one of a few documented choices, and comment
// lines: no address, host, user or key. The manifest's note ("a pasted
// posture can describe an organization's forwarding design") names a design,
// not infrastructure, so no caution line is added; the standard warning
// stands. A link carries the box as pasted. Before a link is offered, the
// shared text check (src/lib/share/text-secrets.ts) reads it, since a
// comment line is free text: a credential blocks the link (code "secret";
// the popover names its line), and a value whose name only looks like a
// secret is named in one line of the popover.
//
// Arrival: the box fills as a paste would and the page reads it (nothing is
// contacted). Any non-blank text without a credential is accepted, as a
// paste is (the page shows its own line-anchored error for text it cannot
// read); one holding a credential is a link this encoder never builds, and
// is ignored.
// ============================================================================

import { run, type ExplainerResult } from "./compute"; // the page's own reading (throws a line-anchored error on text it cannot read)
import { encodeCheckedBox, findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the shared text check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface ZccShareState {
  /** The box as pasted. */
  input: string;
} // ZccShareState

/**
 * The page's reading of a box, as the page computes it (on the trimmed text), or null where the page shows an error.
 * @param input the box
 * @returns the reading, or null
 */
export function shareReading(input: string): ExplainerResult | null {
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
export const ZCC_FORWARDING_DECISION_SHARE: ShareSpec<ZccShareState> = Object.freeze({
  tool: "zcc-forwarding-decision-explainer", // the slug
  posture: "input", // the box as pasted, with the standard warning, after the shared check
  carriesKey: "share.carries", // tools.zcc-forwarding-decision-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: ZccShareState): ShareEncoding {
    return encodeShare(s.input, shareReading(s.input) ? findShareSecrets(s.input) : null); // read, checked, encoded
  },
  /** Any non-blank text without a credential: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): ZccShareState | null {
    return v.input && v.input.trim() !== "" && findShareSecrets(v.input).secrets.length === 0 ? { input: v.input } : null; // the text, or nothing
  },
});
