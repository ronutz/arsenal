// ============================================================================
// src/lib/dev-out/speed-test/engine.ts
// ----------------------------------------------------------------------------
// THE ONLY PLACE THE MEASUREMENT ENGINE IS LOADED.
//
// loadEngine() is the factory the speed test page hands to SpeedRun (run.ts).
// It reaches @cloudflare/speedtest 1.15.0 through a dynamic import(), which
// the bundler turns into a separate file served from this site and fetched
// only when the reader presses Start; no page imports the engine statically,
// so no other page carries it. The engine is then built with the page's
// options (compute.ts: autoStart false, results logging off, the plan without
// packet loss) and wrapped in the small EngineLike surface the controller
// uses, so the controller never touches the engine's own types.
//
// PRIME DIRECTIVE (D-19): every line commented.
// ============================================================================

// The options type the page builds.
import type { EngineOptions } from "./compute";
// The surface the controller drives.
import type { EngineLike, EngineHandlers } from "./run";

/**
 * Load the engine's code and build one engine for one run.
 * @param options the page's engine options (engineOptions() in compute.ts)
 * @returns the engine, behind the controller's EngineLike surface
 */
export async function loadEngine(options: EngineOptions): Promise<EngineLike> {
  // The dynamic import: the engine's code is fetched now, on Start, and not with the page.
  const { default: SpeedTest } = await import("@cloudflare/speedtest");
  // One engine for this run; autoStart is false, so nothing is sent until play().
  const engine = new SpeedTest({ ...options, measurements: options.measurements.map((s) => ({ ...s })) });
  // The controller's view of it.
  return {
    // The live results object.
    results: () => engine.results,
    // Start the measurements.
    play: () => engine.play(),
    // Stop them (the engine aborts the request in flight).
    pause: () => engine.pause(),
    // Wire the four callbacks the controller listens to.
    attach: (h: EngineHandlers) => {
      // A step starts: the engine passes its index in the plan.
      engine.onPhaseChange = (p) => h.phase(p.measurementId);
      // Any result changed.
      engine.onResultsChange = () => h.results();
      // Every step done (the engine's own results report is switched off in the options, so nothing follows it).
      engine.onFinish = () => h.finish();
      // A step failed.
      engine.onError = (message, status) => h.error(message, status);
    },
    // Silence every callback.
    detach: () => {
      // No more step reports.
      engine.onPhaseChange = () => {};
      // No more value reports.
      engine.onResultsChange = () => {};
      // No finish report.
      engine.onFinish = () => {};
      // No error report.
      engine.onError = () => {};
    },
  };
}
