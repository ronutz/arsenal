"use client";

// ============================================================================
// UI for the NGINX proxy_cache decision engine. Two verdicts, deliberately
// separate - STORED and SERVED are different questions - each with the ordered
// rule walk that produced it, plus warnings about the asymmetries that leak
// data between users.
// House CSS classes only (verified); D-83 Example/Clear.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { decideCache, type CacheDecision } from "@/lib/tools/nginx-proxy-cache-decision";

/** Golden-vector-faithful sample: the configuration that leaks. */
const EXAMPLE_INPUT = [
  "# Ignoring Set-Cookie while the key ignores cookies: the classic leak.",
  "proxy_cache zone1;",
  "proxy_cache_valid 200 10m;",
  "proxy_ignore_headers Set-Cookie;",
  "",
  "request GET /account",
  "request_header Cookie: session=abc",
  "",
  "response 200",
  "response_header Set-Cookie: id=1",
].join("\n");

export default function NginxProxyCacheDecisionTool() {
  const t = useTranslations("tools.nginx-proxy-cache-decision");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CacheDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Decide store and serve for the current exchange (local, synchronous). */
  function evaluate(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(decideCache(trimmed));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /** One rule walk, rendered as an ordered list. */
  function walk(steps: { rule: string; passed: boolean; detail: string }[]) {
    return (
      <ol className="ztc-steps">
        {steps.map((s, i) => (
          <li key={i} className="tmsh-object">
            <p className="tmsh-object-head mono">
              {s.passed ? "\u2713" : "\u2717"} {s.rule}
            </p>
            <p className="ztc-notes">{s.detail}</p>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="pc-input">
          {t("inputLabel")}
        </label>
        <textarea
          id="pc-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={12}
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
            <h2 className="ztc-section-title">{t("verdictHeading")}</h2>
            <p className="tmsh-object-head mono">
              {result.stored ? t("storedYes") : t("storedNo")}
            </p>
            <p className="tmsh-object-head mono">
              {result.servedFromCache ? t("servedYes") : t("servedNo")}
            </p>
            <p className="cidr-privacy">{t("keyLabel", { key: result.computedKey })}</p>
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("storeHeading")}</h2>
            {walk(result.storeSteps)}
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("serveHeading")}</h2>
            {walk(result.serveSteps)}
          </div>

          {result.warnings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("warningsHeading")}</h2>
              <ul className="lbm-facts">
                {result.warnings.map((w, i) => (
                  <li key={i} className="ztc-notes">
                    {w}
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
