"use client";

// ============================================================================
// src/components/HashTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE HASH TOOL (SHA-1/256/384/512).
//
// PRIVACY/SECURITY: hashing runs ENTIRELY IN THE BROWSER via Web Crypto - no
// fetch, no API, no server. run() is async and computes every algorithm at
// once, so switching the algorithm toggle just re-reads the result. A race
// guard (reqRef) discards stale async results when typing fast. Output renders
// as escaped text; copy uses the local Clipboard API only.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { run, HASH_ALGORITHMS, type HashAlgorithm, type HashResult } from "@/lib/tools/hash";

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "abc";

export default function HashTool() {
  const t = useTranslations("tools.hash");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<HashResult | null>(null);
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Monotonic request id: only the most recent async hash is allowed to win.
  const reqRef = useRef(0);

  const onChange = useCallback(async (next: string) => {
    setValue(next);
    setCopiedKey(null);
    if (next === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = await run(next);
    if (reqRef.current === myReq) setResult(r);
  }, []);

  const copy = useCallback(async (text: string, key: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // Clipboard unavailable: output stays selectable by hand.
    }
  }, []);

  const digest = result ? result.digests[algorithm] : null;
  const bits = digest ? digest.hex.length * 4 : 0;
  const bytes = digest ? digest.hex.length / 2 : 0;

  return (
    <div className="cidr-tool jwt-tool">
      <div className="seg-group">
        <div className="seg" role="group" aria-label={t("algorithmLabel")}>
          {HASH_ALGORITHMS.map((algo) => (
            <button
              key={algo}
              type="button"
              className={`seg-btn${algorithm === algo ? " seg-btn--active" : ""}`}
              aria-pressed={algorithm === algo}
              onClick={() => {
                setAlgorithm(algo);
                setCopiedKey(null);
              }}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="hash-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="hash-input"
          className="cidr-input jwt-input mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("inputPlaceholder")}
          rows={4}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="hash-privacy"
        />
        <p id="hash-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {digest && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="hash-algo-title">{algorithm}</h4>
            <p className="jwt-verify-hint">{t("bits", { bits, bytes })}</p>
            {algorithm === "SHA-1" && (
              <p className="jwt-badge jwt-badge--warn">{t("sha1Note")}</p>
            )}

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("hex")}</span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(digest.hex, "hex")}
                >
                  {copiedKey === "hex" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{digest.hex}</code>
              </pre>
            </div>

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("base64")}</span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(digest.base64, "base64")}
                >
                  {copiedKey === "base64" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{digest.base64}</code>
              </pre>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
