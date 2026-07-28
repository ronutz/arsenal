// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/checkpoint-policy-layer-evaluator/compute.ts
// ----------------------------------------------------------------------------
// THE CHECK POINT ORDERED-LAYER EVALUATOR.
//
// Teaches the one sentence that governs a Check Point Access Control policy
// and that people arriving from other firewalls reliably get wrong:
//
//     ORDERED LAYERS ARE AN AND, NOT AN OR. Accept in a layer means the
//     connection PROCEEDS TO THE NEXT LAYER. It is allowed only when the LAST
//     layer accepts it. A drop in ANY layer ends evaluation immediately.
//
// Everything else here follows from that:
//   * a permit in an early layer CANNOT override a drop in a later one - the
//     exception belongs in the layer that would otherwise deny;
//   * within a layer, evaluation is top-down and FIRST MATCH WINS, exactly as
//     on any ordered rule base;
//   * a layer that matches nothing falls to its implicit cleanup rule, which
//     DROPS and - this is the part that costs people hours - LOGS NOTHING.
//     An explicit cleanup rule exists to make that drop visible;
//   * an INLINE layer is a sub-policy hanging off one rule. The parent rule is
//     a GATE, not a decision: traffic that does not match the parent skips the
//     sub-policy entirely, and traffic that matches the parent but nothing
//     inside falls to the SUB-POLICY's own last rule.
//
// This is a deliberately small teaching subset of the real grammar. A real
// rule carries VPN, content, time, install-on and negation; the layer
// semantics taught here apply to all of them identically. Deliberate
// omissions are stated rather than silently pretended away:
//   * NO service-name resolution (443 is 443, not "https") - a name table
//     would be a guess about someone's object database;
//   * shadowing analysis is PAIRWISE, so a rule covered jointly by several
//     earlier rules but by none alone is not flagged;
//   * IPv4 only.
//
// Sibling note: the ZIA rule-order simulator on this site teaches first-match
// on a SINGLE ordered rule base. This tool exists because Check Point adds the
// dimension that one does not have - several rule bases in sequence, each of
// which must accept.
// ============================================================================

/** A parsed rule inside one layer. */
export interface CpRule {
  /** 1-based position within its layer. */
  position: number;
  name: string;
  action: "accept" | "drop" | "inline";
  /** Source as CIDR, or null for Any. */
  src: Cidr | null;
  /** Destination as CIDR, or null for Any. */
  dst: Cidr | null;
  /** Destination service port, or null for Any. */
  svc: number | null;
  /** Whether the rule logs. A rule with track none leaves no evidence. */
  track: boolean;
  /** For action "inline": the name of the sub-policy layer it gates. */
  inlineLayer?: string;
}

export interface CpLayer {
  name: string;
  /** "ordered" layers run in sequence; "inline" layers are entered by a rule. */
  kind: "ordered" | "inline";
  rules: CpRule[];
}

export interface CpConnection {
  src: number; // IPv4 as unsigned 32-bit
  dst: number;
  svc: number;
  srcText: string;
  dstText: string;
}

export interface Cidr {
  base: number; // network address, unsigned 32-bit
  mask: number; // unsigned 32-bit
  text: string;
}

/** One step of the evaluation trace. */
export interface CpStep {
  layer: string;
  layerKind: "ordered" | "inline";
  /** null when nothing matched and the implicit cleanup applied. */
  matchedRule: CpRule | null;
  outcome: "proceed" | "allowed" | "dropped" | "entered-inline" | "skipped-inline";
  /** Plain-language reason, the part that does the teaching. */
  reason: string;
  /** True when this step's drop produced no log entry. */
  silent: boolean;
}

export interface CpReport {
  verdict: "allowed" | "dropped";
  steps: CpStep[];
  /** Findings about the policy itself, independent of the test connection. */
  findings: CpFinding[];
  connection: CpConnection;
  layers: CpLayer[];
}

export interface CpFinding {
  severity: "info" | "warn";
  layer: string;
  message: string;
}

export class CpParseError extends Error {
  constructor(
    message: string,
    /** 1-based line number in the input, for pointing at the problem. */
    public readonly line: number,
  ) {
    super(message);
    this.name = "CpParseError";
  }
}

// ---------------------------------------------------------------------------
// Address helpers. IPv4 only, stated as a limitation above.
// ---------------------------------------------------------------------------

function ipToLong(text: string, line: number): number {
  const parts = text.trim().split(".");
  if (parts.length !== 4) throw new CpParseError(`"${text}" is not an IPv4 address`, line);
  let out = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) throw new CpParseError(`"${text}" is not an IPv4 address`, line);
    const n = Number(p);
    if (n > 255) throw new CpParseError(`"${text}" has an octet above 255`, line);
    out = (out << 8) | n;
  }
  return out >>> 0;
}

export function longToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

/** Parse "any", a bare address, or CIDR. Returns null for Any. */
function parseCidr(text: string, line: number): Cidr | null {
  const t = text.trim().toLowerCase();
  if (t === "any" || t === "*") return null;
  const [addr, bitsText] = t.split("/");
  const bits = bitsText === undefined ? 32 : Number(bitsText);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) {
    throw new CpParseError(`"${text}" has an invalid prefix length`, line);
  }
  const ip = ipToLong(addr, line);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return { base: (ip & mask) >>> 0, mask, text: t };
}

const inCidr = (ip: number, c: Cidr | null): boolean =>
  c === null || ((ip & c.mask) >>> 0) === c.base;

/** Is `a` entirely contained within `b`? Used for pairwise shadowing. */
function cidrCovers(b: Cidr | null, a: Cidr | null): boolean {
  if (b === null) return true; // Any covers everything
  if (a === null) return false; // a specific range cannot cover Any
  if (b.mask > a.mask) return false; // b is narrower than a
  return ((a.base & b.mask) >>> 0) === b.base;
}

// ---------------------------------------------------------------------------
// Parsing
//
// Grammar, one statement per line, blank lines and # comments ignored:
//   layer <name> ordered|inline
//     <pos> | <name> | accept|drop|inline:<layerName> | [src=..] [dst=..] [svc=..] [nolog]
//   test src=<ip> dst=<ip> svc=<port>
// ---------------------------------------------------------------------------

export function parsePolicy(input: string): { layers: CpLayer[]; connection: CpConnection } {
  const layers: CpLayer[] = [];
  let connection: CpConnection | null = null;
  let current: CpLayer | null = null;

  const lines = input.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i].split("#")[0].trim();
    if (!raw) continue;

    if (/^layer\s+/i.test(raw)) {
      const m = /^layer\s+(\S+)\s+(ordered|inline)\s*$/i.exec(raw);
      if (!m) throw new CpParseError(`expected: layer <name> ordered|inline`, lineNo);
      current = { name: m[1], kind: m[2].toLowerCase() as "ordered" | "inline", rules: [] };
      if (layers.some((l) => l.name.toLowerCase() === current!.name.toLowerCase())) {
        throw new CpParseError(`layer "${m[1]}" is declared twice`, lineNo);
      }
      layers.push(current);
      continue;
    }

    if (/^test\s+/i.test(raw)) {
      const tokens = raw.slice(4).trim().split(/\s+/);
      let src: string | null = null;
      let dst: string | null = null;
      let svc: number | null = null;
      for (const tok of tokens) {
        const [k, v] = tok.split("=");
        if (!v) throw new CpParseError(`"${tok}" should be key=value`, lineNo);
        if (k === "src") src = v;
        else if (k === "dst") dst = v;
        else if (k === "svc") svc = Number(v);
        else throw new CpParseError(`unknown key "${k}" in test`, lineNo);
      }
      if (!src || !dst || svc === null || !Number.isInteger(svc)) {
        throw new CpParseError(`test needs src=, dst= and a numeric svc=`, lineNo);
      }
      connection = {
        src: ipToLong(src, lineNo),
        dst: ipToLong(dst, lineNo),
        svc,
        srcText: src,
        dstText: dst,
      };
      continue;
    }

    // Otherwise: a rule line, which must sit inside a layer.
    if (!current) throw new CpParseError(`a rule must follow a "layer" line`, lineNo);
    const parts = raw.split("|").map((p) => p.trim());
    if (parts.length < 3) {
      throw new CpParseError(`expected: <pos> | <name> | <action> | [tokens]`, lineNo);
    }
    const position = Number(parts[0]);
    if (!Number.isInteger(position) || position < 1) {
      throw new CpParseError(`"${parts[0]}" is not a rule position`, lineNo);
    }
    const actionText = parts[2].toLowerCase();
    let action: CpRule["action"];
    let inlineLayer: string | undefined;
    if (actionText === "accept" || actionText === "drop") {
      action = actionText;
    } else if (actionText.startsWith("inline:")) {
      action = "inline";
      inlineLayer = parts[2].slice("inline:".length).trim();
      if (!inlineLayer) throw new CpParseError(`inline: needs a layer name`, lineNo);
    } else {
      throw new CpParseError(`action must be accept, drop, or inline:<layer>`, lineNo);
    }

    const rule: CpRule = {
      position,
      name: parts[1] || `rule ${position}`,
      action,
      src: null,
      dst: null,
      svc: null,
      track: true,
      inlineLayer,
    };
    for (const tok of (parts[3] ?? "").split(/\s+/).filter(Boolean)) {
      if (tok.toLowerCase() === "nolog") {
        rule.track = false;
        continue;
      }
      const [k, v] = tok.split("=");
      if (!v) throw new CpParseError(`"${tok}" should be key=value or "nolog"`, lineNo);
      if (k === "src") rule.src = parseCidr(v, lineNo);
      else if (k === "dst") rule.dst = parseCidr(v, lineNo);
      else if (k === "svc") rule.svc = v.toLowerCase() === "any" ? null : Number(v);
      else throw new CpParseError(`unknown key "${k}"`, lineNo);
      if (k === "svc" && rule.svc !== null && !Number.isInteger(rule.svc)) {
        throw new CpParseError(`svc must be a port number or "any"`, lineNo);
      }
    }
    current.rules.push(rule);
  }

  if (!layers.length) throw new CpParseError(`no layers defined`, 1);
  if (!connection) throw new CpParseError(`no "test" line - nothing to evaluate`, 1);
  if (!layers.some((l) => l.kind === "ordered")) {
    throw new CpParseError(`at least one ordered layer is needed`, 1);
  }
  for (const l of layers) {
    for (const r of l.rules) {
      if (r.action === "inline" && !layers.some((x) => x.name.toLowerCase() === r.inlineLayer!.toLowerCase())) {
        throw new CpParseError(`rule "${r.name}" points at undefined layer "${r.inlineLayer}"`, 1);
      }
    }
  }
  return { layers, connection };
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

const matches = (r: CpRule, c: CpConnection): boolean =>
  inCidr(c.src, r.src) && inCidr(c.dst, r.dst) && (r.svc === null || r.svc === c.svc);

/** Run one layer. Returns the step plus whether evaluation continues. */
function runLayer(
  layer: CpLayer,
  c: CpConnection,
  layers: CpLayer[],
  isLast: boolean,
  steps: CpStep[],
): "proceed" | "allowed" | "dropped" {
  const sorted = [...layer.rules].sort((a, b) => a.position - b.position);
  for (const rule of sorted) {
    if (!matches(rule, c)) continue;

    if (rule.action === "drop") {
      steps.push({
        layer: layer.name,
        layerKind: layer.kind,
        matchedRule: rule,
        outcome: "dropped",
        silent: !rule.track,
        reason: rule.track
          ? `rule ${rule.position} ("${rule.name}") drops. A drop in any layer ends evaluation - no later layer is consulted.`
          : `rule ${rule.position} ("${rule.name}") drops with track set to none, so the connection fails and NOTHING appears in the logs.`,
      });
      return "dropped";
    }

    if (rule.action === "inline") {
      const sub = layers.find((l) => l.name.toLowerCase() === rule.inlineLayer!.toLowerCase())!;
      steps.push({
        layer: layer.name,
        layerKind: layer.kind,
        matchedRule: rule,
        outcome: "entered-inline",
        silent: false,
        reason: `rule ${rule.position} ("${rule.name}") matched, so evaluation continues INSIDE the inline layer "${sub.name}". The parent rule is a gate, not a decision.`,
      });
      // The sub-policy decides. It is never "the last layer" itself: if it
      // accepts, the parent layer's own evaluation is finished and the next
      // ordered layer runs.
      const inner = runLayer(sub, c, layers, false, steps);
      if (inner === "dropped") return "dropped";
      return isLast ? "allowed" : "proceed";
    }

    // accept
    steps.push({
      layer: layer.name,
      layerKind: layer.kind,
      matchedRule: rule,
      outcome: isLast && layer.kind === "ordered" ? "allowed" : "proceed",
      silent: false,
      reason:
        isLast && layer.kind === "ordered"
          ? `rule ${rule.position} ("${rule.name}") accepts, and this is the LAST ordered layer - so the connection is allowed.`
          : `rule ${rule.position} ("${rule.name}") accepts. In an ordered layer that means PROCEED TO THE NEXT LAYER, not allowed.`,
    });
    return isLast && layer.kind === "ordered" ? "allowed" : "proceed";
  }

  // Nothing matched: the implicit cleanup rule drops, and logs nothing.
  steps.push({
    layer: layer.name,
    layerKind: layer.kind,
    matchedRule: null,
    outcome: "dropped",
    silent: true,
    reason: `no rule in "${layer.name}" matched, so the implicit cleanup rule dropped the connection. It logs NOTHING - which is why an explicit cleanup rule with drop and log is added as the last rule.`,
  });
  return "dropped";
}

/** Policy-level findings, independent of the test connection. */
function analyse(layers: CpLayer[]): CpFinding[] {
  const out: CpFinding[] = [];
  for (const layer of layers) {
    const sorted = [...layer.rules].sort((a, b) => a.position - b.position);

    // Explicit cleanup rule: any/any/any drop as the last rule.
    const last = sorted[sorted.length - 1];
    const isCleanup =
      last && last.action === "drop" && last.src === null && last.dst === null && last.svc === null;
    if (!isCleanup) {
      out.push({
        severity: "warn",
        layer: layer.name,
        message: `no explicit cleanup rule. Unmatched traffic still drops, but silently - add any/any/any drop with logging as the last rule so you can see what is being refused.`,
      });
    } else if (!last.track) {
      out.push({
        severity: "warn",
        layer: layer.name,
        message: `the cleanup rule has track set to none, which defeats its only purpose: it exists to make the implicit drop visible.`,
      });
    }

    // Rules that log nothing.
    for (const r of sorted) {
      if (!r.track && r !== last) {
        out.push({
          severity: "warn",
          layer: layer.name,
          message: `rule ${r.position} ("${r.name}") has track set to none, so its matches leave no evidence.`,
        });
      }
    }

    // Pairwise shadowing.
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        const covers =
          cidrCovers(a.src, b.src) &&
          cidrCovers(a.dst, b.dst) &&
          (a.svc === null || a.svc === b.svc);
        if (covers) {
          out.push({
            severity: "warn",
            layer: layer.name,
            message: `rule ${b.position} ("${b.name}") is unreachable: rule ${a.position} ("${a.name}") above it already matches everything it would.`,
          });
        }
      }
    }
  }
  return out;
}

export function evaluatePolicy(input: string): CpReport {
  const { layers, connection } = parsePolicy(input);
  const ordered = layers.filter((l) => l.kind === "ordered");
  const steps: CpStep[] = [];
  let verdict: "allowed" | "dropped" = "dropped";

  for (let i = 0; i < ordered.length; i++) {
    const result = runLayer(ordered[i], connection, layers, i === ordered.length - 1, steps);
    if (result === "dropped") {
      verdict = "dropped";
      break;
    }
    if (result === "allowed") {
      verdict = "allowed";
      break;
    }
  }

  return { verdict, steps, findings: analyse(layers), connection, layers };
}
