// ============================================================================
// src/lib/tools/oui-lookup/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the OUI lookup. The vendor assertions are grounded in the
// embedded IEEE MA-L snapshot (00000C -> Cisco, 000393 -> Apple, 005056 ->
// VMware were confirmed against the source registry). The remaining vectors
// exercise format handling and the U/L and I/G bit classification, which are
// pure and snapshot-independent.
//
// ADDED 2026-10-19 (PRIME's decisions B1 to B3): standard-defined addresses.
// Each expected name and range was read that day from its source: RFC 1112
// s6.4 and RFC 2464 s7 (multicast mappings), RFC 9568 s7.3 (VRRP), the IANA
// Ethernet Numbers registry (last updated 2026-10-13), and the IEEE RA
// Standards Group MAC public listing (IEEE 802.1Q reserved block, IS-IS,
// ES-IS), cross-checked against the RFC 1142 constants table. The 32-group
// lists were printed by Python 3.13.16 `ipaddress` on 2026-10-19 and checked
// there to share the MAC's low 23 bits and to sit inside 224.0.0.0/4.
// ============================================================================

import { analyzeMac } from "./compute";
import { getOuiMap } from "./oui-data";

export const GOLDEN_VECTOR_SET_ID = "oui-lookup/2026-10-19"; // dated set ID, bumped 2026-10-19 with the B1 to B3 vectors

const lookup = (oui: string) => getOuiMap().get(oui) ?? null;

interface Vec {
  id: string;
  input: string;
  ok: boolean;
  vendor?: string | null;
  oui?: string;
  multicast?: boolean;
  local?: boolean;
  isOuiOnly?: boolean;
  errorIncludes?: string;
  wellKnownKind?: string | null; // expected wellKnown.kind, or null when no well-known meaning (added 2026-10-19)
  wellKnownName?: string; // expected wellKnown.name, byte-exact (added 2026-10-19)
  vrid?: number; // expected VRRP VRID (added 2026-10-19)
  ipv4Groups?: string[]; // expected 32 IPv4 groups, byte-exact and in order (added 2026-10-19)
  ipv6Low32?: string; // expected low 32 bits of the IPv6 group (added 2026-10-19)
  bridgeFiltered?: boolean; // expected IEEE 802.1Q reserved-block flag (added 2026-10-19)
  notesExclude?: string; // a substring that must appear in NO note (added 2026-10-19)
}

// The 32 IPv4 groups for 01-00-5E-00-00-01 and 01-00-5E-7F-FF-FA, as Python 3.13.16 printed them on 2026-10-19.
const GROUPS_000001 = ["224.0.0.1", "224.128.0.1", "225.0.0.1", "225.128.0.1", "226.0.0.1", "226.128.0.1", "227.0.0.1", "227.128.0.1", "228.0.0.1", "228.128.0.1", "229.0.0.1", "229.128.0.1", "230.0.0.1", "230.128.0.1", "231.0.0.1", "231.128.0.1", "232.0.0.1", "232.128.0.1", "233.0.0.1", "233.128.0.1", "234.0.0.1", "234.128.0.1", "235.0.0.1", "235.128.0.1", "236.0.0.1", "236.128.0.1", "237.0.0.1", "237.128.0.1", "238.0.0.1", "238.128.0.1", "239.0.0.1", "239.128.0.1"]; // all-hosts 224.0.0.1 and its 31 aliases
const GROUPS_7FFFFA = ["224.127.255.250", "224.255.255.250", "225.127.255.250", "225.255.255.250", "226.127.255.250", "226.255.255.250", "227.127.255.250", "227.255.255.250", "228.127.255.250", "228.255.255.250", "229.127.255.250", "229.255.255.250", "230.127.255.250", "230.255.255.250", "231.127.255.250", "231.255.255.250", "232.127.255.250", "232.255.255.250", "233.127.255.250", "233.255.255.250", "234.127.255.250", "234.255.255.250", "235.127.255.250", "235.255.255.250", "236.127.255.250", "236.255.255.250", "237.127.255.250", "237.255.255.250", "238.127.255.250", "238.255.255.250", "239.127.255.250", "239.255.255.250"]; // the top of the 23-bit range

const VECTORS: Vec[] = [
  { id: "cisco-full", input: "00:00:0C:11:22:33", ok: true, vendor: "Cisco Systems, Inc", oui: "00000C", multicast: false, local: false, isOuiOnly: false },
  { id: "apple-hyphen", input: "00-03-93-AA-BB-CC", ok: true, vendor: "Apple, Inc.", oui: "000393", multicast: false, local: false },
  { id: "vmware-unseparated", input: "005056123456", ok: true, vendor: "VMware, Inc.", oui: "005056", multicast: false, local: false },
  { id: "cisco-dotted", input: "0000.0c11.2233", ok: true, vendor: "Cisco Systems, Inc", oui: "00000C", multicast: false },
  { id: "oui-only", input: "00:00:0C", ok: true, vendor: "Cisco Systems, Inc", oui: "00000C", isOuiOnly: true },
  { id: "locally-administered", input: "02:11:22:33:44:55", ok: true, vendor: null, local: true, multicast: false },
  { id: "multicast", input: "01:00:5E:00:00:01", ok: true, multicast: true, local: false },
  { id: "broadcast", input: "FF:FF:FF:FF:FF:FF", ok: true, vendor: null, multicast: true, local: true },
  { id: "reject-nonhex", input: "hello world", ok: false, errorIncludes: "valid hex" },
  { id: "reject-length", input: "00:11:22:33", ok: false, errorIncludes: "12 hex digits" },
  // -- Added 2026-10-19: B1, the IPv4 and IPv6 multicast mappings --
  { id: "ipv4-mcast-mapping", input: "01:00:5E:00:00:01", ok: true, vendor: null, multicast: true, local: false, wellKnownKind: "ipv4-multicast", wellKnownName: "IPv4 multicast (RFC 1112 mapping)", ipv4Groups: GROUPS_000001, notesExclude: "MA-L snapshot" }, // RFC 1112 s6.4
  { id: "ipv4-mcast-top", input: "01-00-5e-7f-ff-fa", ok: true, wellKnownKind: "ipv4-multicast", ipv4Groups: GROUPS_7FFFFA }, // 4th byte 7F: still IPv4 (IANA 00-00-00 to 7F-FF-FF)
  { id: "mpls-mcast-not-ipv4", input: "01:00:5E:80:00:01", ok: true, multicast: true, wellKnownKind: "iana-block", wellKnownName: "MPLS Multicast", notesExclude: "MA-L snapshot" }, // 4th byte 80: IANA MPLS Multicast row, RFC 5332
  { id: "ipv6-mcast-mapping", input: "33:33:00:00:00:01", ok: true, vendor: null, multicast: true, local: true, wellKnownKind: "ipv6-multicast", wellKnownName: "IPv6 multicast (RFC 2464 mapping)", ipv6Low32: "0000:0001", notesExclude: "assigned by software" }, // ff02::1 maps here
  { id: "ipv6-mcast-solicited", input: "3333.ff12.3456", ok: true, wellKnownKind: "ipv6-multicast", ipv6Low32: "ff12:3456" }, // a solicited-node style group, Cisco dotted input
  { id: "ipv6-mcast-oui-only", input: "33-33-00", ok: true, isOuiOnly: true, wellKnownKind: "ipv6-multicast", notesExclude: "assigned by software" }, // the prefix alone decides it
  // -- Added 2026-10-19: B2, VRRP virtual router MACs (RFC 9568 s7.3) --
  { id: "vrrp-ipv4", input: "00:00:5E:00:01:01", ok: true, vendor: "ICANN, IANA Department", multicast: false, local: false, wellKnownKind: "vrrp-ipv4", wellKnownName: "VRRP virtual router (IPv4), VRID 1", vrid: 1 }, // VRID 1
  { id: "vrrp-ipv6", input: "00-00-5e-00-02-ff", ok: true, vendor: "ICANN, IANA Department", wellKnownKind: "vrrp-ipv6", wellKnownName: "VRRP virtual router (IPv6), VRID 255", vrid: 255 }, // VRID 255, the top of 1-255
  { id: "vrrp-vrid-0", input: "00:00:5E:00:01:00", ok: true, wellKnownKind: "vrrp-ipv4", wellKnownName: "VRRP virtual router (IPv4), VRID 0 (outside the 1 to 255 range RFC 9568 defines)", vrid: 0 }, // flagged, not hidden
  { id: "iana-doc-unicast", input: "00:00:5E:00:53:01", ok: true, vendor: "ICANN, IANA Department", wellKnownKind: "iana-block", wellKnownName: "Documentation (unicast)" }, // RFC 9542 s2.1.4
  // -- Added 2026-10-19: B3, well-known group addresses --
  { id: "isis-all-l1", input: "01:80:C2:00:00:14", ok: true, vendor: null, multicast: true, wellKnownKind: "group-address", wellKnownName: "All Level 1 Intermediate Systems (IS-IS AllL1ISs)", notesExclude: "MA-L snapshot" }, // ISO/IEC 10589
  { id: "isis-all-l2", input: "01-80-C2-00-00-15", ok: true, wellKnownKind: "group-address", wellKnownName: "All Level 2 Intermediate Systems (IS-IS AllL2ISs)" }, // ISO/IEC 10589
  { id: "all-is", input: "09:00:2B:00:00:05", ok: true, multicast: true, wellKnownKind: "group-address", wellKnownName: "All Intermediate System Network Entities (AllIntermediateSystems)", notesExclude: "MA-L snapshot" }, // ISO 9542
  { id: "all-es", input: "09:00:2B:00:00:04", ok: true, wellKnownKind: "group-address", wellKnownName: "All End System Network Entities (ES-IS AllEndSystems)" }, // ISO 9542
  { id: "bridge-group-00", input: "01:80:C2:00:00:00", ok: true, wellKnownKind: "group-address", wellKnownName: "Bridge Group address / Nearest Customer Bridge group address", bridgeFiltered: true }, // 802.1Q reserved 00
  { id: "slow-protocols-02", input: "0180.c200.0002", ok: true, wellKnownKind: "group-address", wellKnownName: "IEEE 802.3 Slow_Protocols_Multicast address", bridgeFiltered: true }, // 802.1Q reserved 02
  { id: "nearest-bridge-0e", input: "01:80:C2:00:00:0E", ok: true, wellKnownKind: "group-address", wellKnownName: "Individual LAN Scope group address / Nearest Bridge group address", bridgeFiltered: true }, // 802.1Q reserved 0E
  { id: "reserved-0f", input: "01:80:C2:00:00:0F", ok: true, wellKnownKind: "group-address", wellKnownName: "Reserved for future standardization", bridgeFiltered: true }, // last of the 16
  { id: "group-10-not-in-table", input: "01:80:C2:00:00:10", ok: true, wellKnownKind: null }, // outside the reserved block and not in the B3 table
  { id: "vendor-unchanged", input: "00:00:0C:11:22:33", ok: true, vendor: "Cisco Systems, Inc", wellKnownKind: null }, // an ordinary vendor MAC gets no well-known field
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  for (const v of VECTORS) {
    const r = analyzeMac(v.input, lookup);
    const errs: string[] = [];
    if (r.ok !== v.ok) errs.push(`ok: got ${r.ok} want ${v.ok}`);
    if (v.vendor !== undefined && r.vendor !== v.vendor) errs.push(`vendor: got ${JSON.stringify(r.vendor)} want ${JSON.stringify(v.vendor)}`);
    if (v.oui !== undefined && r.oui !== v.oui) errs.push(`oui: got ${r.oui} want ${v.oui}`);
    if (v.multicast !== undefined && r.multicast !== v.multicast) errs.push(`multicast: got ${r.multicast} want ${v.multicast}`);
    if (v.local !== undefined && r.local !== v.local) errs.push(`local: got ${r.local} want ${v.local}`);
    if (v.isOuiOnly !== undefined && r.isOuiOnly !== v.isOuiOnly) errs.push(`isOuiOnly: got ${r.isOuiOnly} want ${v.isOuiOnly}`);
    if (v.errorIncludes !== undefined && !(r.error?.message ?? "").includes(v.errorIncludes)) errs.push(`error missing ${JSON.stringify(v.errorIncludes)}`);
    const wk = r.wellKnown; // the standard-defined meaning, if any (2026-10-19)
    if (v.wellKnownKind !== undefined && (wk?.kind ?? null) !== v.wellKnownKind) errs.push(`wellKnown.kind: got ${JSON.stringify(wk?.kind ?? null)} want ${JSON.stringify(v.wellKnownKind)}`); // family
    if (v.wellKnownName !== undefined && wk?.name !== v.wellKnownName) errs.push(`wellKnown.name: got ${JSON.stringify(wk?.name)} want ${JSON.stringify(v.wellKnownName)}`); // byte-exact name
    if (v.vrid !== undefined && wk?.vrid !== v.vrid) errs.push(`wellKnown.vrid: got ${wk?.vrid} want ${v.vrid}`); // VRRP VRID
    if (v.ipv4Groups !== undefined && JSON.stringify(wk?.ipv4Groups) !== JSON.stringify(v.ipv4Groups)) errs.push(`wellKnown.ipv4Groups: got ${JSON.stringify(wk?.ipv4Groups)}`); // all 32, in order
    if (v.ipv6Low32 !== undefined && wk?.ipv6Low32 !== v.ipv6Low32) errs.push(`wellKnown.ipv6Low32: got ${wk?.ipv6Low32} want ${v.ipv6Low32}`); // low 32 bits
    if (v.bridgeFiltered !== undefined && (wk?.bridgeFiltered ?? false) !== v.bridgeFiltered) errs.push(`wellKnown.bridgeFiltered: got ${wk?.bridgeFiltered} want ${v.bridgeFiltered}`); // 802.1Q block flag
    if (v.notesExclude !== undefined && (r.notes ?? []).some((n) => n.includes(v.notesExclude as string))) errs.push(`a note still contains ${JSON.stringify(v.notesExclude)}`); // misleading note gone
    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }
  return { passed, failed: failures.length, failures };
}

export const goldenVectors = VECTORS.map((v) => v.id);
