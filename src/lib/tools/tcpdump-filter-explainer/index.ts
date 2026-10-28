// ============================================================================
// src/lib/tools/tcpdump-filter-explainer/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the tcpdump command and
// filter explainer: paste a tcpdump command line or a bare capture filter and
// read every option and every primitive in plain words, with the implicit
// defaults, the precedence, the byte offsets and the errors made explicit.
//
// It parses text only: nothing is captured, executed, resolved or fetched
// (zero egress, D-49). The engine is pure and golden-vector tested. It is the
// reading companion of the capture builders (f5-bigip-tcpdump-builder,
// fortios-sniffer-builder), which it links to rather than duplicates.
// ============================================================================

import { run as runEngine, type TcpdumpExplanation } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, ACCEPT_VECTORS, REJECT_VECTORS } from "./golden-vectors"; // the vectors

export {
  explain, // command or filter, explained
  explainFilter, // one filter expression, explained
  run as runTcpdumpExplainer, // the API entry point
  PAGE_VERSIONS, // the releases the explanations follow, and the development versions they mention
  MAX_INPUT, // the input cap
  TcpdumpExplainerError, // the typed refusal
} from "./compute";
export type { TcpdumpExplanation, FilterExplanation, FilterError, XNode, XArith, CommandExplanation, OptionUse, Bi, Note } from "./compute"; // result types
export { tokenize, KEYWORDS, NAMED_VALUES } from "./lexer"; // the scanner and its tables
export { OPTION_KEYS } from "./options"; // the documented options
export { GOLDEN_VECTOR_SET_ID, ACCEPT_VECTORS, REJECT_VECTORS, verifyVectors, shape } from "./golden-vectors"; // the vectors and their runner
export type { AcceptVector, RejectVector, AcceptExpect } from "./golden-vectors"; // their types

/** The D-49 declarative manifest for the tcpdump command and filter explainer. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Protocol & packet decoders", // the catalogue family (the queued bpf-filter-explainer's)
  toolSlug: "tcpdump-filter-explainer", // the route segment and i18n key
  canonicalAliases: ["tcpdump explainer", "bpf filter explainer", "pcap filter explainer", "capture filter explainer", "tcpdump command explainer", "pcap-filter"], // search aliases
  inputDetectors: [
    // Anchored or literal patterns; every optional group carries its own required characters, so no two
    // quantifiers compete for the same text (ReDoS-safe). Examples are golden-vector inputs.
    { kind: "regex", pattern: "^\\s*(sudo\\s+)?tcpdump\\s", priority: 8, example: "sudo tcpdump -nn -i eth0 -c 20 'tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn and host 192.0.2.10 and port 443'" }, // example-syn-without-ack
    { kind: "regex", pattern: "tcp\\[(13|tcpflags)\\]", priority: 6, example: "tcp[tcpflags] & tcp-syn != 0" }, // tcpflags-named
    { kind: "regex", pattern: "^\\s*(?:(?:tcp|udp|ip6|ip|ether)\\s+)?(?:(?:src|dst)\\s+)?(?:host|net|port|portrange)\\s+\\S", priority: 5, example: "tcp dst port ftp or ftp-data or domain" }, // shorthand-tcp-dst-port
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // text parsing; no network, no clock, no execution
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the vector set id
  dangerousInputHandling: ["bounded-parse", "redos-guard", "depth-guard", "never-executes", "never-resolves"], // 4096 characters, hand-written scanner, 100 nesting levels, nothing run or looked up
  shareSafetyDefault: "fragment", // a filter can name internal hosts and networks

  // -- Teaching & provenance --
  learnLinks: [
    "learn/capture-points-before-packets", // where a capture filter belongs in a capture plan
    "learn/wireshark-and-the-capture-stack", // BPF, libpcap, tcpdump and where the filter syntax comes from
  ],
  relatedTools: ["f5-bigip-tcpdump-builder", "fortios-sniffer-builder", "f5-packet-filter-explainer", "curl-command-explainer", "dig-output-explainer"], // the builders it complements, and the other CLI explainers
  // Every source was downloaded with curl and read on its access_date (corpus kept with the build notes). The basis is
  // the releases tcpdump.org labels stable (tcpdump 4.99.7, libpcap 1.10.7) and testing (libpcap 1.11.0); the project
  // publishes no support or end-of-life dates. The development pages and code are cited only for what exists there alone.
  sources: [
    { id: "tcpdump-org", label: "tcpdump.org home page, Latest Releases: tcpdump 4.99.7 (stable, 21 September 2026), libpcap 1.10.7 (stable, 5 September 2026), libpcap 1.11.0 (testing, 13 September 2026)", url: "https://www.tcpdump.org/index.html", access_date: "2026-10-27", scope: "which releases are current and how the project labels them", status: "active" }, // the basis
    { id: "tcpdump-1", label: "tcpdump(1) for tcpdump 4.99.7, the stable release (page dated 2 February 2026), tcpdump.org: SYNOPSIS, DESCRIPTION, OPTIONS, EXAMPLES, the TCP flags walk-through (octets 12 and 13)", url: "https://www.tcpdump.org/manpages/tcpdump.1-4.99.7.html", access_date: "2026-10-27", scope: "every option, the quoting advice for the expression, the TCP flag bits", status: "active" }, // options
    { id: "tcpdump-1-dev", label: "tcpdump(1), the development page on tcpdump.org (documents tcpdump 5.0.0-PRE-GIT, dated 10 September 2026)", url: "https://www.tcpdump.org/manpages/tcpdump.1.html", access_date: "2026-10-27", scope: "what only the development version has: --lengths, --print-sampling, --skip, the -T types geneve and quic, the advice to put -- before the expression", status: "active" }, // development only
    { id: "pcap-filter-7", label: "pcap-filter(7) for libpcap 1.11.0, the testing release (page dated 12 September 2026), tcpdump.org: DESCRIPTION, PRIMITIVES, ARITHMETIC EXPRESSIONS, PACKET DATA ACCESSORS, NAMED VALUES, COMPOUND EXPRESSIONS, EXAMPLES, BACKWARD COMPATIBILITY", url: "https://www.tcpdump.org/manpages/libpcap-1.11.0/pcap-filter.7.html", access_date: "2026-10-27", scope: "the filter language: qualifiers and their defaults, every primitive, precedence, the shorthand, offsets, vlan and mpls, and what changed in which version", status: "active" }, // the language
    { id: "pcap-filter-7-1107", label: "pcap-filter(7) for libpcap 1.10.7, the stable release (page dated 13 June 2023), tcpdump.org", url: "https://www.tcpdump.org/manpages/libpcap-1.10.7/pcap-filter.7.html", access_date: "2026-10-27", scope: "the same language as documented for the stable release, before the 1.11.0 additions", status: "active" }, // the stable page
    { id: "pcap-filter-7-dev", label: "pcap-filter(7), the development page on tcpdump.org (documents libpcap 1.11.1-PRE-GIT, dated 16 September 2026)", url: "https://www.tcpdump.org/manpages/pcap-filter.7.html", access_date: "2026-10-27", scope: "the systems that run % and ^ in the kernel (the only paragraph the tool takes from it)", status: "active" }, // development only
    { id: "libpcap-scanner", label: "libpcap scanner.l at tags libpcap-1.11.0 and libpcap-1.10.7 (1.10.7 has no vxlan keyword)", url: "https://github.com/the-tcpdump-group/libpcap/blob/libpcap-1.11.0/scanner.l", access_date: "2026-10-27", scope: "tokens: keywords (case-sensitive), names with hyphens, numbers (octal with a leading 0), MAC and IPv6 forms, named offsets and values", status: "active" }, // tokens
    { id: "libpcap-grammar", label: "libpcap grammar.y.in at tags libpcap-1.11.0 and libpcap-1.10.7 (the same rules apart from vxlan, the 802.11 subtypes bar and ba, and the 802.11 direction check)", url: "https://github.com/the-tcpdump-group/libpcap/blob/libpcap-1.11.0/grammar.y.in", access_date: "2026-10-27", scope: "the grammar: and/or at equal precedence, not, the value lists, qualifier passing, the arithmetic operators and their declared precedence, the 802.11 value checks", status: "active" }, // grammar
    { id: "libpcap-gencode", label: "libpcap gencode.c at tag libpcap-1.11.0, the testing release", url: "https://github.com/the-tcpdump-group/libpcap/blob/libpcap-1.11.0/gencode.c", access_date: "2026-10-27", scope: "which qualifier and value combinations the compiler refuses, the value caps, the right-hand side check of /, %, << and >>, and pcap_compile refusing a filter that rejects every packet when the optimiser runs", status: "active" }, // refusals
    { id: "libpcap-gencode-1107", label: "libpcap gencode.c at tag libpcap-1.10.7, the stable release", url: "https://github.com/the-tcpdump-group/libpcap/blob/libpcap-1.10.7/gencode.c", access_date: "2026-10-27", scope: "the same refusals as 1.11.0 except the caps 1.11.0 added, and gateway only in builds without IPv6", status: "active" }, // stable refusals
    { id: "libpcap-gencode-dev", label: "libpcap gencode.c, master (1.11.1-PRE-GIT)", url: "https://github.com/the-tcpdump-group/libpcap/blob/master/gencode.c", access_date: "2026-10-27", scope: "the right-hand side check of /, %, << and >> limited to a plain number, after 1.11.0", status: "active" }, // development only
    { id: "libpcap-optimize", label: "libpcap optimize.c at tags libpcap-1.11.0 and libpcap-1.10.7", url: "https://github.com/the-tcpdump-group/libpcap/blob/libpcap-1.11.0/optimize.c", access_date: "2026-10-27", scope: "constant folding refusing a division or modulus by zero and a shift by more than 31 bits", status: "active" }, // the optimizer
    { id: "libpcap-ieee80211", label: "libpcap ieee80211.h at tags libpcap-1.11.0 and libpcap-1.10.7", url: "https://github.com/the-tcpdump-group/libpcap/blob/libpcap-1.11.0/ieee80211.h", access_date: "2026-10-27", scope: "the 802.11 frame control masks: type 0x0c, subtype 0xf0, direction 0x03 (both tags); Block Ack Request 0x80 and Block Ack 0x90 (1.11.0 only)", status: "active" }, // 802.11
    { id: "tcpdump-c", label: "tcpdump.c at tag tcpdump-4.99.7, the stable release", url: "https://github.com/the-tcpdump-group/tcpdump/blob/tcpdump-4.99.7/tcpdump.c", access_date: "2026-10-27", scope: "the option letters and long options, argument parsing and bounds, -Q values, options present only in some builds, repeated -n", status: "active" }, // option parsing
    { id: "tcpdump-c-dev", label: "tcpdump.c, master (5.0.0-PRE-GIT)", url: "https://github.com/the-tcpdump-group/tcpdump/blob/master/tcpdump.c", access_date: "2026-10-27", scope: "the options and -T types only the development version has, and its stricter argument parsing", status: "active" }, // development only
    { id: "bison-precedence", label: "GNU Bison manual, 5.3.5 How Precedence Works (Bison 3.8.1)", url: "https://www.gnu.org/software/bison/manual/html_node/How-Precedence.html", access_date: "2026-10-27", scope: "with no declared precedence on the rule or the token, the parser shifts (how % and ^ group)", status: "active" }, // % and ^
    { id: "iana-protocol-numbers", label: "IANA, Assigned Internet Protocol Numbers (CSV)", url: "https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv", access_date: "2026-10-27", scope: "the IP protocol numbers of icmp, igmp, tcp, udp, esp, ah, icmp6, pim, vrrp and sctp", status: "active" }, // numbers
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the author
  ],
});

/**
 * run - the registry-facing entry point.
 * @param input a tcpdump command line or a bare filter expression
 * @returns the explanation (throws TcpdumpExplainerError on empty or over-long input)
 */
export function run(input: string): TcpdumpExplanation {
  return runEngine(input); // the engine
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = ACCEPT_VECTORS; // the accept vectors
export const rejectVectors = REJECT_VECTORS; // the refusals
