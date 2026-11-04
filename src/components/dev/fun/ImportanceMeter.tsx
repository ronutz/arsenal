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
// The gauges are drawn when the reader presses Calculate, and any change to the
// inputs puts them away again, so the answer is always one that was asked for
// (the arithmetic itself is recomputed on every change, ready for the press).
//
// The hours field keeps exactly what the reader types (review R4-04,
// 03/11/2026): it used to be rebuilt from the parsed number, so typing "0."
// turned straight back into "0" and half an hour could not be entered.
//
// House CSS classes only. SVG is inline and takes its colours from CSS custom
// properties, so it themes with the rest of the site instead of hard-coding a
// palette.
//
// PRIME 03/11/2026 ("Yes on all your suggested ideas"):
//   - A SHARE LINE under the result: the meter's name, the apparent urgency
//     with its remark, and the result with its number (Z3R0, or the override's
//     figure and name), then the page's address; shown as it will be copied,
//     with a Copy button. The subject line is never in it: it is the reader's.
//   - THE TOUCH ROUTE TO IDKFA: a phone has no keyboard, so five quick taps on
//     the gauge (useQuickTaps: touch only, all five within about two seconds)
//     do what typing the code does. Its progress lights the same cue, shown
//     under the gauge's number rather than above the results, so nothing moves
//     under the tapping finger; once the override engages its banner is
//     brought into view.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  measure,
  overrideFor,
  type ImportanceResult,
  type Override,
} from "@/lib/dev/fun/importance-meter/compute";
// The share card's text: the lines, then the page's address with no query string.
import { shareText } from "@/lib/fun/share";
// The share line's Copy button, and the filler for its templates.
import ToyShare, { fillTemplate, type ToyShareLabels } from "@/components/dev/fun/ToyShare";
// Five quick taps on the gauge, the touch route to the code.
import { QUICK_TAP_COUNT, QUICK_TAP_CUE_FROM, useQuickTaps } from "@/lib/hooks/useQuickTaps";
// Up and down arrows for the two numeric fields.
import { StepperField, stepperKeyDown } from "@/components/NumberStepper";

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
  gaugeAria: string;
  overrideBanner: string;
  overrideConsequenceLabel: string;
  overrideRevert: string;
  overrideHint: string;
  fullscreenEnter: string;
  fullscreenExit: string;
  disclaimerHeading: string;
  disclaimerBody: string;
  disclaimerSourcesHeading: string;
  /** The meter's name, the share card's first line. */
  meterName: string;
  /** The urgency line's template, raw: {urgency} and {remark}. */
  shareUrgency: string;
  /** The result line's template, raw: {result}. */
  shareResult: string;
  /** The result line under an override, raw: {result} and {override}. */
  shareOverride: string;
  /** The Copy button's words. */
  share: ToyShareLabels;
}

/** The page's path below /dev/fun, for the address in the share line (the page exists in English only). */
const SLUG = "importance-meter";

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
  // The hours field as typed ("0.", "1.5"), so a decimal point survives until its digits arrive (review R4-04).
  const [deadlineText, setDeadlineText] = useState(String(DEFAULTS.hoursToDeadline));
  const [typed, setTyped] = useState("");
  const [override, setOverride] = useState<Override | null>(null);
  // The result is not shown until asked for. Any change to the inputs puts it
  // away again, so the answer is always something the reader requested.
  const [shown, setShown] = useState(false);
  // Whether the progress on show came from taps on the gauge (its cue then sits under the gauge) or from keys (above).
  const [typedByTaps, setTypedByTaps] = useState(false);
  // The override banner, brought into view when taps engaged it (the reader is down at the gauge).
  const overrideRef = useRef<HTMLDivElement>(null);
  // Set by the tap that completes the code, so the banner it brings is scrolled to.
  const tapsCompletedRef = useRef(false);
  // Counts the overrides engaged by taps; each new one scrolls to the banner.
  const [revealTick, setRevealTick] = useState(0);

  // ---- Fullscreen --------------------------------------------------------
  // Follows the Mega Brain's approach on this site, which handles the case that
  // matters: iPhone Safari will not fullscreen an arbitrary element, so a CSS
  // fallback reaches the same look when the real API is unavailable or refuses.
  // Listening for fullscreenchange keeps the button honest when the reader
  // leaves via Escape rather than the button.
  const shellRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [nativeFs, setNativeFs] = useState(false);
  const [cssFs, setCssFs] = useState(false);
  const isFullscreen = nativeFs || cssFs;

  useEffect(() => {
    const sync = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const el = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setNativeFs(el === shellRef.current);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    const doc = document as Document & {
      webkitExitFullscreen?: () => void;
      webkitFullscreenElement?: Element | null;
      webkitFullscreenEnabled?: boolean;
    };
    const node = el as HTMLDivElement & { webkitRequestFullscreen?: () => void };
    if (cssFs) {
      setCssFs(false);
      return;
    }
    if (document.fullscreenElement ?? doc.webkitFullscreenElement) {
      (document.exitFullscreen?.bind(document) ?? doc.webkitExitFullscreen?.bind(doc))?.();
      return;
    }
    const request = node.requestFullscreen?.bind(node) ?? node.webkitRequestFullscreen?.bind(node);
    const enabled = document.fullscreenEnabled ?? doc.webkitFullscreenEnabled ?? false;
    if (request && enabled) {
      Promise.resolve(request()).catch(() => setCssFs(true));
    } else {
      setCssFs(true);
    }
  }, [cssFs]);

  // Key sequence listener. Ignores keystrokes aimed at the text field, so
  // typing the subject line does not accidentally arm anything.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key.length !== 1) return;
      const k = e.key.toUpperCase();
      // Typed progress shows its cue in its usual place, above the results.
      setTypedByTaps(false);
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

  // The touch route: five quick taps on the gauge type the code, a letter a tap. The cue shows from the third tap
  // (QUICK_TAP_CUE_FROM), and a run that lapses before the fifth puts it away, as a wrong key wipes the typed one.
  const onGaugeTap = useQuickTaps(
    QUICK_TAP_COUNT,
    (n) => {
      // Too early to show anything.
      if (n < QUICK_TAP_CUE_FROM) return;
      // The last tap: the override this completes will bring its banner into view.
      if (n >= QUICK_TAP_COUNT) tapsCompletedRef.current = true;
      // The cue sits under the gauge.
      setTypedByTaps(true);
      // As many letters as taps; the fifth completes the code, and the effect below engages the override.
      setTyped(SEQUENCE.slice(0, n));
    },
    (reached) => {
      // The run lapsed: its cue goes, unless keys have since typed something else.
      setTyped((prev) => (prev === SEQUENCE.slice(0, reached) ? "" : prev));
    },
  );

  // Live, not behind a button: the reader needs to watch one gauge climb while
  // the other stays where it is.
  const result = useMemo(() => measure(form, override ?? undefined), [form, override]);

  // Completing the sequence arms the override, chosen from the CURRENT subtotal
  // so the same inputs always produce the same one.
  useEffect(() => {
    if (typed === SEQUENCE) {
      setOverride(overrideFor(measure(form).apparentUrgency));
      setTyped("");
      // Completed by taps: the reader is at the gauge, so the banner is brought to them once it renders.
      if (tapsCompletedRef.current) {
        // Handled.
        tapsCompletedRef.current = false;
        // One more banner to show.
        setRevealTick((t) => t + 1);
      }
    }
  }, [typed, form]);

  // An override engaged by taps: its banner, above the results, comes into view.
  useEffect(() => {
    // Nothing engaged by taps yet.
    if (revealTick === 0) return;
    // A reader who asked for less motion gets a jump, not a glide.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The banner in the middle of the screen.
    overrideRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [revealTick]);

  const set = <K extends keyof typeof DEFAULTS>(k: K, v: (typeof DEFAULTS)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setShown(false);
  };
  // The deadline set by its arrows: the field shows the stepped text, the arithmetic takes its value (comma or point).
  const setDeadlineFromArrows = (v: string) => {
    // The text, as the arrows wrote it.
    setDeadlineText(v);
    // Its value.
    set("hoursToDeadline", Number(v.replace(",", ".")) || 0);
  };

  const fill = fillFraction(result.apparentUrgency);

  // Needle angle computed from the REAL total. Without the override the total
  // is always zero, so the needle sits at -90 and never moves. With it, the
  // same expression finally has something to draw.
  const needleScale = override ? 200000 : 100;
  const needleAngle = -90 + Math.min(1, result.total / needleScale) * 180;

  // The share card: the meter's name, the urgency and its remark, the result with its number, then the address.
  const shareCard = shareText({
    // "Importance Meter".
    title: labels.meterName,
    lines: [
      // "Apparent urgency: 4,250. Considerable. There is now a recurring meeting about it."
      fillTemplate(labels.shareUrgency, { urgency: result.apparentUrgency.toLocaleString("en-US"), remark: labels.remarks[result.remark] }),
      // "Result: Z3R0 fucks given.", or the override's figure and its name.
      override
        ? fillTemplate(labels.shareOverride, { result: result.display, override: override.label })
        : fillTemplate(labels.shareResult, { result: result.display }),
    ],
    // The page exists in English only.
    locale: "en",
    // This toy.
    slug: SLUG,
  });

  /**
   * The code's progress cue: a letter lit per key typed (or tap), the rest as dots.
   *
   * @param extra a class for its placement (under the gauge for taps), or ""
   * @returns the cue
   */
  const seqCue = (extra: string) => (
    <p className={"im-seq" + (extra ? " " + extra : "")} aria-live="polite">
      {SEQUENCE.split("").map((ch, i) => (
        <span key={i} className={"im-seq-key" + (i < typed.length ? " im-seq-key-on" : "")}>
          {i < typed.length ? ch : "·"}
        </span>
      ))}
    </p>
  );

  return (
    <div ref={shellRef} className={"im-shell" + (cssFs ? " im-fs" : "")}>
      <div className="im-fs-bar">
        <button
          type="button"
          className="im-fs-toggle"
          aria-pressed={isFullscreen}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? labels.fullscreenExit : labels.fullscreenEnter}
        </button>
      </div>

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

        {/* Laid out in a responsive grid (PRIME 2026-07-30): two to four fields
            per row on a wide screen, one per row on a narrow one, so the page
            stops being a single tall column. Numeric fields are plain text
            inputs again - a slider hides the exact figure, and the exact figure
            is what the workings are quoting back. */}
        <div className="im-grid">
          <div className="im-field">
            <label className="cidr-label" htmlFor="im-cc">
              {labels.ccLabel}
            </label>
            {/* Up and down arrows beside the field, so the count is set with a mouse or a finger too. */}
            <StepperField value={String(form.ccCount)} onValue={(v) => set("ccCount", Number(v) || 0)} min={0} max={9999} label={labels.ccLabel} inputId="im-cc">
              <input
                id="im-cc"
                className="cidr-input mono"
                inputMode="numeric"
                value={String(form.ccCount)}
                onChange={(e) => set("ccCount", Number(e.target.value.replace(/\D/g, "")) || 0)}
                // Arrow Up and Down step the count from the keyboard.
                onKeyDown={stepperKeyDown({ value: String(form.ccCount), onValue: (v) => set("ccCount", Number(v) || 0), min: 0, max: 9999 })}
              />
            </StepperField>
          </div>

          <div className="im-field">
            <label className="cidr-label" htmlFor="im-deadline">
              {labels.deadlineLabel}
            </label>
            {/* Up and down arrows: one hour a press, the field's text set as if typed (a decimal comma kept). */}
            <StepperField value={deadlineText} onValue={setDeadlineFromArrows} min={0} label={labels.deadlineLabel} inputId="im-deadline">
            <input
              id="im-deadline"
              className="cidr-input mono"
              inputMode="decimal"
              // Arrow Up and Down step the hours from the keyboard.
              onKeyDown={stepperKeyDown({ value: deadlineText, onValue: setDeadlineFromArrows, min: 0 })}
              // What the reader typed, not the number rebuilt from it.
              value={deadlineText}
              onChange={(e) => {
                // Digits and one decimal point (a comma, as typed on a Portuguese keyboard, counts as the point).
                const typed = e.target.value.replace(/,/g, ".").replace(/[^\d.]/g, "");
                // A second point is dropped: "1.5.2" keeps "1.52".
                const clean = typed.replace(/^([^.]*\.)(.*)$/, (_, head: string, tail: string) => head + tail.replace(/\./g, ""));
                // The field shows it as typed.
                setDeadlineText(clean);
                // The arithmetic takes its value ("0." is 0, "" is 0).
                set("hoursToDeadline", Number(clean) || 0);
              }}
            />
            </StepperField>
          </div>

          <div className="im-field">
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
          </div>
        </div>

        <div className="im-grid">
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
        </div>

        <div className="dig-input-head">
          <button
            type="button"
            className={"im-calculate" + (shown ? "" : " im-calculate-waiting")}
            onClick={() => {
              setShown(true);
              // Let the newly revealed blocks mount before scrolling to them.
              requestAnimationFrame(() =>
                resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
              );
            }}
          >
            {labels.measureButton}
            <span aria-hidden="true" className="im-calculate-arrow">
              &#8595;
            </span>
          </button>
          <button
            type="button"
            className="im-reset"
            onClick={() => {
              setForm(DEFAULTS);
              // The hours field back to its default text too.
              setDeadlineText(String(DEFAULTS.hoursToDeadline));
              setShown(false);
            }}
          >
            {labels.resetButton}
          </button>
        </div>
      </div>

      {/* Sequence progress. Only visible once the reader is on to something,
          so it does not advertise itself to someone who is not looking.
          Progress from taps shows under the gauge instead (see below). */}
      {typed.length > 0 && !override && !typedByTaps && <div className="ztc-result">{seqCue("")}</div>}

      {override && (
        // Kept as a handle, so an override engaged by taps can be brought into view.
        <div ref={overrideRef} className="ztc-result im-override im-result-centred">
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

      {/* Anchor for the post-Calculate scroll. */}
      <div ref={resultsRef} />

      {shown && (
      <div className="ztc-result im-urgency">
        <div className="im-urgency-row">
          <span className="im-urgency-label">{labels.subtotalLabel}</span>
          <span className="im-urgency-value mono">
            {result.apparentUrgency.toLocaleString()}
          </span>
          <svg
            className="im-bar"
            viewBox="0 0 400 12"
            preserveAspectRatio="none"
            role="img"
            aria-hidden="true"
          >
            <rect className="im-bar-track" x="0" y="1" width="400" height="10" rx="5" />
            <rect
              className="im-bar-fill"
              x="0"
              y="1"
              width={Math.max(0, fill * 400)}
              height="10"
              rx="5"
            />
            <line className="im-bar-tick" x1="100" y1="0" x2="100" y2="12" />
            <line className="im-bar-tick" x1="200" y1="0" x2="200" y2="12" />
            <line className="im-bar-tick" x1="300" y1="0" x2="300" y2="12" />
          </svg>
          <span className="im-urgency-remark">{labels.remarks[result.remark]}</span>
        </div>
      </div>
      )}

      {shown && (
      <div className="ztc-result im-result-centred">
        <h2 className="ztc-section-title">{labels.resultHeading}</h2>
        {/* Five quick taps here (touch only) type the code; see useQuickTaps. */}
        <svg className="im-gauge" viewBox="0 0 240 148" role="img" aria-label={labels.gaugeAria} onPointerUp={onGaugeTap}>
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
        <p className="im-big im-unit mono">{labels.unitLabel}</p>
        {/* The taps' progress, here under the gauge, where the reader is looking; below it, so nothing moves. */}
        {typed.length > 0 && !override && typedByTaps && seqCue("im-seq-gauge")}
        {/* The share line, shown as it will be copied, and its Copy button. */}
        <ToyShare className="im-share" text={shareCard} labels={labels.share} preview />
      </div>
      )}

      {shown && (
      <div className="ztc-result im-result-centred">
        <h2 className="ztc-section-title">{labels.coefficientLabel}</h2>
        <p className="tmsh-object-head mono">
          {result.apparentUrgency.toLocaleString()} &times; {result.coefficient} = {result.display}
        </p>
        <p className="ztc-notes">{labels.coefficientNote}</p>
      </div>
      )}

      {shown && result.workings.length > 0 && (
        <div className="ztc-result im-result-centred">
          <h2 className="ztc-section-title">{labels.workingsHeading}</h2>
          <ul className="lbm-facts">
            {result.workings.map((w, i) => (
              <li key={i} className="ztc-notes">
                <span className="mono">
                  {w.value > 0 ? "+" : ""}
                  {w.value.toLocaleString()}
                </span>
                : {w.label}. {w.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {shown && (
      <div className="ztc-result im-result-centred">
        <h2 className="ztc-section-title">{labels.methodHeading}</h2>
        <p className="ztc-notes">{labels.methodBody}</p>
        <p className="cidr-privacy">{labels.overrideHint}</p>
      </div>
      )}

      {/* Gated with everything else. An earlier version left this outside the
          gate on the grounds that it is context rather than result - but it
          QUOTES THE PHRASE, and anything quoting the phrase is a spoiler no
          matter which category it belongs to. */}
      {shown && (
      <div className="ztc-result im-result-centred">
        <h2 className="ztc-section-title">{labels.disclaimerHeading}</h2>
        <p className="ztc-notes">{labels.disclaimerBody}</p>
        <p className="ztc-notes">
          <strong>{labels.disclaimerSourcesHeading}</strong>
        </p>
        <ul className="lbm-facts">
          <li className="provenance-source">
            <a
              className="provenance-source-link"
              href="https://www.dictionary.com/e/slang/zero-fucks/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Dictionary.com: the phrase, its sense and its history
            </a>
          </li>
          <li className="provenance-source">
            <a
              className="provenance-source-link"
              href="https://www.urbandictionary.com/define.php?term=Zero%20fucks%20given"
              rel="noopener noreferrer"
              target="_blank"
            >
              Urban Dictionary: how speakers actually use it
            </a>
          </li>
          <li className="provenance-source">
            <a
              className="provenance-source-link"
              href="https://www.quora.com/What-does-I-give-zero-F-s-mean"
              rel="noopener noreferrer"
              target="_blank"
            >
              Quora: what it means, explained for learners
            </a>
          </li>
        </ul>
      </div>
      )}
    </div>
  );
}
