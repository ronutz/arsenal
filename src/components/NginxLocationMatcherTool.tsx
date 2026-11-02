"use client";

// ============================================================================
// src/components/NginxLocationMatcherTool.tsx
// ----------------------------------------------------------------------------
// UI for the NGINX location matcher. Paste location blocks and a request URI;
// read back which block wins AND the step-by-step walk that got there. The walk
// is the product: the answer alone does not teach that reading a config top to
// bottom misleads you about the outcome.
// House CSS classes only (verified against the stylesheet); D-83 Example/Clear.
//
// Share results (2026-11-01, wave 4B): a button under the winner builds a link,
// only when pressed, carrying the box as typed (src/lib/tools/
// nginx-location-matcher/share.ts, posture input); a credential in it blocks
// the link and names its line. An arriving link fills the box, and the page
// walks it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { matchLocationLocalisable, type NginxMatchReport } from "@/lib/tools/nginx-location-matcher/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the step reasons, findings and parse errors arrive as EngineTexts from
// matchLocationLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { findShareSecrets, firstSharePlace } from "@/lib/share/text-secrets"; // the site's share check, and its first maybe-secret
import { LOCATION_SHARE, encodeLocationShare } from "@/lib/tools/nginx-location-matcher/share"; // this tool's share spec

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

/** Golden-vector-faithful sample: the regex beats the longer prefix. */
const EXAMPLE_INPUT = [
  "# The classic surprise: /images/ loses to the extension regex below it.",
  "location / {",
  "location /images/ {",
  "location ^~ /static/ {",
  "location = /favicon.ico {",
  "location ~ \\.(gif|jpg|png)$ {",
  "location ~* \\.php$ {",
  "",
  "request /images/logo.gif",
].join("\n");

export default function NginxLocationMatcherTool() {
  const t = useTranslations("tools.nginx-location-matcher");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<NginxMatchReport<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated

  /** Match the current config against its request line (local, synchronous). */
  function evaluate(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(matchLocationLocalisable(trimmed)); // the reading, sentences with ids
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e); // shown through tx.error
    }
  }

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page walks it.
  useShareArrival(LOCATION_SHARE, (s) => { setInput(s.input); evaluate(s.input); }); // the link's text
  // The check runs only while a walk shows (memoised on the box).
  const report = useMemo(() => (result ? findShareSecrets(input) : null), [result, input]); // null while there is none
  // What Share results may carry: the box as typed, unless it holds a credential.
  const share = useMemo<ShareEncoding>(() => (report ? encodeLocationShare({ input }, true, report) : NOTHING), [report, input]); // the encoding
  // The first secret-looking name with a value, named in a popover line.
  const maybe = useMemo(() => (report ? firstSharePlace(report.maybe) : null), [report]); // or null

  /** Localised label for one stage of the documented algorithm. */
  function stageLabel(stage: string): string {
    if (stage === "exact") return t("stageExact");
    if (stage === "prefix-scan") return t("stagePrefix");
    if (stage === "prefix-priority") return t("stagePriority");
    if (stage === "regex-scan") return t("stageRegex");
    // Predicate locations (nginx 1.31.5+) are tried after the regexes.
    if (stage === "predicate-scan") return t("stagePredicate");
    return t("stageFallback");
  }

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="ngx-config">
          {t("inputLabel")}
        </label>
        <textarea
          id="ngx-config"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={11}
          spellCheck={false}
          value={input}
          placeholder={t("placeholder")}
          onChange={(e) => {
            setInput(e.target.value);
            evaluate(e.target.value);
          }}
        />
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
          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("winnerHeading")}</h2>
            <p className="tmsh-object-head mono">
              {result.winner ? result.winner.raw : t("noMatch")}
            </p>
            {/* Show the request as typed: the matched path plus any arguments it carried. */}
            <p className="cidr-privacy">{t("requested", { uri: result.args ? `${result.uri}?${result.args}` : result.uri })}</p>
          </div>

          {/* Share results (2026-11-01): under the winner, before the walk, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={maybe ? [t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more })] : []}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
              title={t("name")}
            />
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("walkHeading")}</h2>
            <ol className="ztc-steps">
              {result.steps.map((step, i) => (
                <li key={i} className="tmsh-object">
                  <p className="tmsh-object-head mono">
                    {stageLabel(step.stage)}
                    {step.decisive ? ` - ${t("decisive")}` : ""}
                  </p>
                  <p className="ztc-notes">{tx.say(step.reason)}</p>
                </li>
              ))}
            </ol>
          </div>

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
