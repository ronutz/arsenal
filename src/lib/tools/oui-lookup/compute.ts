// ============================================================================
// src/lib/tools/oui-lookup/compute.ts
// ----------------------------------------------------------------------------
// MAC / OUI analysis. Pure logic: it normalizes a MAC address in any common
// format, extracts the 24-bit OUI, and reads the two significant bits of the
// first octet (unicast vs multicast, universally vs locally administered). The
// vendor lookup is injected as a function so this module never imports the large
// OUI dataset - callers pass a lookup backed by the snapshot (server/tests) or a
// lazy-loaded copy (the client component).
//
// Since 2026-10-19 it also recognises MAC addresses whose meaning a standard
// sets rather than an OUI holder: the IPv4 and IPv6 multicast mappings
// (RFC 1112 s6.4, RFC 2464 s7), VRRP virtual router MACs (RFC 9568 s7.3), the
// other named rows of the IANA Ethernet Numbers registry, the IEEE 802.1Q
// reserved block 01-80-C2-00-00-00 to 0F, and the IS-IS / ES-IS group addresses.
// ============================================================================

export interface OuiResult {
  ok: boolean;
  input: string;
  /** Normalized hex (6, 12, or 16 digits), uppercase, no separators. */
  hex?: string;
  /** Colon-formatted full address, e.g. 00:11:22:33:44:55. */
  formatted?: string;
  /** The 24-bit OUI as 6 hex digits. */
  oui?: string;
  ouiFormatted?: string;
  /** Registered organization, or null when unknown / not applicable. */
  vendor?: string | null;
  /** I/G bit: true = multicast (group), false = unicast. */
  multicast?: boolean;
  /** U/L bit: true = locally administered (no manufacturer). */
  local?: boolean;
  /** The input was a bare OUI (3 bytes) rather than a full MAC. */
  isOuiOnly?: boolean;
  /** A meaning set by a standard or registry rather than by the OUI holder (added 2026-10-19), else absent. */
  wellKnown?: WellKnownMac; // see wellKnownMac()
  notes?: string[];
  error?: { message: string };
}

/** The kinds of standard-defined MAC addresses this tool recognises (added 2026-10-19). */
export type WellKnownKind = // one tag per recognised family
  | "ipv4-multicast" // 01-00-5E-00-00-00 to 01-00-5E-7F-FF-FF (RFC 1112 s6.4)
  | "ipv6-multicast" // 33-33-xx-xx-xx-xx (RFC 2464 s7)
  | "vrrp-ipv4" // 00-00-5E-00-01-{VRID} (RFC 9568 s7.3)
  | "vrrp-ipv6" // 00-00-5E-00-02-{VRID} (RFC 9568 s7.3)
  | "iana-block" // another row of the IANA Ethernet Numbers registry under 00-00-5E / 01-00-5E
  | "group-address"; // an IEEE RA standard group address (IEEE 802.1Q reserved block, IS-IS, ES-IS)

/** A standard-defined meaning for a MAC address (added 2026-10-19). */
export interface WellKnownMac { // returned as OuiResult.wellKnown
  kind: WellKnownKind; // which family, so the UI can localise the name
  name: string; // the registry's or standard's own name, in English
  standard: string; // where the value is defined, for the reader to check
  vrid?: number; // VRRP only: the Virtual Router Identifier, the last octet
  ipv4Groups?: string[]; // IPv4 multicast only: the 32 groups that share this MAC
  ipv6Low32?: string; // IPv6 multicast only: the last 32 bits of the group address, as two hex groups
  bridgeFiltered?: boolean; // IEEE 802.1Q reserved block only: not relayed by IEEE 802.1D bridges
}

// ----------------------------------------------------------------------------
// Standard-defined MAC addresses (added 2026-10-19, PRIME's decisions B1 to B3)
// ----------------------------------------------------------------------------

/** One fixed row of a registry table: a 12-hex start and end (inclusive) and what the range means. */
interface FixedRow { // internal table row
  from: string; // first address, 12 upper-case hex digits
  to: string; // last address, 12 upper-case hex digits (equal to `from` for a single value)
  kind: WellKnownKind; // the family it belongs to
  name: string; // the name as the source prints it
  standard: string; // the source
  bridgeFiltered?: boolean; // true for 01-80-C2-00-00-00 to 0F
}

/** The IEEE RA "Standards Group MAC Public Listing" source label, read 2026-10-19. */
const IEEE_GRPMAC = "IEEE RA Standards Group MAC public listing"; // cited with each IEEE row
/** The IANA Ethernet Numbers registry source label (last updated 2026-10-13, read 2026-10-19). */
const IANA_ETH = "IANA Ethernet Numbers registry"; // cited with each IANA row

// The IEEE 802.1Q reserved addresses 01-80-C2-00-00-00 to 0F, value by value, as the IEEE RA public listing
// prints them (Table "IEEE Std 802.1D and IEEE Std 802.1Q Reserved Addresses", read 2026-10-19). The IEEE RA
// tutorial "Standard Group MAC Addresses" says frames to this range "are not relayed by MAC bridges
// conforming to IEEE 802.1D", hence bridgeFiltered.
const IEEE_8021Q_RESERVED: FixedRow[] = [ // 16 addresses in 14 rows
  { from: "0180C2000000", to: "0180C2000000", kind: "group-address", name: "Bridge Group address / Nearest Customer Bridge group address", standard: `IEEE Std 802.1Q, 802.1X, 802.1AE, 802.1AX (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 00
  { from: "0180C2000001", to: "0180C2000001", kind: "group-address", name: "IEEE MAC-specific Control Protocols group address", standard: `IEEE Std 802.1Q (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 01
  { from: "0180C2000002", to: "0180C2000002", kind: "group-address", name: "IEEE 802.3 Slow_Protocols_Multicast address", standard: `IEEE Std 802.1Q, 802.1AX (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 02
  { from: "0180C2000003", to: "0180C2000003", kind: "group-address", name: "Nearest non-TPMR Bridge group address / IEEE Std 802.1X PAE address", standard: `IEEE Std 802.1Q, 802.1X, 802.1AE, 802.1AX, 802.1BR (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 03
  { from: "0180C2000004", to: "0180C2000004", kind: "group-address", name: "IEEE MAC-specific Control Protocols group address", standard: `IEEE Std 802.1Q (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 04
  { from: "0180C2000005", to: "0180C2000006", kind: "group-address", name: "Reserved for future standardization", standard: `IEEE Std 802.1Q (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 05 and 06
  { from: "0180C2000007", to: "0180C2000007", kind: "group-address", name: "MEF Forum ELMI protocol group address (not exclusively reserved for this purpose)", standard: `IEEE Std 802.1Q (${IEEE_GRPMAC}, note a)`, bridgeFiltered: true }, // 07, with the listing's note a
  { from: "0180C2000008", to: "0180C2000008", kind: "group-address", name: "Provider Bridge group address", standard: `IEEE Std 802.1Q (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 08
  { from: "0180C2000009", to: "0180C200000A", kind: "group-address", name: "Reserved for future standardization", standard: `IEEE Std 802.1Q (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 09 and 0A
  { from: "0180C200000B", to: "0180C200000B", kind: "group-address", name: "EDE-SS PEP Address", standard: `IEEE Std 802.1Q, 802.1X, 802.1AE (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 0B
  { from: "0180C200000C", to: "0180C200000C", kind: "group-address", name: "Reserved for future standardization", standard: `IEEE Std 802.1Q (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 0C
  { from: "0180C200000D", to: "0180C200000D", kind: "group-address", name: "Provider Bridge MVRP address", standard: `IEEE Std 802.1Q (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 0D
  { from: "0180C200000E", to: "0180C200000E", kind: "group-address", name: "Individual LAN Scope group address / Nearest Bridge group address", standard: `IEEE Std 802.1Q, 802.1X, 802.1AE, 802.1AS (${IEEE_GRPMAC}, note b)`, bridgeFiltered: true }, // 0E, with the listing's note b
  { from: "0180C200000F", to: "0180C200000F", kind: "group-address", name: "Reserved for future standardization", standard: `IEEE Std 802.1Q (${IEEE_GRPMAC})`, bridgeFiltered: true }, // 0F
];

// IS-IS and ES-IS group addresses. Values and names from the IEEE RA public listing (read 2026-10-19); the IS-IS
// constant names AllL1ISs, AllL2ISs, AllIntermediateSystems and AllEndSystems, and the same four values, are in
// RFC 1142 (the 1990 republication of ISO DP 10589, read 2026-10-19).
const ISIS_ESIS: FixedRow[] = [ // four single values
  { from: "0180C2000014", to: "0180C2000014", kind: "group-address", name: "All Level 1 Intermediate Systems (IS-IS AllL1ISs)", standard: `ISO/IEC 10589 (${IEEE_GRPMAC}; RFC 1142)` }, // IS-IS L1 hellos and LSPs on LANs
  { from: "0180C2000015", to: "0180C2000015", kind: "group-address", name: "All Level 2 Intermediate Systems (IS-IS AllL2ISs)", standard: `ISO/IEC 10589 (${IEEE_GRPMAC}; RFC 1142)` }, // IS-IS L2 hellos and LSPs on LANs
  { from: "09002B000004", to: "09002B000004", kind: "group-address", name: "All End System Network Entities (ES-IS AllEndSystems)", standard: `ISO 9542 (${IEEE_GRPMAC}; RFC 1142)` }, // ES-IS
  { from: "09002B000005", to: "09002B000005", kind: "group-address", name: "All Intermediate System Network Entities (AllIntermediateSystems)", standard: `ISO 9542 (${IEEE_GRPMAC}; RFC 1142)` }, // ES-IS, also used by IS-IS
];

// The named rows of the IANA Ethernet Numbers registry (last updated 2026-10-13, read 2026-10-19) other than
// IPv4 multicast and VRRP, which have their own handlers below. Unicast rows sit under 00-00-5E, multicast rows
// under 01-00-5E. "Unassigned" rows are left out on purpose: they name nothing.
const IANA_ROWS: FixedRow[] = [ // unicast rows first, then multicast
  { from: "00005E000000", to: "00005E0000FF", kind: "iana-block", name: "Reserved (IANA unicast)", standard: `${IANA_ETH}; RFC 9542` }, // needs IESG ratification
  { from: "00005E005200", to: "00005E005200", kind: "iana-block", name: "PacketPWEthA", standard: `${IANA_ETH}; RFC 6658` }, // single value
  { from: "00005E005201", to: "00005E005201", kind: "iana-block", name: "PacketPWEthB", standard: `${IANA_ETH}; RFC 6658` }, // single value
  { from: "00005E005202", to: "00005E005202", kind: "iana-block", name: "BFD for VXLAN", standard: `${IANA_ETH}; RFC 8971` }, // single value
  { from: "00005E005213", to: "00005E005213", kind: "iana-block", name: "Proxy Mobile IPv6", standard: `${IANA_ETH}; RFC 6543` }, // single value
  { from: "00005E005300", to: "00005E0053FF", kind: "iana-block", name: "Documentation (unicast)", standard: `${IANA_ETH}; RFC 9542 section 2.1.4` }, // for examples
  { from: "00005E900100", to: "00005E900100", kind: "iana-block", name: "TRILL OAM", standard: `${IANA_ETH}; RFC 7455` }, // unicast twin of 01-00-5E-90-01-00
  { from: "01005E800000", to: "01005E8FFFFF", kind: "iana-block", name: "MPLS Multicast", standard: `${IANA_ETH}; RFC 5332` }, // 2^20 addresses
  { from: "01005E900000", to: "01005E900000", kind: "iana-block", name: "MPLS-TP p2p", standard: `${IANA_ETH}; RFC 7213` }, // single value
  { from: "01005E900001", to: "01005E900001", kind: "iana-block", name: "Bidirectional Forwarding Detection (BFD) on Link Aggregation Group (LAG) Interfaces", standard: `${IANA_ETH}; RFC 7130` }, // single value
  { from: "01005E900002", to: "01005E900002", kind: "iana-block", name: "AllL1MI-ISs", standard: `${IANA_ETH}; RFC 8202` }, // multi-instance IS-IS level 1
  { from: "01005E900003", to: "01005E900003", kind: "iana-block", name: "AllL2MI-ISs", standard: `${IANA_ETH}; RFC 8202` }, // multi-instance IS-IS level 2
  { from: "01005E900100", to: "01005E900100", kind: "iana-block", name: "TRILL OAM", standard: `${IANA_ETH}; RFC 7455` }, // multicast twin of 00-00-5E-90-01-00
  { from: "01005E901000", to: "01005E9010FF", kind: "iana-block", name: "Documentation (multicast)", standard: `${IANA_ETH}; RFC 9542 section 2.1.4` }, // for examples
];

/** Every fixed-range row, searched in order; ranges do not overlap. */
const FIXED_ROWS: FixedRow[] = [...IEEE_8021Q_RESERVED, ...ISIS_ESIS, ...IANA_ROWS]; // one flat table

/**
 * The 32 IPv4 groups that map to one 01-00-5E MAC. RFC 1112 s6.4 places "the low-order 23-bits of the IP
 * address into the low-order 23 bits" of 01-00-5E-00-00-00; a class D group has 28 significant bits, so the
 * 5 bits that are dropped (the low 4 bits of the first octet and the top bit of the second) give 2^5 = 32
 * groups per MAC. Listed in numeric order.
 * @param b3 the 4th MAC byte (0x00 to 0x7F: its top bit is 0 in the IPv4 range)
 * @param b4 the 5th MAC byte
 * @param b5 the 6th MAC byte
 * @returns 32 dotted-quad group addresses
 */
function ipv4GroupsForMac(b3: number, b4: number, b5: number): string[] { // pure, always 32 entries
  const out: string[] = []; // the result, in numeric order
  for (let first = 224; first <= 239; first++) { // 16 first octets
    // 224.0.0.0/4: the first octet carries 4 of the 5 lost bits
    out.push(`${first}.${b3}.${b4}.${b5}`); // lost top bit of the second octet = 0
    out.push(`${first}.${b3 | 0x80}.${b4}.${b5}`); // lost top bit of the second octet = 1
  }
  return out; // 16 first octets x 2 = 32 groups
}

/**
 * Recognise a MAC-48 (or a bare OUI) whose meaning a standard or registry sets. Pure and table-driven; every
 * row carries its source. Returns undefined for an ordinary vendor address.
 * @param hex the normalised hex (6 or 12 digits; 16-digit EUI-64 input is not matched)
 * @returns the well-known meaning, or undefined
 */
export function wellKnownMac(hex: string): WellKnownMac | undefined { // pure, table-driven
  if (hex.length === 6) { // bare OUI input
    // A bare OUI can only be matched where the first three octets alone decide the meaning.
    if (hex.startsWith("3333")) return { kind: "ipv6-multicast", name: "IPv6 multicast (RFC 2464 mapping)", standard: "RFC 2464 section 7; RFC 9542 section 2.3.1" }; // 33-33 prefix
    return undefined; // 01-00-5E alone could be IPv4 or MPLS multicast, so say nothing
  }
  if (hex.length !== 12) return undefined; // EUI-64 identifiers are out of scope here
  const b = (i: number) => parseInt(hex.slice(i * 2, i * 2 + 2), 16); // byte i of the address
  if (hex.startsWith("3333")) { // IPv6 multicast mapping
    // RFC 2464 s7: 33-33 followed by "the last four octets of DST"
    const low32 = `${hex.slice(4, 8)}:${hex.slice(8, 12)}`.toLowerCase(); // as two IPv6 hex groups
    return { kind: "ipv6-multicast", name: "IPv6 multicast (RFC 2464 mapping)", standard: "RFC 2464 section 7; RFC 9542 section 2.3.1", ipv6Low32: low32 }; // with the low 32 bits
  }
  if (hex.startsWith("01005E") && b(3) < 0x80) { // IPv4 multicast half of 01-00-5E
    // IANA registry: 01-00-5E 00-00-00 to 7F-FF-FF is IPv4 Multicast [RFC 1112]
    return { kind: "ipv4-multicast", name: "IPv4 multicast (RFC 1112 mapping)", standard: `RFC 1112 section 6.4; ${IANA_ETH}`, ipv4Groups: ipv4GroupsForMac(b(3), b(4), b(5)) }; // and the 32 groups
  }
  if (hex.startsWith("00005E0001") || hex.startsWith("00005E0002")) { // the two VRRP blocks
    // RFC 9568 s7.3: 00-00-5E-00-01-{VRID} for IPv4, 00-00-5E-00-02-{VRID} for IPv6
    const v6 = hex[9] === "2"; // the 5th octet is 01 (IPv4) or 02 (IPv6)
    const vrid = b(5); // {VRID} is the last octet
    const range = vrid === 0 ? " (outside the 1 to 255 range RFC 9568 defines)" : ""; // VRID is "An integer value (1-255)"
    return { kind: v6 ? "vrrp-ipv6" : "vrrp-ipv4", name: `VRRP virtual router (${v6 ? "IPv6" : "IPv4"}), VRID ${vrid}${range}`, standard: `RFC 9568 section 7.3; ${IANA_ETH}`, vrid }; // named per PRIME's B2
  }
  for (const row of FIXED_ROWS) { // at most 32 rows
    // linear scan of a small fixed table: bounded, no regex, no backtracking
    if (hex >= row.from && hex <= row.to) { // inclusive range test
      // equal-length upper-case hex strings compare in numeric order
      const wk: WellKnownMac = { kind: row.kind, name: row.name, standard: row.standard }; // the row's meaning
      if (row.bridgeFiltered) wk.bridgeFiltered = true; // only the 802.1Q reserved block carries this
      return wk; // first (and only) matching row
    }
  }
  return undefined; // an ordinary address
}

const HEX_RE = /^[0-9a-f]+$/i;

/** Strip common separators (colon, hyphen, dot, whitespace); validate hex. */
function cleanHex(input: string): string | null {
  const h = input.replace(/[\s:.\-]/g, "").toUpperCase();
  if (!h || !HEX_RE.test(h)) return null;
  return h;
}

/** Group a hex string into colon-separated byte pairs. */
function formatPairs(hex: string): string {
  return (hex.match(/.{1,2}/g) ?? []).join(":");
}

/**
 * Parse and classify a MAC or OUI without touching vendor data. Accepts a full
 * MAC-48/EUI-48 (12 hex), an EUI-64 (16 hex), or a bare OUI (6 hex), in colon,
 * hyphen, dot (Cisco 0011.2233.4455), or unseparated form.
 */
export function normalizeMac(input: string): OuiResult {
  const s = input.trim();
  if (!s) return { ok: false, input: s, error: { message: "Enter a MAC address or OUI." } };
  const hex = cleanHex(s);
  if (!hex) {
    return {
      ok: false,
      input: s,
      error: { message: "That is not valid hex. Use a MAC address, optionally separated by colons, hyphens, or dots." },
    };
  }
  if (hex.length !== 6 && hex.length !== 12 && hex.length !== 16) {
    return {
      ok: false,
      input: s,
      error: { message: `A MAC is 12 hex digits (16 for EUI-64) and an OUI is 6; got ${hex.length}.` },
    };
  }
  const oui = hex.slice(0, 6);
  const b0 = parseInt(hex.slice(0, 2), 16);
  return {
    ok: true,
    input: s,
    hex,
    formatted: formatPairs(hex),
    oui,
    ouiFormatted: formatPairs(oui),
    multicast: (b0 & 0x01) !== 0,
    local: (b0 & 0x02) !== 0,
    isOuiOnly: hex.length === 6,
  };
}

/**
 * Full analysis: normalize, then resolve the vendor via the injected lookup.
 * A locally administered address has no manufacturer, so the lookup is skipped
 * and a note explains why.
 */
export function analyzeMac(input: string, lookup: (oui: string) => string | null): OuiResult {
  const base = normalizeMac(input);
  if (!base.ok) return base;

  const notes: string[] = [];
  let vendor: string | null = null;
  const wellKnown = wellKnownMac(base.hex as string); // a standard-defined meaning, checked before the vendor notes (2026-10-19)

  if (base.local) {
    if (!wellKnown) { // ordinary locally administered address
      // 33-33 has the U/L bit set but is the IPv6 multicast mapping, not a software-assigned address (RFC 9542 s2.3.1)
      notes.push(
        "This is a locally administered address (the U/L bit is set): it was assigned by software, not by a manufacturer, so it has no OUI vendor.",
      );
    }
  } else {
    vendor = lookup(base.oui as string);
    if (!vendor && !wellKnown) { // unknown OUI and no standard meaning
      // a standard group address such as 01-00-5E or 01-80-C2 is defined, so "not in the snapshot" would mislead (2026-10-19)
      notes.push(
        "This OUI is not in the IEEE MA-L snapshot. It may be unassigned, newer than the snapshot, or from the MA-M / MA-S registries this tool does not yet include.",
      );
    }
  }
  if (base.multicast) {
    notes.push("The I/G bit is set, so this is a multicast (group) address rather than a single interface.");
  }

  const out: OuiResult = { ...base, vendor, notes }; // the result as before 2026-10-19
  if (wellKnown) out.wellKnown = wellKnown; // the field stays absent for ordinary addresses, so older outputs are unchanged
  return out; // full analysis
}
