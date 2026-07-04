"use client";

// ============================================================================
// src/components/L4ProfileExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE L4 PROFILE EXPLAINER. Name a profile for its card: family chip,
// story, when-to-use, tradeoffs, quirks. "profiles" renders the full table:
// full-proxy tcp, the living four, the legacy trio, FastL4, FastHTTP.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type L4ProfileResult, type L4Profile } from "@/lib/tools/f5-l4-profile-explainer";

type LiveResult = { ok: true; value: L4ProfileResult } | { ok: false; message: string };

// D-83 example: the card with the most decisions on it.
const EXAMPLE = "fastl4";

const FAMILY_CHIP: Record<string, string> = {
  "full-proxy": "familyFullProxy",
  living: "familyLiving",
  legacy: "familyLegacy",
  accelerated: "familyAccelerated",
  "light-proxy": "familyLightProxy",
};

function ProfileCard({ p, t }: { p: L4Profile; t: ReturnType<typeof useTranslations> }) {
  return (
    <article className="tmsh-object l4p-card">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{p.name}</span>
        <span className={`lbm-chip ${p.family === "legacy" ? "ivp-verify" : ""}`}>{t(FAMILY_CHIP[p.family])}</span>
      </header>
      <p className="gdf-step-behavior">{p.story}</p>
      <p className="lbm-subhead">{t("whenTitle")}</p>
      <ul className="dig-warning-list">{p.whenToUse.map((w, i) => <li key={i}>{w}</li>)}</ul>
      {p.tradeoffs.length > 0 && (
        <>
          <p className="lbm-subhead">{t("tradeoffsTitle")}</p>
          <ul className="dig-warning-list">{p.tradeoffs.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </>
      )}
      {p.quirks.length > 0 && (
        <div className="jwt-panel dig-warnings gdf-obs">
          <div className="jwt-panel-title">{t("quirksTitle")}</div>
          <ul className="dig-warning-list">{p.quirks.map((q, i) => <li key={i}>{q}</li>)}</ul>
        </div>
      )}
    </article>
  );
}

export default function L4ProfileExplainerTool() {
  const t = useTranslations("tools.f5-l4-profile-explainer");
  const [input, setInput] = useState("");

  const live: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: run(input) };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool l4p-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="l4p-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <input id="l4p-input" className="cidr-input mono" value={input}
          onChange={(e) => setInput(e.target.value)} placeholder={t("inputPlaceholder")} spellCheck={false} aria-describedby="l4p-privacy" />
        <p id="l4p-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
      </div>

      {live && !live.ok && <p className="cidr-error" role="alert">{live.message}</p>}

      {live && live.ok && (
        <div className="jwt-results l4p-results">
          {live.value.mode === "profile" && live.value.profile && <ProfileCard p={live.value.profile} t={t} />}
          {live.value.mode === "catalog" && live.value.catalog!.map((p) => <ProfileCard p={p} t={t} key={p.id} />)}
          {(live.value.observations.length > 0 || live.value.notes.length > 0) && (
            <div className="jwt-panel dig-warnings">
              <div className="jwt-panel-title">{t("observationsTitle")}</div>
              <ul className="dig-warning-list">{[...live.value.observations, ...live.value.notes].map((o, i) => <li key={i}>{o}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
