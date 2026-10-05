"use client";

// ============================================================================
// src/components/PythonPlaygroundTool.tsx
// ----------------------------------------------------------------------------
// THE PYTHON PLAYGROUND. Real CPython in the browser, honestly presented:
//
//   - The page opens with the editor, an example loaded, the preflight already
//     reading it, and the engine NOT downloaded. One button, naming the size,
//     starts the 13 MB download (PROPOSTA-wasm-tools decision 2: no silent
//     download). A progress bar fills; the button becomes Run when the engine
//     is ready; the pill gains "loaded".
//   - The preflight (the pure compute layer) runs on every keystroke and says
//     what will not work here and why, before anything is sent to the engine.
//   - Run sends the program and the stdin box to the Web Worker; Stop
//     terminates the worker (the only way to interrupt synchronous Python
//     without a cross-origin-isolated SharedArrayBuffer) and a fresh one is
//     spun up so the next Run is clean; a 30 s watchdog does the same if a run
//     never answers.
//   - The explainer panel above the tool is always visible: what runs, where
//     it comes from, what it costs, what leaves the page (nothing), and what
//     the site's own checks cover.
//
// All of the engine's bytes come from this origin (public/wasm/<version>/),
// pinned and digest-checked at build. Nothing the reader types leaves the page.
// Every line is commented (D-19).
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  preflight,
  EXAMPLES,
  EXAMPLE_ID,
  LIMITS,
  ENGINE,
  type Finding,
} from "@/lib/tools/python-playground";

/** The engine files, as the worker's progress counter needs them (name + size). */
const ENGINE_FILES = ENGINE.files.map((f) => ({ name: f.name, bytes: f.bytes }));
/** The first-use size in megabytes (decimal, as file sizes are quoted), formatted per locale below with one decimal: 13.5, not a rounded 14. */
const ENGINE_MB_VALUE = ENGINE.bytesWire / 1e6;

/** The lifecycle of the engine in this page. */
type EngineState = "idle" | "loading" | "ready" | "running" | "failed";

/** One captured output line group, kept in order so stdout and stderr interleave as they arrived. */
interface OutputChunk {
  stream: "out" | "err";
  text: string;
}

/** The result of the last run, for the footer line. */
interface RunOutcome {
  kind: "done" | "error" | "stopped";
  /** The repr of the last expression (done), or the exception one-liner (error). */
  summary?: string;
  errorType?: string;
  traceback?: string;
  ms?: number;
  truncated?: boolean;
}

export default function PythonPlaygroundTool() {
  const t = useTranslations("tools.python-playground");
  const locale = useLocale();
  // "13.5" in English, "13,5" in Portuguese: the reader's own decimal notation (the 2026-10-04 numbers ruling).
  const ENGINE_MB = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(ENGINE_MB_VALUE), [locale]);

  // The example the page opens on (D-83: the first example, verbatim).
  const opening = useMemo(() => EXAMPLES.find((e) => e.id === EXAMPLE_ID) ?? EXAMPLES[0], []);
  // The program and the stdin box.
  const [code, setCode] = useState(opening.code);
  const [stdin, setStdin] = useState(opening.stdin ?? "");
  // The engine lifecycle and the load progress (0..1).
  const [engineState, setEngineState] = useState<EngineState>("idle");
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [engineVersion, setEngineVersion] = useState<string | null>(null);
  // The current run's output and its outcome.
  const [chunks, setChunks] = useState<OutputChunk[]>([]);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);

  // The worker, the id of the run in flight, and the watchdog timer.
  const workerRef = useRef<Worker | null>(null);
  const runIdRef = useRef(0);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The preflight, recomputed whenever the program or the stdin box changes.
  const pre = useMemo(() => preflight({ code, stdin }), [code, stdin]);

  /** Tear the worker down (Stop, a watchdog trip, or unmount). */
  const killWorker = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  // Terminate the worker when the component goes away.
  useEffect(() => killWorker, [killWorker]);

  /** Build a worker and wire its messages; returns it. */
  const makeWorker = useCallback(() => {
    // The worker is a static module asset at the site root, outside the locale tree.
    const w = new Worker("/workers/python-playground.worker.mjs", { type: "module" });
    w.onmessage = (event: MessageEvent) => {
      const m = event.data as Record<string, unknown>;
      const kind = m.kind as string;
      if (kind === "progress") {
        // Fraction of the counted bytes received (the two module files are tiny and arrive via import()).
        const totalReceived = Number(m.totalReceived) || 0;
        const totalBytes = Number(m.totalBytes) || ENGINE.bytesWire;
        setProgress(Math.min(1, totalReceived / totalBytes));
      } else if (kind === "ready") {
        setProgress(1);
        setEngineState("ready");
        setEngineVersion(String(m.version ?? ENGINE.version));
      } else if (kind === "load-error") {
        setLoadError(String(m.message ?? ""));
        setEngineState("failed");
      } else if (kind === "stdout" || kind === "stderr") {
        // Only the run in flight may append (a late message from a terminated run is ignored).
        if (Number(m.id) !== runIdRef.current) return;
        const stream = kind === "stdout" ? "out" : "err";
        setChunks((prev) => [...prev, { stream, text: String(m.text ?? "") }]);
      } else if (kind === "done" || kind === "error") {
        if (Number(m.id) !== runIdRef.current) return;
        if (watchdogRef.current) {
          clearTimeout(watchdogRef.current);
          watchdogRef.current = null;
        }
        setEngineState("ready");
        if (kind === "done") {
          setOutcome({ kind: "done", summary: (m.result as string) ?? undefined, ms: Number(m.ms), truncated: Boolean(m.truncated) });
        } else {
          setOutcome({ kind: "error", errorType: String(m.type ?? "Error"), summary: String(m.message ?? ""), traceback: String(m.traceback ?? ""), ms: Number(m.ms), truncated: Boolean(m.truncated) });
          // An ordinary Python exception leaves the interpreter healthy (measured: NameError, ZeroDivisionError, EOFError), so the
          // Worker is kept and the next Run is immediate. A run that leaves it unusable (sys.exit under Emscripten) is caught by the
          // watchdog on the next Run, which terminates and recreates it; the preflight warns about exit() beforehand.
        }
      }
    };
    // A worker-level failure (a bad import, a security error) surfaces as a load failure.
    w.onerror = (e: ErrorEvent) => {
      setLoadError(e.message || "worker error");
      setEngineState("failed");
      killWorker();
    };
    return w;
  }, [killWorker]);

  /** The consent button: start the download and the engine. */
  const load = useCallback(() => {
    setLoadError(null);
    setProgress(0);
    setEngineState("loading");
    const w = makeWorker();
    workerRef.current = w;
    // Absolute URL on this origin; the worker imports the loader from here and the engine fetches its siblings.
    const indexURL = `${window.location.origin}${ENGINE.publicPath}`;
    w.postMessage({ kind: "load", indexURL, files: ENGINE_FILES });
  }, [makeWorker]);

  /** Run the current program. */
  const runProgram = useCallback(() => {
    if (engineState !== "ready") return;
    // No Worker behind a ready state (a watchdog trip ended the last one): reload from the cached files; Run again when ready.
    if (!workerRef.current) {
      load();
      return;
    }
    const id = runIdRef.current + 1;
    runIdRef.current = id;
    setChunks([]);
    setOutcome(null);
    setEngineState("running");
    // The wall-clock limit: if nothing comes back, terminate and recreate, and report the timeout.
    watchdogRef.current = setTimeout(() => {
      killWorker();
      setEngineState("idle");
      setOutcome({ kind: "stopped", summary: t("timedOut", { seconds: LIMITS.wallClockSeconds }) });
    }, LIMITS.wallClockSeconds * 1000 + 500);
    workerRef.current.postMessage({ kind: "run", id, code, stdin });
  }, [code, stdin, engineState, killWorker, load, t]);

  /** Stop a running program: terminate the worker and spin a fresh one up. */
  const stop = useCallback(() => {
    // Ignore any further messages from the terminated run.
    runIdRef.current += 1;
    killWorker();
    setOutcome({ kind: "stopped", summary: t("stopped") });
    setEngineState("loading");
    setProgress(0);
    // Recreate immediately so Run works again without a second consent (the files are cached).
    const w = makeWorker();
    workerRef.current = w;
    w.postMessage({ kind: "load", indexURL: `${window.location.origin}${ENGINE.publicPath}`, files: ENGINE_FILES });
  }, [killWorker, makeWorker, t]);

  /** Load the opening example (D-83). */
  const loadExample = useCallback(() => {
    setCode(opening.code);
    setStdin(opening.stdin ?? "");
    setOutcome(null);
    setChunks([]);
  }, [opening]);

  /** Clear the editor. */
  const clear = useCallback(() => {
    setCode("");
    setStdin("");
    setOutcome(null);
    setChunks([]);
  }, []);

  /** Swap in one of the other examples by id. */
  const pickExample = useCallback((id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setCode(ex.code);
    setStdin(ex.stdin ?? "");
    setOutcome(null);
    setChunks([]);
  }, []);

  // Findings split by severity so errors (which block a run) lead.
  const errors = pre.findings.filter((f) => f.severity === "error");
  const warnings = pre.findings.filter((f) => f.severity === "warn");
  const infos = pre.findings.filter((f) => f.severity === "info");
  // A run is offered only when the engine is ready and nothing in the preflight forbids it.
  const canRun = engineState === "ready" && pre.ok;

  /** Render one finding row. */
  const findingRow = (f: Finding, i: number) => (
    <li key={f.code + i} className={"tcl-finding tcl-finding-" + (f.severity === "warn" ? "warning" : f.severity)}>
      <div className="tcl-finding-head">
        <span className={"irl-sev " + (f.severity === "error" ? "irl-sev-high" : f.severity === "warn" ? "irl-sev-warning" : "irl-sev-info")}>
          {t(`severity.${f.severity}`)}
        </span>
        <span className="tcl-finding-title">{t(`findingTitle.${f.code}`)}</span>
      </div>
      <p className="tcl-finding-msg">{t(`finding.${f.code}`, f.params ?? {})}</p>
    </li>
  );

  return (
    <div className="pyp-tool">
      {/* THE EXPLAINER: always visible, five plain facts about a WebAssembly tool. */}
      <section className="pyp-explainer" aria-label={t("explainer.title")}>
        <h2 className="pyp-explainer-title">{t("explainer.title")}</h2>
        <ul className="pyp-explainer-list">
          <li>{t("explainer.runs", { engine: ENGINE.name, version: ENGINE.version, python: ENGINE.python, licence: ENGINE.licence })}</li>
          <li>{t("explainer.origin")}</li>
          <li>{t("explainer.cost", { mb: ENGINE_MB })}</li>
          <li>{t("explainer.leaves")}</li>
          <li>{t("explainer.checks")}</li>
        </ul>
      </section>

      {/* THE EDITOR. */}
      <div className="pyp-editor">
        <div className="dig-input-head">
          <label className="curlb-field-label" htmlFor="pyp-code">{t("codeLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clear}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="pyp-code"
          className="cidr-input mono saml-textarea pyp-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={14}
          aria-describedby="pyp-code-hint"
        />
        <p id="pyp-code-hint" className="hmac-build-note">{t("codeHint", { max: LIMITS.maxCodeChars })}</p>

        {/* The stdin box, shown always (the preflight tells the reader when it is read). */}
        <label className="curlb-field-label pyp-stdin-label" htmlFor="pyp-stdin">{t("stdinLabel")}</label>
        <textarea
          id="pyp-stdin"
          className="cidr-input mono saml-textarea pyp-stdin"
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          spellCheck={false}
          rows={3}
          placeholder={t("stdinPlaceholder")}
        />

        {/* The other examples, as a quick row of chips. */}
        <div className="pyp-examples">
          <span className="pyp-examples-label">{t("examplesLabel")}</span>
          {EXAMPLES.map((e) => (
            <button key={e.id} type="button" className="pyp-example-chip" onClick={() => pickExample(e.id)}>
              {t(`examples.${e.id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* THE ENGINE CONTROL: consent, progress, Run / Stop. */}
      <div className="pyp-run-bar">
        {engineState === "idle" && (
          <button type="button" className="btn btn-primary pyp-load" onClick={load}>
            {t("loadButton", { mb: ENGINE_MB })}
          </button>
        )}
        {engineState === "loading" && (
          <div className="pyp-progress" role="status" aria-live="polite">
            <div className="pyp-progress-track"><div className="pyp-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <span className="pyp-progress-label mono">{t("loading", { pct: Math.round(progress * 100), mb: ENGINE_MB })}</span>
          </div>
        )}
        {(engineState === "ready" || engineState === "running") && (
          <>
            <button type="button" className="btn btn-primary pyp-run" onClick={runProgram} disabled={!canRun}>
              {t("runButton")}
            </button>
            {engineState === "running" && (
              <button type="button" className="btn btn-secondary pyp-stop" onClick={stop}>{t("stopButton")}</button>
            )}
            <span className="pyp-ready-note mono">{t("engineReady", { version: engineVersion ?? ENGINE.version, python: ENGINE.python })}</span>
          </>
        )}
        {engineState === "failed" && (
          <div className="pyp-load-failed">
            <p className="tcl-finding-msg">{t("loadFailed")}{loadError ? ` (${loadError})` : ""}</p>
            <button type="button" className="btn btn-secondary" onClick={load}>{t("retry")}</button>
          </div>
        )}
      </div>

      {/* THE PREFLIGHT: what will or will not work, before a run. */}
      {(errors.length > 0 || warnings.length > 0 || infos.length > 0) && (
        <section className="pyp-preflight" aria-label={t("preflightTitle")}>
          <h2 className="pyp-section-title">{t("preflightTitle")}</h2>
          <ul className="tcl-findings pyp-findings">
            {errors.map(findingRow)}
            {warnings.map(findingRow)}
            {infos.map(findingRow)}
          </ul>
          {!pre.ok && engineState !== "idle" && <p className="hmac-build-note pyp-blocked-note">{t("blocked")}</p>}
        </section>
      )}

      {/* THE OUTPUT. */}
      {(chunks.length > 0 || outcome) && (
        <section className="pyp-output" aria-label={t("outputTitle")} aria-live="polite">
          <h2 className="pyp-section-title">{t("outputTitle")}</h2>
          {chunks.length > 0 && (
            <pre className="pyp-stream mono">
              {chunks.map((c, i) => (
                <span key={i} className={c.stream === "err" ? "pyp-stderr" : "pyp-stdout"}>{c.text}</span>
              ))}
            </pre>
          )}
          {outcome?.kind === "done" && (
            <p className="pyp-outcome pyp-outcome-done mono">
              {outcome.summary != null ? t("resultValue", { value: outcome.summary }) : t("noResult")}
              {typeof outcome.ms === "number" ? ` · ${t("tookMs", { ms: outcome.ms })}` : ""}
            </p>
          )}
          {outcome?.kind === "error" && (
            <div className="pyp-outcome pyp-outcome-error">
              <p className="mono pyp-error-line">{outcome.summary || outcome.errorType}</p>
              {outcome.traceback && <pre className="pyp-traceback mono">{outcome.traceback}</pre>}
            </div>
          )}
          {outcome?.kind === "stopped" && <p className="pyp-outcome pyp-outcome-stopped mono">{outcome.summary}</p>}
          {outcome?.truncated && <p className="hmac-build-note">{t("outputTruncated", { max: LIMITS.maxOutputChars })}</p>}
        </section>
      )}
    </div>
  );
}
