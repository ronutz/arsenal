// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vrrp-timer-calculator/examples.ts
// ----------------------------------------------------------------------------
// The page's three Examples (D-83), in one small module that both the golden
// vectors (which pin their readings: example-timers, example-election and
// example-mac) and the component (whose Example button fills them) import, so
// the button can never drift from the vectors and the page does not carry the
// whole vector set. The values are the VRRP lab of chapter 4.2 of the course
// "LAN Switch Operations and Maintenance" (its deck notes, slides 440 to 453):
// VRID 10 on VLAN 10, the virtual gateway 10.1.10.1, SW-CORE-01 at priority
// 110 with 10.1.10.2, SW-CORE-02 at priority 100 with 10.1.10.3, preemption
// on, a one-second interval, VRRPv3; the deck expects "about 3.6 s" for a cut
// link at priority 100, "about 0.6 s" for an orderly shutdown, and the virtual
// MAC 00-00-5E-00-01-0A.
// ============================================================================

/** The timers Example: the lab's Backup, priority 100, at the 1-second (100-centisecond) interval. */
export const EXAMPLE_TIMERS_REQUEST = Object.freeze({ mode: "timers", version: "3", priority: "100", interval: "100" } as const); // 3.609375 s and 0.609375 s

/** The election Example: the lab's two core switches, preemption on. */
export const EXAMPLE_ELECTION_REQUEST = Object.freeze({
  mode: "election", // the mode
  version: "3", // VRRPv3
  interval: "100", // 1 second
  preempt: "on", // the RFC's default, as the lab keeps it
  routers: Object.freeze([
    Object.freeze({ name: "SW-CORE-01", priority: "110", address: "10.1.10.2", owner: false }), // the intended Active Router
    Object.freeze({ name: "SW-CORE-02", priority: "100", address: "10.1.10.3", owner: false }), // the Backup
  ]), // the two switches
} as const); // SW-CORE-01 Active; SW-CORE-02 takes over 3.609375 s after the last ADVERTISEMENT

/** The MAC Example: the lab's VRID 10 for IPv4. */
export const EXAMPLE_MAC_REQUEST = Object.freeze({ mode: "mac", version: "3", vrid: "10", family: "ipv4" } as const); // 00-00-5E-00-01-0A
