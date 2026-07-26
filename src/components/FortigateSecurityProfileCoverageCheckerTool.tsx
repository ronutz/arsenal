"use client";

// ============================================================================
// src/components/FortigateSecurityProfileCoverageCheckerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE SECURITY PROFILE COVERAGE CHECKER.
//
// BLIND is styled distinctly from DEGRADED on purpose. "Attached and doing
// nothing" and "working with a caveat" are different situations that call for
// different action, and flattening them into one warning colour would lose the
// distinction the tool was built to make.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type CoverageResult, type Coverage } from "@/lib/tools/fortigate-security-profile-coverage-checker";

/** D-83: golden-vector-faithful sample. The classic blind configuration —
 *  HTTPS with certificate inspection and payload-reading profiles attached. */
const EXAMPLE = `traffic: https
ssl: certificate
mode: flow
profiles: antivirus, ips, application-control, web-filter`;

function badgeClass(c: Coverage): string {
  return c === "blind"
    ? "certhub-guide-badge certhub-guide-badge--prep"
    : "certhub-guide-badge";
}

export default function FortigateSecurityProfileCoverageCheckerTool() {
  const t = useTranslations("tools.fortigate-security-profile-coverage-checker");
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: CoverageResult | null; error: string | null } => {
    try {
      return { result: run(input).result, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fsp-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fsp-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={6}
          aria-describedby="fsp-privacy"
        />
        <p id="fsp-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {error && <div className="cidr-error" role="alert">{error}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-result">
          <h3 className="cidr-result-title">{t("theChain")}</h3>
          <ul className="cidr-list">
            {result.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "check" && (
        <div className="cidr-result">
          {result.parseWarnings.length > 0 && (
            <ul className="cidr-list">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{w}</strong></li>)}
            </ul>
          )}

          <p className="cidr-result-title">
            {t("policySummary", {
              traffic: result.traffic.toUpperCase(),
              ssl: t(`ssl_${result.ssl}`),
              mode: t(`mode_${result.inspection}`),
            })}
          </p>

          {result.findings.length > 0 && (
            <table className="cidr-table">
              <thead>
                <tr>
                  <th>{t("colProfile")}</th>
                  <th>{t("colCoverage")}</th>
                  <th>{t("colWhy")}</th>
                </tr>
              </thead>
              <tbody>
                {result.findings.map((f, i) => (
                  <tr key={i}>
                    <td className="mono">{f.profile}</td>
                    <td><span className={badgeClass(f.coverage)}>{t(`coverage_${f.coverage}`)}</span></td>
                    <td>{f.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {result.notes.length > 0 && (
            <ul className="cidr-list">
              {result.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
