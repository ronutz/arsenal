// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/RomanNumeralsTool.tsx — client UI for the Roman numerals
// converter/builder. One auto-detecting input (number or numeral), the
// canonical form, and the place-by-place construction. All compute is local.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { analyzeRoman, RomanInputError, type RomanAnalysis } from "@/lib/tools/roman-numerals";

type Result = { ok: true; data: RomanAnalysis } | { ok: false; message: string };

// D-83 Example sample — verbatim from this tool's golden vectors (v9).
const EXAMPLE = "1994";

export default function RomanNumeralsTool() {
  const t = useTranslations("tools.roman-numerals");
  const [input, setInput] = useState("");

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: analyzeRoman(s) };
    } catch (e) {
      return { ok: false, message: e instanceof RomanInputError ? e.message : t("errGeneric") };
    }
  }, [input, t]);

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="roman-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <input
          id="roman-input"
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
            <h3 className="cidr-h">{t("resultTitle")}</h3>
            <p className="mono" style={{ fontSize: "1.4rem" }}>
              {result.data.value} = {result.data.canonical}
            </p>
            {result.data.kind === "fromNumeral" && result.data.isCanonical === false && result.data.input && (
              <p>{t("nonCanonical", { input: result.data.input, canonical: result.data.canonical })}</p>
            )}
          </section>
          <section>
            <h3 className="cidr-h">{t("placesTitle")}</h3>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <thead>
                  <tr><th>{t("colNumeral")}</th><th>{t("colValue")}</th></tr>
                </thead>
                <tbody>
                  {result.data.places.map((p, i) => (
                    <tr key={i}><td className="mono">{p.numeral}</td><td className="mono">{p.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {result.data.notes.length > 0 && (
            <section>
              {result.data.notes.map((n, i) => (<p key={i}>{n}</p>))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
