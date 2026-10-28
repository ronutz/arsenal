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
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  decodeStats, statsToText, StatsDecodeError, type StatsDecode,
} from "@/lib/tools/icontrol-rest-stats-decoder";
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
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo<{ ok: true; data: StatsDecode } | { ok: false; message: string } | null>(() => {
    if (!input.trim()) return null;
    try { return { ok: true, data: decodeStats(input) }; }
    catch (e) {
      if (e instanceof StatsDecodeError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  const text = result?.ok ? statsToText(result.data) : "";
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

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

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
              <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </section>
          )}
          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
