// ============================================================================
// src/lib/tools/tcpdump-filter-explainer/parser.ts
// ----------------------------------------------------------------------------
// A hand-written parser for pcap filter expressions, producing a syntax tree.
//
// It follows the grammar of libpcap's filter compiler (grammar.y.in at tag
// libpcap-1.11.0, read 2026-10-27; master was identical that day, and the
// stable tag libpcap-1.10.7 has the same rules apart from vxlan, the 802.11
// subtype names bar and ba, and the 802.11 direction check) rule for rule, but it is our own
// recursive-descent code, not a port of the generated LALR parser:
//   * expr: term, then any number of "and"/"or" each followed by a term OR by a
//     bare value; and/or have EQUAL precedence and group left to right;
//   * term: "not" binds to the term right after it (it binds tighter than and/or);
//   * rterm: a head of qualifiers and a value ("tcp dst port 80"), a
//     parenthesised expression, a bare protocol keyword ("tcp"), a relation of
//     two arithmetic expressions ("tcp[13] & 2 != 0"), or a special primitive
//     ("vlan 100", "less 64", "ether broadcast", ...);
//   * a bare value after and/or ("host a and b") is parsed as a value without
//     qualifiers; the semantics pass gives it the qualifiers of the most recent
//     primitive, as the grammar's $<blk>0 passing does;
//   * inside "( ... )" in a value position only values may appear
//     ("host (a or b)"), and the first one may not itself be parenthesised,
//     exactly as the grammar's pid/qid rules allow;
//   * arithmetic: | lowest, then &, then << >>, then + -, then * /, unary minus
//     highest; % and ^ have NO declared precedence in the grammar, so the parser
//     generator's default applies (shift: Bison manual, 5.3.5 How Precedence
//     Works, read 2026-10-27). That default is reproduced here and flagged.
//
// Alternatives are tried in a fixed order and every rule result is memoised by
// (rule, position), so the parse is linear in the number of tokens (packrat):
// there is no exponential backtracking on nested parentheses. Nesting depth is
// capped. The farthest failure is kept, so a rejected expression is reported
// at the token where the grammar could not continue, with what was expected.
// ============================================================================

import type { Token } from "./lexer"; // the tokens

/** A direction qualifier, as pcap-filter(7) names them. */
export type Dir = "src" | "dst" | "src or dst" | "src and dst" | "addr1" | "addr2" | "addr3" | "addr4" | "ra" | "ta";
/** A type qualifier (the grammar's "address" qualifier). */
export type Addr = "host" | "net" | "port" | "portrange" | "proto" | "protochain" | "gateway";

/** The qualifiers written before a value. */
export interface Head {
  /** The protocol qualifier token (tcp, ip, ether, ...), or null. */
  proto: Token | null;
  /** The direction qualifier, or null. */
  dir: { value: Dir; start: number; end: number; text: string } | null;
  /** The type qualifier, or null. */
  addr: { value: Addr; start: number; end: number; text: string } | null;
  /** Offset of the head's first character. */
  start: number;
  /** Offset just past its last character. */
  end: number;
}

/** The kinds of value a primitive can carry. */
export type ValueKind = "name" | "num" | "ipv4" | "ipv4-cidr" | "ipv4-mask" | "ipv6" | "ipv6-cidr" | "mac" | "mac8";

/** A value (the "id" of pcap-filter(7)). */
export interface IdValue {
  /** What kind of value. */
  kind: ValueKind;
  /** The tokens that make it up (an address, "/", a length; or an address, "mask", a mask). */
  toks: Token[];
  /** Offset of its first character (an enclosing "(" of a parenthesised number included). */
  start: number;
  /** Offset just past it. */
  end: number;
}

/** An arithmetic expression (pcap-filter(7), ARITHMETIC EXPRESSIONS and PACKET DATA ACCESSORS). */
export type Arith =
  | { k: "num"; tok: Token; start: number; end: number } // an integer constant or a named value
  | { k: "len"; tok: Token; start: number; end: number } // len / length
  | { k: "load"; proto: Token; offset: Arith; size: Token | null; start: number; end: number } // proto[expr : size]
  | { k: "bin"; op: Token; l: Arith; r: Arith; start: number; end: number } // a binary operation
  | { k: "neg"; op: Token; e: Arith; start: number; end: number } // unary minus
  | { k: "paren"; e: Arith; start: number; end: number }; // ( arith )

/** A node of the Boolean tree. */
export type FNode =
  | { k: "and" | "or"; op: Token; l: FNode; r: FNode; start: number; end: number } // and / or
  | { k: "not"; op: Token; e: FNode; start: number; end: number } // not / !
  | { k: "group"; e: FNode; valuesOnly: boolean; start: number; end: number } // ( expr ), or ( values ) in a value position
  | { k: "prim"; head: Head | null; value: IdValue; start: number; end: number } // qualifiers and a value; head null = inherits
  | { k: "abbrev"; tok: Token; start: number; end: number } // a bare protocol keyword
  | { k: "rel"; op: Token; l: Arith; r: Arith; start: number; end: number } // arith relop arith
  | { k: "special"; kind: string; toks: Token[]; proto: Token | null; start: number; end: number }; // the other primitives

/** Why the parser stopped. */
export interface ParseError {
  /** "syntax" for a grammar rejection, "tooDeep" when nesting passed the cap. */
  code: "syntax" | "tooDeep";
  /** Token index where the grammar could not continue. */
  tokenIndex: number;
  /** Character offset of that token (the expression length at the end). */
  start: number;
  /** Character offset just past that token. */
  end: number;
  /** The text found there ("" at the end). */
  found: string;
  /** What the grammar would have accepted there (stable codes, worded in texts.ts). */
  expected: string[];
}

/** The parse: a tree for an accepted expression, an error otherwise; an empty expression has neither. */
export interface ParseResult {
  /** The Boolean tree, or null for an empty or rejected expression. */
  tree: FNode | null;
  /** The rejection, or null. */
  error: ParseError | null;
}

/** Deepest nesting of parentheses, "not" and unary minus accepted. */
export const MAX_DEPTH = 100; // real filters never come close

/** Protocol keywords (the grammar's pname). */
const PNAME = new Set([
  "LINK", "IP", "ARP", "RARP", "SCTP", "TCP", "UDP", "ICMP", "IGMP", "IGRP", "PIM", "VRRP", "CARP", "ATALK", "AARP",
  "DECNET", "LAT", "SCA", "MOPDL", "MOPRC", "IPV6", "ICMPV6", "AH", "ESP", "ISO", "ESIS", "ISIS", "L1", "L2", "IIH",
  "LSP", "SNP", "PSNP", "CSNP", "CLNP", "STP", "IPX", "NETBEUI", "RADIO",
]); // every pname alternative
/** Direction keywords that start a dqual. */
const DQUAL_START = new Set(["SRC", "DST", "ADDR1", "ADDR2", "ADDR3", "ADDR4", "RA", "TA"]); // dqual
/** Type keywords (aqual). */
const AQUAL = new Set(["HOST", "NET", "PORT", "PORTRANGE"]); // aqual
/** Binary arithmetic operators. */
const ARITH_OPS = new Set(["+", "-", "*", "/", "%", "&", "|", "^", "LSH", "RSH"]); // arth binary operators
/** Relational operators (relop and irelop together). */
export const REL_OPS = new Set([">", "GEQ", "=", "LEQ", "<", "NEQ"]); // relop | irelop
/** Precedence of the binary operators that have one (grammar.y.in %left lines); % and ^ have none. */
const PREC: Readonly<Record<string, number>> = Object.freeze({ "|": 1, "&": 2, LSH: 3, RSH: 3, "+": 4, "-": 4, "*": 5, "/": 5, NEG: 6 });
/** Keywords of the "other" primitives. */
const OTHER_START = new Set([
  "TK_BROADCAST", "TK_MULTICAST", "LESS", "GREATER", "CBYTE", "INBOUND", "OUTBOUND", "IFINDEX", "VLAN", "MPLS",
  "PPPOED", "PPPOES", "GENEVE", "VXLAN", "PF_IFNAME", "PF_RSET", "PF_RNR", "PF_SRNR", "PF_REASON", "PF_ACTION",
  "TYPE", "SUBTYPE", "DIR", "LLC",
]); // other, pfvar, p80211, pllc
/** ATM keywords that are primitives on their own. */
const ATM_TYPES = new Set(["LANE", "METAC", "BCC", "OAMF4EC", "OAMF4SC", "SC", "ILMIC", "OAM", "OAMF4", "CONNECTMSG", "METACONNECT"]); // atmtype, atmmultitype
/** SS7 MTP2 types. */
const MTP2_TYPES = new Set(["FISU", "LSSU", "MSU", "HFISU", "HLSSU", "HMSU"]); // mtp2type
/** SS7 MTP3 fields, and the ATM fields, which take a value. */
const FIELD_KW = new Set(["SIO", "OPC", "DPC", "SLS", "HSIO", "HOPC", "HDPC", "HSLS", "VPI", "VCI"]); // mtp3field, atmfield
/** Tokens that can start a value (nid), besides NUM and "(". */
const NID_START = new Set(["ID", "HID", "HID6", "EID", "AID"]); // nid alternatives

/** Thrown internally when nesting passes MAX_DEPTH; caught at the top. */
class DepthError extends Error {
  /** @param at the token index where the cap was hit */
  constructor(public readonly at: number) { super("too deep"); } // carries the position
}

/** Result of one rule: the node and the token index after it. */
type R<T> = { node: T; end: number } | null;

/** The parser over one token list. */
class Parser {
  /** Memoised rule results by "rule@index". */
  private memo = new Map<string, unknown>();
  /** Farthest token index where a rule failed. */
  private farPos = -1;
  /** What was expected at farPos. */
  private farExpect = new Set<string>();
  /** Current nesting depth. */
  private depth = 0;

  /**
   * @param toks the tokens of the expression
   * @param srcLen the expression length (the offset reported at the end)
   */
  constructor(private readonly toks: Token[], private readonly srcLen: number) {}

  /** The token at index i, or undefined past the end. */
  private tok(i: number): Token | undefined { return this.toks[i]; } // bounds-safe read
  /** The terminal at index i, or "EOF". */
  private t(i: number): string { return this.toks[i]?.t ?? "EOF"; } // terminal name

  /** Record a failure at token index i expecting `what`; always returns null. */
  private fail(i: number, what: string): null {
    if (i > this.farPos) { this.farPos = i; this.farExpect = new Set([what]); } // a new farthest point
    else if (i === this.farPos) this.farExpect.add(what); // another expectation at the same point
    return null; // for chaining
  }

  /** Run fn with memoisation under key rule@i. */
  private memoize<T>(rule: string, i: number, fn: () => R<T>): R<T> {
    const key = `${rule}@${i}`; // memo key
    if (this.memo.has(key)) return this.memo.get(key) as R<T>; // computed before
    const r = fn(); // compute
    this.memo.set(key, r); // remember
    return r; // result
  }

  /** Run fn one nesting level deeper (a parenthesis or a "not"), refusing past MAX_DEPTH. */
  private nest<T>(i: number, fn: () => T): T {
    if (++this.depth > MAX_DEPTH) throw new DepthError(i); // nesting cap
    try { return fn(); } finally { this.depth--; } // always leave the level
  }

  /** Parse the whole expression. */
  parse(): ParseResult {
    if (this.toks.length === 0) return { tree: null, error: null }; // empty: every packet (tcpdump(1))
    try {
      const r = this.expr(0); // the expression
      if (r && r.end === this.toks.length) return { tree: r.node, error: null }; // all consumed
      if (r) this.fail(r.end, r.end < this.toks.length ? "andOr" : "end"); // trailing tokens after a complete expression
      return { tree: null, error: this.error("syntax", this.farPos) }; // report the farthest failure
    } catch (e) {
      if (e instanceof DepthError) return { tree: null, error: this.error("tooDeep", e.at) }; // nesting cap
      throw e; // a bug, not an input problem
    }
  }

  /** Build the error record for token index i. */
  private error(code: "syntax" | "tooDeep", i: number): ParseError {
    const tk = this.tok(i); // the token there, if any
    return {
      code, // syntax or tooDeep
      tokenIndex: i, // token index
      start: tk ? tk.start : this.srcLen, // offset
      end: tk ? tk.end : this.srcLen, // end offset
      found: tk ? tk.text : "", // the text found
      expected: code === "syntax" ? [...this.farExpect].sort() : [], // what would have been accepted
    };
  }

  // ---- expr: term { (and|or) (term | id) } -------------------------------------------------------------
  /** expr, left to right, and/or at equal precedence. */
  private expr(i: number): R<FNode> {
    return this.memoize("expr", i, () => {
      const first = this.term(i); // the first term
      if (!first) return null; // an expression starts with a term
      let node = first.node; // accumulated tree
      let p = first.end; // cursor
      while (this.t(p) === "AND" || this.t(p) === "OR") { // and / or
        const op = this.tok(p)!; // the operator token
        const rhs = this.termOrId(p + 1); // its right operand
        if (!rhs) return null; // an operator needs an operand
        node = { k: op.t === "AND" ? "and" : "or", op, l: node, r: rhs.node, start: node.start, end: rhs.node.end }; // left-assoc
        p = rhs.end; // continue after it
      }
      return { node, end: p }; // the expression
    });
  }

  /** After and/or: a term, or a bare value (grammar: expr and term | expr and id). */
  private termOrId(i: number): R<FNode> {
    const t = this.t(i); // the next terminal
    if (NID_START.has(t)) return this.id(i); // only a value can start with these
    if (t === "!" || t === "(" || t === "NUM") return this.term(i) ?? this.id(i); // a term first, then a value
    return this.term(i); // anything else must be a term
  }

  // ---- term: not term | rterm ----------------------------------------------------------------------------
  /** term. */
  private term(i: number): R<FNode> {
    return this.memoize("term", i, () => {
      if (this.t(i) === "!") { // not / !
        const e = this.nest(i, () => this.term(i + 1)); // the negated term, one level deeper
        if (!e) return null; // "not" needs a term
        return { node: { k: "not", op: this.tok(i)!, e: e.node, start: this.tok(i)!.start, end: e.node.end }, end: e.end }; // negation
      }
      return this.rterm(i); // a plain term
    });
  }

  /** rterm: the alternatives, chosen by the first one or two tokens. */
  private rterm(i: number): R<FNode> {
    const t = this.t(i); // first terminal
    if (PNAME.has(t)) { // a protocol keyword
      const n = this.t(i + 1); // what follows it
      if (DQUAL_START.has(n) || AQUAL.has(n) || n === "PROTO" || n === "PROTOCHAIN" || n === "GATEWAY") return this.headId(i); // "tcp port 80"
      if (n === "[") return this.relation(i); // "tcp[13] ..."
      if (n === "TK_BROADCAST" || n === "TK_MULTICAST" || n === "TYPE" || n === "SUBTYPE" || n === "DIR") return this.other(i); // "ip broadcast", "wlan type mgt"
      const tk = this.tok(i)!; // the keyword alone
      return { node: { k: "abbrev", tok: tk, start: tk.start, end: tk.end }, end: i + 1 }; // an abbreviation
    }
    if (DQUAL_START.has(t) || AQUAL.has(t) || t === "PROTO" || t === "PROTOCHAIN" || t === "GATEWAY") return this.headId(i); // "src foo", "port 80"
    if (t === "(") return this.parenExpr(i) ?? this.relation(i); // ( expr ), else (arith) relop arith
    if (t === "NUM" || t === "LEN" || t === "-") return this.relation(i); // arithmetic
    if (OTHER_START.has(t)) return this.other(i); // special primitives
    if (ATM_TYPES.has(t) || MTP2_TYPES.has(t)) { const tk = this.tok(i)!; return { node: { k: "special", kind: t, toks: [tk], proto: null, start: tk.start, end: tk.end }, end: i + 1 }; } // ATM / SS7 types
    if (FIELD_KW.has(t)) return this.fieldValue(i); // vpi/vci, sio/opc/dpc/sls
    return this.fail(i, "primitive"); // nothing else starts a term
  }

  /** ( expr ) */
  private parenExpr(i: number): R<FNode> {
    return this.memoize("parenExpr", i, () => {
      const inner = this.nest(i, () => this.expr(i + 1)); // the inner expression, one level deeper
      if (!inner) return null; // not an expression
      if (this.t(inner.end) !== ")") return this.fail(inner.end, "rparen"); // the closing parenthesis
      return { node: { k: "group", e: inner.node, valuesOnly: false, start: this.tok(i)!.start, end: this.tok(inner.end)!.end }, end: inner.end + 1 }; // the group
    });
  }

  // ---- head id ----------------------------------------------------------------------------------------------
  /** A head of qualifiers followed by a value. */
  private headId(i: number): R<FNode> {
    let p = i; // cursor
    const start = this.tok(i)!.start; // head start
    let proto: Token | null = null; // protocol qualifier
    if (PNAME.has(this.t(p))) { proto = this.tok(p)!; p++; } // pqual
    let dir: Head["dir"] = null; // direction
    if (this.t(p) === "SRC" || this.t(p) === "DST") { // src / dst, possibly "src or dst" / "src and dst"
      const d0 = this.tok(p)!; // the first word
      p++; // past it
      const nx = this.t(p); // a following and/or
      if (nx === "OR" || nx === "AND") { // the parser shifts here (one of the grammar's resolved conflicts)
        const other = d0.t === "SRC" ? "DST" : "SRC"; // the word that must follow
        if (this.t(p + 1) !== other) return this.fail(p + 1, other === "DST" ? "dstWord" : "srcWord"); // "src or" must be "src or dst"
        const d1 = this.tok(p + 1)!; // the second word
        dir = { value: nx === "OR" ? "src or dst" : "src and dst", start: d0.start, end: d1.end, text: `${d0.text} ${this.tok(p)!.text} ${d1.text}` }; // compound
        p += 2; // past "or dst"
      } else dir = { value: d0.t === "SRC" ? "src" : "dst", start: d0.start, end: d0.end, text: d0.text }; // simple
    } else if (DQUAL_START.has(this.t(p))) { // addr1..4, ra, ta
      const d = this.tok(p)!; // the word
      const v = ({ ADDR1: "addr1", ADDR2: "addr2", ADDR3: "addr3", ADDR4: "addr4", RA: "ra", TA: "ta" } as Record<string, Dir>)[d.t]; // its value
      dir = { value: v, start: d.start, end: d.end, text: d.text }; // the qualifier
      p++; // past it
    }
    let addr: Head["addr"] = null; // type
    const at = this.t(p); // a type keyword?
    if (AQUAL.has(at)) { // host, net, port, portrange
      const a = this.tok(p)!; // the word
      addr = { value: a.t.toLowerCase() as Addr, start: a.start, end: a.end, text: a.text }; // HOST -> host, PORTRANGE -> portrange
      p++; // past it
    } else if (!dir && (at === "PROTO" || at === "PROTOCHAIN" || at === "GATEWAY")) { // these take no direction
      const a = this.tok(p)!; // the word
      addr = { value: a.t.toLowerCase() as Addr, start: a.start, end: a.end, text: a.text }; // the qualifier
      p++; // past it
    }
    if (!dir && !addr) return this.fail(p, "qualifier"); // a head needs a direction or a type
    const head: Head = { proto, dir, addr, start, end: this.tok(p - 1)!.end }; // the head
    const v = this.id(p); // the value
    if (!v) return null; // a head needs a value
    return { node: this.attachHead(v.node, head), end: v.end }; // qualifiers attached to the value(s)
  }

  /** Give a parsed value tree its head: the first bare primitive (in source order) carries it; the rest inherit. */
  private attachHead(n: FNode, head: Head): FNode {
    if (n.k === "prim") return { ...n, head, start: head.start }; // a single value
    // A compound value "host (a or b)", "host not a": the head covers the whole value; keep the tree and remember the head on a group.
    return { k: "group", e: this.headFirst(n, head), valuesOnly: true, start: head.start, end: n.end }; // wrapped
  }

  /** Put the head on the left-most primitive of a value tree. */
  private headFirst(n: FNode, head: Head): FNode {
    if (n.k === "prim") return { ...n, head }; // found it
    if (n.k === "and" || n.k === "or") return { ...n, l: this.headFirst(n.l, head) }; // go left
    if (n.k === "not" || n.k === "group") return { ...n, e: this.headFirst(n.e, head) }; // go inside
    return n; // no primitive (cannot happen for value trees)
  }

  // ---- values -----------------------------------------------------------------------------------------------
  /** id: nid | pnum | ( pid ) | not id */
  private id(i: number): R<FNode> {
    return this.memoize("id", i, () => {
      const t = this.t(i); // first terminal
      if (t === "!") { // not id
        const e = this.nest(i, () => this.id(i + 1)); // the negated value, one level deeper
        if (!e) return null; // needs a value
        return { node: { k: "not", op: this.tok(i)!, e: e.node, start: this.tok(i)!.start, end: e.node.end }, end: e.end }; // negation
      }
      if (t === "(") return this.pidParen(i) ?? this.pnumPrim(i); // ( values ) or ( number )
      if (t === "NUM") return this.pnumPrim(i); // a number
      return this.nid(i); // a name or address
    });
  }

  /** nid: a name, an IPv4 form (with /len or mask), an IPv6 form (with /len), a MAC-48, a MAC-8, or not id. */
  private nid(i: number): R<FNode> {
    const tk = this.tok(i); // the token
    const t = this.t(i); // its terminal
    if (t === "!") return this.id(i); // not id
    const prim = (kind: ValueKind, toks: Token[], end: number): R<FNode> => ({ node: { k: "prim", head: null, value: { kind, toks, start: toks[0].start, end: toks[toks.length - 1].end }, start: toks[0].start, end: toks[toks.length - 1].end }, end }); // a primitive without qualifiers
    if (t === "ID") return prim("name", [tk!], i + 1); // a name
    if (t === "HID") { // dotted IPv4
      if (this.t(i + 1) === "/") { // address/len
        if (this.t(i + 2) !== "NUM") return this.fail(i + 2, "prefixLen"); // a length must follow
        return prim("ipv4-cidr", [tk!, this.tok(i + 1)!, this.tok(i + 2)!], i + 3); // CIDR
      }
      if (this.t(i + 1) === "NETMASK") { // address mask mask
        if (this.t(i + 2) !== "HID") return this.fail(i + 2, "dottedMask"); // a dotted mask must follow
        return prim("ipv4-mask", [tk!, this.tok(i + 1)!, this.tok(i + 2)!], i + 3); // address and mask
      }
      return prim("ipv4", [tk!], i + 1); // plain
    }
    if (t === "HID6") { // IPv6
      if (this.t(i + 1) === "/") { // address/len
        if (this.t(i + 2) !== "NUM") return this.fail(i + 2, "prefixLen"); // a length must follow
        return prim("ipv6-cidr", [tk!, this.tok(i + 1)!, this.tok(i + 2)!], i + 3); // prefix
      }
      return prim("ipv6", [tk!], i + 1); // plain
    }
    if (t === "EID") return prim("mac", [tk!], i + 1); // MAC-48
    if (t === "AID") return prim("mac8", [tk!], i + 1); // MAC-8
    return this.fail(i, "value"); // not a value
  }

  /** pnum as a primitive value: NUM | ( pnum ) */
  private pnumPrim(i: number): R<FNode> {
    const r = this.pnum(i); // the number
    if (!r) return null; // not a number
    const v: IdValue = { kind: "num", toks: [r.node], start: this.tok(i)!.start, end: this.tok(r.end - 1)!.end }; // the value, parentheses included
    return { node: { k: "prim", head: null, value: v, start: v.start, end: v.end }, end: r.end }; // the primitive
  }

  /** pnum: NUM | ( pnum ). Returns the NUM token. */
  private pnum(i: number): R<Token> {
    return this.memoize("pnum", i, () => {
      if (this.t(i) === "NUM") return { node: this.tok(i)!, end: i + 1 }; // a number
      if (this.t(i) === "(") { // a parenthesised number
        const r = this.nest(i, () => this.pnum(i + 1)); // inside, one level deeper
        if (!r) return null; // not a number
        if (this.t(r.end) !== ")") return this.fail(r.end, "rparen"); // must close
        return { node: r.node, end: r.end + 1 }; // the number
      }
      return this.fail(i, "number"); // nothing else
    });
  }

  /** ( pid ): values only, inside parentheses, in a value position. */
  private pidParen(i: number): R<FNode> {
    return this.memoize("pidParen", i, () => {
      const inner = this.nest(i, () => this.pid(i + 1)); // the values, one level deeper
      if (!inner) return null; // not values
      if (this.t(inner.end) !== ")") return this.fail(inner.end, "rparen"); // must close
      return { node: { k: "group", e: inner.node, valuesOnly: true, start: this.tok(i)!.start, end: this.tok(inner.end)!.end }, end: inner.end + 1 }; // the group
    });
  }

  /** pid: (nid | pnum (and|or) id) { (and|or) id }  -- a number alone needs an and/or after it. */
  private pid(i: number): R<FNode> {
    return this.memoize("pid", i, () => {
      const t = this.t(i); // first terminal
      let first: R<FNode>; // the first value
      let mustOp = false; // a number must be followed by and/or
      if (NID_START.has(t) || t === "!") first = this.nid(i); // a name, an address, or not id
      else if (t === "NUM" || t === "(") { first = this.pnumPrim(i); mustOp = true; } // a number
      else return this.fail(i, "value"); // nothing else
      if (!first) return null; // no first value
      let node = first.node; // accumulated
      let p = first.end; // cursor
      while (this.t(p) === "AND" || this.t(p) === "OR") { // more values
        const op = this.tok(p)!; // the operator
        const rhs = this.id(p + 1); // the next value
        if (!rhs) return null; // needs a value
        node = { k: op.t === "AND" ? "and" : "or", op, l: node, r: rhs.node, start: node.start, end: rhs.node.end }; // left-assoc
        p = rhs.end; // continue
        mustOp = false; // satisfied
      }
      if (mustOp) return this.fail(p, "andOr"); // "( 80 )" is a number, not a value list
      return { node, end: p }; // the values
    });
  }

  // ---- relations and arithmetic -----------------------------------------------------------------------------
  /** arith relop arith */
  private relation(i: number): R<FNode> {
    return this.memoize("relation", i, () => {
      const l = this.arith(i); // left side
      if (!l) return null; // not arithmetic
      const op = this.tok(l.end); // the operator
      if (!op || !REL_OPS.has(op.t)) return this.fail(l.end, "relop"); // a relation needs one
      const r = this.arith(l.end + 1); // right side
      if (!r) return null; // not arithmetic
      return { node: { k: "rel", op, l: l.node, r: r.node, start: l.node.start, end: r.node.end }, end: r.end }; // the relation
    });
  }

  /**
   * An arithmetic expression by operator precedence, resolving every shift/reduce decision as the parser
   * generator does: reduce when the operator on the stack binds tighter (or as tight, left-assoc); shift when
   * either operator has no declared precedence (% and ^).
   */
  private arith(i: number): R<Arith> {
    return this.memoize("arith", i, () => {
      const vals: Arith[] = []; // operand stack
      const ops: Token[] = []; // operator stack (unary minus marked by kind NEG in negs)
      const negs = new Set<Token>(); // which stacked "-" tokens are unary
      let p = i; // cursor
      let expectOperand = true; // what comes next
      const precOf = (op: Token) => (negs.has(op) ? PREC.NEG : PREC[op.t]); // undefined for % and ^
      /** Pop one operator and build its node. */
      const reduce = () => {
        const op = ops.pop()!; // the operator
        if (negs.has(op)) { const e = vals.pop()!; vals.push({ k: "neg", op, e, start: op.start, end: e.end }); return; } // -e
        const r = vals.pop()!; // right operand
        const l = vals.pop()!; // left operand
        vals.push({ k: "bin", op, l, r, start: l.start, end: r.end }); // l op r
      };
      for (;;) { // until the expression ends
        if (expectOperand) { // an operand, or a unary minus
          if (this.t(p) === "-") { // unary minus: iterative here, but each one nests the tree, so the chain is capped
            const m = this.tok(p)!; // the minus
            negs.add(m); // unary
            ops.push(m); // stacked
            if (negs.size > MAX_DEPTH) throw new DepthError(p); // a chain longer than the nesting cap
            p++; // past it
            continue; // still expecting an operand
          }
          const prim = this.primary(p); // the operand
          if (!prim) return null; // not arithmetic
          vals.push(prim.node); // stack it
          p = prim.end; // past it
          expectOperand = false; // an operator may follow
        } else {
          const t = this.tok(p); // a binary operator?
          if (!t || !ARITH_OPS.has(t.t)) break; // anything else ends the expression
          while (ops.length > 0) { // reduce what binds tighter
            const po = precOf(ops[ops.length - 1]); // the stacked operator's precedence
            const pt = PREC[t.t]; // the incoming operator's precedence
            if (po === undefined || pt === undefined) break; // no precedence on either side: shift (Bison's default)
            if (po >= pt) reduce(); // tighter or equal (left-assoc; unary minus is highest): reduce
            else break; // looser: shift
          }
          ops.push(t); // stack the operator
          p++; // past it
          expectOperand = true; // an operand follows
        }
      }
      while (ops.length > 0) reduce(); // the end of the expression reduces everything
      return { node: vals[0], end: p }; // the expression
    });
  }

  /** A primary arithmetic operand: a number, len, ( arith ), or proto [ arith (: size) ]. */
  private primary(i: number): R<Arith> {
    const t = this.t(i); // first terminal
    const tk = this.tok(i); // its token
    if (t === "NUM") return { node: { k: "num", tok: tk!, start: tk!.start, end: tk!.end }, end: i + 1 }; // a constant
    if (t === "LEN") return { node: { k: "len", tok: tk!, start: tk!.start, end: tk!.end }, end: i + 1 }; // the packet length
    if (t === "(") { // ( arith )
      const inner = this.nest(i, () => this.arith(i + 1)); // inside, one level deeper
      if (!inner) return null; // not arithmetic
      if (this.t(inner.end) !== ")") return this.fail(inner.end, "rparenArith"); // must close
      return { node: { k: "paren", e: inner.node, start: tk!.start, end: this.tok(inner.end)!.end }, end: inner.end + 1 }; // the group
    }
    if (PNAME.has(t) && this.t(i + 1) === "[") { // a packet data accessor
      const off = this.nest(i, () => this.arith(i + 2)); // the offset, one level deeper
      if (!off) return null; // not arithmetic
      let p = off.end; // cursor
      let size: Token | null = null; // the optional size
      if (this.t(p) === ":") { // : size
        if (this.t(p + 1) !== "NUM") return this.fail(p + 1, "size"); // the size is a plain number
        size = this.tok(p + 1)!; // the size
        p += 2; // past ": n"
      }
      if (this.t(p) !== "]") return this.fail(p, "rbracket"); // must close
      return { node: { k: "load", proto: tk!, offset: off.node, size, start: tk!.start, end: this.tok(p)!.end }, end: p + 1 }; // the load
    }
    return this.fail(i, "arith"); // nothing else
  }

  // ---- the other primitives ---------------------------------------------------------------------------------
  /** The special primitives (other, pfvar, p80211, pllc). */
  private other(i: number): R<FNode> {
    let p = i; // cursor
    let proto: Token | null = null; // an optional protocol qualifier (broadcast, multicast, 802.11)
    if (PNAME.has(this.t(p))) { proto = this.tok(p)!; p++; } // pqual
    const kw = this.tok(p)!; // the keyword
    const done = (kind: string, end: number): R<FNode> => ({ node: { k: "special", kind, toks: this.toks.slice(i, end), proto, start: this.tok(i)!.start, end: this.tok(end - 1)!.end }, end }); // build
    const need = (j: number, ts: string[], what: string): boolean => (ts.includes(this.t(j)) ? true : (this.fail(j, what), false)); // a required token
    switch (kw.t) {
      case "TK_BROADCAST": return done("broadcast", p + 1); // [proto] broadcast
      case "TK_MULTICAST": return done("multicast", p + 1); // [proto] multicast
      case "LESS": return need(p + 1, ["NUM"], "number") ? done("less", p + 2) : null; // less NUM
      case "GREATER": return need(p + 1, ["NUM"], "number") ? done("greater", p + 2) : null; // greater NUM
      case "CBYTE": // byte NUM op NUM
        if (!need(p + 1, ["NUM"], "number")) return null; // the index
        if (!need(p + 2, ["&", "|", "<", ">", "="], "byteOp")) return null; // the operator
        return need(p + 3, ["NUM"], "number") ? done("byte", p + 4) : null; // the value
      case "INBOUND": return done("inbound", p + 1); // inbound
      case "OUTBOUND": return done("outbound", p + 1); // outbound
      case "IFINDEX": return need(p + 1, ["NUM"], "number") ? done("ifindex", p + 2) : null; // ifindex NUM
      case "PPPOED": return done("pppoed", p + 1); // pppoed
      case "VLAN": case "MPLS": case "PPPOES": case "GENEVE": case "VXLAN": { // keyword [pnum]
        const kind = kw.t.toLowerCase(); // vlan, mpls, ...
        if (this.t(p + 1) === "NUM" || this.t(p + 1) === "(") { // a number follows (the parser shifts into it)
          const n = this.pnum(p + 1); // the number
          if (!n) return null; // "vlan (" must be a number
          return done(kind, n.end); // with the number
        }
        return done(kind, p + 1); // without
      }
      case "PF_IFNAME": case "PF_RSET": return need(p + 1, ["ID"], "name") ? done(kw.t === "PF_IFNAME" ? "ifname" : "ruleset", p + 2) : null; // ifname ID, ruleset ID
      case "PF_RNR": case "PF_SRNR": return need(p + 1, ["NUM"], "number") ? done(kw.t === "PF_RNR" ? "rulenum" : "subrulenum", p + 2) : null; // rnr NUM, srnr NUM
      case "PF_REASON": return need(p + 1, ["NUM", "ID"], "name") ? done("reason", p + 2) : null; // reason NUM|ID
      case "PF_ACTION": return need(p + 1, ["ID"], "name") ? done("action", p + 2) : null; // action ID
      case "TYPE": // type T [subtype S]
        if (!need(p + 1, ["NUM", "ID"], "name")) return null; // the type
        if (this.t(p + 2) === "SUBTYPE") return need(p + 3, ["NUM", "ID"], "name") ? done("wlanTypeSubtype", p + 4) : null; // with a subtype
        return done("wlanType", p + 2); // type alone
      case "SUBTYPE": return need(p + 1, ["ID"], "name") ? done("wlanSubtype", p + 2) : null; // subtype S
      case "DIR": return need(p + 1, ["NUM", "ID"], "name") ? done("wlanDir", p + 2) : null; // dir D
      case "LLC": // llc [ID | rnr]
        if (this.t(p + 1) === "ID" || this.t(p + 1) === "PF_RNR") return done("llcType", p + 2); // with a type
        return done("llc", p + 1); // alone
    }
    return this.fail(p, "primitive"); // not reached for the keywords routed here
  }

  /** vpi/vci and the MTP3 fields: NUM | relop NUM | ( NUM { or NUM } ) */
  private fieldValue(i: number): R<FNode> {
    const kw = this.tok(i)!; // the field keyword
    const done = (end: number): R<FNode> => ({ node: { k: "special", kind: `field:${kw.text}`, toks: this.toks.slice(i, end), proto: null, start: kw.start, end: this.tok(end - 1)!.end }, end }); // build
    const n = this.t(i + 1); // what follows
    if (n === "NUM") return done(i + 2); // field N
    if (REL_OPS.has(n)) return this.t(i + 2) === "NUM" ? done(i + 3) : this.fail(i + 2, "number"); // field relop N
    if (n === "(") { // field ( N or N ... )
      let p = i + 2; // cursor
      if (this.t(p) !== "NUM") return this.fail(p, "number"); // a number first
      p++; // past it
      while (this.t(p) === "OR") { if (this.t(p + 1) !== "NUM") return this.fail(p + 1, "number"); p += 2; } // or N
      if (this.t(p) !== ")") return this.fail(p, "rparen"); // must close
      return done(p + 1); // the list
    }
    return this.fail(i + 1, "number"); // a value is required
  }
}

/**
 * Parse a token list into a Boolean tree.
 * @param toks the tokens (from tokenize)
 * @param srcLen the length of the expression text
 */
export function parseTokens(toks: Token[], srcLen: number): ParseResult {
  return new Parser(toks, srcLen).parse(); // one parser per expression
}
