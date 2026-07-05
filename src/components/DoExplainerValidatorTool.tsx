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
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainDo, type Finding, type Phase } from "@/lib/tools/do-explainer-validator";

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
  const [input, setInput] = useState("");
  const inputPlaceholder = t.raw("inputPlaceholder");
  const r = useMemo(() => explainDo(input), [input]);
  const has = input.trim().length > 0;

  const findingText = (f: Finding): { sev: "warn" | "info"; text: string } => {
    switch (f.kind) {
      case "parse-error": return { sev: "warn", text: `${t("finding.parseError")}: ${f.detail}` };
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
              <ul className="awaf-flag-list">
                {r.findings.map((f, i) => {
                  const v = findingText(f);
                  if (!v.text) return null;
                  return (
                    <li key={i} className={`awaf-flag awaf-flag-${v.sev}`}>
                      <span className="awaf-flag-mark">{v.sev === "warn" ? "\u25B2" : "\u2022"}</span> {v.text}
                    </li>
                  );
                })}
              </ul>
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
                    <div className="do-group-head">{g.label}</div>
                    <ul className="as3-objects">
                      {g.objects.map((o) => (
                        <li className="as3-object" key={o.name}>
                          <span className={`as3-obj-chip ${PHASE_CLASS[o.phase]}`}>{o.className}</span>
                          <b className="as3-obj-name">{o.name}</b>
                          <span className="as3-obj-explain">— {o.explain}{o.unknown ? ` ${t("unknownClass")}` : ""}</span>
                          {o.notes.map((n, k) => (
                            <span className="do-obj-note" key={k}>{n}</span>
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
