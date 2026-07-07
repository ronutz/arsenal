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
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  build,
  VERBOSITY,
  TSFORMATS,
  type SnifferResult,
  type SnifferArg,
  type SnifferNote,
} from "@/lib/tools/fortios-sniffer-builder";

/** The decode-run result, with thrown errors folded into an error envelope. */
type LiveDecode = { ok: true; value: SnifferResult } | { ok: false; message: string };

// The one-click example (D-83): a documented FortiOS capture command, so the
// decode shown matches genuine CLI usage.
const EXAMPLE = "diagnose sniffer packet any 'host 192.168.1.10 and tcp port 443' 4 0 l";

/** Map a note kind to the shared panel styling used across tools. */
function noteClass(kind: SnifferNote["kind"]): string {
  if (kind === "warn") return "jwt-panel dig-warnings";
  return "jwt-panel";
}

/** One explained argument: label, value, plain-language explanation. */
function ArgCard({ a }: { a: SnifferArg }) {
  return (
    <article className="tmsh-object sniff-arg">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{a.label}</span>
        <span className="tmsh-object-name mono">{a.value}</span>
      </header>
      <p className="gdf-step-behavior">{a.explain}</p>
    </article>
  );
}

/** The shared result view: command box + per-argument breakdown + notes. */
function ResultView({
  result,
  t,
}: {
  result: SnifferResult;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="jwt-results sniff-results">
      {/* The composed / echoed command. */}
      <div className="jwt-panel">
        <div className="jwt-panel-title">{t("commandTitle")}</div>
        <pre className="sniff-command mono">{result.command}</pre>
      </div>

      {/* Notes / warnings. */}
      {result.notes.length > 0 && (
        <div className={noteClass(result.notes[0].kind)}>
          <div className="jwt-panel-title">{t("notesTitle")}</div>
          <ul className="dig-warning-list">
            {result.notes.map((n, i) => (
              <li key={i} className={`sniff-note sniff-note-${n.kind}`}>{n.text}</li>
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
            <ArgCard a={a} key={i} />
          ))}
        </>
      )}
    </div>
  );
}

export default function FortiosSnifferBuilderTool() {
  const t = useTranslations("tools.fortios-sniffer-builder");

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

  // Build result: pure, recomputed from the form.
  const builtResult = useMemo(
    () => build({ iface, host, port, proto, verbose, count, tsformat }),
    [iface, host, port, proto, verbose, count, tsformat],
  );

  // Decode result: wrapped because the engine throws on oversized input.
  const decodeResult: LiveDecode = useMemo(() => {
    try {
      return { ok: true, value: run(pasteInput).result };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
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

            <label className="sniff-field" htmlFor="sn-port">
              <span className="sniff-field-label">{t("portLabel")}</span>
              <input
                id="sn-port"
                className="cidr-input sniff-in"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                spellCheck={false}
                placeholder="443"
              />
            </label>

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
                    {v.level} — {v.help}
                  </option>
                ))}
              </select>
            </label>

            <label className="sniff-field" htmlFor="sn-count">
              <span className="sniff-field-label">{t("countLabel")}</span>
              <input
                id="sn-count"
                type="number"
                min={0}
                className="cidr-input sniff-in"
                value={Number.isFinite(count) ? count : 0}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setCount(Number.isNaN(n) ? 0 : Math.max(0, n));
                }}
              />
            </label>

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
                    {ts.code === "" ? "(relative)" : ts.code} — {ts.label}
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
      {mode === "build" && <ResultView result={builtResult} t={t} />}

      {mode === "decode" && !decodeResult.ok && (
        <p className="cidr-error" role="alert">{decodeResult.message}</p>
      )}
      {mode === "decode" && decodeResult.ok && (
        <ResultView result={decodeResult.value} t={t} />
      )}
    </div>
  );
}
