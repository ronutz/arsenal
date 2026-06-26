"use client";

// ============================================================================
// src/components/Base64Tool.tsx
// ----------------------------------------------------------------------------
// THE LIVE BASE64 / BASE64URL TOOL.
//
// PRIVACY/SECURITY: encoding and decoding run ENTIRELY IN THE BROWSER via the
// local base64 module - no fetch, no API, no server. The single run() computes
// both directions, so flipping the Encode/Decode or Standard/URL-safe toggle
// just re-reads the result (no recompute, nothing re-sent). Output is rendered
// as escaped text through React; copy uses the local Clipboard API only.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type Base64Result } from "@/lib/tools/base64";

type Direction = "encode" | "decode";
type Variant = "standard" | "urlsafe";

export default function Base64Tool() {
  const t = useTranslations("tools.base64");

  const [direction, setDirection] = useState<Direction>("encode");
  const [variant, setVariant] = useState<Variant>("standard");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Base64Result | null>(null);
  const [copied, setCopied] = useState(false);

  // Whitespace is meaningful when ENCODING, so the raw value is passed through;
  // decoding strips whitespace internally. Clear only on a truly empty field.
  const onChange = useCallback((next: string) => {
    setValue(next);
    setCopied(false);
    setResult(next === "" ? null : run(next));
  }, []);

  // What to display, derived from the one result plus the current toggles.
  const decodeFailed =
    direction === "decode" && result !== null && !result.decoded.ok;
  const output: string | null = result
    ? direction === "encode"
      ? variant === "standard"
        ? result.encoded.standard
        : result.encoded.urlSafe
      : result.decoded.ok
        ? result.decoded.text
        : null
    : null;

  const onCopy = useCallback(async () => {
    if (output == null || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard denied/unavailable: the output stays selectable by hand.
    }
  }, [output]);

  return (
    <div className="cidr-tool jwt-tool">
      {/* Direction + variant controls */}
      <div className="seg-group">
        <div className="seg" role="group" aria-label={t("directionLabel")}>
          <button
            type="button"
            className={`seg-btn${direction === "encode" ? " seg-btn--active" : ""}`}
            aria-pressed={direction === "encode"}
            onClick={() => {
              setDirection("encode");
              setCopied(false);
            }}
          >
            {t("direction.encode")}
          </button>
          <button
            type="button"
            className={`seg-btn${direction === "decode" ? " seg-btn--active" : ""}`}
            aria-pressed={direction === "decode"}
            onClick={() => {
              setDirection("decode");
              setCopied(false);
            }}
          >
            {t("direction.decode")}
          </button>
        </div>

        {direction === "encode" && (
          <div className="seg" role="group" aria-label={t("variantLabel")}>
            <button
              type="button"
              className={`seg-btn${variant === "standard" ? " seg-btn--active" : ""}`}
              aria-pressed={variant === "standard"}
              onClick={() => setVariant("standard")}
            >
              {t("variant.standard")}
            </button>
            <button
              type="button"
              className={`seg-btn${variant === "urlsafe" ? " seg-btn--active" : ""}`}
              aria-pressed={variant === "urlsafe"}
              onClick={() => setVariant("urlsafe")}
            >
              {t("variant.urlsafe")}
            </button>
          </div>
        )}
      </div>

      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="b64-input">
          {direction === "encode" ? t("inputLabelEncode") : t("inputLabelDecode")}
        </label>
        <textarea
          id="b64-input"
          className="cidr-input jwt-input mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            direction === "encode" ? t("placeholderEncode") : t("placeholderDecode")
          }
          rows={4}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="b64-privacy"
        />
        <p id="b64-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {decodeFailed && result !== null && !result.decoded.ok && (
        <p className="cidr-error" role="alert">
          {t(`decodeErrors.${result.decoded.reason}`)}
        </p>
      )}

      {output !== null && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <div className="b64-output-head">
              <h4 className="jwt-panel-title">
                {direction === "encode" ? t("outputEncode") : t("outputDecode")}
              </h4>
              <button type="button" className="b64-copy" onClick={onCopy}>
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <pre className="jwt-json">
              <code>{output || t("emptyOutput")}</code>
            </pre>
            {direction === "decode" && result?.decoded.ok && (
              <p
                className={
                  result.decoded.isUtf8 ? "jwt-verify-hint" : "jwt-badge jwt-badge--warn"
                }
              >
                {result.decoded.isUtf8
                  ? t("decodedBytes", { bytes: result.decoded.byteLength })
                  : t("notUtf8", { bytes: result.decoded.byteLength })}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
