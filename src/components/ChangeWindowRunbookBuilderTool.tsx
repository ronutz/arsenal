// ============================================================================
// src/components/ChangeWindowRunbookBuilderTool.tsx
// ----------------------------------------------------------------------------
// CHANGE WINDOW RUNBOOK BUILDER (client island) - Operations & Fieldcraft
// tool 2 (D-86). Describe a planned change through a small structured form;
// the deterministic engine assembles an ordered runbook (six fixed phases),
// the risks the plan carries, and readiness cautions about the input. One
// click exports a Markdown runbook for the change ticket or the bridge.
//
// The engine runs entirely here in the browser: same input -> same runbook,
// pinned by rule-firing snapshot vectors (D-86 §3.1). Free-text notes flow
// only into the export, never into rule matching, so behavior stays
// deterministic. Runbook step text is canonical English from the engine
// (vector-pinned); all form chrome is localized (D-86 i18n posture, same as
// the FHB pilot).
//
// The runbook is a proposal to REVIEW and ADAPT - it never approves a change
// and never executes anything. The language holds that line (D-86 §3.2).
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  artifactToMarkdown,
  PHASE_ORDER,
  RULE_REASONS,
  type RunbookInput,
  type ChangeType,
  type Environment,
  type BlastRadius,
  type Reversibility,
  type Window as ChangeWindow,
  type Safeguard,
  type PresetId,
} from "@/lib/tools/change-window-runbook-builder";
import { SignalBadge } from "@/components/fieldcraft/FieldcraftShared";

// D-83 Example - verbatim the "prod-cert-rotation" snapshot vector input.
const EXAMPLE: RunbookInput = {
  changeType: "cert-rotation",
  environment: "production-critical",
  blastRadius: "shared-infra",
  reversibility: "config-backup-only",
  window: "maintenance-window",
  safeguards: ["change-approved", "peer-review"],
  preset: "tls-pki",
};

// A neutral starting point (staging, easy rollback) so the first render is a
// short, low-risk runbook rather than an alarming one.
const BLANK: RunbookInput = {
  changeType: "config-change",
  environment: "staging",
  blastRadius: "single-device",
  reversibility: "easy-rollback",
  window: "maintenance-window",
  safeguards: [],
  preset: "generic",
};

const CHANGE_TYPES: ChangeType[] = ["config-change", "software-upgrade", "cert-rotation", "network-change", "scale-capacity", "failover-maintenance", "emergency-fix"];
const ENVIRONMENTS: Environment[] = ["production-critical", "production-standard", "staging", "dr-site"];
const BLAST_RADII: BlastRadius[] = ["single-device", "one-service", "one-site", "shared-infra", "everyone"];
const REVERSIBILITIES: Reversibility[] = ["easy-rollback", "config-backup-only", "hard-to-reverse", "one-way-door"];
const WINDOWS: ChangeWindow[] = ["business-hours", "after-hours", "maintenance-window", "emergency-now"];
const SAFEGUARDS: Safeguard[] = ["change-approved", "backup-taken", "rollback-tested", "peer-review", "monitoring-ready", "comms-sent", "maintenance-notice"];
const PRESETS: PresetId[] = ["generic", "load-balancer", "dns", "tls-pki", "firewall"];

// Map risk severity to the shared signal band vocabulary so the risk pills
// reuse the fieldcraft SignalBadge colors (high->strong/red is wrong; here
// higher severity = more alarming, so high->"strong" red is intended).
const SEVERITY_SIGNAL: Record<"low" | "medium" | "high", "weak" | "moderate" | "strong"> = {
  low: "weak",
  medium: "moderate",
  high: "strong",
};

export default function ChangeWindowRunbookBuilderTool() {
  const t = useTranslations("tools.change-window-runbook-builder");

  const [input, setInput] = useState<RunbookInput>(BLANK);
  const [notes, setNotes] = useState({ summary: "", changeDetail: "", backoutOwner: "" });
  const [touched, setTouched] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Live, local, deterministic. Notes are appended at render time so typing
  // free text never re-fires rules (it cannot affect them anyway).
  const result = useMemo(() => {
    if (!touched) return null;
    const withNotes: RunbookInput = {
      ...input,
      notes: {
        summary: notes.summary.trim() || undefined,
        changeDetail: notes.changeDetail.trim() || undefined,
        backoutOwner: notes.backoutOwner.trim() || undefined,
      },
    };
    return run(withNotes);
  }, [input, notes, touched]);

  const set = <K extends keyof RunbookInput>(k: K, v: RunbookInput[K]) => {
    setTouched(true);
    setInput((cur) => ({ ...cur, [k]: v }));
  };

  const toggleSafeguard = (v: Safeguard) => {
    setTouched(true);
    setInput((cur) => {
      const list = new Set(cur.safeguards);
      if (list.has(v)) list.delete(v);
      else list.add(v);
      // Preserve canonical order so nothing depends on click order.
      return { ...cur, safeguards: SAFEGUARDS.filter((s) => list.has(s)) };
    });
  };

  const toggleChecked = (id: string) =>
    setChecked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Export: mark checked steps in the artifact at export time (client-side date).
  const exportMarkdown = () => {
    if (!result) return "";
    const md = artifactToMarkdown({ ...result.artifact, generated: new Date().toISOString().slice(0, 10) });
    if (checked.size === 0) return md;
    // The artifact renders steps as "- [ ] <text>"; flip to [x] for checked
    // ones by matching the step text (ids are not in the Markdown).
    const allSteps = result.phases.flatMap((p) => p.steps);
    return md
      .split("\n")
      .map((line) => {
        const m = /^- \[ \] (.*)$/.exec(line);
        if (!m) return line;
        const step = allSteps.find((s) => s.text === m[1]);
        return step && checked.has(step.id) ? `- [x] ${m[1]}` : line;
      })
      .join("\n");
  };

  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: the download path remains */
    }
  };

  const downloadMd = () => {
    const blob = new Blob([exportMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "change-window-runbook.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectField = (
    key: "changeType" | "environment" | "blastRadius" | "reversibility" | "window" | "preset",
    options: readonly string[],
  ) => (
    <div className="fc-field">
      <label className="cidr-label" htmlFor={`rb-${key}`}>
        {t(`form.${key}`)}
      </label>
      <select
        id={`rb-${key}`}
        className="cidr-input"
        value={input[key]}
        onChange={(e) => set(key, e.target.value as never)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {t(`options.${o}`)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="dig-input-head">
        <span className="cidr-label">{t("form.heading")}</span>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(EXAMPLE);
              setNotes({ summary: "", changeDetail: "", backoutOwner: "" });
              setChecked(new Set());
              setTouched(true);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(BLANK);
              setNotes({ summary: "", changeDetail: "", backoutOwner: "" });
              setChecked(new Set());
              setTouched(false);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>

      <div className="fc-form-grid">
        {selectField("changeType", CHANGE_TYPES)}
        {selectField("environment", ENVIRONMENTS)}
        {selectField("blastRadius", BLAST_RADII)}
        {selectField("reversibility", REVERSIBILITIES)}
        {selectField("window", WINDOWS)}
        {selectField("preset", PRESETS)}
      </div>

      <div className="fc-field">
        <span className="cidr-label">{t("form.safeguards")}</span>
        <div className="fc-check-group">
          {SAFEGUARDS.map((s) => (
            <label key={s}>
              <input type="checkbox" checked={input.safeguards.includes(s)} onChange={() => toggleSafeguard(s)} />{" "}
              {t(`options.${s}`)}
            </label>
          ))}
        </div>
      </div>

      {/* Optional structured detail: artifact-only by design. */}
      <details className="fc-notes">
        <summary className="cipher-note">{t("notes.heading")}</summary>
        <p className="cipher-note">{t("notes.hint")}</p>
        {(["summary", "changeDetail", "backoutOwner"] as const).map((k) => (
          <div className="fc-field" key={k}>
            <label className="cidr-label" htmlFor={`rb-note-${k}`}>
              {t(`notes.${k}`)}
            </label>
            <input
              id={`rb-note-${k}`}
              className="cidr-input"
              value={notes[k]}
              onChange={(e) => setNotes((cur) => ({ ...cur, [k]: e.target.value }))}
            />
          </div>
        ))}
      </details>

      <p className="cidr-privacy">
        <span className="cidr-lock" aria-hidden="true">
          🔒
        </span>{" "}
        {t("runsLocally")}
      </p>

      {!result && <p className="cipher-note">{t("emptyState")}</p>}

      {result && (
        <div className="jwt-results">
          {result.warnings.map((w) => (
            <p key={w.id} className="fc-warning" role="note">
              {w.message}
            </p>
          ))}

          <h3 className="jwt-panel-title">{t("results.heading")}</h3>
          <p className="cipher-note">{t("results.framing")}</p>

          {/* Risks the plan carries (if any). */}
          {result.risks.length > 0 && (
            <section className="fc-card rb-risks">
              <p className="fc-subhead">{t("results.risksHeading")}</p>
              <ul className="rb-risk-list">
                {result.risks.map((r) => (
                  <li key={r.id} className="rb-risk-item">
                    <SignalBadge signal={SEVERITY_SIGNAL[r.severity]} label={t(`results.severity.${r.severity}`)} />{" "}
                    <span className="rb-risk-label">{r.label}</span>
                    {r.note ? <span className="rb-risk-note"> - {r.note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* The runbook itself, phase by phase in PHASE_ORDER. */}
          {result.phases.map((p) => (
            <section key={p.phase} className="fc-card rb-phase">
              <div className="rb-phase-head">
                <span className="rb-phase-num mono">{PHASE_ORDER.indexOf(p.phase) + 1}</span>
                <h4 className="fc-card-title">{t(`phases.${p.phase}`)}</h4>
              </div>
              <ul className="rb-steps">
                {p.steps.map((s) => (
                  <li key={s.id} className="rb-step">
                    <label>
                      <input type="checkbox" checked={checked.has(s.id)} onChange={() => toggleChecked(s.id)} />{" "}
                      <span>{s.text}</span>
                    </label>
                    {s.command && <code className="mono fc-evidence-cmd">{s.command}</code>}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Why these steps? - the fired-rule trail with each rule's reason,
              inspectable not oracular. */}
          <WhyRules fired={result.firedRuleIds} heading={t("results.whyHeading")} intro={t("results.whyIntro")} />

          <div className="fc-export-row">
            <button type="button" className="b64-copy" onClick={copyMd}>
              {copied ? t("results.copied") : t("results.copyMd")}
            </button>
            <button type="button" className="b64-copy" onClick={downloadMd}>
              {t("results.downloadMd")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// "Why these steps?" - a disclosure listing every rule that fired with the
// engine's own reason for it (the `because` string, surfaced via RULE_REASONS).
// A pure function of the fired ids; the ranking stays inspectable.
// ----------------------------------------------------------------------------

function WhyRules({ fired, heading, intro }: { fired: string[]; heading: string; intro: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="fc-why" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cipher-note">{heading}</summary>
      <p className="cipher-note">{intro}</p>
      <ul className="fc-why-rules">
        {fired.map((id) => (
          <li key={id}>
            <code className="mono">{id}</code> — {RULE_REASONS[id] ?? ""}
          </li>
        ))}
      </ul>
    </details>
  );
}
