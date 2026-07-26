// ============================================================================
// src/lib/tools/fortigate-policy-lookup-explainer/compute.ts
// ----------------------------------------------------------------------------
// FORTIGATE FIREWALL POLICY LOOKUP EXPLAINER — pure engine.
//
// WHAT IT ANSWERS
// "Which policy matches this packet, and why did the one I expected not
// match?" Shadowed policies are the most common FortiGate fault and the
// failure is SILENT: the shadowed policy sits in the list looking correct with
// a hit counter that never increments.
//
// WHY IT CAN BE DETERMINISTIC
// FortiOS policy matching is a documented, ordered, all-criteria-must-match
// evaluation with first-match-wins and an implicit deny at the end. Given the
// policy list and a packet tuple, the outcome is computable. This never
// contacts a device, never fetches, never evaluates input as code.
//
// It models the MATCH decision only. It deliberately does NOT model NAT
// results, security-profile outcomes, routing, or session state — those depend
// on configuration this input does not carry, and guessing them would be
// exactly the kind of invention this project refuses.
// ============================================================================

/** Hard cap so a paste cannot become a denial of service. */
const MAX_INPUT = 200_000;
/** Bound on policies parsed from one paste. */
const MAX_POLICIES = 2_000;

/** The criteria FortiOS compares, in the order this tool reports them. */
export type Criterion =
  | "status"
  | "srcintf"
  | "dstintf"
  | "srcaddr"
  | "dstaddr"
  | "service"
  | "schedule";

export interface PolicyRule {
  /** FortiOS policy id, or the 1-based position when the paste has no ids. */
  readonly id: string;
  readonly name?: string;
  readonly srcintf: readonly string[];
  readonly dstintf: readonly string[];
  readonly srcaddr: readonly string[];
  readonly dstaddr: readonly string[];
  readonly service: readonly string[];
  readonly action: string;
  /** FortiOS default is enable; only an explicit "disable" turns it off. */
  readonly enabled: boolean;
  readonly schedule?: string;
  /** 1-based order in the pasted list. Order IS the behaviour. */
  readonly order: number;
}

export interface PacketTuple {
  readonly srcintf: string;
  readonly dstintf: string;
  readonly srcaddr: string;
  readonly dstaddr: string;
  readonly service: string;
}

export type Verdict = "match" | "eliminated" | "shadowed" | "covered" | "not-reached";

export interface Evaluation {
  readonly policy: PolicyRule;
  readonly verdict: Verdict;
  /** The FIRST criterion that failed. FortiOS needs all of them; naming the
   *  first one that failed is what makes the trace readable. */
  readonly failedOn: Criterion | null;
  readonly detail: string;
}

export interface LookupResult {
  readonly mode: "lookup" | "reference";
  readonly policies: readonly PolicyRule[];
  readonly packet: PacketTuple | null;
  readonly evaluations: readonly Evaluation[];
  /** The winning policy, or null when nothing matched (implicit deny). */
  readonly matched: PolicyRule | null;
  /** Policies below the match that would also match AND are at least as
   *  specific as it. These are the genuine faults: a narrower rule that can
   *  never take effect because a broader one sits above it. */
  readonly shadowed: readonly PolicyRule[];
  /** Policies below the match that would also match but are BROADER. A
   *  catch-all beneath a specific rule is correct design, so these are
   *  reported for completeness and NOT flagged as a problem. Conflating the
   *  two would make the tool cry wolf on every well-ordered policy list. */
  readonly covered: readonly PolicyRule[];
  readonly notes: readonly string[];
  readonly parseWarnings: readonly string[];
}

export interface ToolRunResult {
  readonly result: LookupResult;
}

// ---------------------------------------------------------------------------
// Matching primitives
// ---------------------------------------------------------------------------

/** FortiOS treats "all" / "any" as the wildcard member. */
function isWildcard(token: string): boolean {
  const t = token.trim().toLowerCase();
  return t === "all" || t === "any" || t === "*";
}

/**
 * Membership test for one criterion.
 *
 * This compares OBJECT NAMES, not resolved addresses, and that limitation is
 * deliberate and surfaced to the user rather than hidden. A paste of a policy
 * list does not carry the address-object definitions, so "is 10.1.1.5 inside
 * the object called LAN_Subnet" is unanswerable from this input. Pretending
 * otherwise would produce a confident wrong answer, which is worse than a
 * stated limit. Users therefore supply the object name (or "all").
 */
function memberMatches(members: readonly string[], value: string): boolean {
  if (members.length === 0) return false;
  const v = value.trim().toLowerCase();
  if (v === "") return false;
  for (const m of members) {
    if (isWildcard(m)) return true;
    if (m.trim().toLowerCase() === v) return true;
  }
  return false;
}

/**
 * Specificity = how many criteria are pinned rather than wildcarded. A policy
 * with srcaddr "all" is broader than one naming an object. This is what
 * separates a legitimate catch-all below a specific rule (fine) from a
 * specific rule stranded below a catch-all (the fault worth reporting).
 */
export function specificity(p: PolicyRule): number {
  const lists = [p.srcintf, p.dstintf, p.srcaddr, p.dstaddr, p.service];
  return lists.reduce((n, l) => n + (l.some(isWildcard) ? 0 : 1), 0);
}

/**
 * Evaluate one policy against one packet, returning the FIRST failing
 * criterion. FortiOS requires every criterion to match; reporting the first
 * failure is what turns a list into an explanation.
 */
export function evaluatePolicy(
  p: PolicyRule,
  pkt: PacketTuple,
): { ok: boolean; failedOn: Criterion | null; detail: string } {
  if (!p.enabled) {
    return {
      ok: false,
      failedOn: "status",
      detail: "Policy is disabled, so it is never consulted.",
    };
  }
  const checks: ReadonlyArray<[Criterion, readonly string[], string, string]> = [
    ["srcintf", p.srcintf, pkt.srcintf, "incoming interface"],
    ["dstintf", p.dstintf, pkt.dstintf, "outgoing interface"],
    ["srcaddr", p.srcaddr, pkt.srcaddr, "source address"],
    ["dstaddr", p.dstaddr, pkt.dstaddr, "destination address"],
    ["service", p.service, pkt.service, "service"],
  ];
  for (const [crit, members, value, label] of checks) {
    if (!memberMatches(members, value)) {
      return {
        ok: false,
        failedOn: crit,
        detail: `The ${label} did not match: policy has ${members.join(", ") || "(none)"}, packet has ${value || "(empty)"}.`,
      };
    }
  }
  return { ok: true, failedOn: null, detail: "All criteria matched." };
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Pull quoted member names from a FortiOS `set`/`edit` line. */
function quotedList(line: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) out.push(m[1]);
  return out;
}

/**
 * Parse `config firewall policy` CLI output.
 *
 * Written as an explicit line-state walk rather than a big regex, because a
 * regex over a nested config block is the kind of thing that silently
 * mis-parses one edge case and produces a wrong answer with no warning.
 */
export function parseCli(text: string): { policies: PolicyRule[]; warnings: string[] } {
  const warnings: string[] = [];
  const policies: PolicyRule[] = [];
  const lines = text.split(/\r?\n/);

  let cur: {
    id: string; name?: string; srcintf: string[]; dstintf: string[];
    srcaddr: string[]; dstaddr: string[]; service: string[];
    action: string; enabled: boolean; schedule?: string;
  } | null = null;
  let order = 0;

  const flush = () => {
    if (!cur) return;
    if (policies.length >= MAX_POLICIES) return;
    order += 1;
    policies.push({
      id: cur.id,
      name: cur.name,
      // FortiOS omits a member list when it is "all"; an empty list here means
      // the paste did not include it, so treat it as the documented default
      // rather than as "matches nothing".
      srcintf: cur.srcintf.length ? cur.srcintf : ["all"],
      dstintf: cur.dstintf.length ? cur.dstintf : ["all"],
      srcaddr: cur.srcaddr.length ? cur.srcaddr : ["all"],
      dstaddr: cur.dstaddr.length ? cur.dstaddr : ["all"],
      service: cur.service.length ? cur.service : ["ALL"],
      action: cur.action,
      enabled: cur.enabled,
      schedule: cur.schedule,
      order,
    });
    cur = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const edit = /^edit\s+(\d+)\s*$/.exec(line);
    if (edit) {
      flush();
      cur = {
        id: edit[1], srcintf: [], dstintf: [], srcaddr: [], dstaddr: [],
        service: [], action: "accept", enabled: true,
      };
      continue;
    }
    if (line === "next") { flush(); continue; }
    if (!cur) continue;

    if (/^set\s+name\s+/.test(line)) cur.name = quotedList(line)[0];
    else if (/^set\s+srcintf\s+/.test(line)) cur.srcintf = quotedList(line);
    else if (/^set\s+dstintf\s+/.test(line)) cur.dstintf = quotedList(line);
    else if (/^set\s+srcaddr\s+/.test(line)) cur.srcaddr = quotedList(line);
    else if (/^set\s+dstaddr\s+/.test(line)) cur.dstaddr = quotedList(line);
    else if (/^set\s+service\s+/.test(line)) cur.service = quotedList(line);
    else if (/^set\s+schedule\s+/.test(line)) cur.schedule = quotedList(line)[0];
    else if (/^set\s+action\s+/.test(line)) cur.action = line.split(/\s+/)[2] ?? "accept";
    else if (/^set\s+status\s+disable\s*$/.test(line)) cur.enabled = false;
  }
  flush();

  if (policies.length === 0) warnings.push("No policies were recognised in the input.");
  if (policies.length >= MAX_POLICIES) {
    warnings.push(`Only the first ${MAX_POLICIES} policies were parsed.`);
  }
  return { policies, warnings };
}

/**
 * Parse a simple pipe/tab table, which is what a GUI copy or a hand-written
 * list looks like:  id | srcintf | dstintf | srcaddr | dstaddr | service | action
 */
export function parseTable(text: string): { policies: PolicyRule[]; warnings: string[] } {
  const warnings: string[] = [];
  const policies: PolicyRule[] = [];
  const split = (l: string) => l.split(/\s*[|\t]\s*/).map((c) => c.trim()).filter((c, i, a) => !(i === 0 && c === "") && !(i === a.length - 1 && c === ""));
  let order = 0;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    // Skip a markdown-style separator row and an obvious header row.
    if (/^[\s|:-]+$/.test(line)) continue;
    const cells = split(line);
    if (cells.length < 6) continue;
    if (/^(id|policy)$/i.test(cells[0])) continue;
    if (policies.length >= MAX_POLICIES) break;
    order += 1;
    const list = (c: string) => c.split(/\s*,\s*/).map((x) => x.trim()).filter(Boolean);
    const action = (cells[6] ?? "accept").toLowerCase();
    policies.push({
      id: cells[0] || String(order),
      srcintf: list(cells[1]),
      dstintf: list(cells[2]),
      srcaddr: list(cells[3]),
      dstaddr: list(cells[4]),
      service: list(cells[5]),
      action: action === "deny" ? "deny" : "accept",
      enabled: !/disabled?/i.test(cells[7] ?? ""),
      order,
    });
  }
  if (policies.length === 0) warnings.push("No policy rows were recognised in the table.");
  return { policies, warnings };
}

/** Detect which paste shape this is. */
export function detectFormat(text: string): "cli" | "table" {
  return /config\s+firewall\s+policy|^\s*edit\s+\d+\s*$/m.test(text) ? "cli" : "table";
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/** Extract the packet tuple from a `packet:` directive line in the paste. */
function parsePacket(text: string): PacketTuple | null {
  const m = /^\s*packet:\s*(.+)$/im.exec(text);
  if (!m) return null;
  const fields: Record<string, string> = {};
  for (const part of m[1].split(/\s*,\s*/)) {
    const kv = /^\s*([a-z]+)\s*=\s*(.+?)\s*$/i.exec(part);
    if (kv) fields[kv[1].toLowerCase()] = kv[2];
  }
  const req = ["srcintf", "dstintf", "srcaddr", "dstaddr", "service"];
  if (!req.every((k) => fields[k])) return null;
  return {
    srcintf: fields.srcintf, dstintf: fields.dstintf,
    srcaddr: fields.srcaddr, dstaddr: fields.dstaddr, service: fields.service,
  };
}

/** Run the ordered evaluation and find both the match and what it shadows. */
export function lookup(policies: readonly PolicyRule[], pkt: PacketTuple): {
  evaluations: Evaluation[]; matched: PolicyRule | null;
  shadowed: PolicyRule[]; covered: PolicyRule[];
} {
  const evaluations: Evaluation[] = [];
  let matched: PolicyRule | null = null;
  const shadowed: PolicyRule[] = [];
  const covered: PolicyRule[] = [];

  for (const p of policies) {
    const r = evaluatePolicy(p, pkt);
    if (matched === null) {
      if (r.ok) {
        matched = p;
        evaluations.push({ policy: p, verdict: "match", failedOn: null, detail: r.detail });
      } else {
        evaluations.push({ policy: p, verdict: "eliminated", failedOn: r.failedOn, detail: r.detail });
      }
    } else if (r.ok) {
      // Would also have matched, but a policy above already won. Whether that
      // is a FAULT depends on which is more specific.
      if (specificity(p) >= specificity(matched)) {
        shadowed.push(p);
        evaluations.push({
          policy: p, verdict: "shadowed", failedOn: null,
          detail: `This policy is at least as specific as policy ${matched.id} above it and also matches, so as ordered it can never take effect for this traffic. Move it above policy ${matched.id}.`,
        });
      } else {
        covered.push(p);
        evaluations.push({
          policy: p, verdict: "covered", failedOn: null,
          detail: `This policy also matches but is broader than policy ${matched.id} above it, which is the normal shape of a catch-all. Nothing to fix.`,
        });
      }
    } else {
      evaluations.push({ policy: p, verdict: "not-reached", failedOn: r.failedOn, detail: r.detail });
    }
  }
  return { evaluations, matched, shadowed, covered };
}

/** Reference payload for the empty-input state. */
function referenceResult(): LookupResult {
  return {
    mode: "reference",
    policies: [], packet: null, evaluations: [], matched: null, shadowed: [], covered: [],
    notes: [
      "FortiOS evaluates firewall policies top to bottom and stops at the FIRST policy whose criteria all match.",
      "Every criterion must match: incoming interface, outgoing interface, source address, destination address, service, schedule, and user where configured.",
      "A policy that matches nothing shows a hit counter that never increments. Nothing warns you.",
      "At the end of the list is an implicit deny, and by default it is not logged.",
      "Paste a policy list and add a line such as: packet: srcintf=port1, dstintf=port2, srcaddr=all, dstaddr=WebServer, service=HTTPS",
    ],
    parseWarnings: [],
  };
}

/** Tool entry point. Deterministic, bounded, never fetches or evaluates. */
export function run(input: string): ToolRunResult {
  if (typeof input !== "string") throw new Error("Input must be a string.");
  if (input.length > MAX_INPUT) {
    throw new Error(`Input too large (${input.length} chars; limit ${MAX_INPUT}).`);
  }
  const text = input.trim();
  if (text === "") return { result: referenceResult() };

  const fmt = detectFormat(text);
  const parsed = fmt === "cli" ? parseCli(text) : parseTable(text);
  const pkt = parsePacket(text);
  const notes: string[] = [];
  const warnings = [...parsed.warnings];

  if (!pkt) {
    notes.push(
      "No packet was supplied, so the policies are listed without a lookup. Add a line like: packet: srcintf=port1, dstintf=port2, srcaddr=all, dstaddr=WebServer, service=HTTPS",
    );
    return {
      result: {
        mode: "lookup", policies: parsed.policies, packet: null, evaluations: [],
        matched: null, shadowed: [], covered: [], notes, parseWarnings: warnings,
      },
    };
  }

  const { evaluations, matched, shadowed, covered } = lookup(parsed.policies, pkt);

  if (matched === null && parsed.policies.length > 0) {
    notes.push(
      "No policy matched, so this traffic meets the implicit deny at the end of the list. By default that drop is not logged, which is why traffic can disappear with no policy showing a hit.",
    );
  }
  if (matched && matched.action === "deny") {
    notes.push(`Policy ${matched.id} matched and its action is DENY, so the traffic is dropped by an explicit rule rather than by the implicit deny.`);
  }
  if (covered.length > 0) {
    notes.push(
      `${covered.length} broader ${covered.length === 1 ? "policy" : "policies"} below the match would also match (${covered.map((c) => c.id).join(", ")}). That is the normal shape of a catch-all and is not a fault.`,
    );
  }
  if (shadowed.length > 0) {
    notes.push(
      `${shadowed.length} ${shadowed.length === 1 ? "policy is" : "policies are"} shadowed for this packet: ${shadowed.map((s) => s.id).join(", ")}. ${shadowed.length === 1 ? "It" : "They"} would match, but a policy above already won, so ${shadowed.length === 1 ? "it" : "they"} can never take effect as ordered.`,
    );
  }
  // Stated every time, because a silent limitation is how a tool becomes wrong.
  notes.push(
    "Matching here compares object NAMES, not resolved addresses: a pasted policy list does not carry the address-object definitions, so supply the object name (or 'all') rather than an IP.",
  );

  return {
    result: {
      mode: "lookup", policies: parsed.policies, packet: pkt,
      evaluations, matched, shadowed, covered, notes, parseWarnings: warnings,
    },
  };
}
