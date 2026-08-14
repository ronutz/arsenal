"use client";

// ============================================================================
// FortiGate policy match-order explainer - the UI.
//
// The policy list is entered as lines rather than a form, because the thing
// being reasoned about is an ORDER and a form makes order awkward. One policy
// per line, fields separated by a pipe, in the order the FortiGate evaluates
// them.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  analysePolicies, PolicyInputError,
  type Policy, type Packet, type PolicyAnalysis,
} from "@/lib/tools/fortigate-policy-match-order";

const EXAMPLE_POLICIES = `10 | port1 | port2 | all | all | ALL | accept
20 | port1 | port2 | web-servers | all | HTTPS | accept
30 | port1 | port2 | bad-hosts | all | ALL | deny`;
const EXAMPLE_PACKET = "port1 | port2 | web-servers | all | HTTPS";

/** id | srcintf | dstintf | srcaddr | dstaddr | service | action [| vip] */
function parsePolicies(text: string): Policy[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const c = l.split("|").map((x) => x.trim());
    return {
      id: c[0] ?? "?",
      srcintf: c[1] ?? "any", dstintf: c[2] ?? "any",
      srcaddr: c[3] ?? "all", dstaddr: c[4] ?? "all",
      service: c[5] ?? "ALL",
      action: (c[6] ?? "accept").toLowerCase() === "deny" ? "deny" : "accept",
      vip: (c[7] ?? "").toLowerCase().includes("vip"),
      matchVip: (c[7] ?? "").toLowerCase().includes("match-vip"),
      disabled: (c[7] ?? "").toLowerCase().includes("disabled"),
    } as Policy;
  });
}

function parsePacket(text: string): Packet | undefined {
  const c = text.split("|").map((x) => x.trim());
  if (c.length < 5 || !c[0]) return undefined;
  return { srcintf: c[0], dstintf: c[1], src: c[2], dst: c[3], service: c[4] };
}

export default function FortigatePolicyMatchOrderTool() {
  const t = useTranslations("tools.fortigate-policy-match-order");
  const [pol, setPol] = useState("");
  const [pkt, setPkt] = useState("");

  const result = useMemo<{ ok: true; data: PolicyAnalysis } | { ok: false; message: string } | null>(() => {
    if (!pol.trim()) return null;
    try { return { ok: true, data: analysePolicies(parsePolicies(pol), parsePacket(pkt)) }; }
    catch (e) {
      if (e instanceof PolicyInputError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [pol, pkt]);

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="fpm-pol" className="cidr-label">{t("policiesLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => { setPol(EXAMPLE_POLICIES); setPkt(EXAMPLE_PACKET); }}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setPol(""); setPkt(""); }}>{t("clear")}</button>
        </div>
      </div>
      <p className="dig-record-explain">{t("policiesHint")}</p>
      <textarea
        id="fpm-pol" className="cidr-input mono saml-textarea json-input tmsh-input"
        value={pol} onChange={(e) => setPol(e.target.value)}
        placeholder={t("policiesPlaceholder")} spellCheck={false} rows={7}
      />

      <label htmlFor="fpm-pkt" className="cidr-label">{t("packetLabel")}</label>
      <p className="dig-record-explain">{t("packetHint")}</p>
      <input
        id="fpm-pkt" className="cidr-input mono" value={pkt}
        onChange={(e) => setPkt(e.target.value)} placeholder={t("packetPlaceholder")} spellCheck={false}
      />

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          {result.data.steps.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("walk.title")}</h3>
              <ol className="dig-records">
                {result.data.steps.map((s) => (
                  <li key={s.position} className="dig-record">
                    <code className="mono">{s.position}. {t("walk.policy")} {s.policyId}</code>
                    <span className="dig-record-type">{s.matched ? t("walk.match") : t("walk.noMatch")}</span>
                    <p className="dig-record-explain">{s.reason}</p>
                  </li>
                ))}
              </ol>
              <dl className="dig-kv">
                <dt>{t("walk.outcome")}</dt>
                <dd className="mono">
                  {result.data.winner
                    ? `${t("walk.policy")} ${result.data.winner.id} - ${result.data.winner.action}`
                    : t("walk.implicitDeny")}
                </dd>
              </dl>
            </section>
          )}

          {result.data.shadowed.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("shadow.title")}</h3>
              <ul className="dig-notes">
                {result.data.shadowed.map((s, i) => <li key={i}>{s.why}</li>)}
              </ul>
            </section>
          )}

          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </section>
          )}
          <section className="dig-section">
            <h3 className="dig-section-title">{t("notes.title")}</h3>
            <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </section>
        </div>
      )}
    </div>
  );
}
