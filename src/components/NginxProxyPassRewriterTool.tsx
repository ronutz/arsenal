"use client";

// ============================================================================
// UI for the NGINX proxy_pass rewriter. The product is the SIDE-BY-SIDE: the
// configuration as written, and the same configuration with the trailing slash
// flipped, so the binary switch is visible instead of described.
// House CSS classes only (verified); D-83 Example/Clear.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { rewriteProxyPass, type ProxyResult } from "@/lib/tools/nginx-proxy-pass-rewriter";

/** Golden-vector-faithful sample: the passthrough form, with its counterpart. */
const EXAMPLE_INPUT = [
  "# No URI part after the host - the prefix is KEPT.",
  "location /app/",
  "proxy_pass http://backend;",
  "",
  "request /app/page",
].join("\n");

export default function NginxProxyPassRewriterTool() {
  const t = useTranslations("tools.nginx-proxy-pass-rewriter");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ProxyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Compute the rewritten path (local, synchronous). */
  function evaluate(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(rewriteProxyPass(trimmed));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="pp-input">
          {t("inputLabel")}
        </label>
        <textarea
          id="pp-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={7}
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
            <h2 className="ztc-section-title">{t("resultHeading")}</h2>
            <p className="tmsh-object-head mono">
              {result.backendUri === null ? t("refused") : result.backendUri}
            </p>
            <p className="ztc-notes">{result.explanation}</p>
          </div>

          {result.counterpart && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("counterpartHeading")}</h2>
              <p className="tmsh-object-head mono">
                {result.counterpart.proxyPass} &rarr;{" "}
                {result.counterpart.backendUri === null ? t("refused") : result.counterpart.backendUri}
              </p>
              <p className="ztc-notes">{result.counterpart.note}</p>
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
