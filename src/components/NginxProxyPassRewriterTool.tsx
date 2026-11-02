"use client";

// ============================================================================
// UI for the NGINX proxy_pass rewriter. The product is the SIDE-BY-SIDE: the
// configuration as written, and the same configuration with the trailing slash
// flipped, so the binary switch is visible instead of described.
// House CSS classes only (verified); D-83 Example/Clear.
//
// Share results (2026-11-01, wave 4B): a button under the result builds a link,
// only when pressed, carrying the box as typed (src/lib/tools/
// nginx-proxy-pass-rewriter/share.ts, posture input-caution, with a caution
// line: the upstream names a backend); a credential in it blocks the link and
// names its line. An arriving link fills the box, and the page computes it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { rewriteProxyPassLocalisable, type ProxyResult } from "@/lib/tools/nginx-proxy-pass-rewriter/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the explanation, counterpart note, findings and parse errors arrive as EngineTexts
// from rewriteProxyPassLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { findShareSecrets, firstSharePlace } from "@/lib/share/text-secrets"; // the site's share check, and its first maybe-secret
import { PROXY_PASS_SHARE, encodeProxyPassShare } from "@/lib/tools/nginx-proxy-pass-rewriter/share"; // this tool's share spec

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

/** Golden-vector-faithful sample: the passthrough form, with its counterpart. */
const EXAMPLE_INPUT = [
  "# No URI part after the host - the prefix is KEPT.",
  "location /app/",
  "proxy_pass http://backend;",
  "",
  "request /app/page",
].join("\n");

export default function NginxProxyPassRewriterTool() {
  const t = useTranslations("tools.nginx-proxy-pass-rewriter");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ProxyResult<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated

  /** Compute the rewritten path (local, synchronous). */
  function evaluate(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(rewriteProxyPassLocalisable(trimmed)); // the reading, sentences with ids
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e); // shown through tx.error
    }
  }

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page computes it.
  useShareArrival(PROXY_PASS_SHARE, (s) => { setInput(s.input); evaluate(s.input); }); // the link's text
  // The check runs only while a result shows (memoised on the box).
  const report = useMemo(() => (result ? findShareSecrets(input) : null), [result, input]); // null while there is none
  // What Share results may carry: the box as typed, unless it holds a credential.
  const share = useMemo<ShareEncoding>(() => (report ? encodeProxyPassShare({ input }, true, report) : NOTHING), [report, input]); // the encoding
  // The first secret-looking name with a value, named in the popover in place of the plain caution.
  const maybe = useMemo(() => (report ? firstSharePlace(report.maybe) : null), [report]); // or null

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="pp-input">
          {t("inputLabel")}
        </label>
        <textarea
          id="pp-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={7}
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
            <h2 className="ztc-section-title">{t("resultHeading")}</h2>
            <p className="tmsh-object-head mono">
              {result.backendUri === null ? t("refused") : result.backendUri}
            </p>
            <p className="ztc-notes">{tx.say(result.explanation)}</p>
          </div>

          {/* Share results (2026-11-01): under the result, before the counterpart, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
              title={t("name")}
            />
          </div>

          {result.counterpart && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("counterpartHeading")}</h2>
              <p className="tmsh-object-head mono">
                {result.counterpart.proxyPass} &rarr;{" "}
                {result.counterpart.backendUri === null ? t("refused") : result.counterpart.backendUri}
              </p>
              <p className="ztc-notes">{tx.say(result.counterpart.note)}</p>
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
