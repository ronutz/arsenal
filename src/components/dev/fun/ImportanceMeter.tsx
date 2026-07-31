"use client";

// ============================================================================
// src/components/dev/fun/ImportanceMeter.tsx
// ----------------------------------------------------------------------------
// Rebuilt 2026-07-30 at PRIME's request: more interactive, sliders, choosers,
// SVG.
//
// THE DESIGN IDEA. Two gauges, and the contrast between them IS the joke:
//
//   1. APPARENT URGENCY - a bar that fills, dramatically, and keeps filling.
//      Log-scaled so it responds at every order of magnitude. Everything the
//      reader touches makes this move.
//
//   2. THE RESULT - a semicircular gauge with a needle. The needle never leaves
//      zero. It is drawn FROM THE SAME COMPUTED VALUE as everything else, so it
//      is not faked: the number it renders really is zero, every time.
//
// It recomputes on every change rather than behind a button, so the reader can
// watch the first gauge climb while the second refuses to move. That is the
// whole gag and it has to be live to land.
//
// House CSS classes only. SVG is inline and takes its colours from CSS custom
// properties, so it themes with the rest of the site instead of hard-coding a
// palette.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  measure,
  overrideFor,
  type ImportanceResult,
  type Override,
} from "@/lib/dev/fun/importance-meter/compute";

/**
 * The sequence. Typed anywhere on the page.
 *
 * Progress is shown a letter at a time and WIPED ENTIRELY on a wrong key, which
 * is the part that makes it feel like the thing it is quoting - no partial
 * credit, no forgiving prefix matching. Getting it wrong on the last letter
 * costs you all five.
 */
const SEQUENCE = "IDKFA";

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
  gaugeAria: string;
  hoursSuffix: string;
  peopleSuffix: string;
  overrideBanner: string;
  overrideConsequenceLabel: string;
  overrideRevert: string;
  overrideHint: string;
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

/** Log scale, so the bar keeps responding at every order of magnitude. */
function fillFraction(subtotal: number): number {
  if (subtotal <= 0) return 0;
  const f = Math.log10(subtotal + 1) / Math.log10(100000);
  return Math.max(0, Math.min(1, f));
}

/** Two-state chooser. Reads better than a select for a yes/no. */
function Segmented({
  id,
  label,
  value,
  onChange,
  yes,
  no,
}: {
  id: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  yes: string;
  no: string;
}) {
  return (
    <div className="im-field">
      <span className="cidr-label" id={id + "-label"}>
        {label}
      </span>
      <div className="im-segmented" role="group" aria-labelledby={id + "-label"}>
        <button
          type="button"
          className={"im-seg" + (!value ? " im-seg-on" : "")}
          aria-pressed={!value}
          onClick={() => onChange(false)}
        >
          {no}
        </button>
        <button
          type="button"
          className={"im-seg" + (value ? " im-seg-on" : "")}
          aria-pressed={value}
          onClick={() => onChange(true)}
        >
          {yes}
        </button>
      </div>
    </div>
  );
}

export default function ImportanceMeter({ labels }: { labels: ImportanceMeterLabels }) {
  const [form, setForm] = useState(DEFAULTS);
  const [typed, setTyped] = useState("");
  const [override, setOverride] = useState<Override | null>(null);

  // Key sequence listener. Ignores keystrokes aimed at the text field, so
  // typing the subject line does not accidentally arm anything.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key.length !== 1) return;
      const k = e.key.toUpperCase();
      setTyped((prev) => {
        const next = prev + k;
        // Correct so far: keep it and show it.
        if (SEQUENCE.startsWith(next)) return next;
        // Wrong key wipes everything - unless it happens to be a fresh start.
        return k === SEQUENCE[0] ? k : "";
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Live, not behind a button: the reader needs to watch one gauge climb while
  // the other stays where it is.
  const result = useMemo(() => measure(form, override ?? undefined), [form, override]);

  // Completing the sequence arms the override, chosen from the CURRENT subtotal
  // so the same inputs always produce the same one.
  useEffect(() => {
    if (typed === SEQUENCE) {
      setOverride(overrideFor(measure(form).apparentUrgency));
      setTyped("");
    }
  }, [typed, form]);

  const set = <K extends keyof typeof DEFAULTS>(k: K, v: (typeof DEFAULTS)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const fill = fillFraction(result.apparentUrgency);

  // Needle angle computed from the REAL total. Without the override the total
  // is always zero, so the needle sits at -90 and never moves. With it, the
  // same expression finally has something to draw.
  const needleScale = override ? 200000 : 100;
  const needleAngle = -90 + Math.min(1, result.total / needleScale) * 180;

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

        <div className="im-field">
          <span className="cidr-slider-label">
            <label className="cidr-label" htmlFor="im-cc">
              {labels.ccLabel}
            </label>
            <span className="cidr-slider-value mono">
              {form.ccCount} {labels.peopleSuffix}
            </span>
          </span>
          <input
            id="im-cc"
            className="cidr-slider"
            type="range"
            min={0}
            max={120}
            value={form.ccCount}
            onChange={(e) => set("ccCount", Number(e.target.value))}
          />
        </div>

        <div className="im-field">
          <span className="cidr-slider-label">
            <label className="cidr-label" htmlFor="im-deadline">
              {labels.deadlineLabel}
            </label>
            <span className="cidr-slider-value mono">
              {form.hoursToDeadline} {labels.hoursSuffix}
            </span>
          </span>
          <input
            id="im-deadline"
            className="cidr-slider"
            type="range"
            min={0}
            max={168}
            value={form.hoursToDeadline}
            onChange={(e) => set("hoursToDeadline", Number(e.target.value))}
          />
        </div>

        <div className="im-field">
          <span className="cidr-slider-label">
            <label className="cidr-label" htmlFor="im-esc">
              {labels.escalationLabel}
            </label>
            <span className="cidr-slider-value mono">
              {labels.escalationOptions[form.escalation]}
            </span>
          </span>
          <input
            id="im-esc"
            className="cidr-slider"
            type="range"
            min={0}
            max={4}
            value={form.escalation}
            onChange={(e) => set("escalation", Number(e.target.value))}
          />
        </div>

        <Segmented
          id="im-urgent"
          label={labels.urgentLabel}
          value={form.markedUrgent}
          onChange={(v) => set("markedUrgent", v)}
          yes={labels.yes}
          no={labels.no}
        />
        <Segmented
          id="im-raised"
          label={labels.raisedLabel}
          value={form.raisedElsewhere}
          onChange={(v) => set("raisedElsewhere", v)}
          yes={labels.yes}
          no={labels.no}
        />
        <Segmented
          id="im-moved"
          label={labels.movedLabel}
          value={form.deadlineMoved}
          onChange={(v) => set("deadlineMoved", v)}
          yes={labels.yes}
          no={labels.no}
        />

        <div className="dig-input-head">
          <button type="button" className="btn btn-secondary" onClick={() => setForm(DEFAULTS)}>
            {labels.resetButton}
          </button>
        </div>
      </div>

      {/* Sequence progress. Only visible once the reader is on to something,
          so it does not advertise itself to someone who is not looking. */}
      {typed.length > 0 && !override && (
        <div className="ztc-result">
          <p className="im-seq" aria-live="polite">
            {SEQUENCE.split("").map((ch, i) => (
              <span key={i} className={"im-seq-key" + (i < typed.length ? " im-seq-key-on" : "")}>
                {i < typed.length ? ch : "\u00B7"}
              </span>
            ))}
          </p>
        </div>
      )}

      {override && (
        <div className="ztc-result im-override">
          <p className="im-override-banner mono">{override.label}</p>
          <p className="ztc-notes">
            <strong>{labels.overrideConsequenceLabel}</strong> {override.consequence}
          </p>
          <div className="dig-input-head">
            <button type="button" className="btn btn-secondary" onClick={() => setOverride(null)}>
              {labels.overrideRevert}
            </button>
          </div>
        </div>
      )}

      <div className="ztc-result">
        <h2 className="ztc-section-title">{labels.subtotalLabel}</h2>
        <p className="im-big mono">{result.apparentUrgency.toLocaleString()}</p>
        <svg className="im-bar" viewBox="0 0 400 26" role="img" aria-hidden="true">
          <rect className="im-bar-track" x="0" y="8" width="400" height="10" rx="5" />
          <rect className="im-bar-fill" x="0" y="8" width={Math.max(0, fill * 400)} height="10" rx="5" />
          <line className="im-bar-tick" x1="100" y1="4" x2="100" y2="22" />
          <line className="im-bar-tick" x1="200" y1="4" x2="200" y2="22" />
          <line className="im-bar-tick" x1="300" y1="4" x2="300" y2="22" />
        </svg>
        <p className="ztc-notes">{labels.remarks[result.remark]}</p>
      </div>

      <div className="ztc-result">
        <h2 className="ztc-section-title">{labels.resultHeading}</h2>
        <svg className="im-gauge" viewBox="0 0 240 148" role="img" aria-label={labels.gaugeAria}>
          <path
            className="im-gauge-arc"
            d="M 24 120 A 96 96 0 0 1 216 120"
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {Array.from({ length: 11 }).map((_, i) => {
            const a = ((-90 + i * 18) * Math.PI) / 180;
            const inner = 78;
            const outer = i % 5 === 0 ? 60 : 70;
            return (
              <line
                key={i}
                className="im-gauge-tick"
                x1={120 + Math.sin(a) * inner}
                y1={120 - Math.cos(a) * inner}
                x2={120 + Math.sin(a) * outer}
                y2={120 - Math.cos(a) * outer}
              />
            );
          })}
          <g transform={"rotate(" + needleAngle + " 120 120)"}>
            <line className="im-gauge-needle" x1="120" y1="120" x2="120" y2="44" />
          </g>
          <circle className="im-gauge-hub" cx="120" cy="120" r="7" />
          <text className="im-gauge-zero mono" x="24" y="142" textAnchor="middle">
            0
          </text>
        </svg>
        <p className="im-big mono">{result.display}</p>
        <p className="cidr-privacy">{labels.unitLabel}</p>
      </div>

      <div className="ztc-result">
        <h2 className="ztc-section-title">{labels.coefficientLabel}</h2>
        <p className="tmsh-object-head mono">
          {result.apparentUrgency.toLocaleString()} &times; {result.coefficient} = {result.display}
        </p>
        <p className="ztc-notes">{labels.coefficientNote}</p>
      </div>

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
        <h2 className="ztc-section-title">{labels.methodHeading}</h2>
        <p className="ztc-notes">{labels.methodBody}</p>
        <p className="cidr-privacy">{labels.overrideHint}</p>
      </div>
    </>
  );
}
