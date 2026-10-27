// ============================================================================
// src/components/DevOutSpeedTestTool.tsx
// ----------------------------------------------------------------------------
// SPEED TEST - a /dev/out tool (2026-10-26), built on Cloudflare's open-source
// measurement engine, @cloudflare/speedtest 1.15.0 (MIT). The room's rule
// holds: NOTHING LEAVES THE BROWSER UNTIL THE READER PRESSES START.
//
// Before Start the page shows, computed locally (src/lib/dev-out/speed-test/
// compute.ts), what pressing it will do: the one host, the requests, the most
// data the plan can move in each direction, that results logging is off and
// what is not measured. Start is the one path to the network: SpeedRun
// (run.ts) loads the engine's code with a dynamic import (engine.ts), so it is
// fetched only now and no other page carries it, builds one engine with the
// page's options and plays it; a second Start while a run is loading or
// running does nothing. Stop is the engine's own pause(), which abandons the
// request in flight; the run is then dropped, and the next Start is a fresh
// one. Leaving the page stops a run silently.
//
// While running, the step and a progress bar show where the engine is, and
// the values update as requests complete. A finished run shows the engine's
// values, each with the number of requests behind it; a stopped run keeps its
// values, labelled incomplete; a failed run shows the failure, sorted, and the
// engine's own message, never values. Every number is formatted locally and
// pinned by golden vectors; the measurements themselves are the live world.
//
// The results exist only in this component's state: no storage, no URL, no
// report to anyone (the engine's results logging is switched off).
// Styling reuses the established vocabulary (cidr-*, jwt-*, cipher-note,
// b64-copy, rdap-*, hpf-progress-*); inside .env-out the tokens render red.
// ============================================================================
"use client";

// React state, memoised values and callbacks, the controller's ref and the unmount effect.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// The devOut.speed messages (sliced in by the page's MessageSlice) and the locale for the decimal mark.
import { useLocale, useTranslations } from "next-intl";
// The local layers.
import {
  PLAN,
  planTotals,
  phaseInfo,
  summaryRows,
  formatBytes,
  formatSeconds,
  quantityText,
  SPEED_HOST,
  DOWNLOAD_URL,
  UPLOAD_URL,
  RESULTS_LOG_URL,
  ENGINE_DEFAULTS_USED,
  SOURCE_SNAPSHOT,
  type Snapshot,
  type FailureKind,
  type Quantity,
  type PlanStep,
} from "@/lib/dev-out/speed-test/compute";
// The controller: one run at a time, started only by Start.
import { SpeedRun, type RunEvent } from "@/lib/dev-out/speed-test/run";
// The factory that loads the engine's code on Start.
import { loadEngine } from "@/lib/dev-out/speed-test/engine";

// The plan's totals, computed once (the plan is a constant).
const TOTALS = planTotals(PLAN);

/** What the page shows, driven by the controller's reports. */
type View =
  // Nothing has run since the page opened.
  | { phase: "idle" }
  // Start was pressed; the engine's code is loading.
  | { phase: "loading" }
  // The engine is measuring.
  | { phase: "running"; measurementId: number | null; snapshot: Snapshot | null }
  // Every step done.
  | { phase: "finished"; snapshot: Snapshot }
  // The reader pressed Stop.
  | { phase: "stopped"; measurementId: number | null; snapshot: Snapshot | null }
  // A failure stopped the run; no values are shown.
  | { phase: "failed"; failure: FailureKind; status?: number; message: string };

/**
 * Fold one controller report into the view.
 * @param prev the current view
 * @param e the report
 * @returns the next view
 */
function reduce(prev: View, e: RunEvent): View {
  // The step and values carried over from a running view.
  const measurementId = prev.phase === "running" ? prev.measurementId : null;
  // Same for the values.
  const snapshot = prev.phase === "running" ? prev.snapshot : null;
  // One case per report.
  switch (e.kind) {
    // The engine is loading.
    case "loading":
      return { phase: "loading" };
    // A step starts.
    case "phase":
      return { phase: "running", measurementId: e.measurementId, snapshot };
    // New values.
    case "progress":
      return { phase: "running", measurementId, snapshot: e.snapshot };
    // Done.
    case "finished":
      return { phase: "finished", snapshot: e.snapshot };
    // Failed: the partial values are deliberately dropped.
    case "failed":
      return { phase: "failed", failure: e.failure, status: e.status, message: e.message };
    // Stopped: the values so far are kept, labelled incomplete.
    case "stopped":
      return { phase: "stopped", measurementId, snapshot: e.snapshot ?? snapshot };
  }
}

export default function DevOutSpeedTestTool() {
  // The tool's messages.
  const t = useTranslations("devOut.speed");
  // The page's locale, for the decimal mark.
  const locale = useLocale();
  // The reader's decimal mark ("," for pt-BR), read from Intl once per locale.
  const mark = useMemo(() => {
    try {
      // The decimal part of 1.5 in this locale.
      return new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === "decimal")?.value ?? ".";
    } catch {
      // An unknown locale: the plain mark.
      return ".";
    }
  }, [locale]);

  // What is on screen.
  const [view, setView] = useState<View>({ phase: "idle" });

  // The controller, created once; its reports fold into the view.
  const runRef = useRef<SpeedRun | null>(null);
  // Created on first render.
  if (runRef.current === null) runRef.current = new SpeedRun(loadEngine, (e) => setView((prev) => reduce(prev, e)));
  // Leaving the page stops a run without a report.
  useEffect(() => () => runRef.current?.stop(true), []);

  // Start: the one path to the network (the controller ignores it while a run is in progress).
  const onStart = useCallback(() => {
    // Fire and forget: the controller reports through the view.
    void runRef.current?.start();
  }, []);
  // Stop: abandon the request in flight and drop the run.
  const onStop = useCallback(() => {
    // The controller reports "stopped".
    runRef.current?.stop();
  }, []);

  // Whether a run is loading or measuring.
  const busy = view.phase === "loading" || view.phase === "running";

  /** A quantity in the reader's notation, or an empty string. */
  const q = (x: Quantity | null) => (x ? quantityText(x, mark) : "");

  /** A plan step in words, for the progress line. */
  const stepText = (s: PlanStep) =>
    // Latency steps count empty requests; transfers count requests of a size.
    s.type === "latency"
      ? t("step.latency", { count: s.numPackets })
      : t(s.type === "download" ? "step.download" : "step.upload", { count: s.count, size: q(formatBytes(s.bytes)) });

  // The step on show while running or stopped.
  const current =
    view.phase === "running" || view.phase === "stopped" ? (view.measurementId === null ? null : phaseInfo(PLAN, view.measurementId)) : null;

  // The values on show: while running, when finished, when stopped.
  const shownSnapshot = view.phase === "running" || view.phase === "stopped" ? view.snapshot : view.phase === "finished" ? view.snapshot : null;

  // The failure titles and bodies by kind.
  const failureTitle = (f: FailureKind, status?: number) =>
    // One message per kind; HTTP carries its status.
    f === "load" ? t("fail.loadTitle") : f === "rateLimited" ? t("fail.rateLimitedTitle") : f === "http" ? t("fail.httpTitle", { status: status ?? 0 }) : t("fail.networkTitle");
  // The explanation by kind.
  const failureBody = (f: FailureKind) =>
    // One message per kind.
    f === "load" ? t("fail.loadBody") : f === "rateLimited" ? t("fail.rateLimitedBody") : f === "http" ? t("fail.httpBody") : t("fail.networkBody");

  return (
    <div className="cidr-tool jwt-tool">
      {/* ---- Before Start: what pressing it will do, computed here. ---- */}
      <section className="jwt-panel" style={{ borderTop: "none", paddingTop: 0 }}>
        {/* The panel's title. */}
        <h4 className="jwt-panel-title">{t("planTitle")}</h4>
        <dl className="jwt-claims">
          {/* The one host. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("planHostLabel")}</dt>
            <dd className="jwt-claim-value">{t("planHostValue", { host: SPEED_HOST })}</dd>
          </div>
          {/* The requests. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("planRequestsLabel")}</dt>
            <dd className="jwt-claim-value">
              {t("planRequestsValue", {
                latency: TOTALS.latencyRequests,
                downloads: TOTALS.downloadRequests,
                downMin: q(formatBytes(TOTALS.downloadSizeMin)),
                downMax: q(formatBytes(TOTALS.downloadSizeMax)),
                uploads: TOTALS.uploadRequests,
                upMin: q(formatBytes(TOTALS.uploadSizeMin)),
                upMax: q(formatBytes(TOTALS.uploadSizeMax)),
                steps: TOTALS.steps,
                throttleMs: ENGINE_DEFAULTS_USED.loadedLatencyThrottle,
              })}
            </dd>
          </div>
          {/* The most data the plan can move. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("planVolumeLabel")}</dt>
            <dd className="jwt-claim-value">
              {t("planVolumeValue", { down: q(formatBytes(TOTALS.downloadBytesMax)), up: q(formatBytes(TOTALS.uploadBytesMax)) })}
            </dd>
          </div>
          {/* Results logging: off. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("planLoggingLabel")}</dt>
            <dd className="jwt-claim-value">{t("planLoggingValue", { url: RESULTS_LOG_URL })}</dd>
          </div>
          {/* What is not measured. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("planNotMeasuredLabel")}</dt>
            <dd className="jwt-claim-value">{t("planNotMeasuredValue")}</dd>
          </div>
        </dl>
        {/* The exact requests, before anything is sent. */}
        <p className="rdap-plan">
          {t("willSend")} <code className="mono">GET {DOWNLOAD_URL}?bytes=…</code>{" "}
          <code className="mono">POST {UPLOAD_URL}?bytes=…</code>
        </p>
        <div className="rdap-ask-row">
          {/* Start: the one path to the network. */}
          <button type="button" className="b64-copy" onClick={onStart} disabled={busy}>
            {view.phase === "loading" ? t("loading") : view.phase === "idle" ? t("start") : busy ? t("running") : t("again")}
          </button>
          {/* Stop: abandons the request in flight. */}
          <button type="button" className="b64-copy" onClick={onStop} disabled={!busy}>
            {t("stop")}
          </button>
          {/* The egress marker. */}
          <span className="envout-badge mono">{t("egressBadge")}</span>
        </div>
        {/* The tool's own privacy note: what is sent, to whom, what they see, where the results stay. */}
        <p className="cidr-privacy" id="speed-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("privacy", { host: SPEED_HOST })}
        </p>
      </section>

      {/* ---- While running, or where a stopped run got to: the step and the bar. ---- */}
      {(view.phase === "loading" || current) && (
        <div className="hpf-progress" style={{ marginTop: "1rem" }}>
          {/* The step in words, announced politely to screen readers. */}
          <p className="cipher-note" aria-live="polite">
            {view.phase === "loading"
              ? t("loadingNote")
              : current
                ? t(view.phase === "stopped" ? "stoppedAt" : "progress", { index: current.index, total: current.total, what: stepText(current.step) })
                : null}
          </p>
          {/* The bar: steps done out of the plan's steps. */}
          <div
            className="hpf-progress-bar"
            role="progressbar"
            aria-label={t("progressLabel")}
            aria-valuemin={0}
            aria-valuemax={TOTALS.steps}
            aria-valuenow={current ? current.index : 0}
          >
            <div className="hpf-progress-fill" style={{ width: `${Math.round((current ? current.fraction : 0) * 100)}%` }} />
          </div>
          {/* Why the bar can jump and the test can end early. */}
          <p className="hpf-progress-stats">{t("progressNote", { seconds: ENGINE_DEFAULTS_USED.bandwidthFinishRequestDuration / 1000 })}</p>
        </div>
      )}

      {/* ---- Stopped while the engine was still loading: it never played, so nothing was sent. ---- */}
      {view.phase === "stopped" && view.measurementId === null && (
        <p className="cipher-note" style={{ marginTop: "1rem" }}>
          {t("stoppedBeforeSend")}
        </p>
      )}

      {/* ---- The values: live while running, final when finished, incomplete when stopped. ---- */}
      {shownSnapshot !== null && (view.phase === "running" || view.phase === "finished" || view.phase === "stopped") && (
        <div className="jwt-results">
          <section className="jwt-panel">
            {/* What these values are. */}
            <h4 className="jwt-panel-title">
              {view.phase === "running"
                ? t("resultsRunning")
                : view.phase === "stopped"
                  ? t("resultsStopped")
                  : shownSnapshot.totalDurationMs !== undefined
                    ? t("resultsFinished", { duration: q(formatSeconds(shownSnapshot.totalDurationMs)) })
                    : t("resultsFinishedPlain")}
            </h4>
            {/* A badge for the state. */}
            <div className="jwt-badges" style={{ marginBottom: "0.75rem" }}>
              <span className={`jwt-badge mono ${view.phase === "finished" ? "jwt-badge--ok" : "jwt-badge--warn"}`}>
                {view.phase === "finished" ? t("badgeFinished") : view.phase === "stopped" ? t("badgeStopped") : t("badgeRunning")}
              </span>
            </div>
            <dl className="jwt-claims">
              {summaryRows(shownSnapshot).map((r) => (
                // One row per measurement, in the engine's order.
                <div className="jwt-claim-row" key={r.key}>
                  {/* The measurement's name. */}
                  <dt className="jwt-claim-label">{t(`rows.${r.key}`)}</dt>
                  {/* Its value and the requests behind it, or why there is none yet. */}
                  <dd className="jwt-claim-value">
                    {r.state === "value" && r.quantity ? (
                      <>
                        <strong className="mono">{q(r.quantity)}</strong> {t("samples", { count: r.count })}
                      </>
                    ) : r.state === "tooFew" ? (
                      t("tooFew")
                    ) : (
                      t("none")
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {/* The results stay here. */}
            <p className="cipher-note">{t("resultsStay")}</p>
          </section>
        </div>
      )}

      {/* ---- A failure: explained, with the engine's own message, never shown as values. ---- */}
      {view.phase === "failed" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            {/* What went wrong. */}
            <h4 className="jwt-panel-title">{failureTitle(view.failure, view.status)}</h4>
            {/* Why, and that nothing is shown as a result. */}
            <p className="cipher-note">{failureBody(view.failure)}</p>
            {/* The engine's message, verbatim, when it gave one. */}
            {view.message !== "" && <p className="cipher-note mono">{t("fail.engineMessage", { message: view.message })}</p>}
          </section>
        </div>
      )}

      {/* ---- What each number means: the engine's own definitions, with the settings that run. ---- */}
      <section className="jwt-panel" style={{ marginTop: "1.5rem" }}>
        <h4 className="jwt-panel-title">{t("defsTitle")}</h4>
        <dl className="jwt-claims">
          {/* Download and upload. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("defs.bandwidthLabel")}</dt>
            <dd className="jwt-claim-value">
              {t("defs.bandwidth", {
                percentile: Math.round(ENGINE_DEFAULTS_USED.bandwidthPercentile * 100),
                minMs: ENGINE_DEFAULTS_USED.bandwidthMinRequestDuration,
              })}
            </dd>
          </div>
          {/* Idle latency. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("defs.latencyLabel")}</dt>
            <dd className="jwt-claim-value">{t("defs.latency")}</dd>
          </div>
          {/* Jitter. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("defs.jitterLabel")}</dt>
            <dd className="jwt-claim-value">{t("defs.jitter")}</dd>
          </div>
          {/* Under load. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("defs.loadedLabel")}</dt>
            <dd className="jwt-claim-value">
              {t("defs.loaded", {
                throttleMs: ENGINE_DEFAULTS_USED.loadedLatencyThrottle,
                minMs: ENGINE_DEFAULTS_USED.loadedRequestMinDuration,
                maxPoints: ENGINE_DEFAULTS_USED.loadedLatencyMaxPoints,
              })}
            </dd>
          </div>
          {/* Units. */}
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("defs.unitsLabel")}</dt>
            <dd className="jwt-claim-value">{t("defs.units")}</dd>
          </div>
        </dl>
      </section>

      {/* Provenance of the local layers. */}
      <p className="cipher-note" style={{ marginTop: "1rem" }}>
        {t("provenance", { version: SOURCE_SNAPSHOT.engineVersion, accessed: SOURCE_SNAPSHOT.accessed })}
      </p>
    </div>
  );
}
