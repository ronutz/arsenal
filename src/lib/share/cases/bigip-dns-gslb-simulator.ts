// ============================================================================
// src/lib/share/cases/bigip-dns-gslb-simulator.ts
// ----------------------------------------------------------------------------
// Share cases of the BIG-IP DNS GSLB simulator: a form, so the link carries
// named values only (method, region, requests, pools, members), and an arrival
// replaces the whole form; anything the form would not hold is refused.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { GSLB_SIM_SHARE, type GslbSharePool, type GslbSimShareState } from "../../tools/bigip-dns-gslb-simulator/share"; // the spec

/** The page's Example pools (BigipDnsGslbSimulatorTool's EXAMPLE). */
const EXAMPLE_POOLS: GslbSharePool[] = [
  { id: "pool-americas", ratio: 2, region: "na", up: true, method: "round-robin", members: [{ id: "vs-sfo", ratio: 1, region: "na", up: true }, { id: "vs-nyc", ratio: 1, region: "na", up: true }] },
  { id: "pool-emea", ratio: 1, region: "eu", up: true, method: "ratio", members: [{ id: "vs-lon", ratio: 3, region: "eu", up: true }, { id: "vs-fra", ratio: 1, region: "eu", up: true }] },
];
/** The Example's pools value: one line per pool. */
const EXAMPLE_POOL_LINES = "pool-americas\t2\tna\t1\tround-robin\npool-emea\t1\teu\t1\tratio"; // exact
/** The Example's members value: one line per member, its pool's number first. */
const EXAMPLE_MEMBER_LINES = "1\tvs-sfo\t1\tna\t1\n1\tvs-nyc\t1\tna\t1\n2\tvs-lon\t3\teu\t1\n2\tvs-fra\t1\teu\t1"; // exact

/** A form after Clear and some typing: an empty client region, a pool down, a member down, a dynamic member method. */
const EDITED: GslbSimShareState = {
  poolMethod: "global-availability", clientRegion: "", requests: 7,
  pools: [
    { id: "pool-1", ratio: 1, region: "", up: false, method: "round-robin", members: [{ id: "vs-1", ratio: 1, region: "", up: true }] },
    { id: "dc 2 & co", ratio: 4, region: "ap-south", up: true, method: "qos", members: [{ id: "vs=a", ratio: 2, region: "ap", up: false }, { id: "vs#b", ratio: 1, region: "", up: true }] },
  ],
};

/** The cases. */
export const GSLB_SIM_SHARE_CASES = defineShareCases<GslbSimShareState, GslbSimShareState>({
  spec: GSLB_SIM_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { poolMethod: "topology", clientRegion: "eu", requests: 100, pools: EXAMPLE_POOLS }, params: { method: "topology", region: "eu", requests: "100", pools: EXAMPLE_POOL_LINES, members: EXAMPLE_MEMBER_LINES }, restored: { poolMethod: "topology", clientRegion: "eu", requests: 100, pools: EXAMPLE_POOLS } }, // the page as it opens
    { id: "edited", state: EDITED, params: { method: "global-availability", region: "", requests: "7", pools: "pool-1\t1\t\t0\tround-robin\ndc 2 & co\t4\tap-south\t1\tqos", members: "1\tvs-1\t1\t\t1\n2\tvs=a\t2\tap\t0\n2\tvs#b\t1\t\t1" }, restored: EDITED }, // an empty region is left out of the link and comes back empty
    { id: "dynamic-wide-ip", state: { poolMethod: "lowest-round-trip-time", clientRegion: "na", requests: 50, pools: [EXAMPLE_POOLS[0]] }, params: { method: "lowest-round-trip-time", region: "na", requests: "50", pools: "pool-americas\t2\tna\t1\tround-robin", members: "1\tvs-sfo\t1\tna\t1\n1\tvs-nyc\t1\tna\t1" }, restored: { poolMethod: "lowest-round-trip-time", clientRegion: "na", requests: 50, pools: [EXAMPLE_POOLS[0]] } }, // explained, not simulated: still a result
  ],
  arrive: [ // decode only
    { id: "members-out-of-order", values: { method: "ratio", region: null, requests: "10", pools: "a\t1\t\t1\tround-robin\nb\t1\t\t1\tround-robin", members: "2\tb1\t1\t\t1\n1\ta1\t1\t\t1\n2\tb2\t1\t\t1" }, restored: { poolMethod: "ratio", clientRegion: "", requests: 10, pools: [{ id: "a", ratio: 1, region: "", up: true, method: "round-robin", members: [{ id: "a1", ratio: 1, region: "", up: true }] }, { id: "b", ratio: 1, region: "", up: true, method: "round-robin", members: [{ id: "b1", ratio: 1, region: "", up: true }, { id: "b2", ratio: 1, region: "", up: true }] }] } }, // grouped by pool number, each pool's own order kept
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "no-pools", state: { poolMethod: "round-robin", clientRegion: "", requests: 100, pools: [] } }, // the engine asks for a pool
    { id: "pool-without-members", state: { poolMethod: "round-robin", clientRegion: "", requests: 100, pools: [{ ...EXAMPLE_POOLS[0], members: [] }] } }, // the form never leaves one
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "unknown-method", values: { method: "fastest", region: "eu", requests: "100", pools: EXAMPLE_POOL_LINES, members: EXAMPLE_MEMBER_LINES } }, // an LTM method, not a GSLB one
    { id: "unknown-pool-method", values: { method: "topology", region: "eu", requests: "100", pools: "p\t1\t\t1\tround-robin-ish", members: "1\tm\t1\t\t1" } }, // not offered
    { id: "member-without-pool", values: { method: "topology", region: "eu", requests: "100", pools: EXAMPLE_POOL_LINES, members: `${EXAMPLE_MEMBER_LINES}\n3\tvs-x\t1\t\t1` } }, // there is no third pool
    { id: "pool-left-empty", values: { method: "topology", region: "eu", requests: "100", pools: EXAMPLE_POOL_LINES, members: "1\tvs-sfo\t1\tna\t1" } }, // the second pool has no member
    { id: "up-not-a-switch", values: { method: "topology", region: "eu", requests: "100", pools: "p\t1\t\tyes\tround-robin", members: "1\tm\t1\t\t1" } }, // 1 or 0 only
    { id: "four-fields", values: { method: "topology", region: "eu", requests: "100", pools: "p\t1\t\t1", members: "1\tm\t1\t\t1" } }, // a pool line needs five
    { id: "ratio-zero", values: { method: "topology", region: "eu", requests: "100", pools: "p\t0\t\t1\tround-robin", members: "1\tm\t1\t\t1" } }, // ratios start at 1
    { id: "missing-requests", values: { method: "topology", region: "eu", requests: null, pools: EXAMPLE_POOL_LINES, members: EXAMPLE_MEMBER_LINES } }, // required
    { id: "too-many-pools", values: { method: "round-robin", region: null, requests: "1", pools: Array.from({ length: 31 }, (_, i) => `p${i}\t1\t\t1\tround-robin`).join("\n"), members: Array.from({ length: 31 }, (_, i) => `${i + 1}\tm\t1\t\t1`).join("\n") } }, // more than 30
  ],
});
