// ============================================================================
// src/lib/tools/tcpdump-filter-explainer/texts.ts
// ----------------------------------------------------------------------------
// Shared vocabulary for the explainer's sentences, in British English and in
// Brazilian Portuguese. In pt-BR the protocol tokens, keywords and the jargon
// Brazilian engineers say in English (header, flag, offset, payload, buffer,
// snaplen, timestamp) stay in English; only the prose is Portuguese.
//
// Every sentence the engine produces is our own wording of what the cited
// document says; nothing is copied from the man pages (their text keeps its
// own licence).
// ============================================================================

/** A sentence in both authored languages. */
export interface Bi {
  /** British English. */
  en: string;
  /** Brazilian Portuguese. */
  pt: string;
}

/** Build a bilingual sentence. */
export function bi(en: string, pt: string): Bi {
  return { en, pt }; // the pair
}

/** A remark attached to a node, an option or the whole input, with the document it rests on. */
export interface Note {
  /** Stable code (golden vectors pin these). */
  code: string;
  /** The remark in English. */
  en: string;
  /** The remark in Portuguese. */
  pt: string;
  /** The id of the source in the manifest (index.ts) the remark rests on. */
  source: string;
}

/** Build a note. */
export function note(code: string, text: Bi, source: string): Note {
  return { code, en: text.en, pt: text.pt, source }; // flattened for JSON
}

/**
 * The source ids used by notes (must match manifest source ids in index.ts). The basis is the releases tcpdump.org
 * offers (read 2026-10-27): tcpdump 4.99.7 (stable), libpcap 1.10.7 (stable) and libpcap 1.11.0 (testing); the
 * development pages and code are cited only for what exists there alone.
 */
export const SRC = Object.freeze({
  tcpdump: "tcpdump-1", // tcpdump(1) for tcpdump 4.99.7, the stable release
  tcpdumpDev: "tcpdump-1-dev", // tcpdump(1), the development page (5.0.0-PRE-GIT)
  filter: "pcap-filter-7", // pcap-filter(7) for libpcap 1.11.0, the testing release
  filterStable: "pcap-filter-7-1107", // pcap-filter(7) for libpcap 1.10.7, the stable release
  filterDev: "pcap-filter-7-dev", // pcap-filter(7), the development page (1.11.1-PRE-GIT)
  scanner: "libpcap-scanner", // libpcap scanner.l, tag libpcap-1.11.0 (1.10.7 differs only where a note says)
  grammar: "libpcap-grammar", // libpcap grammar.y.in, tag libpcap-1.11.0 (1.10.7 differs only where a note says)
  gencode: "libpcap-gencode", // libpcap gencode.c, tag libpcap-1.11.0
  gencodeStable: "libpcap-gencode-1107", // libpcap gencode.c, tag libpcap-1.10.7
  gencodeDev: "libpcap-gencode-dev", // libpcap gencode.c, master (after 1.11.0)
  optimize: "libpcap-optimize", // libpcap optimize.c, tag libpcap-1.11.0 (the same refusals in 1.10.7)
  ieee80211: "libpcap-ieee80211", // libpcap ieee80211.h, tag libpcap-1.11.0 (the frame control masks)
  tcpdumpC: "tcpdump-c", // tcpdump.c, tag tcpdump-4.99.7
  tcpdumpCDev: "tcpdump-c-dev", // tcpdump.c, master (5.0.0-PRE-GIT)
  bison: "bison-precedence", // Bison manual, How Precedence Works
  iana: "iana-protocol-numbers", // IANA Protocol Numbers registry
});

/** A direction qualifier in words. */
export function dirWords(dir: string | null): Bi {
  switch (dir) {
    case null: case "src or dst": return bi("source or destination", "origem ou destino"); // the default
    case "src": return bi("source", "origem"); // src
    case "dst": return bi("destination", "destino"); // dst
    case "src and dst": return bi("source and destination (both must match)", "origem e destino (os dois precisam bater)"); // src and dst
    case "addr1": return bi("first 802.11 address (addr1)", "primeiro endereço 802.11 (addr1)"); // addr1
    case "addr2": return bi("second 802.11 address (addr2)", "segundo endereço 802.11 (addr2)"); // addr2
    case "addr3": return bi("third 802.11 address (addr3)", "terceiro endereço 802.11 (addr3)"); // addr3
    case "addr4": return bi("fourth 802.11 address (addr4, WDS frames only)", "quarto endereço 802.11 (addr4, só em frames WDS)"); // addr4
    case "ra": return bi("802.11 receiver address (RA)", "endereço do receptor 802.11 (RA)"); // ra
    case "ta": return bi("802.11 transmitter address (TA)", "endereço do transmissor 802.11 (TA)"); // ta
    default: return bi(dir, dir); // not reached
  }
}

/** The explicit spelling of a direction, for the "defaults made explicit" line. */
export function dirExplicit(dir: string | null): string {
  if (dir === null || dir === "src or dst") return "(src or dst)"; // the default, spelled
  if (dir === "src and dst") return "(src and dst)"; // both
  return dir; // a single word
}

/** Names of the TCP flag bits of octet 13, by bit value (tcpdump(1) TCP header diagram; libpcap scanner.l names). */
export const TCP_FLAG_BITS: readonly { bit: number; name: string; named: string }[] = Object.freeze([
  { bit: 0x80, name: "CWR", named: "tcp-cwr" }, // bit 7
  { bit: 0x40, name: "ECE", named: "tcp-ece" }, // bit 6
  { bit: 0x20, name: "URG", named: "tcp-urg" }, // bit 5
  { bit: 0x10, name: "ACK", named: "tcp-ack" }, // bit 4
  { bit: 0x08, name: "PSH", named: "tcp-push" }, // bit 3
  { bit: 0x04, name: "RST", named: "tcp-rst" }, // bit 2
  { bit: 0x02, name: "SYN", named: "tcp-syn" }, // bit 1
  { bit: 0x01, name: "FIN", named: "tcp-fin" }, // bit 0
]);

/** The flag names set in a byte value, most significant first. */
export function flagNames(v: number): string[] {
  return TCP_FLAG_BITS.filter((f) => (v & f.bit) !== 0).map((f) => f.name); // the names of the set bits
}

/** Join a list in words ("a, b and c" / "a, b e c"). */
export function joinWords(items: string[], lang: "en" | "pt"): string {
  if (items.length <= 1) return items.join(""); // zero or one
  const last = items[items.length - 1]; // the last item
  return `${items.slice(0, -1).join(", ")} ${lang === "en" ? "and" : "e"} ${last}`; // a, b and c
}

/** ICMP type names by value, from the named values the scanner defines. */
export const ICMP_TYPE_NAMES: Readonly<Record<number, string>> = Object.freeze({
  0: "icmp-echoreply", 3: "icmp-unreach", 4: "icmp-sourcequench", 5: "icmp-redirect", 8: "icmp-echo", // types
  9: "icmp-routeradvert", 10: "icmp-routersolicit", 11: "icmp-timxceed", 12: "icmp-paramprob", 13: "icmp-tstamp", // types
  14: "icmp-tstampreply", 15: "icmp-ireq", 16: "icmp-ireqreply", 17: "icmp-maskreq", 18: "icmp-maskreply", // types
});

/** ICMPv6 type names by value, from the named values the scanner defines. */
export const ICMP6_TYPE_NAMES: Readonly<Record<number, string>> = Object.freeze({
  1: "icmp6-destinationunreach", 2: "icmp6-packettoobig", 3: "icmp6-timeexceeded", 4: "icmp6-parameterproblem", // errors
  128: "icmp6-echo", 129: "icmp6-echoreply", 130: "icmp6-multicastlistenerquery", 131: "icmp6-multicastlistenerreportv1", // informational
  132: "icmp6-multicastlistenerdone", 133: "icmp6-routersolicit", 134: "icmp6-routeradvert", 135: "icmp6-neighborsolicit", // ND
  136: "icmp6-neighboradvert", 137: "icmp6-redirect", 138: "icmp6-routerrenum", 139: "icmp6-nodeinformationquery", // more
  140: "icmp6-nodeinformationresponse", 141: "icmp6-ineighbordiscoverysolicit", 142: "icmp6-ineighbordiscoveryadvert", // more
  143: "icmp6-multicastlistenerreportv2", 144: "icmp6-homeagentdiscoveryrequest", 145: "icmp6-homeagentdiscoveryreply", // more
  146: "icmp6-mobileprefixsolicit", 147: "icmp6-mobileprefixadvert", 148: "icmp6-certpathsolicit", 149: "icmp6-certpathadvert", // more
  151: "icmp6-multicastrouteradvert", 152: "icmp6-multicastroutersolicit", 153: "icmp6-multicastrouterterm", // more
});
