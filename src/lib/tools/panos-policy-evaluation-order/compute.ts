// ============================================================================
// src/lib/tools/panos-policy-evaluation-order/compute.ts
// ----------------------------------------------------------------------------
// PAN-OS and Prisma Access security policy evaluation order, and shadowing.
//
// WHY THIS TOOL EXISTS, IN PALO ALTO'S OWN WORDS. Their security policy
// best-practices document states, of the Panorama push workflow:
//
//     "Commit and Push doesn't provide shadowing information."
//
// The vendor names the gap. A broad rule placed above a specific one silently
// captures the traffic the specific rule was written for, the specific rule
// never fires, and nothing in the push tells you. This tool exists to make that
// visible before the commit rather than after the incident.
//
// ---------------------------------------------------------------------------
// THE EVALUATION MODEL, AND WHY THE LAYERS ARE THE HARD PART
//
// A standalone firewall evaluates one ordered list. A Panorama-managed firewall
// or Prisma Access tenant does not: it evaluates by LAYER and by TYPE, and the
// local rules an administrator can actually see and edit sit in the MIDDLE of
// a sandwich they cannot edit from the firewall at all.
//
//     1. shared pre-rules          (Panorama, all device groups)
//     2. device group pre-rules    (Panorama, this device group)
//     3. LOCAL firewall rules      (edited on the firewall itself)
//     4. device group post-rules   (Panorama)
//     5. shared post-rules         (Panorama)
//     6. default rules             intrazone-default allow, interzone-default deny
//
// Source: docs.paloaltonetworks.com, "Device Groups" - "A firewall evaluates
// policy rules by layer (shared, device group, and local) and by type
// (pre-rules, post-rules, and default rules) in the following order from top to
// bottom", and "Local firewall rules display between the pre-rules and
// post-rules."
//
// That ordering is the single most common surprise in a Panorama estate: a
// local rule that looks correct never runs, because a shared pre-rule two
// layers above it already matched. Modelling the layers is therefore the whole
// point; a tool that evaluated a flat list would answer a question nobody has.
//
// FIRST MATCH WINS and evaluation stops. Source: same docs - "When traffic
// matches a rule's criteria, the firewall executes the rule's action on the
// traffic and doesn't compare the traffic to any other rules."
//
// THE DEFAULTS ARE NOT SYMMETRIC. intrazone-default ALLOWS traffic within a
// zone; interzone-default DENIES traffic between zones. Both are real rules at
// the bottom of the rulebase and both can be modified to log or apply profiles.
// A model that treated "no match" as a single implicit deny would be wrong for
// every same-zone flow.
//
// WHAT THIS TOOL DOES NOT DO: it does not read your configuration, does not
// connect to Panorama, does not evaluate App-ID shifts mid-session, and does
// not model security profiles. It reasons about the ORDER of the rules you give
// it, which is the part that is decided at commit time and is hard to see.
// ============================================================================

export type RuleLayer =
  | "shared-pre"
  | "dg-pre"
  | "local"
  | "dg-post"
  | "shared-post";

/** Evaluation order by layer. Lower runs first. Source: docs.paloaltonetworks.com. */
export const LAYER_ORDER: Record<RuleLayer, number> = {
  "shared-pre": 1,
  "dg-pre": 2,
  local: 3,
  "dg-post": 4,
  "shared-post": 5,
};

export const LAYER_LABEL: Record<RuleLayer, string> = {
  "shared-pre": "Shared pre-rules",
  "dg-pre": "Device group pre-rules",
  local: "Local firewall rules",
  "dg-post": "Device group post-rules",
  "shared-post": "Shared post-rules",
};

export type RuleAction = "allow" | "deny" | "drop" | "reset-client" | "reset-server" | "reset-both";

export interface PolicyRule {
  layer: RuleLayer;
  /** Position within its own layer, as written. */
  index: number;
  name: string;
  action: RuleAction;
  /** "any" matches anything. Values are compared case-insensitively. */
  fromZone: string[];
  toZone: string[];
  source: string[];
  destination: string[];
  application: string[];
  service: string[];
  user: string[];
}

export interface Traffic {
  fromZone: string;
  toZone: string;
  source: string;
  destination: string;
  application: string;
  service: string;
  user: string;
}

export type PanosErrorCode =
  | "empty"
  | "bad-rule"
  | "bad-layer"
  | "bad-action"
  | "no-traffic"
  | "too-many-rules";

export class PanosPolicyError extends Error {
  code: PanosErrorCode;
  line?: number;
  constructor(code: PanosErrorCode, message: string, line?: number) {
    super(message);
    this.name = "PanosPolicyError";
    this.code = code;
    this.line = line;
  }
}

export interface ShadowFinding {
  /** The rule that never fires. */
  shadowedName: string;
  shadowedLayer: RuleLayer;
  /** The rule above it that captures its traffic first. */
  shadowedByName: string;
  shadowedByLayer: RuleLayer;
  /** True when the two rules also disagree about what to do. */
  actionDiffers: boolean;
  /** Set when the shadowing crosses a layer boundary, which is the hard case. */
  crossesLayer: boolean;
}

export interface EvaluationStep {
  name: string;
  layer: RuleLayer;
  matched: boolean;
  /** For a non-match, the FIRST criterion that failed. */
  failedOn?: string;
}

export interface PanosPolicyReport {
  ordered: PolicyRule[];
  /** Present when traffic was supplied. */
  trace?: EvaluationStep[];
  decision?: {
    ruleName: string;
    layer: RuleLayer | "default";
    action: RuleAction;
    /** True when nothing matched and a default rule decided it. */
    byDefault: boolean;
    defaultRule?: "intrazone-default" | "interzone-default";
  };
  shadowed: ShadowFinding[];
  notes: string[];
}

const MAX_RULES = 500;

const ANY = "any";

function norm(list: string[]): string[] {
  return list.map((v) => v.trim().toLowerCase()).filter(Boolean);
}

/** A rule field matches when it is "any" or contains the traffic value. */
function fieldMatches(ruleField: string[], value: string): boolean {
  const f = norm(ruleField);
  if (f.length === 0 || f.includes(ANY)) return true;
  return f.includes(value.trim().toLowerCase());
}

/**
 * Is `broad` at least as permissive as `narrow` on every field?
 *
 * This is the shadowing test. It is deliberately CONSERVATIVE: it reports a
 * shadow only when the broad rule's criteria are a superset on every single
 * field, which means every packet the narrow rule could match is already
 * matched by the broad one. Anything less certain is not reported.
 *
 * A more aggressive test would catch partial overlaps, and would also produce
 * false positives on a rulebase where partial overlap is intentional and
 * common. A shadowing report that cries wolf is a shadowing report nobody
 * reads, which is worse than the vendor's current position of reporting
 * nothing at all.
 */
function supersetOf(broad: PolicyRule, narrow: PolicyRule): boolean {
  const fields: (keyof PolicyRule)[] = [
    "fromZone",
    "toZone",
    "source",
    "destination",
    "application",
    "service",
    "user",
  ];
  for (const f of fields) {
    const b = norm(broad[f] as string[]);
    const n = norm(narrow[f] as string[]);
    if (b.includes(ANY) || b.length === 0) continue; // broad accepts everything here
    if (n.includes(ANY) || n.length === 0) return false; // narrow is wider on this field
    if (!n.every((v) => b.includes(v))) return false;
  }
  return true;
}

/** Sort into true evaluation order: by layer, then by position within the layer. */
export function orderRules(rules: PolicyRule[]): PolicyRule[] {
  return [...rules].sort(
    (a, b) => LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer] || a.index - b.index
  );
}

export function evaluate(rules: PolicyRule[], traffic?: Traffic): PanosPolicyReport {
  if (rules.length === 0) {
    throw new PanosPolicyError("empty", "no rules to evaluate");
  }
  if (rules.length > MAX_RULES) {
    throw new PanosPolicyError(
      "too-many-rules",
      `${rules.length} rules exceeds the ${MAX_RULES} this tool will reason about`
    );
  }

  const ordered = orderRules(rules);
  const notes: string[] = [];

  // ---- shadowing -----------------------------------------------------------
  const shadowed: ShadowFinding[] = [];
  for (let i = 0; i < ordered.length; i++) {
    for (let j = 0; j < i; j++) {
      const above = ordered[j];
      const below = ordered[i];
      if (above.action === "allow" && below.action === "allow" && !supersetOf(above, below)) {
        continue;
      }
      if (supersetOf(above, below)) {
        shadowed.push({
          shadowedName: below.name,
          shadowedLayer: below.layer,
          shadowedByName: above.name,
          shadowedByLayer: above.layer,
          actionDiffers: above.action !== below.action,
          crossesLayer: above.layer !== below.layer,
        });
        break; // the first rule that shadows it is the one that matters
      }
    }
  }
  if (shadowed.some((s) => s.crossesLayer)) notes.push("cross-layer-shadow");
  if (shadowed.some((s) => s.actionDiffers)) notes.push("shadow-changes-action");

  const report: PanosPolicyReport = { ordered, shadowed, notes };
  if (!traffic) return report;

  // ---- evaluation ----------------------------------------------------------
  const trace: EvaluationStep[] = [];
  for (const r of ordered) {
    const checks: [string, boolean][] = [
      ["from zone", fieldMatches(r.fromZone, traffic.fromZone)],
      ["to zone", fieldMatches(r.toZone, traffic.toZone)],
      ["source", fieldMatches(r.source, traffic.source)],
      ["destination", fieldMatches(r.destination, traffic.destination)],
      ["application", fieldMatches(r.application, traffic.application)],
      ["service", fieldMatches(r.service, traffic.service)],
      ["user", fieldMatches(r.user, traffic.user)],
    ];
    const failed = checks.find(([, ok]) => !ok);
    if (failed) {
      trace.push({ name: r.name, layer: r.layer, matched: false, failedOn: failed[0] });
      continue;
    }
    trace.push({ name: r.name, layer: r.layer, matched: true });
    report.trace = trace;
    report.decision = {
      ruleName: r.name,
      layer: r.layer,
      action: r.action,
      byDefault: false,
    };
    return report;
  }

  // Nothing matched: the default rules decide, and they are NOT symmetric.
  const sameZone =
    traffic.fromZone.trim().toLowerCase() === traffic.toZone.trim().toLowerCase();
  report.trace = trace;
  report.decision = {
    ruleName: sameZone ? "intrazone-default" : "interzone-default",
    layer: "default",
    action: sameZone ? "allow" : "deny",
    byDefault: true,
    defaultRule: sameZone ? "intrazone-default" : "interzone-default",
  };
  notes.push(sameZone ? "intrazone-default-allow" : "interzone-default-deny");
  return report;
}

// ============================================================================
// THE TEACHING GRAMMAR
// ----------------------------------------------------------------------------
// One rule per line. The layer is named first, because the layer is the thing
// this tool exists to make visible and a grammar that made it optional would
// let a reader forget the very thing they came to check.
//
//   shared-pre | block-tor | deny | from=any to=any app=tor
//   dg-pre     | allow-dns | allow | from=trust to=untrust app=dns svc=application-default
//   local      | web-out   | allow | from=trust to=untrust app=web-browsing user=any
//   dg-post    | log-all   | deny  | from=any to=any
//
// Fields are key=value, comma-separated within a value. Omitted fields default
// to "any", which is what PAN-OS itself does.
// ============================================================================

const FIELD_ALIASES: Record<string, keyof PolicyRule> = {
  from: "fromZone",
  fromzone: "fromZone",
  to: "toZone",
  tozone: "toZone",
  src: "source",
  source: "source",
  dst: "destination",
  dest: "destination",
  destination: "destination",
  app: "application",
  application: "application",
  svc: "service",
  service: "service",
  user: "user",
};

const VALID_ACTIONS: RuleAction[] = [
  "allow",
  "deny",
  "drop",
  "reset-client",
  "reset-server",
  "reset-both",
];

export function parseRules(input: string): PolicyRule[] {
  const rules: PolicyRule[] = [];
  const perLayer: Partial<Record<RuleLayer, number>> = {};

  input.split("\n").forEach((raw, n) => {
    const line = raw.split("#")[0].trim();
    if (!line) return;
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 3) {
      throw new PanosPolicyError(
        "bad-rule",
        `line ${n + 1}: expected "layer | name | action | fields"`,
        n + 1
      );
    }
    const layer = parts[0].toLowerCase() as RuleLayer;
    if (!(layer in LAYER_ORDER)) {
      throw new PanosPolicyError(
        "bad-layer",
        `line ${n + 1}: "${parts[0]}" is not a layer. Use one of: ${Object.keys(LAYER_ORDER).join(", ")}`,
        n + 1
      );
    }
    const action = parts[2].toLowerCase() as RuleAction;
    if (!VALID_ACTIONS.includes(action)) {
      throw new PanosPolicyError(
        "bad-action",
        `line ${n + 1}: "${parts[2]}" is not an action. Use one of: ${VALID_ACTIONS.join(", ")}`,
        n + 1
      );
    }

    const rule: PolicyRule = {
      layer,
      index: (perLayer[layer] = (perLayer[layer] ?? 0) + 1),
      name: parts[1],
      action,
      fromZone: ["any"],
      toZone: ["any"],
      source: ["any"],
      destination: ["any"],
      application: ["any"],
      service: ["any"],
      user: ["any"],
    };

    for (const token of (parts[3] ?? "").split(/\s+/).filter(Boolean)) {
      const eq = token.indexOf("=");
      if (eq < 0) continue;
      const key = token.slice(0, eq).toLowerCase();
      const field = FIELD_ALIASES[key];
      if (!field) continue;
      (rule[field] as string[]) = token
        .slice(eq + 1)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    rules.push(rule);
  });

  if (rules.length === 0) {
    throw new PanosPolicyError("empty", "no rules found");
  }
  return rules;
}

/** Structured entry point: { rules, traffic? }. */
export function run(input: { rules: string; traffic?: Traffic }): PanosPolicyReport {
  const rules = parseRules(input.rules ?? "");
  return evaluate(rules, input.traffic);
}
