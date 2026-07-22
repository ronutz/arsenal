"use client";

// ============================================================================
// src/components/NetskopeSteeringDecisionExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the Netskope steering decision explainer: paste the compact spec,
// get the verdict banner, the ledger of documented checks, and the standing
// notes (including the honest no-published-precedence note). Local compute;
// D-83 Example/Clear; house CSS classes only. (D-19 comments.)
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { run, type SteeringDecision } from "@/lib/tools/netskope-steering-decision-explainer";

/** Golden-vector-faithful sample: Fail Close rescue via a domain exception. */
const EXAMPLE_INPUT = `mode: web
tunnel: down
fail-close: on
flow: web login.example.com
exception: domain login.example.com
flow-matches: domain`;

export default function NetskopeSteeringDecisionExplainerTool() {
  const t = useTranslations("tools.netskope-steering-decision-explainer");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SteeringDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Explain the current spec (local, synchronous). */
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

  return (
    <div>
      {/* ---- Input head with Example / Clear (D-83) ---- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="nsde-input">
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
        id="nsde-input"
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

      {/* ---- Errors ---- */}
      {error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{error}</p>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!result && !error && <p className="ztc-empty">{t("emptyState")}</p>}

      {/* ---- Decision ---- */}
      {result && (
        <div className="ztc-result">
          <div className="tmsh-object">
            <div className="tmsh-object-head">
              <span className="tmsh-type-badge">{result.verdict}</span>
              <span className="tmsh-name">{t("modeLabel", { mode: result.effectiveMode })}</span>
            </div>
            <ul className="lbm-facts">
              <li>{result.headline}</li>
            </ul>
          </div>

          <div className="ztc-notes">
            <p className="ztc-section-title">{t("ledgerTitle")}</p>
            <ul className="lbm-facts">
              {result.ledger.map((s, i) => (
                <li key={i}>
                  <strong>{s.check}:</strong> {s.outcome}
                </li>
              ))}
            </ul>
          </div>

          {result.notes.length > 0 && (
            <div className="ztc-notes">
              <p className="ztc-section-title">{t("notesTitle")}</p>
              <ul className="lbm-facts">
                {result.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
