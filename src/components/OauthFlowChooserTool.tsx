"use client";
// ============================================================================
// src/components/OauthFlowChooserTool.tsx
// ----------------------------------------------------------------------------
// UI for the oauth-flow-chooser: one app-type select (lbm-select) + two
// checkbox questions, the recommendation as a tmsh-object card with its RFC
// citations, notes as lbm-facts, and the retired/avoided grants as their own
// tmsh-object list. Stepper CSS vocabulary only; D-83 Example/Clear; all
// strings i18n. (D-19.)
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { choose, type AppType } from "@/lib/tools/oauth-flow-chooser";

const APP_TYPES: AppType[] = ["server-web", "spa", "native", "service", "device"];

/** D-83 example = golden V06/V07 territory: SPA wanting identity + offline. */
const EXAMPLE = { appType: "spa" as AppType, wantsIdentity: true, needsOffline: true };

export default function OauthFlowChooserTool() {
  const t = useTranslations("tools.oauth-flow-chooser");
  const [appType, setAppType] = useState<AppType | "">("");
  const [wantsIdentity, setWantsIdentity] = useState(false);
  const [needsOffline, setNeedsOffline] = useState(false);

  const result = useMemo(
    () => (appType ? choose({ appType, wantsIdentity, needsOffline }) : null),
    [appType, wantsIdentity, needsOffline]
  );

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="oauth-app-type">
          {t("appTypeLabel")}
        </label>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setAppType(EXAMPLE.appType);
              setWantsIdentity(EXAMPLE.wantsIdentity);
              setNeedsOffline(EXAMPLE.needsOffline);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setAppType("");
              setWantsIdentity(false);
              setNeedsOffline(false);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>
      <select
        id="oauth-app-type"
        className="lbm-select"
        value={appType}
        onChange={(e) => setAppType(e.target.value as AppType | "")}
      >
        <option value="">{t("appTypePlaceholder")}</option>
        {APP_TYPES.map((v) => (
          <option key={v} value={v}>
            {t(`type_${v}`)}
          </option>
        ))}
      </select>

      <label className="cidr-label">
        <input
          type="checkbox"
          checked={wantsIdentity}
          onChange={(e) => setWantsIdentity(e.target.checked)}
        />{" "}
        {t("identityLabel")}
      </label>
      <label className="cidr-label">
        <input
          type="checkbox"
          checked={needsOffline}
          onChange={(e) => setNeedsOffline(e.target.checked)}
        />{" "}
        {t("offlineLabel")}
      </label>

      {result === null ? (
        <p className="ztc-empty">{t("emptyState")}</p>
      ) : !result.ok ? (
        <div className="json-error">
          <p className="json-error-title">{t("errorTitle")}</p>
          <p>{result.error}</p>
        </div>
      ) : (
        <div className="ztc-result">
          <div className="tmsh-object">
            <div className="tmsh-object-head">
              <span className="type-badge">{result.clientType}</span>
              <strong>{result.name}</strong>
            </div>
            <p className="lbm-facts">
              {t("grantLabel")} <code>{result.grant}</code> - {result.citations.join(", ")}
            </p>
            {result.why.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
            {result.warning ? <p className="json-error-title">{result.warning}</p> : null}
            {result.oidcNote ? <p className="lbm-facts">{result.oidcNote}</p> : null}
            {result.refreshNote ? <p className="lbm-facts">{result.refreshNote}</p> : null}
          </div>
          <p className="ztc-notes">{t("avoidedTitle")}</p>
          {result.avoided.map((a, i) => (
            <div key={i} className="tmsh-object">
              <div className="tmsh-object-head">
                <span className="type-badge">{t("avoidedBadge")}</span>
                <code>{a.grant}</code>
              </div>
              <p>{a.why}</p>
            </div>
          ))}
          <p className="ztc-notes">{t("runsLocally")}</p>
        </div>
      )}
    </div>
  );
}
