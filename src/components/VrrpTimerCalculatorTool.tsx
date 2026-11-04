"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/VrrpTimerCalculatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the VRRP timer, virtual MAC and election calculator (02/11/2026).
// Three modes on one form, with the VRRP version (3, RFC 9568; or 2, RFC 3768)
// shared by all three:
//   Timers     a priority (typed, or one of four presets) and the interval ->
//              Skew_Time and the down interval with the arithmetic shown, and
//              when a Backup takes over after a silent failure or a clean
//              shutdown;
//   Election   two to eight routers (name, priority, primary address, owner),
//              Preempt_Mode and the interval -> who is Active and why, what
//              happens when it fails silently, shuts down cleanly and comes
//              back, with the times, and every router's timers;
//   Virtual MAC a VRID and a family -> the Virtual Router MAC in three
//              notations.
// D-83 Example/Clear row: each mode's Example is verbatim from a golden vector
// (examples.ts: the VRRP lab of the course's chapter 4.2). Existing class
// vocabulary only (seg-*, dcb-segs, bb-fields, cidr-*, jwt-*, tcl-*, lab-*,
// curlb-section, curlb-check, rdap-ask-row, hmac-build-note, ztc-empty,
// json-error-*). All compute is local.
//
// PAGE LANGUAGE. The reading comes from runLocalisable() (every sentence an
// EngineText) and is put into the page's language by inPageLanguage(); input
// errors through engineTexts().error. Times are never inside a sentence: the
// engine returns them as exact decimal text with "." as the point, and this
// component prints them exactly, with the page's decimal sign and grouping.
//
// SHARE RESULTS. Under the verdict, a button builds a link that carries the
// mode, the version and the mode's fields as typed (a form: named values only,
// src/lib/tools/vrrp-timer-calculator/share.ts); in election mode the popover
// adds the tool's caution line (router names and addresses). An arriving link
// (useShareArrival) sets them as typing would; the other modes keep their values.
//
// UP AND DOWN ARROWS (03/11/2026): the priorities, the advertisement interval
// and the VRID have a down and an up arrow beside them (src/components/
// NumberStepper.tsx), inside the RFC's ranges the engine enforces, and step
// with Arrow Up and Down. The interval steps in the unit typed (cs, ms by ten,
// s; the version's own unit when bare) and keeps it; a blank interval steps
// from the RFC default it stands for.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state, memoised readings, rich-text chunks
import { useLocale, useTranslations } from "next-intl"; // messages and the active locale
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // the up and down arrows, and their keys
import { Link } from "@/i18n/navigation"; // the locale-aware link to the Learn article
import { runLocalisable, MAX_ROUTERS, MIN_ROUTERS, type VrrpResult, type TimersResult, type ElectionResult, type MacResult, type ElectionStep } from "@/lib/tools/vrrp-timer-calculator/compute"; // the engine, sentences with ids
import { EXAMPLE_TIMERS_REQUEST, EXAMPLE_ELECTION_REQUEST, EXAMPLE_MAC_REQUEST } from "@/lib/tools/vrrp-timer-calculator/examples"; // the Examples, the same objects the golden vectors pin
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { VRRP_SHARE, encodeVrrpShare, requestOf, type RouterForm, type VrrpShareState } from "@/lib/tools/vrrp-timer-calculator/share"; // this tool's share spec

/** The three modes. */
type Mode = "timers" | "election" | "mac"; // the page's modes

/** What the page shows: nothing yet, a reading, or a refusal in the page's language. */
type View = null | { ok: true; data: VrrpResult } | { ok: false; message: string }; // the computed state

/** Two blank routers: the form an election starts from. */
const BLANK_ROUTERS: readonly RouterForm[] = Object.freeze([
  Object.freeze({ name: "", priority: "", address: "", owner: false }), // the first
  Object.freeze({ name: "", priority: "", address: "", owner: false }), // the second
]); // two rows

/** The priority presets: the owner, the best Backup, the RFC's default and the lowest. */
const PRIORITY_PRESETS = ["255", "254", "100", "1"] as const; // RFC 9568 s5.2.4

/**
 * The advertisement interval's arrows: the number to step, its bounds and step in the unit typed, and a setter that
 * writes the unit back, so every value the arrows give is one parseInterval accepts.
 *
 * @param text the field as typed
 * @param version "3" (centiseconds, or ms or s) or "2" (whole seconds)
 * @param set the field's setter
 * @returns the stepper's value, bounds, step and setter
 */
function intervalStepper(text: string, version: "3" | "2", set: (v: string) => void) {
  // Blank stands for the RFC default (100 cs, or 1 s): the arrows step from it, bare.
  if (text.trim() === "") return version === "3" ? { value: "100", min: 1, max: 4095, step: 1, integer: true, onValue: set } : { value: "1", min: 1, max: 255, step: 1, integer: true, onValue: set };
  // A number, then an optional unit (the rest of the field is kept as typed: its spacing and its case).
  const m = /^\s*(\d+(?:\.\d+)?)(\s*(cs|ms|s)?\s*)$/i.exec(text);
  // The unit, or the version's own when bare.
  const unit = m ? (m[3] ?? (version === "3" ? "cs" : "s")).toLowerCase() : version === "3" ? "cs" : "s";
  // Anything else (or a sub-second unit on VRRPv2, which the engine refuses): the arrows start a bare number at the floor.
  if (!m || (version === "2" && unit !== "s")) return version === "3" ? { value: text, min: 1, max: 4095, step: 1, integer: true, onValue: set } : { value: text, min: 1, max: 255, step: 1, integer: true, onValue: set };
  // The setter: the stepped number, then the unit exactly as typed.
  const onValue = (v: string) => set(v + m[2]);
  // VRRPv2: whole seconds, 1 to 255 (RFC 3768's 8-bit field).
  if (version === "2") return { value: m[1], min: 1, max: 255, step: 1, integer: true, onValue };
  // VRRPv3 in milliseconds: one centisecond (10 ms) a press, 10 to 40950 ms.
  if (unit === "ms") return { value: m[1], min: 10, max: 40950, step: 10, integer: true, onValue };
  // VRRPv3 in seconds: one second a press, 1 to 40 (a step past 40 s would leave the 40.95 s ceiling; finer is typed).
  if (unit === "s") return { value: m[1], min: 1, max: 40, step: 1, onValue };
  // VRRPv3 in centiseconds: 1 to 4095 (RFC 9568's 12-bit field, erratum 8301).
  return { value: m[1], min: 1, max: 4095, step: 1, integer: true, onValue };
}

export default function VrrpTimerCalculatorTool() {
  const t = useTranslations("tools.vrrp-timer-calculator"); // this tool's messages
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language
  const locale = useLocale(); // the page's language, for numbers
  // ---- The form (the version and the interval are shared by the modes that use them). ----
  const [mode, setMode] = useState<Mode>("timers"); // the mode shown
  const [version, setVersion] = useState<"3" | "2">("3"); // VRRPv3 by default
  const [priority, setPriority] = useState(""); // timers: the priority
  const [intervalText, setIntervalText] = useState(""); // timers and election: blank is the RFC's default
  const [preempt, setPreempt] = useState(true); // election: Preempt_Mode, True by default
  const [routers, setRouters] = useState<RouterForm[]>(() => BLANK_ROUTERS.map((r) => ({ ...r }))); // election: the rows
  const [vrid, setVrid] = useState(""); // MAC: the VRID
  const [family, setFamily] = useState<"ipv4" | "ipv6">("ipv4"); // MAC: the family
  /** The interval's arrows (value, bounds, step, setter), for the Timers and the Election fields alike. */
  const intervalArrows = intervalStepper(intervalText, version, setIntervalText); // in the unit typed, for this version

  /** The share state of the mode shown (the same shape the engine request is built from). */
  const state: VrrpShareState = useMemo(() => (mode === "timers"
    ? { mode, version, priority, interval: intervalText } // timers
    : mode === "election"
      ? { mode, version, interval: intervalText, preempt, routers } // the election
      : { mode, version, vrid, family }), // the MAC
  [mode, version, priority, intervalText, preempt, routers, vrid, family]); // the fields

  /** The reading: nothing until the mode's fields are started, then the engine's reading or its refusal. */
  const view: View = useMemo(() => {
    if (mode === "timers" && priority.trim() === "") return null; // no priority yet
    if (mode === "election" && routers.every((r) => r.name.trim() === "" && r.priority.trim() === "" && r.address.trim() === "" && !r.owner)) return null; // no router yet
    if (mode === "mac" && vrid.trim() === "") return null; // no VRID yet
    try {
      return { ok: true, data: inPageLanguage(runLocalisable(requestOf(state)), tx) as VrrpResult }; // the reading, in the page's language
    } catch (e) {
      return { ok: false, message: tx.error(e) }; // the refusal's sentence in the page's language
    } // computed
  }, [mode, priority, routers, vrid, state, tx]); // recomputed on any field

  // An arriving share link: the mode, the version and the mode's fields are set as typing would set them.
  useShareArrival(VRRP_SHARE, (s) => {
    setMode(s.mode); setVersion(s.version); // the shared fields
    if (s.mode === "timers") { setPriority(s.priority); setIntervalText(s.interval); } // timers
    else if (s.mode === "election") { setIntervalText(s.interval); setPreempt(s.preempt); setRouters(s.routers.map((r) => ({ ...r }))); } // the election
    else { setVrid(s.vrid); setFamily(s.family); } // the MAC
  });
  // What Share results carries: the mode's fields, once the page has a reading (memoised).
  const share = useMemo(() => encodeVrrpShare(state, !!view?.ok), [state, view]); // the encoding

  /** Fill the mode shown with its Example (verbatim from the golden vectors: the course's VRRP lab). */
  const loadExample = () => {
    if (mode === "timers") { // the timers Example
      const ex = EXAMPLE_TIMERS_REQUEST; // priority 100 at 100 cs
      setVersion(ex.version); setPriority(ex.priority); setIntervalText(ex.interval); // the fields
    } else if (mode === "election") { // the election Example
      const ex = EXAMPLE_ELECTION_REQUEST; // the lab's two core switches
      setVersion(ex.version); setIntervalText(ex.interval); setPreempt(ex.preempt === "on"); // the fields
      setRouters(ex.routers.map((r) => ({ name: r.name, priority: r.priority, address: r.address, owner: r.owner }))); // the rows
    } else { // the MAC Example
      const ex = EXAMPLE_MAC_REQUEST; // VRID 10, IPv4
      setVersion(ex.version); setVrid(ex.vrid); setFamily(ex.family); // the fields
    } // modes
  }; // loadExample
  /** Empty the mode shown (the version stays). */
  const clearAll = () => {
    if (mode === "timers") { setPriority(""); setIntervalText(""); } // timers
    else if (mode === "election") { setIntervalText(""); setPreempt(true); setRouters(BLANK_ROUTERS.map((r) => ({ ...r }))); } // the election
    else { setVrid(""); } // the MAC
  }; // clearAll

  /** Change one field of one router. */
  const setRouter = (i: number, patch: Partial<RouterForm>) => setRouters((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r))); // immutable update
  /** Add a blank router (at most MAX_ROUTERS). */
  const addRouter = () => setRouters((rs) => (rs.length >= MAX_ROUTERS ? rs : [...rs, { name: "", priority: "", address: "", owner: false }])); // one more row
  /** Remove a router (never below MIN_ROUTERS). */
  const removeRouter = (i: number) => setRouters((rs) => (rs.length <= MIN_ROUTERS ? rs : rs.filter((_, j) => j !== i))); // one row fewer

  // ---- Numbers in the page's language, exactly. ----
  /** The page's decimal sign. */
  const decimalSign = useMemo(() => new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === "decimal")?.value ?? ".", [locale]); // "." or ","
  /** An exact decimal from the engine with the page's grouping and decimal sign, every digit kept. */
  const num = (s: string): string => {
    const [int, frac] = s.split("."); // the integer and the fraction
    const grouped = new Intl.NumberFormat(locale).format(BigInt(int)); // grouped exactly
    return frac ? `${grouped}${decimalSign}${frac}` : grouped; // with the page's sign
  }; // num
  /** A time in the version's unit, with seconds beside centiseconds. */
  const time = (unitValue: string, seconds: string, unit: "cs" | "s"): string => (unit === "cs" ? t("unit.both", { cs: num(unitValue), s: num(seconds) }) : t("unit.s", { n: num(seconds) })); // "360.9375 cs (3.609375 s)" or "3.609375 s"

  /** An RFC name that may break after each underscore on a narrow screen (Active_Down_Interval is one long word). */
  const breakable = (name: string): ReactNode => name.split("_").map((part, i, all) => (
    <span key={i}>{part}{i < all.length - 1 ? <>_<wbr /></> : null}</span>
  )); // breakable

  /** One label and value row. */
  const row = (label: ReactNode, value: ReactNode, key: string) => (
    <div className="jwt-claim-row" key={key}>
      <span className="jwt-claim-label">{label}</span>
      <span className="jwt-claim-value mono">{value}</span>
    </div>
  ); // row

  /** The notes panel, with the Learn article. */
  const notesPanel = (notes: string[]) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
        <li>{t.rich("learn", { a: (chunks: ReactNode) => <Link href="/learn/first-hop-redundancy-vrrp-and-hsrp" className="tool-sources-link">{chunks}</Link> })}</li>
      </ul>
    </section>
  ); // notesPanel

  /** The share row (under the verdict); the caution line only where names and addresses travel. */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} details={mode === "election" ? [t("share.caution")] : []} title={t("name")} />
    </div>
  ); // shareRow

  /** The timers reading. */
  const timersView = (r: TimersResult) => {
    const u = r.unit; // cs or s
    const n = r.names; // the version's words
    return (
      <div className="jwt-results">
        <div className="tcl-verdict tcl-verdict-ok" role="status">
          <p>{r.owner ? t("timers.summaryOwner", { role: n.activeRole }) : t("timers.summary", { p: r.priority, role: n.activeRole, down: time(r.downInterval, r.downIntervalSeconds, u), skew: time(r.skewTime, r.skewTimeSeconds, u) })}</p>
        </div>
        {shareRow}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("timers.heading", { rfc: n.rfc })}</h4>
          <div className="jwt-claims">
            {row(t("timers.interval"), time(r.interval, r.intervalSeconds, u), "interval")}
            {row("Skew_Time", (
              <>
                <span className="hmac-build-note">{u === "cs" ? `((256 − Priority) × ${n.interval}) / 256` : "(256 − Priority) / 256"}</span>
                <br />
                {u === "cs" ? `((256 − ${r.priority}) × ${num(r.interval)}) / 256 = ${num(r.skewNumerator)} / 256 = ` : `(256 − ${r.priority}) / 256 = ${num(r.skewNumerator)} / 256 = `}
                <strong>{time(r.skewTime, r.skewTimeSeconds, u)}</strong>
              </>
            ), "skew")}
            {row(n.down, (
              <>
                <span className="hmac-build-note">{`(3 × ${n.interval}) + Skew_Time`}</span>
                <br />
                {`(3 × ${num(r.interval)}) + ${num(r.skewTime)} = `}
                <strong>{time(r.downInterval, r.downIntervalSeconds, u)}</strong>
              </>
            ), "down")}
          </div>
        </section>
        {r.failover && (
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("failover.heading")}</h4>
            <div className="jwt-claims">
              {row(t("failover.silent"), t("failover.silentValue", { from: time(r.failover.silentFrom, r.failover.silentFromSeconds, u), to: time(r.failover.silentTo, r.failover.silentToSeconds, u) }), "silent")}
              {row(t("failover.shutdown"), t("failover.shutdownValue", { time: time(r.failover.shutdown, r.failover.shutdownSeconds, u) }), "shutdown")}
            </div>
          </section>
        )}
        {notesPanel(r.notes)}
      </div>
    );
  }; // timersView

  /** The heading of one election step (the sentence after it names the routers). */
  const stepWhere = (s: ElectionStep): string => t(`step.where.${s.event}`); // At the start, Silent failure, Clean shutdown, Return
  /** The time line of one election step. */
  const stepTime = (s: ElectionStep, r: ElectionResult): string => {
    if (s.after === null || s.afterSeconds === null) return t("step.time.none"); // nothing changed
    if (s.after === "0") return t("step.time.now"); // at once
    const tm = time(s.after, s.afterSeconds, r.unit); // the duration
    if (s.event === "failure" && s.from !== null && s.fromSeconds !== null) return t("step.time.window", { from: time(s.from, s.fromSeconds, r.unit), to: tm }); // the window
    return t(`step.time.${s.event}`, { time: tm }); // after the start, the shutdown or the return
  }; // stepTime

  /** The election reading. */
  const electionView = (r: ElectionResult) => (
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
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("election.stepsHeading", { rfc: r.names.rfc })}</h4>
        <ol className="lab-steps">
          {r.steps.map((s, i) => (
            <li key={i}>
              <span className="lab-step-where">{stepWhere(s)}.</span> {s.text}
              <br />
              <span className="hmac-build-note">{stepTime(s, r)}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("election.tableHeading")}</h4>
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("col.router")}</th>
                <th scope="col">{breakable("Skew_Time")} ({r.unit})</th>
                <th scope="col">{breakable(r.names.down)} ({r.unit})</th>
              </tr>
            </thead>
            <tbody>
              {r.ranking.map((i) => r.routers[i]).map((x) => (
                <tr key={x.index}>
                  <th scope="row">
                    {x.name}
                    <br />
                    <span className="hmac-build-note">{x.owner ? t("row.priorityOwner") : t("row.priority", { p: x.priority })} · {x.startState === "active" ? r.names.activeState : "Backup"}</span>
                    <br />
                    <span className="hmac-build-note mono">{x.address}</span>
                  </th>
                  <td className="mono">{x.owner ? t("ownerNoWait") : num(x.skewTime)}</td>
                  <td className="mono">{x.owner ? t("ownerNoWait") : num(x.downInterval)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hmac-build-note">{t("election.tableNote")}</p>
      </section>
      {notesPanel(r.notes)}
    </div>
  ); // electionView

  /** The MAC reading. */
  const macView = (r: MacResult) => (
    <div className="jwt-results">
      <div className="tcl-verdict tcl-verdict-ok" role="status">
        <p>{t("mac.summary", { vrid: r.vrid, family: r.family === "ipv4" ? "IPv4" : "IPv6" })} <strong className="mono">{r.hyphen}</strong></p>
      </div>
      {shareRow}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("mac.heading")}</h4>
        <div className="jwt-claims">
          {row(t("mac.hyphen"), r.hyphen, "hyphen")}
          {row(t("mac.colon"), r.colon, "colon")}
          {row(t("mac.dotted"), r.dotted, "dotted")}
          {row(t("mac.vridHex"), t("mac.vridHexValue", { vrid: r.vrid, hex: r.vridHex }), "hex")}
          {row(t("mac.dest"), t("mac.destValue", { group: r.multicastGroup, protocol: r.ipProtocol }), "dest")}
        </div>
      </section>
      {notesPanel(r.notes)}
    </div>
  ); // macView

  /** A seg button. */
  const segBtn = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" className={`seg-btn${active ? " seg-btn--active" : ""}`} aria-pressed={active} onClick={onClick}>{label}</button>
  ); // segBtn

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode switch. */}
      <div className="seg-group" role="group" aria-label={t("modeLabel")}>
        <div className="seg">
          {(["timers", "election", "mac"] as const).map((m) => segBtn(mode === m, t(`mode.${m}`), () => setMode(m), m))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <span className="cidr-label">{t(`inputs.${mode}`)}</span>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: each mode's Example is verbatim from a golden vector. */}
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clearAll}>{t("clear")}</button>
          </div>
        </div>

        {/* The version, and the mode's own switch beside it (one column on a phone). */}
        <div className="dcb-segs">
          <div className="dcb-seg">
            <span className="cidr-label">{t("versionLabel")}</span>
            <div className="seg" role="group" aria-label={t("versionLabel")}>
              {(["3", "2"] as const).map((v) => segBtn(version === v, t(`version.${v}`), () => setVersion(v), v))}
            </div>
          </div>
          {mode === "election" && (
            <div className="dcb-seg">
              <span className="cidr-label">{t("preemptLabel")}</span>
              <div className="seg" role="group" aria-label={t("preemptLabel")}>
                {segBtn(preempt, t("preempt.on"), () => setPreempt(true), "on")}
                {segBtn(!preempt, t("preempt.off"), () => setPreempt(false), "off")}
              </div>
            </div>
          )}
          {mode === "mac" && (
            <div className="dcb-seg">
              <span className="cidr-label">{t("familyLabel")}</span>
              <div className="seg" role="group" aria-label={t("familyLabel")}>
                {(["ipv4", "ipv6"] as const).map((f) => segBtn(family === f, t(`family.${f}`), () => setFamily(f), f))}
              </div>
            </div>
          )}
        </div>

        {/* Timers: the priority (with presets) and the interval. */}
        {mode === "timers" && (
          <>
            <div className="bb-fields">
              <div className="bb-field">
                <label className="cidr-label" htmlFor="vrrp-priority">{t("priorityLabel")}</label>
                {/* Up and down arrows: one a press, 1 to 255 (parsePriority's range: 0 is reserved, 255 the owner). */}
                <StepperField value={priority} onValue={setPriority} min={1} max={255} integer label={t("priorityLabel")} inputId="vrrp-priority">
                  <input id="vrrp-priority" className="cidr-input mono" value={priority} onChange={(e) => setPriority(e.target.value)} onKeyDown={stepperKeyDown({ value: priority, onValue: setPriority, min: 1, max: 255, integer: true })} placeholder="100" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={64} aria-describedby="vrrp-priority-hint" />
                </StepperField>
              </div>
              <div className="bb-field">
                <label className="cidr-label" htmlFor="vrrp-interval">{t("intervalLabel")}</label>
                {/* Up and down arrows: one unit a press in the unit typed, inside the version's range (intervalStepper). */}
                <StepperField {...intervalArrows} label={t("intervalLabel")} inputId="vrrp-interval">
                  <input id="vrrp-interval" className="cidr-input mono" value={intervalText} onChange={(e) => setIntervalText(e.target.value)} onKeyDown={stepperKeyDown(intervalArrows)} placeholder={t(`intervalPlaceholder.v${version}`)} autoComplete="off" spellCheck={false} maxLength={64} aria-describedby="vrrp-interval-hint" />
                </StepperField>
              </div>
            </div>
            <div className="tcl-presets-row" role="group" aria-label={t("presetsLabel")}>
              {PRIORITY_PRESETS.map((p) => (
                <button key={p} type="button" className="tcl-chip" aria-pressed={priority === p} onClick={() => setPriority(p)}>{t(`preset.p${p}`)}</button>
              ))}
            </div>
            <p id="vrrp-priority-hint" className="hmac-build-note">{t("priorityHint")}</p>
            <p id="vrrp-interval-hint" className="hmac-build-note">{t(`intervalHint.v${version}`)}</p>
          </>
        )}

        {/* Election: the routers, then the interval. */}
        {mode === "election" && (
          <>
            {routers.map((r, i) => (
              <div className="curlb-section" key={i}>
                <div className="dig-input-head">
                  <span className="curlb-section-title">{t("routerHeading", { n: i + 1 })}</span>
                  <div className="dig-input-actions">
                    <label className="curlb-check curlb-check--inline">
                      <input type="checkbox" checked={r.owner} onChange={(e) => setRouter(i, { owner: e.target.checked, priority: e.target.checked ? "" : r.priority })} />
                      {t("routerOwner")}
                    </label>
                    <button type="button" className="b64-copy" onClick={() => removeRouter(i)} disabled={routers.length <= MIN_ROUTERS} aria-label={t("removeRouterAria", { n: i + 1 })}>{t("removeRouter")}</button>
                  </div>
                </div>
                <div className="bb-fields">
                  <div className="bb-field">
                    <label className="cidr-label" htmlFor={`vrrp-r${i}-name`}>{t("routerName")}</label>
                    <input id={`vrrp-r${i}-name`} className="cidr-input mono" value={r.name} onChange={(e) => setRouter(i, { name: e.target.value })} placeholder={`R${i + 1}`} autoComplete="off" spellCheck={false} maxLength={64} />
                  </div>
                  <div className="bb-field">
                    <label className="cidr-label" htmlFor={`vrrp-r${i}-priority`}>{t("routerPriority")}</label>
                    {/* Up and down arrows: one a press, 1 to 255; off with the field when the router owns the address (255). Named
                        with the router's heading, so each router's arrows say which priority they move. */}
                    <StepperField value={r.owner ? "255" : r.priority} onValue={(v) => setRouter(i, { priority: v })} min={1} max={255} integer label={`${t("routerHeading", { n: i + 1 })}: ${t("routerPriority")}`} inputId={`vrrp-r${i}-priority`} disabled={r.owner}>
                      <input id={`vrrp-r${i}-priority`} className="cidr-input mono" value={r.owner ? "255" : r.priority} onChange={(e) => setRouter(i, { priority: e.target.value })} onKeyDown={stepperKeyDown({ value: r.priority, onValue: (v) => setRouter(i, { priority: v }), min: 1, max: 255, integer: true })} disabled={r.owner} placeholder="100" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={64} />
                    </StepperField>
                  </div>
                  <div className="bb-field">
                    <label className="cidr-label" htmlFor={`vrrp-r${i}-address`}>{t("routerAddress")}</label>
                    <input id={`vrrp-r${i}-address`} className="cidr-input mono" value={r.address} onChange={(e) => setRouter(i, { address: e.target.value })} placeholder={i === 0 ? "10.1.10.2" : "10.1.10.3"} autoComplete="off" spellCheck={false} maxLength={64} />
                  </div>
                </div>
              </div>
            ))}
            <div className="dig-input-actions">
              <button type="button" className="b64-copy" onClick={addRouter} disabled={routers.length >= MAX_ROUTERS}>{t("addRouter")}</button>
            </div>
            <p className="hmac-build-note">{t("routersHint")}</p>
            <div className="bb-fields">
              <div className="bb-field">
                <label className="cidr-label" htmlFor="vrrp-interval-e">{t("intervalLabel")}</label>
                {/* Up and down arrows: the same interval and the same rules as in Timers. */}
                <StepperField {...intervalArrows} label={t("intervalLabel")} inputId="vrrp-interval-e">
                  <input id="vrrp-interval-e" className="cidr-input mono" value={intervalText} onChange={(e) => setIntervalText(e.target.value)} onKeyDown={stepperKeyDown(intervalArrows)} placeholder={t(`intervalPlaceholder.v${version}`)} autoComplete="off" spellCheck={false} maxLength={64} aria-describedby="vrrp-interval-e-hint" />
                </StepperField>
              </div>
            </div>
            <p id="vrrp-interval-e-hint" className="hmac-build-note">{t(`intervalHint.v${version}`)}</p>
          </>
        )}

        {/* Virtual MAC: the VRID. */}
        {mode === "mac" && (
          <>
            <div className="bb-fields">
              <div className="bb-field">
                <label className="cidr-label" htmlFor="vrrp-vrid">{t("vridLabel")}</label>
                {/* Up and down arrows: one a press, 1 to 255 (parseVrid's range), so the MAC's last octet follows. */}
                <StepperField value={vrid} onValue={setVrid} min={1} max={255} integer label={t("vridLabel")} inputId="vrrp-vrid">
                  <input id="vrrp-vrid" className="cidr-input mono" value={vrid} onChange={(e) => setVrid(e.target.value)} onKeyDown={stepperKeyDown({ value: vrid, onValue: setVrid, min: 1, max: 255, integer: true })} placeholder="10" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={64} aria-describedby="vrrp-vrid-hint" />
                </StepperField>
              </div>
            </div>
            <p id="vrrp-vrid-hint" className="hmac-build-note">{t("vridHint")}</p>
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
      {view && view.ok && (view.data.mode === "timers" ? timersView(view.data) : view.data.mode === "election" ? electionView(view.data) : macView(view.data))}
    </div>
  );
} // VrrpTimerCalculatorTool
