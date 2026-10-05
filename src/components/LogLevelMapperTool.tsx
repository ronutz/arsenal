"use client";

// ============================================================================
// src/components/LogLevelMapperTool.tsx
// ----------------------------------------------------------------------------
// THE LOG LEVEL MAPPER (page UI). Pick a logging system and a level (by name
// or by the system's own number); read where it sits on OpenTelemetry's
// SeverityNumber scale and the nearest rung in every other system, exact or
// at a stated distance, with the ties named where a mapping is not one-to-
// one. Below, the whole table: every ladder with its own numbers, words and
// caveat, the chosen row lit.
//
// All answers come from src/lib/tools/log-level-mapper (a table lookup over
// the sources' own ladders); this component only lays them out and words them.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, LADDERS, VECTORS, type LogLevelResult } from "@/lib/tools/log-level-mapper";
import { TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "syslog-warning";

// The vectors offered as presets.
const PRESET_IDS = ["syslog-warning", "syslog-notice", "syslog-emergency", "python-critical", "jul-config", "log4j2-fatal", "windows-critical", "dotnet-trace", "otel-19", "cisco-notifications", "junos-notice"];

/** The page component. */
export default function LogLevelMapperTool() {
  // This tool's words.
  const t = useTranslations("tools.log-level-mapper");
  // The example vector.
  const example = VECTORS.find((v) => v.id === EXAMPLE_ID)!;
  // The system and the level.
  const [system, setSystem] = useState(example.input.system);
  const [level, setLevel] = useState(example.input.level);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The reading.
  const r = useMemo((): LogLevelResult => run({ system, level }), [system, level]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its input.
    setSystem(v.input.system);
    setLevel(v.input.level);
    // Mark it.
    setActive(id);
  };
  // The ladder chosen, for the level buttons.
  const ladder = LADDERS.find((l) => l.key === system);
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The system and the level, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="llm-system">{t("systemLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setLevel(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <div className="tcl-fields">
          {/* The system. */}
          <select id="llm-system" className="tcl-select" value={system} onChange={(e) => { setSystem(e.target.value); setActive(undefined); }}>
            {LADDERS.map((l) => <option key={l.key} value={l.key}>{l.name}</option>)}
          </select>
          {/* The level, typed. */}
          <label className="cidr-label" htmlFor="llm-level">{t("levelLabel")}</label>
          <input id="llm-level" className="cidr-input mono" value={level} onChange={(e) => { setLevel(e.target.value); setActive(undefined); }} placeholder={t("levelPlaceholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
        </div>
        {/* The chosen ladder's rungs as one-tap buttons. */}
        {ladder && (
          <div className="tcl-presets-row" role="group" aria-label={t("rungsLabel")}>
            {ladder.rungs.map((rg) => (
              <button key={rg.name} type="button" className="tcl-chip" aria-pressed={r.chosen?.rung.name === rg.name} onClick={() => { setLevel(rg.name); setActive(undefined); }}>
                {rg.name}{rg.value !== null && rg.value !== undefined ? <span className="tcl-muted"> {String(rg.value)}</span> : null}
              </button>
            ))}
          </div>
        )}
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* Nothing recognised. */}
      {r.error && level.trim() !== "" && <p className="tcl-verdict tcl-verdict-bad" role="status">{t(`error.${r.error}`, { level, system: ladder?.name ?? system })}</p>}

      {/* The reading. */}
      {r.chosen && (
        <div className="jwt-results" aria-live="polite">
          {/* The verdict: the rung and its place on the scale. */}
          <div className={r.chosen.rung.sentinel ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
            <p>
              <span className="tcl-verdict-label">{r.chosen.name}: {r.chosen.rung.name}{r.chosen.rung.value !== null ? ` (${String(r.chosen.rung.value)})` : ""}</span>{" "}
              {r.chosen.rung.sentinel ? t("sentinel") : t("onScale", { n: r.otel!.number, short: r.otel!.short, range: r.otel!.range })}
              {r.chosen.rung.description && <> <span className="tcl-muted">{r.chosen.rung.description}</span></>}
            </p>
          </div>

          {/* The equivalents. */}
          {r.equivalents.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("equivalentsTitle")}</h4>
              <div className="tcl-table-wrap">
                {/* llm-table: level names never break mid-word; on a phone the wrapper scrolls sideways instead. */}
                <table className="tcl-table llm-table">
                  <thead><tr><th scope="col">{t("colSystem")}</th><th scope="col">{t("colLevel")}</th><th scope="col">{t("colOwnNumber")}</th><th scope="col">{t("colMatch")}</th></tr></thead>
                  <tbody>
                    {r.equivalents.map((e) => (
                      <tr key={e.system}>
                        <th scope="row">{e.name}</th>
                        <td><code>{e.rung.name}</code>{e.ties.map((x) => <span key={x.name}> / <code>{x.name}</code></span>)}</td>
                        <td>{e.rung.value === null ? <span className="tcl-muted">{t("noNumber")}</span> : <code>{String(e.rung.value)}</code>}</td>
                        <td>{e.exact ? <span className="tcl-pill tcl-pill-value">{t("exact")}</span> : <span className="tcl-pill tcl-pill-warn">{t("nearest", { n: e.distance })}</span>}{e.ties.length > 0 && <span className="tcl-small tcl-muted"> {t("tie")}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="hmac-build-note">{t("scaleNote")}</p>
            </section>
          )}
        </div>
      )}

      {/* The whole table: every ladder, the chosen rung lit. */}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("laddersTitle")}</h4>
        <div className="tcl-table-wrap">
          {/* llm-ladders: the rungs column keeps room for its words; the wrapper scrolls on a phone. */}
          <table className="tcl-table llm-table llm-ladders">
            <thead><tr><th scope="col">{t("colSystem")}</th><th scope="col">{t("colDirection")}</th><th scope="col">{t("colRungs")}</th></tr></thead>
            <tbody>
              {LADDERS.map((l) => (
                <tr key={l.key}>
                  <th scope="row">{l.name}</th>
                  <td><span className="tcl-small">{t(`direction.${l.direction}`)}</span></td>
                  <td>
                    <span className="tcl-words">
                      {l.rungs.map((rg) => (
                        <span key={rg.name} className={`tcl-word${r.chosen && r.chosen.system === l.key && r.chosen.rung.name === rg.name ? " tcl-word--on" : ""}${rg.sentinel ? " tcl-muted" : ""}`} title={rg.description ?? undefined}>
                          {rg.name}{rg.value !== null && rg.value !== undefined ? <span className="tcl-small tcl-muted"> {String(rg.value)}</span> : null} <span className="tcl-small tcl-muted">→{rg.otel}</span>
                        </span>
                      ))}
                    </span>
                    <div className="tcl-small tcl-muted">{l.caveat}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hmac-build-note">{t("laddersNote")}</p>
      </section>
    </div>
  );
}
