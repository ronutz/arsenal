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
//
// Share results (2026-11-01): a button under the headline answer builds a link
// that carries a copy of the box with every FortiOS secret value of the other
// sections replaced by a numbered mark (the lookup never reads them); an
// arriving link fills the box as a paste would.
//
// PAGE LANGUAGE (02/11/2026): the details, notes, warnings and errors arrive as
// EngineTexts from runLocalisable() and are shown through engineTexts(t)
// (keys under engine.* in the pack), so the pt-BR page reads in Portuguese; a
// key the pack lacks shows the engine's English.
// ============================================================================

import { useMemo, useState } from "react";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first secret-looking name in the copy, for a popover line
import { FORTIGATE_POLICY_LOOKUP_SHARE, policyLookupHasReading } from "@/lib/tools/fortigate-policy-lookup-explainer/share"; // this tool's share spec
import { encodeFortiosCopy, fortiosMark, fortiosShareCopy } from "@/lib/tools/fortios-cli-config-explainer/fortios-secrets"; // the FortiOS copy and its encoding
import { useTranslations } from "next-intl";
import { runLocalisable, type LookupResult, type Evaluation } from "@/lib/tools/fortigate-policy-lookup-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language

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
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: LookupResult<EngineText> | null; error: unknown } => {
    try {
      return { result: runLocalisable(input).result, error: null }; // the reading, sentences with ids
    } catch (e) {
      return { result: null, error: e }; // shown through tx.error
    }
  }, [input]);

  // An arriving share link (2026-11-01): the copy fills the box as a paste would, and the page runs the lookup.
  useShareArrival(FORTIGATE_POLICY_LOOKUP_SHARE, (s) => setInput(s.input)); // the link's text
  // The copy a link may carry: made once per change, only beside policies read.
  const shareCopy = useMemo(() => (policyLookupHasReading(result && plainText(result)) ? fortiosShareCopy(input) : null), [result, input]); // the copy and its check, or null
  const share = useMemo(() => encodeFortiosCopy(shareCopy), [shareCopy]); // what Share results may carry
  const shareMaybe = shareCopy && shareCopy.ok ? firstSharePlace(shareCopy.report.maybe) : null; // the first secret-looking name left in the copy, or null
  const shareDetails = shareCopy && shareCopy.ok ? [t("share.redacted", { n: shareCopy.replaced }), shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")] : []; // the count, then a caution or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

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

      {error != null && <div className="cidr-error" role="alert">{tx.error(error)}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-results">
          <h3 className="cidr-section-title">{t("howItWorks")}</h3>
          <ul className="dig-notes">
            {result.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "lookup" && (
        <div className="cidr-results">
          {result.parseWarnings.length > 0 && (
            <ul className="dig-notes">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{tx.say(w)}</strong></li>)}
            </ul>
          )}

          {/* The headline answer, stated before the trace. */}
          {result.packet && (
            <p className="cidr-section-title">
              {result.matched
                ? t("matchedPolicy", { id: result.matched.id, action: result.matched.action })
                : t("implicitDeny")}
            </p>
          )}

          {/* Share results (2026-11-01): under the headline answer (first when there is no packet), before the trace, across the whole results grid (.cidr-results has two columns from 36rem). */}
          <div className="rdap-ask-row" style={{ gridColumn: "1 / -1" }}>
            <ShareResultsButton encoding={share} carries={t("share.carries", { mark: fortiosMark(1) })} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>

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
