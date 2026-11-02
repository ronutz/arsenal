"use client";

// ============================================================================
// src/components/DosVectorExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE AFM DoS-VECTOR EXPLAINER. Defensive configuration only.
//
// Paste security dos device-config / profile stanzas and every vector entry
// renders as a card: the vendor's one-line identity, the annotated threshold
// fields, and the deterministic observations underneath - the mitigation-
// below-detection inversion, automatic-mode semantics, silent policing,
// enforce/state meanings, bad-actor wiring, and the tcp-half-open interplay
// notes. A vector name renders one card; "vectors" renders the grouped
// catalogue. This tool explains protections; it never generates traffic.
//
// The engine throws on bad input (the worker-compatible contract); the live
// run is wrapped and errors render in the shared error box. Chrome strings
// come from the tools.f5-dos-vector-explainer namespace. PAGE LANGUAGE
// (01/11/2026): the engine's sentences (observations, notes, errors) arrive as
// EngineTexts from runLocalisable() and its catalogue texts (descriptions,
// field notes, category labels) are looked up by name, both under engine.* in
// the pack, so the pt-BR page reads in Portuguese; a key the pack lacks shows
// the engine's English (src/lib/tools/engine-text.ts).
//
// SHARE RESULTS (2026-10-27): a button first in the reading builds, only when
// pressed, a link to this page carrying the paste as typed after the "#"
// (DOS_VECTOR_SHARE, posture input-caution: the popover adds a caution line).
// A paste that also holds a secret setting (a monitor's password, an LDAP
// bind password) gets no link, and the popover names it. An arriving link
// fills the box as a paste would; the address loses the value at once.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { DOS_VECTOR_SHARE } from "@/lib/tools/f5-dos-vector-explainer/share"; // this tool's share spec: the paste as typed
import {
  type DosResult,
  type VectorInfo,
  type VectorReading,
} from "@/lib/tools/f5-dos-vector-explainer";
import { runLocalisable } from "@/lib/tools/f5-dos-vector-explainer/compute"; // the reading with sentence ids (01/11/2026)
import { engineTexts, type EngineText, type EngineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language

/** The live-run result, with thrown errors folded into an error envelope (the error kept, so it can be translated). */
type LiveResult = { ok: true; value: DosResult<EngineText> } | { ok: false; error: unknown };

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

// The one-click example (D-83): the golden-vector device config that fires
// the marquee observations - the half-open inversion with its silent-drop
// warning, automatic mode with inert manual numbers, detection-disabled
// policing on udp-flood, bad-actor wiring on sweep, and a db tunable.
const EXAMPLE = `security dos device-config dos-device-config {
    threshold-sensitivity medium
    dos-device-vector {
        tcp-half-open {
            detection-threshold-pps 2500
            default-internal-rate-limit 2000
            enforce enabled
        }
        icmpv4-flood {
            auto-threshold enabled
            detection-threshold-pps 10000
        }
        udp-flood {
            detection-threshold-pps infinite
            detection-threshold-percent infinite
            default-internal-rate-limit 30000
        }
        sweep {
            bad-actor enabled
        }
    }
}`;

/** One catalogue/lookup card for a curated vector. */
function VectorCard({ v, t, tx }: { v: VectorInfo; t: ReturnType<typeof useTranslations>; tx: EngineTexts }) {
  return (
    <article className="tmsh-object dve-vector">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{v.name}</span>
        <span className="lbm-chip dve-cat">{tx.key(`catChip.${v.category}`, v.category)}</span>{/* the category tag: the slug in English, a word in pt-BR */}
        {v.dbVar && <span className="lbm-chip mono dve-db">sys db {v.dbVar}</span>}
      </header>
      <p className="gdf-step-behavior">{tx.key(`vec.${v.name}.desc`, v.description)}</p>{/* F5's one-line identity */}
      {v.notes && v.notes.length > 0 && (
        <div className="lbm-caveats">
          <p className="lbm-subhead">{t("notesHeading")}</p>
          <ul>
            {v.notes.map((n, i) => (
              <li key={i}>{tx.key(`vec.${v.name}.note${i}`, n)}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

/** One parsed reading: identity + fields + observations. */
function ReadingCard({ r, t, tx }: { r: VectorReading<EngineText>; t: ReturnType<typeof useTranslations>; tx: EngineTexts }) {
  return (
    <article className="tmsh-object dve-reading">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{r.name}</span>
        <span className="lbm-chip">{r.context === "device" ? t("contextDevice") : t("contextProfile")}</span>
        {r.profileName && <span className="lbm-chip mono">{r.profileName}</span>}
        {r.profileSection && <span className="lbm-chip mono">{r.profileSection}</span>}
        {r.info ? <span className="lbm-chip dve-cat">{tx.key(`catChip.${r.info.category}`, r.info.category)}</span> : <span className="lbm-chip dve-uncurated">{t("uncurated")}</span>}
      </header>
      {r.info && <p className="gdf-step-behavior">{tx.key(`vec.${r.info.name}.desc`, r.info.description)}</p>}
      {r.fields.length > 0 && (
        <dl className="lbm-settings">
          {r.fields.map((f, j) => (
            <div className="lbm-setting" key={j}>
              <dt className="mono">{f.key}</dt>
              <dd>
                <span className="mono">{f.value}</span>
                {f.note && <span className="lbm-setting-note">· {tx.key(`field.${f.key}`, f.note)}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {r.observations.length > 0 && (
        <div className="jwt-panel dig-warnings gdf-obs">
          <div className="jwt-panel-title">{t("observationsTitle")}</div>
          <ul className="dig-warning-list">
            {r.observations.map((o, i) => (
              <li key={i}>{tx.say(o)}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function DosVectorExplainerTool() {
  const t = useTranslations("tools.f5-dos-vector-explainer");
  const tx = engineTexts(t); // the engine's sentences and catalogue texts in the page's language
  const [input, setInput] = useState("");

  const live: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: runLocalisable(input) }; // the reading, sentences with ids
    } catch (e) {
      return { ok: false, error: e }; // shown through tx.error
    }
  }, [input]);
  // An arriving share link (2026-10-27): the text fills the box as a paste would, and the page reads it.
  useShareArrival(DOS_VECTOR_SHARE, (state) => setInput(state.input)); // as a paste would
  // What Share results may carry: the paste as typed, once it reads (memoised; the engine is not run again).
  const share = useMemo<ShareEncoding>(() => (live && live.ok ? DOS_VECTOR_SHARE.encode({ input }) : NOTHING), [live, input]); // the encoding
  // The popover's reason when the paste holds a secret setting: it names the setting.
  const blockedMessage = !share.ok && share.reason === "blocked" ? t("share.blocked", { name: String(share.values?.name ?? "") }) : ""; // only when blocked

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool dve-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="dve-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="dve-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("inputPlaceholder")}
          spellCheck={false}
          rows={12}
          aria-describedby="dve-privacy"
        />
        <p id="dve-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
        <p className="dve-posture">{t("defensiveNote")}</p>
      </div>

      {live && !live.ok && (
        <p className="cidr-error" role="alert">
          {tx.error(live.error)}
        </p>
      )}

      {live && live.ok && (
        <div className="jwt-results dve-results">
          {/* Share results (2026-10-27): first in the reading, at the start of its own row, so it is in view without
              scrolling past the cards and its popover opens below it; the link carries the paste, the whole reading. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={[t("share.caution")]} blockedMessage={blockedMessage} title={t("name")} />
          </div>
          {live.value.notes.length > 0 && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("notesTitle")}</div>
              <ul className="dig-warning-list">
                {live.value.notes.map((n, i) => (
                  <li key={i}>{tx.say(n)}</li>
                ))}
              </ul>
            </div>
          )}

          {live.value.mode === "vector" && live.value.vector && <VectorCard v={live.value.vector} t={t} tx={tx} />}

          {live.value.mode === "catalog" &&
            live.value.catalog!.map((g) => (
              <div key={g.category}>
                <div className="jwt-panel">
                  <div className="jwt-panel-title">
                    {tx.key(`cat.${g.category}`, g.label)} <span className="lbm-chip mono">{g.vectors.length}</span>
                  </div>
                </div>
                {g.vectors.map((v) => (
                  <VectorCard v={v} t={t} tx={tx} key={v.name} />
                ))}
              </div>
            ))}

          {live.value.mode === "config" && live.value.readings!.map((r, i) => <ReadingCard r={r} t={t} tx={tx} key={i} />)}
        </div>
      )}
    </div>
  );
}
