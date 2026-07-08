// ============================================================================
// src/lib/tools/change-window-runbook-builder/compute.ts
// ----------------------------------------------------------------------------
// CHANGE WINDOW RUNBOOK BUILDER - Operations & Fieldcraft, tool 2 (D-86).
//
// WHAT IT IS: an advisory, sequencing engine. You describe a PLANNED change
// through a small structured form (quick mode); a fixed, original rule set
// (D-18: original by construction) fires deterministically and ASSEMBLES AN
// ORDERED RUNBOOK - pre-flight checks, approval and comms checkpoints, the
// execution sequence, verification, explicit rollback triggers, and a
// post-change close-out - plus risk factors the plan should carry and gate
// warnings about readiness (an untested rollback for a one-way change is
// named, not hidden). One click exports a Markdown runbook for the change
// ticket or the bridge.
//
// WHAT IT IS NOT (D-86 §3.5 guardrails, binding): it does not APPROVE a
// change, does not EXECUTE anything, opens no network connections, asks for
// no credentials or secrets, and replaces neither the change-approval process
// nor production review. It structures and sequences; a human runs and signs
// off. The language discipline (D-86 §3.2) holds in the strings: the tool
// proposes a runbook to review and adapt, it never certifies a change safe.
//
// DETERMINISM & VERIFICATION (D-86 §3.1 - THE PILOT'S RULING, cluster-wide):
// an advisory tool has no single "correct" runbook, but the engine is FULLY
// deterministic: same structured input -> same rules fire, same steps in the
// same phase order, same risk factors, same warnings. The verification model
// is therefore RULE-FIRING SNAPSHOT VECTORS (the FHB pilot's ruling): per
// input, assert exactly which rules fire (registry order), the exact ordered
// step ids per phase, the exact risk-factor ids, and the exact warning set.
// The D-49 manifest carries `verificationModel: "rule-firing-snapshot"`.
//
// I18N NOTE: runbook step / risk / warning text is canonical English from the
// engine (vector-pinned), like the site's other deep technical outputs; all
// form chrome is localized. Recorded in the wrap, same posture as the FHB.
// ============================================================================

import type {
  RiskFactor,
  QualityWarning,
  ExportArtifact,
} from "@/lib/fieldcraft/schema";
import { artifactToMarkdown } from "@/lib/fieldcraft/markdown";

// ----------------------------------------------------------------------------
// Input model (quick mode). Every field is a closed enum so rule firing is
// deterministic; free text lives only in `notes` and flows ONLY to the export
// artifact, never into rule matching (identical discipline to the FHB pilot).
// ----------------------------------------------------------------------------

export type ChangeType =
  | "config-change"
  | "software-upgrade"
  | "cert-rotation"
  | "network-change"
  | "scale-capacity"
  | "failover-maintenance"
  | "emergency-fix";

export type Environment =
  | "production-critical"
  | "production-standard"
  | "staging"
  | "dr-site";

export type BlastRadius =
  | "single-device"
  | "one-service"
  | "one-site"
  | "shared-infra"
  | "everyone";

export type Reversibility =
  | "easy-rollback"
  | "config-backup-only"
  | "hard-to-reverse"
  | "one-way-door";

export type Window =
  | "business-hours"
  | "after-hours"
  | "maintenance-window"
  | "emergency-now";

export type Safeguard =
  | "change-approved"
  | "backup-taken"
  | "rollback-tested"
  | "peer-review"
  | "monitoring-ready"
  | "comms-sent"
  | "maintenance-notice";

export type PresetId =
  | "generic"
  | "load-balancer"
  | "dns"
  | "tls-pki"
  | "firewall";

export interface RunbookNotes {
  summary?: string;
  changeDetail?: string;
  backoutOwner?: string;
}

export interface RunbookInput {
  changeType: ChangeType;
  environment: Environment;
  blastRadius: BlastRadius;
  reversibility: Reversibility;
  window: Window;
  safeguards: Safeguard[];
  preset: PresetId;
  /** Free text; artifact-only by design (kept out of rule matching). */
  notes?: RunbookNotes;
}

// ----------------------------------------------------------------------------
// The runbook is assembled into FIXED phases, always in this operational
// order. Rules add steps to phases; the phase order never changes, so the
// output reads like a real runbook top to bottom.
// ----------------------------------------------------------------------------

export type PhaseId =
  | "preflight"
  | "approvals"
  | "execution"
  | "verification"
  | "rollback"
  | "closeout";

export const PHASE_ORDER: PhaseId[] = [
  "preflight",
  "approvals",
  "execution",
  "verification",
  "rollback",
  "closeout",
];

export interface RunbookStep {
  id: string;
  phase: PhaseId;
  /** Imperative, concrete instruction. */
  text: string;
  /** Optional command-level hint, preset-flavored where a preset applies. */
  command?: string;
}

export interface RunbookResult {
  /** Steps grouped by phase, each phase in PHASE_ORDER, steps in fire order. */
  phases: { phase: PhaseId; steps: RunbookStep[] }[];
  /** Risk factors the plan should carry (severity-tagged). */
  risks: RiskFactor[];
  /** Readiness cautions about the INPUT (missing safeguards, etc.). */
  warnings: QualityWarning[];
  /** Every rule that fired, in registry order - the "Why these steps?" feed. */
  firedRuleIds: string[];
  presetUsed: PresetId;
  artifact: ExportArtifact;
}

export class RunbookError extends Error {
  code: "empty" | "format";
  constructor(code: "empty" | "format", message?: string) {
    super(message ?? code);
    this.name = "RunbookError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Preset-flavored command hint helper: returns the flavored command when the
// active preset has one, otherwise the generic (or none). Vendor names are
// nominative (D-27); no preset implies training authorization (naming rule).
// ----------------------------------------------------------------------------

function cmd(
  preset: PresetId,
  flavored: Partial<Record<PresetId, string>>,
  generic?: string,
): string | undefined {
  return flavored[preset] ?? generic;
}

// ----------------------------------------------------------------------------
// Step registry. Each step definition has an id, its phase, its text, and an
// optional preset-flavored command. Rules reference steps by id; a step
// appears in the runbook exactly once, in the phase it belongs to, ordered by
// the first rule that pulled it in. Steps are original editorial content
// encoding standard change-management practice (ITIL-style pre/exec/verify/
// back-out phasing); no external specification is reproduced.
// ----------------------------------------------------------------------------

interface StepDef {
  id: string;
  phase: PhaseId;
  text: string;
  command?: (p: PresetId) => string | undefined;
}

const STEPS: StepDef[] = [
  // ---- Pre-flight ----
  {
    id: "S-PF-SCOPE",
    phase: "preflight",
    text: "Write down exactly what is changing, on which systems, and the precise start and end you expect - the same words go in the change ticket.",
  },
  {
    id: "S-PF-BACKUP",
    phase: "preflight",
    text: "Take a fresh configuration backup of every device you will touch and confirm it is readable before you start.",
    command: (p) =>
      cmd(
        p,
        {
          "load-balancer": "save sys config; save a UCS archive (tmsh save sys ucs pre-change.ucs)",
          firewall: "export the running configuration and confirm the file downloads",
          dns: "back up the zone files / export the zone before editing",
        },
        "export or snapshot the current config and verify the file opens",
      ),
  },
  {
    id: "S-PF-BASELINE",
    phase: "preflight",
    text: "Capture a health baseline now - the metrics and a few known-good probes you will re-check afterward - so 'working' has a definition.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "tmsh show sys performance; note virtual-server and pool member status",
        dns: "record current resolution answers and TTLs for the names in scope",
        "tls-pki": "record current certificate notAfter and chain for the endpoints in scope",
      }),
  },
  {
    id: "S-PF-MAINT-WINDOW",
    phase: "preflight",
    text: "Confirm you are inside the approved maintenance window and that the people who need to be available are.",
  },
  {
    id: "S-PF-BLAST",
    phase: "preflight",
    text: "Confirm the blast radius: list what shares this device or path and could be affected beyond the intended target, and decide whether that is acceptable for this window.",
  },
  {
    id: "S-PF-HA",
    phase: "preflight",
    text: "If this runs on a high-availability pair or cluster, confirm the peer is healthy and will carry the load, and know which unit you are acting on.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "tmsh show cm failover-status; confirm the standby is in sync",
        firewall: "confirm the HA peer is healthy and in sync before touching either unit",
      }),
  },
  {
    id: "S-PF-CERT-STAGE",
    phase: "preflight",
    text: "Stage the new certificate and its full chain, and verify the key matches and the chain is complete, before installing anything.",
    command: (p) =>
      cmd(
        p,
        { "tls-pki": "openssl x509 -noout -modulus -in new.crt | openssl md5; compare to the key modulus; openssl verify -untrusted chain.pem new.crt" },
        "verify the new key/cert pair and chain offline before install",
      ),
  },
  {
    id: "S-PF-EMERGENCY-NOTE",
    phase: "preflight",
    text: "This is an emergency change: capture the reason it cannot wait and get whatever expedited approval your process allows, even if retroactive - an emergency change is still a recorded change.",
  },

  // ---- Approvals & comms ----
  {
    id: "S-AP-APPROVAL",
    phase: "approvals",
    text: "Confirm the change is approved (change ticket in the approved state, or the emergency equivalent) before you touch anything.",
  },
  {
    id: "S-AP-NOTIFY",
    phase: "approvals",
    text: "Send the pre-change notice to the stakeholders and the affected users: what, when, expected impact, and how long.",
  },
  {
    id: "S-AP-BRIDGE",
    phase: "approvals",
    text: "For a high-impact change, open a bridge or a chat channel and name who is running the change, who is watching monitoring, and who makes the rollback call.",
  },
  {
    id: "S-AP-FREEZE",
    phase: "approvals",
    text: "Confirm no conflicting change is running on the same systems in this window - check the change calendar.",
  },

  // ---- Execution ----
  {
    id: "S-EX-SEQUENCE",
    phase: "execution",
    text: "Work in small, reversible increments where possible, and after each one pause to confirm it did what you expected before moving on.",
  },
  {
    id: "S-EX-ONE-NODE-FIRST",
    phase: "execution",
    text: "Apply the change to one node first, verify it there, and only then roll it across the rest - never all members at once.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "change the standby (or one pool member) first; verify; then fail over / proceed",
      }),
  },
  {
    id: "S-EX-DRAIN",
    phase: "execution",
    text: "Drain connections from the node before changing it, rather than dropping active sessions.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "set the pool member to disabled (allow existing connections to finish) before the change",
      }),
  },
  {
    id: "S-EX-APPLY",
    phase: "execution",
    text: "Apply the change itself, following the exact steps you wrote in pre-flight - read them, do not improvise at the keyboard.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "make the change; tmsh save sys config once verified",
        firewall: "apply the policy change; commit only after reviewing the diff",
        dns: "edit the record/zone; increment the SOA serial; reload the zone",
      }),
  },
  {
    id: "S-EX-CERT-INSTALL",
    phase: "execution",
    text: "Install the staged certificate and chain, bind it where it is used, and be ready to check every service that presents it.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "import the cert/key/chain; update the client-ssl profile; the change takes effect on new connections",
        "tls-pki": "install the new cert and chain; reload the service that serves it",
      }),
  },
  {
    id: "S-EX-DNS-TTL",
    phase: "execution",
    text: "Remember DNS change is not instant: it propagates over the record's TTL, so plan the timing around it and lower the TTL ahead of a cutover if you can.",
  },

  // ---- Verification ----
  {
    id: "S-VF-REPEAT-BASELINE",
    phase: "verification",
    text: "Re-run the exact baseline checks you captured in pre-flight and compare - the change is verified when the known-good probes pass again, not when the command returned zero.",
  },
  {
    id: "S-VF-FUNCTIONAL",
    phase: "verification",
    text: "Test the actual user-facing function through the changed path, not just the device's own status.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "test through the virtual server end to end; watch pool member and connection stats",
        dns: "resolve the names in scope from a client and from the authoritative server; compare",
        "tls-pki": "openssl s_client to the endpoint; confirm the new chain, SAN, and expiry",
        firewall: "test that the intended traffic passes and the intended traffic is still blocked",
      }),
  },
  {
    id: "S-VF-WATCH",
    phase: "verification",
    text: "Watch monitoring and error rates for a defined soak period before you call it done - some failures only show under real traffic a few minutes in.",
  },
  {
    id: "S-VF-RESTORE-STATE",
    phase: "verification",
    text: "Re-enable anything you drained or disabled during the change, and confirm it takes traffic normally.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "re-enable the pool member; confirm it returns to the active pool and passes health checks",
      }),
  },

  // ---- Rollback triggers ----
  {
    id: "S-RB-TRIGGER",
    phase: "rollback",
    text: "Decide the rollback trigger BEFORE you start: the specific signal (error rate, failed probe, elapsed time with no success) that means you back out rather than push on.",
  },
  {
    id: "S-RB-STEPS",
    phase: "rollback",
    text: "Write the back-out steps explicitly - restoring from the backup you took, in order - so rollback is a procedure to follow, not a decision to make under pressure.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "restore the pre-change UCS / config; verify the virtual server serves the old behavior",
        firewall: "restore the exported configuration; confirm the previous policy is active",
        dns: "restore the previous record/zone; increment the SOA; reload",
      }),
  },
  {
    id: "S-RB-ONEWAY",
    phase: "rollback",
    text: "This change is hard to reverse: there is no clean rollback, so the plan must lead with prevention - extra verification before and during, and a forward-fix plan for when back-out is not an option.",
  },
  {
    id: "S-RB-TESTED",
    phase: "rollback",
    text: "Confirm the rollback has actually been tested, not just written - an untested back-out is a hope, not a plan.",
  },

  // ---- Close-out ----
  {
    id: "S-CO-CONFIRM",
    phase: "closeout",
    text: "Confirm success against the baseline one more time, then send the all-clear to the same people you notified.",
  },
  {
    id: "S-CO-SAVE",
    phase: "closeout",
    text: "Persist the new configuration and take a fresh backup of the post-change state, so the new good state is the one that restores next time.",
    command: (p) =>
      cmd(p, {
        "load-balancer": "tmsh save sys config; save a fresh post-change UCS archive",
      }),
  },
  {
    id: "S-CO-CLOSE",
    phase: "closeout",
    text: "Close the change ticket with what was actually done, any deviations from the plan, and anything to watch over the next day.",
  },
];

const STEP_BY_ID = new Map(STEPS.map((s) => [s.id, s]));

// ----------------------------------------------------------------------------
// Risk registry. Rules attach risk factors; each appears once, severity-tagged.
// ----------------------------------------------------------------------------

interface RiskDef {
  id: string;
  label: string;
  severity: RiskFactor["severity"];
  note?: string;
}

const RISKS: RiskDef[] = [
  { id: "RK-ONEWAY", label: "One-way change: no clean rollback", severity: "high", note: "Prevention beats back-out here; verify twice and have a forward-fix ready." },
  { id: "RK-HARD-REVERSE", label: "Hard to reverse", severity: "high", note: "Rollback is slow or lossy; treat the pre-change verification as the real safety net." },
  { id: "RK-PROD-CRITICAL", label: "Business-critical production", severity: "high", note: "The cost of an outage is high; keep the blast radius and the window as tight as possible." },
  { id: "RK-BROAD-BLAST", label: "Broad blast radius", severity: "high", note: "Many services or users share this path; a small mistake is a large incident." },
  { id: "RK-SHARED-INFRA", label: "Shared infrastructure", severity: "medium", note: "Other services ride this device or link; confirm what else is affected before you start." },
  { id: "RK-BUSINESS-HOURS", label: "Change during business hours", severity: "medium", note: "Users are active; impact is felt immediately. Prefer a maintenance window if the change allows." },
  { id: "RK-EMERGENCY", label: "Emergency change, compressed process", severity: "medium", note: "Speed raises the error rate; slow down on the irreversible steps even when the clock is loud." },
  { id: "RK-NO-BACKUP", label: "No backup recorded", severity: "high", note: "Without a fresh, verified backup there is nothing to roll back to. Take one first." },
  { id: "RK-ROLLBACK-UNTESTED", label: "Rollback not tested", severity: "medium", note: "A written but untested back-out often fails when it is finally needed." },
  { id: "RK-CERT-OUTAGE", label: "Certificate change affects every TLS client", severity: "medium", note: "A wrong chain or mismatched key breaks the handshake for everyone at once; verify the pair and chain before install." },
  { id: "RK-DNS-TTL", label: "DNS change propagates over TTL", severity: "medium", note: "The old answer lingers in caches for the TTL; a mistake is not undone instantly." },
];

const RISK_BY_ID = new Map(RISKS.map((r) => [r.id, r]));

// ----------------------------------------------------------------------------
// Rule registry. Each rule is a pure predicate over the structured input; when
// it fires it pulls in a set of steps (by id) and optionally a risk (by id).
// A step or risk referenced by several rules still appears once. Steps are
// ordered by first-fire within their phase; phases are always in PHASE_ORDER.
// The registry is original editorial work (D-18) encoding standard change
// practice; no external specification is reproduced.
// ----------------------------------------------------------------------------

interface Rule {
  id: string;
  when: (i: RunbookInput) => boolean;
  steps: string[];
  risk?: string;
  because: string;
}

const RULES: Rule[] = [
  // --- Baseline: every runbook gets the operational spine ---
  {
    id: "R-BASE-SPINE",
    when: () => true,
    steps: [
      "S-PF-SCOPE",
      "S-PF-BASELINE",
      "S-AP-APPROVAL",
      "S-EX-APPLY",
      "S-VF-REPEAT-BASELINE",
      "S-VF-WATCH",
      "S-RB-TRIGGER",
      "S-CO-CONFIRM",
      "S-CO-CLOSE",
    ],
    because: "Every change gets the operational spine: scope it, baseline it, confirm approval, apply, verify against the baseline, watch, and close out with a defined rollback trigger.",
  },

  // --- Backup / rollback depends on reversibility + whether a backup is taken ---
  {
    id: "R-BACKUP-STEP",
    when: (i) => i.reversibility !== "one-way-door",
    steps: ["S-PF-BACKUP", "S-RB-STEPS", "S-CO-SAVE"],
    because: "A reversible change needs a fresh backup up front, explicit back-out steps that restore it, and a fresh post-change backup at the end.",
  },
  {
    id: "R-NO-BACKUP-WARN",
    when: (i) => i.reversibility !== "one-way-door" && !i.safeguards.includes("backup-taken"),
    steps: ["S-PF-BACKUP"],
    risk: "RK-NO-BACKUP",
    because: "The change is reversible but no backup is recorded yet; without one there is nothing to roll back to.",
  },
  {
    id: "R-HARD-REVERSE",
    when: (i) => i.reversibility === "hard-to-reverse",
    steps: ["S-RB-STEPS"],
    risk: "RK-HARD-REVERSE",
    because: "Reversal is slow or lossy, so the back-out steps must be written out and the pre-change verification carries the safety.",
  },
  {
    id: "R-ONEWAY",
    when: (i) => i.reversibility === "one-way-door",
    steps: ["S-RB-ONEWAY"],
    risk: "RK-ONEWAY",
    because: "There is no clean rollback, so the plan leads with prevention and a forward-fix rather than a back-out.",
  },
  {
    id: "R-ROLLBACK-UNTESTED",
    when: (i) => i.reversibility !== "one-way-door" && !i.safeguards.includes("rollback-tested"),
    steps: ["S-RB-TESTED"],
    risk: "RK-ROLLBACK-UNTESTED",
    because: "A rollback is possible but not marked as tested; an untested back-out often fails when it is finally needed.",
  },

  // --- Environment ---
  {
    id: "R-PROD-CRITICAL",
    when: (i) => i.environment === "production-critical",
    steps: ["S-PF-BLAST", "S-AP-BRIDGE"],
    risk: "RK-PROD-CRITICAL",
    because: "Business-critical production raises the cost of any slip: confirm the blast radius and stand up a bridge with named roles.",
  },

  // --- Blast radius ---
  {
    id: "R-BROAD-BLAST",
    when: (i) => i.blastRadius === "everyone" || i.blastRadius === "one-site",
    steps: ["S-PF-BLAST"],
    risk: "RK-BROAD-BLAST",
    because: "A wide blast radius means a small mistake is a large incident; the affected surface must be listed before you start.",
  },
  {
    id: "R-SHARED-INFRA",
    when: (i) => i.blastRadius === "shared-infra",
    steps: ["S-PF-BLAST", "S-EX-SEQUENCE"],
    risk: "RK-SHARED-INFRA",
    because: "Shared infrastructure carries other services; confirm what else rides this device and move in small, checked increments.",
  },

  // --- Window ---
  {
    id: "R-MAINT-WINDOW",
    when: (i) => i.window === "maintenance-window" || i.window === "after-hours",
    steps: ["S-PF-MAINT-WINDOW", "S-AP-FREEZE"],
    because: "A scheduled window needs its bounds confirmed and a check that no conflicting change shares it.",
  },
  {
    id: "R-BUSINESS-HOURS",
    when: (i) => i.window === "business-hours",
    steps: ["S-AP-NOTIFY", "S-EX-SEQUENCE"],
    risk: "RK-BUSINESS-HOURS",
    because: "Changing during business hours means users feel impact immediately; notify them and move in small, reversible steps.",
  },
  {
    id: "R-EMERGENCY-NOW",
    when: (i) => i.window === "emergency-now" || i.changeType === "emergency-fix",
    steps: ["S-PF-EMERGENCY-NOTE"],
    risk: "RK-EMERGENCY",
    because: "An emergency change compresses the process but is still a recorded change; capture the reason and get expedited approval.",
  },

  // --- Comms safeguards ---
  {
    id: "R-COMMS-NOTIFY",
    when: (i) => !i.safeguards.includes("comms-sent"),
    steps: ["S-AP-NOTIFY"],
    because: "No pre-change notice is marked as sent; the affected stakeholders and users need one before the window.",
  },

  // --- Change-type specifics ---
  {
    id: "R-CERT-ROTATION",
    when: (i) => i.changeType === "cert-rotation",
    steps: ["S-PF-CERT-STAGE", "S-EX-CERT-INSTALL", "S-VF-FUNCTIONAL"],
    risk: "RK-CERT-OUTAGE",
    because: "A certificate rotation breaks every TLS client at once if the pair or chain is wrong; stage and verify the material before install, then test the handshake end to end.",
  },
  {
    id: "R-DNS-CHANGE",
    when: (i) => i.changeType === "network-change" && i.preset === "dns",
    steps: ["S-EX-DNS-TTL", "S-VF-FUNCTIONAL"],
    risk: "RK-DNS-TTL",
    because: "A DNS change propagates over the record TTL rather than instantly; plan the timing and verify resolution from more than one vantage point.",
  },
  {
    id: "R-DNS-PRESET",
    when: (i) => i.preset === "dns" && i.changeType !== "network-change",
    steps: ["S-EX-DNS-TTL"],
    risk: "RK-DNS-TTL",
    because: "A DNS-flavored change still propagates over TTL; the old answer lingers in caches, so a mistake is not undone instantly.",
  },
  {
    id: "R-SOFTWARE-UPGRADE",
    when: (i) => i.changeType === "software-upgrade",
    steps: ["S-EX-ONE-NODE-FIRST", "S-VF-FUNCTIONAL"],
    because: "A software upgrade should land on one node first and be verified there before it rolls across the rest.",
  },
  {
    id: "R-FAILOVER-MAINT",
    when: (i) => i.changeType === "failover-maintenance",
    steps: ["S-PF-HA", "S-EX-DRAIN", "S-VF-RESTORE-STATE"],
    because: "A failover or maintenance change turns on a healthy peer: confirm HA state, drain the node before touching it, and restore it to service afterward.",
  },
  {
    id: "R-SCALE-CAPACITY",
    when: (i) => i.changeType === "scale-capacity",
    steps: ["S-EX-ONE-NODE-FIRST", "S-VF-FUNCTIONAL", "S-VF-RESTORE-STATE"],
    because: "A capacity change adds or resizes members incrementally and verifies each takes traffic before the next.",
  },

  // --- Preset: load-balancer implies HA awareness on member-level changes ---
  {
    id: "R-LB-HA-AWARE",
    when: (i) => i.preset === "load-balancer" && (i.changeType === "config-change" || i.changeType === "software-upgrade"),
    steps: ["S-PF-HA", "S-EX-ONE-NODE-FIRST"],
    because: "On a load balancer, a config or software change should respect the HA pair: confirm the peer and change one unit at a time.",
  },
  {
    id: "R-FIREWALL-DIFF",
    when: (i) => i.preset === "firewall",
    steps: ["S-EX-SEQUENCE", "S-VF-FUNCTIONAL"],
    because: "A firewall change is easy to get subtly wrong; review the diff, move in small steps, and verify both that intended traffic passes and unintended traffic is still blocked.",
  },
];

// ----------------------------------------------------------------------------
// Readiness warnings - about the INPUT (missing safeguards), not the world.
// Deterministic: pure functions of the input + which rules fired.
// ----------------------------------------------------------------------------

interface WarnDef {
  id: string;
  when: (i: RunbookInput) => boolean;
  message: string;
}

const WARNINGS: WarnDef[] = [
  {
    id: "W-NO-APPROVAL",
    when: (i) => !i.safeguards.includes("change-approved") && i.window !== "emergency-now" && i.changeType !== "emergency-fix",
    message: "The change is not marked as approved. Confirm approval before you begin; this runbook does not approve anything.",
  },
  {
    id: "W-NO-BACKUP",
    when: (i) => i.reversibility !== "one-way-door" && !i.safeguards.includes("backup-taken"),
    message: "No backup is marked as taken. A reversible change still needs a fresh, verified backup before you start - there is otherwise nothing to roll back to.",
  },
  {
    id: "W-NO-ROLLBACK-TEST",
    when: (i) => i.reversibility !== "one-way-door" && i.reversibility !== "easy-rollback" && !i.safeguards.includes("rollback-tested"),
    message: "Rollback is not marked as tested, and this change is not easy to reverse. Test the back-out before the window, not during the incident.",
  },
  {
    id: "W-CRITICAL-BUSINESS-HOURS",
    when: (i) => i.environment === "production-critical" && i.window === "business-hours",
    message: "This is a business-critical system and the window is business hours. If the change can wait for a maintenance window, that is the safer plan.",
  },
  {
    id: "W-ONEWAY-PROD",
    when: (i) => i.reversibility === "one-way-door" && (i.environment === "production-critical" || i.environment === "production-standard"),
    message: "A one-way change in production has no clean back-out. Weight the plan toward prevention: extra pre-change verification and an agreed forward-fix path.",
  },
  {
    id: "W-NO-MONITORING",
    when: (i) => !i.safeguards.includes("monitoring-ready"),
    message: "Monitoring is not marked as ready. You need a way to see the change's effect - and to trip the rollback trigger - before you start.",
  },
];

// ----------------------------------------------------------------------------
// Validation (closed-enum; free text never enters rule matching).
// ----------------------------------------------------------------------------

const VALID = {
  changeType: ["config-change", "software-upgrade", "cert-rotation", "network-change", "scale-capacity", "failover-maintenance", "emergency-fix"],
  environment: ["production-critical", "production-standard", "staging", "dr-site"],
  blastRadius: ["single-device", "one-service", "one-site", "shared-infra", "everyone"],
  reversibility: ["easy-rollback", "config-backup-only", "hard-to-reverse", "one-way-door"],
  window: ["business-hours", "after-hours", "maintenance-window", "emergency-now"],
  safeguards: ["change-approved", "backup-taken", "rollback-tested", "peer-review", "monitoring-ready", "comms-sent", "maintenance-notice"],
  preset: ["generic", "load-balancer", "dns", "tls-pki", "firewall"],
} as const;

export function validateInput(raw: unknown): RunbookInput {
  const i = raw as Partial<RunbookInput>;
  if (!i || typeof i !== "object") throw new RunbookError("format", "input must be an object");
  for (const f of ["changeType", "environment", "blastRadius", "reversibility", "window", "preset"] as const) {
    if (typeof i[f] !== "string" || !(VALID[f] as readonly string[]).includes(i[f] as string)) {
      throw new RunbookError("format", `invalid ${f}`);
    }
  }
  const sg = i.safeguards;
  if (!Array.isArray(sg) || sg.some((v) => !(VALID.safeguards as readonly string[]).includes(v as string))) {
    throw new RunbookError("format", "invalid safeguards");
  }
  return i as RunbookInput;
}

// ----------------------------------------------------------------------------
// run - fire the rule registry over a structured input and assemble the
// ordered runbook, its risks, readiness warnings, the fired-rule trail, and
// the exportable Markdown runbook. Fully deterministic; registry order and
// first-fire order break ties.
// ----------------------------------------------------------------------------

export function run(rawInput: RunbookInput | unknown): RunbookResult {
  const input = validateInput(rawInput);

  // 1. Fire rules in registry order.
  const fired = RULES.filter((r) => r.when(input));

  // 2. Collect steps in first-fire order (dedup), and risks (dedup).
  const stepOrder: string[] = [];
  const seenSteps = new Set<string>();
  const riskIds: string[] = [];
  const seenRisks = new Set<string>();
  for (const r of fired) {
    for (const sid of r.steps) {
      if (!seenSteps.has(sid)) {
        seenSteps.add(sid);
        stepOrder.push(sid);
      }
    }
    if (r.risk && !seenRisks.has(r.risk)) {
      seenRisks.add(r.risk);
      riskIds.push(r.risk);
    }
  }

  // 3. Group steps by phase, phases in PHASE_ORDER, steps in first-fire order.
  const phases = PHASE_ORDER.map((phase) => {
    const steps = stepOrder
      .map((sid) => STEP_BY_ID.get(sid)!)
      .filter((s) => s.phase === phase)
      .map((s): RunbookStep => ({
        id: s.id,
        phase: s.phase,
        text: s.text,
        command: s.command?.(input.preset),
      }));
    return { phase, steps };
  }).filter((p) => p.steps.length > 0);

  // 4. Materialize risks (registry order within the fired set).
  const risks: RiskFactor[] = RISKS.filter((r) => seenRisks.has(r.id)).map((r) => ({
    id: r.id,
    label: r.label,
    severity: r.severity,
    note: r.note,
  }));
  // Keep risk emission order = first-fire order (matches the "why" trail).
  risks.sort((a, b) => riskIds.indexOf(a.id) - riskIds.indexOf(b.id));

  // 5. Readiness warnings (registry order).
  const warnings: QualityWarning[] = WARNINGS.filter((w) => w.when(input)).map((w) => ({
    id: w.id,
    message: w.message,
  }));

  // 6. The runbook artifact (usable, not decorative).
  const situationLines = [
    `- Change type: ${input.changeType}`,
    `- Environment: ${input.environment}`,
    `- Blast radius: ${input.blastRadius}`,
    `- Reversibility: ${input.reversibility}`,
    `- Window: ${input.window}`,
    `- Safeguards ready: ${input.safeguards.length ? input.safeguards.join(", ") : "(none marked)"}`,
  ];
  if (input.notes?.summary) situationLines.push(`- Summary: ${input.notes.summary}`);
  if (input.notes?.changeDetail) situationLines.push(`- Change detail: ${input.notes.changeDetail}`);
  if (input.notes?.backoutOwner) situationLines.push(`- Back-out owner: ${input.notes.backoutOwner}`);

  const phaseTitle: Record<PhaseId, string> = {
    preflight: "Pre-flight",
    approvals: "Approvals & comms",
    execution: "Execution",
    verification: "Verification",
    rollback: "Rollback triggers & back-out",
    closeout: "Close-out",
  };

  const artifactSections: [string, string][] = [
    ["Change summary", situationLines.join("\n")],
  ];
  if (risks.length) {
    artifactSections.push([
      "Risks this plan carries",
      risks.map((r) => `- (${r.severity}) ${r.label}${r.note ? ` - ${r.note}` : ""}`).join("\n"),
    ]);
  }
  if (warnings.length) {
    artifactSections.push([
      "Readiness cautions",
      warnings.map((w) => `- ${w.message}`).join("\n"),
    ]);
  }
  for (const p of phases) {
    artifactSections.push([
      phaseTitle[p.phase],
      p.steps
        .map((s) => `- [ ] ${s.text}${s.command ? `\n      \`${s.command}\`` : ""}`)
        .join("\n"),
    ]);
  }
  artifactSections.push([
    "Method note",
    "This runbook is assembled by deterministic rules over the described change - a proposal to review and adapt, not an approval and not a guarantee. A human runs it and signs off. Generated locally in the browser; nothing was uploaded.",
  ]);

  const artifact: ExportArtifact = {
    kind: "runbook",
    title: "Change window runbook",
    sections: artifactSections,
  };

  return {
    phases,
    risks,
    warnings,
    firedRuleIds: fired.map((r) => r.id),
    presetUsed: input.preset,
    artifact,
  };
}

/** API-parity entry (D-72): structured JSON string in, result out. */
export function runFromJson(json: string): RunbookResult {
  const trimmed = json.trim();
  if (trimmed === "") throw new RunbookError("empty");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new RunbookError("format", "input must be a JSON object (see the tool doc for the schema)");
  }
  return run(parsed);
}

export { artifactToMarkdown };
export const RULE_COUNT = RULES.length;
export const STEP_COUNT = STEPS.length;
export const RISK_COUNT = RISKS.length;
export const PHASE_COUNT = PHASE_ORDER.length;

/** Rule id -> its human reason (the `because` string), so the "Why these
 *  steps?" panel can show each fired rule's rationale without duplicating the
 *  strings in the component. Frozen; canonical English, vector-adjacent. */
export const RULE_REASONS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(RULES.map((r) => [r.id, r.because])),
);
