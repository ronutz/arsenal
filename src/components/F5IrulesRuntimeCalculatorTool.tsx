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
//
// Share results (2026-10-27): under the Cycles/Sec line, a button builds a
// link that carries the four fields as typed (src/lib/tools/
// f5-irules-runtime-calculator/share.ts); an arriving link fills them as
// typing would, computes the tables and leaves the address.
//
// PAGE LANGUAGE (2026-11-02, batch H5): the caveat notes are looked up in the
// pack by their key in the engine's NOTES (engine.note.<key>), else shown as
// the engine writes them; the tables stay as the DevCentral spreadsheet lays
// them out.
//
// UP AND DOWN ARROWS (03/11/2026, PRIME: values set "through the click of a
// mouse (or press of the touchscreen)"): the clock (one MHz a step; a typed
// fraction such as 2133.48 moves to the next whole MHz, as a browser's number
// field does) and the core count (whole, one a step) have a decrease and an
// increase button beside them, and step from Arrow Up / Down and Page Up /
// Down too; both start at 1 (the engine takes any number, and a clock or a
// core count below 1 computes nothing). The Cycles/Sec override has none: a
// figure in the billions, read off a platform, does not move usefully by one.
// ============================================================================

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { run, NOTES, type RuntimeCalcResult, type EventRow } from "@/lib/tools/f5-irules-runtime-calculator";
import { engineTexts } from "@/lib/tools/engine-text"; // engine texts in the page's language (2026-11-02)

/** The NOTES key of a note the engine returned (its own constant, so a reworded note keeps its key), or null. */
const noteKey = (n: string): string | null => (Object.entries(NOTES).find(([, v]) => v === n)?.[0] ?? null); // by the engine's constant
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { IRULES_RUNTIME_CALCULATOR_SHARE } from "@/lib/tools/f5-irules-runtime-calculator/share"; // this tool's share spec: the four fields as typed
// Up and down arrows for the clock and the core count (03/11/2026).
import { StepperField, stepperKeyDown } from "@/components/NumberStepper";

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

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
  const tx = engineTexts(t); // the engine's notes in the page's language (2026-11-02)
  // The page's locale, for numbers in its own format (27/10/2026: Cycles/Sec showed en-US separators on pt-BR).
  const locale = useLocale();

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
  // The clock set as its field's onChange sets it (typed or stepped): the text kept, the tables recomputed.
  const setClock = (v: string) => {
    // The field shows it.
    setClockMhz(v);
    // The tables follow.
    recompute(timingOutput, v, cores, override);
  };
  // The core count set the same way.
  const setCoreCount = (v: string) => {
    // The field shows it.
    setCores(v);
    // The tables follow.
    recompute(timingOutput, clockMhz, v, override);
  };
  const clearAll = () => {
    setTimingOutput("");
    setClockMhz("");
    setCores("");
    setOverride("");
    setResult(null);
  };

  // An arriving share link (2026-10-27): the four fields fill as typing would, then the tables are computed.
  useShareArrival(IRULES_RUNTIME_CALCULATOR_SHARE, (s) => { setTimingOutput(s.input); setClockMhz(s.clock); setCores(s.cores); setOverride(s.override); recompute(s.input, s.clock, s.cores, s.override); }); // the link's values
  // What Share results may carry: the four fields as typed, while the tables show (memoised).
  const share = useMemo<ShareEncoding>(() => (result && result.parsedCount > 0 ? IRULES_RUNTIME_CALCULATOR_SHARE.encode({ input: timingOutput, clock: clockMhz, cores, override }) : NOTHING), [result, timingOutput, clockMhz, cores, override]); // the encoding

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
        {/* Up and down arrows: one MHz a press, on whole MHz (a typed fraction moves to the next whole one). */}
        <StepperField value={clockMhz} onValue={setClock} min={1} label={t("clockLabel")} inputId="irt-clock">
          <input
            id="irt-clock"
            className="cidr-input mono"
            type="text"
            inputMode="decimal"
            value={clockMhz}
            // Typed: the same setter as the arrows.
            onChange={(e) => setClock(e.target.value)}
            // Arrow Up and Down (Page Up and Down: ten) step the clock from the keyboard.
            onKeyDown={stepperKeyDown({ value: clockMhz, onValue: setClock, min: 1 })}
            placeholder="2133.48"
            autoComplete="off"
          />
        </StepperField>
      </div>
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="irt-cores">
          {t("coresLabel")}
        </label>
        {/* Up and down arrows: one core a press. */}
        <StepperField value={cores} onValue={setCoreCount} min={1} integer label={t("coresLabel")} inputId="irt-cores">
          <input
            id="irt-cores"
            className="cidr-input mono"
            type="text"
            inputMode="numeric"
            value={cores}
            // Typed: the same setter as the arrows.
            onChange={(e) => setCoreCount(e.target.value)}
            // Arrow Up and Down (Page Up and Down: ten) step the count from the keyboard.
            onKeyDown={stepperKeyDown({ value: cores, onValue: setCoreCount, min: 1, integer: true })}
            placeholder="2"
            autoComplete="off"
          />
        </StepperField>
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
                <span className="mono">{result.cyclesPerSec.toLocaleString(locale)}</span>{" "}
                (
                {result.cyclesPerSecSource === "override"
                  ? t("sourceOverride")
                  : t("sourceCoresClock")}
                )
              </p>
              {/* Share results (2026-10-27): under the Cycles/Sec line, before the tables it shares, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
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
                {/* The note in the page's language (engine.note.<key>, 2026-11-02), else as the engine wrote it. */}
                {noteKey(n) ? tx.key(`note.${noteKey(n)}`, n) : n}
              </p>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
