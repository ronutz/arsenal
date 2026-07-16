// ============================================================================
// src/components/DevOtherWebSerialTool.tsx
// ----------------------------------------------------------------------------
// WEBSERIAL CONSOLE (Tier 1) - a green-room resident. A browser serial terminal
// for network gear: console cable -> USB adapter -> the browser.
//
// WHY GREEN: it uses the Web Serial hardware-permission API and holds a LIVE,
// interactive session - there is no request/response to golden-vector. That is a
// shape the catalogue cannot hold. The line-format presets are the only
// deterministic part; the value is the live console.
//
// TIER 1 adds real terminal controls on top of the original connect/read/send:
//   - copy-all and clear (download already existed)
//   - per-line timestamps (recorded always, shown on toggle)
//   - line-ending selector on send (CR / LF / CRLF; CR default for network gear)
//   - local echo (off by default; most console gear echoes for you)
//   - paste-a-block with a per-line delay (so a console does not drop config)
//   - Ctrl-C / Ctrl-Z / Esc and a serial Break
//   - font-size control and terminal themes
//   - bounded scrollback, pause-on-scroll-up + jump-to-bottom, in-buffer search
//
// 2026-07-16 feature wave (PRIME directives, ideas cross-checked against the
// minimal reference implementation at webserialconsole.com - from which we
// adopt the full standard baud ladder 4800..921600):
//   - TWO-TIER SCROLLBACK: the DOM renders at most MAX_LINES memoized rows
//     (fast), while sessionRef archives EVERY completed line since connect
//     (capped at ARCHIVE_MAX as a memory guard). Copy/Save export the full
//     archive, not just the visible window - huge scrollback with no render
//     cost, exactly the "big but cheap" requirement.
//   - REAL-TIME DISK LOG: File System Access API (showSaveFilePicker +
//     createWritable); every line is appended to the chosen file as it
//     arrives, through a promise queue that preserves order. Chromium-only,
//     like Web Serial itself - feature-detected, honest sys-note otherwise.
//   - FULLSCREEN CONSOLE: the console wrap alone goes fullscreen, with a
//     compact control bar OVERLAYED at the top (exit, connect, clear, save,
//     log, font size, send) - the terminal-controls-on-top layout PRIME asked
//     for. Plus free RESIZE of the console via the native CSS resize handle
//     on the wrap's lower-right corner.
//   - INTERACTIVE TYPING (PRIME 2026-07-16, "it should"): a true terminal
//     input mode. With the toggle on, clicking the console focuses it and
//     every keystroke goes to the wire character-at-a-time: printables as-is,
//     Enter = the configured line ending, Backspace = 0x7F (the PuTTY
//     convention; most device consoles accept it, many also take 0x08), Tab
//     0x09, Esc 0x1B, arrows as ANSI ESC[A-D, Ctrl+letter as control bytes
//     (Ctrl-C with an active text selection still copies; Ctrl-V pastes and
//     the pasted text is sent raw). stopPropagation on handled keys shields
//     the site's single-key global shortcuts. Line mode remains the default -
//     interactive is what pagers, menus, and password prompts need.
//   - advanced connection params (data bits / parity / stop bits / flow control)
//
// HONESTY, on the door and here: Web Serial is Chromium-only and permission-
// gated (the browser shows its own device picker). The tool never stores what
// scrolls by; the session lives in memory and is gone on reload unless the user
// downloads it. Nothing is sent anywhere - this is browser<->device only.
//
// Web Serial types are not in the ambient lib set; the minimal shapes used are
// declared locally and every call is feature-detected before use.
// ============================================================================
"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { detectTokens } from "@/lib/webserial/detectors";
import { highlight, OS_KEYS, type OsKey } from "@/lib/webserial/highlight";
import { snippetsFor } from "@/lib/webserial/snippets";

// -- Minimal Web Serial typings (feature-detected at runtime) ---------------
interface SerialPortLike {
  open(options: {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: string;
    flowControl?: string;
  }): Promise<void>;
  close(): Promise<void>;
  // Serial control signals; used to raise a Break condition. Optional because
  // not every implementation exposes it.
  setSignals?(signals: { break?: boolean; dataTerminalReady?: boolean; requestToSend?: boolean }): Promise<void>;
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

// -- Presets ----------------------------------------------------------------
// Full standard ladder (idea adopted from webserialconsole.com's picker),
// extended down to 1200/2400 (PRIME 2026-07-16). Note on "1200/75": that
// split rate is ITU-T V.23 - the videotex/Minitel asymmetric MODEM standard
// (1200 bps down, 75 bps up). A UART runs one symmetric clock and the Web
// Serial API's SerialOptions takes a single baudRate integer, so split rates
// cannot be expressed here; 1200 is the plain symmetric rate that belongs.
const BAUD_PRESETS = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
const DATA_BITS = [8, 7];
const STOP_BITS = [1, 2];
const PARITIES = ["none", "even", "odd"] as const;
const FLOW = ["none", "hardware"] as const;
const LINE_ENDINGS: Record<string, string> = { cr: "\r", lf: "\n", crlf: "\r\n" };
const THEMES = ["obsidian", "matrix", "amber", "paper"] as const;
const MAX_LINES = 10000; // RENDERED scrollback cap (DOM bound; rows are memoized)
const ARCHIVE_MAX = 200000; // full-session archive cap (memory guard, ~20-40 MB worst case)
const RAW_MAX = 8192; // raw-byte capture cap for the hex view
const FONT_MIN = 11;
const FONT_MAX = 20;

type Status = "idle" | "connected" | "error";
type LineKind = "rx" | "tx" | "sys";
interface LogLine {
  id: number;
  ts: number; // epoch ms when the line completed
  kind: LineKind;
  text: string;
}

// Local time HH:MM:SS for a timestamp prefix.
function hhmmss(ts: number): string {
  return new Date(ts).toTimeString().slice(0, 8);
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Render captured bytes as a classic hexdump: offset, 16 hex bytes, ASCII.
function hexdump(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let off = 0; off < bytes.length; off += 16) {
    const slice = bytes.subarray(off, off + 16);
    const hex = Array.from(slice)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    const ascii = Array.from(slice)
      .map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : "."))
      .join("");
    lines.push(`${off.toString(16).padStart(8, "0")}  ${hex.padEnd(47)}  ${ascii}`);
  }
  return lines.join("\n");
}

// A single highlighted console line, memoized so a completed line is tokenized
// once even as the buffer around it re-renders.
const HlLine = memo(function HlLine({ text, os }: { text: string; os: OsKey }) {
  const tokens = useMemo(() => highlight(text, os), [text, os]);
  return (
    <>
      {tokens.map((tok, i) =>
        tok.cls ? (
          <span key={i} className={tok.cls}>
            {tok.text}
          </span>
        ) : (
          <span key={i}>{tok.text}</span>
        ),
      )}
    </>
  );
});

export default function DevOtherWebSerialTool() {
  const t = useTranslations("devOther.webserial");
  const locale = useLocale();
  const supported = typeof navigator !== "undefined" && !!getSerial();

  // ---- connection ----
  const [status, setStatus] = useState<Status>("idle");
  const [baud, setBaud] = useState(9600);
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState<string>("none");
  const [flow, setFlow] = useState<string>("none");

  // ---- session buffer (completed lines + the in-progress trailing partial) --
  const [buf, setBuf] = useState<{ lines: LogLine[]; partial: string }>({ lines: [], partial: "" });
  const idRef = useRef(0);
  // Full-session archive (two-tier scrollback): every completed line, already
  // formatted (timestamp + marker + text), independent of the rendered window.
  const sessionRef = useRef<string[]>([]);
  // Real-time disk log: FS Access API writable + a promise queue for ordering.
  const logWriterRef = useRef<FileSystemWritableFileStream | null>(null);
  const logQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [diskLog, setDiskLog] = useState(false);
  // Fullscreen console state (the wrap element is the fullscreen target).
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  // ---- input + sending ----
  const [line, setLine] = useState("");
  const [ending, setEnding] = useState("cr");
  // Interactive terminal-typing mode (off = classic line mode).
  const [interactive, setInteractive] = useState(false);
  const [localEcho, setLocalEcho] = useState(false);

  // ---- display ----
  const [timestamps, setTimestamps] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [theme, setTheme] = useState<string>("obsidian");
  const [search, setSearch] = useState("");
  const [detect, setDetect] = useState(true);
  const [os, setOs] = useState<OsKey>("none");
  const [hexView, setHexView] = useState(false);
  const rawRef = useRef<Uint8Array>(new Uint8Array(0));
  const historyRef = useRef<string[]>([]);
  const histPosRef = useRef<number | null>(null);
  const draftRef = useRef("");

  // ---- paste-a-block ----
  const [block, setBlock] = useState("");
  const [pasteDelay, setPasteDelay] = useState(30);

  // ---- autoscroll ----
  const consoleRef = useRef<HTMLPreElement | null>(null);
  const [pinned, setPinned] = useState(true); // stuck to the bottom

  const portRef = useRef<SerialPortLike | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const keepReading = useRef(false);

  // ---- buffer helpers -------------------------------------------------------
  // Ingest a decoded chunk: split on newlines, completing the partial; each
  // completed line is timestamped now. The trailing (unterminated) remainder
  // stays as the partial, so a prompt with no newline still shows.
  // Format a line the way exports want it (timestamps ALWAYS in the archive -
  // logs without time are half a log), append to the archive, and stream it to
  // the disk log if one is open. Called for every completed line of any kind.
  const record = useCallback((kind: LineKind, text: string, ts: number) => {
    const marker = kind === "tx" ? "> " : kind === "sys" ? "-- " : "";
    const lineOut = `[${hhmmss(ts)}] ${marker}${text}`;
    const arch = sessionRef.current;
    arch.push(lineOut);
    if (arch.length > ARCHIVE_MAX) arch.splice(0, arch.length - ARCHIVE_MAX);
    const w = logWriterRef.current;
    if (w) {
      // Promise queue: writes stay ordered; one failure stops the log honestly.
      logQueueRef.current = logQueueRef.current
        .then(() => w.write(lineOut + "\n"))
        .catch(() => {
          logWriterRef.current = null;
          setDiskLog(false);
        });
    }
  }, []);

  const ingest = useCallback((chunk: string) => {
    setBuf((prev) => {
      let partial = prev.partial + chunk;
      const lines = prev.lines.slice();
      let nl: number;
      while ((nl = partial.indexOf("\n")) >= 0) {
        const text = partial.slice(0, nl).replace(/\r$/, "");
        const ts = Date.now();
        record("rx", text, ts);
        lines.push({ id: idRef.current++, ts, kind: "rx", text });
        partial = partial.slice(nl + 1);
      }
      return { lines: lines.length > MAX_LINES ? lines.slice(-MAX_LINES) : lines, partial };
    });
  }, [record]);

  // Push a complete line we generated ourselves (sent command or system note).
  const pushLine = useCallback((kind: LineKind, text: string) => {
    const ts = Date.now();
    record(kind, text, ts);
    setBuf((prev) => {
      const lines = prev.lines.concat({ id: idRef.current++, ts, kind, text });
      return { lines: lines.length > MAX_LINES ? lines.slice(-MAX_LINES) : lines, partial: prev.partial };
    });
  }, [record]);

  const clear = useCallback(() => {
    setBuf({ lines: [], partial: "" });
    sessionRef.current = []; // clearing clears the export archive too
    rawRef.current = new Uint8Array(0);
  }, []);

  // Bounded raw-byte capture for the hex view, kept in a ref so it never forces
  // a re-render; the hexdump is built from it during render when the view is on.
  const ingestRaw = useCallback((chunk: Uint8Array) => {
    const prev = rawRef.current;
    const merged = new Uint8Array(prev.length + chunk.length);
    merged.set(prev);
    merged.set(chunk, prev.length);
    rawRef.current = merged.length > RAW_MAX ? merged.slice(merged.length - RAW_MAX) : merged;
  }, []);

  // ---- read loop ------------------------------------------------------------
  const readLoop = useCallback(
    async (port: SerialPortLike) => {
      const decoder = new TextDecoder();
      while (keepReading.current && port.readable) {
        const reader = port.readable.getReader();
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              ingest(decoder.decode(value, { stream: true }));
              ingestRaw(value);
            }
          }
        } catch {
          break;
        } finally {
          reader.releaseLock();
        }
      }
    },
    [ingest, ingestRaw],
  );

  // ---- connect / disconnect -------------------------------------------------
  const connect = useCallback(async () => {
    const serial = getSerial();
    if (!serial) return;
    try {
      const port = await serial.requestPort(); // browser's own permission UI
      await port.open({ baudRate: baud, dataBits, stopBits, parity, flowControl: flow });
      portRef.current = port;
      if (port.writable) writerRef.current = port.writable.getWriter();
      keepReading.current = true;
      setStatus("connected");
      const params = `${dataBits}${parity[0].toUpperCase()}${stopBits}`;
      pushLine("sys", t("opened", { baud, params }));
      readLoop(port);
    } catch {
      // User cancelled the picker, or the port failed to open.
      setStatus("error");
    }
  }, [baud, dataBits, stopBits, parity, flow, pushLine, readLoop, t]);

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
    pushLine("sys", t("closed"));
  }, [pushLine, t]);

  // ---- writing --------------------------------------------------------------
  const writeRaw = useCallback(async (bytes: Uint8Array) => {
    const w = writerRef.current;
    if (!w) return;
    await w.write(bytes);
  }, []);

  const sendText = useCallback(
    async (text: string, echo: boolean) => {
      const enc = new TextEncoder();
      await writeRaw(enc.encode(text + LINE_ENDINGS[ending]));
      if (echo) pushLine("tx", text);
    },
    [ending, writeRaw, pushLine],
  );

  const send = useCallback(async () => {
    if (!writerRef.current) return;
    await sendText(line, localEcho);
    if (line.trim() && historyRef.current[historyRef.current.length - 1] !== line) {
      historyRef.current.push(line);
    }
    histPosRef.current = null;
    draftRef.current = "";
    setLine("");
  }, [line, localEcho, sendText]);

  const sendCtrl = useCallback(
    async (byte: number, label: string) => {
      await writeRaw(new Uint8Array([byte]));
      pushLine("sys", t("sentKey", { key: label }));
    },
    [writeRaw, pushLine, t],
  );

  const sendBreak = useCallback(async () => {
    const p = portRef.current;
    if (p?.setSignals) {
      try {
        await p.setSignals({ break: true });
        await sleep(120);
        await p.setSignals({ break: false });
        pushLine("sys", t("sentKey", { key: "BREAK" }));
      } catch {
        /* signal not supported */
      }
    }
  }, [pushLine, t]);

  // Send a pasted block line-by-line with a delay, so the far end does not drop
  // characters when a whole config is pasted at once.
  const sendBlock = useCallback(async () => {
    const rows = block.split("\n");
    for (const r of rows) {
      await sendText(r, true);
      await sleep(Math.max(0, pasteDelay));
    }
    setBlock("");
  }, [block, pasteDelay, sendText]);

  // ---- copy / download ------------------------------------------------------
  // Copy/Save now export the FULL session archive (two-tier scrollback), so a
  // long capture survives the rendered window's cap. Archive lines carry
  // timestamps by design; the on-screen timestamps toggle affects display only.
  const fullText = useCallback(() => {
    const body = sessionRef.current.slice();
    if (buf.partial) body.push(`[${hhmmss(Date.now())}] ${buf.partial}`);
    return body.join("\n");
  }, [buf.partial]);

  const copyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullText());
    } catch {
      /* clipboard blocked */
    }
  }, [fullText]);

  const download = useCallback(() => {
    const blob = new Blob([fullText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "web-serial-session.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [fullText]);

  // ---- interactive typing: one keystroke, one write ------------------------
  // Mapped keys are consumed (preventDefault + stopPropagation - the latter
  // also keeps the site's single-key shortcuts from firing while the console
  // is focused). Unmapped combos fall through to the browser untouched.
  const handleInteractiveKey = useCallback(
    (e: React.KeyboardEvent<HTMLPreElement>) => {
      if (!interactive || !writerRef.current) return;
      const enc = new TextEncoder();
      const fire = (bytes: Uint8Array, echoText?: string) => {
        void writeRaw(bytes);
        if (localEcho && echoText) ingest(echoText);
        e.preventDefault();
        e.stopPropagation();
      };
      // Ctrl combinations -> control bytes (1..26). Two deliberate exceptions:
      // Ctrl-C with a live selection stays a copy, and Ctrl-V is left alone so
      // the paste event below can send the clipboard text raw.
      if (e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
        const k = e.key.toLowerCase();
        if (k === "c" && window.getSelection()?.toString()) return;
        if (k === "v") return;
        const code = k.charCodeAt(0) - 96; // a=1 .. z=26
        if (code >= 1 && code <= 26) fire(new Uint8Array([code]));
        return;
      }
      if (e.metaKey || e.altKey) return; // never eat OS/browser chords
      switch (e.key) {
        case "Enter":
          fire(enc.encode(LINE_ENDINGS[ending]), "\n");
          return;
        case "Backspace":
          fire(new Uint8Array([0x7f])); // PuTTY convention (DEL); 0x08 also common
          return;
        case "Tab":
          fire(new Uint8Array([0x09]));
          return;
        case "Escape":
          fire(new Uint8Array([0x1b]));
          return;
        case "ArrowUp":
          fire(enc.encode("\x1b[A"));
          return;
        case "ArrowDown":
          fire(enc.encode("\x1b[B"));
          return;
        case "ArrowRight":
          fire(enc.encode("\x1b[C"));
          return;
        case "ArrowLeft":
          fire(enc.encode("\x1b[D"));
          return;
        default:
          if (e.key.length === 1) fire(enc.encode(e.key), e.key);
      }
    },
    [interactive, ending, localEcho, writeRaw, ingest],
  );

  // Paste while interactive: the clipboard text goes to the wire raw (no
  // added line ending), echoed if local echo is on.
  const handleInteractivePaste = useCallback(
    (e: React.ClipboardEvent<HTMLPreElement>) => {
      if (!interactive || !writerRef.current) return;
      const text = e.clipboardData.getData("text");
      if (!text) return;
      e.preventDefault();
      void writeRaw(new TextEncoder().encode(text));
      if (localEcho) ingest(text);
    },
    [interactive, localEcho, writeRaw, ingest],
  );

  // ---- real-time disk log (File System Access API; Chromium, like Web Serial) --
  // LIFECYCLE (PRIME ruling 2026-07-16): the log SURVIVES port disconnects and
  // reconnects within the page - it closes only on manual stop or on leaving
  // the page (unmount must flush; FS Access writables do not outlive the
  // document). Do not "fix" this into auto-close-on-disconnect.
  const toggleDiskLog = useCallback(async () => {
    if (logWriterRef.current) {
      // Stop: drain the queue, close the file, note it in the console.
      const w = logWriterRef.current;
      logWriterRef.current = null;
      setDiskLog(false);
      try {
        await logQueueRef.current;
        await w.close();
      } catch {
        /* the file may already be gone; nothing sensible to do */
      }
      pushLine("sys", t("logStopped"));
      return;
    }
    if (!("showSaveFilePicker" in window)) {
      pushLine("sys", t("logUnsupported"));
      return;
    }
    try {
      const handle = await (
        window as unknown as {
          showSaveFilePicker: (o?: object) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker({
        suggestedName: `web-serial-log-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`,
        types: [{ description: "Log", accept: { "text/plain": [".txt", ".log"] } }],
      });
      const writable = await handle.createWritable();
      logWriterRef.current = writable;
      logQueueRef.current = Promise.resolve();
      setDiskLog(true);
      pushLine("sys", t("logStarted"));
    } catch {
      /* user cancelled the picker - not an error */
    }
  }, [pushLine, t]);

  // Close an open log if the component unmounts (navigation away).
  useEffect(() => {
    return () => {
      const w = logWriterRef.current;
      if (w) {
        logWriterRef.current = null;
        logQueueRef.current.then(() => w.close()).catch(() => undefined);
      }
    };
  }, []);

  // ---- fullscreen console (the wrap alone; controls overlay on top) ---------
  const toggleFs = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }, []);
  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ---- autoscroll -----------------------------------------------------------
  useEffect(() => {
    const el = consoleRef.current;
    if (el && pinned) el.scrollTop = el.scrollHeight;
  }, [buf, pinned]);

  const onScroll = useCallback(() => {
    const el = consoleRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setPinned(atBottom);
  }, []);

  const jumpToBottom = useCallback(() => {
    const el = consoleRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      setPinned(true);
    }
  }, []);

  // ---- filtered display -----------------------------------------------------
  const q = search.trim().toLowerCase();
  const shown = useMemo(
    () => (q ? buf.lines.filter((l) => l.text.toLowerCase().includes(q)) : buf.lines),
    [buf.lines, q],
  );

  // ---- detected tokens (Tier 2 side panel) ----------------------------------
  // Scan the recent buffer for recognizable tokens and map each to the tool
  // that decodes it. Bounded to the last ~120 KB so a long session stays cheap.
  const detected = useMemo(() => {
    if (!detect) return [];
    const text = buf.lines.map((l) => l.text).join("\n") + (buf.partial ? "\n" + buf.partial : "");
    return detectTokens(text.length > 120_000 ? text.slice(-120_000) : text);
  }, [buf, detect]);

  const copyValue = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard blocked */
    }
  }, []);

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

  const connected = status === "connected";
  const empty = buf.lines.length === 0 && !buf.partial;

  return (
    <div className="cidr-tool jwt-tool ws-tool">
      {/* connection bar */}
      <div className="drill-config">
        <div className="ws-controls">
          {/* Fullscreen toggle, leftmost by PRIME directive (2026-07-16): the
              symbol makes it instantly findable; the accessible name stays
              localized via title + aria-label. U+26F6 SQUARE FOUR CORNERS. */}
          <button
            type="button"
            className="b64-copy ws-fsbtn"
            onClick={toggleFs}
            title={t("fullscreen")}
            aria-label={t("fullscreen")}
          >
            ⛶
          </button>
          <label className="cidr-label" htmlFor="ws-baud">
            {t("baud")}
          </label>
          <select
            id="ws-baud"
            className="cidr-input ws-select"
            value={baud}
            onChange={(e) => setBaud(Number(e.target.value))}
            disabled={connected}
          >
            {BAUD_PRESETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {!connected ? (
            <button type="button" className="b64-copy" onClick={connect}>
              {t("connect")}
            </button>
          ) : (
            <button type="button" className="b64-copy" onClick={disconnect}>
              {t("disconnect")}
            </button>
          )}
          <button type="button" className="b64-copy" onClick={copyAll} disabled={!buf.lines.length}>
            {t("copyAll")}
          </button>
          <button type="button" className={diskLog ? "b64-copy ws-logging" : "b64-copy"} onClick={toggleDiskLog}>
            {diskLog ? t("logStop") : t("logToDisk")}
          </button>
          <button type="button" className="b64-copy" onClick={download} disabled={!buf.lines.length}>
            {t("download")}
          </button>
          <button type="button" className="b64-copy" onClick={clear} disabled={empty}>
            {t("clear")}
          </button>
        </div>

        {/* advanced connection params (set before connecting) */}
        <details className="ws-advanced">
          <summary className="ws-advanced-summary">{t("advanced")}</summary>
          <div className="ws-advanced-grid">
            <label className="ws-field">
              <span>{t("dataBits")}</span>
              <select
                className="cidr-input ws-select"
                value={dataBits}
                onChange={(e) => setDataBits(Number(e.target.value))}
                disabled={connected}
              >
                {DATA_BITS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="ws-field">
              <span>{t("parity")}</span>
              <select
                className="cidr-input ws-select"
                value={parity}
                onChange={(e) => setParity(e.target.value)}
                disabled={connected}
              >
                {PARITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`parity_${p}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="ws-field">
              <span>{t("stopBits")}</span>
              <select
                className="cidr-input ws-select"
                value={stopBits}
                onChange={(e) => setStopBits(Number(e.target.value))}
                disabled={connected}
              >
                {STOP_BITS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="ws-field">
              <span>{t("flow")}</span>
              <select
                className="cidr-input ws-select"
                value={flow}
                onChange={(e) => setFlow(e.target.value)}
                disabled={connected}
              >
                {FLOW.map((f) => (
                  <option key={f} value={f}>
                    {t(`flow_${f}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>

        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {status === "error" && (
        <p className="cidr-error" role="alert">
          {t("connectError")}
        </p>
      )}

      {/* display toolbar */}
      <div className="ws-toolbar">
        <input
          className="cidr-input ws-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          spellCheck={false}
          autoComplete="off"
        />
        {q && <span className="ws-matchcount">{t("matches", { n: shown.length })}</span>}
        <label className="ws-toggle" title={t("interactiveHint")}>
          <input type="checkbox" checked={interactive} onChange={(e) => setInteractive(e.target.checked)} />
          {t("interactive")}
        </label>
        <label className="ws-toggle">
          <input type="checkbox" checked={timestamps} onChange={(e) => setTimestamps(e.target.checked)} />{" "}
          {t("timestamps")}
        </label>
        <label className="ws-toggle">
          <input type="checkbox" checked={localEcho} onChange={(e) => setLocalEcho(e.target.checked)} />{" "}
          {t("localEcho")}
        </label>
        <label className="ws-toggle">
          <input type="checkbox" checked={detect} onChange={(e) => setDetect(e.target.checked)} />{" "}
          {t("detect")}
        </label>
        <label className="ws-toggle">
          <input type="checkbox" checked={hexView} onChange={(e) => setHexView(e.target.checked)} />{" "}
          {t("hexView")}
        </label>
        <span className="ws-fontctl">
          <button
            type="button"
            className="ws-iconbtn"
            onClick={() => setFontSize((f) => Math.max(FONT_MIN, f - 1))}
            aria-label={t("fontSmaller")}
          >
            A-
          </button>
          <button
            type="button"
            className="ws-iconbtn"
            onClick={() => setFontSize((f) => Math.min(FONT_MAX, f + 1))}
            aria-label={t("fontLarger")}
          >
            A+
          </button>
        </span>
        <select
          className="cidr-input ws-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          aria-label={t("theme")}
        >
          {THEMES.map((th) => (
            <option key={th} value={th}>
              {t(`theme_${th}`)}
            </option>
          ))}
        </select>
        <select
          className="cidr-input ws-select"
          value={os}
          onChange={(e) => setOs(e.target.value as OsKey)}
          aria-label={t("highlight")}
        >
          {OS_KEYS.map((k) => (
            <option key={k} value={k}>
              {t(`os_${k}`)}
            </option>
          ))}
        </select>
      </div>

      {/* console + detected side panel */}
      <div className="ws-main">
        <div className={isFs ? "ws-console-wrap ws-console-wrap--fs" : "ws-console-wrap"} ref={wrapRef}>
          {interactive && (
            <p className="ws-interactive-hint mono">{t("interactiveHint")}</p>
          )}
          {/* Fullscreen-only control bar, OVERLAYED at the top of the console
              window (PRIME 2026-07-16): the essentials without leaving
              fullscreen - exit, session, export, log, font, and a send line. */}
          {isFs && (
            <div className="ws-fs-bar">
              <button type="button" className="b64-copy" onClick={toggleFs}>{t("exitFullscreen")}</button>
              {connected ? (
                <button type="button" className="b64-copy" onClick={disconnect}>{t("disconnect")}</button>
              ) : (
                <button type="button" className="b64-copy" onClick={connect}>{t("connect")}</button>
              )}
              <button type="button" className="b64-copy" onClick={clear} disabled={empty}>{t("clear")}</button>
              <button type="button" className="b64-copy" onClick={download} disabled={!buf.lines.length}>{t("download")}</button>
              <button type="button" className={diskLog ? "b64-copy ws-logging" : "b64-copy"} onClick={toggleDiskLog}>
                {diskLog ? t("logStop") : t("logToDisk")}
              </button>
              {/* Console-interpreter (OS) choice stays available in fullscreen
                  (PRIME 2026-07-16) - same state as the main toolbar select. */}
              <select
                className="cidr-input ws-select ws-fs-select"
                value={os}
                onChange={(e) => setOs(e.target.value as OsKey)}
                aria-label={t("highlight")}
              >
                {OS_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {t(`os_${k}`)}
                  </option>
                ))}
              </select>
              <span className="ws-fontctl">
                <button type="button" className="ws-iconbtn" onClick={() => setFontSize((f) => Math.max(FONT_MIN, f - 1))} aria-label={t("fontSmaller")}>A-</button>
                <button type="button" className="ws-iconbtn" onClick={() => setFontSize((f) => Math.min(FONT_MAX, f + 1))} aria-label={t("fontLarger")}>A+</button>
              </span>
              <input
                className="tool-input ws-fs-input mono"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder={t("linePlaceholder")}
                disabled={!connected}
              />
              <button type="button" className="b64-copy" onClick={send} disabled={!connected}>{t("send")}</button>
            </div>
          )}
          <pre
            ref={consoleRef}
            tabIndex={interactive ? 0 : -1}
            onKeyDown={interactive ? handleInteractiveKey : undefined}
            onPaste={interactive ? handleInteractivePaste : undefined}
            className={`ws-console mono ws-console--${theme}${interactive ? " ws-console--interactive" : ""}`}
            style={{ fontSize: `${fontSize}px` }}
            aria-live="polite"
            onScroll={onScroll}
          >
            {hexView ? (
              hexdump(rawRef.current) || t("hexEmpty")
            ) : empty ? (
              t("consolePlaceholder")
            ) : (
              <>
                {shown.map((l) => (
                  <span key={l.id} className={`ws-line ws-line--${l.kind}`}>
                    {timestamps && <span className="ws-ts">[{hhmmss(l.ts)}] </span>}
                    {l.kind === "tx" && <span className="ws-marker">&gt; </span>}
                    {os === "none" ? l.text : <HlLine text={l.text} os={os} />}
                    {"\n"}
                  </span>
                ))}
                {!q && buf.partial && (
                  <span className="ws-line ws-line--rx">
                    {os === "none" ? buf.partial : <HlLine text={buf.partial} os={os} />}
                  </span>
                )}
              </>
            )}
          </pre>
          {!pinned && (
            <button type="button" className="ws-jump" onClick={jumpToBottom}>
              {t("jumpToBottom")}
            </button>
          )}
        </div>

        {detect && detected.length > 0 && (
          <aside className="ws-detected">
            <div className="ws-detected-head">
              {t("detected")} <span className="ws-detected-count">{detected.length}</span>
            </div>
            <ul className="ws-detected-list">
              {detected.map((d, i) => (
                <li key={`${d.kind}-${i}`} className="ws-detected-item">
                  <span className="ws-detected-kind">{t(`kind_${d.kind}`)}</span>
                  <code className="ws-detected-value" title={d.value}>
                    {d.value}
                  </code>
                  <div className="ws-detected-actions">
                    <button type="button" className="ws-detected-btn" onClick={() => copyValue(d.value)}>
                      {t("copy")}
                    </button>
                    <a
                      className="ws-detected-btn"
                      href={`/${locale}/tools/${d.toolSlug}?input=${encodeURIComponent(d.value)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("open")}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      {/* send row + control keys + paste block (only while connected) */}
      {connected && (
        <>
          <div className="ws-send-row">
            <select
              className="cidr-input ws-select ws-ending"
              value={ending}
              onChange={(e) => setEnding(e.target.value)}
              aria-label={t("lineEnding")}
            >
              <option value="cr">CR</option>
              <option value="lf">LF</option>
              <option value="crlf">CRLF</option>
            </select>
            <input
              className="cidr-input mono ws-line-input"
              value={line}
              onChange={(e) => {
                setLine(e.target.value);
                histPosRef.current = null;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  send();
                } else if (e.key === "ArrowUp") {
                  const h = historyRef.current;
                  if (h.length === 0) return;
                  e.preventDefault();
                  if (histPosRef.current === null) {
                    draftRef.current = line;
                    histPosRef.current = h.length - 1;
                  } else if (histPosRef.current > 0) {
                    histPosRef.current -= 1;
                  }
                  setLine(h[histPosRef.current]);
                } else if (e.key === "ArrowDown") {
                  const h = historyRef.current;
                  if (histPosRef.current === null) return;
                  e.preventDefault();
                  if (histPosRef.current < h.length - 1) {
                    histPosRef.current += 1;
                    setLine(h[histPosRef.current]);
                  } else {
                    histPosRef.current = null;
                    setLine(draftRef.current);
                  }
                }
              }}
              placeholder={t("linePlaceholder")}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="b64-copy" onClick={send}>
              {t("send")}
            </button>
            {snippetsFor(os).length > 0 && (
              <select
                className="cidr-input ws-select ws-snippets"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setLine(e.target.value);
                    histPosRef.current = null;
                  }
                }}
                aria-label={t("snippets")}
              >
                <option value="">{t("snippets")}</option>
                {snippetsFor(os).map((cmd) => (
                  <option key={cmd} value={cmd}>
                    {cmd}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="ws-keys">
            <button type="button" className="ws-keybtn" onClick={() => sendCtrl(0x03, "Ctrl-C")}>
              Ctrl-C
            </button>
            <button type="button" className="ws-keybtn" onClick={() => sendCtrl(0x1a, "Ctrl-Z")}>
              Ctrl-Z
            </button>
            <button type="button" className="ws-keybtn" onClick={() => sendCtrl(0x1b, "Esc")}>
              Esc
            </button>
            <button type="button" className="ws-keybtn" onClick={sendBreak}>
              {t("break")}
            </button>
          </div>

          <details className="ws-paste">
            <summary className="ws-advanced-summary">{t("pasteBlock")}</summary>
            <p className="ws-paste-hint">{t("pasteHint")}</p>
            <textarea
              className="cidr-input mono ws-paste-area"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              rows={4}
              placeholder={t("pastePlaceholder")}
              spellCheck={false}
            />
            <div className="ws-paste-controls">
              <label className="ws-field ws-field--inline">
                <span>{t("pasteDelay")}</span>
                <input
                  type="number"
                  className="cidr-input ws-delay"
                  min={0}
                  max={2000}
                  value={pasteDelay}
                  onChange={(e) => setPasteDelay(Number(e.target.value))}
                />
              </label>
              <button type="button" className="b64-copy" onClick={sendBlock} disabled={!block.trim()}>
                {t("sendBlock")}
              </button>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
