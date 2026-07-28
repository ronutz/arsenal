"use client";

// ============================================================================
// src/components/NginxLocationMatcherTool.tsx
// ----------------------------------------------------------------------------
// UI for the NGINX location matcher. Paste location blocks and a request URI;
// read back which block wins AND the five-step walk that got there. The walk
// is the product: the answer alone does not teach that reading a config top to
// bottom misleads you about the outcome.
// House CSS classes only (verified against the stylesheet); D-83 Example/Clear.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { matchLocation, type NginxMatchReport } from "@/lib/tools/nginx-location-matcher";

/** Golden-vector-faithful sample: the regex beats the longer prefix. */
const EXAMPLE_INPUT = [
  "# The classic surprise: /images/ loses to the extension regex below it.",
  "location / {",
  "location /images/ {",
  "location ^~ /static/ {",
  "location = /favicon.ico {",
  "location ~ \\.(gif|jpg|png)$ {",
  "location ~* \\.php$ {",
  "",
  "request /images/logo.gif",
].join("\n");

export default function NginxLocationMatcherTool() {
  const t = useTranslations("tools.nginx-location-matcher");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<NginxMatchReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Match the current config against its request line (local, synchronous). */
  function evaluate(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(matchLocation(trimmed));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /** Localised label for one stage of the documented algorithm. */
  function stageLabel(stage: string): string {
    if (stage === "exact") return t("stageExact");
    if (stage === "prefix-scan") return t("stagePrefix");
    if (stage === "prefix-priority") return t("stagePriority");
    if (stage === "regex-scan") return t("stageRegex");
    return t("stageFallback");
  }

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="ngx-config">
          {t("inputLabel")}
        </label>
        <textarea
          id="ngx-config"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={11}
          spellCheck={false}
          value={input}
          placeholder={t("placeholder")}
          onChange={(e) => {
            setInput(e.target.value);
            evaluate(e.target.value);
          }}
        />
        <div className="dig-input-head">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setInput(EXAMPLE_INPUT);
              evaluate(EXAMPLE_INPUT);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setInput("");
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
          <p className="json-error-headline">{t("parseErrorHeadline")}</p>
          <p className="json-error-message">{error}</p>
        </div>
      )}

      {result && (
        <>
          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("winnerHeading")}</h2>
            <p className="tmsh-object-head mono">
              {result.winner ? result.winner.raw : t("noMatch")}
            </p>
            <p className="cidr-privacy">{t("requested", { uri: result.uri })}</p>
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("walkHeading")}</h2>
            <ol className="ztc-steps">
              {result.steps.map((step, i) => (
                <li key={i} className="tmsh-object">
                  <p className="tmsh-object-head mono">
                    {stageLabel(step.stage)}
                    {step.decisive ? ` — ${t("decisive")}` : ""}
                  </p>
                  <p className="ztc-notes">{step.reason}</p>
                </li>
              ))}
            </ol>
          </div>

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
