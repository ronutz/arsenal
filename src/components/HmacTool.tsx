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
    </div>
  );
}
