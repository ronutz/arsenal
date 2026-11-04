"use client";

// ============================================================================
// src/components/F5xcRateLimitCalculatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC rate-limit calculator. Structured inputs (Number, Per Period,
// Periods, Burst Multiplier, Mitigation, and a lockout when Block) compute live
// into the effective rate, burst ceiling, and exact leaky-bucket behavior.
// Styling reuses the established tool vocabulary (cidr-* input stack, jwt-*
// result panels, cipher-note); the field grid is .rl-grid / .rl-lockout-grid
// in components.css (03/11/2026: it was inline styles, which cannot narrow to
// one column on a phone, and the arrows need the room).
//
// Share results (2026-11-01, wave 4B): a button under the effective rate
// builds a link, only when pressed, carrying every field as the calculation
// reads it (src/lib/tools/f5xc-rate-limit-calculator/share.ts, posture input,
// a form). An arriving link sets the fields as if typed.
//
// Up and down arrows (03/11/2026, PRIME: values set "through the click of a
// mouse (or press of the touchscreen)"): Number, Periods, Burst Multiplier
// and the lockout duration each have a decrease and an increase button beside
// them, bounded below by the engine's own checks (at least 1) and stepping as
// each field's step attribute does (whole numbers; the burst multiplier 0.1). No upper
// bound: the engine has none, and a lockout over 48 hours is computed and
// flagged, which is the point.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  calculateRateLimit,
  type PerPeriod,
  type Mitigation,
  type DurationUnit,
} from "@/lib/tools/f5xc-rate-limit-calculator/compute";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { RATE_LIMIT_SHARE } from "@/lib/tools/f5xc-rate-limit-calculator/share"; // this tool's share spec
// Up and down arrows beside the four number fields (03/11/2026).
import { StepperField } from "@/components/NumberStepper";


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

  // An arriving share link (2026-11-01): every field is set as if typed.
  useShareArrival(RATE_LIMIT_SHARE, (s) => { setNumber(s.number); setPerPeriod(s.per); setPeriods(s.periods); setBurst(s.burst); setMitigation(s.mitigation); setLockoutValue(s.lockout); setLockoutUnit(s.unit); }); // the link's fields
  // What Share results may carry: every field, once there is a result (memoised on them).
  const share = useMemo(() => RATE_LIMIT_SHARE.encode({ number, per: perPeriod, periods, burst, mitigation, lockout: lockoutValue, unit: lockoutUnit }), [number, perPeriod, periods, burst, mitigation, lockoutValue, lockoutUnit]); // the encoding

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

        {/* The form: two columns, one on a phone (.rl-grid). */}
        <div className="rl-grid">
          <div>
            <label className="cidr-label" htmlFor="rl-number">
              {t("number")}
            </label>
            {/* Up and down arrows: one request a press, never below 1 (the engine's min-number check). */}
            <StepperField value={number} onValue={setNumber} min={1} integer label={t("number")} inputId="rl-number">
              <input id="rl-number" className="cidr-input mono" type="number" min={1} value={number} onChange={(e) => setNumber(e.target.value)} />
            </StepperField>
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
            {/* Up and down arrows: one period a press, never below 1 (the engine's min-periods check). */}
            <StepperField value={periods} onValue={setPeriods} min={1} integer label={t("periods")} inputId="rl-periods">
              <input id="rl-periods" className="cidr-input mono" type="number" min={1} value={periods} onChange={(e) => setPeriods(e.target.value)} />
            </StepperField>
          </div>
          <div>
            <label className="cidr-label" htmlFor="rl-burst">
              {t("burst")}
            </label>
            {/* Up and down arrows: 0.1 a press (the field's own step), never below 1 (the engine's min-burst check). */}
            <StepperField value={burst} onValue={setBurst} min={1} step={0.1} label={t("burst")} inputId="rl-burst">
              <input id="rl-burst" className="cidr-input mono" type="number" min={1} step="0.1" value={burst} onChange={(e) => setBurst(e.target.value)} />
            </StepperField>
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
            // The duration and its unit side by side, stacked when the cell is narrow (.rl-lockout-grid).
            <div className="rl-lockout-grid">
              <div>
                <label className="cidr-label" htmlFor="rl-lockval">
                  {t("lockout")}
                </label>
                {/* Up and down arrows: one unit a press, never below 1 (the engine's block-lockout check). */}
                <StepperField value={lockoutValue} onValue={setLockoutValue} min={1} integer label={t("lockout")} inputId="rl-lockval">
                  <input id="rl-lockval" className="cidr-input mono" type="number" min={1} value={lockoutValue} onChange={(e) => setLockoutValue(e.target.value)} />
                </StepperField>
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

          {/* Share results (2026-11-01): under the effective rate, before the behaviour, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>

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
