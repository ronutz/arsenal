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

type FlowActor = "client" | "server";
const ACTOR_COLOR: Record<FlowActor, string> = {
  client: "var(--accent-primary)",
  server: "var(--accent-amber)",
};

// The canonical PKCE (S256) authorization-code flow. Static and educational:
// it describes the protocol, independent of the verifier the tool generates.
// `code` is a protocol token (kept verbatim); `labelKey` is localized chrome.
const FLOW: { actor: FlowActor; labelKey: string; code: string }[] = [
  { actor: "client", labelKey: "s1", code: "code_verifier" },
  { actor: "client", labelKey: "s2", code: "code_challenge" },
  { actor: "client", labelKey: "s3", code: "/authorize" },
  { actor: "server", labelKey: "s4", code: "" },
  { actor: "server", labelKey: "s5", code: "authorization_code" },
  { actor: "client", labelKey: "s6", code: "/token" },
  { actor: "server", labelKey: "s7", code: "S256(verifier) == challenge" },
  { actor: "server", labelKey: "s8", code: "access + refresh" },
];

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

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
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="pkce-verifier">
            {t("verifierLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setVerifier(EXAMPLE); void recompute(EXAMPLE); }}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setVerifier(""); void recompute(""); }}>{t("clear")}</button>
          </div>
        </div>
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

      <section className="jwt-panel pkce-flow-panel">
        <h4 className="hash-algo-title">{t("flowHeading")}</h4>
        <div className="pkce-flow-legend">
          <span className="pkce-flow-leg">
            <span className="pkce-flow-swatch" style={{ background: ACTOR_COLOR.client }} />
            {t("laneClient")}
          </span>
          <span className="pkce-flow-leg">
            <span className="pkce-flow-swatch" style={{ background: ACTOR_COLOR.server }} />
            {t("laneServer")}
          </span>
        </div>
        <svg
          className="pkce-flow-svg"
          viewBox={`0 0 680 ${22 + (FLOW.length - 1) * 58 + 16 + 24}`}
          role="img"
          aria-label={t("flowHeading")}
        >
          <line
            x1="92"
            y1={22 + 16}
            x2="92"
            y2={22 + (FLOW.length - 1) * 58 + 16}
            stroke="var(--border-strong)"
            strokeWidth="2"
          />
          {FLOW.map((step, i) => {
            const cy = 22 + i * 58 + 16;
            const color = ACTOR_COLOR[step.actor];
            return (
              <g key={step.labelKey}>
                <text x="74" y={cy + 4} textAnchor="end" className="pkce-flow-num">
                  {i + 1}
                </text>
                <line x1="99" y1={cy} x2="118" y2={cy} stroke="var(--border-strong)" strokeWidth="2" />
                <circle cx="92" cy={cy} r="6" fill={color} stroke="var(--canvas-primary)" strokeWidth="2" />
                <rect x="118" y={cy - 19} width="552" height="38" rx="6" fill="var(--surface-base)" stroke="var(--border-subtle)" />
                <rect x="118" y={cy - 19} width="3" height="38" fill={color} />
                <text x="132" y={cy - 3} className="pkce-flow-label">
                  {t(step.labelKey)}
                </text>
                {step.code && (
                  <text x="132" y={cy + 12} className="pkce-flow-code">
                    {step.code}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </section>
    </div>
  );
}
