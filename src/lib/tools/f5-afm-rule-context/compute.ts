// ============================================================================
// src/lib/tools/f5-afm-rule-context/compute.ts
// ----------------------------------------------------------------------------
// WALKS A PACKET THROUGH AFM'S CONTEXT HIERARCHY THE WAY THE MANUAL SAYS IT
// MOVES. The Network Firewall processes policies in order: global, then
// route domain, then virtual server OR self IP; management port rules are
// processed separately and take no policies. Within a context the first
// matching rule's action applies, and here is the sentence that decides real
// outcomes, straight from the Policies and Implementations manual: when
// traffic matches a rule in a given context, that action is applied and the
// traffic is processed AGAIN at the next context. Accept means "continue the
// walk". Only accept-decisively ends it early (F5's own DevCentral overview:
// the packet is permitted and no further context processing is performed).
// Drop is silent; reject sends a TCP RST or an ICMP unreachable otherwise.
//
// Sourced behaviors engineered in:
//   - The ICMP trap, verbatim from the manual: rules for ICMP/ICMPv6 cannot
//     be created on a self IP or virtual server context, and if a rule list
//     smuggles one in, such a rule WILL BE IGNORED. This engine skips those
//     rules during vs/self-ip matching and says so.
//   - Staging: a staged policy logs its matches without affecting
//     connectivity, so the walk reports staged matches separately and the
//     disposition ignores them.
//   - Conflict and shadow detection using the system's own definitions: a
//     rule whose criteria are covered by an earlier rule with a different
//     action is conflicting, and the manual notes accept vs accept-decisively
//     count as conflicting even though both accept. Covered-with-same-action
//     is redundant.
//   - Default action: this engine only applies a default the operator
//     DECLARES (`default-action accept|drop|reject`). The ADC/Firewall mode
//     split exists (the Getting Started guide's own scenario switches modes)
//     but its per-context values are covered in the paired article; the walk
//     never invents an unspecified default.
//
// Honest v1 match subset: IPv4 addresses (single, CIDR, ranges via lists),
// ports (single, ranges), ip-protocol (tcp/udp/icmp/any), VLANs, and
// rule-list expansion. Geolocation, FQDNs, and schedules are recognized and
// reported as not-evaluated: the walk STOPS with an honest verdict rather
// than guessing past a criterion it cannot compute.
//
// Sources: BIG-IP Network Firewall: Policies and Implementations 14.1
// (context order, action-then-next-context, staging, management port,
// conflicting/redundant definitions, the ICMP restriction), the F5
// DevCentral AFM introduction (accept-decisively semantics, reject's
// RST-or-unreachable), all accessed 2026-07-03.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FwAction = "accept" | "accept-decisively" | "drop" | "reject";
export type ContextKind = "global" | "route-domain" | "virtual" | "self-ip";

export interface FwRule {
  name: string;
  action: FwAction;
  protocol: string; // "tcp" | "udp" | "icmp" | "icmpv6" | "any" | other
  srcAddrs: string[]; // CIDR/single tokens; empty = any
  srcPorts: string[]; // "443" | "1000-2000"; empty = any
  dstAddrs: string[];
  dstPorts: string[];
  vlans: string[];
  fromRuleList?: string;
  unsupported: string[]; // criteria present but outside the evaluated subset
}

export interface ContextDecl {
  kind: ContextKind;
  name: string; // "" for global
  policy: string;
  staged: boolean;
}

export interface Packet {
  src: string;
  srcPort: number | null;
  dst: string;
  dstPort: number | null;
  proto: string;
  vlan?: string;
}

export interface WalkStep {
  context: string;
  policy: string;
  staged: boolean;
  matchedRule?: string;
  action?: FwAction;
  skippedIcmpRules: string[];
  notes: string[];
  disposition: "continue" | "terminated" | "no-match" | "indeterminate";
}

export interface RuleFinding {
  kind: "conflicting" | "redundant";
  rule: string;
  earlier: string;
  note: string;
}

export interface AfmResult {
  ok: boolean;
  mode: "walk" | "policy" | "contexts" | "actions";
  steps?: WalkStep[];
  finalDisposition?: string;
  policyName?: string;
  rules?: FwRule[];
  findings?: RuleFinding[];
  cards?: { name: string; text: string }[];
  observations: string[];
  notes: string[];
}

export type ToolRunResult = AfmResult;

// ---------------------------------------------------------------------------
// Reference cards (manual semantics, condensed faithfully)
// ---------------------------------------------------------------------------

const CONTEXT_CARDS = [
  { name: "global", text: "First in the processing order; applies to all traffic the system processes. A policy enforced here runs before anything narrower sees the packet." },
  { name: "route-domain", text: "Second: the route domain the traffic belongs to. Between the global sweep and the per-listener contexts." },
  { name: "virtual / self-ip", text: "Third and last of the policy contexts: the virtual server the packet targets, or the self IP for traffic to the system's own addresses. The manual's ICMP restriction lives here: ICMP/ICMPv6 rules cannot be created in these contexts, and one arriving via a rule list is ignored." },
  { name: "management port", text: "Processed separately from all of the above and cannot take a policy; rules are configured inline on the management context itself." },
];

const ACTION_CARDS = [
  { name: "accept", text: "The packet passes THIS context and is processed again at the next one. Accept is a ticket to the next checkpoint, not through the whole building." },
  { name: "accept-decisively", text: "The packet is permitted and no further context processing is performed (the DevCentral overview's own wording). The one action that ends the walk with a yes." },
  { name: "drop", text: "Silently discarded. The walk ends; the client hears nothing." },
  { name: "reject", text: "Discarded loudly: a TCP RST when the protocol is TCP, an ICMP unreachable otherwise." },
];

// ---------------------------------------------------------------------------
// IPv4 helpers
// ---------------------------------------------------------------------------

function ip4ToInt(ip: string): number | null {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  if (p.some((x) => x > 255)) return null;
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

function inCidr(ip: number, token: string): boolean | null {
  const t = token.trim();
  if (t === "any" || t === "0.0.0.0/0") return true;
  const cm = t.match(/^([\d.]+)\/(\d{1,2})$/);
  if (cm) {
    const base = ip4ToInt(cm[1]);
    const p = Number(cm[2]);
    if (base === null || p > 32) return null;
    const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
    return ((ip & mask) >>> 0) === ((base & mask) >>> 0);
  }
  const single = ip4ToInt(t);
  if (single !== null) return ip === single;
  return null; // named list we could not resolve, FQDN, geo...
}

function portMatch(port: number, token: string): boolean | null {
  const t = token.trim();
  if (t === "any") return true;
  const r = t.match(/^(\d+)-(\d+)$/);
  if (r) return port >= Number(r[1]) && port <= Number(r[2]);
  if (/^\d+$/.test(t)) return port === Number(t);
  return null;
}

// ---------------------------------------------------------------------------
// Parsing: a tmsh-shaped declarative input.
//   security firewall rule-list NAME { rules { R { action X ip-protocol tcp
//     source { addresses { 10.0.0.0/8 } ports { 443 } vlans { external } }
//     destination { addresses { ... } ports { ... } } } } }
//   security firewall policy NAME { rules { R { action ... } | R { rule-list NAME } } }
//   context global { policy P }
//   context route-domain 0 { policy P2 staged }
//   context virtual vs_web { policy P3 }
//   default-action drop
//   packet src 10.1.1.5:12345 dst 192.0.2.10:443 proto tcp vlan external
// Line-oriented brace parsing, same discipline as the other tmsh tools.
// ---------------------------------------------------------------------------

interface Block { header: string; children: Block[]; leaves: string[] }

function parseBlocks(text: string): Block[] {
  const root: Block = { header: "", children: [], leaves: [] };
  const stack: Block[] = [root];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line === "}") { if (stack.length > 1) stack.pop(); continue; }
    if (line.endsWith("{")) {
      const b: Block = { header: line.slice(0, -1).trim(), children: [], leaves: [] };
      stack[stack.length - 1].children.push(b);
      stack.push(b);
      continue;
    }
    stack[stack.length - 1].leaves.push(line);
  }
  return root.children;
}

function tokensOf(b: Block | undefined): string[] {
  if (!b) return [];
  const out: string[] = [];
  for (const l of b.leaves) out.push(...l.split(/\s+/));
  for (const c of b.children) out.push(c.header, ...tokensOf(c));
  return out.filter(Boolean);
}

const UNSUPPORTED_KEYS = ["geo", "country", "region", "fqdns", "schedule", "irule", "address-lists", "port-lists"];

function parseRule(b: Block, fromRuleList?: string): FwRule {
  const kv: Record<string, string> = {};
  for (const l of b.leaves) {
    const m = l.match(/^(\S+)\s+(.+)$/);
    if (m) kv[m[1]] = m[2];
  }
  const side = (name: string) => b.children.find((c) => c.header === name);
  const grab = (parent: Block | undefined, key: string) => tokensOf(parent?.children.find((c) => c.header === key));
  const src = side("source");
  const dst = side("destination");
  const unsupported: string[] = [];
  for (const p of [src, dst]) {
    for (const c of p?.children ?? []) {
      if (UNSUPPORTED_KEYS.includes(c.header)) unsupported.push(c.header);
    }
    for (const l of p?.leaves ?? []) {
      const k = l.split(/\s+/)[0];
      if (UNSUPPORTED_KEYS.includes(k)) unsupported.push(k);
    }
  }
  if (kv["schedule"]) unsupported.push("schedule");
  const action = (kv["action"] ?? "accept") as FwAction;
  return {
    name: b.header.split(/\s+/)[0],
    action: ["accept", "accept-decisively", "drop", "reject"].includes(action) ? action : "accept",
    protocol: kv["ip-protocol"] ?? "any",
    srcAddrs: grab(src, "addresses"),
    srcPorts: grab(src, "ports"),
    dstAddrs: grab(dst, "addresses"),
    dstPorts: grab(dst, "ports"),
    vlans: grab(src, "vlans"),
    fromRuleList,
    unsupported: [...new Set(unsupported)],
  };
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

type Tri = true | false | "unknown";

function matchList(fn: (t: string) => boolean | null, tokens: string[]): Tri {
  if (tokens.length === 0) return true; // any
  let sawUnknown = false;
  for (const t of tokens) {
    const r = fn(t);
    if (r === true) return true;
    if (r === null) sawUnknown = true;
  }
  return sawUnknown ? "unknown" : false;
}

function ruleMatches(rule: FwRule, pkt: Packet): { verdict: Tri; why: string[] } {
  const why: string[] = [];
  if (rule.unsupported.length > 0) {
    return { verdict: "unknown", why: [`uses ${rule.unsupported.join(", ")}: outside this tool's evaluated subset`] };
  }
  if (rule.protocol !== "any" && rule.protocol.toLowerCase() !== pkt.proto.toLowerCase()) return { verdict: false, why: ["protocol"] };
  const sIp = ip4ToInt(pkt.src)!;
  const dIp = ip4ToInt(pkt.dst)!;
  const checks: Array<[string, Tri]> = [
    ["source address", matchList((t) => inCidr(sIp, t), rule.srcAddrs)],
    ["destination address", matchList((t) => inCidr(dIp, t), rule.dstAddrs)],
    ["source port", pkt.srcPort === null ? (rule.srcPorts.length ? "unknown" : true) : matchList((t) => portMatch(pkt.srcPort!, t), rule.srcPorts)],
    ["destination port", pkt.dstPort === null ? (rule.dstPorts.length ? "unknown" : true) : matchList((t) => portMatch(pkt.dstPort!, t), rule.dstPorts)],
    ["vlan", rule.vlans.length === 0 ? true : pkt.vlan ? (rule.vlans.includes(pkt.vlan) ? true : false) : "unknown"],
  ];
  let unknown = false;
  for (const [label, v] of checks) {
    if (v === false) return { verdict: false, why: [label] };
    if (v === "unknown") { unknown = true; why.push(`${label} could not be evaluated`); }
  }
  return { verdict: unknown ? "unknown" : true, why };
}

// ---------------------------------------------------------------------------
// Conflict / redundancy detection (the manual's own definitions).
// "Covered" here means: same protocol scope and every criterion list of the
// earlier rule is a superset-or-any of the later rule's, in the evaluated
// subset. Deliberately conservative: unknown coverage is not reported.
// ---------------------------------------------------------------------------

function covers(a: string[], b: string[]): boolean {
  if (a.length === 0) return true; // any covers everything
  if (b.length === 0) return false;
  // token containment for singles/CIDRs: every b token inside some a token
  const cidrParts = (t: string): { base: number; prefix: number } | null => {
    const m = t.match(/^([\d.]+)(?:\/(\d{1,2}))?$/);
    if (!m) return null;
    const base = ip4ToInt(m[1]);
    const prefix = m[2] !== undefined ? Number(m[2]) : 32;
    if (base === null || prefix > 32) return null;
    return { base, prefix };
  };
  return b.every((bt) => a.some((at) => {
    if (at === bt || at === "any" || at === "0.0.0.0/0") return true;
    const A = cidrParts(at);
    const B = cidrParts(bt);
    if (!A || !B) return false; // named lists etc.: conservatively not covered
    if (A.prefix > B.prefix) return false; // a narrower earlier rule cannot cover a wider later one
    const mask = A.prefix === 0 ? 0 : (0xffffffff << (32 - A.prefix)) >>> 0;
    return ((A.base & mask) >>> 0) === ((B.base & mask) >>> 0);
  }));
}

function detectFindings(rules: FwRule[]): RuleFinding[] {
  const out: RuleFinding[] = [];
  for (let i = 0; i < rules.length; i++) {
    for (let j = 0; j < i; j++) {
      const later = rules[i], earlier = rules[j];
      if (earlier.unsupported.length || later.unsupported.length) continue;
      const protoCovered = earlier.protocol === "any" || earlier.protocol === later.protocol;
      if (!protoCovered) continue;
      const covered = covers(earlier.srcAddrs, later.srcAddrs) && covers(earlier.dstAddrs, later.dstAddrs)
        && covers(earlier.srcPorts, later.srcPorts) && covers(earlier.dstPorts, later.dstPorts)
        && covers(earlier.vlans.length ? earlier.vlans : [], later.vlans.length ? later.vlans : []);
      if (!covered) continue;
      if (earlier.action === later.action) {
        out.push({ kind: "redundant", rule: later.name, earlier: earlier.name, note: `${later.name} is fully covered by ${earlier.name} with the same action; the manual's Redundant state.` });
      } else {
        const ad = (earlier.action === "accept" && later.action === "accept-decisively") || (earlier.action === "accept-decisively" && later.action === "accept");
        out.push({ kind: "conflicting", rule: later.name, earlier: earlier.name, note: `${later.name} is covered by ${earlier.name} but carries a different action (${later.action} vs ${earlier.action})${ad ? "; the manual notes accept and accept-decisively are treated as conflicting even though both accept" : ""}. ${earlier.name} matches first, so ${later.name} never fires.` });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// run()
// ---------------------------------------------------------------------------

const CONTEXT_ORDER: ContextKind[] = ["global", "route-domain", "virtual", "self-ip"];

export function run(input: string): AfmResult {
  const text = (input ?? "").trim();
  if (!text) {
    throw new Error('Paste contexts + policies + a packet line for the walk, a single `security firewall policy` for the audit, or "contexts" / "actions" for the reference cards.');
  }
  if (/^contexts$/i.test(text)) return { ok: true, mode: "contexts", cards: CONTEXT_CARDS, observations: [], notes: ["Order per the Policies and Implementations manual: global, route domain, then virtual server or self IP; management port separate."] };
  if (/^actions$/i.test(text)) return { ok: true, mode: "actions", cards: ACTION_CARDS, observations: [], notes: ["Accept continues to the next context (the manual's processed-again-at-the-next-context sentence); only accept-decisively ends the walk."] };

  const blocks = parseBlocks(text);
  const ruleLists = new Map<string, FwRule[]>();
  const policies = new Map<string, FwRule[]>();
  const contexts: ContextDecl[] = [];
  let defaultAction: FwAction | null = null;
  let pkt: Packet | null = null;
  const notes: string[] = [];

  // packet + default-action can appear as bare lines
  for (const line of text.split("\n").map((l) => l.trim())) {
    const pm = line.match(/^packet\s+src\s+([\d.]+)(?::(\d+))?\s+dst\s+([\d.]+)(?::(\d+))?\s+proto\s+(\S+)(?:\s+vlan\s+(\S+))?$/i);
    if (pm) {
      if (ip4ToInt(pm[1]) === null || ip4ToInt(pm[3]) === null) throw new Error("packet: src/dst must be IPv4 addresses.");
      pkt = { src: pm[1], srcPort: pm[2] ? Number(pm[2]) : null, dst: pm[3], dstPort: pm[4] ? Number(pm[4]) : null, proto: pm[5].toLowerCase(), vlan: pm[6] };
    }
    const dm = line.match(/^default-action\s+(accept|drop|reject)$/i);
    if (dm) defaultAction = dm[1].toLowerCase() as FwAction;
  }

  for (const b of blocks) {
    const h = b.header;
    let m;
    if ((m = h.match(/^security\s+firewall\s+rule-list\s+(\S+)$/))) {
      const rulesB = b.children.find((c) => c.header === "rules");
      ruleLists.set(m[1], (rulesB?.children ?? []).map((r) => parseRule(r, m![1])));
    } else if ((m = h.match(/^security\s+firewall\s+policy\s+(\S+)$/))) {
      const rulesB = b.children.find((c) => c.header === "rules");
      const rules: FwRule[] = [];
      for (const r of rulesB?.children ?? []) {
        const rl = r.leaves.map((l) => l.match(/^rule-list\s+(\S+)$/)).find(Boolean);
        if (rl) {
          const expanded = ruleLists.get(rl[1]);
          if (!expanded) throw new Error(`policy ${m[1]}: rule-list ${rl[1]} is referenced but not defined in the paste. Include its stanza (order matters: define rule-lists before policies).`);
          rules.push(...expanded);
        } else {
          rules.push(parseRule(r));
        }
      }
      policies.set(m[1], rules);
    } else if ((m = h.match(/^context\s+(global|route-domain|virtual|self-ip)(?:\s+(\S+))?$/))) {
      const polLeaf = b.leaves.find((l) => l.startsWith("policy "));
      if (!polLeaf) throw new Error(`context ${m[1]}${m[2] ? " " + m[2] : ""}: missing "policy NAME" line.`);
      contexts.push({ kind: m[1] as ContextKind, name: m[2] ?? "", policy: polLeaf.split(/\s+/)[1], staged: b.leaves.some((l) => l === "staged") });
    }
  }

  // ---- policy-only audit mode -------------------------------------------------
  if (!pkt && contexts.length === 0 && policies.size === 1) {
    const [name, rules] = [...policies.entries()][0];
    const findings = detectFindings(rules);
    const observations: string[] = [];
    for (const r of rules) {
      if ((r.protocol === "icmp" || r.protocol === "icmpv6")) observations.push(`Rule ${r.name} matches ${r.protocol}: remember the manual's restriction, on a virtual server or self IP context such a rule is ignored; ICMP rules belong at global or route-domain.`);
      if (r.unsupported.length) observations.push(`Rule ${r.name} uses ${r.unsupported.join(", ")}: recognized, reported, not evaluated by this tool.`);
    }
    return { ok: true, mode: "policy", policyName: name, rules, findings, observations, notes };
  }

  // ---- full walk ----------------------------------------------------------------------
  if (!pkt) throw new Error("No packet line found. Add: packet src A.B.C.D[:port] dst E.F.G.H[:port] proto tcp|udp|icmp [vlan NAME]");
  if (contexts.length === 0) throw new Error("No context declarations found. Add lines like: context global { policy P1 }");
  const hasV = contexts.some((c) => c.kind === "virtual");
  const hasS = contexts.some((c) => c.kind === "self-ip");
  if (hasV && hasS) throw new Error("Both a virtual and a self-ip context are declared, but a packet traverses one or the other. Keep the one this packet targets.");

  const ordered = CONTEXT_ORDER.flatMap((k) => contexts.filter((c) => c.kind === k));
  const steps: WalkStep[] = [];
  let final: string | null = null;
  const observations: string[] = [];

  for (const ctx of ordered) {
    const rules = policies.get(ctx.policy);
    if (!rules) throw new Error(`context ${ctx.kind} ${ctx.name}: policy ${ctx.policy} not defined in the paste.`);
    const label = ctx.kind + (ctx.name ? ` ${ctx.name}` : "");
    const step: WalkStep = { context: label, policy: ctx.policy, staged: ctx.staged, skippedIcmpRules: [], notes: [], disposition: "no-match" };
    const isEdge = ctx.kind === "virtual" || ctx.kind === "self-ip";

    for (const r of rules) {
      if (isEdge && (r.protocol === "icmp" || r.protocol === "icmpv6")) {
        step.skippedIcmpRules.push(r.name);
        continue; // the manual: such a rule will be ignored
      }
      const m = ruleMatches(r, pkt);
      if (m.verdict === "unknown") {
        step.matchedRule = r.name;
        step.disposition = "indeterminate";
        step.notes.push(`Rule ${r.name}: ${m.why.join("; ")}. The walk stops honestly here rather than guessing past a criterion it cannot compute.`);
        final = `indeterminate at ${label} (rule ${r.name})`;
        break;
      }
      if (m.verdict === true) {
        step.matchedRule = r.name;
        step.action = r.action;
        if (ctx.staged) {
          step.notes.push(`STAGED match: the manual's staging semantics, the match is logged but connectivity is unaffected; the walk continues as if this policy were absent.`);
          step.disposition = "continue";
        } else if (r.action === "accept") {
          step.disposition = "continue";
          step.notes.push("accept: this context is passed and the traffic is processed again at the next context (the manual's own sentence).");
        } else if (r.action === "accept-decisively") {
          step.disposition = "terminated";
          final = `PERMITTED at ${label} by ${r.name} (accept-decisively): no further context processing is performed.`;
          if (isEdge) step.notes.push("accept-decisively at the last policy context: same outcome as accept here; its distinctive skip-ahead power matters at global and route-domain.");
        } else {
          step.disposition = "terminated";
          final = r.action === "drop"
            ? `DROPPED at ${label} by ${r.name}: silent discard.`
            : `REJECTED at ${label} by ${r.name}: ${pkt.proto === "tcp" ? "TCP RST returned" : "ICMP unreachable returned"}.`;
        }
        break;
      }
    }
    if (step.skippedIcmpRules.length) {
      step.notes.push(`ICMP/ICMPv6 rule(s) ${step.skippedIcmpRules.join(", ")} skipped: the manual states such rules on a ${ctx.kind} context are ignored (arrive via rule list or not).`);
    }
    if (step.disposition === "no-match") step.notes.push(ctx.staged ? "Staged policy, no match: nothing logged, nothing affected." : "No rule matched in this context; the walk continues.");
    steps.push(step);
    if (final && step.disposition !== "continue" && step.disposition !== "no-match") break;
  }

  if (!final) {
    if (defaultAction) {
      final = defaultAction === "accept"
        ? "No terminal match in any context: the declared default-action accept permits the traffic."
        : `No terminal match in any context: the declared default-action ${defaultAction} disposes of it.`;
    } else {
      final = "No terminal match in any context, and no default-action declared: the disposition falls to the box's Default Firewall Action (ADC vs Firewall mode); declare `default-action accept|drop|reject` to resolve the walk, or see the paired article for the mode split.";
    }
  }
  observations.push("Order walked per the manual: global, then route domain, then the virtual server or self IP context; management port rules are processed separately and take no policies.");

  return { ok: true, mode: "walk", steps, finalDisposition: final, observations, notes };
}
