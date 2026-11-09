"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/OspfCostAndAdjacencyCheckerTool.tsx
// ----------------------------------------------------------------------------
// UI for the OSPF cost and adjacency checker (08/11/2026). Two modes:
//   Cost       a vendor, a reference bandwidth (blank for the vendor's
//              default, only for vendors that have one; on Arista EOS blank
//              means "auto-cost reference-bandwidth not configured") and one
//              to eight interface speeds -> each speed's cost by the vendor's
//              documented rule, the speeds that share a cost, and the
//              smallest reference that tells them apart, with the commands;
//   Adjacency  the two interfaces of one link side by side (a field per row,
//              the rows that differ marked) -> where each router stops with
//              the other, and every mismatch in the order the routers check
//              it, with the RFC's words and any vendor-specific behaviour.
// 2026-11-08b: Huawei VRP, Arista EOS and AOS-CX take a reference (each
// vendor's hint names its own default); the "fixed" vendor kind is gone.
// D-83 Example/Clear row: each mode's Example is verbatim from a golden vector
// (examples.ts: the OSPF lab of the course's chapter 4.1); the chips are
// golden vectors too. Existing class vocabulary (seg-*, dcb-segs,
// bb-fields, cidr-*, bfd-timers-table, ccb-path, jwt-*, tcl-*, lab-steps,
// lab-step-where, rdap-ask-row, hmac-build-note, ztc-empty, json-error-*),
// plus ospf-cost-table (2026-11-08b), whose headings may wrap at 390 px.
// All compute is local.
//
// PAGE LANGUAGE. The reading comes from runLocalisable() (every sentence an
// EngineText) and is put into the page's language by inPageLanguage(); input
// errors through engineTexts().error. Costs and quotients are printed from the
// reading's own fields, with the page's decimal sign.
//
// SHARE RESULTS. Under the verdict, a button builds a link carrying the mode
// and its fields as typed (src/lib/tools/ospf-cost-and-adjacency-checker/
// share.ts); in adjacency mode the popover adds the tool's caution line. No
// key is ever asked for, so none can travel. An arriving link sets the fields
// as typing would; the other mode keeps its values.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state, memoised readings, rich-text chunks
import { useLocale, useTranslations } from "next-intl"; // messages and the active locale
import { Link } from "@/i18n/navigation"; // the locale-aware link to the Learn article
import { runLocalisable, bandwidthLabel, type OspfResult, type CostResult, type AdjacencyResult, type LinkCost, type Finding } from "@/lib/tools/ospf-cost-and-adjacency-checker/compute"; // the engine, sentences with ids, and its exact bandwidth labels
import { VENDORS, VENDOR_ORDER, COMMANDS, type VendorId } from "@/lib/tools/ospf-cost-and-adjacency-checker/vendors"; // the vendors' rules
import { EXAMPLE_COST_REQUEST, EXAMPLE_ADJACENCY_REQUEST, ADJACENCY_SCENARIOS, COST_SPEED_CHIPS } from "@/lib/tools/ospf-cost-and-adjacency-checker/examples"; // the Examples and chips, the same objects the golden vectors pin
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { OSPF_SHARE, encodeOspfShare, requestOf, SIDE_FIELDS, type OspfShareState, type SideForm } from "@/lib/tools/ospf-cost-and-adjacency-checker/share"; // this tool's share spec

/** The two modes. */
type Mode = "cost" | "adjacency"; // the page's modes

/** What the page shows: nothing yet, a reading, or a refusal in the page's language. */
type View = null | { ok: true; data: OspfResult } | { ok: false; message: string }; // the computed state

/** A side with every field blank (the form an adjacency starts from). */
const BLANK_SIDE: SideForm = Object.freeze({ name: "", routerId: "", area: "", areaType: "normal", network: "point-to-point", address: "", hello: "", dead: "", mtu: "", auth: "none", keyId: "", priority: "", instance: "" }); // blank

/** The fields typed into a text box (the rest are choices). */
const TEXT_FIELDS: readonly (keyof SideForm)[] = ["name", "routerId", "area", "address", "hello", "dead", "mtu", "keyId", "priority", "instance"]; // typed

/** The choices of each chosen field. */
const CHOICES: Readonly<Partial<Record<keyof SideForm, readonly string[]>>> = Object.freeze({
  areaType: ["normal", "stub", "nssa"], // RFC 2328 s10.5, RFC 3101
  network: ["point-to-point", "broadcast", "nbma", "point-to-multipoint"], // RFC 2328 s1.2
  auth: ["none", "simple", "md5", "hmac-sha-1", "hmac-sha-256", "hmac-sha-384", "hmac-sha-512", "ipsec"], // RFC 2328 D, RFC 5709, RFC 7166, RFC 4552
}); // by field

/** The authentication kinds each version offers. */
const AUTH_BY_VERSION: Readonly<Record<"2" | "3", readonly string[]>> = Object.freeze({ "2": ["none", "simple", "md5", "hmac-sha-1", "hmac-sha-256", "hmac-sha-384", "hmac-sha-512"], "3": ["none", "hmac-sha-1", "hmac-sha-256", "hmac-sha-384", "hmac-sha-512", "ipsec"] }); // OSPFv3 has no AuType

/** The adjacency chips, in the order shown. */
const SCENARIO_ORDER = ["lab", "hello", "key", "mtu", "area", "network"] as const; // the lab, then the breakages

/**
 * A request's side as the form holds it (every field as text).
 * @param s the side of an Example or chip
 * @returns the form
 */
function formOf(s: Readonly<Record<string, string>>): SideForm {
  const out = { ...BLANK_SIDE }; // start blank
  for (const k of SIDE_FIELDS) out[k] = s[k] ?? BLANK_SIDE[k]; // each field
  return out; // the form
} // formOf

export default function OspfCostAndAdjacencyCheckerTool() {
  const t = useTranslations("tools.ospf-cost-and-adjacency-checker"); // this tool's messages
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language
  const locale = useLocale(); // the page's language, for numbers
  // ---- The form. ----
  const [mode, setMode] = useState<Mode>("cost"); // the mode shown
  const [vendor, setVendor] = useState<VendorId>("juniper-junos"); // cost: the vendor
  const [reference, setReference] = useState(""); // cost: blank is the vendor's default
  const [links, setLinks] = useState(""); // cost: the speeds
  const [version, setVersion] = useState<"2" | "3">("2"); // adjacency: OSPFv2 by default
  const [sameKey, setSameKey] = useState(true); // adjacency: the keys match by default
  const [sideA, setSideA] = useState<SideForm>({ ...BLANK_SIDE }); // adjacency: router A
  const [sideB, setSideB] = useState<SideForm>({ ...BLANK_SIDE }); // adjacency: router B

  /** The share state of the mode shown (the same shape the engine request is built from). */
  const state: OspfShareState = useMemo(() => (mode === "cost"
    ? { mode, vendor, reference, links } // cost
    : { mode, version, sameKey, a: sideA, b: sideB }), // adjacency
  [mode, vendor, reference, links, version, sameKey, sideA, sideB]); // the fields

  /** Whether a side has nothing typed yet. */
  const blank = (s: SideForm): boolean => TEXT_FIELDS.every((k) => s[k].trim() === ""); // no text

  /** The reading: nothing until the mode's fields are started, then the engine's reading or its refusal. */
  const view: View = useMemo(() => {
    if (mode === "cost" && links.trim() === "") return null; // no speed yet
    if (mode === "adjacency" && blank(sideA) && blank(sideB)) return null; // nothing typed yet
    try {
      return { ok: true, data: inPageLanguage(runLocalisable(requestOf(state)), tx) as OspfResult }; // the reading, in the page's language
    } catch (e) {
      return { ok: false, message: tx.error(e) }; // the refusal's sentence in the page's language
    } // computed
  }, [mode, links, sideA, sideB, state, tx]); // recomputed on any field

  // An arriving share link: the mode and its fields are set as typing would set them.
  useShareArrival(OSPF_SHARE, (s) => {
    setMode(s.mode); // the mode
    if (s.mode === "cost") { setVendor(s.vendor); setReference(s.reference); setLinks(s.links); } // cost
    else { setVersion(s.version); setSameKey(s.sameKey); setSideA({ ...s.a }); setSideB({ ...s.b }); } // adjacency
  });
  // What Share results carries: the mode's fields, once the page has a reading (memoised).
  const share = useMemo(() => encodeOspfShare(state, !!view?.ok), [state, view]); // the encoding

  /** Fill an adjacency request into the form. */
  const fillAdjacency = (r: { version: string; sameKey: string; a: Readonly<Record<string, string>>; b: Readonly<Record<string, string>> }) => {
    setVersion(r.version === "3" ? "3" : "2"); setSameKey(r.sameKey !== "false"); setSideA(formOf(r.a)); setSideB(formOf(r.b)); // the fields
  }; // fillAdjacency
  /** Fill the mode shown with its Example (verbatim from the golden vectors: the course's OSPF lab). */
  const loadExample = () => {
    if (mode === "cost") { const ex = EXAMPLE_COST_REQUEST; setVendor(ex.vendor); setReference(ex.reference); setLinks(ex.links); } // the cost Example
    else fillAdjacency(EXAMPLE_ADJACENCY_REQUEST); // the adjacency Example
  }; // loadExample
  /** Empty the mode shown. */
  const clearAll = () => {
    if (mode === "cost") { setReference(""); setLinks(""); } // cost: the vendor stays
    else { setSameKey(true); setSideA({ ...BLANK_SIDE }); setSideB({ ...BLANK_SIDE }); } // adjacency: the version stays
  }; // clearAll
  /** Change the version, dropping the address and any kind the other version lacks. */
  const changeVersion = (v: "2" | "3") => {
    setVersion(v); // the version
    const fit = (s: SideForm): SideForm => ({ ...s, address: v === "3" ? "" : s.address, auth: AUTH_BY_VERSION[v].includes(s.auth) ? s.auth : "none", keyId: AUTH_BY_VERSION[v].includes(s.auth) ? s.keyId : "" }); // the version's fields
    setSideA(fit); setSideB(fit); // both sides
  }; // changeVersion

  // ---- Numbers in the page's language, exactly. ----
  /** The page's decimal sign. */
  const decimalSign = useMemo(() => new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === "decimal")?.value ?? ".", [locale]); // "." or ","
  /** An exact decimal or fraction from the engine with the page's grouping and decimal sign. */
  const num = (s: string): string => {
    if (s.includes("/")) return s.split("/").map((x) => new Intl.NumberFormat(locale).format(BigInt(x))).join(" / "); // a fraction: each part grouped
    const [int, frac] = s.split("."); // the integer and the fraction
    const grouped = new Intl.NumberFormat(locale).format(BigInt(int)); // grouped exactly
    return frac ? `${grouped}${decimalSign}${frac}` : grouped; // with the page's sign
  }; // num
  /** A bandwidth label from the engine ("2.5 Gbit/s") with the page's decimal sign. */
  const bw = (label: string): string => label.replace(".", decimalSign); // one decimal point at most

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
        <li>{t.rich("learn", { a: (chunks: ReactNode) => <Link href="/learn/ospf-primer" className="tool-sources-link">{chunks}</Link> })}</li>
      </ul>
    </section>
  ); // notesPanel

  /** The share row (under the verdict); the caution line only where Router IDs and addresses travel. */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} details={mode === "adjacency" ? [t("share.caution")] : []} title={t("name")} />
    </div>
  ); // shareRow

  /** A warnings box, when there are any. */
  const warningsBox = (ws: string[]) => (ws.length > 0 && (
    <div className="tcl-verdict tcl-verdict-warn" role="status">
      <ul>{ws.map((w, i) => <li key={i}>{w}</li>)}</ul>
    </div>
  )); // warningsBox

  /** One interface's cost cell. */
  const costCell = (l: LinkCost): string => (l.cost !== null ? num(String(l.cost)) : l.range ? t("cost.range", { low: num(String(l.range[0])), high: num(String(l.range[1])) }) : t("cost.none")); // a number, two numbers, or none

  /** The cost reading. */
  const costView = (r: CostResult) => (
    <div className="jwt-results">
      <div className={`tcl-verdict ${r.allDistinct === true ? "tcl-verdict-ok" : "tcl-verdict-warn"}`} role="status">
        <p>{r.verdictText}</p>
      </div>
      {shareRow}
      {warningsBox(r.warnings)}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("cost.tableHeading", { vendor: t(`vendor.${r.vendor}`) })}</h4>
        {r.reference && (
          <div className="jwt-claims">
            {row(t("cost.reference"), r.reference.isDefault ? t("cost.referenceDefault", { value: bw(r.reference.label) }) : bw(r.reference.label), "ref")}
          </div>
        )}
        {/* A reference vendor with no reference in use: Arista EOS while auto-cost reference-bandwidth is not configured. */}
        {r.kind === "reference" && !r.reference && (
          <div className="jwt-claims">
            {row(t("cost.reference"), t("cost.referenceUnset"), "ref", false)}
          </div>
        )}
        <div className="cidr-table-wrap">
          <table className="cidr-table ccb-path ospf-cost-table">
            <thead>
              <tr>
                <th scope="col">{t("col.speed")}</th>
                {r.reference && <th scope="col">{t("col.quotient")}</th>}
                <th scope="col">{t("col.cost")}</th>
              </tr>
            </thead>
            <tbody>
              {r.links.map((l) => (
                <tr key={l.index}>
                  {/* The speed on one unbroken line (json-stat), and how its cost was found under it: three columns fit a phone. */}
                  <td><span className="json-stat mono">{bw(l.label)}</span><br /><span className="hmac-build-note">{t(`basis.${l.basis}`)}</span></td>
                  {r.reference && <td className="mono">{l.quotient !== null ? num(l.quotient) : ""}</td>}
                  <td className="mono"><strong>{costCell(l)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {r.smallest && (
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("cost.smallestHeading")}</h4>
          <div className="jwt-claims">
            {row(t("cost.smallestValue"), bw(r.smallest.label), "value")}
            {row(t("cost.smallestCosts"), r.smallest.costs.map((c, i) => t("cost.speedCost", { speed: bw(r.links[i].label), cost: num(String(c)) })).join("; "), "costs", false)}
            {row(t("cost.command"), r.smallest.command, "command")}
          </div>
        </section>
      )}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("cost.commandsHeading")}</h4>
        <div className="jwt-claims">
          {COMMANDS[r.vendor].reference && row(t("cost.refCommand"), COMMANDS[r.vendor].reference, "refcmd")}
          {r.costCommand && row(t("cost.costCommand"), r.costCommand, "costcmd")}
        </div>
      </section>
      {notesPanel(r.notes)}
    </div>
  ); // costView

  /** Who drops what, in words. */
  const drops = (f: Finding, r: AdjacencyResult): string => {
    if (f.stage === "routing" || (!f.dropsAtA && !f.dropsAtB)) return t("drops.none"); // nothing dropped
    if (f.dropsAtA && f.dropsAtB) return t(f.stage === "hello" ? "drops.both" : "drops.bothDd"); // both
    const [rx, txr] = f.dropsAtA ? [r.a.name, r.b.name] : [r.b.name, r.a.name]; // receiver and sender
    return t(f.stage === "hello" ? "drops.one" : "drops.oneDd", { receiver: rx, sender: txr }); // one side
  }; // drops

  /** The adjacency reading. */
  const adjacencyView = (r: AdjacencyResult) => (
    <div className="jwt-results">
      <div className={`tcl-verdict ${r.outcome === "full" ? "tcl-verdict-ok" : r.outcome === "full-unused" ? "tcl-verdict-warn" : "tcl-verdict-bad"}`} role="status">
        <p>{r.verdictText}</p>
      </div>
      {shareRow}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("view.heading")}</h4>
        <div className="jwt-claims">
          {row(t("view.sees", { me: r.a.name, other: r.b.name }), t(`state.${r.viewA === "ExStart or Exchange" ? "either" : r.viewA === "2-Way" ? "twoWay" : r.viewA}`), "a", false)}
          {row(t("view.sees", { me: r.b.name, other: r.a.name }), t(`state.${r.viewB === "ExStart or Exchange" ? "either" : r.viewB === "2-Way" ? "twoWay" : r.viewB}`), "b", false)}
        </div>
      </section>
      {r.findings.length > 0 && (
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("findings.heading", { n: r.findings.length })}</h4>
          <ol className="lab-steps">
            {r.findings.map((f, i) => (
              <li key={i}>
                {/* The engine's sentence names the field itself ("HelloInterval: ..."), so no title repeats it. */}
                {f.text}
                <br />
                <span className="hmac-build-note">{f.reached ? drops(f, r) : t("notReached")}</span>
                {f.vendor.length > 0 && (
                  <ul>
                    {f.vendor.map((v, j) => <li key={j}>{v}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
      {warningsBox(r.warnings)}
      {notesPanel(r.notes)}
    </div>
  ); // adjacencyView

  /** A seg button. */
  const segBtn = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" className={`seg-btn${active ? " seg-btn--active" : ""}`} aria-pressed={active} onClick={onClick}>{label}</button>
  ); // segBtn

  const rule = VENDORS[vendor]; // the chosen vendor's rule
  const hasRef = rule.kind === "reference"; // whether a reference applies
  /** The fields that differ between A and B (after trimming), for the "differs" marks. */
  const differs = (k: keyof SideForm): boolean => !blank(sideA) && !blank(sideB) && sideA[k].trim() !== sideB[k].trim() && k !== "name" && k !== "routerId" && k !== "address"; // labels, IDs and addresses are meant to differ
  /** The rows of the side-by-side table, for the version shown. */
  const rows = SIDE_FIELDS.filter((k) => !(version === "3" && k === "address")); // OSPFv3 has no address field
  /** One cell of the side-by-side table. */
  const cell = (s: SideForm, set: (f: (p: SideForm) => SideForm) => void, id: "a" | "b", k: keyof SideForm) => {
    const name = `${id === "a" ? t("sideA") : t("sideB")}: ${t(`field.${k}`)}`; // the field's accessible name
    const choices = k === "auth" ? AUTH_BY_VERSION[version] : CHOICES[k]; // a chosen field's options
    return (
      <td>
        {choices ? (
          <select className="cidr-input" id={`ospf-${id}-${k}`} aria-label={name} value={s[k]} onChange={(e) => set((p) => ({ ...p, [k]: e.target.value }))}>
            {choices.map((c) => <option key={c} value={c}>{t(`opt.${k}.${c}`)}</option>)}
          </select>
        ) : (
          <input className="cidr-input mono" id={`ospf-${id}-${k}`} aria-label={name} value={s[k]} onChange={(e) => set((p) => ({ ...p, [k]: e.target.value }))} placeholder={t(id === "b" && (k === "name" || k === "routerId" || k === "address") ? `placeholder.${k}B` : `placeholder.${k}`)} autoComplete="off" spellCheck={false} maxLength={64} inputMode={["hello", "dead", "mtu", "keyId", "priority", "instance"].includes(k) ? "numeric" : undefined} />
        )}
      </td>
    );
  }; // cell

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode switch. */}
      <div className="seg-group" role="group" aria-label={t("modeLabel")}>
        <div className="seg">
          {(["cost", "adjacency"] as const).map((m) => segBtn(mode === m, t(`mode.${m}`), () => setMode(m), m))}
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

        {/* Cost: the vendor, the reference (when it has one) and the speeds. */}
        {mode === "cost" && (
          <>
            <div className="bb-fields">
              <div className="bb-field">
                <label className="cidr-label" htmlFor="ospf-vendor">{t("vendorLabel")}</label>
                <select id="ospf-vendor" className="cidr-input" value={vendor} onChange={(e) => { setVendor(e.target.value as VendorId); if (VENDORS[e.target.value as VendorId].kind !== "reference") setReference(""); }} aria-describedby="ospf-vendor-hint">
                  {VENDOR_ORDER.map((v) => <option key={v} value={v}>{t(`vendor.${v}`)}</option>)}
                </select>
              </div>
              <div className="bb-field">
                <label className="cidr-label" htmlFor="ospf-reference">{t("referenceLabel")}</label>
                <input id="ospf-reference" className="cidr-input mono" value={reference} onChange={(e) => setReference(e.target.value)} disabled={!hasRef} placeholder={rule.kind === "reference" ? (rule.unsetCost !== null ? t("referencePlaceholder.unset") : t(`referencePlaceholder.${rule.bareUnit}`)) : t("referenceNone")} autoComplete="off" spellCheck={false} maxLength={64} aria-describedby="ospf-vendor-hint" />
              </div>
              <div className="bb-field">
                <label className="cidr-label" htmlFor="ospf-links">{t("linksLabel")}</label>
                <input id="ospf-links" className="cidr-input mono" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="100M, 1G, 10G" autoComplete="off" spellCheck={false} maxLength={200} aria-describedby="ospf-links-hint" />
              </div>
            </div>
            <div className="tcl-presets-row" role="group" aria-label={t("chipsLabel")}>
              {COST_SPEED_CHIPS.map((c) => (
                <button key={c} type="button" className="tcl-chip" aria-pressed={links === c} onClick={() => setLinks(c)}>{c}</button>
              ))}
            </div>
            <p id="ospf-vendor-hint" className="hmac-build-note">
              {/* Each vendor's own hint: its default reference, Arista's "not configured", a table, or no default. */}
              {rule.kind === "reference" ? (rule.unsetCost !== null ? t("hint.reference.unset", { vendor: t(`vendor.${vendor}`), cost: rule.unsetCost }) : t(`hint.reference.${rule.bareUnit}`, { vendor: t(`vendor.${vendor}`), def: bw(bandwidthLabel(rule.defaultBps)) })) : rule.kind === "table" ? t("hint.table", { vendor: t(`vendor.${vendor}`) }) : t(`hint.unknown.${rule.reason}`, { vendor: t(`vendor.${vendor}`) })}
            </p>
            <p id="ospf-links-hint" className="hmac-build-note">{t("linksHint")}</p>
          </>
        )}

        {/* Adjacency: the version and the key switch, the chips, then both sides field by field. */}
        {mode === "adjacency" && (
          <>
            <div className="dcb-segs">
              <div className="dcb-seg">
                <span className="cidr-label">{t("versionLabel")}</span>
                <div className="seg" role="group" aria-label={t("versionLabel")}>
                  {(["2", "3"] as const).map((v) => segBtn(version === v, t(`version.${v}`), () => changeVersion(v), v))}
                </div>
              </div>
              <div className="dcb-seg">
                <span className="cidr-label">{t("sameKeyLabel")}</span>
                <div className="seg" role="group" aria-label={t("sameKeyLabel")}>
                  {segBtn(sameKey, t("sameKey.yes"), () => setSameKey(true), "yes")}
                  {segBtn(!sameKey, t("sameKey.no"), () => setSameKey(false), "no")}
                </div>
              </div>
            </div>
            <div className="tcl-presets-row" role="group" aria-label={t("scenariosLabel")}>
              {SCENARIO_ORDER.map((k) => (
                <button key={k} type="button" className="tcl-chip" onClick={() => fillAdjacency(k === "hello" ? EXAMPLE_ADJACENCY_REQUEST : ADJACENCY_SCENARIOS[k])}>{t(`scenario.${k}`)}</button>
              ))}
            </div>
            <div className="cidr-table-wrap">
              {/* bfd-timers-table: the field names wrap and the inputs shrink, so both routers fit a phone. */}
              <table className="cidr-table bfd-timers-table">
                <thead>
                  <tr>
                    <th scope="col">{t("fieldCol")}</th>
                    <th scope="col">{t("sideA")}</th>
                    <th scope="col">{t("sideB")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((k) => (
                    <tr key={k}>
                      <th scope="row">
                        {t(`field.${k}`)}
                        {differs(k) && <><br /><span className="hmac-build-note">{t("differs")}</span></>}
                      </th>
                      {cell(sideA, setSideA, "a", k)}
                      {cell(sideB, setSideB, "b", k)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hmac-build-note">{t(`tableHint.v${version}`)}</p>
            <p className="hmac-build-note">{t("sameKeyHint")}</p>
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
      {view && view.ok && (view.data.mode === "cost" ? costView(view.data) : adjacencyView(view.data))}
    </div>
  );
} // OspfCostAndAdjacencyCheckerTool
