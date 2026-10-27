// ============================================================================
// src/lib/tools/tcpdump-filter-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the tcpdump command and filter explainer.
//
// Where the inputs come from: many are printed in the pages themselves
// (pcap-filter(7) and tcpdump(1) on tcpdump.org, read 2026-10-27: "host
// helios and (hot or ace)", "ip host ace and not helios", "gateway snup and
// (port ftp or ftp-data)", "tcp dst port ftp or ftp-data or domain", "not
// host vs and ace", "mpls && mpls 1024 && host 192.9.200.1", "pppoes 0x27 &&
// ip", "vxlan 0x7 && ip6", "net 192.168 mask 255.255", the octet-13 TCP flag
// walk-through, the IPv4 HTTP data example, "tcpdump -l | tee dat"); the rest
// use the RFC 5737 and RFC 3849 documentation ranges (192.0.2.0/24,
// 2001:db8::/32) and names like the pages' own.
//
// How the expectations were fixed: each is what the cited rule says, for the
// releases tcpdump.org offers on 2026-10-27 (tcpdump 4.99.7; libpcap 1.10.7
// stable and 1.11.0 testing): pcap-filter(7) for meanings and defaults,
// libpcap grammar.y.in for grouping and qualifier inheritance, scanner.l for
// tokens and named values, gencode.c and optimize.c for refusals and caps,
// tcpdump(1) and tcpdump.c for options. The accept/reject decision of every
// filter vector was also cross-checked in the build sandbox with "tcpdump -d"
// (tcpdump 4.99.4, libpcap 1.10.4, Ubuntu 24.04; first on 2026-10-26, the
// arithmetic, 802.11 and EtherType vectors added on 2026-10-27, with and
// without -O): all agree except where a 1.11.0 addition or cap is the point
// (ip proto 256, ether proto 1000, byte 1 = 256, dir 5 and the like are
// compiled by 1.10.x and refused by 1.11.0; vxlan, the lldp name and the bar
// and ba subtypes are 1.11.0 additions), and except the primitives that need
// their own link-layer type or a name lookup, which 1.10.4 refuses on Ethernet
// or for an unknown name exactly as the notes say.
//
// verifyVectors() runs every vector and reports each mismatch.
// ============================================================================

import { explain, explainFilter, TcpdumpExplainerError, type TcpdumpExplanation, type XNode } from "./compute"; // the engine

/** The id of this vector set; bump it whenever a vector or an expectation changes. */
export const GOLDEN_VECTOR_SET_ID = "tcpdump-filter-explainer/2026-10-27a"; // second set, 2026-10-27: the release basis, arithmetic, 802.11 and EtherType refusals

/** What an accepted input must produce (only the fields given are checked). */
export interface AcceptExpect {
  /** command or filter. */
  mode: "command" | "filter";
  /** The filter is free of errors. */
  ok?: boolean;
  /** The canonical rewrite. */
  canonical?: string;
  /** The compact tree shape (see shape()). */
  shape?: string;
  /** Explicit readings by node label (first node with that label, pre-order). */
  explicit?: Record<string, string>;
  /** English meanings by node label, byte for byte. */
  meaning?: Record<string, string>;
  /** Note codes by node label, exactly and in order. */
  nodeNotes?: Record<string, string[]>;
  /** Whole-filter note codes, exactly and in order. */
  global?: string[];
  /** Command: the prefix words. */
  prefix?: string[];
  /** Command: the program word, or null. */
  program?: string | null;
  /** Command: the options as "flag", "flag*count" or "flag=arg". */
  options?: string[];
  /** Command: where the expression comes from. */
  from?: string;
  /** Command: the joined expression text. */
  expr?: string;
  /** Command: note codes, exactly and in order. */
  cmdNotes?: string[];
  /** Command: note codes per option flag, exactly and in order. */
  optNotes?: Record<string, string[]>;
  /** Shell note codes, exactly and in order. */
  shell?: string[];
}

/** One accept vector. */
export interface AcceptVector {
  /** Stable id. */
  id: string;
  /** The input, as pasted. */
  input: string;
  /** What it must produce. */
  expect: AcceptExpect;
}

/** One reject vector: the stage that refuses, the code, and where. */
export interface RejectVector {
  /** Stable id. */
  id: string;
  /** The input, as pasted. */
  input: string;
  /** input (the whole input refused), lex, syntax, semantic (a node error) or option (a command-line problem). */
  stage: "input" | "lex" | "syntax" | "semantic" | "option";
  /** The error code. */
  code: string;
  /** Offset in the expression where the error is placed (lex, syntax, semantic). */
  at?: number;
  /** Hint codes, exactly and in order (lex and syntax). */
  hints?: string[];
}

/** The inputs that must be explained, with what they must produce. */
export const ACCEPT_VECTORS: readonly AcceptVector[] = [
  // ---- the Example: a SYN-without-ACK capture on one host and port ----
  { id: "example-syn-without-ack", input: "sudo tcpdump -nn -i eth0 -c 20 'tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn and host 192.0.2.10 and port 443'", expect: {
    mode: "command", prefix: ["sudo"], program: "tcpdump", options: ["-n*2", "-i=eth0", "-c=20"], from: "words", cmdNotes: ["privileges"], shell: [],
    expr: "tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn and host 192.0.2.10 and port 443", ok: true,
    canonical: "(tcp[tcpflags] & (tcp-syn | tcp-ack) == tcp-syn and host 192.0.2.10) and port 443",
    shape: "and(and([tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn],host 192.0.2.10),port 443)",
    meaning: { "==": "True when, among ACK and SYN, only SYN is set: SYN set and ACK clear (the other flags do not matter).", "host 192.0.2.10": "True if the source or destination address is 192.0.2.10 (IPv4, ARP and RARP)." },
    explicit: { "host 192.0.2.10": "(ip or arp or rarp) (src or dst) host 192.0.2.10", "port 443": "(tcp or udp or sctp) (src or dst) port 443" },
    nodeNotes: { "==": ["tcpFlagsByte"] }, global: ["checkWithD"],
  } },
  // ---- host: the defaults by address family (pcap-filter(7), host and proto) ----
  { id: "host-ipv4-defaults", input: "host 192.0.2.1", expect: { mode: "filter", ok: true, explicit: { "host 192.0.2.1": "(ip or arp or rarp) (src or dst) host 192.0.2.1" }, meaning: { "host 192.0.2.1": "True if the source or destination address is 192.0.2.1 (IPv4, ARP and RARP)." } } },
  { id: "host-ipv6-defaults", input: "host 2001:db8::1", expect: { mode: "filter", ok: true, explicit: { "host 2001:db8::1": "ip6 (src or dst) host 2001:db8::1" } } },
  { id: "host-name-all-families", input: "host sundown", expect: { mode: "filter", ok: true, explicit: { "host sundown": "(ip or ip6 or arp or rarp) (src or dst) host sundown" }, nodeNotes: { "host sundown": ["resolvedAtCompile"] } } },
  { id: "dir-only-defaults-to-host", input: "src foo", expect: { mode: "filter", ok: true, explicit: { "src foo": "(ip or ip6 or arp or rarp) src host foo" } } },
  { id: "host-dotted-pair-is-a-network", input: "host 192.168", expect: { mode: "filter", ok: true, meaning: { "host 192.168": "True if the source or destination address is in 192.168.0.0/16 (IPv4, ARP and RARP)." }, nodeNotes: { "host 192.168": ["shortDotted"] } } },
  { id: "host-single-number", input: "host 168496141", expect: { mode: "filter", ok: true, meaning: { "host 168496141": "True if the source or destination address is 10.11.12.13 (IPv4, ARP and RARP)." }, nodeNotes: { "host 168496141": ["numberAsAddress"] } } },
  // ---- port and portrange ----
  { id: "port-defaults", input: "port 53", expect: { mode: "filter", ok: true, explicit: { "port 53": "(tcp or udp or sctp) (src or dst) port 53" } } },
  { id: "port-octal", input: "port 010", expect: { mode: "filter", ok: true, nodeNotes: { "port 010": ["octalPort"] }, meaning: { "port 010": "True if the TCP, UDP or SCTP source or destination port is 8, over IPv4 (only an unfragmented packet or the first fragment) or IPv6 (only without extension headers). Only the number is checked, not which protocol owns it." } } },
  { id: "portrange-either-order", input: "udp portrange 6008-6000", expect: { mode: "filter", ok: true, explicit: { "udp portrange 6008-6000": "udp (src or dst) portrange 6008-6000" }, nodeNotes: { "udp portrange 6008-6000": ["rangeEitherOrder"] }, meaning: { "udp portrange 6008-6000": "True if the UDP source or destination port is between 6000 and 6008 inclusive, over IPv4 (only an unfragmented packet or the first fragment) or IPv6 (only without extension headers)." } } },
  // ---- the qualifier shorthand (pcap-filter(7), DESCRIPTION and COMPOUND EXPRESSIONS) ----
  { id: "shorthand-tcp-dst-port", input: "tcp dst port ftp or ftp-data or domain", expect: { mode: "filter", ok: true, canonical: "(tcp dst port ftp or tcp dst port ftp-data) or tcp dst port domain", shape: "or(or(tcp dst port ftp,^tcp dst port ftp-data),^tcp dst port domain)" } },
  { id: "shorthand-not-host", input: "not host vs and ace", expect: { mode: "filter", ok: true, canonical: "not host vs and host ace", shape: "and(not(host vs),^host ace)", global: ["notTight", "checkWithD"] } },
  { id: "shorthand-value-list", input: "host helios and (hot or ace)", expect: { mode: "filter", ok: true, canonical: "host helios and (host hot or host ace)", shape: "and(host helios,(or(^host hot,^host ace)))" } },
  { id: "shorthand-ip-host-not", input: "ip host ace and not helios", expect: { mode: "filter", ok: true, canonical: "ip host ace and not ip host helios", shape: "and(ip host ace,not(^ip host helios))" } },
  { id: "shorthand-after-paren", input: "tcp port 80 and (host 192.0.2.1) and 443", expect: { mode: "filter", ok: true, canonical: "(tcp port 80 and (host 192.0.2.1)) and tcp port 443", global: ["parenContext", "checkWithD"] } }, // 443 takes "tcp port" from before the parenthesis, not "host" from inside it
  { id: "shorthand-net-cidr", input: "net 10.0.0.0/8 and 192.168.0.0/16", expect: { mode: "filter", ok: true, canonical: "net 10.0.0.0/8 and net 192.168.0.0/16", nodeNotes: { "net 192.168.0.0/16": ["inherited"] } } },
  // ---- net ----
  { id: "net-mask", input: "net 192.168 mask 255.255", expect: { mode: "filter", ok: true, meaning: { "net 192.168 mask 255.255": "True if the source or destination address is in 192.168.0.0/16 (IPv4, ARP and RARP)." } } },
  { id: "net-single-number", input: "net 10", expect: { mode: "filter", ok: true, meaning: { "net 10": "True if the source or destination address is in 10.0.0.0/8 (IPv4, ARP and RARP)." } } },
  { id: "net-ipv6-prefix", input: "ip6 net 2001:db8::/32", expect: { mode: "filter", ok: true, explicit: { "ip6 net 2001:db8::/32": "ip6 (src or dst) net 2001:db8::/32" } } },
  // ---- proto, protochain, gateway ----
  { id: "proto-escaped-keywords", input: "ip proto \\tcp or \\udp", expect: { mode: "filter", ok: true, canonical: "ip proto \\tcp or ip proto \\udp", nodeNotes: { "ip proto \\tcp": ["resolvedAtCompile", "escapedKeyword"] } } },
  { id: "proto-number-both-families", input: "proto 17", expect: { mode: "filter", ok: true, explicit: { "proto 17": "(ip or ip6) proto 17" } } },
  { id: "ether-proto-number", input: "ether proto 0x88cc", expect: { mode: "filter", ok: true, meaning: { "ether proto 0x88cc": "True if the packet's link-layer protocol (the EtherType on Ethernet, the LLC/SNAP protocol on FDDI, Token Ring and 802.11) is 35020 (0x88cc)." } } },
  { id: "protochain", input: "ip6 protochain 44", expect: { mode: "filter", ok: true, nodeNotes: { "ip6 protochain 44": ["protochainCost"] } } },
  { id: "gateway", input: "gateway snup and (port ftp or ftp-data)", expect: { mode: "filter", ok: true, canonical: "gateway snup and (port ftp or port ftp-data)", explicit: { "gateway snup": "ether host snup and not (ip or arp or rarp) host snup" }, nodeNotes: { "gateway snup": ["gatewayVersion", "gatewayStable", "resolvedAtCompile"] } } },
  // ---- link-layer addresses ----
  { id: "ether-src-mac", input: "ether src aa-bb-cc-dd-ee-ff", expect: { mode: "filter", ok: true, explicit: { "ether src aa-bb-cc-dd-ee-ff": "ether src host aa-bb-cc-dd-ee-ff" } } },
  { id: "twelve-digits-are-a-mac", input: "ether host 012345670123", expect: { mode: "filter", ok: true, nodeNotes: { "ether host 012345670123": ["macFromDigits"] } } },
  { id: "mac8-arcnet", input: "link host $2b", expect: { mode: "filter", ok: true, nodeNotes: { "link host $2b": ["dollarShell"] } } },
  { id: "wlan-addr2", input: "wlan addr2 0:2:3:4:5:6", expect: { mode: "filter", ok: true, explicit: { "wlan addr2 0:2:3:4:5:6": "wlan addr2 host 0:2:3:4:5:6" } } },
  // ---- special primitives ----
  { id: "ether-broadcast", input: "ether broadcast", expect: { mode: "filter", ok: true, explicit: { "ether broadcast": "ether broadcast" } } },
  { id: "ip-broadcast", input: "ip broadcast", expect: { mode: "filter", ok: true, nodeNotes: { "ip broadcast": ["ipBroadcastLoose"] } } },
  { id: "less-greater", input: "less 64 or greater 1500", expect: { mode: "filter", ok: true, explicit: { "less 64": "len <= 64", "greater 1500": "len >= 1500" } } },
  { id: "byte-deprecated", input: "byte 2 = 5", expect: { mode: "filter", ok: true, nodeNotes: { "byte 2 = 5": ["byteDeprecated"] } } },
  { id: "inbound", input: "inbound", expect: { mode: "filter", ok: true, nodeNotes: { inbound: ["linkTypeOnly"] } } },
  { id: "vlan-stack", input: "vlan 100 && vlan 200 && host 192.0.2.1", expect: { mode: "filter", ok: true, nodeNotes: { "vlan 100": ["encapShift"], "vlan 200": ["afterEncap", "encapShift"], "host 192.0.2.1": ["afterEncap"] } } },
  { id: "vlan-under-or", input: "vlan or host 192.0.2.1", expect: { mode: "filter", ok: true, global: ["encapUnderOrNot", "checkWithD"], nodeNotes: { "host 192.0.2.1": ["afterEncap"] } } },
  { id: "mpls-stack", input: "mpls && mpls 1024 && host 192.9.200.1", expect: { mode: "filter", ok: true, canonical: "(mpls && mpls 1024) && host 192.9.200.1", nodeNotes: { "host 192.9.200.1": ["afterEncap"] } } },
  { id: "pppoes", input: "pppoes 0x27 && ip", expect: { mode: "filter", ok: true, explicit: { ip: "ether proto \\ip" }, nodeNotes: { ip: ["afterEncap"] } } },
  { id: "vxlan-since-1110", input: "vxlan 0x7 && ip6", expect: { mode: "filter", ok: true, nodeNotes: { "vxlan 0x7": ["encapShift", "since1110"] } } },
  { id: "wlan-type-subtype", input: "wlan type mgt subtype beacon", expect: { mode: "filter", ok: true, nodeNotes: { "wlan type mgt subtype beacon": ["wlanOnly"] } } },
  { id: "llc-type", input: "llc ui", expect: { mode: "filter", ok: true, meaning: { "llc ui": "True if the packet has an 802.2 LLC header of type ui." } } },
  { id: "atm-field", input: "vpi 0", expect: { mode: "filter", ok: true, nodeNotes: { "vpi 0": ["linkTypeOnly"] } } },
  // ---- abbreviations ----
  { id: "abbrev-icmp-ipv4-only", input: "icmp", expect: { mode: "filter", ok: true, explicit: { icmp: "ip proto 1" }, nodeNotes: { icmp: ["icmpV4Only"] } } },
  { id: "abbrev-icmp6", input: "icmp6", expect: { mode: "filter", ok: true, explicit: { icmp6: "ip6 proto 58" } } },
  // ---- precedence ----
  { id: "and-or-left-to-right", input: "tcp or udp and icmp", expect: { mode: "filter", ok: false, canonical: "(tcp or udp) and icmp", shape: "and(or(#tcp,#udp),#icmp)", global: ["leftToRight", "checkWithD"], nodeNotes: { and: ["leftToRight", "neverTrue"] } } },
  { id: "and-or-hosts-then-port", input: "host 192.0.2.1 or host 192.0.2.2 and port 53", expect: { mode: "filter", ok: true, canonical: "(host 192.0.2.1 or host 192.0.2.2) and port 53", global: ["leftToRight", "checkWithD"] } },
  { id: "protocols-joined-by-or", input: "tcp or udp or icmp", expect: { mode: "filter", ok: true, canonical: "(tcp or udp) or icmp" } },
  // ---- byte offsets and named values ----
  { id: "tcp13-and-2", input: "tcp[13] & 2 != 0", expect: { mode: "filter", ok: true, meaning: { "!=": "True when SYN is set (the other flags do not matter)." } } },
  { id: "tcpflags-named", input: "tcp[tcpflags] & tcp-syn != 0", expect: { mode: "filter", ok: true, meaning: { "!=": "True when SYN is set (the other flags do not matter)." } } },
  { id: "tcp13-exactly-syn", input: "tcp[13] == 2", expect: { mode: "filter", ok: true, meaning: { "==": "True when the TCP flags byte (octet 13) is exactly 2: SYN set and CWR, ECE, URG, ACK, PSH, RST and FIN all clear." } } },
  { id: "rst-and-ack", input: "tcp[tcpflags] & (tcp-rst|tcp-ack) == (tcp-rst|tcp-ack)", expect: { mode: "filter", ok: true, meaning: { "==": "True when all of ACK and RST are set (the other flags do not matter)." } } },
  { id: "icmp-type-names", input: "icmp[icmptype] != icmp-echo and icmp[icmptype] != icmp-echoreply", expect: { mode: "filter", ok: true, nodeNotes: { "!=": ["icmpType"] } } },
  { id: "mod-shift-grouping", input: "ip[0] + ip[1] % ip[2] + ip[3] = 9", expect: { mode: "filter", ok: true, canonical: "ip[0] + (ip[1] % (ip[2] + ip[3])) = 9", global: ["modXorPrecedence", "checkWithD"] } },
  { id: "unary-minus-filter", input: "-ip[0] % ip[1] = 9", expect: { mode: "filter", ok: true, canonical: "-(ip[0] % ip[1]) = 9" } },
  { id: "http-data-example", input: "tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)", expect: { mode: "filter", ok: true, canonical: "tcp port 80 and (((ip[2:2] - ((ip[0] & 0xf) << 2)) - ((tcp[12] & 0xf0) >> 2)) != 0)" } },
  // ---- commands ----
  { id: "cmd-rotation", input: "tcpdump -i any -w out.pcap -C 100M -W 5 port 53 and udp", expect: { mode: "command", program: "tcpdump", options: ["-i=any", "-w=out.pcap", "-C=100M", "-W=5"], from: "words", expr: "port 53 and udp", cmdNotes: ["expressionWords", "wSilences", "runsUntilStopped"], optNotes: { "-i": ["anyInterface"], "-C": ["fileSizeBytes"] } } },
  { id: "cmd-no-optimize-never-matching", input: "tcpdump -O -d 'tcp or udp and icmp'", expect: { mode: "command", program: "tcpdump", options: ["-O", "-d"], from: "words", expr: "tcp or udp and icmp", ok: true, global: ["matchesNothing", "leftToRight", "checkWithD"] } },
  { id: "cmd-pipe", input: "tcpdump -l | tee dat", expect: { mode: "command", options: ["-l"], from: "none", shell: ["controlOperator"], cmdNotes: ["defaultInterface", "runsUntilStopped", "noExpression"] } },
  { id: "cmd-double-dash", input: "tcpdump -i eth0 -- 'icmp[icmptype] != icmp-echo and icmp[icmptype] != icmp-echoreply'", expect: { mode: "command", options: ["-i=eth0"], from: "afterDoubleDash", ok: true } },
  { id: "cmd-filter-file", input: "tcpdump -r capture.pcap -F filter.txt 'port 80'", expect: { mode: "command", options: ["-r=capture.pcap", "-F=filter.txt"], from: "file", cmdNotes: ["fIgnoresExpression"] } },
  { id: "cmd-dev-only-options", input: "tcpdump --skip 5 --print-sampling=10 -w x.pcap -nnvvX", expect: { mode: "command", options: ["--skip=5", "--print-sampling=10", "-w=x.pcap", "-n*2", "-v*2", "-X"], optNotes: { "--skip": ["devOnly"], "--print-sampling": ["devOnly"] } } },
  { id: "cmd-sudo-user", input: "sudo -u root tcpdump -tttt -e -s 0 -i eth1 vlan 100 and host 192.0.2.1", expect: { mode: "command", prefix: ["sudo"], options: ["-t*4", "-e", "-s=0", "-i=eth1"], optNotes: { "-s": ["snaplenZero"] }, expr: "vlan 100 and host 192.0.2.1", ok: true } },
  { id: "cmd-args-only", input: "-nn -i eth0 icmp", expect: { mode: "command", program: null, options: ["-n*2", "-i=eth0"], expr: "icmp", cmdNotes: ["noProgram", "runsUntilStopped"] } },
  { id: "cmd-redirect", input: "tcpdump -i eth0 port 53 > dns.txt", expect: { mode: "command", options: ["-i=eth0"], expr: "port 53", shell: ["redirect"] } },
  { id: "quoted-bare-filter", input: "'tcp port 80'", expect: { mode: "filter", ok: true, shell: ["unquoted"], explicit: { "tcp port 80": "tcp (src or dst) port 80" } } },
  // ---- added 2026-10-27: the release basis ----
  { id: "first-number-workaround-div", input: "len / tcp[1 - 1] = 1", expect: { mode: "filter", ok: true, canonical: "len / tcp[1 - 1] = 1" } }, // compiles on 1.10.4
  { id: "first-number-workaround-shift", input: "len << tcp[20 + 20] = 1", expect: { mode: "filter", ok: true } }, // compiles on 1.10.4
  { id: "shift-31-ok", input: "len >> 31 = 1", expect: { mode: "filter", ok: true } }, // the largest shift libpcap accepts
  { id: "ether-proto-llc-sap", input: "ether proto 0x42", expect: { mode: "filter", ok: true, nodeNotes: { "ether proto 0x42": ["llcSap"] }, meaning: { "ether proto 0x42": "True if the packet's link-layer protocol is 66 (0x42). As a number up to 1500 that is an 802.2 LLC DSAP on Ethernet, not an EtherType (see the note)." } } },
  { id: "wlan-subtype-bar", input: "type ctl subtype bar", expect: { mode: "filter", ok: true, nodeNotes: { "type ctl subtype bar": ["since1110", "wlanOnly"] } } },
  { id: "wlan-type-number", input: "type 4 subtype 0xb0", expect: { mode: "filter", ok: true, meaning: { "type 4 subtype 0xb0": "True if the 802.11 frame type is 4 (ctl) and its subtype is 0xb0." } } },
  { id: "wlan-dir-uppercase", input: "dir NODS", expect: { mode: "filter", ok: true } }, // names compare without case
  { id: "cmd-no-optimize-folded", input: "tcpdump -O -d 'len / (5 * 0) = 1'", expect: { mode: "command", options: ["-O", "-d"], ok: true, global: ["foldedUnchecked", "checkWithD"] } }, // compiles on 1.10.4 with -O
  { id: "cmd-release-differences", input: "tcpdump -s 0x100 -T quic -m mib -Q in -i eth0 udp", expect: { mode: "command", options: ["-s=0x100", "-T=quic", "-m=mib", "-Q=in", "-i=eth0"], optNotes: { "-s": ["snaplenRadix"], "-T": ["devOnlyType"], "-m": ["buildDependent"], "-Q": ["buildDependent"] } } },
];

/** The inputs that must be refused, with the code and the position. */
export const REJECT_VECTORS: readonly RejectVector[] = [
  // ---- the whole input ----
  { id: "reject-empty", input: "   ", stage: "input", code: "empty" },
  { id: "reject-too-long", input: "host ".repeat(820), stage: "input", code: "tooLong" },
  // ---- the scanner ----
  { id: "reject-comma", input: "port 80 , 443", stage: "lex", code: "badChar", at: 8, hints: ["commaList"] },
  { id: "reject-non-octal", input: "port 080", stage: "lex", code: "nonOctal", at: 5, hints: ["leadingZero"] },
  { id: "reject-overflow", input: "4294967296 > 0", stage: "lex", code: "overflow", at: 0, hints: [] },
  { id: "reject-bad-mac", input: "host aa:bb:cc", stage: "lex", code: "badMac", at: 5, hints: [] },
  { id: "reject-bad-ipv6", input: "host ::1.2.3.256", stage: "lex", code: "badIpv6", at: 5, hints: [] },
  // ---- the grammar ----
  { id: "reject-unescaped-proto-keyword", input: "ip proto tcp", stage: "syntax", code: "syntax", at: 9, hints: ["escapeKeyword"] },
  { id: "reject-src-or-udp", input: "tcp src or udp", stage: "syntax", code: "syntax", at: 11, hints: [] },
  { id: "reject-paren-number-and", input: "(1) and port 80", stage: "syntax", code: "syntax", at: 4, hints: [] },
  { id: "reject-double-paren-value", input: "host 192.0.2.1 and ((192.0.2.2))", stage: "syntax", code: "syntax", at: 21, hints: ["doubleParenValue"] },
  { id: "reject-len-minus-name", input: "len-1 > 0", stage: "syntax", code: "syntax", at: 0, hints: ["dashInName", "bareNameFirst"] },
  { id: "reject-dangling-or", input: "host 192.0.2.1 or", stage: "syntax", code: "syntax", at: 17, hints: ["danglingOperator"] },
  { id: "reject-unbalanced", input: "(host 192.0.2.1", stage: "syntax", code: "syntax", at: 15, hints: ["unbalanced"] },
  { id: "reject-less-paren", input: "less (64)", stage: "syntax", code: "syntax", at: 5, hints: [] },
  { id: "reject-vlan-paren-expression", input: "vlan (port 80)", stage: "syntax", code: "syntax", at: 6, hints: [] },
  { id: "reject-scoped-ipv6", input: "host fe80::1%eth0", stage: "syntax", code: "syntax", at: 12, hints: ["percentScope"] },
  { id: "reject-uppercase-keyword", input: "HOST 192.0.2.1", stage: "syntax", code: "syntax", at: 0, hints: ["upperKeyword", "bareNameFirst"] },
  { id: "reject-single-ampersand", input: "tcp & udp", stage: "syntax", code: "syntax", at: 4, hints: ["singleAmp"] },
  { id: "reject-too-deep", input: `${"(".repeat(101)}tcp${")".repeat(101)}`, stage: "syntax", code: "tooDeep", at: 100 },
  { id: "reject-shell-ate-backslash", input: "tcpdump ip proto \\tcp", stage: "syntax", code: "syntax", at: 9, hints: ["escapeKeyword"] },
  // ---- what libpcap's compiler refuses ----
  { id: "reject-nothing-to-inherit-after-abbrev", input: "tcp and 80", stage: "semantic", code: "noQualifierToInherit", at: 8 },
  { id: "reject-nothing-to-inherit-after-paren", input: "(host a) and b", stage: "semantic", code: "noQualifierToInherit", at: 13 },
  { id: "reject-prefix-without-net", input: "src 10.0.0.0/8", stage: "semantic", code: "prefixNeedsNet", at: 0 },
  { id: "reject-ipv6-prefix-as-host", input: "host 2001:db8::/32", stage: "semantic", code: "prefixNeedsNet", at: 0 },
  { id: "reject-host-bits", input: "net 192.0.2.5/24", stage: "semantic", code: "hostBits", at: 0 },
  { id: "reject-tcp-host", input: "tcp src 192.0.2.1", stage: "semantic", code: "protoNotValid", at: 0 },
  { id: "reject-ip-port", input: "ip port 80", stage: "semantic", code: "protoNotValid", at: 0 },
  { id: "reject-tcp-proto", input: "tcp proto 6", stage: "semantic", code: "protoNotValid", at: 0 },
  { id: "reject-ip6-ipv4-host", input: "ip6 host 192.0.2.1", stage: "semantic", code: "protoNotValid", at: 0 },
  { id: "reject-mac-without-ether", input: "host aa:bb:cc:dd:ee:ff", stage: "semantic", code: "macNeedsLink", at: 0 },
  { id: "reject-ether-ipv4", input: "ether host 192.0.2.1", stage: "semantic", code: "linkNeedsMac", at: 0 },
  { id: "reject-port-too-big", input: "port 65536", stage: "semantic", code: "portTooBig", at: 0 },
  { id: "reject-size-3", input: "tcp[13:3] = 0", stage: "semantic", code: "sizeNot124", at: 0 },
  { id: "reject-ah-index", input: "ah[0] = 0", stage: "semantic", code: "noIndex", at: 0 },
  { id: "reject-gateway-address", input: "gateway 192.0.2.1", stage: "semantic", code: "gatewayNeedsName", at: 0 },
  { id: "reject-proto-256", input: "ip proto 256", stage: "semantic", code: "protoTooBig", at: 0 },
  { id: "reject-ether-alone", input: "ether", stage: "semantic", code: "notAbbreviation", at: 0 },
  { id: "reject-addr1-ipv4", input: "addr1 192.0.2.1", stage: "semantic", code: "wlanDirOnly", at: 0 },
  { id: "reject-vlan-5000", input: "vlan 5000", stage: "semantic", code: "encapTooBig", at: 0 },
  { id: "reject-portrange-no-hyphen", input: "portrange http", stage: "semantic", code: "rangeNoHyphen", at: 0 },
  { id: "reject-port-range-text", input: "port 1-2", stage: "semantic", code: "rangeNeedsPortrange", at: 0 },
  { id: "reject-port-address", input: "port 192.0.2.1", stage: "semantic", code: "portWithAddress", at: 0 },
  { id: "reject-tcp-broadcast", input: "tcp broadcast", stage: "semantic", code: "broadcastProto", at: 0 },
  { id: "reject-ether-proto-name", input: "ether proto foo", stage: "semantic", code: "unknownEtherName", at: 0 },
  { id: "reject-prefix-33", input: "net 10.0.0.0/33", stage: "semantic", code: "prefixTooLong", at: 0 },
  { id: "reject-octet-300", input: "host 300.1.1.1", stage: "semantic", code: "badIpv4", at: 0 },
  { id: "reject-mac8-without-link", input: "host $2b", stage: "semantic", code: "mac8NeedsLink", at: 0 },
  { id: "reject-wlan-type", input: "type foo", stage: "semantic", code: "unknownWlanType", at: 0 },
  { id: "reject-all-packets", input: "ip and ip6", stage: "semantic", code: "rejectsAllPackets", at: 0 },
  // ---- added 2026-10-27: arithmetic, 802.11 and EtherType refusals (cross-checked on 1.10.4 unless a 1.11.0 cap) ----
  { id: "reject-div-by-zero", input: "tcp[13] / 0 = 1", stage: "semantic", code: "divByZero", at: 0 },
  { id: "reject-mod-by-zero", input: "len % 0 = 1", stage: "semantic", code: "modByZero", at: 0 },
  { id: "reject-shift-32", input: "len >> 32 = 1", stage: "semantic", code: "shiftTooBig", at: 0 },
  { id: "reject-first-number-div", input: "len / tcp[0] = 1", stage: "semantic", code: "rightOperandFirstNumber", at: 0 },
  { id: "reject-first-number-shift", input: "len << tcp[40] = 1", stage: "semantic", code: "rightOperandFirstNumber", at: 0 },
  { id: "reject-folded-div", input: "len / (5 * 0) = 1", stage: "semantic", code: "divByZeroFolded", at: 0 },
  { id: "reject-folded-shift", input: "len << (16 * 2) = 1", stage: "semantic", code: "shiftTooBigFolded", at: 0 },
  { id: "reject-llc-sap", input: "ether proto 1000", stage: "semantic", code: "llcSapTooBig", at: 0 }, // 1.11.0 cap
  { id: "reject-ethertype", input: "ether proto 0x10000", stage: "semantic", code: "etherTypeTooBig", at: 0 }, // 1.11.0 cap
  { id: "reject-wlan-type-value", input: "type 1", stage: "semantic", code: "badWlanTypeValue", at: 0 },
  { id: "reject-wlan-subtype-value", input: "type mgt subtype 1", stage: "semantic", code: "badWlanSubtypeValue", at: 0 },
  { id: "reject-wlan-dir-value", input: "dir 5", stage: "semantic", code: "badWlanDirValue", at: 0 }, // 1.11.0 check
  { id: "reject-wlan-type-no-names", input: "type 12 subtype rts", stage: "semantic", code: "unknownWlanType", at: 0 },
  // ---- the command line ----
  { id: "reject-unknown-option", input: "tcpdump -k", stage: "option", code: "unknownOption" },
  { id: "reject-missing-argument", input: "tcpdump -i", stage: "option", code: "missingArgument" },
  { id: "reject-count-zero", input: "tcpdump -c 0", stage: "option", code: "badArgument" },
  { id: "reject-direction", input: "tcpdump -Q sideways", stage: "option", code: "badArgument" },
  { id: "reject-snaplen", input: "tcpdump -s 300000", stage: "option", code: "badArgument" },
  { id: "reject-flag-with-value", input: "tcpdump --version=1", stage: "option", code: "noArgumentAllowed" },
  { id: "reject-count-trailing", input: "tcpdump -c 10x", stage: "option", code: "badArgument" }, // 4.99.7 would take 10 (atoi), the development code refuses it
  { id: "reject-unknown-type", input: "tcpdump -T foo", stage: "option", code: "badArgument" },
];

/** A compact shape of an explained tree: and(..), or(..), not(..), (..), labels, ^ for inherited, # abbreviations, [relations], % specials. */
export function shape(n: XNode): string {
  switch (n.kind) {
    case "and": case "or": return `${n.kind}(${shape(n.children[0])},${shape(n.children[1])})`; // binary
    case "not": return `not(${shape(n.children[0])})`; // negation
    case "group": return `(${shape(n.children[0])})`; // parentheses
    case "prim": return `${n.inherited ? "^" : ""}${n.label}`; // a primitive
    case "abbrev": return `#${n.label}`; // a bare protocol keyword
    case "rel": return `[${n.text}]`; // a relation
    case "special": return `%${n.label}`; // a special primitive
  }
}

/** The first node with a label, pre-order. */
function find(n: XNode, label: string): XNode | null {
  if (n.label === label) return n; // this one
  for (const c of n.children) { const f = find(c, label); if (f) return f; } // its children
  return null; // not here
}

/** Compare and record. */
function check(failures: string[], id: string, what: string, got: unknown, want: unknown): void {
  if (JSON.stringify(got) !== JSON.stringify(want)) failures.push(`[${id}] ${what}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`); // a mismatch
}

/** Check one accept vector. */
function checkAccept(v: AcceptVector, failures: string[]): void {
  let r: TcpdumpExplanation; // the explanation
  try { r = explain(v.input); } catch (e) { failures.push(`[${v.id}] threw ${(e as Error).message}`); return; } // must not throw
  const x = v.expect; // expectations
  check(failures, v.id, "mode", r.mode, x.mode); // mode
  const f = r.filter; // the filter
  if (x.ok !== undefined) check(failures, v.id, "ok", f?.ok ?? null, x.ok); // validity
  if (x.canonical !== undefined) check(failures, v.id, "canonical", f?.canonical ?? null, x.canonical); // rewrite
  if (x.shape !== undefined) check(failures, v.id, "shape", f?.tree ? shape(f.tree) : null, x.shape); // tree shape
  if (x.global !== undefined) check(failures, v.id, "global", f?.notes.map((n) => n.code) ?? null, x.global); // whole-filter notes
  for (const [label, want] of Object.entries(x.explicit ?? {})) check(failures, v.id, `explicit(${label})`, f?.tree ? find(f.tree, label)?.explicit ?? null : null, want); // explicit readings
  for (const [label, want] of Object.entries(x.meaning ?? {})) check(failures, v.id, `meaning(${label})`, f?.tree ? find(f.tree, label)?.meaning.en ?? null : null, want); // meanings
  for (const [label, want] of Object.entries(x.nodeNotes ?? {})) check(failures, v.id, `nodeNotes(${label})`, f?.tree ? find(f.tree, label)?.notes.map((n) => n.code) ?? null : null, want); // node notes
  if (x.shell !== undefined) check(failures, v.id, "shell", r.shellNotes.map((n) => n.code), x.shell); // shell notes
  const c = r.command; // the command
  if (x.prefix !== undefined) check(failures, v.id, "prefix", c?.prefix.map((p) => p.word) ?? null, x.prefix); // prefix
  if (x.program !== undefined) check(failures, v.id, "program", c?.program ?? null, x.program); // program
  if (x.options !== undefined) check(failures, v.id, "options", c?.options.map((o) => `${o.flag}${o.count > 1 ? `*${o.count}` : ""}${o.arg !== null ? `=${o.arg}` : ""}`) ?? null, x.options); // options
  if (x.from !== undefined) check(failures, v.id, "from", c?.expressionFrom ?? null, x.from); // expression source
  if (x.expr !== undefined) check(failures, v.id, "expr", f?.text ?? null, x.expr); // expression text
  if (x.cmdNotes !== undefined) check(failures, v.id, "cmdNotes", c?.notes.map((n) => n.code) ?? null, x.cmdNotes); // command notes
  for (const [flag, want] of Object.entries(x.optNotes ?? {})) check(failures, v.id, `optNotes(${flag})`, c?.options.find((o) => o.flag === flag)?.notes.map((n) => n.code) ?? null, want); // option notes
}

/** Check one reject vector. */
function checkReject(v: RejectVector, failures: string[]): void {
  if (v.stage === "input") { // the whole input refused
    try { explain(v.input); failures.push(`[${v.id}] expected ${v.code}, input accepted`); } // must throw
    catch (e) { if (!(e instanceof TcpdumpExplainerError) || e.code !== v.code) failures.push(`[${v.id}] expected ${v.code}, got ${(e as Error).message}`); } // the right refusal
    return; // done
  }
  const r = explain(v.input); // the explanation
  if (v.stage === "option") { // a command-line problem
    const codes = [...(r.command?.errors ?? []), ...(r.command?.options.flatMap((o) => o.errors) ?? [])].map((n) => n.code); // every command error
    if (!codes.includes(v.code)) failures.push(`[${v.id}] expected option error ${v.code}, got ${JSON.stringify(codes)}`); // present
    return; // done
  }
  const f = r.filter ?? explainFilter(v.input); // the filter
  if (v.stage === "lex" || v.stage === "syntax") { // a rejection before analysis
    check(failures, v.id, "error.code", f.error?.code ?? null, v.code); // the code
    if (v.at !== undefined) check(failures, v.id, "error.at", f.error?.start ?? null, v.at); // the position
    if (v.hints !== undefined) check(failures, v.id, "error.hints", f.error?.hints.map((h) => h.code) ?? null, v.hints); // the hints
    return; // done
  }
  const e = f.semanticErrors.find((s) => s.code === v.code); // the node error
  if (!e) { failures.push(`[${v.id}] expected semantic error ${v.code}, got ${JSON.stringify(f.semanticErrors.map((s) => s.code))} (error ${f.error?.code ?? "none"})`); return; } // missing
  check(failures, v.id, "ok", f.ok, false); // refused
  if (v.at !== undefined) check(failures, v.id, "at", e.start, v.at); // the position
}

/** Run every vector; returns the set id, the counts and every failure. */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  const failures: string[] = []; // every mismatch
  for (const v of ACCEPT_VECTORS) checkAccept(v, failures); // accepts
  for (const v of REJECT_VECTORS) checkReject(v, failures); // rejects
  const total = ACCEPT_VECTORS.length + REJECT_VECTORS.length; // all vectors
  const failedIds = new Set(failures.map((f) => f.slice(1, f.indexOf("]")))); // vectors with a failure
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failedIds.size, failures }; // the report
}
