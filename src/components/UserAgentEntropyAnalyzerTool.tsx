// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// UserAgentEntropyAnalyzerTool — decode a pasted User-Agent string and explain
// its fingerprinting surface + the Client Hints migration. Decode/explain only.
// ============================================================================
"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { analyzeUa, UaInputError, type UaAnalysis } from "@/lib/tools/user-agent-entropy-analyzer";

type Result = { ok: true; data: UaAnalysis } | { ok: false; message: string };
const EXAMPLE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export default function UserAgentEntropyAnalyzerTool() {
  const t = useTranslations("tools.user-agent-entropy-analyzer");
  const [input, setInput] = useState("");

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: analyzeUa(s) };
    } catch (e) {
      return { ok: false, message: e instanceof UaInputError ? e.message : t("errGeneric") };
    }
  }, [input, t]);

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ua-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="ua-input"
          className="cidr-input mono saml-textarea"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">●</span>
          {t("runsLocally")}
        </p>
      </div>

      {result && !result.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{result.message}</p>
        </div>
      )}

      {result && result.ok && (
        <div className="tmsh-results">
          <section>
            <h3 className="cidr-h">{t("summaryTitle")}</h3>
            <p className="mono">{result.data.browser} {result.data.browserVersion} · {result.data.os} {result.data.osVersion} · {result.data.engine}</p>
            {result.data.isReducedUA && <p className="cidr-note">{t("reducedTag")}</p>}
          </section>

          <section>
            <h3 className="cidr-h">{t("componentsTitle")}</h3>
            <table className="cidr-table">
              <thead><tr><th>{t("colComponent")}</th><th>{t("colValue")}</th><th>{t("colBits")}</th><th>{t("colNote")}</th></tr></thead>
              <tbody>
                {result.data.components.map((c) => (
                  <tr key={c.label}><td>{c.label}</td><td className="mono">{c.value}</td><td className="mono">~{c.bitsApprox}</td><td>{c.note}</td></tr>
                ))}
                <tr><td><strong>{t("totalRow")}</strong></td><td /><td className="mono"><strong>~{result.data.totalBitsApprox}</strong></td><td>{t("totalNote")}</td></tr>
              </tbody>
            </table>
            <p className="cidr-note">{t("bitsDisclaimer")}</p>
          </section>

          <section>
            <h3 className="cidr-h">{t("freezeTitle")}</h3>
            <p className="cidr-note">{result.data.freezeNote}</p>
          </section>

          <section>
            <h3 className="cidr-h">{t("chTitle")}</h3>
            <p className="cidr-note">{result.data.clientHintsNote}</p>
          </section>
        </div>
      )}
    </div>
  );
}
