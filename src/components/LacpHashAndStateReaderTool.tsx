"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/LacpHashAndStateReaderTool.tsx
// ----------------------------------------------------------------------------
// UI for the LACP member link and state reader (08/11/2026). Two modes:
//   Which link   a Linux bond's transmit hash policy, the processor's byte
//                order, how many members can transmit, and only the fields the
//                policy reads -> the member that carries the flow, the hash
//                step by step, where the flow goes when each member fails, an
//                optional spread over a run of values, Cisco's documented split
//                for that many ports, and the vendors whose hash is not
//                published (not computed);
//   State flags  the actor's state and, optionally, the partner's, as an
//                octet (0x hex, decimal, 0b binary), an SNMP BITS value,
//                Extreme's flags, Arista's letters or Huawei's PortState
//                (typed, or a whole display eth-trunk output pasted, whose
//                members the reader picks from) -> every bit with its
//                meaning, the timers, and a verdict with the findings.
// Beside the byte-order control, two or three sentences say what the two
// byte orders are, which common Linux architectures use which, and why the
// choice changes this hash, with a link to the Learn article on byte order.
// D-83 Example/Clear row: each mode's Example is verbatim from a golden vector
// (examples.ts), and the sample chips are golden vectors too. Existing class
// vocabulary only (seg-*, dcb-segs, bb-fields, cidr-*, jwt-*, tcl-*, lab-*,
// curlb-check, rdap-ask-row, hmac-build-note, ztc-empty, json-error-*,
// hpf-progress-*). All compute is local.
//
// PAGE LANGUAGE. The reading comes from runLocalisable() (every sentence an
// EngineText) and is put into the page's language by inPageLanguage(); input
// errors through engineTexts().error. Numbers and hexadecimal values are never
// inside a sentence: the page prints them from the reading's own fields.
//
// SHARE RESULTS. Under the verdict, a button builds a link that carries the
// mode and the mode's fields as typed, and in link mode only the fields the
// policy reads (src/lib/tools/lacp-hash-and-state-reader/share.ts); in link
// mode the popover adds the tool's caution line (addresses and ports), and in
// Huawei's format with an output pasted a caution of its own (system IDs and
// interfaces). An
// arriving link (useShareArrival) sets them as typing would; the fields it does
// not carry keep their values.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state, memoised readings, rich-text chunks
import { useLocale, useTranslations } from "next-intl"; // messages and the active locale
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // the up and down arrows, and their keys
import { Link } from "@/i18n/navigation"; // the locale-aware link to the Learn article
import { runLocalisable, MIN_MEMBERS, MAX_MEMBERS, MAX_SPREAD, type LacpResult, type LinkResult, type StateResult, type StateSide, type LinkPolicy, type ByteOrder, type SpreadField, type StateFormat, type HuaweiReading } from "@/lib/tools/lacp-hash-and-state-reader/compute"; // the engine, sentences with ids
import { EXAMPLE_LINK_REQUEST, EXAMPLE_STATE_REQUEST, LINK_SAMPLES, STATE_SAMPLES } from "@/lib/tools/lacp-hash-and-state-reader/examples"; // the Examples and samples, the same objects the golden vectors pin
import { engineTexts, EngineText, type EngineTextCarrier } from "@/lib/tools/engine-text"; // engine sentences in the page's language; EngineText and its carrier to relabel a refusal's field (09/11/2026)
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { LACP_SHARE, encodeLacpShare, requestOf, carriedLinkFields, readsDisplay, type LinkForm, type StateForm, type LacpShareState } from "@/lib/tools/lacp-hash-and-state-reader/share"; // this tool's share spec

/** The two modes. */
type Mode = "link" | "state"; // the page's modes

/** What the page shows: nothing yet, a reading, or a refusal in the page's language. */
type View = null | { ok: true; data: LacpResult } | { ok: false; message: string }; // the computed state

/** The policies with their short message ids (pack keys may not hold a "+"). */
const POLICY_KEYS: readonly [LinkPolicy, string][] = [["layer2", "l2"], ["layer2+3", "l23"], ["layer3+4", "l34"], ["vlan+srcmac", "vlan"]]; // the four computed

/** The fields each policy reads, as the form shows them. */
const SHOWN: Readonly<Record<LinkPolicy, readonly ("mac2" | "srcMac" | "ip" | "ports" | "vlan")[]>> = Object.freeze({
  "layer2": ["mac2", "ip"], // both MACs, and the addresses for the EtherType
  "layer2+3": ["mac2", "ip"], // both MACs and the addresses
  "layer3+4": ["ip", "ports"], // the addresses and the ports
  "vlan+srcmac": ["srcMac", "vlan"], // the source MAC and the tag
}); // by policy

/** The fields a spread may vary for each policy (the engine's rule). */
const SPREADABLE: Readonly<Record<LinkPolicy, readonly SpreadField[]>> = Object.freeze({
  "layer2": ["srcMac", "dstMac"], // the MACs
  "layer2+3": ["srcMac", "dstMac", "srcIp", "dstIp"], // MACs and addresses
  "layer3+4": ["srcPort", "dstPort", "srcIp", "dstIp"], // ports and addresses
  "vlan+srcmac": ["srcMac", "vlan"], // the source MAC and the tag
}); // by policy

/** Every field a spread may vary, as the engine names them (the keys of field.* in the pack). */
const SPREAD_FIELDS: readonly SpreadField[] = ["srcPort", "dstPort", "srcIp", "dstIp", "srcMac", "dstMac", "vlan"]; // the engine's SpreadField values

/**
 * A refusal that names a spread field (err.spreadField, err.spreadOverflow) carries the engine's field id (srcPort),
 * which is what the API reads; on the page the field is named by its label (Source port), as the form and the spread
 * heading show it (09/11/2026: the sentence showed the raw id).
 * @param e the thrown error
 * @param label a field's label in the page's language
 * @returns the error as thrown, or a carrier of the same sentence with the label in place of the id
 */
function withFieldLabel(e: unknown, label: (f: SpreadField) => string): unknown {
  const m = (e as EngineTextCarrier | null)?.engineText; // the refusal's sentence, if it carries one
  const f = m?.args?.field; // the field it names, if any
  if (!m || typeof f !== "string" || !(SPREAD_FIELDS as readonly string[]).includes(f)) return e; // nothing to relabel
  return { engineText: new EngineText(m.id, m.text, { ...m.args, field: label(f as SpreadField) }) }; // the same sentence and id, the label in place of the id
} // withFieldLabel

/** The state formats. */
const FORMATS: readonly StateFormat[] = ["octet", "snmp", "extreme", "arista", "huawei"]; // as carried, SNMP, two vendors' letters, Huawei's PortState

/** A blank link form. */
const BLANK_LINK: LinkForm = Object.freeze({ mode: "link", policy: "layer3+4", byteOrder: "little", members: "", srcMac: "", dstMac: "", srcIp: "", dstIp: "", protocol: "tcp", srcPort: "", dstPort: "", vlan: "", priority: "", spreadField: "", spreadCount: "" }) as LinkForm; // nothing typed

/** A blank state form. */
const BLANK_STATE: StateForm = Object.freeze({ mode: "state", format: "octet", actor: "", partner: "", display: "", port: "" }) as StateForm; // nothing typed or pasted

/**
 * A link request (an Example or a sample) as the form holds it.
 * @param r the request object
 * @returns the form
 */
function linkFormOf(r: { policy: string; byteOrder: string; members: string; srcMac: string; dstMac: string; srcIp: string; dstIp: string; protocol: string; srcPort: string; dstPort: string; vlan: string; priority: string; spread: { field: string; count: string } | null }): LinkForm {
  return { mode: "link", policy: r.policy as LinkPolicy, byteOrder: r.byteOrder as ByteOrder, members: r.members, srcMac: r.srcMac, dstMac: r.dstMac, srcIp: r.srcIp, dstIp: r.dstIp, protocol: r.protocol === "udp" ? "udp" : "tcp", srcPort: r.srcPort, dstPort: r.dstPort, vlan: r.vlan, priority: r.priority, spreadField: (r.spread?.field ?? "") as SpreadField | "", spreadCount: r.spread?.count ?? "" }; // field by field
} // linkFormOf

export default function LacpHashAndStateReaderTool() {
  const t = useTranslations("tools.lacp-hash-and-state-reader"); // this tool's messages
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language
  const locale = useLocale(); // the page's language, for numbers
  // ---- The form, one per mode (switching modes keeps both). ----
  const [mode, setMode] = useState<Mode>("link"); // the mode shown
  const [link, setLink] = useState<LinkForm>(() => ({ ...BLANK_LINK })); // the link form
  const [st, setSt] = useState<StateForm>(() => ({ ...BLANK_STATE })); // the state form
  /** Change some fields of the link form. */
  const setL = (patch: Partial<LinkForm>) => setLink((f) => ({ ...f, ...patch })); // immutable update
  /** Change some fields of the state form. */
  const setS = (patch: Partial<StateForm>) => setSt((f) => ({ ...f, ...patch })); // immutable update

  /** The share state of the mode shown (the same shape the engine request is built from). */
  const state: LacpShareState = mode === "link" ? link : st; // the form shown

  /** Whether the link form has anything typed (the page waits for a member count and one field). */
  const linkStarted = link.members.trim() !== "" && [link.srcMac, link.dstMac, link.srcIp, link.dstIp, link.srcPort, link.dstPort, link.vlan].some((x) => x.trim() !== ""); // something to compute

  /** The reading: nothing until the mode's fields are started, then the engine's reading or its refusal. */
  const view: View = useMemo(() => {
    if (mode === "link" && !linkStarted) return null; // nothing to compute yet
    if (mode === "state" && st.actor.trim() === "" && !readsDisplay(st)) return null; // no actor yet, and no output pasted
    try {
      return { ok: true, data: inPageLanguage(runLocalisable(requestOf(state)), tx) as LacpResult }; // the reading, in the page's language
    } catch (e) {
      return { ok: false, message: tx.error(withFieldLabel(e, (f) => t(`field.${f}`))) }; // the refusal's sentence in the page's language, a spread field named by its label
    } // computed
  }, [mode, linkStarted, st, state, tx, t]); // recomputed on any field (and with the labels' language)

  // An arriving share link: the mode and the mode's fields are set as typing would set them; the rest keep their values.
  useShareArrival(LACP_SHARE, (s) => {
    setMode(s.mode); // the mode
    if (s.mode === "state") { setSt({ ...s }); return; } // every state field travels
    const carried = carriedLinkFields(s.policy); // the link names this policy carries
    const keep = (name: string, arrived: string, current: string): string => (carried.includes(name) ? arrived : current); // carried, or kept
    setLink((f) => ({
      ...f, mode: "link", policy: s.policy, byteOrder: s.byteOrder, members: s.members, spreadField: s.spreadField, spreadCount: s.spreadCount, // always carried
      srcMac: keep("srcmac", s.srcMac, f.srcMac), dstMac: keep("dstmac", s.dstMac, f.dstMac), srcIp: keep("srcip", s.srcIp, f.srcIp), dstIp: keep("dstip", s.dstIp, f.dstIp), // addresses
      protocol: carried.includes("protocol") ? s.protocol : f.protocol, srcPort: keep("srcport", s.srcPort, f.srcPort), dstPort: keep("dstport", s.dstPort, f.dstPort), // ports
      vlan: keep("vlan", s.vlan, f.vlan), priority: keep("priority", s.priority, f.priority), // the tag
    })); // the link form
  });
  // What Share results carries: the mode's fields, once the page has a reading (memoised).
  const share = useMemo(() => encodeLacpShare(state, !!view?.ok), [state, view]); // the encoding

  /** Fill the mode shown with its Example (verbatim from the golden vectors). */
  const loadExample = () => {
    if (mode === "link") setLink(linkFormOf(EXAMPLE_LINK_REQUEST)); // the course lab's two members
    else setSt({ mode: "state", format: EXAMPLE_STATE_REQUEST.format, actor: EXAMPLE_STATE_REQUEST.actor, partner: EXAMPLE_STATE_REQUEST.partner, display: "", port: "" }); // 0x3F on both ends
  }; // loadExample
  /** Empty the mode shown. */
  const clearAll = () => {
    if (mode === "link") setLink({ ...BLANK_LINK, policy: link.policy, byteOrder: link.byteOrder }); // the policy and the byte order stay
    else setSt({ ...BLANK_STATE, format: st.format }); // the format stays
  }; // clearAll

  // ---- Numbers in the page's language. ----
  /** A whole number with the page's grouping. */
  const int = (n: number): string => new Intl.NumberFormat(locale).format(n); // grouped
  /** A percentage with at most one decimal, in the page's format. */
  const pct = (part: number, whole: number): string => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(whole === 0 ? 0 : part / whole); // e.g. 37.5 %

  /** One label and value row. */
  const row = (label: ReactNode, value: ReactNode, key: string, mono = true) => (
    <div className="jwt-claim-row" key={key}>
      <span className="jwt-claim-label">{label}</span>
      <span className={`jwt-claim-value${mono ? " mono" : ""}`}>{value}</span>
    </div>
  ); // row

  /** The notes panel, with the Learn article. */
  const notesPanel = (notes: string[]) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
        <li>{t.rich("learn", { a: (chunks: ReactNode) => <Link href="/learn/link-aggregation-and-lacp" className="tool-sources-link">{chunks}</Link> })}</li>
      </ul>
    </section>
  ); // notesPanel

  /** The share row (under the verdict); a caution line only where addresses and ports, or a pasted output, travel. */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} details={mode === "link" ? [t("share.caution")] : readsDisplay(st) ? [t("share.cautionDisplay")] : []} title={t("name")} />
    </div>
  ); // shareRow

  /** A seg button. */
  const segBtn = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" className={`seg-btn${active ? " seg-btn--active" : ""}`} aria-pressed={active} onClick={onClick}>{label}</button>
  ); // segBtn

  /** A spread field's label. */
  const fieldLabel = (f: SpreadField): string => t(`field.${f}`); // e.g. Source port

  /** The link reading. */
  const linkView = (r: LinkResult) => {
    const pk = POLICY_KEYS.find(([p]) => p === r.policy)?.[1] ?? "l2"; // the policy's message id
    return (
      <div className="jwt-results">
        <div className="tcl-verdict tcl-verdict-ok" role="status">
          <p>{t.rich("link.headline", { member: String(r.member), n: String(r.members), m: (c: ReactNode) => <strong className="mono">{c}</strong> })}</p>
          <p className="hmac-build-note mono">{t("link.hashLine", { hash: r.hash, decimal: int(Number(r.hashDecimal)), n: String(r.members), member: String(r.member) })}</p>
        </div>
        {shareRow}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("steps.heading", { policy: t(`policy.${pk}`), order: t(`order.${r.byteOrder}`) })}</h4>
          <div className="jwt-claims">
            {r.steps.map((s, i) => row(t(`step.${s.id}`), s.value, `s${i}`))}
            {row(t("step.modulo", { n: String(r.members) }), String(r.member), "mod")}
          </div>
          <p className="hmac-build-note">{t("steps.formulaLead")}</p>
          <ul className="hmac-build-note">{r.formula.map((f, i) => <li key={i}><code>{f}</code></li>)}</ul>
          {r.etherType && <p className="hmac-build-note">{t("steps.etherType", { type: r.etherType })}</p>}
        </section>
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("down.heading")}</h4>
          <div className="jwt-claims">
            {r.ifDown.map((m, k) => row(t("down.row", { k: String(k) }), k === r.member ? t("down.own", { m: String(m) }) : m === r.member ? t("down.stays", { m: String(m) }) : t("down.moves", { m: String(m) }), `d${k}`, false))}
          </div>
        </section>
        {r.spread && (
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("spread.heading", { count: int(r.spread.count), field: fieldLabel(r.spread.field) })}</h4>
            <p className="hmac-build-note mono">{t("spread.range", { from: r.spread.from, to: r.spread.to })}</p>
            <div className="jwt-claims">
              {r.spread.counts.map((c, m) => row(t("spread.member", { m: String(m) }), (
                <>
                  {t("spread.count", { c: int(c), pct: pct(c, r.spread!.count) })}
                  <span className="hpf-progress-bar" aria-hidden="true" style={{ display: "block" }}><span className="hpf-progress-fill" style={{ display: "block", width: `${r.spread!.max === 0 ? 0 : (100 * c) / r.spread!.max}%` }} /></span>
                </>
              ), `c${m}`, false))}
            </div>
            <p className="hmac-build-note">{r.spread.even ? t("spread.even") : t("spread.uneven", { max: int(r.spread.max), min: int(r.spread.min) })}</p>
            <p className="hmac-build-note">{t("spread.first", { list: r.spread.first.join(" ") })}</p>
          </section>
        )}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("cisco.heading", { n: String(r.members) })}</h4>
          <div className="jwt-claims">
            {r.ciscoValues.map((v, k) => row(t("cisco.port", { k: String(k + 1) }), t("cisco.values", { v: String(v), pct: pct(v, 8) }), `k${k}`, false))}
          </div>
          <p className="hmac-build-note">{r.ciscoEven ? t("cisco.even") : t("cisco.uneven")}</p>
        </section>
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("vendors.heading")}</h4>
          <ul>
            {(["cisco", "juniper", "arista", "aruba", "extreme"] as const).map((v) => <li key={v}>{t(`vendors.${v}`)}</li>)}
            {/* Huawei: what its command reference documents, and the command it names for the hash factors. */}
            <li>{t.rich("vendors.huawei", { c: (chunks: ReactNode) => <code>{chunks}</code> })}</li>
            <li>{t("vendors.mikrotik")}</li>
          </ul>
        </section>
        {notesPanel(r.notes)}
      </div>
    );
  }; // linkView

  /** One side of the state reading; in Huawei's format each bit also names its PortState position, left to right. */
  const sidePanel = (heading: string, sd: StateSide, huaweiOrder: boolean) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{heading}</h4>
      <p className="hmac-build-note mono">{t("state.forms", { hex: sd.hex, dec: sd.decimal, bin: sd.binary, snmp: sd.snmp, ext: sd.extreme, hw: sd.huawei })}</p>
      {/* Huawei prints the bits the other way round from the octet's usual binary form: said once, with this value. */}
      {huaweiOrder && <p className="hmac-build-note">{t("state.huaweiOrder", { ps: sd.huawei, bin: sd.binary, hex: sd.hex })}</p>}
      <div className="jwt-claims">
        {sd.bits.map((b) => row(<><span className="mono">{huaweiOrder ? t("state.bitLabelHuawei", { pos: String(b.bit + 1), bit: String(b.bit), mask: b.mask }) : t("state.bitLabel", { bit: String(b.bit), mask: b.mask })}</span> {b.name}</>, <><strong className="mono">{b.set ? "1" : "0"}</strong> {b.text}</>, `b${b.bit}`, false))}
      </div>
    </section>
  ); // sidePanel

  /** A pasted display eth-trunk output: its header fields, every member with its Status, and the chooser of the member read in detail. */
  const huaweiPanel = (h: HuaweiReading) => {
    const statuses = [...new Map(h.members.map((m) => [m.status, m.statusText])).values()]; // each Status word present, defined once
    return (
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("huawei.heading")}</h4>
        <div className="jwt-claims">
          {h.trunk !== null && row(t("huawei.trunk"), h.trunk, "ht")}
          {h.lagId !== null && row(t("huawei.lagId"), h.lagId, "hl")}
          {h.workingMode !== null && row(t("huawei.workingMode"), h.workingMode, "hw")}
          {h.hashArithmetic !== null && row(t("huawei.hashArithmetic"), h.hashArithmetic, "hh")}
          {h.systemPriority !== null && row(t("huawei.systemPriority"), h.systemPriority, "hp")}
          {h.systemId !== null && row(t("huawei.systemId"), h.systemId, "hs")}
          {h.members.map((m) => row(m.port, m.partner === null ? t("huawei.memberAlone", { status: m.status, ps: m.portState, hex: m.hex, verdict: t(`huawei.verdict.${m.verdict}`) }) : t("huawei.member", { status: m.status, ps: m.portState, hex: m.hex, pps: m.partner.portState, phex: m.partner.hex, verdict: t(`huawei.verdict.${m.verdict}`) }), `hm-${m.port}`))}
        </div>
        {h.hashArithmetic !== null && <p className="hmac-build-note">{t("huawei.hashNote")}</p>}
        <ul className="hmac-build-note">{statuses.map((x, i) => <li key={i}>{x}</li>)}</ul>
        {/* The member read in detail below: one chip per member row, wrapping on a phone. */}
        {h.members.length > 1 && (
          <>
            <span className="cidr-label">{t("huawei.chooser")}</span>
            <div className="tcl-presets-row" role="group" aria-label={t("huawei.chooser")}>
              {h.members.map((m) => <button key={m.port} type="button" className="tcl-chip" aria-pressed={h.port === m.port} onClick={() => setS({ port: m.port })}>{m.port}</button>)}
            </div>
          </>
        )}
      </section>
    );
  }; // huaweiPanel

  /** The state reading. */
  const stateView = (r: StateResult) => {
    const warn = r.findings.filter((f) => f.level === "warn"); // what stops the bundle
    const info = r.findings.filter((f) => f.level === "info"); // what is worth knowing
    const tm = r.timers; // the timers
    return (
      <div className="jwt-results">
        <div className={`tcl-verdict ${r.status === "not-bundled" ? "tcl-verdict-bad" : "tcl-verdict-ok"}`} role="status">
          {/* From a pasted output: which member the verdict is about. */}
          {r.huawei && <p className="hmac-build-note mono">{t("huawei.reading", { port: r.huawei.port, status: r.huawei.members.find((m) => m.port === r.huawei!.port)?.status ?? "" })}</p>}
          <p>{r.verdictText}</p>
        </div>
        {warn.length > 0 && (
          <div className="tcl-verdict tcl-verdict-warn" role="status">
            <ul>{warn.map((f) => <li key={f.id}>{f.text}</li>)}</ul>
          </div>
        )}
        {info.length > 0 && (
          <div className="tcl-verdict" role="status">
            <ul>{info.map((f) => <li key={f.id}>{f.text}</li>)}</ul>
          </div>
        )}
        {shareRow}
        {r.huawei && huaweiPanel(r.huawei)}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("timers.heading")}</h4>
          <div className="jwt-claims">
            {row(t("timers.actorSends"), tm.periodic === false ? t("timers.none") : tm.actorSends === null ? t("timers.needsPartner") : t("timers.every", { s: String(tm.actorSends) }), "as", false)}
            {row(t("timers.actorTimeout"), t("timers.after", { s: String(tm.actorTimeout) }), "at", false)}
            {tm.partnerTimeout !== null && row(t("timers.partnerSends"), tm.periodic === false ? t("timers.none") : t("timers.every", { s: String(tm.partnerSends) }), "ps", false)}
            {tm.partnerTimeout !== null && row(t("timers.partnerTimeout"), t("timers.after", { s: String(tm.partnerTimeout) }), "pt", false)}
          </div>
        </section>
        {sidePanel(t("state.actorHeading"), r.actor, r.format === "huawei")}
        {r.partner && sidePanel(t("state.partnerHeading"), r.partner, r.format === "huawei")}
        {notesPanel(r.notes)}
      </div>
    );
  }; // stateView

  /** The link form's fields for the chosen policy. */
  const shown = SHOWN[link.policy]; // which groups of fields
  /** The member count's arrows. */
  const membersArrows = { value: link.members === "" ? String(MIN_MEMBERS) : link.members, onValue: (v: string) => setL({ members: v }), min: MIN_MEMBERS, max: MAX_MEMBERS, integer: true }; // 2 to 8
  /** The spread count's arrows. */
  const countArrows = { value: link.spreadCount === "" ? "1" : link.spreadCount, onValue: (v: string) => setL({ spreadCount: v }), min: 1, max: MAX_SPREAD, integer: true }; // 1 to 4096

  /** A text field of the link form. */
  const textField = (id: string, label: string, value: string, onChange: (v: string) => void, placeholder: string) => (
    <div className="bb-field" key={id}>
      <label className="cidr-label" htmlFor={`lacp-${id}`}>{label}</label>
      <input id={`lacp-${id}`} className="cidr-input mono" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} maxLength={64} />
    </div>
  ); // textField

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode switch. */}
      <div className="seg-group" role="group" aria-label={t("modeLabel")}>
        <div className="seg">
          {(["link", "state"] as const).map((m) => segBtn(mode === m, t(`mode.${m}`), () => setMode(m), m))}
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

        {mode === "link" && (
          <>
            {/* The policy and the byte order (one column on a phone). */}
            <div className="dcb-segs">
              <div className="dcb-seg">
                <span className="cidr-label">{t("policyLabel")}</span>
                {/* Four policies as pressed chips: the row wraps on a phone, where four segment buttons would be clipped. */}
                <div className="tcl-presets-row" role="group" aria-label={t("policyLabel")}>
                  {POLICY_KEYS.map(([p, k]) => <button key={k} type="button" className="tcl-chip" aria-pressed={link.policy === p} onClick={() => setL({ policy: p, spreadField: link.spreadField !== "" && !SPREADABLE[p].includes(link.spreadField) ? "" : link.spreadField })}>{t(`policy.${k}`)}</button>)}
                </div>
                {/* What the chosen policy reads, right under the choice. */}
                <p className="hmac-build-note">{t(`policyHint.${POLICY_KEYS.find(([p]) => p === link.policy)?.[1] ?? "l2"}`)}</p>
              </div>
              {(link.policy === "layer2+3" || link.policy === "layer3+4") && (
                <div className="dcb-seg">
                  <span className="cidr-label">{t("orderLabel")}</span>
                  <div className="seg" role="group" aria-label={t("orderLabel")}>
                    {(["little", "big"] as const).map((o) => segBtn(link.byteOrder === o, t(`order.${o}`), () => setL({ byteOrder: o }), o))}
                  </div>
                  {/* What the two byte orders are, which Linux architectures use which, and why the choice changes this hash. */}
                  <p className="hmac-build-note">{t.rich("orderExplain", { a: (chunks: ReactNode) => <Link href="/learn/big-endian-and-little-endian" className="tool-sources-link">{chunks}</Link> })}</p>
                </div>
              )}
            </div>
            {/* The member count. */}
            <div className="bb-fields">
              <div className="bb-field">
                <label className="cidr-label" htmlFor="lacp-members">{t("membersLabel")}</label>
                {/* Up and down arrows: one a press, 2 to 8 (the engine's bounds). */}
                <StepperField {...membersArrows} label={t("membersLabel")} inputId="lacp-members">
                  <input id="lacp-members" className="cidr-input mono" value={link.members} onChange={(e) => setL({ members: e.target.value })} onKeyDown={stepperKeyDown(membersArrows)} placeholder="2" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={64} aria-describedby="lacp-members-hint" />
                </StepperField>
              </div>
            </div>
            <p id="lacp-members-hint" className="hmac-build-note">{t("membersHint")}</p>

            {/* Only the fields the policy reads. */}
            {shown.includes("mac2") && (
              <div className="bb-fields">
                {textField("smac", t("srcMacLabel"), link.srcMac, (v) => setL({ srcMac: v }), "00:00:5e:00:53:0a")}
                {textField("dmac", t("dstMacLabel"), link.dstMac, (v) => setL({ dstMac: v }), "00:00:5e:00:53:01")}
              </div>
            )}
            {shown.includes("srcMac") && (
              <div className="bb-fields">
                {textField("smac", t("srcMacLabel"), link.srcMac, (v) => setL({ srcMac: v }), "00:00:5e:00:53:0a")}
              </div>
            )}
            {shown.includes("ip") && (
              <div className="bb-fields">
                {textField("sip", t("srcIpLabel"), link.srcIp, (v) => setL({ srcIp: v }), "192.0.2.10")}
                {textField("dip", t("dstIpLabel"), link.dstIp, (v) => setL({ dstIp: v }), "198.51.100.20")}
              </div>
            )}
            {shown.includes("ports") && (
              <>
                <div className="dcb-segs">
                  <div className="dcb-seg">
                    <span className="cidr-label">{t("protocolLabel")}</span>
                    <div className="seg" role="group" aria-label={t("protocolLabel")}>
                      {(["tcp", "udp"] as const).map((p) => segBtn(link.protocol === p, t(`protocol.${p}`), () => setL({ protocol: p }), p))}
                    </div>
                  </div>
                </div>
                <div className="bb-fields">
                  {textField("sport", t("srcPortLabel"), link.srcPort, (v) => setL({ srcPort: v }), "50001")}
                  {textField("dport", t("dstPortLabel"), link.dstPort, (v) => setL({ dstPort: v }), "873")}
                </div>
              </>
            )}
            {shown.includes("vlan") && (
              <div className="bb-fields">
                {textField("vlan", t("vlanLabel"), link.vlan, (v) => setL({ vlan: v }), t("vlanPlaceholder"))}
                {textField("pcp", t("priorityLabel"), link.priority, (v) => setL({ priority: v }), "0")}
              </div>
            )}

            {/* The spread: one field varied upward from its value. */}
            <label className="curlb-check">
              <input type="checkbox" checked={link.spreadField !== ""} onChange={(e) => setL(e.target.checked ? { spreadField: SPREADABLE[link.policy][0], spreadCount: link.spreadCount === "" ? "256" : link.spreadCount } : { spreadField: "", spreadCount: "" })} />
              {t("spreadToggle")}
            </label>
            {link.spreadField !== "" && (
              <>
                <div className="dcb-segs">
                  <div className="dcb-seg">
                    <span className="cidr-label">{t("spreadFieldLabel")}</span>
                    {/* Up to four fields as pressed chips, wrapping on a phone like the policies. */}
                    <div className="tcl-presets-row" role="group" aria-label={t("spreadFieldLabel")}>
                      {SPREADABLE[link.policy].map((f) => <button key={f} type="button" className="tcl-chip" aria-pressed={link.spreadField === f} onClick={() => setL({ spreadField: f })}>{fieldLabel(f)}</button>)}
                    </div>
                  </div>
                </div>
                <div className="bb-fields">
                  <div className="bb-field">
                    <label className="cidr-label" htmlFor="lacp-count">{t("spreadCountLabel")}</label>
                    {/* Up and down arrows: one a press, 1 to 4096 (the engine's bound). */}
                    <StepperField {...countArrows} label={t("spreadCountLabel")} inputId="lacp-count">
                      <input id="lacp-count" className="cidr-input mono" value={link.spreadCount} onChange={(e) => setL({ spreadCount: e.target.value })} onKeyDown={stepperKeyDown(countArrows)} placeholder="256" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={64} />
                    </StepperField>
                  </div>
                </div>
                <p className="hmac-build-note">{t("spreadHint")}</p>
              </>
            )}

            <div className="tcl-presets-row" role="group" aria-label={t("samplesLabel")}>
              {LINK_SAMPLES.map((x) => <button key={x.id} type="button" className="tcl-chip" onClick={() => setLink(linkFormOf(x.request))}>{t(`sample.${x.id}`)}</button>)}
            </div>
          </>
        )}

        {mode === "state" && (
          <>
            <div className="dcb-segs">
              <div className="dcb-seg">
                <span className="cidr-label">{t("formatLabel")}</span>
                {/* Four formats as pressed chips: four segment buttons squeeze to several lines each on a phone. */}
                <div className="tcl-presets-row" role="group" aria-label={t("formatLabel")}>
                  {FORMATS.map((f) => <button key={f} type="button" className="tcl-chip" aria-pressed={st.format === f} onClick={() => setS({ format: f })}>{t(`format.${f}`)}</button>)}
                </div>
              </div>
            </div>
            <p className="hmac-build-note">{t(`formatHint.${st.format}`)}</p>
            {/* Huawei's format: the whole display eth-trunk output may be pasted instead of typing the PortState values. */}
            {st.format === "huawei" && (
              <div className="bb-field">
                <label className="cidr-label" htmlFor="lacp-display">{t("displayLabel")}</label>
                <textarea id="lacp-display" className="cidr-input mono json-input" value={st.display} onChange={(e) => setS({ display: e.target.value, port: "" })} placeholder={t("displayPlaceholder")} rows={6} wrap="off" autoComplete="off" spellCheck={false} aria-describedby="lacp-display-hint" />
                <p id="lacp-display-hint" className="hmac-build-note">{readsDisplay(st) ? t("displayReading") : t("displayHint")}</p>
              </div>
            )}
            {/* The typed values, unless a pasted output is being read. */}
            {!readsDisplay(st) && (
              <>
                <div className="bb-fields">
                  <div className="bb-field">
                    <label className="cidr-label" htmlFor="lacp-actor">{t("actorLabel")}</label>
                    <input id="lacp-actor" className="cidr-input mono" value={st.actor} onChange={(e) => setS({ actor: e.target.value })} placeholder={t(`placeholder.${st.format}`)} autoComplete="off" spellCheck={false} maxLength={64} />
                  </div>
                  <div className="bb-field">
                    <label className="cidr-label" htmlFor="lacp-partner">{t("partnerLabel")}</label>
                    <input id="lacp-partner" className="cidr-input mono" value={st.partner} onChange={(e) => setS({ partner: e.target.value })} placeholder={t(`placeholder.${st.format}`)} autoComplete="off" spellCheck={false} maxLength={64} aria-describedby="lacp-partner-hint" />
                  </div>
                </div>
                <p id="lacp-partner-hint" className="hmac-build-note">{t("partnerHint")}</p>
              </>
            )}
            <div className="tcl-presets-row" role="group" aria-label={t("samplesLabel")}>
              {STATE_SAMPLES.map((x) => <button key={x.id} type="button" className="tcl-chip" onClick={() => setSt({ mode: "state", format: x.request.format as StateFormat, actor: x.request.actor, partner: x.request.partner, display: "display" in x.request ? x.request.display : "", port: "port" in x.request ? x.request.port : "" })}>{t(`sample.${x.id}`)}</button>)}
            </div>
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
      {view && view.ok && (view.data.mode === "link" ? linkView(view.data) : stateView(view.data))}
    </div>
  );
} // LacpHashAndStateReaderTool
