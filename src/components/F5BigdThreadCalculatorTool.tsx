// ============================================================================
// src/components/F5BigdThreadCalculatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the BigD thread calculator (BIG-IP 21.1 multi-threaded bigd sizing).
// One input, two documented formulas: type a vCPU count with an optional
// "ht" / "normal" and see the automatic thread count F5's 21.1.0 release notes
// derive, plus the bigd.numprocs override cap and the 15,000-monitor ceiling.
// Where F5's formula yields a fraction, BOTH the exact value and its floor are
// shown, with an honest note that the docs state no rounding rule.
// Styling reuses the established tool vocabulary (cidr-* input stack,
// jwt-results panels, cipher-note) - no new CSS classes.
// ============================================================================
"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  BigdCalcError,
  type BigdCalcResult,
} from "@/lib/tools/f5-bigd-thread-calculator";

// D-83 Example sample - verbatim from this tool's golden vectors
// (platform-r10900): showcases the platform-to-hyperthreading map.
const EXAMPLE = "8 r10900";

export default function F5BigdThreadCalculatorTool() {
  const t = useTranslations("tools.f5-bigd-thread-calculator");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<BigdCalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") {
        setResult(null);
        setError(null);
        return;
      }
      try {
        setResult(run(trimmed));
        setError(null);
      } catch (e) {
        const code = e instanceof BigdCalcError ? e.code : "format";
        setError(t(`errors.${code}`));
        setResult(null);
      }
    },
    [t],
  );

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      compute(next);
    },
    [compute],
  );

  /** Render one formula panel (ht or normal). */
  const formulaPanel = (kind: "ht" | "normal", r: BigdCalcResult) => {
    const f = kind === "ht" ? r.ht : r.normal;
    const emphasized = r.requested === null || r.requested === kind;
    return (
      <section className="jwt-panel" style={emphasized ? undefined : { opacity: 0.75 }}>
        <h4 className="jwt-panel-title">{t(`${kind}.heading`)}</h4>
        <p className="jwt-claim-value mono">{t(`${kind}.formula`)}</p>
        <div className="jwt-badges" style={{ marginTop: "0.5rem" }}>
          <span className="jwt-badge jwt-badge--ok mono">
            {f.isInteger
              ? t("threadsExact", { n: f.exactDisplay })
              : t("threadsFloor", { floor: f.floor, exact: f.exactDisplay })}
          </span>
        </div>
        {!f.isInteger && <p className="cipher-note">{t("fractionNote")}</p>}
        {kind === "normal" && f.floor === 0 && (
          <p className="cipher-note">{t("zeroNote")}</p>
        )}
      </section>
    );
  };

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="bigd-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the sample is golden-vector-faithful. */}
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="bigd-input"
          className="cidr-input mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("inputPlaceholder")}
          aria-describedby="bigd-privacy"
          autoComplete="off"
          spellCheck={false}
        />
        <p id="bigd-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="jwt-results">
          {/* Platform verdict first: which formula this platform selects (or
              why it selects none), plus the 21.x-applicability caveat for the
              hyperthreaded museum pieces. All mappings are sourced (rSeries/
              VELOS clouddocs, K15003); the honest cases stay honest. */}
          {result.platform && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">
                {t("platform.heading")}{" "}
                <span className="mono">{t(`platform.labels.${result.platform.id}`)}</span>
              </h4>
              {!result.platform.appliesTo21x && (
                <p className="cipher-note">{t("platform.not21x")}</p>
              )}
              {result.platform.ht === "ht" && (
                <p className="cipher-note">{t("platform.htNote")}</p>
              )}
              {result.platform.ht === "normal" && (
                <p className="cipher-note">{t("platform.normalNote")}</p>
              )}
              {result.platform.id === "ve" && (
                <p className="cipher-note">{t("platform.veNote")}</p>
              )}
              {result.platform.id === "rseries-ambiguous" && (
                <p className="cipher-note">{t("platform.rseriesAmbiguous")}</p>
              )}
              {result.modeSource === "explicit" && result.platform.ht !== "depends" &&
                result.requested !== result.platform.ht && (
                  <p className="cipher-note">{t("platform.overridden")}</p>
                )}
            </section>
          )}
          {formulaPanel("ht", result)}
          {formulaPanel("normal", result)}

          {/* The override and the ceiling: the two facts around the formulas. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("config.heading")}</h4>
            <dl className="jwt-claims">
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("config.capLabel")}</dt>
                <dd className="jwt-claim-value mono">{result.numprocsCap}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("config.ceilingLabel")}</dt>
                <dd className="jwt-claim-value mono">15,000</dd>
              </div>
            </dl>
            <p className="cipher-note">{t("config.numprocsNote")}</p>
            <p className="cipher-note">{t("verifyNote")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
