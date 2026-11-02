"use client";

// ============================================================================
// src/components/HttpStatusCodeExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the HTTP status code explainer: paste codes or families, get each
// one decoded - family badge, registered name, documented meaning, and the
// operational notes. Unknown-but-valid codes render the protocol's own
// family-fallback rule as the answer. Local compute; D-83 Example/Clear;
// house CSS classes only. (D-19 comments.)
//
// Share results (2026-10-27): first in the reading, a button builds a link that
// carries the box as typed (src/lib/tools/http-status-code-explainer/
// share.ts). An arriving link (useShareArrival) fills the box as typing would.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { runLocalisable, type StatusExplainResult } from "@/lib/tools/http-status-code-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { HTTP_STATUS_SHARE } from "@/lib/tools/http-status-code-explainer/share"; // this tool's share spec: the box as typed

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

/** Golden-vector-faithful sample: the redirect trio plus the triage trio. */
const EXAMPLE_INPUT = "301 302 307 502 503 504";

export default function HttpStatusCodeExplainerTool() {
  const t = useTranslations("tools.http-status-code-explainer");
  const tx = engineTexts(t); // PAGE LANGUAGE (02/11/2026): the engine's sentences under engine.*, else its English
  const [input, setInput] = useState("");
  const [result, setResult] = useState<StatusExplainResult<EngineText> | null>(null); // the reading, sentences with ids
  const [error, setError] = useState<unknown>(null); // the thrown error, shown through tx.error

  /** Explain the current input (local, synchronous). */
  function explain(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(runLocalisable(trimmed)); // sentences with ids
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e); // kept whole, so its sentence can be translated
    }
  }

  // An arriving share link: the text fills the box as typing would, and the page explains it.
  useShareArrival(HTTP_STATUS_SHARE, (state) => { setInput(state.input); explain(state.input); }); // as typed
  // What Share results may carry: the box, while it gives an explanation.
  const share = useMemo<ShareEncoding>(() => (result ? HTTP_STATUS_SHARE.encode({ input }) : NOTHING), [result, input]); // memoised

  return (
    <div>
      {/* ---- Input head with Example / Clear (D-83) ---- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="hsce-input">
          {t("inputLabel")}
        </label>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(EXAMPLE_INPUT);
              explain(EXAMPLE_INPUT);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput("");
              setResult(null);
              setError(null);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>
      <textarea
        id="hsce-input"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        rows={3}
        spellCheck={false}
        value={input}
        placeholder={t("placeholder")}
        onChange={(e) => {
          setInput(e.target.value);
          explain(e.target.value);
        }}
      />

      {/* ---- Errors ---- */}
      {error != null && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{tx.error(error)}</p>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!result && error == null && <p className="ztc-empty">{t("emptyState")}</p>}

      {/* ---- Explanations ---- */}
      {result && (
        <div className="ztc-result">
          {/* Share results: first in the reading, at the start of its own row. Under the cards it sat several screens
              below the box at 390 px with six codes (seen 2026-11-01). */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
          {result.families.map((f) => (
            <div className="tmsh-object" key={`fam-${f.family}`}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{tx.say(f.familyName)}</span>
                <span className="tmsh-object-name">{t("familyLabel")}</span>
              </div>
              <ul className="lbm-facts">
                <li>{tx.say(f.meaning)}</li>
              </ul>
            </div>
          ))}

          {result.codes.map((c) => (
            <div className="tmsh-object" key={c.code}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{c.code}</span>
                <span className="tmsh-object-name">{tx.say(c.name)}</span>
                <span className="certs-badge mono">{tx.say(c.familyName)}</span>
              </div>
              <ul className="lbm-facts">
                <li>{tx.say(c.meaning)}</li>
                {c.notes.map((n, i) => (
                  <li key={i}>{tx.say(n)}</li>
                ))}
              </ul>
            </div>
          ))}

          {result.notes.length > 0 && (
            <div className="ztc-notes">
              <p className="ztc-section-title">{t("notesTitle")}</p>
              <ul className="lbm-facts">
                {result.notes.map((n, i) => (
                  <li key={i}>{tx.say(n)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
