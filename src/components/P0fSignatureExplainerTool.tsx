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
import { analyzeP0fLocalisable, P0fInputError, type P0fAnalysis } from "@/lib/tools/p0f-signature-explainer/compute"; // the analysis with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the box as a paste would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { P0F_SHARE } from "@/lib/tools/p0f-signature-explainer/share"; // this tool's share spec: the signature as typed

type Result = { ok: true; data: P0fAnalysis<EngineText> } | { ok: false; message: string }; // the analysis, sentences with ids
const EXAMPLE = "4:64:0:*:mss*20,7:mss,sok,ts,nop,ws:df,id+:0";
/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

export default function P0fSignatureExplainerTool() {
  const t = useTranslations("tools.p0f-signature-explainer");
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences under engine.*, else its English
  const [input, setInput] = useState("");

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: analyzeP0fLocalisable(s) }; // PAGE LANGUAGE (02/11/2026): sentences with ids
    } catch (e) {
      return { ok: false, message: e instanceof P0fInputError ? tx.error(e) : t("errGeneric") }; // the input error in the page's language
    }
  }, [input, t, tx]);

  // Share results (2026-11-01): the signature as typed, only beside a decoded one.
  const share = useMemo<ShareEncoding>(() => (result && result.ok ? P0F_SHARE.encode({ input }) : NOTHING), [result, input]); // the button's encoding
  // A shared link fills the box as a paste would; the page decodes it.
  useShareArrival(P0F_SHARE, (s) => setInput(s.input));

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
            <h3 className="cidr-section-title">{t("osTitle")}</h3>
            <p className="mono" style={{ fontSize: "1.15rem" }}>{tx.say(result.data.osHint.label)}</p>
            <p className="cidr-note">{t("confidence")}: {t(`conf.${result.data.osHint.confidence}`)}. {tx.say(result.data.osHint.rationale)}</p>
          </section>

          {/* Share results: under the OS read (the answer), before the field table, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>

          <section>
            <h3 className="cidr-section-title">{t("fieldsTitle")}</h3>
            <table className="cidr-table">
              <thead><tr><th>{t("colField")}</th><th>{t("colValue")}</th><th>{t("colMeaning")}</th></tr></thead>
              <tbody>
                {result.data.fieldNotes.map((f) => (
                  <tr key={f.field.id}><td>{tx.say(f.field)}</td><td className="mono">{f.value}</td><td className="cidr-td-prose">{tx.say(f.meaning)}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="cidr-section-title">{t("ttlTitle")}</h3>
            <p className="cidr-note">{tx.say(result.data.ttlNote)}</p>
          </section>

          {result.data.options.length > 0 && (
            <section>
              <h3 className="cidr-section-title">{t("optionsTitle")}</h3>
              <table className="cidr-table">
                <thead><tr><th>{t("colToken")}</th><th>{t("colName")}</th><th>{t("colMeaning")}</th></tr></thead>
                <tbody>
                  {result.data.options.map((o, i) => (
                    <tr key={`${o.token}-${i}`}><td className="mono">{o.token}</td><td>{tx.say(o.name)}</td><td className="cidr-td-prose">{tx.say(o.note)}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {result.data.quirks.length > 0 && (
            <section>
              <h3 className="cidr-section-title">{t("quirksTitle")}</h3>
              <table className="cidr-table">
                <thead><tr><th>{t("colToken")}</th><th>{t("colMeaning")}</th></tr></thead>
                <tbody>
                  {result.data.quirks.map((q, i) => (
                    <tr key={`${q.token}-${i}`}><td className="mono">{q.token}</td><td className="cidr-td-prose">{tx.say(q.meaning)}</td></tr>
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
