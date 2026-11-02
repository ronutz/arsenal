"use client";

// ============================================================================
// src/components/NetskopeSteeringDecisionExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the Netskope steering decision explainer: paste the compact spec,
// get the verdict banner, the ledger of documented checks, and the standing
// notes (including the honest no-published-precedence note). Local compute;
// D-83 Example/Clear; house CSS classes only. (D-19 comments.)
//
// Share results (2026-11-01, wave 4B): a button under the verdict builds a
// link, only when pressed, carrying the spec as typed (src/lib/tools/
// netskope-steering-decision-explainer/share.ts, posture input-caution, with a
// caution line); a credential in it blocks the link and names its line. An
// arriving link fills the box, and the page explains it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { runLocalisable, type SteeringDecision } from "@/lib/tools/netskope-steering-decision-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the headline, ledger, notes and errors arrive as EngineTexts from runLocalisable() and are shown through
// engineTexts(t) (keys under engine.* in the pack), so the pt-BR page reads in Portuguese.
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { findShareSecrets, firstSharePlace } from "@/lib/share/text-secrets"; // the site's share check, and its first maybe-secret
import { STEERING_DECISION_SHARE, encodeSteeringDecisionShare } from "@/lib/tools/netskope-steering-decision-explainer/share"; // this tool's share spec

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

/** Golden-vector-faithful sample: Fail Close rescue via a domain exception. */
const EXAMPLE_INPUT = `mode: web
tunnel: down
fail-close: on
flow: web login.example.com
exception: domain login.example.com
flow-matches: domain`;

export default function NetskopeSteeringDecisionExplainerTool() {
  const t = useTranslations("tools.netskope-steering-decision-explainer");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SteeringDecision<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated

  /** Explain the current spec (local, synchronous). */
  function explain(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(runLocalisable(trimmed)); // the reading, sentences with ids
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e); // shown through tx.error
    }
  }

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page explains it.
  useShareArrival(STEERING_DECISION_SHARE, (s) => { setInput(s.input); explain(s.input); }); // the link's text
  // The check runs only while a decision shows (memoised on the box).
  const report = useMemo(() => (result ? findShareSecrets(input) : null), [result, input]); // null while there is none
  // What Share results may carry: the spec as typed, unless it holds a credential.
  const share = useMemo<ShareEncoding>(() => (report ? encodeSteeringDecisionShare({ input }, true, report) : NOTHING), [report, input]); // the encoding
  // The first secret-looking name with a value, named in the popover in place of the plain caution.
  const maybe = useMemo(() => (report ? firstSharePlace(report.maybe) : null), [report]); // or null

  return (
    <div>
      {/* ---- Input head with Example / Clear (D-83) ---- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="nsde-input">
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
        id="nsde-input"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        rows={8}
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

      {/* ---- Decision ---- */}
      {result && (
        <div className="ztc-result">
          <div className="tmsh-object">
            <div className="tmsh-object-head">
              <span className="tmsh-type-badge">{tx.key(`verdict.${result.verdict}`, result.verdict)}</span>
              <span className="tmsh-object-name">{t("modeLabel", { mode: result.effectiveMode })}</span>
            </div>
            <ul className="lbm-facts">
              <li>{tx.say(result.headline)}</li>
            </ul>
          </div>

          {/* Share results (2026-11-01): under the verdict, before the ledger, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
              title={t("name")}
            />
          </div>

          <div className="ztc-notes">
            <p className="ztc-section-title">{t("ledgerTitle")}</p>
            <ul className="lbm-facts">
              {result.ledger.map((s, i) => (
                <li key={i}>
                  <strong>{tx.say(s.check)}:</strong> {tx.say(s.outcome)}
                </li>
              ))}
            </ul>
          </div>

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
