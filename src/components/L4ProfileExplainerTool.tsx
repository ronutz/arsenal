"use client";

// ============================================================================
// src/components/L4ProfileExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE L4 PROFILE EXPLAINER. Name a profile for its card: family chip,
// story, when-to-use, tradeoffs, quirks. "profiles" renders the full table:
// full-proxy tcp, the living four, the legacy trio, FastL4, FastHTTP.
//
// SHARE RESULTS (2026-10-27): a button at the head of the answer, above a
// profile's card or the catalogue, builds, only when pressed, a link carrying
// the field as typed (spec: src/lib/tools/f5-l4-profile-explainer/share.ts). An
// arriving link (useShareArrival) fills the field as typing would; the
// address loses the value at once.
//
// PAGE LANGUAGE (01/11/2026): the cards' texts are looked up by profile id and
// position, and the observations, notes and errors arrive as EngineTexts from
// runLocalisable(), all under engine.* in the pack, so the pt-BR page reads in
// Portuguese; a key the pack lacks shows the engine's English.
//
// WITHOUT A KEYBOARD (03/11/2026): under the field, one pressed-or-not button
// per profile in the engine's table (PROFILES) and one for "profiles", the
// whole table. A press sets the field to that name, as typing it would; the
// button of the card shown is pressed, an alias typed by hand included (pva
// presses fastl4). The field is still typed; the buttons reuse the site's
// preset-chip vocabulary (tcl-presets-row, tcl-chip), 44 px tall on a touch screen
// (tcl-presets-row--tap).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { type L4ProfileResult, type L4Profile } from "@/lib/tools/f5-l4-profile-explainer";
import { runLocalisable, PROFILES } from "@/lib/tools/f5-l4-profile-explainer/compute"; // the reading with sentence ids (01/11/2026), and the table's profiles (their buttons)
import { engineTexts, type EngineText, type EngineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { L4_PROFILE_SHARE } from "@/lib/tools/f5-l4-profile-explainer/share"; // this tool's share spec: the name as typed

type LiveResult = { ok: true; value: L4ProfileResult<EngineText> } | { ok: false; error: unknown }; // the error kept, so it can be translated

// D-83 example: the card with the most decisions on it.
const EXAMPLE = "fastl4";

/** The word that asks the engine for the whole table (one of the four it reads). */
const CATALOG_WORD = "profiles"; // runLocalisable reads profiles, catalog, list or all

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

const FAMILY_CHIP: Record<string, string> = {
  "full-proxy": "familyFullProxy",
  living: "familyLiving",
  legacy: "familyLegacy",
  accelerated: "familyAccelerated",
  "light-proxy": "familyLightProxy",
};

function ProfileCard({ p, t, tx }: { p: L4Profile; t: ReturnType<typeof useTranslations>; tx: EngineTexts }) {
  const k = (field: string) => `profile.${p.id}.${field}`; // this card's keys
  return (
    <article className="tmsh-object l4p-card">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{tx.key(k("name"), p.name)}</span>
        <span className={`lbm-chip ${p.family === "legacy" ? "ivp-verify" : ""}`}>{t(FAMILY_CHIP[p.family])}</span>
      </header>
      <p className="gdf-step-behavior">{tx.key(k("story"), p.story)}</p>
      <p className="lbm-subhead">{t("whenTitle")}</p>
      <ul className="dig-warning-list">{p.whenToUse.map((w, i) => <li key={i}>{tx.key(k(`when${i}`), w)}</li>)}</ul>
      {p.tradeoffs.length > 0 && (
        <>
          <p className="lbm-subhead">{t("tradeoffsTitle")}</p>
          <ul className="dig-warning-list">{p.tradeoffs.map((x, i) => <li key={i}>{tx.key(k(`tradeoff${i}`), x)}</li>)}</ul>
        </>
      )}
      {p.quirks.length > 0 && (
        <div className="jwt-panel dig-warnings gdf-obs">
          <div className="jwt-panel-title">{t("quirksTitle")}</div>
          <ul className="dig-warning-list">{p.quirks.map((q, i) => <li key={i}>{tx.key(k(`quirk${i}`), q)}</li>)}</ul>
        </div>
      )}
    </article>
  );
}

export default function L4ProfileExplainerTool() {
  const t = useTranslations("tools.f5-l4-profile-explainer");
  const tx = engineTexts(t); // the engine's sentences and the cards' texts in the page's language
  const [input, setInput] = useState("");

  const live: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: runLocalisable(input) }; // the reading, sentences with ids
    } catch (e) {
      return { ok: false, error: e }; // shown through tx.error
    }
  }, [input]);
  // An arriving share link: the name fills the field as typing would.
  useShareArrival(L4_PROFILE_SHARE, (state) => setInput(state.input)); // the name
  // What Share results may carry: the field as typed, while it gives an answer.
  const share = useMemo<ShareEncoding>(() => (live?.ok ? L4_PROFILE_SHARE.encode({ input }) : NOTHING), [live, input]); // memoised
  // The button's row: at the head of the answer, in both modes.
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
    </div>
  ); // one element, placed below

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
        {/* One button per profile in the engine's table, then the whole table: a press sets the field to that name; the
            button of the card shown is pressed. */}
        <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("pickLabel")}>
          {PROFILES.map((p) => (
            <button key={p.id} type="button" className="tcl-chip mono" aria-pressed={!!live?.ok && live.value.mode === "profile" && live.value.profile?.id === p.id} onClick={() => setInput(p.id)}>
              {p.id}
            </button>
          ))}
          <button type="button" className="tcl-chip mono" aria-pressed={!!live?.ok && live.value.mode === "catalog"} onClick={() => setInput(CATALOG_WORD)}>
            {CATALOG_WORD}
          </button>
        </div>
        <p id="l4p-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
      </div>

      {live && !live.ok && <p className="cidr-error" role="alert">{tx.error(live.error)}</p>}

      {live && live.ok && (
        <div className="jwt-results l4p-results">
          {/* Share results: at the head of the answer, at the start of its own row (a profile's card runs to three screens
              at 390 px, so under it the button was out of reach; moved after looking). */}
          {shareRow}
          {live.value.mode === "profile" && live.value.profile && <ProfileCard p={live.value.profile} t={t} tx={tx} />}
          {live.value.mode === "catalog" && live.value.catalog!.map((p) => <ProfileCard p={p} t={t} tx={tx} key={p.id} />)}
          {(live.value.observations.length > 0 || live.value.notes.length > 0) && (
            <div className="jwt-panel dig-warnings">
              <div className="jwt-panel-title">{t("observationsTitle")}</div>
              <ul className="dig-warning-list">{[...live.value.observations, ...live.value.notes].map((o, i) => <li key={i}>{tx.say(o)}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
