"use client";

// ============================================================================
// UI for the DLP match predictor. The three stages are shown as three separate
// numbers - candidates, matches, threshold - because a rule that did not fire
// failed at exactly one of them, and collapsing them into a verdict throws
// away the only diagnostic information there is.
// House CSS classes only (verified); D-83 Example/Clear.
//
// Share results (2026-11-01, wave 4B): a button under the verdict builds a
// link, only when pressed, carrying stand-ins for the numbers found (the same
// length, separators and checksum result, digits the page makes), the
// identifier and the threshold, never the text (src/lib/tools/
// netskope-dlp-match-predictor/share.ts, posture derived). An arriving link
// fills the box with the stand-ins, and a note under the verdict says so.
//
// UP AND DOWN ARROWS (03/11/2026): the threshold has a down and an up arrow
// beside it (src/components/NumberStepper.tsx), whole matches from 1 (the
// engine's floor), and steps with Arrow Up and Down from the keyboard.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // the up and down arrows, and their keys
import {
  predictMatchesLocalisable,
  type DlpResult,
  type IdentifierKind,
} from "@/lib/tools/netskope-dlp-match-predictor/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the reasons, explanation, findings and errors arrive as EngineTexts from
// predictMatchesLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { DLP_SHARE, dlpStandIns, encodeDlpShare } from "@/lib/tools/netskope-dlp-match-predictor/share"; // this tool's share spec: the stand-ins

/** Golden-vector-faithful sample: one valid published test card, one that fails Luhn. */
const EXAMPLE = "Cards 4111111111111111 and 4111111111111112 were submitted with order 1234567812345678.";

export default function NetskopeDlpMatchPredictorTool() {
  const t = useTranslations("tools.netskope-dlp-match-predictor");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [text, setText] = useState("");
  const [kind, setKind] = useState<IdentifierKind>("payment-card");
  const [threshold, setThreshold] = useState("1");
  const [result, setResult] = useState<DlpResult<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated
  // True after a shared link filled the box, until the text changes: the numbers are stand-ins (2026-11-01).
  const [arrived, setArrived] = useState(false);

  /** Evaluate the current text against the current identifier and threshold. */
  function evaluate(nextText?: string, nextKind?: IdentifierKind, nextThreshold?: string) {
    const body = nextText ?? text;
    if (!body.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(
        predictMatchesLocalisable(body, nextKind ?? kind, Number(nextThreshold ?? threshold)), // the reading, sentences with ids
      );
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e); // shown through tx.error
    }
  }

  // An arriving share link (2026-11-01): the stand-ins fill the box, the identifier and threshold are set, and the page evaluates.
  /** The threshold as typed (or as its arrows set it): the field shows the text, and the reading follows at once. */
  function setThresholdText(v: string) {
    // The field.
    setThreshold(v);
    // The reading with the new threshold.
    evaluate(undefined, undefined, v);
  }

  useShareArrival(DLP_SHARE, (s) => { setText(s.input); setKind(s.kind); setThreshold(s.threshold); evaluate(s.input, s.kind, s.threshold); setArrived(true); }); // the link's values
  // What Share results may carry: stand-ins for the numbers found, with the identifier and the threshold (memoised).
  const share = useMemo(() => encodeDlpShare(dlpStandIns(result && plainText(result)), result ? result.kind : kind, result ? result.threshold : 1), [result, kind]); // the encoding (the share spec reads the API's shape)
  // Why there is no link, when there is none.
  const shareBlocked = !share.ok && share.reason === "blocked" ? (share.code === "none" ? t("share.blockedNone") : t("share.blockedCopy")) : ""; // or nothing

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="dlp-kind">
          {t("kindLabel")}
        </label>
        <select
          id="dlp-kind"
          className="cidr-input mono"
          value={kind}
          onChange={(e) => {
            const v = e.target.value as IdentifierKind;
            setKind(v);
            evaluate(undefined, v);
          }}
        >
          <option value="payment-card">{t("kindCard")}</option>
          <option value="cpf">{t("kindCpf")}</option>
          <option value="cnpj">{t("kindCnpj")}</option>
        </select>

        <label className="cidr-label" htmlFor="dlp-threshold">
          {t("thresholdLabel")}
        </label>
        {/* Up and down arrows: one match a press, whole numbers from 1 (the engine refuses less or a fraction), set as typing would. */}
        <StepperField value={threshold} onValue={setThresholdText} min={1} integer label={t("thresholdLabel")} inputId="dlp-threshold">
          <input
            id="dlp-threshold"
            className="cidr-input mono"
            spellCheck={false}
            value={threshold}
            // The threshold as typed, through the same setter the arrows use.
            onChange={(e) => setThresholdText(e.target.value)}
            // Arrow Up and Down (Page Up and Down: ten) step the threshold from the keyboard.
            onKeyDown={stepperKeyDown({ value: threshold, onValue: setThresholdText, min: 1, integer: true })}
          />
        </StepperField>

        <label className="cidr-label" htmlFor="dlp-text">
          {t("textLabel")}
        </label>
        <textarea
          id="dlp-text"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={6}
          spellCheck={false}
          value={text}
          placeholder={t("placeholder")}
          onChange={(e) => {
            setText(e.target.value);
            setArrived(false); // the reader's own text now
            evaluate(e.target.value);
          }}
        />
        <div className="dig-input-head">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setText(EXAMPLE);
              setArrived(false); // the page's own example now
              setKind("payment-card");
              setThreshold("1");
              evaluate(EXAMPLE, "payment-card", "1");
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setText("");
              setArrived(false); // nothing from a link any more
              setResult(null);
              setError(null);
            }}
          >
            {t("clear")}
          </button>
        </div>
        <p className="cidr-privacy">{t("privacy")}</p>
      </div>

      {error != null && (
        <div className="json-error-box">
          <p className="json-error-headline">{t("errorHeadline")}</p>
          <p className="json-error-message">{tx.error(error)}</p>
        </div>
      )}

      {result && (
        <>
          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("verdictHeading")}</h2>
            <p className="tmsh-object-head mono">
              {result.fires ? t("fires") : t("doesNotFire")}
            </p>
            <p className="ztc-notes">{tx.say(result.explanation)}</p>
            {arrived && <p className="cidr-privacy">{t("share.arrived")}</p>}
          </div>

          {/* Share results (2026-11-01): under the verdict, before the stages, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} blockedMessage={shareBlocked} title={t("name")} />
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("stagesHeading")}</h2>
            <ul className="lbm-facts">
              <li className="ztc-notes">
                {t("stageCandidates", { count: result.candidates.length })}
              </li>
              <li className="ztc-notes">{t("stageMatches", { count: result.matchCount })}</li>
              <li className="ztc-notes">{t("stageThreshold", { count: result.threshold })}</li>
            </ul>
          </div>

          {result.candidates.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("candidatesHeading")}</h2>
              <ol className="ztc-steps">
                {result.candidates.map((c, i) => (
                  <li key={i} className="tmsh-object">
                    <p className="tmsh-object-head mono">
                      {c.valid ? "\u2713" : "\u2717"} {c.raw}
                    </p>
                    <p className="ztc-notes">{tx.say(c.reason)}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.findings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("findingsHeading")}</h2>
              <ul className="lbm-facts">
                {result.findings.map((f, i) => (
                  <li key={i} className="ztc-notes">
                    {tx.say(f)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
