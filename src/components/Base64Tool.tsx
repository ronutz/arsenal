"use client";

// ============================================================================
// src/components/Base64Tool.tsx
// ----------------------------------------------------------------------------
// THE LIVE UNIFIED-CODEC TOOL (base64, base64url, base32, base16/hex, percent).
//
// PRIVACY/SECURITY: encoding and decoding run ENTIRELY IN THE BROWSER via the
// local codec module - no fetch, no API, no server. The single run() computes
// every codec in BOTH directions at once, so flipping the Encode/Decode toggle
// or switching codec just re-reads the one result (no recompute, nothing
// re-sent). Output is rendered as escaped text through React; copy uses the
// local Clipboard API only.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { run, CODECS, type Codec, type CodecResult } from "@/lib/tools/base64";

type Direction = "encode" | "decode";

export default function Base64Tool() {
  const t = useTranslations("tools.base64");

  const [direction, setDirection] = useState<Direction>("encode");
  const [codec, setCodec] = useState<Codec>("base64");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<CodecResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Whitespace is meaningful when ENCODING, so the raw value is passed through;
  // decoding strips whitespace internally. Clear only on a truly empty field.
  const onChange = useCallback((next: string) => {
    setValue(next);
    setCopied(false);
    setResult(next === "" ? null : run(next));
  }, []);

  // What to display, derived from the one result plus the current toggles.
  const decoded = result ? result.decoded[codec] : null;
  const decodeFailed = direction === "decode" && decoded !== null && !decoded.ok;
  const output: string | null = result
    ? direction === "encode"
      ? result.encoded[codec]
      : decoded && decoded.ok
        ? decoded.text
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
      {/* Direction + codec controls */}
      <div className="seg-group">
        <div className="seg" role="group" aria-label={t("directionLabel")}>
          {(["encode", "decode"] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`seg-btn${direction === d ? " seg-btn--active" : ""}`}
              aria-pressed={direction === d}
              onClick={() => {
                setDirection(d);
                setCopied(false);
              }}
            >
              {t(`direction.${d}`)}
            </button>
          ))}
        </div>

        <div className="seg seg--codec" role="group" aria-label={t("codecLabel")}>
          {CODECS.map((c) => (
            <button
              key={c}
              type="button"
              className={`seg-btn${codec === c ? " seg-btn--active" : ""}`}
              aria-pressed={codec === c}
              onClick={() => {
                setCodec(c);
                setCopied(false);
              }}
            >
              {t(`codec.${c}`)}
            </button>
          ))}
        </div>
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

      {decodeFailed && decoded !== null && !decoded.ok && (
        <p className="cidr-error" role="alert">
          {t(`decodeErrors.${decoded.reason}`)}
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
            {direction === "decode" && decoded && decoded.ok && (
              <p
                className={
                  decoded.isUtf8 ? "jwt-verify-hint" : "jwt-badge jwt-badge--warn"
                }
              >
                {decoded.isUtf8
                  ? t("decodedBytes", { bytes: decoded.byteLength })
                  : t("notUtf8", { bytes: decoded.byteLength })}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
