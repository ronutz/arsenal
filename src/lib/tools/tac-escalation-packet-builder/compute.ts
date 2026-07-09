// ============================================================================
// src/lib/tools/tac-escalation-packet-builder/compute.ts
// ----------------------------------------------------------------------------
// TAC ESCALATION PACKET BUILDER - Operations & Fieldcraft, tool 5 (D-86),
// built on the shared fieldcraft foundation.
//
// WHAT IT IS: an advisory structuring engine for the vendor-support hand-off.
// You describe the issue you are about to escalate (vendor domain, severity,
// what you have already collected, what you have already tried, whether it is
// reproducible) through a small structured form; a fixed, original rule set
// (D-18: original by construction) fires deterministically and assembles a
// COMPLETE, WELL-ORDERED ESCALATION PACKET - a problem statement skeleton, the
// environment and timeline sections a support engineer needs, what has been
// tried, what is attached - and, crucially, a CHECKLIST OF THE ARTIFACTS STILL
// TO COLLECT before opening the case, because the single biggest cause of slow
// TAC cases is a first contact that is missing the diagnostic the vendor will
// ask for anyway. One click exports the packet as Markdown for the case.
//
// WHAT IT IS NOT (D-86 §3.5 guardrails, binding): it does not open a case,
// does not contact any vendor, makes no network calls, asks for no credentials
// or secrets, and does not itself collect diagnostics from your systems (it
// tells you WHICH to attach; you collect them). It also does not diagnose the
// issue - it structures the hand-off. The vendor names are nominative (D-27)
// and no preset implies any training or support-partner authorization.
//
// DETERMINISM & VERIFICATION (D-86 §3.1 - the pilot's ruling): same input ->
// same packet sections, same to-collect checklist, same readiness warnings.
// Verification model: RULE-FIRING SNAPSHOT VECTORS. The D-49 manifest carries
// `verificationModel: "rule-firing-snapshot"`.
//
// I18N NOTE: packet section / artifact / warning text is canonical English
// from the engine (vector-pinned); form chrome is localized. Same posture as
// the rest of the cluster.
// ============================================================================

import type {
  QualityWarning,
  ExportArtifact,
  RiskFactor,
} from "@/lib/fieldcraft/schema";
import { artifactToMarkdown } from "@/lib/fieldcraft/markdown";

// ----------------------------------------------------------------------------
// Input model (quick mode). Closed enums so packet assembly is deterministic;
// free text lives only in `notes` and flows ONLY to the export.
// ----------------------------------------------------------------------------

/** The vendor/product domain being escalated - flavors which diagnostic
 *  artifacts the checklist asks for. Nominative names, no authorization
 *  implied (D-27 / naming rule). */
export type VendorDomain =
  | "load-balancer"
  | "firewall"
  | "dns"
  | "routing-switching"
  | "tls-pki"
  | "endpoint-security"
  | "generic";

/** Case severity as the vendor would grade it - shapes the urgency framing
 *  and which readiness gates matter. */
export type Severity = "sev1-down" | "sev2-degraded" | "sev3-question" | "sev4-info";

/** Is the problem reproducible on demand? Reproduction steps are the single
 *  most valuable artifact, so this drives a to-collect item and a warning. */
export type Reproducibility = "reproducible" | "intermittent" | "happened-once";

/** Diagnostic artifacts already collected (all that apply). */
export type Collected =
  | "problem-statement"
  | "exact-error"
  | "timeline"
  | "topology"
  | "config-backup"
  | "diagnostic-bundle"
  | "packet-capture"
  | "logs"
  | "repro-steps"
  | "business-impact";

/** Remediation already attempted (all that apply). */
export type Tried =
  | "nothing-yet"
  | "restart"
  | "rollback"
  | "config-review"
  | "failover"
  | "workaround-applied"
  | "kb-search";

export interface PacketNotes {
  problemSummary?: string;
  environment?: string;
  caseReference?: string;
}

export interface PacketInput {
  vendor: VendorDomain;
  severity: Severity;
  reproducibility: Reproducibility;
  collected: Collected[];
  tried: Tried[];
  notes?: PacketNotes;
}

// ----------------------------------------------------------------------------
// Output.
// ----------------------------------------------------------------------------

export type SectionId =
  | "problem"
  | "severity-impact"
  | "environment"
  | "timeline"
  | "tried"
  | "attached"
  | "to-collect"
  | "ask";

export const SECTION_ORDER: SectionId[] = [
  "problem",
  "severity-impact",
  "environment",
  "timeline",
  "tried",
  "attached",
  "to-collect",
  "ask",
];

export interface PacketLine {
  id: string;
  text: string;
}

export interface PacketSection {
  section: SectionId;
  /** Canonical-English section title. */
  title: string;
  lines: PacketLine[];
}

export interface ToCollectItem {
  id: string;
  /** The artifact to collect before opening the case. */
  text: string;
  /** Optional command-level hint, vendor-flavored where one applies. */
  command?: string;
}

export interface PacketResult {
  sections: PacketSection[];
  toCollect: ToCollectItem[];
  warnings: QualityWarning[];
  /** Non-blocking readiness notes about the packet's completeness. */
  risks: RiskFactor[];
  firedRuleIds: string[];
  vendorUsed: VendorDomain;
  /** A coarse readiness read: how ready this packet is to open a case. */
  readiness: "ready" | "nearly" | "gather-first";
  artifact: ExportArtifact;
}

export class PacketError extends Error {
  code: "empty" | "format";
  constructor(code: "empty" | "format", message?: string) {
    super(message ?? code);
    this.name = "PacketError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Section titles.
// ----------------------------------------------------------------------------

const SECTION_TITLES: Record<SectionId, string> = {
  problem: "Problem statement",
  "severity-impact": "Severity and business impact",
  environment: "Environment",
  timeline: "Timeline",
  tried: "What has been tried",
  attached: "Attached with this case",
  "to-collect": "To collect before opening the case",
  ask: "The ask",
};

// ----------------------------------------------------------------------------
// Vendor-flavored command hint helper (nominative names, no authorization
// implied - D-27 / naming rule).
// ----------------------------------------------------------------------------

function cmd(vendor: VendorDomain, flavored: Partial<Record<VendorDomain, string>>, generic?: string): string | undefined {
  return flavored[vendor] ?? generic;
}

// ----------------------------------------------------------------------------
// To-collect artifact catalogue. Rules pull items in by id; each appears once,
// first-fire order. Vendor-flavored commands where one applies. Original
// editorial content (D-18); the diagnostic names are generic operational
// artifacts, not vendor procedures reproduced.
// ----------------------------------------------------------------------------

interface CollectDef {
  id: string;
  text: string;
  command?: (v: VendorDomain) => string | undefined;
}

const COLLECT: CollectDef[] = [
  {
    id: "TC-PROBLEM",
    text: "A one-paragraph problem statement: what is broken, what you expected, and the single clearest symptom - written before you open the case, not typed into the form live.",
  },
  {
    id: "TC-ERROR",
    text: "The exact error text or code, copied verbatim (not paraphrased) - the string a support engineer will search their own knowledge base with.",
  },
  {
    id: "TC-TIMELINE",
    text: "A short timeline: when it started, what changed near then, when you noticed, and what you did - the same shape a post-incident review uses.",
  },
  {
    id: "TC-TOPOLOGY",
    text: "A simple topology or data-flow sketch showing where the affected component sits and what is on each side of it.",
  },
  {
    id: "TC-DIAG-BUNDLE",
    text: "The vendor's own diagnostic bundle from the affected device, captured while the problem is present if at all possible.",
    command: (v) =>
      cmd(v, {
        "load-balancer": "generate a qkview from the affected unit (and its peer) and note the capture time",
        firewall: "generate the vendor tech-support / diagnostic file from the affected unit",
        "routing-switching": "collect the device's show tech-support (or equivalent) output",
      }, "capture the vendor's standard diagnostic bundle from the affected device"),
  },
  {
    id: "TC-PCAP",
    text: "A packet capture taken at the point of failure while the problem is happening - filtered to the affected flow, with the capture point noted relative to the topology.",
    command: (v) =>
      cmd(v, {
        "load-balancer": "capture on the relevant VLAN/interface, both client-side and server-side of the affected virtual server",
        firewall: "capture on the ingress and egress interfaces for the affected policy",
        dns: "capture UDP/TCP 53 to and from the resolver during a failing lookup",
      }, "capture the affected traffic on both sides of the device during a failure"),
  },
  {
    id: "TC-LOGS",
    text: "The relevant logs covering the failure window, with timestamps and the time zone stated, trimmed to the incident rather than dumped wholesale.",
  },
  {
    id: "TC-REPRO",
    text: "Exact reproduction steps if the problem can be reproduced - the single most valuable artifact for a support case, because a case a vendor can reproduce moves fastest.",
  },
  {
    id: "TC-CONFIG",
    text: "The current configuration of the affected component (and its peer), or a backup of it, so the vendor can see the actual state rather than a description of it.",
    command: (v) =>
      cmd(v, {
        "load-balancer": "attach the UCS archive or the relevant partial config",
        dns: "attach the affected zone file(s)",
      }),
  },
  {
    id: "TC-IMPACT",
    text: "A clear statement of business impact - who is affected, how badly, and whether it is customer-facing - because it sets the severity the vendor assigns.",
  },
  {
    id: "TC-VERSIONS",
    text: "Exact software/firmware versions of the affected components, and of anything directly interacting with them - version mismatches are a frequent first question.",
  },
];

const COLLECT_BY_ID = new Map(COLLECT.map((c) => [c.id, c]));

// Map a "collected" enum value to the to-collect item it satisfies, so an
// already-collected artifact is dropped from the checklist (but still listed
// under "Attached").
const COLLECTED_SATISFIES: Partial<Record<Collected, string>> = {
  "problem-statement": "TC-PROBLEM",
  "exact-error": "TC-ERROR",
  timeline: "TC-TIMELINE",
  topology: "TC-TOPOLOGY",
  "config-backup": "TC-CONFIG",
  "diagnostic-bundle": "TC-DIAG-BUNDLE",
  "packet-capture": "TC-PCAP",
  logs: "TC-LOGS",
  "repro-steps": "TC-REPRO",
  "business-impact": "TC-IMPACT",
};

// ----------------------------------------------------------------------------
// Readiness notes (non-blocking, about the packet's completeness).
// ----------------------------------------------------------------------------

const RISKS: { id: string; label: string; severity: RiskFactor["severity"]; note?: string }[] = [
  { id: "RK-NO-PROBLEM", label: "No problem statement collected", severity: "high", note: "A case with no clear problem statement is the slowest kind to triage; write it before opening." },
  { id: "RK-NO-DIAG", label: "No diagnostic bundle collected", severity: "medium", note: "The vendor will ask for their diagnostic bundle first; attaching it up front skips a round trip." },
  { id: "RK-SEV1-THIN", label: "Sev1 with a thin packet", severity: "high", note: "A down-severity case with little collected will still stall on the first request for data; gather the essentials even under pressure." },
  { id: "RK-NO-REPRO-CAP", label: "Intermittent with no capture staged", severity: "medium", note: "An intermittent problem is hard to catch; stage the capture now so the next occurrence is recorded rather than missed." },
  { id: "RK-NO-IMPACT", label: "No business impact stated", severity: "low", note: "Impact sets the severity the vendor assigns; stating it up front avoids being graded lower than the situation warrants." },
];

const RISK_BY_ID = new Map(RISKS.map((r) => [r.id, r]));

// ----------------------------------------------------------------------------
// Rule registry. Rules add to-collect items, readiness notes, and shape the
// packet. Original editorial work (D-18).
// ----------------------------------------------------------------------------

interface Rule {
  id: string;
  when: (i: PacketInput) => boolean;
  collect?: string[];
  risk?: string;
  because: string;
}

const RULES: Rule[] = [
  // Spine: every packet needs the core artifacts. The to-collect dedup drops
  // any already-collected ones later.
  {
    id: "R-BASE-CORE",
    when: () => true,
    collect: ["TC-PROBLEM", "TC-ERROR", "TC-TIMELINE", "TC-IMPACT", "TC-VERSIONS"],
    because: "Every escalation needs the core: a problem statement, the exact error, a timeline, the business impact, and exact versions - the questions a support engineer asks first.",
  },
  // Missing problem statement -> readiness note.
  {
    id: "R-NO-PROBLEM",
    when: (i) => !i.collected.includes("problem-statement"),
    risk: "RK-NO-PROBLEM",
    because: "No problem statement is collected yet; a case without one is the slowest to triage.",
  },
  // Missing impact -> readiness note.
  {
    id: "R-NO-IMPACT",
    when: (i) => !i.collected.includes("business-impact"),
    risk: "RK-NO-IMPACT",
    because: "No business impact is stated; impact sets the severity the vendor assigns, so stating it up front matters.",
  },
  // Diagnostic bundle: always ask, note if missing.
  {
    id: "R-DIAG-BUNDLE",
    when: () => true,
    collect: ["TC-DIAG-BUNDLE", "TC-CONFIG"],
    because: "The vendor's diagnostic bundle and the affected configuration are near-universal first requests; attaching them up front skips a round trip.",
  },
  {
    id: "R-NO-DIAG",
    when: (i) => !i.collected.includes("diagnostic-bundle"),
    risk: "RK-NO-DIAG",
    because: "No diagnostic bundle is collected; the vendor will ask for it first.",
  },
  // Reproducible -> ask for exact repro steps.
  {
    id: "R-REPRODUCIBLE",
    when: (i) => i.reproducibility === "reproducible",
    collect: ["TC-REPRO"],
    because: "The problem is reproducible, so exact reproduction steps are the highest-value artifact - a case the vendor can reproduce moves fastest.",
  },
  // Intermittent -> stage a capture, note the difficulty.
  {
    id: "R-INTERMITTENT",
    when: (i) => i.reproducibility === "intermittent",
    collect: ["TC-PCAP", "TC-LOGS"],
    risk: "RK-NO-REPRO-CAP",
    because: "The problem is intermittent, so a capture and logs must be staged now to catch the next occurrence rather than miss it.",
  },
  // Happened once -> logs are the record you have.
  {
    id: "R-HAPPENED-ONCE",
    when: (i) => i.reproducibility === "happened-once",
    collect: ["TC-LOGS"],
    because: "The problem happened once, so the logs from that window are the primary record; collect them before they roll over.",
  },
  // Sev1/Sev2 -> topology + capture help the vendor move fast.
  {
    id: "R-HIGH-SEV",
    when: (i) => i.severity === "sev1-down" || i.severity === "sev2-degraded",
    collect: ["TC-TOPOLOGY", "TC-PCAP"],
    because: "A high-severity case benefits from a topology sketch and a capture so the vendor can act on structure and evidence rather than description.",
  },
  // Sev1 with a thin packet -> readiness note.
  {
    id: "R-SEV1-THIN",
    when: (i) => i.severity === "sev1-down" && i.collected.length < 3,
    risk: "RK-SEV1-THIN",
    because: "This is a down-severity case with little collected; it will stall on the first request for data unless the essentials are gathered.",
  },
  // Vendor-specific: TLS/PKI escalations need the chain + a handshake capture.
  {
    id: "R-TLS-VENDOR",
    when: (i) => i.vendor === "tls-pki",
    collect: ["TC-PCAP"],
    because: "A TLS/PKI escalation needs a handshake capture so the vendor can read the exact negotiation and certificate exchange.",
  },
  // Vendor-specific: DNS escalations need logs of the failing lookups.
  {
    id: "R-DNS-VENDOR",
    when: (i) => i.vendor === "dns",
    collect: ["TC-LOGS"],
    because: "A DNS escalation needs the query logs from the failing lookups so the vendor can see the actual resolution path.",
  },
];

// ----------------------------------------------------------------------------
// Validation (closed-enum).
// ----------------------------------------------------------------------------

const VALID = {
  vendor: ["load-balancer", "firewall", "dns", "routing-switching", "tls-pki", "endpoint-security", "generic"],
  severity: ["sev1-down", "sev2-degraded", "sev3-question", "sev4-info"],
  reproducibility: ["reproducible", "intermittent", "happened-once"],
  collected: ["problem-statement", "exact-error", "timeline", "topology", "config-backup", "diagnostic-bundle", "packet-capture", "logs", "repro-steps", "business-impact"],
  tried: ["nothing-yet", "restart", "rollback", "config-review", "failover", "workaround-applied", "kb-search"],
} as const;

export function validateInput(raw: unknown): PacketInput {
  const i = raw as Partial<PacketInput>;
  if (!i || typeof i !== "object") throw new PacketError("format", "input must be an object");
  for (const f of ["vendor", "severity", "reproducibility"] as const) {
    if (typeof i[f] !== "string" || !(VALID[f] as readonly string[]).includes(i[f] as string)) {
      throw new PacketError("format", `invalid ${f}`);
    }
  }
  for (const f of ["collected", "tried"] as const) {
    const arr = i[f];
    if (!Array.isArray(arr) || arr.some((v) => !(VALID[f] as readonly string[]).includes(v as string))) {
      throw new PacketError("format", `invalid ${f}`);
    }
  }
  return i as PacketInput;
}

// ----------------------------------------------------------------------------
// Human labels for the "tried" and "collected" enums (canonical English), used
// to render the packet's own sections.
// ----------------------------------------------------------------------------

const TRIED_LABELS: Record<Tried, string> = {
  "nothing-yet": "Nothing yet",
  restart: "Restarted the affected component",
  rollback: "Rolled back a recent change",
  "config-review": "Reviewed the configuration",
  failover: "Failed over to the peer",
  "workaround-applied": "Applied a workaround (still in place)",
  "kb-search": "Searched the vendor knowledge base",
};

const COLLECTED_LABELS: Record<Collected, string> = {
  "problem-statement": "Problem statement",
  "exact-error": "Exact error text/code",
  timeline: "Timeline",
  topology: "Topology / data-flow sketch",
  "config-backup": "Configuration backup",
  "diagnostic-bundle": "Vendor diagnostic bundle",
  "packet-capture": "Packet capture",
  logs: "Logs (failure window)",
  "repro-steps": "Reproduction steps",
  "business-impact": "Business impact statement",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  "sev1-down": "Sev 1 - service down",
  "sev2-degraded": "Sev 2 - degraded",
  "sev3-question": "Sev 3 - question / non-urgent",
  "sev4-info": "Sev 4 - informational",
};

// ----------------------------------------------------------------------------
// run - fire the rule registry, assemble the packet sections, compute the
// to-collect checklist (dropping already-collected artifacts), attach
// readiness notes and warnings, derive the readiness read, and build the
// packet artifact. Fully deterministic.
// ----------------------------------------------------------------------------

export function run(rawInput: PacketInput | unknown): PacketResult {
  const input = validateInput(rawInput);

  const fired = RULES.filter((r) => r.when(input));

  // To-collect ids in first-fire order (dedup), MINUS anything already collected.
  const satisfied = new Set<string>();
  for (const c of input.collected) {
    const tc = COLLECTED_SATISFIES[c];
    if (tc) satisfied.add(tc);
  }
  const collectOrder: string[] = [];
  const seenCollect = new Set<string>();
  for (const r of fired) {
    for (const c of r.collect ?? []) {
      if (!seenCollect.has(c) && !satisfied.has(c)) {
        seenCollect.add(c);
        collectOrder.push(c);
      }
    }
  }
  const toCollect: ToCollectItem[] = collectOrder.map((id) => {
    const def = COLLECT_BY_ID.get(id)!;
    return { id: def.id, text: def.text, command: def.command?.(input.vendor) };
  });

  // Readiness notes (registry order within the fired set).
  const riskIds: string[] = [];
  const seenRisk = new Set<string>();
  for (const r of fired) {
    if (r.risk && !seenRisk.has(r.risk)) { seenRisk.add(r.risk); riskIds.push(r.risk); }
  }
  const risks: RiskFactor[] = RISKS.filter((r) => seenRisk.has(r.id)).map((r) => ({ id: r.id, label: r.label, severity: r.severity, note: r.note }));
  risks.sort((a, b) => riskIds.indexOf(a.id) - riskIds.indexOf(b.id));

  // Warnings (deterministic, about the input).
  const warnings: QualityWarning[] = [];
  if (input.tried.length === 1 && input.tried[0] === "nothing-yet") {
    warnings.push({ id: "W-NOTHING-TRIED", message: "Nothing has been tried yet. Vendors triage faster when you show what you already ruled out; a quick config review or KB search before escalating often helps - and occasionally resolves it." });
  }
  if (input.tried.includes("workaround-applied")) {
    warnings.push({ id: "W-WORKAROUND-NOTE", message: "A workaround is in place. State it explicitly in the packet, including what it masks, so the vendor knows the current behavior is not the raw fault." });
  }
  if (input.severity === "sev1-down" && !input.collected.includes("business-impact")) {
    warnings.push({ id: "W-SEV1-NO-IMPACT", message: "This is a Sev 1 with no business impact stated. For a down case the impact statement is what justifies the severity; include it so the case is graded correctly." });
  }

  // Coarse readiness read.
  const hasHigh = risks.some((r) => r.severity === "high");
  const hasMed = risks.some((r) => r.severity === "medium");
  const readiness: PacketResult["readiness"] = hasHigh ? "gather-first" : hasMed ? "nearly" : "ready";

  // Assemble the packet sections (fixed order).
  const sections: PacketSection[] = [];

  // problem
  sections.push({
    section: "problem",
    title: SECTION_TITLES.problem,
    lines: [
      { id: "P-1", text: input.notes?.problemSummary?.trim() || "(Write the one-paragraph problem statement here: what is broken, what you expected, the clearest symptom.)" },
    ],
  });
  // severity-impact
  sections.push({
    section: "severity-impact",
    title: SECTION_TITLES["severity-impact"],
    lines: [
      { id: "SI-1", text: `Severity: ${SEVERITY_LABELS[input.severity]}` },
      { id: "SI-2", text: input.collected.includes("business-impact") ? "Business impact: collected (attach the impact statement)." : "Business impact: not yet stated - add who is affected, how badly, and whether it is customer-facing." },
    ],
  });
  // environment
  sections.push({
    section: "environment",
    title: SECTION_TITLES.environment,
    lines: [
      { id: "EN-1", text: input.notes?.environment?.trim() || "(State the affected product/version and where it sits: the vendor asks this first.)" },
    ],
  });
  // timeline
  sections.push({
    section: "timeline",
    title: SECTION_TITLES.timeline,
    lines: [
      { id: "TL-1", text: input.collected.includes("timeline") ? "Timeline: collected (attach or paste it)." : "Timeline: not yet collected - when it started, what changed near then, when you noticed, what you did." },
    ],
  });
  // tried
  sections.push({
    section: "tried",
    title: SECTION_TITLES.tried,
    lines: input.tried.length
      ? input.tried.map((t, idx) => ({ id: `TR-${idx + 1}`, text: TRIED_LABELS[t] }))
      : [{ id: "TR-0", text: "(List what you have already tried and the result of each.)" }],
  });
  // attached
  sections.push({
    section: "attached",
    title: SECTION_TITLES.attached,
    lines: input.collected.length
      ? input.collected.map((c, idx) => ({ id: `AT-${idx + 1}`, text: COLLECTED_LABELS[c] }))
      : [{ id: "AT-0", text: "(Nothing collected yet - see the checklist below.)" }],
  });
  // to-collect
  sections.push({
    section: "to-collect",
    title: SECTION_TITLES["to-collect"],
    lines: toCollect.length
      ? toCollect.map((tc) => ({ id: tc.id, text: tc.text + (tc.command ? `\n      \`${tc.command}\`` : "") }))
      : [{ id: "TC-DONE", text: "The core artifacts are all marked collected. Give the packet a final read before opening the case." }],
  });
  // ask
  sections.push({
    section: "ask",
    title: SECTION_TITLES.ask,
    lines: [
      { id: "AK-1", text: askLine(input.severity) },
    ],
  });

  // The packet artifact (usable, not decorative).
  const artifactSections: [string, string][] = sections.map((s) => [
    s.title,
    s.lines.map((l) => (s.section === "to-collect" ? `- [ ] ${l.text}` : `- ${l.text}`)).join("\n"),
  ]);
  if (input.notes?.caseReference) {
    artifactSections.unshift(["Case reference", input.notes.caseReference]);
  }
  artifactSections.push([
    "Method note",
    "This structures the escalation hand-off and lists the artifacts to collect before opening the case; it does not open a case, contact any vendor, or collect diagnostics from your systems - it tells you which to attach. It does not diagnose the issue. Vendor names are used only to indicate which artifact applies. Generated locally in the browser; nothing was uploaded.",
  ]);

  const artifact: ExportArtifact = {
    kind: "tac-escalation-packet",
    title: "TAC escalation packet",
    sections: artifactSections,
  };

  return {
    sections,
    toCollect,
    warnings,
    risks,
    firedRuleIds: fired.map((r) => r.id),
    vendorUsed: input.vendor,
    readiness,
    artifact,
  };
}

function askLine(sev: Severity): string {
  switch (sev) {
    case "sev1-down":
      return "State plainly that service is down, the impact, and that you need urgent engagement; name your available bridge and contact method.";
    case "sev2-degraded":
      return "State what is degraded and the impact, and ask for engagement within the severity's target; note your availability.";
    case "sev3-question":
      return "Frame the specific question or behavior you want explained, so the case is answerable rather than open-ended.";
    case "sev4-info":
      return "State that this is informational or a documentation/clarification request, so it is triaged accordingly.";
  }
}

/** API-parity entry (D-72): structured JSON string in, result out. */
export function runFromJson(json: string): PacketResult {
  const trimmed = json.trim();
  if (trimmed === "") throw new PacketError("empty");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new PacketError("format", "input must be a JSON object (see the tool doc for the schema)");
  }
  return run(parsed);
}

export { artifactToMarkdown };
export const RULE_COUNT = RULES.length;
export const COLLECT_COUNT = COLLECT.length;
export const SECTION_COUNT = SECTION_ORDER.length;

/** Rule id -> its human reason, for the "Why this checklist?" panel. */
export const RULE_REASONS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(RULES.map((r) => [r.id, r.because])),
);
