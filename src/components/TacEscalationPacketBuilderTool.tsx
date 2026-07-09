// ============================================================================
// src/components/TacEscalationPacketBuilderTool.tsx
// ----------------------------------------------------------------------------
// TAC ESCALATION PACKET BUILDER (client island) - Operations & Fieldcraft
// tool 5 (D-86). Describe the issue you are about to escalate (vendor domain,
// severity, reproducibility, what you have collected, what you have tried);
// the deterministic engine assembles a complete, fixed-order escalation packet
// and, crucially, a checklist of the artifacts still to collect before opening
// the case. One click exports the packet as Markdown.
//
// It structures the hand-off and names which diagnostics to attach - it does
// NOT open a case, contact any vendor, collect diagnostics from your systems,
// or diagnose the issue (D-86 §3.5). Vendor names are nominative (D-27); no
// preset implies any training or support-partner authorization.
//
// The engine runs entirely here in the browser: same input -> same packet,
// pinned by rule-firing snapshot vectors (D-86 §3.1). Packet/artifact text is
// canonical English from the engine (vector-pinned); form chrome is localized.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  artifactToMarkdown,
  RULE_REASONS,
  type PacketInput,
  type VendorDomain,
  type Severity,
  type Reproducibility,
  type Collected,
  type Tried,
} from "@/lib/tools/tac-escalation-packet-builder";
import { SignalBadge } from "@/components/fieldcraft/FieldcraftShared";

// D-83 Example - verbatim the "lb-sev1-nothing" snapshot vector input.
const EXAMPLE: PacketInput = {
  vendor: "load-balancer",
  severity: "sev1-down",
  reproducibility: "reproducible",
  collected: [],
  tried: ["nothing-yet"],
};

// A neutral starting point: a mid-severity, reproducible case with a couple of
// basics collected, so the first render is a realistic in-progress packet.
const BLANK: PacketInput = {
  vendor: "generic",
  severity: "sev3-question",
  reproducibility: "reproducible",
  collected: ["problem-statement"],
  tried: ["kb-search"],
};

const VENDORS: VendorDomain[] = ["load-balancer", "firewall", "dns", "routing-switching", "tls-pki", "endpoint-security", "generic"];
const SEVERITIES: Severity[] = ["sev1-down", "sev2-degraded", "sev3-question", "sev4-info"];
const REPRODUCIBILITIES: Reproducibility[] = ["reproducible", "intermittent", "happened-once"];
const COLLECTED: Collected[] = ["problem-statement", "exact-error", "timeline", "topology", "config-backup", "diagnostic-bundle", "packet-capture", "logs", "repro-steps", "business-impact"];
const TRIED: Tried[] = ["nothing-yet", "restart", "rollback", "config-review", "failover", "workaround-applied", "kb-search"];

const READINESS_SIGNAL: Record<"ready" | "nearly" | "gather-first", "weak" | "moderate" | "strong"> = {
  ready: "weak",
  nearly: "moderate",
  "gather-first": "strong",
};

const SEVERITY_SIGNAL: Record<"low" | "medium" | "high", "weak" | "moderate" | "strong"> = {
  low: "weak",
  medium: "moderate",
  high: "strong",
};

export default function TacEscalationPacketBuilderTool() {
  const t = useTranslations("tools.tac-escalation-packet-builder");

  const [input, setInput] = useState<PacketInput>(BLANK);
  const [notes, setNotes] = useState({ problemSummary: "", environment: "", caseReference: "" });
  const [touched, setTouched] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!touched) return null;
    const withNotes: PacketInput = {
      ...input,
      notes: {
        problemSummary: notes.problemSummary.trim() || undefined,
        environment: notes.environment.trim() || undefined,
        caseReference: notes.caseReference.trim() || undefined,
      },
    };
    return run(withNotes);
  }, [input, notes, touched]);

  const set = <K extends keyof PacketInput>(k: K, v: PacketInput[K]) => {
    setTouched(true);
    setInput((cur) => ({ ...cur, [k]: v }));
  };

  const toggleMulti = (field: "collected" | "tried", value: string) => {
    setTouched(true);
    setInput((cur) => {
      const canon = field === "collected" ? COLLECTED : TRIED;
      const list = new Set(cur[field] as string[]);
      if (list.has(value)) list.delete(value);
      else list.add(value);
      // "nothing-yet" is exclusive on the tried list.
      if (field === "tried") {
        if (value === "nothing-yet" && list.has("nothing-yet")) {
          return { ...cur, tried: ["nothing-yet"] };
        }
        if (value !== "nothing-yet") list.delete("nothing-yet");
      }
      return { ...cur, [field]: (canon as string[]).filter((c) => list.has(c)) } as PacketInput;
    });
  };

  const toggleChecked = (id: string) =>
    setChecked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exportMarkdown = () => {
    if (!result) return "";
    const md = artifactToMarkdown({ ...result.artifact, generated: new Date().toISOString().slice(0, 10) });
    if (checked.size === 0) return md;
    // The to-collect items render as "- [ ] <text...>"; flip checked ones.
    const items = result.toCollect;
    return md
      .split("\n")
      .map((line) => {
        const m = /^- \[ \] (.*)$/.exec(line);
        if (!m) return line;
        const it = items.find((x) => m[1].startsWith(x.text.slice(0, 40)));
        return it && checked.has(it.id) ? `- [x] ${m[1]}` : line;
      })
      .join("\n");
  };
  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  const downloadMd = () => {
    const blob = new Blob([exportMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tac-escalation-packet.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectField = (key: "vendor" | "severity" | "reproducibility", options: readonly string[]) => (
    <div className="fc-field">
      <label className="cidr-label" htmlFor={`tac-${key}`}>
        {t(`form.${key}`)}
      </label>
      <select id={`tac-${key}`} className="cidr-input" value={input[key]} onChange={(e) => set(key, e.target.value as never)}>
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
              setNotes({ problemSummary: "", environment: "", caseReference: "" });
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
              setNotes({ problemSummary: "", environment: "", caseReference: "" });
              setChecked(new Set());
              setTouched(false);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>

      <div className="fc-form-grid">
        {selectField("vendor", VENDORS)}
        {selectField("severity", SEVERITIES)}
        {selectField("reproducibility", REPRODUCIBILITIES)}
      </div>

      <div className="fc-field">
        <span className="cidr-label">{t("form.collected")}</span>
        <div className="fc-check-group">
          {COLLECTED.map((c) => (
            <label key={c}>
              <input type="checkbox" checked={input.collected.includes(c)} onChange={() => toggleMulti("collected", c)} /> {t(`collectedOptions.${c}`)}
            </label>
          ))}
        </div>
      </div>

      <div className="fc-field">
        <span className="cidr-label">{t("form.tried")}</span>
        <div className="fc-check-group">
          {TRIED.map((tr) => (
            <label key={tr}>
              <input type="checkbox" checked={input.tried.includes(tr)} onChange={() => toggleMulti("tried", tr)} /> {t(`triedOptions.${tr}`)}
            </label>
          ))}
        </div>
      </div>

      {/* Optional structured detail: artifact-only by design. */}
      <details className="fc-notes">
        <summary className="cipher-note">{t("notes.heading")}</summary>
        <p className="cipher-note">{t("notes.hint")}</p>
        {(["problemSummary", "environment", "caseReference"] as const).map((k) => (
          <div className="fc-field" key={k}>
            <label className="cidr-label" htmlFor={`tac-note-${k}`}>
              {t(`notes.${k}`)}
            </label>
            <input
              id={`tac-note-${k}`}
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

          <div className="tac-ready-head">
            <h3 className="jwt-panel-title">{t("results.heading")}</h3>
            <SignalBadge signal={READINESS_SIGNAL[result.readiness]} label={t(`results.readiness.${result.readiness}`)} />
          </div>
          <p className="cipher-note">{t("results.framing")}</p>

          {/* Readiness notes (if any). */}
          {result.risks.length > 0 && (
            <section className="fc-card tac-risks">
              <p className="fc-subhead">{t("results.readinessHeading")}</p>
              <ul className="tac-risk-list">
                {result.risks.map((r) => (
                  <li key={r.id} className="tac-risk-item">
                    <SignalBadge signal={SEVERITY_SIGNAL[r.severity]} label={t(`results.severity.${r.severity}`)} />{" "}
                    <span className="tac-risk-label">{r.label}</span>
                    {r.note ? <span className="tac-risk-note"> - {r.note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* To-collect checklist - the point of the tool. */}
          {result.toCollect.length > 0 && (
            <section className="fc-card tac-collect">
              <p className="fc-subhead">{t("results.toCollectHeading")}</p>
              <p className="cipher-note">{t("results.toCollectIntro")}</p>
              <ul className="tac-collect-list">
                {result.toCollect.map((it) => (
                  <li key={it.id} className="tac-collect-item">
                    <label>
                      <input type="checkbox" checked={checked.has(it.id)} onChange={() => toggleChecked(it.id)} /> <span>{it.text}</span>
                    </label>
                    {it.command && <code className="mono fc-evidence-cmd">{it.command}</code>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* The assembled packet, section by section. */}
          <section className="fc-card tac-packet">
            <p className="fc-subhead">{t("results.packetHeading")}</p>
            {result.sections.map((s) => (
              <div key={s.section} className="tac-section">
                <h4 className="fc-card-title">{t(`sections.${s.section}`)}</h4>
                <ul className="tac-section-lines">
                  {s.lines.map((l) => (
                    <li key={l.id} className="tac-section-line">
                      {l.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* Why this checklist? - the fired-rule trail. */}
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
