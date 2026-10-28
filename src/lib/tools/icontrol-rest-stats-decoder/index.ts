// ============================================================================
// The {manifest, run, vectors} triple for the iControl REST stats decoder.
// A pure local JSON transform: nothing is fetched and nothing leaves the page.
// ============================================================================

export { decodeStats, statsToText, run, StatsDecodeError } from "./compute";
export type { StatsDecode, StatEntry } from "./compute";
export { verifyVectors, STATS_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { StatsVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "icontrol-rest-stats-decoder",
  // Share results (2026-10-27): the response as pasted, after the "#"; share.ts.
  dangerousInputHandling: ["share-input"],
  learnLinks: [
    "learn/icontrol-rest-paths",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "icontrol-rest", label: "F5 iControl REST API reference", url: "https://clouddocs.f5.com/api/icontrol-rest/" }),
  ]),
});
