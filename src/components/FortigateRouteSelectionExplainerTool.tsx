"use client";

// ============================================================================
// src/components/FortigateRouteSelectionExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE ROUTE SELECTION EXPLAINER.
//
// Every route gets a verdict, and "floating" is styled as the notable one
// because a route that lost the distance comparison is ABSENT from the
// forwarding table, not merely ranked lower. That is the finding people come
// looking for without knowing it: "my route is not working" is usually "my
// route never installed".
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type RouteResult, type RouteVerdict } from "@/lib/tools/fortigate-route-selection-explainer";

/** D-83: golden-vector-faithful sample. Mixes a default route, a more specific
 *  route, and a floating backup, so all three verdicts appear at once. */
const EXAMPLE = `destination: 10.2.5.10
route: prefix=0.0.0.0/0, gw=192.0.2.1, dev=wan1, distance=10, priority=0
route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0
route: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=20, priority=0`;

function badgeClass(v: RouteVerdict): string {
  return v === "floating" || v === "down"
    ? "certhub-guide-badge certhub-guide-badge--prep"
    : "certhub-guide-badge";
}

export default function FortigateRouteSelectionExplainerTool() {
  const t = useTranslations("tools.fortigate-route-selection-explainer");
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: RouteResult | null; error: string | null } => {
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
          <label className="cidr-label" htmlFor="frs-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="frs-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={8}
          aria-describedby="frs-privacy"
        />
        <p id="frs-privacy" className="cidr-privacy">
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

      {result && result.mode === "select" && (
        <div className="cidr-result">
          {result.parseWarnings.length > 0 && (
            <ul className="cidr-list">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{w}</strong></li>)}
            </ul>
          )}

          {result.destination && result.evaluations.length > 0 && (
            <p className="cidr-result-title">
              {result.selected.length === 0
                ? t("unroutable", { dst: result.destination })
                : result.selected.length === 1
                  ? t("selectedVia", { dst: result.destination, gw: result.selected[0].gw ?? "-", dev: result.selected[0].dev ?? "-" })
                  : t("selectedEcmp", { dst: result.destination, n: result.selected.length })}
            </p>
          )}

          {result.evaluations.length > 0 && (
            <table className="cidr-table">
              <thead>
                <tr>
                  <th>{t("colPrefix")}</th>
                  <th>{t("colVia")}</th>
                  <th>{t("colDistance")}</th>
                  <th>{t("colPriority")}</th>
                  <th>{t("colVerdict")}</th>
                  <th>{t("colWhy")}</th>
                </tr>
              </thead>
              <tbody>
                {result.evaluations.map((e, i) => (
                  <tr key={i}>
                    <td className="mono">{e.route.prefix}</td>
                    <td className="mono">{e.route.gw ?? "-"}{e.route.dev ? ` / ${e.route.dev}` : ""}</td>
                    <td className="mono">{e.route.distance}</td>
                    <td className="mono">{e.route.priority}</td>
                    <td><span className={badgeClass(e.verdict)}>{t(`verdict_${e.verdict}`)}</span></td>
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
