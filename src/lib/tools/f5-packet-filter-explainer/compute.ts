// ============================================================================
// src/lib/tools/f5-packet-filter-explainer/compute.ts
// ----------------------------------------------------------------------------
// READS BIG-IP PACKET FILTERS THE WAY THE MAN PAGE WOULD, THEN RUNS THE WALK.
//
// Paste `net packet-filter` stanzas and every rule renders in evaluation
// order with the reference's own semantics: a single global list, lowest
// order first (the man page's worked sequence: 500,100,300,200,201
// evaluates as 100,200,201,300,500), no two rules may share an order,
// evaluation stops on the first match whose action is accept, discard, or
// reject, and continue is the only non-terminal action, acknowledging the
// packet for logging or statistics and moving on. Four attributes are
// mandatory (name, order, action, rule), and the rule expression, written
// in BPF/tcpdump syntax, is mandatory but may be empty, in which case it
// matches ALL packets.
//
// The simulator answers "which rule matches this packet" honestly: a
// three-state evaluator over the BPF subset this tool actually implements
// ([src|dst] host, [src|dst] net CIDR, [src|dst] port, protocol keywords
// in both pcap form (tcp) and the form F5's own examples use (proto TCP),
// with and/or/not and parentheses). Expressions outside the subset return
// cannot-evaluate for that rule rather than a guess, and the walk says so.
//
// Context the walk always carries, from the Routing Administration
// chapter: the Packet Filtering master switch is DISABLED by default, and
// off means no settings or rules operate and all traffic is allowed;
// trusted exemptions (net packet-filter-trusted) process BEFORE rule
// evaluation and cannot be overridden by any rule; ARP and the important
// IPv4 ICMP types (UNREACH, SOURCEQUENCH, REDIRECT, TIMEXCEED) are
// exempted by default; established connections are NOT filtered by
// default; unmatched packets take the Unhandled Packet Action, default
// Accept; and the management interface is not affected by any packet
// filter configuration at all.
//
// Sources: the tmsh net packet-filter man page (v17), the TMOS Routing
// Administration chapter 6 (Packet Filters, 11.6), the tmsh net
// packet-filter-trusted man page (v16), and pcap-filter(7), all accessed
// 2026-07-03.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PfAction = "accept" | "continue" | "discard" | "reject";

export interface PfRule {
  name: string;
  order: number | null;
  action: PfAction | null;
  rule: string | null; // null = attribute absent; "" = present and empty (matches ALL)
  vlan: string | null; // null = all VLANs
  logging: boolean;
  rateClass: string | null;
  issues: string[];
  notes: string[];
}

export type SimVerdict = "match" | "no-match" | "cannot-evaluate" | "vlan-skip";

export interface SimStep {
  ruleName: string;
  verdict: SimVerdict;
  detail: string;
  terminal: boolean;
}

export interface PacketDescriptor {
  proto: "tcp" | "udp" | "icmp" | "arp" | "other";
  src: string | null;
  dst: string | null;
  sport: number | null;
  dport: number | null;
  vlan: string | null;
}

export interface PacketFilterResult {
  ok: boolean;
  mode: "explain" | "simulate";
  rules: PfRule[];
  orderWalk: string[];
  contextNotes: string[];
  simulation?: {
    packet: PacketDescriptor;
    steps: SimStep[];
    outcome: string;
  };
  errors: string[];
}

export type ToolRunResult = PacketFilterResult;

// ---------------------------------------------------------------------------
// tmsh parsing: net packet-filter NAME { field value ... }
// Line-oriented, brace-aware, tolerant of `ltm/net` listing headers.
// ---------------------------------------------------------------------------

const ACTIONS: ReadonlySet<string> = new Set(["accept", "continue", "discard", "reject"]);

export function parseRules(text: string): { rules: PfRule[]; errors: string[] } {
  const rules: PfRule[] = [];
  const errors: string[] = [];
  const re = /net\s+packet-filter\s+(\S+)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    if (name === "trusted") {
      // net packet-filter-trusted arrives through a different head; the
      // shorthand `net packet-filter trusted` is not the rules object.
      continue;
    }
    let depth = 0;
    let i = m.index + m[0].length - 1;
    let end = -1;
    for (; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end < 0) { errors.push(`${name}: unbalanced braces.`); break; }
    const body = text.slice(m.index + m[0].length, end);
    re.lastIndex = end + 1;

    const rule: PfRule = { name, order: null, action: null, rule: null, vlan: null, logging: false, rateClass: null, issues: [], notes: [] };
    const om = body.match(/^\s*order\s+(\d+)\s*$/m);
    if (om) rule.order = Number.parseInt(om[1], 10);
    const am = body.match(/^\s*action\s+(\S+)\s*$/m);
    if (am) {
      if (ACTIONS.has(am[1])) rule.action = am[1] as PfAction;
      else rule.issues.push(`action "${am[1]}" is not one of accept | continue | discard | reject.`);
    }
    const rm = body.match(/^\s*rule\s+"([^"]*)"\s*$/m) ?? body.match(/^\s*rule\s+(\S.*)$/m);
    if (rm) rule.rule = rm[1].trim();
    const vm = body.match(/^\s*vlan\s+(\S+)\s*$/m);
    if (vm) rule.vlan = vm[1];
    if (/^\s*logging\s+enabled\s*$/m.test(body)) rule.logging = true;
    const rc = body.match(/^\s*rate-class\s+(\S+)\s*$/m) ?? body.match(/^\s*rate\s+class\s+(\S+)\s*$/m);
    if (rc) rule.rateClass = rc[1];

    // Mandatory-attribute checks per the man page (name, order, action, rule).
    if (rule.order === null) rule.issues.push("order is missing; the man page marks it required, greater than 0, and unique across the single global list.");
    else if (rule.order <= 0) rule.issues.push("order must be greater than 0.");
    if (rule.action === null && rule.issues.length === 0) rule.issues.push("action is missing; the man page gives it no default, you must specify one.");
    if (rule.rule === null) rule.issues.push("rule expression attribute is missing; it is mandatory (though it may be empty).");
    else if (rule.rule === "") rule.notes.push("Empty expression: per the man page, an empty rule matches ALL packets. Combined with a terminal action, everything after this rule (within its VLAN scope) is unreachable.");
    if (rule.vlan === null) rule.notes.push("No vlan attribute: the rule applies to all VLANs.");

    rules.push(rule);
  }
  return { rules, errors };
}

// ---------------------------------------------------------------------------
// BPF-subset expression evaluator (three-state).
// Grammar: expr := term (('and'|'or') term)* ; term := ['not'] atom
//          atom := '(' expr ')' | primitive
// Primitives: [src|dst] host A.B.C.D | [src|dst] net A.B.C.D/nn
//             [src|dst] port N | tcp|udp|icmp|arp|ip | proto NAME
// Anything else -> "unknown" (cannot-evaluate propagates conservatively).
// ---------------------------------------------------------------------------

type Tri = true | false | "unknown";

function ipToInt(ip: string): number | null {
  const p = ip.split(".");
  if (p.length !== 4) return null;
  let v = 0;
  for (const o of p) {
    const n = Number.parseInt(o, 10);
    if (!Number.isInteger(n) || n < 0 || n > 255 || String(n) !== o) return null;
    v = v * 256 + n;
  }
  return v >>> 0;
}

function inNet(ip: string | null, cidr: string): Tri {
  if (ip === null) return "unknown";
  const [net, lenS] = cidr.split("/");
  const len = Number.parseInt(lenS ?? "32", 10);
  const a = ipToInt(ip);
  const b = ipToInt(net);
  if (a === null || b === null || !Number.isInteger(len) || len < 0 || len > 32) return "unknown";
  if (len === 0) return true;
  const mask = len === 32 ? 0xffffffff : (~((1 << (32 - len)) - 1)) >>> 0;
  return ((a & mask) >>> 0) === ((b & mask) >>> 0);
}

function triNot(a: Tri): Tri { return a === "unknown" ? "unknown" : !a; }
function triAnd(a: Tri, b: Tri): Tri {
  if (a === false || b === false) return false;
  if (a === "unknown" || b === "unknown") return "unknown";
  return true;
}
function triOr(a: Tri, b: Tri): Tri {
  if (a === true || b === true) return true;
  if (a === "unknown" || b === "unknown") return "unknown";
  return false;
}

export function evalExpression(expr: string, pkt: PacketDescriptor): Tri {
  const toks = expr.toLowerCase().replace(/([()])/g, " $1 ").trim().split(/\s+/).filter(Boolean);
  if (toks.length === 0) return true; // empty expression matches ALL (man page)
  let pos = 0;
  const peek = () => toks[pos];
  const take = () => toks[pos++];

  function primitive(): Tri {
    let dir: "src" | "dst" | null = null;
    if (peek() === "src" || peek() === "dst") dir = take() as "src" | "dst";
    const t = peek();
    if (t === "host") {
      take();
      const ip = take();
      if (ipToInt(ip) === null) return "unknown";
      const s = pkt.src === ip;
      const d = pkt.dst === ip;
      if (dir === "src") return pkt.src === null ? "unknown" : s;
      if (dir === "dst") return pkt.dst === null ? "unknown" : d;
      if (pkt.src === null || pkt.dst === null) return s || d ? true : "unknown";
      return s || d;
    }
    if (t === "net") {
      take();
      const cidr = take();
      const s = inNet(pkt.src, cidr);
      const d = inNet(pkt.dst, cidr);
      if (dir === "src") return s;
      if (dir === "dst") return d;
      return triOr(s, d);
    }
    if (t === "port") {
      take();
      const n = Number.parseInt(take(), 10);
      if (!Number.isInteger(n)) return "unknown";
      const s = pkt.sport === null ? "unknown" : pkt.sport === n;
      const d = pkt.dport === null ? "unknown" : pkt.dport === n;
      if (dir === "src") return s as Tri;
      if (dir === "dst") return d as Tri;
      return triOr(s as Tri, d as Tri);
    }
    if (dir !== null) return "unknown"; // src/dst followed by something unsupported
    if (t === "tcp" || t === "udp" || t === "icmp" || t === "arp") {
      take();
      return pkt.proto === t;
    }
    if (t === "ip") { take(); return pkt.proto !== "arp"; }
    if (t === "proto") {
      // The form F5's own man-page examples use: (proto TCP)
      take();
      const p = take();
      if (p === "tcp" || p === "udp" || p === "icmp") return pkt.proto === p;
      return "unknown";
    }
    // Unsupported primitive: consume one token, stay honest.
    take();
    return "unknown";
  }

  function term(): Tri {
    if (peek() === "not") { take(); return triNot(term()); }
    if (peek() === "(") {
      take();
      const v = orExpr();
      if (peek() === ")") take();
      return v;
    }
    return primitive();
  }

  function andExpr(): Tri {
    let v = term();
    while (peek() === "and" || peek() === "&&") { take(); v = triAnd(v, term()); }
    return v;
  }

  function orExpr(): Tri {
    let v = andExpr();
    while (peek() === "or" || peek() === "||") { take(); v = triOr(v, andExpr()); }
    return v;
  }

  const out = orExpr();
  return pos < toks.length ? "unknown" : out;
}

// ---------------------------------------------------------------------------
// Packet descriptor parsing: "tcp src 172.19.254.10 dst 172.19.254.80 dport 443 vlan external"
// ---------------------------------------------------------------------------

export function parsePacket(line: string): PacketDescriptor {
  const toks = line.trim().toLowerCase().split(/\s+/);
  const pkt: PacketDescriptor = { proto: "other", src: null, dst: null, sport: null, dport: null, vlan: null };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === "tcp" || t === "udp" || t === "icmp" || t === "arp") pkt.proto = t;
    else if (t === "src") pkt.src = toks[++i] ?? null;
    else if (t === "dst") pkt.dst = toks[++i] ?? null;
    else if (t === "sport") pkt.sport = Number.parseInt(toks[++i] ?? "", 10) || null;
    else if (t === "dport") pkt.dport = Number.parseInt(toks[++i] ?? "", 10) || null;
    else if (t === "vlan") pkt.vlan = toks[++i] ?? null;
  }
  return pkt;
}

// ---------------------------------------------------------------------------
// run()
// Input: tmsh stanzas, optionally preceded/followed by a line
//   sim: <packet descriptor>
// ---------------------------------------------------------------------------

const CONTEXT_NOTES: readonly string[] = Object.freeze([
  "Master switch: packet filtering is DISABLED by default; with the global Packet Filtering setting off, no packet filter settings or rules operate and the BIG-IP system allows all traffic by default.",
  "Trusted exemptions (net packet-filter-trusted) process BEFORE rule list evaluation; per the reference it is impossible to override this option and mask out traffic with a packet filter rule.",
  "Default protocol exemptions: ARP is always accepted, and so are the important IPv4 ICMP types UNREACH, SOURCEQUENCH, REDIRECT, and TIMEXCEED, unless those global settings were cleared.",
  "Established connections are NOT filtered by default; the Filter Established Connections option is off, so rules see connection-initiating traffic. F5 notes enabling it does not typically enhance security and can impact performance.",
  "Packets matching no rule take the global Unhandled Packet Action, default Accept, and F5 warns about changing it before your accept rules are complete.",
  "The management interface is not affected by any packet filter configuration, per the man page's own management-access example.",
  "Packet filters apply to incoming traffic only, and per the chapter they are unrelated to iRules; FLOW_INIT in the iRules event list fires after packet filters.",
]);

export function run(input: string): PacketFilterResult {
  const text = (input ?? "").trim();
  if (!text) {
    throw new Error(
      'Paste net packet-filter stanzas (tmsh list net packet-filter output). Add a line "sim: tcp src 10.0.0.5 dst 172.19.254.80 dport 443 vlan external" to simulate a packet through the walk.',
    );
  }

  let simLine: string | null = null;
  const configText = text
    .split("\n")
    .filter((l) => {
      const m = l.match(/^\s*sim:\s*(.+)$/i);
      if (m) { simLine = m[1]; return false; }
      return true;
    })
    .join("\n");

  const { rules, errors } = parseRules(configText);
  if (rules.length === 0 && errors.length === 0) {
    throw new Error('No "net packet-filter <name> { ... }" stanzas found.');
  }

  // Duplicate order = hard issue per the man page ("no two rules may have the same sort order").
  const seen = new Map<number, string>();
  for (const r of rules) {
    if (r.order === null) continue;
    const prior = seen.get(r.order);
    if (prior) r.issues.push(`order ${r.order} duplicates rule "${prior}"; the man page requires orders to be unique across the single global list.`);
    else seen.set(r.order, r.name);
  }

  const ordered = [...rules].sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));

  // Deterministic shadow detection: an earlier TERMINAL rule with an EMPTY
  // expression shadows every later rule whose VLAN scope it covers.
  for (let i = 0; i < ordered.length; i++) {
    const r = ordered[i];
    if (r.rule === "" && r.action !== null && r.action !== "continue") {
      for (let j = i + 1; j < ordered.length; j++) {
        const later = ordered[j];
        if (r.vlan === null || r.vlan === later.vlan) {
          later.issues.push(`Unreachable: rule "${r.name}" (order ${r.order}) earlier in the walk matches ALL packets${r.vlan ? ` on vlan ${r.vlan}` : " on all VLANs"} with terminal action ${r.action}.`);
        }
      }
    }
  }

  const orderWalk = ordered.map((r) => {
    const scope = r.vlan ? `vlan ${r.vlan}` : "all VLANs";
    const act = r.action ?? "?";
    const terminal = r.action !== null && r.action !== "continue";
    return `order ${r.order ?? "?"}: ${r.name} on ${scope}, action ${act}${terminal ? " (terminal: evaluation stops on match)" : r.action === "continue" ? " (non-terminal: acknowledges for logging/statistics, evaluation continues)" : ""}${r.logging ? ", logging" : ""}${r.rateClass ? `, rate-class ${r.rateClass}` : ""}.`;
  });

  const result: PacketFilterResult = {
    ok: true,
    mode: simLine ? "simulate" : "explain",
    rules: ordered,
    orderWalk,
    contextNotes: [...CONTEXT_NOTES],
    errors,
  };

  if (simLine) {
    const pkt = parsePacket(simLine);
    const steps: SimStep[] = [];
    let outcome = "";
    if (pkt.proto === "arp") {
      outcome = "ARP is exempt by default (Always accept ARP is enabled unless cleared): the packet is accepted before any rule runs.";
    } else {
      for (const r of ordered) {
        if (r.vlan !== null && pkt.vlan !== null && r.vlan !== pkt.vlan) {
          steps.push({ ruleName: r.name, verdict: "vlan-skip", detail: `rule scoped to vlan ${r.vlan}, packet on ${pkt.vlan}.`, terminal: false });
          continue;
        }
        if (r.rule === null) {
          steps.push({ ruleName: r.name, verdict: "cannot-evaluate", detail: "rule attribute missing.", terminal: false });
          continue;
        }
        const v = evalExpression(r.rule, pkt);
        if (v === "unknown") {
          steps.push({ ruleName: r.name, verdict: "cannot-evaluate", detail: "expression uses primitives outside this simulator's evaluated subset; consult the rule on-box.", terminal: false });
          outcome = outcome || "";
          // Honest stop: past this point the walk cannot be asserted.
          outcome = `Simulation stops honestly at rule "${r.name}": its expression is outside the evaluated BPF subset, so every verdict after it would be a guess. Everything above this rule is deterministic.`;
          break;
        }
        if (v === false) {
          steps.push({ ruleName: r.name, verdict: "no-match", detail: "expression evaluates false for this packet.", terminal: false });
          continue;
        }
        const terminal = r.action !== null && r.action !== "continue";
        steps.push({ ruleName: r.name, verdict: "match", detail: `expression matches; action ${r.action ?? "?"}.`, terminal });
        if (terminal) {
          outcome = `Rule "${r.name}" (order ${r.order}) matches first with terminal action ${r.action}: ${r.action === "accept" ? "the packet is accepted and evaluation stops" : r.action === "discard" ? "the packet is dropped silently and evaluation stops" : "the packet is dropped and a reject is sent (ICMP type 3 code 13 if Send ICMP Error on Packet Reject is enabled, protocol-dependent otherwise)"}.`;
          break;
        }
      }
      if (!outcome) {
        outcome = "No terminal rule matched: the packet takes the global Unhandled Packet Action, default Accept.";
      }
    }
    result.simulation = { packet: pkt, steps, outcome };
  }

  return result;
}
