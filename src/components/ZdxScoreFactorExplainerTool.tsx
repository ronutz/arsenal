"use client";

// ============================================================================
// src/components/ZdxScoreFactorExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the ZDX score factor explainer. Paste metric lines in the teaching
// grammar (<metric> = <value>) and read the documented explanation back:
// each metric's probe-family badge and documented meaning, the score
// classified against the documented Poor band, the web-versus-path
// diagnostic when both families are present, and the honesty calibrations
// (unpublished formula, telemetry delay, aggregate variance). All compute
// is local (D-19 comments throughout; house CSS classes; D-83
// Example/Clear).
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { run, type ExplainResult, type ProbeFamily } from "@/lib/tools/zdx-score-factor-explainer";

/** Golden-vector-faithful sample: a Poor score plus both probe families. */
const EXAMPLE_INPUT = [
  "# <metric> = <value>   (score 1-100; times in ms; percentages 0-100)",
  "score = 28",
  "pft = 850",
  "dns = 120",
  "path-loss = 4",
].join("\n");

export default function ZdxScoreFactorExplainerTool() {
  const t = useTranslations("tools.zdx-score-factor-explainer");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Run the explainer over the current input (local, synchronous). */
  function explain(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(run(trimmed));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /** Localized label for a probe family. */
  function familyLabel(f: ProbeFamily): string {
    if (f === "web") return t("familyWeb");
    if (f === "cloudpath") return t("familyCloudpath");
    return t("familyComposite");
  }

  return (
    <div>
      {/* ---- Input: header row with Example / Clear (D-83), then the paste box ---- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="zdxfe-input">
          {t("inputLabel")}
        </label>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(EXAMPLE_INPUT);
              explain(EXAMPLE_INPUT);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput("");
              setResult(null);
              setError(null);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>
      <textarea
        id="zdxfe-input"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        rows={8}
        spellCheck={false}
        value={input}
        placeholder={t("placeholder")}
        onChange={(e) => {
          setInput(e.target.value);
          explain(e.target.value);
        }}
      />

      {/* ---- Errors: helpful, line-anchored ---- */}
      {error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{error}</p>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!result && !error && <p className="ztc-empty">{t("emptyState")}</p>}

      {/* ---- The reading ---- */}
      {result && (
        <div className="ztc-result">
          {/* Per-metric reading cards: family badge + "key = value" + documented lines */}
          <p className="persist-heading">{t("readingsTitle")}</p>
          {result.readings.map((r) => (
            <div className="tmsh-object" key={r.key}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{familyLabel(r.family)}</span>
                <span className="tmsh-name">
                  {r.key} = {r.value}
                </span>
              </div>
              <ul className="lbm-facts">
                {r.lines.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* Diagnostic split - only when both probe families are present */}
          {result.diagnostic.length > 0 && (
            <>
              <p className="persist-heading">{t("diagnosticTitle")}</p>
              <ul className="lbm-facts">
                {result.diagnostic.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}

          {/* Standing notes: cadence, unpublished-formula honesty, calibrations */}
          <div className="ztc-notes">
            <p className="ztc-section-title">{t("notesTitle")}</p>
            <ul className="lbm-facts">
              {result.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
