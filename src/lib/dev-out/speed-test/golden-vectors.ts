// ============================================================================
// src/lib/dev-out/speed-test/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for everything the speed test computes on the device. As
// with the other red-room tools, the LIVE measurements carry no golden-vector
// guarantee (the room's notice says so), and no vector here touches the
// network: the engine is only constructed (autoStart false) to read its merged
// configuration, with fetch replaced by a tripwire, and the controller is
// driven by a stand-in engine.
//
// WHERE THE EXPECTATIONS COME FROM (2026-10-27):
//   - the plan and the engine settings: dist/speedtest.js of
//     @cloudflare/speedtest 1.15.0 (defaultConfig), read line by line, and
//     the same file at the release's commit (src/config/defaultConfig.ts at
//     11129643); the vectors compare PLAN with the engine's own merged
//     configuration, so an engine upgrade that changes the default plan or a
//     quoted setting fails here instead of drifting from the copy;
//   - the totals: added by hand from that list (downloads 0.1 + 0.9 + 8 + 60 +
//     100 + 300 + 500 = 969 MB in 33 requests; uploads 0.8 + 6 + 40 + 100 +
//     150 = 296.8 MB in 25 requests; 2 + 20 + 10 x 2 = 42 empty requests);
//   - the formatting: SI prefixes as NIST lists them (kilo 10^3, mega 10^6,
//     giga 10^9, tera 10^12), three significant figures, values chosen so the
//     rounding is exact in binary floating point (94.25 = 94 + 1/4);
//   - the failure sorting: the engine's onError(message, status) contract in
//     dist/speedtest.js (429 retried three times before it is reported).
// ============================================================================

// The local layers under test.
import {
  PLAN,
  FORBIDDEN_STEP_TYPES,
  SPEED_HOST,
  DOWNLOAD_URL,
  UPLOAD_URL,
  RESULTS_LOG_URL,
  ENGINE_DEFAULTS_USED,
  SOURCE_SNAPSHOT,
  engineOptions,
  planTotals,
  phaseInfo,
  fixed,
  threeFigures,
  formatBitRate,
  formatBytes,
  formatMs,
  formatSeconds,
  localiseDecimal,
  quantityText,
  countingPoints,
  snapshotFrom,
  summaryRows,
  classifyFailure,
  type PlanStep,
  type ResultsLike,
  type Snapshot,
  type Quantity,
  type EngineOptions,
} from "./compute";
// The controller under test.
import { SpeedRun, type EngineLike, type EngineHandlers, type RunEvent } from "./run";

// Dated so a change of expectations is visible in review (2026-10-27: the version-pin check added; then the move
// to 1.15.0, whose default plan has no packet-loss step and whose TURN settings default to null).
export const GOLDEN_VECTOR_SET_ID = "dev-out-speed-test/2026-10-27b";

// ---- formatting --------------------------------------------------------------

// Each row: a bit rate in bit/s and the digits and unit it must print as.
const RATE_VECTORS: { bps: number; value: string; unit: string }[] = [
  // Zero prints in the base unit.
  { bps: 0, value: "0", unit: "bit/s" },
  // Below a kilobit.
  { bps: 999, value: "999", unit: "bit/s" },
  // Exactly a kilobit: the next unit, three figures.
  { bps: 1000, value: "1.00", unit: "kbit/s" },
  // A few kilobits.
  { bps: 12_345, value: "12.3", unit: "kbit/s" },
  // 9.996 kbit/s rounds to 10.0, not to "10.00" (still three figures).
  { bps: 9_996, value: "10.0", unit: "kbit/s" },
  // 94.25 Mbit/s: exact in binary, rounds half up to 94.3.
  { bps: 94_250_000, value: "94.3", unit: "Mbit/s" },
  // 99.96 Mbit/s rounds to 100, printed whole.
  { bps: 99_960_000, value: "100", unit: "Mbit/s" },
  // Just under a gigabit stays in Mbit/s.
  { bps: 999_400_000, value: "999", unit: "Mbit/s" },
  // 999.6 Mbit/s rounds to 1000: printed as 1.00 Gbit/s instead.
  { bps: 999_600_000, value: "1.00", unit: "Gbit/s" },
  // A little over a gigabit.
  { bps: 1_234_567_890, value: "1.23", unit: "Gbit/s" },
  // Below one bit per second: two decimals.
  { bps: 0.5, value: "0.50", unit: "bit/s" },
  // Beyond the last unit: stays in Tbit/s with more digits rather than inventing a prefix.
  { bps: 5e15, value: "5000", unit: "Tbit/s" },
];

// Each row: a size in bytes and how the plan prints it (trailing zeros trimmed).
const BYTE_VECTORS: { bytes: number; value: string; unit: string }[] = [
  // The smallest transfer.
  { bytes: 1e5, value: "100", unit: "kB" },
  // "1.00" trimmed to "1".
  { bytes: 1e6, value: "1", unit: "MB" },
  // "2.50" trimmed to "2.5".
  { bytes: 2.5e6, value: "2.5", unit: "MB" },
  // A plan size.
  { bytes: 25e6, value: "25", unit: "MB" },
  // The largest download size.
  { bytes: 25e7, value: "250", unit: "MB" },
  // The download maximum.
  { bytes: 969e6, value: "969", unit: "MB" },
  // The upload maximum, 296.8 MB, to three figures.
  { bytes: 296.8e6, value: "297", unit: "MB" },
  // Gigabytes.
  { bytes: 1.234e9, value: "1.23", unit: "GB" },
  // Zero.
  { bytes: 0, value: "0", unit: "B" },
  // Bytes.
  { bytes: 512, value: "512", unit: "B" },
];

// Each row: milliseconds and how they print.
const MS_VECTORS: { ms: number; value: string }[] = [
  // Zero, with its decimal.
  { ms: 0, value: "0.0" },
  // A tenth of a millisecond is the finest step.
  { ms: 0.04, value: "0.0" },
  // One decimal below 100.
  { ms: 12.34, value: "12.3" },
  // 99.94 stays below 100.
  { ms: 99.94, value: "99.9" },
  // 99.96 rounds to 100: printed whole.
  { ms: 99.96, value: "100" },
  // Whole from 100.
  { ms: 100, value: "100" },
  // 1234.5 is exact in binary: rounds half up, no group separator.
  { ms: 1234.5, value: "1235" },
];

// ---- a stand-in for the engine's Results ---------------------------------------

/**
 * A fake Results object with fixed answers.
 * @param summary the flat summary
 * @param pts the point lists
 * @returns a ResultsLike
 */
function fakeResults(
  summary: { [key: string]: number | boolean | null | undefined },
  pts: { lat?: number[]; down?: { bps?: number; duration: number }[]; up?: { bps?: number; duration: number }[]; dl?: number[]; ul?: number[] } = {},
): ResultsLike {
  // Every getter answers from the arguments.
  return {
    // The summary.
    getSummary: () => summary,
    // Idle latency points.
    getUnloadedLatencyPoints: () => pts.lat ?? [],
    // Download points.
    getDownloadBandwidthPoints: () => pts.down ?? [],
    // Upload points.
    getUploadBandwidthPoints: () => pts.up ?? [],
    // During download.
    getDownLoadedLatencyPoints: () => pts.dl ?? [],
    // During upload.
    getUpLoadedLatencyPoints: () => pts.ul ?? [],
  };
}

// ---- a stand-in engine for the controller ----------------------------------------

/** A fake engine that records what the controller does and lets a vector fire its callbacks. */
interface FakeEngine extends EngineLike {
  /** How many times play() was called. */
  plays: number;
  /** How many times pause() was called. */
  pauses: number;
  /** How many times detach() was called. */
  detaches: number;
  /** The handlers as attached (kept even after detach, to simulate a late callback). */
  handlers: EngineHandlers | null;
  /** Whether detach() has silenced it. */
  silenced: boolean;
}

/**
 * Build a fake engine.
 * @param results what its results() returns
 * @returns the engine
 */
function fakeEngine(results: ResultsLike): FakeEngine {
  // The recorder.
  const e: FakeEngine = {
    // Counters.
    plays: 0,
    // Counters.
    pauses: 0,
    // Counters.
    detaches: 0,
    // Set by attach.
    handlers: null,
    // Set by detach.
    silenced: false,
    // The fixed results.
    results: () => results,
    // Count plays.
    play: () => {
      // One more.
      e.plays += 1;
    },
    // Count pauses.
    pause: () => {
      // One more.
      e.pauses += 1;
    },
    // Keep the handlers.
    attach: (h) => {
      // Remembered.
      e.handlers = h;
    },
    // Count detaches and mark silenced.
    detach: () => {
      // One more.
      e.detaches += 1;
      // Silenced.
      e.silenced = true;
    },
  };
  // Done.
  return e;
}

/** A promise with its resolve and reject exposed, to hold the factory open. */
function deferred<T>(): { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void } {
  // Filled by the executor.
  let resolve!: (v: T) => void;
  // Filled by the executor.
  let reject!: (e: unknown) => void;
  // The promise.
  const promise = new Promise<T>((res, rej) => {
    // Exposed.
    resolve = res;
    // Exposed.
    reject = rej;
  });
  // All three.
  return { promise, resolve, reject };
}

/** Let pending promise callbacks run. */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

// ---- the runner -------------------------------------------------------------------

/** The report shape the vector runner reads. */
export interface VectorReport {
  /** GOLDEN_VECTOR_SET_ID. */
  setId: string;
  /** How many checks ran. */
  total: number;
  /** How many passed. */
  passed: number;
  /** One line per failed check. */
  failures: string[];
}

/** The part of the engine's merged configuration the vectors read (a protected getter at runtime). */
interface MergedConfig {
  /** Every option, after the engine merged the page's over its defaults. */
  [key: string]: unknown;
  /** The measurement list. */
  measurements: { type: string; [key: string]: unknown }[];
}

/**
 * Run every vector. Async because the engine module is imported dynamically (as the page does).
 * @returns the report
 */
export async function verifyVectors(): Promise<VectorReport> {
  // One line per failure.
  const failures: string[] = [];
  // How many checks ran.
  let total = 0;
  // Run one check: count it, record a failure message when it returns one or throws.
  const check = async (id: string, fn: () => Promise<string | null> | string | null) => {
    // Every check counts.
    total += 1;
    try {
      // null means pass; a string explains the failure.
      const why = await fn();
      // Record a failure.
      if (why) failures.push(`${id}: ${why}`);
    } catch (e) {
      // A check that throws has failed.
      failures.push(`${id}: threw ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // ---- the engine itself: its defaults against PLAN and the copy --------------------

  // Build engines with fetch replaced by a tripwire: construction must send nothing.
  const realFetch = globalThis.fetch;
  // Every call the tripwire sees.
  const fetchCalls: string[] = [];
  // The tripwire.
  globalThis.fetch = ((input: unknown) => {
    // Recorded.
    fetchCalls.push(String(input));
    // Never answers.
    return new Promise(() => {});
  }) as typeof fetch;
  // The engine's merged configurations, read through its protected getter.
  let defaults: MergedConfig | null = null;
  // With the page's options.
  let ours: MergedConfig | null = null;
  // Whether the page-configured engine reports itself idle after construction.
  let idleAfterConstruction = false;
  try {
    // The same import the page makes.
    const { default: SpeedTest } = await import("@cloudflare/speedtest");
    // The engine with its defaults, not started.
    const d = new SpeedTest({ autoStart: false });
    // Its merged configuration.
    defaults = (d as unknown as { config: MergedConfig }).config;
    // The engine as the page builds it.
    const o = new SpeedTest(engineOptions());
    // Its merged configuration.
    ours = (o as unknown as { config: MergedConfig }).config;
    // Not running, not finished.
    idleAfterConstruction = !o.isRunning && !o.isFinished;
  } finally {
    // Put fetch back.
    globalThis.fetch = realFetch;
  }

  // The engine loaded and exposed its configuration.
  await check("engine/loaded", () => (defaults && ours ? null : "the engine's configuration could not be read"));

  // The version the code comments, the page and the copy describe is the version the repository pins, exactly (an
  // upgrade made with npm rewrites this pin; the package's own package.json is not exported, so the manifest is read).
  await check("engine/version-pinned", async () => {
    // The repository's manifest, as JSON.
    const manifest = (await import("../../../../package.json", { with: { type: "json" } })).default as { dependencies?: Record<string, string> };
    // The pin as written.
    const pin = manifest.dependencies?.["@cloudflare/speedtest"];
    // An exact pin, equal to the documented version.
    return pin === SOURCE_SNAPSHOT.engineVersion ? null : `package.json pins ${String(pin)}, the page describes ${SOURCE_SNAPSHOT.engineVersion}`;
  });

  // PLAN is the engine's default list, exactly.
  await check("plan/equals-engine-default", () => {
    // Without the configuration nothing can be compared.
    if (!defaults) return "no configuration";
    // Compared field by field through JSON.
    return JSON.stringify(defaults.measurements) === JSON.stringify(PLAN) ? null : `engine default differs: ${JSON.stringify(defaults.measurements)}`;
  });

  // The default has no packet-loss step, and no TURN server or credentials endpoint is configured by default.
  await check("plan/default-has-no-packet-loss-or-turn", () => {
    // Without the configuration nothing can be compared.
    if (!defaults || !ours) return "no configuration";
    // No packet-loss step in the default; both TURN settings null, by default and as the page builds the engine.
    const ok =
      !defaults.measurements.some((m) => m.type === "packetLoss") &&
      defaults.turnServerUri === null &&
      defaults.turnServerCredsApiUrl === null &&
      ours.turnServerUri === null &&
      ours.turnServerCredsApiUrl === null;
    // Report.
    return ok ? null : `turn ${String(defaults.turnServerUri)} creds ${String(defaults.turnServerCredsApiUrl)}`;
  });

  // The page's engine runs exactly PLAN.
  await check("plan/page-engine-runs-plan", () => (ours && JSON.stringify(ours.measurements) === JSON.stringify(PLAN) ? null : "the page's engine has another plan"));

  // No step type that reaches another host, or needs a TURN server, is in the plan.
  await check("plan/no-forbidden-step", () => {
    // Any forbidden type present.
    const bad = PLAN.filter((s) => FORBIDDEN_STEP_TYPES.includes(s.type));
    // None.
    return bad.length === 0 ? null : `forbidden: ${bad.map((s) => s.type).join(", ")}`;
  });

  // Results logging is on by default (so switching it off matters) and off as the page configures it.
  await check("logging/default-on-page-off", () => {
    // Without the configuration nothing can be compared.
    if (!defaults || !ours) return "no configuration";
    // The default reports to __results; the page's engine reports nowhere; the per-measurement log is off in both.
    const ok =
      defaults.logAimApiUrl === RESULTS_LOG_URL &&
      ours.logAimApiUrl === null &&
      defaults.logMeasurementApiUrl === null &&
      ours.logMeasurementApiUrl === null;
    // Report.
    return ok ? null : `default ${String(defaults.logAimApiUrl)} page ${String(ours.logAimApiUrl)} meas ${String(ours.logMeasurementApiUrl)}`;
  });

  // The page's engine downloads and uploads on SPEED_HOST only, with no credentials, and does not start by itself.
  await check("hosts/page-engine-endpoints", () => {
    // Without the configuration nothing can be compared.
    if (!ours) return "no configuration";
    // The two endpoints, their host, the credentials switch and autoStart.
    const ok =
      ours.downloadApiUrl === DOWNLOAD_URL &&
      ours.uploadApiUrl === UPLOAD_URL &&
      new URL(String(ours.downloadApiUrl)).host === SPEED_HOST &&
      new URL(String(ours.uploadApiUrl)).host === SPEED_HOST &&
      ours.includeCredentials === false &&
      ours.autoStart === false;
    // Report.
    return ok ? null : `${String(ours.downloadApiUrl)} ${String(ours.uploadApiUrl)} ${String(ours.includeCredentials)}`;
  });

  // The engine's defaults for these endpoints are the documented ones (so stating them changes nothing today).
  await check("hosts/engine-defaults-documented", () => (defaults && defaults.downloadApiUrl === DOWNLOAD_URL && defaults.uploadApiUrl === UPLOAD_URL ? null : "defaults moved"));

  // Every setting the page's definitions quote is the engine's value.
  await check("settings/quoted-equal-engine", () => {
    // Without the configuration nothing can be compared.
    if (!ours) return "no configuration";
    // Each quoted setting.
    const bad = Object.entries(ENGINE_DEFAULTS_USED).filter(([k, v]) => ours![k] !== v);
    // None differ.
    return bad.length === 0 ? null : `differs: ${bad.map(([k]) => `${k}=${String(ours![k])}`).join(", ")}`;
  });

  // Building the engines sent nothing, and the page's engine is idle until play().
  await check("engine/construction-sends-nothing", () => (fetchCalls.length === 0 && idleAfterConstruction ? null : `fetch calls ${fetchCalls.length}, idle ${idleAfterConstruction}`));

  // engineOptions() hands out a fresh plan each time, so the engine cannot alter PLAN.
  await check("plan/fresh-copy", () => {
    // Two option sets.
    const a = engineOptions();
    // Another.
    const b = engineOptions();
    // Mutate the first.
    (a.measurements[0] as { numPackets: number }).numPackets = 999;
    // The second and PLAN are untouched, and the arrays are distinct.
    const ok = a.measurements !== b.measurements && (b.measurements[0] as { numPackets: number }).numPackets === 2 && (PLAN[0] as { numPackets: number }).numPackets === 2;
    // Report.
    return ok ? null : "PLAN shared with the engine";
  });

  // PLAN is frozen.
  await check("plan/frozen", () => (Object.isFrozen(PLAN) && PLAN.every((s) => Object.isFrozen(s)) ? null : "PLAN can be changed"));

  // ---- totals and progress ----------------------------------------------------------

  // The totals of PLAN, added by hand from the list.
  await check("totals/plan", () => {
    // The computed totals.
    const t = planTotals(PLAN);
    // The expected ones.
    const want = {
      steps: 24,
      latencyRequests: 42,
      downloadSteps: 7,
      downloadRequests: 33,
      downloadBytesMax: 969_000_000,
      downloadSizeMin: 1e5,
      downloadSizeMax: 25e7,
      uploadSteps: 5,
      uploadRequests: 25,
      uploadBytesMax: 296_800_000,
      uploadSizeMin: 1e5,
      uploadSizeMax: 5e7,
    };
    // Compared as JSON (same key order).
    return JSON.stringify(t) === JSON.stringify(want) ? null : JSON.stringify(t);
  });

  // An empty plan has zeros, not infinities.
  await check("totals/empty", () => {
    // The totals.
    const t = planTotals([]);
    // All zero.
    return t.steps === 0 && t.downloadSizeMin === 0 && t.uploadSizeMin === 0 && t.downloadBytesMax === 0 ? null : JSON.stringify(t);
  });

  // A latency-only plan.
  await check("totals/latency-only", () => {
    // The plan.
    const plan: PlanStep[] = [{ type: "latency", numPackets: 3 }, { type: "latency", numPackets: 4 }];
    // The totals.
    const t = planTotals(plan);
    // Seven requests, no transfers.
    return t.latencyRequests === 7 && t.downloadSteps === 0 && t.uploadSteps === 0 ? null : JSON.stringify(t);
  });

  // The first and last steps, and the refusals.
  await check("phase/first", () => {
    // Step 0.
    const p = phaseInfo(PLAN, 0);
    // 1 of 24, the two-request latency estimate.
    return p && p.index === 1 && p.total === 24 && p.step.type === "latency" && Math.abs(p.fraction - 1 / 24) < 1e-12 ? null : JSON.stringify(p);
  });
  // The last step.
  await check("phase/last", () => {
    // Step 23.
    const p = phaseInfo(PLAN, 23);
    // 24 of 24, the 250 MB downloads, fraction 1.
    return p && p.index === 24 && p.step.type === "download" && p.step.bytes === 25e7 && p.fraction === 1 ? null : JSON.stringify(p);
  });
  // Outside the plan.
  for (const bad of [-1, 24, 1.5, Number.NaN]) {
    // One check per index.
    await check(`phase/refuse-${String(bad)}`, () => (phaseInfo(PLAN, bad) === null ? null : "accepted"));
  }

  // ---- formatting ---------------------------------------------------------------------

  // Bit rates.
  for (const v of RATE_VECTORS) {
    // One check per row.
    await check(`rate/${v.bps}`, () => {
      // The formatted quantity.
      const q = formatBitRate(v.bps);
      // Digits and unit.
      return q && q.value === v.value && q.unit === v.unit ? null : `got ${JSON.stringify(q)}`;
    });
  }
  // Refusals.
  for (const bad of [Number.NaN, -1, Number.POSITIVE_INFINITY]) {
    // One check per value.
    await check(`rate/refuse-${String(bad)}`, () => (formatBitRate(bad) === null ? null : "accepted"));
  }
  // Sizes.
  for (const v of BYTE_VECTORS) {
    // One check per row.
    await check(`bytes/${v.bytes}`, () => {
      // The formatted quantity.
      const q = formatBytes(v.bytes);
      // Digits and unit.
      return q && q.value === v.value && q.unit === v.unit ? null : `got ${JSON.stringify(q)}`;
    });
  }
  // Milliseconds.
  for (const v of MS_VECTORS) {
    // One check per row.
    await check(`ms/${v.ms}`, () => {
      // The formatted quantity.
      const q = formatMs(v.ms);
      // Digits and unit.
      return q && q.value === v.value && q.unit === "ms" ? null : `got ${JSON.stringify(q)}`;
    });
  }
  // Refusals.
  await check("ms/refuse-negative", () => (formatMs(-0.1) === null && formatMs(Number.NaN) === null ? null : "accepted"));
  // Seconds.
  await check("seconds/42149", () => {
    // 42.149 s to one decimal.
    const q = formatSeconds(42_149);
    // 42.1 s.
    return q && q.value === "42.1" && q.unit === "s" ? null : JSON.stringify(q);
  });
  // Zero seconds.
  await check("seconds/0", () => (formatSeconds(0)?.value === "0.0" ? null : JSON.stringify(formatSeconds(0))));
  // The rounding helpers directly.
  await check("fixed/half-up", () => (fixed(0.25, 1) === "0.3" && fixed(2.5, 0) === "3" && fixed(1, 2) === "1.00" ? null : `${fixed(0.25, 1)} ${fixed(2.5, 0)} ${fixed(1, 2)}`));
  // Three figures at each width.
  await check("threeFigures/widths", () => (threeFigures(1.234) === "1.23" && threeFigures(12.34) === "12.3" && threeFigures(123.4) === "123" ? null : "wrong widths"));
  // The decimal mark.
  await check("decimal/pt-BR", () => (localiseDecimal("94.3", ",") === "94,3" && localiseDecimal("943", ",") === "943" ? null : "wrong mark"));
  // A quantity as text, with the no-break space.
  await check("quantityText/no-break-space", () => {
    // pt-BR.
    const s = quantityText({ value: "94.3", unit: "Mbit/s" } as Quantity, ",");
    // "94,3", U+00A0, "Mbit/s".
    return s === "94,3 Mbit/s" ? null : JSON.stringify(s);
  });

  // ---- reading results ------------------------------------------------------------------

  // Counting points: the engine's own filter (duration >= 10 ms and a rate).
  await check("points/counting", () => {
    // Too short, at the threshold, no rate, a good one.
    const n = countingPoints([{ bps: 1e6, duration: 5 }, { bps: 1e6, duration: 10 }, { duration: 50 }, { bps: 2e6, duration: 300 }]);
    // Two count.
    return n === 2 ? null : `counted ${n}`;
  });

  // A snapshot copies the numbers, keeps a null jitter, drops what is not a finite number.
  await check("snapshot/copy", () => {
    // A mid-run summary.
    const r = fakeResults(
      // The engine's flat summary, with a boolean and a NaN that must not print.
      { download: 94.25e6, upload: Number.NaN, latency: 12.34, jitter: null, downLoadedLatency: 40, v4Reachability: true },
      // The points behind it.
      { lat: [12.34], down: [{ bps: 9e7, duration: 20 }, { bps: 1e8, duration: 8 }], up: [], dl: [40, 41, 39], ul: [] },
    );
    // The snapshot.
    const s = snapshotFrom(r);
    // Values and counts.
    const ok =
      s.download === 94.25e6 &&
      s.upload === undefined &&
      s.latency === 12.34 &&
      s.jitter === null &&
      s.downLoadedLatency === 40 &&
      s.totalDurationMs === undefined &&
      s.counts.latency === 1 &&
      s.counts.download === 1 &&
      s.counts.upload === 0 &&
      s.counts.downLoaded === 3 &&
      s.counts.upLoaded === 0;
    // Report.
    return ok ? null : JSON.stringify(s);
  });

  // Before anything is measured, every row is "none" (the engine's empty percentile, 0, never prints).
  await check("rows/empty", () => {
    // An engine that has measured nothing, reporting 0 for an empty bandwidth set.
    const rows = summaryRows(snapshotFrom(fakeResults({ download: 0, latency: 0 })));
    // Eight rows, all none.
    return rows.length === 8 && rows.every((r) => r.state === "none") ? null : JSON.stringify(rows);
  });

  // One idle point: latency prints, jitter is "tooFew".
  await check("rows/one-latency-point", () => {
    // One point.
    const rows = summaryRows(snapshotFrom(fakeResults({ latency: 7.25, jitter: null }, { lat: [7.25] })));
    // The latency and jitter rows.
    const lat = rows.find((r) => r.key === "latency");
    // Jitter.
    const jit = rows.find((r) => r.key === "jitter");
    // 7.3 ms (7.25 exact in binary, half up) and too few.
    return lat?.state === "value" && lat.quantity?.value === "7.3" && jit?.state === "tooFew" ? null : JSON.stringify([lat, jit]);
  });

  // A finished run: every row prints, in order, with its count.
  await check("rows/full", () => {
    // A complete summary.
    const s: Snapshot = {
      // Bit rates.
      download: 94.25e6,
      // Bit rates.
      upload: 12_345_000,
      // Times.
      latency: 12.34,
      // Times.
      jitter: 1.25,
      // Times.
      downLoadedLatency: 99.96,
      // Times.
      downLoadedJitter: 4.5,
      // Times.
      upLoadedLatency: 150,
      // Times.
      upLoadedJitter: 20.25,
      // Duration.
      totalDurationMs: 42_149,
      // Counts.
      counts: { latency: 42, download: 30, upload: 20, downLoaded: 20, upLoaded: 18 },
    };
    // The rows as "key=value unit (count)".
    const got = summaryRows(s).map((r) => `${r.key}=${r.quantity?.value ?? r.state} ${r.quantity?.unit ?? ""} (${r.count})`).join("; ");
    // The expected print.
    const want =
      "download=94.3 Mbit/s (30); upload=12.3 Mbit/s (20); latency=12.3 ms (42); jitter=1.3 ms (42); " +
      "downLoadedLatency=100 ms (20); downLoadedJitter=4.5 ms (20); upLoadedLatency=150 ms (18); upLoadedJitter=20.3 ms (18)";
    // Compared.
    return got === want ? null : got;
  });

  // ---- failures ------------------------------------------------------------------------

  // The sorting of the engine's onError(message, status).
  await check("failure/classify", () => {
    // Each case.
    const got = [classifyFailure(undefined), classifyFailure(429), classifyFailure(503), classifyFailure(404), classifyFailure(1.5)].join(",");
    // Expected.
    return got === "network,rateLimited,http,http,network" ? null : got;
  });

  // ---- the controller, driven by a stand-in engine ------------------------------------------

  // A full run: loading, one factory call with the page's options, play once, a second Start ignored, phases and
  // progress relayed, finish frees the gate.
  await check("run/full", async () => {
    // Every event.
    const events: RunEvent[] = [];
    // The options the factory received.
    const seen: EngineOptions[] = [];
    // The engine handed out.
    const eng = fakeEngine(fakeResults({ download: 9e7 }, { down: [{ bps: 9e7, duration: 100 }] }));
    // The controller.
    const run = new SpeedRun(async (opts) => {
      // Recorded.
      seen.push(opts);
      // The fake.
      return eng;
    }, (e) => events.push(e));
    // Start.
    const first = await run.start();
    // A second Start while running.
    const second = await run.start();
    // The engine starts a step and reports a value.
    eng.handlers?.phase(3);
    // A value changed.
    eng.handlers?.results();
    // Busy until it finishes.
    const busyMid: boolean = run.busy;
    // Finished.
    eng.handlers?.finish();
    // Free once finished.
    const busyEnd: boolean = run.busy;
    // The event kinds in order.
    const kinds = events.map((e) => e.kind).join(",");
    // Everything as specified.
    const ok =
      first === true &&
      second === false &&
      seen.length === 1 &&
      seen[0].logAimApiUrl === null &&
      seen[0].autoStart === false &&
      eng.plays === 1 &&
      busyMid &&
      !busyEnd &&
      kinds === "loading,phase,progress,finished";
    // Report.
    return ok ? null : `first ${first} second ${second} calls ${seen.length} plays ${eng.plays} kinds ${kinds}`;
  });

  // Stop while running: pause and detach, "stopped" once, and a late callback from the old engine is dropped.
  await check("run/stop-running", async () => {
    // Every event.
    const events: RunEvent[] = [];
    // The engine.
    const eng = fakeEngine(fakeResults({}));
    // The controller.
    const run = new SpeedRun(async () => eng, (e) => events.push(e));
    // Start.
    await run.start();
    // The handlers as they were before Stop (a late callback would come through them).
    const h = eng.handlers;
    // Stop.
    run.stop();
    // Late reports from the stopped engine.
    h?.phase(5);
    // Late.
    h?.results();
    // Late.
    h?.finish();
    // Late.
    h?.error("late", 500);
    // The kinds.
    const kinds = events.map((e) => e.kind).join(",");
    // Paused, detached, stopped once, nothing after.
    return eng.pauses === 1 && eng.detaches === 1 && kinds === "loading,stopped" && !run.busy ? null : `pauses ${eng.pauses} detaches ${eng.detaches} kinds ${kinds}`;
  });

  // Stop while the engine is still loading: it is never played.
  await check("run/stop-while-loading", async () => {
    // Every event.
    const events: RunEvent[] = [];
    // The factory, held open.
    const d = deferred<EngineLike>();
    // The engine it will eventually return.
    const eng = fakeEngine(fakeResults({}));
    // The controller.
    const run = new SpeedRun(() => d.promise, (e) => events.push(e));
    // Start (not awaited: the factory is pending).
    const pending = run.start();
    // Stop before the engine arrives.
    run.stop();
    // The engine arrives.
    d.resolve(eng);
    // Let start() finish.
    await pending;
    // A moment more.
    await tick();
    // The kinds.
    const kinds = events.map((e) => e.kind).join(",");
    // Never played, never attached.
    return eng.plays === 0 && eng.handlers === null && kinds === "loading,stopped" ? null : `plays ${eng.plays} kinds ${kinds}`;
  });

  // The engine's code cannot be loaded: "load", nothing played, the gate free for another try.
  await check("run/load-failure", async () => {
    // Every event.
    const events: RunEvent[] = [];
    // The controller with a failing factory.
    const run = new SpeedRun(() => Promise.reject(new Error("chunk")), (e) => events.push(e));
    // Start.
    await run.start();
    // The last event.
    const last = events[events.length - 1];
    // Sorted as load, not busy.
    return last?.kind === "failed" && last.failure === "load" && !run.busy ? null : JSON.stringify(events);
  });

  // An HTTP 429 from the engine: rate limited, with the engine's own message, paused and detached.
  await check("run/error-429", async () => {
    // Every event.
    const events: RunEvent[] = [];
    // The engine.
    const eng = fakeEngine(fakeResults({}));
    // The controller.
    const run = new SpeedRun(async () => eng, (e) => events.push(e));
    // Start.
    await run.start();
    // The engine gives up after its retries.
    eng.handlers?.error("Connection failed to https://speed.cloudflare.com/__down?bytes=1000000. Gave up after 3 retries.", 429);
    // The last event.
    const last = events[events.length - 1];
    // Sorted, message kept, engine paused and detached, gate free.
    const ok = last?.kind === "failed" && last.failure === "rateLimited" && last.status === 429 && last.message.startsWith("Connection failed") && eng.pauses === 1 && eng.detaches === 1 && !run.busy;
    // Report.
    return ok ? null : JSON.stringify(last);
  });

  // A network failure (no status).
  await check("run/error-network", async () => {
    // Every event.
    const events: RunEvent[] = [];
    // The engine.
    const eng = fakeEngine(fakeResults({}));
    // The controller.
    const run = new SpeedRun(async () => eng, (e) => events.push(e));
    // Start.
    await run.start();
    // No status.
    eng.handlers?.error("Connection failed to https://speed.cloudflare.com/__up?bytes=100000.");
    // The last event.
    const last = events[events.length - 1];
    // Sorted as network.
    return last?.kind === "failed" && last.failure === "network" && last.status === undefined ? null : JSON.stringify(last);
  });

  // Stop on unmount is silent, and Stop with nothing running reports nothing.
  await check("run/stop-silent-and-idle", async () => {
    // Every event.
    const events: RunEvent[] = [];
    // The engine.
    const eng = fakeEngine(fakeResults({}));
    // The controller.
    const run = new SpeedRun(async () => eng, (e) => events.push(e));
    // Stop with nothing running.
    run.stop();
    // Start, then a silent stop.
    await run.start();
    // Silent.
    run.stop(true);
    // The kinds.
    const kinds = events.map((e) => e.kind).join(",");
    // Only the loading report; the engine was still paused.
    return kinds === "loading" && eng.pauses === 1 ? null : `kinds ${kinds} pauses ${eng.pauses}`;
  });

  // After a run ends, the next Start builds a fresh engine.
  await check("run/again", async () => {
    // How many engines were built.
    let built = 0;
    // The engines.
    const engines: FakeEngine[] = [];
    // The controller.
    const run = new SpeedRun(async () => {
      // One more.
      built += 1;
      // A fresh fake.
      const e = fakeEngine(fakeResults({}));
      // Kept.
      engines.push(e);
      // Handed out.
      return e;
    }, () => {});
    // First run, finished.
    await run.start();
    // Finished.
    engines[0].handlers?.finish();
    // Second run.
    const again = await run.start();
    // Two engines, each played once.
    return again && built === 2 && engines[0].plays === 1 && engines[1].plays === 1 ? null : `built ${built}`;
  });

  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
