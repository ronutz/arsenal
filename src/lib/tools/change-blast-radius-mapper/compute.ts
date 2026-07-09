// ============================================================================
// src/lib/tools/change-blast-radius-mapper/compute.ts
// ----------------------------------------------------------------------------
// CHANGE BLAST-RADIUS MAPPER - Operations & Fieldcraft, tool 4 (D-86), built
// on the shared fieldcraft foundation. The schema names this tool as the main
// consumer of RiskFactor, and it is.
//
// WHAT IT IS: an advisory mapping engine. You describe WHAT you are changing
// and its structural characteristics (does it sit on shared hardware? is it in
// the traffic path? do others depend on it? is there an HA peer?) through a
// small structured form; a fixed, original rule set (D-18: original by
// construction) fires deterministically and MAPS THE BLAST RADIUS as a set of
// concentric tiers - the direct target, the co-located neighbours, the
// downstream dependents, and the human/business surface - each populated with
// the categories of thing that could be affected. Alongside the map it emits
// severity-tagged RISK FACTORS and a set of CONTAINMENT MEASURES that would
// shrink the radius, plus an exportable blast-radius assessment for the change
// ticket.
//
// WHAT IT IS NOT (D-86 §3.5 guardrails, binding): it does not enumerate your
// actual topology (it has none - it maps CATEGORIES from what you describe),
// does not approve a change, makes no network calls, asks for no credentials,
// and replaces neither a real impact analysis nor change review. It maps the
// SHAPE of the blast radius so nothing is forgotten; a human confirms the
// specifics against the real environment. The language holds that line: it
// maps "what could be affected", it never asserts "what will break".
//
// DETERMINISM & VERIFICATION (D-86 §3.1 - the pilot's ruling): same input ->
// same tiers, same population, same risks, same containment measures.
// Verification model: RULE-FIRING SNAPSHOT VECTORS. The D-49 manifest carries
// `verificationModel: "rule-firing-snapshot"`.
//
// I18N NOTE: tier / affected-category / risk / containment text is canonical
// English from the engine (vector-pinned); form chrome is localized. Same
// posture as the rest of the cluster.
// ============================================================================

import type {
  RiskFactor,
  QualityWarning,
  ExportArtifact,
} from "@/lib/fieldcraft/schema";
import { artifactToMarkdown } from "@/lib/fieldcraft/markdown";

// ----------------------------------------------------------------------------
// Input model (quick mode). Closed enums so mapping is deterministic; free
// text lives only in `notes` and flows ONLY to the export.
// ----------------------------------------------------------------------------

/** What layer the change target sits at - shapes the neighbour and dependent
 *  tiers. */
export type TargetType =
  | "single-server"
  | "network-device"
  | "load-balancer"
  | "dns-record"
  | "certificate"
  | "firewall-policy"
  | "shared-platform"
  | "database";

/** Does the target sit on hardware/a platform shared with other services? */
export type Colocation = "dedicated" | "some-shared" | "heavily-shared";

/** Is the target in the live traffic/request path? */
export type TrafficPath = "in-path" | "control-plane" | "out-of-band";

/** How many other things depend on this target downstream? */
export type Dependents = "none-known" | "a-few" | "many" | "everything";

/** Is there a redundant peer that can carry load during the change? */
export type Redundancy = "ha-pair-healthy" | "ha-pair-degraded" | "cluster" | "standalone";

/** Reach of the users/business that ultimately sit behind the target. */
export type UserReach = "internal-team" | "one-app" | "one-site" | "customer-facing" | "everyone";

export type PresetId = "generic" | "load-balancer" | "dns" | "tls-pki" | "firewall";

export interface BlastNotes {
  summary?: string;
  targetDetail?: string;
}

export interface BlastInput {
  target: TargetType;
  colocation: Colocation;
  trafficPath: TrafficPath;
  dependents: Dependents;
  redundancy: Redundancy;
  userReach: UserReach;
  preset: PresetId;
  notes?: BlastNotes;
}

// ----------------------------------------------------------------------------
// Output: concentric tiers, each populated with affected CATEGORIES.
// ----------------------------------------------------------------------------

export type TierId = "target" | "colocated" | "downstream" | "human";

export const TIER_ORDER: TierId[] = ["target", "colocated", "downstream", "human"];

export interface AffectedItem {
  id: string;
  /** Category of thing that could be affected (canonical English). */
  text: string;
}

export interface BlastTier {
  tier: TierId;
  /** Canonical-English tier label. */
  label: string;
  items: AffectedItem[];
}

export interface ContainmentMeasure {
  id: string;
  /** Imperative measure that would shrink the radius. */
  text: string;
}

export interface BlastResult {
  tiers: BlastTier[];
  risks: RiskFactor[];
  containment: ContainmentMeasure[];
  warnings: QualityWarning[];
  firedRuleIds: string[];
  presetUsed: PresetId;
  /** A coarse overall-radius band derived from the fired risks (advisory). */
  radiusBand: "contained" | "moderate" | "wide";
  artifact: ExportArtifact;
}

export class BlastError extends Error {
  code: "empty" | "format";
  constructor(code: "empty" | "format", message?: string) {
    super(message ?? code);
    this.name = "BlastError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Tier labels.
// ----------------------------------------------------------------------------

const TIER_LABELS: Record<TierId, string> = {
  target: "The change target itself",
  colocated: "Co-located (shares the device or platform)",
  downstream: "Downstream (depends on the target)",
  human: "Human and business surface",
};

// ----------------------------------------------------------------------------
// Affected-item catalogue. Rules reference items by id; an item appears once
// per tier, ordered by first-fire. Original editorial content (D-18).
// ----------------------------------------------------------------------------

interface ItemDef {
  id: string;
  tier: TierId;
  text: string;
}

const ITEMS: ItemDef[] = [
  // ---- target tier ----
  { id: "I-TGT-DIRECT", tier: "target", text: "The service or object being changed directly - it is expected to be affected; the point is that this is the intended surface." },
  { id: "I-TGT-SESSIONS", tier: "target", text: "Any live sessions or connections currently terminating on the target - they may drop if not drained first." },
  { id: "I-TGT-CONFIG-STATE", tier: "target", text: "The target's own persisted state and configuration - the thing your backup must capture before you start." },

  // ---- colocated tier ----
  { id: "I-CO-SAME-DEVICE", tier: "colocated", text: "Other services running on the same device or appliance - a device-wide fault (reboot, resource exhaustion, a bad global config) hits them too." },
  { id: "I-CO-SHARED-CPU", tier: "colocated", text: "Neighbours sharing the target's CPU, memory, or connection table - a change that spikes resource use can starve them." },
  { id: "I-CO-SAME-PLATFORM", tier: "colocated", text: "Other tenants on the same shared platform or cluster node - blast can cross tenant boundaries when the platform layer is touched." },
  { id: "I-CO-HA-PEER", tier: "colocated", text: "The HA peer or cluster members - a change that desyncs or fails over affects them, and a change made while the peer is degraded has no safety net." },

  // ---- downstream tier ----
  { id: "I-DS-DEPENDENTS", tier: "downstream", text: "Services that call or depend on the target - if it degrades, they see it as their own failure and may page their own owners." },
  { id: "I-DS-CACHED-ANSWERS", tier: "downstream", text: "Anything caching the target's answers (resolvers, CDNs, clients) - for a DNS or config change, stale answers linger for the TTL after you change the record." },
  { id: "I-DS-EVERY-TLS-CLIENT", tier: "downstream", text: "Every client that completes a TLS handshake with the target - a wrong key or chain breaks all of them at once, not gradually." },
  { id: "I-DS-EVERY-FLOW", tier: "downstream", text: "Every flow that traverses the target in the traffic path - an in-path change affects transit, not just endpoints, so the reach is everything that passes through." },
  { id: "I-DS-TRANSITIVE", tier: "downstream", text: "The dependents' own dependents - blast can propagate a second hop when many things depend on the target, so the reach is wider than the direct callers." },

  // ---- human tier ----
  { id: "I-HU-USERS", tier: "human", text: "The end users behind the affected services - the people who feel the impact and open the tickets." },
  { id: "I-HU-CUSTOMER", tier: "human", text: "Customers and any external SLA - customer-facing impact is visible outside the organization and may carry contractual weight." },
  { id: "I-HU-ONCALL", tier: "human", text: "The on-call and support surface - a wide change during load means more pages, more tickets, and more people pulled in." },
  { id: "I-HU-EVERYONE", tier: "human", text: "Effectively the whole user base - when everything depends on the target, the human surface is everyone at once." },
];

const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

// ----------------------------------------------------------------------------
// Risk registry (severity-tagged). This tool is RiskFactor's main consumer.
// ----------------------------------------------------------------------------

const RISKS: { id: string; label: string; severity: RiskFactor["severity"]; note?: string }[] = [
  { id: "RK-IN-PATH", label: "In the live traffic path", severity: "high", note: "Everything passing through is exposed, not just the endpoints; an in-path change has an inherently wide reach." },
  { id: "RK-EVERYTHING-DEPENDS", label: "Everything depends on the target", severity: "high", note: "The downstream tier is effectively the whole estate; treat this as a maximum-blast change." },
  { id: "RK-HEAVILY-SHARED", label: "Heavily shared hardware or platform", severity: "high", note: "A device-wide fault crosses into many co-located services; the radius is much wider than the target alone." },
  { id: "RK-NO-REDUNDANCY", label: "No redundancy (standalone)", severity: "high", note: "There is no peer to carry load; any interruption is a full interruption of the target." },
  { id: "RK-HA-DEGRADED", label: "HA peer already degraded", severity: "high", note: "The safety net is compromised before you start; a change now risks losing the last healthy unit." },
  { id: "RK-CUSTOMER-FACING", label: "Customer-facing reach", severity: "medium", note: "Impact is visible outside the organization and may carry SLA weight; comms matter more here." },
  { id: "RK-EVERYONE", label: "Reaches the entire user base", severity: "high", note: "The human surface is everyone at once; the cost of a slip is maximal." },
  { id: "RK-MANY-DEPENDENTS", label: "Many downstream dependents", severity: "medium", note: "Failure propagates to many callers and possibly their callers; the reach is wider than the direct target." },
  { id: "RK-TLS-ALL-CLIENTS", label: "Certificate change affects every TLS client", severity: "medium", note: "A wrong key or chain breaks the handshake for all clients simultaneously; verify the pair and chain before install." },
  { id: "RK-DNS-TTL-LINGER", label: "DNS answers linger for the TTL", severity: "medium", note: "The old answer stays cached downstream for the record's TTL; the change is not undone the instant you fix the record." },
  { id: "RK-SOME-SHARED", label: "Some shared hardware or platform", severity: "low", note: "A few co-located services could be caught by a device-wide fault; confirm what else rides this device." },
];

const RISK_BY_ID = new Map(RISKS.map((r) => [r.id, r]));

// ----------------------------------------------------------------------------
// Containment catalogue - measures that shrink the radius.
// ----------------------------------------------------------------------------

const CONTAINMENTS: { id: string; text: string }[] = [
  { id: "C-DRAIN", text: "Drain sessions from the target before the change so live connections finish rather than drop." },
  { id: "C-ONE-NODE", text: "Change one node first and verify it there before rolling across the rest, so a mistake costs one unit, not the service." },
  { id: "C-FAILOVER-FIRST", text: "Fail over to the healthy peer and change the standby first, keeping the active path untouched until the change is proven." },
  { id: "C-LOWER-TTL", text: "Lower the record's TTL ahead of the change so a bad answer expires from caches quickly instead of lingering." },
  { id: "C-STAGE-VERIFY-CERT", text: "Stage and verify the new key, certificate, and full chain offline before installing, so no client meets a broken handshake." },
  { id: "C-MAINT-WINDOW", text: "Move the change into a maintenance window so the human surface is smallest when the reach is widest." },
  { id: "C-ISOLATE-NEIGHBOURS", text: "Confirm what else shares this device and, where possible, move the change to a time those neighbours can tolerate too." },
  { id: "C-RESTORE-REDUNDANCY", text: "Restore the degraded peer to health before changing anything, so there is a safety net during the change." },
  { id: "C-COMMS", text: "Send targeted comms to the downstream owners and, if customer-facing, to customers, so the impact is expected rather than discovered." },
];

const CONTAINMENT_BY_ID = new Map(CONTAINMENTS.map((c) => [c.id, c]));

// ----------------------------------------------------------------------------
// Rule registry. Rules populate tiers (via item ids), attach risks, and
// suggest containment. Original editorial work (D-18).
// ----------------------------------------------------------------------------

interface Rule {
  id: string;
  when: (i: BlastInput) => boolean;
  items?: string[];
  risk?: string;
  containment?: string[];
  because: string;
}

const RULES: Rule[] = [
  // Spine: the target tier always has the direct object + its state.
  {
    id: "R-BASE-TARGET",
    when: () => true,
    items: ["I-TGT-DIRECT", "I-TGT-CONFIG-STATE"],
    because: "Every change has a target tier: the object being changed and the persisted state your backup must capture.",
  },
  // In-path -> sessions at risk, every flow downstream, in-path risk, drain.
  {
    id: "R-IN-PATH",
    when: (i) => i.trafficPath === "in-path",
    items: ["I-TGT-SESSIONS", "I-DS-EVERY-FLOW"],
    risk: "RK-IN-PATH",
    containment: ["C-DRAIN"],
    because: "The target is in the live traffic path, so live sessions on it are at risk and every flow that traverses it is exposed - drain before touching it.",
  },
  // Colocation tiers.
  {
    id: "R-HEAVILY-SHARED",
    when: (i) => i.colocation === "heavily-shared",
    items: ["I-CO-SAME-DEVICE", "I-CO-SHARED-CPU", "I-CO-SAME-PLATFORM"],
    risk: "RK-HEAVILY-SHARED",
    containment: ["C-ISOLATE-NEIGHBOURS"],
    because: "The target sits on heavily shared hardware or a shared platform, so a device-wide fault reaches many co-located services and even other tenants.",
  },
  {
    id: "R-SOME-SHARED",
    when: (i) => i.colocation === "some-shared",
    items: ["I-CO-SAME-DEVICE"],
    risk: "RK-SOME-SHARED",
    containment: ["C-ISOLATE-NEIGHBOURS"],
    because: "Some services share the target's device, so a device-wide fault could catch them; confirm what else rides it.",
  },
  // Redundancy tiers.
  {
    id: "R-HA-PAIR",
    when: (i) => i.redundancy === "ha-pair-healthy" || i.redundancy === "cluster",
    items: ["I-CO-HA-PEER"],
    containment: ["C-FAILOVER-FIRST", "C-ONE-NODE"],
    because: "There is an HA peer or cluster, so the peer/members are in the co-located tier - and you can fail over and change the standby first to keep the active path untouched.",
  },
  {
    id: "R-HA-DEGRADED",
    when: (i) => i.redundancy === "ha-pair-degraded",
    items: ["I-CO-HA-PEER"],
    risk: "RK-HA-DEGRADED",
    containment: ["C-RESTORE-REDUNDANCY"],
    because: "The HA peer is already degraded, so the safety net is compromised before you start; restore it to health first.",
  },
  {
    id: "R-STANDALONE",
    when: (i) => i.redundancy === "standalone",
    risk: "RK-NO-REDUNDANCY",
    containment: ["C-MAINT-WINDOW"],
    because: "The target is standalone with no peer to carry load, so any interruption is a full interruption - shrink the human surface with a maintenance window.",
  },
  // Dependents tiers.
  {
    id: "R-EVERYTHING-DEPENDS",
    when: (i) => i.dependents === "everything",
    items: ["I-DS-DEPENDENTS", "I-DS-TRANSITIVE"],
    risk: "RK-EVERYTHING-DEPENDS",
    containment: ["C-ONE-NODE", "C-COMMS"],
    because: "Effectively everything depends on the target, so the downstream tier is the whole estate, including dependents of dependents - a maximum-blast change.",
  },
  {
    id: "R-MANY-DEPENDS",
    when: (i) => i.dependents === "many",
    items: ["I-DS-DEPENDENTS", "I-DS-TRANSITIVE"],
    risk: "RK-MANY-DEPENDENTS",
    containment: ["C-COMMS"],
    because: "Many things depend on the target, so failure propagates to many callers and possibly their callers; the reach is wider than the direct target.",
  },
  {
    id: "R-FEW-DEPENDS",
    when: (i) => i.dependents === "a-few",
    items: ["I-DS-DEPENDENTS"],
    containment: ["C-COMMS"],
    because: "A few services depend on the target, so they belong in the downstream tier and their owners should be told.",
  },
  // User reach -> human tier.
  {
    id: "R-EVERYONE",
    when: (i) => i.userReach === "everyone",
    items: ["I-HU-USERS", "I-HU-EVERYONE", "I-HU-ONCALL"],
    risk: "RK-EVERYONE",
    containment: ["C-MAINT-WINDOW"],
    because: "The reach is the entire user base, so the human surface is everyone at once and the on-call load rises with it.",
  },
  {
    id: "R-CUSTOMER",
    when: (i) => i.userReach === "customer-facing",
    items: ["I-HU-USERS", "I-HU-CUSTOMER"],
    risk: "RK-CUSTOMER-FACING",
    containment: ["C-COMMS"],
    because: "The reach is customer-facing, so customers and any SLA are on the human surface and comms carry more weight.",
  },
  {
    id: "R-USERS-NARROW",
    when: (i) => i.userReach === "internal-team" || i.userReach === "one-app" || i.userReach === "one-site",
    items: ["I-HU-USERS"],
    because: "There is a bounded set of users behind the target; they belong on the human surface even when the reach is narrow.",
  },
  // Target-type specifics.
  {
    id: "R-CERT-TARGET",
    when: (i) => i.target === "certificate",
    items: ["I-DS-EVERY-TLS-CLIENT"],
    risk: "RK-TLS-ALL-CLIENTS",
    containment: ["C-STAGE-VERIFY-CERT"],
    because: "The target is a certificate, so every TLS client is downstream and a wrong key or chain breaks all of them at once.",
  },
  {
    id: "R-DNS-TARGET",
    when: (i) => i.target === "dns-record" || i.preset === "dns",
    items: ["I-DS-CACHED-ANSWERS"],
    risk: "RK-DNS-TTL-LINGER",
    containment: ["C-LOWER-TTL"],
    because: "A DNS record (or DNS-flavored change) propagates over the TTL, so caches downstream hold the old answer until it expires.",
  },
  {
    id: "R-SESSIONS-LB",
    when: (i) => (i.target === "load-balancer" || i.preset === "load-balancer") && i.trafficPath !== "in-path",
    items: ["I-TGT-SESSIONS"],
    containment: ["C-DRAIN"],
    because: "A load balancer terminates connections, so its live sessions are at risk even when you would not call the change 'in-path' - drain them first.",
  },
];

// ----------------------------------------------------------------------------
// Validation (closed-enum).
// ----------------------------------------------------------------------------

const VALID = {
  target: ["single-server", "network-device", "load-balancer", "dns-record", "certificate", "firewall-policy", "shared-platform", "database"],
  colocation: ["dedicated", "some-shared", "heavily-shared"],
  trafficPath: ["in-path", "control-plane", "out-of-band"],
  dependents: ["none-known", "a-few", "many", "everything"],
  redundancy: ["ha-pair-healthy", "ha-pair-degraded", "cluster", "standalone"],
  userReach: ["internal-team", "one-app", "one-site", "customer-facing", "everyone"],
  preset: ["generic", "load-balancer", "dns", "tls-pki", "firewall"],
} as const;

export function validateInput(raw: unknown): BlastInput {
  const i = raw as Partial<BlastInput>;
  if (!i || typeof i !== "object") throw new BlastError("format", "input must be an object");
  for (const f of ["target", "colocation", "trafficPath", "dependents", "redundancy", "userReach", "preset"] as const) {
    if (typeof i[f] !== "string" || !(VALID[f] as readonly string[]).includes(i[f] as string)) {
      throw new BlastError("format", `invalid ${f}`);
    }
  }
  return i as BlastInput;
}

// ----------------------------------------------------------------------------
// run - fire the rule registry, populate the concentric tiers, attach risks
// and containment, derive the coarse radius band, and build the assessment
// artifact. Fully deterministic.
// ----------------------------------------------------------------------------

export function run(rawInput: BlastInput | unknown): BlastResult {
  const input = validateInput(rawInput);

  const fired = RULES.filter((r) => r.when(input));

  // Collect item ids (first-fire order, dedup), risk ids, containment ids.
  const itemOrder: string[] = [];
  const seenItem = new Set<string>();
  const riskIds: string[] = [];
  const seenRisk = new Set<string>();
  const containIds: string[] = [];
  const seenContain = new Set<string>();
  for (const r of fired) {
    for (const it of r.items ?? []) {
      if (!seenItem.has(it)) { seenItem.add(it); itemOrder.push(it); }
    }
    if (r.risk && !seenRisk.has(r.risk)) { seenRisk.add(r.risk); riskIds.push(r.risk); }
    for (const c of r.containment ?? []) {
      if (!seenContain.has(c)) { seenContain.add(c); containIds.push(c); }
    }
  }

  // Group items into tiers, tiers in TIER_ORDER, items in first-fire order.
  const tiers: BlastTier[] = TIER_ORDER.map((tier) => {
    const items = itemOrder
      .map((id) => ITEM_BY_ID.get(id)!)
      .filter((it) => it.tier === tier)
      .map((it): AffectedItem => ({ id: it.id, text: it.text }));
    return { tier, label: TIER_LABELS[tier], items };
  }).filter((t) => t.items.length > 0);

  // Risks in registry order within the fired set (keep first-fire trail order).
  const risks: RiskFactor[] = RISKS.filter((r) => seenRisk.has(r.id)).map((r) => ({ id: r.id, label: r.label, severity: r.severity, note: r.note }));
  risks.sort((a, b) => riskIds.indexOf(a.id) - riskIds.indexOf(b.id));

  // Containment in first-fire order.
  const containment: ContainmentMeasure[] = containIds.map((id) => {
    const c = CONTAINMENT_BY_ID.get(id)!;
    return { id: c.id, text: c.text };
  });

  // Warnings (deterministic, about the input).
  const warnings: QualityWarning[] = [];
  if (input.redundancy === "ha-pair-degraded") {
    warnings.push({ id: "W-DEGRADED-PEER", message: "You marked the HA peer degraded. Changing now risks losing the last healthy unit; restoring the peer first is usually the safer sequence." });
  }
  if (input.trafficPath === "in-path" && input.dependents === "everything") {
    warnings.push({ id: "W-MAX-BLAST", message: "In the traffic path and everything depends on it: this is close to a maximum-blast change. Weight the plan heavily toward containment and a maintenance window." });
  }
  if (input.colocation === "heavily-shared" && input.userReach === "everyone") {
    warnings.push({ id: "W-SHARED-EVERYONE", message: "Heavily shared and reaching everyone: a device-wide fault here has an unusually wide human surface. Confirm exactly what else rides this device before proceeding." });
  }

  // Coarse radius band from the highest-severity fired risk (advisory only).
  const hasHigh = risks.some((r) => r.severity === "high");
  const hasMed = risks.some((r) => r.severity === "medium");
  const radiusBand: BlastResult["radiusBand"] = hasHigh ? "wide" : hasMed ? "moderate" : "contained";

  // The assessment artifact (usable, not decorative).
  const situationLines = [
    `- Target: ${input.target}`,
    `- Co-location: ${input.colocation}`,
    `- Traffic path: ${input.trafficPath}`,
    `- Downstream dependents: ${input.dependents}`,
    `- Redundancy: ${input.redundancy}`,
    `- User reach: ${input.userReach}`,
  ];
  if (input.notes?.summary) situationLines.push(`- Summary: ${input.notes.summary}`);
  if (input.notes?.targetDetail) situationLines.push(`- Target detail: ${input.notes.targetDetail}`);

  const sections: [string, string][] = [
    ["Change target", situationLines.join("\n")],
    [`Overall radius: ${radiusBand}`, radiusBandNote(radiusBand)],
  ];
  for (const t of tiers) {
    sections.push([t.label, t.items.map((it) => `- ${it.text}`).join("\n")]);
  }
  if (risks.length) {
    sections.push([
      "Risk factors",
      risks.map((r) => `- (${r.severity}) ${r.label}${r.note ? ` - ${r.note}` : ""}`).join("\n"),
    ]);
  }
  if (containment.length) {
    sections.push([
      "Containment measures (shrink the radius)",
      containment.map((c) => `- [ ] ${c.text}`).join("\n"),
    ]);
  }
  if (warnings.length) {
    sections.push(["Cautions", warnings.map((w) => `- ${w.message}`).join("\n")]);
  }
  sections.push([
    "Method note",
    "This maps the SHAPE of the blast radius from what you described - the categories of thing in each tier that could be affected, not an enumeration of your actual topology. It maps what could be affected; it does not assert what will break. Confirm the specifics against your real environment. Generated locally in the browser; nothing was uploaded.",
  ]);

  const artifact: ExportArtifact = {
    kind: "blast-radius-assessment",
    title: "Change blast-radius assessment",
    sections,
  };

  return {
    tiers,
    risks,
    containment,
    warnings,
    firedRuleIds: fired.map((r) => r.id),
    presetUsed: input.preset,
    radiusBand,
    artifact,
  };
}

function radiusBandNote(band: BlastResult["radiusBand"]): string {
  switch (band) {
    case "wide":
      return "At least one high-severity factor is present. Treat the reach as wide: lean on containment, sequence carefully, and prefer a maintenance window.";
    case "moderate":
      return "Medium-severity factors are present. The reach is more than the target alone; apply the containment measures below.";
    case "contained":
      return "No high or medium factors surfaced from what you described. The reach appears contained - still confirm against the real environment.";
  }
}

/** API-parity entry (D-72): structured JSON string in, result out. */
export function runFromJson(json: string): BlastResult {
  const trimmed = json.trim();
  if (trimmed === "") throw new BlastError("empty");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new BlastError("format", "input must be a JSON object (see the tool doc for the schema)");
  }
  return run(parsed);
}

export { artifactToMarkdown };
export const RULE_COUNT = RULES.length;
export const ITEM_COUNT = ITEMS.length;
export const RISK_COUNT = RISKS.length;
export const CONTAINMENT_COUNT = CONTAINMENTS.length;

/** Rule id -> its human reason, for the "Why this map?" panel. */
export const RULE_REASONS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(RULES.map((r) => [r.id, r.because])),
);
