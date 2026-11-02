"use client";

// ============================================================================
// src/components/PingFederateOgnlExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the PingFederate OGNL expression explainer.
//
// The context selector is not a convenience - it changes what the expression is
// SUPPOSED to return, and therefore which diagnostics are meaningful. A mapping
// yields a value; a criterion must yield a boolean. Getting that wrong is one
// of the more common configuration errors in the product, and a tool that did
// not ask would be unable to catch it.
//
// D-83: Example / Clear row, with a sample drawn from a golden vector.
//
// SHARE RESULTS (2026-10-27): at the head of the reading, a button builds a
// link only when pressed, carrying the expression as typed and its context
// (src/lib/tools/pingfederate-ognl-explainer/share.ts, posture input-caution;
// blocked when the site's secrets check finds a credential in it). Its words
// come from the tool's message slice (tools.pingfederate-ognl-explainer.share)
// and the shared shareResults namespace. An arriving link (useShareArrival)
// fills both fields and explains as a paste would; nothing is evaluated.
//
// PAGE LANGUAGE (02/11/2026): the page's own words now come from the tool's
// messages too (they were English only), and the reading's sentences arrive as
// EngineTexts from explainExpressionLocalisable(), shown through engineTexts(t).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl"; // the tool's messages: chrome, Share results words, engine sentences
import {
  explainExpressionLocalisable,
  type ExplainResult,
  type ExpressionContext,
} from "@/lib/tools/pingfederate-ognl-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { OGNL_SHARE } from "@/lib/tools/pingfederate-ognl-explainer/share"; // this tool's share spec: the expression and its context

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the button is disabled

const EXAMPLES: Record<ExpressionContext, string> = {
  "attribute-mapping": '#this.get("mail") == null ? "" : #this.get("mail").toString().toLowerCase()',
  "issuance-criterion": '#this.get("department").toString().contains("engineering")',
};

export default function PingFederateOgnlExplainerTool() {
  const [context, setContext] = useState<ExpressionContext>("attribute-mapping");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ExplainResult<EngineText> | null>(null); // the reading, sentences with ids

  const run = (text: string, ctx: ExpressionContext) => {
    setInput(text);
    setContext(ctx);
    setResult(text.trim() ? explainExpressionLocalisable(text, ctx) : null); // read on every change
  };

  // The Share results words.
  const t = useTranslations("tools.pingfederate-ognl-explainer");
  const tx = engineTexts(t); // the engine's sentences under engine.*, else its English // tools.pingfederate-ognl-explainer.share.*
  // An arriving share link: the expression and its context fill the page, explained as a paste would be.
  useShareArrival(OGNL_SHARE, (s) => run(s.input, s.context)); // filled
  // What Share results may carry: the expression and its context, once explained.
  const share = useMemo<ShareEncoding>(() => (result ? OGNL_SHARE.encode({ input, context }) : NOTHING), [result, input, context]); // memoised
  // The popover's reason when the expression holds a credential.
  const blockedMessage = !share.ok && share.reason === "blocked" ? t("share.blocked", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? "") }) : ""; // one sentence

  return (
    <>
      <div className="dig-input-head">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => run(EXAMPLES[context], context)}
        >
          {t("example")}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setInput("");
            setResult(null);
          }}
        >
          {t("clear")}
        </button>
      </div>

      <label className="cidr-label" htmlFor="pf-ognl-context">
        {t("contextLabel")}
      </label>
      <select
        id="pf-ognl-context"
        className="cidr-input mono"
        value={context}
        onChange={(e) => run(input, e.target.value as ExpressionContext)}
      >
        <option value="attribute-mapping">{t("context.attribute-mapping")}</option>
        <option value="issuance-criterion">{t("context.issuance-criterion")}</option>
      </select>

      <label className="cidr-label" htmlFor="pf-ognl-input">
        {t("inputLabel")}
      </label>
      <textarea
        id="pf-ognl-input"
        className="cidr-input mono saml-textarea"
        rows={4}
        spellCheck={false}
        value={input}
        placeholder='#this.get("mail") == null ? "" : #this.get("mail").toString().toLowerCase()'
        onChange={(e) => run(e.target.value, context)}
      />

      {result && (
        <>
          {/* Share results: at the head of the reading, under the expression it carries. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={[t("share.caution")]} blockedMessage={blockedMessage} title={t("name")} />
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("contextTitle")}</h2>
            <p className="ztc-notes">{tx.say(result.expects)}</p>
          </div>

          {result.parts.length > 0 ? (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("partsTitle")}</h2>
              <ul className="lbm-facts">
                {result.parts.map((p, i) => (
                  <li className="ztc-notes" key={i}>
                    <span className="mono">{p.fragment}</span>
                    <br />
                    {tx.say(p.meaning)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("partsTitle")}</h2>
              <p className="ztc-notes">{t("nothingRecognised")}</p>
            </div>
          )}

          {result.diagnostics.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("diagnosticsTitle")}</h2>
              <ul className="lbm-facts">
                {result.diagnostics.map((d, i) => (
                  <li className="ztc-notes" key={i}>
                    <span className="mono">{t(d.severity === "caution" ? "severity.caution" : "severity.note")}</span>
                    {": "}
                    {tx.say(d.message)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="cidr-privacy">{t("privacy")}</p>
    </>
  );
}
