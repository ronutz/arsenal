"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/BitNumberingAndOrderTool.tsx
// ----------------------------------------------------------------------------
// UI for the bit numbering and bit order tool (08/11/2026). Three modes:
//   Value        a number (0x hex, 0b binary or decimal) and its width ->
//                every bit with its weight and its number under LSB 0, MSB 0
//                and 1-based numbering, the set bits, the counts, the reversed
//                and swapped forms, the order on a link, an optional known
//                layout with each field named, and an optional "bits i to j";
//   Printed bits a string of 0s and 1s and the order it was printed in -> the
//                value, the value read the other way, then the same reading;
//   MAC address  canonical or bit-reversed -> both forms, the I/G and U/L
//                bits, the SLAP quadrant, the 48 bits in Ethernet's order.
// D-83 Example/Clear row: each mode's Example is verbatim from a golden vector
// (examples.ts), and the sample chips are golden vectors too. Existing class
// vocabulary only (seg-*, cidr-*, jwt-*, tcl-*, bb-*, dcb-*, dig-input-*,
// b64-copy, hmac-build-note, rdap-ask-row, json-error-*, ztc-empty, ccb-path).
// All compute is local.
//
// PAGE LANGUAGE. The reading comes from runLocalisable() (every sentence an
// EngineText) and is put into the page's language by inPageLanguage(); input
// errors through engineTexts().error. Numbers, hexadecimal values and bit
// strings are printed from the reading's own fields.
//
// SHARE RESULTS. Under the headline, a button builds a link that carries the
// field, the mode and the mode's own fields (src/lib/tools/bit-numbering-and-
// order/share.ts). An arriving link (useShareArrival) sets them as typing
// would; the other modes keep their values.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state, memoised readings, rich-text chunks
import { useTranslations } from "next-intl"; // messages
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // the up and down arrows, and their keys
import { Link } from "@/i18n/navigation"; // locale-aware links to the Learn article and the related tools
import { runLocalisable, LAYOUTS, MAX_FIELD, MAX_WIDTH, type BitResult, type ValueResult, type MacResult, type LayoutId } from "@/lib/tools/bit-numbering-and-order/compute"; // the engine, sentences with ids
import { EXAMPLES, SAMPLES, type BitExample } from "@/lib/tools/bit-numbering-and-order/examples"; // the Examples and samples, the same objects the golden vectors pin
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { BIT_NUMBERING_SHARE, encodeBitShare, requestOf, type BitShareState } from "@/lib/tools/bit-numbering-and-order/share"; // this tool's share spec

/** The three modes. */
type Mode = BitShareState["mode"]; // value, printed or mac

/** What the page shows: nothing yet, a reading, or a refusal in the page's language. */
type View = null | { ok: true; data: BitResult } | { ok: false; message: string }; // the computed state

/** A blank form (every mode's fields; switching modes keeps them). */
const BLANK: BitShareState = Object.freeze({ mode: "value", input: "", width: "", layout: "none", order: "msb-first", form: "canonical", numbering: "lsb0", from: "", to: "" }) as BitShareState; // nothing typed

/** The common widths offered as chips. */
const WIDTHS = ["8", "16", "32", "64"] as const; // a byte to a quadword

/** Layout ids with their pack-safe keys (a key may not hold a hyphen-led segment the packs dislike). */
const LAYOUT_KEY: Readonly<Record<LayoutId, string>> = Object.freeze({ none: "none", lacp: "lacp", "mac-octet": "macOctet", "tcp-flags": "tcpFlags", "dns-flags": "dnsFlags", tos: "tos", "vlan-tci": "vlanTci" }); // id -> key

/** Rows of the bit table shown before "Show all" when the width is above this. */
const FOLD_AT = 16; // two octets

/**
 * A request (an Example or a sample) as the form holds it, keeping the fields the request does not name.
 * @param r the request
 * @param f the current form
 * @returns the form
 */
function formOf(r: BitExample["request"], f: BitShareState): BitShareState {
  const g = r as unknown as Record<string, string | undefined>; // read by name
  return { ...f, mode: r.mode, input: g.input ?? "", width: g.width ?? "", layout: g.layout ?? "none", order: (g.order as BitShareState["order"]) ?? "msb-first", form: (g.form as BitShareState["form"]) ?? "canonical", numbering: (g.numbering as BitShareState["numbering"]) ?? "lsb0", from: g.from ?? "", to: g.to ?? "" }; // field by field
} // formOf

export default function BitNumberingAndOrderTool() {
  const t = useTranslations("tools.bit-numbering-and-order"); // this tool's messages
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language
  const [form, setForm] = useState<BitShareState>(() => ({ ...BLANK })); // the form
  const [allBits, setAllBits] = useState(false); // whether a wide value shows every bit
  /** Change some fields of the form. */
  const set = (patch: Partial<BitShareState>) => setForm((f) => ({ ...f, ...patch })); // immutable update

  /** The reading: nothing until something is typed, then the engine's reading or its refusal. */
  const view: View = useMemo(() => {
    if (form.input.trim() === "") return null; // nothing typed yet
    try {
      return { ok: true, data: inPageLanguage(runLocalisable(requestOf(form)), tx) as BitResult }; // the reading, in the page's language
    } catch (e) {
      return { ok: false, message: tx.error(e) }; // the refusal's sentence in the page's language
    } // computed
  }, [form, tx]); // recomputed on any field

  // An arriving share link: the mode and its fields are set as typing would set them; the rest keep their values.
  useShareArrival(BIT_NUMBERING_SHARE, (s) => {
    setForm((f) => (s.mode === "mac" ? { ...f, mode: "mac", input: s.input, form: s.form } : s.mode === "printed" ? { ...f, mode: "printed", input: s.input, order: s.order, layout: s.layout, numbering: s.numbering, from: s.from, to: s.to } : { ...f, mode: "value", input: s.input, width: s.width, layout: s.layout, numbering: s.numbering, from: s.from, to: s.to })); // the mode's fields
  });
  // What Share results carries: the field and the mode's fields, once the page has a reading (memoised).
  const share = useMemo(() => encodeBitShare(form, !!view?.ok), [form, view]); // the encoding

  /** Fill the mode shown with its Example (verbatim from the golden vectors). */
  const loadExample = () => {
    const ex = EXAMPLES.find((x) => x.id === form.mode); // the mode's Example
    if (ex) setForm((f) => formOf(ex.request, f)); // filled
  }; // loadExample
  /** Empty the mode's fields (the mode stays). */
  const clearAll = () => setForm((f) => ({ ...BLANK, mode: f.mode })); // blank

  /** One label and value row. */
  const row = (label: ReactNode, value: ReactNode, key: string, mono = true) => (
    <div className="jwt-claim-row" key={key}>
      <span className="jwt-claim-label">{label}</span>
      <span className={`jwt-claim-value${mono ? " mono" : ""}`}>{value}</span>
    </div>
  ); // row

  /** A seg button. */
  const segBtn = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" className={`seg-btn${active ? " seg-btn--active" : ""}`} aria-pressed={active} onClick={onClick}>{label}</button>
  ); // segBtn

  /** The share row (under the headline). */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} details={[]} title={t("name")} />
    </div>
  ); // shareRow

  /** The notes panel, with the Learn article and the related tools. */
  const notesPanel = (notes: string[]) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
        <li>{t.rich("learn", { a: (c: ReactNode) => <Link href="/learn/least-and-most-significant-bit" className="tool-sources-link">{c}</Link>, b: (c: ReactNode) => <Link href="/learn/big-endian-and-little-endian" className="tool-sources-link">{c}</Link> })}</li>
        <li>{t.rich("related", { lacp: (c: ReactNode) => <Link href="/tools/lacp-hash-and-state-reader" className="tool-sources-link">{c}</Link>, oui: (c: ReactNode) => <Link href="/tools/oui-lookup" className="tool-sources-link">{c}</Link>, mcast: (c: ReactNode) => <Link href="/tools/multicast-mac-mapper" className="tool-sources-link">{c}</Link>, vlan: (c: ReactNode) => <Link href="/tools/vlan-tag-and-trunk-calculator" className="tool-sources-link">{c}</Link> })}</li>
      </ul>
    </section>
  ); // notesPanel

  /** A list of bit numbers, or a dash for none. */
  const list = (xs: number[]): string => (xs.length ? xs.join(" ") : "-"); // space-separated

  /** The value and printed reading. */
  const valueView = (r: ValueResult) => {
    const folded = r.width > FOLD_AT && !allBits; // a wide value starts folded
    const shown = folded ? r.bits.filter((b) => b.set) : r.bits; // the rows shown
    return (
      <div className="jwt-results">
        <div className="tcl-verdict tcl-verdict-ok" role="status">
          <p>{t.rich("value.headline", { hex: r.hex, dec: r.decimal, w: String(r.width), m: (c: ReactNode) => <strong className="mono">{c}</strong> })}</p>
          <p className="hmac-build-note mono">{r.binary}</p>
          {r.printed && <p>{t.rich(r.printed.order === "lsb-first" ? "printed.lsb" : "printed.msb", { typed: r.printed.typed, hex: r.hex, other: r.printed.otherHex, otherDec: r.printed.otherDecimal, m: (c: ReactNode) => <strong className="mono">{c}</strong> })}</p>}
        </div>
        {shareRow}
        {r.layout && (
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("layout.heading", { layout: t(`layoutName.${LAYOUT_KEY[r.layout.id]}`) })}</h4>
            <div className="cidr-table-wrap">
              <table className="cidr-table ccb-path">
                <thead>
                  <tr>
                    <th scope="col">{t("layout.colField")}</th>
                    <th scope="col">{t("layout.colValue")}</th>
                    <th scope="col">{t("layout.colBits")}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.layout.fields.map((f) => (
                    <tr key={f.id}>
                      {/* The name, what it stands for, and how the layout's own documents number it, stacked in a cell that may wrap (ccb-path's cells wrap; a th keeps cidr-table's nowrap), so a phone keeps all three columns in view. */}
                      <td><strong className="mono">{f.name}</strong>{f.gloss && <span className="ccb-issuer">{f.gloss}</span>}<span className="ccb-issuer">{t("layout.docLine", { doc: f.doc, mask: f.mask })}</span></td>
                      <td className="mono">{f.value}{f.bits.length > 1 ? ` (${f.bits})` : ""}{f.valueName ? ` ${f.valueName}` : ""}</td>
                      {/* The three numberings in one cell: LSB 0, MSB 0, 1-based. */}
                      <td className="mono">{`${f.lsb0Hi === f.lsb0Lo ? f.lsb0Hi : `${f.lsb0Hi}-${f.lsb0Lo}`} · ${f.msb0From === f.msb0To ? f.msb0From : `${f.msb0From}-${f.msb0To}`} · ${f.oneHi === f.oneLo ? f.oneHi : `${f.oneHi}-${f.oneLo}`}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hmac-build-note">{t("layout.bitsOrder")}</p>
            <p className="hmac-build-note">{r.layout.numberingNote}</p>
          </section>
        )}
        {r.field && (
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("field.heading", { numbering: t(`numbering.${r.field.numbering}`), from: String(r.field.from), to: String(r.field.to) })}</h4>
            <div className="jwt-claims">
              {row(t("field.value"), `${r.field.value} (${r.field.valueHex}, ${r.field.bits})`, "fv")}
              {row(t("field.mask"), r.field.mask, "fm")}
              {row(t("field.shift"), String(r.field.shift), "fs")}
              {row(t("field.code"), <code>{r.field.expression}</code>, "fc")}
              {row(t("field.kernel"), <code>{r.field.kernel}</code>, "fk")}
              {row(t("field.three"), t("field.threeValue", { lsb: r.field.lsb0Hi === r.field.lsb0Lo ? String(r.field.lsb0Lo) : `${r.field.lsb0Hi}-${r.field.lsb0Lo}`, msb: r.field.msb0From === r.field.msb0To ? String(r.field.msb0From) : `${r.field.msb0From}-${r.field.msb0To}`, one: r.field.oneHi === r.field.oneLo ? String(r.field.oneLo) : `${r.field.oneHi}-${r.field.oneLo}` }), "f3", false)}
            </div>
          </section>
        )}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("bits.heading", { w: String(r.width) })}</h4>
          <div className="cidr-table-wrap">
            <table className="cidr-table ccb-path">
              <thead>
                <tr>
                  <th scope="col">{t("bits.colBit")}</th>
                  <th scope="col">{t("bits.colLsb0")}</th>
                  <th scope="col">{t("bits.colMsb0")}</th>
                  <th scope="col">{t("bits.colOne")}</th>
                  <th scope="col">{t("bits.colWeight")}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((b) => (
                  <tr key={b.lsb0}>
                    <th scope="row" className="mono">{b.set ? "1" : "0"}</th>
                    <td className="mono">{b.lsb0}</td>
                    <td className="mono">{b.msb0}</td>
                    <td className="mono">{b.one}</td>
                    <td className="mono">{b.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {r.width > FOLD_AT && (
            <div className="dig-input-actions">
              <button type="button" className="b64-copy" aria-expanded={allBits} onClick={() => setAllBits((x) => !x)}>{allBits ? t("bits.fewer") : t("bits.all", { w: String(r.width) })}</button>
            </div>
          )}
          {folded && <p className="hmac-build-note">{t("bits.foldedNote")}</p>}
        </section>
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("set.heading")}</h4>
          <div className="jwt-claims">
            {row(t("set.lsb0"), list(r.setBits.lsb0), "sl")}
            {row(t("set.msb0"), list(r.setBits.msb0), "sm")}
            {row(t("set.one"), list(r.setBits.one), "so")}
            {row(t("set.ones"), String(r.ones), "sn")}
            {row(t("set.parity"), t("set.parityValue", { even: String(r.parityEven), odd: String(r.parityOdd) }), "sp", false)}
            {row(t("set.lowest"), r.lowestSet === null ? "-" : String(r.lowestSet), "slo")}
            {row(t("set.highest"), r.highestSet === null ? "-" : String(r.highestSet), "shi")}
            {row(t("set.signed"), r.signed, "ss")}
          </div>
        </section>
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("order.heading")}</h4>
          <div className="jwt-claims">
            {row(t("order.reversed"), r.reversed, "or")}
            {r.reversedPerOctet && r.width > 8 && row(t("order.perOctet"), r.reversedPerOctet, "op")}
            {r.byteSwapped && row(t("order.byteSwapped"), r.byteSwapped, "ob")}
            {row(t("order.lsbFirstString"), r.binaryLsbFirst, "ol")}
            {r.wire && row(t("order.wireLsb"), r.wire.lsbFirst, "wl")}
            {r.wire && row(t("order.wireMsb"), r.wire.msbFirst, "wm")}
          </div>
          {r.byteSwapped && <p className="hmac-build-note">{t.rich("order.byteNote", { a: (c: ReactNode) => <Link href="/learn/big-endian-and-little-endian" className="tool-sources-link">{c}</Link> })}</p>}
        </section>
        {notesPanel(r.notes)}
      </div>
    );
  }; // valueView

  /** The MAC reading. */
  const macView = (r: MacResult) => (
    <div className="jwt-results">
      <div className="tcl-verdict tcl-verdict-ok" role="status">
        <p>{t.rich("mac.headline", { canonical: r.canonical, reversed: r.reversed, m: (c: ReactNode) => <strong className="mono">{c}</strong> })}</p>
      </div>
      {shareRow}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("mac.heading")}</h4>
        <div className="jwt-claims">
          {row(t("mac.canonical"), `${r.canonical}  ${r.canonicalColon}`, "mc")}
          {row(t("mac.reversed"), r.reversed, "mr")}
          {row(t("mac.firstOctet"), r.firstOctetBits, "mf")}
          {row(t("mac.ig"), r.broadcast ? t("mac.igBroadcast") : r.group ? t("mac.igGroup") : t("mac.igIndividual"), "mg", false)}
          {row(t("mac.ul"), r.local ? t("mac.ulLocal") : t("mac.ulUniversal"), "ml", false)}
          {r.slap && row(t("mac.slap"), r.slap.name, "ms", false)}
          {row(t("mac.wire"), r.wire, "mw")}
          {row(t("mac.firstBit"), t("mac.firstBitValue", { bit: String(r.firstBitOnWire) }), "mb", false)}
          {row(t("mac.misread"), t("mac.misreadValue", { reversed: r.reversed, ig: r.reversedMisread.group ? t("mac.igGroup") : t("mac.igIndividual"), ul: r.reversedMisread.local ? t("mac.ulLocal") : t("mac.ulUniversal") }), "mm", false)}
        </div>
      </section>
      {notesPanel(r.notes)}
    </div>
  ); // macView

  /** The width's arrows. */
  const widthArrows = { value: form.width === "" ? "8" : form.width, onValue: (v: string) => set({ width: v }), min: 1, max: MAX_WIDTH, integer: true }; // 1 to 64
  /** The field controls (value and printed modes). */
  const fieldControls = (
    <>
      <div className="dcb-segs">
        <div className="dcb-seg">
          <span className="cidr-label">{t("numberingLabel")}</span>
          {/* Three numberings as pressed chips: they wrap on a phone. */}
          <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("numberingLabel")}>
            {(["lsb0", "msb0", "one"] as const).map((n) => <button key={n} type="button" className="tcl-chip" aria-pressed={form.numbering === n} onClick={() => set({ numbering: n })}>{t(`numbering.${n}`)}</button>)}
          </div>
        </div>
      </div>
      <div className="bb-fields">
        <div className="bb-field">
          <label className="cidr-label" htmlFor="bno-from">{t("fromLabel")}</label>
          <input id="bno-from" className="cidr-input mono" value={form.from} onChange={(e) => set({ from: e.target.value })} placeholder="0" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={3} />
        </div>
        <div className="bb-field">
          <label className="cidr-label" htmlFor="bno-to">{t("toLabel")}</label>
          <input id="bno-to" className="cidr-input mono" value={form.to} onChange={(e) => set({ to: e.target.value })} placeholder={t("toPlaceholder")} inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={3} />
        </div>
      </div>
      <p className="hmac-build-note">{t("fieldHint")}</p>
    </>
  ); // fieldControls
  /** The layout chips (value and printed modes). */
  const layoutChips = (
    <div className="dcb-segs">
      <div className="dcb-seg">
        <span className="cidr-label">{t("layoutLabel")}</span>
        <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("layoutLabel")}>
          {LAYOUTS.map((l) => <button key={l} type="button" className="tcl-chip" aria-pressed={form.layout === l} onClick={() => set({ layout: l })}>{t(`layoutName.${LAYOUT_KEY[l]}`)}</button>)}
        </div>
        <p className="hmac-build-note">{t(`layoutHint.${LAYOUT_KEY[form.layout as LayoutId] ?? "none"}`)}</p>
      </div>
    </div>
  ); // layoutChips

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode switch. */}
      <div className="seg-group" role="group" aria-label={t("modeLabel")}>
        <div className="seg">
          {(["value", "printed", "mac"] as const).map((m) => segBtn(form.mode === m, t(`mode.${m}`), () => set({ mode: m }), m))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="bno-input">{t(`inputs.${form.mode}`)}</label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: each mode's Example is verbatim from a golden vector. */}
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clearAll}>{t("clear")}</button>
          </div>
        </div>
        <input id="bno-input" className="cidr-input mono" value={form.input} onChange={(e) => set({ input: e.target.value })} placeholder={t(`placeholder.${form.mode}`)} autoComplete="off" spellCheck={false} maxLength={MAX_FIELD} aria-describedby="bno-input-hint" />
        <p id="bno-input-hint" className="hmac-build-note">{t(`inputHint.${form.mode}`)}</p>

        {form.mode === "value" && (
          <>
            <div className="bb-fields">
              <div className="bb-field">
                <label className="cidr-label" htmlFor="bno-width">{t("widthLabel")}</label>
                {/* Up and down arrows: one bit a press, 1 to 64 (the engine's bounds). */}
                <StepperField {...widthArrows} label={t("widthLabel")} inputId="bno-width">
                  <input id="bno-width" className="cidr-input mono" value={form.width} onChange={(e) => set({ width: e.target.value })} onKeyDown={stepperKeyDown(widthArrows)} placeholder={t("widthPlaceholder")} inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={3} />
                </StepperField>
              </div>
            </div>
            {/* The common widths as chips; "auto" leaves the width to the input. */}
            <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("widthLabel")}>
              <button type="button" className="tcl-chip" aria-pressed={form.width === ""} onClick={() => set({ width: "" })}>{t("widthAuto")}</button>
              {WIDTHS.map((w) => <button key={w} type="button" className="tcl-chip" aria-pressed={form.width === w} onClick={() => set({ width: w })}>{t("widthBits", { w })}</button>)}
            </div>
            {layoutChips}
            {fieldControls}
          </>
        )}

        {form.mode === "printed" && (
          <>
            <div className="dcb-segs">
              <div className="dcb-seg">
                <span className="cidr-label">{t("orderLabel")}</span>
                <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("orderLabel")}>
                  {(["msb-first", "lsb-first"] as const).map((o) => <button key={o} type="button" className="tcl-chip" aria-pressed={form.order === o} onClick={() => set({ order: o })}>{t(`orderName.${o === "msb-first" ? "msb" : "lsb"}`)}</button>)}
                </div>
              </div>
            </div>
            {layoutChips}
            {fieldControls}
          </>
        )}

        {form.mode === "mac" && (
          <div className="dcb-segs">
            <div className="dcb-seg">
              <span className="cidr-label">{t("formLabel")}</span>
              <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("formLabel")}>
                {(["canonical", "reversed"] as const).map((x) => <button key={x} type="button" className="tcl-chip" aria-pressed={form.form === x} onClick={() => set({ form: x })}>{t(`formName.${x}`)}</button>)}
              </div>
            </div>
          </div>
        )}

        <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("samplesLabel")}>
          {SAMPLES.filter((x) => x.request.mode === form.mode).map((x) => <button key={x.id} type="button" className="tcl-chip" onClick={() => setForm((f) => formOf(x.request, f))}>{t(`sample.${x.id}`)}</button>)}
        </div>

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
      {!view && <p className="ztc-empty">{t(`empty.${form.mode}`)}</p>}

      {/* The reading. */}
      {view && view.ok && (view.data.mode === "mac" ? macView(view.data) : valueView(view.data))}
    </div>
  );
} // BitNumberingAndOrderTool
