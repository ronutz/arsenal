"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/RadiusPacketDecoderTool.tsx
// ----------------------------------------------------------------------------
// UI for the RADIUS packet decoder (08/11/2026). One box: the hex of a RADIUS
// packet as a capture shows it (plain hex, separated bytes, or a hex dump with
// offsets); a switch reads attributes only, without the 20-octet header. The
// reading: the header (Code with IANA's name, Identifier, Length checked
// against the octets given, the Authenticator and what it is), the warnings,
// every attribute as type, length and value in its RFC 8044 data type, with
// vendors, extended attributes, TLVs and hidden values explained, the EAP
// packet inside EAP-Message, and the notes. Below everything, a short sourced
// comparison of RADIUS and TACACS+ (RFC 2865, 2866 and RFC 8907), always shown.
// D-83 Example/Clear row: the Example is RFC 2865 section 7.1's Access-Request,
// verbatim from a golden vector (EXAMPLE_INPUT); the sample chips are golden
// vector inputs too. Existing class vocabulary only (cidr-*, seg-*, dig-input-*,
// jwt-*, tcl-*, mono, rdap-ask-row, b64-copy, cidr-badge,
// hmac-build-note, json-error-*, ztc-empty, tool-sources-link). All compute is
// local, and no shared secret is ever asked for.
//
// PAGE LANGUAGE. The reading comes from runLocalisable() (every sentence an
// EngineText) and is put into the page's language by inPageLanguage(); input
// errors through engineTexts().error. IANA's and the vendors' names are shown
// as published, in English, and marked lang="en" so a screen reader on the
// Portuguese page reads them in English (WCAG 3.1.2).
//
// HUAWEI'S HW-DHCP-Option (2011, 158) is listed option by option, Option 82's
// sub-options by name (RFC 3046), under the sub-attribute's octets.
//
// SHARE RESULTS (posture "derived" since 2026-11-08b). Under the headline, a
// button builds a link, only while there is a reading, that carries a copy of
// the packet with every hidden password and key, challenge response,
// Message-Authenticator and secret-keyed Authenticator replaced by zero octets
// of the same length (shareableCopy in compute.ts), with redacted=1; the box
// goes as typed when it is an RFC's published example or nothing needs
// zeroing (src/lib/tools/radius-packet-decoder/share.ts). The popover says how
// many fields are zeroed. An arriving link fills the box and the mode as a
// paste would (useShareArrival); while the box still holds the arrived copy,
// the reading marks each zeroed field "redacted in this link".
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state, memoised reading, rich-text chunks
import { useTranslations } from "next-intl"; // messages
import { Link } from "@/i18n/navigation"; // locale-aware links to the Learn articles
import { runLocalisable, shareableCopy, type DecodeMode, type DecodeResult, type DecodedAttribute, type EapReading, type PacketHeader, type ShareableCopy } from "@/lib/tools/radius-packet-decoder/compute"; // the engine, sentences with ids, and the shared copy
import { EXAMPLE_INPUT, SAMPLES } from "@/lib/tools/radius-packet-decoder/examples"; // the Example and the chips, the same strings the golden vectors pin
import { engineTexts, type EngineTextCarrier } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { RADIUS_SHARE, encodeRadiusShare } from "@/lib/tools/radius-packet-decoder/share"; // this tool's share spec
import type { ShareEncoding } from "@/lib/share/spec"; // the encoding type

/** What the page shows: nothing yet, a reading, or a refusal (its sentence, and its id). */
type View = null | { ok: true; data: DecodeResult } | { ok: false; message: string; id: string }; // the computed state

/** Nothing to share (a module constant, so the memo below stays stable). */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the button is disabled

/** The rows of the comparison panel, in order (each has a radius and a tacacs message). */
const COMPARE_ROWS = ["transport", "protected", "aaa", "use", "tls", "status"] as const; // the six aspects

/**
 * Text as the page shows it: control characters (which a text value may carry) written as \xNN so they are visible.
 * @param s the text
 * @returns the visible text
 */
function visible(s: string): string {
  return s.replace(/[\u0000-\u001f\u007f]/g, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`); // escaped
} // visible

/**
 * Hex in groups of two digits, for reading (the cell wraps it anywhere).
 * @param h lower-case hex without separators
 * @returns the grouped hex
 */
const grouped = (h: string): string => (h.match(/../g) ?? []).join(" "); // "6e 65 6d 6f"

export default function RadiusPacketDecoderTool() {
  const t = useTranslations("tools.radius-packet-decoder"); // this tool's messages
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language
  const [input, setInput] = useState(""); // the box, as typed
  const [mode, setMode] = useState<DecodeMode>("packet"); // a packet, or attributes only
  const [arrived, setArrived] = useState<{ input: string; mode: DecodeMode } | null>(null); // the zeroed copy a link brought, while the box holds it

  /** True while the box still holds the zeroed copy an arriving link brought (any edit, Example, chip or Clear ends it). */
  const redacted = arrived !== null && arrived.input === input && arrived.mode === mode; // the reading marks the zeroed fields

  /** The reading: nothing while the box is blank, then the engine's reading or its refusal. */
  const view: View = useMemo(() => {
    if (input.trim() === "") return null; // nothing typed
    try {
      return { ok: true, data: inPageLanguage(runLocalisable({ input, mode, redacted }), tx) as DecodeResult }; // the reading, in the page's language
    } catch (e) {
      const id = (e as EngineTextCarrier | null)?.engineText?.id ?? ""; // the refusal's id
      return { ok: false, message: tx.error(e), id }; // its sentence in the page's language
    } // computed
  }, [input, mode, redacted, tx]); // recomputed on every keystroke (a packet is at most 4096 octets)

  // An arriving share link: the box and the mode are set as a paste would set them; a zeroed copy is remembered.
  useShareArrival(RADIUS_SHARE, (s) => { setInput(s.input); setMode(s.mode); setArrived(s.redacted ? { input: s.input, mode: s.mode } : null); }); // fill only: the page decodes
  /** The copy Share results would carry, once there is a reading (the engine zeroes the hidden fields). */
  const copy = useMemo<ShareableCopy | null>(() => (view?.ok ? shareableCopy({ input, mode }) : null), [view, input, mode]); // memoised
  // What Share results carries: the copy (and the mode), once there is a reading.
  const share = useMemo<ShareEncoding>(() => (copy ? encodeRadiusShare({ input, mode }, copy) : NOTHING), [copy, input, mode]); // memoised
  /** The popover's line on the copy: an RFC example or nothing to zero (as typed), or how many fields are zeroed. */
  const copyLine = copy === null ? "" : copy.reason === "example" ? t("share.copyExample") : copy.reason === "nothing" ? t("share.copyNothing") : t("share.copyZeroed", { n: copy.fields.length }); // one sentence

  /** Put a text and a mode in the box (Example, chips, Clear). */
  const fill = (s: string, m: DecodeMode) => { setInput(s); setMode(m); }; // both at once

  /** One label and value row (the value is a div, since some values hold blocks). */
  const row = (label: string, value: ReactNode, key: string) => (
    <div className="jwt-claim-row" key={key}>
      <span className="jwt-claim-label">{label}</span>
      <div className="jwt-claim-value">{value}</div>
    </div>
  ); // row

  /** A name IANA or a vendor publishes, marked as English. */
  const en = (s: string) => <span lang="en">{s}</span>; // WCAG 3.1.2

  /** The share row (under the headline). */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton
        encoding={share}
        carries={t("share.carries")}
        details={copyLine ? [copyLine, t("share.caution")] : [t("share.caution")]}
        title={t("name")}
      />
    </div>
  ); // shareRow

  /** The header panel of a packet. */
  const headerPanel = (h: PacketHeader, octets: number, padding: number) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("header.heading")}</h4>
      <div className="jwt-claims">
        {row(t("header.code"), <>{h.codeName ? en(h.codeName) : <span className="hmac-build-note">{t(`codeRow.${h.codeRow}`)}</span>} <span className="mono">({h.code})</span></>, "code")}
        {row(t("header.identifier"), <span className="mono">{h.identifier}</span>, "id")}
        {row(t("header.length"), <><span className="mono">{h.length}</span> <span className="hmac-build-note">{padding > 0 ? t("header.lengthPadding", { octets, padding }) : t("header.lengthOk", { octets })}</span></>, "len")}
        {row(t("header.authenticator"), <><span className="mono">{grouped(h.authenticator)}</span>{h.authenticatorRedacted && <> <span className="cidr-badge cidr-badge--contains">{t("redactedBadge")}</span></>}<br /><span className="hmac-build-note">{t(`auth.${h.authenticatorKind}`)}</span></>, "auth")}
      </div>
    </section>
  ); // headerPanel

  /** The value cell of one attribute. */
  const valueCell = (a: DecodedAttribute) => (
    <>
      {a.invalid && <p className="json-error-message">{t("invalidLabel")} {a.invalid}</p>}
      {a.value !== null && <div className="mono">{a.dataType === "text" || a.dataType === "string" || a.dataType === "concat" || a.dataType === null ? `"${visible(a.value)}"` : visible(a.value)}{a.valueName && <> <span className="hmac-build-note">{en(a.valueName)}</span></>}</div>}
      {a.vendor && (
        <div>
          {t("vendor.line", { id: a.vendor.id })}{a.vendor.name ? <>: {en(a.vendor.name)}</> : null}
          {a.vendor.subs.length > 0 && (
            <ul>
              {a.vendor.subs.map((s, i) => (
                <li key={i}>
                  {s.name ? en(s.name) : t("sub.unnamed")} <span className="mono">({s.type})</span>{s.value !== null && <>: <span className="mono">{s.dataType === "integer" || s.dataType === "ipv4addr" || s.dataType === "ipaddr" ? visible(s.value) : `"${visible(s.value)}"`}</span></>}
                  <br /><span className="hmac-build-note mono">{grouped(s.hex)}</span>
                  {s.dhcp && (
                    <ul>
                      {s.dhcp.map((o, k) => (
                        <li key={k}>
                          {t("dhcp.option", { code: o.code, length: o.length })}{o.name && <>: {en(o.name)}</>}
                          {o.subs ? (
                            <ul>{o.subs.map((x, m) => <li key={m}>{x.name ? en(x.name) : t("dhcp.subUnnamed")} <span className="mono">({x.code})</span>, {t("dhcp.length", { length: x.length })}{x.text !== null ? <>: <span className="mono">&quot;{x.text}&quot;</span></> : x.hex !== "" ? <>: <span className="mono">{grouped(x.hex)}</span></> : null}</li>)}</ul>
                          ) : o.hex !== "" && <>: <span className="mono">{grouped(o.hex)}</span></>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.notes.map((n, k) => <span key={k} className="hmac-build-note"><br />{n}</span>)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {a.extended && <div className="hmac-build-note">{t("ext.line", { ext: a.extended.extType, container: a.extended.container })}{a.extended.more !== null && <> {t("ext.flags", { m: Number(a.extended.more), t: Number(a.extended.truncation) })}</>}</div>}
      {a.tlvs && (
        <ul>
          {a.tlvs.map((x, i) => <li key={i}>{t("tlv.line", { type: x.type, length: x.length })}: <span className="mono">{x.text !== null ? `"${x.text}"` : grouped(x.hex)}</span></li>)}
        </ul>
      )}
      {a.hex !== "" && a.vendor === null && <div className="hmac-build-note mono">{grouped(a.hex)}</div>}
      {a.notes.map((n, i) => <p key={i} className="hmac-build-note">{n}</p>)}
    </>
  ); // valueCell

  /** The attributes: one label/value row each (label above value on a phone, side by side on a wide screen). */
  const attributesTable = (attrs: readonly DecodedAttribute[]) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("attrs.heading", { n: attrs.length })}</h4>
      {attrs.length === 0 ? <p className="hmac-build-note">{t("attrs.none")}</p> : (
        <div className="jwt-claims">
          {attrs.map((a) => (
            <div className="jwt-claim-row" key={a.index}>
              <div className="jwt-claim-label">
                <strong>{a.index}. {a.name ? en(a.name) : t("unnamed")}</strong> <span className="mono">({a.id})</span>{a.redacted && <> <span className="cidr-badge cidr-badge--contains">{t("redactedBadge")}</span></>}
                <div className="hmac-build-note">{a.fragmentOf !== null ? t("meta.fragment", { offset: a.offset, length: a.length }) : t("meta.line", { dataType: a.dataType ?? "-", offset: a.offset, length: a.length })}{a.tag !== null && t("meta.tag", { tag: a.tag })}</div>
              </div>
              <div className="jwt-claim-value">{valueCell(a)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  ); // attributesTable

  /** The EAP panel. */
  const eapPanel = (e: EapReading) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("eap.heading", { n: e.attributes })}</h4>
      <div className="jwt-claims">
        {e.code !== null && row(t("eap.code"), <>{e.codeName ? en(e.codeName) : t("eap.unassigned")} <span className="mono">({e.code})</span></>, "code")}
        {e.identifier !== null && row(t("eap.identifier"), <span className="mono">{e.identifier}</span>, "id")}
        {e.length !== null && row(t("eap.length"), <span className="mono">{e.length}</span>, "len")}
        {e.type !== null && row(t("eap.type"), <>{e.typeName ? en(e.typeName) : t("eap.unassigned")} <span className="mono">({e.type})</span></>, "type")}
        {e.identity !== null && row(t("eap.identity"), <span className="mono">&quot;{visible(e.identity)}&quot;</span>, "identity")}
        {row(t("eap.octets"), <span className="mono">{grouped(e.hex)}</span>, "hex")}
      </div>
    </section>
  ); // eapPanel

  /** The headline, the warnings and the share row. */
  const top = (d: DecodeResult) => (
    <>
      <div className="tcl-verdict tcl-verdict-ok" role="status">
        <p>{d.mode === "packet" ? t.rich("headline.packet", { name: d.header.codeName ?? t(`codeRow.${d.header.codeRow}`), code: d.header.code, id: d.header.identifier, length: d.header.length, n: d.attributes.length, b: (c) => <strong lang="en">{c}</strong> }) : t("headline.attributes", { octets: d.octets, n: d.attributes.length })}</p>
        {(d.attributes.some((a) => a.redacted) || (d.mode === "packet" && (d.header.authenticatorRedacted || d.paddingRedacted))) && <p className="hmac-build-note">{t("redactedNotice")}</p>}
      </div>
      {d.warnings.length > 0 && (
        <div className="tcl-verdict tcl-verdict-warn" role="status">
          <ul>{d.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}
      {shareRow}
    </>
  ); // top

  /** The notes panel, with the Learn articles. */
  const notesPanel = (notes: readonly string[]) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
        <li>{t("noSecret")}</li>
        <li>{t.rich("learn", { r: (c: ReactNode) => <Link href="/learn/radius-end-to-end" className="tool-sources-link">{c}</Link>, x: (c: ReactNode) => <Link href="/learn/tacacs-plus-device-administration" className="tool-sources-link">{c}</Link> })}</li>
      </ul>
    </section>
  ); // notesPanel

  /** The comparison panel: always shown, below the reading. */
  const comparePanel = (
    <section className="jwt-panel" aria-labelledby="rpd-compare">
      <h4 className="jwt-panel-title" id="rpd-compare">{t("compare.heading")}</h4>
      <p className="hmac-build-note">{t("compare.intro")}</p>
      <div className="jwt-claims">
        {COMPARE_ROWS.map((k) => (
          <div className="jwt-claim-row" key={k}>
            <div className="jwt-claim-label">{t(`compare.${k}.label`)}</div>
            <div className="jwt-claim-value">
              <p><strong>RADIUS</strong>: {t(`compare.${k}.radius`)}</p>
              <p><strong>TACACS+</strong>: {t(`compare.${k}.tacacs`)}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="hmac-build-note">{t("compare.sources")}</p>
    </section>
  ); // comparePanel

  /** The reading. */
  const reading = (d: DecodeResult) => (
    <div className="jwt-results">
      {top(d)}
      {d.mode === "packet" && headerPanel(d.header, d.octets, d.padding)}
      {attributesTable(d.attributes)}
      {d.eap && eapPanel(d.eap)}
      {notesPanel(d.notes)}
    </div>
  ); // reading

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode switch: a whole packet, or attributes only. */}
      <div className="seg-group" role="group" aria-label={t("modeLabel")}>
        <div className="seg">
          {(["packet", "attributes"] as const).map((m) => (
            <button key={m} type="button" className={`seg-btn${mode === m ? " seg-btn--active" : ""}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
              {t(`mode.${m}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="rpd-input">{mode === "packet" ? t("inputLabel") : t("inputLabelAttributes")}</label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the Example is verbatim from a golden vector. */}
            <button type="button" className="b64-copy" onClick={() => fill(EXAMPLE_INPUT, "packet")}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => fill("", mode)}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="rpd-input" className="cidr-input mono" rows={5} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("placeholder")} autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={24000} aria-describedby="rpd-hint" />
        {/* Samples as compact chips: the RFCs' own packets, the course lab and one refusal. */}
        <div className="tcl-presets-row" role="group" aria-label={t("samplesLabel")}>
          {SAMPLES.map(([id, hex, m]) => (
            <button key={id} type="button" className="tcl-chip" aria-pressed={input === hex && mode === m} onClick={() => fill(hex, m)}>{t(`chip.${id}`)}</button>
          ))}
        </div>
        <p id="rpd-hint" className="hmac-build-note">{t("inputHint")}</p>
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
      {!view && <p className="ztc-empty">{t("empty")}</p>}

      {/* The reading. */}
      {view && view.ok && reading(view.data)}

      {/* RADIUS and TACACS+ side by side (RFC 2865, 2866, 8907), whatever the box holds. */}
      {comparePanel}
    </div>
  );
} // RadiusPacketDecoderTool
