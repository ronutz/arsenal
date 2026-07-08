// ============================================================================
// src/components/DevOtherPcapTool.tsx
// ----------------------------------------------------------------------------
// PCAP ANALYZER — the green room's anchor tenant client.
//
// The file-input axis made concrete: drop (or pick) a .pcap/.pcapng and it is
// read with FileReader into an ArrayBuffer and dissected ENTIRELY in the
// browser. Nothing is uploaded — the notice and the privacy line both say so,
// and it is literally true: there is no fetch in this component.
//
// Honesty guards: a hard size cap (captures can be huge; we refuse rather than
// hang the tab), and the summary states its own DEPTH — v1 dissects L2-L4;
// application-payload parsing is a stated future pass, not a silent gap.
// ============================================================================
"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  analyzePcap,
  PcapError,
  type PcapSummary,
} from "@/lib/dev-other/pcap/compute";

// Refuse files larger than this; a browser dissector is for triage, not for
// multi-gigabyte forensic captures. Stated to the user up front.
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

type State =
  | { phase: "idle" }
  | { phase: "reading"; name: string }
  | { phase: "done"; name: string; summary: PcapSummary }
  | { phase: "error"; code: string };

export default function DevOtherPcapTool() {
  const t = useTranslations("devOther.pcap");
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ phase: "idle" });
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > MAX_BYTES) {
        setState({ phase: "error", code: "tooBig" });
        return;
      }
      setState({ phase: "reading", name: file.name });
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const buf = reader.result as ArrayBuffer;
          const { summary } = analyzePcap(buf);
          setState({ phase: "done", name: file.name, summary });
        } catch (e) {
          const code = e instanceof PcapError ? e.code : "format";
          setState({ phase: "error", code });
        }
      };
      reader.onerror = () => setState({ phase: "error", code: "read" });
      reader.readAsArrayBuffer(file);
    },
    [],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const fmtBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const summary = state.phase === "done" ? state.summary : null;

  return (
    <div className="cidr-tool jwt-tool">
      {/* Drop zone / picker — the file input contract. */}
      <div
        className={dragging ? "pcap-drop pcap-drop--over" : "pcap-drop"}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pcap,.pcapng,.cap"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <p className="pcap-drop-title">{t("dropTitle")}</p>
        <p className="pcap-drop-hint">{t("dropHint")}</p>
      </div>

      <p className="cidr-privacy">
        <span className="cidr-lock" aria-hidden="true">
          🔒
        </span>{" "}
        {t("runsLocally")}
      </p>

      {state.phase === "reading" && <p className="cipher-note">{t("reading", { name: state.name })}</p>}

      {state.phase === "error" && (
        <p className="cidr-error" role="alert">
          {t(`errors.${state.code}`, { max: "50 MB" })}
        </p>
      )}

      {summary && (
        <div className="jwt-results">
          {/* Depth honesty banner. */}
          <p className="cipher-note pcap-depth">{t("depthNote")}</p>

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("overview")}</h4>
            <dl className="jwt-claims">
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("f.format")}</dt>
                <dd className="jwt-claim-value mono">
                  {summary.format} · {summary.byteOrder} · linktype {summary.linkType}
                </dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("f.packets")}</dt>
                <dd className="jwt-claim-value mono">{summary.packetCount}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("f.bytes")}</dt>
                <dd className="jwt-claim-value mono">{fmtBytes(summary.totalBytes)}</dd>
              </div>
              {summary.durationSec > 0 && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("f.duration")}</dt>
                  <dd className="jwt-claim-value mono">{summary.durationSec.toFixed(3)} s</dd>
                </div>
              )}
            </dl>
            <div className="pcap-proto-rows">
              <div className="pcap-proto-line">
                <span className="pcap-proto-label mono">L3</span>
                {Object.entries(summary.l3Counts).map(([k, v]) => (
                  <span key={k} className="admin-tag">
                    {k} {v}
                  </span>
                ))}
              </div>
              <div className="pcap-proto-line">
                <span className="pcap-proto-label mono">L4</span>
                {Object.entries(summary.l4Counts).map(([k, v]) => (
                  <span key={k} className="admin-tag">
                    {k} {v}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {summary.flags.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("flagsTitle")}</h4>
              {summary.flags.map((f) => (
                <p
                  key={f.id}
                  className={f.severity === "warn" ? "fc-warning" : "cipher-note"}
                >
                  {t(`flags.${f.key}`, f.values ?? {})}
                </p>
              ))}
            </section>
          )}

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("talkersTitle")}</h4>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("f.host")}</th>
                    <th>{t("f.pkts")}</th>
                    <th>{t("f.bytes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topTalkers.map((tk) => (
                    <tr key={tk.host}>
                      <td className="mono">{tk.host}</td>
                      <td className="mono">{tk.packets}</td>
                      <td className="mono">{fmtBytes(tk.bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("convTitle")}</h4>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("f.endpoints")}</th>
                    <th>{t("f.proto")}</th>
                    <th>{t("f.pkts")}</th>
                    <th>{t("f.bytes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.conversations.map((c) => (
                    <tr key={`${c.a}|${c.b}|${c.protocol}`}>
                      <td className="mono">
                        {c.a} ↔ {c.b}
                      </td>
                      <td className="mono">{c.protocol}</td>
                      <td className="mono">{c.packets}</td>
                      <td className="mono">{fmtBytes(c.bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
