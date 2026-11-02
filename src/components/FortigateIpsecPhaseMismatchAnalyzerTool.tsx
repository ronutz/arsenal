"use client";

// ============================================================================
// src/components/FortigateIpsecPhaseMismatchAnalyzerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE IPSEC PHASE MISMATCH ANALYZER.
//
// The verdict leads, because "phase 1 would fail" and "phase 2 would fail"
// send an engineer down completely different diagnostic paths, and that single
// sentence is worth more than the field-by-field comparison beneath it.
//
// Fatal and informational issues are visually separated. An analyser that
// presents "your lifetimes differ" with the same weight as "no common
// encryption" trains people to ignore it.
//
// Share results (2026-11-01): a button under the verdict builds a link that
// carries the box as pasted, with a caution line, unless the FortiOS check
// finds a credential in it (a pre-shared key written on a phase1 line, say);
// an arriving link fills the box as a paste would.
//
// PAGE LANGUAGE (02/11/2026): the details, verdict, notes, warnings and errors arrive as
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
import { FORTIGATE_IPSEC_PHASE_SHARE, ipsecPhaseMismatchAnalyzerHasReading } from "@/lib/tools/fortigate-ipsec-phase-mismatch-analyzer/share"; // this tool's share spec
import { runLocalisable, type IpsecResult } from "@/lib/tools/fortigate-ipsec-phase-mismatch-analyzer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, keySegment, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language

/** D-83: golden-vector-faithful sample. PFS on one side only — a real phase 2
 *  fault whose log message does not usually mention PFS. */
const EXAMPLE = `peer: name=SiteA
phase1: version=ikev2, encryption=aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=86400
phase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.1.0.0/16, dst=10.2.0.0/16

peer: name=SiteB
phase1: version=ikev2, encryption=aes128 aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=28800
phase2: encryption=aes256, hash=sha256, pfs=disable, lifetime=43200, src=10.2.0.0/16, dst=10.1.0.0/16`;

export default function FortigateIpsecPhaseMismatchAnalyzerTool() {
  const t = useTranslations("tools.fortigate-ipsec-phase-mismatch-analyzer");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: IpsecResult<EngineText> | null; error: unknown } => {
    try {
      return { result: runLocalisable(input).result, error: null }; // the reading, sentences with ids
    } catch (e) {
      return { result: null, error: e }; // shown through tx.error
    }
  }, [input]);

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it.
  useShareArrival(FORTIGATE_IPSEC_PHASE_SHARE, (s) => setInput(s.input)); // the link's text
  // The FortiOS check: once per change, only beside a reading; it feeds the button and its popover.
  const shareCheck = useMemo(() => (ipsecPhaseMismatchAnalyzerHasReading(result && plainText(result)) ? checkFortiosText(input) : null), [result, input]); // the report, or null
  const share = useMemo(() => encodeFortiosBox(input, shareCheck), [input, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareDetails = [shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")]; // the caution, or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

  const fatal = result?.issues.filter((i) => i.severity === "fatal") ?? [];
  const info = result?.issues.filter((i) => i.severity === "info") ?? [];

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fip-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fip-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={10}
          aria-describedby="fip-privacy"
        />
        <p id="fip-privacy" className="cidr-privacy">
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

      {result && result.mode === "analyze" && (
        <div className="cidr-results">
          {result.parseWarnings.length > 0 && (
            <ul className="dig-notes">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{tx.say(w)}</strong></li>)}
            </ul>
          )}

          {/* The verdict leads: which phase fails is the whole diagnosis. */}
          {result.verdict && <p className="cidr-section-title">{tx.say(result.verdict)}</p>}

          {/* Share results (2026-11-01): under the verdict (which phase fails), before the blocking issues, at the start of its own row, across the whole results grid (.cidr-results has two columns from 36rem). */}
          <div className="rdap-ask-row" style={{ gridColumn: "1 / -1" }}>
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>

          {fatal.length > 0 && (
            <>
              <h3 className="cidr-section-title">{t("blocking")}</h3>
              <table className="cidr-table">
                <thead>
                  <tr>
                    <th>{t("colPhase")}</th>
                    <th>{t("colField")}</th>
                    <th>{t("colDetail")}</th>
                  </tr>
                </thead>
                <tbody>
                  {fatal.map((i, n) => (
                    <tr key={n}>
                      <td className="mono">{i.phase === "phase1" ? t("phase1") : t("phase2")}</td>
                      <td className="mono">{tx.key(`field.${keySegment(i.field)}`, i.field)}</td>
                      <td>{tx.say(i.detail)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {info.length > 0 && (
            <>
              {/* Kept visually separate: presenting "lifetimes differ" with the
                  same weight as "no common encryption" trains people to ignore
                  the whole output. */}
              <h3 className="cidr-section-title">{t("notFaults")}</h3>
              <ul className="dig-notes">
                {info.map((i, n) => <li key={n}>{tx.say(i.detail)}</li>)}
              </ul>
            </>
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
