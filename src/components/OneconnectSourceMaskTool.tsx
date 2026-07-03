"use client";

// ============================================================================
// src/components/OneconnectSourceMaskTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE OneConnect EXPLAINER. Paste a profile for the full option audit,
// run a mask simulation to SEE the reuse groups (and watch a single SNAT
// address collapse them, exactly as K7208/K5911 order it), or ask for the
// settings catalogue.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type OneConnectResult } from "@/lib/tools/f5-oneconnect-source-mask";

type LiveResult = { ok: true; value: OneConnectResult } | { ok: false; message: string };

// D-83 example: the sim-snat-collapse golden vector, the tool's marquee.
const EXAMPLE = "mask 255.255.255.255 ips 10.1.1.5 10.9.9.9 172.16.0.4 snat 192.0.2.10";

export default function OneconnectSourceMaskTool() {
  const t = useTranslations("tools.f5-oneconnect-source-mask");
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
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool ocm-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ocm-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="ocm-input" className="cidr-input mono saml-textarea json-input tmsh-input" value={input}
          onChange={(e) => setInput(e.target.value)} placeholder={t.raw("inputPlaceholder")} spellCheck={false} rows={9} aria-describedby="ocm-privacy" />
        <p id="ocm-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
      </div>

      {live && !live.ok && <p className="cidr-error" role="alert">{live.message}</p>}

      {live && live.ok && (
        <div className="jwt-results ocm-results">
          {live.value.mode === "settings" && live.value.catalog!.map((c) => (
            <article className="tmsh-object" key={c.key}>
              <header className="tmsh-object-head">
                <span className="tmsh-type-badge mono">{c.key}</span>
                <span className="lbm-chip mono">{t("defaultChip")}: {c.def}</span>
              </header>
              <p className="gdf-step-behavior">{c.explanation}</p>
            </article>
          ))}

          {live.value.mode === "profile" && (
            <>
              <div className="jwt-panel"><div className="jwt-panel-title mono">{live.value.profileName}</div></div>
              {live.value.settings!.map((s) => (
                <article className="tmsh-object" key={s.key}>
                  <header className="tmsh-object-head">
                    <span className="tmsh-type-badge mono">{s.key}</span>
                    <span className="lbm-chip mono">{s.value}</span>
                    {s.isDefault && <span className="lbm-chip">{t("defaultChip")}</span>}
                  </header>
                  <p className="gdf-step-behavior">{s.explanation}</p>
                </article>
              ))}
            </>
          )}

          {live.value.mode === "mask" && live.value.sim && (
            <>
              <div className="jwt-panel">
                <div className="jwt-panel-title mono">
                  {t("maskTitle")}: {live.value.sim.maskDotted}
                  {live.value.sim.prefix !== null ? ` (/${live.value.sim.prefix})` : ""}
                  {live.value.sim.snat ? ` · snat ${live.value.sim.snat}` : ""}
                </div>
              </div>
              {live.value.sim.groups.map((g, i) => (
                <article className="tmsh-object" key={i}>
                  <header className="tmsh-object-head">
                    <span className="tmsh-type-badge mono">{t("groupLabel")} {g.network}</span>
                    <span className="lbm-chip mono">{g.members.length}</span>
                  </header>
                  <p className="gdf-step-behavior mono">{g.members.join(" · ")}</p>
                </article>
              ))}
              <div className="jwt-panel dig-warnings gdf-obs">
                <div className="jwt-panel-title">{t("observationsTitle")}</div>
                <ul className="dig-warning-list">{live.value.sim.observations.map((o, i) => <li key={i}>{o}</li>)}</ul>
              </div>
            </>
          )}

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
