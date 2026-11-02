"use client";

// ============================================================================
// FortiOS CLI config explainer - the UI.
// The tree is rendered by indenting on depth, so the structure is visible
// before any of the explanations are read.
// Share results (2026-11-01): a button, first in the reading, builds a link
// that carries a copy of the block with every FortiOS secret value replaced by
// a numbered mark (fortios-secrets.ts), never the paste; an arriving link
// fills the box as a paste would.
//
// PAGE LANGUAGE (02/11/2026): the explanations, warnings, notes and errors
// arrive as EngineTexts from decodeConfigLocalisable() and are shown through
// engineTexts(t) (keys under engine.* in the pack), so the pt-BR page reads in
// Portuguese; a key the pack lacks shows the engine's English.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { decodeConfigLocalisable, type ConfigDecode } from "@/lib/tools/fortios-cli-config-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first secret-looking name in the copy, for a popover line
import { FORTIOS_CLI_CONFIG_SHARE } from "@/lib/tools/fortios-cli-config-explainer/share"; // this tool's share spec
import { encodeFortiosCopy, fortiosMark, fortiosShareCopy } from "@/lib/tools/fortios-cli-config-explainer/fortios-secrets"; // the FortiOS copy and its encoding

const EXAMPLE = `config firewall policy
    edit 10
        set name "allow-web"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "internal-net"
        set dstaddr "all"
        set service "HTTPS"
        set action accept
    next
end`;

export default function FortiosCliConfigExplainerTool() {
  const t = useTranslations("tools.fortios-cli-config-explainer");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");

  const result = useMemo<{ ok: true; data: ConfigDecode<EngineText> } | { ok: false; error: unknown } | null>(() => {
    if (!input.trim()) return null;
    try { return { ok: true, data: decodeConfigLocalisable(input) }; } // the reading, sentences with ids
    catch (e) {
      return { ok: false, error: e }; // shown through tx.error (a parse error carries its sentence)
    }
  }, [input]);

  // An arriving share link (2026-11-01): the copy fills the box as a paste would, and the page explains it.
  useShareArrival(FORTIOS_CLI_CONFIG_SHARE, (s) => setInput(s.input)); // the link's text
  // The copy a link may carry: made once per change, only beside an explanation.
  const shareCopy = useMemo(() => (result && result.ok ? fortiosShareCopy(input) : null), [result, input]); // the copy and its check, or null
  const share = useMemo(() => encodeFortiosCopy(shareCopy), [shareCopy]); // what Share results may carry
  const shareMaybe = shareCopy && shareCopy.ok ? firstSharePlace(shareCopy.report.maybe) : null; // the first secret-looking name left in the copy, or null
  const shareDetails = shareCopy && shareCopy.ok ? [t("share.redacted", { n: shareCopy.replaced }), shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")] : []; // the count, then a caution or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="fcc-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="fcc-in" className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input} onChange={(e) => setInput(e.target.value)}
        placeholder={t("placeholder")} spellCheck={false} rows={12}
      />

      {result && !result.ok && <p className="cidr-error">{tx.error(result.error)}</p>}

      {result && result.ok && (
        <div className="dig-result">
          {/* Share results (2026-11-01): first in the reading (the tree runs long), at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries", { mark: fortiosMark(1) })} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>
          {/* Warnings first: one of them says a list has been silently emptied. */}
          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{tx.say(w)}</li>)}</ul>
            </section>
          )}

          <section className="dig-section">
            <div className="dig-input-head">
              <h3 className="dig-section-title">{t("tree.title")}</h3>
              <span className="dig-record-type">
                {result.data.balanced ? t("tree.balanced") : t("tree.unbalanced")}
              </span>
            </div>
            <ol className="dig-records">
              {result.data.lines.map((l) => (
                <li key={l.line} className="dig-record">
                  <code className="mono">
                    {/* Indent by the depth the line sits at, so the block
                        structure reads at a glance. */}
                    {"\u00a0".repeat(Math.max(0, (l.verb === "config" || l.verb === "edit" ? l.depth - 1 : l.depth) * 4))}
                    {l.verb} {l.rest}
                  </code>
                  <span className="dig-record-type">{t(`verbs.${l.verb}`)}</span>
                  <p className="dig-record-explain">{tx.say(l.explain)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="dig-section">
            <h3 className="dig-section-title">{t("notes.title")}</h3>
            <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}</ul>
          </section>
        </div>
      )}
    </div>
  );
}
