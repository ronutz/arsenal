// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/stp-election-calculator/costs.ts
// ----------------------------------------------------------------------------
// THE PATH COST TABLES AND THE VENDOR DEFAULTS of the spanning tree election
// calculator (08/11/2026), as data the engine, the page and the golden vectors
// share. Every value below is one a document read on 2026-11-08 gives, and
// each row names the documents that give it (source ids of index.ts):
//
//   long  (the 32-bit values of IEEE 802.1t, kept in 802.1D-2004): Extreme
//         Switch Engine 33.7.1 "configure stpd ports cost" (10 Mb/s 2,000,000,
//         100 Mb/s 200,000, 1 Gb/s 20,000, 10 Gb/s 2,000, and "The 802.1D-2004
//         standard modified the default port path cost value"); MikroTik
//         RouterOS 7.24, port-cost-mode table (10 Mb/s to 100 Gb/s, with 25,
//         40 and 50 Gb/s); Cisco Catalyst 9300 IOS XE 17.18, default
//         spanning-tree configuration (10 Mb/s to 10 Tb/s, with 40 Gb/s);
//         HPE Aruba AOS-CX 10.16 "spanning-tree cost" (10 Mb/s to 1 Tb/s);
//         Arista EOS 4.37.0F (1 Gb/s 20000, 10 Gb/s 2000); Huawei S5700 and S6700
//         V200R025C00, stp pathcost-standard, Table 5-92, IEEE 802.1t column, full
//         duplex (1 Gb/s 20,000, 2.5 Gb/s 8000, 10 Gb/s 2000, 40 Gb/s 500; read in a
//         browser on 2026-11-08, the site refusing automated reads).
//   short (the 16-bit values of 802.1D-1998): Extreme Switch Engine 33.7.1,
//         the defaults of ExtremeXOS 11.5 and earlier (10 Mb/s 100, 100 Mb/s
//         19, 1 Gb/s 4, 10 Gb/s 2); MikroTik RouterOS 7.24, the same four and
//         1 for 25 to 100 Gb/s; Cisco Press, Scaling Networks Companion Guide,
//         Table 2-1 (the same four); Huawei's Table 5-92, IEEE 802.1D-1998 column,
//         full duplex (1 Gb/s 4, 2.5 Gb/s 3, 10 Gb/s 2, 40 Gb/s 1).
// Huawei's table also lists one less for full duplex at 10 and 100 Mb/s
// (1,999,999 and 199,999 long, 99 and 18 short) and lower costs for aggregated
// links; those differ from the rows below, so Huawei is not named as a source of
// the 10 and 100 Mb/s rows and its vendor sentence says so instead.
// A speed or a method no document gives a value for has no value here, and the
// engine refuses to invent one: the reader types the cost instead.
//
// Pure data: no clock, no network, no randomness.
// ============================================================================

/** The two path cost methods: 32-bit (802.1t, 802.1D-2004) or 16-bit (802.1D-1998). */
export type CostMethod = "long" | "short"; // the two scales the vendors document

/** One documented value and the documents that give it. */
export interface CostValue {
  /** The port path cost. */
  value: number;
  /** The source ids (index.ts) that give this value for this speed. */
  sources: readonly string[];
}

/** One link speed and its documented costs. */
export interface SpeedRow {
  /** A stable id, the speed as typed in the short form: "10M", "1G", "1T". */
  id: string;
  /** The speed in megabits per second. */
  mbps: number;
  /** The speed for a reader: "10 Mb/s", "1 Gb/s". */
  label: string;
  /** The long (32-bit) value, or null when no document read gives one. */
  long: CostValue | null;
  /** The short (16-bit) value, or null when no document read gives one. */
  short: CostValue | null;
}

/** The documents that give the four classic long values. */
const LONG_FOUR = Object.freeze(["extreme-se-cost", "mikrotik-bridging", "cisco-c9300-stp", "aruba-cx-cost"]); // 10 Mb/s to 10 Gb/s
/** The same, with Arista's two (1 Gb/s and 10 Gb/s) and Huawei's full-duplex values. */
const LONG_FOUR_ARISTA = Object.freeze([...LONG_FOUR, "arista-eos-stp", "huawei-stp-cr"]); // 1 Gb/s and 10 Gb/s
/** The documents that give the four classic short values. */
const SHORT_FOUR = Object.freeze(["extreme-se-cost", "mikrotik-bridging", "ciscopress-scaling"]); // 10 Mb/s to 10 Gb/s
/** The same, with Huawei's full-duplex 802.1D-1998 values (1 Gb/s 4, 10 Gb/s 2). */
const SHORT_FOUR_HUAWEI = Object.freeze([...SHORT_FOUR, "huawei-stp-cr"]); // 1 Gb/s and 10 Gb/s

/** Every speed a document read on 2026-11-08 gives a cost for, slowest first. */
export const SPEEDS: readonly SpeedRow[] = Object.freeze([
  { id: "10M", mbps: 10, label: "10 Mb/s", long: { value: 2000000, sources: LONG_FOUR }, short: { value: 100, sources: SHORT_FOUR } }, // classic Ethernet
  { id: "100M", mbps: 100, label: "100 Mb/s", long: { value: 200000, sources: LONG_FOUR }, short: { value: 19, sources: SHORT_FOUR } }, // Fast Ethernet
  { id: "1G", mbps: 1000, label: "1 Gb/s", long: { value: 20000, sources: LONG_FOUR_ARISTA }, short: { value: 4, sources: SHORT_FOUR_HUAWEI } }, // gigabit
  { id: "2.5G", mbps: 2500, label: "2.5 Gb/s", long: { value: 8000, sources: ["huawei-stp-cr"] }, short: { value: 3, sources: ["huawei-stp-cr"] } }, // Huawei's table only (read 2026-11-08)
  { id: "10G", mbps: 10000, label: "10 Gb/s", long: { value: 2000, sources: LONG_FOUR_ARISTA }, short: { value: 2, sources: SHORT_FOUR_HUAWEI } }, // 10 gigabit
  { id: "25G", mbps: 25000, label: "25 Gb/s", long: { value: 800, sources: ["mikrotik-bridging"] }, short: { value: 1, sources: ["mikrotik-bridging"] } }, // RouterOS's table only
  { id: "40G", mbps: 40000, label: "40 Gb/s", long: { value: 500, sources: ["mikrotik-bridging", "cisco-c9300-stp", "huawei-stp-cr"] }, short: { value: 1, sources: ["mikrotik-bridging", "huawei-stp-cr"] } }, // RouterOS, Cisco and Huawei
  { id: "50G", mbps: 50000, label: "50 Gb/s", long: { value: 400, sources: ["mikrotik-bridging"] }, short: { value: 1, sources: ["mikrotik-bridging"] } }, // RouterOS's table only
  { id: "100G", mbps: 100000, label: "100 Gb/s", long: { value: 200, sources: ["mikrotik-bridging", "cisco-c9300-stp", "aruba-cx-cost"] }, short: { value: 1, sources: ["mikrotik-bridging"] } }, // three long sources
  { id: "1T", mbps: 1000000, label: "1 Tb/s", long: { value: 20, sources: ["cisco-c9300-stp", "aruba-cx-cost"] }, short: null }, // no short value documented
  { id: "10T", mbps: 10000000, label: "10 Tb/s", long: { value: 2, sources: ["cisco-c9300-stp"] }, short: null }, // Cisco's table only
].map((r) => Object.freeze(r))); // frozen rows

/** The largest port path cost of each method: 802.1t's 32-bit range and 802.1D-1998's 16-bit one. */
export const MAX_COST: Readonly<Record<CostMethod, number>> = Object.freeze({ long: 200000000, short: 65535 }); // RFC 4188 dot1dStpPortPathCost32 and dot1dStpPortPathCost

/** One vendor's documented default method and how to change it. */
export interface VendorRow {
  /** A stable id (the pack key under vendor.*). */
  id: string;
  /** The platform and release read, as a label. */
  platform: string;
  /** The default as the documents read state it: long, short, not stated, or the documents disagree. */
  defaultMethod: "long" | "short" | "unstated" | "conflict" | "unread";
  /** The command or setting that changes the method, or null when the documents read give none. */
  change: string | null;
  /** The per-port override (a cost typed on the port), or null when not read. */
  perPort: string | null;
  /** The source ids. */
  sources: readonly string[];
}

/** The vendors the course's chapter 2.4 covers (its MODERN CLI slides), in the course's order. */
export const VENDORS: readonly VendorRow[] = Object.freeze(([
  { id: "extreme-se", platform: "Extreme Switch Engine 33.7.1", defaultMethod: "long", change: null, perPort: "configure stpd <stpd> ports cost [auto | <cost>] <ports>", sources: ["extreme-se-cost"] }, // long defaults since ExtremeXOS 11.6, no method switch
  { id: "extreme-fe", platform: "Extreme Fabric Engine 9.4", defaultMethod: "long", change: "spanning-tree mstp pathcost-type <bits16 | bits32>", perPort: "spanning-tree mstp cost <1-200000000>", sources: ["extreme-fe-mstp"] }, // "The default is 32 bits."
  { id: "cisco", platform: "Cisco IOS XE 17.18, 26.x (Catalyst 9300)", defaultMethod: "conflict", change: "spanning-tree pathcost method long", perPort: "spanning-tree cost <1-200000000>", sources: ["cisco-c9300-stp", "cisco-c9300-26x-stp", "cisco-c9000-stp", "cisco-c9300-1718-cr", "cisco-c9300-26x-cr", "cisco-225591"] }, // the note says short, the defaults table lists long values
  { id: "aruba", platform: "HPE Aruba Networking AOS-CX 10.16", defaultMethod: "long", change: null, perPort: "spanning-tree cost <1-200000000>", sources: ["aruba-cx-cost"] }, // long values by speed, no method command in the page read
  { id: "juniper", platform: "Juniper Junos OS", defaultMethod: "unstated", change: null, perPort: "set protocols rstp interface <name> cost <1-200000000>", sources: ["juniper-cost", "juniper-show-stp-interface"] }, // "determined by the link speed"; the example output shows 20000 and 2000
  { id: "mikrotik", platform: "MikroTik RouterOS 7.24", defaultMethod: "long", change: "/interface/bridge set <bridge> port-cost-mode=short", perPort: "/interface/bridge/port set <port> path-cost=<1-200000000>", sources: ["mikrotik-bridging", "mikrotik-stp"] }, // port-cost-mode, Default: long
  { id: "arista", platform: "Arista EOS 4.37.0F", defaultMethod: "long", change: null, perPort: "spanning-tree cost <1-200000000>", sources: ["arista-eos-stp"] }, // 20000 and 2000; no method setting found
  { id: "huawei", platform: "Huawei VRP (S5700, S6700 V200R025C00)", defaultMethod: "long", change: "stp pathcost-standard { dot1d-1998 | dot1t | legacy }", perPort: "stp [ instance <id> ] cost <1-200000000>", sources: ["huawei-stp-cr"] }, // "By default, the IEEE 802.1t is used" (read in a browser, 2026-11-08)
] as VendorRow[]).map((r) => Object.freeze(r))); // frozen rows (typed as rows, so each defaultMethod is checked against its union)
