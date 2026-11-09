// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/ospf-cost-and-adjacency-checker/examples.ts
// ----------------------------------------------------------------------------
// The page's two Examples (D-83) and its scenario chips, in one small module
// that both the golden vectors (which pin every one of them) and the component
// (whose buttons fill them) import, so a button can never drift from its
// vector and the page does not carry the whole vector set.
//
// The adjacency values are the OSPF lab of chapter 4.1 of the course "LAN
// Switch Operations and Maintenance" (deck slide 437, with the addressing of
// the Module 03 lab, slide 409): SW-CORE-01 with Router ID 10.255.0.1 and the
// uplink 10.0.12.1/30, the uplink router at 10.0.12.2 on 10.0.12.0/30, area 0,
// the uplink as a point-to-point network, HMAC-SHA with the same key on both
// sides; step 8 breaks it on purpose, "a different key on one side; then a
// different Hello". The deck gives no Router ID for the uplink router, no
// timer values and no Key ID: the Hello of 10 s and dead interval of 40 s, the
// changed 5 s and 20 s, HMAC-SHA-256 and Key ID 1 are this tool's choices, and
// the uplink router's Router ID is left blank, as the deck leaves it.
//
// The cost Example uses the course's Juniper EX switches at Junos's default
// reference bandwidth with three common campus speeds.
// ============================================================================

/** SW-CORE-01's uplink as the course's lab configures it. */
const CORE = Object.freeze({ name: "SW-CORE-01", routerId: "10.255.0.1", area: "0", areaType: "normal", network: "point-to-point", address: "10.0.12.1/30", hello: "10", dead: "40", mtu: "1500", auth: "hmac-sha-256", keyId: "1", priority: "", instance: "0" } as const); // slides 409 and 437

/** The uplink router's side of the same link. */
const UPLINK = Object.freeze({ name: "uplink-router", routerId: "", area: "0", areaType: "normal", network: "point-to-point", address: "10.0.12.2/30", hello: "10", dead: "40", mtu: "1500", auth: "hmac-sha-256", keyId: "1", priority: "", instance: "0" } as const); // slide 437: 10.0.12.2 on 10.0.12.0/30

/** The cost Example: Junos at its default reference, 100 Mbit/s, 1 Gbit/s and 10 Gbit/s all cost 1. */
export const EXAMPLE_COST_REQUEST = Object.freeze({ mode: "cost", vendor: "juniper-junos", reference: "", links: "100M, 1G, 10G" } as const); // collapse, and 2 Gbit/s tells them apart

/** The adjacency Example: the lab's step 8, a different Hello (and so a different dead interval) on the uplink router. */
export const EXAMPLE_ADJACENCY_REQUEST = Object.freeze({ mode: "adjacency", version: "2", sameKey: "true", a: CORE, b: Object.freeze({ ...UPLINK, hello: "5", dead: "20" }) } as const); // no neighbour on either side

/** The adjacency scenario chips: the lab as configured, and the breakages a class meets. */
export const ADJACENCY_SCENARIOS = Object.freeze({
  lab: Object.freeze({ mode: "adjacency", version: "2", sameKey: "true", a: CORE, b: UPLINK } as const), // the lab as built: Full
  key: Object.freeze({ mode: "adjacency", version: "2", sameKey: "false", a: CORE, b: UPLINK } as const), // step 8: a different key on one side
  mtu: Object.freeze({ mode: "adjacency", version: "2", sameKey: "true", a: CORE, b: Object.freeze({ ...UPLINK, mtu: "9000" }) } as const), // jumbo frames on one side only
  area: Object.freeze({ mode: "adjacency", version: "2", sameKey: "true", a: CORE, b: Object.freeze({ ...UPLINK, area: "1" }) } as const), // the uplink put in area 1 by mistake
  network: Object.freeze({ mode: "adjacency", version: "2", sameKey: "true", a: CORE, b: Object.freeze({ ...UPLINK, network: "broadcast" }) } as const), // point-to-point on one side, broadcast on the other
}); // by chip

/** The cost chips: lists of speeds. */
export const COST_SPEED_CHIPS = Object.freeze(["100M, 1G, 10G", "1G, 10G, 25G, 100G", "10G, 40G, 100G, 400G"] as const); // campus, data centre, core
