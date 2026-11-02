"use client";

// ============================================================================
// src/components/ApmSsoExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE APM SSO-METHOD EXPLAINER. Name a method for its card: mechanism,
// credentials, prerequisites, quirks, and the isolation verdict the manual's
// own blast-radius paragraph defines. "methods" renders all eight.
//
// SHARE RESULTS (2026-10-27): a button first in the reading builds, only when
// pressed, a link to this page carrying the method name as typed after the
// "#" (APM_SSO_SHARE, posture input): only a name the method table knows can
// travel. An arriving link fills the box as typing would; the address loses
// the value at once.
//
// PAGE LANGUAGE (01/11/2026): the method cards' texts are looked up by method
// id and position, and the observations, notes and errors arrive as
// EngineTexts from runLocalisable(), all under engine.* in the pack, so the
// pt-BR page reads in Portuguese; a key the pack lacks shows the English.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { type ApmSsoResult, type SsoMethod } from "@/lib/tools/f5-apm-sso-explainer";
import { runLocalisable } from "@/lib/tools/f5-apm-sso-explainer/compute"; // the reading with sentence ids (01/11/2026)
import { engineTexts, type EngineText, type EngineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { APM_SSO_SHARE } from "@/lib/tools/f5-apm-sso-explainer/share"; // this tool's share spec: the method name

type LiveResult = { ok: true; value: ApmSsoResult<EngineText> } | { ok: false; error: unknown }; // the error kept, so it can be translated

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

// D-83 example: the richest card, prerequisites and the no-keytab line included.
const EXAMPLE = "kerberos";

function MethodCard({ m, t, tx }: { m: SsoMethod; t: ReturnType<typeof useTranslations>; tx: EngineTexts }) {
  const k = (field: string) => `method.${m.id}.${field}`; // this card's keys
  return (
    <article className="tmsh-object apm-method">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{tx.key(k("name"), m.name)}</span>
        <span className={`lbm-chip ivp-verdict ${m.isolation === "isolated" ? "ivp-good" : "ivp-verify"}`}>
          {m.isolation === "isolated" ? t("isolatedChip") : t("poisonsChip")}
        </span>
      </header>
      <p className="gdf-step-behavior">{tx.key(k("mechanism"), m.mechanism)}</p>
      <p className="gdf-step-behavior"><strong>{t("credentialsLabel")}:</strong> {tx.key(k("credentials"), m.credentials)}</p>
      {m.prerequisites.length > 0 && (
        <>
          <p className="lbm-subhead">{t("prereqTitle")}</p>
          <ul className="dig-warning-list">{m.prerequisites.map((p, i) => <li key={i}>{tx.key(k(`prereq${i}`), p)}</li>)}</ul>
        </>
      )}
      {m.quirks.length > 0 && (
        <div className="jwt-panel dig-warnings gdf-obs">
          <div className="jwt-panel-title">{t("quirksTitle")}</div>
          <ul className="dig-warning-list">{m.quirks.map((q, i) => <li key={i}>{tx.key(k(`quirk${i}`), q)}</li>)}</ul>
        </div>
      )}
    </article>
  );
}

export default function ApmSsoExplainerTool() {
  const t = useTranslations("tools.f5-apm-sso-explainer");
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
  // An arriving share link (2026-10-27): the name fills the box as typing would, and the page shows its card.
  useShareArrival(APM_SSO_SHARE, (state) => setInput(state.input)); // as typing would
  // What Share results may carry: the name as typed, once the table knows it (memoised).
  const share = useMemo<ShareEncoding>(() => (live && live.ok ? APM_SSO_SHARE.encode({ input }) : NOTHING), [live, input]); // the encoding

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool apm-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="apm-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <input id="apm-input" className="cidr-input mono" value={input}
          onChange={(e) => setInput(e.target.value)} placeholder={t("inputPlaceholder")} spellCheck={false} aria-describedby="apm-privacy" />
        <p id="apm-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
      </div>

      {live && !live.ok && <p className="cidr-error" role="alert">{tx.error(live.error)}</p>}

      {live && live.ok && (
        <div className="jwt-results apm-results">
          {/* Share results (2026-10-27): first in the reading, at the start of its own row, so it is in view above the
              card (or the eight cards) and its popover opens below it. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
          {live.value.mode === "method" && live.value.method && <MethodCard m={live.value.method} t={t} tx={tx} />}
          {live.value.mode === "catalog" && live.value.catalog!.map((m) => <MethodCard m={m} t={t} tx={tx} key={m.id} />)}
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
