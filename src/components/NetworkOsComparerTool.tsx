"use client";

// ============================================================================
// Network operating system comparer - the UI.
//
// TWO MODES, and the second one matters as much as the first: a reader who
// arrives wanting to know about ONE system should not have to invent a second
// one to compare it against. Selecting a single system shows its full profile;
// selecting two shows them axis by axis.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { compare, NETWORK_OSES, NetworkOsError, type ComparisonResult, type NetworkOs } from "@/lib/tools/network-os-comparer";

function Profile({ os, t }: { os: NetworkOs; t: (k: string) => string }) {
  return (
    <div className="dig-result">
      <section className="dig-section">
        <h3 className="dig-section-title">{os.name}</h3>
        <dl className="dig-kv">
          <dt>{t("axes.vendor")}</dt><dd>{os.vendor}</dd>
          {os.since && (<><dt>{t("axes.since")}</dt><dd>{os.since}</dd></>)}
          <dt>{t("axes.lineage")}</dt><dd>{os.lineage.join(" \u2192 ")}</dd>
          <dt>{t("axes.base")}</dt><dd>{os.base}</dd>
          <dt>{t("axes.state")}</dt><dd>{os.stateModel}</dd>
          <dt>{t("axes.planes")}</dt><dd>{os.planes}</dd>
          <dt>{t("axes.config")}</dt><dd>{os.configModel}</dd>
          <dt>{t("axes.upgrade")}</dt><dd>{os.upgrade}</dd>
        </dl>
      </section>
      <section className="dig-section">
        <h3 className="dig-section-title">{t("axes.differentiator")}</h3>
        <p className="dig-record-explain">{os.differentiator}</p>
      </section>
      <section className="dig-section">
        <h3 className="dig-section-title">{t("strengths")}</h3>
        <ul className="dig-notes">{os.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </section>
      {/* Weaknesses are never optional. A golden vector asserts every entry has
          at least two, because an entry with no cost listed is an advert. */}
      <section className="dig-section">
        <h3 className="dig-section-title">{t("weaknesses")}</h3>
        <ul className="dig-notes">{os.weaknesses.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </section>
    </div>
  );
}

export default function NetworkOsComparerTool() {
  const t = useTranslations("tools.network-os-comparer");
  const [left, setLeft] = useState("junos");
  const [right, setRight] = useState("");

  const single = useMemo(() => (right ? undefined : NETWORK_OSES.find((o) => o.id === left)), [left, right]);

  const result = useMemo<{ ok: true; data: ComparisonResult } | { ok: false; message: string } | null>(() => {
    if (!right) return null;
    try { return { ok: true, data: compare(left, right) }; }
    catch (e) {
      if (e instanceof NetworkOsError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [left, right]);

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

      {single && <Profile os={single} t={t} />}

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <h3 className="dig-section-title">
              {result.data.left.name} {"\u00b7"} {result.data.right.name}
            </h3>
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
