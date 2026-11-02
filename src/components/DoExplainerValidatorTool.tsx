"use client";

// ============================================================================
// src/components/DoExplainerValidatorTool.tsx
// ----------------------------------------------------------------------------
// Client UI for the F5 BIG-IP DO (Declarative Onboarding) declaration explainer
// + structural validator. Paste the JSON you POST to
// /mgmt/shared/declarative-onboarding and it reads back the document kind (DO
// request wrapper vs bare Device), the top-level options, and the Common
// tenant's class-objects grouped by the phase DO onboards them in (licensing,
// system, networking, clustering), each class explained, with the documented
// structural findings and gotchas. Pure, decode-only engine; nothing is fetched
// and nothing leaves the browser (D-49). Class names, structural rules, and the
// version-specific gotchas come from F5's DO docs (clouddocs, DO 1.47.0).
//
// SHARE RESULTS (2026-10-27): a button under the verdict builds, only when
// pressed, a link to this page carrying a copy of the declaration after the
// "#" with every password, key, token and community DO's schema names
// replaced by "[redacted]" (DO_SHARE, posture derived; shareableDeclaration
// in compute.ts), never the paste; the popover says how many values were
// replaced. Text that is not JSON and names a secret gets no link. An
// arriving link fills the box as a paste would; the address loses the value
// at once.
//
// PAGE LANGUAGE (2026-11-02, batch H7): each class's explanation and each
// phase's label are looked up in the pack by class name and phase
// (engine.class.<Name>, engine.class.unknown, engine.phase.<phase>), and the
// per-object notes arrive as EngineTexts from explainDoLocalisable(), all
// through engineTexts(t), else the engine's English. Text that is not JSON
// gets the site's error box (as the AWAF policy explainer has it): the
// headline, where the error is in the page's language (jsonErrorLocation),
// then the browser's own message in code type, since it is the browser's text.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainDoLocalisable, CLASS_CATALOG, UNKNOWN_CLASS_EXPLAIN, type Finding, type ObjectInfo, type Phase } from "@/lib/tools/do-explainer-validator/compute"; // the reading with sentence ids and the catalogue it explains from (2026-11-02); the engine, not the index, so the vectors stay out of the page
import { jsonErrorLocation } from "@/lib/tools/f5-awaf-declarative-policy-explainer/compute"; // where a JSON syntax error sits (the AWAF explainer's, reused 2026-11-02)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences and catalogue texts in the page's language (2026-11-02)
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { DO_SHARE } from "@/lib/tools/do-explainer-validator/share"; // this tool's share spec: the copy, secrets replaced
import { shareableDeclaration } from "@/lib/tools/do-explainer-validator/compute"; // the copy, made once per change

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

// F5's standalone-BIG-IP sample declaration (composing-a-declaration.html),
// the D-83 Example: it exercises licensing, system identity, networking, and
// the two documented gotchas' safe forms (allowService set, root oldPassword).
const EXAMPLE = JSON.stringify(
  {
    schemaVersion: "1.0.0",
    class: "Device",
    async: true,
    label: "Standalone BIG-IP onboarding",
    Common: {
      class: "Tenant",
      mySystem: { class: "System", hostname: "bigip.example.com", cliInactivityTimeout: 1200, autoPhonehome: false },
      myLicense: { class: "License", licenseType: "regKey", regKey: "AAAAA-BBBBB-CCCCC-DDDDD-EEEEEEE" },
      myProvisioning: { class: "Provision", ltm: "nominal", gtm: "minimum" },
      myDns: { class: "DNS", nameServers: ["8.8.8.8", "2001:4860:4860::8844"], search: ["f5.com"] },
      myNtp: { class: "NTP", servers: ["0.pool.ntp.org", "1.pool.ntp.org"], timezone: "UTC" },
      root: { class: "User", userType: "root", oldPassword: "default", newPassword: "myNewPass1word" },
      admin: { class: "User", userType: "regular", password: "asdfjkl", shell: "bash" },
      internal: { class: "VLAN", tag: 4093, mtu: 1500, interfaces: [{ name: "1.2", tagged: true }] },
      "internal-self": { class: "SelfIp", address: "10.10.0.100/24", vlan: "internal", allowService: "default", trafficGroup: "traffic-group-local-only" },
      default: { class: "Route", gw: "10.10.0.1", network: "default", mtu: 1500 },
    },
  },
  null,
  2,
);

// Phase → color class for the group heading + object chip.
const PHASE_CLASS: Record<Phase, string> = {
  license: "do-phase-license",
  system: "do-phase-system",
  network: "do-phase-network",
  cluster: "do-phase-cluster",
  other: "do-phase-other",
};

export default function DoExplainerValidatorTool() {
  const t = useTranslations("tools.do-explainer-validator");
  const tx = engineTexts(t); // the engine's notes and the catalogue's texts in the page's language (2026-11-02)
  const [input, setInput] = useState("");
  const inputPlaceholder = t.raw("inputPlaceholder");
  const r = useMemo(() => explainDoLocalisable(input), [input]); // sentences with ids (2026-11-02)
  const has = input.trim().length > 0;
  // A JSON syntax error (2026-11-02): shown in the site's error box rather than as a list item, with where it is.
  const parseFail = r ? r.findings.find((f): f is Extract<Finding, { kind: "parse-error" }> => f.kind === "parse-error") ?? null : null; // or null
  const errorAt = useMemo(() => (parseFail ? jsonErrorLocation(input, parseFail.detail) : null), [parseFail, input]); // the line and column, or null
  const listed = r ? r.findings.filter((f) => f.kind !== "parse-error") : []; // the findings the list shows
  // An arriving share link (2026-10-27): the copy fills the box as a paste would, and the page explains it.
  useShareArrival(DO_SHARE, (state) => setInput(state.input)); // as a paste would
  // The shareable copy: every secret value replaced (or no copy for broken JSON that names a secret). Linear, memoised.
  const copy = useMemo(() => (has ? shareableDeclaration(input) : null), [has, input]); // once per change of the box
  // What Share results may carry: the copy, never the paste, while the page has a reading.
  const share = useMemo<ShareEncoding>(() => (r && has && copy ? DO_SHARE.encode({ input, copy }) : NOTHING), [r, has, input, copy]); // the encoding
  // The popover's reason when no copy can be made: it names the setting.
  const blockedMessage = !share.ok && share.reason === "blocked" ? t("share.blocked", { name: String(share.values?.name ?? "") }) : ""; // only when blocked

  const findingText = (f: Finding): { sev: "warn" | "info"; text: string } => {
    switch (f.kind) {
      case "parse-error": return { sev: "warn", text: "" }; // shown in the error box instead (2026-11-02)
      case "not-do": return { sev: "warn", text: t("finding.notDo") };
      case "device-only": return { sev: "info", text: t("finding.deviceOnly") };
      case "missing-schema-version": return { sev: "warn", text: t("finding.missingSchema") };
      case "no-common": return { sev: "warn", text: t("finding.noCommon") };
      case "tenant-not-common": return { sev: "warn", text: t("finding.tenantNotCommon", { name: f.name }) };
      case "empty-common": return { sev: "warn", text: t("finding.emptyCommon") };
      case "hostname-conflict": return { sev: "warn", text: t("finding.hostnameConflict") };
      case "root-missing-oldpassword": return { sev: "warn", text: t("finding.rootOldPassword", { name: f.name }) };
      case "selfip-allowservice-default": return { sev: "info", text: t("finding.allowServiceDefault", { name: f.name }) };
      case "async-note": return { sev: "info", text: t("finding.asyncNote") };
      default: return { sev: "info", text: "" };
    }
  };

  /** A class's explanation in the page's language: the catalogue's by class name, the not-in-catalogue line, else as written. */
  const explainText = (o: ObjectInfo<EngineText>): string =>
    Object.prototype.hasOwnProperty.call(CLASS_CATALOG, o.className) && CLASS_CATALOG[o.className].explain === o.explain // a catalogue class (own entries only)
      ? tx.key(`class.${o.className}`, o.explain) // engine.class.<Name>
      : o.explain === UNKNOWN_CLASS_EXPLAIN ? tx.key("class.unknown", o.explain) : o.explain; // engine.class.unknown, or as written

  const kindLabel = r ? (r.kind === "do-request" ? t("kind.doRequest") : r.kind === "device-only" ? t("kind.deviceOnly") : t("kind.notDo")) : "";
  const kindSev = r?.kind === "not-do" ? "warn" : "ok";
  const showWalk = r && (r.kind === "do-request" || r.kind === "device-only") && r.commonPresent && r.groups.length > 0;

  return (
    <div className="cidr-tool jwt-tool dig-tool json-tool tmsh-tool as3-tool do-tool">
      <div className="dig-input-head">
        <label htmlFor="do-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="do-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputPlaceholder}
        spellCheck={false}
        rows={12}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("runsLocally")}</p>

      {!has && <div className="awaf-empty">{t("empty")}</div>}

      {r && has && (
        <div className="tmsh-results as3-results do-results">
          {/* Verdict + request/device summary */}
          <section className={`as3-verdict as3-verdict-${kindSev}`}>
            <h3 className="as3-verdict-head">{kindLabel}</h3>
            {r.request && (
              <div className="as3-meta-row">
                {r.request.targetHost && <span className="as3-chip">{t("req.targetHost")}: <b>{r.request.targetHost}</b></span>}
                <span className="as3-chip">{r.request.hasDeclaration ? t("req.hasDeclaration") : t("req.noDeclaration")}</span>
              </div>
            )}
            {r.device && (
              <div className="as3-meta-row">
                {r.device.schemaVersion && <span className="as3-chip">{t("device.schemaVersion")}: <b>{r.device.schemaVersion}</b></span>}
                {r.device.async !== null && <span className="as3-chip">{t("device.async")}: <b>{r.device.async ? t("device.asyncTrue") : t("device.asyncFalse")}</b></span>}
                {r.device.webhook && <span className="as3-chip">{t("device.webhook")}</span>}
                {r.device.label && <span className="as3-chip">{t("device.label")}: <b>{r.device.label}</b></span>}
              </div>
            )}
            {showWalk && r.stats.isCluster && <p className="as3-remark">{t("clusterNote")}</p>}
          </section>

          {/* Share results (2026-10-27): under the verdict, the first answer, at the start of its own row; the popover
              says first what the link carries, then how many values the copy replaces. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries", { redacted: "[redacted]" })} details={[t("share.redacted", { n: copy && copy.ok ? copy.redacted : 0 })]} blockedMessage={blockedMessage} title={t("name")} />
          </div>

          {/* Stats */}
          {showWalk && (
            <div className="as3-stats">
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.totalObjects}</span><span className="poison-stat-lbl">{t("stats.objects")}</span></div>
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.licenseObjects}</span><span className="poison-stat-lbl">{t("stats.licensing")}</span></div>
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.networkObjects}</span><span className="poison-stat-lbl">{t("stats.networking")}</span></div>
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.clusterObjects}</span><span className="poison-stat-lbl">{t("stats.clustering")}</span></div>
            </div>
          )}

          {/* Findings */}
          {r.findings.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("findingsHeading")}</h3>
              {/* Not valid JSON (2026-11-02): the page says so, and where, in its own language; the browser's message
                  follows in code type as a detail, since it is the browser's text and stays in the browser's language. */}
              {parseFail && (
                <div className="json-error-box" role="alert">
                  <p className="json-error-headline">{t("finding.parseError")}</p>
                  {errorAt && <p className="json-error-location">{t("parseErrorAt", { line: errorAt.line, column: errorAt.column })}</p>}
                  <p className="json-error-message">{t("parseErrorDetail")} <code>{parseFail.detail}</code></p>
                </div>
              )}
              {listed.length > 0 && (
                <ul className="awaf-flag-list">
                  {listed.map((f, i) => {
                    const v = findingText(f);
                    if (!v.text) return null;
                    return (
                      <li key={i} className={`awaf-flag awaf-flag-${v.sev}`}>
                        <span className="awaf-flag-mark">{v.sev === "warn" ? "\u25B2" : "\u2022"}</span> {v.text}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {/* The onboarding walk, grouped by phase */}
          {showWalk && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("walkHeading")}</h3>
              <p className="as3-node-note do-walk-note">{t("walkOrderNote")}</p>
              <div className="as3-tree do-walk">
                {r.groups.map((g) => (
                  <div className={`do-group ${PHASE_CLASS[g.phase]}`} key={g.phase}>
                    <div className="do-group-head">{tx.key(`phase.${g.phase}`, g.label)}</div>
                    <ul className="as3-objects">
                      {g.objects.map((o) => (
                        <li className="as3-object" key={o.name}>
                          <span className={`as3-obj-chip ${PHASE_CLASS[o.phase]}`}>{o.className}</span>
                          <b className="as3-obj-name">{o.name}</b>
                          <span className="as3-obj-explain">{explainText(o)}{o.unknown ? ` ${t("unknownClass")}` : ""}</span>
                          {o.notes.map((n, k) => (
                            <span className="do-obj-note" key={k}>{tx.say(n)}</span>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="cipherstr-scope as3-foot">{t("scopeNote")}</p>
        </div>
      )}
    </div>
  );
}
