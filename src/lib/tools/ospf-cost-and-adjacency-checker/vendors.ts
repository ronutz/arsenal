// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/ospf-cost-and-adjacency-checker/vendors.ts
// ----------------------------------------------------------------------------
// HOW EACH VENDOR TURNS AN INTERFACE INTO AN OSPF COST, as each vendor's own
// documentation states it, read on 2026-11-08 (sources in index.ts). RFC 2328
// sets none of this: the cost is "expressed in the link state metric" and "must
// always be greater than 0" (appendix C.3), and the router-LSA carries it in a
// 16-bit field (appendix A.4.2), so 1 to 65535. Everything below is a vendor
// convention, and where a vendor's pages do not say something, the rule says
// "not documented" and the engine does not compute it.
//
// Three kinds of rule:
//   reference  cost = reference bandwidth / interface bandwidth, with the
//              vendor's documented handling of fractions and of interfaces at
//              or above the reference (Cisco IOS XE, Juniper Junos, FRRouting,
//              Huawei VRP, Arista EOS, HPE Aruba AOS-CX); Arista adds a cost
//              that applies while the reference command is not configured;
//   table      a fixed cost per interface speed (Extreme Switch Engine's OSPF
//              metric table, Extreme Fabric Engine's default-cost table);
//   unknown    the pages read state no default cost (MikroTik RouterOS).
//
// 2026-11-08b (pages read in a browser that day: the sites refuse automated
// reads): Huawei VRP now has its documented rule (it was not readable in the
// first build); Cisco's auto-cost example settles an interface faster than the
// reference (cost 1); Arista EOS has auto-cost reference-bandwidth after all
// (the first build's reader missed it), with 10 while it is not set; AOS-CX
// has reference-bandwidth, whose page disagrees with its ip ospf cost page.
//
// Bandwidths are bits per second as BigInt, so every quotient is exact.
// ============================================================================

/** The vendors (and the one open-source suite the Learn article's lab runs). */
export type VendorId =
  | "cisco-ios-xe" // Cisco IOS XE 17.18 (Catalyst 9300), the course's Cisco slides
  | "juniper-junos" // Juniper Junos OS (EX Series), the course's Juniper slides
  | "arista-eos" // Arista EOS (User Manual, OSPFv2 chapter)
  | "aruba-aos-cx" // HPE Aruba Networking AOS-CX 10.16
  | "extreme-switch-engine" // Extreme Switch Engine 33.7.1 (EXOS)
  | "extreme-fabric-engine" // Extreme Fabric Engine 9.4 (VOSS)
  | "huawei-vrp" // Huawei VRP (S5700/S6700 V200R025C00)
  | "mikrotik-routeros" // MikroTik RouterOS 7.24
  | "frr"; // FRRouting (the Learn article's lab software)

/** How a fraction above 1 becomes a whole cost. */
export type FractionRule =
  | "truncate" // the integer part: Cisco's own examples (64 kbit/s gives 1562, a T1 gives 64), Huawei's "The integer of the calculated result", Arista's "rounds down"
  | "undocumented"; // the pages read do not say: only whole quotients are computed

/** How an interface at or above the reference is costed. */
export type AtOrAboveRule =
  | "one" // documented: cost 1
  | "undocumented"; // the pages read do not say (the formula alone would give less than 1)

/** A vendor whose cost comes from a reference bandwidth. */
export interface ReferenceVendor {
  /** The kind. */
  kind: "reference";
  /** The vendor. */
  id: VendorId;
  /** Its name and the documentation release read. */
  label: string;
  /** The default reference bandwidth, bits per second. */
  defaultBps: bigint;
  /** The smallest reference the CLI accepts, bits per second. */
  minBps: bigint;
  /** The largest reference the CLI accepts, bits per second. */
  maxBps: bigint;
  /** The unit the CLI takes a bare number in: whole Mbit/s or bits per second. */
  bareUnit: "mbps" | "bps";
  /** The step a reference is configured in, bits per second (1 Mbit/s or 1 bit/s). */
  gridBps: bigint;
  /** A quotient above 1 that is not whole. */
  fraction: FractionRule;
  /** An interface at or above the reference. */
  atOrAbove: AtOrAboveRule;
  /** Whether the vendor's pages say the reference must be the same on every router. */
  mustMatch: boolean;
  /** The cost every Ethernet interface takes while the reference command is not configured (Arista EOS: 10); null when a blank reference means the default reference. */
  unsetCost: number | null;
  /** The command that sets the reference, up to its value (the engine appends the value). */
  referenceStem: string;
  /** The source id (index.ts) of the formula. */
  source: string;
}

/** A vendor whose cost comes from a per-speed table. */
export interface TableVendor {
  /** The kind. */
  kind: "table";
  /** The vendor. */
  id: VendorId;
  /** Its name and the documentation release read. */
  label: string;
  /** Speed in bits per second, and its default cost. */
  table: readonly (readonly [bigint, number])[];
  /** The source id. */
  source: string;
}

/** A vendor the engine does not compute. */
export interface UnknownVendor {
  /** The kind. */
  kind: "unknown";
  /** The vendor. */
  id: VendorId;
  /** Its name and the documentation release read. */
  label: string;
  /** Why: the pages read state no default cost. */
  reason: "no-default";
  /** The source id of the page read. */
  source: string;
}

/** Any vendor rule. */
export type VendorRule = ReferenceVendor | TableVendor | UnknownVendor; // by kind

/** One megabit per second, in bits per second. */
const M = 1_000_000n; // 10^6
/** One gigabit per second, in bits per second. */
const G = 1_000_000_000n; // 10^9

/** Every vendor's rule, frozen. */
export const VENDORS: Readonly<Record<VendorId, VendorRule>> = Object.freeze({
  "cisco-ios-xe": Object.freeze({ // this vendor's rule
    kind: "reference", // auto-cost reference-bandwidth
    id: "cisco-ios-xe", // the vendor
    label: "Cisco IOS XE 17.18 (Catalyst 9300)", // the course's Cisco release
    defaultBps: 100n * M, // "The default ref-bw is 100 Mbps."
    minBps: 1n * M, // "The range is from 1 to 4294967." (Mbps)
    maxBps: 4294967n * M, // the top of that range
    bareUnit: "mbps", // "Specifies the reference bandwidth in Mbps"
    gridBps: M, // whole Mbit/s
    fraction: "truncate", // the auto-cost entry's examples: 64K gives 1562, T1 gives 64
    atOrAbove: "one", // the auto-cost example: the gigabit Ethernet link "remains at a cost of 1" at reference 1000, as it was at the default 100; the ip ospf cost list: "ATM-- Default cost is 1"
    mustMatch: false, // not stated in the pages read
    unsetCost: null, // a blank reference is the default, 100 Mbit/s
    referenceStem: "router ospf <process> / auto-cost reference-bandwidth", // configuration guide, step 8
    source: "cisco-ospf-cg", // Catalyst 9300 IOS XE 17.18 configuration guide (and the IOS auto-cost entry)
  }),
  "juniper-junos": Object.freeze({ // this vendor's rule
    kind: "reference", // reference-bandwidth
    id: "juniper-junos", // the vendor
    label: "Juniper Junos OS", // the CLI reference and the OSPF User Guide current on the day
    defaultBps: 100n * M, // "Default: 100 Mbps (100,000,000 bits)"
    minBps: 9600n, // "Range: 9600 through 100,000,000,000,000 bits"
    maxBps: 100_000_000_000_000n, // the CLI reference's top (the user guide says 1,000,000,000,000)
    bareUnit: "bps", // "Reference bandwidth, in bits per second."
    gridBps: 1n, // whole bits per second
    fraction: "undocumented", // the pages read give only whole quotients
    atOrAbove: "one", // "any interface operating at 100 Mbps or faster is assigned the same metric value of 1"
    mustMatch: false, // not stated in the pages read
    unsetCost: null, // a blank reference is the default, 100 Mbps
    referenceStem: "set protocols ospf reference-bandwidth", // user guide (the engine writes the value in bits, or whole gigabits as 10g)
    source: "juniper-reference-bandwidth", // CLI reference and OSPF User Guide
  }),
  "frr": Object.freeze({ // this vendor's rule
    kind: "reference", // auto-cost reference-bandwidth
    id: "frr", // the suite
    label: "FRRouting", // the Learn article's lab software (documentation "latest" as served on the day)
    defaultBps: 100n * M, // "The default is 100Mbit/s"
    minBps: 1n * M, // auto-cost reference-bandwidth (1-4294967), in Mbits/s
    maxBps: 4294967n * M, // the top of that range
    bareUnit: "mbps", // "specified in Mbits/s"
    gridBps: M, // whole Mbit/s
    fraction: "undocumented", // "Cost of lower bandwidth links will be scaled with reference to this cost": no rounding stated
    atOrAbove: "one", // "a link of bandwidth 100Mbit/s or higher will have a cost of 1"
    mustMatch: true, // "This configuration setting MUST be consistent across all routers within the OSPF domain."
    unsetCost: null, // a blank reference is the default, 100 Mbit/s
    referenceStem: "router ospf / auto-cost reference-bandwidth", // FRRouting OSPFv2
    source: "frr-ospfd", // FRRouting OSPFv2 documentation
  }),
  "huawei-vrp": Object.freeze({ // this vendor's rule
    kind: "reference", // bandwidth-reference, per OSPF process
    id: "huawei-vrp", // the vendor
    label: "Huawei VRP (S5700/S6700 V200R025C00)", // the course's Huawei release
    defaultBps: 100n * M, // "The default bandwidth reference value is 100 Mbit/s."
    minBps: 1n * M, // "1 to 2147483648, in Mbit/s"
    maxBps: 2_147_483_648n * M, // the top of that range
    bareUnit: "mbps", // the value is in Mbit/s
    gridBps: M, // whole Mbit/s
    fraction: "truncate", // "The integer of the calculated result is the cost of the interface."
    atOrAbove: "one", // "If the calculated result is smaller than 1, the cost is 1."
    mustMatch: false, // not stated in the pages read
    unsetCost: null, // a blank reference is the default, 100 Mbit/s
    referenceStem: "ospf <process> / bandwidth-reference", // OSPF view (per process); "ospf 1" enters it on the course's Huawei slides
    source: "huawei-bandwidth-reference", // Command Reference, bandwidth-reference (OSPF), and ospf cost
  }),
  "arista-eos": Object.freeze({ // this vendor's rule
    kind: "reference", // auto-cost reference-bandwidth (ospfv2), Router-OSPF configuration mode
    id: "arista-eos", // the vendor
    label: "Arista EOS 4.37.0F", // the User Manual release served on the day (OSPFv2 chapter)
    defaultBps: 100n * M, // the rate: "Default is 100."
    minBps: 1n * M, // rate "1 to 4294967"
    maxBps: 4294967n * M, // the top of that range
    bareUnit: "mbps", // "ospfv2-cost = (auto-cost value * 1 Mbps) / interface bandwidth"
    gridBps: M, // whole Mbit/s
    fraction: "truncate", // "The switch rounds down all non-integer results."
    atOrAbove: "one", // "The switch uses a minimum ospfv2-cost of 1."
    mustMatch: false, // not stated in the pages read
    unsetCost: 10, // "When this parameter is not set, the default cost for Ethernet interfaces is the default ip ospf cost value of 10."
    referenceStem: "router ospf <process> / auto-cost reference-bandwidth", // Router-OSPF configuration mode; "router ospf 1" enters it on the course's Arista slides
    source: "arista-eos-ospfv2", // EOS User Manual, OSPFv2
  }),
  "aruba-aos-cx": Object.freeze({ // this vendor's rule
    kind: "reference", // reference-bandwidth, OSPFv2 process context
    id: "aruba-aos-cx", // the vendor
    label: "HPE Aruba Networking AOS-CX 10.16", // the course's AOS-CX release
    defaultBps: 100_000n * M, // "the default of 100000 Mbps"
    minBps: 1n * M, // range 1 to 4000000 (Mbps)
    maxBps: 4_000_000n * M, // the top of that range
    bareUnit: "mbps", // the value is in Mbps
    gridBps: M, // whole Mbit/s
    fraction: "undocumented", // neither page states rounding
    atOrAbove: "undocumented", // neither page states a minimum
    mustMatch: false, // not stated in the pages read
    unsetCost: null, // a blank reference is the default, 100000 Mbps
    referenceStem: "router ospf <process> / reference-bandwidth", // context config-ospf-<PROCESS-ID>; "router ospf 1" enters it on the course's AOS-CX slides
    source: "aruba-reference-bandwidth", // AOS-CX 10.16 IP Routing Guide, reference-bandwidth (and ip ospf cost, which disagrees)
  }),
  "extreme-switch-engine": Object.freeze({ // this vendor's rule
    kind: "table", // configure ospf metric-table
    id: "extreme-switch-engine", // the vendor
    label: "Extreme Switch Engine 33.7.1", // the course's Switch Engine release
    table: Object.freeze([ // speed and default cost
      Object.freeze([10n * M, 10] as const), // "10 Mbps: The default cost is 10."
      Object.freeze([100n * M, 5] as const), // 100 Mbps: 5
      Object.freeze([1n * G, 4] as const), // 1 Gbps: 4
      Object.freeze([2_500n * M, 3] as const), // 2.5 Gbps: 3
      Object.freeze([5n * G, 3] as const), // 5 Gbps: 3
      Object.freeze([10n * G, 2] as const), // 10 Gbps: 2
      Object.freeze([25n * G, 2] as const), // 25 Gbps: 2
      Object.freeze([40n * G, 2] as const), // 40 Gbps: 2
      Object.freeze([50n * G, 2] as const), // 50 Gbps: 2
      Object.freeze([100n * G, 1] as const), // 100 Gbps: 1
    ]), // the documented rows, pages 1093 to 1099 of the command reference
    source: "extreme-switch-engine-cr", // Switch Engine v33.7.1 Command References
  }),
  "extreme-fabric-engine": Object.freeze({ // this vendor's rule
    kind: "table", // ip ospf default-cost
    id: "extreme-fabric-engine", // the vendor
    label: "Extreme Fabric Engine 9.4", // the course's Fabric Engine release
    table: Object.freeze([ // speed and default cost
      Object.freeze([10n * M, 100] as const), // "10 Mb/s Ethernet. The default is 100."
      Object.freeze([100n * M, 10] as const), // 100 Mb/s (Fast) Ethernet: 10
      Object.freeze([1n * G, 1] as const), // Gigabit Ethernet: 1
      Object.freeze([10n * G, 1] as const), // 10 Gigabit Ethernet: 1
      Object.freeze([25n * G, 1] as const), // 25 Gigabit Ethernet: 1
      Object.freeze([40n * G, 1] as const), // 40 Gigabit Ethernet: 1
      Object.freeze([100n * G, 1] as const), // 100 Gigabit Ethernet: 1
    ]), // the documented rows of ip ospf default-cost
    source: "extreme-fabric-engine-cr", // Fabric Engine v9.4 Command References
  }),
  "mikrotik-routeros": Object.freeze({ // this vendor's rule
    kind: "unknown", // no default documented
    id: "mikrotik-routeros", // the vendor
    label: "MikroTik RouterOS 7.24", // the course's RouterOS documentation
    reason: "no-default", // "cost num Interface cost expressed as link state metric." and nothing more
    source: "mikrotik-interface-template", // CLI reference, routing/ospf/interface-template
  }),
} satisfies Record<VendorId, VendorRule>); // every vendor has a rule

/** The vendors in the order the page lists them. */
export const VENDOR_ORDER: readonly VendorId[] = Object.freeze(["cisco-ios-xe", "juniper-junos", "arista-eos", "aruba-aos-cx", "extreme-switch-engine", "extreme-fabric-engine", "huawei-vrp", "mikrotik-routeros", "frr"] as const); // the page's list

/** The commands that change the reference or the cost, per vendor, as each vendor's pages write them. */
export const COMMANDS: Readonly<Record<VendorId, { reference: string | null; cost: string }>> = Object.freeze({
  "cisco-ios-xe": Object.freeze({ reference: "router ospf <process> / auto-cost reference-bandwidth <Mbps>", cost: "ip ospf cost <cost>" }), // configuration guide, step 8 and step 4
  "juniper-junos": Object.freeze({ reference: "set protocols ospf reference-bandwidth <bits>", cost: "set protocols ospf area <area> interface <name> metric <1-65535>" }), // user guide and CLI reference
  "frr": Object.freeze({ reference: "router ospf / auto-cost reference-bandwidth (1-4294967)", cost: "ip ospf cost (1-65535)" }), // FRRouting OSPFv2
  "huawei-vrp": Object.freeze({ reference: "ospf <process> / bandwidth-reference <1-2147483648>", cost: "interface <name> / ospf cost <1-65535>" }), // Command Reference: bandwidth-reference (OSPF view), ospf cost (on the interface, as the course's Huawei slide sets it)
  "arista-eos": Object.freeze({ reference: "router ospf <process> / auto-cost reference-bandwidth <1-4294967>", cost: "ip ospf cost <1-65535>" }), // EOS User Manual: Router-OSPF configuration mode; ip ospf cost 1 to 65535
  "aruba-aos-cx": Object.freeze({ reference: "router ospf <process> / reference-bandwidth <1-4000000>", cost: "ip ospf cost <1-65535>" }), // AOS-CX IP Routing Guide: config-ospf-<PROCESS-ID>; ip ospf cost 1 to 65535
  "extreme-switch-engine": Object.freeze({ reference: null, cost: "configure ospf metric-table 10M <cost> 100M <cost> 1G <cost> ... / configure ospf vlan <name> cost <1-65535>" }), // command reference
  "extreme-fabric-engine": Object.freeze({ reference: null, cost: "ip ospf default-cost <speed> <1-65535> / ip ospf cost <1-65535>" }), // command reference
  "mikrotik-routeros": Object.freeze({ reference: null, cost: "/routing/ospf/interface-template (property cost)" }), // CLI reference: the property, as the page lists it
}); // by vendor
