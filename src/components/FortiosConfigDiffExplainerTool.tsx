"use client";

// ============================================================================
// src/components/FortiosConfigDiffExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE FORTIOS CONFIG DIFF EXPLAINER.
//
// Changes group by section, because that is how someone reviewing a change
// thinks: "what happened to the policies" rather than "what happened at line
// 4,312". An order change is styled distinctly because it is the finding a
// line diff buries and a reviewer misses — no setting differs, and the device
// behaves differently.
//
// Share results (2026-11-01): a button, first in the comparison, builds a link
// that carries a copy of the box with every FortiOS secret value replaced by a
// numbered mark (equal values, equal marks, so a changed secret still reads as
// changed); an arriving link fills the box as a paste would.
//
// PAGE LANGUAGE (02/11/2026): the details, notes, warnings and errors arrive as
// EngineTexts from runLocalisable() and are shown through engineTexts(t)
// (keys under engine.* in the pack), so the pt-BR page reads in Portuguese; a
// key the pack lacks shows the engine's English.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { runLocalisable, type DiffResult, type ChangeKind } from "@/lib/tools/fortios-config-diff-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first secret-looking name in the copy, for a popover line
import { FORTIOS_CONFIG_DIFF_SHARE, fortiosDiffHasReading } from "@/lib/tools/fortios-config-diff-explainer/share"; // this tool's share spec
import { encodeFortiosCopy, fortiosMark, fortiosShareCopy } from "@/lib/tools/fortios-cli-config-explainer/fortios-secrets"; // the FortiOS copy and its encoding

/** D-83: golden-vector-faithful sample. Policies 1 and 2 swap places and no
 *  setting changes — the case the whole tool is built around. */
const EXAMPLE = `config firewall policy
    edit 1
        set name "allow-web"
        set srcintf "port1"
        set dstaddr "WebSrv"
        set action accept
    next
    edit 2
        set name "deny-guest"
        set srcintf "port1"
        set dstaddr "all"
        set action deny
    next
end
---
config firewall policy
    edit 2
        set name "deny-guest"
        set srcintf "port1"
        set dstaddr "all"
        set action deny
    next
    edit 1
        set name "allow-web"
        set srcintf "port1"
        set dstaddr "WebSrv"
        set action accept
    next
end`;

function badgeClass(k: ChangeKind): string {
  return k === "object-moved" || k === "object-removed" || k === "section-removed"
    ? "certhub-guide-badge certhub-guide-badge--prep"
    : "certhub-guide-badge";
}

export default function FortiosConfigDiffExplainerTool() {
  const t = useTranslations("tools.fortios-config-diff-explainer");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: DiffResult<EngineText> | null; error: unknown } => {
    try {
      return { result: runLocalisable(input).result, error: null }; // the reading, sentences with ids
    } catch (e) {
      return { result: null, error: e }; // shown through tx.error
    }
  }, [input]);

  // Group by section so the output reads the way a change review does.
  const grouped = useMemo(() => {
    const m = new Map<string, DiffResult<EngineText>["changes"][number][]>(); // the page's changes, by section
    for (const c of result?.changes ?? []) {
      if (!m.has(c.section)) m.set(c.section, []);
      m.get(c.section)!.push(c);
    }
    return [...m.entries()];
  }, [result]);

  // An arriving share link (2026-11-01): the copy fills the box as a paste would, and the page compares the sides.
  useShareArrival(FORTIOS_CONFIG_DIFF_SHARE, (s) => setInput(s.input)); // the link's text
  // The copy a link may carry: made once per change, only beside a comparison.
  const shareCopy = useMemo(() => (fortiosDiffHasReading(result && plainText(result)) ? fortiosShareCopy(input) : null), [result, input]); // the copy and its check, or null
  const share = useMemo(() => encodeFortiosCopy(shareCopy), [shareCopy]); // what Share results may carry
  const shareMaybe = shareCopy && shareCopy.ok ? firstSharePlace(shareCopy.report.maybe) : null; // the first secret-looking name left in the copy, or null
  const shareDetails = shareCopy && shareCopy.ok ? [t("share.redacted", { n: shareCopy.replaced }), shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")] : []; // the count, then a caution or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fcd-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fcd-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={14}
          aria-describedby="fcd-privacy"
        />
        <p id="fcd-privacy" className="cidr-privacy">
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

      {result && result.mode === "diff" && (
        <div className="cidr-results">
          {result.parseWarnings.length > 0 && (
            <ul className="dig-notes">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{tx.say(w)}</strong></li>)}
            </ul>
          )}

          {/* Share results (2026-11-01): first in the comparison (the sections run long), at the start of its own row, across the whole results grid (.cidr-results has two columns from 36rem). */}
          <div className="rdap-ask-row" style={{ gridColumn: "1 / -1" }}>
            <ShareResultsButton encoding={share} carries={t("share.carries", { mark: fortiosMark(1) })} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>

          {grouped.map(([section, changes]) => (
            <div key={section} className="dig-record">
              <h3 className="cidr-section-title">{section}</h3>
              <table className="cidr-table">
                <thead>
                  <tr>
                    <th>{t("colChange")}</th>
                    <th>{t("colObject")}</th>
                    <th>{t("colDetail")}</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((c, i) => (
                    <tr key={i}>
                      <td><span className={badgeClass(c.kind)}>{t(`kind_${c.kind}`)}</span></td>
                      <td className="mono">{c.object ?? "-"}</td>
                      <td>
                        {tx.say(c.detail)}
                        {c.settings.length > 0 && (
                          <ul className="dig-notes">
                            {c.settings.map((s, j) => (
                              <li key={j} className="mono">
                                {s.key}: {s.before ?? t("absent")} &rarr; {s.after ?? t("absent")}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

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
