"use client";

// ============================================================================
// src/components/TotpHotpTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE TOTP / HOTP TOOL.
//
// PRIVACY/SECURITY: the secret is a CREDENTIAL and never leaves the browser -
// every code is computed locally via Web Crypto (see src/lib/tools/totp-hotp),
// no fetch, no API, no server. run() is async and object-input.
//
// DETERMINISM: the engine is a pure function of its inputs and never reads a
// clock. "Use current time" is implemented HERE in the UI: a 1s interval feeds
// Date.now()/1000 into the engine and drives the countdown. Switch it off and
// you type an explicit Unix time, which is exactly how the RFC test vectors are
// reproduced. A race guard (reqRef) discards stale async results when typing.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  OTP_ALGORITHMS,
  SECRET_ENCODINGS,
  type OtpAlgorithm,
  type OtpMode,
  type SecretEncoding,
  type OtpResult,
} from "@/lib/tools/totp-hotp";

const MODES: readonly OtpMode[] = ["totp", "hotp"];
const DIGIT_CHOICES = [6, 7, 8] as const;

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "12345678901234567890";

export default function TotpHotpTool() {
  const t = useTranslations("tools.totp-hotp");

  // -- parameters --
  const [mode, setMode] = useState<OtpMode>("totp");
  const [algorithm, setAlgorithm] = useState<OtpAlgorithm>("SHA-1");
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [encoding, setEncoding] = useState<SecretEncoding>("base32");
  const [digits, setDigits] = useState(6);
  const [step, setStep] = useState(30);
  const [counter, setCounter] = useState(0);

  // -- time (TOTP) --
  const [useNow, setUseNow] = useState(true);
  const [manualTime, setManualTime] = useState(0);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // -- outputs --
  const [result, setResult] = useState<OtpResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // -- validation --
  const [checkCode, setCheckCode] = useState("");
  const [validCodes, setValidCodes] = useState<string[]>([]);

  const reqRef = useRef(0);

  // The effective timestamp the engine sees (live clock or the typed value).
  const timestamp = mode === "totp" ? (useNow ? now : manualTime) : 0;

  // Tick once a second only while TOTP + live clock is on (drives the countdown).
  useEffect(() => {
    if (mode !== "totp" || !useNow) return;
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [mode, useNow]);

  // Recompute the code (and, for validation, the neighbouring valid codes)
  // whenever any input changes.
  useEffect(() => {
    const myReq = ++reqRef.current;
    setCopied(false);
    (async () => {
      try {
        const base = { secret, secretEncoding: encoding, algorithm, digits } as const;
        const r =
          mode === "totp"
            ? await run({ mode, ...base, timestamp, step, t0: 0 })
            : await run({ mode, ...base, counter });
        if (reqRef.current !== myReq) return;
        setError(null);
        setResult(r);

        // Codes a real validator would accept: TOTP allows +/-1 step of drift;
        // HOTP accepts the exact counter (a look-ahead window is server policy).
        if (mode === "totp") {
          const neighbours = await Promise.all(
            [-1, 0, 1].map((d) =>
              run({ mode, ...base, timestamp: timestamp + d * step, step, t0: 0 }).then((x) => x.code)
            )
          );
          if (reqRef.current === myReq) setValidCodes(neighbours);
        } else {
          if (reqRef.current === myReq) setValidCodes([r.code]);
        }
      } catch (e) {
        if (reqRef.current !== myReq) return;
        setResult(null);
        setValidCodes([]);
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [mode, algorithm, secret, encoding, digits, step, counter, timestamp]);

  const copy = useCallback(async (text: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: the code stays selectable by hand */
    }
  }, []);

  const trimmedCheck = checkCode.replace(/\s/g, "");
  const checkState: "idle" | "match" | "nomatch" =
    trimmedCheck === "" ? "idle" : validCodes.includes(trimmedCheck) ? "match" : "nomatch";

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode: TOTP (time) vs HOTP (counter) */}
      <div className="seg-group">
        <div className="seg" role="group" aria-label={t("modeLabel")}>
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={`seg-btn${mode === m ? " seg-btn--active" : ""}`}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {t(m === "totp" ? "modeTotp" : "modeHotp")}
            </button>
          ))}
        </div>
      </div>

      {/* Algorithm */}
      <div className="seg-group">
        <div className="seg" role="group" aria-label={t("algorithmLabel")}>
          {OTP_ALGORITHMS.map((algo) => (
            <button
              key={algo}
              type="button"
              className={`seg-btn${algorithm === algo ? " seg-btn--active" : ""}`}
              aria-pressed={algorithm === algo}
              onClick={() => setAlgorithm(algo)}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      {/* Secret + its encoding */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="otp-secret">
            {t("secretLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setMode("hotp"); setEncoding("ascii"); setSecret(EXAMPLE); setCounter(0); }}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setSecret("")}>{t("clear")}</button>
          </div>
        </div>
        <input
          id="otp-secret"
          type="text"
          className="cidr-input mono"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={t("secretPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="otp-privacy"
        />
        <div className="seg seg--sub" role="group" aria-label={t("secretEncodingLabel")}>
          {SECRET_ENCODINGS.map((enc) => (
            <button
              key={enc}
              type="button"
              className={`seg-btn${encoding === enc ? " seg-btn--active" : ""}`}
              aria-pressed={encoding === enc}
              onClick={() => setEncoding(enc)}
            >
              {t(enc === "base32" ? "encBase32" : enc === "hex" ? "encHex" : "encAscii")}
            </button>
          ))}
        </div>
        <p id="otp-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {/* Digits + (TOTP) step or (HOTP) counter */}
      <div className="cidr-input-row otp-params">
        <div className="otp-param">
          <label className="cidr-label" htmlFor="otp-digits">
            {t("digitsLabel")}
          </label>
          <div className="seg" role="group" aria-label={t("digitsLabel")}>
            {DIGIT_CHOICES.map((d) => (
              <button
                key={d}
                type="button"
                className={`seg-btn${digits === d ? " seg-btn--active" : ""}`}
                aria-pressed={digits === d}
                onClick={() => setDigits(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {mode === "totp" ? (
          <div className="otp-param">
            <label className="cidr-label" htmlFor="otp-step">
              {t("stepLabel")}
            </label>
            <input
              id="otp-step"
              type="number"
              min={1}
              className="cidr-input mono otp-num"
              value={step}
              onChange={(e) => setStep(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        ) : (
          <div className="otp-param">
            <label className="cidr-label" htmlFor="otp-counter">
              {t("counterLabel")}
            </label>
            <input
              id="otp-counter"
              type="number"
              min={0}
              className="cidr-input mono otp-num"
              value={counter}
              onChange={(e) => setCounter(Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
            />
          </div>
        )}
      </div>

      {/* Time controls (TOTP only) */}
      {mode === "totp" && (
        <div className="cidr-input-row">
          <label className="cidr-label" htmlFor="otp-time">
            {t("timeLabel")}
          </label>
          <div className="otp-time-row">
            <label className="otp-now-toggle">
              <input
                type="checkbox"
                checked={useNow}
                onChange={(e) => setUseNow(e.target.checked)}
              />
              {t("useCurrentTime")}
            </label>
            <input
              id="otp-time"
              type="number"
              className="cidr-input mono otp-num"
              value={timestamp}
              disabled={useNow}
              onChange={(e) => setManualTime(Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
              aria-label={t("manualTime")}
            />
          </div>
        </div>
      )}

      {/* Error (bad secret) */}
      {error && (
        <p className="otp-error" role="alert">
          {t("secretError")}
        </p>
      )}

      {/* Generated code */}
      {result && !error && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <div className="b64-output-head">
              <span className="jwt-panel-title">{t("generatedCode")}</span>
              <button type="button" className="b64-copy" onClick={() => copy(result.code)}>
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <pre className="jwt-json otp-code">
              <code>{result.code}</code>
            </pre>
            {mode === "totp" && result.secondsRemaining !== undefined && (
              <p className="otp-countdown">{t("expiresIn", { seconds: result.secondsRemaining })}</p>
            )}
          </section>

          {/* Validate a code */}
          <section className="jwt-panel">
            <label className="cidr-label" htmlFor="otp-check">
              {t("validateLabel")}
            </label>
            <input
              id="otp-check"
              type="text"
              className="cidr-input mono"
              value={checkCode}
              onChange={(e) => setCheckCode(e.target.value)}
              placeholder={t("validatePlaceholder")}
              inputMode="numeric"
              autoComplete="off"
            />
            {checkState !== "idle" && (
              <p className={`otp-check-result otp-check-result--${checkState}`} role="status">
                <span aria-hidden="true">{checkState === "match" ? "✓ " : "✗ "}</span>
                {checkState === "match" ? t("validMatch") : t("validNoMatch")}
              </p>
            )}
            {mode === "totp" && <p className="hmac-build-note">{t("validWindowNote")}</p>}
          </section>

          {/* Explain: how this code was derived */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("explainHeading")}</h4>
            <dl className="otp-explain">
              <div className="otp-explain-row">
                <dt>{t("explainMovingFactor")}</dt>
                <dd className="mono">{result.movingFactor}</dd>
              </div>
              <div className="otp-explain-row">
                <dt>HMAC-{result.algorithm}</dt>
                <dd className="mono otp-explain-hmac">{result.hmacHex}</dd>
              </div>
              <div className="otp-explain-row">
                <dt>{t("explainOffset")}</dt>
                <dd className="mono">{result.offset}</dd>
              </div>
              <div className="otp-explain-row">
                <dt>{t("explainTruncated")}</dt>
                <dd className="mono">
                  {result.binaryCode} % 10^{result.digits} = {result.code}
                </dd>
              </div>
            </dl>
            <p className="hmac-build-note">{t("explainNote")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
