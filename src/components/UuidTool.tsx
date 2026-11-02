"use client";

// ============================================================================
// src/components/UuidTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE UUID TOOL (v4 + v7).
//
// PRIVACY: generation uses crypto.getRandomValues and inspection is pure
// parsing - everything runs in the browser, nothing is sent anywhere.
// Generation happens only on the button click (client side), so server
// prerender stays deterministic (the list starts empty). Inspection is sync
// (no async), so no race guard is needed. Output renders as escaped text; copy
// uses the local Clipboard API.
//
// Share results (2026-11-01): a button under the Inspect reading builds a
// link that carries the value in the Inspect box; the generated list is never
// carried. An arriving link (useShareArrival) fills the Inspect box as a
// paste would.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { generateV4, generateV7, inspectUuid, type UuidInfo } from "@/lib/tools/uuid";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { UUID_SHARE } from "@/lib/tools/uuid/share"; // this tool's share spec: the Inspect box as typed

type Version = "v4" | "v7";

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "550e8400-e29b-41d4-a716-446655440000";

export default function UuidTool() {
  const t = useTranslations("tools.uuid");

  const [version, setVersion] = useState<Version>("v4");
  const [generated, setGenerated] = useState<string[]>([]);
  const [inspectInput, setInspectInput] = useState("");
  const [inspectResult, setInspectResult] = useState<UuidInfo | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generate = useCallback(() => {
    const next = version === "v7" ? generateV7() : generateV4();
    setGenerated((list) => [next, ...list]);
  }, [version]);

  const onInspect = useCallback((value: string) => {
    setInspectInput(value);
    setInspectResult(value.trim() === "" ? null : inspectUuid(value));
  }, []);

  // An arriving share link: the value fills the Inspect box as a paste would, and the page reads it.
  useShareArrival(UUID_SHARE, (s) => onInspect(s.input)); // as typed
  // What Share results carries: the Inspect box (memoised; the spec's encode is a blank test).
  const share = useMemo(() => UUID_SHARE.encode({ input: inspectInput }), [inspectInput]); // the encoding

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
      {/* Generate */}
      <div className="seg-group">
        <div className="seg" role="group" aria-label={t("versionLabel")}>
          {(["v4", "v7"] as Version[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`seg-btn${version === v ? " seg-btn--active" : ""}`}
              aria-pressed={version === v}
              onClick={() => setVersion(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="uuid-controls">
        <button type="button" className="cidr-button" onClick={generate}>
          {t("generate")}
        </button>
        {generated.length > 0 && (
          <button
            type="button"
            className="cidr-button cidr-button--ghost"
            onClick={() => {
              setGenerated([]);
              setCopiedKey(null);
            }}
          >
            {t("clear")}
          </button>
        )}
      </div>
      <p className="cidr-privacy">
        <span className="cidr-lock" aria-hidden="true">
          ●
        </span>
        {t("runsLocally")}
      </p>

      {generated.length === 0 ? (
        <p className="jwt-verify-hint">{t("emptyHint")}</p>
      ) : (
        <ul className="uuid-list">
          {generated.map((u, i) => (
            <li className="uuid-item" key={`${u}-${i}`}>
              <code className="mono">{u}</code>
              <button
                type="button"
                className="b64-copy"
                onClick={() => copy(u, `gen-${i}`)}
              >
                {copiedKey === `gen-${i}` ? t("copied") : t("copy")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Inspect */}
      <div className="cidr-input-row uuid-inspect">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="uuid-inspect">
            {t("inspectLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => onInspect(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => onInspect("")}>{t("clear")}</button>
          </div>
        </div>
        <input
          id="uuid-inspect"
          type="text"
          className="cidr-input mono"
          value={inspectInput}
          onChange={(e) => onInspect(e.target.value)}
          placeholder={t("inspectPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {inspectResult && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <span
              className={`jwt-badge ${inspectResult.valid ? "jwt-badge--ok" : "jwt-badge--bad"}`}
            >
              {inspectResult.valid ? t("valid") : t("invalid")}
            </span>
            {inspectResult.valid && (
              <dl className="jwt-claims">
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("versionField")}</dt>
                  <dd className="jwt-claim-value">{t("versionValue", { version: inspectResult.version ?? "" })}</dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("variantField")}</dt>
                  <dd className="jwt-claim-value">{inspectResult.variant}</dd>
                </div>
                {inspectResult.timestampIso && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("timestampField")}</dt>
                    <dd className="jwt-claim-value mono">{inspectResult.timestampIso}</dd>
                  </div>
                )}
              </dl>
            )}
          </section>
        </div>
      )}

      {/* Share results: under the Inspect reading, at the start of its own row (disabled while the box is blank). */}
      <div className="rdap-ask-row">
        <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
      </div>
    </div>
  );
}
