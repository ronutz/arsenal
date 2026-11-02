"use client";

// ============================================================================
// src/components/F5xcObjectLinterTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC object linter. Paste an origin_pool, http_loadbalancer, or
// app_firewall object; the flagged settings are shown with a severity and a
// localized, grounded explanation. Findings render from i18n keyed by code +
// params, keeping the compute language-free. Reuses cidr-/jwt- vocabulary.
//
// Share results (2026-11-01, wave 4B): a button under the findings builds a
// link, only when pressed, carrying a copy of the object with every SecretType
// secret and every added header or cookie value replaced (src/lib/tools/
// f5xc-object-linter/share.ts, posture derived). When only header or cookie
// values were replaced, the popover offers a switch to include them. An
// arriving link fills the box, and the page lints it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { lintObject, type Severity } from "@/lib/tools/f5xc-object-linter/compute";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first maybe-secret, for the popover line
import { OBJECT_LINTER_SHARE, encodeLinterRevealed, encodeLinterShare, linterShareCopy } from "@/lib/tools/f5xc-object-linter/share"; // this tool's share spec: the copy, and the object as pasted for the reveal switch

const EXAMPLE = JSON.stringify(
  {
    metadata: { name: "public-app" },
    spec: {
      domains: ["*.example.com", "example.com"],
      http: {},
      routes: [{ simple_route: { path: { prefix: "/" } } }, { simple_route: { path: { prefix: "/api" } } }],
    },
  },
  null,
  2,
);

const sevClass: Record<Severity, string> = { high: "jwt-badge--bad", warn: "jwt-badge--warn", info: "" };

export default function F5xcObjectLinterTool() {
  const t = useTranslations("tools.f5xc-object-linter");
  const [text, setText] = useState("");
  const r = useMemo(() => (text.trim() !== "" ? lintObject(text) : null), [text]);
  // An arriving share link (2026-11-01): the box fills as a paste would, and the page lints it.
  useShareArrival(OBJECT_LINTER_SHARE, (s) => setText(s.input)); // the link's text
  // The object's copy, once per change of the box (only while there is an object to share).
  const shareCopy = useMemo(() => (r && r.recognized ? linterShareCopy(text, r) : null), [r, text]); // or null
  // What Share results may carry: the copy, nothing, or blocked.
  const share = useMemo(() => encodeLinterShare(shareCopy), [shareCopy]); // the encoding
  // The reveal switch (PRIME 01/11/2026): the object as pasted, offered only beside a copy that replaced header or cookie values alone.
  const revealed = useMemo(() => encodeLinterRevealed(text, shareCopy), [text, shareCopy]); // or nothing
  const replaced = shareCopy && shareCopy.copy.ok ? shareCopy.copy.replaced : 0; // values the copy replaced
  const shareReveal = share.ok && shareCopy?.revealable ? { encoding: revealed, label: t("share.revealLabel", { n: replaced }), carries: t("share.carriesRevealed"), details: [t("share.revealedCaution")] } : undefined; // the switch, or none
  // The first secret-looking name with a value, named in place of the plain caution.
  const maybe = shareCopy && shareCopy.copy.ok ? firstSharePlace(shareCopy.copy.report.maybe) : null; // or null
  // The popover's lines under the first: how many values were replaced, then the caution (or the maybe line).
  const shareDetails = shareCopy && shareCopy.copy.ok ? [t("share.replaced", { n: replaced }), maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")] : []; // two lines
  // Why there is no link, when there is none.
  const shareBlocked = !share.ok && share.reason === "blocked" ? (share.code === "secret" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : t("share.blockedCopy")) : ""; // or nothing

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="lint-json">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setText(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => setText("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea id="lint-json" className="cidr-input mono json-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} rows={9} autoComplete="off" spellCheck={false} />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {r && !r.ok && (
        <p className="cidr-error" role="alert">
          {r.error}
        </p>
      )}
      {r && r.ok && !r.recognized && (
        <p className="cidr-error" role="alert">
          {t("unrecognized")}
        </p>
      )}

      {r && r.recognized && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              <span className="jwt-badge mono">{t(`objectType.${r.objectType}`)}</span>
              {r.objectName ? ` ${r.objectName}` : ""}
            </h4>

            {r.objectType === "service_policy" ? (
              <p className="cipher-note">{t("servicePolicyNote")}</p>
            ) : r.findings.length === 0 ? (
              <p className="cipher-note">{t("cleanMessage", { rules: r.rulesRun })}</p>
            ) : (
              r.findings.map((fnd, i) => (
                <div className="jwt-claim-row" key={i}>
                  <span className="jwt-claim-label">
                    <span className={`jwt-badge mono ${sevClass[fnd.severity]}`}>{t(`severity.${fnd.severity}`)}</span>
                  </span>
                  <span className="jwt-claim-value">{t(`finding.${fnd.code}`, fnd.params)}</span>
                </div>
              ))
            )}
          </section>

          {/* Share results (2026-11-01): under the findings, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} reveal={shareReveal} />
          </div>
        </div>
      )}
    </div>
  );
}
