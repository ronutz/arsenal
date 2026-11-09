// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bit-numbering-and-order/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the bit numbering and bit
// order tool (08/11/2026). Every source below was downloaded with curl on
// 2026-11-08 (generic User-Agent, no-cache headers, a cache-busting query) and
// answered HTTP 200, except Huawei's command reference, which refuses
// automated reads and was read in a browser the same day (labelled so). The
// RFC Editor's index (rfc-index.xml, read the same day) gives each RFC's
// status: RFC 791 (STD 5), RFC 1035 (STD 13), RFC 1662 (STD 51), RFC 3417
// (STD 62), RFC 9293 (STD 7) and RFC 3986 (STD 66) are Internet Standards;
// RFC 9542 is BCP 141 and RFC 6895 BCP 42; RFC 2474 and RFC 3168 are Proposed
// Standards (RFC 2474 updated by RFC 3168, 3260 and 8436); RFC 2469 is
// Informational; none of them is obsoleted.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, BIT_VECTORS } from "./golden-vectors"; // the set id and the vectors

// The engine, re-exported for the component and the registry.
export { run, runApi, runLocalisable, BitOrderInputError, SENTENCES, LAYOUTS, MAX_FIELD, MAX_WIDTH } from "./compute"; // values
export type { BitMode, Numbering, PrintOrder, MacForm, LayoutId, ValueRequest, PrintedRequest, MacRequest, BitRequest, BitRow, LayoutField, LayoutResult, FieldResult, PrintedInfo, ValueResult, MacResult, BitResult } from "./compute"; // types
// The vectors and the Examples, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, BIT_VECTORS, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { BitVector, VerifyReport } from "./golden-vectors"; // their shapes
export { EXAMPLES, SAMPLES } from "./examples"; // the page's Examples and samples

/** The D-49 declarative manifest for the bit numbering and bit order tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing", // must equal the catalogue family (D-73)
  toolSlug: "bit-numbering-and-order", // the route segment and API path
  canonicalAliases: [
    "lsb msb", // the two abbreviations
    "least significant bit", // the term
    "most significant bit", // the term
    "msb0 lsb0", // the two numberings
    "bit order", // the question on a wire
    "bit reversal", // the operation
    "canonical mac address", // RFC 2469's word
    "bit-reversed mac", // Token Ring's MSB format
    "bit numbering", // the question in a diagram
  ],
  inputDetectors: [
    {
      // A number with its base prefix: the value mode's field.
      kind: "regex",
      pattern: "^0[xX][0-9A-Fa-f]+(?:[ _][0-9A-Fa-f]+)*$|^0[bB][01]+(?:[ _][01]+)*$", // 0x3D, 0b0011_1101
      priority: 2,
      example: "0x81A0", // golden vector example-value
    },
    {
      // A form for the rest: the printed bit string with its order, and the MAC address with its form.
      kind: "structured-form",
      pattern: "mode (value | printed | mac) + input, width, layout, order, form, numbering, from, to",
      priority: 1,
      example: '{"mode":"printed","input":"10111100","order":"lsb-first","layout":"lacp"}', // golden vector example-printed
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // bit arithmetic only: no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: BIT_VECTORS.length, // the count, from the set itself
  dangerousInputHandling: [
    "redos-guard", // anchored patterns, each repetition behind a mandatory separator: linear
    "length-bound", // every field at most 80 characters, checked before any pattern runs
    "exact-arithmetic", // BigInt throughout: 64 bits are exact
    "share-input", // Share results (2026-11-08) builds a link only when pressed, carrying the mode's fields as typed after the #
  ],
  shareSafetyDefault: "param", // a number, a printed bit string or a MAC address is not sensitive (as the OUI lookup's MAC)

  // -- Teaching & provenance --
  learnLinks: ["learn/least-and-most-significant-bit"], // the article whose numberings, wire order and cases this tool computes
  sources: [
    { id: "intel-sdm-vol1", label: "Intel 64 and IA-32 Architectures Software Developer's Manual, volume 1, 253665-084US, June 2024: 1.3.1 Bit and Byte Order, 4.2.1.2 Signed Integers, 7.3.7 bit test and bit scan instructions", type: "vendor-doc", url: "https://cdrdv2-public.intel.com/825744/253665-sdm-vol-1.pdf", access_date: "2026-11-08", scope: "LSB 0: \"Bit positions are numbered from right to left. The numerical value of a set bit is equal to two raised to the power of the bit position\"; the sign bit in bit 7, 15, 31 or 63; BSF and BSR give \"the offset from the least significant bit (bit 0)\"", status: "active" }, // LSB 0 and the sign bit
    { id: "ibm-zarch-pop", label: "IBM z/Architecture Principles of Operation, SA22-7832-13, fourteenth edition, May 2022: chapter 3, information formats and operand addresses", type: "vendor-doc", url: "https://publibfi.dhe.ibm.com/epubs/pdf/a227832d.pdf", access_date: "2026-11-08", scope: "MSB 0 in a processor manual: \"bits are numbered in a left-to-right sequence\", an address's \"bits are numbered 0-63\", and in 24-bit mode \"bits 0-39 of the intermediate value are ignored\"", status: "active" }, // MSB 0 in hardware
    { id: "rfc791", label: "RFC 791, Internet Protocol, September 1981 (STD 5): Appendix B, Data Transmission Order", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc791.txt", access_date: "2026-11-08", scope: "\"the bit labeled 0 is the most significant bit\"; the octet drawn 1 0 1 0 1 0 1 0 is 170; the most significant octet of a multi-octet quantity is transmitted first", status: "active" }, // MSB 0 in the RFCs
    { id: "rfc1035", label: "RFC 1035, Domain Names: Implementation and Specification, November 1987 (STD 13): sections 2.3.2 and 4.1.1", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc1035.txt", access_date: "2026-11-08", scope: "the same transmission-order rule; the header's flags word QR, Opcode, AA, TC, RD, RA, Z and RCODE as drawn", status: "active" }, // the DNS flags word
    { id: "rfc6895", label: "RFC 6895, Domain Name System (DNS) IANA Considerations, April 2013 (BCP 42): section 2", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc6895.txt", access_date: "2026-11-08", scope: "the header drawing with AD and CD in the place of RFC 1035's Z bits", status: "active" }, // AD and CD
    { id: "iana-dns-header-flags", label: "IANA, Domain Name System (DNS) Parameters, DNS Header Flags (registry updated 2026-10-16)", type: "registry", url: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xml", access_date: "2026-11-08", scope: "AA bit 5, TC bit 6, RD bit 7, RA bit 8, bit 9 reserved, AD bit 10, CD bit 11 of the second 16-bit word (MSB 0)", status: "active" }, // DNS bit numbers
    { id: "rfc3417", label: "RFC 3417, Transport Mappings for the Simple Network Management Protocol (SNMP), December 2002 (STD 62): section 8", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc3417.txt", access_date: "2026-11-08", scope: "a BITS value is placed in \"bits 8 (high order bit) to 1 (low order bit)\" of each octet, first named bit first: 1-based numbering from the least significant bit", status: "active" }, // 1-based
    { id: "huawei-link-aggregation", label: "Huawei, S5700 and S6700 V200R025C00 Command Reference, Link Aggregation Commands: display eth-trunk and Table 5-17 PortState (read in a browser on 2026-11-08: the site refuses automated reads)", type: "vendor-doc", url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514211/54c5f31b/link-aggregation-commands", access_date: "2026-11-08", scope: "\"The status variable is eight bits, such as 10111100\", described as Bit 1 to Bit 8 in the order of 802.1AX's bits 0 to 7; the example rows 10111100, 10100000 and 10110000", status: "active" }, // Huawei's PortState
    { id: "cisco-220367", label: "Cisco, Troubleshoot EtherChannels on Catalyst 9000 Switches, document 220367, updated 8 August 2024 (read in a browser on 2026-11-08: the site refuses automated reads)", type: "vendor-doc", url: "https://www.cisco.com/c/en/us/support/docs/switches/catalyst-9300-series-switches/220367-troubleshoot-etherchannels-on-catalyst-9.html", access_date: "2026-11-08", scope: "\"The expected value for LACP flags is 0x3D (hex) or 0111101 (binary)\", seven binary digits as printed (0x3D is 00111101 in 8 bits); its state table labels Expired the most significant bit and LACP Activity the least", status: "active" }, // a dropped leading zero
    { id: "ieee8023-lag-mib", label: "IEEE 802.1 Working Group, IEEE8023-LAG-MIB (IEEE 802.1AX-2020), revision 2020-05-29: LacpState and dot3adAggPortActorAdminState", type: "standard", url: "https://www.ieee802.org/1/files/public/MIBs/IEEE8021-AX-MIB-202005290000Z.mib", access_date: "2026-11-08", scope: "LacpState BITS lacpActivity(0) to expired(7); \"The first bit corresponds to bit 0 of the Actor_State (LACP_Activity)\"", status: "active" }, // 802.1AX numbering
    { id: "linux-if-bonding", label: "The Linux kernel source, include/uapi/linux/if_bonding.h (torvalds/linux master): LACP_STATE_* masks", type: "vendor-doc", url: "https://raw.githubusercontent.com/torvalds/linux/master/include/uapi/linux/if_bonding.h", access_date: "2026-11-08", scope: "LACP_STATE_LACP_ACTIVITY 0x1 to LACP_STATE_EXPIRED 0x80: 802.1AX's bit k is the bit of weight 2^k", status: "active" }, // the LACP masks
    { id: "rfc9542", label: "RFC 9542, IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, April 2024 (BCP 141): sections 1.1, 2.1, 2.1.1, 2.1.4 and 2.3.1", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc9542.txt", access_date: "2026-11-08", scope: "bit transmission within an octet on an IEEE 802.3 link \"from the lowest order bit to the highest order bit (i.e., the reverse of the IETF's ordering)\"; the M, X, Y and Z bits of the first octet; the four SLAP quadrants; the documentation and 33-33 addresses of the samples", status: "active" }, // Ethernet bit order and the MAC bits
    { id: "rfc2469", label: "RFC 2469, A Caution On The Canonical Ordering Of Link-Layer Addresses, December 1998 (Informational): sections 2 and 3", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc2469.txt", access_date: "2026-11-08", scope: "canonical form (\"LSB format\") against Token Ring's \"MSB format\"; 12-34-56-78-9A-BC held as 48-2C-6A-1E-59-3D; bridges that \"perform bit swaps of the addresses\" in ARP packets", status: "active" }, // canonical and reversed MACs
    { id: "ieee-ra-eui", label: "IEEE Registration Authority, Guidelines for Use of Extended Unique Identifier (EUI), Organizationally Unique Identifier (OUI), and Company ID (CID), updated 1 April 2022", type: "standard", url: "https://standards-support.ieee.org/hc/en-us/articles/4888705676564-Guidelines-for-Use-of-Extended-Unique-Identifier-EUI-Organizationally-Unique-Identifier-OUI-and-Company-ID-CID", access_date: "2026-11-08", scope: "\"The least significant bit of Octet 0 (the I/G bit)\" and \"the second least significant bit of Octet 0 (the U/L bit)\"; EUI bit ordering, which \"applications and protocols must unambiguously specify\"", status: "active" }, // I/G and U/L
    { id: "linux-etherdevice", label: "The Linux kernel source, include/linux/etherdevice.h (torvalds/linux master): is_multicast_ether_addr and is_local_ether_addr", type: "vendor-doc", url: "https://raw.githubusercontent.com/torvalds/linux/master/include/linux/etherdevice.h", access_date: "2026-11-08", scope: "the group test 0x01 & addr[0] and the local test 0x02 & addr[0] on the canonical address in memory", status: "active" }, // the masks in code
    { id: "rfc1662", label: "RFC 1662, PPP in HDLC-like Framing, July 1994 (STD 51): sections 3.1, 4.5.2, 5.5 and appendix C.1", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc1662.txt", access_date: "2026-11-08", scope: "\"All octets are transmitted least significant bit first\"; binary numbers written most significant bit first, \"contrary to standard ISO and CCITT practice which orders bits as transmitted\"; the FCS-16 polynomial constant 0x8408", status: "active" }, // PPP bit order
    { id: "ti-tl16c550d", label: "Texas Instruments, TL16C550D Asynchronous Communications Element with Autoflow Control, SLLS597E, revised December 2008", type: "vendor-doc", url: "https://www.ti.com/lit/ds/symlink/tl16c550d.pdf", access_date: "2026-11-08", scope: "\"Bit 0 is the least significant bit. It is the first bit serially transmitted or received\"; even parity is \"an even number of logic 1s in the data and parity bits\"", status: "active" }, // UART bit order and parity
    { id: "nxp-um10204", label: "NXP Semiconductors, UM10204 I2C-bus specification and user manual, Rev. 7.0, 1 October 2021: 3.1.5 Byte format and Figure 10 (read in a browser on 2026-11-08: the site refuses automated reads)", type: "standard", url: "https://www.nxp.com/docs/en/user-guide/UM10204.pdf", access_date: "2026-11-08", scope: "\"Data is transferred with the Most Significant Bit (MSB) first\"; the first byte after START carries the target address from its most significant bit with the R/W bit as its least significant", status: "active" }, // I2C bit order
    { id: "linux-spi", label: "The Linux kernel source, include/linux/spi/spi.h and include/uapi/linux/spi/spi.h (torvalds/linux master): spi_device mode, SPI_LSB_FIRST", type: "vendor-doc", url: "https://raw.githubusercontent.com/torvalds/linux/master/include/linux/spi/spi.h", access_date: "2026-11-08", scope: "the \"MSB first\" default for each word in a transfer, overridden by SPI_LSB_FIRST (\"per-word bits-on-wire\")", status: "active" }, // SPI bit order
    { id: "linux-bits", label: "The Linux kernel source, include/vdso/bits.h and include/linux/bits.h (torvalds/linux master): BIT and GENMASK", type: "vendor-doc", url: "https://raw.githubusercontent.com/torvalds/linux/master/include/linux/bits.h", access_date: "2026-11-08", scope: "BIT(nr) is (1 << nr); GENMASK(h, l) is \"a contiguous bitmask starting at bit position @l and ending at position @h\", and GENMASK_ULL(39, 21) is 0x000000ffffe00000", status: "active" }, // masks in LSB 0 terms
    { id: "linux-crc32", label: "The Linux kernel source, include/linux/crc32.h (torvalds/linux master): crc32_le and crc32_be", type: "vendor-doc", url: "https://raw.githubusercontent.com/torvalds/linux/master/include/linux/crc32.h", access_date: "2026-11-08", scope: "the same CRC-32 polynomial least-significant-bit-first as 0xedb88320 and most-significant-bit-first as 0x04c11db7: one is the other bit-reversed", status: "active" }, // reflected CRCs
    { id: "iana-tcp-header-flags", label: "IANA, Transmission Control Protocol (TCP) Parameters, TCP Header Flags (registry updated 2026-10-22)", type: "registry", url: "https://www.iana.org/assignments/tcp-parameters/tcp-parameters.xml", access_date: "2026-11-08", scope: "AE bit 7, CWR bit 8, ECE 9, URG 10, ACK 11, PSH 12, RST 13, SYN 14, FIN 15", status: "active" }, // TCP bit numbers
    { id: "linux-tcp-h", label: "The Linux kernel source, include/net/tcp.h (torvalds/linux master): TCPHDR_* flags", type: "vendor-doc", url: "https://raw.githubusercontent.com/torvalds/linux/master/include/net/tcp.h", access_date: "2026-11-08", scope: "TCPHDR_FIN BIT(0) to TCPHDR_CWR BIT(7), TCPHDR_AE BIT(8)", status: "active" }, // TCP masks
    { id: "rfc9293", label: "RFC 9293, Transmission Control Protocol (TCP), August 2022 (STD 7): section 3.1, header format", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc9293.txt", access_date: "2026-11-08", scope: "the control bits CWR, ECE, URG, ACK, PSH, RST, SYN and FIN in that order after the Data Offset and the reserved bits", status: "active" }, // the TCP header
    { id: "rfc2474", label: "RFC 2474, Definition of the Differentiated Services Field (DS Field) in the IPv4 and IPv6 Headers, December 1998 (Proposed Standard, updated by RFC 3168, 3260 and 8436): section 3", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc2474.txt", access_date: "2026-11-08", scope: "the DSCP in bits 0 to 5 of the DS field, \"the left-most bit signifies bit 0\"", status: "active" }, // DSCP
    { id: "rfc3168", label: "RFC 3168, The Addition of Explicit Congestion Notification (ECN) to IP, September 2001 (Proposed Standard): section 5", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc3168.txt", access_date: "2026-11-08", scope: "\"Bits 6 and 7 in the IPv4 TOS octet are designated as the ECN field\"; the codepoints Not-ECT, ECT(1), ECT(0) and CE", status: "active" }, // ECN
    { id: "linux-if-vlan", label: "The Linux kernel source, include/linux/if_vlan.h (torvalds/linux master): VLAN_PRIO_MASK, VLAN_CFI_MASK and VLAN_VID_MASK", type: "vendor-doc", url: "https://raw.githubusercontent.com/torvalds/linux/master/include/linux/if_vlan.h", access_date: "2026-11-08", scope: "0xe000 with shift 13 for the priority, 0x1000 \"Canonical Format Indicator / Drop Eligible Indicator\", 0x0fff for the VLAN ID", status: "active" }, // the TCI
    { id: "rfc3986", label: "RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, January 2005 (STD 66): section 3.5", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc3986.txt", access_date: "2026-11-08", scope: "the fragment is \"separated from the rest of the URI prior to a dereference\": a Share results link's values are not sent to the server", status: "active" }, // the share link
    { id: "rfc-index", label: "RFC Editor, RFC index (XML): the current status of every RFC cited", type: "registry", url: "https://www.rfc-editor.org/rfc-index.xml", access_date: "2026-11-08", scope: "RFC 791, 1035, 1662, 3417, 9293 and 3986 are Internet Standards; RFC 9542 and 6895 are BCPs; RFC 2474 and 3168 Proposed Standards; RFC 2469 Informational; none obsoleted", status: "active" }, // currency
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

// Vectors, exposed by the conventional name some runners expect.
export const goldenVectors = BIT_VECTORS; // every vector
