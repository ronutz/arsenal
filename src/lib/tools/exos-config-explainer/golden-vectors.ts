// ============================================================================
// src/lib/tools/exos-config-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the EXOS config explainer. Each vector pins an input to
// invariant parts of the parsed output, so a regression in the engine is
// caught by the build-time gate (verifyVectors, run by __selftest).
//
// The config uses command shapes taken verbatim from the ExtremeXOS Command
// Reference: "create vlan NAME tag N", "configure vlan NAME add ports ...
// tagged" (the documented example uses ports like 1:1, 1:2), "configure vlan
// NAME ipaddress IP/MASK", "enable ipforwarding", "configure iproute add
// default GW", and "enable sharing MASTER grouping ... lacp".
// ============================================================================

import { run, type ExosMode, type ExosCategory } from "./compute";

export const SET_ID = "exos-config-explainer/golden@1";

export interface ExosVector {
  readonly name: string;
  readonly input: string;
  readonly mode: ExosMode;
  /** Number of parsed command lines (comments/blank excluded). */
  readonly lineCount?: number;
  /** A line whose raw includes X must have a summary that includes Y. */
  readonly lineSummary?: { rawIncludes: string; summaryIncludes: string };
  /** A VLAN that must be present, with optional aggregated assertions. */
  readonly vlan?: {
    name: string;
    tag?: string;
    hasTaggedPort?: string;
    hasUntaggedPort?: string;
    hasIp?: string;
  };
  /** A category that must appear in the grouped output. */
  readonly categoryPresent?: ExosCategory;
  /** A note kind that must appear. */
  readonly noteKind?: "info" | "good" | "warn";
}

// A representative EXOS config exercising VLANs, L3, ports, sharing, accounts.
const FULL = `# core switch
create vlan engineering tag 100
configure vlan engineering add ports 1:1, 1:2, 1:3 tagged
configure vlan engineering ipaddress 10.1.1.1/24
create vlan voice tag 200
configure vlan voice add ports 2:1 untagged
enable ipforwarding
configure iproute add default 10.1.1.254
enable sharing 1:1 grouping 1:1, 1:2 algorithm address-based lacp
create account admin netops
disable ports 1:24`;

// A Layer 3 VLAN with no ipforwarding, to trip the routing warning.
const NO_FORWARD = `create vlan servers tag 30
configure vlan servers ipaddress 192.168.30.1/24`;

// Not an EXOS config at all.
const NOT_EXOS = `interface GigabitEthernet0/1
 switchport mode access`;

export const VECTORS: readonly ExosVector[] = [
  {
    name: "empty input returns the reference",
    input: "",
    mode: "reference",
  },
  {
    name: "create vlan with tag is explained and aggregated",
    input: FULL,
    mode: "parse",
    lineCount: 10,
    lineSummary: { rawIncludes: "create vlan engineering tag 100", summaryIncludes: "Creates VLAN" },
    vlan: { name: "engineering", tag: "100", hasTaggedPort: "1:1", hasIp: "10.1.1.1/24" },
    categoryPresent: "l3",
  },
  {
    name: "untagged port membership is captured on the voice VLAN",
    input: FULL,
    mode: "parse",
    vlan: { name: "voice", tag: "200", hasUntaggedPort: "2:1" },
  },
  {
    name: "sharing (LAG) is recognized as link aggregation",
    input: FULL,
    mode: "parse",
    lineSummary: { rawIncludes: "enable sharing", summaryIncludes: "link aggregation group" },
    categoryPresent: "sharing",
  },
  {
    name: "default route is explained",
    input: FULL,
    mode: "parse",
    lineSummary: { rawIncludes: "iproute add default", summaryIncludes: "default route" },
  },
  {
    name: "local account with role is explained",
    input: FULL,
    mode: "parse",
    lineSummary: { rawIncludes: "create account admin netops", summaryIncludes: "role admin" },
    categoryPresent: "account",
  },
  {
    name: "L3 VLAN without ipforwarding trips the routing warning",
    input: NO_FORWARD,
    mode: "parse",
    noteKind: "warn",
  },
  {
    name: "non-EXOS input yields no recognized commands (warn)",
    input: NOT_EXOS,
    mode: "parse",
    noteKind: "warn",
  },
];

/** Run all vectors; throw on the first mismatch. Invoked by __selftest. */
export function verifyVectors(): void {
  for (const v of VECTORS) {
    const { result } = run(v.input);

    if (result.mode !== v.mode) {
      throw new Error(`[${SET_ID}] ${v.name}: mode ${result.mode} != ${v.mode}`);
    }

    if (v.lineCount !== undefined && result.lines.length !== v.lineCount) {
      throw new Error(`[${SET_ID}] ${v.name}: lineCount ${result.lines.length} != ${v.lineCount}`);
    }

    if (v.lineSummary) {
      const hit = result.lines.find((l) => l.raw.includes(v.lineSummary!.rawIncludes));
      if (!hit) throw new Error(`[${SET_ID}] ${v.name}: no line includes "${v.lineSummary.rawIncludes}"`);
      if (!hit.summary.includes(v.lineSummary.summaryIncludes)) {
        throw new Error(`[${SET_ID}] ${v.name}: line summary missing "${v.lineSummary.summaryIncludes}" (got "${hit.summary}")`);
      }
    }

    if (v.vlan) {
      const vlan = result.vlans.find((x) => x.name === v.vlan!.name);
      if (!vlan) throw new Error(`[${SET_ID}] ${v.name}: VLAN "${v.vlan.name}" not aggregated`);
      if (v.vlan.tag !== undefined && vlan.tag !== v.vlan.tag) {
        throw new Error(`[${SET_ID}] ${v.name}: VLAN "${v.vlan.name}" tag ${vlan.tag} != ${v.vlan.tag}`);
      }
      if (v.vlan.hasTaggedPort && !vlan.taggedPorts.some((p) => p.includes(v.vlan!.hasTaggedPort!))) {
        throw new Error(`[${SET_ID}] ${v.name}: VLAN "${v.vlan.name}" missing tagged port "${v.vlan.hasTaggedPort}"`);
      }
      if (v.vlan.hasUntaggedPort && !vlan.untaggedPorts.some((p) => p.includes(v.vlan!.hasUntaggedPort!))) {
        throw new Error(`[${SET_ID}] ${v.name}: VLAN "${v.vlan.name}" missing untagged port "${v.vlan.hasUntaggedPort}"`);
      }
      if (v.vlan.hasIp && !vlan.ipAddresses.some((p) => p.includes(v.vlan!.hasIp!))) {
        throw new Error(`[${SET_ID}] ${v.name}: VLAN "${v.vlan.name}" missing IP "${v.vlan.hasIp}"`);
      }
    }

    if (v.categoryPresent && !result.groups.some((g) => g.category === v.categoryPresent)) {
      throw new Error(`[${SET_ID}] ${v.name}: category "${v.categoryPresent}" not present`);
    }

    if (v.noteKind && !result.notes.some((n) => n.kind === v.noteKind)) {
      throw new Error(`[${SET_ID}] ${v.name}: expected a "${v.noteKind}" note, found none`);
    }
  }
}
