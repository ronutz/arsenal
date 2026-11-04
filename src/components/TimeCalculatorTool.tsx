// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/TimeCalculatorTool.tsx — client UI for exact time
// arithmetic: the span between two instants, or an instant ± a duration.
// Calendar units (months/years) are refused with an explanation, by design.
// All compute is local.
//
// Share results (2026-11-01): a button under the result builds a link that
// carries the mode and its fields (a form: named values only). An arriving
// link (useShareArrival) sets them as the reader would.
//
// Page language (02/11/2026): the reading comes from diffLocalisable() /
// shiftLocalisable() and is turned into the page's language by
// inPageLanguage(); input errors through engineTexts().error. The English page
// reads exactly as before.
//
// WITHOUT A KEYBOARD (03/11/2026): under each instant, a date-and-time picker
// (type="datetime-local", the phone's own wheel or calendar) writes the field
// as typing would. The field stays typed text, because the engine reads more
// than a picker can hold (an offset, a date alone, seconds, the Examples' Z):
// the picker shows the field's date and time, and a pick keeps the field's
// seconds and offset, or adds Z (UTC) when it had none, as the label says.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { diffLocalisable, shiftLocalisable, TimeInputError, type TimeAnalysis } from "@/lib/tools/time-calculator/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { TIME_SHARE, encodeTimeShare, type TimeShareState } from "@/lib/tools/time-calculator/share"; // this tool's share spec: the mode and its fields

type Mode = "diff" | "shift";

/**
 * An instant split for the date-and-time picker: "2024-02-28T00:00:30-03:00" gives the picker's "2024-02-28T00:00"
 * and the tail ":30-03:00", kept when the reader picks.
 *
 * @param text the field as typed
 * @returns the picker's value ("" when the field holds no date and time it can show) and the tail to keep
 */
function pickerParts(text: string): { local: string; tail: string } {
  // A date, a T or a space, hours and minutes, optional seconds, an optional offset.
  const m = /^\s*(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2}(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?\s*$/i.exec(text);
  // Shown and kept, or an empty picker whose pick is read as UTC.
  return m ? { local: `${m[1]}T${m[2]}`, tail: (m[3] ?? "") + (m[4] ?? "Z") } : { local: "", tail: "Z" };
}
type Result = { ok: true; data: TimeAnalysis } | { ok: false; message: string };

// D-83 Example samples — verbatim from this tool's golden vectors (v4, v1).
const EX_DIFF = { a: "2024-02-28T00:00Z", b: "2024-03-01T00:00Z" };
const EX_SHIFT = { start: "2026-01-01T00:00Z", duration: "P1DT2H" };

export default function TimeCalculatorTool() {
  const t = useTranslations("tools.time-calculator");
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language (02/11/2026)
  const [mode, setMode] = useState<Mode>("diff");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState("");
  const [op, setOp] = useState<"add" | "subtract">("add");

  const result: Result | null = useMemo(() => {
    try {
      if (mode === "diff") {
        if (!a.trim() && !b.trim()) return null;
        return { ok: true, data: inPageLanguage(diffLocalisable(a, b), tx) }; // the span, in the page's language
      }
      if (!start.trim() && !duration.trim()) return null;
      return { ok: true, data: inPageLanguage(shiftLocalisable(start, duration, op), tx) }; // the shifted instant, in the page's language
    } catch (e) {
      return { ok: false, message: e instanceof TimeInputError ? tx.error(e) : t("errGeneric") }; // the input error's sentence in the page's language
    }
  }, [mode, a, b, start, duration, op, t, tx]);

  // An arriving share link: the mode and its fields are set as the reader would set them; the other mode's fields stay.
  useShareArrival(TIME_SHARE, (s) => {
    // The mode first.
    setMode(s.mode);
    // Then its fields.
    if (s.mode === "diff") { setA(s.first); setB(s.second); } else { setStart(s.start); setDuration(s.duration); setOp(s.op); } // as typed
  });
  // What Share results carries: the mode's fields, once the page has a result (memoised).
  const share = useMemo(() => {
    // The state of the mode shown.
    const s: TimeShareState = mode === "diff" ? { mode, first: a, second: b } : { mode, start, duration, op }; // as typed
    // Encoded from the result the page already has.
    return encodeTimeShare(s, !!result?.ok);
  }, [mode, a, b, start, duration, op, result]); // the encoding

  const setExample = () => {
    if (mode === "diff") { setA(EX_DIFF.a); setB(EX_DIFF.b); }
    else { setStart(EX_SHIFT.start); setDuration(EX_SHIFT.duration); setOp("add"); }
  };
  const clearAll = () => { setA(""); setB(""); setStart(""); setDuration(""); };

  /**
   * The date-and-time picker under an instant field (03/11/2026): it shows the field's date and time, and a pick
   * writes the field as typing would, keeping the field's seconds and offset (Z when it had none).
   *
   * @param id the field's id (the picker's is the same with "-pick")
   * @param text the field as typed
   * @param set the field's setter
   * @param label the field's label, for the picker's name
   * @returns the labelled picker
   */
  const picker = (id: string, text: string, set: (v: string) => void, label: string) => {
    // What the picker shows, and what a pick keeps.
    const parts = pickerParts(text);
    // The row: the short label, then the picker.
    return (
      <label className="time-pick" htmlFor={`${id}-pick`}>
        <span className="time-pick-label">{t("pickLabel")}</span>
        {/* A cleared picker (an empty value) leaves the field as it is. */}
        <input id={`${id}-pick`} type="datetime-local" className="cidr-input mono time-pick-input" value={parts.local} aria-label={t("pickAria", { field: label })} onChange={(e) => { if (e.target.value) set(e.target.value + parts.tail); }} />
      </label>
    );
  };

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <div className="dig-input-actions" role="tablist" aria-label={t("modeLabel")}>
            <button type="button" className="b64-copy" aria-pressed={mode === "diff"} onClick={() => setMode("diff")}>{t("modeDiff")}</button>
            <button type="button" className="b64-copy" aria-pressed={mode === "shift"} onClick={() => setMode("shift")}>{t("modeShift")}</button>
          </div>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={setExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clearAll}>{t("clear")}</button>
          </div>
        </div>

        {mode === "diff" ? (
          <>
            <label className="cidr-label" htmlFor="time-a">{t("labelA")}</label>
            <input id="time-a" className="cidr-input mono json-input" value={a} onChange={(e) => setA(e.target.value)}
              placeholder="2024-02-28T00:00Z" autoComplete="off" spellCheck={false} />
            {/* Or the same instant from a picker. */}
            {picker("time-a", a, setA, t("labelA"))}
            <label className="cidr-label" htmlFor="time-b">{t("labelB")}</label>
            <input id="time-b" className="cidr-input mono json-input" value={b} onChange={(e) => setB(e.target.value)}
              placeholder="2024-03-01T00:00Z" autoComplete="off" spellCheck={false} />
            {/* Or the same instant from a picker. */}
            {picker("time-b", b, setB, t("labelB"))}
          </>
        ) : (
          <>
            <label className="cidr-label" htmlFor="time-start">{t("labelStart")}</label>
            <input id="time-start" className="cidr-input mono json-input" value={start} onChange={(e) => setStart(e.target.value)}
              placeholder="2026-01-01T00:00Z" autoComplete="off" spellCheck={false} />
            {/* Or the same instant from a picker. */}
            {picker("time-start", start, setStart, t("labelStart"))}
            <label className="cidr-label" htmlFor="time-dur">{t("labelDuration")}</label>
            <input id="time-dur" className="cidr-input mono json-input" value={duration} onChange={(e) => setDuration(e.target.value)}
              placeholder={t("durationPlaceholder")} autoComplete="off" spellCheck={false} />
            <div className="dig-input-actions">
              <button type="button" className="b64-copy" aria-pressed={op === "add"} onClick={() => setOp("add")}>{t("opAdd")}</button>
              <button type="button" className="b64-copy" aria-pressed={op === "subtract"} onClick={() => setOp("subtract")}>{t("opSubtract")}</button>
            </div>
          </>
        )}
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">●</span>
          {t("runsLocally")}
        </p>
      </div>

      {result && !result.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{result.message}</p>
        </div>
      )}

      {result && result.ok && (
        <div className="tmsh-results">
          <section>
            <h3 className="cidr-section-title">{result.data.kind === "diff" ? t("spanTitle") : t("resultTitle")}</h3>
            {result.data.kind === "shift" && (
              <p className="mono" style={{ fontSize: "1.25rem" }}>{result.data.bIso}</p>
            )}
            <p className="mono">{result.data.iso}{result.data.sign < 0 ? ` ${t("backwards")}` : ""}</p>
          </section>
          {/* Share results: under the result, at the start of its own row, before the breakdown. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
          <section>
            <h3 className="cidr-section-title">{t("breakdownTitle")}</h3>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <thead><tr><th>{t("colUnit")}</th><th>{t("colBreakdown")}</th><th>{t("colTotal")}</th></tr></thead>
                <tbody>
                  <tr><td>{t("uWeeks")}</td><td className="mono">{result.data.breakdown.weeks}</td><td className="mono">-</td></tr>
                  <tr><td>{t("uDays")}</td><td className="mono">{result.data.breakdown.days}</td><td className="mono">{Number(result.data.totals.days.toFixed(4))}</td></tr>
                  <tr><td>{t("uHours")}</td><td className="mono">{result.data.breakdown.hours}</td><td className="mono">{Number(result.data.totals.hours.toFixed(4))}</td></tr>
                  <tr><td>{t("uMinutes")}</td><td className="mono">{result.data.breakdown.minutes}</td><td className="mono">{Number(result.data.totals.minutes.toFixed(2))}</td></tr>
                  <tr><td>{t("uSeconds")}</td><td className="mono">{result.data.breakdown.seconds}</td><td className="mono">{result.data.totals.seconds}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
          {result.data.notes.map((n, i) => (<p key={i}>{n}</p>))}
        </div>
      )}
    </div>
  );
}
