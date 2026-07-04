"use client";

// ============================================================================
// src/components/F5AwafLearningSuggestionInterpreterTool.tsx
// ----------------------------------------------------------------------------
// Characterise a Traffic Learning suggestion and the pure engine returns
// whether accepting it loosens or tightens the policy, whether a loosening is
// a false-positive fix or a security relaxation, and whether Automatic learning
// is about to enforce it (the poisoning vector). Everything runs in the browser
// (D-49); nothing is fetched. Grounded in F5's learning-suggestion docs.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  interpretSuggestion,
  DEFAULTS,
  ACTIONS,
  type SuggInput,
  type ActionType,
  type LearningMode,
  type SourceTrust,
  type Rating,
} from "@/lib/tools/f5-awaf-learning-suggestion-interpreter";

// Example: a plain legitimate add from trusted traffic - the safe, "just
// learning structure" case, to contrast with the default poisoning-vector one.
const EXAMPLE: SuggInput = { action: "add-entity", learningScore: 100, violationRating: null, mode: "manual", sourceTrust: "trusted" };

const MODES: LearningMode[] = ["automatic", "manual"];
const TRUSTS: SourceTrust[] = ["trusted", "untrusted", "mixed"];
const RATING_OPTS: (Rating)[] = [null, 1, 2, 3, 4, 5];

const ASSESS_SEV: Record<string, "safe" | "info" | "danger" | "muted"> = {
  "add-legitimate": "info",
  "fp-fix": "safe",
  investigate: "info",
  "likely-relaxing-attack": "danger",
  "beneficial-tightening": "safe",
};

export default function F5AwafLearningSuggestionInterpreterTool() {
  const t = useTranslations("tools.f5-awaf-learning-suggestion-interpreter");
  const [inp, setInp] = useState<SuggInput>(DEFAULTS);
  const r = useMemo(() => interpretSuggestion(inp), [inp]);
  const set = <K extends keyof SuggInput>(k: K, v: SuggInput[K]) => setInp((p) => ({ ...p, [k]: v }));

  const sev = ASSESS_SEV[r.assessment] ?? "info";

  const noteText = (n: (typeof r.notes)[number]): string => {
    switch (n.kind) {
      case "score-rating-inverse": return t("note.scoreRatingInverse");
      case "auto-enforce-at-100": return t("note.autoEnforce");
      case "poisoning-vector": return t("note.poisoningVector");
      case "fp-discipline": return t("note.discipline");
      case "enforce-check-fp": return t("note.enforceCheckFp");
      case "tightening-safe": return t("note.tighteningSafe");
      case "manual-human": return t("note.manualHuman");
      case "score-near-accept": return t("note.scoreNearAccept", { score: n.score });
      default: return "";
    }
  };

  const ratingValue = inp.violationRating === null ? "na" : String(inp.violationRating);

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool poison-tool fp-tool sugg-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <p className="cidr-label">{t("inputLabel")}</p>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInp(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInp(DEFAULTS)}>{t("clear")}</button>
          </div>
        </div>

        <div className="poison-group">
          <label className="poison-field poison-field-wide" htmlFor="sg-action">
            <span className="poison-field-label">{t("f.action")}</span>
            <select id="sg-action" className="cidr-input poison-select" value={inp.action} onChange={(e) => set("action", e.target.value as ActionType)}>
              <optgroup label={t("grp.loosening")}>
                {ACTIONS.filter((a) => ["add-entity", "add-meta-char", "relax-attribute", "disable-violation", "disable-signature"].includes(a)).map((a) => (
                  <option key={a} value={a}>{t(`action.${a}`)}</option>
                ))}
              </optgroup>
              <optgroup label={t("grp.tightening")}>
                {ACTIONS.filter((a) => ["remove-wildcard", "enforce-entity", "specify-attribute"].includes(a)).map((a) => (
                  <option key={a} value={a}>{t(`action.${a}`)}</option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="poison-field" htmlFor="sg-rating">
            <span className="poison-field-label">{t("f.rating")}</span>
            <select id="sg-rating" className="cidr-input poison-select" value={ratingValue} onChange={(e) => set("violationRating", e.target.value === "na" ? null : (parseInt(e.target.value, 10) as Rating))}>
              {RATING_OPTS.map((v) => (
                <option key={String(v)} value={v === null ? "na" : String(v)}>{v === null ? t("rating.na") : t(`rating.${v}`)}</option>
              ))}
            </select>
          </label>

          <label className="poison-field" htmlFor="sg-mode">
            <span className="poison-field-label">{t("f.mode")}</span>
            <select id="sg-mode" className="cidr-input poison-select" value={inp.mode} onChange={(e) => set("mode", e.target.value as LearningMode)}>
              {MODES.map((m) => <option key={m} value={m}>{t(`mode.${m}`)}</option>)}
            </select>
          </label>

          <label className="poison-field" htmlFor="sg-trust">
            <span className="poison-field-label">{t("f.trust")}</span>
            <select id="sg-trust" className="cidr-input poison-select" value={inp.sourceTrust} onChange={(e) => set("sourceTrust", e.target.value as SourceTrust)}>
              {TRUSTS.map((s) => <option key={s} value={s}>{t(`trust.${s}`)}</option>)}
            </select>
          </label>

          <label className="poison-field poison-field-wide" htmlFor="sg-score">
            <span className="poison-field-label">{t("f.score")}: {inp.learningScore}%</span>
            <input id="sg-score" type="range" min={0} max={100} step={5} className="poison-range" value={inp.learningScore} onChange={(e) => set("learningScore", parseInt(e.target.value, 10))} />
          </label>
        </div>

        <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
        <p className="cipherstr-scope">{t("scopeNote")}</p>
      </div>

      <div className="tmsh-results poison-results">
        <section className={`poison-verdict poison-verdict-${sev === "muted" ? "info" : sev}`}>
          <div className="sugg-dir-row">
            <span className={`sugg-dir-chip sugg-dir-${r.direction}`}>{t(`direction.${r.direction}`)}</span>
            {r.autoApplyRisk && <span className="fp-badge fp-badge-block">{t("autoApplyBadge")}</span>}
          </div>
          <h3 className="poison-verdict-head">{t(`assessment.${r.assessment}`)}</h3>
        </section>

        {r.notes.length > 0 && (
          <section className="persist-section">
            <h3 className="persist-heading">{t("notesHeading")}</h3>
            <ul className="poison-notes">
              {r.notes.map((n, i) => {
                const txt = noteText(n);
                if (!txt) return null;
                const danger = n.kind === "poisoning-vector";
                return <li key={i} className={danger ? "poison-note poison-note-danger" : "poison-note"}>{txt}</li>;
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
