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
//
// PAGE LANGUAGE (02/11/2026): the reading comes from runLocalisable() (every
// sentence an EngineText) and is turned into the page's language once, by
// inPageLanguage(); the gate, the dimensions, the findings, the checklist, the
// Why panel and the exported report then read in Portuguese on the pt-BR page
// and exactly as before in English (the notes stay as typed). The engine is
// imported from compute directly (not the index, which also pulls the
// manifest and the vectors into the page).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  runLocalisable,
  artifactToMarkdown,
  RULE_COUNT,
  type HscInput,
} from "@/lib/tools/health-snapshot-comparator/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the form as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { HEALTH_SNAPSHOT_SHARE, checkHealthSnapshotNotes, encodeHealthSnapshotShare, type HealthSnapshotShareState } from "@/lib/tools/health-snapshot-comparator/share"; // this tool's share spec: the form and the notes, checked

/** Share results with nothing to share: the button is disabled (the result is not shown yet). */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

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
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language (02/11/2026)
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
    return inPageLanguage(runLocalisable({ ...input, notes: Object.keys(n).length ? n : undefined }), tx); // the reading, in the page's language
  }, [input, notes, tx]);

  // Share results (2026-11-01): the form and the notes as one state; the notes check runs once per change and feeds
  // the button, the caution line and the blocked message; there is something to share only while the gate is shown.
  const shareState = useMemo<HealthSnapshotShareState>(() => ({ input, notes }), [input, notes]); // what a link carries
  const shareCheck = useMemo(() => checkHealthSnapshotNotes(shareState), [shareState]); // credentials and secret-looking names in the notes
  const share = useMemo<ShareEncoding>(() => (touched ? encodeHealthSnapshotShare(shareState, shareCheck) : NOTHING), [touched, shareState, shareCheck]); // the button's encoding
  const shareMaybe = shareCheck.maybe[0] ?? null; // the first secret-looking value, for the caution line
  // A note's link name to the label the form shows for it (the popover names the note it found something in).
  const NOTE_LABEL: Record<string, string> = { title: "notes.title", changeref: "notes.changeRef", notes: "notes.free" }; // link name -> message key
  const noteLabel = (field: string): string => (NOTE_LABEL[field] ? t(NOTE_LABEL[field]) : field); // the form's own words
  // A shared link sets the choices and the notes as typing would; the checklist ticks start empty and the gate computes.
  useShareArrival(HEALTH_SNAPSHOT_SHARE, (s) => { setInput({ ...s.input }); setNotes({ ...s.notes }); setChecked(new Set()); setTouched(true); });

  const set = (k: FieldKey, v: string) => {
    setInput((p) => ({ ...p, [k]: v }) as HscInput);
    setTouched(true);
  };

  const exportMarkdown = () => artifactToMarkdown({ ...result.artifact, generated: new Date().toISOString().slice(0, 10) }, tx); // the Generated line in the page's language too

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

          {/* Share results (2026-11-01): under the gate verdict (the headline), before the warnings and dimensions. The caution and a note's secret-looking value show only beside a link;
              a note holding a credential gives no link, naming the note. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[t("share.caution"), ...(shareMaybe ? [t("share.maybeSecret", { field: noteLabel(shareMaybe.field), label: shareMaybe.label })] : [])]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { field: noteLabel(String(share.values?.field ?? "")), label: String(share.values?.label ?? "") }) : ""}
              title={t("name")}
            />
          </div>

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
                  <code className="mono">{r.id}</code>: {r.reason}
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
