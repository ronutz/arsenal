// ============================================================================
// src/lib/tools/oui-lookup/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING OUI / MAC LOOKUP - a {manifest, run, vectors} triple.
// Normalize a MAC address, read its unicast/multicast and universal/local bits,
// and resolve the 24-bit OUI to its registered organization from an embedded
// IEEE MA-L snapshot. Bounded, offline, computes what it shows.
//
// run() imports the full snapshot (server-side, via the tool registry); the
// client component lazy-loads the same snapshot so its page stays light.
// ============================================================================

import { analyzeMac } from "./compute";
import { getOuiMap } from "./oui-data";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { normalizeMac, analyzeMac, wellKnownMac } from "./compute"; // wellKnownMac added 2026-10-19
export type { OuiResult, WellKnownMac, WellKnownKind } from "./compute"; // the well-known types added 2026-10-19
export { getOuiMap, OUI_MA_L_SNAPSHOT_DATE } from "./oui-data";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

/** D-49 run entrypoint (API parity): full MAC/OUI analysis with vendor lookup. */
export function run(input: string) {
  const map = getOuiMap();
  return analyzeMac(input, (oui) => map.get(oui) ?? null);
}

/** The D-49 declarative manifest for the oui-lookup tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing",
  toolSlug: "oui-lookup",
  canonicalAliases: ["mac-lookup", "mac-vendor", "oui-vendor", "mac-address-lookup", "oui-decoder"],
  inputDetectors: [
    {
      kind: "regex",
      // A MAC-48 in colon or hyphen form: 00:11:22:33:44:55.
      pattern: "^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$",
      priority: 7,
      example: "00:1b:54:11:22:33",
    },
    {
      kind: "regex",
      // Cisco dotted triple: 0011.2233.4455.
      pattern: "^([0-9a-fA-F]{4}\\.){2}[0-9a-fA-F]{4}$",
      priority: 7,
      example: "0000.0c11.2233",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "bounded-parse", // the input guards, as before
    "share-input", // Share results (2026-10-27) builds a link only when pressed, carrying the field as the #input= handoff that usePrefill already reads
  ],
  shareSafetyDefault: "param", // a MAC/OUI is a non-sensitive hardware identifier

  // -- Teaching & provenance --
  learnLinks: ["learn/what-is-an-oui"],
  sources: [
    {
      id: "ieee-oui-mal",
      label: "IEEE Registration Authority: MA-L (OUI) public listing",
      type: "registry",
      url: "https://standards-oui.ieee.org/oui/oui.csv",
      access_date: "2026-07-10",
      scope: "the OUI-to-organization assignments embedded as a point-in-time snapshot",
      status: "active",
    },
    {
      id: "ieee-802",
      label: "IEEE Std 802-2014: universal/local and individual/group bits of a MAC address",
      type: "spec",
      url: "https://standards.ieee.org/ieee/802/6847/",
      access_date: "2026-07-10",
      scope: "the two significant bits of the first octet that this tool reads",
      status: "active",
    },
    // -- Sources added 2026-10-19 (PRIME's decisions B1 to B3), each downloaded that day --
    {
      id: "rfc1112", // IPv4 multicast to Ethernet mapping
      label: "RFC 1112 - Host Extensions for IP Multicasting", // August 1989
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc1112", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "section 6.4: the low-order 23 bits of the group address placed into 01-00-5E-00-00-00", // the IPv4 mapping
      status: "active", // current
    },
    {
      id: "rfc2464", // IPv6 multicast to Ethernet mapping
      label: "RFC 2464 - Transmission of IPv6 Packets over Ethernet Networks", // December 1998
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc2464", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "section 7: 33-33 followed by the last four octets of the IPv6 destination", // the IPv6 mapping
      status: "active", // current
    },
    {
      id: "rfc9568", // VRRP v3
      label: "RFC 9568 - Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6", // obsoletes RFC 5798
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc9568", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "section 7.3: virtual router MAC 00-00-5E-00-01-{VRID} (IPv4) and 00-00-5E-00-02-{VRID} (IPv6); VRID 1-255", // the VRRP rows
      status: "active", // current
    },
    {
      id: "rfc9542", // IANA OUI usage
      label: "RFC 9542 - IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters", // April 2024
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc9542", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "section 2.1.3 (blocks under 00-00-5E / 01-00-5E), 2.1.4 (documentation values), 2.3.1 (33-33 prefix, Local bit on)", // the IANA blocks
      status: "active", // current
    },
    {
      id: "iana-ethernet-numbers", // the IANA table itself
      label: "IANA Ethernet Numbers registry: IANA Unicast and Multicast 48-bit MAC Addresses (last updated 2026-10-13)", // registry date as printed
      type: "registry", // an IANA registry
      url: "https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.txt", // text form read on the day
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "every named row under 00-00-5E and 01-00-5E that this tool recognises", // VRRP, IPv4/MPLS multicast, documentation, and the small assignments
      status: "active", // live registry
    },
    {
      id: "ieee-ra-grpmac", // IEEE standard group addresses
      label: "IEEE Registration Authority: Standards Group MAC public listing", // the IEEE RA web listing
      type: "registry", // IEEE RA registry listing
      url: "https://standards.ieee.org/products-programs/regauth/grpmac/public/", // the page read on the day
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "IEEE Std 802.1D and 802.1Q reserved addresses 01-80-C2-00-00-00 to 0F; 01-80-C2-00-00-14/15 (ISO/IEC 10589); 09-00-2B-00-00-04/05 (ISO 9542)", // the group-address table
      status: "active", // live listing
    },
    {
      id: "ieee-ra-macgrp-tutorial", // why 00 to 0F are filtered
      label: "IEEE RA tutorial: Standard Group MAC Addresses: A Tutorial Guide (PDF)", // IEEE RA tutorial
      type: "spec", // explanatory document from the registry authority
      url: "https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/macgrp.pdf", // the PDF read on the day
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "01-80-C2-00-00-00 to 0F are not relayed by IEEE 802.1D MAC bridges; 09-00-2B-00-00-04/05 assigned to ISO for ISO 9542", // the block-level statement
      status: "active", // current
    },
    {
      id: "rfc1142", // IS-IS constants
      label: "RFC 1142 - OSI IS-IS Intra-domain Routing Protocol (republication of ISO DP 10589)", // February 1990, not an Internet standard
      type: "rfc", // IETF RFC (informational republication)
      url: "https://www.rfc-editor.org/rfc/rfc1142", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "the constants AllL1ISs 01-80-C2-00-00-14, AllL2ISs 01-80-C2-00-00-15, AllIntermediateSystems 09-00-2B-00-00-05, AllEndSystems 09-00-2B-00-00-04", // cross-check of the IEEE listing
      status: "active", // historic text, values unchanged
    },
  ],
  credits: [
    { handle: "ieee-ra", display_name: "IEEE Registration Authority", role: "OUI registry", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

export type ToolRunResult = ReturnType<typeof run>;
