"use client";

// ============================================================================
// src/components/ZccForwardingDecisionExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the ZCC forwarding decision explainer (descoped form per the
// ratified clause). Paste a posture in the setting grammar and read the
// documented spine back layer by layer - network state, ZIA action,
// Z-Tunnel semantics, ZPA action - then the bypass-mechanism ledger and
// the first-class why-explainer-not-simulator statement. All compute is
// local (D-19 comments; house CSS classes; D-83 Example/Clear).
//
// Share results (2026-11-01): a button, first in the reading, builds a link
// that carries the box as pasted, unless the shared text check finds a
// credential in it; an arriving link fills the box as a paste would and the
// page reads it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { findShareSecrets, firstSharePlace } from "@/lib/share/text-secrets"; // the shared text check
import { ZCC_FORWARDING_DECISION_SHARE, encodeShare } from "@/lib/tools/zcc-forwarding-decision-explainer/share"; // this tool's share spec
import { runLocalisable, type ExplainerResult, type DecisionStep } from "@/lib/tools/zcc-forwarding-decision-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the titles, lines, ledger, notes and errors arrive as EngineTexts from runLocalisable()
// and are shown through engineTexts(t) (keys under engine.* in the pack), so the pt-BR page reads in Portuguese.

/** Golden-vector-faithful sample: the RA-recommended roaming posture. */
const EXAMPLE_INPUT = [
  "# <key> = <value>",
  "network = off-trusted",
  "zia-action = tunnel",
  "tunnel = zt2",
  "zpa-action = tunnel",
].join("\n");

export default function ZccForwardingDecisionExplainerTool() {
  const t = useTranslations("tools.zcc-forwarding-decision-explainer");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ExplainerResult<EngineText> | null>(null);
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

  /** Localized label for a spine layer. */
  function layerLabel(layer: DecisionStep["layer"]): string {
    if (layer === "network") return t("layerNetwork");
    if (layer === "zia") return t("layerZia");
    if (layer === "tunnel") return t("layerTunnel");
    return t("layerZpa");
  }

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it (nothing is contacted).
  useShareArrival(ZCC_FORWARDING_DECISION_SHARE, (s) => { setInput(s.input); explain(s.input); }); // the link's text
  // The shared text check: once per change, only beside a reading; it feeds the button and its popover.
  const shareCheck = useMemo(() => (result ? findShareSecrets(input) : null), [result, input]); // the report, or null
  const share = useMemo(() => encodeShare(input, shareCheck), [input, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareDetails = (shareMaybe ? [t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more })] : []); // the name to check, if any
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

  return (
    <div>
      {/* ---- Input: header row with Example / Clear (D-83), then the paste box ---- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="zccfde-input">
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
        id="zccfde-input"
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

      {/* ---- The documented spine ---- */}
      {result && (
        <div className="ztc-result">
          {/* Share results (2026-11-01): first in the reading (the spine and the ledger run long), at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>
          <p className="persist-heading">{t("spineTitle")}</p>
          {result.steps.map((s, idx) => (
            <div className="tmsh-object" key={idx}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{layerLabel(s.layer)}</span>
                <span className="tmsh-object-name">{tx.say(s.title)}</span>
              </div>
              <ul className="lbm-facts">
                {s.lines.map((l, i) => (
                  <li key={i}>{tx.say(l)}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* The bypass layer: explained mechanisms, adjudicated by no one */}
          <p className="persist-heading">{t("bypassTitle")}</p>
          <ul className="lbm-facts">
            {result.bypassLedger.map((l, i) => (
              <li key={i}>{tx.say(l)}</li>
            ))}
          </ul>

          {/* Why an explainer and not a simulator - first-class output */}
          <div className="ztc-notes">
            <p className="ztc-section-title">{t("honestyTitle")}</p>
            <ul className="lbm-facts">
              {result.honesty.map((l, i) => (
                <li key={i}>{tx.say(l)}</li>
              ))}
            </ul>
            <p className="ztc-section-title">{t("notesTitle")}</p>
            <ul className="lbm-facts">
              {result.notes.map((l, i) => (
                <li key={i}>{tx.say(l)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
