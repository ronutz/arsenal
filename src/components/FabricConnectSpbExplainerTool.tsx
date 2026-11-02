"use client";

// ============================================================================
// Fabric Connect / SPB explainer - the UI. Deterministic and offline.
//
// PAGE LANGUAGE (02/11/2026): the fact labels and explanations, notes, warnings
// and errors arrive as EngineTexts from explainSpbLocalisable() and are shown
// through engineTexts(t) (keys under engine.* in the pack).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainSpbLocalisable, type SpbResult } from "@/lib/tools/fabric-connect-spb-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the page as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { SPB_SHARE } from "@/lib/tools/fabric-connect-spb-explainer/share"; // this tool's share spec: the form as typed

const EMPTY = { isid: "", service: "unknown", primary: "4051", secondary: "4052", nickname: "", role: "" };
const EXAMPLE = { isid: "20010", service: "l2vsn", primary: "4051", secondary: "4052", nickname: "1.00.01", role: "beb" };
/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

export default function FabricConnectSpbExplainerTool() {
  const t = useTranslations("tools.fabric-connect-spb-explainer");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [f, setF] = useState(EMPTY);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const result = useMemo<{ ok: true; data: SpbResult<EngineText> } | { ok: false; error: unknown } | null>(() => {
    if (!f.isid.trim() && !f.nickname.trim() && !f.role) return null;
    try {
      return {
        ok: true,
        data: explainSpbLocalisable({ // the reading, sentences with ids
          isid: f.isid.trim() ? Number(f.isid) : undefined,
          service: f.service as "l2vsn" | "l3vsn" | "multicast" | "unknown",
          primaryBvlan: Number(f.primary) || undefined,
          secondaryBvlan: Number(f.secondary) || undefined,
          nickname: f.nickname.trim() || undefined,
          role: (f.role || undefined) as "beb" | "bcb" | undefined,
        }),
      };
    } catch (e) {
      return { ok: false, error: e }; // shown through tx.error (an input error carries its sentence)
    }
  }, [f]);

  // Share results (2026-11-01): every field as typed, only beside an explanation.
  const share = useMemo<ShareEncoding>(() => (result && result.ok ? SPB_SHARE.encode(f) : NOTHING), [result, f]); // the button's encoding
  // A shared link sets every field as typing would; the page explains them.
  useShareArrival(SPB_SHARE, (s) => setF({ ...s }));

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label className="cidr-label">{t("formLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setF(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setF(EMPTY)}>{t("clear")}</button>
        </div>
      </div>

      <div className="dig-kv">
        <div>
          <label htmlFor="spb-isid" className="cidr-label">{t("fields.isid")}</label>
          <input id="spb-isid" className="cidr-input mono" value={f.isid} onChange={set("isid")} spellCheck={false} />
        </div>
        <div>
          <label htmlFor="spb-service" className="cidr-label">{t("fields.service")}</label>
          <select id="spb-service" className="cidr-input mono" value={f.service} onChange={set("service")}>
            {["unknown", "l2vsn", "l3vsn", "multicast"].map((s) => <option key={s} value={s}>{t(`services.${s}`)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="spb-primary" className="cidr-label">{t("fields.primary")}</label>
          <input id="spb-primary" className="cidr-input mono" value={f.primary} onChange={set("primary")} spellCheck={false} />
        </div>
        <div>
          <label htmlFor="spb-secondary" className="cidr-label">{t("fields.secondary")}</label>
          <input id="spb-secondary" className="cidr-input mono" value={f.secondary} onChange={set("secondary")} spellCheck={false} />
        </div>
        <div>
          <label htmlFor="spb-nick" className="cidr-label">{t("fields.nickname")}</label>
          <input id="spb-nick" className="cidr-input mono" value={f.nickname} onChange={set("nickname")} spellCheck={false} placeholder="1.00.01" />
        </div>
        <div>
          <label htmlFor="spb-role" className="cidr-label">{t("fields.role")}</label>
          <select id="spb-role" className="cidr-input mono" value={f.role} onChange={set("role")}>
            <option value="">{t("roles.none")}</option>
            <option value="beb">{t("roles.beb")}</option>
            <option value="bcb">{t("roles.bcb")}</option>
          </select>
        </div>
      </div>

      {result && !result.ok && <p className="cidr-error">{tx.error(result.error)}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <h3 className="dig-section-title">{t("facts.title")}</h3>
            <ol className="dig-records">
              {result.data.facts.map((x, i) => (
                <li key={`${x.label.id}-${i}`} className="dig-record">
                  <code className="mono">{tx.say(x.label)}: {x.value}</code>
                  <p className="dig-record-explain">{tx.say(x.explain)}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Share results: under the facts (the answer), before the notes and warnings, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>

          {result.data.notes.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("notes.title")}</h3>
              <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}</ul>
            </section>
          )}
          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{tx.say(w)}</li>)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
