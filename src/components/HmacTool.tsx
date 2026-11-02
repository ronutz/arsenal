"use client";

// ============================================================================
// src/components/HmacTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE HMAC TOOL (keyed SHA-256/384/512).
//
// PRIVACY/SECURITY: the key is a SECRET and never leaves the browser - HMAC is
// computed locally via Web Crypto, no fetch, no API, no server. run() is async
// and object-input (message + key + algorithm). A race guard (reqRef) discards
// stale async results when typing fast. A result is only shown when BOTH a
// message and a key are present. Output renders as escaped text; copy uses the
// local Clipboard API only.
//
// SHARE RESULTS (2026-10-27): under the MAC, a button builds a link only when
// pressed, carrying the message and the algorithm, never the key (except RFC
// 4231's published test key, "Jefe") and never the MAC (src/lib/tools/hmac/
// share.ts, posture derived). An arriving link (useShareArrival) fills the
// message and the algorithm; the key box takes the published key or keeps
// the reader's own, and a note says the key never travels while it is empty.
// Example and Clear now recompute (2026-10-27): before, they set the fields
// without computing, so Example showed no MAC and Clear left the old one.
// ============================================================================

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { run, HMAC_ALGORITHMS, type HmacAlgorithm, type HmacResult } from "@/lib/tools/hmac";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { HMAC_PUBLISHED_KEY, HMAC_SHARE } from "@/lib/tools/hmac/share"; // this tool's share spec: the message, never the key

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE_MSG = "what do ya want for nothing?";
const EXAMPLE_KEY = "Jefe";

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the button is disabled

export default function HmacTool() {
  const t = useTranslations("tools.hmac");

  const [message, setMessage] = useState("");
  const [keyText, setKeyText] = useState("");
  const [algorithm, setAlgorithm] = useState<HmacAlgorithm>("SHA-256");
  const [result, setResult] = useState<HmacResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Monotonic request id: only the most recent async HMAC is allowed to win.
  const reqRef = useRef(0);

  const recompute = useCallback(async (msg: string, key: string, algo: HmacAlgorithm) => {
    setCopiedKey(null);
    if (msg === "" || key === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = await run({ message: msg, key, algorithm: algo });
    if (reqRef.current === myReq) setResult(r);
  }, []);

  // True after a link arrived without a key; the note shows while the key box is empty.
  const [awaitingKey, setAwaitingKey] = useState(false);
  // An arriving share link: the message and the algorithm fill the page; the key box takes the published key or keeps its value.
  useShareArrival(HMAC_SHARE, (s) => {
    const key = s.key ?? keyText; // the published key, or what the reader typed
    setMessage(s.message); // the message
    setAlgorithm(s.algorithm); // the algorithm
    setKeyText(key); // the key box
    setAwaitingKey(s.key === null); // the note, while the box is empty
    void recompute(s.message, key, s.algorithm); // as a paste would
  });
  // What Share results may carry: the message and the algorithm, and the key only when it is the published one.
  const share = useMemo<ShareEncoding>(() => (result ? HMAC_SHARE.encode({ message, key: keyText, algorithm, hasResult: true }) : NOTHING), [result, message, keyText, algorithm]); // memoised

  const copy = useCallback(async (text: string, which: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(which);
      window.setTimeout(() => setCopiedKey((k) => (k === which ? null : k)), 1500);
    } catch {
      // Clipboard unavailable: output stays selectable by hand.
    }
  }, []);

  return (
    <div className="cidr-tool jwt-tool">
      <div className="seg-group">
        <div className="seg" role="group" aria-label={t("algorithmLabel")}>
          {HMAC_ALGORITHMS.map((algo) => (
            <button
              key={algo}
              type="button"
              className={`seg-btn${algorithm === algo ? " seg-btn--active" : ""}`}
              aria-pressed={algorithm === algo}
              onClick={() => {
                setAlgorithm(algo);
                recompute(message, keyText, algo);
              }}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="hmac-message">
            {t("messageLabel")}
          </label>
          <div className="dig-input-actions">
            {/* Example and Clear compute as typing does (2026-10-27: they set the fields without computing). */}
            <button type="button" className="b64-copy" onClick={() => { setMessage(EXAMPLE_MSG); setKeyText(EXAMPLE_KEY); void recompute(EXAMPLE_MSG, EXAMPLE_KEY, algorithm); }}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setMessage(""); setKeyText(""); void recompute("", "", algorithm); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="hmac-message"
          className="cidr-input jwt-input mono"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            recompute(e.target.value, keyText, algorithm);
          }}
          placeholder={t("messagePlaceholder")}
          rows={3}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="hmac-key">
          {t("keyLabel")}
        </label>
        <input
          id="hmac-key"
          type="text"
          className="cidr-input mono"
          value={keyText}
          onChange={(e) => {
            setKeyText(e.target.value);
            recompute(message, e.target.value, algorithm);
          }}
          placeholder={t("keyPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="hmac-privacy"
        />
        <p id="hmac-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
        {/* After a link without a key: why the box is empty, and what to type. */}
        {awaitingKey && keyText === "" && <p className="cipher-note">{t("share.arrived")}</p>}
      </div>

      {result && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="hash-algo-title">HMAC-{result.algorithm}</h4>

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("hex")}</span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(result.hex, "hex")}
                >
                  {copiedKey === "hex" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{result.hex}</code>
              </pre>
            </div>

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("base64")}</span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(result.base64, "base64")}
                >
                  {copiedKey === "base64" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{result.base64}</code>
              </pre>
            </div>
          </section>

          {/* Share results: under the MAC; the carries line says whether the key goes. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries", { key: keyText === HMAC_PUBLISHED_KEY ? "yes" : "no" })} details={[t("share.caution")]} title={t("name")} />
          </div>
        </div>
      )}

      {/* HMAC construction (always shown; educational; theme-aware SVG). The
          two-pass nested hash: the key is XORed with a fixed inner pad (ipad)
          around the message, hashed, then XORed with an outer pad (opad) around
          that result and hashed again. Notation (K ⊕ ipad, ∥, H, HMAC) is kept
          verbatim, language-neutral; the word labels and note are localized. */}
      <section className="jwt-panel hmac-build-panel">
        <h4 className="jwt-panel-title">{t("struct.heading")}</h4>
        <svg
          className="hmac-build-svg"
          viewBox="0 0 680 216"
          role="img"
          aria-label={t("struct.heading")}
        >
          {/* Band 1 — inner inputs: (K ⊕ ipad) ∥ message */}
          <rect x={160} y={18} width={170} height={32} rx={6} fill="var(--accent-primary)" fillOpacity={0.12} stroke="var(--accent-primary)" strokeWidth={1.5} />
          <text x={245} y={39} textAnchor="middle" className="hmac-build-label">K ⊕ ipad</text>
          <text x={340} y={42} textAnchor="middle" className="hmac-build-concat">∥</text>
          <rect x={350} y={18} width={170} height={32} rx={6} fill="var(--accent-amber)" fillOpacity={0.12} stroke="var(--accent-amber)" strokeWidth={1.5} />
          <text x={435} y={39} textAnchor="middle" className="hmac-build-label">{t("messageLabel")}</text>
          {/* Arrow 1 → first hash */}
          <line x1={340} y1={52} x2={340} y2={64} stroke="var(--border-strong)" strokeWidth={1.5} />
          <path d="M336 63 L340 69 L344 63 Z" fill="var(--border-strong)" />
          <text x={350} y={65} className="hmac-build-hlabel">H</text>
          {/* Band 2 — inner hash */}
          <rect x={255} y={70} width={170} height={32} rx={6} fill="var(--surface-base)" stroke="var(--border-subtle)" strokeWidth={1} />
          <text x={340} y={91} textAnchor="middle" className="hmac-build-label">{t("struct.innerHash")}</text>
          {/* Arrow 2 → outer inputs */}
          <line x1={340} y1={104} x2={340} y2={116} stroke="var(--border-strong)" strokeWidth={1.5} />
          <path d="M336 115 L340 121 L344 115 Z" fill="var(--border-strong)" />
          {/* Band 3 — outer inputs: (K ⊕ opad) ∥ inner hash */}
          <rect x={160} y={122} width={170} height={32} rx={6} fill="var(--accent-primary)" fillOpacity={0.12} stroke="var(--accent-primary)" strokeWidth={1.5} />
          <text x={245} y={143} textAnchor="middle" className="hmac-build-label">K ⊕ opad</text>
          <text x={340} y={146} textAnchor="middle" className="hmac-build-concat">∥</text>
          <rect x={350} y={122} width={170} height={32} rx={6} fill="var(--surface-base)" stroke="var(--border-subtle)" strokeWidth={1} />
          <text x={435} y={143} textAnchor="middle" className="hmac-build-label">{t("struct.innerHash")}</text>
          {/* Arrow 3 → second hash */}
          <line x1={340} y1={156} x2={340} y2={168} stroke="var(--border-strong)" strokeWidth={1.5} />
          <path d="M336 167 L340 173 L344 167 Z" fill="var(--border-strong)" />
          <text x={350} y={169} className="hmac-build-hlabel">H</text>
          {/* Band 4 — HMAC output */}
          <rect x={255} y={174} width={170} height={32} rx={6} fill="var(--accent-green)" fillOpacity={0.12} stroke="var(--accent-green)" strokeWidth={1.5} />
          <text x={340} y={195} textAnchor="middle" className="hmac-build-label">HMAC</text>
        </svg>
        <p className="hmac-build-note">{t("struct.note")}</p>
      </section>
    </div>
  );
}
