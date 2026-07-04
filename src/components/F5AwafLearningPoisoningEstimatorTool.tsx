"use client";

// ============================================================================
// src/components/F5AwafLearningPoisoningEstimatorTool.tsx
// ----------------------------------------------------------------------------
// THE AUTOMATIC-LEARNING POISONING ESTIMATOR.
//
// Describe a BIG-IP Advanced WAF Policy Builder Loosen configuration (Learning
// Mode, loosen scope, the different-sources/sessions/time thresholds, and the
// target manipulation's violation rating) and the attacker's resources
// (distinct source IPs and per-source request rate), and the pure engine
// answers: how many requests, from how many sources, over how long, to force
// ONE automatic policy relaxation — or which documented gate makes it
// impossible. Everything runs in the browser (D-49); nothing is fetched.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  estimatePoisoning,
  DEFAULTS,
  type PoisoningInput,
  type LearningMode,
  type ViolationRating,
} from "@/lib/tools/f5-awaf-learning-poisoning-estimator";

// The eye-opener example: an attacker whose IPs sit inside the Trusted range
// drills with a single session (golden vector "trusted-attacker-is-fast").
const EXAMPLE: PoisoningInput = { ...DEFAULTS, attackerIsTrusted: true };

const MODES: LearningMode[] = ["automatic", "manual", "disabled"];
const RATINGS: ViolationRating[] = [1, 2, 3, 4, 5];

// Verdict severity per gate: drives the headline color.
const GATE_SEV: Record<string, "danger" | "safe" | "info"> = {
  "learning-disabled": "safe",
  manual: "safe",
  unlearnable: "safe",
  "trusted-only-blocked": "safe",
  "insufficient-sources": "info",
  drillable: "danger",
};

function NumField({
  id,
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="poison-field" htmlFor={id}>
      <span className="poison-field-label">{label}</span>
      <input
        id={id}
        type="number"
        className="cidr-input poison-num"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        step={step}
        onChange={(e) => {
          const n = step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
          onChange(Number.isNaN(n) ? min : n);
        }}
      />
      {hint && <span className="poison-field-hint">{hint}</span>}
    </label>
  );
}

export default function F5AwafLearningPoisoningEstimatorTool() {
  const t = useTranslations("tools.f5-awaf-learning-poisoning-estimator");
  const [inp, setInp] = useState<PoisoningInput>(DEFAULTS);
  const r = useMemo(() => estimatePoisoning(inp), [inp]);

  const set = <K extends keyof PoisoningInput>(k: K, v: PoisoningInput[K]) => setInp((p) => ({ ...p, [k]: v }));

  const sev = GATE_SEV[r.gate] ?? "info";
  const untrustedActive = inp.learningMode === "automatic" && !inp.attackerIsTrusted;

  const noteText = (n: (typeof r.notes)[number]): string => {
    switch (n.kind) {
      case "auto-enforce-at-100": return t("note.autoEnforce");
      case "unlearnable-set": return t("note.unlearnable");
      case "rating-raises-cost": return t("note.ratingCost", { rating: n.rating });
      case "trusted-one-session": return t("note.trustedOneSession");
      case "empty-trusted-list": return t("note.emptyTrusted");
      case "attacker-trusted-fast": return t("note.attackerTrusted");
      case "lower-bound-caveat": return t("note.lowerBound");
      default: return "";
    }
  };
  const mitigationText = (m: (typeof r.mitigations)[number]): string => {
    switch (m.kind) {
      case "use-manual-mode": return t("mit.manual");
      case "loosen-trusted-only": return t("mit.trustedOnly");
      case "raise-untrusted-thresholds": return t("mit.raiseThresholds");
      case "keep-untrusted-out-of-trusted": return t("mit.keepOut");
      case "disable-after-build": return t("mit.disableAfter");
      default: return "";
    }
  };

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool poison-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <p className="cidr-label">{t("policyLabel")}</p>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInp(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInp(DEFAULTS)}>{t("clear")}</button>
          </div>
        </div>

        {/* --- Policy Builder Loosen configuration --- */}
        <div className="poison-group">
          <label className="poison-field" htmlFor="pz-mode">
            <span className="poison-field-label">{t("f.mode")}</span>
            <select id="pz-mode" className="cidr-input poison-select" value={inp.learningMode} onChange={(e) => set("learningMode", e.target.value as LearningMode)}>
              {MODES.map((m) => <option key={m} value={m}>{t(`mode.${m}`)}</option>)}
            </select>
          </label>

          <label className={`poison-toggle${inp.loosenFromUntrustedTraffic ? " poison-toggle-on" : ""}`}>
            <input type="checkbox" checked={inp.loosenFromUntrustedTraffic} onChange={(e) => set("loosenFromUntrustedTraffic", e.target.checked)} />
            <span>{t("f.loosenUntrusted")}</span>
          </label>

          <label className={`poison-toggle${inp.attackerIsTrusted ? " poison-toggle-on" : ""}`}>
            <input type="checkbox" checked={inp.attackerIsTrusted} onChange={(e) => set("attackerIsTrusted", e.target.checked)} />
            <span>{t("f.attackerTrusted")}</span>
          </label>

          <label className="poison-field" htmlFor="pz-rating">
            <span className="poison-field-label">{t("f.rating")}</span>
            <select id="pz-rating" className="cidr-input poison-select" value={inp.targetViolationRating} onChange={(e) => set("targetViolationRating", parseInt(e.target.value, 10) as ViolationRating)}>
              {RATINGS.map((v) => <option key={v} value={v}>{t(`rating.${v}`)}</option>)}
            </select>
          </label>
        </div>

        <div className="poison-group">
          <NumField id="pz-us" label={t("f.untrustedSources")} value={inp.untrustedDifferentSources} onChange={(n) => set("untrustedDifferentSources", n)} min={1} hint={t("f.untrustedSourcesHint")} />
          <NumField id="pz-usess" label={t("f.untrustedSessions")} value={inp.untrustedDifferentSessions} onChange={(n) => set("untrustedDifferentSessions", n)} min={1} />
          <NumField id="pz-ts" label={t("f.trustedSessions")} value={inp.trustedDifferentSessions} onChange={(n) => set("trustedDifferentSessions", n)} min={1} hint={t("f.trustedSessionsHint")} />
          <NumField id="pz-spread" label={t("f.timeSpread")} value={inp.timeSpreadHours} onChange={(n) => set("timeSpreadHours", n)} min={0} />
          <NumField id="pz-rf" label={t("f.ratingFactor")} value={inp.ratingSlowdownFactor} onChange={(n) => set("ratingSlowdownFactor", n)} min={1} step={0.5} hint={t("f.ratingFactorHint")} />
        </div>

        <p className="cidr-label poison-subhead">{t("attackerLabel")}</p>
        <div className="poison-group">
          <NumField id="pz-as" label={t("f.attackerSources")} value={inp.attackerDistinctSources} onChange={(n) => set("attackerDistinctSources", n)} min={1} hint={t("f.attackerSourcesHint")} />
          <NumField id="pz-rate" label={t("f.rate")} value={inp.requestsPerSourcePerHour} onChange={(n) => set("requestsPerSourcePerHour", n)} min={1} />
        </div>

        <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span> {t("runsLocally")}</p>
        <p className="cipherstr-scope">{t("scopeNote")}</p>
      </div>

      {/* --- Verdict --- */}
      <div className="tmsh-results poison-results">
        <section className={`poison-verdict poison-verdict-${sev}`}>
          <h3 className="poison-verdict-head">{t(`verdict.${r.gate}`)}</h3>

          {r.drillable && (
            <div className="poison-numbers">
              <div className="poison-stat">
                <span className="poison-stat-num">{r.minDistinctSources.toLocaleString()}</span>
                <span className="poison-stat-lbl">{t("stat.sources")}</span>
              </div>
              <div className="poison-stat">
                <span className="poison-stat-num">{r.minRequestsLowerBound.toLocaleString()}+</span>
                <span className="poison-stat-lbl">{t("stat.requests")}</span>
              </div>
              <div className="poison-stat">
                <span className="poison-stat-num">{r.minTimeHuman}</span>
                <span className="poison-stat-lbl">{t("stat.time")}</span>
              </div>
            </div>
          )}

          {r.gate === "insufficient-sources" && (
            <p className="poison-verdict-detail">
              {t("insufficientDetail", { need: r.minDistinctSources.toLocaleString(), have: inp.attackerDistinctSources.toLocaleString() })}
            </p>
          )}
        </section>

        {/* Documented notes */}
        {r.notes.length > 0 && (
          <section className="persist-section">
            <h3 className="persist-heading">{t("notesHeading")}</h3>
            <ul className="poison-notes">
              {r.notes.map((n, i) => <li key={i} className="poison-note">{noteText(n)}</li>)}
            </ul>
          </section>
        )}

        {/* Mitigations — the lesson */}
        <section className="persist-section">
          <h3 className="persist-heading">{t("mitigationsHeading")}</h3>
          <ul className="poison-mitigations">
            {r.mitigations.map((m, i) => <li key={i} className="poison-mit">{mitigationText(m)}</li>)}
          </ul>
        </section>

        {untrustedActive && (
          <p className="cipherstr-scope poison-foot">{t("untrustedActiveNote")}</p>
        )}
      </div>
    </div>
  );
}
