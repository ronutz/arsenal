"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/StpElectionCalculatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the spanning tree election calculator (08/11/2026). Two modes:
//   Election       a topology typed as lines (bridge, link, port, vlan,
//                  priority-format) and the path cost method -> the root
//                  bridge, every root port, every designated port and the
//                  ports that discard, each with the comparison that decided
//                  it, in the course's order (chapter 2.4, deck slide 258);
//   Cost by speed  a link speed -> the long and short path costs the
//                  documents read give, which documents give them, and each
//                  vendor's documented default method and how to change it.
// D-83 Example/Clear row: each mode's Example is verbatim from a golden vector
// (examples.ts: deck slide 259's six bridges; slide 266's 1 Gb/s). Sample chips
// fill four more computed vectors. Existing class vocabulary only (seg-*,
// dcb-segs, cidr-*, dig-*, b64-copy, tcl-*, jwt-*, lab-*, hmac-build-note,
// rdap-ask-row, ztc-empty, json-error-*). All compute is local.
//
// PAGE LANGUAGE. The reading comes from runLocalisable() (every sentence an
// EngineText) and is put into the page's language by inPageLanguage(); input
// errors through engineTexts().error. Costs, bridge IDs and port IDs are
// printed as switches print them (digits without grouping, 32768.00-00-5E-00-
// 53-01, 128.4), so they read the same on every locale and in the sentences.
//
// SHARE RESULTS. Under the verdict, a button builds a link that carries the
// mode, the method and the topology, or the speed, as typed (src/lib/tools/
// stp-election-calculator/share.ts); in election mode the popover adds the
// tool's caution line (bridge names and MAC addresses). An arriving link
// (useShareArrival) sets them as typing would; the other mode keeps its values.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state, memoised readings, rich-text chunks
import { useTranslations } from "next-intl"; // messages
import { Link } from "@/i18n/navigation"; // locale-aware links to the Learn article and the puzzle
import { runLocalisable, type StpResult, type ElectionResult, type CostResult, type PortRole, type Decider } from "@/lib/tools/stp-election-calculator/compute"; // the engine, sentences with ids
import { EXAMPLE_ELECTION_REQUEST, EXAMPLE_COST_REQUEST, SAMPLES, SPEED_CHIPS } from "@/lib/tools/stp-election-calculator/examples"; // the Examples and chips, the same objects the golden vectors pin
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { STP_SHARE, encodeStpShare, requestOf, type StpShareState } from "@/lib/tools/stp-election-calculator/share"; // this tool's share spec

/** The two modes. */
type Mode = "election" | "cost"; // the page's modes

/** What the page shows: nothing yet, a reading, or a refusal in the page's language. */
type View = null | { ok: true; data: StpResult } | { ok: false; message: string }; // the computed state

/** The documents behind a cost value, by the short name a reader knows them by (proper names: not translated). */
const SOURCE_NAMES: Readonly<Record<string, string>> = Object.freeze({
  "extreme-se-cost": "Extreme Switch Engine", // configure stpd ports cost
  "mikrotik-bridging": "MikroTik RouterOS", // port-cost-mode table
  "cisco-c9300-stp": "Cisco IOS XE", // the default configuration table
  "aruba-cx-cost": "HPE Aruba AOS-CX", // spanning-tree cost
  "arista-eos-stp": "Arista EOS", // the Path Cost section
  "ciscopress-scaling": "Cisco Press", // Table 2-1
}); // by source id

export default function StpElectionCalculatorTool() {
  const t = useTranslations("tools.stp-election-calculator"); // this tool's messages
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language
  // ---- The form. ----
  const [mode, setMode] = useState<Mode>("election"); // the mode shown
  const [method, setMethod] = useState<"long" | "short">("long"); // election: the page's path cost method, long by default
  const [topology, setTopology] = useState(""); // election: the lines
  const [speed, setSpeed] = useState(""); // cost: the speed

  /** The share state of the mode shown (the same shape the engine request is built from). */
  const state: StpShareState = useMemo(() => (mode === "election" ? { mode, method, topology } : { mode, speed }), [mode, method, topology, speed]); // the fields

  /** The reading: nothing until the mode's field is started, then the engine's reading or its refusal. */
  const view: View = useMemo(() => {
    if (mode === "election" && topology.trim() === "") return null; // nothing typed yet
    if (mode === "cost" && speed.trim() === "") return null; // no speed yet
    try {
      return { ok: true, data: inPageLanguage(runLocalisable(requestOf(state)), tx) as StpResult }; // the reading, in the page's language
    } catch (e) {
      return { ok: false, message: tx.error(e) }; // the refusal's sentence in the page's language
    } // computed
  }, [mode, topology, speed, state, tx]); // recomputed on any field

  // An arriving share link: the mode and its fields are set as typing would set them.
  useShareArrival(STP_SHARE, (s) => {
    setMode(s.mode); // the mode
    if (s.mode === "election") { setMethod(s.method); setTopology(s.topology); } // the election
    else setSpeed(s.speed); // the speed
  });
  // What Share results carries: the mode's fields, once the page has a reading (memoised).
  const share = useMemo(() => encodeStpShare(state, !!view?.ok), [state, view]); // the encoding

  /** Fill the mode shown with its Example (verbatim from the golden vectors: the course's slides 259 and 266). */
  const loadExample = () => {
    if (mode === "election") { setMethod(EXAMPLE_ELECTION_REQUEST.method); setTopology(EXAMPLE_ELECTION_REQUEST.topology); } // slide 259
    else setSpeed(EXAMPLE_COST_REQUEST.speed); // slide 266's 1 Gb/s
  }; // loadExample
  /** Empty the mode shown (the method stays). */
  const clearAll = () => { if (mode === "election") setTopology(""); else setSpeed(""); }; // clearAll

  /** One label and value row. */
  const row = (label: ReactNode, value: ReactNode, key: string) => (
    <div className="jwt-claim-row" key={key}>
      <span className="jwt-claim-label">{label}</span>
      <span className="jwt-claim-value">{value}</span>
    </div>
  ); // row

  /** Inline code in rich messages. */
  const code = (chunks: ReactNode) => <code>{chunks}</code>; // <c>...</c>

  /** The notes panel, with the Learn article and the daily puzzle. */
  const notesPanel = (notes: string[]) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
        <li>{t.rich("learn", { a: (chunks: ReactNode) => <Link href="/learn/spanning-tree-in-one-article" className="tool-sources-link">{chunks}</Link> })}</li>
        <li>{t.rich("puzzle", { a: (chunks: ReactNode) => <Link href="/dev/fun/spanning-tree" className="tool-sources-link">{chunks}</Link> })}</li>
      </ul>
    </section>
  ); // notesPanel

  /** The share row (under the verdict); the caution line only where bridge names and addresses travel. */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} details={mode === "election" ? [t("share.caution")] : []} title={t("name")} />
    </div>
  ); // shareRow

  /** A role, worded. */
  const roleText = (r: PortRole): string => t(`role.${r}`); // root, designated, alternate, backup
  /** What decided a comparison, worded. */
  const byText = (d: Decider): string => t(`by.${d}`); // the short label

  /** The election reading. */
  const electionView = (r: ElectionResult) => {
    const name = (pi: number): string => `${r.ports[pi].bridgeName}:${r.ports[pi].number}`; // a port's name
    return (
      <div className="jwt-results">
        <div className="tcl-verdict tcl-verdict-ok" role="status">
          <p>{r.verdictText}</p>
        </div>
        {r.warnings.length > 0 && (
          <div className="tcl-verdict tcl-verdict-warn" role="status">
            <ul>{r.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        )}
        {shareRow}

        {/* Step 1: the root bridge, every bridge in bridge ID order. */}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("step1.heading")}</h4>
          <p>{r.rootStep.text}</p>
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("col.bridge")}</th>
                  <th scope="col">{t("col.bridgeId")}</th>
                </tr>
              </thead>
              <tbody>
                {r.rootStep.ranking.map((bi) => r.bridges[bi]).map((b) => (
                  <tr key={b.index}>
                    <th scope="row">
                      {b.isRoot ? <strong>{b.name}</strong> : b.name}
                      <br />
                      <span className="hmac-build-note">{b.isRoot ? t("row.root") : t("row.cost", { cost: String(b.rootPathCost) })}{b.methodSet ? ` · ${t(`row.method.${b.method}`)}` : ""}</span>
                    </th>
                    <td className="mono">
                      {/* The priority field and the MAC each stay whole (json-stat: no wrap); a narrow screen breaks after the dot. */}
                      <span className="json-stat">{b.priorityField}.</span><wbr /><span className="json-stat">{b.mac}</span>
                      {b.extension > 0 && (<><br /><span className="hmac-build-note">{t("row.extension", { priority: String(b.priority), vlan: String(b.extension), field: String(b.priorityField) })}</span></>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Step 2: each non-root bridge's root port. */}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("step2.heading")}</h4>
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("col.bridge")}</th>
                  <th scope="col">{t("col.rootPort")}</th>
                  <th scope="col">{t("col.decidedBy")}</th>
                </tr>
              </thead>
              <tbody>
                {r.rootPortSteps.map((s) => (
                  <tr key={s.bridge}>
                    <th scope="row">{r.bridges[s.bridge].name}<br /><span className="hmac-build-note">{t("row.cost", { cost: String(s.rootPathCost) })}</span></th>
                    <td className="mono">{name(s.rootPort)}</td>
                    <td>{byText(s.decidedBy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ol className="lab-steps">{r.rootPortSteps.map((s) => <li key={s.bridge}>{s.text}</li>)}</ol>
        </section>

        {/* Step 3: each segment's designated port. */}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("step3.heading")}</h4>
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("col.segment")}</th>
                  <th scope="col">{t("col.designated")}</th>
                  <th scope="col">{t("col.decidedBy")}</th>
                </tr>
              </thead>
              <tbody>
                {r.designatedSteps.map((s) => (
                  <tr key={s.segment}>
                    <th scope="row" className="mono">{r.segments[s.segment].label}</th>
                    <td className="mono">{name(s.designatedPort)}</td>
                    <td>{byText(s.decidedBy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ol className="lab-steps">{r.designatedSteps.map((s) => <li key={s.segment}>{s.text}</li>)}</ol>
        </section>

        {/* Step 4: every port, and why the ones left over discard. */}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("step4.heading")}</h4>
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("col.port")}</th>
                  <th scope="col">{t("col.cost")}</th>
                  <th scope="col">{t("col.role")}</th>
                </tr>
              </thead>
              <tbody>
                {[...r.ports].sort((a, c) => a.bridge - c.bridge || a.number - c.number).map((p) => ( /* grouped by bridge, as entered, then by port number */
                  <tr key={p.index}>
                    <th scope="row"><span className="mono">{p.bridgeName}:{p.number}</span><br /><span className="hmac-build-note">{t("row.portId", { id: p.portId })}</span></th>
                    <td className="mono">{p.cost}<br /><span className="hmac-build-note">{p.costSource === "speed" ? t(`row.from.${p.speed ? "speed" : "link"}`, { speed: p.speed ?? "" }) : t(`row.from.${p.costSource}`, { speed: "" })}</span></td>
                    <td>{p.forwarding ? <strong>{roleText(p.role)}</strong> : roleText(p.role)}<br /><span className="hmac-build-note">{p.forwarding ? t("state.forwarding") : t("state.discarding")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {r.blockedSteps.length > 0 ? <ol className="lab-steps">{r.blockedSteps.map((s) => <li key={s.port}>{s.text}</li>)}</ol> : <p className="hmac-build-note">{t("step4.none")}</p>}
        </section>
        {notesPanel(r.notes)}
      </div>
    );
  }; // electionView

  /** The cost reading. */
  const costView = (r: CostResult) => (
    <div className="jwt-results">
      <div className="tcl-verdict tcl-verdict-ok" role="status">
        <p>{r.verdictText}</p>
      </div>
      {shareRow}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("cost.tableHeading")}</h4>
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("col.speed")}</th>
                <th scope="col">{t("col.long")}</th>
                <th scope="col">{t("col.short")}</th>
              </tr>
            </thead>
            <tbody>
              {r.table.map((s) => {
                const hit = s.id === r.speed.id; // the row asked for
                const cell = (v: { value: number; sources: readonly string[] } | null) => (v ? (<>{hit ? <strong className="mono">{v.value}</strong> : <span className="mono">{v.value}</span>}{hit && (<><br /><span className="hmac-build-note">{v.sources.map((x) => SOURCE_NAMES[x] ?? x).join(", ")}</span></>)}</>) : <span className="hmac-build-note">{t("cost.none")}</span>); // a value, and its documents on the row asked for
                return (
                  <tr key={s.id} aria-current={hit ? "true" : undefined}>
                    <th scope="row">{hit ? <strong>{s.label}</strong> : s.label}</th>
                    <td>{cell(s.long)}</td>
                    <td>{cell(s.short)}</td>
                  </tr>
                ); // one speed
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("cost.vendorsHeading")}</h4>
        <div className="jwt-claims">
          {r.vendors.map((v) => row(v.platform, (
            <>
              <strong>{t(`cost.default.${v.defaultMethod}`)}</strong>{v.valueAtSpeed !== null ? ` · ${t("cost.atSpeed", { speed: r.speed.label, value: String(v.valueAtSpeed) })}` : ""}
              <br />
              {v.text}
              {v.change && (<><br /><span className="hmac-build-note">{t("cost.change")}</span> <code>{v.change}</code></>)}
              {v.perPort && (<><br /><span className="hmac-build-note">{t("cost.perPort")}</span> <code>{v.perPort}</code></>)}
            </>
          ), v.id))}
        </div>
      </section>
      {notesPanel(r.notes)}
    </div>
  ); // costView

  /** A seg button. */
  const segBtn = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" className={`seg-btn${active ? " seg-btn--active" : ""}`} aria-pressed={active} onClick={onClick}>{label}</button>
  ); // segBtn

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode switch. */}
      <div className="seg-group" role="group" aria-label={t("modeLabel")}>
        <div className="seg">
          {(["election", "cost"] as const).map((m) => segBtn(mode === m, t(`mode.${m}`), () => setMode(m), m))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor={mode === "election" ? "stp-topology" : "stp-speed"}>{t(`inputs.${mode}`)}</label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: each mode's Example is verbatim from a golden vector. */}
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clearAll}>{t("clear")}</button>
          </div>
        </div>

        {mode === "election" && (
          <>
            {/* The page's path cost method (a bridge line may set its own). */}
            <div className="dcb-segs">
              <div className="dcb-seg">
                <span className="cidr-label">{t("methodLabel")}</span>
                <div className="seg" role="group" aria-label={t("methodLabel")}>
                  {(["long", "short"] as const).map((m) => segBtn(method === m, t(`method.${m}`), () => setMethod(m), m))}
                </div>
              </div>
            </div>
            <textarea id="stp-topology" className="cidr-input dig-textarea mono" value={topology} onChange={(e) => setTopology(e.target.value)} placeholder={t("placeholder")} spellCheck={false} autoComplete="off" rows={15} maxLength={4000} aria-describedby="stp-grammar" />
            <div className="tcl-presets-row" role="group" aria-label={t("samplesLabel")}>
              {SAMPLES.map((s) => (
                <button key={s.id} type="button" className="tcl-chip" aria-pressed={topology === s.topology && method === s.method} onClick={() => { setMethod(s.method); setTopology(s.topology); }}>{t(`sample.${s.id}`)}</button>
              ))}
            </div>
            <ul id="stp-grammar" className="hmac-build-note">
              <li>{t.rich("grammar.bridge", { c: code })}</li>
              <li>{t.rich("grammar.link", { c: code })}</li>
              <li>{t.rich("grammar.port", { c: code })}</li>
              <li>{t.rich("grammar.vlan", { c: code })}</li>
              <li>{t("grammar.limits")}</li>
            </ul>
          </>
        )}

        {mode === "cost" && (
          <>
            <div className="bb-fields">
              <div className="bb-field">
                <input id="stp-speed" className="cidr-input mono" value={speed} onChange={(e) => setSpeed(e.target.value)} placeholder="1G" autoComplete="off" spellCheck={false} maxLength={24} aria-describedby="stp-speed-hint" />
              </div>
            </div>
            <div className="tcl-presets-row" role="group" aria-label={t("speedsLabel")}>
              {SPEED_CHIPS.map((s) => (
                <button key={s} type="button" className="tcl-chip" aria-pressed={speed === s} onClick={() => setSpeed(s)}>{s}</button>
              ))}
            </div>
            <p id="stp-speed-hint" className="hmac-build-note">{t("speedHint")}</p>
          </>
        )}

        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">●</span>
          {t("runsLocally")}
        </p>
      </div>

      {/* A refusal, in the page's language. */}
      {view && !view.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{view.message}</p>
        </div>
      )}

      {/* Nothing typed yet. */}
      {!view && <p className="ztc-empty">{t(`empty.${mode}`)}</p>}

      {/* The reading. */}
      {view && view.ok && (view.data.mode === "election" ? electionView(view.data) : costView(view.data))}
    </div>
  );
} // StpElectionCalculatorTool
