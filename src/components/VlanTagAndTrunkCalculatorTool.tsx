"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/VlanTagAndTrunkCalculatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the 802.1Q tag decoder and trunk VLAN calculator (08/11/2026). Two
// modes on one form:
//   802.1Q tag   hexadecimal octets (a tag, or a frame's start) -> the MAC
//                addresses, each tag's TPID, PCP, DEI and VID with its 32 bits
//                drawn octet by octet as the standard draws the tag, the PCP's
//                traffic type and its four decodings, and the EtherType or
//                length that follows, named from IANA's list;
//   Trunk VLANs  the trunk port lines of two ends, each in its vendor's syntax
//                -> what each end carries and sends untagged, and VLAN by VLAN
//                and both ways whether a frame arrives in the same VLAN,
//                another one, is dropped, or depends on a behaviour the vendor
//                pages read do not state. Eight vendors since 2026-11-08b
//                (Arista EOS and Huawei VRP added), the course's eight.
// D-83 Example/Clear row: each mode's Example is verbatim from a golden vector
// (examples.ts: the VLAN lab of the course's chapter 2.3 and RFC 9542's
// documentation MAC addresses), and so is every chip. Existing class
// vocabulary only (seg-*, dcb-segs, cidr-*, cidr-bits-*, jwt-*, tcl-*,
// lab-table, curlb-*, rdap-ask-row, hmac-build-note, ztc-empty, json-*). All
// compute is local.
//
// PAGE LANGUAGE. The reading comes from runLocalisable() (every sentence an
// EngineText) and is put into the page's language by inPageLanguage(); input
// errors through engineTexts().error. Numbers, VLAN lists, vendor names,
// IANA's descriptions and configuration lines are printed as they are.
//
// SHARE RESULTS. Under the verdict, a button builds a link that carries the
// octets (tag mode) or both ends' vendor and lines (trunk mode), as typed
// (src/lib/tools/vlan-tag-and-trunk-calculator/share.ts), with the mode's
// caution line. An arriving link (useShareArrival) sets them as typing would;
// the other mode keeps its values.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state, memoised readings, rich-text chunks
import { useTranslations } from "next-intl"; // messages
import { Link } from "@/i18n/navigation"; // the locale-aware links to the Learn articles and the mapper
import { runLocalisable, VENDORS, VENDOR_NAMES, MAX_TEXT, type VlanResult, type TagResult, type TrunkResult, type TagReading, type MacReading, type Direction, type EndReading, type VendorId, type TagStart } from "@/lib/tools/vlan-tag-and-trunk-calculator/compute"; // the engine, sentences with ids
import { EXAMPLE_TAG_REQUEST, TAG_CHIPS, EXAMPLE_TRUNK_REQUEST, TRUNK_CHIPS } from "@/lib/tools/vlan-tag-and-trunk-calculator/examples"; // the Examples and chips, the same objects the golden vectors pin
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { VLAN_SHARE, encodeVlanShare, requestOf, type VlanShareState } from "@/lib/tools/vlan-tag-and-trunk-calculator/share"; // this tool's share spec

/** The two modes. */
type Mode = "tag" | "trunk"; // the page's modes

/** What the page shows: nothing yet, a reading, or a refusal in the page's language. */
type View = null | { ok: true; data: VlanResult } | { ok: false; message: string }; // the computed state

/** One line each vendor writes, as the textarea's placeholder (configuration syntax: never translated). */
const PLACEHOLDER: Readonly<Record<VendorId, string>> = Object.freeze({
  "cisco-ios-xe": "switchport trunk allowed vlan 10,20,99\nswitchport trunk native vlan 999\nswitchport trunk allowed vlan add 999", // Cisco, as the corrected deck writes it (999 in the list)
  "juniper-junos": "set interfaces ge-0/0/23 unit 0 family ethernet-switching vlan members [ 10 20 99 999 ]\nset interfaces ge-0/0/23 native-vlan-id 999", // Junos
  "aruba-aos-cx": "vlan trunk native 999\nvlan trunk allowed 10,20,99,999", // AOS-CX
  "mikrotik-routeros": "/interface bridge vlan add bridge=bridge1 tagged=ether24 vlan-ids=10,20,99\n/interface bridge port set [find interface=ether24] pvid=999", // RouterOS
  "extreme-switch-engine": "create vlan USERS tag 10\nconfigure vlan USERS add ports 24 tagged", // Switch Engine
  "extreme-fabric-engine": "vlan members add 10 1/24\ndefault-vlan-id 999\nuntag-port-default-vlan enable", // Fabric Engine
  "arista-eos": "switchport mode trunk\nswitchport trunk allowed vlan 10,20,99\nswitchport trunk native vlan 999\nswitchport trunk allowed vlan add 999", // Arista EOS, the corrected deck's lines
  "huawei-vrp": "port link-type trunk\nport trunk allow-pass vlan 10 20 99\nport trunk pvid vlan 999\nport trunk allow-pass vlan 999\nundo port trunk allow-pass vlan 1", // Huawei VRP, the corrected deck's lines
}); // placeholders

/** How many fate rows show before "Show all". */
const ROWS_FOLDED = 24; // enough for most trunks

/** The 802.1Q tag decoder and trunk VLAN calculator. */
export default function VlanTagAndTrunkCalculatorTool() {
  const t = useTranslations("tools.vlan-tag-and-trunk-calculator"); // this tool's messages
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language
  // ---- The form. ----
  const [mode, setMode] = useState<Mode>("tag"); // the mode shown
  const [hex, setHex] = useState(""); // tag: the octets
  const [start, setStart] = useState<TagStart>("auto"); // tag: where they start
  const [avendor, setAvendor] = useState<VendorId>("cisco-ios-xe"); // trunk: end A's vendor
  const [aconfig, setAconfig] = useState(""); // trunk: end A's lines
  const [bvendor, setBvendor] = useState<VendorId>("juniper-junos"); // trunk: end B's vendor
  const [bconfig, setBconfig] = useState(""); // trunk: end B's lines
  const [allRows, setAllRows] = useState(false); // trunk: every fate row shown

  /** The share state of the mode shown (the same shape the engine request is built from). */
  const state: VlanShareState = useMemo(() => (mode === "tag"
    ? { mode, input: hex, start } // the octets
    : { mode, avendor, aconfig, bvendor, bconfig }), // the two ends
  [mode, hex, start, avendor, aconfig, bvendor, bconfig]); // the fields

  /** The reading: nothing until the mode's fields are started, then the engine's reading or its refusal. */
  const view: View = useMemo(() => {
    if (mode === "tag" && hex.trim() === "") return null; // nothing typed
    if (mode === "trunk" && aconfig.trim() === "" && bconfig.trim() === "") return null; // neither end typed
    try {
      return { ok: true, data: inPageLanguage(runLocalisable(requestOf(state)), tx) as VlanResult }; // the reading, in the page's language
    } catch (e) {
      return { ok: false, message: tx.error(e) }; // the refusal's sentence in the page's language
    } // computed
  }, [mode, hex, aconfig, bconfig, state, tx]); // recomputed on any field

  // An arriving share link: the mode and its fields are set as typing would set them.
  useShareArrival(VLAN_SHARE, (s) => {
    setMode(s.mode); // the mode
    if (s.mode === "tag") { setHex(s.input); setStart(s.start); } // the octets
    else { setAvendor(s.avendor); setAconfig(s.aconfig); setBvendor(s.bvendor); setBconfig(s.bconfig); setAllRows(false); } // the ends
  });
  // What Share results carries: the mode's fields, once the page has a reading (memoised).
  const share = useMemo(() => encodeVlanShare(state, !!view?.ok), [state, view]); // the encoding

  /** Fill the mode shown with its Example (verbatim from the golden vectors). */
  const loadExample = () => {
    if (mode === "tag") { setHex(EXAMPLE_TAG_REQUEST.input); setStart(EXAMPLE_TAG_REQUEST.start); } // the tag Example
    else { setAvendor(EXAMPLE_TRUNK_REQUEST.a.vendor); setAconfig(EXAMPLE_TRUNK_REQUEST.a.config); setBvendor(EXAMPLE_TRUNK_REQUEST.b.vendor); setBconfig(EXAMPLE_TRUNK_REQUEST.b.config); setAllRows(false); } // the trunk Example
  }; // loadExample
  /** Empty the mode shown (the vendors stay). */
  const clearAll = () => {
    if (mode === "tag") { setHex(""); setStart("auto"); } // the octets
    else { setAconfig(""); setBconfig(""); setAllRows(false); } // the lines
  }; // clearAll

  /** A VLAN list that may break after each comma on a narrow screen. */
  const vlanList = (text: string): ReactNode => (text === "none" ? t("none") : <span className="mono">{text.split(",").map((part, i, all) => (
    <span key={i}>{part}{i < all.length - 1 ? <>,<wbr /></> : null}</span>
  ))}</span>); // vlanList

  /** One label and value row. */
  const row = (label: ReactNode, value: ReactNode, key: string, mono = true) => (
    <div className="jwt-claim-row" key={key}>
      <span className="jwt-claim-label">{label}</span>
      <span className={mono ? "jwt-claim-value mono" : "jwt-claim-value"}>{value}</span>
    </div>
  ); // row

  /** The notes panel, with the Learn articles. */
  const notesPanel = (notes: string[]) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
        <li>{t.rich("learn", { a: (chunks: ReactNode) => <Link href="/learn/vlans-and-8021q-trunking" className="tool-sources-link">{chunks}</Link>, b: (chunks: ReactNode) => <Link href="/learn/the-ethernet-frame-field-by-field" className="tool-sources-link">{chunks}</Link> })}</li>
      </ul>
    </section>
  ); // notesPanel

  /** Warnings, when there are any. */
  const warningsBox = (ws: string[]) => (ws.length > 0 ? (
    <div className="tcl-verdict tcl-verdict-warn" role="status">
      <ul>{ws.map((w, i) => <li key={i}>{w}</li>)}</ul>
    </div>
  ) : null); // warningsBox

  /** The share row (under the verdict), with the mode's caution line. */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} details={[mode === "tag" ? t("share.cautionTag") : t("share.caution")]} title={t("name")} />
    </div>
  ); // shareRow

  /** A tag's 32 bits, octet by octet: the TPID's two octets grey, the TCI's accent, field ends marked. */
  const tagBits = (g: TagReading) => (
    <div className="cidr-bits">
      <div className="cidr-bits-head">
        <span className="cidr-bits-title">{t("bits.title")}</span>
        <span className="cidr-bits-caption">
          <span className="cidr-bits-legend cidr-bits-legend--host">{t("bits.tpid")}</span>
          <span className="cidr-bits-legend cidr-bits-legend--net">{t("bits.tci")}</span>
        </span>
      </div>
      <div className="cidr-bits-grid">
        {[0, 1, 2, 3].map((o) => (
          <div className="cidr-bits-cells" key={o}>
            {g.bits.slice(o * 8, o * 8 + 8).split("").map((b, i) => {
              const at = o * 8 + i; // the bit's position, from 0
              const tci = at >= 16; // in the TCI
              const end = at === 18 || at === 19; // the last bit of PCP, the DEI bit
              return <span key={i} className={`cidr-bit ${tci ? "cidr-bit--net" : "cidr-bit--host"}${b === "1" ? " cidr-bit--on" : ""}${end ? " cidr-bit--boundary" : ""}`}>{b}</span>; // one bit
            })}
          </div>
        ))}
      </div>
      <p className="cidr-bits-note">{t("bits.note", { pcp: g.pcpBits, dei: String(g.dei), vid: g.vidBits })}</p>
    </div>
  ); // tagBits

  /** One tag's panel. */
  const tagPanel = (g: TagReading) => (
    <section className="jwt-panel" key={g.index}>
      <h4 className="jwt-panel-title">{t("tag.heading", { i: g.index, kind: t(`kind.${g.kind}`), offset: g.offset })}</h4>
      {tagBits(g)}
      <div className="jwt-claims">
        {row(t("field.tpid"), <><span className="mono">{g.tpid}</span><br /><span className="hmac-build-note">{g.name}</span></>, "tpid", false)}
        {row(t("field.pcp"), <><span className="mono">{t("pcp.value", { pcp: g.pcp, bits: g.pcpBits, acronym: g.acronym })}</span><br /><span className="hmac-build-note">{g.trafficType}</span></>, "pcp", false)}
        {row(t("field.dei"), <><span className="mono">{String(g.dei)}</span><br /><span className="hmac-build-note">{t(`dei.${g.dei}`)}</span></>, "dei", false)}
        {row(t("field.vid"), <><span className="mono">{t("vid.value", { vid: g.vid, hex: g.vidHex })}</span><br /><span className="hmac-build-note">{t(`vid.${g.vidMeaning}`)}</span></>, "vid", false)}
      </div>
      <div className="lab-table-wrap">
        <table className="lab-table">
          <caption className="hmac-build-note">{t("decodings.caption", { pcp: g.pcp })}</caption>
          <thead>
            <tr>
              <th scope="col">{t("decodings.scheme")}</th>
              <th scope="col">{t("decodings.priority")}</th>
              <th scope="col">{t("decodings.drop")}</th>
            </tr>
          </thead>
          <tbody>
            {g.decodings.map((d) => (
              <tr key={d.scheme}>
                <th scope="row" className="mono">{d.scheme}</th>
                <td className="mono">{d.priority}</td>
                <td>{d.dropEligible ? t("yes") : t("no")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {g.notes.length > 0 && <ul>{g.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
    </section>
  ); // tagPanel

  /** One MAC address: its hyphen form, then its M and X bits in words, and whether it is a documentation address. */
  const macRow = (k: "destination" | "source", mac: MacReading) => row(t(`mac.${k}`), (
    <>
      <span className="mono">{mac.hex}</span>
      <br />
      <span className="hmac-build-note">{t("mac.flags", { kind: t(mac.group ? "mac.group" : "mac.individual"), scope: t(mac.local ? "mac.local" : "mac.global") })}{mac.documentation ? ` ${t("mac.documentation")}` : ""}</span>
    </>
  ), k, false); // macRow

  /** The tag reading. */
  const tagView = (r: TagResult) => (
    <div className="jwt-results">
      <div className="tcl-verdict tcl-verdict-ok" role="status">
        <p>{r.verdict}</p>
      </div>
      {warningsBox(r.warnings)}
      {shareRow}
      {r.destination && r.source && (
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("mac.heading")}</h4>
          <div className="jwt-claims">
            {macRow("destination", r.destination)}
            {macRow("source", r.source)}
          </div>
          {r.destination.group && <p className="hmac-build-note">{t.rich("mac.groupLink", { a: (chunks: ReactNode) => <Link href="/tools/multicast-mac-mapper" className="tool-sources-link">{chunks}</Link> })}</p>}
        </section>
      )}
      {r.tags.map(tagPanel)}
      {r.next && (
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("next.heading")}</h4>
          <div className="jwt-claims">
            {row(t("next.value"), r.next.value, "value")}
            {row(t("next.kind"), t(`next.kinds.${r.next.kind}`), "kind", false)}
            {r.next.name && row(t("next.name"), t.rich("next.iana", { name: r.next.name, n: (c: ReactNode) => <span lang="en">{c}</span> }), "name", false)}
            {r.after > 0 && row(t("next.after"), t("next.afterValue", { n: r.after }), "after", false)}
          </div>
          <p className="hmac-build-note">{r.next.text}</p>
        </section>
      )}
      {notesPanel(r.notes)}
    </div>
  ); // tagView

  /** One direction of a fate row, in words. */
  const fate = (d: Direction): string => {
    if (d.outcome === "not-sent") return t("fate.notSent"); // not sent
    if (d.outcome === "unconfirmed") return t("fate.unconfirmed"); // not stated
    const as = t(`fate.as.${d.as ?? "tagged"}`); // tagged or untagged
    if (d.outcome === "dropped") return t("fate.dropped", { as }); // dropped
    if (d.outcome === "other") return t("fate.other", { as, v: d.into ?? 0 }); // another VLAN
    return t("fate.same", { as }); // the same VLAN
  }; // fate

  /** What an end does with untagged arrivals, in words. */
  const untaggedIn = (e: EndReading): string => (e.untaggedIn === "vlan" ? t("end.inVlan", { v: e.untaggedInVlan ?? 0 }) : e.untaggedIn === "dropped" ? t("end.inDropped") : t("end.inUnconfirmed")); // three cases

  /** One end's panel. */
  const endPanel = (e: EndReading) => (
    <section className="jwt-panel" key={e.end}>
      <h4 className="jwt-panel-title">{t("end.heading", { end: e.end, vendor: e.vendorName })}</h4>
      <div className="jwt-claims">
        {row(t("end.carries"), <>{vlanList(e.allowedText)}{e.allowedCount > 0 && <><br /><span className="hmac-build-note">{t("end.count", { n: e.allowedCount })}</span></>}</>, "carries", false)}
        {row(t("end.tagged"), vlanList(e.taggedText), "tagged", false)}
        {row(t("end.untaggedOut"), e.untaggedOut.length > 0 ? <span className="mono">{e.untaggedOut.join(", ")}</span> : t("none"), "out", false)}
        {row(t("end.untaggedIn"), untaggedIn(e), "in", false)}
      </div>
      {warningsBox(e.warnings)}
      <div className="lab-table-wrap">
        <table className="lab-table">
          <caption className="hmac-build-note">{t("end.readCaption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("end.line")}</th>
              <th scope="col">{t("end.effect")}</th>
            </tr>
          </thead>
          <tbody>
            {e.read.map((l) => (
              <tr key={l.line}>
                <th scope="row" className="mono">{l.line}</th>
                <td><span className="mono">{l.text}</span><br /><span className="hmac-build-note">{l.effect}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {e.notRead.length > 0 && <p className="hmac-build-note">{t("end.notRead", { lines: e.notRead.join(", ") })}</p>}
      {e.notes.length > 0 && <ul>{e.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
    </section>
  ); // endPanel

  /** The trunk reading. */
  const trunkView = (r: TrunkResult) => {
    const rows = allRows ? r.rows : r.rows.slice(0, ROWS_FOLDED); // folded or not
    // Green only when every VLAN sent crosses both ways in its own VLAN and nothing is warned about anywhere (a native
    // VLAN configured but not carried leaves the counts clean but is warned about, so it is amber).
    const clean = r.carriedCount > 0 && r.crossed.length === 0 && r.unconfirmed.length === 0 && r.aOnly.length === 0 && r.bOnly.length === 0 && r.warnings.length === 0 && r.a.warnings.length === 0 && r.b.warnings.length === 0; // all clear
    return (
      <div className="jwt-results">
        <div className={`tcl-verdict ${clean ? "tcl-verdict-ok" : "tcl-verdict-warn"}`} role="status">
          <p>{r.verdict}</p>
        </div>
        {warningsBox(r.warnings)}
        {shareRow}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("sum.heading")}</h4>
          <div className="jwt-claims">
            {row(t("sum.carried"), vlanList(r.carriedText), "carried", false)}
            {row(t("sum.aOnly"), vlanList(r.aOnlyText), "aOnly", false)}
            {row(t("sum.bOnly"), vlanList(r.bOnlyText), "bOnly", false)}
            {row(t("sum.crossed"), vlanList(r.crossedText), "crossed", false)}
            {row(t("sum.unconfirmed"), vlanList(r.unconfirmedText), "unconfirmed", false)}
          </div>
        </section>
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("fate.heading")}</h4>
          <div className="cidr-table-wrap">
            <table className="cidr-table ccb-path">
              <thead>
                <tr>
                  <th scope="col">{t("fate.vlans")}</th>
                  <th scope="col">{t("fate.ab")}</th>
                  <th scope="col">{t("fate.ba")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.from}>
                    <th scope="row" className="mono">{x.from === x.to ? x.from : `${x.from}-${x.to}`}</th>
                    <td>{fate(x.ab)}</td>
                    <td>{fate(x.ba)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {r.rows.length > ROWS_FOLDED && (
            <div className="rdap-ask-row">
              <button type="button" className="b64-copy" onClick={() => setAllRows((v) => !v)} aria-expanded={allRows}>{allRows ? t("fate.fewer") : t("fate.all", { n: r.rows.length })}</button>
            </div>
          )}
          <p className="hmac-build-note">{t("fate.note")}</p>
        </section>
        {endPanel(r.a)}
        {endPanel(r.b)}
        {notesPanel(r.notes)}
      </div>
    );
  }; // trunkView

  /** A seg button. */
  const segBtn = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" className={`seg-btn${active ? " seg-btn--active" : ""}`} aria-pressed={active} onClick={onClick}>{label}</button>
  ); // segBtn

  /** One end's vendor and lines. */
  const endForm = (end: "a" | "b") => {
    const vendor = end === "a" ? avendor : bvendor; // its vendor
    const setVendor = end === "a" ? setAvendor : setBvendor; // its setter
    const config = end === "a" ? aconfig : bconfig; // its lines
    const setConfig = end === "a" ? setAconfig : setBconfig; // their setter
    return (
      <div className="curlb-section" key={end}>
        <span className="curlb-section-title">{t("end.form", { end: end.toUpperCase() })}</span>
        <label className="cidr-label" htmlFor={`vlan-${end}-vendor`}>{t("vendorLabel")}</label>
        <select id={`vlan-${end}-vendor`} className="curlb-select" value={vendor} onChange={(e) => setVendor(e.target.value as VendorId)}>
          {VENDORS.map((v) => <option key={v} value={v}>{VENDOR_NAMES[v]}</option>)}
        </select>
        <label className="cidr-label" htmlFor={`vlan-${end}-config`}>{t("configLabel")}</label>
        <textarea id={`vlan-${end}-config`} className="cidr-input mono json-input" value={config} onChange={(e) => setConfig(e.target.value)} placeholder={PLACEHOLDER[vendor]} spellCheck={false} autoComplete="off" maxLength={MAX_TEXT} rows={6} wrap="off" aria-describedby="vlan-trunk-hint" />
      </div>
    );
  }; // endForm

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode switch. */}
      <div className="seg-group" role="group" aria-label={t("modeLabel")}>
        <div className="seg">
          {(["tag", "trunk"] as const).map((m) => segBtn(mode === m, t(`mode.${m}`), () => setMode(m), m))}
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

        {/* The tag mode: the octets, where they start, and the chips. */}
        {mode === "tag" && (
          <>
            <textarea id="vlan-hex" className="cidr-input mono tcl-short" value={hex} onChange={(e) => setHex(e.target.value)} placeholder="00 00 5e 00 53 01 00 00 5e 00 53 02 81 00 a0 14 08 00" spellCheck={false} autoComplete="off" maxLength={MAX_TEXT} rows={3} aria-label={t("inputs.tag")} aria-describedby="vlan-hex-hint" />
            <div className="dcb-segs">
              <div className="dcb-seg">
                <span className="cidr-label">{t("startLabel")}</span>
                <div className="seg" role="group" aria-label={t("startLabel")}>
                  {(["auto", "tpid", "mac"] as const).map((s) => segBtn(start === s, t(`start.${s}`), () => setStart(s), s))}
                </div>
              </div>
            </div>
            <div className="tcl-presets-row" role="group" aria-label={t("chipsLabel")}>
              {TAG_CHIPS.map((c) => (
                <button key={c.id} type="button" className="tcl-chip" aria-pressed={hex === c.input} onClick={() => { setHex(c.input); setStart("auto"); }}>{t(`chip.${c.id}`)}</button>
              ))}
            </div>
            <p id="vlan-hex-hint" className="hmac-build-note">{t("hexHint")}</p>
          </>
        )}

        {/* The trunk mode: two ends, then the chips. */}
        {mode === "trunk" && (
          <>
            {endForm("a")}
            {endForm("b")}
            <div className="tcl-presets-row" role="group" aria-label={t("chipsLabel")}>
              {TRUNK_CHIPS.map((c) => (
                <button key={c.id} type="button" className="tcl-chip" aria-pressed={aconfig === c.a.config && bconfig === c.b.config} onClick={() => { setAvendor(c.a.vendor); setAconfig(c.a.config); setBvendor(c.b.vendor); setBconfig(c.b.config); setAllRows(false); }}>{t(`chip.${c.id}`)}</button>
              ))}
            </div>
            <p id="vlan-trunk-hint" className="hmac-build-note">{t("trunkHint")}</p>
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
      {view && view.ok && (view.data.mode === "tag" ? tagView(view.data) : trunkView(view.data))}
    </div>
  );
} // VlanTagAndTrunkCalculatorTool
