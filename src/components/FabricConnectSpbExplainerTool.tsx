"use client";

// ============================================================================
// Fabric Connect / SPB explainer - the UI. Deterministic and offline.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainSpb, SpbInputError, type SpbResult } from "@/lib/tools/fabric-connect-spb-explainer";

const EMPTY = { isid: "", service: "unknown", primary: "4051", secondary: "4052", nickname: "", role: "" };
const EXAMPLE = { isid: "20010", service: "l2vsn", primary: "4051", secondary: "4052", nickname: "1.00.01", role: "beb" };

export default function FabricConnectSpbExplainerTool() {
  const t = useTranslations("tools.fabric-connect-spb-explainer");
  const [f, setF] = useState(EMPTY);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const result = useMemo<{ ok: true; data: SpbResult } | { ok: false; message: string } | null>(() => {
    if (!f.isid.trim() && !f.nickname.trim() && !f.role) return null;
    try {
      return {
        ok: true,
        data: explainSpb({
          isid: f.isid.trim() ? Number(f.isid) : undefined,
          service: f.service as "l2vsn" | "l3vsn" | "multicast" | "unknown",
          primaryBvlan: Number(f.primary) || undefined,
          secondaryBvlan: Number(f.secondary) || undefined,
          nickname: f.nickname.trim() || undefined,
          role: (f.role || undefined) as "beb" | "bcb" | undefined,
        }),
      };
    } catch (e) {
      if (e instanceof SpbInputError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [f]);

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

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <h3 className="dig-section-title">{t("facts.title")}</h3>
            <ol className="dig-records">
              {result.data.facts.map((x, i) => (
                <li key={`${x.label}-${i}`} className="dig-record">
                  <code className="mono">{x.label}: {x.value}</code>
                  <p className="dig-record-explain">{x.explain}</p>
                </li>
              ))}
            </ol>
          </section>

          {result.data.notes.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("notes.title")}</h3>
              <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </section>
          )}
          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
