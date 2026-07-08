// ============================================================================
// src/components/DevOtherWebSerialTool.tsx
// ----------------------------------------------------------------------------
// WEBSERIAL CONSOLE — a green-room resident. A browser serial terminal for
// network gear: console cable -> USB adapter -> the browser.
//
// WHY GREEN: it uses the Web Serial hardware-permission API and holds a LIVE,
// interactive session — there is no request/response to golden-vector. That is
// a shape the catalogue cannot hold. The line-format presets are the only
// deterministic part and are trivial; the value is the live console.
//
// HONESTY, on the door and here: Web Serial is Chromium-only and permission-
// gated (the browser shows its own device picker). The tool never stores what
// scrolls by; the session lives in memory and is gone on reload unless the
// user downloads it. Nothing is sent anywhere — this is browser<->device only.
//
// Web Serial types are not in the ambient lib set; the minimal shapes used are
// declared locally and every call is feature-detected before use.
// ============================================================================
"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// -- Minimal Web Serial typings (feature-detected at runtime) ---------------
interface SerialPortLike {
  open(options: { baudRate: number; dataBits?: number; stopBits?: number; parity?: string }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}
interface SerialLike {
  requestPort(): Promise<SerialPortLike>;
}
function getSerial(): SerialLike | null {
  const s = (navigator as Navigator & { serial?: SerialLike }).serial;
  return s ?? null;
}

const BAUD_PRESETS = [9600, 19200, 38400, 57600, 115200];

type Status = "idle" | "connected" | "error";

export default function DevOtherWebSerialTool() {
  const t = useTranslations("devOther.webserial");
  const supported = typeof navigator !== "undefined" && !!getSerial();

  const [status, setStatus] = useState<Status>("idle");
  const [baud, setBaud] = useState(9600);
  const [log, setLog] = useState("");
  const [line, setLine] = useState("");
  const portRef = useRef<SerialPortLike | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const keepReading = useRef(false);

  const append = useCallback((text: string) => {
    setLog((prev) => (prev + text).slice(-100_000)); // cap scrollback in memory
  }, []);

  const readLoop = useCallback(
    async (port: SerialPortLike) => {
      const decoder = new TextDecoder();
      while (keepReading.current && port.readable) {
        const reader = port.readable.getReader();
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) append(decoder.decode(value, { stream: true }));
          }
        } catch {
          break;
        } finally {
          reader.releaseLock();
        }
      }
    },
    [append],
  );

  const connect = useCallback(async () => {
    const serial = getSerial();
    if (!serial) return;
    try {
      const port = await serial.requestPort(); // browser's own permission UI
      await port.open({ baudRate: baud, dataBits: 8, stopBits: 1, parity: "none" });
      portRef.current = port;
      if (port.writable) writerRef.current = port.writable.getWriter();
      keepReading.current = true;
      setStatus("connected");
      const stamp = new Date().toISOString().slice(11, 19);
      append(`[${stamp}] ${t("opened", { baud })}\n`);
      readLoop(port);
    } catch {
      // User cancelled the picker, or the port failed to open.
      setStatus("error");
    }
  }, [baud, append, readLoop, t]);

  const disconnect = useCallback(async () => {
    keepReading.current = false;
    try {
      writerRef.current?.releaseLock();
      await portRef.current?.close();
    } catch {
      /* already closed */
    }
    writerRef.current = null;
    portRef.current = null;
    setStatus("idle");
  }, []);

  const send = useCallback(async () => {
    const w = writerRef.current;
    if (!w) return;
    const enc = new TextEncoder();
    await w.write(enc.encode(line + "\r\n"));
    append(`> ${line}\n`);
    setLine("");
  }, [line, append]);

  const download = useCallback(() => {
    const blob = new Blob([log], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "serial-session.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [log]);

  if (!supported) {
    return (
      <div className="cidr-tool jwt-tool">
        <p className="cidr-error" role="alert">
          {t("unsupported")}
        </p>
        <p className="cipher-note">{t("unsupportedHint")}</p>
      </div>
    );
  }

  return (
    <div className="cidr-tool jwt-tool">
      <div className="drill-config">
        <div className="ws-controls">
          <label className="cidr-label" htmlFor="ws-baud">
            {t("baud")}
          </label>
          <select
            id="ws-baud"
            className="cidr-input"
            value={baud}
            onChange={(e) => setBaud(Number(e.target.value))}
            disabled={status === "connected"}
            style={{ maxWidth: "10rem" }}
          >
            {BAUD_PRESETS.map((b) => (
              <option key={b} value={b}>
                {b} 8-N-1
              </option>
            ))}
          </select>
          {status !== "connected" ? (
            <button type="button" className="b64-copy" onClick={connect}>
              {t("connect")}
            </button>
          ) : (
            <button type="button" className="b64-copy" onClick={disconnect}>
              {t("disconnect")}
            </button>
          )}
          {log && (
            <button type="button" className="b64-copy" onClick={download}>
              {t("download")}
            </button>
          )}
        </div>
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">🔒</span> {t("runsLocally")}
        </p>
      </div>

      {status === "error" && (
        <p className="cidr-error" role="alert">
          {t("connectError")}
        </p>
      )}

      <pre className="ws-console mono" aria-live="polite">
        {log || t("consolePlaceholder")}
      </pre>

      {status === "connected" && (
        <div className="drill-answer-row" style={{ marginTop: "0.6rem" }}>
          <input
            className="cidr-input mono"
            value={line}
            onChange={(e) => setLine(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder={t("linePlaceholder")}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="b64-copy" onClick={send}>
            {t("send")}
          </button>
        </div>
      )}
    </div>
  );
}
