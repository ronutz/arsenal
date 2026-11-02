"use client";

// ============================================================================
// src/components/FortigateHaFailoverSimulatorTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE FGCP HA ELECTION SIMULATOR.
//
// Describe a cluster, see who becomes primary and WHY. The counterfactual is
// rendered as prominently as the result, because "here is the setting that
// decides it" is more actionable than "here is the winner".
//
// Share results (2026-11-01): a button under the primary and its findings
// builds a link that carries the box as pasted, with a caution line, unless
// the FortiOS check finds a credential in it (then the popover names the
// line); an arriving link fills the box as a paste would.
//
// PAGE LANGUAGE (02/11/2026): the comparisons, findings, warnings and errors arrive as
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
import { FORTIGATE_HA_FAILOVER_SHARE, haFailoverSimulatorHasReading } from "@/lib/tools/fortigate-ha-failover-simulator/share"; // this tool's share spec
import { runLocalisable, criterionOrder, type HaResult } from "@/lib/tools/fortigate-ha-failover-simulator/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language

/** D-83: golden-vector-faithful sample. The rebooted-preferred-unit case,
 *  which is the confusion this tool exists to resolve. */
const EXAMPLE = `override: disable
member: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0
member: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0`;

export default function FortigateHaFailoverSimulatorTool() {
  const t = useTranslations("tools.fortigate-ha-failover-simulator");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: HaResult<EngineText> | null; error: unknown } => {
    try {
      return { result: runLocalisable(input).result, error: null }; // the reading, sentences with ids
    } catch (e) {
      return { result: null, error: e }; // shown through tx.error
    }
  }, [input]);

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it.
  useShareArrival(FORTIGATE_HA_FAILOVER_SHARE, (s) => setInput(s.input)); // the link's text
  // The FortiOS check: once per change, only beside a reading; it feeds the button and its popover.
  const shareCheck = useMemo(() => (haFailoverSimulatorHasReading(result && plainText(result)) ? checkFortiosText(input) : null), [result, input]); // the report, or null
  const share = useMemo(() => encodeFortiosBox(input, shareCheck), [input, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareDetails = [shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")]; // the caution, or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fha-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fha-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={6}
          aria-describedby="fha-privacy"
        />
        <p id="fha-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {error != null && <div className="cidr-error" role="alert">{tx.error(error)}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-results">
          <h3 className="cidr-section-title">{t("howItWorks")}</h3>
          <ul className="dig-notes">
            {result.findings.map((f, i) => <li key={i}>{tx.say(f)}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "simulate" && (
        <div className="cidr-results">
          {result.parseWarnings.length > 0 && (
            <ul className="dig-notes">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{tx.say(w)}</strong></li>)}
            </ul>
          )}

          {result.primary && (
            <>
              <p className="cidr-section-title">
                {t("primaryIs", { name: result.primary.name })}
                {result.decidedBy ? ` - ${t("decidedBy", { criterion: t(`crit_${result.decidedBy}`) })}` : ""}
              </p>

              {/* The evaluation order actually in force, which changes with
                  override and is the thing people misremember. */}
              <p className="cidr-note">
                {t("orderInForce", {
                  mode: result.override ? t("overrideOn") : t("overrideOff"),
                  order: criterionOrder(result.override).map((c) => t(`crit_${c}`)).join(" > "),
                })}
              </p>

              {result.findings.length > 0 && (
                <ul className="dig-notes">
                  {result.findings.map((f, i) => <li key={i}>{tx.say(f)}</li>)}
                </ul>
              )}

              {/* Share results (2026-11-01): under the primary and its findings (the counterfactual among them), before the table, at the start of its own row, across the whole results grid (.cidr-results has two columns from 36rem). */}
              <div className="rdap-ask-row" style={{ gridColumn: "1 / -1" }}>
                <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
              </div>

              <table className="cidr-table">
                <thead>
                  <tr>
                    <th>{t("colMember")}</th>
                    <th>{t("crit_failed")}</th>
                    <th>{t("crit_age")}</th>
                    <th>{t("crit_priority")}</th>
                    <th>{t("crit_serial")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.members.map((m) => (
                    <tr key={m.serial}>
                      <td className="mono">
                        {m.name}
                        {result.primary && m.name === result.primary.name
                          ? ` ${t("primaryTag")}`
                          : ""}
                      </td>
                      <td className="mono">{m.failed}</td>
                      <td className="mono">{m.age}</td>
                      <td className="mono">{m.priority}</td>
                      <td className="mono">{m.serial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {result.trace.length > 0 && (
                <ul className="dig-notes">
                  {result.trace.map((c, i) => <li key={i}>{tx.say(c.detail)}</li>)}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
