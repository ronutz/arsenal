"use client";

// ============================================================================
// src/components/F5IrulesPerformanceLinterTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE iRULES PERFORMANCE LINTER. Paste an iRule; it lists documented
// anti-patterns line by line, each with a severity, the offending token, why it
// matters, and the fix. All findings come from the compute layer; this component
// only resolves the per-category and per-severity wording. Local, no network.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { run, type LinterResult, type LintSeverity } from "@/lib/tools/f5-irules-performance-linter";

// D-83 Example — a compact rule that trips several detectors.
const EXAMPLE = `when RULE_INIT {
    set ::maxcpu 60
}
when HTTP_REQUEST {
    if { [matchclass [HTTP::uri] starts_with $::blocked] } {
        set n [expr $::maxcpu * 2]
    }
    if { [regexp {^/api/} [HTTP::path]] } { pool api_pool }
}`;

// category id -> i18n key stems
const CAT: Record<string, { title: string; detail: string; fix: string }> = {
  "global-variable": { title: "catGlobalTitle", detail: "catGlobalDetail", fix: "catGlobalFix" },
  "expr-no-braces": { title: "catExprTitle", detail: "catExprDetail", fix: "catExprFix" },
  matchclass: { title: "catMatchclassTitle", detail: "catMatchclassDetail", fix: "catMatchclassFix" },
  regex: { title: "catRegexTitle", detail: "catRegexDetail", fix: "catRegexFix" },
};
const SEV: Record<LintSeverity, string> = { high: "sevHigh", warning: "sevWarning", info: "sevInfo" };

export default function F5IrulesPerformanceLinterTool() {
  const t = useTranslations("tools.f5-irules-performance-linter");
  const [irule, setIrule] = useState("");
  const [result, setResult] = useState<LinterResult | null>(null);
  const reqRef = useRef(0);

  const recompute = useCallback((src: string) => {
    if (src.trim() === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = run({ irule: src });
    if (reqRef.current === myReq) setResult(r);
  }, []);

  const fillExample = () => {
    setIrule(EXAMPLE);
    recompute(EXAMPLE);
  };
  const clearAll = () => {
    setIrule("");
    setResult(null);
  };

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="irl-src">
            {t("irLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={fillExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearAll}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="irl-src"
          className="cidr-input mono json-input"
          value={irule}
          onChange={(e) => {
            setIrule(e.target.value);
            recompute(e.target.value);
          }}
          placeholder={t("irPlaceholder")}
          rows={10}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {result && (
        <div className="jwt-results">
          {/* Summary */}
          <p className="hmac-build-note">
            {result.findings.length === 0 ? (
              t("summaryClean")
            ) : (
              <>
                {t("summaryFound")}{" "}
                {result.counts.high > 0 && (
                  <span className="irl-sev irl-sev-high">
                    {result.counts.high} {t("sevHigh")}
                  </span>
                )}
                {result.counts.warning > 0 && (
                  <span className="irl-sev irl-sev-warning">
                    {result.counts.warning} {t("sevWarning")}
                  </span>
                )}
                {result.counts.info > 0 && (
                  <span className="irl-sev irl-sev-info">
                    {result.counts.info} {t("sevInfo")}
                  </span>
                )}
              </>
            )}
          </p>

          {/* Findings */}
          {result.findings.map((f, i) => {
            const c = CAT[f.category];
            return (
              <section className="jwt-panel" key={i}>
                <h4 className="jwt-panel-title">
                  <span className={`irl-sev irl-sev-${f.severity}`}>{t(SEV[f.severity])}</span>{" "}
                  {c ? t(c.title) : f.category}
                  <span className="irl-line"> · {t("lineLabel")} {f.line}</span>
                </h4>
                <div className="hash-out">
                  <pre className="jwt-json">
                    <code>{f.snippet}</code>
                  </pre>
                </div>
                {c && <p className="hmac-build-note">{t(c.detail)}</p>}
                {c && (
                  <p className="hmac-build-note">
                    <strong>{t("fixLabel")}:</strong> {t(c.fix)}
                  </p>
                )}
              </section>
            );
          })}

          {/* Profiling reminder + companion */}
          <p className="hmac-build-note">
            {t("profileNote")}{" "}
            <Link href="/tools/f5-irules-runtime-calculator" className="mb-titlebar-devfun">
              {t("profileLink")}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
