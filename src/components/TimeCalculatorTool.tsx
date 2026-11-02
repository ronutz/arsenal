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
            <label className="cidr-label" htmlFor="time-b">{t("labelB")}</label>
            <input id="time-b" className="cidr-input mono json-input" value={b} onChange={(e) => setB(e.target.value)}
              placeholder="2024-03-01T00:00Z" autoComplete="off" spellCheck={false} />
          </>
        ) : (
          <>
            <label className="cidr-label" htmlFor="time-start">{t("labelStart")}</label>
            <input id="time-start" className="cidr-input mono json-input" value={start} onChange={(e) => setStart(e.target.value)}
              placeholder="2026-01-01T00:00Z" autoComplete="off" spellCheck={false} />
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
