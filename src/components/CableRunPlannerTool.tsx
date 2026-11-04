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
//
// PAGE LANGUAGE (02/11/2026): the plan comes from runLocalisable() (every
// sentence an EngineText) and is turned into the page's language once, by
// inPageLanguage(); input errors are shown through engineTexts().error. The
// English page reads exactly as before. The engine is imported from compute
// directly (not the index, which also pulls the manifest and the vectors).
//
// NO KEYBOARD NEEDED (03/11/2026): the distance has up and down arrows
// (StepperField), one metre a press from 1 to the engine's 10,000; its label
// now stands beside the field rather than around it, so the arrows' names do
// not join the field's.
// ============================================================================

import { useMemo, useState } from "react"; // state, and the share encoding memoised
import { useTranslations } from "next-intl";
import {
  runLocalisable,
  SPEEDS,
  type PlannerResult,
  type Environment,
  type PoeClass,
} from "@/lib/tools/cable-run-planner/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the page as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { CABLE_SHARE } from "@/lib/tools/cable-run-planner/share"; // this tool's share spec: the four fields
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // up and down arrows for the distance (03/11/2026)

/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

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
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language (02/11/2026)
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
      setResult(inPageLanguage(runLocalisable({ speedMbps: sp, distanceM: Number(di), environment: en, poe: po }), tx)); // the reading, in the page's language
    } catch (e) {
      setError(tx.error(e)); // the input error's sentence in the page's language
    }
  }

  // Share results (2026-11-01): the four fields, only beside a plan.
  const share = useMemo<ShareEncoding>(() => (result ? CABLE_SHARE.encode({ speedMbps, distanceM, environment, poe }) : NOTHING), [result, speedMbps, distanceM, environment, poe]); // the button's encoding
  // A shared link sets the four fields and plans, as changing them does.
  useShareArrival(CABLE_SHARE, (s) => {
    setSpeed(s.speedMbps); setDistance(s.distanceM); setEnv(s.environment as Environment); setPoe(s.poe as PoeClass); // the form
    plan(s.speedMbps, s.distanceM, s.environment as Environment, s.poe as PoeClass); // the plan
  });

  /** Set the distance and plan again, as typing does (the arrows call this too). */
  function setDistanceText(v: string) {
    // The field's text.
    setDistance(v);
    // The plan for it.
    plan(speedMbps, v, environment, poe);
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

      {/* The distance: its label tied by id, then the field with its up and down arrows (03/11/2026). */}
      <label className="cidr-label" htmlFor="crp-distance">
        {t("distanceLabel")}
      </label>
      {/* One metre a press, 1 to 10,000: the engine reads a distance in (0, 10000] metres. */}
      <StepperField value={distanceM} onValue={setDistanceText} min={1} max={10000} label={t("distanceLabel")} inputId="crp-distance">
        <input
          id="crp-distance"
          className="cidr-input mono"
          inputMode="numeric"
          placeholder={t("distancePlaceholder")}
          value={distanceM}
          onChange={(e) => {
            // The typed text, set and planned as the arrows do.
            setDistanceText(e.target.value);
          }}
          // Arrow Up and Down step the distance from the keyboard.
          onKeyDown={stepperKeyDown({ value: distanceM, onValue: setDistanceText, min: 1, max: 10000 })}
        />
      </StepperField>

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

          {/* Share results: under the headline (the answer), before the options and exclusions, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>

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
