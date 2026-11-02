"use client";

// ============================================================================
// src/components/ZscalerSslBypassPlannerTool.tsx
// ----------------------------------------------------------------------------
// UI for the ZIA SSL bypass planner. Paste an asset list in the teaching
// grammar (one per line: <name> | pinned|clean | regulated|general |
// agent|no-agent) and read the deterministic plan back: the verdict per
// asset (Inspect / policy Do Not Inspect / ZCC bypass) with sourced
// rationale and a blind-spot ledger, the outside-backstop checklist
// whenever anything goes uninspected, and the standing ordering and
// honesty notes. All compute is local (D-19 comments throughout; house
// CSS classes; D-83 Example/Clear).
//
// Share results (2026-11-01): a button under the summary counts builds a link
// that carries the box as pasted, with a caution line, unless the shared text
// check finds a credential in it; an arriving link fills the box as a paste
// would and the page reads it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { findShareSecrets, firstSharePlace } from "@/lib/share/text-secrets"; // the shared text check
import { ZSCALER_SSL_BYPASS_SHARE, encodeShare } from "@/lib/tools/zscaler-ssl-bypass-planner/share"; // this tool's share spec
import { runLocalisable, type PlanResult, type PlanVerdict } from "@/lib/tools/zscaler-ssl-bypass-planner/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the rationale, blind spots, backstops, notes and errors arrive as EngineTexts from runLocalisable() and are shown through
// engineTexts(t) (keys under engine.* in the pack), so the pt-BR page reads in Portuguese.

/** Golden-vector-faithful sample: all three verdicts plus a comment line. */
const EXAMPLE_INPUT = [
  "# name | pinned|clean | regulated|general | agent|no-agent",
  "crm-desktop-app | pinned | general | agent",
  "iot-updater | pinned | general | no-agent",
  "patient-portal | clean | regulated | agent",
  "general-saas | clean | general | agent",
].join("\n");

export default function ZscalerSslBypassPlannerTool() {
  const t = useTranslations("tools.zscaler-ssl-bypass-planner");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<PlanResult<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated

  /** Run the planner over the current input (local, synchronous). */
  function plan(text: string) {
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

  /** Localized label for a verdict. */
  function verdictLabel(v: PlanVerdict): string {
    if (v === "inspect") return t("verdictInspect");
    if (v === "dni-policy") return t("verdictDni");
    return t("verdictZcc");
  }

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it (nothing is contacted).
  useShareArrival(ZSCALER_SSL_BYPASS_SHARE, (s) => { setInput(s.input); plan(s.input); }); // the link's text
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
        <label className="cidr-label" htmlFor="zsbp-input">
          {t("inputLabel")}
        </label>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(EXAMPLE_INPUT);
              plan(EXAMPLE_INPUT);
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
        id="zsbp-input"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        rows={8}
        spellCheck={false}
        value={input}
        placeholder={t("placeholder")}
        onChange={(e) => {
          setInput(e.target.value);
          plan(e.target.value);
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

      {/* ---- The plan ---- */}
      {result && (
        <div className="ztc-result">
          {/* Summary counts */}
          <p className="persist-heading">{t("summaryTitle")}</p>
          <ul className="lbm-facts">
            <li>
              {t("countInspect")}: {result.counts.inspect}
            </li>
            <li>
              {t("countDni")}: {result.counts["dni-policy"]}
            </li>
            <li>
              {t("countZcc")}: {result.counts["zcc-bypass"]}
            </li>
          </ul>

          {/* Share results (2026-11-01): under the summary counts, before the per-asset cards, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>

          {/* Per-asset verdict cards */}
          {result.rows.map((row) => (
            <div className="tmsh-object" key={row.name}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{verdictLabel(row.verdict)}</span>
                <span className="tmsh-object-name">{row.name}</span>
              </div>
              <ul className="lbm-facts">
                {row.rationale.map((s, i) => (
                  <li key={i}>{tx.say(s)}</li>
                ))}
              </ul>
              {row.blindSpots.length > 0 && (
                <>
                  <p className="ztc-section-title">{t("blindSpotsTitle")}</p>
                  <ul className="lbm-facts">
                    {row.blindSpots.map((s, i) => (
                      <li key={i}>{tx.say(s)}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}

          {/* Backstop checklist - only when at least one asset is uninspected */}
          {result.backstops.length > 0 && (
            <>
              <p className="persist-heading">{t("backstopsTitle")}</p>
              <ol className="ztc-steps">
                {result.backstops.map((s, i) => (
                  <li key={i}>{tx.say(s)}</li>
                ))}
              </ol>
            </>
          )}

          {/* Standing notes: ordering doctrine + teaching-subset honesty */}
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
