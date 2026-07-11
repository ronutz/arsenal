// ============================================================================
// src/lib/tools/voss-exos-translator/compute.ts
// ----------------------------------------------------------------------------
// A REFERENCE translator between VOSS (Fabric Connect / SPBM) and EXOS. It is
// deliberately NOT a config generator: it lays common tasks side by side so you
// can see how each CLI expresses them, and it is explicit where EXOS has no
// equivalent - because EXOS does not run SPBM. An EXOS switch joins a fabric as
// a Fabric Attach edge, not as a fabric node (Extreme Fabric documentation).
//
// Every command shown is grounded in Extreme VOSS/EXOS documentation and real
// configs (see the tool manifest sources). exos === null means "no direct
// equivalent" and the note explains what you would do instead.
// ============================================================================

export interface CliMapping {
  id: string;
  concept: string;
  voss: string[];
  exos: string[] | null; // null = EXOS has no direct equivalent
  note: string;
}

// Curated, grounded mappings. Order is roughly "edge basics" -> "fabric core".
export const MAPPINGS: readonly CliMapping[] = Object.freeze([
  {
    id: "config-mode",
    concept: "Enter configuration mode",
    voss: ["enable", "configure terminal"],
    exos: ["configure ...  (runs directly)"],
    note: "EXOS has no separate enable / configure-terminal step; configuration commands run straight from the top prompt.",
  },
  {
    id: "create-vlan",
    concept: "Create a VLAN",
    voss: ["vlan create 20 type port-mstprstp 0"],
    exos: ["create vlan v20 tag 20"],
    note: "In VOSS the VLAN stays local to the edge; the fabric carries the service by its I-SID (see the Layer 2 VSN row).",
  },
  {
    id: "vlan-ports",
    concept: "Add ports to a VLAN",
    voss: ["vlan members add 20 1/1"],
    exos: ["configure vlan v20 add ports 1 untagged"],
    note: "VOSS ports are slot/port form (1/1); EXOS uses a port list. Use tagged instead of untagged for a trunk / uplink port.",
  },
  {
    id: "l2vsn",
    concept: "Map a VLAN to a fabric service (Layer 2 VSN / I-SID)",
    voss: ["vlan i-sid 20 20020"],
    exos: ["configure fabric attach port 1 authentication enable", "configure vlan v20 add ports 1 tagged"],
    note: "EXOS does not create I-SIDs. As a Fabric Attach edge it signals the VLAN on its uplink, and the VOSS FA Server provisions the matching I-SID into the fabric.",
  },
  {
    id: "fabric-core",
    concept: "Build the SPBM fabric core (area, nickname, B-VLANs, system-id)",
    voss: [
      "router isis",
      "manual-area 49.0000",
      "spbm 1",
      "spbm 1 b-vid 4051,4052 primary 4051",
      "spbm 1 nick-name c.65.01",
      "system-id 020c.0650.0001",
      "router isis enable",
    ],
    exos: null,
    note: "No equivalent: EXOS does not support SPBM. It joins the fabric through Fabric Attach instead of becoming a fabric node.",
  },
  {
    id: "fabric-uplink",
    concept: "Enable IS-IS / SPBM on a fabric (NNI) uplink",
    voss: ["interface GigabitEthernet 1/49", "isis", "isis spbm 1", "isis enable"],
    exos: null,
    note: "No equivalent: VOSS runs IS-IS only on fabric NNI links. On EXOS the uplink to the fabric is a Fabric Attach port (see the Fabric Attach row).",
  },
  {
    id: "fabric-attach",
    concept: "Fabric Attach at the edge",
    voss: ["fa enable"],
    exos: [
      "enable sharing 1 grouping 1-2",
      "configure fabric attach port 1 authentication enable",
      "configure fabric attach ports 1 authentication key <key>",
    ],
    note: "VOSS runs the FA Server; EXOS runs the FA Proxy/Client. FA rides LLDP, and the Server auto-provisions the I-SID from the edge VLAN. The sharing/grouping line is only for a LAG uplink.",
  },
  {
    id: "l3vsn",
    concept: "Layer 3 VSN (a routed service across the fabric)",
    voss: ["ip vrf 1 vrfid 1", "router vrf 1", "ipvpn", "i-sid 20010", "ipvpn enable"],
    exos: null,
    note: "No equivalent: EXOS does not run L3 VSN. To exchange IP routes with the fabric, redistribute OSPF, BGP, or RIP across the boundary.",
  },
  {
    id: "verify",
    concept: "Verify the service",
    voss: ["show i-sid", "show isis spbm i-sid all", "show vlan i-sid", "show fa elements"],
    exos: ["show fabric attach", "show vlan", "show ports"],
    note: "On VOSS you verify the I-SID in the fabric; on EXOS you verify the Fabric Attach state and the VLAN.",
  },
]);

function haystack(m: CliMapping): string {
  return [m.concept, ...m.voss, ...(m.exos ?? []), m.note].join("\n").toLowerCase();
}

/** Filter the mappings by a free-text query (matches concept, either CLI, or the note). Empty query returns all. */
export function searchMappings(query: string): CliMapping[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...MAPPINGS];
  return MAPPINGS.filter((m) => haystack(m).includes(q));
}

/** Convenience: just the matching ids, used by the golden vectors. */
export function searchIds(query: string): string[] {
  return searchMappings(query).map((m) => m.id);
}
