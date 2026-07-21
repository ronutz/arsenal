// ============================================================================
// src/lib/tools/zscaler-firewall-rule-order-simulator/compute.ts
// ----------------------------------------------------------------------------
// THE ZIA FIREWALL RULE-ORDER SIMULATOR ENGINE.
//
// Teaches the one sentence that governs the ZIA Cloud Firewall (live-verified
// 2026-07-21 against Zscaler's Firewall Filtering documentation): rules are
// evaluated in ASCENDING numerical order and evaluation STOPS at the first
// match. The engine also encodes the documented surroundings of that
// sentence:
//   * a criterion left unset means Any, and Any is ignored in evaluation;
//   * a DISABLED rule is not enforced but KEEPS its place in the order -
//     the service skips it and moves to the next rule;
//   * the undeletable Default Firewall Filtering Rule sits at the lowest
//     precedence and, out of the box, BLOCKS all traffic (deny-by-default);
//     only its action is editable;
//   * actions: allow, silent block (drop), block with client notification
//     (the ICMP-error flavor).
//
// The rule grammar is a deliberately small TEACHING SUBSET of ZIA's criteria
// (protocol, ports, source, destination). Real Firewall Filtering rules add
// users, groups, departments, locations, network applications, countries,
// device trust, and time windows; the ordering semantics taught here apply
// to all of them identically. The shadowing analysis is PAIRWISE ONLY: a
// rule jointly covered by several earlier rules together (but by none
// alone) is not flagged - stated here and in the tool doc rather than
// silently pretended otherwise.
//
// Grammar (one rule per line):
//   <order> | <name> | allow|block|block-icmp | [tokens...]
// tokens: proto=tcp|udp|icmp|any  port=443,8000-8100|any
//         dest=<ip|cidr|any>      src=<ip|cidr|any>      disabled
// Optional lines anywhere:
//   default: allow|block            (the Default rule's action; block if absent)
//   flow: proto=tcp port=8443 dest=203.0.113.7 src=10.0.0.5
//
// Pure and local: nothing evaluated, nothing contacted (D-19 throughout).
// ============================================================================

/** Actions in the documented verb set. */
export type RuleAction = "allow" | "block" | "block-icmp";

/** A parsed rule (the teaching subset of ZIA's criteria dimensions). */
export interface FwRule {
  order: number;
  name: string;
  action: RuleAction;
  proto: "tcp" | "udp" | "icmp" | "any";
  /** Port ranges [lo, hi]; empty array = any. Ignored for proto icmp/any-flow matching only when empty. */
  ports: Array<[number, number]>;
  /** Destination CIDR as [base, prefix]; null = any. */
  dest: [number, number] | null;
  /** Source CIDR as [base, prefix]; null = any. */
  src: [number, number] | null;
  disabled: boolean;
  /** Raw line, for display. */
  raw: string;
}

/** A flow to trace through the policy. */
export interface FwFlow {
  proto: "tcp" | "udp" | "icmp";
  port: number | null;
  dest: number | null; // IPv4 as uint32
  src: number | null;
  raw: string;
}

/** One row of the evaluation trace. */
export interface TraceRow {
  order: number;
  name: string;
  outcome: "skipped-disabled" | "no-match" | "match";
  /** For no-match: the first criterion that failed (teaching detail). */
  failedOn?: "proto" | "port" | "dest" | "src";
  action?: RuleAction;
}

/** A pairwise shadowing finding. */
export interface ShadowFinding {
  shadowed: { order: number; name: string };
  by: { order: number; name: string };
  reason: string;
}

export interface SimResult {
  rules: FwRule[]; // sorted ascending
  defaultAction: "allow" | "block";
  defaultActionExplicit: boolean;
  trace: TraceRow[] | null;
  verdict: { source: "rule" | "default"; order?: number; name: string; action: RuleAction | "allow" | "block" } | null;
  shadows: ShadowFinding[];
  notes: string[];
}

// ---------------------------------------------------------------------------
// Parsing helpers - every throw is a helpful, line-anchored error.
// ---------------------------------------------------------------------------

/** Parse a dotted IPv4 to uint32; throw with the offending text on failure. */
function parseIp(s: string, where: string): number {
  const m = s.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) throw new Error(`${where}: "${s}" is not a dotted IPv4 address.`);
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) throw new Error(`${where}: "${s}" has an octet above 255.`);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/** Parse ip or ip/prefix into [base-masked, prefix]; "any" -> null. */
function parseCidr(s: string, where: string): [number, number] | null {
  const t = s.trim().toLowerCase();
  if (t === "any") return null;
  const [ip, pfx] = t.split("/");
  const prefix = pfx === undefined ? 32 : Number(pfx);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32)
    throw new Error(`${where}: "/${pfx}" is not a prefix length between 0 and 32.`);
  const base = parseIp(ip, where);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return [(base & mask) >>> 0, prefix];
}

/** Parse "443,8000-8100" into ranges; "any" -> []. */
function parsePorts(s: string, where: string): Array<[number, number]> {
  const t = s.trim().toLowerCase();
  if (t === "any") return [];
  const ranges: Array<[number, number]> = [];
  for (const piece of t.split(",")) {
    const m = piece.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) throw new Error(`${where}: "${piece}" is not a port or port range.`);
    const lo = Number(m[1]);
    const hi = m[2] === undefined ? lo : Number(m[2]);
    if (lo < 1 || hi > 65535 || lo > hi)
      throw new Error(`${where}: "${piece}" is outside 1-65535 or reversed.`);
    ranges.push([lo, hi]);
  }
  return ranges;
}

/** Does CIDR a (or any=null) fully contain CIDR b? Used by matching and shadowing. */
function cidrContains(a: [number, number] | null, b: [number, number] | null): boolean {
  if (a === null) return true; // any contains everything
  if (b === null) return false; // something specific cannot contain any
  const [abase, apfx] = a;
  const [bbase, bpfx] = b;
  if (bpfx < apfx) return false; // b is wider than a
  const mask = apfx === 0 ? 0 : (0xffffffff << (32 - apfx)) >>> 0;
  return ((bbase & mask) >>> 0) === abase;
}

/** Does an address sit inside a CIDR (null = any)? */
function cidrMatches(c: [number, number] | null, addr: number | null): boolean {
  if (c === null) return true; // any: criterion ignored, per the documented convention
  if (addr === null) return false; // rule is specific but the flow did not say
  const [base, pfx] = c;
  const mask = pfx === 0 ? 0 : (0xffffffff << (32 - pfx)) >>> 0;
  return ((addr & mask) >>> 0) === base;
}

/** Do port ranges a (empty=any) fully cover ranges b? */
function portsContain(a: Array<[number, number]>, b: Array<[number, number]>): boolean {
  if (a.length === 0) return true;
  if (b.length === 0) return false;
  // Every b-range must sit inside SOME single a-range (ranges here are small teaching sets).
  return b.every(([blo, bhi]) => a.some(([alo, ahi]) => alo <= blo && bhi <= ahi));
}

/** Does a port list (empty=any) match a single flow port? */
function portsMatch(a: Array<[number, number]>, port: number | null): boolean {
  if (a.length === 0) return true;
  if (port === null) return false;
  return a.some(([lo, hi]) => lo <= port && port <= hi);
}

// ---------------------------------------------------------------------------
// The parser: rules + optional default: + optional flow: lines.
// ---------------------------------------------------------------------------

export interface ParsedInput {
  rules: FwRule[];
  defaultAction: "allow" | "block";
  defaultActionExplicit: boolean;
  flow: FwFlow | null;
}

export function parseInput(text: string): ParsedInput {
  const rules: FwRule[] = [];
  let flow: FwFlow | null = null;
  let defaultAction: "allow" | "block" = "block"; // the documented out-of-the-box disposition
  let defaultActionExplicit = false;
  const seenOrders = new Map<number, string>();

  const lines = text.split(/\r?\n/);
  if (lines.every((l) => l.trim() === "" || l.trim().startsWith("#")))
    throw new Error("Paste at least one rule line: <order> | <name> | allow|block|block-icmp | criteria...");

  lines.forEach((line, i) => {
    const t = line.trim();
    const where = `Line ${i + 1}`;
    if (t === "" || t.startsWith("#")) return;

    // -- default: allow|block --------------------------------------------
    const dm = t.match(/^default\s*:\s*(allow|block)$/i);
    if (dm) {
      defaultAction = dm[1].toLowerCase() as "allow" | "block";
      defaultActionExplicit = true;
      return;
    }

    // -- flow: token line -------------------------------------------------
    const fm = t.match(/^flow\s*:\s*(.+)$/i);
    if (fm) {
      const f: FwFlow = { proto: "tcp", port: null, dest: null, src: null, raw: t };
      let protoSeen = false;
      for (const tok of fm[1].trim().split(/\s+/)) {
        const [k, v] = tok.split("=");
        if (v === undefined) throw new Error(`${where}: flow token "${tok}" is not key=value.`);
        switch (k.toLowerCase()) {
          case "proto": {
            const p = v.toLowerCase();
            if (p !== "tcp" && p !== "udp" && p !== "icmp")
              throw new Error(`${where}: flow proto must be tcp, udp, or icmp.`);
            f.proto = p;
            protoSeen = true;
            break;
          }
          case "port": {
            const n = Number(v);
            if (!Number.isInteger(n) || n < 1 || n > 65535)
              throw new Error(`${where}: flow port "${v}" is outside 1-65535.`);
            f.port = n;
            break;
          }
          case "dest":
            f.dest = parseIp(v, where);
            break;
          case "src":
            f.src = parseIp(v, where);
            break;
          default:
            throw new Error(`${where}: unknown flow token "${k}".`);
        }
      }
      if (!protoSeen) throw new Error(`${where}: the flow needs proto=tcp|udp|icmp.`);
      flow = f;
      return;
    }

    // -- rule line ---------------------------------------------------------
    const parts = t.split("|").map((p) => p.trim());
    if (parts.length < 3)
      throw new Error(`${where}: a rule needs <order> | <name> | <action> [| criteria].`);
    const order = Number(parts[0]);
    if (!Number.isInteger(order) || order < 1)
      throw new Error(`${where}: rule order "${parts[0]}" must be a positive integer.`);
    if (seenOrders.has(order))
      throw new Error(
        `${where}: rule order ${order} is already used by "${seenOrders.get(order)}" - ZIA assigns each rule a unique position.`,
      );
    const name = parts[1] || `rule-${order}`;
    const actionRaw = parts[2].toLowerCase();
    if (actionRaw !== "allow" && actionRaw !== "block" && actionRaw !== "block-icmp")
      throw new Error(`${where}: action "${parts[2]}" must be allow, block, or block-icmp.`);

    const rule: FwRule = {
      order,
      name,
      action: actionRaw as RuleAction,
      proto: "any",
      ports: [],
      dest: null,
      src: null,
      disabled: false,
      raw: t,
    };
    const critText = parts.slice(3).join(" ");
    for (const tok of critText.split(/\s+/).filter(Boolean)) {
      if (tok.toLowerCase() === "disabled") {
        rule.disabled = true;
        continue;
      }
      const [k, v] = tok.split("=");
      if (v === undefined) throw new Error(`${where}: criterion "${tok}" is not key=value (or "disabled").`);
      switch (k.toLowerCase()) {
        case "proto": {
          const p = v.toLowerCase();
          if (p !== "tcp" && p !== "udp" && p !== "icmp" && p !== "any")
            throw new Error(`${where}: proto must be tcp, udp, icmp, or any.`);
          rule.proto = p;
          break;
        }
        case "port":
          rule.ports = parsePorts(v, where);
          break;
        case "dest":
          rule.dest = parseCidr(v, where);
          break;
        case "src":
          rule.src = parseCidr(v, where);
          break;
        default:
          throw new Error(`${where}: unknown criterion "${k}".`);
      }
    }
    seenOrders.set(order, name);
    rules.push(rule);
  });

  if (rules.length === 0)
    throw new Error("No rule lines found - add at least one: <order> | <name> | allow|block|block-icmp | criteria...");

  rules.sort((a, b) => a.order - b.order); // ascending order IS the policy
  return { rules, defaultAction, defaultActionExplicit, flow };
}

// ---------------------------------------------------------------------------
// The simulator: trace + pairwise shadow analysis.
// ---------------------------------------------------------------------------

/** Match a flow against one rule, reporting the first failing criterion. */
function matchRule(rule: FwRule, flow: FwFlow): { match: boolean; failedOn?: TraceRow["failedOn"] } {
  if (rule.proto !== "any" && rule.proto !== flow.proto) return { match: false, failedOn: "proto" };
  if (!portsMatch(rule.ports, flow.port)) return { match: false, failedOn: "port" };
  if (!cidrMatches(rule.dest, flow.dest)) return { match: false, failedOn: "dest" };
  if (!cidrMatches(rule.src, flow.src)) return { match: false, failedOn: "src" };
  return { match: true };
}

/** Pairwise superset test: does A cover everything B could ever match? */
function covers(a: FwRule, b: FwRule): boolean {
  const protoOk = a.proto === "any" || a.proto === b.proto;
  return protoOk && portsContain(a.ports, b.ports) && cidrContains(a.dest, b.dest) && cidrContains(a.src, b.src);
}

export function run(text: string): SimResult {
  const { rules, defaultAction, defaultActionExplicit, flow } = parseInput(text);
  const notes: string[] = [];

  // -- Trace the flow, in ascending order, stopping at the first match. --
  let trace: TraceRow[] | null = null;
  let verdict: SimResult["verdict"] = null;
  if (flow) {
    trace = [];
    for (const r of rules) {
      if (r.disabled) {
        // Documented behavior: not enforced, keeps its place, service skips it.
        trace.push({ order: r.order, name: r.name, outcome: "skipped-disabled" });
        continue;
      }
      const m = matchRule(r, flow);
      if (m.match) {
        trace.push({ order: r.order, name: r.name, outcome: "match", action: r.action });
        verdict = { source: "rule", order: r.order, name: r.name, action: r.action };
        break; // evaluation stops at the first match
      }
      trace.push({ order: r.order, name: r.name, outcome: "no-match", failedOn: m.failedOn });
    }
    if (!verdict) {
      verdict = { source: "default", name: "Default Firewall Filtering Rule", action: defaultAction };
    }
  }

  // -- Pairwise shadow analysis over ENABLED rules. --
  const shadows: ShadowFinding[] = [];
  const enabled = rules.filter((r) => !r.disabled);
  for (let j = 1; j < enabled.length; j++) {
    for (let i = 0; i < j; i++) {
      if (covers(enabled[i], enabled[j])) {
        shadows.push({
          shadowed: { order: enabled[j].order, name: enabled[j].name },
          by: { order: enabled[i].order, name: enabled[i].name },
          reason: `Every flow rule ${enabled[j].order} could match is already matched first by rule ${enabled[i].order} - rule ${enabled[j].order} can never fire.`,
        });
        break; // first shadowing ancestor is the teaching answer
      }
    }
  }

  // -- Standing notes: the documented context the numbers live in. --
  if (!defaultActionExplicit) {
    notes.push(
      "No default: line given, so the Default Firewall Filtering Rule is simulated as BLOCK - Zscaler's out-of-the-box disposition (deny-by-default; the default rule is undeletable, lowest precedence, action editable by super admins only).",
    );
  }
  notes.push(
    "Criteria left unset mean Any, and Any is ignored during evaluation - a rule with only a port set matches that port for every source and destination.",
  );
  notes.push(
    "This simulator models a teaching subset (protocol, ports, source, destination). Real ZIA rules add users, groups, departments, locations, network applications, countries, device trust, and time windows; the ascending-order, first-match semantics are identical.",
  );
  if (shadows.length > 0) {
    notes.push(
      "Shadow analysis is pairwise: a rule covered only by several earlier rules TOGETHER is not flagged.",
    );
  }

  return { rules, defaultAction, defaultActionExplicit, trace, verdict, shadows, notes };
}
