"use client";

// ============================================================================
// src/components/HttpStatusCodeExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the HTTP status code explainer: paste codes or families, get each
// one decoded - family badge, registered name, documented meaning, and the
// operational notes. Unknown-but-valid codes render the protocol's own
// family-fallback rule as the answer. Local compute; D-83 Example/Clear;
// house CSS classes only. (D-19 comments.)
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { run, type StatusExplainResult } from "@/lib/tools/http-status-code-explainer";

/** Golden-vector-faithful sample: the redirect trio plus the triage trio. */
const EXAMPLE_INPUT = "301 302 307 502 503 504";

export default function HttpStatusCodeExplainerTool() {
  const t = useTranslations("tools.http-status-code-explainer");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<StatusExplainResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Explain the current input (local, synchronous). */
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
        <label className="cidr-label" htmlFor="hsce-input">
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
        id="hsce-input"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        rows={3}
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

      {/* ---- Explanations ---- */}
      {result && (
        <div className="ztc-result">
          {result.families.map((f) => (
            <div className="tmsh-object" key={`fam-${f.family}`}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{f.familyName}</span>
                <span className="tmsh-name">{t("familyLabel")}</span>
              </div>
              <ul className="lbm-facts">
                <li>{f.meaning}</li>
              </ul>
            </div>
          ))}

          {result.codes.map((c) => (
            <div className="tmsh-object" key={c.code}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{c.code}</span>
                <span className="tmsh-name">{c.name}</span>
                <span className="certs-badge mono">{c.familyName}</span>
              </div>
              <ul className="lbm-facts">
                <li>{c.meaning}</li>
                {c.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ))}

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
