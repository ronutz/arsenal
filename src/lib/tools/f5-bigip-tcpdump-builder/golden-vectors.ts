// ============================================================================
// src/lib/tools/f5-bigip-tcpdump-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the BIG-IP tcpdump builder (set id: "bigip-tcpdump-v1").
//
// Each case overlays a few fields on DEFAULT_OPTIONS and pins the exact command
// string plus the number of advisories. The canonical case reproduces the form
// F5 documents (tcpdump -nn -i 0.0:nnnp -s0 … host … and port …); the others
// cover a VLAN detail level, an unfiltered 0.0 (which must warn), ":p" with no
// detail, a fully-flagged custom capture, and a partition path whose space
// forces quoting while the TMM colon stays outside the quotes.
// ============================================================================

import type { TcpdumpOptions } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "bigip-tcpdump-v1";

export interface TcpdumpGoldenVector {
  name: string;
  /** Fields overlaid on DEFAULT_OPTIONS for this case. */
  options: Partial<TcpdumpOptions>;
  /** The exact command buildCommand() must return. */
  command: string;
  /** How many advisories buildCommand() must return. */
  warningCount: number;
}

export const TCPDUMP_GOLDEN_VECTORS: TcpdumpGoldenVector[] = [
  {
    name: "canonical-0.0-nnnp-full-file-filter",
    options: {
      iface: "0.0",
      detail: "nnn",
      bothSides: true,
      nameResolution: "no-dns-port",
      snaplen: "full",
      writeFile: true,
      fileName: "/var/tmp/capture.pcap",
      filter: "host 192.168.2.100 and port 80",
    },
    command: "tcpdump -nn -i 0.0:nnnp -s0 -w /var/tmp/capture.pcap host 192.168.2.100 and port 80",
    warningCount: 1, // -s0 on 15.x note
  },
  {
    name: "vlan-low-detail",
    options: {
      iface: "internal",
      detail: "n",
      bothSides: false,
      nameResolution: "no-dns",
      snaplen: "default",
      writeFile: false,
      filter: "host 10.1.1.1",
    },
    command: "tcpdump -n -i internal:n host 10.1.1.1",
    warningCount: 0,
  },
  {
    name: "unfiltered-0.0-warns",
    options: {
      iface: "0.0",
      detail: "",
      bothSides: false,
      nameResolution: "default",
      snaplen: "default",
      writeFile: false,
      filter: "",
    },
    command: "tcpdump -i 0.0",
    warningCount: 1, // unbounded 0.0
  },
  {
    name: "both-sides-only-0.0-p",
    options: {
      iface: "0.0",
      detail: "",
      bothSides: true,
      nameResolution: "default",
      snaplen: "default",
      writeFile: false,
      filter: "",
    },
    command: "tcpdump -i 0.0:p",
    warningCount: 1, // unbounded 0.0
  },
  {
    name: "custom-snaplen-count-verbose-ether",
    options: {
      iface: "1.1",
      detail: "nn",
      bothSides: false,
      nameResolution: "no-dns-port",
      snaplen: "custom",
      snaplenValue: 96,
      count: 1000,
      verbosity: "vv",
      etherHeader: true,
      writeFile: false,
      filter: "port 443",
    },
    command: "tcpdump -nn -i 1.1:nn -s96 -c 1000 -vv -e port 443",
    warningCount: 0,
  },
  {
    name: "quoted-partition-vlan-colon-outside-quotes",
    options: {
      iface: "/Partition 1/profile",
      detail: "nnn",
      bothSides: true,
      nameResolution: "no-dns-port",
      snaplen: "default",
      writeFile: false,
      filter: "host 10.1.1.1",
    },
    command: "tcpdump -nn -i '/Partition 1/profile':nnnp host 10.1.1.1",
    warningCount: 0,
  },
];
