"use client";

// ============================================================================
// src/components/FortigateSecurityProfileCoverageCheckerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE SECURITY PROFILE COVERAGE CHECKER.
//
// BLIND is styled distinctly from DEGRADED on purpose. "Attached and doing
// nothing" and "working with a caveat" are different situations that call for
// different action, and flattening them into one warning colour would lose the
// distinction the tool was built to make.
//
// Share results (2026-11-01): a button under the coverage table builds a link
// that carries the box as pasted, unless the FortiOS check finds a credential
// in it; an arriving link fills the box as a paste would.
//
// PAGE LANGUAGE (02/11/2026): the details, notes, warnings and errors arrive as
// EngineTexts from runLocalisable() and are shown through engineTexts(t) (keys
// under engine.* in the pack), so the pt-BR page reads in Portuguese; a key the
// pack lacks shows the engine's English.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first secret-looking name, for a popover line
import { checkFortiosText, encodeFortiosBox } from "@/lib/tools/fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check and the box's encoding
import { FORTIGATE_PROFILE_COVERAGE_SHARE, securityProfileCoverageCheckerHasReading } from "@/lib/tools/fortigate-security-profile-coverage-checker/share"; // this tool's share spec
import { runLocalisable, type CoverageResult, type Coverage } from "@/lib/tools/fortigate-security-profile-coverage-checker/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language

/** D-83: golden-vector-faithful sample. The classic blind configuration —
 *  HTTPS with certificate inspection and payload-reading profiles attached. */
const EXAMPLE = `traffic: https
ssl: certificate
mode: flow
profiles: antivirus, ips, application-control, web-filter`;

function badgeClass(c: Coverage): string {
  return c === "blind"
    ? "certhub-guide-badge certhub-guide-badge--prep"
    : "certhub-guide-badge";
}

export default function FortigateSecurityProfileCoverageCheckerTool() {
  const t = useTranslations("tools.fortigate-security-profile-coverage-checker");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: CoverageResult<EngineText> | null; error: unknown } => {
    try {
      return { result: runLocalisable(input).result, error: null }; // the reading, sentences with ids
    } catch (e) {
      return { result: null, error: e }; // shown through tx.error
    }
  }, [input]);

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it.
  useShareArrival(FORTIGATE_PROFILE_COVERAGE_SHARE, (s) => setInput(s.input)); // the link's text
  // The FortiOS check: once per change, only beside a reading; it feeds the button and its popover.
  const shareCheck = useMemo(() => (securityProfileCoverageCheckerHasReading(result && plainText(result)) ? checkFortiosText(input) : null), [result, input]); // the report, or null (the share check reads the API's shape)
  const share = useMemo(() => encodeFortiosBox(input, shareCheck), [input, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareDetails = (shareMaybe ? [t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more })] : []); // the name to check, if any
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fsp-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fsp-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={6}
          aria-describedby="fsp-privacy"
        />
        <p id="fsp-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {error != null && <div className="cidr-error" role="alert">{tx.error(error)}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-results">
          <h3 className="cidr-section-title">{t("theChain")}</h3>
          <ul className="dig-notes">
            {result.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "check" && (
        <div className="cidr-results">
          {result.parseWarnings.length > 0 && (
            <ul className="dig-notes">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{tx.say(w)}</strong></li>)}
            </ul>
          )}

          <p className="cidr-section-title">
            {t("policySummary", {
              traffic: result.traffic.toUpperCase(),
              ssl: t(`ssl_${result.ssl}`),
              mode: t(`mode_${result.inspection}`),
            })}
          </p>

          {result.findings.length > 0 && (
            <table className="cidr-table">
              <thead>
                <tr>
                  <th>{t("colProfile")}</th>
                  <th>{t("colCoverage")}</th>
                  <th>{t("colWhy")}</th>
                </tr>
              </thead>
              <tbody>
                {result.findings.map((f, i) => (
                  <tr key={i}>
                    <td className="mono">{f.profile}</td>
                    <td><span className={badgeClass(f.coverage)}>{t(`coverage_${f.coverage}`)}</span></td>
                    <td>{tx.say(f.detail)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Share results (2026-11-01): under the coverage table (the answer), before the notes, at the start of its own row, across the whole results grid (.cidr-results has two columns from 36rem). */}
          <div className="rdap-ask-row" style={{ gridColumn: "1 / -1" }}>
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>

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
