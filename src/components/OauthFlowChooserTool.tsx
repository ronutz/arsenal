"use client";
// ============================================================================
// src/components/OauthFlowChooserTool.tsx
// ----------------------------------------------------------------------------
// UI for the oauth-flow-chooser: one app-type select (lbm-select) + two
// checkbox questions, the recommendation as a tmsh-object card with its RFC
// citations, notes as lbm-facts, and the retired/avoided grants as their own
// tmsh-object list. Stepper CSS vocabulary only; D-83 Example/Clear; all
// strings i18n. (D-19.)
//
// SHARE RESULTS (2026-10-27): under the recommendation, a button builds a link
// only when pressed, carrying the three answers as named values (a form:
// src/lib/tools/oauth-flow-chooser/share.ts); an arriving link
// (useShareArrival) replaces the form's answers and the page recommends again.
//
// PAGE LANGUAGE (02/11/2026): the recommendation's names, reasons, notes and
// avoided list arrive as EngineTexts from chooseLocalisable() and show through
// engineTexts(t) (keys under engine.*); the client-type badge reads
// clientType.<type>. The English page reads as before.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { chooseLocalisable, type AppType } from "@/lib/tools/oauth-flow-chooser/compute"; // the reading with sentence ids
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { OAUTH_CHOOSER_SHARE } from "@/lib/tools/oauth-flow-chooser/share"; // this tool's share spec: the three answers

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the button is disabled

const APP_TYPES: AppType[] = ["server-web", "spa", "native", "service", "device"];

/** D-83 example = golden V06/V07 territory: SPA wanting identity + offline. */
const EXAMPLE = { appType: "spa" as AppType, wantsIdentity: true, needsOffline: true };

export default function OauthFlowChooserTool() {
  const t = useTranslations("tools.oauth-flow-chooser");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [appType, setAppType] = useState<AppType | "">("");
  const [wantsIdentity, setWantsIdentity] = useState(false);
  const [needsOffline, setNeedsOffline] = useState(false);

  const result = useMemo(
    () => (appType ? chooseLocalisable({ appType, wantsIdentity, needsOffline }) : null), // sentences with ids
    [appType, wantsIdentity, needsOffline]
  );

  // An arriving share link: the three answers replace the form's.
  useShareArrival(OAUTH_CHOOSER_SHARE, (s) => { setAppType(s.appType); setWantsIdentity(s.wantsIdentity); setNeedsOffline(s.needsOffline); }); // filled
  // What Share results may carry: the three answers, once there is a recommendation.
  const share = useMemo<ShareEncoding>(() => (result && result.ok ? OAUTH_CHOOSER_SHARE.encode({ appType, wantsIdentity, needsOffline }) : NOTHING), [result, appType, wantsIdentity, needsOffline]); // memoised

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
        <div className="json-error-box">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p>{result.error}</p>
        </div>
      ) : (
        <div className="ztc-result">
          <div className="tmsh-object">
            <div className="tmsh-object-head">
              <span className="tmsh-type-badge">{t(`clientType.${result.clientType}`)}</span>
              <strong>{tx.say(result.name)}</strong>
            </div>
            <p className="lbm-facts">
              {t("grantLabel")} <code>{result.grant}</code> - {result.citations.join(", ")}
            </p>
            {/* Share results: under the recommendation's headline (moved there after looking: at the end of the card,
                above "Not chosen", it read as belonging to the grants to avoid). */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
            </div>
            {result.why.map((w, i) => (
              <p key={i}>{tx.say(w)}</p>
            ))}
            {result.warning ? <p className="json-error-headline">{tx.say(result.warning)}</p> : null}
            {result.oidcNote ? <p className="lbm-facts">{tx.say(result.oidcNote)}</p> : null}
            {result.refreshNote ? <p className="lbm-facts">{tx.say(result.refreshNote)}</p> : null}
          </div>
          <p className="ztc-notes">{t("avoidedTitle")}</p>
          {result.avoided.map((a, i) => (
            <div key={i} className="tmsh-object">
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{t("avoidedBadge")}</span>
                <code>{tx.say(a.grant)}</code>
              </div>
              <p>{tx.say(a.why)}</p>
            </div>
          ))}
          <p className="ztc-notes">{t("runsLocally")}</p>
        </div>
      )}
    </div>
  );
}
