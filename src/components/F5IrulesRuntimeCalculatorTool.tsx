"use client";

// ============================================================================
// src/components/F5IrulesRuntimeCalculatorTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE iRULES RUNTIME CALCULATOR. Paste the timing statistics from
// `tmsh show ltm rule <name> field-fmt`, give the TMM clock speed and core
// count, and it renders the four tables of DevCentral's Runtime Calculator
// spreadsheet, each with a best / typical / worst (min / avg / max) column:
// cycles, microseconds, % CPU per request, and maximum requests per second.
// All local arithmetic; every number is rendered from the compute result.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type RuntimeCalcResult, type EventRow } from "@/lib/tools/f5-irules-runtime-calculator";

// D-83 Example — a two-event field-fmt sample (parser + K/M suffix expansion).
const EXAMPLE_TIMING = `ltm rule-event myrule:HTTP_REQUEST {
    aborts 0
    avg-cycles 15.8K
    event-type HTTP_REQUEST
    failures 0
    max-cycles 4.1M
    min-cycles 15.8K
    name myrule
    priority 500
    total-executions 10.0K
}
ltm rule-event myrule:HTTP_RESPONSE {
    aborts 0
    avg-cycles 43.0K
    event-type HTTP_RESPONSE
    failures 0
    max-cycles 853.9K
    min-cycles 6.5K
    name myrule
    priority 500
    total-executions 10.0K
}`;
const EXAMPLE_CLOCK = "3400.606";
const EXAMPLE_CORES = "2";

// Column layout for the monospace tables.
const W_EVENT = 18;
const W_REQ = 9;
const W_VAL = 14;

function pad(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str + " " : str + " ".repeat(w - str.length);
}

export default function F5IrulesRuntimeCalculatorTool() {
  const t = useTranslations("tools.f5-irules-runtime-calculator");

  const [timingOutput, setTimingOutput] = useState("");
  const [clockMhz, setClockMhz] = useState("");
  const [cores, setCores] = useState("");
  const [override, setOverride] = useState("");
  const [result, setResult] = useState<RuntimeCalcResult | null>(null);
  const reqRef = useRef(0);

  const recompute = useCallback((timing: string, clock: string, coreCount: string, ov: string) => {
    if (timing.trim() === "" && clock.trim() === "" && coreCount.trim() === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = run({
      timingOutput: timing,
      clockMhz: parseFloat(clock) || 0,
      cores: parseInt(coreCount, 10) || 0,
      cyclesPerSecOverride: ov.trim() === "" ? null : parseFloat(ov) || null,
    });
    if (reqRef.current === myReq) setResult(r);
  }, []);

  const fillExample = () => {
    setTimingOutput(EXAMPLE_TIMING);
    setClockMhz(EXAMPLE_CLOCK);
    setCores(EXAMPLE_CORES);
    setOverride("");
    recompute(EXAMPLE_TIMING, EXAMPLE_CLOCK, EXAMPLE_CORES, "");
  };
  const clearAll = () => {
    setTimingOutput("");
    setClockMhz("");
    setCores("");
    setOverride("");
    setResult(null);
  };

  // Render one table: header + a row per event + the Total row.
  const renderTable = (
    title: string,
    rows: EventRow[],
    total: EventRow,
    pick: (r: EventRow) => [number, number, number],
  ) => {
    const line = (r: EventRow) => {
      const [mn, av, mx] = pick(r);
      return (
        pad(r.event, W_EVENT) +
        pad(r.executions, W_REQ) +
        pad(mn, W_VAL) +
        pad(av, W_VAL) +
        pad(mx, W_VAL)
      );
    };
    const header =
      pad(t("colEvent"), W_EVENT) +
      pad(t("colReq"), W_REQ) +
      pad(t("colMin"), W_VAL) +
      pad(t("colAvg"), W_VAL) +
      pad(t("colMax"), W_VAL);
    const body = [...rows.map(line), line(total)].join("\n");
    return (
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{title}</h4>
        <div className="hash-out">
          <pre className="jwt-json">
            <code>{header + "\n" + body}</code>
          </pre>
        </div>
      </section>
    );
  };

  return (
    <div className="cidr-tool jwt-tool">
      {/* Downloadable branded spreadsheet edition */}
      <div className="cidr-input-row">
        <p className="hmac-build-note">
          {t("downloadNote")}{" "}
          <a href="/downloads/iRules-Runtime-Calculator-ronutz.xlsx" download className="b64-copy">
            {t("downloadLabel")}
          </a>
        </p>
      </div>

      {/* Timing output */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="irt-timing">
            {t("timingLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={fillExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearAll}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="irt-timing"
          className="cidr-input mono json-input"
          value={timingOutput}
          onChange={(e) => {
            setTimingOutput(e.target.value);
            recompute(e.target.value, clockMhz, cores, override);
          }}
          placeholder={t("timingPlaceholder")}
          rows={7}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {/* Clock + cores */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="irt-clock">
          {t("clockLabel")}
        </label>
        <input
          id="irt-clock"
          className="cidr-input mono"
          type="text"
          inputMode="decimal"
          value={clockMhz}
          onChange={(e) => {
            setClockMhz(e.target.value);
            recompute(timingOutput, e.target.value, cores, override);
          }}
          placeholder="2133.48"
          autoComplete="off"
        />
      </div>
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="irt-cores">
          {t("coresLabel")}
        </label>
        <input
          id="irt-cores"
          className="cidr-input mono"
          type="text"
          inputMode="numeric"
          value={cores}
          onChange={(e) => {
            setCores(e.target.value);
            recompute(timingOutput, clockMhz, e.target.value, override);
          }}
          placeholder="2"
          autoComplete="off"
        />
      </div>
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="irt-override">
          {t("overrideLabel")}
        </label>
        <input
          id="irt-override"
          className="cidr-input mono"
          type="text"
          inputMode="numeric"
          value={override}
          onChange={(e) => {
            setOverride(e.target.value);
            recompute(timingOutput, clockMhz, cores, e.target.value);
          }}
          placeholder={t("overridePlaceholder")}
          autoComplete="off"
          aria-describedby="irt-override-hint"
        />
        <p id="irt-override-hint" className="hmac-build-note">
          {t("overrideHint")}
        </p>
      </div>

      {result && (
        <div className="jwt-results">
          {result.parsedCount > 0 && (
            <>
              <p className="hmac-build-note">
                {t("cyclesPerSecLabel")}:{" "}
                <span className="mono">{result.cyclesPerSec.toLocaleString("en-US")}</span>{" "}
                (
                {result.cyclesPerSecSource === "override"
                  ? t("sourceOverride")
                  : t("sourceCoresClock")}
                )
              </p>
              {renderTable(t("tableCycles"), result.events, result.total, (r) => [
                r.cyclesMin,
                r.cyclesAvg,
                r.cyclesMax,
              ])}
              {renderTable(t("tableUs"), result.events, result.total, (r) => [
                r.usMin,
                r.usAvg,
                r.usMax,
              ])}
              {renderTable(t("tableCpu"), result.events, result.total, (r) => [
                r.cpuPctMin,
                r.cpuPctAvg,
                r.cpuPctMax,
              ])}
              {renderTable(t("tableReq"), result.events, result.total, (r) => [
                r.reqAtMin,
                r.reqAtAvg,
                r.reqAtMax,
              ])}
            </>
          )}

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
            {result.notes.map((n, i) => (
              <p className="hmac-build-note" key={i}>
                {n}
              </p>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
