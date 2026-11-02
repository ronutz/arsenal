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

import { say, listOf, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (2026-11-02)

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

/** One context of the walk. S is string in the API's reading, EngineText in the page's. */
export interface WalkStep<S = string> {
  context: string;
  policy: string;
  staged: boolean;
  matchedRule?: string;
  action?: FwAction;
  skippedIcmpRules: string[];
  notes: S[];
  disposition: "continue" | "terminated" | "no-match" | "indeterminate";
}

/** A conflicting or redundant rule. S as above. */
export interface RuleFinding<S = string> {
  kind: "conflicting" | "redundant";
  rule: string;
  earlier: string;
  note: S;
}

/** The whole reading. S as above. */
export interface AfmResult<S = string> {
  ok: boolean;
  mode: "walk" | "policy" | "contexts" | "actions";
  steps?: WalkStep<S>[];
  finalDisposition?: S;
  policyName?: string;
  rules?: FwRule[];
  findings?: RuleFinding<S>[];
  cards?: { name: S; text: S }[];
  observations: S[];
  notes: S[];
}

export type ToolRunResult = AfmResult;

// ---------------------------------------------------------------------------
// Reference cards (manual semantics, condensed faithfully)
// ---------------------------------------------------------------------------

// PAGE LANGUAGE (2026-11-02, batch H5): the cards, notes, observations,
// findings, dispositions and errors are built as EngineTexts
// (src/lib/tools/engine-text.ts): a stable id, the English as before, and its
// values. runLocalisable() returns them as such for the page (pack keys
// tools.f5-afm-rule-context.engine.<id>); run() returns plainText() of the same
// reading, so the API and the golden vectors are unchanged byte for byte.

/** The four context cards (functions, so each reading gets its own objects; pack keys engine.card.ctx.*). */
const CONTEXT_CARDS = (): { name: EngineText; text: EngineText }[] => [
  { name: say("card.ctx.global.name", "global"), text: say("card.ctx.global.text", "First in the processing order; applies to all traffic the system processes. A policy enforced here runs before anything narrower sees the packet.") }, // global
  { name: say("card.ctx.routeDomain.name", "route-domain"), text: say("card.ctx.routeDomain.text", "Second: the route domain the traffic belongs to. Between the global sweep and the per-listener contexts.") }, // route domain
  { name: say("card.ctx.edge.name", "virtual / self-ip"), text: say("card.ctx.edge.text", "Third and last of the policy contexts: the virtual server the packet targets, or the self IP for traffic to the system's own addresses. The manual's ICMP restriction lives here: ICMP/ICMPv6 rules cannot be created in these contexts, and one arriving via a rule list is ignored.") }, // virtual or self IP
  { name: say("card.ctx.management.name", "management port"), text: say("card.ctx.management.text", "Processed separately from all of the above and cannot take a policy; rules are configured inline on the management context itself.") }, // management port
];

/** The four action cards (pack keys engine.card.act.*; the names are the actions as tmsh writes them). */
const ACTION_CARDS = (): { name: EngineText; text: EngineText }[] => [
  { name: say("card.act.accept.name", "accept"), text: say("card.act.accept.text", "The packet passes THIS context and is processed again at the next one. Accept is a ticket to the next checkpoint, not through the whole building.") }, // accept
  { name: say("card.act.acceptDecisively.name", "accept-decisively"), text: say("card.act.acceptDecisively.text", "The packet is permitted and no further context processing is performed (the DevCentral overview's own wording). The one action that ends the walk with a yes.") }, // accept-decisively
  { name: say("card.act.drop.name", "drop"), text: say("card.act.drop.text", "Silently discarded. The walk ends; the client hears nothing.") }, // drop
  { name: say("card.act.reject.name", "reject"), text: say("card.act.reject.text", "Discarded loudly: a TCP RST when the protocol is TCP, an ICMP unreachable otherwise.") }, // reject
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

/** The criteria a rule is checked on, as the walk names them when one cannot be evaluated (pack keys engine.crit.*). */
const CRITERION: Record<string, () => EngineText> = {
  "source address": () => say("crit.srcAddr", "source address"), // source address
  "destination address": () => say("crit.dstAddr", "destination address"), // destination address
  "source port": () => say("crit.srcPort", "source port"), // source port
  "destination port": () => say("crit.dstPort", "destination port"), // destination port
  vlan: () => say("crit.vlan", "vlan"), // VLAN
};

/**
 * Whether a rule matches the packet, and why not when it cannot tell.
 * @param rule the rule
 * @param pkt the packet
 * @returns the verdict, and the reasons as sentences (only when unknown; a "false" carries the criterion's plain name)
 */
function ruleMatches(rule: FwRule, pkt: Packet): { verdict: Tri; why: (EngineText | string)[] } {
  const why: (EngineText | string)[] = []; // the reasons
  if (rule.unsupported.length > 0) {
    return { verdict: "unknown", why: [say("why.unsupported", `uses ${rule.unsupported.join(", ")}: outside this tool's evaluated subset`, { criteria: rule.unsupported.join(", ") })] }; // pack key engine.why.unsupported
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
    if (v === "unknown") { unknown = true; why.push(say("why.notEvaluated", `${label} could not be evaluated`, { criterion: CRITERION[label]() })); } // pack key engine.why.notEvaluated
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

/**
 * Conflicting and redundant rules, by the manual's definitions.
 * @param rules the policy's rules, in order
 * @returns the findings, with their notes as sentences
 */
function detectFindings(rules: FwRule[]): RuleFinding<EngineText>[] {
  const out: RuleFinding<EngineText>[] = []; // in order
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
        out.push({ kind: "redundant", rule: later.name, earlier: earlier.name, note: say("finding.redundant", `${later.name} is fully covered by ${earlier.name} with the same action; the manual's Redundant state.`, { rule: later.name, earlier: earlier.name }) }); // pack key engine.finding.redundant
      } else {
        const ad = (earlier.action === "accept" && later.action === "accept-decisively") || (earlier.action === "accept-decisively" && later.action === "accept");
        const args = { rule: later.name, earlier: earlier.name, action: later.action, earlierAction: earlier.action }; // the pair
        out.push({ kind: "conflicting", rule: later.name, earlier: earlier.name, note: ad
          ? say("finding.conflictingAccept", `${later.name} is covered by ${earlier.name} but carries a different action (${later.action} vs ${earlier.action}); the manual notes accept and accept-decisively are treated as conflicting even though both accept. ${earlier.name} matches first, so ${later.name} never fires.`, args) // pack key engine.finding.conflictingAccept
          : say("finding.conflicting", `${later.name} is covered by ${earlier.name} but carries a different action (${later.action} vs ${earlier.action}). ${earlier.name} matches first, so ${later.name} never fires.`, args) }); // pack key engine.finding.conflicting
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// run()
// ---------------------------------------------------------------------------

const CONTEXT_ORDER: ContextKind[] = ["global", "route-domain", "virtual", "self-ip"];

/**
 * The API's reading (and the golden vectors'): the same as runLocalisable(), every sentence as its English.
 * @param input contexts, policies and a packet line; a single policy; or "contexts" / "actions"
 * @returns the reading
 */
export function run(input: string): AfmResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English
} // run

/**
 * The page's reading: the same as run(), with every sentence an EngineText (id, English, values).
 * @param input contexts, policies and a packet line; a single policy; or "contexts" / "actions"
 * @returns the reading
 */
export function runLocalisable(input: string): AfmResult<EngineText> {
  const text = (input ?? "").trim();
  if (!text) {
    throw engineError(say("err.empty", 'Paste contexts + policies + a packet line for the walk, a single `security firewall policy` for the audit, or "contexts" / "actions" for the reference cards.')); // pack key engine.err.empty
  }
  if (/^contexts$/i.test(text)) return { ok: true, mode: "contexts", cards: CONTEXT_CARDS(), observations: [], notes: [say("note.contexts", "Order per the Policies and Implementations manual: global, route domain, then virtual server or self IP; management port separate.")] }; // pack key engine.note.contexts
  if (/^actions$/i.test(text)) return { ok: true, mode: "actions", cards: ACTION_CARDS(), observations: [], notes: [say("note.actions", "Accept continues to the next context (the manual's processed-again-at-the-next-context sentence); only accept-decisively ends the walk.")] }; // pack key engine.note.actions

  const blocks = parseBlocks(text);
  const ruleLists = new Map<string, FwRule[]>();
  const policies = new Map<string, FwRule[]>();
  const contexts: ContextDecl[] = [];
  let defaultAction: FwAction | null = null;
  let pkt: Packet | null = null;
  const notes: EngineText[] = []; // none today; kept for the reading's shape

  // packet + default-action can appear as bare lines
  for (const line of text.split("\n").map((l) => l.trim())) {
    const pm = line.match(/^packet\s+src\s+([\d.]+)(?::(\d+))?\s+dst\s+([\d.]+)(?::(\d+))?\s+proto\s+(\S+)(?:\s+vlan\s+(\S+))?$/i);
    if (pm) {
      if (ip4ToInt(pm[1]) === null || ip4ToInt(pm[3]) === null) throw engineError(say("err.packetIp", "packet: src/dst must be IPv4 addresses.")); // pack key engine.err.packetIp
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
          if (!expanded) throw engineError(say("err.ruleList", `policy ${m[1]}: rule-list ${rl[1]} is referenced but not defined in the paste. Include its stanza (order matters: define rule-lists before policies).`, { policy: m[1], ruleList: rl[1] })); // pack key engine.err.ruleList
          rules.push(...expanded);
        } else {
          rules.push(parseRule(r));
        }
      }
      policies.set(m[1], rules);
    } else if ((m = h.match(/^context\s+(global|route-domain|virtual|self-ip)(?:\s+(\S+))?$/))) {
      const polLeaf = b.leaves.find((l) => l.startsWith("policy "));
      if (!polLeaf) throw engineError(say("err.noPolicyLine", `context ${m[1]}${m[2] ? " " + m[2] : ""}: missing "policy NAME" line.`, { context: `${m[1]}${m[2] ? " " + m[2] : ""}` })); // pack key engine.err.noPolicyLine
      contexts.push({ kind: m[1] as ContextKind, name: m[2] ?? "", policy: polLeaf.split(/\s+/)[1], staged: b.leaves.some((l) => l === "staged") });
    }
  }

  // ---- policy-only audit mode -------------------------------------------------
  if (!pkt && contexts.length === 0 && policies.size === 1) {
    const [name, rules] = [...policies.entries()][0];
    const findings = detectFindings(rules);
    const observations: EngineText[] = []; // in order
    for (const r of rules) {
      if ((r.protocol === "icmp" || r.protocol === "icmpv6")) observations.push(say("obs.icmpRule", `Rule ${r.name} matches ${r.protocol}: remember the manual's restriction, on a virtual server or self IP context such a rule is ignored; ICMP rules belong at global or route-domain.`, { rule: r.name, protocol: r.protocol })); // pack key engine.obs.icmpRule
      if (r.unsupported.length) observations.push(say("obs.unsupported", `Rule ${r.name} uses ${r.unsupported.join(", ")}: recognised, reported, not evaluated by this tool.`, { rule: r.name, criteria: r.unsupported.join(", ") })); // pack key engine.obs.unsupported
    }
    return { ok: true, mode: "policy", policyName: name, rules, findings, observations, notes };
  }

  // ---- full walk ----------------------------------------------------------------------
  if (!pkt) throw engineError(say("err.noPacket", "No packet line found. Add: packet src A.B.C.D[:port] dst E.F.G.H[:port] proto tcp|udp|icmp [vlan NAME]")); // pack key engine.err.noPacket
  if (contexts.length === 0) throw engineError(say("err.noContexts", "No context declarations found. Add lines like: context global { policy P1 }")); // pack key engine.err.noContexts
  const hasV = contexts.some((c) => c.kind === "virtual");
  const hasS = contexts.some((c) => c.kind === "self-ip");
  if (hasV && hasS) throw engineError(say("err.bothEdges", "Both a virtual and a self-ip context are declared, but a packet traverses one or the other. Keep the one this packet targets.")); // pack key engine.err.bothEdges

  const ordered = CONTEXT_ORDER.flatMap((k) => contexts.filter((c) => c.kind === k));
  const steps: WalkStep<EngineText>[] = []; // the walk
  let final: EngineText | null = null; // the disposition, once known
  const observations: EngineText[] = []; // in order

  for (const ctx of ordered) {
    const rules = policies.get(ctx.policy);
    if (!rules) throw engineError(say("err.policyUndefined", `context ${ctx.kind} ${ctx.name}: policy ${ctx.policy} not defined in the paste.`, { kind: ctx.kind, name: ctx.name, policy: ctx.policy })); // pack key engine.err.policyUndefined
    const label = ctx.kind + (ctx.name ? ` ${ctx.name}` : "");
    const step: WalkStep<EngineText> = { context: label, policy: ctx.policy, staged: ctx.staged, skippedIcmpRules: [], notes: [], disposition: "no-match" }; // this context
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
        const why = listOf(m.why.filter((w): w is EngineText => typeof w !== "string"), "; "); // the reasons, as one value
        step.notes.push(say("note.stops", `Rule ${r.name}: ${m.why.join("; ")}. The walk stops honestly here rather than guessing past a criterion it cannot compute.`, { rule: r.name, reasons: why })); // pack key engine.note.stops
        final = say("final.indeterminate", `indeterminate at ${label} (rule ${r.name})`, { context: label, rule: r.name }); // pack key engine.final.indeterminate
        break;
      }
      if (m.verdict === true) {
        step.matchedRule = r.name;
        step.action = r.action;
        if (ctx.staged) {
          step.notes.push(say("note.staged", "STAGED match: the manual's staging semantics, the match is logged but connectivity is unaffected; the walk continues as if this policy were absent.")); // pack key engine.note.staged
          step.disposition = "continue";
        } else if (r.action === "accept") {
          step.disposition = "continue";
          step.notes.push(say("note.accept", "accept: this context is passed and the traffic is processed again at the next context (the manual's own sentence).")); // pack key engine.note.accept
        } else if (r.action === "accept-decisively") {
          step.disposition = "terminated";
          final = say("final.permitted", `PERMITTED at ${label} by ${r.name} (accept-decisively): no further context processing is performed.`, { context: label, rule: r.name }); // pack key engine.final.permitted
          if (isEdge) step.notes.push(say("note.decisivelyAtEdge", "accept-decisively at the last policy context: same outcome as accept here; its distinctive skip-ahead power matters at global and route-domain.")); // pack key engine.note.decisivelyAtEdge
        } else {
          step.disposition = "terminated";
          final = r.action === "drop"
            ? say("final.dropped", `DROPPED at ${label} by ${r.name}: silent discard.`, { context: label, rule: r.name }) // pack key engine.final.dropped
            : pkt.proto === "tcp"
              ? say("final.rejectedTcp", `REJECTED at ${label} by ${r.name}: TCP RST returned.`, { context: label, rule: r.name }) // pack key engine.final.rejectedTcp
              : say("final.rejectedIcmp", `REJECTED at ${label} by ${r.name}: ICMP unreachable returned.`, { context: label, rule: r.name }); // pack key engine.final.rejectedIcmp
        }
        break;
      }
    }
    if (step.skippedIcmpRules.length) {
      step.notes.push(say("note.icmpSkipped", `ICMP/ICMPv6 rule(s) ${step.skippedIcmpRules.join(", ")} skipped: the manual states such rules on a ${ctx.kind} context are ignored (arrive via rule list or not).`, { rules: step.skippedIcmpRules.join(", "), kind: ctx.kind })); // pack key engine.note.icmpSkipped
    }
    if (step.disposition === "no-match") step.notes.push(ctx.staged ? say("note.stagedNoMatch", "Staged policy, no match: nothing logged, nothing affected.") : say("note.noMatch", "No rule matched in this context; the walk continues.")); // pack keys engine.note.stagedNoMatch / noMatch
    steps.push(step);
    if (final && step.disposition !== "continue" && step.disposition !== "no-match") break;
  }

  if (!final) {
    if (defaultAction) {
      final = defaultAction === "accept"
        ? say("final.defaultAccept", "No terminal match in any context: the declared default-action accept permits the traffic.") // pack key engine.final.defaultAccept
        : say("final.defaultOther", `No terminal match in any context: the declared default-action ${defaultAction} disposes of it.`, { action: defaultAction }); // pack key engine.final.defaultOther
    } else {
      final = say("final.noDefault", "No terminal match in any context, and no default-action declared: the disposition falls to the box's Default Firewall Action (ADC vs Firewall mode); declare `default-action accept|drop|reject` to resolve the walk, or see the paired article for the mode split."); // pack key engine.final.noDefault
    }
  }
  observations.push(say("obs.order", "Order walked per the manual: global, then route domain, then the virtual server or self IP context; management port rules are processed separately and take no policies.")); // pack key engine.obs.order

  return { ok: true, mode: "walk", steps, finalDisposition: final, observations, notes };
}
