// ============================================================================
// src/components/BfdTimersTool.tsx
// ----------------------------------------------------------------------------
// UI for the BFD timer calculator and control packet decoder. The engine in
// src/lib/tools/bfd-timers does every computation and names the section each
// number comes from; this component collects the inputs, renders the result,
// and translates the engine's explanation ids through tools.bfd-timers.
//
// Two modes behind one segmented control:
//   * Timers: a two-column form (system A, system B) for the three interval
//     fields, Detect Mult, Required Min Echo RX and Demand mode, plus the
//     session state and the path kind; out come both directions.
//   * Decode: a BFD Control packet in hex, read field by field and run through
//     RFC 5880 section 6.8.6's receive checks.
// Styling reuses existing classes only (cidr-*, jwt-*, seg-*, tcl-verdict-*,
// cipher-note); no new CSS (D-19 / CSS rule).
// ============================================================================
"use client"; // interactive: state and event handlers

import { useMemo, useState } from "react"; // state and derived results
import { useLocale, useTranslations } from "next-intl"; // messages and the active locale
import { run, BfdError, formatDuration, GRACEFUL_RESTART_INTERVAL_US, type TimersResult, type DecodeResult, type Explanation, type DirectionResult } from "@/lib/tools/bfd-timers"; // the engine

/** The form fields of one system, as typed. */
interface SystemForm {
  tx: string; // Desired Min TX Interval
  rx: string; // Required Min RX Interval
  mult: string; // Detect Mult
  echo: string; // Required Min Echo RX Interval (optional)
  demand: boolean; // Demand mode requested
} // SystemForm

/** An empty system. */
const EMPTY: SystemForm = { tx: "", rx: "", mult: "", echo: "", demand: false }; // the Clear state

// D-83 Example samples, verbatim from this tool's golden vectors:
// frr-detect-multiplier-example (FRRouting's own 900 ms worked example) and
// up-300ms (an Up packet at 300 ms, bytes computed from RFC 5880 section 4.1).
const EXAMPLE_A: SystemForm = { tx: "300ms", rx: "300ms", mult: "3", echo: "", demand: false }; // the local system of FRR's example
const EXAMPLE_B: SystemForm = { tx: "300ms", rx: "200ms", mult: "3", echo: "", demand: false }; // the remote system, receive-interval 200
const EXAMPLE_PACKET = "20 c0 03 18 00 00 00 01 00 00 00 02 00 04 93 e0 00 04 93 e0 00 00 00 00"; // golden vector up-300ms

/** The request keys of a system, by form field. */
const FIELD_ROWS: { key: keyof Omit<SystemForm, "demand">; msg: string; required: boolean }[] = [
  { key: "tx", msg: "desiredMinTx", required: true }, // Desired Min TX Interval
  { key: "rx", msg: "requiredMinRx", required: true }, // Required Min RX Interval
  { key: "mult", msg: "detectMult", required: true }, // Detect Mult
  { key: "echo", msg: "requiredMinEchoRx", required: false }, // Required Min Echo RX Interval
];

/**
 * The calculator and decoder.
 * @returns the tool UI
 */
export default function BfdTimersTool() {
  const t = useTranslations("tools.bfd-timers"); // this tool's messages
  const locale = useLocale(); // decides the decimal separator
  const sep = locale.startsWith("pt") ? "," : "."; // Portuguese writes 262,5 ms

  const [mode, setMode] = useState<"timers" | "decode">("timers"); // which mode is shown
  const [a, setA] = useState<SystemForm>(EMPTY); // system A's fields
  const [b, setB] = useState<SystemForm>(EMPTY); // system B's fields
  const [sessionUp, setSessionUp] = useState(true); // Up, or any other state
  const [path, setPath] = useState<"single-hop" | "multihop">("single-hop"); // the path kind
  const [packet, setPacket] = useState(""); // the hex text of decode mode

  /**
   * Format the params of an explanation for display: microsecond values as
   * durations, numbers with the locale's decimal separator, names as they are.
   * @param p the engine's params
   * @returns display strings
   */
  const fmt = (p: Record<string, string | number>): Record<string, string> => {
    const out: Record<string, string> = {}; // the formatted params
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === "number" && k.endsWith("Us")) out[k] = formatDuration(v, sep); // a duration
      else if (typeof v === "number") out[k] = String(v).replace(".", sep); // a plain number
      else out[k] = v; // a name
    } // each param
    return out; // ready for ICU
  }; // fmt

  /**
   * The source of a statement in the reader's language: "section" words and
   * "and" are translated; document names stay as they are.
   * @param section the engine's section text
   * @returns the localized label
   */
  const sourceLabel = (section: string): string => {
    if (section.startsWith("computed:")) return t("source.computedRate"); // the only computed statement is the packet rate
    return section
      .replace(/\bsections\b/g, t("source.sections")) // plural first
      .replace(/\bsection\b/g, t("source.section")) // then singular
      .replace(/\bAppendix\b/g, t("source.appendix")) // RFC appendices
      .replace(/ and /g, ` ${t("source.and")} `); // the conjunction
  }; // sourceLabel

  /**
   * One explanation line: the translated statement and its source.
   * @param ns the message group (explain, warn, note, finding)
   * @param e the explanation
   * @returns a list item
   */
  const line = (ns: string, e: Explanation, i: number) => (
    <li key={`${e.id}-${i}`}>
      {t(`${ns}.${e.id}`, fmt(e.params))} <span className="mono">({sourceLabel(e.section)})</span>
    </li>
  ); // line

  // The timers result, or an error, recomputed whenever an input changes.
  const timers = useMemo((): { result: TimersResult | null; error: string | null } => {
    if (mode !== "timers") return { result: null, error: null }; // not shown
    const all = [a.tx, a.rx, a.mult, b.tx, b.rx, b.mult]; // the required fields
    if (all.every((v) => v.trim() === "")) return { result: null, error: null }; // nothing typed yet
    if (all.some((v) => v.trim() === "")) return { result: null, error: t("errors.incomplete") }; // half a form
    /** One system's request object. */
    const sys = (s: SystemForm) => ({ desiredMinTx: s.tx, requiredMinRx: s.rx, detectMult: s.mult, ...(s.echo.trim() ? { requiredMinEchoRx: s.echo } : {}), demand: s.demand }); // the engine's shape
    try {
      return { result: run({ a: sys(a), b: sys(b), sessionUp, path }) as TimersResult, error: null }; // computed
    } catch (e) {
      // A refusal: translate the code, naming the field when the engine did.
      const code = e instanceof BfdError ? e.code : "field"; // the stable code
      const m = e instanceof Error ? /^([ab])\.(\w+):/.exec(e.message) : null; // "a.desiredMinTx: ..."
      const where = m ? `${m[1].toUpperCase()}, ${t(`fields.${m[2]}`)}` : ""; // "A, Desired Min TX Interval"
      return { result: null, error: (where ? `${where}: ` : "") + t(`errors.${code}`) }; // the message shown
    } // refused
  }, [mode, a, b, sessionUp, path, t]); // inputs

  // The decode result, or an error.
  const decoded = useMemo((): { result: DecodeResult | null; error: string | null } => {
    if (mode !== "decode" || packet.trim() === "") return { result: null, error: null }; // nothing to decode
    try {
      return { result: run({ mode: "decode", packet }) as DecodeResult, error: null }; // decoded
    } catch (e) {
      return { result: null, error: t(`errors.${e instanceof BfdError ? e.code : "hex-format"}`) }; // refused
    } // refused
  }, [mode, packet, t]); // inputs

  /** Load the example of the current mode. */
  const loadExample = () => {
    if (mode === "timers") { setA(EXAMPLE_A); setB(EXAMPLE_B); setSessionUp(true); setPath("single-hop"); } // FRR's example
    else setPacket(EXAMPLE_PACKET); // the Up packet
  }; // loadExample

  /** Clear the current mode. */
  const clear = () => {
    if (mode === "timers") { setA(EMPTY); setB(EMPTY); setSessionUp(true); setPath("single-hop"); } // empty form
    else setPacket(""); // empty packet
  }; // clear

  /**
   * One direction's panel.
   * @param dir the direction
   * @returns the panel
   */
  const directionPanel = (dir: DirectionResult) => (
    <section className="jwt-panel" key={`${dir.from}-${dir.to}`}>
      <h4 className="jwt-panel-title">{t("dir.heading", { from: dir.from, to: dir.to })}</h4>
      <div className="jwt-claims">
        <div className="jwt-claim-row">
          <span className="jwt-claim-label">{t("dir.interval")}</span>
          <span className="jwt-claim-value mono">{formatDuration(dir.intervalUs, sep)}</span>
        </div>
        {dir.periodic ? (
          <>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("dir.jitter")}</span>
              <span className="jwt-claim-value mono">
                {t("dir.jitterRange", { min: formatDuration(dir.jitter.minUs, sep), max: formatDuration(dir.jitter.maxUs, sep) })}
                {dir.jitter.averageUs !== null ? ` · ${t("dir.jitterAverage", { avg: formatDuration(dir.jitter.averageUs, sep) })}` : ""}
              </span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("dir.rate")}</span>
              <span className="jwt-claim-value mono">{String(dir.packetsPerSecond).replace(".", sep)}</span>
            </div>
          </>
        ) : (
          <div className="jwt-claim-row">
            <span className="jwt-claim-label">{t("dir.periodic")}</span>
            <span className="jwt-claim-value">{t(`dir.silent.${dir.silentReason}`)}</span>
          </div>
        )}
        <div className="jwt-claim-row">
          <span className="jwt-claim-label">{t("dir.detection", { to: dir.to })}</span>
          <span className="jwt-claim-value mono">
            {dir.detection
              ? t(`dir.detectionValue.${dir.detection.kind}`, { time: formatDuration(dir.detection.timeUs, sep), mult: dir.detection.detectMult, interval: formatDuration(dir.detection.intervalUs, sep) })
              : t("dir.detectionNone")}
          </span>
        </div>
        <div className="jwt-claim-row">
          <span className="jwt-claim-label">{t("dir.common")}</span>
          <span className="jwt-claim-value">{dir.commonInterval ? t("dir.commonYes") : dir.intervalUs === GRACEFUL_RESTART_INTERVAL_US ? t("dir.commonGracefulRestart") : dir.nextCommonIntervalUs !== null ? t("dir.commonNext", { next: formatDuration(dir.nextCommonIntervalUs, sep) }) : t("dir.commonNo")}</span>
        </div>
        <div className="jwt-claim-row">
          <span className="jwt-claim-label">{t("dir.echo", { from: dir.from })}</span>
          <span className="jwt-claim-value">{dir.echo.allowed && dir.echo.minIntervalUs !== null ? t("dir.echoAllowed", { min: formatDuration(dir.echo.minIntervalUs, sep) }) : t(`dir.echoReason.${dir.echo.reason}`)}</span>
        </div>
      </div>
      <h4 className="jwt-panel-title">{t("dir.why")}</h4>
      <ul>{dir.explanations.map((e, i) => line("explain", e, i))}</ul>
    </section>
  ); // directionPanel

  /**
   * One system's column of inputs.
   * @param s the form values
   * @param set the setter
   * @param id "a" or "b", for element ids
   * @param key the field
   * @returns an input cell
   */
  const cell = (s: SystemForm, set: (v: SystemForm) => void, id: "a" | "b", key: keyof Omit<SystemForm, "demand">) => (
    <td>
      <input
        id={`bfd-${id}-${key}`}
        className="cidr-input mono"
        value={s[key]}
        onChange={(e) => set({ ...s, [key]: e.target.value })}
        placeholder={t(`placeholders.${key}`)}
        aria-label={`${id.toUpperCase()}: ${t(`fields.${FIELD_ROWS.find((r) => r.key === key)?.msg ?? "desiredMinTx"}`)}`}
        autoComplete="off"
        spellCheck={false}
      />
    </td>
  ); // cell

  // The decode verdict's flag letters, for the field table.
  const flagLetters = (r: DecodeResult): string =>
    [r.flags.poll && "P", r.flags.final && "F", r.flags.controlPlaneIndependent && "C", r.flags.authenticationPresent && "A", r.flags.demand && "D", r.flags.multipoint && "M"].filter(Boolean).join(" ") || t("decode.noFlags"); // e.g. "P F"

  return (
    <div className="cidr-tool jwt-tool">
      {/* Mode switch. */}
      <div className="seg-group" role="group" aria-label={t("modeLabel")}>
        <div className="seg">
          {(["timers", "decode"] as const).map((m) => (
            <button key={m} type="button" className={`seg-btn${mode === m ? " seg-btn--active" : ""}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
              {t(`mode.${m}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <span className="cidr-label">{mode === "timers" ? t("inputsHeading") : t("packetLabel")}</span>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the samples are golden-vector-faithful. */}
            <button type="button" className="b64-copy" onClick={loadExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clear}>
              {t("clear")}
            </button>
          </div>
        </div>

        {mode === "timers" ? (
          <>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <thead>
                  <tr>
                    <th scope="col">{t("fieldCol")}</th>
                    <th scope="col">{t("systemA")}</th>
                    <th scope="col">{t("systemB")}</th>
                  </tr>
                </thead>
                <tbody>
                  {FIELD_ROWS.map((row) => (
                    <tr key={row.key}>
                      <th scope="row">
                        {t(`fields.${row.msg}`)}
                        {row.required ? "" : ` ${t("optional")}`}
                      </th>
                      {cell(a, setA, "a", row.key)}
                      {cell(b, setB, "b", row.key)}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">{t("fields.demand")}</th>
                    <td>
                      <input type="checkbox" checked={a.demand} onChange={(e) => setA({ ...a, demand: e.target.checked })} aria-label={`A: ${t("fields.demand")}`} />
                    </td>
                    <td>
                      <input type="checkbox" checked={b.demand} onChange={(e) => setB({ ...b, demand: e.target.checked })} aria-label={`B: ${t("fields.demand")}`} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="cipher-note">{t("unitsHint")}</p>
            {/* Session state and path. */}
            <div className="seg-group" role="group" aria-label={t("stateLabel")}>
              <span className="cidr-label">{t("stateLabel")}</span>
              <div className="seg">
                {([true, false] as const).map((up) => (
                  <button key={String(up)} type="button" className={`seg-btn${sessionUp === up ? " seg-btn--active" : ""}`} aria-pressed={sessionUp === up} onClick={() => setSessionUp(up)}>
                    {up ? t("state.up") : t("state.notUp")}
                  </button>
                ))}
              </div>
            </div>
            <div className="seg-group" role="group" aria-label={t("pathLabel")}>
              <span className="cidr-label">{t("pathLabel")}</span>
              <div className="seg">
                {(["single-hop", "multihop"] as const).map((p) => (
                  <button key={p} type="button" className={`seg-btn${path === p ? " seg-btn--active" : ""}`} aria-pressed={path === p} onClick={() => setPath(p)}>
                    {t(`path.${p}`)}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <textarea
            id="bfd-packet"
            className="cidr-input mono"
            rows={3}
            value={packet}
            onChange={(e) => setPacket(e.target.value)}
            placeholder={t("packetPlaceholder")}
            aria-label={t("packetLabel")}
            aria-describedby="bfd-privacy"
            autoComplete="off"
            spellCheck={false}
          />
        )}
        <p id="bfd-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {/* Errors from either mode. */}
      {(timers.error || decoded.error) && (
        <p className="cidr-error" role="alert">
          {timers.error ?? decoded.error}
        </p>
      )}

      {/* Timers result. */}
      {timers.result && (
        <div className="jwt-results">
          {timers.result.warnings.length > 0 && (
            <div className="tcl-verdict tcl-verdict-warn" role="status">
              <ul>{timers.result.warnings.map((w, i) => line("warn", w, i))}</ul>
            </div>
          )}
          {timers.result.directions.map((dir) => directionPanel(dir))}
          {timers.result.notes.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("notesHeading")}</h4>
              <ul>{timers.result.notes.map((n, i) => line("note", n, i))}</ul>
            </section>
          )}
        </div>
      )}

      {/* Decode result. */}
      {decoded.result && (
        <div className="jwt-results">
          <div className={`tcl-verdict ${decoded.result.discardedBy ? "tcl-verdict-bad" : "tcl-verdict-ok"}`} role="status">
            <p>
              {decoded.result.discardedBy
                ? `${t(`finding.${decoded.result.discardedBy.id}`, fmt(decoded.result.discardedBy.params))} (${sourceLabel(decoded.result.discardedBy.section)})`
                : t("decode.passes")}
            </p>
          </div>
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("decode.heading", { bytes: decoded.result.bytes })}</h4>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <thead>
                  <tr>
                    <th scope="col">{t("decode.field")}</th>
                    <th scope="col">{t("decode.value")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><th scope="row">{t("decode.version")}</th><td className="mono">{decoded.result.version}</td></tr>
                  <tr><th scope="row">{t("decode.diagnostic")}</th><td className="mono">{decoded.result.diagnostic.code} · {decoded.result.diagnostic.name}</td></tr>
                  <tr><th scope="row">{t("decode.state")}</th><td className="mono">{decoded.result.state.code} · {decoded.result.state.name}</td></tr>
                  <tr><th scope="row">{t("decode.flags")}</th><td className="mono">{flagLetters(decoded.result)}</td></tr>
                  <tr><th scope="row">{t("fields.detectMult")}</th><td className="mono">{decoded.result.detectMult}</td></tr>
                  <tr><th scope="row">{t("decode.length")}</th><td className="mono">{decoded.result.length}</td></tr>
                  <tr><th scope="row">{t("decode.myDiscriminator")}</th><td className="mono">{decoded.result.myDiscriminator}</td></tr>
                  <tr><th scope="row">{t("decode.yourDiscriminator")}</th><td className="mono">{decoded.result.yourDiscriminator}</td></tr>
                  <tr><th scope="row">{t("fields.desiredMinTx")}</th><td className="mono">{decoded.result.desiredMinTxUs} µs{decoded.result.desiredMinTxUs >= 1000 ? ` · ${formatDuration(decoded.result.desiredMinTxUs, sep)}` : ""}</td></tr>
                  <tr><th scope="row">{t("fields.requiredMinRx")}</th><td className="mono">{decoded.result.requiredMinRxUs} µs{decoded.result.requiredMinRxUs >= 1000 ? ` · ${formatDuration(decoded.result.requiredMinRxUs, sep)}` : ""}</td></tr>
                  <tr><th scope="row">{t("fields.requiredMinEchoRx")}</th><td className="mono">{decoded.result.requiredMinEchoRxUs} µs{decoded.result.requiredMinEchoRxUs >= 1000 ? ` · ${formatDuration(decoded.result.requiredMinEchoRxUs, sep)}` : ""}</td></tr>
                  {decoded.result.auth && (
                    <tr><th scope="row">{t("decode.auth")}</th><td className="mono">{decoded.result.auth.type} · {decoded.result.auth.name} · {decoded.result.auth.length}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("decode.findings")}</h4>
            <ul>{decoded.result.findings.map((f, i) => line("finding", f, i))}</ul>
          </section>
        </div>
      )}
    </div>
  );
} // BfdTimersTool
