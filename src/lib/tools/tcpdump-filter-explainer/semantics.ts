// ============================================================================
// src/lib/tools/tcpdump-filter-explainer/semantics.ts
// ----------------------------------------------------------------------------
// From syntax tree to explanation: every node of a parsed filter is given a
// plain-words meaning, its implicit defaults made explicit, the qualifiers it
// inherits, the notes that apply and the errors libpcap would raise when it
// compiles it.
//
// What it applies, and where each rule comes from (all read 2026-10-27). The
// basis is the two libpcap releases tcpdump.org offers: 1.10.7 (stable) and
// 1.11.0 (testing); where they differ, the explanation says which does what,
// and the development code (1.11.1-PRE-GIT) is mentioned where it differs
// again:
//   * defaults: no proto qualifier means every protocol consistent with the
//     type ("src foo" is "(ip6 or ip or arp or rarp) src foo", "port 53" is
//     "(tcp or udp or sctp) port 53"), no dir qualifier means "src or dst", no
//     type qualifier means host; for an address, only the protocols that make
//     sense for its family (pcap-filter(7), DESCRIPTION and host);
//   * a bare value takes the most recent qualifiers ("not host vs and ace" is
//     "not host vs and host ace"), the way libpcap's grammar passes them on:
//     after a primitive, its own; after a parenthesised expression, the ones
//     current before the "(" (so "(host a) and b" has nothing to inherit);
//     after a bare protocol keyword, a relation or a special primitive,
//     nothing (grammar.y.in, the qerr cases);
//   * which qualifier and value combinations libpcap refuses, and the value
//     caps it enforces (gencode.c at tags libpcap-1.10.7 and libpcap-1.11.0;
//     1.11.0 added caps on protocol numbers, EtherTypes, LLC DSAPs, IS-IS PDU
//     types and byte values that 1.10.7 compiles without a complaint), and
//     the arithmetic refusals (division or modulus by zero, shifts above 31)
//     made when the code is generated (gencode.c) or folded (optimize.c):
//     these are checked here so the explainer can say "libpcap will refuse
//     this" before you run it;
//   * the 802.11 frame control values the grammar checks (ieee80211.h masks,
//     grammar.y.in);
//   * the TCP flag bits and named values (tcpdump(1) TCP header diagram,
//     libpcap scanner.l), the IP protocol numbers of the abbreviations (IANA
//     Protocol Numbers registry);
//   * the encapsulation keywords (vlan, mpls, pppoes, geneve, vxlan) shift the
//     decoding of everything AFTER them in the expression (pcap-filter(7)).
//
// What it cannot know, and says so: what a name resolves to (DNS, hosts(5),
// services(5), protocols(5), networks(5), ethers(5) on the capturing
// machine), and what the capture's link-layer type supports (802.11, ATM,
// SS7, pf log, ARCnet primitives work only on their own link types).
// ============================================================================

import type { Token } from "./lexer"; // tokens
import { numberValue, KEYWORDS } from "./lexer"; // number conversion for dotted parts, and the keyword table
import type { Arith, Addr, Dir, FNode, Head, IdValue } from "./parser"; // the syntax tree
import {
  bi, note, SRC, dirWords, dirExplicit, flagNames, joinWords, ICMP_TYPE_NAMES, ICMP6_TYPE_NAMES, TCP_FLAG_BITS,
  type Bi, type Note,
} from "./texts"; // shared wording

/** An explained arithmetic node. */
export interface XArith {
  /** num, len, load, bin, neg or paren. */
  kind: Arith["k"];
  /** Its source text. */
  text: string;
  /** Start offset in the expression. */
  start: number;
  /** End offset. */
  end: number;
  /** What it computes. */
  meaning: Bi;
  /** Its value when it is a constant, else null. */
  value: number | null;
  /** Remarks. */
  notes: Note[];
  /** Errors libpcap would raise for it. */
  errors: Note[];
  /** Operands. */
  children: XArith[];
}

/** An explained node of the Boolean tree. */
export interface XNode {
  /** and, or, not, group, prim, abbrev, rel or special. */
  kind: FNode["k"];
  /** Its source text. */
  text: string;
  /** Start offset in the expression. */
  start: number;
  /** End offset. */
  end: number;
  /** A short label: the operator, the primitive as written, or the keyword. */
  label: string;
  /** What it means. */
  meaning: Bi;
  /** The implicit defaults spelled out (a reading in pcap-filter(7)'s own notation, not always valid syntax), or null. */
  explicit: string | null;
  /** The qualifier words in force for a value ("tcp dst port"), or null. */
  qualifiers: string | null;
  /** True when those qualifiers were inherited from an earlier primitive. */
  inherited: boolean;
  /** Remarks. */
  notes: Note[];
  /** Errors libpcap would raise when compiling this node. */
  errors: Note[];
  /** Child nodes. */
  children: XNode[];
  /** For a relation: the left arithmetic expression. */
  left?: XArith;
  /** For a relation: the right arithmetic expression. */
  right?: XArith;
}

/** The analysis of a whole expression. */
export interface Analysis {
  /** The explained tree. */
  root: XNode;
  /** Remarks about the whole expression. */
  notes: Note[];
  /** Every error found in the nodes, with its span, in source order. */
  errors: { start: number; end: number; note: Note }[];
  /** The same filter with every grouping and every inherited qualifier written out (valid syntax). */
  canonical: string;
}

/** The qualifiers in force: protocol, direction, type, and the words that spell them. null means none (libpcap's qerr). */
interface Q {
  /** The protocol keyword token, or null. */
  proto: Token | null;
  /** Canonical protocol name (link for ether/fddi/tr/wlan/ppp/slip; esis, isis for the dashed aliases), or null. */
  p: string | null;
  /** The direction, or null. */
  dir: Dir | null;
  /** The type, or null (host). */
  addr: Addr | null;
  /** The qualifier words, as written, normalised to single spaces. */
  words: string;
}

/** The canonical protocol name of a protocol keyword token. */
function protoName(t: Token): string {
  if (t.t === "LINK") return "link"; // ether, fddi, tr, wlan, ppp, slip, link
  if (t.t === "IPV6") return "ip6"; // ip6
  if (t.t === "ICMPV6") return "icmp6"; // icmp6
  return t.t.toLowerCase(); // ip, tcp, esis (es-is), isis (is-is), ...
}

/** The qualifiers a head defines. */
function qFromHead(h: Head): Q {
  const words = [h.proto?.text, h.dir?.text, h.addr?.text].filter((w): w is string => !!w).join(" "); // as written
  return { proto: h.proto, p: h.proto ? protoName(h.proto) : null, dir: h.dir?.value ?? null, addr: h.addr?.value ?? null, words }; // the qualifiers
}

/** IANA protocol numbers for the abbreviations (IANA Protocol Numbers registry, read 2026-10-27). */
const IP_PROTO: Readonly<Record<string, number>> = Object.freeze({ tcp: 6, udp: 17, sctp: 132, ah: 51, esp: 50, pim: 103, icmp: 1, igmp: 2, vrrp: 112, carp: 112, icmp6: 58 }); // by keyword

/** Packet data accessor protocols (pcap-filter(7), PACKET DATA ACCESSORS; the K/PDA column). */
const PDA_PROTOS = new Set(["arp", "atalk", "carp", "decnet", "icmp", "icmp6", "igmp", "igrp", "ip", "ip6", "lat", "link", "mopdl", "moprc", "pim", "radio", "rarp", "sca", "sctp", "tcp", "udp", "vrrp"]); // after protoName()
/** Accessors that the page says do not match IPv6 packets. */
const IPV4_ONLY_PDA = new Set(["tcp", "udp", "icmp", "igmp", "pim", "vrrp", "carp", "sctp", "igrp"]); // pcap-filter(7)
/** EtherType names "ether proto" takes (pcap-filter(7), ether proto). */
const ETHER_PROTO_NAMES = new Set(["aarp", "arp", "atalk", "decnet", "ip", "ip6", "ipx", "iso", "lat", "lldp", "loopback", "mopdl", "moprc", "netbeui", "rarp", "sca", "slow", "stp"]); // names
/** The 802.11 frame type names, and the subtype names of each (pcap-filter(7), wlan type). */
const WLAN_TYPES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  mgt: ["assoc-req", "assoc-resp", "reassoc-req", "reassoc-resp", "probe-req", "probe-resp", "beacon", "atim", "disassoc", "auth", "deauth"], // management
  ctl: ["bar", "ba", "ps-poll", "rts", "cts", "ack", "cf-end", "cf-end-ack"], // control
  data: ["data", "data-cf-ack", "data-cf-poll", "data-cf-ack-poll", "null", "cf-ack", "cf-poll", "cf-ack-poll", "qos-data", "qos-data-cf-ack", "qos-data-cf-poll", "qos-data-cf-ack-poll", "qos", "qos-cf-poll", "qos-cf-ack-poll"], // data
});
/** The 802.11 direction names (pcap-filter(7), wlan dir). */
const WLAN_DIRS = new Set(["nods", "tods", "fromds", "dstods"]); // names
/** LLC type names (pcap-filter(7), llc type). */
const LLC_TYPES = new Set(["i", "s", "u", "rr", "rnr", "rej", "ui", "ua", "disc", "dm", "sabme", "test", "xid", "frmr"]); // names
/** pf reason codes (pcap-filter(7), reason). */
const PF_REASONS = new Set(["match", "bad-offset", "fragment", "short", "normalize", "memory", "bad-timestamp", "congestion", "ip-option", "proto-cksum", "state-mismatch", "state-insert", "state-limit", "src-limit", "synproxy", "map-failed", "state-locked", "translate", "no-route", "dummynet"]); // codes
/** pf actions (pcap-filter(7), action). */
const PF_ACTIONS = new Set(["pass", "accept", "block", "drop", "scrub", "noscrub", "nat", "nonat", "binat", "nobinat", "rdr", "nordr", "synproxy-drop", "defer", "match", "divert", "rt", "afrt", "dummynet", "nodummynet", "nat64", "nonat64"]); // actions
/** Encapsulation keywords that shift later offsets (pcap-filter(7)). */
const ENCAPS = new Set(["vlan", "mpls", "pppoes", "geneve", "vxlan"]); // kinds

/** A 32-bit unsigned value as a dotted quad. */
function dotted(v: number): string {
  return [24, 16, 8, 0].map((s) => (v >>> s) & 0xff).join("."); // a.b.c.d
}

/** A mask's prefix length when it is contiguous, else null. */
function prefixOf(mask: number): number | null {
  let n = 0; // leading ones
  while (n < 32 && ((mask >>> (31 - n)) & 1) === 1) n++; // count them
  const rebuilt = n === 0 ? 0 : (0xffffffff << (32 - n)) >>> 0; // the contiguous mask of that length
  return rebuilt === mask >>> 0 ? n : null; // contiguous or not
}

/** Parse a HID's dotted parts (each an N) to a value and the number of parts; null when a part is over 255. */
function hidValue(text: string): { v: number; parts: number } | null {
  const parts = text.split("."); // 2 to 4 parts
  let v = 0; // accumulated
  for (const p of parts) { // each part
    const r = numberValue(p); // its value
    if ("error" in r || r.value > 255) return null; // not an octet
    v = v * 256 + r.value; // shift in
  }
  return { v: (v * 2 ** (8 * (4 - parts.length))) >>> 0, parts: parts.length }; // left-justified, as libpcap promotes a short address
}

/** Parse an IPv6 literal (the scanner has validated its shape) to a 128-bit BigInt. */
function ipv6Value(text: string): bigint | null {
  let s = text; // working copy
  let tail: number[] = []; // an embedded IPv4 tail, as two 16-bit groups
  if (s.includes(".")) { // IPv4 tail
    const idx = s.lastIndexOf(":"); // where it starts
    const q = s.slice(idx + 1).split(".").map(Number); // four octets
    if (q.length !== 4 || q.some((x) => !(x >= 0 && x <= 255))) return null; // invalid
    tail = [q[0] * 256 + q[1], q[2] * 256 + q[3]]; // two groups
    s = s.slice(0, idx + 1) + "0:0"; // two placeholder groups stand for the tail while counting
  }
  const halves = s.split("::"); // compression
  const left = halves[0] === "" ? [] : halves[0].split(":"); // left groups
  const right = halves.length > 1 && halves[1] !== "" ? halves[1].split(":") : []; // right groups
  const fill = halves.length > 1 ? 8 - left.length - right.length : 0; // zero groups
  const groups = [...left, ...Array(Math.max(fill, 0)).fill("0"), ...right].map((g) => parseInt(g, 16)); // all eight
  if (groups.length !== 8 || groups.some((g) => Number.isNaN(g))) return null; // malformed
  if (tail.length === 2) { groups[6] = tail[0]; groups[7] = tail[1]; } // the IPv4 tail
  return groups.reduce((acc, g) => (acc << 16n) | BigInt(g), 0n); // 128 bits
}

/** Evaluate a constant arithmetic expression with libpcap's 32-bit unsigned arithmetic, or null. */
function constValue(a: Arith): number | null {
  switch (a.k) {
    case "num": return a.tok.num ?? null; // the constant
    case "paren": return constValue(a.e); // inside
    case "neg": { const v = constValue(a.e); return v === null ? null : (0 - v) >>> 0; } // 0 - v
    case "bin": {
      const l = constValue(a.l); // left
      const r = constValue(a.r); // right
      if (l === null || r === null) return null; // not constant
      switch (a.op.t) {
        case "+": return (l + r) >>> 0; // add
        case "-": return (l - r) >>> 0; // subtract
        case "*": return Number((BigInt(l) * BigInt(r)) & 0xffffffffn); // multiply, 32 bits
        case "/": return r === 0 ? null : Math.floor(l / r) >>> 0; // divide (by zero: unknown)
        case "%": return r === 0 ? null : (l % r) >>> 0; // modulo
        case "&": return (l & r) >>> 0; // and
        case "|": return (l | r) >>> 0; // or
        case "^": return (l ^ r) >>> 0; // xor
        case "LSH": return r >= 32 ? 0 : (l << r) >>> 0; // shift left
        case "RSH": return r >= 32 ? 0 : l >>> r; // shift right
        default: return null; // not an operator
      }
    }
    default: return null; // len and loads are not constant
  }
}

/** Hex text of a value. */
function hex(v: number): string { const h = v.toString(16); return `0x${h.length % 2 ? "0" + h : h}`; } // 0x.., an even number of digits

/**
 * The wording of a value cap that libpcap 1.11.0 enforces and 1.10.7 does not (gencode.c, assert_maxval() in 1.11.0;
 * no such check at the 1.10.7 tag).
 * @param what the field, in both languages ("An IP protocol number")
 * @param max its largest value
 * @param val the value written
 * @param msgName the name libpcap 1.11.0 puts in its message ("protocol number")
 * @param never true when the 1.10.7 test compares a field that can never hold val
 */
function capText(what: Bi, max: number, val: number, msgName: string, never: boolean): Bi {
  return bi(
    `${what.en} is 0 to ${max}; ${val} is too big. libpcap 1.11.0 refuses it ("${msgName} ${val} greater than maximum ${max}"); libpcap 1.10.7, the stable release, compiles it without a complaint${never ? ", and the test can never be true" : ""}.`,
    `${what.pt} vai de 0 a ${max}; ${val} é demais. A libpcap 1.11.0 recusa ("${msgName} ${val} greater than maximum ${max}"); a libpcap 1.10.7, o release estável, compila sem reclamar${never ? ", e o teste nunca pode ser verdadeiro" : ""}.`,
  ); // both versions, stated
}

/**
 * The first number in the code libpcap generates for an arithmetic operand, or null when that code starts with
 * something else: a constant is loaded first, a binary operation starts with its left operand's code, a negation and
 * parentheses with their operand's, and a packet field with its offset's (gen_loadi, gen_arth, gen_neg and
 * gen_load_internal in gencode.c, 1.10.7 and 1.11.0); len loads the packet length, not a number.
 */
function firstImm(a: Arith): number | null {
  switch (a.k) {
    case "num": return a.tok.num ?? null; // ld #k
    case "len": return null; // ld #pktlen
    case "paren": return firstImm(a.e); // transparent
    case "neg": return firstImm(a.e); // its operand first
    case "bin": return firstImm(a.l); // the left operand's code comes first
    case "load": return firstImm(a.offset); // the offset's code comes first
  }
}

/** True when the first number of an operand's code is a packet field's offset (the path to it goes through a load). */
function viaLoad(a: Arith): boolean {
  switch (a.k) {
    case "load": return true; // the offset comes first
    case "paren": case "neg": return viaLoad(a.e); // transparent
    case "bin": return viaLoad(a.l); // the left operand first
    default: return false; // a number or len
  }
}

/** The analyser for one expression. */
class Analyser {
  /** Whole-expression notes, deduplicated by code. */
  private notes = new Map<string, Note>();
  /** Node errors with spans. */
  private errors: { start: number; end: number; note: Note }[] = [];
  /** Encapsulation keywords met so far, in source order. */
  private encaps: string[] = [];

  /** @param src the expression text */
  constructor(private readonly src: string) {}

  /** The source text of a span. */
  private text(s: number, e: number): string { return this.src.slice(s, e); } // slice
  /** Record a whole-expression note once. */
  private global(n: Note): void { if (!this.notes.has(n.code)) this.notes.set(n.code, n); } // dedup
  /** Record a node error. */
  private err(list: Note[], start: number, end: number, n: Note): void { list.push(n); this.errors.push({ start, end, note: n }); } // both places

  /** Run the analysis. */
  run(tree: FNode): Analysis {
    const r = this.node(tree, null, false); // from the root, nothing to inherit
    const ps = protoSets(tree, r.x); // what the bare protocol keywords allow, where that can be known
    if (ps && ps.ids.size === 0) this.err(r.x.errors, tree.start, tree.end, note("rejectsAllPackets", bi("No packet can match this filter: it asks for one packet to carry two different protocols at the same layer. With the optimizer on (the default; -O turns it off) libpcap refuses a filter whose compiled code rejects every packet, with \"expression rejects all packets\", and tcpdump stops.", "Nenhum pacote pode bater com este filtro: ele pede que um mesmo pacote tenha dois protocolos diferentes na mesma camada. Com o otimizador ligado (o padrão; -O desliga) a libpcap recusa um filtro cujo código compilado rejeita todos os pacotes, com \"expression rejects all packets\", e o tcpdump para."), SRC.gencode)); // gencode.c, pcap_compile
    return { root: r.x, notes: [...this.notes.values()], errors: this.errors.sort((a, b) => a.start - b.start), canonical: r.canon }; // the result
  }

  /** Analyse a node in context ctx (the qualifiers a bare value would inherit); underOrNot marks an or/not ancestor. */
  private node(n: FNode, ctx: Q | null, underOrNot: boolean): { x: XNode; q: Q | null; canon: string } {
    const base = { kind: n.k, text: this.text(n.start, n.end), start: n.start, end: n.end, explicit: null, qualifiers: null, inherited: false, notes: [] as Note[], errors: [] as Note[], children: [] as XNode[] }; // shared fields
    switch (n.k) {
      case "and": case "or": {
        const L = this.node(n.l, ctx, underOrNot || n.k === "or"); // left first (source order)
        const R = this.node(n.r, L.q, underOrNot || n.k === "or"); // the right inherits from the left
        const x: XNode = { ...base, label: n.op.text, children: [L.x, R.x], meaning: n.k === "and" ? bi("Both sides must be true.", "Os dois lados precisam ser verdadeiros.") : bi("At least one side must be true.", "Pelo menos um dos lados precisa ser verdadeiro.") }; // the node
        // Mixed and/or without parentheses: equal precedence, left to right (pcap-filter(7), COMPOUND EXPRESSIONS).
        if ((n.l.k === "and" || n.l.k === "or") && n.l.k !== n.k) {
          x.notes.push(note("leftToRight", bi(`"and" and "or" have the same precedence and group from left to right, so this ${n.k} applies to everything on its left: (${this.text(n.l.start, n.l.end)}) ${n.op.text} ${this.text(n.r.start, n.r.end)}. Many programming languages would bind "and" tighter; pcap filters do not.`, `"and" e "or" têm a mesma precedência e agrupam da esquerda para a direita, então este ${n.k} vale para tudo o que está à esquerda: (${this.text(n.l.start, n.l.end)}) ${n.op.text} ${this.text(n.r.start, n.r.end)}. Muitas linguagens de programação dariam precedência ao "and"; os filtros pcap não dão.`), SRC.filter)); // the note
          this.global(note("leftToRight", bi("This expression mixes and and or without parentheses. In pcap filters they have equal precedence and group left to right; add parentheses if you meant otherwise.", "Esta expressão mistura and e or sem parênteses. Nos filtros pcap os dois têm a mesma precedência e agrupam da esquerda para a direita; use parênteses se a intenção era outra."), SRC.filter)); // and globally
        }
        if (endsWithGroup(n.l) && n.r.k === "prim" && n.r.head === null) this.global(note("parenContext", bi("After a parenthesised expression, a bare value takes the qualifiers that were in force before the parenthesis opened, not those of the last primitive inside it.", "Depois de uma expressão entre parênteses, um valor solto recebe os qualificadores em vigor antes de o parêntese abrir, não os do último primitivo lá de dentro."), SRC.grammar)); // the grammar's paren rule
        if (n.l.k === "not") this.global(note("notTight", bi(`"not" applies only to the term right after it: ${this.text(n.l.start, n.l.end)} is negated, and ${n.op.text} then joins the result with what follows.`, `O "not" vale só para o termo logo depois dele: ${this.text(n.l.start, n.l.end)} é negado, e o ${n.op.text} junta esse resultado com o que vem depois.`), SRC.filter)); // not binds tighter
        const wrap = (c: FNode, s: string) => (c.k === "and" || c.k === "or" ? `(${s})` : s); // parenthesise nested and/or
        return { x, q: R.q, canon: `${wrap(n.l, L.canon)} ${n.op.text} ${wrap(n.r, R.canon)}` }; // the most recent qualifiers flow on
      }
      case "not": {
        const E = this.node(n.e, ctx, true); // the negated node
        const x: XNode = { ...base, label: n.op.text, children: [E.x], meaning: bi("True when the term right after it is false. It binds tighter than and and or.", "Verdadeiro quando o termo logo depois dele é falso. Tem precedência maior que and e or.") }; // the node
        const inner = n.e.k === "and" || n.e.k === "or" ? `(${E.canon})` : E.canon; // keep grouping explicit
        return { x, q: E.q, canon: `${n.op.text} ${inner}` }; // "not" passes its term's qualifiers on
      }
      case "group": {
        const E = this.node(n.e, ctx, underOrNot); // the inside
        const x: XNode = { ...base, label: "( )", children: [E.x], meaning: n.valuesOnly ? bi("A list of values sharing one set of qualifiers: each value inside gets the qualifiers in force before the parenthesis.", "Uma lista de valores com os mesmos qualificadores: cada valor lá dentro recebe os qualificadores em vigor antes do parêntese.") : bi("Parentheses: the expression inside is evaluated as one term.", "Parênteses: a expressão de dentro é avaliada como um único termo.") }; // the node
        return { x, q: n.valuesOnly ? E.q : ctx, canon: `(${E.canon})` }; // values: theirs; expression: the context
      }
      case "prim": return this.prim(n, ctx, base);
      case "abbrev": return this.abbrev(n, base);
      case "rel": return this.rel(n, base);
      case "special": return this.special(n, base, underOrNot);
    }
  }

  /** Attach the encapsulation note to a leaf when an encapsulation keyword came before it. */
  private encapNote(x: XNode): void {
    if (this.encaps.length === 0) return; // nothing shifted yet
    const kinds = joinWords([...new Set(this.encaps)], "en"); // the keywords
    x.notes.push(note("afterEncap", bi(`Decoded as if inside the ${kinds} encapsulation seen earlier in the expression: pcap-filter(7) says the first ${this.encaps[0]} keyword changes the offsets for the rest of the expression${this.encaps.filter((e) => e === "vlan" || e === "mpls").length > 1 ? ", and each further vlan or mpls adds 4 bytes" : ""}.`, `Decodificado como se estivesse dentro do encapsulamento ${joinWords([...new Set(this.encaps)], "pt")} visto antes na expressão: o pcap-filter(7) diz que a primeira palavra ${this.encaps[0]} muda os offsets do resto da expressão${this.encaps.filter((e) => e === "vlan" || e === "mpls").length > 1 ? ", e cada vlan ou mpls seguinte soma 4 bytes" : ""}.`), SRC.filter)); // the note
  }

  // ---- primitives with qualifiers ------------------------------------------------------------------------------
  /** A value with its qualifiers (written or inherited). */
  private prim(n: Extract<FNode, { k: "prim" }>, ctx: Q | null, base: Omit<XNode, "label" | "meaning">): { x: XNode; q: Q | null; canon: string } {
    const inherited = n.head === null; // a bare value
    const q = n.head ? qFromHead(n.head) : ctx; // the qualifiers in force
    const v = n.value; // the value
    const vText = this.valueText(v); // its text
    const x: XNode = { ...base, label: q ? `${q.words} ${vText}`.trim() : vText, meaning: bi("", ""), qualifiers: q ? q.words || null : null, inherited }; // filled below
    if (!q) { // nothing to inherit: libpcap reports a syntax error (gencode.c, the Q_UNDEF case)
      const eg = v.kind === "num" ? `port ${vText}` : v.kind === "mac" ? `ether host ${vText}` : `host ${vText}`; // a likely rewrite
      this.err(x.errors, v.start, v.end, note("noQualifierToInherit", bi(`"${vText}" is a bare value, and there are no qualifiers to give it: the term before it is a bare protocol keyword, a relation, a special primitive or a parenthesised expression (or nothing). libpcap rejects this as a syntax error. Write the qualifiers out, for example ${eg}.`, `"${vText}" é um valor solto, e não há qualificadores para ele herdar: o termo anterior é uma palavra de protocolo sozinha, uma relação, um primitivo especial ou uma expressão entre parênteses (ou nada). A libpcap rejeita isso como erro de sintaxe. Escreva os qualificadores, por exemplo ${eg}.`), SRC.grammar)); // the error
      x.meaning = bi("A value with no qualifiers in force.", "Um valor sem qualificadores em vigor."); // short meaning
      return { x, q: null, canon: vText }; // no qualifiers flow on
    }
    if (inherited) x.notes.push(note("inherited", bi(`No qualifiers written here: "${vText}" takes the most recent ones, "${q.words}", so it reads as ${q.words} ${vText} (pcap-filter(7), COMPOUND EXPRESSIONS).`, `Sem qualificadores escritos aqui: "${vText}" herda os mais recentes, "${q.words}", e se lê como ${q.words} ${vText} (pcap-filter(7), COMPOUND EXPRESSIONS).`), SRC.filter)); // the shorthand
    this.value(q, v, vText, x); // meaning, explicit, notes, errors
    if (x.meaning.en === "") x.meaning = bi("Not explained further: the error below says what libpcap does with it, and in which versions.", "Sem explicação adicional: o erro abaixo diz o que a libpcap faz com isso, e em quais versões."); // a refusal says so
    this.encapNote(x); // offsets shifted by an earlier encapsulation keyword
    return { x, q, canon: `${q.words} ${vText}`.trim() }; // its qualifiers flow on
  }

  /** The text of a value as written (a parenthesised number is written without its parentheses). */
  private valueText(v: IdValue): string {
    if (v.kind === "num") return v.toks[0].text; // the number itself
    return v.toks.map((t) => t.text).join(v.kind === "ipv4-mask" ? " " : ""); // "a/len" or "a mask m"
  }

  /** Fill meaning, explicit, notes and errors of a value under qualifiers q. */
  private value(q: Q, v: IdValue, vText: string, x: XNode): void {
    const addr = q.addr ?? "host"; // the type (host by default)
    const P = q.p; // the protocol, or null
    const pw = q.proto?.text ?? ""; // the protocol word as written
    const D = q.dir; // the direction
    const wlanDir = D !== null && ["addr1", "addr2", "addr3", "addr4", "ra", "ta"].includes(D); // an 802.11-only direction
    const dirW = dirWords(D); // the direction in words
    const E = (code: string, text: Bi, src: string = SRC.gencode) => this.err(x.errors, x.start, x.end, note(code, text, src)); // an error on the primitive (qualifiers and value)
    const N = (code: string, text: Bi, src: string = SRC.filter) => x.notes.push(note(code, text, src)); // a note on the value
    const badProto = (what: Bi) => E("protoNotValid", bi(`"${pw}" is not a valid protocol qualifier for ${what.en}.`, `"${pw}" não é um qualificador de protocolo válido para ${what.pt}.`)); // the common refusal
    const kind = v.kind; // the value kind
    // An 802.11 direction is valid only with a MAC address on an 802.11 link (pcap-filter(7), dir; gencode.c).
    if (wlanDir && kind !== "mac") E("wlanDirOnly", bi(`"${D}" is an 802.11 address qualifier: it applies only to MAC addresses on IEEE 802.11 link layers.`, `"${D}" é um qualificador de endereço 802.11: só vale para endereços MAC em link layers IEEE 802.11.`), SRC.filter);

    // ---- MAC-48 address ----
    if (kind === "mac") {
      if (!((addr === "host") && P === "link")) { // only "ether host MAC" (or another link keyword)
        E("macNeedsLink", bi(`A MAC address needs the link-layer qualifier: write ether host ${vText} (or ether src / ether dst ${vText}).`, `Um endereço MAC precisa do qualificador de enlace: escreva ether host ${vText} (ou ether src / ether dst ${vText}).`)); // gencode.c, gen_ecode
        x.meaning = bi(`The MAC address ${vText}, in a position that does not accept one.`, `O endereço MAC ${vText}, numa posição que não aceita MAC.`); // short
        return; // nothing more to say
      }
      x.meaning = wlanDir
        ? bi(`True if the ${dirW.en} of the 802.11 header is ${vText}. Valid only on IEEE 802.11 link layers.`, `Verdadeiro se o ${dirW.pt} do header 802.11 for ${vText}. Só vale em link layers IEEE 802.11.`)
        : bi(`True if the link-layer ${dirW.en} address is ${vText} (Ethernet, 802.11, FDDI, Token Ring, IPFC and ATM LANE addresses all count).`, `Verdadeiro se o endereço de enlace de ${dirW.pt} for ${vText} (contam endereços Ethernet, 802.11, FDDI, Token Ring, IPFC e ATM LANE).`); // pcap-filter(7), ether host
      x.explicit = `${pw} ${wlanDir ? D : dirExplicit(D)} host ${vText}`; // spelled out
      if (vText.length === 12 && /^[0-9]+$/.test(vText)) N("macFromDigits", bi("Twelve digits in a row are read as a MAC address, not as a number (pcap-filter(7) warns about octal numbers like this).", "Doze dígitos seguidos são lidos como endereço MAC, não como número (o pcap-filter(7) avisa sobre números octais assim)."), SRC.filter); // the lexer trap
      return; // done
    }

    // ---- MAC-8 address ($xx) ----
    if (kind === "mac8") {
      if (addr !== "host" || P !== "link") E("mac8NeedsLink", bi(`A $xx address works only as link host ${vText} (with link, ether or another link-layer keyword).`, `Um endereço $xx só funciona como link host ${vText} (com link, ether ou outra palavra de enlace).`)); // gencode.c, gen_acode
      x.meaning = bi(`True if the ${dirW.en} ARCnet node ID or MS/TP station address is ${vText}. Only for DLT_ARCNET, DLT_ARCNET_LINUX and DLT_BACNET_MS_TP captures.`, `Verdadeiro se o node ID ARCnet ou o endereço de estação MS/TP de ${dirW.pt} for ${vText}. Só em capturas DLT_ARCNET, DLT_ARCNET_LINUX e DLT_BACNET_MS_TP.`); // pcap-filter(7), link host
      x.explicit = `link ${dirExplicit(D)} host ${vText}`; // spelled out
      N("dollarShell", bi("A $ followed by hex digits is also shell parameter syntax: keep the filter in single quotes.", "Um $ seguido de dígitos hexa também é sintaxe de parâmetro do shell: mantenha o filtro entre aspas simples."), SRC.filter); // pcap-filter(7), link host
      return; // done
    }

    // ---- by type ----
    switch (addr) {
      case "port": case "portrange": return this.portValue(q, v, vText, x, E, N, badProto);
      case "proto": case "protochain": return this.protoValue(q, v, vText, x, E, N, badProto);
      case "gateway": {
        if (kind !== "name") { E("gatewayNeedsName", bi(`gateway takes a host NAME, which must resolve both to an IP address and, through ethers(5), to a MAC address; "${vText}" is not a name.`, `gateway recebe um NOME de host, que precisa resolver tanto para um endereço IP quanto, via ethers(5), para um endereço MAC; "${vText}" não é um nome.`)); return; } // gencode.c
        if (P !== null && !["ip", "arp", "rarp"].includes(P)) badProto(bi("gateway", "gateway")); // gen_gateway
        const fam = P ? bi(pw === "ip" ? "IPv4" : pw.toUpperCase(), pw === "ip" ? "IPv4" : pw.toUpperCase()) : bi("IPv4, ARP and RARP", "IPv4, ARP e RARP"); // the address families tested
        x.meaning = bi(`True if the packet used ${vText} as a gateway: its link-layer source or destination is ${vText}'s MAC address, but neither its ${fam.en} source nor its destination address is ${vText}'s.`, `Verdadeiro se o pacote usou ${vText} como gateway: a origem ou o destino de enlace é o MAC de ${vText}, mas nem a origem nem o destino ${fam.pt} é o endereço de ${vText}.`); // pcap-filter(7), gateway
        x.explicit = P ? `ether host ${vText} and ${pw} and not ${pw} host ${vText}` : `ether host ${vText} and not (ip or arp or rarp) host ${vText}`; // the page's own expansion (for ip) and its wording (unqualified)
        N("gatewayVersion", bi("This is the definition of libpcap 1.11.0, the testing release. Before 1.11.0 gateway had a different definition that did not give the expected results, and its support was disabled by default since libpcap 1.0.0. It does not work inside MPLS, VXLAN or Geneve.", "Esta é a definição da libpcap 1.11.0, o release de teste. Antes da 1.11.0 o gateway tinha outra definição, que não dava o resultado esperado, e o suporte vinha desligado por padrão desde a libpcap 1.0.0. Não funciona dentro de MPLS, VXLAN ou Geneve."), SRC.filter); // BACKWARD COMPATIBILITY
        N("gatewayStable", bi(`libpcap 1.10.7, the stable release, compiles gateway only when it was built without IPv6 support; the usual builds stop with "'gateway' not supported in this configuration", as 1.10.4 did in our test.`, `A libpcap 1.10.7, o release estável, só compila gateway quando foi construída sem suporte a IPv6; os builds habituais param com "'gateway' not supported in this configuration", como a 1.10.4 parou no nosso teste.`), SRC.gencodeStable); // gencode.c 1.10.7, #ifndef INET6
        N("resolvedAtCompile", bi(`"${vText}" is resolved when the filter is compiled, on the capturing machine (hosts(5), DNS, NIS and ethers(5)); this tool cannot know the answer.`, `"${vText}" é resolvido quando o filtro é compilado, na máquina que captura (hosts(5), DNS, NIS e ethers(5)); esta ferramenta não tem como saber a resposta.`)); // platform-dependent
        return; // done
      }
      default: return this.hostNetValue(q, v, vText, x, E, N, badProto, addr as "host" | "net");
    }
  }

  /** host and net values. */
  private hostNetValue(q: Q, v: IdValue, vText: string, x: XNode, E: (c: string, t: Bi, s?: string) => void, N: (c: string, t: Bi, s?: string) => void, badProto: (w: Bi) => void, addr: "host" | "net"): void {
    const P = q.p; // protocol
    const pw = q.proto?.text ?? ""; // as written
    const D = q.dir; // direction
    const dirW = dirWords(D); // in words
    const kind = v.kind; // value kind
    const ptxt = (fam: "4" | "6" | "name") => (P ? pw : fam === "4" ? "(ip or arp or rarp)" : fam === "6" ? "ip6" : "(ip or ip6 or arp or rarp)"); // the protocol set
    const famWords = (fam: "4" | "6" | "name"): Bi => (P ? bi(`${pw} only`, `só ${pw}`) : fam === "4" ? bi("IPv4, ARP and RARP", "IPv4, ARP e RARP") : fam === "6" ? bi("IPv6", "IPv6") : bi("whichever of IPv4, IPv6, ARP and RARP fit the addresses the name resolves to", "o que couber entre IPv4, IPv6, ARP e RARP, conforme os endereços para os quais o nome resolver")); // in words
    if (P === "decnet") { // DECnet addresses
      if (kind === "ipv4" || kind === "num") {
        const parts = vText.split("."); // area.node
        const okShape = parts.length === 2 && Number(parts[0]) <= 63 && Number(parts[1]) <= 1023; // ranges
        if (!okShape) E("badDecnet", bi(`A DECnet address is AREA.NODE, the area 0 to 63 and the node 0 to 1023, both decimal; "${vText}" is not one.`, `Um endereço DECnet é AREA.NODE, a área de 0 a 63 e o nó de 0 a 1023, ambos decimais; "${vText}" não é um.`), SRC.filter); // pcap-filter(7), decnet host
        x.meaning = bi(`True if the DECnet ${dirW.en} address is ${vText}.`, `Verdadeiro se o endereço DECnet de ${dirW.pt} for ${vText}.`); // the meaning
        x.explicit = `decnet ${dirExplicit(D)} host ${vText}`; // spelled out
        return; // done
      }
      E("protoNotValid", bi(`decnet takes a numeric DECnet address (AREA.NODE) here, not "${vText}".`, `decnet aceita aqui um endereço DECnet numérico (AREA.NODE), não "${vText}".`)); // gencode.c
      return; // done
    }
    if (P === "link") { // ether host NAME (a MAC address is handled earlier)
      if (kind === "name" && addr === "host") {
        x.meaning = bi(`True if the link-layer ${dirW.en} address is the MAC address that ethers(5) gives for "${vText}" on the capturing machine.`, `Verdadeiro se o endereço de enlace de ${dirW.pt} for o MAC que o ethers(5) da máquina que captura associa a "${vText}".`); // pcap-filter(7), ether host
        x.explicit = `${pw} ${dirExplicit(D)} host ${vText}`; // spelled out
        N("resolvedAtCompile", bi(`"${vText}" is looked up in ethers(5) when the filter is compiled; this tool cannot know the answer.`, `"${vText}" é procurado no ethers(5) quando o filtro é compilado; esta ferramenta não tem como saber a resposta.`)); // platform
        return; // done
      }
      E("linkNeedsMac", bi(`${pw} ${addr} takes a MAC address or an ethers(5) name, not "${vText}". For an IP address drop "${pw}" or use ip / ip6.`, `${pw} ${addr} recebe um endereço MAC ou um nome do ethers(5), não "${vText}". Para endereço IP, tire o "${pw}" ou use ip / ip6.`)); // gencode.c, illegal link-layer address
      return; // done
    }
    const v4ok = P === null || P === "ip" || P === "arp" || P === "rarp"; // protocols for an IPv4 value
    const v6ok = P === null || P === "ip6"; // protocols for an IPv6 value
    switch (kind) {
      case "name": {
        if (P !== null && !["ip", "ip6", "arp", "rarp"].includes(P)) { badProto(bi(addr, addr)); return; } // gencode.c
        if (addr === "net") { // a network name
          x.meaning = bi(`True if the ${dirW.en} address belongs to the network named "${vText}" in the networks database of the capturing machine (networks(5), NIS, LDAP...).`, `Verdadeiro se o endereço de ${dirW.pt} pertencer à rede chamada "${vText}" no banco networks da máquina que captura (networks(5), NIS, LDAP...).`); // pcap-filter(7), net
          x.explicit = `${P ? pw : "(ip or arp or rarp)"} ${dirExplicit(D)} net ${vText}`; // IPv4 network names only
          N("netNames", bi("pcap-filter(7) advises against IPv4 network names in portable filters: some systems have no networks database, and the same line can mean a /32 or a /16 depending on the implementation.", "O pcap-filter(7) desaconselha nomes de rede IPv4 em filtros portáveis: alguns sistemas não têm banco networks, e a mesma linha pode valer /32 ou /16 conforme a implementação.")); // the warning
          return; // done
        }
        x.meaning = bi(`True if the ${dirW.en} address is any address the name "${vText}" resolves to (${famWords("name").en}). The name is resolved with getaddrinfo(3) when the filter is compiled, on the capturing machine.`, `Verdadeiro se o endereço de ${dirW.pt} for qualquer um dos endereços para os quais o nome "${vText}" resolver (${famWords("name").pt}). O nome é resolvido com getaddrinfo(3) quando o filtro é compilado, na máquina que captura.`); // pcap-filter(7), host
        x.explicit = `${ptxt("name")} ${dirExplicit(D)} host ${vText}`; // spelled out
        if (P === "ip6") N("familyFilter", bi("With ip6, IPv4 results of the lookup are ignored; a name with no IPv6 address is an error.", "Com ip6, os resultados IPv4 da resolução são ignorados; um nome sem endereço IPv6 é erro."));
        else if (P) N("familyFilter", bi(`With ${pw}, IPv6 results of the lookup are ignored; a name with no IPv4 address is an error.`, `Com ${pw}, os resultados IPv6 da resolução são ignorados; um nome sem endereço IPv4 é erro.`)); // pcap-filter(7), host
        N("resolvedAtCompile", bi(`This tool cannot know what "${vText}" resolves to: DNS and hosts(5) are read on the capturing machine, once, at compile time.`, `Esta ferramenta não tem como saber para o que "${vText}" resolve: o DNS e o hosts(5) são lidos na máquina que captura, uma vez, na compilação.`)); // platform
        this.nameHints(vText, N); // keyword and arithmetic look-alikes
        return; // done
      }
      case "ipv4": case "num": {
        if (!v4ok) { badProto(bi(`${addr} with an IPv4 address`, `${addr} com endereço IPv4`)); return; } // gencode.c, gen_host
        let val: number; // the 32-bit value
        let parts = 4; // dotted parts (a single number counts as 4 for host)
        if (kind === "num") val = v.toks[0].num!; // a number
        else { const h = hidValue(vText); if (!h) { E("badIpv4", bi(`"${vText}" is not a valid IPv4 address: each dotted part must be 0 to 255.`, `"${vText}" não é um endereço IPv4 válido: cada parte pontuada vai de 0 a 255.`)); return; } val = h.v; parts = h.parts; } // dotted
        let len: number; // the prefix length actually tested
        if (addr === "net" && kind === "num") { // a single number as a network: promoted byte by byte (gencode.c)
          let m = 0xffffffff; // mask
          let n = val; // value
          while (n !== 0 && (n & 0xff000000) === 0) { n = (n << 8) >>> 0; m = (m << 8) >>> 0; } // shift left while the top byte is zero
          val = n; len = prefixOf(m) ?? 32; // promoted
        } else len = parts * 8; // a dotted pair is /16, a triple /24, a quad /32
        const shown = len === 32 ? dotted(val) : `${dotted(val)}/${len}`; // what is tested
        if (addr === "host" && len === 32) x.meaning = bi(`True if the ${dirW.en} address is ${dotted(val)} (${famWords("4").en}).`, `Verdadeiro se o endereço de ${dirW.pt} for ${dotted(val)} (${famWords("4").pt}).`); // a host
        else x.meaning = bi(`True if the ${dirW.en} address is in ${shown} (${famWords("4").en}).`, `Verdadeiro se o endereço de ${dirW.pt} estiver em ${shown} (${famWords("4").pt}).`); // a network
        x.explicit = `${ptxt("4")} ${dirExplicit(D)} ${addr} ${vText}`; // spelled out
        if (kind === "num") N("numberAsAddress", bi(`A single number is a whole 32-bit IPv4 ${addr === "net" ? "network number; libpcap shifts it left byte by byte until the top byte is not zero" : "address"}: ${vText} means ${shown}.`, `Um número sozinho é um ${addr === "net" ? "número de rede IPv4 de 32 bits; a libpcap o desloca para a esquerda byte a byte até o byte mais alto não ser zero" : "endereço IPv4 inteiro de 32 bits"}: ${vText} significa ${shown}.`), addr === "net" ? SRC.gencode : SRC.filter); // pcap-filter(7), gencode.c
        else if (parts < 4) N("shortDotted", bi(`A dotted ${parts === 2 ? "pair" : "triple"} is a network: ${vText} means ${shown}, so this is a network match${addr === "host" ? " even though the type is host" : ""}.`, `Um endereço com ${parts === 2 ? "duas" : "três"} partes é uma rede: ${vText} significa ${shown}, então o teste é de rede${addr === "host" ? " mesmo com o tipo host" : ""}.`)); // pcap-filter(7)
        else if (addr === "net") N("netQuad", bi("A dotted quad after net has the netmask /32, so this is really a host match.", "Um endereço de quatro partes depois de net tem máscara /32, então na prática é um teste de host.")); // pcap-filter(7)
        return; // done
      }
      case "ipv4-cidr": case "ipv4-mask": {
        // libpcap's order (gen_mcode in 1.10.7 and 1.11.0): the address, the mask length, the bits outside the mask,
        // then the type (only net takes a mask), then the protocol (gen_host). The first failure is the one reported.
        const a = hidValue(v.toks[0].text); // the address
        if (!a) { E("badIpv4", bi(`"${v.toks[0].text}" is not a valid IPv4 address.`, `"${v.toks[0].text}" não é um endereço IPv4 válido.`)); return; } // invalid
        let mask: number; // the mask
        let label: string; // how to show it
        if (kind === "ipv4-cidr") { // /len
          const l = v.toks[2].num!; // the length
          if (l > 32) { E("prefixTooLong", bi(`An IPv4 prefix length is 0 to 32; ${l} is too long.`, `O tamanho de prefixo IPv4 vai de 0 a 32; ${l} é demais.`)); return; } // gencode.c
          mask = l === 0 ? 0 : (0xffffffff << (32 - l)) >>> 0; // the mask
          label = `/${l}`; // shown
        } else { // mask m
          if (v.toks[0].text.split(".").length === 1) { E("maskNeedsDotted", bi("The single-number form is not valid with mask.", "A forma de número único não vale com mask.")); return; } // pcap-filter(7)
          const m = hidValue(v.toks[2].text); // the mask
          if (!m) { E("badIpv4", bi(`"${v.toks[2].text}" is not a valid mask.`, `"${v.toks[2].text}" não é uma máscara válida.`)); return; } // invalid
          mask = m.v; // the mask
          const pl = prefixOf(mask); // contiguous?
          label = pl === null ? ` mask ${dotted(mask)}` : `/${pl}`; // shown
          if (pl === null) N("oddMask", bi(`The mask ${dotted(mask)} is not contiguous; libpcap accepts any 32-bit mask here, and the net addr/len form is usually the better fit.`, `A máscara ${dotted(mask)} não é contígua; a libpcap aceita qualquer máscara de 32 bits aqui, e a forma net endereço/tamanho costuma ser a melhor escolha.`)); // pcap-filter(7)
        }
        if (((a.v & ~mask) >>> 0) !== 0) { E("hostBits", bi(`${vText} has bits set outside the mask; libpcap refuses it ("non-network bits set"). The network is ${dotted((a.v & mask) >>> 0)}${label}.`, `${vText} tem bits ligados fora da máscara; a libpcap recusa ("non-network bits set"). A rede é ${dotted((a.v & mask) >>> 0)}${label}.`)); return; } // gencode.c
        if (addr !== "net") { // only net takes a mask or a prefix length
          const docs = kind === "ipv4-cidr"
            ? bi(` pcap-filter(7) says net may be left out before addr/len when a direction is given, but the compiler of libpcap 1.10.7 and 1.11.0 refuses that form too (gencode.c; libpcap 1.10.4 also refused it in our test).`, ` O pcap-filter(7) diz que o net pode ser omitido antes de endereço/tamanho quando há direção, mas o compilador da libpcap 1.10.7 e da 1.11.0 também recusa essa forma (gencode.c; a libpcap 1.10.4 também recusou no nosso teste).`)
            : bi(" pcap-filter(7) says net remains mandatory with mask.", " O pcap-filter(7) diz que o net continua obrigatório com mask."); // doc and code
          E("prefixNeedsNet", bi(`An address with a ${kind === "ipv4-cidr" ? "prefix length" : "mask"} needs the net keyword: write ${q.dir ? q.dir + " " : ""}net ${vText}.${docs.en}`, `Um endereço com ${kind === "ipv4-cidr" ? "tamanho de prefixo" : "máscara"} precisa da palavra net: escreva ${q.dir ? q.dir + " " : ""}net ${vText}.${docs.pt}`)); return; // gencode.c, gen_mcode
        }
        if (!v4ok) { badProto(bi("net with an IPv4 prefix", "net com prefixo IPv4")); return; } // gencode.c, gen_host
        x.meaning = bi(`True if the ${dirW.en} address is in ${dotted(a.v)}${label} (${famWords("4").en}).`, `Verdadeiro se o endereço de ${dirW.pt} estiver em ${dotted(a.v)}${label} (${famWords("4").pt}).`); // a network
        x.explicit = `${ptxt("4")} ${dirExplicit(D)} net ${vText}`; // spelled out
        if (kind === "ipv4-cidr" && v.toks[2].num === 0) N("zeroPrefix", bi("A /0 prefix matches every address, so this only tests the protocols.", "Um prefixo /0 aceita qualquer endereço, então só testa os protocolos.")); // pcap-filter(7)
        return; // done
      }
      case "ipv6": case "ipv6-cidr": {
        // libpcap's order (gen_mcode6, gen_ncode6): the address, the length, the bits outside the prefix, the type, the protocol.
        const addrText = v.toks[0].text; // the address
        const val = ipv6Value(addrText); // its value
        if (val === null) { E("badIpv6", bi(`"${addrText}" is not a valid IPv6 address.`, `"${addrText}" não é um endereço IPv6 válido.`)); return; } // invalid
        const l = kind === "ipv6-cidr" ? v.toks[2].num! : 128; // the length
        if (l > 128) { E("prefixTooLong", bi(`An IPv6 prefix length is 0 to 128; ${l} is too long.`, `O tamanho de prefixo IPv6 vai de 0 a 128; ${l} é demais.`)); return; } // gencode.c
        const mask = l === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - l)) - 1n); // the mask
        if ((val & ~mask & ((1n << 128n) - 1n)) !== 0n) { E("hostBits", bi(`${vText} has bits set outside the /${l} prefix; libpcap refuses it ("non-network bits set").`, `${vText} tem bits ligados fora do prefixo /${l}; a libpcap recusa ("non-network bits set").`)); return; } // gencode.c
        if (addr === "host" && l !== 128) { E("prefixNeedsNet", bi(`An IPv6 prefix shorter than /128 needs the net keyword: write ${q.dir ? q.dir + " " : ""}net ${vText}. pcap-filter(7) says net may be left out when a direction is given, but the compiler of libpcap 1.10.7 and 1.11.0 refuses that form too (gencode.c; libpcap 1.10.4 also refused it in our test).`, `Um prefixo IPv6 menor que /128 precisa da palavra net: escreva ${q.dir ? q.dir + " " : ""}net ${vText}. O pcap-filter(7) diz que o net pode ser omitido quando há direção, mas o compilador da libpcap 1.10.7 e da 1.11.0 também recusa essa forma (gencode.c; a libpcap 1.10.4 também recusou no nosso teste).`)); return; } // doc and code disagree
        if (!v6ok) { badProto(bi(`${addr} with an IPv6 address`, `${addr} com endereço IPv6`)); return; } // gencode.c, gen_host6
        x.meaning = l === 128 ? bi(`True if the ${dirW.en} IPv6 address is ${addrText}.`, `Verdadeiro se o endereço IPv6 de ${dirW.pt} for ${addrText}.`) : bi(`True if the ${dirW.en} IPv6 address is in ${addrText}/${l}.`, `Verdadeiro se o endereço IPv6 de ${dirW.pt} estiver em ${addrText}/${l}.`); // the meaning
        x.explicit = `${ptxt("6")} ${dirExplicit(D)} ${addr} ${vText}`; // spelled out
        if (addr === "net" && kind === "ipv6") N("netV6Host", bi("An IPv6 address after net without a length has the implicit /128, so this is a host match; write net addr/len for a network.", "Um endereço IPv6 depois de net sem tamanho tem /128 implícito, então é teste de host; para rede, escreva net endereço/tamanho.")); // pcap-filter(7)
        if (addr === "host" && kind === "ipv6-cidr") N("v6Slash128", bi("libpcap tolerates /128 after an IPv6 host; pcap-filter(7) calls this a quirk that may be removed.", "A libpcap tolera /128 depois de um host IPv6; o pcap-filter(7) chama isso de peculiaridade que pode ser removida.")); // pcap-filter(7)
        return; // done
      }
      default: E("valueNotValid", bi(`${addr} does not take "${vText}".`, `${addr} não aceita "${vText}".`)); return; // not reached
    }
  }

  /** port and portrange values. */
  private portValue(q: Q, v: IdValue, vText: string, x: XNode, E: (c: string, t: Bi, s?: string) => void, N: (c: string, t: Bi, s?: string) => void, badProto: (w: Bi) => void): void {
    const P = q.p; // protocol
    const pw = q.proto?.text ?? ""; // as written
    const addr = q.addr!; // port or portrange
    const dirW = dirWords(q.dir); // direction in words
    const protoSet = P ? pw : "(tcp or udp or sctp)"; // spelled out
    const protoWords = P ? bi(pw.toUpperCase(), pw.toUpperCase()) : bi("TCP, UDP or SCTP", "TCP, UDP ou SCTP"); // in words
    if (P !== null && !["tcp", "udp", "sctp"].includes(P)) { badProto(bi(addr, addr)); if (P === "ip" || P === "ip6") N("portL3", bi(`port cannot take a layer-3 qualifier in the same primitive; combine instead: ${pw} and tcp ${addr} ${vText}.`, `port não aceita qualificador de camada 3 no mesmo primitivo; combine: ${pw} and tcp ${addr} ${vText}.`)); return; } // pcap-filter(7), port
    if (v.kind !== "num" && v.kind !== "name") { E("portWithAddress", bi(`"${addr}" takes a port number or a service name, not an address.`, `"${addr}" recebe um número de porta ou um nome de serviço, não um endereço.`), SRC.grammar); return; } // grammar.y.in YYABORT
    const v4v6 = bi("over IPv4 (only an unfragmented packet or the first fragment) or IPv6 (only without extension headers)", "sobre IPv4 (só pacote não fragmentado ou o primeiro fragmento) ou IPv6 (só sem extension headers)"); // pcap-filter(7), port
    x.explicit = `${protoSet} ${dirExplicit(q.dir)} ${addr} ${vText}`; // spelled out
    if (v.kind === "num") { // a number: port, or portrange with one number
      const n = v.toks[0].num!; // the value
      if (n > 65535) { E("portTooBig", bi(`A port number is 0 to 65535; ${n} is too big.`, `Um número de porta vai de 0 a 65535; ${n} é demais.`)); return; } // gencode.c
      x.meaning = bi(`True if the ${protoWords.en} ${dirW.en} port is ${n}, ${v4v6.en}. Only the number is checked, not which protocol owns it.`, `Verdadeiro se a porta ${protoWords.pt} de ${dirW.pt} for ${n}, ${v4v6.pt}. Só o número é verificado, não qual protocolo é dono dele.`); // pcap-filter(7)
      if (addr === "portrange") N("rangeOfOne", bi("A portrange with a single number is the same as port.", "Um portrange com um único número é o mesmo que port."), SRC.gencode); // gencode.c comment
      if (v.toks[0].radix === "oct") N("octalPort", bi(`${vText} starts with 0, so it is octal: port ${n}.`, `${vText} começa com 0, então é octal: porta ${n}.`), SRC.scanner); // scanner.l
      return; // done
    }
    const name = v.toks[0].id ?? vText; // the name
    if (addr === "portrange") { // a-b
      const parts = name.split("-"); // the ends
      if (parts.length < 2) { E("rangeNoHyphen", bi(`A port range is written low-high with one hyphen and no spaces, for example 6000-6008; "${name}" has no hyphen.`, `Uma faixa de portas se escreve início-fim, com um hífen e sem espaços, por exemplo 6000-6008; "${name}" não tem hífen.`)); return; } // gencode.c
      if (parts.length > 2) { E("rangeHyphens", bi(`"${name}" has more than one hyphen, so libpcap cannot tell where the range splits (a service name with a hyphen cannot be used here).`, `"${name}" tem mais de um hífen, então a libpcap não sabe onde a faixa se divide (nome de serviço com hífen não serve aqui).`)); return; } // gencode.c
      const ends = parts.map((p) => (/^[0-9]+$/.test(p) ? Number(p) : p)); // numbers or names
      for (const e of ends) if (typeof e === "number" && e > 65535) { E("portTooBig", bi(`A port number is 0 to 65535; ${e} is too big.`, `Um número de porta vai de 0 a 65535; ${e} é demais.`)); return; } // gencode.c
      const lo = ends.every((e) => typeof e === "number") ? Math.min(ends[0] as number, ends[1] as number) : null; // numeric low end
      const hi = ends.every((e) => typeof e === "number") ? Math.max(ends[0] as number, ends[1] as number) : null; // numeric high end
      x.meaning = lo !== null ? bi(`True if the ${protoWords.en} ${dirW.en} port is between ${lo} and ${hi} inclusive, ${v4v6.en}.`, `Verdadeiro se a porta ${protoWords.pt} de ${dirW.pt} estiver entre ${lo} e ${hi}, inclusive, ${v4v6.pt}.`) : bi(`True if the ${protoWords.en} ${dirW.en} port is in the range ${name}, ${v4v6.en}; the service names are looked up in services(5) on the capturing machine.`, `Verdadeiro se a porta ${protoWords.pt} de ${dirW.pt} estiver na faixa ${name}, ${v4v6.pt}; os nomes de serviço são procurados no services(5) da máquina que captura.`); // pcap-filter(7)
      if (lo !== null && ends[0] !== lo && ends[0] !== ends[1]) N("rangeEitherOrder", bi("The two ends may be written in either order.", "As duas pontas podem vir em qualquer ordem.")); // pcap-filter(7)
      return; // done
    }
    if (/^[0-9]+-[0-9]+$/.test(name)) { E("rangeNeedsPortrange", bi(`"${name}" looks like a range, but port takes one port; libpcap would look it up as a service name and fail. Write portrange ${name}.`, `"${name}" parece uma faixa, mas port recebe uma porta só; a libpcap procuraria como nome de serviço e falharia. Escreva portrange ${name}.`)); return; } // gencode.c
    x.meaning = bi(`True if the ${protoWords.en} ${dirW.en} port is the port of the service "${name}" in services(5) on the capturing machine, ${v4v6.en}. With a name, both the port number and its protocol are checked (only the number when the name is ambiguous).`, `Verdadeiro se a porta ${protoWords.pt} de ${dirW.pt} for a porta do serviço "${name}" no services(5) da máquina que captura, ${v4v6.pt}. Com nome, são verificados o número da porta e o protocolo dele (só o número quando o nome é ambíguo).`); // pcap-filter(7)
    N("resolvedAtCompile", bi(`This tool cannot know what "${name}" means on your machine: services(5) is read there, at compile time${P ? `, and a name that is not a ${pw} service is an error with ${pw}` : ""}.`, `Esta ferramenta não tem como saber o que "${name}" significa na sua máquina: o services(5) é lido lá, na compilação${P ? `, e um nome que não seja serviço ${pw} é erro com ${pw}` : ""}.`)); // platform
  }

  /** proto and protochain values. */
  private protoValue(q: Q, v: IdValue, vText: string, x: XNode, E: (c: string, t: Bi, s?: string) => void, N: (c: string, t: Bi, s?: string) => void, badProto: (w: Bi) => void): void {
    const P = q.p; // protocol qualifier
    const pw = q.proto?.text ?? ""; // as written
    const addr = q.addr!; // proto or protochain
    if (v.kind !== "num" && v.kind !== "name") { E("protoWithAddress", bi(`"${addr}" takes a protocol number or name, not an address.`, `"${addr}" recebe número ou nome de protocolo, não um endereço.`), SRC.grammar); return; } // grammar.y.in YYABORT
    const isNum = v.kind === "num"; // number or name
    const num = isNum ? v.toks[0].num! : null; // the number
    const name = isNum ? null : v.toks[0].id!; // the name
    if (addr === "protochain") {
      if (P !== null && P !== "ip" && P !== "ip6") { badProto(bi("protochain", "protochain")); return; } // gencode.c
      if (num !== null && num > 255) { E("protoTooBig", capText(bi("A protocol number", "Um número de protocolo"), 255, num, "protocol number", true)); return; } // gencode.c, 1.11.0 only
      x.meaning = bi(`True if the ${P === "ip" ? "IPv4" : P === "ip6" ? "IPv6" : "IPv4 or IPv6"} packet has a ${name ?? num} header anywhere in its header chain (extension headers are followed).`, `Verdadeiro se o pacote ${P === "ip" ? "IPv4" : P === "ip6" ? "IPv6" : "IPv4 ou IPv6"} tiver um header ${name ?? num} em qualquer ponto da cadeia de headers (os extension headers são percorridos).`); // pcap-filter(7)
      x.explicit = `${P ? pw : "(ip or ip6)"} protochain ${vText}`; // spelled out
      N("protochainCost", bi("The code protochain generates is complex, cannot be optimised and is not supported by kernel filter engines, so it runs slower and may drop more packets.", "O código que o protochain gera é complexo, não pode ser otimizado e não roda nos filter engines do kernel, então é mais lento e pode descartar mais pacotes.")); // pcap-filter(7)
      if (name) N("resolvedAtCompile", bi(`"${name}" is translated by getprotobyname(3) on the capturing machine (usually /etc/protocols).`, `"${name}" é traduzido pelo getprotobyname(3) na máquina que captura (em geral /etc/protocols).`)); // platform
      return; // done
    }
    // proto
    if (P !== null && !["ip", "ip6", "link", "iso", "isis"].includes(P)) { badProto(bi("proto", "proto")); return; } // gencode.c, gen_proto
    if (P === "link") { // EtherType
      if (num !== null && num > 0xffff) { E("etherTypeTooBig", capText(bi("An EtherType", "Um EtherType"), 65535, num, "EtherType", false)); return; } // gencode.c, 1.11.0 only
      if (num !== null && num > 255 && num <= 1500) { E("llcSapTooBig", capText(bi("On Ethernet a number up to 1500 is read as an 802.2 LLC DSAP, not as an EtherType, and an LLC DSAP", "Em Ethernet um número até 1500 é lido como DSAP LLC 802.2, não como EtherType, e um DSAP LLC"), 255, num, "LLC DSAP", true)); return; } // gencode.c, gen_ether_linktype (1.11.0 only)
      if (name !== null && !ETHER_PROTO_NAMES.has(name)) { E("unknownEtherName", bi(`"${name}" is not one of the names ${pw} proto takes (aarp, arp, atalk, decnet, ip, ip6, ipx, iso, lat, lldp, loopback, mopdl, moprc, netbeui, rarp, sca, slow, stp); use the EtherType number instead.`, `"${name}" não é um dos nomes que ${pw} proto aceita (aarp, arp, atalk, decnet, ip, ip6, ipx, iso, lat, lldp, loopback, mopdl, moprc, netbeui, rarp, sca, slow, stp); use o número do EtherType.`), SRC.filter); return; } // pcap-filter(7)
      x.meaning = num !== null && num <= 1500
        ? bi(`True if the packet's link-layer protocol is ${num} (${hex(num)}). As a number up to 1500 that is an 802.2 LLC DSAP on Ethernet, not an EtherType (see the note).`, `Verdadeiro se o protocolo de enlace do pacote for ${num} (${hex(num)}). Como número até 1500, isso é um DSAP LLC 802.2 em Ethernet, não um EtherType (veja a nota).`) // gencode.c
        : bi(`True if the packet's link-layer protocol (the EtherType on Ethernet, the LLC/SNAP protocol on FDDI, Token Ring and 802.11) is ${name ?? `${num} (${hex(num!)})`}.`, `Verdadeiro se o protocolo de enlace do pacote (o EtherType em Ethernet, o protocolo LLC/SNAP em FDDI, Token Ring e 802.11) for ${name ?? `${num} (${hex(num!)})`}.`); // pcap-filter(7), ether proto
      x.explicit = `${pw} proto ${vText}`; // as written
      if (num !== null && num <= 1500) N("llcSap", bi(`On Ethernet, libpcap reads a number up to 1500 as an 802.2 LLC DSAP, because a length/type field of 1500 or less is a length: this tests for an 802.2 frame whose DSAP is ${num} (${hex(num)}), not an EtherType.`, `Em Ethernet, a libpcap lê um número até 1500 como DSAP LLC 802.2, porque um campo length/type de 1500 ou menos é um tamanho: isto testa um frame 802.2 cujo DSAP é ${num} (${hex(num)}), não um EtherType.`), SRC.gencode); // gencode.c, gen_ether_linktype
      if (name === "lldp" || name === "slow") N("since1110", bi(`The ${name} name became available for ether proto in libpcap 1.11.0, the testing release; libpcap 1.10.7, the stable release, rejects it ("unknown ether proto"), as 1.10.4 did in our test. The EtherType number works in both.`, `O nome ${name} passou a valer em ether proto na libpcap 1.11.0, o release de teste; a libpcap 1.10.7, o release estável, recusa ("unknown ether proto"), como a 1.10.4 recusou no nosso teste. O número do EtherType funciona nas duas.`)); // BACKWARD COMPATIBILITY
      return; // done
    }
    if (P === "iso" || P === "isis") { // OSI
      if (P === "isis" && name !== null) { E("isisNumberOnly", bi("isis proto takes a number only.", "isis proto aceita só número."), SRC.filter); return; } // pcap-filter(7)
      if (P === "iso" && name !== null && !["clnp", "esis", "isis"].includes(name)) { E("unknownIsoName", bi(`iso proto takes a number or one of clnp, esis, isis; not "${name}".`, `iso proto aceita número ou clnp, esis, isis; não "${name}".`), SRC.filter); return; } // pcap-filter(7)
      if (num !== null && num > (P === "isis" ? 0x1f : 255)) { E("protoTooBig", P === "isis" ? capText(bi("An IS-IS PDU type", "Um tipo de PDU IS-IS"), 31, num, "IS-IS PDU type", false) : capText(bi("An OSI protocol number", "Um número de protocolo OSI"), 255, num, "ISO protocol", false)); return; } // gencode.c, 1.11.0 only
      x.meaning = P === "iso" ? bi(`True if the packet is an OSI packet of protocol ${name ?? num}.`, `Verdadeiro se o pacote for OSI do protocolo ${name ?? num}.`) : bi(`True if the packet is an IS-IS packet of PDU type ${num}.`, `Verdadeiro se o pacote for IS-IS do tipo de PDU ${num}.`); // pcap-filter(7)
      x.explicit = `${pw} proto ${vText}`; // as written
      return; // done
    }
    // ip, ip6 or both
    if (num !== null && num > 255) { E("protoTooBig", capText(bi("An IP protocol number", "Um número de protocolo IP"), 255, num, "protocol number", true)); return; } // gencode.c, 1.11.0 only (1.10.4 accepted it in our test)
    const which = P === "ip" ? bi("an IPv4 packet whose protocol field", "um pacote IPv4 cujo campo de protocolo") : P === "ip6" ? bi("an IPv6 packet whose Next Header (or, after a Fragment header, the Fragment header's Next Header)", "um pacote IPv6 cujo Next Header (ou, depois de um Fragment header, o Next Header do Fragment header)") : bi("an IPv4 packet whose protocol field, or an IPv6 packet whose Next Header (or the Fragment header's)", "um pacote IPv4 cujo campo de protocolo, ou um pacote IPv6 cujo Next Header (ou o do Fragment header)"); // pcap-filter(7)
    x.meaning = bi(`True if this is ${which.en} is ${name ?? num}. The header chain is not followed (protochain does that).`, `Verdadeiro se for ${which.pt} for ${name ?? num}. A cadeia de headers não é percorrida (o protochain faz isso).`); // pcap-filter(7)
    x.explicit = `${P ? pw : "(ip or ip6)"} proto ${vText}`; // spelled out
    if (name) {
      N("resolvedAtCompile", bi(`"${name}" is translated by getprotobyname(3) on the capturing machine (usually /etc/protocols); a name it does not know makes the filter invalid.`, `"${name}" é traduzido pelo getprotobyname(3) na máquina que captura (em geral /etc/protocols); um nome desconhecido torna o filtro inválido.`)); // pcap-filter(7)
      if (v.toks[0].escaped) N("escapedKeyword", bi(`The backslash makes the keyword "${name}" a name here, as pcap-filter(7) requires for protocol names that are also keywords.`, `A barra invertida transforma a palavra-chave "${name}" em nome aqui, como o pcap-filter(7) exige para nomes de protocolo que também são palavras-chave.`)); // pcap-filter(7)
    }
  }

  /** Hints for a name that looks like something else. */
  private nameHints(name: string, N: (c: string, t: Bi, s?: string) => void): void {
    const lower = name.toLowerCase(); // case-folded
    if (lower !== name && KEYWORD_SET.has(lower)) N("upperKeyword", bi(`"${name}" is read as a host NAME: keywords are lowercase (${lower}).`, `"${name}" é lido como NOME de host: as palavras-chave são minúsculas (${lower}).`), SRC.scanner); // case-sensitive scanner
    const dash = name.indexOf("-"); // a hyphen inside the name
    if (dash > 0 && (KEYWORD_SET.has(name.slice(0, dash)) || /^[0-9]+$/.test(name.slice(dash + 1)))) N("dashInName", bi(`"${name}" is one name: a name may contain hyphens, so ${name.slice(0, dash)} - ${name.slice(dash + 1)} needs spaces around the minus to be arithmetic.`, `"${name}" é um nome só: nomes podem ter hífen, então ${name.slice(0, dash)} - ${name.slice(dash + 1)} precisa de espaços em volta do menos para virar aritmética.`), SRC.scanner); // scanner ID rule
  }

  // ---- bare protocol keywords ----------------------------------------------------------------------------------
  /** An abbreviation such as tcp, ip, arp, icmp. */
  private abbrev(n: Extract<FNode, { k: "abbrev" }>, base: Omit<XNode, "label" | "meaning">): { x: XNode; q: null; canon: string } {
    const w = n.tok.text; // as written
    const p = protoName(n.tok); // canonical
    const x: XNode = { ...base, label: w, meaning: bi("", "") }; // filled below
    const E = (code: string, t: Bi, s: string = SRC.gencode) => this.err(x.errors, n.start, n.end, note(code, t, s)); // an error
    const ipnum = IP_PROTO[p]; // IANA number, if any
    if (["tcp", "udp", "sctp", "ah", "esp", "pim"].includes(p)) { // IPv4 or IPv6
      x.meaning = bi(`True if the packet is IPv4 or IPv6 with protocol ${p.toUpperCase()} (IP protocol ${ipnum}). The header chain is not followed.`, `Verdadeiro se o pacote for IPv4 ou IPv6 com protocolo ${p.toUpperCase()} (protocolo IP ${ipnum}). A cadeia de headers não é percorrida.`); // pcap-filter(7)
      x.explicit = `(ip or ip6) proto \\${w}`; // the page's own expansion
    } else if (["icmp", "igmp", "vrrp", "carp"].includes(p)) { // IPv4 only
      x.meaning = bi(`True if the packet is IPv4 with protocol ${ipnum} (${p.toUpperCase()}). IPv6 packets never match.`, `Verdadeiro se o pacote for IPv4 com protocolo ${ipnum} (${p.toUpperCase()}). Pacotes IPv6 nunca batem.`); // pcap-filter(7)
      x.explicit = `ip proto ${ipnum}`; // pcap-filter(7)
      if (p === "icmp") x.notes.push(note("icmpV4Only", bi("icmp is ICMP for IPv4 only; ICMPv6 is icmp6 (ip6 proto 58).", "icmp é só ICMP de IPv4; ICMPv6 é icmp6 (ip6 proto 58)."), SRC.filter)); // pcap-filter(7)
    } else if (p === "igrp") {
      x.meaning = bi("True if the packet is IPv4 with the IGRP protocol number, which libpcap takes as 88 on DragonFly BSD, FreeBSD, macOS, MidnightBSD and QNX, and 9 elsewhere.", "Verdadeiro se o pacote for IPv4 com o número de protocolo do IGRP, que a libpcap considera 88 no DragonFly BSD, FreeBSD, macOS, MidnightBSD e QNX, e 9 nos demais."); // pcap-filter(7)
      x.explicit = "ip proto igrpval"; // the page's notation
      x.notes.push(note("osDependent", bi("pcap-filter(7) says igrp should not be used in portable filters and may be removed.", "O pcap-filter(7) diz que igrp não deve ser usado em filtros portáveis e pode ser removido."), SRC.filter)); // pcap-filter(7)
    } else if (p === "icmp6") {
      x.meaning = bi("True if the packet is IPv6 with protocol 58 (ICMPv6), in the Next Header or after a Fragment header.", "Verdadeiro se o pacote for IPv6 com protocolo 58 (ICMPv6), no Next Header ou depois de um Fragment header."); // pcap-filter(7)
      x.explicit = "ip6 proto 58"; // pcap-filter(7)
    } else if (["ip", "ip6", "arp", "rarp", "atalk", "aarp", "decnet", "sca", "lat", "mopdl", "moprc"].includes(p)) { // link-layer protocol
      x.meaning = bi(`True if the packet's link-layer protocol is ${w} (the EtherType on Ethernet; LLC/SNAP on FDDI, Token Ring and 802.11).`, `Verdadeiro se o protocolo de enlace do pacote for ${w} (o EtherType em Ethernet; LLC/SNAP em FDDI, Token Ring e 802.11).`); // pcap-filter(7)
      x.explicit = `ether proto \\${w}`; // pcap-filter(7)
    } else if (["iso", "stp", "ipx", "netbeui"].includes(p)) { // LLC based
      x.meaning = bi(`True if the packet carries ${w}, identified through the 802.2 LLC header (and, for ipx, its other encapsulations).`, `Verdadeiro se o pacote levar ${w}, identificado pelo header LLC 802.2 (e, no caso de ipx, pelas outras encapsulações).`); // pcap-filter(7)
      x.explicit = `ether proto \\${w}`; // pcap-filter(7)
    } else if (["esis", "isis", "clnp"].includes(p)) { // OSI
      x.meaning = bi(`True if the packet is an OSI packet of protocol ${p}.`, `Verdadeiro se o pacote for OSI do protocolo ${p}.`); // pcap-filter(7)
      x.explicit = `iso proto \\${p}`; // pcap-filter(7)
    } else if (["l1", "l2", "iih", "lsp", "snp", "csnp", "psnp"].includes(p)) { // IS-IS PDU groups
      x.meaning = bi(`True for the IS-IS PDU types grouped as ${w}.`, `Verdadeiro para os tipos de PDU IS-IS agrupados como ${w}.`); // pcap-filter(7)
    } else { // link, ether, radio...: not abbreviations
      x.meaning = bi(`"${w}" is a protocol qualifier, not a primitive on its own.`, `"${w}" é um qualificador de protocolo, não um primitivo sozinho.`); // the meaning
      E("notAbbreviation", bi(`"${w}" cannot be used alone; it must qualify something, for example ${w === "radio" ? "radio[0] = 0" : `${w} host aa:bb:cc:dd:ee:ff or ${w} proto 0x88cc`}.`, `"${w}" não pode ficar sozinho; precisa qualificar algo, por exemplo ${w === "radio" ? "radio[0] = 0" : `${w} host aa:bb:cc:dd:ee:ff ou ${w} proto 0x88cc`}.`)); // gencode.c, the K/abbr column
    }
    this.encapNote(x); // offsets
    return { x, q: null, canon: w }; // nothing to inherit afterwards
  }

  // ---- relations ----------------------------------------------------------------------------------------------
  /** arith relop arith */
  private rel(n: Extract<FNode, { k: "rel" }>, base: Omit<XNode, "label" | "meaning">): { x: XNode; q: null; canon: string } {
    const L = this.arith(n.l); // left
    const R = this.arith(n.r); // right
    const opWords: Record<string, Bi> = { ">": bi("is greater than", "é maior que"), GEQ: bi("is greater than or equal to", "é maior ou igual a"), "=": bi("equals", "é igual a"), LEQ: bi("is less than or equal to", "é menor ou igual a"), "<": bi("is less than", "é menor que"), NEQ: bi("is not equal to", "é diferente de") }; // relop
    const ow = opWords[n.op.t]; // the operator in words
    const x: XNode = { ...base, label: n.op.text, left: L, right: R, meaning: bi(`True when (${L.text}) ${ow.en} (${R.text}), comparing 32-bit unsigned values.`, `Verdadeiro quando (${L.text}) ${ow.pt} (${R.text}), comparando valores de 32 bits sem sinal.`) }; // generic meaning
    for (const a of [L, R]) for (const e of collectErrors(a)) this.err(x.errors, e.start, e.end, e.note); // arithmetic errors
    this.flagReading(n, x); // the TCP flags and ICMP type readings
    if (n.op.text === "=") x.notes.push(note("singleEquals", bi("A single = means the same as ==.", "Um = sozinho significa o mesmo que ==."), SRC.filter)); // pcap-filter(7)
    this.encapNote(x); // offsets
    return { x, q: null, canon: `${arithCanon(n.l)} ${n.op.text} ${arithCanon(n.r)}` }; // relations pass no qualifiers on
  }

  /** Read TCP flag tests and ICMP type tests in plain words. */
  private flagReading(n: Extract<FNode, { k: "rel" }>, x: XNode): void {
    const l = unparen(n.l); // left side
    const rv = constValue(n.r); // the constant compared with
    if (rv === null) return; // only constant comparisons are read
    const isFlagsLoad = (a: Arith) => a.k === "load" && protoName(a.proto) === "tcp" && constValue(a.offset) === 13 && (a.size === null || a.size.num === 1); // tcp[13] / tcp[tcpflags]
    let mask: number | null = null; // the mask, if any
    let load: Arith | null = null; // the load
    if (isFlagsLoad(l)) { load = l; mask = null; } // tcp[13] relop v
    else if (l.k === "bin" && l.op.t === "&") { // tcp[13] & m relop v
      const a = unparen(l.l); // left of &
      const b = unparen(l.r); // right of &
      if (isFlagsLoad(a) && constValue(b) !== null) { load = a; mask = constValue(b); } // load & mask
      else if (isFlagsLoad(b) && constValue(a) !== null) { load = b; mask = constValue(a); } // mask & load
    }
    if (load && (n.op.t === "=" || n.op.t === "NEQ")) { // the flag idioms
      const eq = n.op.t === "="; // == or !=
      if (mask === null) { // the whole byte
        const set = flagNames(rv); // set flags
        const clear = TCP_FLAG_BITS.map((f) => f.name).filter((f) => !set.includes(f)); // the others
        x.meaning = eq ? bi(`True when the TCP flags byte (octet 13) is exactly ${rv}: ${set.length ? joinWords(set, "en") + " set" : "no flag set"} and ${joinWords(clear, "en")} all clear.`, `Verdadeiro quando o byte de flags TCP (octeto 13) vale exatamente ${rv}: ${set.length ? joinWords(set, "pt") + " ligado(s)" : "nenhuma flag ligada"} e ${joinWords(clear, "pt")} todos desligados.`) : bi(`True when the TCP flags byte (octet 13) is anything but ${rv} (${set.length ? joinWords(set, "en") + " alone" : "no flag"}).`, `Verdadeiro quando o byte de flags TCP (octeto 13) vale qualquer coisa menos ${rv} (${set.length ? joinWords(set, "pt") + " sozinho(s)" : "nenhuma flag"}).`); // tcpdump(1)
      } else { // masked
        const m = joinWords(flagNames(mask), "en"); // mask flags, English
        const mp = joinWords(flagNames(mask), "pt"); // mask flags, Portuguese
        const single = flagNames(mask).length === 1; // one flag in the mask
        if (rv === 0 && single) x.meaning = eq ? bi(`True when ${m} is clear (the other flags do not matter).`, `Verdadeiro quando ${mp} está desligada (as outras flags não importam).`) : bi(`True when ${m} is set (the other flags do not matter).`, `Verdadeiro quando ${mp} está ligada (as outras flags não importam).`); // tcpdump(1)
        else if (rv === 0) x.meaning = eq ? bi(`True when none of ${m} is set.`, `Verdadeiro quando nenhuma de ${mp} está ligada.`) : bi(`True when at least one of ${m} is set (the other flags do not matter).`, `Verdadeiro quando pelo menos uma de ${mp} está ligada (as outras flags não importam).`); // tcpdump(1)
        else if (rv === mask) x.meaning = eq ? bi(`True when ${flagNames(mask).length > 1 ? "all of " : ""}${m} ${flagNames(mask).length > 1 ? "are" : "is"} set (the other flags do not matter).`, `Verdadeiro quando ${flagNames(mask).length > 1 ? "todas entre " : ""}${mp} ${flagNames(mask).length > 1 ? "estão ligadas" : "está ligada"} (as outras flags não importam).`) : bi(`True unless ${flagNames(mask).length > 1 ? "all of " : ""}${m} ${flagNames(mask).length > 1 ? "are" : "is"} set.`, `Verdadeiro a não ser que ${flagNames(mask).length > 1 ? "todas entre " : ""}${mp} ${flagNames(mask).length > 1 ? "estejam ligadas" : "esteja ligada"}.`); // pcap-filter(7) example
        else if ((rv & ~mask) === 0) { // a subset
          const on = flagNames(rv); // must be set
          const off = flagNames(mask & ~rv); // must be clear
          x.meaning = eq ? bi(`True when, among ${m}, only ${joinWords(on, "en")} ${on.length > 1 ? "are" : "is"} set: ${joinWords(on, "en")} set and ${joinWords(off, "en")} clear (the other flags do not matter).`, `Verdadeiro quando, entre ${mp}, só ${joinWords(on, "pt")} ${on.length > 1 ? "estão ligadas" : "está ligada"}: ${joinWords(on, "pt")} ${on.length > 1 ? "ligadas" : "ligada"} e ${joinWords(off, "pt")} ${off.length > 1 ? "desligadas" : "desligada"} (as outras flags não importam).`) : bi(`True unless, among ${m}, exactly ${joinWords(on, "en")} ${on.length > 1 ? "are" : "is"} set.`, `Verdadeiro a não ser que, entre ${mp}, exatamente ${joinWords(on, "pt")} ${on.length > 1 ? "estejam ligadas" : "esteja ligada"}.`); // the SYN-without-ACK idiom
        } else x.notes.push(note("impossibleFlags", bi(`The value ${rv} has bits outside the mask ${mask}, so (flags & ${mask}) can never equal it: this test is ${eq ? "never" : "always"} true.`, `O valor ${rv} tem bits fora da máscara ${mask}, então (flags & ${mask}) nunca vale isso: o teste é ${eq ? "sempre falso" : "sempre verdadeiro"}.`), SRC.filter)); // arithmetic
      }
      x.notes.push(note("tcpFlagsByte", bi("Octet 13 of the TCP header holds CWR, ECE, URG, ACK, PSH, RST, SYN and FIN (bits 7 to 0, values 128 down to 1); tcp[tcpflags] is the same byte, and tcp-syn, tcp-ack and the other names are those bit values. The AE flag is in octet 12, not in this byte.", "O octeto 13 do header TCP guarda CWR, ECE, URG, ACK, PSH, RST, SYN e FIN (bits 7 a 0, valores de 128 a 1); tcp[tcpflags] é o mesmo byte, e tcp-syn, tcp-ack e os demais nomes são esses valores de bit. A flag AE fica no octeto 12, não neste byte."), SRC.tcpdump)); // tcpdump(1), TCP header diagram
      return; // done
    }
    // ICMP / ICMPv6 type tests
    if (l.k === "load" && (protoName(l.proto) === "icmp" || protoName(l.proto) === "icmp6") && constValue(l.offset) === 0 && (l.size === null || l.size.num === 1)) {
      const v6 = protoName(l.proto) === "icmp6"; // which ICMP
      const nm = (v6 ? ICMP6_TYPE_NAMES : ICMP_TYPE_NAMES)[rv]; // the type name
      if (nm) x.notes.push(note("icmpType", bi(`${v6 ? "ICMPv6" : "ICMP"} type ${rv} is ${nm}.`, `O tipo ${v6 ? "ICMPv6" : "ICMP"} ${rv} é ${nm}.`), SRC.scanner)); // scanner.l named values
    }
  }

  /** Explain an arithmetic expression. */
  private arith(a: Arith): XArith {
    const text = this.text(a.start, a.end); // source text
    const value = constValue(a); // constant value
    const base = { kind: a.k, text, start: a.start, end: a.end, value, notes: [] as Note[], errors: [] as Note[], children: [] as XArith[] }; // shared
    switch (a.k) {
      case "num": {
        const t = a.tok; // the token
        if (t.named) { // a named offset or value
          const offsets: Record<string, Bi> = { tcpflags: bi("the offset of the TCP flags byte (octet 13)", "o offset do byte de flags TCP (octeto 13)"), icmptype: bi("the offset of the ICMP type field", "o offset do campo de tipo ICMP"), icmpcode: bi("the offset of the ICMP code field", "o offset do campo de código ICMP"), icmp6type: bi("the offset of the ICMPv6 type field", "o offset do campo de tipo ICMPv6"), icmp6code: bi("the offset of the ICMPv6 code field", "o offset do campo de código ICMPv6") }; // named offsets
          const off = offsets[t.named]; // an offset?
          const flag = TCP_FLAG_BITS.find((f) => f.named === t.named); // a flag?
          const meaning = off ? bi(`${t.named} = ${t.num}: ${off.en}.`, `${t.named} = ${t.num}: ${off.pt}.`) : flag ? bi(`${t.named} = ${t.num} (${hex(t.num!)}): the ${flag.name} bit of the TCP flags byte.`, `${t.named} = ${t.num} (${hex(t.num!)}): o bit ${flag.name} do byte de flags TCP.`) : bi(`${t.named} = ${t.num}: that ${t.named.startsWith("icmp6") ? "ICMPv6" : "ICMP"} type value.`, `${t.named} = ${t.num}: esse valor de tipo ${t.named.startsWith("icmp6") ? "ICMPv6" : "ICMP"}.`); // the meaning
          const r: XArith = { ...base, meaning }; // node
          if (t.named === "tcp-ece" || t.named === "tcp-cwr") r.notes.push(note("since190", bi("tcp-ece and tcp-cwr became available in libpcap 1.9.0.", "tcp-ece e tcp-cwr passaram a existir na libpcap 1.9.0."), SRC.filter)); // BACKWARD COMPATIBILITY
          if (t.named.startsWith("icmp6")) r.notes.push(note("since190", bi("The ICMPv6 type names became available in libpcap 1.9.0.", "Os nomes de tipo ICMPv6 passaram a existir na libpcap 1.9.0."), SRC.filter)); // BACKWARD COMPATIBILITY
          return r; // done
        }
        const r: XArith = { ...base, meaning: t.radix === "dec" ? bi(`The constant ${t.num}.`, `A constante ${t.num}.`) : bi(`The constant ${t.text}, ${t.radix === "hex" ? "hexadecimal" : "octal (it starts with 0)"}: ${t.num}.`, `A constante ${t.text}, ${t.radix === "hex" ? "hexadecimal" : "octal (começa com 0)"}: ${t.num}.`) }; // a constant
        return r; // done
      }
      case "len": return { ...base, meaning: bi("The length of the packet.", "O tamanho do pacote.") }; // pcap-filter(7)
      case "paren": { const e = this.arith(a.e); return { ...base, meaning: e.meaning, children: [e], errors: [] }; } // ( arith )
      case "neg": { const e = this.arith(a.e); return { ...base, meaning: bi(`Minus (${e.text}): computed as 0 - (${e.text}) in 32 bits, so -1 is 0xffffffff.`, `Menos (${e.text}): calculado como 0 - (${e.text}) em 32 bits, então -1 é 0xffffffff.`), children: [e] }; } // pcap-filter(7)
      case "bin": {
        const l = this.arith(a.l); // left
        const r = this.arith(a.r); // right
        const ops: Record<string, Bi> = { "+": bi("plus", "mais"), "-": bi("minus", "menos"), "*": bi("times", "vezes"), "/": bi("divided by", "dividido por"), "%": bi("modulo", "módulo"), "&": bi("bitwise AND", "AND bit a bit"), "|": bi("bitwise OR", "OR bit a bit"), "^": bi("bitwise XOR", "XOR bit a bit"), LSH: bi("shifted left by", "deslocado à esquerda por"), RSH: bi("shifted right by", "deslocado à direita por") }; // operators
        const o = ops[a.op.t]; // in words
        const x: XArith = { ...base, meaning: bi(`(${l.text}) ${o.en} (${r.text})${value !== null ? ` = ${value}` : ""}.`, `(${l.text}) ${o.pt} (${r.text})${value !== null ? ` = ${value}` : ""}.`), children: [l, r] }; // node
        if (a.op.t === "%" || a.op.t === "^") { // the two operators with no declared precedence
          x.notes.push(note("modXorKernel", bi(`${a.op.text} is filtered in the kernel only on some systems (FreeBSD 12.0 and later, Linux 3.7 and later, NetBSD 8.0 and later, OpenBSD 7.9 and later, Windows with Npcap 1.81 and later); elsewhere libpcap filters in user mode, which costs more and may drop packets. Available since libpcap 1.6.2.`, `${a.op.text} é filtrado no kernel só em alguns sistemas (FreeBSD 12.0 em diante, Linux 3.7 em diante, NetBSD 8.0 em diante, OpenBSD 7.9 em diante, Windows com Npcap 1.81 em diante); nos outros a libpcap filtra em user mode, o que custa mais e pode descartar pacotes. Existe desde a libpcap 1.6.2.`), SRC.filterDev)); // the development page's list of systems (the 1.11.0 and 1.10.7 pages give an older one); 1.6.2 from BACKWARD COMPATIBILITY
          if ([a.l, a.r].some((c) => c.k === "bin")) this.modXorMixed(); // grouped with another operator without parentheses
        }
        if ([a.l, a.r].some((c) => c.k === "bin" && (c.op.t === "%" || c.op.t === "^"))) this.modXorMixed(); // a % or ^ directly under another operator
        if (a.op.t === "/" || a.op.t === "%" || a.op.t === "LSH" || a.op.t === "RSH") this.operandCheck(a, x); // what libpcap refuses on the right-hand side
        return x; // done
      }
      case "load": {
        const p = protoName(a.proto); // the protocol
        const off = this.arith(a.offset); // the offset
        const size = a.size ? a.size.num! : 1; // the size
        const named = a.offset.k === "num" && a.offset.tok.named ? ` (${a.offset.tok.num})` : ""; // a named offset: its value
        const layer = p === "link" ? bi(`the link-layer header (${a.proto.text})`, `header de enlace (${a.proto.text})`) : p === "radio" ? bi("the 802.11 radio header", "radio header 802.11") : bi(`the ${a.proto.text} header`, `header ${a.proto.text}`); // the layer
        const x: XArith = { ...base, meaning: bi(`The ${size}-byte field at offset ${off.text}${named} from the start of ${layer.en}${size > 1 ? ", read in network byte order" : ""}.`, `O campo de ${size} ${size > 1 ? "bytes" : "byte"} no offset ${off.text}${named} a partir do início do ${layer.pt}${size > 1 ? ", lido em network byte order" : ""}.`), children: [off] }; // node
        if (a.size && ![1, 2, 4].includes(a.size.num!)) x.errors.push(note("sizeNot124", bi(`The size after the colon must be 1, 2 or 4; ${a.size.num} is refused.`, `O tamanho depois dos dois-pontos tem que ser 1, 2 ou 4; ${a.size.num} é recusado.`), SRC.gencode)); // gencode.c
        if (!PDA_PROTOS.has(p)) x.errors.push(note("noIndex", bi(`${a.proto.text} cannot be indexed with [ ]; the accessors are arp, atalk, carp, decnet, ether, fddi, icmp, icmp6, igmp, igrp, ip, ip6, lat, link, mopdl, moprc, pim, ppp, radio, rarp, sca, sctp, slip, tcp, tr, udp, vrrp and wlan.`, `${a.proto.text} não pode ser indexado com [ ]; os accessors são arp, atalk, carp, decnet, ether, fddi, icmp, icmp6, igmp, igrp, ip, ip6, lat, link, mopdl, moprc, pim, ppp, radio, rarp, sca, sctp, slip, tcp, tr, udp, vrrp e wlan.`), SRC.filter)); // pcap-filter(7)
        if (IPV4_ONLY_PDA.has(p)) x.notes.push(note("pdaIpv4Only", bi(`${a.proto.text}[ ] looks only at IPv4 packets, and only at an unfragmented packet or the first fragment, so it never matches IPv6; ${a.proto.text}[0] is always the first byte of the ${a.proto.text} header.`, `${a.proto.text}[ ] só olha pacotes IPv4, e só pacote não fragmentado ou o primeiro fragmento, então nunca bate com IPv6; ${a.proto.text}[0] é sempre o primeiro byte do header ${a.proto.text}.`), SRC.filter)); // pcap-filter(7)
        if (p === "icmp6") x.notes.push(note("pdaIcmp6", bi("icmp6[ ] assumes the IPv6 packet has no extension headers (a Fragment header, for example).", "icmp6[ ] supõe que o pacote IPv6 não tem extension headers (um Fragment header, por exemplo)."), SRC.filter)); // pcap-filter(7)
        if (p === "radio") x.notes.push(note("pdaRadio", bi("radio[ ] works only on captures with an 802.11 radio header (radiotap, AVS, Prism).", "radio[ ] só funciona em capturas com radio header 802.11 (radiotap, AVS, Prism)."), SRC.gencode)); // gencode.c
        if (p === "igrp") x.notes.push(note("osDependent", bi("igrp[ ] uses an OS-specific protocol number and should not be used in portable filters.", "igrp[ ] usa um número de protocolo que depende do sistema e não deve ser usado em filtros portáveis."), SRC.filter)); // pcap-filter(7)
        return x; // done
      }
    }
  }

  /**
   * The right-hand side of /, %, << and >>. libpcap refuses a division or a modulus by zero and a shift by more than
   * 31 bits, three ways: gencode.c (1.10.7 and 1.11.0) looks at the FIRST number of the code generated for the
   * right-hand side, which catches a plain number but also anything whose code starts with one (len / tcp[0], where
   * the first number is the offset 0); the development code (1.11.1-PRE-GIT) looks only at a plain number; and the
   * optimizer, when it runs, folds a constant right-hand side and refuses it too (optimize.c). Checked against
   * tcpdump 4.99.4 with libpcap 1.10.4 in the build sandbox on 2026-10-27, with and without -O.
   * @param a the binary operation
   * @param x its explained node, which receives the error
   */
  private operandCheck(a: Extract<Arith, { k: "bin" }>, x: XArith): void {
    const shift = a.op.t === "LSH" || a.op.t === "RSH"; // a shift
    const bad = (k: number) => (shift ? k > 31 : k === 0); // what libpcap refuses
    const msg = shift ? "shift by more than 31 bits" : a.op.t === "/" ? "division by zero" : "modulus by zero"; // libpcap's own words
    const code = shift ? "shiftTooBig" : a.op.t === "/" ? "divByZero" : "modByZero"; // the stable code
    const rhs = unparen(a.r); // the right-hand side without parentheses
    const rText = this.text(a.r.start, a.r.end); // as written
    const lit = rhs.k === "num" ? rhs.tok.num ?? null : null; // a plain number
    const first = firstImm(a.r); // the first number of its code
    const val = constValue(a.r); // its value, when it is constant
    const what = shift ? bi("a shift by more than 31 bits", "um deslocamento de mais de 31 bits") : a.op.t === "/" ? bi("a division by zero", "uma divisão por zero") : bi("a modulus by zero", "um módulo por zero"); // in words
    if (lit !== null && bad(lit)) { // a plain number: refused everywhere, at code generation
      x.errors.push(note(code, bi(`${rText} makes this ${what.en}: libpcap refuses it ("${msg}") in every version, with the optimizer on or off.`, `${rText} torna isto ${what.pt}: a libpcap recusa ("${msg}") em qualquer versão, com o otimizador ligado ou desligado.`), SRC.gencode)); // gencode.c, gen_arth
      return; // one refusal
    }
    if (first !== null && bad(first)) { // the first-number check of 1.10.7 and 1.11.0
      const viaField = viaLoad(a.r); // the number is a packet field's offset
      const really = val !== null && bad(val); // the value is bad anyway
      const fix = shift ? bi(`by writing ${first} as 31 + ${first - 31}`, `escrevendo ${first} como 31 + ${first - 31}`) : bi("by writing 0 as 1 - 1", "escrevendo 0 como 1 - 1"); // a rewrite whose code starts with an accepted number
      x.errors.push(note("rightOperandFirstNumber", bi(
        `libpcap 1.10.7 and 1.11.0 refuse this with "${msg}": their check looks at the first number in the code generated for the right-hand side, ${rText}, and that number is ${first}${viaField ? ", the offset of the packet field" : ""}.${really ? ` The right-hand side does work out to ${val}, so this is ${what.en} in any case.` : ` The right-hand side itself is not necessarily ${shift ? "above 31" : "zero"}, and the development code (1.11.1-PRE-GIT), which checks only a plain number, accepts it. With a released libpcap, write it so that its code starts with another number, for example ${fix.en}.`}`,
        `A libpcap 1.10.7 e a 1.11.0 recusam isto com "${msg}": a verificação delas olha o primeiro número do código gerado para o lado direito, ${rText}, e esse número é ${first}${viaField ? ", o offset do campo do pacote" : ""}.${really ? ` E o lado direito de fato resulta em ${val}, então isto é ${what.pt} de qualquer forma.` : ` O lado direito em si não é necessariamente ${shift ? "maior que 31" : "zero"}, e o código de desenvolvimento (1.11.1-PRE-GIT), que só verifica um número puro, aceita. Com uma libpcap de release, escreva de modo que o código comece por outro número, por exemplo ${fix.pt}.`}`,
      ), SRC.gencode)); // gencode.c, gen_arth (1.10.7 and 1.11.0); fixed after 1.11.0
      return; // one refusal
    }
    if (val !== null && bad(val)) { // a constant that only the optimizer folds
      x.errors.push(note(`${code}Folded`, bi(`The right-hand side, ${rText}, works out to ${val}, which makes this ${what.en}: libpcap's optimizer folds the constant and refuses it ("${msg}"), in 1.10.7 and 1.11.0 alike. With -O the optimizer does not run, and libpcap compiles it.`, `O lado direito, ${rText}, resulta em ${val}, o que torna isto ${what.pt}: o otimizador da libpcap reduz a constante e recusa ("${msg}"), tanto na 1.10.7 quanto na 1.11.0. Com -O o otimizador não roda, e a libpcap compila.`), SRC.optimize)); // optimize.c, fold_op / opt_stmt
    }
  }

  /** Record the % / ^ precedence note (libpcap's grammar declares no precedence for them; Bison then shifts). */
  private modXorMixed(): void {
    this.global(note("modXorPrecedence", bi("% and ^ have no declared precedence in libpcap's grammar, so when they meet another operator without parentheses the parser's default (shift) decides: the operator on the right takes the rest of the expression. a % b * c is a % (b * c), and a + b % c + d is a + (b % (c + d)). Add parentheses.", "% e ^ não têm precedência declarada na gramática da libpcap, então quando encontram outro operador sem parênteses quem decide é o padrão do parser (shift): o operador da direita leva o resto da expressão. a % b * c é a % (b * c), e a + b % c + d é a + (b % (c + d)). Use parênteses."), SRC.bison)); // grammar + Bison
  }

  // ---- special primitives -----------------------------------------------------------------------------------------
  /** The primitives outside the qualifier pattern. */
  private special(n: Extract<FNode, { k: "special" }>, base: Omit<XNode, "label" | "meaning">, underOrNot: boolean): { x: XNode; q: null; canon: string } {
    const toks = n.toks; // its tokens
    const kwIdx = n.proto ? 1 : 0; // where the keyword is
    const arg = toks[kwIdx + 1]; // the first argument, if any
    const num = (t?: Token) => (t && t.t === "NUM" ? t.num! : null); // a token's number
    const x: XNode = { ...base, label: this.text(n.start, n.end), meaning: bi("", "") }; // filled below
    const E = (code: string, t: Bi, s: string = SRC.gencode) => this.err(x.errors, n.start, n.end, note(code, t, s)); // an error
    const N = (code: string, t: Bi, s: string = SRC.filter) => x.notes.push(note(code, t, s)); // a note
    const pw = n.proto?.text ?? null; // a protocol qualifier
    const pp = n.proto ? protoName(n.proto) : null; // canonical
    this.encapNote(x); // offsets shifted by an EARLIER encapsulation keyword
    const lastNum = (): number | null => { for (let i = toks.length - 1; i >= 0; i--) if (toks[i].t === "NUM") return toks[i].num!; return null; }; // the number of vlan (n)
    switch (n.kind) {
      case "broadcast": {
        if (pp === null || pp === "link") { x.meaning = bi("True if the link-layer destination is the broadcast address (FF:FF:FF:FF:FF:FF on Ethernet). The ether keyword is optional.", "Verdadeiro se o destino de enlace for o endereço de broadcast (FF:FF:FF:FF:FF:FF em Ethernet). A palavra ether é opcional."); x.explicit = "ether broadcast"; } // pcap-filter(7)
        else if (pp === "ip") { x.meaning = bi("True if the packet is IPv4 and the host part of its destination is all ones or all zeros, using the netmask libpcap was given. In tcpdump, without -f this means destination 0.0.0.0 or 255.255.255.255; with -f the capture interface's netmask is used.", "Verdadeiro se o pacote for IPv4 e a parte de host do destino for toda em uns ou toda em zeros, pela máscara passada à libpcap. No tcpdump, sem -f isso significa destino 0.0.0.0 ou 255.255.255.255; com -f vale a máscara da interface de captura."); N("ipBroadcastLoose", bi("pcap-filter(7) warns that ip broadcast ignores the network part of the destination and can match far more than expected; list the broadcast addresses explicitly when precision matters.", "O pcap-filter(7) avisa que ip broadcast ignora a parte de rede do destino e pode pegar muito mais que o esperado; liste os endereços de broadcast quando precisão importar.")); } // pcap-filter(7), tcpdump(1) -f
        else E("broadcastProto", bi(`broadcast takes ether (or no qualifier) or ip, not ${pw}.`, `broadcast aceita ether (ou nenhum qualificador) ou ip, não ${pw}.`)); // gencode.c
        break;
      }
      case "multicast": {
        if (pp === null || pp === "link") { x.meaning = bi("True if the link-layer destination is a multicast address (on Ethernet, ether[0] & 1 != 0). The ether keyword is optional.", "Verdadeiro se o destino de enlace for um endereço multicast (em Ethernet, ether[0] & 1 != 0). A palavra ether é opcional."); x.explicit = "ether[0] & 1 != 0"; } // pcap-filter(7)
        else if (pp === "ip") x.meaning = bi("True if the packet is an IPv4 multicast packet.", "Verdadeiro se o pacote for multicast IPv4."); // pcap-filter(7)
        else if (pp === "ip6") x.meaning = bi("True if the packet is an IPv6 multicast packet.", "Verdadeiro se o pacote for multicast IPv6."); // pcap-filter(7)
        else E("multicastProto", bi(`multicast takes ether, ip or ip6 (or no qualifier), not ${pw}.`, `multicast aceita ether, ip ou ip6 (ou nenhum qualificador), não ${pw}.`)); // gencode.c
        break;
      }
      case "less": x.meaning = bi(`True if the packet is at most ${num(arg)} bytes long.`, `Verdadeiro se o pacote tiver no máximo ${num(arg)} bytes.`); x.explicit = `len <= ${num(arg)}`; break; // pcap-filter(7)
      case "greater": x.meaning = bi(`True if the packet is at least ${num(arg)} bytes long.`, `Verdadeiro se o pacote tiver pelo menos ${num(arg)} bytes.`); x.explicit = `len >= ${num(arg)}`; break; // pcap-filter(7)
      case "byte": {
        const idx = num(toks[1]); // index
        const op = toks[2].text; // operator
        const val = num(toks[3])!; // value
        const what: Record<string, Bi> = { "=": bi("equals", "é igual a"), "<": bi("is less than", "é menor que"), ">": bi("is greater than", "é maior que"), "&": bi("ANDed with it is not zero", "com AND nele não dá zero"), "|": bi("ORed with it is not zero", "com OR nele não dá zero") }; // byte operators
        x.meaning = bi(`True if link-layer byte ${idx} ${what[op].en} ${val}.`, `Verdadeiro se o byte ${idx} do enlace ${what[op].pt} ${val}.`); // pcap-filter(7)
        N("byteDeprecated", bi("pcap-filter(7) says byte will be removed in a future release; use an arithmetic relation such as link[N] = V.", "O pcap-filter(7) diz que byte será removido numa versão futura; use uma relação aritmética como link[N] = V.")); // pcap-filter(7)
        if (val > 255) E("byteTooBig", capText(bi("The byte value", "O valor do byte"), 255, val, "byte argument", false)); // gencode.c, 1.11.0 only
        break;
      }
      case "inbound": case "outbound": x.meaning = n.kind === "inbound" ? bi("True if the packet was received by the capturing host.", "Verdadeiro se o pacote foi recebido pelo host que captura.") : bi("True if the packet was sent by the capturing host.", "Verdadeiro se o pacote foi enviado pelo host que captura."); N("linkTypeOnly", bi("Supported only on some link-layer types: DLT_SLIP, DLT_IPNET, DLT_LINUX_SLL, DLT_LINUX_SLL2, DLT_PFLOG, DLT_PPP_PPPD, some Juniper and Linux DSA types. The any pseudo-interface uses DLT_LINUX_SLL or SLL2 on Linux and DLT_IPNET on Solaris.", "Só funciona em alguns tipos de link layer: DLT_SLIP, DLT_IPNET, DLT_LINUX_SLL, DLT_LINUX_SLL2, DLT_PFLOG, DLT_PPP_PPPD, alguns tipos Juniper e Linux DSA. A pseudo-interface any usa DLT_LINUX_SLL ou SLL2 no Linux e DLT_IPNET no Solaris.")); break; // pcap-filter(7)
      case "ifindex": x.meaning = bi(`True if the packet was logged via interface index ${num(arg)} (Linux "any" captures in cooked v2 format only). Available since libpcap 1.10.0.`, `Verdadeiro se o pacote foi registrado pela interface de índice ${num(arg)} (só capturas "any" do Linux em cooked v2). Existe desde a libpcap 1.10.0.`); break; // pcap-filter(7)
      case "vlan": case "mpls": case "pppoes": case "geneve": case "vxlan": {
        const val = lastNum(); // the optional number
        const caps: Record<string, number> = { vlan: 0x0fff, mpls: 0xfffff, pppoes: 0xffff, geneve: 0xffffff, vxlan: 0xffffff }; // gencode.c
        if (val !== null && val > caps[n.kind]) E("encapTooBig", bi(`${n.kind} takes at most ${caps[n.kind]}; ${val} is too big.`, `${n.kind} aceita no máximo ${caps[n.kind]}; ${val} é demais.`)); // gencode.c
        const m: Record<string, Bi> = {
          vlan: val === null ? bi("True if the packet is an IEEE 802.1Q VLAN packet.", "Verdadeiro se o pacote for VLAN IEEE 802.1Q.") : bi(`True if the packet is an IEEE 802.1Q VLAN packet with VLAN ID ${val}.`, `Verdadeiro se o pacote for VLAN IEEE 802.1Q com VLAN ID ${val}.`), // pcap-filter(7)
          mpls: val === null ? bi("True if the packet is an MPLS packet.", "Verdadeiro se o pacote for MPLS.") : bi(`True if the packet is an MPLS packet with label ${val}.`, `Verdadeiro se o pacote for MPLS com label ${val}.`), // pcap-filter(7)
          pppoes: val === null ? bi("True if the packet is a PPPoE session packet (EtherType 0x8864).", "Verdadeiro se o pacote for de sessão PPPoE (EtherType 0x8864).") : bi(`True if the packet is a PPPoE session packet (EtherType 0x8864) with session ID ${val}.`, `Verdadeiro se o pacote for de sessão PPPoE (EtherType 0x8864) com session ID ${val}.`), // pcap-filter(7)
          geneve: val === null ? bi("True if the packet is a Geneve packet (UDP port 6081).", "Verdadeiro se o pacote for Geneve (porta UDP 6081).") : bi(`True if the packet is a Geneve packet (UDP port 6081) with VNI ${val}.`, `Verdadeiro se o pacote for Geneve (porta UDP 6081) com VNI ${val}.`), // pcap-filter(7)
          vxlan: val === null ? bi("True if the packet is a VXLAN packet (UDP port 4789).", "Verdadeiro se o pacote for VXLAN (porta UDP 4789).") : bi(`True if the packet is a VXLAN packet (UDP port 4789) with VNI ${val}.`, `Verdadeiro se o pacote for VXLAN (porta UDP 4789) com VNI ${val}.`), // pcap-filter(7)
        };
        x.meaning = m[n.kind]; // the meaning
        const effect: Record<string, Bi> = {
          vlan: bi("Everything after this keyword in the expression is decoded as if the packet were a VLAN packet: the first vlan shifts the offsets, and each further vlan adds 4 bytes (vlan 100 and vlan 200 is VLAN 200 inside VLAN 100). Primitives written BEFORE it are not shifted.", "Tudo o que vem depois desta palavra na expressão é decodificado como se o pacote fosse VLAN: o primeiro vlan desloca os offsets, e cada vlan seguinte soma 4 bytes (vlan 100 and vlan 200 é a VLAN 200 dentro da VLAN 100). Primitivos escritos ANTES dele não são deslocados."), // pcap-filter(7)
          mpls: bi("Everything after this keyword is decoded as an MPLS-encapsulated IP packet; each further mpls adds 4 bytes (mpls 100000 and mpls 1024 is inner label 1024 under outer label 100000).", "Tudo o que vem depois desta palavra é decodificado como pacote IP encapsulado em MPLS; cada mpls seguinte soma 4 bytes (mpls 100000 and mpls 1024 é o label interno 1024 sob o externo 100000)."), // pcap-filter(7)
          pppoes: bi("Everything after this keyword is decoded as the inside of a PPPoE session packet.", "Tudo o que vem depois desta palavra é decodificado como o conteúdo de um pacote de sessão PPPoE."), // pcap-filter(7)
          geneve: bi("Everything after this keyword is decoded as the inside of a Geneve packet (IPv4 directly in Geneve and IPv4 inside an Ethernet frame both match ip afterwards).", "Tudo o que vem depois desta palavra é decodificado como o conteúdo de um pacote Geneve (IPv4 direto no Geneve e IPv4 dentro de um frame Ethernet batem com ip depois)."), // pcap-filter(7)
          vxlan: bi("Everything after this keyword is decoded as the inside of a VXLAN packet.", "Tudo o que vem depois desta palavra é decodificado como o conteúdo de um pacote VXLAN."), // pcap-filter(7)
        };
        N("encapShift", effect[n.kind]); // the offsets warning
        if (n.kind === "geneve") N("since180", bi("geneve is available since libpcap 1.8.0.", "geneve existe desde a libpcap 1.8.0.")); // BACKWARD COMPATIBILITY
        if (n.kind === "vxlan") N("since1110", bi("vxlan arrived in libpcap 1.11.0, the testing release. libpcap 1.10.7, the stable release, does not know the word: its scanner reads it as a name, and the filter fails with a syntax error, as it did with 1.10.4 in our test.", "O vxlan chegou na libpcap 1.11.0, o release de teste. A libpcap 1.10.7, o release estável, não conhece a palavra: o scanner dela a lê como nome, e o filtro falha com erro de sintaxe, como falhou com a 1.10.4 no nosso teste.")); // BACKWARD COMPATIBILITY
        if (underOrNot) this.global(note("encapUnderOrNot", bi(`${n.kind} sits under "or" or "not", but its offset change still applies to everything written after it, including packets for which ${n.kind} was false. Put the ${n.kind} test first and keep the rest inside an "and".`, `${n.kind} está sob "or" ou "not", mas a mudança de offset vale para tudo o que vem escrito depois, inclusive pacotes para os quais ${n.kind} deu falso. Ponha o teste ${n.kind} primeiro e o resto dentro de um "and".`), SRC.filter)); // the pitfall
        this.encaps.push(n.kind); // shift everything after it
        break;
      }
      case "pppoed": x.meaning = bi("True if the packet is a PPPoE discovery packet (EtherType 0x8863).", "Verdadeiro se o pacote for de descoberta PPPoE (EtherType 0x8863)."); break; // pcap-filter(7)
      case "ifname": case "ruleset": case "rulenum": case "subrulenum": case "reason": case "action": {
        const what: Record<string, Bi> = { ifname: bi(`was logged as coming from interface ${arg?.text}`, `foi registrado como vindo da interface ${arg?.text}`), ruleset: bi(`matched the PF anchored ruleset ${arg?.text}`, `bateu com o ruleset ancorado ${arg?.text} do PF`), rulenum: bi(`matched PF rule number ${arg?.text}`, `bateu com a regra ${arg?.text} do PF`), subrulenum: bi(`matched rule ${arg?.text} of an anchored ruleset`, `bateu com a regra ${arg?.text} de um ruleset ancorado`), reason: bi(`was logged with PF reason ${arg?.text}`, `foi registrado com o motivo ${arg?.text} do PF`), action: bi(`was logged when PF took the action ${arg?.text}`, `foi registrado quando o PF tomou a ação ${arg?.text}`) }; // pf
        x.meaning = bi(`True, for pf log captures (DLT_PFLOG) only, if the packet ${what[n.kind].en}.`, `Verdadeiro, só em capturas de log do pf (DLT_PFLOG), se o pacote ${what[n.kind].pt}.`); // pcap-filter(7)
        if (n.kind === "reason" && arg?.t === "ID" && !PF_REASONS.has(arg.id!)) E("unknownPfReason", bi(`"${arg.text}" is not a PF reason code pcap-filter(7) lists.`, `"${arg.text}" não é um código de motivo do PF listado no pcap-filter(7).`), SRC.filter); // pcap-filter(7)
        if (n.kind === "action" && !PF_ACTIONS.has(arg?.id ?? "")) E("unknownPfAction", bi(`"${arg?.text}" is not a PF action pcap-filter(7) lists.`, `"${arg?.text}" não é uma ação do PF listada no pcap-filter(7).`), SRC.filter); // pcap-filter(7)
        if ((n.kind === "reason" || n.kind === "action")) N("osDependent", bi("Some codes and actions exist only on FreeBSD, NetBSD, OpenBSD or macOS; pcap-filter(7) marks which.", "Alguns códigos e ações só existem no FreeBSD, NetBSD, OpenBSD ou macOS; o pcap-filter(7) indica quais.")); // pcap-filter(7)
        break;
      }
      case "wlanType": case "wlanTypeSubtype": case "wlanSubtype": case "wlanDir": {
        // The grammar compares names without case (str2tok, strcasecmp) and checks numbers against the frame control
        // masks of ieee80211.h: type 0x0c, subtype 0xf0, direction 0x03 (the direction check only from 1.11.0).
        const kwPos = kwIdx; // the keyword index
        const val = toks[kwPos + 1]; // first argument
        const hx = (v: number) => `0x${v.toString(16).padStart(2, "0")}`; // as libpcap prints it
        const blockAck = (t: Token) => { const id = (t.id ?? "").toLowerCase(); if (t.t === "ID" && (id === "bar" || id === "ba")) N("since1110", bi(`The subtype names bar and ba (Block Ack Request and Block Ack) arrived in libpcap 1.11.0, the testing release; libpcap 1.10.7, the stable release, rejects them, as 1.10.4 did in our test. The numbers work in both: type ctl subtype 0x80 and type ctl subtype 0x90.`, `Os nomes de subtipo bar e ba (Block Ack Request e Block Ack) chegaram na libpcap 1.11.0, o release de teste; a libpcap 1.10.7, o release estável, recusa, como a 1.10.4 recusou no nosso teste. Os números funcionam nas duas: type ctl subtype 0x80 e type ctl subtype 0x90.`), SRC.grammar); }; // 1.11.0 names
        if (n.kind === "wlanDir") {
          if (val.t === "ID" && !WLAN_DIRS.has(val.id!.toLowerCase())) E("unknownWlanDir", bi(`"${val.text}" is not an 802.11 direction; use nods, tods, fromds, dstods or a number.`, `"${val.text}" não é uma direção 802.11; use nods, tods, fromds, dstods ou um número.`), SRC.filter); // pcap-filter(7)
          if (val.t === "NUM" && (val.num! & ~0x03) !== 0) E("badWlanDirValue", bi(`The direction is the two To DS / From DS bits, a number from 0 to 3; ${val.text} has other bits set. libpcap 1.11.0 refuses it ("invalid 802.11 direction value ${hx(val.num!).replace(/^0x0(?=.)/, "0x")}"); libpcap 1.10.7, the stable release, compiles it without a complaint, and the test can never be true.`, `A direção são os dois bits To DS / From DS, um número de 0 a 3; ${val.text} tem outros bits ligados. A libpcap 1.11.0 recusa ("invalid 802.11 direction value ${hx(val.num!).replace(/^0x0(?=.)/, "0x")}"); a libpcap 1.10.7, o release estável, compila sem reclamar, e o teste nunca pode ser verdadeiro.`), SRC.grammar); // grammar.y.in, 1.11.0 only
          x.meaning = bi(`True if the 802.11 frame direction (the To DS / From DS bits) is ${val.text}.`, `Verdadeiro se a direção do frame 802.11 (os bits To DS / From DS) for ${val.text}.`); // pcap-filter(7)
        } else if (n.kind === "wlanSubtype") {
          const ok = Object.values(WLAN_TYPES).some((l) => l.includes((val.id ?? "").toLowerCase())); // a known subtype
          if (!ok) E("unknownWlanSubtype", bi(`"${val.text}" is not an 802.11 subtype name.`, `"${val.text}" não é nome de subtipo 802.11.`), SRC.filter); // pcap-filter(7)
          else blockAck(val); // bar, ba
          x.meaning = bi(`True if the 802.11 frame subtype is ${val.text} (and the frame has the type that subtype belongs to).`, `Verdadeiro se o subtipo do frame 802.11 for ${val.text} (e o frame tiver o tipo a que esse subtipo pertence).`); // pcap-filter(7)
        } else {
          const typeByNum: Record<number, string> = { 0x00: "mgt", 0x04: "ctl", 0x08: "data" }; // the type values, already in place in the frame control byte (ieee80211.h)
          let typeName: string | null = val.t === "ID" ? val.id!.toLowerCase() : null; // mgt, ctl, data
          if (val.t === "ID" && !(typeName! in WLAN_TYPES)) E("unknownWlanType", bi(`"${val.text}" is not an 802.11 type; use mgt, ctl or data.`, `"${val.text}" não é um tipo 802.11; use mgt, ctl ou data.`), SRC.filter); // pcap-filter(7)
          if (val.t === "NUM") { // a number: the type bits in place (0x00, 0x04, 0x08 or 0x0c)
            if ((val.num! & ~0x0c) !== 0) E("badWlanTypeValue", bi(`An 802.11 type number is written as it sits in the frame control byte: 0x00 (mgt), 0x04 (ctl), 0x08 (data) or 0x0c; ${val.text} has other bits set, and libpcap refuses it ("invalid 802.11 type value ${hx(val.num!)}").`, `Um número de tipo 802.11 se escreve como fica no byte de frame control: 0x00 (mgt), 0x04 (ctl), 0x08 (data) ou 0x0c; ${val.text} tem outros bits ligados, e a libpcap recusa ("invalid 802.11 type value ${hx(val.num!)}").`), SRC.grammar); // grammar.y.in, both versions
            typeName = typeByNum[val.num!] ?? null; // its name, when it has one
          }
          const sub = n.kind === "wlanTypeSubtype" ? toks[kwPos + 3] : null; // the subtype
          if (sub && sub.t === "NUM" && (sub.num! & ~0xf0) !== 0) E("badWlanSubtypeValue", bi(`An 802.11 subtype number is written as it sits in the frame control byte, a multiple of 16 from 0x00 to 0xf0; ${sub.text} has other bits set, and libpcap refuses it ("invalid 802.11 subtype value ${hx(sub.num!)}").`, `Um número de subtipo 802.11 se escreve como fica no byte de frame control, um múltiplo de 16 de 0x00 a 0xf0; ${sub.text} tem outros bits ligados, e a libpcap recusa ("invalid 802.11 subtype value ${hx(sub.num!)}").`), SRC.grammar); // grammar.y.in, both versions
          if (sub && sub.t === "ID" && val.t === "NUM" && typeName === null && (val.num! & ~0x0c) === 0) E("unknownWlanType", bi(`Type ${val.text} has no subtype names; use a subtype number.`, `O tipo ${val.text} não tem nomes de subtipo; use um número de subtipo.`), SRC.grammar); // grammar.y.in, "unknown 802.11 type"
          if (sub && sub.t === "ID" && typeName && typeName in WLAN_TYPES) { if (!WLAN_TYPES[typeName].includes(sub.id!.toLowerCase())) E("unknownWlanSubtype", bi(`"${sub.text}" is not a subtype of ${typeName} frames.`, `"${sub.text}" não é subtipo de frames ${typeName}.`), SRC.filter); else blockAck(sub); } // pcap-filter(7)
          x.meaning = sub ? bi(`True if the 802.11 frame type is ${val.text}${val.t === "NUM" && typeName ? ` (${typeName})` : ""} and its subtype is ${sub.text}.`, `Verdadeiro se o tipo do frame 802.11 for ${val.text}${val.t === "NUM" && typeName ? ` (${typeName})` : ""} e o subtipo for ${sub.text}.`) : bi(`True if the 802.11 frame type is ${val.text}${val.t === "NUM" && typeName ? ` (${typeName})` : ""}.`, `Verdadeiro se o tipo do frame 802.11 for ${val.text}${val.t === "NUM" && typeName ? ` (${typeName})` : ""}.`); // pcap-filter(7)
        }
        N("wlanOnly", bi("Works only on IEEE 802.11 link layers; the wlan keyword is optional.", "Só funciona em link layers IEEE 802.11; a palavra wlan é opcional.")); // pcap-filter(7)
        break;
      }
      case "llc": x.meaning = bi("True if the packet has an 802.2 LLC header (Ethernet frames with a length field that are not raw NetWare, 802.11 data frames, Token Ring, FDDI, and LLC-encapsulated SunATM).", "Verdadeiro se o pacote tiver header LLC 802.2 (frames Ethernet com campo de tamanho que não sejam NetWare cru, frames de dados 802.11, Token Ring, FDDI e SunATM com LLC)."); break; // pcap-filter(7)
      case "llcType": {
        const tname = toks[1].t === "PF_RNR" ? "rnr" : toks[1].id ?? toks[1].text; // the type
        if (!LLC_TYPES.has(tname.toLowerCase())) E("unknownLlcType", bi(`"${toks[1].text}" is not an LLC type name.`, `"${toks[1].text}" não é nome de tipo LLC.`), SRC.filter); // pcap-filter(7)
        x.meaning = bi(`True if the packet has an 802.2 LLC header of type ${tname}.`, `Verdadeiro se o pacote tiver header LLC 802.2 do tipo ${tname}.`); // pcap-filter(7)
        break;
      }
      default: { // ATM and SS7
        const kw = toks[0].text; // the keyword
        if (n.kind.startsWith("field:")) {
          const field = n.kind.slice(6); // vpi, vci, sio, ...
          x.meaning = ["vpi", "vci"].includes(field) ? bi(`True if the packet is an ATM packet (SunATM on Solaris) and its ${field.toUpperCase()} satisfies the test.`, `Verdadeiro se o pacote for ATM (SunATM no Solaris) e o ${field.toUpperCase()} satisfizer o teste.`) : bi(`True if the SS7 ${field.toUpperCase()} field satisfies the test (MTP2/MTP3 captures only).`, `Verdadeiro se o campo SS7 ${field.toUpperCase()} satisfizer o teste (só capturas MTP2/MTP3).`); // pcap-filter(7)
        } else if (["fisu", "lssu", "lsu", "msu", "hfisu", "hlssu", "hmsu"].includes(kw)) {
          x.meaning = bi(`True if the packet is an SS7 MTP2 ${kw.replace(/^h/, "").toUpperCase()} signal unit${kw.startsWith("h") ? " on a high-speed link (extended sequence numbers, ITU-T Q.703 Annex A)" : ""}.`, `Verdadeiro se o pacote for uma signal unit SS7 MTP2 do tipo ${kw.replace(/^h/, "").toUpperCase()}${kw.startsWith("h") ? " num link de alta velocidade (números de sequência estendidos, ITU-T Q.703 Annex A)" : ""}.`); // pcap-filter(7)
        } else x.meaning = bi(`True if the packet is an ATM packet (SunATM on Solaris) of the ${kw} kind.`, `Verdadeiro se o pacote for ATM (SunATM no Solaris) do tipo ${kw}.`); // pcap-filter(7)
        N("linkTypeOnly", bi("Works only on its own link-layer type; on other captures libpcap refuses it.", "Só funciona no seu próprio tipo de link layer; em outras capturas a libpcap recusa."), SRC.gencode); // gencode.c
        break;
      }
    }
    return { x, q: null, canon: this.text(n.start, n.end).replace(/\s+/g, " ") }; // specials pass no qualifiers on
  }
}

/** A set of protocols a subtree of bare protocol keywords allows: IP protocol numbers, or link-layer protocols. */
type PSet = { cat: "ip" | "link"; ids: Set<string> } | null;
/** IP protocol numbers of the transport abbreviations (IANA; vrrp and carp share 112). */
const IPPROTO_ID: Readonly<Record<string, string>> = Object.freeze({ tcp: "6", udp: "17", sctp: "132", icmp: "1", igmp: "2", pim: "103", ah: "51", esp: "50", vrrp: "112", carp: "112", icmp6: "58" }); // by keyword
/** Link-layer protocols whose abbreviations test distinct EtherTypes (pcap-filter(7)). */
const LINK_ID: ReadonlySet<string> = new Set(["ip", "ip6", "arp", "rarp"]); // by keyword

/**
 * The protocols a subtree allows, when it is built only from bare protocol keywords of one kind joined by and/or
 * (anything else gives null, so the check stays conservative). An "and" of two disjoint sets can never be true and
 * gets a note; the caller turns an empty set at the root into libpcap's "expression rejects all packets".
 */
function protoSets(n: FNode, x: XNode): PSet {
  switch (n.k) {
    case "abbrev": { // a bare keyword
      const p = protoName(n.tok); // canonical name
      if (IPPROTO_ID[p]) return { cat: "ip", ids: new Set([IPPROTO_ID[p]]) }; // a transport protocol
      if (LINK_ID.has(p)) return { cat: "link", ids: new Set([p]) }; // a link-layer protocol
      return null; // anything else is not tracked
    }
    case "group": return protoSets(n.e, x.children[0]); // parentheses are transparent
    case "and": case "or": {
      const a = protoSets(n.l, x.children[0]); // left
      const b = protoSets(n.r, x.children[1]); // right
      if (!a || !b || a.cat !== b.cat) return null; // not comparable
      if (n.k === "or") return { cat: a.cat, ids: new Set([...a.ids, ...b.ids]) }; // either
      const inter = new Set([...a.ids].filter((i) => b.ids.has(i))); // both
      if (inter.size === 0) { // impossible
        const wrap = (k: string, t: string) => (k === "and" || k === "or" ? `(${t})` : t); // a compound side in parentheses, so the sentence reads unambiguously
        const lt = wrap(n.l.k, x.children[0].text); // left text
        const rt = wrap(n.r.k, x.children[1].text); // right text
        x.notes.push(note("neverTrue", bi(`This part can never be true: no packet is both ${lt} and ${rt}, because a packet carries one ${a.cat === "ip" ? "IP protocol" : "link-layer protocol"} at this layer.`, `Esta parte nunca é verdadeira: nenhum pacote é ${lt} e ${rt} ao mesmo tempo, porque um pacote leva um único ${a.cat === "ip" ? "protocolo IP" : "protocolo de enlace"} nessa camada.`), SRC.filter)); // the note
      }
      return { cat: a.cat, ids: inter }; // what both allow
    }
    default: return null; // primitives, relations, specials, not: not tracked
  }
}

/** Every keyword (for the uppercase hint). */
const KEYWORD_SET = new Set(Object.keys(KEYWORDS)); // its words

/** True when the last term of a node (following and/or to the right, and not inward) is a parenthesised expression. */
function endsWithGroup(n: FNode): boolean {
  if (n.k === "group") return !n.valuesOnly; // a term group (a value list passes its own qualifiers)
  if (n.k === "and" || n.k === "or") return endsWithGroup(n.r); // the right operand is the last term
  if (n.k === "not") return endsWithGroup(n.e); // not passes its term's qualifiers
  return false; // anything else
}

/** Strip parentheses from an arithmetic node. */
function unparen(a: Arith): Arith { return a.k === "paren" ? unparen(a.e) : a; } // innermost

/** The canonical text of an arithmetic node: nested binary operations parenthesised, so the grouping shows. */
export function arithCanon(a: Arith): string {
  switch (a.k) {
    case "num": return a.tok.text; // as written
    case "len": return a.tok.text; // len
    case "paren": return `(${arithCanon(a.e)})`; // kept
    case "neg": return `-${a.e.k === "bin" ? `(${arithCanon(a.e)})` : arithCanon(a.e)}`; // unary minus
    case "load": return `${a.proto.text}[${arithCanon(a.offset)}${a.size ? `:${a.size.text}` : ""}]`; // accessor
    case "bin": { const w = (c: Arith) => (c.k === "bin" || c.k === "neg" ? `(${arithCanon(c)})` : arithCanon(c)); return `${w(a.l)} ${a.op.text} ${w(a.r)}`; } // grouping made visible
  }
}

/** Every error in an arithmetic tree, with spans. */
function collectErrors(a: XArith): { start: number; end: number; note: Note }[] {
  return [...a.errors.map((e) => ({ start: a.start, end: a.end, note: e })), ...a.children.flatMap(collectErrors)]; // depth first
}

/**
 * Analyse a parsed expression.
 * @param tree the syntax tree
 * @param src the expression text
 */
export function analyse(tree: FNode, src: string): Analysis {
  return new Analyser(src).run(tree); // one analyser per expression
}
