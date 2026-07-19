// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/TimeCalculatorTool.tsx — client UI for exact time
// arithmetic: the span between two instants, or an instant ± a duration.
// Calendar units (months/years) are refused with an explanation, by design.
// All compute is local.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { diff, shift, TimeInputError, type TimeAnalysis } from "@/lib/tools/time-calculator";

type Mode = "diff" | "shift";
type Result = { ok: true; data: TimeAnalysis } | { ok: false; message: string };

// D-83 Example samples — verbatim from this tool's golden vectors (v4, v1).
const EX_DIFF = { a: "2024-02-28T00:00Z", b: "2024-03-01T00:00Z" };
const EX_SHIFT = { start: "2026-01-01T00:00Z", duration: "P1DT2H" };

export default function TimeCalculatorTool() {
  const t = useTranslations("tools.time-calculator");
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
        return { ok: true, data: diff(a, b) };
      }
      if (!start.trim() && !duration.trim()) return null;
      return { ok: true, data: shift(start, duration, op) };
    } catch (e) {
      return { ok: false, message: e instanceof TimeInputError ? e.message : t("errGeneric") };
    }
  }, [mode, a, b, start, duration, op, t]);

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
            <h3 className="cidr-h">{result.data.kind === "diff" ? t("spanTitle") : t("resultTitle")}</h3>
            {result.data.kind === "shift" && (
              <p className="mono" style={{ fontSize: "1.25rem" }}>{result.data.bIso}</p>
            )}
            <p className="mono">{result.data.iso}{result.data.sign < 0 ? ` ${t("backwards")}` : ""}</p>
          </section>
          <section>
            <h3 className="cidr-h">{t("breakdownTitle")}</h3>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <thead><tr><th>{t("colUnit")}</th><th>{t("colBreakdown")}</th><th>{t("colTotal")}</th></tr></thead>
                <tbody>
                  <tr><td>{t("uWeeks")}</td><td className="mono">{result.data.breakdown.weeks}</td><td className="mono">—</td></tr>
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
