"use client";

// ============================================================================
// src/components/F5AwafSignatureAccuracyRiskTool.tsx
// ----------------------------------------------------------------------------
// Read a signature's published Accuracy and Risk and the pure engine returns
// its false-positive likelihood (from accuracy), the damage a real match would
// do (from risk), the accuracy x risk quadrant, and the tuning move. Everything
// runs in the browser (D-49); nothing is fetched. Grounded in F5's attack-
// signature documentation.
//
// Share results (2026-10-27): a button under the verdict builds a link that
// carries the four choices by their ids; an arriving link sets them.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { SIGNATURE_RISK_SHARE } from "@/lib/tools/f5-awaf-signature-accuracy-risk/share"; // this tool's share spec (2026-10-27)
import {
  interpretSignature,
  DEFAULTS,
  LEVELS,
  type SigInput,
  type Level,
  type SystemRelevance,
  type Enforcement,
} from "@/lib/tools/f5-awaf-signature-accuracy-risk";

// Example: high accuracy + high risk — the "do not relax" case, to contrast
// with the default low/low prime-relax-candidate.
const EXAMPLE: SigInput = { accuracy: "high", risk: "high", systemRelevance: "in-stack", enforcement: "enforced-blocking" };

const RELEVANCE: SystemRelevance[] = ["in-stack", "not-in-stack", "unknown"];
const ENFORCE: Enforcement[] = ["enforced-blocking", "staged", "transparent"];

const QUADRANT_SEV: Record<string, "safe" | "info" | "danger"> = {
  "fp-prone-low-stakes": "safe",
  "fp-prone-dangerous": "info",
  "reliable-high-stakes": "danger",
  "reliable-low-stakes": "info",
};
const FP_SEV: Record<string, string> = { high: "danger", some: "info", low: "safe" };

export default function F5AwafSignatureAccuracyRiskTool() {
  const t = useTranslations("tools.f5-awaf-signature-accuracy-risk");
  const [inp, setInp] = useState<SigInput>(DEFAULTS);
  const r = useMemo(() => interpretSignature(inp), [inp]);
  const set = <K extends keyof SigInput>(k: K, v: SigInput[K]) => setInp((p) => ({ ...p, [k]: v }));
  // An arriving share link (2026-10-27): the four choices are set, and the page computes as it does on a change.
  useShareArrival(SIGNATURE_RISK_SHARE, (s) => setInp(s)); // the choices
  // What Share results carries: the four choices (memoised; there is always a reading).
  const share = useMemo<ShareEncoding>(() => SIGNATURE_RISK_SHARE.encode(inp), [inp]); // the encoding

  const noteText = (n: (typeof r.notes)[number]): string => {
    switch (n.kind) {
      case "accuracy-fp": return t(`note.accuracyFp.${n.accuracy}`);
      case "system-not-in-stack": return t("note.systemNotInStack");
      case "system-unknown": return t("note.systemUnknown");
      case "staged-not-blocking": return t("note.staged");
      case "transparent-not-blocking": return t("note.transparent");
      case "high-accuracy-lever": return t("note.highAccuracyLever");
      case "discipline-high-risk": return t("note.disciplineHighRisk");
      case "scope-it": return t("note.scopeIt");
      default: return "";
    }
  };

  const sev = QUADRANT_SEV[r.quadrant] ?? "info";

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool poison-tool fp-tool sig-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <p className="cidr-label">{t("inputLabel")}</p>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInp(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInp(DEFAULTS)}>{t("clear")}</button>
          </div>
        </div>

        <div className="poison-group">
          <label className="poison-field" htmlFor="sig-acc">
            <span className="poison-field-label">{t("f.accuracy")}</span>
            <select id="sig-acc" className="cidr-input poison-select" value={inp.accuracy} onChange={(e) => set("accuracy", e.target.value as Level)}>
              {LEVELS.map((l) => <option key={l} value={l}>{t(`level.${l}`)}</option>)}
            </select>
          </label>

          <label className="poison-field" htmlFor="sig-risk">
            <span className="poison-field-label">{t("f.risk")}</span>
            <select id="sig-risk" className="cidr-input poison-select" value={inp.risk} onChange={(e) => set("risk", e.target.value as Level)}>
              {LEVELS.map((l) => <option key={l} value={l}>{t(`level.${l}`)}</option>)}
            </select>
          </label>

          <label className="poison-field" htmlFor="sig-sys">
            <span className="poison-field-label">{t("f.system")}</span>
            <select id="sig-sys" className="cidr-input poison-select" value={inp.systemRelevance} onChange={(e) => set("systemRelevance", e.target.value as SystemRelevance)}>
              {RELEVANCE.map((s) => <option key={s} value={s}>{t(`system.${s}`)}</option>)}
            </select>
          </label>

          <label className="poison-field" htmlFor="sig-enf">
            <span className="poison-field-label">{t("f.enforcement")}</span>
            <select id="sig-enf" className="cidr-input poison-select" value={inp.enforcement} onChange={(e) => set("enforcement", e.target.value as Enforcement)}>
              {ENFORCE.map((s) => <option key={s} value={s}>{t(`enforcement.${s}`)}</option>)}
            </select>
          </label>
        </div>

        <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
        <p className="cipherstr-scope">{t("scopeNote")}</p>
      </div>

      <div className="tmsh-results poison-results">
        <section className={`poison-verdict poison-verdict-${sev}`}>
          <h3 className="poison-verdict-head">{t(`quadrant.${r.quadrant}`)}</h3>
          <div className="sig-badge-row">
            <span className={`fp-badge fp-badge-${FP_SEV[r.fpLikelihood] === "danger" ? "block" : "noblock"}`}>{t(`fp.${r.fpLikelihood}`)}</span>
            <span className="sig-impact">{t(`impact.${r.impactIfReal}`)}</span>
            <span className={`sig-block ${r.blocksNow ? "sig-block-on" : "sig-block-off"}`}>{r.blocksNow ? t("blocksNow") : t("notBlocking")}</span>
          </div>
        </section>

        {/* Share results (2026-10-27): under the verdict, at the start of its own row; the link carries the four choices. */}
        <div className="rdap-ask-row">
          <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
        </div>

        <section className="persist-section">
          <h3 className="persist-heading">{t("recHeading")}</h3>
          <p className="poison-verdict-detail">{t(`rec.${r.quadrant}`)}</p>
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
