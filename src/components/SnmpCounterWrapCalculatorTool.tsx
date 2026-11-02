"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/SnmpCounterWrapCalculatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the SNMP interface counter wrap and rate calculator (02/11/2026).
// Two modes on one form:
//   Wrap time   counter (Counter32/Counter64), what it counts, the interface
//               speed (typed, or one of seven presets), the utilisation and
//               the poll interval -> the time between wraps at that load and
//               at line rate, the longest poll interval that cannot miss a
//               wrap and the tool's margin, a verdict on the interval, and
//               what RFC 2863 requires at that speed;
//   Rate        two readings of one counter (value and time, in seconds or
//               sysUpTime ticks) -> the delta with one wrap allowed, the rate,
//               and, with the interface speed, whether it can be trusted.
// D-83 Example/Clear row: each mode's Example is verbatim from a golden vector
// (EXAMPLE_WRAP_REQUEST and EXAMPLE_RATE_REQUEST). Existing class vocabulary
// only (seg-*, dcb-segs, bb-fields, cidr-*, jwt-*, tcl-verdict-*, rdap-ask-row,
// cipher-note, hmac-build-note, ztc-empty). All compute is local.
//
// PAGE LANGUAGE. The reading comes from runLocalisable() (every sentence an
// EngineText) and is put into the page's language by inPageLanguage(); input
// errors through engineTexts().error. Numbers are never inside a sentence: the
// engine returns them as exact decimal text with "." as the point, and this
// component prints them in the page's number format (Intl.NumberFormat), with
// durations in words from the pack (dur.*).
//
// SHARE RESULTS. Under the verdict, a button builds a link that carries the
// mode, the counter and the mode's fields as typed (a form: named values only,
// src/lib/tools/snmp-counter-wrap-calculator/share.ts). An arriving link
// (useShareArrival) sets them as typing would; the other mode keeps its values.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state, memoised readings, rich-text chunks
import { useLocale, useTranslations } from "next-intl"; // messages and the active locale
import { Link } from "@/i18n/navigation"; // the locale-aware link to the Learn article
import { runLocalisable, SPEED_PRESETS, MAX_FIELD, type CounterResult, type WrapResult, type RateResult } from "@/lib/tools/snmp-counter-wrap-calculator/compute"; // the engine, sentences with ids, and the field bound (144: a pasted snmpget line fits)
import { EXAMPLE_WRAP_REQUEST, EXAMPLE_RATE_REQUEST } from "@/lib/tools/snmp-counter-wrap-calculator/examples"; // the Examples, the same objects the golden vectors pin
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { SNMP_COUNTER_SHARE, encodeSnmpCounterShare, requestOf, type SnmpCounterShareState } from "@/lib/tools/snmp-counter-wrap-calculator/share"; // this tool's share spec

/** The two modes. */
type Mode = "wrap" | "rate"; // wrap time, or rate from two readings

/** What the page shows: nothing yet, a reading, or a refusal in the page's language. */
type View = null | { ok: true; data: CounterResult } | { ok: false; message: string }; // the computed state

/** The verdict box's class for each verdict (ok, warn or bad). */
const VERDICT_CLASS: Readonly<Record<string, string>> = {
  safe: "tcl-verdict-ok", // cannot miss a wrap, with margin
  "no-margin": "tcl-verdict-warn", // no margin for a lost poll
  burst: "tcl-verdict-warn", // fine at the load, not at line rate
  wraps: "tcl-verdict-bad", // goes round between polls
  ok: "tcl-verdict-ok", // a usable rate
  "ok-unchecked": "tcl-verdict-ok", // usable, unchecked
  wrapped: "tcl-verdict-warn", // one wrap assumed
  unreliable: "tcl-verdict-bad", // a full cycle was possible
  impossible: "tcl-verdict-bad", // the readings do not belong together
}; // by verdict

/** Seconds in a year of 365.25 days (the unit the page uses for very long wrap times; a convention, stated in the docs). */
const YEAR_SECONDS = 31_557_600; // 365.25 x 86,400

export default function SnmpCounterWrapCalculatorTool() {
  const t = useTranslations("tools.snmp-counter-wrap-calculator"); // this tool's messages
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language
  const locale = useLocale(); // the page's language, for numbers
  // ---- The form (both modes share the counter and the speed). ----
  const [mode, setMode] = useState<Mode>("wrap"); // the mode shown
  const [width, setWidth] = useState<"32" | "64">("32"); // Counter32 by default: the one that wraps
  const [kind, setKind] = useState<"octets" | "packets">("octets"); // octets by default
  const [speed, setSpeed] = useState(""); // the interface speed, as typed
  const [utilisation, setUtilisation] = useState(""); // blank: 100 %
  const [poll, setPoll] = useState(""); // blank: no verdict
  const [packetSize, setPacketSize] = useState(""); // blank: 84 octets
  const [first, setFirst] = useState(""); // the first counter value
  const [second, setSecond] = useState(""); // the second counter value
  const [firstTime, setFirstTime] = useState(""); // the first reading's time
  const [secondTime, setSecondTime] = useState(""); // the second reading's time
  const [timeUnit, setTimeUnit] = useState<"s" | "ticks">("s"); // seconds by default

  /** The share state of the mode shown (the same shape the engine request is built from). */
  const state: SnmpCounterShareState = useMemo(() => (mode === "wrap"
    ? { mode, width, kind, packetSize, speed, utilisation, poll } // wrap time
    : { mode, width, kind, packetSize, first, second, firstTime, secondTime, timeUnit, speed }), // rate
  [mode, width, kind, packetSize, speed, utilisation, poll, first, second, firstTime, secondTime, timeUnit]); // the fields

  /** The reading: nothing until the mode's required fields are started, then the engine's reading or its refusal. */
  const view: View = useMemo(() => {
    if (mode === "wrap" && speed.trim() === "") return null; // no speed yet
    if (mode === "rate" && [first, second, firstTime, secondTime].every((x) => x.trim() === "")) return null; // no readings yet
    try {
      return { ok: true, data: inPageLanguage(runLocalisable(requestOf(state)), tx) as CounterResult }; // the reading, in the page's language
    } catch (e) {
      return { ok: false, message: tx.error(e) }; // the refusal's sentence in the page's language
    } // computed
  }, [mode, speed, first, second, firstTime, secondTime, state, tx]); // recomputed on any field

  // An arriving share link: the mode, the counter and the mode's fields are set as typing would set them.
  useShareArrival(SNMP_COUNTER_SHARE, (s) => {
    setMode(s.mode); setWidth(s.width); setKind(s.kind); setPacketSize(s.packetSize); setSpeed(s.speed); // the shared fields
    if (s.mode === "wrap") { setUtilisation(s.utilisation); setPoll(s.poll); } // wrap time
    else { setFirst(s.first); setSecond(s.second); setFirstTime(s.firstTime); setSecondTime(s.secondTime); setTimeUnit(s.timeUnit); } // rate
  });
  // What Share results carries: the mode's fields, once the page has a reading (memoised).
  const share = useMemo(() => encodeSnmpCounterShare(state, !!view?.ok), [state, view]); // the encoding

  /** Fill the mode shown with its Example (verbatim from the golden vectors). */
  const loadExample = () => {
    if (mode === "wrap") { // the wrap Example
      const ex = EXAMPLE_WRAP_REQUEST; // 10 Gb/s, 40 %, 300 s, Counter32 octets
      setWidth(ex.width); setKind(ex.kind); setSpeed(ex.speed); setUtilisation(ex.utilisation); setPoll(ex.poll); setPacketSize(""); // the fields
    } else { // the rate Example
      const ex = EXAMPLE_RATE_REQUEST; // two ifHCInOctets readings, sysUpTime ticks
      setWidth(ex.width); setKind(ex.kind); setFirst(ex.first); setSecond(ex.second); setFirstTime(ex.firstTime); setSecondTime(ex.secondTime); setTimeUnit(ex.timeUnit); setSpeed(ex.speed); setPacketSize(""); // the fields
    } // modes
  }; // loadExample
  /** Empty the mode shown (the counter choice stays). */
  const clearAll = () => {
    setSpeed(""); setPacketSize(""); // shared fields
    if (mode === "wrap") { setUtilisation(""); setPoll(""); } // wrap fields
    else { setFirst(""); setSecond(""); setFirstTime(""); setSecondTime(""); setTimeUnit("s"); } // rate fields
  }; // clearAll

  // ---- Number formatting in the page's language. ----
  /** A decimal text from the engine in the page's number format, at most `frac` decimals (big integers exactly). */
  const num = (s: string, frac = 3): string => {
    const [int] = s.replace("-", "").split("."); // the integer digits
    if (int.length > 15) return new Intl.NumberFormat(locale).format(BigInt(s.split(".")[0])); // past a double's exact range: the integer part, exactly
    return new Intl.NumberFormat(locale, { maximumFractionDigits: frac }).format(Number(s)); // grouped, the locale's decimal sign
  }; // num
  /** A figure with two decimals; one that rounds to zero but is not zero reads "< 0.01" rather than "0". */
  const twoPlaces = (c: string): string => (num(c, 2) === num("0") && /[1-9]/.test(c) ? `< ${num("0.01", 2)}` : num(c, 2)); // e.g. 34.92, or < 0.01
  /** A cycle count: "< 0.01" when the count is not zero but its share of 2^width rounds to zero (the engine prints six places). */
  const cycles = (c: string, count: string): string => (/[1-9]/.test(c) || count === "0" ? twoPlaces(c) : `< ${num("0.01", 2)}`); // a Counter64 reads < 0.01
  /** Three significant digits in the page's number format. */
  const sig3 = (x: number): string => new Intl.NumberFormat(locale, { maximumSignificantDigits: 3 }).format(x); // e.g. 8.59, 1,170
  /** A duration in words: milliseconds, seconds, minutes and seconds, hours and minutes, days and hours, or years. */
  const duration = (secondsText: string): string => {
    const s = Number(secondsText); // display precision is enough here; the exact text is shown beside it
    if (s < 1) return t("dur.ms", { n: sig3(s * 1000) }); // under a second
    if (s < 60) return t("dur.s", { n: sig3(s) }); // under a minute
    if (s < 3600) { const r = Math.round(s); return r % 60 ? t("dur.minSec", { m: Math.floor(r / 60), s: r % 60 }) : t("dur.min", { m: r / 60 }); } // under an hour: "5 min", not "5 min 0 s"
    if (s < 86400) { const r = Math.round(s / 60); return r % 60 ? t("dur.hMin", { h: Math.floor(r / 60), m: r % 60 }) : t("dur.h", { h: r / 60 }); } // under a day
    if (s < YEAR_SECONDS) { const r = Math.round(s / 3600); return r % 24 ? t("dur.daysH", { d: Math.floor(r / 24), h: r % 24 }) : t("dur.days", { d: r / 24 }); } // under a year
    return t("dur.years", { n: sig3(s / YEAR_SECONDS) }); // years of 365.25 days
  }; // duration
  /** A rate in bit/s with an SI prefix, three significant digits. */
  const bitRate = (bpsText: string): string => {
    const b = Number(bpsText); // display precision
    const [div, unit] = b >= 1e12 ? [1e12, "Tb/s"] : b >= 1e9 ? [1e9, "Gb/s"] : b >= 1e6 ? [1e6, "Mb/s"] : b >= 1e3 ? [1e3, "kb/s"] : [1, "bit/s"]; // the prefix
    return `${sig3(b / div)} ${unit}`; // e.g. 4 Gb/s
  }; // bitRate
  /** The unit word of the counter's kind, plural. */
  const unitWord = (k: "octets" | "packets"): string => t(`unit.${k}`); // octets / packets
  /** A count per second with its unit. */
  const perSecond = (k: "octets" | "packets", n: string): string => t(`unit.${k}PerSecond`, { n: num(n) }); // e.g. 500,000,000 octets/s
  /** A duration in words, with the exact seconds beside it. */
  const timed = (secondsText: string): ReactNode => (
    <>
      {duration(secondsText)} <span className="hmac-build-note">({t("dur.exact", { n: num(secondsText, 6) })})</span>
    </>
  ); // timed

  /** One label and value row. */
  const row = (label: string, value: ReactNode, key?: string) => (
    <div className="jwt-claim-row" key={key ?? label}>
      <span className="jwt-claim-label">{label}</span>
      <span className="jwt-claim-value mono">{value}</span>
    </div>
  ); // row

  /** The speed's own label for the wrap panel: a preset's name when it matches one, else the bit/s figure. */
  const speedName = (bps: string): string => SPEED_PRESETS.find((p) => p.bps.toString() === bps)?.label ?? bitRate(bps); // e.g. 10 Gb/s

  /** The notes panel, with the Learn article. */
  const notesPanel = (notes: string[]) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
        <li>{t.rich("learn", { a: (chunks: ReactNode) => <Link href="/learn/snmp-on-network-devices" className="tool-sources-link">{chunks}</Link> })}</li>
      </ul>
    </section>
  ); // notesPanel

  /** The RFC 2863 panel. */
  const rfcPanel = (r: NonNullable<RateResult["rfc2863"]>) => (
    <section className="jwt-panel">
      <h4 className="jwt-panel-title">{t("rfc.heading")}</h4>
      <div className="jwt-claims">
        {row(t("rfc.octets64"), r.octets64Required ? t("rfc.required") : t("rfc.notRequired"))}
        {row(t("rfc.packets64"), r.packets64Required ? t("rfc.required") : t("rfc.notRequired"))}
      </div>
      <p className="cipher-note">{r.quote}</p>
    </section>
  ); // rfcPanel

  /** The share row (under the verdict). */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
    </div>
  ); // shareRow

  /** The warnings box, when there are any. */
  const warningsBox = (warnings: string[]) => warnings.length > 0 && (
    <div className="tcl-verdict tcl-verdict-warn" role="status">
      <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
    </div>
  ); // warningsBox

  /** The wrap-mode reading. */
  const wrapView = (r: WrapResult) => (
    <div className="jwt-results">
      {r.poll && (
        <div className={`tcl-verdict ${VERDICT_CLASS[r.poll.verdict]}`} role="status">
          <p>{r.poll.text}</p>
        </div>
      )}
      {warningsBox(r.warnings)}
      {shareRow}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("wrap.heading", { width: r.width, kind: unitWord(r.kind) })}</h4>
        <div className="jwt-claims">
          {row(t("wrap.atLoad", { util: num(r.utilisationPercent), speed: speedName(r.speedBitsPerSecond) }), timed(r.wrapSeconds), "load")}
          {r.utilisationPercent !== "100" && row(t("wrap.atLine"), timed(r.lineRateWrapSeconds), "line")}
          {row(t("wrap.other", { width: r.otherWidth.width }), timed(r.otherWidth.wrapSeconds), "other")}
          {row(t("wrap.countPerSecond"), perSecond(r.kind, r.countPerSecond), "rate")}
          {r.packetOctets !== null && row(t("wrap.packetSize"), t("wrap.packetSizeValue", { n: num(String(r.packetOctets)) }), "size")}
        </div>
      </section>
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("poll.heading")}</h4>
        <div className="jwt-claims">
          {row(t("poll.neverMiss"), <>{t("poll.under")} {timed(r.neverMissBelowSeconds)}</>, "never")}
          {row(t("poll.margin"), <>{t("poll.atMost")} {timed(r.marginPollSeconds)}</>, "margin")}
          {r.poll && row(t("poll.yours"), timed(r.poll.seconds), "yours")}
          {r.poll && row(t("poll.perPoll"), t("poll.perPollValue", { n: num(r.poll.countPerPoll), unit: unitWord(r.kind), cycles: cycles(r.poll.cyclesPerPoll, r.poll.countPerPoll), width: r.width }), "per")}
        </div>
        {!r.poll && <p className="hmac-build-note">{t("poll.noneHint")}</p>}
      </section>
      {rfcPanel(r.rfc2863)}
      {notesPanel(r.notes)}
    </div>
  ); // wrapView

  /** The rate-mode reading. */
  const rateView = (r: RateResult) => (
    <div className="jwt-results">
      <div className={`tcl-verdict ${VERDICT_CLASS[r.verdict]}`} role="status">
        <p>{r.verdictText}</p>
      </div>
      {warningsBox(r.warnings)}
      {shareRow}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("rate.heading")}</h4>
        <div className="jwt-claims">
          {row(t("rate.delta"), r.wrapped ? t("rate.deltaWrapped", { n: num(r.delta), unit: unitWord(r.kind), width: r.width }) : t("rate.deltaValue", { n: num(r.delta), unit: unitWord(r.kind) }), "delta")}
          {row(t("rate.interval"), timed(r.intervalSeconds), "interval")}
          {r.bitsPerSecond !== null && row(t("rate.rate"), <>{bitRate(r.bitsPerSecond)} <span className="hmac-build-note">({t("unit.bitsPerSecond", { n: num(r.bitsPerSecond) })})</span></>, "bps")}
          {r.packetsPerSecond !== null && row(t("rate.rate"), perSecond("packets", r.packetsPerSecond), "pps")}
          {r.utilisationPercent !== null && r.speedBitsPerSecond !== null && row(t("rate.utilisation"), t("rate.utilValue", { p: twoPlaces(r.utilisationPercent), speed: speedName(r.speedBitsPerSecond) }), "util")}
          {r.lineRateMaxCount !== null && r.lineRateCycles !== null && row(t("rate.lineMax"), t("rate.lineMaxValue", { n: num(r.lineRateMaxCount, 0), unit: unitWord(r.kind), cycles: cycles(r.lineRateCycles, r.lineRateMaxCount), width: r.width }), "line")}
        </div>
      </section>
      {r.rfc2863 && rfcPanel(r.rfc2863)}
      {notesPanel(r.notes)}
    </div>
  ); // rateView

  /** A seg button. */
  const segBtn = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" className={`seg-btn${active ? " seg-btn--active" : ""}`} aria-pressed={active} onClick={onClick}>{label}</button>
  ); // segBtn

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode switch. */}
      <div className="seg-group" role="group" aria-label={t("modeLabel")}>
        <div className="seg">
          {(["wrap", "rate"] as const).map((m) => segBtn(mode === m, t(`mode.${m}`), () => setMode(m), m))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <span className="cidr-label">{mode === "wrap" ? t("wrapInputs") : t("rateInputs")}</span>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: each mode's Example is verbatim from a golden vector. */}
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clearAll}>{t("clear")}</button>
          </div>
        </div>

        {/* The counter: its width and what it counts, side by side (one column on a phone). */}
        <div className="dcb-segs">
          <div className="dcb-seg">
            <span className="cidr-label">{t("widthLabel")}</span>
            <div className="seg" role="group" aria-label={t("widthLabel")}>
              {(["32", "64"] as const).map((w) => segBtn(width === w, `Counter${w}`, () => setWidth(w), w))}
            </div>
          </div>
          <div className="dcb-seg">
            <span className="cidr-label">{t("kindLabel")}</span>
            <div className="seg" role="group" aria-label={t("kindLabel")}>
              {(["octets", "packets"] as const).map((k) => segBtn(kind === k, t(`kind.${k}`), () => setKind(k), k))}
            </div>
          </div>
        </div>

        {/* Rate mode: the two readings, as a two-column table that fits a phone. */}
        {mode === "rate" && (
          <>
            <div className="cidr-table-wrap">
              <table className="cidr-table bfd-timers-table">
                <thead>
                  <tr>
                    <th scope="col">{t("readingsCol")}</th>
                    <th scope="col">{t("firstCol")}</th>
                    <th scope="col">{t("secondCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">{t("valueRow")}</th>
                    <td><input className="cidr-input mono" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="4294000000" inputMode="numeric" aria-label={`${t("firstCol")}: ${t("valueRow")}`} autoComplete="off" spellCheck={false} maxLength={MAX_FIELD} /></td>
                    <td><input className="cidr-input mono" value={second} onChange={(e) => setSecond(e.target.value)} placeholder="1032704" inputMode="numeric" aria-label={`${t("secondCol")}: ${t("valueRow")}`} autoComplete="off" spellCheck={false} maxLength={MAX_FIELD} /></td>
                  </tr>
                  <tr>
                    <th scope="row">{timeUnit === "s" ? t("timeRowSeconds") : t("timeRowTicks")}</th>
                    <td><input className="cidr-input mono" value={firstTime} onChange={(e) => setFirstTime(e.target.value)} placeholder={timeUnit === "s" ? "0" : "123456700"} inputMode="decimal" aria-label={`${t("firstCol")}: ${timeUnit === "s" ? t("timeRowSeconds") : t("timeRowTicks")}`} autoComplete="off" spellCheck={false} maxLength={MAX_FIELD} /></td>
                    <td><input className="cidr-input mono" value={secondTime} onChange={(e) => setSecondTime(e.target.value)} placeholder={timeUnit === "s" ? "30" : "123486700"} inputMode="decimal" aria-label={`${t("secondCol")}: ${timeUnit === "s" ? t("timeRowSeconds") : t("timeRowTicks")}`} autoComplete="off" spellCheck={false} maxLength={MAX_FIELD} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="dcb-segs">
              <div className="dcb-seg">
                <span className="cidr-label">{t("timeUnitLabel")}</span>
                <div className="seg" role="group" aria-label={t("timeUnitLabel")}>
                  {(["s", "ticks"] as const).map((u) => segBtn(timeUnit === u, t(`timeUnit.${u}`), () => setTimeUnit(u), u))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* The interface speed, typed or from a preset (optional in rate mode: it enables the checks). */}
        <label className="cidr-label" htmlFor="snmp-speed">{mode === "wrap" ? t("speedLabel") : t("speedLabelOptional")}</label>
        <input id="snmp-speed" className="cidr-input mono" value={speed} onChange={(e) => setSpeed(e.target.value)} placeholder={t("speedPlaceholder")} autoComplete="off" spellCheck={false} maxLength={64} aria-describedby="snmp-speed-hint" />
        {/* The presets as compact chips (the site's preset-chip vocabulary): two rows on a phone, one on a desktop. */}
        <div className="tcl-presets-row" role="group" aria-label={t("presetsLabel")}>
          {SPEED_PRESETS.map((p) => (
            <button key={p.label} type="button" className="tcl-chip" aria-pressed={speed === p.label} onClick={() => setSpeed(p.label)}>{p.label}</button>
          ))}
        </div>
        <p id="snmp-speed-hint" className="hmac-build-note">{t("speedHint")}</p>

        {/* Wrap mode: utilisation and poll interval; packets: the packet size. */}
        {(mode === "wrap" || kind === "packets") && (
          <div className="bb-fields">
            {mode === "wrap" && (
              <div className="bb-field">
                <label className="cidr-label" htmlFor="snmp-util">{t("utilLabel")}</label>
                <input id="snmp-util" className="cidr-input mono" value={utilisation} onChange={(e) => setUtilisation(e.target.value)} placeholder="100" inputMode="decimal" autoComplete="off" spellCheck={false} maxLength={64} />
              </div>
            )}
            {mode === "wrap" && (
              <div className="bb-field">
                <label className="cidr-label" htmlFor="snmp-poll">{t("pollLabel")}</label>
                <input id="snmp-poll" className="cidr-input mono" value={poll} onChange={(e) => setPoll(e.target.value)} placeholder={t("pollPlaceholder")} autoComplete="off" spellCheck={false} maxLength={64} />
              </div>
            )}
            {kind === "packets" && (
              <div className="bb-field">
                <label className="cidr-label" htmlFor="snmp-size">{t("sizeLabel")}</label>
                <input id="snmp-size" className="cidr-input mono" value={packetSize} onChange={(e) => setPacketSize(e.target.value)} placeholder="84" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={64} aria-describedby="snmp-size-hint" />
              </div>
            )}
          </div>
        )}
        {kind === "packets" && <p id="snmp-size-hint" className="hmac-build-note">{t("sizeHint")}</p>}

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
      {!view && <p className="ztc-empty">{mode === "wrap" ? t("emptyWrap") : t("emptyRate")}</p>}

      {/* The reading. */}
      {view && view.ok && (view.data.mode === "wrap" ? wrapView(view.data) : rateView(view.data))}
    </div>
  );
} // SnmpCounterWrapCalculatorTool
