// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// P0fSignatureExplainerTool — decode a p0f v3 passive TCP/IP SYN fingerprint.
// House pattern: cidr-tool wrapper, dig-input-head Example/Clear, tmsh-results,
// cidr-table. Decode/explain only; zero egress.
// ============================================================================
"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { analyzeP0f, P0fInputError, type P0fAnalysis } from "@/lib/tools/p0f-signature-explainer";

type Result = { ok: true; data: P0fAnalysis } | { ok: false; message: string };
const EXAMPLE = "4:64:0:*:mss*20,7:mss,sok,ts,nop,ws:df,id+:0";

export default function P0fSignatureExplainerTool() {
  const t = useTranslations("tools.p0f-signature-explainer");
  const [input, setInput] = useState("");

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: analyzeP0f(s) };
    } catch (e) {
      return { ok: false, message: e instanceof P0fInputError ? e.message : t("errGeneric") };
    }
  }, [input, t]);

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="p0f-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <input
          id="p0f-input"
          className="cidr-input mono json-input"
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
            <h3 className="cidr-h">{t("osTitle")}</h3>
            <p className="mono" style={{ fontSize: "1.15rem" }}>{result.data.osHint.label}</p>
            <p className="cidr-note">{t("confidence")}: {t(`conf.${result.data.osHint.confidence}`)} — {result.data.osHint.rationale}</p>
          </section>

          <section>
            <h3 className="cidr-h">{t("fieldsTitle")}</h3>
            <table className="cidr-table">
              <thead><tr><th>{t("colField")}</th><th>{t("colValue")}</th><th>{t("colMeaning")}</th></tr></thead>
              <tbody>
                {result.data.fieldNotes.map((f) => (
                  <tr key={f.field}><td>{f.field}</td><td className="mono">{f.value}</td><td>{f.meaning}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="cidr-h">{t("ttlTitle")}</h3>
            <p className="cidr-note">{result.data.ttlNote}</p>
          </section>

          {result.data.options.length > 0 && (
            <section>
              <h3 className="cidr-h">{t("optionsTitle")}</h3>
              <table className="cidr-table">
                <thead><tr><th>{t("colToken")}</th><th>{t("colName")}</th><th>{t("colMeaning")}</th></tr></thead>
                <tbody>
                  {result.data.options.map((o, i) => (
                    <tr key={`${o.token}-${i}`}><td className="mono">{o.token}</td><td>{o.name}</td><td>{o.note}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {result.data.quirks.length > 0 && (
            <section>
              <h3 className="cidr-h">{t("quirksTitle")}</h3>
              <table className="cidr-table">
                <thead><tr><th>{t("colToken")}</th><th>{t("colMeaning")}</th></tr></thead>
                <tbody>
                  {result.data.quirks.map((q, i) => (
                    <tr key={`${q.token}-${i}`}><td className="mono">{q.token}</td><td>{q.meaning}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
