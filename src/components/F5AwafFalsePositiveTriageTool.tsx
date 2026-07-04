"use client";

// ============================================================================
// src/components/F5AwafFalsePositiveTriageTool.tsx
// ----------------------------------------------------------------------------
// AWAF false-positive triage. Pick a violation category, its average violation
// rating, and whether it is enforced/staged/transparent, and the pure engine
// returns F5's rating-based verdict, whether it is blocking now, the scoped
// remediation for that category, and the discipline notes. Everything runs in
// the browser (D-49); nothing is fetched. Grounded in F5's violation-rating and
// false-positive documentation.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  triageFalsePositive,
  DEFAULTS,
  CATEGORIES,
  type FpInput,
  type ViolationCategory,
  type ViolationRating,
  type EnforcementState,
} from "@/lib/tools/f5-awaf-false-positive-triage";

// Example: a rating-5 attack signature — shows the tool correctly refusing to
// relax (golden vector "rating-4-5-clear-not-relax").
const EXAMPLE: FpInput = { category: "attack-signature", violationRating: 5, enforcementState: "enforced-blocking" };

const RATINGS: ViolationRating[] = [1, 2, 3, 4, 5];
const STATES: EnforcementState[] = ["enforced-blocking", "staged", "transparent"];

const TRIAGE_SEV: Record<string, "safe" | "info" | "danger"> = {
  "likely-fp": "safe",
  investigate: "info",
  "likely-attack": "danger",
};

export default function F5AwafFalsePositiveTriageTool() {
  const t = useTranslations("tools.f5-awaf-false-positive-triage");
  const [inp, setInp] = useState<FpInput>(DEFAULTS);
  const r = useMemo(() => triageFalsePositive(inp), [inp]);
  const set = <K extends keyof FpInput>(k: K, v: FpInput[K]) => setInp((p) => ({ ...p, [k]: v }));

  const sev = TRIAGE_SEV[r.triage] ?? "info";

  const noteText = (n: (typeof r.notes)[number]): string => {
    switch (n.kind) {
      case "rating-blocks": return t("note.ratingBlocks");
      case "staged-not-blocking": return t("note.staged");
      case "transparent-not-blocking": return t("note.transparent");
      case "discipline": return t("note.discipline");
      case "scope-it": return t("note.scopeIt");
      case "potential-fp-detection": return t("note.potentialFp");
      case "unlearnable-maybe": return t("note.unlearnable");
      default: return "";
    }
  };

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool poison-tool fp-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <p className="cidr-label">{t("inputLabel")}</p>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInp(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInp(DEFAULTS)}>{t("clear")}</button>
          </div>
        </div>

        <div className="poison-group">
          <label className="poison-field" htmlFor="fp-cat">
            <span className="poison-field-label">{t("f.category")}</span>
            <select id="fp-cat" className="cidr-input poison-select" value={inp.category} onChange={(e) => set("category", e.target.value as ViolationCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}
            </select>
          </label>

          <label className="poison-field" htmlFor="fp-rating">
            <span className="poison-field-label">{t("f.rating")}</span>
            <select id="fp-rating" className="cidr-input poison-select" value={inp.violationRating} onChange={(e) => set("violationRating", parseInt(e.target.value, 10) as ViolationRating)}>
              {RATINGS.map((v) => <option key={v} value={v}>{t(`rating.${v}`)}</option>)}
            </select>
          </label>

          <label className="poison-field" htmlFor="fp-state">
            <span className="poison-field-label">{t("f.state")}</span>
            <select id="fp-state" className="cidr-input poison-select" value={inp.enforcementState} onChange={(e) => set("enforcementState", e.target.value as EnforcementState)}>
              {STATES.map((s) => <option key={s} value={s}>{t(`state.${s}`)}</option>)}
            </select>
          </label>
        </div>

        <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span> {t("runsLocally")}</p>
        <p className="cipherstr-scope">{t("scopeNote")}</p>
      </div>

      <div className="tmsh-results poison-results">
        <section className={`poison-verdict poison-verdict-${sev}`}>
          <h3 className="poison-verdict-head">{t(`triage.${r.triage}`)}</h3>
          <div className="fp-verdict-row">
            <span className={`fp-badge fp-badge-${r.blocksNow ? "block" : "noblock"}`}>
              {r.blocksNow ? t("blocksNow") : t("notBlocking")}
            </span>
            <span className="fp-action">{t(`action.${r.action}`)}</span>
          </div>
        </section>

        <section className="persist-section">
          <h3 className="persist-heading">{t("remediationHeading")}</h3>
          <ul className="poison-mitigations">
            {r.remediations.map((key) => <li key={key} className="poison-mit">{t(`rem.${key}`)}</li>)}
          </ul>
        </section>

        {r.notes.length > 0 && (
          <section className="persist-section">
            <h3 className="persist-heading">{t("notesHeading")}</h3>
            <ul className="poison-notes">
              {r.notes.map((n, i) => {
                const txt = noteText(n);
                if (!txt) return null;
                return <li key={i} className="poison-note">{txt}</li>;
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
