"use client";

// ============================================================================
// src/components/CheckpointPolicyLayerEvaluatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the Check Point ordered-layer evaluator. Paste a policy in the
// teaching grammar (layer declarations plus rules, and one test line) and read
// back the thing that is hard to see in SmartConsole: the per-layer trace,
// with each step saying whether an accept meant ALLOWED or merely PROCEED TO
// THE NEXT LAYER, where a drop ended evaluation, and where a drop logged
// nothing.
//
// The trace is the product here. A verdict alone would teach nothing - the
// point is watching a connection get accepted by one layer and dropped by the
// next, which is the behaviour people arriving from other firewalls do not
// expect. Silent drops are called out explicitly because their whole problem
// is that they are invisible.
//
// All compute is local (D-19 comments throughout; house CSS classes only;
// D-83 Example/Clear row).
//
// Share results (2026-11-01): a button under the verdict builds a link that
// carries the policy as pasted, with a caution line, unless the shared text
// check finds a credential in it; an arriving link fills the box as a paste
// would and the page reads it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { findShareSecrets, firstSharePlace } from "@/lib/share/text-secrets"; // the shared text check
import { CHECKPOINT_POLICY_LAYER_SHARE, encodeShare } from "@/lib/tools/checkpoint-policy-layer-evaluator/share"; // this tool's share spec
import { evaluatePolicyLocalisable, type CpReport } from "@/lib/tools/checkpoint-policy-layer-evaluator/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the step reasons, findings and parse errors arrive as EngineTexts from
// evaluatePolicyLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).

/** Golden-vector-faithful sample: accepted by layer 1, dropped by layer 2. */
const EXAMPLE_INPUT = [
  "# Two ordered layers. Layer 1 accepts, layer 2 decides.",
  "layer Network ordered",
  "1 | permit internal | accept | src=10.0.0.0/8",
  "2 | cleanup | drop |",
  "layer Application ordered",
  "1 | https only | accept | svc=443",
  "2 | cleanup | drop |",
  "",
  "# Port 80 clears the network layer and dies in the application layer.",
  "test src=10.1.1.5 dst=93.184.216.34 svc=80",
].join("\n");

export default function CheckpointPolicyLayerEvaluatorTool() {
  const t = useTranslations("tools.checkpoint-policy-layer-evaluator");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CpReport<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated

  /** Evaluate the current policy (local, synchronous). */
  function evaluate(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(evaluatePolicyLocalisable(trimmed)); // the reading, sentences with ids
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e); // shown through tx.error
    }
  }

  /** Localised label for a trace step's outcome. */
  function outcomeLabel(outcome: string): string {
    if (outcome === "proceed") return t("outcomeProceed");
    if (outcome === "allowed") return t("outcomeAllowed");
    if (outcome === "dropped") return t("outcomeDropped");
    if (outcome === "entered-inline") return t("outcomeInline");
    return outcome;
  }

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it (nothing is contacted).
  useShareArrival(CHECKPOINT_POLICY_LAYER_SHARE, (s) => { setInput(s.input); evaluate(s.input); }); // the link's text
  // The shared text check: once per change, only beside a reading; it feeds the button and its popover.
  const shareCheck = useMemo(() => (result ? findShareSecrets(input) : null), [result, input]); // the report, or null
  const share = useMemo(() => encodeShare(input, shareCheck), [input, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareDetails = [shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")]; // the caution, or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="cp-policy">
          {t("inputLabel")}
        </label>
        <textarea
          id="cp-policy"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={12}
          spellCheck={false}
          value={input}
          placeholder={t("placeholder")}
          onChange={(e) => {
            setInput(e.target.value);
            evaluate(e.target.value);
          }}
        />

        {/* D-83: Example / Clear, with a sample that is a golden vector. */}
        <div className="dig-input-head">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setInput(EXAMPLE_INPUT);
              evaluate(EXAMPLE_INPUT);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setInput("");
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
          <p className="json-error-headline">{t("parseErrorHeadline")}</p>
          <p className="json-error-message">{tx.error(error)}</p>
        </div>
      )}

      {result && (
        <>
          {/* -- Verdict -------------------------------------------------- */}
          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("verdictHeading")}</h2>
            <p className="tmsh-object-head">
              <strong>
                {result.verdict === "allowed" ? t("verdictAllowed") : t("verdictDropped")}
              </strong>
            </p>
            <p className="cidr-privacy">
              {t("connectionSummary", {
                src: result.connection.srcText,
                dst: result.connection.dstText,
                svc: result.connection.svc,
              })}
            </p>
            {/* Share results (2026-11-01): under the verdict and the connection it judged, before the trace, at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
            </div>
          </div>

          {/* -- The trace: the actual teaching ---------------------------- */}
          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("traceHeading")}</h2>
            <ol className="ztc-steps">
              {result.steps.map((step, i) => (
                <li key={`${step.layer}-${i}`} className="tmsh-object">
                  <p className="tmsh-object-head mono">
                    {step.layer}
                    {step.layerKind === "inline" ? ` (${t("inlineTag")})` : ""}:{" "}
                    {outcomeLabel(step.outcome)}
                  </p>
                  <p className="ztc-notes">{tx.say(step.reason)}</p>
                  {step.silent && <p className="json-error-message">{t("silentWarning")}</p>}
                </li>
              ))}
            </ol>
          </div>

          {/* -- Findings about the policy itself -------------------------- */}
          {result.findings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("findingsHeading")}</h2>
              <ul className="lbm-facts">
                {result.findings.map((f, i) => (
                  <li key={i} className="ztc-notes">
                    <span className="mono">{f.layer}</span>: {tx.say(f.message)}
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
