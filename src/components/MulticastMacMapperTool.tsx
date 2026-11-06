"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/MulticastMacMapperTool.tsx
// ----------------------------------------------------------------------------
// UI for the multicast group <-> Ethernet MAC mapper (02/11/2026). One field:
// an IPv4 or IPv6 group gives its MAC (in colon, hyphen and dot notation), the
// bits that reach the MAC and those that do not, where the group sits in the
// registries, and, for IPv4, the 32 groups that share the MAC; a 01-00-5E or
// 33-33 MAC gives the groups that map to it. "Read this MAC back" turns a
// forward reading into the reverse one.
// D-83 Example/Clear row: the Example is the Learn article's worked group,
// verbatim from a golden vector (EXAMPLE_INPUT); the sample chips are golden
// vector inputs too. Existing class vocabulary only (cidr-*, dig-input-*,
// jwt-*, tcl-*, b64-copy, cv-copy, rdap-ask-row, hmac-build-note, cipher-note,
// json-error-*, ztc-empty, tool-sources-link). All compute is local.
//
// PAGE LANGUAGE. The reading comes from runLocalisable() (every sentence an
// EngineText) and is put into the page's language by inPageLanguage(); input
// errors through engineTexts().error. Block, scope and range names are looked
// up by id in the pack; IANA's own names for groups are shown as published,
// in English, and marked lang="en" so a screen reader on the Portuguese page
// reads them in English (WCAG 3.1.2); the Portuguese labels say they are in
// English (PRIME 05/11/2026, the queued multicast item).
//
// SHARE RESULTS. Under the headline, a button builds a link that carries the
// field as typed (#input=), only while there is a reading
// (src/lib/tools/multicast-mac-mapper/share.ts). An arriving link fills the
// field as a paste would (useShareArrival).
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state, memoised reading, rich-text chunks
import { useTranslations } from "next-intl"; // messages
import { Link } from "@/i18n/navigation"; // locale-aware links to the Learn article and the related tools
import { runLocalisable, type MapperResult, type Ipv4Forward, type Ipv4Reverse, type Ipv6Forward, type Ipv6Reverse, type Ipv4Group, type MacForms, type Ipv6Named } from "@/lib/tools/multicast-mac-mapper/compute"; // the engine, sentences with ids
import { EXAMPLE_INPUT, SAMPLE_INPUTS } from "@/lib/tools/multicast-mac-mapper/examples"; // the Example and the chips, the same strings the golden vectors pin
import { engineTexts, type EngineTextCarrier } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import CopyTextButton from "@/components/CopyTextButton"; // the site's copy button
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { MULTICAST_MAC_SHARE, encodeMulticastMacShare } from "@/lib/tools/multicast-mac-mapper/share"; // this tool's share spec

/** What the page shows: nothing yet, a reading, or a refusal (its sentence, and its id for the hint below it). */
type View = null | { ok: true; data: MapperResult } | { ok: false; message: string; id: string }; // the computed state

/** How many of the 32 IPv4 groups show folded, at least (the notable ones always show). */
const FIRST_ROWS = 8; // enough to see the pattern, short on a phone

export default function MulticastMacMapperTool() {
  const t = useTranslations("tools.multicast-mac-mapper"); // this tool's messages
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language
  const [input, setInput] = useState(""); // the field, as typed
  const [showAll, setShowAll] = useState(false); // all 32 rows of the IPv4 list

  /** The reading: nothing while the field is blank, then the engine's reading or its refusal. */
  const view: View = useMemo(() => {
    if (input.trim() === "") return null; // nothing typed
    try {
      return { ok: true, data: inPageLanguage(runLocalisable(input), tx) as MapperResult }; // the reading, in the page's language
    } catch (e) {
      const id = (e as EngineTextCarrier | null)?.engineText?.id ?? ""; // the refusal's id
      return { ok: false, message: tx.error(e), id }; // its sentence in the page's language
    } // computed
  }, [input, tx]); // recomputed on every keystroke (cheap)

  // An arriving share link: the field is filled as a paste would fill it.
  useShareArrival(MULTICAST_MAC_SHARE, (s) => { setInput(s.input); setShowAll(false); }); // fill only: the page computes
  // What Share results carries: the field, once the page has a reading (memoised).
  const share = useMemo(() => encodeMulticastMacShare({ input }, !!view?.ok), [input, view]); // the encoding

  /** Put a text in the field (Example, chips, "Read this MAC back"). */
  const fill = (s: string) => { setInput(s); setShowAll(false); }; // and fold the long list

  /** One label and value row. */
  const row = (label: string, value: ReactNode, key?: string) => (
    <div className="jwt-claim-row" key={key ?? label}>
      <span className="jwt-claim-label">{label}</span>
      <span className="jwt-claim-value mono">{value}</span>
    </div>
  ); // row

  /** "none", quietly. */
  const none = <span className="hmac-build-note">{t("none")}</span>; // an empty value

  /** The MAC panel: three notations, each with a copy button, and optionally "Read this MAC back". */
  const macPanel = (mac: MacForms, back: boolean) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("mac.heading")}</h4>
      <div className="jwt-claims">
        {(["colon", "hyphen", "dot"] as const).map((k) => row(t(`mac.${k}`), <>{mac[k]} <CopyTextButton text={mac[k]} label={t("copy")} done={t("copied")} /></>, k))}
      </div>
      {back && (
        <div className="rdap-ask-row">
          <button type="button" className="b64-copy" onClick={() => fill(mac.colon)}>{t("mapBack")}</button>
        </div>
      )}
    </section>
  ); // macPanel

  /**
   * Bit cells of an IPv4 address, grouped by octet with its decimal value; bits from `keptFrom` on are kept (accent),
   * the others are not in the MAC (grey); the boundaries after bit 4 and bit 9 are marked.
   */
  const v4Bits = (bits: string, keptFrom: number, unknown: boolean) => (
    <div className="cidr-bits-grid">
      {[0, 1, 2, 3].map((o) => (
        <div className="cidr-bits-octet" key={o}>
          <div className="cidr-bits-cells">
            {bits.slice(o * 8, o * 8 + 8).split("").map((b, i) => {
              const at = o * 8 + i; // the bit's position
              const kept = at >= keptFrom; // reaches the MAC
              return <span key={i} className={`cidr-bit ${kept ? "cidr-bit--net" : "cidr-bit--host"}${b === "1" ? " cidr-bit--on" : ""}${at === 3 || at === 8 ? " cidr-bit--boundary" : ""}`}>{b}</span>; // one bit
            })}
          </div>
          <span className="cidr-bits-dec mono">{unknown && o < 2 ? "?" : parseInt(bits.slice(o * 8, o * 8 + 8).replace(/\?/g, "0"), 2)}</span>
        </div>
      ))}
    </div>
  ); // v4Bits

  /** Hex cells in groups (no separators drawn): digits from `keptFrom` on are kept, the others are not in the MAC. */
  const hexCells = (groups: string[], keptFrom: number) => (
    <div className="cidr-bits-grid">
      {groups.map((g, gi) => (
        <div className="cidr-bits-cells" key={gi}>
          {g.split("").map((d, i) => {
            const at = groups.slice(0, gi).join("").length + i; // the digit's position
            return <span key={i} className={`cidr-bit ${at >= keptFrom ? "cidr-bit--net" : "cidr-bit--host"}`}>{d}</span>; // one digit
          })}
        </div>
      ))}
    </div>
  ); // hexCells

  /** The legend and the caption of a bits panel. */
  const bitsPanel = (title: string, caption: string, body: ReactNode) => (
    <div className="cidr-bits">
      <div className="cidr-bits-head">
        <span className="cidr-bits-title">{title}</span>
        <span className="cidr-bits-caption">
          <span className="cidr-bits-legend cidr-bits-legend--net">{t("bits.kept")}</span>
          <span className="cidr-bits-legend cidr-bits-legend--host">{t("bits.lost")}</span>
        </span>
      </div>
      {body}
      <p className="cidr-bits-note">{caption}</p>
    </div>
  ); // bitsPanel

  /** The block and IANA name of one IPv4 group, for the lists. */
  const groupCell = (g: Ipv4Group) => (
    <>
      {t(`block.${g.block}`)}
      {g.registered && <><br /><span className="hmac-build-note">{t.rich("ianaName", { name: g.registered, n: (c) => <span lang="en">{c}</span> })}</span></>}
    </>
  ); // groupCell

  /**
   * The list of 32 IPv4 groups (forward: `self` marked; reverse: all candidates). Folded, it shows the rows that matter
   * (the group typed, the ones IANA names, a Local Network Control group) and fills up to FIRST_ROWS with the first of
   * the others, keeping numeric order; unfolded, all 32.
   */
  const v4List = (groups: Ipv4Group[], self: string | null, title: string) => {
    const notable = (g: Ipv4Group) => g.group === self || g.registered !== null || g.block === "local-network-control"; // worth showing first
    const keep = new Set(groups.filter(notable).map((g) => g.group)); // the notable rows
    for (const g of groups) { if (keep.size >= FIRST_ROWS) break; keep.add(g.group); } // padded with the first others
    const shown = showAll ? groups : groups.filter((g) => keep.has(g.group)); // folded or not, in numeric order
    return (
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{title}</h4>
        <div className="cidr-table-wrap">
          <table className="cidr-table ccb-path">
            <thead>
              <tr>
                <th scope="col">{t("col.group")}</th>
                <th scope="col">{t("col.block")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => (
                <tr key={g.group}>
                  <th scope="row" className="mono">{g.group}{g.group === self && <> <span className="cidr-badge cidr-badge--identical">{t("thisGroup")}</span></>}</th>
                  <td>{groupCell(g)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {groups.length > shown.length || showAll ? (
          <div className="rdap-ask-row">
            <button type="button" className="b64-copy" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? t("showFewer") : t("showAll", { n: groups.length })}</button>
          </div>
        ) : null}
      </section>
    );
  }; // v4List

  /** The named IPv6 addresses, as a two-column table. */
  const v6List = (items: Ipv6Named[], title: string) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{title}</h4>
      {items.length === 0 ? <p className="hmac-build-note">{t("noneNamed")}</p> : (
        <div className="cidr-table-wrap">
          <table className="cidr-table ccb-path">
            <thead>
              <tr>
                <th scope="col">{t("col.address")}</th>
                <th scope="col">{t("col.name")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={`${x.address}|${x.name}`}>
                  <th scope="row" className="mono">{x.address}</th>
                  <td lang="en">{x.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  ); // v6List

  /** The share row (under the headline). */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
    </div>
  ); // shareRow

  /** The MAC inside a headline, kept on one line (json-stat is the site's one-line span). */
  const keepMac = { m: (chunks: ReactNode) => <span className="json-stat">{chunks}</span> }; // the <m> tag

  /** The headline, the warnings and the share row. */
  const top = (headline: ReactNode, warnings: string[]) => (
    <>
      <div className="tcl-verdict tcl-verdict-ok" role="status">
        <p className="mono">{headline}</p>
      </div>
      {warnings.length > 0 && (
        <div className="tcl-verdict tcl-verdict-warn" role="status">
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}
      {shareRow}
    </>
  ); // top

  /** The notes panel, with the Learn article and the related tools. */
  const notesPanel = (notes: string[]) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
        <li>{t.rich("learn", { a: (chunks: ReactNode) => <Link href="/learn/multicast-what-it-costs-to-not-flood" className="tool-sources-link">{chunks}</Link> })}</li>
        <li>{t.rich("related", { spbm: (chunks: ReactNode) => <Link href="/tools/extreme-spbm-multicast-mac" className="tool-sources-link">{chunks}</Link>, oui: (chunks: ReactNode) => <Link href="/tools/oui-lookup" className="tool-sources-link">{chunks}</Link> })}</li>
      </ul>
    </section>
  ); // notesPanel

  /** IPv4 group -> MAC. */
  const v4ForwardView = (r: Ipv4Forward) => (
    <div className="jwt-results">
      {top(t.rich("headline.forward", { group: r.group, mac: r.mac.hyphen, ...keepMac }), r.warnings)}
      {macPanel(r.mac, true)}
      {bitsPanel(t("bits.v4group", { group: r.group }), t("bits.v4caption", { lost: r.bits.lost, kept: r.keptHex }), v4Bits(r.bits.prefix + r.bits.lost + r.bits.kept, 9, false))}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("where.heading")}</h4>
        <div className="jwt-claims">
          {row(t("where.block"), <>{t(`block.${r.block}`)} <span className="hmac-build-note">({r.blockRange})</span></>, "block")}
          {row(t("where.scope"), t(`scope4.${r.scope}`), "scope")}
          {row(t("where.name"), r.registered ? <span lang="en">{r.registered}</span> : none, "name")}
          {r.glopAs !== null && row(t("where.glop"), String(r.glopAs), "glop")}
          {r.ubmPrefix !== null && row(t("where.ubm"), r.ubmPrefix, "ubm")}
          {r.relativeOffset !== null && row(t("where.relative"), String(r.relativeOffset), "rel")}
        </div>
      </section>
      {v4List(r.sharing, r.group, t("sharing.heading"))}
      {notesPanel(r.notes)}
    </div>
  ); // v4ForwardView

  /** 01-00-5E MAC -> 32 IPv4 groups. */
  const v4ReverseView = (r: Ipv4Reverse) => (
    <div className="jwt-results">
      {top(t.rich("headline.v4reverse", { mac: r.mac.hyphen, ...keepMac }), r.warnings)}
      {macPanel(r.mac, false)}
      {bitsPanel(t("bits.v4candidates"), t("bits.v4reverseCaption", { kept: r.keptHex }), v4Bits(r.pattern, 9, true))}
      {v4List(r.candidates, null, t("candidates.heading"))}
      {notesPanel(r.notes)}
    </div>
  ); // v4ReverseView

  /** The exploded IPv6 text as eight groups of four hex digits. */
  const v6Groups = (exploded: string) => exploded.split(":"); // eight groups

  /** IPv6 group -> MAC. */
  const v6ForwardView = (r: Ipv6Forward) => (
    <div className="jwt-results">
      {top(t.rich("headline.forward", { group: r.group, mac: r.mac.hyphen, ...keepMac }), r.warnings)}
      {macPanel(r.mac, true)}
      {bitsPanel(t("bits.v6group"), t("bits.v6caption", { low: `${r.low32Hex.slice(0, 4)}:${r.low32Hex.slice(4)}` }), hexCells(v6Groups(r.exploded), 24))}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("v6.heading")}</h4>
        <div className="jwt-claims">
          {row(t("v6.flags"), t("v6.flagsValue", { bits: r.flags.bits, x: Number(r.flags.x), r: Number(r.flags.r), p: Number(r.flags.p), t: Number(r.flags.t) }), "flags")}
          {row(t("v6.scope"), <>{r.scope} <span className="hmac-build-note">({t(`scope6.${r.scopeId}`)})</span></>, "scope")}
          {row(t("where.name"), r.registered ? <span lang="en">{r.registered}</span> : none, "name")}
          {r.zone !== null && row(t("v6.zone"), `%${r.zone}`, "zone")}
          {r.documentation && row(t("v6.documentation"), "ff0X::db8:0:0/96", "doc")}
          {r.solicitedLow24 !== null && row(t("v6.solicited"), r.solicitedLow24, "sol")}
          {r.ssm !== null && row(t("v6.ssm"), t(`ssm.${r.ssm}`), "ssm")}
          {r.unicastPrefix !== null && row(t("v6.prefix"), r.unicastPrefix, "prefix")}
          {r.embeddedRp !== null && row(t("v6.rp"), r.embeddedRp, "rp")}
          {row(t("v6.groupId"), <>{`0x${r.low32Hex.toUpperCase()}`} <span className="hmac-build-note">({t(`gid.${r.groupId}`)})</span></>, "gid")}
        </div>
      </section>
      {r.sameMac.length > 0 && v6List(r.sameMac, t("sameMac.heading"))}
      {notesPanel(r.notes)}
    </div>
  ); // v6ForwardView

  /** 33-33 MAC -> the IPv6 pattern and IANA's names. */
  const v6ReverseView = (r: Ipv6Reverse) => (
    <div className="jwt-results">
      {top(t.rich("headline.v6reverse", { mac: r.mac.hyphen, low: `${r.low32Hex.slice(0, 4)}:${r.low32Hex.slice(4)}`, ...keepMac }), r.warnings)}
      {macPanel(r.mac, false)}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("v6r.heading")}</h4>
        <div className="jwt-claims">
          {row(t("v6r.pattern"), r.pattern, "pattern")}
          {r.solicited !== null && row(t("v6r.solicited"), r.solicited, "sol")}
          {row(t("v6.groupId"), <>{`0x${r.low32Hex.toUpperCase()}`} <span className="hmac-build-note">({t(`gid.${r.groupId}`)})</span></>, "gid")}
          {row(t("v6r.ssm"), t(`ssm.${r.ssm}`), "ssm")}
        </div>
      </section>
      {v6List(r.candidates, t("v6r.candidates"))}
      {notesPanel(r.notes)}
    </div>
  ); // v6ReverseView

  /** The reading, by direction and family. */
  const reading = (d: MapperResult) => (d.direction === "forward" ? (d.family === "ipv4" ? v4ForwardView(d) : v6ForwardView(d)) : (d.family === "ipv4" ? v4ReverseView(d) : v6ReverseView(d))); // one of four

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="mmm-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the Example is verbatim from a golden vector. */}
            <button type="button" className="b64-copy" onClick={() => fill(EXAMPLE_INPUT)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => fill("")}>{t("clear")}</button>
          </div>
        </div>
        <input id="mmm-input" className="cidr-input mono" value={input} onChange={(e) => { setInput(e.target.value); setShowAll(false); }} placeholder={t("placeholder")} autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={80} aria-describedby="mmm-hint" />
        {/* Samples as compact chips: one of each kind of reading. */}
        <div className="tcl-presets-row" role="group" aria-label={t("samplesLabel")}>
          {SAMPLE_INPUTS.map((s) => (
            <button key={s} type="button" className="tcl-chip mono" aria-pressed={input === s} onClick={() => fill(s)}>{s}</button>
          ))}
        </div>
        <p id="mmm-hint" className="hmac-build-note">{t("inputHint")}</p>
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">●</span>
          {t("runsLocally")}
        </p>
      </div>

      {/* A refusal, in the page's language; a group MAC outside both mappings points to the tools that read those. */}
      {view && !view.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{view.message}</p>
          {view.id === "err.mac.otherGroup" && <p className="json-error-message">{t.rich("related", { spbm: (chunks: ReactNode) => <Link href="/tools/extreme-spbm-multicast-mac" className="tool-sources-link">{chunks}</Link>, oui: (chunks: ReactNode) => <Link href="/tools/oui-lookup" className="tool-sources-link">{chunks}</Link> })}</p>}
        </div>
      )}

      {/* Nothing typed yet. */}
      {!view && <p className="ztc-empty">{t("empty")}</p>}

      {/* The reading. */}
      {view && view.ok && reading(view.data)}
    </div>
  );
} // MulticastMacMapperTool
