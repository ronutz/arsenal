"use client";

// ============================================================================
// src/components/ZdxScoreFactorExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the ZDX score factor explainer. Paste metric lines in the teaching
// grammar (<metric> = <value>) and read the documented explanation back:
// each metric's probe-family badge and documented meaning, the score
// classified against the three documented bands, the web-versus-path
// diagnostic when both families are present, and the honesty calibrations
// (unpublished formula, telemetry delay, aggregate variance). All compute
// is local (D-19 comments throughout; house CSS classes; D-83
// Example/Clear).
//
// Share results (2026-11-01): a button, first in the reading, builds a link
// that carries the box as pasted, with a caution line, unless the shared text
// check finds a credential in it; an arriving link fills the box as a paste
// would and the page reads it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { findShareSecrets, firstSharePlace } from "@/lib/share/text-secrets"; // the shared text check
import { ZDX_SCORE_FACTOR_SHARE, encodeShare } from "@/lib/tools/zdx-score-factor-explainer/share"; // this tool's share spec
import { runLocalisable, type ExplainResult, type ProbeFamily } from "@/lib/tools/zdx-score-factor-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the reading lines, diagnostic, notes and errors arrive as EngineTexts from
// runLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).

/** Golden-vector-faithful sample: a Poor score plus both probe families. */
const EXAMPLE_INPUT = [
  "# <metric> = <value>   (score 0-100; times in ms; percentages 0-100)",
  "score = 28",
  "pft = 850",
  "dns = 120",
  "path-loss = 4",
].join("\n");

export default function ZdxScoreFactorExplainerTool() {
  const t = useTranslations("tools.zdx-score-factor-explainer");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ExplainResult<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated

  /** Run the explainer over the current input (local, synchronous). */
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

  /** Localized label for a probe family. */
  function familyLabel(f: ProbeFamily): string {
    if (f === "web") return t("familyWeb");
    if (f === "cloudpath") return t("familyCloudpath");
    return t("familyComposite");
  }

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it (nothing is contacted).
  useShareArrival(ZDX_SCORE_FACTOR_SHARE, (s) => { setInput(s.input); explain(s.input); }); // the link's text
  // The shared text check: once per change, only beside a reading; it feeds the button and its popover.
  const shareCheck = useMemo(() => (result ? findShareSecrets(input) : null), [result, input]); // the report, or null
  const share = useMemo(() => encodeShare(input, shareCheck), [input, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareDetails = [shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")]; // the caution, or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

  return (
    <div>
      {/* ---- Input: header row with Example / Clear (D-83), then the paste box ---- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="zdxfe-input">
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
        id="zdxfe-input"
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

      {/* ---- Errors: helpful, line-anchored ---- */}
      {error != null && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{tx.error(error)}</p>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!result && error == null && <p className="ztc-empty">{t("emptyState")}</p>}

      {/* ---- The reading ---- */}
      {result && (
        <div className="ztc-result">
          {/* Share results (2026-11-01): first in the reading (the metric cards run long), at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>
          {/* Per-metric reading cards: family badge + "key = value" + documented lines */}
          <p className="persist-heading">{t("readingsTitle")}</p>
          {result.readings.map((r) => (
            <div className="tmsh-object" key={r.key}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{familyLabel(r.family)}</span>
                <span className="tmsh-object-name">
                  {r.key} = {r.value}
                </span>
              </div>
              <ul className="lbm-facts">
                {r.lines.map((s, i) => (
                  <li key={i}>{tx.say(s)}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* Diagnostic split - only when both probe families are present */}
          {result.diagnostic.length > 0 && (
            <>
              <p className="persist-heading">{t("diagnosticTitle")}</p>
              <ul className="lbm-facts">
                {result.diagnostic.map((s, i) => (
                  <li key={i}>{tx.say(s)}</li>
                ))}
              </ul>
            </>
          )}

          {/* Standing notes: cadence, unpublished-formula honesty, calibrations */}
          <div className="ztc-notes">
            <p className="ztc-section-title">{t("notesTitle")}</p>
            <ul className="lbm-facts">
              {result.notes.map((n, i) => (
                <li key={i}>{tx.say(n)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
