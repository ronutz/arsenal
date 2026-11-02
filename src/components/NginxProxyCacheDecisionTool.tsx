"use client";

// ============================================================================
// UI for the NGINX proxy_cache decision engine. Two verdicts, deliberately
// separate - STORED and SERVED are different questions - each with the ordered
// rule walk that produced it, plus warnings about the asymmetries that leak
// data between users.
// House CSS classes only (verified); D-83 Example/Clear.
//
// Share results (2026-11-01, wave 4B): a button under the two verdicts builds a
// link, only when pressed, carrying a copy of the box with cookie values and
// credentials replaced (src/lib/tools/nginx-proxy-cache-decision/share.ts,
// posture derived); a switch in the popover can include them. An arriving link
// fills the box, and the page decides.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { decideCacheLocalisable, type CacheDecision } from "@/lib/tools/nginx-proxy-cache-decision/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the rule labels and details, warnings and parse errors arrive as EngineTexts from
// decideCacheLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first maybe-secret, for the popover line
import { PROXY_CACHE_SHARE, cacheShareCopy, encodeCacheRevealed, encodeCacheShare } from "@/lib/tools/nginx-proxy-cache-decision/share"; // this tool's share spec: the copy, and the box as typed for the reveal switch

/** Golden-vector-faithful sample: the configuration that leaks. */
const EXAMPLE_INPUT = [
  "# Ignoring Set-Cookie while the key ignores cookies: the classic leak.",
  "proxy_cache zone1;",
  "proxy_cache_valid 200 10m;",
  "proxy_ignore_headers Set-Cookie;",
  "",
  "request GET /account",
  "request_header Cookie: session=abc",
  "",
  "response 200",
  "response_header Set-Cookie: id=1",
].join("\n");

export default function NginxProxyCacheDecisionTool() {
  const t = useTranslations("tools.nginx-proxy-cache-decision");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CacheDecision<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated
  const plain = useMemo(() => (result ? plainText(result) : null), [result]); // the API's shape, for the share spec

  /** Decide store and serve for the current exchange (local, synchronous). */
  function evaluate(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(decideCacheLocalisable(trimmed)); // the reading, sentences with ids
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e); // shown through tx.error
    }
  }

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page decides.
  useShareArrival(PROXY_CACHE_SHARE, (s) => { setInput(s.input); evaluate(s.input); }); // the link's text
  // The copy, once per change of the box (only while there is a decision to share).
  const shareCopy = useMemo(() => cacheShareCopy(input, plain), [input, plain]); // the copy, or why there is none
  // What Share results may carry: the copy, nothing, or blocked.
  const share = useMemo(() => encodeCacheShare(shareCopy), [shareCopy]); // the encoding
  // The reveal switch (PRIME 01/11/2026): the box as typed, offered only beside a copy that replaced something.
  const revealed = useMemo(() => encodeCacheRevealed(input, plain), [input, plain]); // the box as typed
  const shareReveal = share.ok && shareCopy.ok && shareCopy.replaced > 0 ? { encoding: revealed, label: t("share.revealLabel", { n: shareCopy.replaced }), carries: t("share.carriesRevealed"), details: [t("share.revealedCaution")] } : undefined; // the switch, or none
  // The first secret-looking name with a value in the copy, named in a popover line.
  const maybe = shareCopy.ok ? firstSharePlace(shareCopy.report.maybe) : null; // or null
  // The popover's lines under the first: how many values were replaced, and any maybe line.
  const shareDetails = shareCopy.ok ? [t("share.replaced", { n: shareCopy.replaced }), ...(maybe ? [t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more })] : [])] : []; // one or two lines
  // Why there is no link, when there is none.
  const shareBlocked = !share.ok && share.reason === "blocked" ? (share.code === "secret" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : t("share.blockedCopy")) : ""; // or nothing

  /** One rule walk, rendered as an ordered list. */
  function walk(steps: { rule: EngineText; passed: boolean; detail: EngineText }[]) {
    return (
      <ol className="ztc-steps">
        {steps.map((s, i) => (
          <li key={i} className="tmsh-object">
            <p className="tmsh-object-head mono">
              {s.passed ? "\u2713" : "\u2717"} {tx.say(s.rule)}
            </p>
            <p className="ztc-notes">{tx.say(s.detail)}</p>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="pc-input">
          {t("inputLabel")}
        </label>
        <textarea
          id="pc-input"
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
            <h2 className="ztc-section-title">{t("verdictHeading")}</h2>
            <p className="tmsh-object-head mono">
              {result.stored ? t("storedYes") : t("storedNo")}
            </p>
            <p className="tmsh-object-head mono">
              {result.servedFromCache ? t("servedYes") : t("servedNo")}
            </p>
            <p className="cidr-privacy">{t("keyLabel", { key: result.computedKey })}</p>
          </div>

          {/* Share results (2026-11-01): under the two verdicts, before the rule walks, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} reveal={shareReveal} />
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("storeHeading")}</h2>
            {walk(result.storeSteps)}
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("serveHeading")}</h2>
            {walk(result.serveSteps)}
          </div>

          {result.warnings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("warningsHeading")}</h2>
              <ul className="lbm-facts">
                {result.warnings.map((w, i) => (
                  <li key={i} className="ztc-notes">
                    {tx.say(w)}
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
