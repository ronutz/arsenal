"use client";

// ============================================================================
// src/components/dev/fun/ImportanceMeter.tsx
// ----------------------------------------------------------------------------
// The interface for the Importance Meter.
//
// The whole joke depends on this looking completely sincere. Real inputs, real
// weights, a subtotal that genuinely moves, workings shown line by line - and
// then one multiplication that ends where it was always going to end.
//
// So: no winking, no comic typography, no exclamation marks. The apparatus is
// straight-faced and the arithmetic is honest. The reader does the laughing.
//
// House CSS classes only - every one verified present in the stylesheets. An
// earlier component on this site shipped with invented class names and rendered
// as unstyled browser defaults for a week, which is not a mistake worth making
// twice.
// ============================================================================

import { useState } from "react";
import { measure, type ImportanceResult } from "@/lib/dev/fun/importance-meter/compute";

export interface ImportanceMeterLabels {
  subjectLabel: string;
  subjectPlaceholder: string;
  urgentLabel: string;
  ccLabel: string;
  escalationLabel: string;
  escalationOptions: string[];
  deadlineLabel: string;
  raisedLabel: string;
  movedLabel: string;
  yes: string;
  no: string;
  measureButton: string;
  resetButton: string;
  workingsHeading: string;
  subtotalLabel: string;
  coefficientLabel: string;
  coefficientNote: string;
  resultHeading: string;
  unitLabel: string;
  remarks: Record<ImportanceResult["remark"], string>;
  methodHeading: string;
  methodBody: string;
}

const DEFAULTS = {
  subject: "",
  markedUrgent: false,
  ccCount: 0,
  escalation: 0,
  hoursToDeadline: 48,
  raisedElsewhere: false,
  deadlineMoved: false,
};

export default function ImportanceMeter({ labels }: { labels: ImportanceMeterLabels }) {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState<ImportanceResult | null>(null);

  /** Run the measurement. The outcome is not in doubt; the subtotal is. */
  function run() {
    setResult(measure(form));
  }

  const set = <K extends keyof typeof DEFAULTS>(k: K, v: (typeof DEFAULTS)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="im-subject">
          {labels.subjectLabel}
        </label>
        <input
          id="im-subject"
          className="cidr-input mono"
          spellCheck={false}
          value={form.subject}
          placeholder={labels.subjectPlaceholder}
          onChange={(e) => set("subject", e.target.value)}
        />

        <label className="cidr-label" htmlFor="im-urgent">
          {labels.urgentLabel}
        </label>
        <select
          id="im-urgent"
          className="cidr-input mono"
          value={form.markedUrgent ? "y" : "n"}
          onChange={(e) => set("markedUrgent", e.target.value === "y")}
        >
          <option value="n">{labels.no}</option>
          <option value="y">{labels.yes}</option>
        </select>

        <label className="cidr-label" htmlFor="im-cc">
          {labels.ccLabel}
        </label>
        <input
          id="im-cc"
          className="cidr-input mono"
          inputMode="numeric"
          value={String(form.ccCount)}
          onChange={(e) => set("ccCount", Number(e.target.value.replace(/\D/g, "")) || 0)}
        />

        <label className="cidr-label" htmlFor="im-esc">
          {labels.escalationLabel}
        </label>
        <select
          id="im-esc"
          className="cidr-input mono"
          value={String(form.escalation)}
          onChange={(e) => set("escalation", Number(e.target.value))}
        >
          {labels.escalationOptions.map((o, i) => (
            <option key={i} value={String(i)}>
              {o}
            </option>
          ))}
        </select>

        <label className="cidr-label" htmlFor="im-deadline">
          {labels.deadlineLabel}
        </label>
        <input
          id="im-deadline"
          className="cidr-input mono"
          inputMode="decimal"
          value={String(form.hoursToDeadline)}
          onChange={(e) =>
            set("hoursToDeadline", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)
          }
        />

        <label className="cidr-label" htmlFor="im-raised">
          {labels.raisedLabel}
        </label>
        <select
          id="im-raised"
          className="cidr-input mono"
          value={form.raisedElsewhere ? "y" : "n"}
          onChange={(e) => set("raisedElsewhere", e.target.value === "y")}
        >
          <option value="n">{labels.no}</option>
          <option value="y">{labels.yes}</option>
        </select>

        <label className="cidr-label" htmlFor="im-moved">
          {labels.movedLabel}
        </label>
        <select
          id="im-moved"
          className="cidr-input mono"
          value={form.deadlineMoved ? "y" : "n"}
          onChange={(e) => set("deadlineMoved", e.target.value === "y")}
        >
          <option value="n">{labels.no}</option>
          <option value="y">{labels.yes}</option>
        </select>

        <div className="dig-input-head">
          <button type="button" className="btn btn-secondary" onClick={run}>
            {labels.measureButton}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setForm(DEFAULTS);
              setResult(null);
            }}
          >
            {labels.resetButton}
          </button>
        </div>
      </div>

      {result && (
        <>
          {result.workings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{labels.workingsHeading}</h2>
              <ul className="lbm-facts">
                {result.workings.map((w, i) => (
                  <li key={i} className="ztc-notes">
                    <span className="mono">
                      {w.value > 0 ? "+" : ""}
                      {w.value.toLocaleString()}
                    </span>{" "}
                    &mdash; {w.label}. {w.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="ztc-result">
            <h2 className="ztc-section-title">{labels.subtotalLabel}</h2>
            <p className="tmsh-object-head mono">{result.apparentUrgency.toLocaleString()}</p>
            <p className="ztc-notes">{labels.remarks[result.remark]}</p>
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{labels.coefficientLabel}</h2>
            <p className="tmsh-object-head mono">{result.coefficient}</p>
            <p className="ztc-notes">{labels.coefficientNote}</p>
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{labels.resultHeading}</h2>
            <p className="tmsh-object-head mono">
              {result.apparentUrgency.toLocaleString()} &times; {result.coefficient} ={" "}
              {result.display}
            </p>
            <p className="cidr-privacy">{labels.unitLabel}</p>
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{labels.methodHeading}</h2>
            <p className="ztc-notes">{labels.methodBody}</p>
          </div>
        </>
      )}
    </>
  );
}
