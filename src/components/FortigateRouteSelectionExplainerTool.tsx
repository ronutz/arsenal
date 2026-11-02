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
//
// Share results (2026-11-01): a button under the selected route builds a link
// that carries the box as pasted, with a caution line, unless the FortiOS
// check finds a credential in it; an arriving link fills the box as a paste
// would.
//
// PAGE LANGUAGE (02/11/2026): the details, notes, warnings and errors arrive as
// EngineTexts from runLocalisable() and are shown through engineTexts(t)
// (keys under engine.* in the pack), so the pt-BR page reads in Portuguese; a
// key the pack lacks shows the engine's English.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first secret-looking name, for a popover line
import { checkFortiosText, encodeFortiosBox } from "@/lib/tools/fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check and the box's encoding
import { FORTIGATE_ROUTE_SELECTION_SHARE, routeSelectionExplainerHasReading } from "@/lib/tools/fortigate-route-selection-explainer/share"; // this tool's share spec
import { runLocalisable, type RouteResult, type RouteVerdict } from "@/lib/tools/fortigate-route-selection-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language

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
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: RouteResult<EngineText> | null; error: unknown } => {
    try {
      return { result: runLocalisable(input).result, error: null }; // the reading, sentences with ids
    } catch (e) {
      return { result: null, error: e }; // shown through tx.error
    }
  }, [input]);

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it.
  useShareArrival(FORTIGATE_ROUTE_SELECTION_SHARE, (s) => setInput(s.input)); // the link's text
  // The FortiOS check: once per change, only beside a reading; it feeds the button and its popover.
  const shareCheck = useMemo(() => (routeSelectionExplainerHasReading(result && plainText(result)) ? checkFortiosText(input) : null), [result, input]); // the report, or null
  const share = useMemo(() => encodeFortiosBox(input, shareCheck), [input, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareDetails = [shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")]; // the caution, or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

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

      {error != null && <div className="cidr-error" role="alert">{tx.error(error)}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-results">
          <h3 className="cidr-section-title">{t("howItWorks")}</h3>
          <ul className="dig-notes">
            {result.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "select" && (
        <div className="cidr-results">
          {result.parseWarnings.length > 0 && (
            <ul className="dig-notes">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{tx.say(w)}</strong></li>)}
            </ul>
          )}

          {result.destination && result.evaluations.length > 0 && (
            <p className="cidr-section-title">
              {result.selected.length === 0
                ? t("unroutable", { dst: result.destination })
                : result.selected.length === 1
                  ? t("selectedVia", { dst: result.destination, gw: result.selected[0].gw ?? "-", dev: result.selected[0].dev ?? "-" })
                  : t("selectedEcmp", { dst: result.destination, n: result.selected.length })}
            </p>
          )}

          {/* Share results (2026-11-01): under the selected route, before the table, at the start of its own row, across the whole results grid (.cidr-results has two columns from 36rem). */}
          <div className="rdap-ask-row" style={{ gridColumn: "1 / -1" }}>
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>

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
                    <td>{tx.say(e.detail)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {result.notes.length > 0 && (
            <ul className="dig-notes">
              {result.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
