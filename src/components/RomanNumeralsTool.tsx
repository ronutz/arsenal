// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/RomanNumeralsTool.tsx — client UI for the Roman numerals
// converter/builder. One auto-detecting input (number or numeral), the
// canonical form, and the place-by-place construction. All compute is local.
//
// Share results (2026-11-01): a button under the result builds a link that
// carries the box as typed. An arriving link (useShareArrival) fills the box
// as a paste would.
//
// UP AND DOWN ARROWS (03/11/2026): the box has a down and an up arrow beside
// it (src/components/NumberStepper.tsx, and Arrow Up and Down), 1 to 3999 as
// the engine reads. They step the value the box holds and write it back in the
// form the reader used: a number stays a number (1994 to 1995), a numeral
// becomes the next canonical numeral (MCMXCIV to MCMXCV).
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { analyzeRoman, toRoman, RomanInputError, type RomanAnalysis } from "@/lib/tools/roman-numerals"; // toRoman: the arrows answer a numeral with a numeral (03/11/2026)
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // the up and down arrows, and their keys
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { ROMAN_SHARE, encodeRomanShare } from "@/lib/tools/roman-numerals/share"; // this tool's share spec: the box as typed

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

  // An arriving share link: the value fills the box as a paste would, and the page converts it.
  useShareArrival(ROMAN_SHARE, (s) => setInput(s.input)); // as typed
  // What Share results carries: the box, once the page has a reading (memoised).
  const share = useMemo(() => encodeRomanShare({ input }, !!result?.ok), [input, result]); // the encoding

  // ---- Up and down arrows (03/11/2026). ----
  /** The value the box holds, for the arrows: the reading's number when it reads, else the box as typed. */
  const stepBase = result && result.ok ? String(result.data.value) : input; // "1994" for MCMXCIV
  /** Whether the reader is writing numerals (letters), so the arrows answer in numerals. */
  const asNumeral = result !== null && result.ok && result.data.kind === "fromNumeral"; // MCMXCIV, not 1994
  /** Set the box from the arrows, as typing would: the next number, or its canonical numeral. */
  const setFromArrows = (v: string) => setInput(asNumeral ? toRoman(Number(v)).canonical : v); // "MCMXCV" or "1995"

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
        {/* Up and down arrows: one a press, 1 to 3999 (the engine's range), in the form the box is written in. */}
        <StepperField value={stepBase} onValue={setFromArrows} min={1} max={3999} integer label={t("inputLabel")} inputId="roman-input">
          <input
            id="roman-input"
            className="cidr-input mono json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            // Arrow Up and Down (Page Up and Down: ten) step the value from the keyboard.
            onKeyDown={stepperKeyDown({ value: stepBase, onValue: setFromArrows, min: 1, max: 3999, integer: true })}
            placeholder={t("inputPlaceholder")}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          />
        </StepperField>
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
            <h3 className="cidr-section-title">{t("resultTitle")}</h3>
            <p className="mono" style={{ fontSize: "1.4rem" }}>
              {result.data.value} = {result.data.canonical}
            </p>
            {result.data.kind === "fromNumeral" && result.data.isCanonical === false && result.data.input && (
              <p>{t("nonCanonical", { input: result.data.input, canonical: result.data.canonical })}</p>
            )}
          </section>
          {/* Share results: under the result, at the start of its own row, before the construction. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
          <section>
            <h3 className="cidr-section-title">{t("placesTitle")}</h3>
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
