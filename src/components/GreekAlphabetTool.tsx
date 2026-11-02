// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/GreekAlphabetTool.tsx — client UI for the Greek alphabet
// converter/explainer. Auto-detects Greek text (decomposes + transliterates)
// or letter names (produces glyphs); the full 24-letter reference table with
// usage notes sits below as the explainer. All compute is local.
//
// Share results (2026-11-01): a button under the reading builds a link that
// carries the box as typed. An arriving link (useShareArrival) fills the box
// as a paste would.
//
// Page language (02/11/2026): the reading comes from analyzeGreekLocalisable()
// and is turned into the page's language by inPageLanguage(); input errors
// through engineTexts().error; each letter's usage line is looked up by the
// letter's name (engine.letter.<name>.usage), falling back to the English.
// The English page reads exactly as before.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { analyzeGreekLocalisable, GreekInputError, LETTERS, type GreekAnalysis } from "@/lib/tools/greek-alphabet/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences and the usage lines in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { GREEK_SHARE, encodeGreekShare } from "@/lib/tools/greek-alphabet/share"; // this tool's share spec: the box as typed

type Result = { ok: true; data: GreekAnalysis } | { ok: false; message: string };

// D-83 Example sample — verbatim from this tool's golden vectors (v3).
const EXAMPLE = "ΤΕΧΝΗ";

export default function GreekAlphabetTool() {
  const t = useTranslations("tools.greek-alphabet");
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences and the usage lines in the page's language (02/11/2026)
  const [input, setInput] = useState("");

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: inPageLanguage(analyzeGreekLocalisable(s), tx) }; // the reading, in the page's language
    } catch (e) {
      return { ok: false, message: e instanceof GreekInputError ? tx.error(e) : t("errGeneric") }; // the input error's sentence in the page's language
    }
  }, [input, t, tx]);

  // An arriving share link: the text fills the box as a paste would, and the page reads it.
  useShareArrival(GREEK_SHARE, (s) => setInput(s.input)); // as typed
  // What Share results carries: the box, once the page has a reading (memoised).
  const share = useMemo(() => encodeGreekShare({ input }, !!result?.ok), [input, result]); // the encoding

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="greek-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <input
          id="greek-input"
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

      {result && result.ok && result.data.kind === "decompose" && (
        <div className="tmsh-results">
          <section>
            <h3 className="cidr-section-title">{t("translitTitle")}</h3>
            <p className="mono" style={{ fontSize: "1.3rem" }}>{result.data.transliteration}</p>
          </section>
          <section>
            <h3 className="cidr-section-title">{t("decomposeTitle")}</h3>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <thead><tr><th>{t("colGlyph")}</th><th>{t("colName")}</th><th>{t("colTranslit")}</th></tr></thead>
                <tbody>
                  {result.data.chars!.filter((c) => c.isLetter).map((c, i) => (
                    <tr key={i}>
                      <td className="mono">{c.glyph}</td>
                      <td>{c.name}{c.finalForm ? ` ${t("finalForm")}` : ""}</td>
                      <td className="mono">{c.translit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {result.data.notes.map((n, i) => (<p key={i}>{n}</p>))}
        </div>
      )}

      {result && result.ok && result.data.kind === "byName" && (
        <div className="tmsh-results">
          <section>
            <h3 className="cidr-section-title">{t("lettersTitle")}</h3>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <thead><tr><th>{t("colGlyph")}</th><th>{t("colName")}</th><th>{t("colTranslit")}</th><th>{t("colUsage")}</th></tr></thead>
                <tbody>
                  {result.data.letters!.map((L) => (
                    <tr key={L.index}>
                      <td className="mono">{L.upper} {L.lower}</td>
                      <td>{L.name}</td>
                      <td className="mono">{L.translit}{L.classical ? ` (${L.classical})` : ""}</td>
                      <td>{tx.key(`letter.${L.name}.usage`, L.usage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Share results: under the reading, at the start of its own row, before the reference table. */}
      {result && result.ok && (
        <div className="rdap-ask-row">
          <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
        </div>
      )}

      <div className="tmsh-results">
        <section>
          <h3 className="cidr-section-title">{t("alphabetTitle")}</h3>
          <p>{t("alphabetIntro")}</p>
          <div className="cidr-table-wrap">
            <table className="cidr-table">
              <thead><tr><th>#</th><th>{t("colGlyph")}</th><th>{t("colName")}</th><th>{t("colTranslit")}</th><th>{t("colUsage")}</th></tr></thead>
              <tbody>
                {LETTERS.map((L) => (
                  <tr key={L.index}>
                    <td className="mono">{L.index}</td>
                    <td className="mono">{L.upper} {L.lower}</td>
                    <td>{L.name}</td>
                    <td className="mono">{L.translit}{L.classical ? ` (${L.classical})` : ""}</td>
                    <td>{tx.key(`letter.${L.name}.usage`, L.usage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
