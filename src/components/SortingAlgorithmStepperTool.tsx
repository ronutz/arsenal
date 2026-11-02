"use client";
// ============================================================================
// src/components/SortingAlgorithmStepperTool.tsx
// ----------------------------------------------------------------------------
// UI for the sorting stepper: numbers textarea + strategy select + D-83
// Example/Clear row. Renders the full step list - array state with the
// focused indices highlighted, the kind badge, and the WHY line - then the
// comparison/write counters and the teaching notes. House classes only.
//
// Share results (2026-11-01): a button above the step list builds a link that
// carries the numbers as typed and the strategy. An arriving link
// (useShareArrival) fills both as the reader would, and the page steps.
//
// PAGE LANGUAGE (02/11/2026): the trace comes from runLocalisable() (every WHY
// line, note and error an EngineText) and is turned into the page's language
// by inPageLanguage(); errors through engineTexts().error. The English page
// reads exactly as before. The engine is imported from compute directly.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { runLocalisable, type SortTrace, type Strategy } from "@/lib/tools/sorting-algorithm-stepper/compute"; // the trace with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole trace in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { SORT_SHARE, encodeSortShare } from "@/lib/tools/sorting-algorithm-stepper/share"; // this tool's share spec: the numbers and the strategy

const EXAMPLE = "5 3 8 1 9 2";
const STRATEGIES: Strategy[] = ["bubble", "selection", "insertion", "merge", "quick"];

export default function SortingAlgorithmStepperTool() {
  const t = useTranslations("tools.sorting-algorithm-stepper");
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language (02/11/2026)
  const [text, setText] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("bubble");
  const [trace, setTrace] = useState<SortTrace | null>(null);
  const [error, setError] = useState<string | null>(null);

  function go(src: string, strat: Strategy) {
    if (!src.trim()) { setTrace(null); setError(null); return; }
    try { setTrace(inPageLanguage(runLocalisable({ text: src, strategy: strat }), tx)); setError(null); } // the trace, in the page's language
    catch (e) { setTrace(null); setError(tx.error(e)); } // the error's sentence in the page's language
  }

  // An arriving share link: the numbers and the strategy are set as the reader would set them, then stepped through.
  useShareArrival(SORT_SHARE, (s) => { setText(s.input); setStrategy(s.strategy); go(s.input, s.strategy); }); // as typed
  // What Share results carries: the numbers and the strategy, once there is a trace (memoised).
  const share = useMemo(() => encodeSortShare({ input: text, strategy }, trace !== null), [text, strategy, trace]); // the encoding

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
          {/* Share results: first in the reading (the step list runs long), at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
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
