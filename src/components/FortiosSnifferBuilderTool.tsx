"use client";

// ============================================================================
// src/components/FortiosSnifferBuilderTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE FORTIOS PACKET SNIFFER BUILDER + DECODER.
//
// Two modes, both offline:
//   - Build  : pick an interface, filter, verbosity, count, and timestamp
//              format, and the exact "diagnose sniffer packet ..." command is
//              composed live, with every argument explained and the common
//              traps flagged (build()).
//   - Decode : paste an existing "diagnose sniffer packet ..." line and each
//              argument is read back and explained (run()).
//
// The engine throws on oversized input (the worker-compatible contract), so the
// decode run is wrapped and errors render in the shared error box. Chrome
// strings come from tools.fortios-sniffer-builder; the verbosity/timestamp
// reference text is English by design, like its explainer siblings.
//
// Share results (2026-11-01): a button under the command box builds a link
// that carries the open mode: the Build form's fields, or the pasted command
// (unless the FortiOS check finds a credential in it), with a caution line; an
// arriving link opens that mode and fills it.
//
// Up and down arrows (03/11/2026, PRIME: values set "through the click of a
// mouse (or press of the touchscreen)"): the port (1 to 65535; it also steps
// from Arrow Up / Down) and the packet count (from 0, which means "until
// Ctrl+C"; the field's own min) have a decrease and an increase button beside
// them. Their labels sit above them rather than wrapping them, so the buttons
// are not read as part of the field's name.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first secret-looking name, for a popover line
import { FORTIOS_SNIFFER_SHARE, checkSnifferPaste, encodeSniffer } from "@/lib/tools/fortios-sniffer-builder/share"; // this tool's share spec and check
// Up and down arrows for the port and the packet count (03/11/2026).
import { StepperField, stepperKeyDown } from "@/components/NumberStepper";
import {
  runLocalisable,
  buildLocalisable,
  VERBOSITY,
  TSFORMATS,
  type SnifferResult,
  type SnifferArg,
  type SnifferNote,
} from "@/lib/tools/fortios-sniffer-builder/compute"; // the readings with sentence ids (02/11/2026)
import { engineTexts, type EngineText, type EngineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the explanations, notes and errors arrive as EngineTexts from buildLocalisable() and
// runLocalisable(); the verbosity help texts (verb.<n>), the timestamp formats (ts.<a|l|rel>.label) and the
// "(relative)" value are looked up by key; all under engine.* in the pack, so the pt-BR page reads in Portuguese.

/** The decode-run result, with thrown errors folded into an error envelope. */
type LiveDecode = { ok: true; value: SnifferResult<EngineText> } | { ok: false; error: unknown }; // the error kept, so it can be translated

// The one-click example (D-83): a documented FortiOS capture command, so the
// decode shown matches genuine CLI usage.
const EXAMPLE = "diagnose sniffer packet any 'host 192.168.1.10 and tcp port 443' 4 0 l";

/** A TCP or UDP port: the port field's arrows stay between these. */
const PORT_MIN = 1;
// The largest port number.
const PORT_MAX = 65535;

/** Map a note kind to the shared panel styling used across tools. */
function noteClass(kind: SnifferNote["kind"]): string {
  if (kind === "warn") return "jwt-panel dig-warnings";
  return "jwt-panel";
}

/** One explained argument: label, value, plain-language explanation. */
function ArgCard({ a, tx }: { a: SnifferArg<EngineText>; tx: EngineTexts }) {
  return (
    <article className="tmsh-object sniff-arg">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{a.label}</span>
        <span className="tmsh-object-name mono">{a.value === "(relative)" ? tx.key("value.relative", a.value) : a.value}</span>
      </header>
      <p className="gdf-step-behavior">{tx.say(a.explain)}</p>
    </article>
  );
}

/** The shared result view: command box + per-argument breakdown + notes. */
function ResultView({
  result,
  t,
  tx,
  share,
}: {
  result: SnifferResult<EngineText>;
  t: ReturnType<typeof useTranslations>;
  /** The engine's sentences in the page's language. */
  tx: EngineTexts;
  /** The Share results row, shown under the command box (2026-11-01). */
  share?: ReactNode;
}) {
  return (
    <div className="jwt-results sniff-results">
      {/* The composed / echoed command. */}
      <div className="jwt-panel">
        <div className="jwt-panel-title">{t("commandTitle")}</div>
        <pre className="sniff-command mono">{result.command}</pre>
      </div>
      {/* Share results (2026-11-01): under the command box, before the notes. */}
      {share}

      {/* Notes / warnings. */}
      {result.notes.length > 0 && (
        <div className={noteClass(result.notes[0].kind)}>
          <div className="jwt-panel-title">{t("notesTitle")}</div>
          <ul className="dig-warning-list">
            {result.notes.map((n, i) => (
              <li key={i} className={`sniff-note sniff-note-${n.kind}`}>{tx.say(n.text)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-argument breakdown. */}
      {result.args.length > 0 && (
        <>
          <div className="jwt-panel">
            <div className="jwt-panel-title">{t("breakdownTitle")}</div>
          </div>
          {result.args.map((a, i) => (
            <ArgCard a={a} tx={tx} key={i} />
          ))}
        </>
      )}
    </div>
  );
}

export default function FortiosSnifferBuilderTool() {
  const t = useTranslations("tools.fortios-sniffer-builder");
  const tx = engineTexts(t); // the engine's sentences in the page's language

  // Mode toggle.
  const [mode, setMode] = useState<"build" | "decode">("build");

  // Builder-form state.
  const [iface, setIface] = useState("any");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [proto, setProto] = useState("any");
  const [verbose, setVerbose] = useState(4);
  const [count, setCount] = useState(0);
  const [tsformat, setTsformat] = useState("l");

  // Decoder state.
  const [pasteInput, setPasteInput] = useState("");
  // The packet count as its field's onChange reads it (typed or stepped): a whole number, never below 0.
  const setCountFromText = (text: string) => {
    // A whole number, if any.
    const n = parseInt(text, 10);
    // Nothing readable is 0 (until Ctrl+C); a negative is 0 too.
    setCount(Number.isNaN(n) ? 0 : Math.max(0, n));
  };

  // An arriving share link (2026-11-01): the mode opens and its fields fill (the other mode's keep theirs).
  useShareArrival(FORTIOS_SNIFFER_SHARE, (s) => {
    setMode(s.mode); // the sender's mode
    if (s.mode === "decode") { setPasteInput(s.input); return; } // the pasted command
    setIface(s.iface); setHost(s.host); setPort(s.port); setProto(s.proto); setVerbose(s.verbose); setCount(s.count); setTsformat(s.tsformat); // the form
  });
  // The state Share results reads, the FortiOS check on a pasted command, and the encoding (memoised).
  const shareState = useMemo(() => ({ mode, iface, host, port, proto, verbose, count, tsformat, input: pasteInput }), [mode, iface, host, port, proto, verbose, count, tsformat, pasteInput]); // the page's state
  const shareCheck = useMemo(() => checkSnifferPaste(shareState), [shareState]); // the report in Decode mode, or null
  const share = useMemo(() => encodeSniffer(shareState, shareCheck), [shareState, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing
  /** The Share results row (the same in both modes; the carries line names the mode). */
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries", { mode })} details={[shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")]} blockedMessage={shareBlocked} title={t("name")} />
    </div>
  ); // one row

  // Build result: pure, recomputed from the form.
  const builtResult = useMemo(
    () => buildLocalisable({ iface, host, port, proto, verbose, count, tsformat }), // the reading, sentences with ids
    [iface, host, port, proto, verbose, count, tsformat],
  );

  // Decode result: wrapped because the engine throws on oversized input.
  const decodeResult: LiveDecode = useMemo(() => {
    try {
      return { ok: true, value: runLocalisable(pasteInput).result }; // the reading, sentences with ids
    } catch (e) {
      return { ok: false, error: e }; // shown through tx.error
    }
  }, [pasteInput]);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool sniff-tool">
      {/* Mode toggle */}
      <div className="sniff-modes" role="tablist" aria-label={t("modeLabel")}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "build"}
          className={`b64-copy sniff-mode ${mode === "build" ? "sniff-mode-on" : ""}`}
          onClick={() => setMode("build")}
        >
          {t("modeBuild")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "decode"}
          className={`b64-copy sniff-mode ${mode === "decode" ? "sniff-mode-on" : ""}`}
          onClick={() => setMode("decode")}
        >
          {t("modeDecode")}
        </button>
      </div>

      {/* BUILD MODE: the form */}
      {mode === "build" && (
        <div className="cidr-input-row sniff-form">
          <div className="sniff-grid">
            <label className="sniff-field" htmlFor="sn-iface">
              <span className="sniff-field-label">{t("ifaceLabel")}</span>
              <input
                id="sn-iface"
                className="cidr-input sniff-in"
                value={iface}
                onChange={(e) => setIface(e.target.value)}
                spellCheck={false}
                placeholder="any"
              />
            </label>

            <label className="sniff-field" htmlFor="sn-host">
              <span className="sniff-field-label">{t("hostLabel")}</span>
              <input
                id="sn-host"
                className="cidr-input sniff-in"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                spellCheck={false}
                placeholder="10.1.1.1"
              />
            </label>

            <div className="sniff-field">
              {/* The label names the field by its id (it no longer wraps it, so the arrows stay out of its name). */}
              <label className="sniff-field-label" htmlFor="sn-port">{t("portLabel")}</label>
              {/* Up and down arrows: one port a press, 1 to 65535; set as typing would. */}
              <StepperField value={port} onValue={setPort} min={PORT_MIN} max={PORT_MAX} integer label={t("portLabel")} inputId="sn-port">
                <input
                  id="sn-port"
                  className="cidr-input sniff-in"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  // Arrow Up and Down (Page Up and Down: ten) step the port from the keyboard.
                  onKeyDown={stepperKeyDown({ value: port, onValue: setPort, min: PORT_MIN, max: PORT_MAX, integer: true })}
                  spellCheck={false}
                  placeholder="443"
                />
              </StepperField>
            </div>

            <label className="sniff-field" htmlFor="sn-proto">
              <span className="sniff-field-label">{t("protoLabel")}</span>
              <select
                id="sn-proto"
                className="cidr-input sniff-in"
                value={proto}
                onChange={(e) => setProto(e.target.value)}
              >
                <option value="any">any</option>
                <option value="tcp">tcp</option>
                <option value="udp">udp</option>
                <option value="icmp">icmp</option>
                <option value="arp">arp</option>
                <option value="ip">ip</option>
                <option value="ip6">ip6</option>
                <option value="gre">gre</option>
                <option value="esp">esp</option>
              </select>
            </label>

            <label className="sniff-field" htmlFor="sn-verbose">
              <span className="sniff-field-label">{t("verbLabel")}</span>
              <select
                id="sn-verbose"
                className="cidr-input sniff-in"
                value={verbose}
                onChange={(e) => setVerbose(parseInt(e.target.value, 10))}
              >
                {VERBOSITY.map((v) => (
                  <option key={v.level} value={v.level}>
                    {v.level}: {tx.key(`verb.${v.level}`, v.help)}
                  </option>
                ))}
              </select>
            </label>

            <div className="sniff-field">
              {/* The label names the field by its id (it no longer wraps it, so the arrows stay out of its name). */}
              <label className="sniff-field-label" htmlFor="sn-count">{t("countLabel")}</label>
              {/* Up and down arrows: one packet a press, from 0 (until Ctrl+C); no upper bound (the engine has none). */}
              <StepperField value={String(Number.isFinite(count) ? count : 0)} onValue={setCountFromText} min={0} integer label={t("countLabel")} inputId="sn-count">
                <input
                  id="sn-count"
                  type="number"
                  min={0}
                  className="cidr-input sniff-in"
                  value={Number.isFinite(count) ? count : 0}
                  // Typed: the same reading as the arrows.
                  onChange={(e) => setCountFromText(e.target.value)}
                />
              </StepperField>
            </div>

            <label className="sniff-field" htmlFor="sn-ts">
              <span className="sniff-field-label">{t("tsLabel")}</span>
              <select
                id="sn-ts"
                className="cidr-input sniff-in"
                value={tsformat}
                onChange={(e) => setTsformat(e.target.value)}
              >
                {TSFORMATS.map((ts) => (
                  <option key={ts.code || "rel"} value={ts.code}>
                    {ts.code === "" ? tx.key("value.relative", "(relative)") : ts.code}: {tx.key(`ts.${ts.code || "rel"}.label`, ts.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="cidr-privacy">
            <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
          </p>
        </div>
      )}

      {/* DECODE MODE: the paste box */}
      {mode === "decode" && (
        <div className="cidr-input-row">
          <div className="dig-input-head">
            <label className="cidr-label" htmlFor="sn-input">
              {t("pasteLabel")}
            </label>
            <div className="dig-input-actions">
              <button type="button" className="b64-copy" onClick={() => setPasteInput(EXAMPLE)}>{t("example")}</button>
              <button type="button" className="b64-copy" onClick={() => setPasteInput("")}>{t("clear")}</button>
            </div>
          </div>
          <textarea
            id="sn-input"
            className="cidr-input mono saml-textarea json-input tmsh-input"
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            placeholder={t.raw("pastePlaceholder")}
            spellCheck={false}
            rows={4}
            aria-describedby="sn-privacy"
          />
          <p id="sn-privacy" className="cidr-privacy">
            <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
          </p>
        </div>
      )}

      {/* Result area */}
      {mode === "build" && <ResultView result={builtResult} t={t} tx={tx} share={shareRow} />}

      {mode === "decode" && !decodeResult.ok && (
        <p className="cidr-error" role="alert">{tx.error(decodeResult.error)}</p>
      )}
      {mode === "decode" && decodeResult.ok && (
        <ResultView result={decodeResult.value} t={t} tx={tx} share={decodeResult.value.mode === "decode" ? shareRow : undefined} />
      )}
    </div>
  );
}
