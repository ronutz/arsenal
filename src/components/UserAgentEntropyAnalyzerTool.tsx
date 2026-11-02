// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// UserAgentEntropyAnalyzerTool — decode a pasted User-Agent string and explain
// its fingerprinting surface + the Client Hints migration. Decode/explain only.
// ============================================================================
"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { analyzeUaLocalisable, UaInputError, type UaAnalysis } from "@/lib/tools/user-agent-entropy-analyzer/compute"; // the analysis with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the box as a paste would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { UA_SHARE, checkUaBox, encodeUaShare } from "@/lib/tools/user-agent-entropy-analyzer/share"; // this tool's share spec: the box as typed, checked for credentials

type Result = { ok: true; data: UaAnalysis<EngineText> } | { ok: false; message: string }; // the analysis, sentences with ids
const EXAMPLE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

export default function UserAgentEntropyAnalyzerTool() {
  const t = useTranslations("tools.user-agent-entropy-analyzer");
  const tx = useMemo(() => engineTexts(t), [t]); // PAGE LANGUAGE (02/11/2026): the engine's sentences under engine.*, else its English
  const [input, setInput] = useState("");

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: analyzeUaLocalisable(s) }; // sentences with ids
    } catch (e) {
      return { ok: false, message: e instanceof UaInputError ? tx.error(e) : t("errGeneric") }; // the input error in the page's language
    }
  }, [input, t, tx]);

  // Share results (2026-11-01): the box as typed; the site's secrets check runs once per change, for the button (a
  // credential, such as a pasted Cookie line, gives no link) and the caution line (a secret-looking name).
  const report = useMemo(() => checkUaBox(input), [input]); // what the check found
  const share = useMemo<ShareEncoding>(() => (result && result.ok ? encodeUaShare(input, report) : NOTHING), [result, input, report]); // the button's encoding
  const maybe = report.maybe[0] ?? null; // the first secret-looking value
  // A shared link fills the box as a paste would; the page analyses it.
  useShareArrival(UA_SHARE, (s) => setInput(s.input));

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
            <h3 className="cidr-section-title">{t("summaryTitle")}</h3>
            <p className="mono">{tx.say(result.data.browser)} {result.data.browserVersion} · {tx.say(result.data.os)} {tx.say(result.data.osVersion)} · {tx.say(result.data.engine)}</p>
            {result.data.isReducedUA && <p className="cidr-note">{t("reducedTag")}</p>}
          </section>

          {/* Share results: under the summary (the answer), before the component table, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={maybe ? [t("share.maybeSecret", { line: maybe.line, label: maybe.label })] : []}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? "") }) : ""}
              title={t("name")}
            />
          </div>

          <section>
            <h3 className="cidr-section-title">{t("componentsTitle")}</h3>
            <table className="cidr-table">
              <thead><tr><th>{t("colComponent")}</th><th>{t("colValue")}</th><th>{t("colBits")}</th><th>{t("colNote")}</th></tr></thead>
              <tbody>
                {result.data.components.map((c) => (
                  <tr key={c.label.id}><td>{tx.say(c.label)}</td><td className="mono">{tx.say(c.value)}</td><td className="mono">~{c.bitsApprox}</td><td>{tx.say(c.note)}</td></tr>
                ))}
                <tr><td><strong>{t("totalRow")}</strong></td><td /><td className="mono"><strong>~{result.data.totalBitsApprox}</strong></td><td>{t("totalNote")}</td></tr>
              </tbody>
            </table>
            <p className="cidr-note">{t("bitsDisclaimer")}</p>
          </section>

          <section>
            <h3 className="cidr-section-title">{t("freezeTitle")}</h3>
            <p className="cidr-note">{tx.say(result.data.freezeNote)}</p>
          </section>

          <section>
            <h3 className="cidr-section-title">{t("chTitle")}</h3>
            <p className="cidr-note">{tx.say(result.data.clientHintsNote)}</p>
          </section>
        </div>
      )}
    </div>
  );
}
