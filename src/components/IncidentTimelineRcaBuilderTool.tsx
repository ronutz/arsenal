// ============================================================================
// src/components/IncidentTimelineRcaBuilderTool.tsx
// ----------------------------------------------------------------------------
// INCIDENT TIMELINE & RCA BUILDER (client island) - Operations & Fieldcraft
// tool 3 (D-86). Enter the incident's events as a small structured timeline
// and mark the contributing-factor domains you observed; the deterministic
// engine orders the timeline, derives the milestone spans, and structures
// CANDIDATE contributing factors with the evidence that would confirm or rule
// out each. One click exports a Markdown RCA scaffold.
//
// THE HARD CONSTRAINT (D-86 §3.2 + §3.5): this tool NEVER names a root cause.
// It structures candidates and evidence; a factor is echoed "confirmed" only
// when the user ticks its own "mark confirmed" control here, and it is always
// attributed to the user. The per-candidate confirm control below is the whole
// point of the tool: confirmation is an explicit human act, never the engine's.
//
// The engine runs entirely here in the browser: same input -> same scaffold,
// pinned by rule-firing snapshot vectors plus a machine-checked no-phantom-
// confirm invariant (D-86 §3.1). Free-text notes flow only to the export.
// Candidate/evidence text is canonical English from the engine (vector-pinned);
// all form chrome is localized (D-86 i18n posture).
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  artifactToMarkdown,
  RULE_REASONS,
  type RcaInput,
  type TimelineEvent,
  type EventKind,
  type FactorDomain,
} from "@/lib/tools/incident-timeline-rca-builder";
import { SignalBadge } from "@/components/fieldcraft/FieldcraftShared";

// D-83 Example - verbatim the "change-caused-detect-gap" snapshot vector input.
const EXAMPLE_EVENTS: TimelineEvent[] = [
  { id: "e1", kind: "change-made", order: 10, note: "Deployed v2.3 to the API tier" },
  { id: "e2", kind: "symptom-began", order: 20, note: "5xx rate climbing" },
  { id: "e3", kind: "investigation-step", order: 25 },
  { id: "e4", kind: "alert-fired", order: 30 },
  { id: "e5", kind: "detected", order: 40, note: "On-call paged" },
  { id: "e6", kind: "mitigated", order: 50, note: "Rolled back v2.3" },
  { id: "e7", kind: "resolved", order: 60 },
];
const EXAMPLE_FACTORS: Record<FactorDomain, boolean> = {
  "recent-change": true,
  "monitoring-gap": false,
} as Record<FactorDomain, boolean>;

// A neutral starting point: the minimal shape (a symptom + a detection), no
// factors observed yet, so the first render is a short honest scaffold.
const BLANK_EVENTS: TimelineEvent[] = [
  { id: "e1", kind: "symptom-began", order: 10 },
  { id: "e2", kind: "detected", order: 20 },
];

const EVENT_KINDS: EventKind[] = ["change-made", "symptom-began", "alert-fired", "detected", "investigation-step", "escalated", "mitigated", "resolved", "other"];
const FACTOR_DOMAINS: FactorDomain[] = ["recent-change", "capacity-saturation", "dependency-failure", "configuration-error", "expired-credential", "human-process-gap", "monitoring-gap", "external-provider", "unknown-still"];

let idCounter = 100;
const nextId = () => `e${idCounter++}`;

export default function IncidentTimelineRcaBuilderTool() {
  const t = useTranslations("tools.incident-timeline-rca-builder");

  const [events, setEvents] = useState<TimelineEvent[]>(BLANK_EVENTS);
  // Observed factor domains -> whether the user has marked each confirmed.
  const [factors, setFactors] = useState<Map<FactorDomain, boolean>>(new Map());
  const [notes, setNotes] = useState({ summary: "", followups: "" });
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);

  // Live, local, deterministic. Notes append at render time.
  const result = useMemo(() => {
    if (!touched) return null;
    const input: RcaInput = {
      events,
      factors: Array.from(factors.entries()).map(([domain, confirmed]) => ({ domain, confirmed })),
      notes: {
        summary: notes.summary.trim() || undefined,
        followups: notes.followups.trim() || undefined,
      },
    };
    return run(input);
  }, [events, factors, notes, touched]);

  // ---- event editing ----
  const addEvent = () => {
    setTouched(true);
    setEvents((cur) => {
      const maxOrder = cur.reduce((m, e) => Math.max(m, e.order), 0);
      return [...cur, { id: nextId(), kind: "investigation-step", order: maxOrder + 10 }];
    });
  };
  const removeEvent = (id: string) => {
    setTouched(true);
    setEvents((cur) => cur.filter((e) => e.id !== id));
  };
  const setEventKind = (id: string, kind: EventKind) => {
    setTouched(true);
    setEvents((cur) => cur.map((e) => (e.id === id ? { ...e, kind } : e)));
  };
  const setEventOrder = (id: string, order: number) => {
    setTouched(true);
    setEvents((cur) => cur.map((e) => (e.id === id ? { ...e, order } : e)));
  };
  const setEventNote = (id: string, note: string) => {
    setTouched(true);
    setEvents((cur) => cur.map((e) => (e.id === id ? { ...e, note } : e)));
  };

  // ---- factor observation + confirmation ----
  const toggleFactorObserved = (domain: FactorDomain) => {
    setTouched(true);
    setFactors((cur) => {
      const next = new Map(cur);
      if (next.has(domain)) next.delete(domain);
      else next.set(domain, false); // observed, not yet confirmed
      return next;
    });
  };
  const toggleFactorConfirmed = (domain: FactorDomain) => {
    setTouched(true);
    setFactors((cur) => {
      const next = new Map(cur);
      if (next.has(domain)) next.set(domain, !next.get(domain));
      return next;
    });
  };

  const loadExample = () => {
    setEvents(EXAMPLE_EVENTS.map((e) => ({ ...e })));
    setFactors(new Map(Object.entries(EXAMPLE_FACTORS) as [FactorDomain, boolean][]));
    setNotes({ summary: "", followups: "" });
    setTouched(true);
  };
  const clearAll = () => {
    setEvents(BLANK_EVENTS.map((e) => ({ ...e })));
    setFactors(new Map());
    setNotes({ summary: "", followups: "" });
    setTouched(false);
  };

  const exportMarkdown = () => {
    if (!result) return "";
    return artifactToMarkdown({ ...result.artifact, generated: new Date().toISOString().slice(0, 10) });
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
    a.download = "incident-rca-scaffold.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cidr-tool jwt-tool">
      <div className="dig-input-head">
        <span className="cidr-label">{t("form.heading")}</span>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={loadExample}>
            {t("example")}
          </button>
          <button type="button" className="b64-copy" onClick={clearAll}>
            {t("clear")}
          </button>
        </div>
      </div>

      {/* Timeline editor. Each row: kind + order + optional note. */}
      <div className="fc-field">
        <span className="cidr-label">{t("form.timelineHeading")}</span>
        <p className="cipher-note">{t("form.timelineHint")}</p>
        <ul className="rca-events">
          {events.map((e) => (
            <li key={e.id} className="rca-event">
              <select
                className="cidr-input rca-event-kind"
                value={e.kind}
                onChange={(ev) => setEventKind(e.id, ev.target.value as EventKind)}
                aria-label={t("form.eventKind")}
              >
                {EVENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`eventKinds.${k}`)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="cidr-input rca-event-order mono"
                value={e.order}
                onChange={(ev) => setEventOrder(e.id, Number(ev.target.value))}
                aria-label={t("form.eventOrder")}
              />
              <input
                type="text"
                className="cidr-input rca-event-note"
                value={e.note ?? ""}
                placeholder={t("form.eventNotePlaceholder")}
                onChange={(ev) => setEventNote(e.id, ev.target.value)}
                aria-label={t("form.eventNote")}
              />
              <button
                type="button"
                className="rca-event-remove"
                onClick={() => removeEvent(e.id)}
                aria-label={t("form.removeEvent")}
                disabled={events.length <= 1}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="b64-copy rca-add" onClick={addEvent}>
          {t("form.addEvent")}
        </button>
      </div>

      {/* Contributing-factor domains: observe, then optionally mark confirmed. */}
      <div className="fc-field">
        <span className="cidr-label">{t("form.factorsHeading")}</span>
        <p className="cipher-note">{t("form.factorsHint")}</p>
        <ul className="rca-factors">
          {FACTOR_DOMAINS.map((d) => {
            const observed = factors.has(d);
            const confirmed = factors.get(d) ?? false;
            return (
              <li key={d} className="rca-factor">
                <label className="rca-factor-observe">
                  <input type="checkbox" checked={observed} onChange={() => toggleFactorObserved(d)} /> {t(`factorDomains.${d}`)}
                </label>
                {observed && (
                  <label className="rca-factor-confirm">
                    <input type="checkbox" checked={confirmed} onChange={() => toggleFactorConfirmed(d)} /> {t("form.markConfirmed")}
                  </label>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Optional structured detail: artifact-only by design. */}
      <details className="fc-notes">
        <summary className="cipher-note">{t("notes.heading")}</summary>
        <p className="cipher-note">{t("notes.hint")}</p>
        {(["summary", "followups"] as const).map((k) => (
          <div className="fc-field" key={k}>
            <label className="cidr-label" htmlFor={`rca-note-${k}`}>
              {t(`notes.${k}`)}
            </label>
            <input
              id={`rca-note-${k}`}
              className="cidr-input"
              value={notes[k]}
              onChange={(ev) => setNotes((cur) => ({ ...cur, [k]: ev.target.value }))}
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

          {/* Ordered timeline. */}
          <section className="fc-card rca-timeline">
            <p className="fc-subhead">{t("results.timelineHeading")}</p>
            <ol className="rca-timeline-list">
              {result.timeline.map((ev) => (
                <li key={ev.id} className={ev.milestone ? "rca-tl-item rca-tl-milestone" : "rca-tl-item"}>
                  <span className="rca-tl-label">{t(`eventKinds.${ev.kind}`)}</span>
                  {ev.note ? <span className="rca-tl-note"> - {ev.note}</span> : null}
                </li>
              ))}
            </ol>
            {result.bands.length > 0 && (
              <ul className="rca-bands">
                {result.bands.map((b) => (
                  <li key={b.id} className="rca-band">
                    <span className="rca-band-label">{t(`bands.${b.id}`)}</span>:{" "}
                    <span className="mono">{t("results.bandCount", { count: b.eventsSpanned })}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Structural completeness notes (if any). */}
          {result.risks.length > 0 && (
            <section className="fc-card rca-risks">
              <p className="fc-subhead">{t("results.completenessHeading")}</p>
              <ul className="rca-risk-list">
                {result.risks.map((r) => (
                  <li key={r.id} className="rca-risk-item">
                    <SignalBadge signal={r.severity === "high" ? "strong" : r.severity === "medium" ? "moderate" : "weak"} label={t(`results.severity.${r.severity}`)} />{" "}
                    <span className="rca-risk-label">{r.label}</span>
                    {r.note ? <span className="rca-risk-note"> - {r.note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Candidate contributing factors - the heart of the scaffold. Never
              a verdict; confirmation is user-attributed. */}
          <section className="fc-card rca-candidates">
            <p className="fc-subhead">{t("results.candidatesHeading")}</p>
            <p className="cipher-note">{t("results.candidatesIntro")}</p>
            {result.candidates.map((c) => (
              <div key={c.id} className="rca-candidate">
                <h4 className="fc-card-title">
                  {c.title}
                  {c.userConfirmed && <span className="rca-confirmed-tag">{t("results.confirmedByYou")}</span>}
                </h4>
                <p className="rca-candidate-rationale">{c.rationale}</p>
                <div className="rca-evidence-cols">
                  <div className="rca-evidence-col">
                    <p className="rca-evidence-head">{t("results.confirmHeading")}</p>
                    <ul className="rca-evidence-list">
                      {c.confirmEvidence.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rca-evidence-col">
                    <p className="rca-evidence-head">{t("results.ruleOutHeading")}</p>
                    <ul className="rca-evidence-list">
                      {c.ruleOutEvidence.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Why these candidates? - the fired-rule trail. */}
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
// "Why these candidates?" - a disclosure listing every rule that fired with
// the engine's own reason (RULE_REASONS). Pure function of the fired ids.
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
