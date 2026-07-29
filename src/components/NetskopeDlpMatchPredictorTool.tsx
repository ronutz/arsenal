"use client";

// ============================================================================
// UI for the DLP match predictor. The three stages are shown as three separate
// numbers - candidates, matches, threshold - because a rule that did not fire
// failed at exactly one of them, and collapsing them into a verdict throws
// away the only diagnostic information there is.
// House CSS classes only (verified); D-83 Example/Clear.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  predictMatches,
  type DlpResult,
  type IdentifierKind,
} from "@/lib/tools/netskope-dlp-match-predictor";

/** Golden-vector-faithful sample: one valid published test card, one that fails Luhn. */
const EXAMPLE = "Cards 4111111111111111 and 4111111111111112 were submitted with order 1234567812345678.";

export default function NetskopeDlpMatchPredictorTool() {
  const t = useTranslations("tools.netskope-dlp-match-predictor");
  const [text, setText] = useState("");
  const [kind, setKind] = useState<IdentifierKind>("payment-card");
  const [threshold, setThreshold] = useState("1");
  const [result, setResult] = useState<DlpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Evaluate the current text against the current identifier and threshold. */
  function evaluate(nextText?: string, nextKind?: IdentifierKind, nextThreshold?: string) {
    const body = nextText ?? text;
    if (!body.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(
        predictMatches(body, nextKind ?? kind, Number(nextThreshold ?? threshold)),
      );
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="dlp-kind">
          {t("kindLabel")}
        </label>
        <select
          id="dlp-kind"
          className="cidr-input mono"
          value={kind}
          onChange={(e) => {
            const v = e.target.value as IdentifierKind;
            setKind(v);
            evaluate(undefined, v);
          }}
        >
          <option value="payment-card">{t("kindCard")}</option>
          <option value="cpf">{t("kindCpf")}</option>
          <option value="cnpj">{t("kindCnpj")}</option>
        </select>

        <label className="cidr-label" htmlFor="dlp-threshold">
          {t("thresholdLabel")}
        </label>
        <input
          id="dlp-threshold"
          className="cidr-input mono"
          spellCheck={false}
          value={threshold}
          onChange={(e) => {
            setThreshold(e.target.value);
            evaluate(undefined, undefined, e.target.value);
          }}
        />

        <label className="cidr-label" htmlFor="dlp-text">
          {t("textLabel")}
        </label>
        <textarea
          id="dlp-text"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={6}
          spellCheck={false}
          value={text}
          placeholder={t("placeholder")}
          onChange={(e) => {
            setText(e.target.value);
            evaluate(e.target.value);
          }}
        />
        <div className="dig-input-head">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setText(EXAMPLE);
              setKind("payment-card");
              setThreshold("1");
              evaluate(EXAMPLE, "payment-card", "1");
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setText("");
              setResult(null);
              setError(null);
            }}
          >
            {t("clear")}
          </button>
        </div>
        <p className="cidr-privacy">{t("privacy")}</p>
      </div>

      {error && (
        <div className="json-error-box">
          <p className="json-error-headline">{t("errorHeadline")}</p>
          <p className="json-error-message">{error}</p>
        </div>
      )}

      {result && (
        <>
          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("verdictHeading")}</h2>
            <p className="tmsh-object-head mono">
              {result.fires ? t("fires") : t("doesNotFire")}
            </p>
            <p className="ztc-notes">{result.explanation}</p>
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("stagesHeading")}</h2>
            <ul className="lbm-facts">
              <li className="ztc-notes">
                {t("stageCandidates", { count: result.candidates.length })}
              </li>
              <li className="ztc-notes">{t("stageMatches", { count: result.matchCount })}</li>
              <li className="ztc-notes">{t("stageThreshold", { count: result.threshold })}</li>
            </ul>
          </div>

          {result.candidates.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("candidatesHeading")}</h2>
              <ol className="ztc-steps">
                {result.candidates.map((c, i) => (
                  <li key={i} className="tmsh-object">
                    <p className="tmsh-object-head mono">
                      {c.valid ? "\u2713" : "\u2717"} {c.raw}
                    </p>
                    <p className="ztc-notes">{c.reason}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.findings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("findingsHeading")}</h2>
              <ul className="lbm-facts">
                {result.findings.map((f, i) => (
                  <li key={i} className="ztc-notes">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
