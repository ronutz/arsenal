"use client";

// ============================================================================
// src/components/ZccForwardingDecisionExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the ZCC forwarding decision explainer (descoped form per the
// ratified clause). Paste a posture in the setting grammar and read the
// documented spine back layer by layer - network state, ZIA action,
// Z-Tunnel semantics, ZPA action - then the bypass-mechanism ledger and
// the first-class why-explainer-not-simulator statement. All compute is
// local (D-19 comments; house CSS classes; D-83 Example/Clear).
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { run, type ExplainerResult, type DecisionStep } from "@/lib/tools/zcc-forwarding-decision-explainer";

/** Golden-vector-faithful sample: the RA-recommended roaming posture. */
const EXAMPLE_INPUT = [
  "# <key> = <value>",
  "network = off-trusted",
  "zia-action = tunnel",
  "tunnel = zt2",
  "zpa-action = tunnel",
].join("\n");

export default function ZccForwardingDecisionExplainerTool() {
  const t = useTranslations("tools.zcc-forwarding-decision-explainer");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ExplainerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Run the explainer over the current input (local, synchronous). */
  function explain(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(run(trimmed));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /** Localized label for a spine layer. */
  function layerLabel(layer: DecisionStep["layer"]): string {
    if (layer === "network") return t("layerNetwork");
    if (layer === "zia") return t("layerZia");
    if (layer === "tunnel") return t("layerTunnel");
    return t("layerZpa");
  }

  return (
    <div>
      {/* ---- Input: header row with Example / Clear (D-83), then the paste box ---- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="zccfde-input">
          {t("inputLabel")}
        </label>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(EXAMPLE_INPUT);
              explain(EXAMPLE_INPUT);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput("");
              setResult(null);
              setError(null);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>
      <textarea
        id="zccfde-input"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        rows={8}
        spellCheck={false}
        value={input}
        placeholder={t("placeholder")}
        onChange={(e) => {
          setInput(e.target.value);
          explain(e.target.value);
        }}
      />

      {/* ---- Errors: helpful, line-anchored ---- */}
      {error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{error}</p>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!result && !error && <p className="ztc-empty">{t("emptyState")}</p>}

      {/* ---- The documented spine ---- */}
      {result && (
        <div className="ztc-result">
          <p className="persist-heading">{t("spineTitle")}</p>
          {result.steps.map((s, idx) => (
            <div className="tmsh-object" key={idx}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{layerLabel(s.layer)}</span>
                <span className="tmsh-name">{s.title}</span>
              </div>
              <ul className="lbm-facts">
                {s.lines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* The bypass layer: explained mechanisms, adjudicated by no one */}
          <p className="persist-heading">{t("bypassTitle")}</p>
          <ul className="lbm-facts">
            {result.bypassLedger.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>

          {/* Why an explainer and not a simulator - first-class output */}
          <div className="ztc-notes">
            <p className="ztc-section-title">{t("honestyTitle")}</p>
            <ul className="lbm-facts">
              {result.honesty.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
            <p className="ztc-section-title">{t("notesTitle")}</p>
            <ul className="lbm-facts">
              {result.notes.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
