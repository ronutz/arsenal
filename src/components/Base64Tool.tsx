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
import { usePrefill } from "@/lib/use-prefill";

type Direction = "encode" | "decode";

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "foobar";

export default function Base64Tool() {
  const t = useTranslations("tools.base64");

  const [direction, setDirection] = useState<Direction>("encode");
  const [codec, setCodec] = useState<Codec>("base64");
  const [layers, setLayers] = useState<number>(1);
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

  // MULTI-LAYER (D-? PRIME 2026-07-08): attackers routinely double-, triple-, or
  // n-encode a payload to slip it past naive filters, so the tool can apply the
  // selected codec repeatedly. Encoding wraps N layers; decoding peels N layers.
  // Each pass reuses the same single-pass run() - the pure codec library is
  // untouched; only the iteration lives here. The first layer is the existing
  // one-pass result; further layers re-run over the previous layer's output.
  //
  // decodeFailed is reported for the layer that first fails to peel (so a user
  // asking for 3 layers on a 2-layer payload sees exactly where it stopped).
  const single = result ? result.decoded[codec] : null;

  // Encode: value -> codec -> codec -> ... (N times). Whitespace passed through
  // between passes exactly as the single-pass tool does.
  const encodeLayered = (): string | null => {
    if (!result) return null;
    let out = result.encoded[codec];
    for (let i = 1; i < layers; i++) out = run(out).encoded[codec];
    return out;
  };

  // Decode: peel N layers. Each pass must succeed; the first failure stops and
  // is surfaced. Returns the fully-peeled decoded layer, or null on failure.
  const decodeLayered = (): { text: string; isUtf8: boolean; byteLength: number } | null => {
    if (!single || !single.ok) return null;
    let layer = single;
    for (let i = 1; i < layers; i++) {
      const next = run(layer.text).decoded[codec];
      if (!next.ok) return null;
      layer = next;
    }
    return { text: layer.text, isUtf8: layer.isUtf8, byteLength: layer.byteLength };
  };

  const decodedLayered = direction === "decode" ? decodeLayered() : null;
  const decodeFailed = direction === "decode" && single !== null && (!single.ok || (layers > 1 && decodedLayered === null));
  const output: string | null = result
    ? direction === "encode"
      ? encodeLayered()
      : decodedLayered
        ? decodedLayered.text
        : null
    : null;
  // The layer whose reason to show: the single-pass reason if the first layer
  // failed, otherwise a generic "a deeper layer was not valid for this codec".
  const decoded = single;

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

  usePrefill(onChange);

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

        {/* Layers: how many times to apply the codec. Attackers commonly double,
            triple, or n-encode a payload to slip it past naive filters; encoding
            wraps N layers and decoding peels N (stopping at the first layer that
            fails to peel). The compute reads `layers` in render, so changing it
            recomputes with no extra wiring. (PRIME 2026-07-09.) */}
        <div className="seg seg--layers" role="group" aria-label={t("layersLabel")}>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              className={`seg-btn${layers === n ? " seg-btn--active" : ""}`}
              aria-pressed={layers === n}
              title={t("layersOptionTitle", { n })}
              onClick={() => {
                setLayers(n);
                setCopied(false);
              }}
            >
              {`\u00D7${n}`}
            </button>
          ))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="b64-input">
            {direction === "encode" ? t("inputLabelEncode") : t("inputLabelDecode")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setDirection("encode"); onChange(EXAMPLE); }}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>{t("clear")}</button>
          </div>
        </div>
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
