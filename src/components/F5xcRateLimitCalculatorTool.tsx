"use client";

// ============================================================================
// src/components/F5xcRateLimitCalculatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC rate-limit calculator. Structured inputs (Number, Per Period,
// Periods, Burst Multiplier, Mitigation, and a lockout when Block) compute live
// into the effective rate, burst ceiling, and exact leaky-bucket behavior.
// Styling reuses the established tool vocabulary (cidr-* input stack, jwt-*
// result panels, cipher-note); field grid uses inline styles, no new CSS.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  calculateRateLimit,
  type PerPeriod,
  type Mitigation,
  type DurationUnit,
} from "@/lib/tools/f5xc-rate-limit-calculator/compute";

const GRID: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" };

export default function F5xcRateLimitCalculatorTool() {
  const t = useTranslations("tools.f5xc-rate-limit-calculator");

  const [number, setNumber] = useState("15");
  const [perPeriod, setPerPeriod] = useState<PerPeriod>("Seconds");
  const [periods, setPeriods] = useState("1");
  const [burst, setBurst] = useState("1");
  const [mitigation, setMitigation] = useState<Mitigation>("Disabled");
  const [lockoutValue, setLockoutValue] = useState("30");
  const [lockoutUnit, setLockoutUnit] = useState<DurationUnit>("Seconds");

  const result = useMemo(() => {
    if (number.trim() === "" || periods.trim() === "") return null;
    return calculateRateLimit({
      number: Number(number),
      perPeriod,
      periods: Number(periods),
      burstMultiplier: burst.trim() === "" ? 1 : Number(burst),
      mitigation,
      lockoutValue: mitigation === "Block" ? Number(lockoutValue) : undefined,
      lockoutUnit,
    });
  }, [number, perPeriod, periods, burst, mitigation, lockoutValue, lockoutUnit]);

  const loadExample = useCallback(() => {
    setNumber("15");
    setPerPeriod("Seconds");
    setPeriods("1");
    setBurst("3");
    setMitigation("Block");
    setLockoutValue("30");
    setLockoutUnit("Seconds");
  }, []);

  const clearAll = useCallback(() => {
    setNumber("");
    setPeriods("");
    setBurst("1");
    setMitigation("Disabled");
    setLockoutValue("30");
  }, []);

  const row = (label: string, value: React.ReactNode) => (
    <div className="jwt-claim-row">
      <span className="jwt-claim-label">{label}</span>
      <span className="jwt-claim-value mono">{value}</span>
    </div>
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label">{t("configLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearAll}>
              {t("clear")}
            </button>
          </div>
        </div>

        <div style={GRID}>
          <div>
            <label className="cidr-label" htmlFor="rl-number">
              {t("number")}
            </label>
            <input id="rl-number" className="cidr-input mono" type="number" min={1} value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div>
            <label className="cidr-label" htmlFor="rl-perperiod">
              {t("perPeriod")}
            </label>
            <select id="rl-perperiod" className="cidr-input mono" value={perPeriod} onChange={(e) => setPerPeriod(e.target.value as PerPeriod)}>
              <option value="Seconds">{t("seconds")}</option>
              <option value="Minutes">{t("minutes")}</option>
              <option value="Hours">{t("hours")}</option>
            </select>
          </div>
          <div>
            <label className="cidr-label" htmlFor="rl-periods">
              {t("periods")}
            </label>
            <input id="rl-periods" className="cidr-input mono" type="number" min={1} value={periods} onChange={(e) => setPeriods(e.target.value)} />
          </div>
          <div>
            <label className="cidr-label" htmlFor="rl-burst">
              {t("burst")}
            </label>
            <input id="rl-burst" className="cidr-input mono" type="number" min={1} step="0.1" value={burst} onChange={(e) => setBurst(e.target.value)} />
          </div>
          <div>
            <label className="cidr-label" htmlFor="rl-mitigation">
              {t("mitigation")}
            </label>
            <select id="rl-mitigation" className="cidr-input mono" value={mitigation} onChange={(e) => setMitigation(e.target.value as Mitigation)}>
              <option value="Disabled">{t("disabled")}</option>
              <option value="Block">{t("block")}</option>
            </select>
          </div>
          {mitigation === "Block" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label className="cidr-label" htmlFor="rl-lockval">
                  {t("lockout")}
                </label>
                <input id="rl-lockval" className="cidr-input mono" type="number" min={1} value={lockoutValue} onChange={(e) => setLockoutValue(e.target.value)} />
              </div>
              <div>
                <label className="cidr-label" htmlFor="rl-lockunit">
                  {t("lockoutUnit")}
                </label>
                <select id="rl-lockunit" className="cidr-input mono" value={lockoutUnit} onChange={(e) => setLockoutUnit(e.target.value as DurationUnit)}>
                  <option value="Seconds">{t("seconds")}</option>
                  <option value="Minutes">{t("minutes")}</option>
                  <option value="Hours">{t("hours")}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {result && !result.ok && (
        <p className="cidr-error" role="alert">
          {result.code ? t(`errors.${result.code}`) : result.error}
        </p>
      )}

      {result && result.ok && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("effectiveRate")}</h4>
            {row(t("window"), `${result.windowSeconds} s`)}
            {row(t("perSecond"), result.ratePerSecond)}
            {row(t("perMinute"), result.ratePerMinute)}
            {row(t("perHour"), result.ratePerHour)}
            {row(t("equivalence"), result.equivalence)}
            {row(t("burstCeiling"), `${result.burstCeiling} (${t("burstNote", { m: result.burstMultiplier ?? 1 })})`)}
          </section>

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("behavior")}</h4>
            <p className="cipher-note">{t("behaviorLeakyBucket")}</p>
            {result.mitigation === "Disabled" ? (
              <p className="cipher-note">{t("behaviorDisabled")}</p>
            ) : (
              <>
                <p className="cipher-note">{t("behaviorBlock", { secs: result.lockoutSeconds ?? 0 })}</p>
                {result.lockoutExceedsMax && <p className="cipher-note">{t("behaviorOverMax")}</p>}
              </>
            )}
            <p className="cipher-note">{t("overshootCaveat")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
