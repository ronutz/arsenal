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
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { run, HMAC_ALGORITHMS, type HmacAlgorithm, type HmacResult } from "@/lib/tools/hmac";

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
        <label className="cidr-label" htmlFor="hmac-message">
          {t("messageLabel")}
        </label>
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
