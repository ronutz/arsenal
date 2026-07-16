"use client";

// ============================================================================
// src/components/HealthSnapshotComparatorTool.tsx
// ----------------------------------------------------------------------------
// BEFORE/AFTER HEALTH SNAPSHOT COMPARATOR - client component (fieldcraft
// tool 7, wave A-3). The naming-honesty contract is on the surface: the tool
// never sees state data - you declare the states, the tool gates the
// conclusion, and the gate verdict is the headline. D-83 Example loads the
// "postchange-verified-ha" snapshot vector input VERBATIM; results render
// only after the form is touched. Free text flows ONLY into the export.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  artifactToMarkdown,
  RULE_COUNT,
  type HscInput,
} from "@/lib/tools/health-snapshot-comparator";

const BLANK: HscInput = {
  context: "post-change-validation",
  target: "firewall",
  scope: "single-device",
  beforeConfidence: "captured-verified",
  afterState: "captured-verified",
  window: "operational",
  churn: "normal",
  preset: "generic",
};

// D-83 Example = the "postchange-verified-ha" snapshot vector input, verbatim.
const EXAMPLE: HscInput = {
  context: "post-change-validation",
  target: "load-balancer",
  scope: "ha-pair",
  beforeConfidence: "captured-verified",
  afterState: "captured-verified",
  window: "operational",
  churn: "normal",
  preset: "load-balancer",
};

const OPTIONS = {
  context: ["post-change-validation", "post-incident-recovery", "migration-cutover", "periodic-drift-check", "rollback-decision", "unknown"],
  target: ["firewall", "load-balancer", "dns", "switch-routing", "proxy-sse", "identity", "server-app", "unknown"],
  scope: ["single-device", "ha-pair", "cluster", "service-population", "site", "unknown"],
  beforeConfidence: ["captured-verified", "captured-unverified", "from-memory", "assumed-healthy", "none"],
  afterState: ["captured-verified", "captured-unverified", "partial", "none-yet"],
  window: ["immediate", "short", "operational", "extended", "unknown"],
  churn: ["none-frozen", "low", "normal", "high-dynamic", "unknown"],
  preset: ["generic", "load-balancer", "dns", "tls-pki", "firewall"],
} as const;

type FieldKey = keyof typeof OPTIONS;

export default function HealthSnapshotComparatorTool() {
  const t = useTranslations("tools.health-snapshot-comparator");
  const [input, setInput] = useState<HscInput>(BLANK);
  const [notes, setNotes] = useState({ changeRef: "", title: "", notes: "" });
  const [touched, setTouched] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const n = {
      ...(notes.changeRef.trim() ? { changeRef: notes.changeRef.trim() } : {}),
      ...(notes.title.trim() ? { title: notes.title.trim() } : {}),
      ...(notes.notes.trim() ? { notes: notes.notes.trim() } : {}),
    };
    return run({ ...input, notes: Object.keys(n).length ? n : undefined });
  }, [input, notes]);

  const set = (k: FieldKey, v: string) => {
    setInput((p) => ({ ...p, [k]: v }) as HscInput);
    setTouched(true);
  };

  const exportMarkdown = () => artifactToMarkdown({ ...result.artifact, generated: new Date().toISOString().slice(0, 10) });

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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "snapshot-comparison-report.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const selectField = (key: FieldKey) => (
    <div className="fc-field" key={key}>
      <label className="cidr-label" htmlFor={`hsc-${key}`}>
        {t(`form.${key}`)}
      </label>
      <select id={`hsc-${key}`} className="cidr-input" value={input[key]} onChange={(e) => set(key, e.target.value)}>
        {OPTIONS[key].map((o) => (
          <option key={o} value={o}>
            {t(`options.${key}.${o}`)}
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
              setNotes({ changeRef: "", title: "", notes: "" });
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
              setNotes({ changeRef: "", title: "", notes: "" });
              setChecked(new Set());
              setTouched(false);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>

      <p className="cipher-note">{t("intro", { rules: RULE_COUNT })}</p>

      <div className="fc-form-grid">{(Object.keys(OPTIONS) as FieldKey[]).map((k) => selectField(k))}</div>

      <details className="fc-notes">
        <summary className="cipher-note">{t("notes.summary")}</summary>
        <p className="cipher-note">{t("notes.hint")}</p>
        <div className="fc-form-grid">
          <div className="fc-field">
            <label className="cidr-label" htmlFor="hsc-title">{t("notes.title")}</label>
            <input id="hsc-title" className="cidr-input" value={notes.title} onChange={(e) => setNotes((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="fc-field">
            <label className="cidr-label" htmlFor="hsc-ref">{t("notes.changeRef")}</label>
            <input id="hsc-ref" className="cidr-input" value={notes.changeRef} onChange={(e) => setNotes((p) => ({ ...p, changeRef: e.target.value }))} placeholder={t("notes.changeRefPh")} />
          </div>
          <div className="fc-field">
            <label className="cidr-label" htmlFor="hsc-notes">{t("notes.free")}</label>
            <input id="hsc-notes" className="cidr-input" value={notes.notes} onChange={(e) => setNotes((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </details>

      {touched && (
        <>
          <section className="fc-check-group">
            <h3 className="fc-subhead">{t("results.gate")}</h3>
            <div className="fc-why-block">
              <p className="fc-subhead mono">{t(`verdict.${result.gate.verdict}`)}</p>
              <ul className="fc-why-rules">
                {result.gate.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              {result.gate.upgradeConditions.length > 0 && (
                <p className="cipher-note">
                  <strong>{t("results.upgrades")}:</strong> {result.gate.upgradeConditions.join(" ")}
                </p>
              )}
              <p className="cipher-note">
                <strong>{t("results.downgrades")}:</strong> {result.gate.downgradeConditions.join(" ")}
              </p>
            </div>
            <p className="cipher-note">{t("results.baseline")}: {result.baseline.note}</p>
          </section>

          {result.warnings.map((w) => (
            <p key={w.id} className="fc-warning" role="note">
              <strong className="mono">{w.id}</strong> {w.message}
            </p>
          ))}

          {result.completenessGaps.length > 0 && (
            <section className="fc-check-group">
              <h3 className="fc-subhead">{t("results.gaps")}</h3>
              <ul className="fc-why-rules">
                {result.completenessGaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="fc-check-group">
            <h3 className="fc-subhead">{t("results.dimensions")}</h3>
            {result.dimensions.map((d) => {
              const f = result.findings.find((x) => x.dimensionId === d.id);
              return (
                <div key={d.id} className="fc-why-block">
                  <p className="fc-subhead mono">
                    {d.id} · {t(`churnClass.${d.churnClass}`)}{f ? <> · {t(`expectation.${f.expectation}`)}</> : null}
                  </p>
                  <p className="cipher-note"><strong>{d.title}.</strong> {d.record}</p>
                  <p className="cipher-note">{d.deltaMeaning}</p>
                  {f && (
                    <>
                      <p className="cipher-note"><strong>{t("results.supports")}:</strong> {f.supports}</p>
                      <p className="cipher-note"><strong>{t("results.weakens")}:</strong> {f.weakens}</p>
                    </>
                  )}
                </div>
              );
            })}
          </section>

          {result.checklist.length > 0 && (
            <section className="fc-check-group">
              <h3 className="fc-subhead">{t("results.checklist")}</h3>
              <ul className="fc-why-rules">
                {result.checklist.map((c) => (
                  <li key={c.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked.has(c.id)}
                        onChange={(e) => {
                          const next = new Set(checked);
                          if (e.target.checked) next.add(c.id);
                          else next.delete(c.id);
                          setChecked(next);
                        }}
                      />{" "}
                      {c.text}
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <details className="fc-why">
            <summary className="cipher-note">{t("results.whyHeading")}</summary>
            <p className="cipher-note">{t("results.whyIntro")}</p>
            <ul className="fc-why-rules">
              {result.firedRules.map((r) => (
                <li key={r.id}>
                  <code className="mono">{r.id}</code> — {r.reason}
                </li>
              ))}
            </ul>
          </details>

          <div className="fc-export-row">
            <button type="button" className="b64-copy" onClick={copyMd}>
              {copied ? t("results.copied") : t("results.copyMd")}
            </button>
            <button type="button" className="b64-copy" onClick={downloadMd}>
              {t("results.downloadMd")}
            </button>
          </div>
          <p className="cipher-note">{t("results.privacy")}</p>
        </>
      )}
    </div>
  );
}
