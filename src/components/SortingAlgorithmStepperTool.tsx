"use client";
// ============================================================================
// src/components/SortingAlgorithmStepperTool.tsx
// ----------------------------------------------------------------------------
// UI for the sorting stepper: numbers textarea + strategy select + D-83
// Example/Clear row. Renders the full step list - array state with the
// focused indices highlighted, the kind badge, and the WHY line - then the
// comparison/write counters and the teaching notes. House classes only.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { run, type SortTrace, type Strategy } from "@/lib/tools/sorting-algorithm-stepper";

const EXAMPLE = "5 3 8 1 9 2";
const STRATEGIES: Strategy[] = ["bubble", "selection", "insertion", "merge", "quick"];

export default function SortingAlgorithmStepperTool() {
  const t = useTranslations("tools.sorting-algorithm-stepper");
  const [text, setText] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("bubble");
  const [trace, setTrace] = useState<SortTrace | null>(null);
  const [error, setError] = useState<string | null>(null);

  function go(src: string, strat: Strategy) {
    if (!src.trim()) { setTrace(null); setError(null); return; }
    try { setTrace(run({ text: src, strategy: strat })); setError(null); }
    catch (e) { setTrace(null); setError(e instanceof Error ? e.message : String(e)); }
  }

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="sas-input">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          {/* D-83: Example/Clear affordance, golden-vector-faithful sample. */}
          <button type="button" className="b64-copy" onClick={() => { setText(EXAMPLE); go(EXAMPLE, strategy); }}>
            {t("example")}
          </button>
          <button type="button" className="b64-copy" onClick={() => { setText(""); setTrace(null); setError(null); }}>
            {t("clear")}
          </button>
        </div>
      </div>
      <textarea
        id="sas-input"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        rows={2}
        placeholder={t("placeholder")}
        value={text}
        onChange={(e) => { setText(e.target.value); go(e.target.value, strategy); }}
      />
      <label className="cidr-label" htmlFor="sas-strategy">{t("strategyLabel")}</label>
      <select
        id="sas-strategy"
        className="lbm-select"
        value={strategy}
        onChange={(e) => { const st = e.target.value as Strategy; setStrategy(st); go(text, st); }}
      >
        {STRATEGIES.map((s) => (
          <option key={s} value={s}>{t(`strategy_${s}`)}</option>
        ))}
      </select>

      {error && (
        <div className="json-error-box">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message mono">{error}</p>
        </div>
      )}
      {!trace && !error && <p className="ztc-empty">{t("emptyState")}</p>}

      {trace && (
        <div className="ztc-result">
          {/* Step list: state + focus highlight + kind + why. */}
          {trace.steps.map((s, i) => (
            <div key={i} className="tmsh-object">
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{i + 1}. {t(`kind_${s.kind}`)}</span>
                <span className="tmsh-object-name mono">
                  {s.state.map((v, idx) => (
                    <span key={idx} className={s.focus.includes(idx) ? "sas-focus" : undefined}>
                      {idx > 0 ? " " : ""}{v}
                    </span>
                  ))}
                </span>
              </div>
              <p className="lbm-facts">{s.why}</p>
            </div>
          ))}
          <div className="tmsh-object">
            <div className="tmsh-object-head">
              <span className="tmsh-type-badge">{t("countersTitle")}</span>
              <span className="tmsh-object-name mono">
                {t("counters", { comparisons: trace.comparisons, writes: trace.writes, n: trace.input.length })}
              </span>
            </div>
            <p className="lbm-facts mono">{trace.sorted.join(" ")}</p>
          </div>
          <div className="ztc-notes">
            {trace.notes.map((n, i) => (<p key={i} className="lbm-facts">{n}</p>))}
          </div>
        </div>
      )}
    </div>
  );
}
