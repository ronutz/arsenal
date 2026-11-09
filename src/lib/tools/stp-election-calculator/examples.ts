// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/stp-election-calculator/examples.ts
// ----------------------------------------------------------------------------
// The page's Examples (D-83) and sample chips, in one small module that both
// the golden vectors (which pin their readings) and the component (whose
// Example button and chips fill them) import, so the buttons can never drift
// from the vectors. The election Example is the worked example of chapter 2.4
// of the course "LAN Switch Operations and Maintenance" (deck slide 259, "IEEE
// 802.1d Spanning Tree"): six bridges with IDs 80-00:1 to 80-00:6 (priority
// 0x8000 = 32768, the MAC rising from 1 to 6), equal path costs on every
// link, Bridge 1 the root, and the redundant links blocked at Bridge 5 (from
// Bridge 4) and twice at Bridge 6 (the second link from Bridge 3, and the
// link from Bridge 5). The MACs are the documentation range of RFC 9542
// (00-00-5E-00-53-00 to -FF, which obsoleted RFC 7042's identical block);
// every link runs at 1 Gb/s. The cost Example is the course's slide 266, whose
// show spantree stats output has 20000 on ge.2.1 and ge.2.4: the long cost of
// 1 Gb/s.
// ============================================================================

/** The election Example: deck slide 259, six bridges at the default priority, every link 1 Gb/s. */
export const EXAMPLE_TOPOLOGY = [
  "# Course slide 259: six bridges at the default priority, every link 1 Gb/s", // where it comes from
  "bridge B1 32768 00-00-5E-00-53-01", // Bridge 1, ID 80-00:1
  "bridge B2 32768 00-00-5E-00-53-02", // Bridge 2
  "bridge B3 32768 00-00-5E-00-53-03", // Bridge 3
  "bridge B4 32768 00-00-5E-00-53-04", // Bridge 4
  "bridge B5 32768 00-00-5E-00-53-05", // Bridge 5
  "bridge B6 32768 00-00-5E-00-53-06", // Bridge 6
  "link B1:1 B2:1 1G", // top row, left
  "link B2:2 B3:1 1G", // top row, right
  "link B1:2 B4:1 1G", // left column
  "link B2:3 B5:1 1G", // middle column
  "link B3:2 B6:1 1G", // right column, first link
  "link B3:3 B6:2 1G", // right column, second link
  "link B4:2 B5:2 1G", // bottom row, left
  "link B5:3 B6:3 1G", // bottom row, right
].join("\n"); // one statement per line

/** The election Example as a request. */
export const EXAMPLE_ELECTION_REQUEST = Object.freeze({ mode: "election", method: "long", topology: EXAMPLE_TOPOLOGY } as const); // B1 root; B5:2, B6:2 and B6:3 alternate

/** The cost Example: 1 Gb/s, deck slide 266's 20000. */
export const EXAMPLE_COST_REQUEST = Object.freeze({ mode: "cost", speed: "1G" } as const); // long 20000, short 4

/** One sample chip: its id (the pack key under sample.*), the method it sets and the topology it fills. */
export interface Sample {
  /** The stable id. */
  id: string;
  /** The method the chip selects. */
  method: "long" | "short";
  /** The topology. */
  topology: string;
}

/** The sample chips under the election field. */
export const SAMPLES: readonly Sample[] = Object.freeze([
  Object.freeze({
    id: "learnLab", // the Learn article's lab at its opening state, B-D at 100 Mb/s
    method: "short", // the lab counts in short costs
    topology: [
      "# The Learn article's lab: a square with one diagonal, short costs", // where it comes from
      "bridge A 32768 00-00-5E-00-53-01", // switch A
      "bridge B 32768 00-00-5E-00-53-02", // switch B
      "bridge C 32768 00-00-5E-00-53-03", // switch C
      "bridge D 32768 00-00-5E-00-53-04", // switch D
      "link A:1 B:1 1G", // A-B
      "link A:2 C:1 1G", // A-C
      "link B:2 C:2 1G", // the diagonal B-C
      "link B:3 D:1 100M", // B-D, the slower link
      "link C:3 D:2 1G", // C-D
    ].join("\n"), // one statement per line
  }),
  Object.freeze({
    id: "backup", // a backup port on a shared segment
    method: "long", // the default
    topology: [
      "# The root has two ports on one shared segment (a hub): one is designated, the other backup", // the case
      "bridge SW1 4096 00-00-5E-00-53-10", // the root, by priority
      "bridge SW2 32768 00-00-5E-00-53-20", // the other bridge
      "link SW1:1 SW2:1 10G", // the uplink
      "link SW1:2 SW1:3 SW2:2 100M", // the hub
    ].join("\n"), // one statement per line
  }),
  Object.freeze({
    id: "mixed", // one bridge left on short costs
    method: "long", // the page's method; OLD overrides it
    topology: [
      "# OLD still uses short costs: ACC's root port goes through OLD's 100 Mb/s uplink", // the case
      "bridge ROOT 4096 00-00-5E-00-53-01", // the root, by priority
      "bridge OLD 32768 00-00-5E-00-53-02 short", // an 802.1D-1998 bridge
      "bridge NEW 32768 00-00-5E-00-53-03", // a long-cost bridge
      "bridge ACC 32768 00-00-5E-00-53-04", // the access switch
      "link ROOT:1 OLD:1 100M", // OLD's slow uplink
      "link ROOT:2 NEW:1 10G", // NEW's fast uplink
      "link OLD:2 ACC:1 1G", // ACC to OLD
      "link NEW:2 ACC:2 1G", // ACC to NEW
    ].join("\n"), // one statement per line
  }),
  Object.freeze({
    id: "vlan", // VLAN 10's tree with the root set on purpose
    method: "long", // the default
    topology: [
      "# VLAN 10's tree: B5 is set to 4096 on purpose, the others stay at 32768", // the case
      "vlan 10", // the system ID extension
      "bridge B1 32768 00-00-5E-00-53-01", // as slide 259
      "bridge B2 32768 00-00-5E-00-53-02", // as slide 259
      "bridge B3 32768 00-00-5E-00-53-03", // as slide 259
      "bridge B4 32768 00-00-5E-00-53-04", // as slide 259
      "bridge B5 4096 00-00-5E-00-53-05", // the intended root
      "bridge B6 32768 00-00-5E-00-53-06", // as slide 259
      "link B1:1 B2:1 1G", // as slide 259
      "link B2:2 B3:1 1G", // as slide 259
      "link B1:2 B4:1 1G", // as slide 259
      "link B2:3 B5:1 1G", // as slide 259
      "link B3:2 B6:1 1G", // as slide 259
      "link B3:3 B6:2 1G", // as slide 259
      "link B4:2 B5:2 1G", // as slide 259
      "link B5:3 B6:3 1G", // as slide 259
    ].join("\n"), // one statement per line
  }),
]); // frozen list

/** The speed chips in cost mode (the documented speeds). */
export const SPEED_CHIPS = Object.freeze(["10M", "100M", "1G", "2.5G", "10G", "25G", "40G", "100G", "1T"] as const); // a selection of the table's rows (2.5G added 2026-11-08 with Huawei's table)
