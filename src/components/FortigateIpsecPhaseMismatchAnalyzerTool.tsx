"use client";

// ============================================================================
// src/components/FortigateIpsecPhaseMismatchAnalyzerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE IPSEC PHASE MISMATCH ANALYZER.
//
// The verdict leads, because "phase 1 would fail" and "phase 2 would fail"
// send an engineer down completely different diagnostic paths, and that single
// sentence is worth more than the field-by-field comparison beneath it.
//
// Fatal and informational issues are visually separated. An analyser that
// presents "your lifetimes differ" with the same weight as "no common
// encryption" trains people to ignore it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type IpsecResult } from "@/lib/tools/fortigate-ipsec-phase-mismatch-analyzer";

/** D-83: golden-vector-faithful sample. PFS on one side only — a real phase 2
 *  fault whose log message does not usually mention PFS. */
const EXAMPLE = `peer: name=SiteA
phase1: version=ikev2, encryption=aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=86400
phase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.1.0.0/16, dst=10.2.0.0/16

peer: name=SiteB
phase1: version=ikev2, encryption=aes128 aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=28800
phase2: encryption=aes256, hash=sha256, pfs=disable, lifetime=43200, src=10.2.0.0/16, dst=10.1.0.0/16`;

export default function FortigateIpsecPhaseMismatchAnalyzerTool() {
  const t = useTranslations("tools.fortigate-ipsec-phase-mismatch-analyzer");
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: IpsecResult | null; error: string | null } => {
    try {
      return { result: run(input).result, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  const fatal = result?.issues.filter((i) => i.severity === "fatal") ?? [];
  const info = result?.issues.filter((i) => i.severity === "info") ?? [];

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fip-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fip-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={10}
          aria-describedby="fip-privacy"
        />
        <p id="fip-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {error && <div className="cidr-error" role="alert">{error}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-result">
          <h3 className="cidr-result-title">{t("howItWorks")}</h3>
          <ul className="cidr-list">
            {result.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "analyze" && (
        <div className="cidr-result">
          {result.parseWarnings.length > 0 && (
            <ul className="cidr-list">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{w}</strong></li>)}
            </ul>
          )}

          {/* The verdict leads: which phase fails is the whole diagnosis. */}
          {result.verdict && <p className="cidr-result-title">{result.verdict}</p>}

          {fatal.length > 0 && (
            <>
              <h3 className="cidr-result-title">{t("blocking")}</h3>
              <table className="cidr-table">
                <thead>
                  <tr>
                    <th>{t("colPhase")}</th>
                    <th>{t("colField")}</th>
                    <th>{t("colDetail")}</th>
                  </tr>
                </thead>
                <tbody>
                  {fatal.map((i, n) => (
                    <tr key={n}>
                      <td className="mono">{i.phase === "phase1" ? t("phase1") : t("phase2")}</td>
                      <td className="mono">{i.field}</td>
                      <td>{i.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {info.length > 0 && (
            <>
              {/* Kept visually separate: presenting "lifetimes differ" with the
                  same weight as "no common encryption" trains people to ignore
                  the whole output. */}
              <h3 className="cidr-result-title">{t("notFaults")}</h3>
              <ul className="cidr-list">
                {info.map((i, n) => <li key={n}>{i.detail}</li>)}
              </ul>
            </>
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
