"use client";

// ============================================================================
// iControl REST stats decoder - the UI.
// Paste the JSON, get one line per statistic. Pure local transform.
//
// SHARE RESULTS (2026-10-27): a button under the flattened text builds, only
// when pressed, a link carrying the response as pasted (spec:
// src/lib/tools/icontrol-rest-stats-decoder/share.ts). An arriving link
// (useShareArrival) fills the box as a paste would; the address loses the
// value at once.
//
// PAGE LANGUAGE (2026-11-02, batch H5): notes, warnings and errors arrive as
// EngineTexts from decodeStatsLocalisable() and are shown through engineTexts(t).
// Text that is not JSON (2026-11-02, batch H7) gets the site's error box, as
// the AWAF policy explainer has it: the headline, where the error is in the
// page's language (jsonErrorLocation), then the browser's own message in code
// type, since it is the browser's text. The engine and the API are unchanged.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { statsToText, type StatsDecode } from "@/lib/tools/icontrol-rest-stats-decoder";
import { decodeStatsLocalisable, StatsDecodeError } from "@/lib/tools/icontrol-rest-stats-decoder/compute"; // the reading with sentence ids (2026-11-02); the error's class, to tell a JSON syntax error
import { jsonErrorLocation } from "@/lib/tools/f5-awaf-declarative-policy-explainer/compute"; // where a JSON syntax error sits (the AWAF explainer's, reused 2026-11-02)
import { engineTexts, type EngineText, type EngineTextCarrier } from "@/lib/tools/engine-text"; // engine sentences in the page's language (2026-11-02)
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { ICONTROL_STATS_SHARE } from "@/lib/tools/icontrol-rest-stats-decoder/share"; // this tool's share spec: the response as pasted

const EXAMPLE = JSON.stringify({
  kind: "tm:ltm:pool:poolstats",
  entries: {
    "https://localhost/mgmt/tm/ltm/pool/~Common~web_pool/stats": {
      nestedStats: {
        entries: {
          activeMemberCnt: { value: 2 },
          "status.availabilityState": { description: "available" },
          "status.statusReason": { description: "The pool is available" },
          "serverside.bitsIn.high": { value: 3 },
          "serverside.bitsIn.low": { value: 1000000 },
          "serverside.curConns": { value: 7 },
          "serverside.pktsOut": { value: 91422 },
        },
      },
    },
  },
}, null, 2);

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

export default function IcontrolRestStatsDecoderTool() {
  const t = useTranslations("tools.icontrol-rest-stats-decoder");
  const tx = engineTexts(t); // the engine's sentences in the page's language (2026-11-02)
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo<{ ok: true; data: StatsDecode<EngineText> } | { ok: false; error: unknown } | null>(() => {
    if (!input.trim()) return null;
    try { return { ok: true, data: decodeStatsLocalisable(input) }; } // sentences with ids
    catch (e) {
      return { ok: false, error: e }; // kept whole: it carries its sentence
    }
  }, [input]);

  const text = result?.ok ? statsToText(result.data) : "";
  // A JSON syntax error (2026-11-02): the browser's own message, which the engine's sentence carries as its argument.
  const jsonMessage = useMemo(() => { // the browser's message, or null for any other error
    if (!result || result.ok || !(result.error instanceof StatsDecodeError) || result.error.code !== "not-json") return null; // not a syntax error
    const m = (result.error as StatsDecodeError & EngineTextCarrier).engineText?.args?.message; // the sentence's argument
    return typeof m === "string" ? m : null; // as the browser wrote it
  }, [result]); // once per reading
  const errorAt = useMemo(() => (jsonMessage !== null ? jsonErrorLocation(input, jsonMessage) : null), [jsonMessage, input]); // the line and column, or null
  // An arriving share link: the JSON fills the box as a paste would.
  useShareArrival(ICONTROL_STATS_SHARE, (state) => setInput(state.input)); // the JSON
  // What Share results may carry: the response as pasted, while it flattens.
  const share = useMemo<ShareEncoding>(() => (result?.ok ? ICONTROL_STATS_SHARE.encode({ input }) : NOTHING), [result, input]); // memoised

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="icst-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="icst-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
        rows={12}
      />

      {/* Not valid JSON (2026-11-02): the page says so, and where, in its own language; the browser's message follows in
          code type as a detail, since it is the browser's text and stays in the browser's language. */}
      {jsonMessage !== null && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("parseError")}</p>
          {errorAt && <p className="json-error-location">{t("parseErrorAt", { line: errorAt.line, column: errorAt.column })}</p>}
          <p className="json-error-message">{t("parseErrorDetail")} <code>{jsonMessage}</code></p>
        </div>
      )}
      {/* Any other error: its sentence in the page's language. */}
      {result && !result.ok && jsonMessage === null && <p className="cidr-error">{tx.error(result.error)}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <div className="dig-input-head">
              <h3 className="dig-section-title">{t("flat.title")}</h3>
              <button type="button" className="b64-copy" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? t("flat.copied") : t("flat.copy")}
              </button>
            </div>
            {/* The flattened output scrolls inside itself on a phone (istats-flat, 27/10/2026), never widening the page. */}
            <pre className="cidr-input mono json-input istats-flat">{text}</pre>
            {/* Share results: under the flattened text (the answer), at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
            </div>
          </section>

          <section className="dig-section">
            <h3 className="dig-section-title">{t("table.title")}</h3>
            {result.data.objects.map((obj) => (
              <div key={obj}>
                <p className="dig-record-type mono">{obj}</p>
                {/* dig-kv-stack: on a phone each long dotted key gets its own line, its value under it (27/10/2026). */}
                <dl className="dig-kv dig-kv-stack">
                  {result.data.stats.filter((s) => s.object === obj).map((s, i) => (
                    <div key={`${s.key}-${i}`}>
                      <dt className="mono">{s.key}</dt>
                      <dd className="mono">
                        {String(s.value)}
                        {s.from === "combined-64bit" && <span className="dig-record-type"> {t("table.combined")}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </section>

          {result.data.notes.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("notes.title")}</h3>
              <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}</ul>
            </section>
          )}
          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{tx.say(w)}</li>)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
