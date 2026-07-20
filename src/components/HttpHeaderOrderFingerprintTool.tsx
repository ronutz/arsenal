// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// HttpHeaderOrderFingerprintTool — paste a raw request header block; explain
// how header order and casing fingerprint the client. Decode/explain only.
// ============================================================================
"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { analyzeHeaders, HeaderInputError, type HeaderAnalysis } from "@/lib/tools/http-header-order-fingerprint";

type Result = { ok: true; data: HeaderAnalysis } | { ok: false; message: string };
const EXAMPLE = [
  "GET / HTTP/1.1",
  "Host: example.com",
  "Connection: keep-alive",
  'sec-ch-ua: "Chromium";v="120"',
  "sec-ch-ua-mobile: ?0",
  'sec-ch-ua-platform: "Windows"',
  "Upgrade-Insecure-Requests: 1",
  "User-Agent: Mozilla/5.0 Chrome/120.0.0.0",
  "Accept: text/html",
  "Sec-Fetch-Site: none",
  "Sec-Fetch-Mode: navigate",
  "Sec-Fetch-Dest: document",
  "Accept-Encoding: gzip, deflate, br",
  "Accept-Language: en-US,en;q=0.9",
].join("\n");

export default function HttpHeaderOrderFingerprintTool() {
  const t = useTranslations("tools.http-header-order-fingerprint");
  const [input, setInput] = useState("");

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: analyzeHeaders(s) };
    } catch (e) {
      return { ok: false, message: e instanceof HeaderInputError ? e.message : t("errGeneric") };
    }
  }, [input, t]);

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="hdr-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="hdr-input"
          className="cidr-input mono saml-textarea"
          rows={8}
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
            <h3 className="cidr-h">{t("clientTitle")}</h3>
            <p className="mono" style={{ fontSize: "1.15rem" }}>{result.data.clientHint.label}</p>
            <p className="cidr-note">{t("confidence")}: {t(`conf.${result.data.clientHint.confidence}`)} — {result.data.clientHint.rationale}</p>
            <p className="cidr-note">{t("orderHash")}: <span className="mono">{result.data.orderHash}</span></p>
          </section>

          <section>
            <h3 className="cidr-h">{t("orderTitle")}</h3>
            <table className="cidr-table">
              <thead><tr><th>#</th><th>{t("colHeader")}</th><th>{t("colNote")}</th></tr></thead>
              <tbody>
                {result.data.orderNotes.map((o) => (
                  <tr key={o.position}><td className="mono">{o.position}</td><td className="mono">{o.name}</td><td>{o.note}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="cidr-h">{t("casingTitle")}</h3>
            <p className="cidr-note">{result.data.casingNote}</p>
          </section>

          {result.data.missingCommon.length > 0 && (
            <section>
              <h3 className="cidr-h">{t("missingTitle")}</h3>
              <p className="cidr-note">{t("missingIntro")} <span className="mono">{result.data.missingCommon.join(", ")}</span></p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
