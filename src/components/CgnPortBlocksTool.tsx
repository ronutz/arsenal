// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/CgnPortBlocksTool.tsx
// ----------------------------------------------------------------------------
// UI for the CGN port-block and MAP port-set calculator. Three tabs, one per
// engine mode: port blocks (RFC 7768, RFC 6888), deterministic mapping (RFC
// 7422, forward and reverse) and MAP port sets (RFC 7597 section 5.1, used by
// MAP-T too). The form builds the same JSON request the API takes and hands
// it to the engine's run(), so the page and /api/v1/cgn-port-blocks cannot
// answer differently. Everything is computed in the browser.
// Styling reuses the CIDR tool's vocabulary (tabs, stats, tables) and the
// shared note classes: no new CSS classes.
// ============================================================================
"use client";

import { useCallback, useMemo, useState } from "react"; // React state
import { useLocale, useTranslations } from "next-intl"; // localised strings and number format
import {
  run,
  CgnPortBlocksError,
  type BlocksResult,
  type DeterministicResult,
  type MapResult,
  type PortRange,
} from "@/lib/tools/cgn-port-blocks"; // the engine

/** The three modes, named as the engine names them. */
type Mode = "blocks" | "deterministic" | "map"; // tab ids
/** The tab order. */
const MODES: Mode[] = ["blocks", "deterministic", "map"]; // left to right

/** Every form field, as text; empty means "not given". */
type Fields = Record<string, string>; // field name -> typed text

// D-83 Example samples, verbatim from the golden vectors:
//   blocks        <- blocks-rfc7768-300 (RFC 7768's 300-port block on a /24 pool)
//   deterministic <- det-rfc7422-reverse-2001 (RFC 7422 section 2.3, reverse lookup of port 2001)
//   map           <- map-rfc7597-psid-0x34 (RFC 7597 Appendix A, PSID 0x34)
const EXAMPLES: Record<Mode, Fields> = {
  blocks: { pool: "192.0.2.0/24", blockSize: "300" }, // the RFC 7768 block size
  deterministic: { inside: "198.51.100.0/28", outside: "192.0.2.1", dynamicFactor: "2", maxPorts: "5040", revAddress: "192.0.2.1", revPort: "2001", revTime: "2026-10-19T14:32:52Z" }, // RFC 7422 section 2.3
  map: { offset: "6", psidLength: "8", psid: "0x34" }, // RFC 7597 Appendix A
}; // EXAMPLES

/** The fields each mode's form shows, in order, with whether each is a number. */
const FORM: Record<Mode, { name: string; numeric: boolean }[]> = {
  blocks: [
    { name: "pool", numeric: false }, // prefix, range, address or count
    { name: "portRange", numeric: false }, // first-last
    { name: "blockSize", numeric: true }, // ports per block
    { name: "blocksPerSubscriber", numeric: true }, // blocks per subscriber
    { name: "subscribers", numeric: true }, // subscriber count
    { name: "inside", numeric: false }, // or the inside prefix
  ],
  deterministic: [
    { name: "inside", numeric: false }, // I
    { name: "outside", numeric: false }, // O
    { name: "reserved", numeric: false }, // R
    { name: "compressionRatio", numeric: true }, // C
    { name: "dynamicFactor", numeric: true }, // D
    { name: "maxPorts", numeric: true }, // M
    { name: "lookup", numeric: false }, // forward: inside address
    { name: "revAddress", numeric: false }, // reverse: outside address
    { name: "revPort", numeric: true }, // reverse: port
    { name: "revTime", numeric: false }, // reverse: time
    { name: "configFrom", numeric: false }, // window start
    { name: "configUntil", numeric: false }, // window end
    { name: "recordTime", numeric: false }, // record timestamp
  ],
  map: [
    { name: "offset", numeric: true }, // a
    { name: "psidLength", numeric: true }, // k
    { name: "psid", numeric: false }, // decimal or 0x hexadecimal
    { name: "port", numeric: true }, // reverse: a port
  ],
}; // FORM

/** Build the API request object of a mode from its form fields (empty fields are left out). */
function requestOf(mode: Mode, f: Fields, logFormat: string): Record<string, unknown> {
  const req: Record<string, unknown> = { mode }; // the request
  for (const { name } of FORM[mode]) { // each field of the mode
    const v = (f[name] ?? "").trim(); // its text
    if (v === "" || name.startsWith("rev")) continue; // empty, or part of the reverse object below
    req[name] = v; // the engine reads digit strings as numbers
  } // fields
  if (mode === "blocks") req.logFormat = logFormat; // the message size
  if (mode === "deterministic" && ((f.revAddress ?? "").trim() !== "" || (f.revPort ?? "").trim() !== "")) { // a reverse question
    req.reverse = { address: (f.revAddress ?? "").trim(), port: (f.revPort ?? "").trim(), ...((f.revTime ?? "").trim() !== "" ? { time: f.revTime.trim() } : {}) }; // its fields
  } // reverse
  return req; // ready for JSON
} // requestOf

/** One labelled number in the stats row (the CIDR tool's tile). */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cidr-stat">
      <span className="cidr-stat-label">{label}</span>
      <span className="cidr-stat-value mono">{value}</span>
    </div>
  ); // the tile
} // Stat

/** A port range list as "1024-5055, 5056-9087". */
function rangesText(ranges: PortRange[]): string {
  return ranges.map((r) => (r.first === r.last ? String(r.first) : `${r.first}-${r.last}`)).join(", "); // compact
} // rangesText

export default function CgnPortBlocksTool() {
  const t = useTranslations("tools.cgn-port-blocks"); // this tool's strings
  const locale = useLocale(); // for number grouping
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]); // the number format
  const n = useCallback((x: number) => nf.format(x), [nf]); // format one number

  const [mode, setMode] = useState<Mode>("blocks"); // the active tab
  const [fields, setFields] = useState<Record<Mode, Fields>>({ blocks: {}, deterministic: {}, map: {} }); // each tab's form
  const [logFormat, setLogFormat] = useState("nat444"); // RFC 7422's message size choice

  // The answer, recomputed whenever the form changes (pure, so this is cheap and safe).
  const outcome = useMemo((): { result: BlocksResult | DeterministicResult | MapResult | null; error: string | null } => {
    const f = fields[mode]; // this tab's fields
    if (Object.values(f).every((v) => v.trim() === "")) return { result: null, error: null }; // an empty form answers nothing
    try {
      return { result: run(JSON.stringify(requestOf(mode, f, logFormat))) as BlocksResult | DeterministicResult | MapResult, error: null }; // the engine's answer
    } catch (e) {
      return { result: null, error: t(`errors.${e instanceof CgnPortBlocksError ? e.code : "json"}`) }; // a localised hint
    } // computed
  }, [fields, mode, logFormat, t]); // inputs

  /** Set one field of the active tab. */
  const setField = (name: string, value: string) => setFields((prev) => ({ ...prev, [mode]: { ...prev[mode], [name]: value } })); // immutable update

  /** Bytes as an SI figure (decimal multiples), for reading alongside the exact count. */
  const si = (bytes: number): string => {
    const units = ["B", "kB", "MB", "GB", "TB", "PB"]; // decimal units
    let v = bytes; // the scaled value
    let u = 0; // the unit index
    while (v >= 1000 && u < units.length - 1) { v /= 1000; u++; } // scale down
    return `${nf.format(Math.round(v * 100) / 100)} ${units[u]}`; // two decimals
  }; // si

  const r = outcome.result; // shorthand
  // Ports, PSIDs and bit counts are passed to the messages as text, so ICU does not group them like quantities (2001, not 2,001).

  return (
    <div className="cidr-tool">
      <div className="cidr-head">
        <h3 className="cidr-title">{t("title")}</h3>
        <p className="cidr-desc">{t(`modeDesc.${mode}`)}</p>
      </div>

      {/* The three modes. */}
      <div className="cidr-modes" role="tablist" aria-label={t("title")}>
        {MODES.map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={"cidr-mode-tab" + (mode === m ? " is-active" : "")} onClick={() => setMode(m)}>
            {t(`modes.${m}`)}
          </button>
        ))}
      </div>

      {/* The form of the active mode, with the D-83 Example/Clear row. */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <span className="cidr-label">{t("formLabel")}</span>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setFields((prev) => ({ ...prev, [mode]: { ...EXAMPLES[mode] } }))}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setFields((prev) => ({ ...prev, [mode]: {} }))}>{t("clear")}</button>
          </div>
        </div>
        {FORM[mode].map(({ name, numeric }) => (
          <div key={`${mode}-${name}`} className="cidr-input-row">
            <label className="cidr-label" htmlFor={`cgn-${mode}-${name}`}>{t(`fields.${mode}.${name}`)}</label>
            <input
              id={`cgn-${mode}-${name}`}
              className="cidr-input mono"
              type="text"
              inputMode={numeric ? "numeric" : "text"}
              value={fields[mode][name] ?? ""}
              onChange={(e) => setField(name, e.target.value)}
              placeholder={t(`placeholders.${mode}.${name}`)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        ))}
        {/* The RFC 7422 message size: NAT444 (150 bytes) or DS-Lite (175 bytes). */}
        {mode === "blocks" && (
          <div className="cidr-input-row">
            <label className="cidr-label" htmlFor="cgn-log-format">{t("fields.blocks.logFormat")}</label>
            <select id="cgn-log-format" className="cidr-input" value={logFormat} onChange={(e) => setLogFormat(e.target.value)}>
              <option value="nat444">{t("logFormats.nat444")}</option>
              <option value="ds-lite">{t("logFormats.ds-lite")}</option>
            </select>
          </div>
        )}
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">🔒</span> {t("runsLocally")}
        </p>
      </div>

      {outcome.error && <p className="cidr-error" role="alert">{outcome.error}</p>}

      {/* ---------- BLOCKS ---------- */}
      {r && r.mode === "blocks" && (
        <div className="cidr-output">
          <p className="cidr-section-title">{t("blocks.capacityHeading")}</p>
          <div className="cidr-stats">
            <Stat label={t("blocks.addresses")} value={n(r.pool.addresses)} />
            <Stat label={t("blocks.portsPerAddress")} value={n(r.portRange.ports)} />
            <Stat label={t("blocks.blocksPerAddress")} value={n(r.blocksPerAddress)} />
            <Stat label={t("blocks.subscribersPerAddress")} value={n(r.subscribersPerAddress)} />
            <Stat label={t("blocks.poolSubscribers")} value={n(r.poolSubscribers)} />
            <Stat label={t("blocks.portsPerSubscriber")} value={n(r.portsPerSubscriber)} />
          </div>
          <p className="cidr-note">{t("blocks.pairedNote")}</p>
          {(r.leftoverPortsPerAddress > 0 || r.leftoverBlocksPerAddress > 0) && <p className="cidr-note">{t("blocks.leftoverNote", { ports: n(r.leftoverPortsPerAddress), blocks: n(r.leftoverBlocksPerAddress) })}</p>}
          <p className="cidr-note">{r.portRange.systemPortsExcluded ? t("blocks.systemExcluded", { first: String(r.portRange.first), last: String(r.portRange.last) }) : t("blocks.systemIncluded", { first: String(r.portRange.first), last: String(r.portRange.last) })}</p>
          {r.demand && (
            <>
              <p className="cidr-section-title">{t("blocks.demandHeading")}</p>
              <div className="cidr-stats">
                <Stat label={t("blocks.subscribers")} value={n(r.demand.subscribers)} />
                <Stat label={t("blocks.addressesNeeded")} value={n(r.demand.addressesNeeded)} />
                <Stat label={t("blocks.spare")} value={n(r.demand.spare)} />
              </div>
              <p className="cidr-note">{r.demand.fits ? t("blocks.fits", { needed: n(r.demand.addressesNeeded), have: n(r.pool.addresses) }) : t("blocks.doesNotFit", { needed: n(r.demand.addressesNeeded), have: n(r.pool.addresses) })}</p>
            </>
          )}
          <p className="cidr-section-title">{t("blocks.logHeading")}</p>
          <div className="cidr-table-wrap">
            <table className="cidr-table">
              <thead>
                <tr><th>{t("blocks.logScheme")}</th><th>{t("blocks.logLines")}</th><th>{t("blocks.logBytes")}</th>{r.log.perSessionBytesPerDayAll !== null && <th>{t("blocks.logAll")}</th>}</tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t("blocks.perSession")}</td>
                  <td className="mono">{n(r.log.perSessionLinesPerSubscriberDay)}</td>
                  <td className="mono">{n(r.log.perSessionBytesPerSubscriberDay)} ({si(r.log.perSessionBytesPerSubscriberDay)})</td>
                  {r.log.perSessionBytesPerDayAll !== null && <td className="mono">{si(r.log.perSessionBytesPerDayAll)}</td>}
                </tr>
                <tr>
                  <td>{t("blocks.perBlock", { size: n(r.blockSize) })}</td>
                  <td className="mono">{n(r.log.blockLinesPerSubscriberDay)}</td>
                  <td className="mono">{n(r.log.blockBytesPerSubscriberDay)} ({si(r.log.blockBytesPerSubscriberDay)})</td>
                  {r.log.blockBytesPerDayAll !== null && <td className="mono">{si(r.log.blockBytesPerDayAll)}</td>}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="cidr-note">{t("blocks.logNote", { bytes: String(r.log.messageBytes), connections: n(r.log.connectionsPerSubscriberDay), factor: n(r.log.reductionFactor) })}</p>
        </div>
      )}

      {/* ---------- DETERMINISTIC ---------- */}
      {r && r.mode === "deterministic" && (
        <div className="cidr-output">
          <p className="cidr-section-title">{t("det.planHeading")}</p>
          <div className="cidr-stats">
            <Stat label={t("det.insideAddresses")} value={n(r.inside.addresses)} />
            <Stat label={t("det.outsideAddresses")} value={n(r.outside.addresses)} />
            <Stat label="C + D" value={`${n(r.compressionRatio)} + ${n(r.dynamicFactor)} = ${n(r.totalRatio)}`} />
            <Stat label={t("det.candidatePorts")} value={n(r.candidatePorts)} />
            <Stat label={t("det.portsPerSubscriber")} value={n(r.portsPerSubscriber)} />
            <Stat label={t("det.dynamicPool")} value={n(r.dynamicPoolPorts)} />
          </div>
          <p className="cidr-note">{t("det.reservedNote", { list: r.reserved.list || "-", ports: n(r.reserved.ports) })}</p>
          {!r.reserved.systemPortsReserved && <p className="cidr-note">{t("det.systemPortsWarning")}</p>}
          {r.dynamicRanges.length > 0 && <p className="cidr-note">{t("det.dynamicRanges", { ranges: rangesText(r.dynamicRanges) })}</p>}
          {r.dynamicDisabledButLeftover && <p className="cidr-note">{t("det.leftoverNote", { ports: n(r.dynamicPoolPorts) })}</p>}
          {r.overflowPortsPerUser !== null && <p className="cidr-note">{t("det.overflowNote", { m: n(r.maxPorts ?? 0), extra: n(r.overflowPortsPerUser), users: n(r.overflowUsersAtOnce ?? 0) })}</p>}
          {r.maxBelowBlock && <p className="cidr-note">{t("det.maxBelowBlock")}</p>}
          {r.unusedSlots > 0 && <p className="cidr-note">{t("det.unusedSlots", { slots: n(r.unusedSlots) })}</p>}
          <p className="cidr-note">{r.translationLogging === "none" ? t("det.loggingNone") : t("det.loggingDynamic")}</p>

          {/* Function 1: inside address to outside address and ports. */}
          {r.forward && (
            <>
              <p className="cidr-section-title">{t("det.forwardHeading")}</p>
              <p className="cidr-note">{r.forward.status === "mapped" ? t("det.forwardMapped", { inside: r.forward.inside, outside: r.forward.outside ?? "", ranges: rangesText(r.forward.ranges), ports: n(r.forward.ports) }) : t("det.forwardNotInside", { inside: r.forward.inside })}</p>
            </>
          )}

          {/* Function 2: outside address, port and time to the inside address. */}
          {r.reverse && (
            <>
              <p className="cidr-section-title">{t("det.reverseHeading")}</p>
              <p className="cidr-note">{t(`det.reverse.${r.reverse.status}`, { address: r.reverse.address, port: String(r.reverse.port), inside: r.reverse.inside ?? "", ranges: rangesText(r.reverse.blockRanges) })}</p>
              {r.reverse.timeInWindow === false && <p className="cidr-note">{t("det.outsideWindow", { time: r.reverse.time ?? "" })}</p>}
              {r.reverse.timeInWindow === true && <p className="cidr-note">{t("det.insideWindow", { time: r.reverse.time ?? "" })}</p>}
              {r.reverse.status === "deterministic" && <p className="cidr-note">{t("det.reverseNext")}</p>}
            </>
          )}

          {/* The RFC 7422 section 3 configuration record. */}
          <p className="cidr-section-title">{t("det.recordHeading")}</p>
          {r.configRecordBody !== null ? (
            <p className="cidr-note mono">{r.configRecord ?? `[${t("det.recordNoTime")}]:${r.configRecordBody}`}</p>
          ) : (
            <p className="cidr-note">{t("det.recordMissing", { missing: r.configRecordMissing.map((m) => t(`det.missing.${m}`)).join(", ") })}</p>
          )}

          {/* The table, as RFC 7422 section 2.3 prints it. */}
          {r.table ? (
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <thead>
                  <tr><th>{t("det.colInside")}</th><th>{t("det.colOutside")}</th><th>{t("det.colPorts")}</th></tr>
                </thead>
                <tbody>
                  {r.table.reservedRanges.length > 0 && <tr><td>{t("det.rowReserved")}</td><td className="mono">{r.outside.first}</td><td className="mono">{rangesText(r.table.reservedRanges)}</td></tr>}
                  {r.table.rows.map((row) => (
                    <tr key={row.inside}><td className="mono">{row.inside}</td><td className="mono">{row.outside}</td><td className="mono">{rangesText(row.ranges)} ({n(row.ports)})</td></tr>
                  ))}
                  {r.dynamicRanges.length > 0 && <tr><td>{t("det.rowDynamic")}</td><td className="mono">{r.outside.first}</td><td className="mono">{rangesText(r.dynamicRanges)} ({n(r.dynamicPoolPorts)})</td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="cidr-note">{t("det.tableOmitted", { rows: n(r.inside.addresses) })}</p>
          )}
        </div>
      )}

      {/* ---------- MAP ---------- */}
      {r && r.mode === "map" && (
        <div className="cidr-output">
          <p className="cidr-section-title">{t("map.ruleHeading")}</p>
          <div className="cidr-stats">
            <Stat label="a / k / m" value={`${r.a} / ${r.k} / ${r.m}`} />
            <Stat label={t("map.sharingRatio")} value={n(r.sharingRatio)} />
            <Stat label={t("map.portsPerSet")} value={n(r.portsPerSet)} />
            <Stat label={t("map.contiguous")} value={n(r.contiguousPorts)} />
            <Stat label={t("map.interval")} value={n(r.interval)} />
          </div>
          <p className="cidr-note">{t("map.layout", { a: String(r.a), k: String(r.k), m: String(r.m) })}</p>
          {r.excludedLow ? (
            <p className="cidr-note">{r.systemPortsExcluded ? t("map.excluded", { last: String(r.excludedLow.last) }) : t("map.excludedPartial", { last: String(r.excludedLow.last) })}</p>
          ) : (
            <p className="cidr-note">{t("map.offsetZero", { psid: String(r.minPsidAvoidingSystemPorts ?? 0) })}</p>
          )}
          {r.portSet && (
            <>
              <p className="cidr-section-title">{t("map.setHeading", { psid: String(r.portSet.psid), hex: r.portSet.psidHex })}</p>
              <p className="cidr-note">{t("map.setSummary", { count: n(r.portSet.rangeCount), first: rangesText([r.portSet.firstRange]), last: rangesText([r.portSet.lastRange]) })}</p>
              {r.portSet.excludedForPsid && <p className="cidr-note">{t("map.lostRange", { range: rangesText([r.portSet.excludedForPsid]) })}</p>}
              {r.portSet.includesSystemPorts && <p className="cidr-note">{t("map.includesSystem")}</p>}
              <ul className="cidr-block-list">
                {r.portSet.ranges.map((x) => <li key={x.first} className="cidr-block mono">{rangesText([x])}</li>)}
              </ul>
              {r.portSet.rangesTruncated && <p className="cidr-note">{t("map.truncated", { shown: n(r.portSet.ranges.length), total: n(r.portSet.rangeCount) })}</p>}
            </>
          )}
          {r.reverse && (
            <>
              <p className="cidr-section-title">{t("map.reverseHeading", { port: String(r.reverse.port) })}</p>
              <p className="cidr-note">{r.reverse.excluded ? t("map.reverseExcluded", { port: String(r.reverse.port) }) : t("map.reverseOwner", { port: String(r.reverse.port), psid: String(r.reverse.psid ?? 0), hex: r.reverse.psidHex ?? "", aValue: String(r.reverse.aValue), j: String(r.reverse.j) })}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
} // CgnPortBlocksTool
