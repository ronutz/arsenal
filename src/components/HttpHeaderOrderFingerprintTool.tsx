// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// HttpHeaderOrderFingerprintTool — paste a raw request header block; explain
// how header order and casing fingerprint the client. Decode/explain only.
// ============================================================================
"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { analyzeHeadersLocalisable, HeaderInputError, type HeaderAnalysis } from "@/lib/tools/http-header-order-fingerprint/compute"; // the analysis with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the box as a paste would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { HEADER_ORDER_SHARE, encodeHeaderOrderShare, headerBlockCopy } from "@/lib/tools/http-header-order-fingerprint/share"; // this tool's share spec: a copy with every credential replaced

type Result = { ok: true; data: HeaderAnalysis<EngineText> } | { ok: false; message: string }; // the analysis, sentences with ids
/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant
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
  const tx = useMemo(() => engineTexts(t), [t]); // PAGE LANGUAGE (02/11/2026): the engine's sentences under engine.*, else its English
  const [input, setInput] = useState("");

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: analyzeHeadersLocalisable(s) }; // sentences with ids
    } catch (e) {
      return { ok: false, message: e instanceof HeaderInputError ? tx.error(e) : t("errGeneric") }; // the input error in the page's language
    }
  }, [input, t, tx]);

  // Share results (2026-11-01): a copy of the block with every credential, cookie value and secret parameter replaced
  // (the reading needs only the names and the User-Agent), made once per change for the button and its count line.
  const copy = useMemo(() => (result && result.ok ? headerBlockCopy(input) : null), [result, input]); // the copy, or why there is none
  const share = useMemo<ShareEncoding>(() => (copy ? encodeHeaderOrderShare(input, copy) : NOTHING), [copy, input]); // the button's encoding
  // A shared link fills the box with the copy, as a paste would; the page reads it.
  useShareArrival(HEADER_ORDER_SHARE, (s) => setInput(s.input));

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
            <h3 className="cidr-section-title">{t("clientTitle")}</h3>
            <p className="mono" style={{ fontSize: "1.15rem" }}>{tx.say(result.data.clientHint.label)}</p>
            <p className="cidr-note">{t("confidence")}: {t(`conf.${result.data.clientHint.confidence}`)}. {tx.say(result.data.clientHint.rationale)}</p>
            <p className="cidr-note">{t("orderHash")}: <span className="mono">{result.data.orderHash}</span></p>
          </section>

          {/* Share results: under the client read (the answer), before the order table, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries", { mark: "REDACTED" })}
              details={copy && copy.ok ? [t("share.redacted", { n: copy.replaced })] : []}
              blockedMessage={copy && !copy.ok ? (copy.code === "secret" ? t("share.blockedSecret", { line: copy.line, label: copy.label }) : t("share.blockedCopy")) : ""}
              title={t("name")}
            />
          </div>

          <section>
            <h3 className="cidr-section-title">{t("orderTitle")}</h3>
            <table className="cidr-table">
              <thead><tr><th>#</th><th>{t("colHeader")}</th><th>{t("colNote")}</th></tr></thead>
              <tbody>
                {result.data.orderNotes.map((o) => (
                  <tr key={o.position}><td className="mono">{o.position}</td><td className="mono">{o.name}</td><td>{tx.say(o.note)}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="cidr-section-title">{t("casingTitle")}</h3>
            <p className="cidr-note">{tx.say(result.data.casingNote)}</p>
          </section>

          {result.data.missingCommon.length > 0 && (
            <section>
              <h3 className="cidr-section-title">{t("missingTitle")}</h3>
              <p className="cidr-note">{t("missingIntro")} <span className="mono">{result.data.missingCommon.join(", ")}</span></p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
