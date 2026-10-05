"use client";

// ============================================================================
// src/components/BitsBytesTool.tsx
// ----------------------------------------------------------------------------
// BITS, BYTES AND THROUGHPUT, as a page.
//
// Three fields, size, rate and time, any one of which is explained on its own
// and any two of which give the third, plus an efficiency (a preset or a
// percentage). The engine (src/lib/tools/bits-bytes) does the arithmetic
// exactly; this component lays out what it returns: the size in every unit of
// both conventions with the two readings of an SI label, the rate per second,
// minute, hour and day, the transfer time with its parts, and the connection
// table, with the rows the 2004 calculator carried marked as such.
//
// Everything runs in the browser; nothing is sent anywhere.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { run, VECTORS, EFFICIENCY_PRESETS, type BitsBytesResult, type Duration, type SizeView, type RateView } from "@/lib/tools/bits-bytes";
import { usePrefill } from "@/lib/use-prefill";

/** The vector the Example button loads, verbatim (D-83): the 2004 calculator's own worked example. */
const EXAMPLE_ID = "lineage-56k-modem";

export default function BitsBytesTool() {
  const t = useTranslations("tools.bits-bytes");
  const locale = useLocale();
  const example = VECTORS.find((v) => v.id === EXAMPLE_ID)!;

  // The decimal separator of the active locale, from Intl ("." in en, "," in pt-BR); the engine prints every decimal with ".".
  const decimalSep = useMemo(() => new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === "decimal")?.value ?? ".", [locale]);
  // Present an engine number in the locale: swap the "." between two digits for the locale's separator (thousands are spaces, so nothing else changes).
  const num = useCallback((s: string): string => (decimalSep === "." ? s : s.replace(/(\d)\.(\d)/g, `$1${decimalSep}$2`)), [decimalSep]);

  // The three quantities and the efficiency, as typed.
  const [size, setSize] = useState(example.input.size ?? "");
  const [rate, setRate] = useState(example.input.rate ?? "");
  const [time, setTime] = useState(example.input.time ?? "");
  const [efficiency, setEfficiency] = useState(example.input.efficiency ?? "");
  // Which efficiency control is in use: a preset button or a typed percentage.
  const presetIds = EFFICIENCY_PRESETS.map((p) => p.id);
  const isPreset = efficiency === "" || presetIds.includes(efficiency);

  const r: BitsBytesResult = useMemo(() => run({ size, rate, time, efficiency }), [size, rate, time, efficiency]);

  // Example and Clear (D-83).
  const loadExample = useCallback(() => { setSize(example.input.size ?? ""); setRate(example.input.rate ?? ""); setTime(example.input.time ?? ""); setEfficiency(example.input.efficiency ?? ""); }, [example]);
  const clear = useCallback(() => { setSize(""); setRate(""); setTime(""); setEfficiency(""); }, []);
  // A deep link fills the size field.
  usePrefill((v) => setSize(v));

  // A duration in words: "2 d 3 h 4 min 5.678 s", dropping the leading zero parts.
  const duration = (d: Duration): string => {
    if (d.totalSeconds === "∞") return "∞";
    const parts: string[] = [];
    if (d.days) parts.push(t("dur.days", { n: d.days }));
    if (d.days || d.hours) parts.push(t("dur.hours", { n: d.hours }));
    if (d.days || d.hours || d.minutes) parts.push(t("dur.minutes", { n: d.minutes }));
    parts.push(t("dur.seconds", { n: `${d.seconds}${decimalSep}${String(d.millis).padStart(3, "0")}` }));
    return parts.join(" ");
  };

  // The size table, rendered in three columns: bits, binary bytes, decimal bytes.
  const sizeTable = (v: SizeView) => (
    <div className="cidr-table-wrap">
      <table className="cidr-table bb-table">
        <thead><tr><th scope="col">{t("col.unit")}</th><th scope="col">{t("col.value")}</th><th scope="col">{t("col.convention")}</th></tr></thead>
        <tbody>
          {v.table.map((row) => (
            <tr key={row.unit} className={row.unit.includes("i") ? "bb-row--binary" : /^[kMGTPE]B$|^[kMGTP]bit$/.test(row.unit) ? "bb-row--decimal" : ""}>
              <td className="mono">{row.unit}</td>
              <td className="mono bb-num">{num(row.text)}{row.exact ? "" : <span className="bb-approx" title={t("rounded")}>{"≈"}</span>}</td>
              <td className="bb-conv">{row.unit.includes("i") ? t("conv.binary") : /^(bit|B)$/.test(row.unit) ? t("conv.base") : t("conv.decimal")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // The rate table.
  const rateTable = (v: RateView) => (
    <div className="cidr-table-wrap">
      <table className="cidr-table bb-table">
        <thead><tr><th scope="col">{t("col.unit")}</th><th scope="col">{t("col.perSecond")}</th></tr></thead>
        <tbody>
          {v.table.map((row) => (
            <tr key={row.unit}><td className="mono">{row.unit}/s</td><td className="mono bb-num">{num(row.text)}{row.exact ? "" : <span className="bb-approx" title={t("rounded")}>{"≈"}</span>}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="cidr-tool jwt-tool bb-tool">
      {/* The inputs. */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <span className="cidr-label">{t("inputsLabel")}</span>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clear}>{t("clear")}</button>
          </div>
        </div>
        <div className="bb-fields">
          <div className="bb-field">
            <label className="cidr-label" htmlFor="bb-size">{t("sizeLabel")}</label>
            <input id="bb-size" className="cidr-input mono" value={size} onChange={(e) => setSize(e.target.value)} placeholder={t("placeholder.size")} spellCheck={false} autoComplete="off" maxLength={64} />
          </div>
          <div className="bb-field">
            <label className="cidr-label" htmlFor="bb-rate">{t("rateLabel")}</label>
            <input id="bb-rate" className="cidr-input mono" value={rate} onChange={(e) => setRate(e.target.value)} placeholder={t("placeholder.rate")} spellCheck={false} autoComplete="off" maxLength={64} />
          </div>
          <div className="bb-field">
            <label className="cidr-label" htmlFor="bb-time">{t("timeLabel")}</label>
            <input id="bb-time" className="cidr-input mono" value={time} onChange={(e) => setTime(e.target.value)} placeholder={t("placeholder.time")} spellCheck={false} autoComplete="off" maxLength={64} />
          </div>
        </div>
        <p className="hmac-build-note">{t("inputsHint")}</p>
        {/* Efficiency: presets as segment buttons, or a typed percentage. */}
        <div className="bb-eff">
          <span className="cidr-label">{t("effLabel")}</span>
          <div className="seg-group" role="group" aria-label={t("effLabel")}>
            {EFFICIENCY_PRESETS.map((p) => (
              <button key={p.id} type="button" className={`seg-btn${(efficiency === p.id || (efficiency === "" && p.id === "line-rate")) ? " seg-btn--active" : ""}`} aria-pressed={efficiency === p.id || (efficiency === "" && p.id === "line-rate")} onClick={() => setEfficiency(p.id === "line-rate" ? "" : p.id)}>{t(`preset.${p.id}`)}</button>
            ))}
          </div>
          <label className="cidr-label bb-eff-custom" htmlFor="bb-eff">{t("effCustom")}</label>
          <input id="bb-eff" className="cidr-input mono bb-eff-input" value={isPreset ? "" : efficiency} onChange={(e) => setEfficiency(e.target.value)} placeholder="80%" spellCheck={false} autoComplete="off" maxLength={8} />
        </div>
        <p className="hmac-build-note">{t("effHint")}</p>
        <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span>{t("runsLocally")}</p>
      </div>

      {/* Errors. */}
      {!r.ok && r.error && r.error !== "empty" && (
        <p className="tcl-verdict tcl-verdict-bad" role="status">{t(`error.${r.error}`)}</p>
      )}

      {r.ok && (
        <div className="jwt-results bb-results">
          {/* The transfer, when two quantities were given. */}
          {r.transfer && (r.transfer.time || r.transfer.rateBitsPerSecond || r.transfer.sizeBits) && (
            <section className="jwt-panel bb-headline">
              <h4 className="jwt-panel-title">{t(`transfer.${r.transfer.derived}Title`)}</h4>
              {r.transfer.time && <p className="bb-big mono">{duration(r.transfer.time)}</p>}
              {r.transfer.time && <p className="hmac-build-note">{t("transfer.timeNote", { seconds: num(r.transfer.time.totalSeconds), eff: num(r.transfer.efficiencyPercent) })}</p>}
              {r.transfer.rateBitsPerSecond && r.transfer.derivedRate && <p className="bb-big mono">{num(r.transfer.derivedRate.table.find((x) => x.unit === "Mbit")?.text ?? "")} Mbit/s</p>}
              {r.transfer.rateBitsPerSecond && <p className="hmac-build-note">{t("transfer.rateNote", { bps: num(r.transfer.rateBitsPerSecond), eff: num(r.transfer.efficiencyPercent) })}</p>}
              {r.transfer.sizeBits && r.transfer.derivedSize && <p className="bb-big mono">{num(r.transfer.derivedSize.table.find((x) => x.unit === "GB")?.text ?? "")} GB</p>}
              {r.transfer.sizeBits && <p className="hmac-build-note">{t("transfer.sizeNote", { bits: num(r.transfer.sizeBits), eff: num(r.transfer.efficiencyPercent) })}</p>}
              {r.transfer.efficiencyPreset && <p className="hmac-build-note">{t(`presetNote.${r.transfer.efficiencyPreset}`)}</p>}
            </section>
          )}

          {/* The size, in every unit. */}
          {(r.sizeView || r.transfer?.derivedSize) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("sizeTitle")}</h4>
              {(() => { const v = (r.sizeView ?? r.transfer!.derivedSize)!; return (
                <>
                  <p className="bb-line"><span className="bb-k">{t("exactBits")}</span> <span className="mono">{num(v.bits)}</span> <span className="bb-k">{t("exactBytes")}</span> <span className="mono">{num(v.bytes)}</span></p>
                  {r.size?.notes.map((n) => <p key={n} className="tcl-verdict tcl-verdict-warn bb-note">{t(`note.${n}`)}</p>)}
                  {v.otherReading && (
                    <p className="bb-line">{t("otherReading", { decimal: num(v.otherReading.asDecimalText), binary: num(v.otherReading.asBinaryText), gap: num(v.otherReading.gapPercent) })}</p>
                  )}
                  {sizeTable(v)}
                </>
              ); })()}
            </section>
          )}

          {/* The rate, per second and over time. */}
          {(r.rateView || r.transfer?.derivedRate) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("rateTitle")}</h4>
              {(() => { const v = (r.rateView ?? r.transfer!.derivedRate)!; return (
                <>
                  <p className="bb-line"><span className="bb-k">{t("bitsPerSecond")}</span> <span className="mono">{num(v.bitsPerSecond)}</span> <span className="bb-k">{t("bytesPerSecond")}</span> <span className="mono">{num(v.bytesPerSecond)}</span></p>
                  {r.rate?.notes.filter((n) => n === "ambiguous-kb" || n === "si-on-bytes").map((n) => <p key={n} className="tcl-verdict tcl-verdict-warn bb-note">{t(`note.${n}`)}</p>)}
                  <p className="bb-line">{t("perTime", { minute: num(v.per.minute), hour: num(v.per.hour), day: num(v.per.day) })}</p>
                  {rateTable(v)}
                </>
              ); })()}
            </section>
          )}

          {/* A time alone. */}
          {r.time && !r.transfer?.time && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("timeTitle")}</h4>
              <p className="bb-line"><span className="bb-k">{t("exactSeconds")}</span> <span className="mono">{num(r.time.seconds)}</span></p>
            </section>
          )}

          {/* The connection table. */}
          {r.transfer && r.transfer.connections.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("linksTitle", { eff: num(r.transfer.efficiencyPercent) })}</h4>
              <div className="cidr-table-wrap">
                <table className="cidr-table bb-table">
                  <thead><tr><th scope="col">{t("col.link")}</th><th scope="col">{t("col.nominal")}</th><th scope="col">{t("col.time")}</th></tr></thead>
                  <tbody>
                    {r.transfer.connections.map((c) => (
                      <tr key={c.id} className={c.lineage ? "bb-row--lineage" : ""}>
                        <td>{t(`link.${c.id}`)}{c.lineage && <span className="bb-lineage" title={t("lineageTitle")}>2004</span>}</td>
                        <td className="mono bb-num">{num(c.bitsPerSecond)} bit/s</td>
                        <td className="mono">{duration(c.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="hmac-build-note">{t("linksNote")}</p>
            </section>
          )}

          <p className="hmac-build-note bb-limits">{t("limits")}</p>
        </div>
      )}
    </div>
  );
}
