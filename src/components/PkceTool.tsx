"use client";

// ============================================================================
// src/components/PkceTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE PKCE TOOL (OAuth 2.0, RFC 7636).
//
// PRIVACY/SECURITY: everything runs in the browser - the random verifier comes
// from crypto.getRandomValues, the S256 challenge from Web Crypto SHA-256, and
// nothing is sent anywhere. The verifier is a secret. run() is async, so a race
// guard (reqRef) discards stale results when typing fast. Generation happens
// only on the button click (client side), so server prerender stays
// deterministic. Output renders as escaped text; copy uses the local Clipboard.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { run, generateVerifier, type PkceResult } from "@/lib/tools/pkce";

export default function PkceTool() {
  const t = useTranslations("tools.pkce");

  const [verifier, setVerifier] = useState("");
  const [result, setResult] = useState<PkceResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Monotonic request id: only the most recent async derivation is allowed to win.
  const reqRef = useRef(0);

  const recompute = useCallback(async (v: string) => {
    setCopiedKey(null);
    if (v === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = await run(v);
    if (reqRef.current === myReq) setResult(r);
  }, []);

  const generate = useCallback(() => {
    const v = generateVerifier();
    setVerifier(v);
    void recompute(v);
  }, [recompute]);

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
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="pkce-verifier">
          {t("verifierLabel")}
        </label>
        <div className="cidr-controls">
          <input
            id="pkce-verifier"
            type="text"
            className="cidr-input mono"
            value={verifier}
            onChange={(e) => {
              setVerifier(e.target.value);
              void recompute(e.target.value);
            }}
            placeholder={t("verifierPlaceholder")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="pkce-privacy"
          />
          <button type="button" className="cidr-button" onClick={generate}>
            {t("generate")}
          </button>
        </div>
        <p id="pkce-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {result && (
        <div className="jwt-results">
          <div className="pkce-validity">
            <span
              className={`jwt-badge ${result.lengthValid ? "jwt-badge--ok" : "jwt-badge--bad"}`}
            >
              {t("lengthBadge", { length: result.length })}
            </span>
            <span
              className={`jwt-badge ${result.charsetValid ? "jwt-badge--ok" : "jwt-badge--bad"}`}
            >
              {result.charsetValid ? t("charsetOk") : t("charsetBad")}
            </span>
          </div>

          <section className="jwt-panel">
            <h4 className="hash-algo-title">{t("s256Title")}</h4>
            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("encodingLabel")}</span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(result.s256Challenge, "s256")}
                >
                  {copiedKey === "s256" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{result.s256Challenge}</code>
              </pre>
            </div>
          </section>

          <section className="jwt-panel">
            <h4 className="hash-algo-title">{t("plainTitle")}</h4>
            <p className="jwt-badge jwt-badge--warn">{t("plainNote")}</p>
            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("plainValueLabel")}</span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(result.plainChallenge, "plain")}
                >
                  {copiedKey === "plain" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{result.plainChallenge}</code>
              </pre>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
