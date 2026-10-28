"use client";

// ============================================================================
// src/components/OneconnectSourceMaskTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE OneConnect EXPLAINER. Paste a profile for the full option audit,
// run a mask simulation to SEE the reuse groups (and watch a single SNAT
// address collapse them, exactly as K7208/K5911 order it), or ask for the
// settings catalogue.
//
// SHARE RESULTS (2026-10-27): a button builds, only when pressed, a link
// carrying the box as typed (spec:
// src/lib/tools/f5-oneconnect-source-mask/share.ts): under the profile's name,
// under the mask simulation's reuse groups, or at the head of the settings
// catalogue. An arriving
// link (useShareArrival) fills the box as a paste would; the address loses
// the value at once.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type OneConnectResult } from "@/lib/tools/f5-oneconnect-source-mask";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { ONECONNECT_SHARE } from "@/lib/tools/f5-oneconnect-source-mask/share"; // this tool's share spec: the box as typed

type LiveResult = { ok: true; value: OneConnectResult } | { ok: false; message: string };

// D-83 example: the sim-snat-collapse golden vector, the tool's marquee.
const EXAMPLE = "mask 255.255.255.255 ips 10.1.1.5 10.9.9.9 172.16.0.4 snat 192.0.2.10";

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

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
  // An arriving share link: the text fills the box as a paste would.
  useShareArrival(ONECONNECT_SHARE, (state) => setInput(state.input)); // the text
  // What Share results may carry: the box as typed, while it gives an answer.
  const share = useMemo<ShareEncoding>(() => (live?.ok ? ONECONNECT_SHARE.encode({ input }) : NOTHING), [live, input]); // memoised
  // The button's row, drawn under the first answer of each mode.
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
    </div>
  ); // one element, placed per mode below

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
          {/* Share results: at the head of the settings catalogue (a list), at the start of its own row. */}
          {live.value.mode === "settings" && shareRow}
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
              {/* Share results: under the profile's name, at the start of its own row. */}
              {shareRow}
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
              {/* Share results: under the reuse groups (the simulation's answer), at the start of its own row; above them
                  it split the mask line from its groups (moved after looking). */}
              {shareRow}
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
