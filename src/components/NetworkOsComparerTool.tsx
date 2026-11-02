"use client";

// ============================================================================
// Network operating system comparer - the UI.
//
// TWO MODES, and the second one matters as much as the first: a reader who
// arrives wanting to know about ONE system should not have to invent a second
// one to compare it against. Selecting a single system shows its full profile;
// selecting two shows them axis by axis.
//
// PAGE LANGUAGE (02/11/2026): the profile reads each dataset text through the
// tool's messages by osTextKey() (engine.os.<id>.<field>), falling back to the
// dataset's English; the comparison comes from compareLocalisable() and is
// turned into the page's language by inPageLanguage(). The English pack carries
// the dataset's English, so the English page reads as before.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { compareLocalisable, osTextKey, NETWORK_OSES, type ComparisonResult, type NetworkOs } from "@/lib/tools/network-os-comparer/compute"; // the comparison with sentence ids, and the dataset's text keys (02/11/2026)
import { engineTexts, type EngineTexts } from "@/lib/tools/engine-text"; // engine sentences and dataset texts in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the page as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { NETWORK_OS_SHARE } from "@/lib/tools/network-os-comparer/share"; // this tool's share spec: the two selects

/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

function Profile({ os, t, tx, share }: { os: NetworkOs; t: (k: string) => string; tx: EngineTexts; share?: ReactNode }) {
  /** One of the system's dataset texts in the page's language (02/11/2026). */
  const txt = (field: string, english: string): string => tx.key(osTextKey(os.id, field), english); // the pack's message, else the dataset's English
  return (
    <div className="dig-result">
      <section className="dig-section">
        <h3 className="dig-section-title">{os.name}</h3>
        <dl className="dig-kv">
          <dt>{t("axes.vendor")}</dt><dd>{os.vendor}</dd>
          {os.since && (<><dt>{t("axes.since")}</dt><dd>{txt("since", os.since)}</dd></>)}
          <dt>{t("axes.lineage")}</dt><dd>{os.lineage.map((x, i) => txt(`lineage${i}`, x)).join(" \u2192 ")}</dd>
          <dt>{t("axes.base")}</dt><dd>{txt("base", os.base)}</dd>
          <dt>{t("axes.state")}</dt><dd>{txt("stateModel", os.stateModel)}</dd>
          <dt>{t("axes.planes")}</dt><dd>{txt("planes", os.planes)}</dd>
          <dt>{t("axes.config")}</dt><dd>{txt("configModel", os.configModel)}</dd>
          <dt>{t("axes.upgrade")}</dt><dd>{txt("upgrade", os.upgrade)}</dd>
        </dl>
      </section>
      {/* Share results (2026-11-01): under the profile's facts (the first answer), before the longer sections. */}
      {share}
      <section className="dig-section">
        <h3 className="dig-section-title">{t("axes.differentiator")}</h3>
        <p className="dig-record-explain">{txt("differentiator", os.differentiator)}</p>
      </section>
      <section className="dig-section">
        <h3 className="dig-section-title">{t("strengths")}</h3>
        <ul className="dig-notes">{os.strengths.map((x, i) => <li key={i}>{txt(`strength${i}`, x)}</li>)}</ul>
      </section>
      {/* Weaknesses are never optional. A golden vector asserts every entry has
          at least two, because an entry with no cost listed is an advert. */}
      <section className="dig-section">
        <h3 className="dig-section-title">{t("weaknesses")}</h3>
        <ul className="dig-notes">{os.weaknesses.map((x, i) => <li key={i}>{txt(`weakness${i}`, x)}</li>)}</ul>
      </section>
    </div>
  );
}

export default function NetworkOsComparerTool() {
  const t = useTranslations("tools.network-os-comparer");
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences and the dataset's texts in the page's language (02/11/2026)
  const [left, setLeft] = useState("junos");
  const [right, setRight] = useState("");

  const single = useMemo(() => (right ? undefined : NETWORK_OSES.find((o) => o.id === left)), [left, right]);

  const result = useMemo<{ ok: true; data: ComparisonResult } | { ok: false; message: string } | null>(() => {
    if (!right) return null;
    try { return { ok: true, data: inPageLanguage(compareLocalisable(left, right), tx) }; } // the comparison, in the page's language
    catch (e) {
      return { ok: false, message: tx.error(e) }; // the error's sentence in the page's language
    }
  }, [left, right, tx]);

  // Share results (2026-11-01): the two selects by id; a profile or a comparison is always on the page.
  const share = useMemo<ShareEncoding>(() => (single || (result && result.ok) ? NETWORK_OS_SHARE.encode({ os: left, with: right }) : NOTHING), [single, result, left, right]); // the button's encoding
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries", { mode: right ? "compare" : "profile" })} title={t("name")} />
    </div>
  ); // the row, at the start of its own line under the answer it shares
  // A shared link sets the two selects, as choosing them does.
  useShareArrival(NETWORK_OS_SHARE, (s) => { setLeft(s.os); setRight(s.with); });

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="nos-left" className="cidr-label">{t("pick")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => { setLeft("ios"); setRight("eos"); }}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setLeft("junos"); setRight(""); }}>{t("clear")}</button>
        </div>
      </div>

      <div className="dig-input-actions">
        <select id="nos-left" className="cidr-input mono" value={left} onChange={(e) => setLeft(e.target.value)}>
          {NETWORK_OSES.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select id="nos-right" className="cidr-input mono" value={right} onChange={(e) => setRight(e.target.value)}>
          <option value="">{t("noSecond")}</option>
          {NETWORK_OSES.filter((o) => o.id !== left).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {single && <Profile os={single} t={t} tx={tx} share={shareRow} />}

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <h3 className="dig-section-title">
              {result.data.left.name} {"\u00b7"} {result.data.right.name}
            </h3>
            {/* Share results: under the comparison's title, before the axis-by-axis differences. */}
            {shareRow}
            <ol className="dig-records">
              {result.data.differences.map((d, i) => (
                <li key={i} className="dig-record">
                  <code className="mono">{d.axis}</code>
                  <dl className="dig-kv">
                    <dt>{result.data.left.name}</dt><dd>{d.a}</dd>
                    <dt>{result.data.right.name}</dt><dd>{d.b}</dd>
                  </dl>
                  <p className="dig-record-explain">{d.whyItMatters}</p>
                </li>
              ))}
            </ol>
          </section>

          {result.data.shared.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("shared")}</h3>
              <ul className="dig-notes">{result.data.shared.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </section>
          )}

          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setRight("")}>{t("backToProfile")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
