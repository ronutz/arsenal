// ============================================================================
// src/lib/tools/digital-transformation-tracker/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the digital transformation tracker (posture
// "input": the manifest's "safe", "filters carry no personal data").
//
// The tracker has no box: it is one curated, attributed dataset on a year rail,
// and the reader's whole input is two rows of filter chips (domains, and the
// certainty tiers that are the tool's organising principle). Its view is the
// thing worth sending ("the state domain, forecasts only"), so the link
// carries the two selections, by stable id, in the page's own order:
//   domains      the domain chips that are on, joined by ","
//   certainties  the certainty chips that are on, joined by ","
// Either may be empty (nothing on in that row means "all", as on the page); with
// both empty the view is the page as it opens, which the page's own Share
// button already links to, so there is nothing to share and the button waits.
// The milestones themselves never travel: the receiving page reads the same
// dataset, so the link stays short and a corrected row reaches old links too.
// Arrival: the chips are set and the rail redraws, as tapping them does.
// ============================================================================

import { CERTAINTIES, DOMAINS, type Certainty, type Domain } from "./milestones"; // the chips' ids, in the page's order
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The two selections. */
export interface TrackerShareState {
  /** The domain chips that are on (any order). */
  domains: Domain[];
  /** The certainty chips that are on (any order). */
  certainties: Certainty[];
}

/**
 * Read one row's value: ids joined by ",", each offered, none twice, in the page's order.
 * @param value the link's value, or null (none on)
 * @param ids the row's ids, in the page's order
 * @returns the ids, or null when malformed
 */
function readRow<T extends string>(value: string | null | undefined, ids: readonly T[]): T[] | null {
  if (value === null || value === undefined) return []; // none on
  const got = value.split(","); // the ids
  if (got.some((x) => !(ids as readonly string[]).includes(x)) || new Set(got).size !== got.length) return null; // unknown, empty or twice
  const ordered = ids.filter((x) => got.includes(x)); // the page's order
  return ordered.join(",") === value ? ordered : null; // the encoder writes that order only
} // readRow

/** The spec. */
export const TRACKER_SHARE: ShareSpec<TrackerShareState> = Object.freeze({
  tool: "digital-transformation-tracker", // the slug
  posture: "input", // two filter selections
  carriesKey: "share.carries", // tools.digital-transformation-tracker.share.carries
  names: ["domains", "certainties"], // a form: no "input"
  /** The two selections in the page's order; nothing while no chip is on. */
  encode(s: TrackerShareState): ShareEncoding {
    const d = DOMAINS.filter((x) => s.domains.includes(x)); // the page's order
    const c = CERTAINTIES.filter((x) => s.certainties.includes(x)); // the page's order
    if (d.length === 0 && c.length === 0) return { ok: false, reason: "empty" }; // the page as it opens
    const params: Record<string, string> = {}; // the values
    if (d.length > 0) params.domains = d.join(","); // a row with no chip on carries nothing
    if (c.length > 0) params.certainties = c.join(","); // the same
    return { ok: true, params }; // the view
  },
  /** Both rows strictly; a link with neither is malformed (the encoder never builds one). */
  decode(v: Readonly<Record<string, string | null>>): TrackerShareState | null {
    const domains = readRow(v.domains, DOMAINS); // the domains
    const certainties = readRow(v.certainties, CERTAINTIES); // the tiers
    if (!domains || !certainties || (domains.length === 0 && certainties.length === 0)) return null; // malformed or empty
    return { domains, certainties }; // the view
  },
});
