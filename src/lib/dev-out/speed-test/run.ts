// ============================================================================
// src/lib/dev-out/speed-test/run.ts
// ----------------------------------------------------------------------------
// ONE RUN AT A TIME, AND ONLY ON START.
//
// The speed test's controller, kept free of React and of the engine itself so
// the golden vectors can drive it with a stand-in engine. It applies the red
// room's explicit-action rule through the same AskGate the lookups use
// (src/lib/dev-out/ask.ts): start() is the one way a run begins, a second
// start() while one is loading or running does nothing, and stop() makes the
// run stale at once, so nothing the engine reports afterwards reaches the page.
//
// The engine arrives through a factory: on the page, a dynamic import of
// @cloudflare/speedtest (src/lib/dev-out/speed-test/engine.ts), so the
// engine's code is downloaded only when the reader presses Start and no other
// page carries it; in the vectors, a fake that never touches the network.
//
// Stop is the engine's own pause() (README: "Pauses the measurements"), which
// aborts the request in flight; the engine instance is then dropped, so a
// stopped run is never resumed and the next Start begins a fresh one.
//
// PRIME DIRECTIVE (D-19): every line commented.
// ============================================================================

// The red room's single-flight gate.
import { AskGate } from "@/lib/dev-out/ask";
// The engine options, the snapshot reader and the failure sorter.
import { engineOptions, snapshotFrom, classifyFailure, type EngineOptions, type ResultsLike, type Snapshot, type FailureKind } from "./compute";

/** The callbacks a run listens to, attached once per engine. */
export interface EngineHandlers {
  /** The engine starts the step at this 0-based index of the plan. */
  phase: (measurementId: number) => void;
  /** Some result changed. */
  results: () => void;
  /** Every step is done. */
  finish: () => void;
  /** A step failed; the engine passes its message and, when there was one, the HTTP status. */
  error: (message: string, status?: number) => void;
}

/** What the controller needs from an engine (engine.ts adapts the real one). */
export interface EngineLike {
  /** The live results object. */
  results(): ResultsLike;
  /** Start the measurements. */
  play(): void;
  /** Stop the measurements; the request in flight is aborted. */
  pause(): void;
  /** Wire the callbacks. */
  attach(h: EngineHandlers): void;
  /** Replace every callback with a no-op, so a stopped engine reports nothing. */
  detach(): void;
}

/** Builds an engine for one run; rejects when the engine's code cannot be loaded. */
export type EngineFactory = (options: EngineOptions) => Promise<EngineLike>;

/** What a run reports to the page. */
export type RunEvent =
  // Start was pressed: the engine is being loaded (nothing has been sent yet).
  | { kind: "loading" }
  // The engine started a step.
  | { kind: "phase"; measurementId: number }
  // New values while running.
  | { kind: "progress"; snapshot: Snapshot }
  // Every step done.
  | { kind: "finished"; snapshot: Snapshot }
  // The run stopped on a failure; the snapshot is what had been measured, for the page to keep out of the results.
  | { kind: "failed"; failure: FailureKind; status?: number; message: string; snapshot: Snapshot | null }
  // The reader pressed Stop.
  | { kind: "stopped"; snapshot: Snapshot | null };

/** The speed test's controller: one run at a time, started only by start(). */
export class SpeedRun {
  /** One run at a time; a stale ticket's reports are dropped. */
  private readonly gate = new AskGate();
  /** The engine of the run in progress, or null. */
  private engine: EngineLike | null = null;

  /**
   * @param factory builds an engine (dynamic import on the page, a fake in the vectors)
   * @param emit receives every report of the current run
   */
  constructor(
    // The engine factory.
    private readonly factory: EngineFactory,
    // The page's listener.
    private readonly emit: (e: RunEvent) => void,
  ) {}

  /** Whether a run is loading or running. */
  get busy(): boolean {
    // The gate holds a ticket while a run is in progress.
    return this.gate.busy;
  }

  /**
   * Start a run, unless one is in progress. The only path to the network.
   * @returns false when a run was already in progress (nothing happens), true otherwise
   */
  async start(): Promise<boolean> {
    // One run at a time: a second Start while one is loading or running does nothing.
    const started = this.gate.begin();
    // Busy.
    if (!started) return false;
    // This run's ticket.
    const { ticket } = started;
    // Tell the page the engine is loading.
    this.emit({ kind: "loading" });
    // The engine for this run.
    let engine: EngineLike;
    try {
      // Load and build it (on the page: the dynamic import, then new SpeedTest(options)).
      engine = await this.factory(engineOptions());
    } catch {
      // Stopped while loading: the page has already been told.
      if (!this.gate.isCurrent(ticket)) return true;
      // Free the gate.
      this.gate.end(ticket);
      // Nothing was sent: the engine never existed.
      this.emit({ kind: "failed", failure: "load", message: "", snapshot: null });
      // Done.
      return true;
    }
    // Stop was pressed while the engine was loading: it is never played.
    if (!this.gate.isCurrent(ticket)) return true;
    // Keep it, so Stop can reach it.
    this.engine = engine;
    // Wire the callbacks; each one first checks that this run is still the current one.
    engine.attach({
      // A step starts.
      phase: (measurementId) => {
        // Only the current run reports.
        if (this.gate.isCurrent(ticket)) this.emit({ kind: "phase", measurementId });
      },
      // Values changed.
      results: () => {
        // Only the current run reports.
        if (this.gate.isCurrent(ticket)) this.emit({ kind: "progress", snapshot: snapshotFrom(engine.results()) });
      },
      // Every step done.
      finish: () => {
        // A stopped run's late finish is ignored.
        if (!this.gate.isCurrent(ticket)) return;
        // Free the gate and drop the engine.
        this.release(ticket);
        // The final values.
        this.emit({ kind: "finished", snapshot: snapshotFrom(engine.results()) });
      },
      // A step failed.
      error: (message, status) => {
        // A stopped run's late error is ignored.
        if (!this.gate.isCurrent(ticket)) return;
        // The engine pauses itself on a bandwidth or latency failure; pausing again is harmless and covers the rest.
        engine.pause();
        // Nothing more from this engine.
        engine.detach();
        // Free the gate and drop the engine.
        this.release(ticket);
        // Sorted, with the engine's own message and what had been measured.
        this.emit({ kind: "failed", failure: classifyFailure(status), status, message, snapshot: snapshotFrom(engine.results()) });
      },
    });
    // The measurements begin: the first request leaves now, and not before.
    engine.play();
    // Started.
    return true;
  }

  /**
   * Stop the run in progress, if any: the engine pauses (the request in flight is aborted), is detached and dropped.
   * @param silent true when the page is going away (no "stopped" report)
   */
  stop(silent = false): void {
    // Whether there was a run to stop.
    const wasBusy = this.gate.busy;
    // The engine of that run, if it had been built.
    const engine = this.engine;
    // Make the run stale: every later report from it is dropped.
    this.gate.invalidate();
    // Drop the engine.
    this.engine = null;
    // What had been measured, read before the engine is let go.
    const snapshot = engine ? snapshotFrom(engine.results()) : null;
    // Silence it, then stop it.
    if (engine) {
      // No more callbacks.
      engine.detach();
      // Abort the request in flight and stop.
      engine.pause();
    }
    // Tell the page, unless it is unmounting or nothing was running.
    if (wasBusy && !silent) this.emit({ kind: "stopped", snapshot });
  }

  /**
   * Free the gate after a run ended by itself.
   * @param ticket the run's ticket
   */
  private release(ticket: number): void {
    // The gate is free for the next Start.
    this.gate.end(ticket);
    // The engine is no longer needed.
    this.engine = null;
  }
}
