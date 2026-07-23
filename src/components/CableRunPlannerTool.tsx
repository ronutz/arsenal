"use client";

// ============================================================================
// src/components/CableRunPlannerTool.tsx
// ----------------------------------------------------------------------------
// UI for the cable run planner. Four structured inputs (speed tier, distance,
// environment, PoE class) -> compliant options with governing rules, plus the
// honest exclusion list. D-83 Example/Clear row (golden-vector-faithful
// sample: the 10G / 80 m case whose Cat 6 exclusion teaches the 55 m
// ceiling). Reuses existing semantic CSS only (tool-panel, cidr-label,
// lbm-select, cidr-input, tmsh-object family, ztc-*, json-error-*,
// dig-input-head chips) - no new classes. All compute local. (D-19.)
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  SPEEDS,
  type PlannerResult,
  type Environment,
  type PoeClass,
} from "@/lib/tools/cable-run-planner";

const ENVS: Environment[] = ["office", "industrial", "plenum", "outdoor"];
const POES: PoeClass[] = ["none", "af", "at", "bt"];

/** D-83 example: golden-vector case "10G / 80 m office" (teaches the Cat 6 ceiling). */
const EXAMPLE = {
  speedMbps: 10000,
  distanceM: "80",
  environment: "office" as Environment,
  poe: "none" as PoeClass,
};

export default function CableRunPlannerTool() {
  const t = useTranslations("tools.cable-run-planner");
  const [speedMbps, setSpeed] = useState<number>(1000);
  const [distanceM, setDistance] = useState<string>("");
  const [environment, setEnv] = useState<Environment>("office");
  const [poe, setPoe] = useState<PoeClass>("none");
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function plan(sp = speedMbps, di = distanceM, en = environment, po = poe) {
    setError(null);
    setResult(null);
    if (!di.trim()) return;
    try {
      setResult(run({ speedMbps: sp, distanceM: Number(di), environment: en, poe: po }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function loadExample() {
    setSpeed(EXAMPLE.speedMbps);
    setDistance(EXAMPLE.distanceM);
    setEnv(EXAMPLE.environment);
    setPoe(EXAMPLE.poe);
    plan(EXAMPLE.speedMbps, EXAMPLE.distanceM, EXAMPLE.environment, EXAMPLE.poe);
  }

  function clearAll() {
    setSpeed(1000);
    setDistance("");
    setEnv("office");
    setPoe("none");
    setResult(null);
    setError(null);
  }

  return (
    <div className="tool-panel">
      {/* D-83 Example / Clear row (dig-input-head pattern). */}
      <div className="dig-input-head">
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={loadExample}>
            {t("example")}
          </button>
          <button type="button" className="b64-copy" onClick={clearAll}>
            {t("clear")}
          </button>
        </div>
      </div>

      <label className="cidr-label">
        {t("speedLabel")}
        <select
          className="lbm-select"
          value={speedMbps}
          onChange={(e) => {
            const v = Number(e.target.value);
            setSpeed(v);
            plan(v, distanceM, environment, poe);
          }}
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s >= 1000 ? `${s / 1000} Gb/s` : `${s} Mb/s`}
            </option>
          ))}
        </select>
      </label>

      <label className="cidr-label">
        {t("distanceLabel")}
        <input
          className="cidr-input mono"
          inputMode="numeric"
          placeholder={t("distancePlaceholder")}
          value={distanceM}
          onChange={(e) => {
            setDistance(e.target.value);
            plan(speedMbps, e.target.value, environment, poe);
          }}
        />
      </label>

      <label className="cidr-label">
        {t("envLabel")}
        <select
          className="lbm-select"
          value={environment}
          onChange={(e) => {
            const v = e.target.value as Environment;
            setEnv(v);
            plan(speedMbps, distanceM, v, poe);
          }}
        >
          {ENVS.map((v) => (
            <option key={v} value={v}>
              {t(`env_${v}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="cidr-label">
        {t("poeLabel")}
        <select
          className="lbm-select"
          value={poe}
          onChange={(e) => {
            const v = e.target.value as PoeClass;
            setPoe(v);
            plan(speedMbps, distanceM, environment, v);
          }}
        >
          {POES.map((v) => (
            <option key={v} value={v}>
              {t(`poe_${v}`)}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <div className="json-error-box" role="alert">
          <div className="json-error-headline">{t("errorTitle")}</div>
          <div className="json-error-message mono">{error}</div>
        </div>
      )}

      {!result && !error && <p className="ztc-empty">{t("emptyState")}</p>}

      {result && (
        <div className="ztc-result">
          <p className="lbm-facts">{result.text}</p>

          {result.options.length > 0 && (
            <section>
              <h3 className="tmsh-object-head">{t("optionsTitle")}</h3>
              {result.options.map((o) => (
                <div key={o.id} className="tmsh-object">
                  <div className="tmsh-object-head">
                    <span className="tmsh-object-name mono">{o.label}</span>
                    <span className="tmsh-type-badge">
                      {t("maxReach")} {o.maxDistanceM} m
                    </span>
                  </div>
                  <p className="lbm-facts">{o.rule}</p>
                  {o.notes.length > 0 && (
                    <ul className="ztc-notes">
                      {o.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {result.excluded.length > 0 && (
            <section>
              <h3 className="tmsh-object-head">{t("excludedTitle")}</h3>
              <ul className="ztc-notes">
                {result.excluded.map((x) => (
                  <li key={x.id}>
                    <strong>{x.label}:</strong> {x.reason}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
