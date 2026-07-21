"use client";

// ============================================================================
// src/components/ZscalerSslBypassPlannerTool.tsx
// ----------------------------------------------------------------------------
// UI for the ZIA SSL bypass planner. Paste an asset list in the teaching
// grammar (one per line: <name> | pinned|clean | regulated|general |
// agent|no-agent) and read the deterministic plan back: the verdict per
// asset (Inspect / policy Do Not Inspect / ZCC bypass) with sourced
// rationale and a blind-spot ledger, the outside-backstop checklist
// whenever anything goes uninspected, and the standing ordering and
// honesty notes. All compute is local (D-19 comments throughout; house
// CSS classes; D-83 Example/Clear).
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { run, type PlanResult, type PlanVerdict } from "@/lib/tools/zscaler-ssl-bypass-planner";

/** Golden-vector-faithful sample: all three verdicts plus a comment line. */
const EXAMPLE_INPUT = [
  "# name | pinned|clean | regulated|general | agent|no-agent",
  "crm-desktop-app | pinned | general | agent",
  "iot-updater | pinned | general | no-agent",
  "patient-portal | clean | regulated | agent",
  "general-saas | clean | general | agent",
].join("\n");

export default function ZscalerSslBypassPlannerTool() {
  const t = useTranslations("tools.zscaler-ssl-bypass-planner");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Run the planner over the current input (local, synchronous). */
  function plan(text: string) {
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

  /** Localized label for a verdict. */
  function verdictLabel(v: PlanVerdict): string {
    if (v === "inspect") return t("verdictInspect");
    if (v === "dni-policy") return t("verdictDni");
    return t("verdictZcc");
  }

  return (
    <div>
      {/* ---- Input: header row with Example / Clear (D-83), then the paste box ---- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="zsbp-input">
          {t("inputLabel")}
        </label>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(EXAMPLE_INPUT);
              plan(EXAMPLE_INPUT);
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
        id="zsbp-input"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        rows={8}
        spellCheck={false}
        value={input}
        placeholder={t("placeholder")}
        onChange={(e) => {
          setInput(e.target.value);
          plan(e.target.value);
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

      {/* ---- The plan ---- */}
      {result && (
        <div className="ztc-result">
          {/* Summary counts */}
          <p className="persist-heading">{t("summaryTitle")}</p>
          <ul className="lbm-facts">
            <li>
              {t("countInspect")}: {result.counts.inspect}
            </li>
            <li>
              {t("countDni")}: {result.counts["dni-policy"]}
            </li>
            <li>
              {t("countZcc")}: {result.counts["zcc-bypass"]}
            </li>
          </ul>

          {/* Per-asset verdict cards */}
          {result.rows.map((row) => (
            <div className="tmsh-object" key={row.name}>
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{verdictLabel(row.verdict)}</span>
                <span className="tmsh-name">{row.name}</span>
              </div>
              <ul className="lbm-facts">
                {row.rationale.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              {row.blindSpots.length > 0 && (
                <>
                  <p className="ztc-section-title">{t("blindSpotsTitle")}</p>
                  <ul className="lbm-facts">
                    {row.blindSpots.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}

          {/* Backstop checklist - only when at least one asset is uninspected */}
          {result.backstops.length > 0 && (
            <>
              <p className="persist-heading">{t("backstopsTitle")}</p>
              <ol className="ztc-steps">
                {result.backstops.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </>
          )}

          {/* Standing notes: ordering doctrine + teaching-subset honesty */}
          <div className="ztc-notes">
            <p className="ztc-section-title">{t("notesTitle")}</p>
            <ul className="lbm-facts">
              {result.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
