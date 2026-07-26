"use client";

// ============================================================================
// src/components/FortigatePolicyLookupExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE FORTIGATE POLICY LOOKUP EXPLAINER.
//
// Paste a policy list (FortiOS CLI or a pipe/tab table) with a `packet:` line,
// and see which policy matches, WHY each earlier policy did not, and which
// policies below the match are unreachable as ordered.
//
// The two result buckets are deliberately kept distinct in the UI, because
// conflating them is what makes this class of tool cry wolf:
//   SHADOWED : at least as specific as the winner -> a genuine fault
//   COVERED  : broader than the winner -> a normal catch-all, nothing to fix
//
// Everything runs in the browser. The engine throws on oversized input, so the
// run is wrapped and errors render in the shared error box.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type LookupResult, type Evaluation } from "@/lib/tools/fortigate-policy-lookup-explainer";

/** D-83: a golden-vector-faithful sample. This is the headline case — a broad
 *  policy above a narrow one, which is the fault the tool exists to find. */
const EXAMPLE = `config firewall policy
    edit 1
        set name "allow-any-outbound"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "all"
        set dstaddr "all"
        set service "ALL"
        set action accept
    next
    edit 2
        set name "web-servers-https"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "LAN"
        set dstaddr "WebSrv"
        set service "HTTPS"
        set action accept
    next
end

packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS`;

function verdictClass(v: Evaluation["verdict"]): string {
  if (v === "match") return "certhub-guide-badge";
  if (v === "shadowed") return "certhub-guide-badge certhub-guide-badge--prep";
  return "certhub-guide-badge";
}

export default function FortigatePolicyLookupExplainerTool() {
  const t = useTranslations("tools.fortigate-policy-lookup-explainer");
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: LookupResult | null; error: string | null } => {
    try {
      return { result: run(input).result, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fpl-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fpl-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={12}
          aria-describedby="fpl-privacy"
        />
        <p id="fpl-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {error && <div className="cidr-error" role="alert">{error}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-result">
          <h3 className="cidr-result-title">{t("howItWorks")}</h3>
          <ul className="cidr-list">
            {result.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "lookup" && (
        <div className="cidr-result">
          {result.parseWarnings.length > 0 && (
            <ul className="cidr-list">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{w}</strong></li>)}
            </ul>
          )}

          {/* The headline answer, stated before the trace. */}
          {result.packet && (
            <p className="cidr-result-title">
              {result.matched
                ? t("matchedPolicy", { id: result.matched.id, action: result.matched.action })
                : t("implicitDeny")}
            </p>
          )}

          {/* The per-policy trace: which criterion eliminated each one. This is
              what turns a verdict into an explanation. */}
          {result.evaluations.length > 0 && (
            <table className="cidr-table">
              <thead>
                <tr>
                  <th>{t("colPolicy")}</th>
                  <th>{t("colVerdict")}</th>
                  <th>{t("colWhy")}</th>
                </tr>
              </thead>
              <tbody>
                {result.evaluations.map((e) => (
                  <tr key={e.policy.order}>
                    <td className="mono">
                      {e.policy.id}
                      {e.policy.name ? ` (${e.policy.name})` : ""}
                    </td>
                    <td><span className={verdictClass(e.verdict)}>{t(`verdict_${e.verdict}`)}</span></td>
                    <td>{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {result.notes.length > 0 && (
            <ul className="cidr-list">
              {result.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
