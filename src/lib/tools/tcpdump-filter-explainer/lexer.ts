// ============================================================================
// src/lib/tools/tcpdump-filter-explainer/lexer.ts
// ----------------------------------------------------------------------------
// The tokenizer for a pcap filter expression (the language of pcap-filter(7)).
//
// It reproduces, in our own hand-written code, how libpcap's scanner cuts an
// expression into tokens (libpcap scanner.l at tag libpcap-1.11.0, the testing
// release, read 2026-10-27; master was identical that day. The stable release,
// tag libpcap-1.10.7, has the same rules except that it has no vxlan keyword,
// and it words two messages differently):
//   * the scanner takes the LONGEST match at every position, and when two
//     rules match the same length the rule written first wins, so a keyword
//     beats a name of the same spelling ("host" is a keyword, "hostx" a name);
//   * keywords are case-sensitive (the scanner has no case-insensitive
//     option), so "HOST" is a name, not the keyword;
//   * a name may contain "-", "_" and "." (but may not end in "-" or "_"), so
//     "len-1" is ONE name, not len minus 1;
//   * a number with a leading 0 is octal, 0x starts hexadecimal, and every
//     number must fit in 32 bits;
//   * twelve hexadecimal digits in a row, or six groups of one or two hex
//     digits joined by ":", "-" or ".", form a MAC-48 address, so 012345670123
//     is an address, not an octal number (pcap-filter(7), ARITHMETIC
//     EXPRESSIONS, warns about exactly this);
//   * the named offsets and values (tcpflags, tcp-syn, icmp-echo, ...) are
//     numbers, with the values the scanner assigns.
//
// ReDoS-safe by construction: no regular expression is used; every matcher is
// a bounded forward scan, and each position is examined a bounded number of
// times. Nothing here evaluates code.
// ============================================================================

/** One token of a filter expression. */
export interface Token {
  /** The grammar terminal: a keyword class such as "HOST" or "AND", an operator such as "(" or "GEQ", or a value class. */
  t: string;
  /** The exact source text of the token. */
  text: string;
  /** Offset of the first character in the expression (0-based). */
  start: number;
  /** Offset just past the last character. */
  end: number;
  /** For NUM: the 32-bit unsigned value. */
  num?: number;
  /** For ID: the name, without the escaping backslash when there was one. */
  id?: string;
  /** For ID: true when the name was written with a leading backslash (\tcp). */
  escaped?: boolean;
  /** For a NUM that came from a named value (tcp-syn, icmptype, ...): that name. */
  named?: string;
  /** For NUM: how the number was written ("dec", "hex" or "oct"). */
  radix?: "dec" | "hex" | "oct";
}

/** Why the scanner stopped. The codes are stable; the explanations live in texts.ts. */
export type LexErrorCode = "badChar" | "nonOctal" | "overflow" | "badMac" | "badIpv6";

/** A scanner failure, with the span it concerns. */
export interface LexError {
  /** Stable code. */
  code: LexErrorCode;
  /** Offset of the offending text. */
  start: number;
  /** Offset just past it. */
  end: number;
  /** The offending text. */
  text: string;
}

/** The tokens of an expression, or the first error that stopped the scan. */
export interface LexResult {
  /** Every token up to the error (or all of them). */
  tokens: Token[];
  /** The first scanner error, or null. */
  error: LexError | null;
}

// ---------------------------------------------------------------------------
// The keyword table, word -> terminal (scanner.l, libpcap-1.11.0; 1.10.7 lacks vxlan).
// ---------------------------------------------------------------------------
export const KEYWORDS: Readonly<Record<string, string>> = Object.freeze({
  dst: "DST", // direction qualifier
  src: "SRC", // direction qualifier
  link: "LINK", ether: "LINK", ppp: "LINK", slip: "LINK", fddi: "LINK", tr: "LINK", wlan: "LINK", // all the link layer
  arp: "ARP", rarp: "RARP", ip: "IP", sctp: "SCTP", tcp: "TCP", udp: "UDP", // protocols
  icmp: "ICMP", igmp: "IGMP", igrp: "IGRP", pim: "PIM", vrrp: "VRRP", carp: "CARP", radio: "RADIO", // protocols
  ip6: "IPV6", icmp6: "ICMPV6", ah: "AH", esp: "ESP", // IPv6 and IPsec
  atalk: "ATALK", aarp: "AARP", decnet: "DECNET", lat: "LAT", sca: "SCA", moprc: "MOPRC", mopdl: "MOPDL", // older link protocols
  iso: "ISO", esis: "ESIS", "es-is": "ESIS", isis: "ISIS", "is-is": "ISIS", // OSI
  l1: "L1", l2: "L2", iih: "IIH", lsp: "LSP", snp: "SNP", csnp: "CSNP", psnp: "PSNP", clnp: "CLNP", // IS-IS PDU groups and CLNP
  stp: "STP", ipx: "IPX", netbeui: "NETBEUI", // LLC protocols
  host: "HOST", net: "NET", mask: "NETMASK", port: "PORT", portrange: "PORTRANGE", // type qualifiers
  proto: "PROTO", protochain: "PROTOCHAIN", gateway: "GATEWAY", // type qualifiers
  type: "TYPE", subtype: "SUBTYPE", direction: "DIR", dir: "DIR", // 802.11 frame fields
  address1: "ADDR1", addr1: "ADDR1", address2: "ADDR2", addr2: "ADDR2", // 802.11 address qualifiers
  address3: "ADDR3", addr3: "ADDR3", address4: "ADDR4", addr4: "ADDR4", ra: "RA", ta: "TA", // 802.11 address qualifiers
  less: "LESS", greater: "GREATER", byte: "CBYTE", broadcast: "TK_BROADCAST", multicast: "TK_MULTICAST", // special primitives
  and: "AND", "&&": "AND", or: "OR", "||": "OR", not: "!", // Boolean operators
  len: "LEN", length: "LEN", inbound: "INBOUND", outbound: "OUTBOUND", ifindex: "IFINDEX", // special primitives
  vlan: "VLAN", mpls: "MPLS", pppoed: "PPPOED", pppoes: "PPPOES", geneve: "GENEVE", vxlan: "VXLAN", // encapsulations
  lane: "LANE", llc: "LLC", metac: "METAC", bcc: "BCC", oam: "OAM", oamf4: "OAMF4", oamf4ec: "OAMF4EC", // ATM and LLC
  oamf4sc: "OAMF4SC", sc: "SC", ilmic: "ILMIC", vpi: "VPI", vci: "VCI", connectmsg: "CONNECTMSG", metaconnect: "METACONNECT", // ATM
  on: "PF_IFNAME", ifname: "PF_IFNAME", rset: "PF_RSET", ruleset: "PF_RSET", rnr: "PF_RNR", rulenum: "PF_RNR", // pf log
  srnr: "PF_SRNR", subrulenum: "PF_SRNR", reason: "PF_REASON", action: "PF_ACTION", // pf log
  fisu: "FISU", lssu: "LSSU", lsu: "LSSU", msu: "MSU", hfisu: "HFISU", hlssu: "HLSSU", hmsu: "HMSU", // SS7 MTP2
  sio: "SIO", opc: "OPC", dpc: "DPC", sls: "SLS", hsio: "HSIO", hopc: "HOPC", hdpc: "HDPC", hsls: "HSLS", // SS7 MTP3
});

// ---------------------------------------------------------------------------
// The named offsets and values: each is scanned as a NUM with this value
// (scanner.l, libpcap-1.11.0 and libpcap-1.10.7 alike, read 2026-10-27).
// ---------------------------------------------------------------------------
export const NAMED_VALUES: Readonly<Record<string, number>> = Object.freeze({
  icmptype: 0, icmpcode: 1, // ICMP field offsets
  "icmp-echoreply": 0, "icmp-unreach": 3, "icmp-sourcequench": 4, "icmp-redirect": 5, "icmp-echo": 8, // ICMP types
  "icmp-routeradvert": 9, "icmp-routersolicit": 10, "icmp-timxceed": 11, "icmp-paramprob": 12, // ICMP types
  "icmp-tstamp": 13, "icmp-tstampreply": 14, "icmp-ireq": 15, "icmp-ireqreply": 16, // ICMP types
  "icmp-maskreq": 17, "icmp-maskreply": 18, // ICMP types
  icmp6type: 0, icmp6code: 1, // ICMPv6 field offsets
  "icmp6-destinationunreach": 1, "icmp6-packettoobig": 2, "icmp6-timeexceeded": 3, "icmp6-parameterproblem": 4, // ICMPv6 types
  "icmp6-echo": 128, "icmp6-echoreply": 129, "icmp6-multicastlistenerquery": 130, // ICMPv6 types
  "icmp6-multicastlistenerreportv1": 131, "icmp6-multicastlistenerdone": 132, "icmp6-routersolicit": 133, // ICMPv6 types
  "icmp6-routeradvert": 134, "icmp6-neighborsolicit": 135, "icmp6-neighboradvert": 136, "icmp6-redirect": 137, // ICMPv6 types
  "icmp6-routerrenum": 138, "icmp6-nodeinformationquery": 139, "icmp6-nodeinformationresponse": 140, // ICMPv6 types
  "icmp6-ineighbordiscoverysolicit": 141, "icmp6-ineighbordiscoveryadvert": 142, // ICMPv6 types
  "icmp6-multicastlistenerreportv2": 143, "icmp6-homeagentdiscoveryrequest": 144, // ICMPv6 types
  "icmp6-homeagentdiscoveryreply": 145, "icmp6-mobileprefixsolicit": 146, "icmp6-mobileprefixadvert": 147, // ICMPv6 types
  "icmp6-certpathsolicit": 148, "icmp6-certpathadvert": 149, "icmp6-multicastrouteradvert": 151, // ICMPv6 types
  "icmp6-multicastroutersolicit": 152, "icmp6-multicastrouterterm": 153, // ICMPv6 types
  tcpflags: 13, // the offset of the TCP flags byte
  "tcp-fin": 0x01, "tcp-syn": 0x02, "tcp-rst": 0x04, "tcp-push": 0x08, // TCP flag bits
  "tcp-ack": 0x10, "tcp-urg": 0x20, "tcp-ece": 0x40, "tcp-cwr": 0x80, // TCP flag bits
});

/** The single characters the scanner returns as themselves. */
const SINGLE_OPS = "+-*/%:[]!<>()&|^="; // scanner.l: [+\-*/%:\[\]!<>()&|\^=]
/** The two-character operators, with their terminals. */
const DOUBLE_OPS: Readonly<Record<string, string>> = Object.freeze({ ">=": "GEQ", "<=": "LEQ", "!=": "NEQ", "==": "=", "<<": "LSH", ">>": "RSH" });

/** The longest expression this tokenizer reads (characters); the caller enforces it before scanning. */
export const MAX_FILTER_LENGTH = 4096; // far beyond any real filter, small enough to bound the work

// ---------------------------------------------------------------------------
// Character classes, written as plain comparisons (no regular expressions).
// ---------------------------------------------------------------------------
/** True for 0-9. */
function isDigit(c: string): boolean { return c >= "0" && c <= "9"; } // decimal digit
/** True for 0-9, a-f, A-F. */
function isHex(c: string): boolean { return isDigit(c) || (c >= "a" && c <= "f") || (c >= "A" && c <= "F"); } // hex digit
/** True for A-Z, a-z, 0-9. */
function isAlnum(c: string): boolean { return isDigit(c) || (c >= "a" && c <= "z") || (c >= "A" && c <= "Z"); } // letter or digit
/** The scanner's whitespace: space, CR, LF, tab. */
function isSpace(c: string): boolean { return c === " " || c === "\r" || c === "\n" || c === "\t"; } // separators

/** Length of a run of hex digits at i, at most max long. */
function hexRun(s: string, i: number, max: number): number {
  let n = 0; // digits seen
  while (n < max && i + n < s.length && isHex(s[i + n])) n++; // extend while hex
  return n; // the run length
}

/** Length of the N rule at i: decimal digits, or 0x/0X followed by hex digits (longest). */
function numLen(s: string, i: number): number {
  if (i >= s.length || !isDigit(s[i])) return 0; // N starts with a digit
  // 0x or 0X with at least one hex digit: the hexadecimal alternative is longer than the "0" decimal one.
  if (s[i] === "0" && (s[i + 1] === "x" || s[i + 1] === "X") && i + 2 < s.length && isHex(s[i + 2])) return 2 + hexRun(s, i + 2, s.length); // hex
  let n = 0; // decimal digits
  while (i + n < s.length && isDigit(s[i + n])) n++; // extend
  return n; // decimal run
}

/** Length of the HID rule at i: two, three or four N's joined by dots (the longest such prefix). */
function hidLen(s: string, i: number): number {
  let j = i; // cursor
  let parts = 0; // N's read
  let best = 0; // longest complete match
  while (parts < 4) { // at most four parts
    const n = numLen(s, j); // the next N
    if (n === 0) break; // no N here
    j += n; // past it
    parts++; // counted
    if (parts >= 2) best = j - i; // two or more parts form a HID
    if (parts < 4 && s[j] === "." && j + 1 < s.length && isDigit(s[j + 1])) j++; // a dot followed by a digit continues
    else break; // anything else ends the address
  }
  return best; // 0 when fewer than two parts
}

/** Length of the MAC rule at i (the five alternatives of scanner.l, longest). */
function macLen(s: string, i: number): number {
  let best = 0; // longest alternative
  // Six groups of one or two hex digits, joined by ":", "-" or ".".
  for (const sep of [":", "-", "."]) {
    let j = i; // cursor
    let ok = true; // still matching
    for (let g = 0; g < 6 && ok; g++) { // six groups
      const h = hexRun(s, j, 2); // one or two digits
      if (h === 0) { ok = false; break; } // a group is required
      j += h; // past the group
      if (g < 5) { if (s[j] === sep) j++; else ok = false; } // a separator between groups
    }
    if (ok) best = Math.max(best, j - i); // a full six-group address
  }
  // Three groups of exactly four hex digits joined by ".".
  {
    let j = i; // cursor
    let ok = true; // still matching
    for (let g = 0; g < 3 && ok; g++) { // three groups
      if (hexRun(s, j, 4) < 4) { ok = false; break; } // exactly four digits
      j += 4; // past them
      if (g < 2) { if (s[j] === ".") j++; else ok = false; } // dots between
    }
    if (ok) best = Math.max(best, j - i); // xxxx.xxxx.xxxx
  }
  // Twelve hex digits in a row.
  if (hexRun(s, i, 12) === 12) best = Math.max(best, 12); // xxxxxxxxxxxx
  return best; // 0 when no alternative matched
}

/** Length of the scanner's "bad Ethernet address" rule at i: {B}:+({B}:+)+ (one or two hex digits, colons, at least twice). */
function badMacLen(s: string, i: number): number {
  let j = i; // cursor
  let reps = 0; // completed (B :+) repetitions
  let best = 0; // longest complete match
  while (j < s.length) { // repeat the group
    const h = hexRun(s, j, 2); // B
    if (h === 0) break; // no B: stop
    let k = j + h; // past B
    let colons = 0; // the :+ part
    while (s[k] === ":") { k++; colons++; } // one or more colons
    if (colons === 0) break; // the group needs at least one colon
    reps++; // one more group
    j = k; // continue after it
    if (reps >= 2) best = j - i; // two groups or more is a match
  }
  return best; // 0 when fewer than two groups
}

/** True when text is a dotted quad of N's (the IPv4 tail allowed in the V6 patterns). */
function isDottedQuadN(text: string): boolean {
  const parts = text.split("."); // four parts expected
  if (parts.length !== 4) return false; // exactly four
  return parts.every((p) => p.length > 0 && numLen(p, 0) === p.length); // each a whole N
}

/** True when text is a 1-4 digit hex group (the W of scanner.l). */
function isW(text: string): boolean {
  return text.length >= 1 && text.length <= 4 && hexRun(text, 0, 4) === text.length; // one to four hex digits
}

/**
 * True when c matches one of the V6 alternatives of scanner.l: eight groups; six groups and an IPv4 tail; or
 * "::" anywhere with at most seven groups (at most five with an IPv4 tail).
 */
function isV6(c: string): boolean {
  let body = c; // the part before an IPv4 tail
  let v4 = false; // whether there is a tail
  if (c.includes(".")) { // an IPv4 tail
    const idx = c.lastIndexOf(":"); // the tail follows the last colon
    if (idx < 0) return false; // no colon: not IPv6
    if (!isDottedQuadN(c.slice(idx + 1))) return false; // the tail must be a dotted quad
    v4 = true; // remember it
    body = c.slice(0, idx + 1); // keep the colon for now
    body = body.endsWith("::") ? body : body.slice(0, -1); // a single separating colon is dropped; "::" stays
  }
  const first = body.indexOf("::"); // the compression, if any
  if (first >= 0 && body.indexOf("::", first + 1) >= 0) return false; // at most one "::"
  if (body.includes(":::")) return false; // ":::" is never valid
  if (first < 0) { // no compression
    const groups = body.split(":"); // every group
    if (!groups.every(isW)) return false; // each one to four hex digits
    return v4 ? groups.length === 6 : groups.length === 8; // the two uncompressed shapes
  }
  const left = body.slice(0, first); // groups before "::"
  const right = body.slice(first + 2); // groups after it
  const lg = left === "" ? [] : left.split(":"); // left groups
  const rg = right === "" ? [] : right.split(":"); // right groups
  if (!lg.every(isW) || !rg.every(isW)) return false; // each one to four hex digits
  const k = lg.length + rg.length; // groups written
  return v4 ? k <= 5 : k <= 7; // the compressed shapes
}

/** Length of the V6 rule at i: the longest prefix (at most 64 characters) that is a V6 address. */
function v6Len(s: string, i: number): number {
  if (i >= s.length || !(isHex(s[i]) || s[i] === ":")) return 0; // V6 starts with a hex digit or a colon
  let run = 0; // the candidate run: hex digits, colons, dots, x/X (for 0x in a tail)
  while (run < 64 && i + run < s.length) { // bounded
    const c = s[i + run]; // next character
    if (isHex(c) || c === ":" || c === "." || c === "x" || c === "X") run++; // part of a candidate
    else break; // anything else ends it
  }
  const cand = s.slice(i, i + run); // the run
  if (!cand.includes(":")) return 0; // every V6 shape has a colon
  for (let e = run; e >= 2; e--) if (isV6(cand.slice(0, e))) return e; // the longest valid prefix
  return 0; // no V6 prefix
}

/** Length of the ID rule at i: [A-Za-z0-9]([-_.A-Za-z0-9]*[.A-Za-z0-9])? */
function idLen(s: string, i: number): number {
  if (i >= s.length || !isAlnum(s[i])) return 0; // starts with a letter or digit
  let j = i + 1; // past the first character
  while (j < s.length && (isAlnum(s[j]) || s[j] === "-" || s[j] === "_" || s[j] === ".")) j++; // the middle
  while (j > i + 1 && (s[j - 1] === "-" || s[j - 1] === "_")) j--; // may not end in - or _
  return j - i; // the name length
}

/** Length of the escaped-ID rule at i: a backslash then one or more characters other than space, !, (, ), LF, tab. */
function escIdLen(s: string, i: number): number {
  if (s[i] !== "\\") return 0; // starts with a backslash
  let j = i + 1; // past it
  while (j < s.length && s[j] !== " " && s[j] !== "!" && s[j] !== "(" && s[j] !== ")" && s[j] !== "\n" && s[j] !== "\t") j++; // the name
  return j - i > 1 ? j - i : 0; // at least one character after the backslash
}

/** Converts the text of an N to its value, as the scanner does, or reports why it cannot. */
export function numberValue(text: string): { value: number; radix: "dec" | "hex" | "oct" } | { error: "nonOctal" | "overflow" } {
  const MAX = 0xffffffff; // 32 bits
  if (text.length >= 2 && text[0] === "0" && (text[1] === "x" || text[1] === "X")) { // hexadecimal
    let v = 0; // accumulated value
    for (let k = 2; k < text.length; k++) { // each digit
      v = v * 16 + parseInt(text[k], 16); // shift in
      if (v > MAX) return { error: "overflow" }; // more than 32 bits
    }
    return { value: v, radix: "hex" }; // done
  }
  if (text.length >= 2 && text[0] === "0") { // octal
    let v = 0; // accumulated value
    for (let k = 1; k < text.length; k++) { // each digit
      if (text[k] > "7") return { error: "nonOctal" }; // 8 and 9 are not octal
      v = v * 8 + (text.charCodeAt(k) - 48); // shift in
      if (v > MAX) return { error: "overflow" }; // more than 32 bits
    }
    return { value: v, radix: "oct" }; // done
  }
  let v = 0; // decimal
  for (let k = 0; k < text.length; k++) { // each digit
    v = v * 10 + (text.charCodeAt(k) - 48); // shift in
    if (v > MAX) return { error: "overflow" }; // more than 32 bits
  }
  return { value: v, radix: "dec" }; // done
}

/** True when the embedded IPv4 part of an IPv6 literal would pass inet_pton (decimal octets, each at most 255). */
function v6TailOk(text: string): boolean {
  if (!text.includes(".")) return true; // no tail
  const tail = text.slice(text.lastIndexOf(":") + 1).split("."); // the four parts
  return tail.every((p) => p.length > 0 && p.length <= 3 && [...p].every(isDigit) && Number(p) <= 255); // decimal 0-255
}

/**
 * Tokenize a filter expression the way libpcap's scanner does (longest match, earlier rule on a tie).
 * Stops at the first scanner error, as libpcap does.
 */
export function tokenize(src: string): LexResult {
  const tokens: Token[] = []; // the output
  let i = 0; // cursor
  while (i < src.length) { // until the end
    const c = src[i]; // current character
    if (isSpace(c)) { i++; continue; } // whitespace is skipped
    // Every candidate rule, with its length and its order in scanner.l (lower wins a tie).
    const cands: { len: number; order: number; kind: string }[] = []; // candidates at i
    const il = idLen(src, i); // the ID-shaped run (keywords and named values are spelled within it)
    const word = il > 0 ? src.slice(i, i + il) : ""; // that run
    if (il > 0 && Object.prototype.hasOwnProperty.call(KEYWORDS, word)) cands.push({ len: il, order: 0, kind: "kw" }); // a keyword
    const two = src.slice(i, i + 2); // two characters
    if (two === "&&" || two === "||") cands.push({ len: 2, order: 0, kind: "kw2" }); // && and || are keyword rules
    if (SINGLE_OPS.includes(c)) cands.push({ len: 1, order: 2, kind: "op1" }); // a one-character operator
    if (Object.prototype.hasOwnProperty.call(DOUBLE_OPS, two)) cands.push({ len: 2, order: 3, kind: "op2" }); // a two-character operator
    if (c === "$") { const h = hexRun(src, i + 1, 2); if (h > 0) cands.push({ len: 1 + h, order: 4, kind: "aid" }); } // $xx
    const ml = macLen(src, i); if (ml > 0) cands.push({ len: ml, order: 5, kind: "mac" }); // MAC-48
    const nl = numLen(src, i); if (nl > 0) cands.push({ len: nl, order: 6, kind: "num" }); // a number
    const hl = hidLen(src, i); if (hl > 0) cands.push({ len: hl, order: 7, kind: "hid" }); // a dotted IPv4 form
    const vl = v6Len(src, i); if (vl > 0) cands.push({ len: vl, order: 8, kind: "v6" }); // an IPv6 address
    const bl = badMacLen(src, i); if (bl > 0) cands.push({ len: bl, order: 9, kind: "badmac" }); // a malformed MAC
    if (il > 0 && Object.prototype.hasOwnProperty.call(NAMED_VALUES, word)) cands.push({ len: il, order: 10, kind: "named" }); // tcp-syn, ...
    if (il > 0) cands.push({ len: il, order: 11, kind: "id" }); // a name
    const el = escIdLen(src, i); if (el > 0) cands.push({ len: el, order: 12, kind: "esc" }); // \name
    if (cands.length === 0) { // nothing matches: the scanner's catch-all rule
      return { tokens, error: { code: "badChar", start: i, end: i + 1, text: c } }; // LEX_ERROR
    }
    cands.sort((a, b) => b.len - a.len || a.order - b.order); // longest first, then the earlier rule
    const win = cands[0]; // the rule flex picks
    const text = src.slice(i, i + win.len); // its text
    const base = { text, start: i, end: i + win.len }; // shared fields
    switch (win.kind) { // build the token
      case "kw": tokens.push({ ...base, t: KEYWORDS[text] }); break; // keyword
      case "kw2": tokens.push({ ...base, t: text === "&&" ? "AND" : "OR" }); break; // && or ||
      case "op1": tokens.push({ ...base, t: text }); break; // the character is the terminal
      case "op2": tokens.push({ ...base, t: DOUBLE_OPS[text] }); break; // >=, <=, !=, ==, <<, >>
      case "aid": tokens.push({ ...base, t: "AID" }); break; // ARCnet / MS/TP address
      case "mac": tokens.push({ ...base, t: "EID" }); break; // MAC-48 address
      case "num": { // a number: converted now, as stou does
        const v = numberValue(text); // value or error
        if ("error" in v) return { tokens, error: { code: v.error, ...base } }; // non-octal digit or overflow
        tokens.push({ ...base, t: "NUM", num: v.value, radix: v.radix }); // the number
        break; // done
      }
      case "hid": tokens.push({ ...base, t: "HID" }); break; // dotted IPv4 form
      case "v6": { // IPv6: the scanner validates with inet_pton
        if (!v6TailOk(text)) return { tokens, error: { code: "badIpv6", ...base } }; // the embedded IPv4 part is not valid
        tokens.push({ ...base, t: "HID6" }); // the address
        break; // done
      }
      case "badmac": return { tokens, error: { code: "badMac", ...base } }; // "invalid Ethernet address"
      case "named": tokens.push({ ...base, t: "NUM", num: NAMED_VALUES[text], named: text, radix: "dec" }); break; // a named value
      case "id": tokens.push({ ...base, t: "ID", id: text }); break; // a name
      case "esc": tokens.push({ ...base, t: "ID", id: text.slice(1), escaped: true }); break; // \name: the name without the backslash
    }
    i += win.len; // advance past the token
  }
  return { tokens, error: null }; // all tokens
}
