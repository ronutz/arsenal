// ============================================================================
// src/lib/dev-out/speed-test/compute.ts
// ----------------------------------------------------------------------------
// SPEED TEST - a /dev/out resident (2026-10-26), built on Cloudflare's
// open-source measurement engine, @cloudflare/speedtest 1.15.0 (MIT). Like the
// RDAP, ASN and Pwned Passwords tools, everything that can be computed locally
// is computed here, deterministically, and pinned by golden vectors: the plan
// the engine is given, what that plan can transfer at most, the progress line,
// the formatting of every number the page prints, the reading of the engine's
// results into rows, and the sorting of a failure. The measurements themselves
// are the live world and carry no golden-vector guarantee.
//
// THE VERSION. 1.15.0, pinned exactly in package.json: the npm registry's
// "latest" when read on 2026-10-27 (published 2026-10-23). It follows 1.14.1,
// this page's first basis, and 1.14.2 (2026-10-14): durations now come from the
// final response headers where the browser reports them, a sample without a
// measurable duration is discarded, and packet loss is opt-in, with no default
// TURN server. The project publishes no support or end-of-life policy. The
// golden vectors fail if the installed engine's plan, a quoted setting or the
// pinned version moves without this file and the copy.
//
// WHAT THE ENGINE DOES (package README and dist/speedtest.js of 1.15.0, the
// same README as the v1.15.0 tag on GitHub, read 2026-10-27):
//   - it "performs test requests against the Cloudflare edge network and
//     relies on the PerformanceResourceTiming browser api to extract timing
//     results"; downloads are GET https://speed.cloudflare.com/__down?bytes=N,
//     uploads POST https://speed.cloudflare.com/__up?bytes=N with N bytes of
//     the character "0", latency requests are downloads of bytes=0;
//   - latency is "the round-trip time-to-first-byte timing between
//     requestStart and responseStart" (the code takes the start of the final
//     response's headers where the browser reports it, so an interim 1xx
//     answer does not count), reduced at latencyPercentile (default
//     0.5, the median), with the server's own processing time (its
//     Server-Timing header) taken off;
//   - jitter "is calculated as the average distance between consecutive
//     latency measurements" and needs at least two of them;
//   - a request's bandwidth is "calculated by dividing the transferSize (in
//     bits) by the request duration (excluding the server processing time)",
//     requests shorter than bandwidthMinRequestDuration (10 ms) are left out,
//     and the set is reduced at bandwidthPercentile (default 0.9);
//   - loaded latency is measured by extra empty requests every
//     loadedLatencyThrottle (400 ms) while a download or upload runs, kept only
//     for sizes whose requests last at least loadedRequestMinDuration (250 ms),
//     the last loadedLatencyMaxPoints (20) of them;
//   - a direction stops growing once a size's quickest request takes longer
//     than bandwidthFinishRequestDuration (1000 ms): larger sizes in that
//     direction are skipped;
//   - "measurement results are collected by Cloudflare on completion for the
//     purpose of calculating aggregated insights regarding Internet connection
//     quality": the default logAimApiUrl is https://speed.cloudflare.com/__results,
//     and the configuration's own documentation says "Set to `null` to
//     disable". ENGINE_OPTIONS below sets it, and the per-measurement log
//     (logMeasurementApiUrl, null by default), to null;
//   - packet loss goes through a WebRTC TURN server, and this version's README
//     says "Packet loss is opt-in: it is not part of the default measurements,
//     and it needs your own TURN server configuration" (both TURN settings
//     default to null). This site runs no TURN server, and PLAN, the engine's
//     own default, has no packet-loss step.
//
// MEASURED FROM THIS CONTAINER on 2026-10-26 23:19 and again on 2026-10-27
// 10:19 São Paulo, with the same answers (curl, Origin: https://ronutz.com,
// full log in the build notes): __down and __up answer
// access-control-allow-origin: * and timing-allow-origin: * (so a browser lets
// the engine read the timings), Server-Timing cfSpeedEdge and cfSpeedWorker,
// no cookie; the answers also carry Cloudflare's own Network Error Logging
// policy (success_fraction 0.01) and its estimate of the client's location.
//
// PRIME DIRECTIVE (D-19): every line commented.
// ============================================================================

// ----------------------------------------------------------------------------
// Constants, each from the engine's documentation and source, read 2026-10-26
// and again 2026-10-27
// ----------------------------------------------------------------------------

/** When the engine's README, source and the service's statements were read, surfaced in the page's provenance line. */
export const SOURCE_SNAPSHOT = Object.freeze({
  // The day the README, the source, the privacy statement and the probes were last read and run (all unchanged since 2026-10-26).
  accessed: "2026-10-27",
  // The engine's version, pinned exactly in package.json (the README of this version is the one at the v1.15.0 tag); a vector compares the two.
  engineVersion: "1.15.0",
  // The engine's repository.
  repository: "https://github.com/cloudflare/speedtest",
  // The service's own privacy statement for its speed test (the "Privacy and Speed Test" text on its page).
  privacyStatement: "https://speed.cloudflare.com/",
});

/** The one host this tool may reach; the page's Content-Security-Policy names it and nothing else. */
export const SPEED_HOST = "speed.cloudflare.com";

/** The download endpoint (README: downloadApiUrl default), also used for latency with bytes=0. */
export const DOWNLOAD_URL = `https://${SPEED_HOST}/__down`;

/** The upload endpoint (README: uploadApiUrl default). */
export const UPLOAD_URL = `https://${SPEED_HOST}/__up`;

/** The results-logging endpoint this page switches OFF (dist/speedtest.d.ts: logAimApiUrl default). */
export const RESULTS_LOG_URL = `https://${SPEED_HOST}/__results`;

/**
 * The engine settings the page's definitions quote. These are the engine's defaults, left unchanged; the golden
 * vectors compare them with the engine's merged configuration, so the copy cannot drift from what runs.
 */
export const ENGINE_DEFAULTS_USED = Object.freeze({
  // Latency is reduced at this percentile: the median.
  latencyPercentile: 0.5,
  // Bandwidth is reduced at this percentile.
  bandwidthPercentile: 0.9,
  // Requests shorter than this many milliseconds do not count toward bandwidth.
  bandwidthMinRequestDuration: 10,
  // A direction stops growing once a size's quickest request takes longer than this many milliseconds.
  bandwidthFinishRequestDuration: 1000,
  // Loaded-latency requests are sent this many milliseconds apart.
  loadedLatencyThrottle: 400,
  // Loaded latency counts only sizes whose requests last at least this many milliseconds.
  loadedRequestMinDuration: 250,
  // At most this many loaded-latency points are kept (the latest).
  loadedLatencyMaxPoints: 20,
  // Latency is measured while downloads run.
  measureDownloadLoadedLatency: true,
  // Latency is measured while uploads run.
  measureUploadLoadedLatency: true,
});

// ----------------------------------------------------------------------------
// The plan: the engine's default measurement sequence of 1.15.0, which no
// longer has the packet-loss step 1.14.1 carried (dist/speedtest.js,
// defaultConfig.measurements, read 2026-10-27; the same as
// src/config/defaultConfig.ts at the release's commit 11129643). The README's own listing of the default is older than the code
// (it shows a first latency step of one request and no latency steps between
// the transfers); the code is what runs, and the page passes this list to the
// engine explicitly, so the plan shown before Start is the plan that runs.
// ----------------------------------------------------------------------------

/** A latency step: empty requests (bytes=0) timed while nothing else transfers. */
export interface LatencyStep {
  /** The step's kind. */
  readonly type: "latency";
  /** How many empty requests it sends. */
  readonly numPackets: number;
}

/** A download or upload step: `count` requests of `bytes` bytes. */
export interface TransferStep {
  /** The direction. */
  readonly type: "download" | "upload";
  /** The size of each request's body, in bytes. */
  readonly bytes: number;
  /** How many requests of that size. */
  readonly count: number;
  /** When true, this step never stops its direction (the engine's first, estimating download). */
  readonly bypassMinDuration?: boolean;
}

/** One step of the plan. */
export type PlanStep = LatencyStep | TransferStep;

/** The plan, in the engine's order: the 1.15.0 default, exactly (1.14.1 had a packet-loss step after the 100 kB uploads). */
export const PLAN: readonly PlanStep[] = Object.freeze([
  // Two empty requests: the first latency estimate.
  { type: "latency", numPackets: 2 },
  // One 100 kB download that never stops the direction: the first bandwidth estimate.
  { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
  // Twenty empty requests: the main idle latency set.
  { type: "latency", numPackets: 20 },
  // Nine more 100 kB downloads.
  { type: "download", bytes: 1e5, count: 9 },
  // Two empty requests between transfers.
  { type: "latency", numPackets: 2 },
  // Eight 1 MB downloads.
  { type: "download", bytes: 1e6, count: 8 },
  // Two empty requests.
  { type: "latency", numPackets: 2 },
  // Eight 100 kB uploads.
  { type: "upload", bytes: 1e5, count: 8 },
  // Two empty requests (1.14.1 ran its packet-loss step next; 1.15.0 has none by default).
  { type: "latency", numPackets: 2 },
  // Six 1 MB uploads.
  { type: "upload", bytes: 1e6, count: 6 },
  // Two empty requests.
  { type: "latency", numPackets: 2 },
  // Six 10 MB downloads.
  { type: "download", bytes: 1e7, count: 6 },
  // Two empty requests.
  { type: "latency", numPackets: 2 },
  // Four 10 MB uploads.
  { type: "upload", bytes: 1e7, count: 4 },
  // Two empty requests.
  { type: "latency", numPackets: 2 },
  // Four 25 MB downloads.
  { type: "download", bytes: 25e6, count: 4 },
  // Two empty requests.
  { type: "latency", numPackets: 2 },
  // Four 25 MB uploads.
  { type: "upload", bytes: 25e6, count: 4 },
  // Two empty requests.
  { type: "latency", numPackets: 2 },
  // Three 100 MB downloads.
  { type: "download", bytes: 1e8, count: 3 },
  // Two empty requests.
  { type: "latency", numPackets: 2 },
  // Three 50 MB uploads.
  { type: "upload", bytes: 5e7, count: 3 },
  // Two empty requests.
  { type: "latency", numPackets: 2 },
  // Two 250 MB downloads: the largest size, reached only while each smaller download size had a request done within a second.
  { type: "download", bytes: 25e7, count: 2 },
].map((s) => Object.freeze(s as PlanStep)));

/** The step types the engine knows but this page must never run (they reach other hosts or need a TURN server). */
export const FORBIDDEN_STEP_TYPES: readonly string[] = Object.freeze([
  // WebRTC through a TURN server (none by default since 1.15.0; one's own TURN host and credentials endpoint when configured).
  "packetLoss",
  // The same, under load.
  "packetLossUnderLoad",
  // A fetch to invalid.rpki.cloudflare.com.
  "rpki",
  // Fetches to hosts given in the step.
  "v4Reachability",
  // Same.
  "v6Reachability",
  // Same.
  "nxdomain",
]);

/** What the page hands the engine's constructor (the engine merges it over its defaults). */
export interface EngineOptions {
  /** Never start on construction: the engine plays only when the reader presses Start. */
  readonly autoStart: false;
  /** The download endpoint, stated rather than inherited, so the CSP and the copy are pinned to it. */
  readonly downloadApiUrl: string;
  /** The upload endpoint, stated likewise. */
  readonly uploadApiUrl: string;
  /** The final results report: switched off. */
  readonly logAimApiUrl: null;
  /** The per-measurement log: switched off (it is off by default; stated so a future default cannot turn it on). */
  readonly logMeasurementApiUrl: null;
  /** No cookies on the measurement requests (the engine's default, stated). */
  readonly includeCredentials: false;
  /** The plan, as a fresh mutable array (the engine's type wants one). */
  readonly measurements: PlanStep[];
}

/**
 * The engine options this page uses, built fresh for each run (the engine keeps a reference to the array).
 * @returns the options for `new SpeedTest(...)`
 */
export function engineOptions(): EngineOptions {
  // Everything that can make the engine reach a host other than SPEED_HOST is set or left out here.
  return {
    // Explicit Start only.
    autoStart: false,
    // The documented download endpoint.
    downloadApiUrl: DOWNLOAD_URL,
    // The documented upload endpoint.
    uploadApiUrl: UPLOAD_URL,
    // Results logging off ("Set to `null` to disable").
    logAimApiUrl: null,
    // Per-measurement logging off.
    logMeasurementApiUrl: null,
    // No credentials.
    includeCredentials: false,
    // The plan without packet loss, copied so the engine cannot alter the frozen constant.
    measurements: PLAN.map((s) => ({ ...s })),
  };
}

// ----------------------------------------------------------------------------
// What the plan can transfer at most, and the progress line
// ----------------------------------------------------------------------------

/** The plan in numbers, for the pre-flight panel. */
export interface PlanTotals {
  /** How many steps. */
  steps: number;
  /** Empty requests in the idle latency steps (loaded-latency requests come on top, one every 400 ms of transfer). */
  latencyRequests: number;
  /** Download steps. */
  downloadSteps: number;
  /** Download requests if no size is skipped. */
  downloadRequests: number;
  /** Bytes downloaded if no size is skipped: the most the plan can download. */
  downloadBytesMax: number;
  /** The smallest download size, in bytes. */
  downloadSizeMin: number;
  /** The largest download size, in bytes. */
  downloadSizeMax: number;
  /** Upload steps. */
  uploadSteps: number;
  /** Upload requests if no size is skipped. */
  uploadRequests: number;
  /** Bytes uploaded if no size is skipped: the most the plan can upload. */
  uploadBytesMax: number;
  /** The smallest upload size, in bytes. */
  uploadSizeMin: number;
  /** The largest upload size, in bytes. */
  uploadSizeMax: number;
}

/**
 * Add up a plan.
 * @param plan the steps (PLAN on the page; other lists in the vectors)
 * @returns the totals
 */
export function planTotals(plan: readonly PlanStep[]): PlanTotals {
  // Start from zero; the minimums start at +Infinity so the first size sets them.
  const t: PlanTotals = {
    // Counted below.
    steps: plan.length,
    // Summed below.
    latencyRequests: 0,
    // Counted below.
    downloadSteps: 0,
    // Summed below.
    downloadRequests: 0,
    // Summed below.
    downloadBytesMax: 0,
    // Lowered below.
    downloadSizeMin: Number.POSITIVE_INFINITY,
    // Raised below.
    downloadSizeMax: 0,
    // Counted below.
    uploadSteps: 0,
    // Summed below.
    uploadRequests: 0,
    // Summed below.
    uploadBytesMax: 0,
    // Lowered below.
    uploadSizeMin: Number.POSITIVE_INFINITY,
    // Raised below.
    uploadSizeMax: 0,
  };
  // One pass over the steps.
  for (const s of plan) {
    // Latency steps add empty requests only.
    if (s.type === "latency") {
      // Their count.
      t.latencyRequests += s.numPackets;
    } else if (s.type === "download") {
      // One more download step.
      t.downloadSteps += 1;
      // Its requests.
      t.downloadRequests += s.count;
      // Its bytes.
      t.downloadBytesMax += s.bytes * s.count;
      // The size range.
      t.downloadSizeMin = Math.min(t.downloadSizeMin, s.bytes);
      // The size range.
      t.downloadSizeMax = Math.max(t.downloadSizeMax, s.bytes);
    } else {
      // One more upload step.
      t.uploadSteps += 1;
      // Its requests.
      t.uploadRequests += s.count;
      // Its bytes.
      t.uploadBytesMax += s.bytes * s.count;
      // The size range.
      t.uploadSizeMin = Math.min(t.uploadSizeMin, s.bytes);
      // The size range.
      t.uploadSizeMax = Math.max(t.uploadSizeMax, s.bytes);
    }
  }
  // A plan without downloads has no minimum: report 0 rather than Infinity.
  if (!Number.isFinite(t.downloadSizeMin)) t.downloadSizeMin = 0;
  // Likewise for uploads.
  if (!Number.isFinite(t.uploadSizeMin)) t.uploadSizeMin = 0;
  // Done.
  return t;
}

/** Where the run is: the engine's onPhaseChange gives the index of the step it starts. */
export interface PhaseInfo {
  /** 1-based step number. */
  index: number;
  /** Steps in the plan. */
  total: number;
  /** The step being run. */
  step: PlanStep;
  /** index / total, for the progress bar (a direction's skipped sizes make it jump, which the page says). */
  fraction: number;
}

/**
 * The progress line for a step.
 * @param plan the plan the engine was given
 * @param measurementId the engine's 0-based index of the step it starts
 * @returns the step and its position, or null for an index outside the plan
 */
export function phaseInfo(plan: readonly PlanStep[], measurementId: number): PhaseInfo | null {
  // Only whole indexes inside the plan.
  if (!Number.isInteger(measurementId) || measurementId < 0 || measurementId >= plan.length) return null;
  // 1-based for people.
  const index = measurementId + 1;
  // The step, its position and the fraction done once it starts.
  return { index, total: plan.length, step: plan[measurementId], fraction: index / plan.length };
}

// ----------------------------------------------------------------------------
// Formatting: SI prefixes (NIST, Metric (SI) prefixes, read 2026-10-26 and 2026-10-27: kilo
// 10^3, mega 10^6, giga 10^9, tera 10^12), bit rates in bit/s as the engine
// reports them, three significant figures. The text uses "." as the decimal
// mark; localiseDecimal() swaps in the reader's.
// ----------------------------------------------------------------------------

/** A number ready to print: its digits and its unit. */
export interface Quantity {
  /** The digits, with "." as the decimal mark. */
  value: string;
  /** The unit symbol. */
  unit: string;
}

/**
 * Round half away from zero to `digits` decimals and print exactly that many.
 * @param x a finite, non-negative number
 * @param digits decimals to keep (0, 1 or 2 here)
 * @returns the digits
 */
export function fixed(x: number, digits: number): string {
  // The scale for this many decimals.
  const p = 10 ** digits;
  // Round on the scaled value (Math.round rounds .5 up, which for non-negative numbers is away from zero).
  const r = Math.round(x * p) / p;
  // Print with exactly that many decimals.
  return r.toFixed(digits);
}

/**
 * Three significant figures for a value in [0, 1000): 2 decimals below 10, 1 below 100, none from 100.
 * @param x the scaled value
 * @returns the digits (may read "1000" after rounding; callers rescale)
 */
export function threeFigures(x: number): string {
  // How many decimals keep three significant figures.
  const digits = x >= 100 ? 0 : x >= 10 ? 1 : 2;
  // Round and print; a value like 99.96 becomes "100.0", which is still three figures and five characters at most.
  const s = fixed(x, digits);
  // 9.996 rounds to "10.00" and 99.96 to "100.0": print those at the next width so the figure count stays three.
  if (digits === 2 && Number(s) >= 10) return fixed(x, 1);
  // Same at the next boundary.
  if (digits === 1 && Number(s) >= 100) return fixed(x, 0);
  // Otherwise as rounded.
  return s;
}

/** The bit-rate units, by power of 1000 (SI). */
const RATE_UNITS = ["bit/s", "kbit/s", "Mbit/s", "Gbit/s", "Tbit/s"] as const;

/** The byte units, by power of 1000 (SI; the binary prefixes are not used for transfer sizes here). */
const BYTE_UNITS = ["B", "kB", "MB", "GB", "TB"] as const;

/**
 * Scale a value by powers of 1000 into a unit list and print three significant figures.
 * @param x the value in the base unit
 * @param units the unit symbols, base first
 * @returns the quantity, or null for a value that is not a finite non-negative number
 */
function scaled(x: number, units: readonly string[]): Quantity | null {
  // Only finite, non-negative values print.
  if (typeof x !== "number" || !Number.isFinite(x) || x < 0) return null;
  // Zero prints as 0 in the base unit.
  if (x === 0) return { value: "0", unit: units[0] };
  // The power of 1000 for this value, kept inside the unit list.
  let e = Math.min(units.length - 1, Math.max(0, Math.floor(Math.log10(x) / 3)));
  // Floating point can put 1000 just under its own power (log10(1000) / 3 = 0.9999...): correct it.
  if (e < units.length - 1 && x / 1000 ** (e + 1) >= 1) e += 1;
  // The digits at that power.
  let digits = threeFigures(x / 1000 ** e);
  // Rounding can reach 1000 (999.6 -> "1000"): move up one unit when there is one.
  if (Number(digits) >= 1000 && e < units.length - 1) {
    // Next power.
    e += 1;
    // Re-print at it ("1.00").
    digits = threeFigures(x / 1000 ** e);
  }
  // The quantity.
  return { value: digits, unit: units[e] };
}

/**
 * A bit rate as the engine reports it (bits per second), in SI units.
 * @param bps bits per second
 * @returns e.g. { value: "94.3", unit: "Mbit/s" }, or null
 */
export function formatBitRate(bps: number): Quantity | null {
  // bit/s, kbit/s, Mbit/s, Gbit/s, Tbit/s.
  return scaled(bps, RATE_UNITS);
}

/**
 * A size in bytes, SI units, trailing zeros trimmed ("1 MB", "2.5 MB", "969 MB"): for the plan, not for measurements.
 * @param bytes the size
 * @returns e.g. { value: "100", unit: "kB" }, or null
 */
export function formatBytes(bytes: number): Quantity | null {
  // Three significant figures first.
  const q = scaled(bytes, BYTE_UNITS);
  // Nothing to trim on a refusal.
  if (!q) return q;
  // Trim "1.00" to "1" and "2.50" to "2.5" (only when there is a decimal mark).
  const value = q.value.includes(".") ? q.value.replace(/0+$/, "").replace(/\.$/, "") : q.value;
  // The trimmed quantity.
  return { value, unit: q.unit };
}

/**
 * A time in milliseconds as the engine reports latency and jitter: one decimal below 100 ms, whole from 100 ms.
 * @param ms milliseconds
 * @returns e.g. { value: "12.4", unit: "ms" }, or null
 */
export function formatMs(ms: number): Quantity | null {
  // Only finite, non-negative values print.
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return null;
  // A tenth of a millisecond is the finest step worth printing for a network round trip.
  const digits = ms >= 100 ? 0 : 1;
  // 99.96 rounds to "100.0": print it whole instead.
  const s = fixed(ms, digits);
  // Whole from 100.
  return { value: digits === 1 && Number(s) >= 100 ? fixed(ms, 0) : s, unit: "ms" };
}

/**
 * The run's duration (the engine's getTotalDurationMs, paused time excluded) in seconds with one decimal.
 * @param ms milliseconds
 * @returns e.g. { value: "42.1", unit: "s" }, or null
 */
export function formatSeconds(ms: number): Quantity | null {
  // Only finite, non-negative values print.
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return null;
  // Tenths of a second.
  return { value: fixed(ms / 1000, 1), unit: "s" };
}

/**
 * Swap the "." decimal mark for the reader's (the page reads it from Intl for its locale: "," for pt-BR).
 * @param digits a value from the formatters above
 * @param mark the decimal mark to use
 * @returns the digits with that mark
 */
export function localiseDecimal(digits: string, mark: string): string {
  // The formatters print at most one ".", and never a group separator.
  return digits.replace(".", mark);
}

/**
 * A quantity as one string, value and unit separated by a no-break space so they never wrap apart.
 * @param q the quantity
 * @param mark the reader's decimal mark
 * @returns e.g. "94,3 Mbit/s" for pt-BR
 */
export function quantityText(q: Quantity, mark: string): string {
  // U+00A0 between the number and its unit.
  return `${localiseDecimal(q.value, mark)} ${q.unit}`;
}

// ----------------------------------------------------------------------------
// Reading the engine's results into the rows the page prints
// ----------------------------------------------------------------------------

/** One bandwidth point as the engine returns it (getDownloadBandwidthPoints / getUploadBandwidthPoints). */
export interface BandwidthPointLike {
  /** Bits per second (1.14.2 and later discard a sample without a measurable duration). */
  bps?: number;
  /** Request duration in milliseconds, server time excluded. */
  duration: number;
}

/** The part of the engine's Results object this page reads (the real Results satisfies it). */
export interface ResultsLike {
  /** The flat summary: download, upload (bit/s), latency, jitter and the loaded variants (ms), totalDurationMs. */
  getSummary(): { [key: string]: number | boolean | null | undefined };
  /** Idle latency points (ms). */
  getUnloadedLatencyPoints(): number[];
  /** Download points. */
  getDownloadBandwidthPoints(): BandwidthPointLike[];
  /** Upload points. */
  getUploadBandwidthPoints(): BandwidthPointLike[];
  /** Latency points during download (ms). */
  getDownLoadedLatencyPoints(): number[];
  /** Latency points during upload (ms). */
  getUpLoadedLatencyPoints(): number[];
}

/** A copy of what the engine has measured so far, detached from the engine. */
export interface Snapshot {
  /** Download bandwidth, bit/s. */
  download?: number;
  /** Upload bandwidth, bit/s. */
  upload?: number;
  /** Idle latency, ms. */
  latency?: number;
  /** Idle jitter, ms (null below two points). */
  jitter?: number | null;
  /** Latency during download, ms. */
  downLoadedLatency?: number;
  /** Jitter during download, ms. */
  downLoadedJitter?: number | null;
  /** Latency during upload, ms. */
  upLoadedLatency?: number;
  /** Jitter during upload, ms. */
  upLoadedJitter?: number | null;
  /** The run's duration, paused time excluded (only once the engine has finished). */
  totalDurationMs?: number;
  /** How many points stand behind each value. */
  counts: {
    /** Idle latency points. */
    latency: number;
    /** Download points that count toward bandwidth (duration >= 10 ms, a rate). */
    download: number;
    /** Upload points that count toward bandwidth. */
    upload: number;
    /** Latency points during download. */
    downLoaded: number;
    /** Latency points during upload. */
    upLoaded: number;
  };
}

/**
 * A number from the summary, or undefined.
 * @param v a summary value
 * @returns the number when it is a finite number
 */
function num(v: number | boolean | null | undefined): number | undefined {
  // Only finite numbers.
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * A jitter value from the summary: a number, null (fewer than two points) or undefined (not measured).
 * @param v a summary value
 * @returns the jitter
 */
function jitterOf(v: number | boolean | null | undefined): number | null | undefined {
  // The engine reports null below two points.
  if (v === null) return null;
  // Otherwise a number or nothing.
  return num(v);
}

/**
 * How many bandwidth points count toward the engine's bandwidth value (README: "longer than the
 * bandwidthMinRequestDuration threshold"; source: duration >= the threshold, and a rate present).
 * @param points the engine's points
 * @returns the count
 */
export function countingPoints(points: readonly BandwidthPointLike[]): number {
  // The engine's own filter.
  return points.filter((p) => p.duration >= ENGINE_DEFAULTS_USED.bandwidthMinRequestDuration && !!p.bps).length;
}

/**
 * Copy what the engine has measured so far.
 * @param r the engine's results
 * @returns a snapshot that no longer refers to the engine
 */
export function snapshotFrom(r: ResultsLike): Snapshot {
  // The engine's flat summary.
  const s = r.getSummary();
  // Copy the values that print, and count the points behind them.
  return {
    // Bit rates.
    download: num(s.download),
    // Bit rates.
    upload: num(s.upload),
    // Idle round trip.
    latency: num(s.latency),
    // Idle jitter.
    jitter: jitterOf(s.jitter),
    // Under download.
    downLoadedLatency: num(s.downLoadedLatency),
    // Under download.
    downLoadedJitter: jitterOf(s.downLoadedJitter),
    // Under upload.
    upLoadedLatency: num(s.upLoadedLatency),
    // Under upload.
    upLoadedJitter: jitterOf(s.upLoadedJitter),
    // Only once finished.
    totalDurationMs: num(s.totalDurationMs),
    // The points behind each value.
    counts: {
      // Idle latency.
      latency: r.getUnloadedLatencyPoints().length,
      // Downloads that count.
      download: countingPoints(r.getDownloadBandwidthPoints()),
      // Uploads that count.
      upload: countingPoints(r.getUploadBandwidthPoints()),
      // During download.
      downLoaded: r.getDownLoadedLatencyPoints().length,
      // During upload.
      upLoaded: r.getUpLoadedLatencyPoints().length,
    },
  };
}

/** The rows, in the order the page prints them; each key is also its message key. */
export const ROW_KEYS = [
  "download",
  "upload",
  "latency",
  "jitter",
  "downLoadedLatency",
  "downLoadedJitter",
  "upLoadedLatency",
  "upLoadedJitter",
] as const;

/** A row's key. */
export type RowKey = (typeof ROW_KEYS)[number];

/** One printed row. */
export interface Row {
  /** Which measurement. */
  key: RowKey;
  /** "value": printed; "none": nothing measured yet; "tooFew": a jitter with only one point. */
  state: "value" | "none" | "tooFew";
  /** The value, when state is "value". */
  quantity?: Quantity;
  /** How many points stand behind it. */
  count: number;
}

/**
 * The rows for a snapshot. A value prints only when points stand behind it: the engine's percentile of an empty set
 * is 0, which would otherwise print as a measured "0".
 * @param s the snapshot
 * @returns eight rows, in ROW_KEYS order
 */
export function summaryRows(s: Snapshot): Row[] {
  // A bit-rate row.
  const rate = (key: RowKey, v: number | undefined, count: number): Row => {
    // No counting point, or no positive value: nothing to print yet.
    if (count < 1 || v === undefined || v <= 0) return { key, state: "none", count };
    // The formatted rate (a finite positive number always formats).
    const q = formatBitRate(v);
    // Printed.
    return q ? { key, state: "value", quantity: q, count } : { key, state: "none", count };
  };
  // A latency row.
  const lat = (key: RowKey, v: number | undefined, count: number): Row => {
    // No point, no value.
    if (count < 1 || v === undefined) return { key, state: "none", count };
    // The formatted time.
    const q = formatMs(v);
    // Printed.
    return q ? { key, state: "value", quantity: q, count } : { key, state: "none", count };
  };
  // A jitter row: needs two points.
  const jit = (key: RowKey, v: number | null | undefined, count: number): Row => {
    // Nothing yet.
    if (count < 1) return { key, state: "none", count };
    // One point: jitter is a difference between consecutive points.
    if (count < 2 || v === null || v === undefined) return { key, state: "tooFew", count };
    // The formatted time.
    const q = formatMs(v);
    // Printed.
    return q ? { key, state: "value", quantity: q, count } : { key, state: "none", count };
  };
  // The eight rows.
  return [
    // Download bandwidth.
    rate("download", s.download, s.counts.download),
    // Upload bandwidth.
    rate("upload", s.upload, s.counts.upload),
    // Idle latency.
    lat("latency", s.latency, s.counts.latency),
    // Idle jitter.
    jit("jitter", s.jitter, s.counts.latency),
    // Latency during download.
    lat("downLoadedLatency", s.downLoadedLatency, s.counts.downLoaded),
    // Jitter during download.
    jit("downLoadedJitter", s.downLoadedJitter, s.counts.downLoaded),
    // Latency during upload.
    lat("upLoadedLatency", s.upLoadedLatency, s.counts.upLoaded),
    // Jitter during upload.
    jit("upLoadedJitter", s.upLoadedJitter, s.counts.upLoaded),
  ];
}

// ----------------------------------------------------------------------------
// Failures
// ----------------------------------------------------------------------------

/**
 * What stopped a run, as the page explains it:
 *   "load": the engine's code (a separate file from this site) could not be loaded; nothing was sent;
 *   "rateLimited": the service answered 429 and the engine gave up after its three retries;
 *   "http": any other non-2xx status;
 *   "network": no status at all (network failure, a block on the way, a CORS or CSP refusal).
 */
export type FailureKind = "load" | "rateLimited" | "http" | "network";

/**
 * Sort an engine error. The engine calls onError(message, status) with the HTTP status when there was one
 * (dist/speedtest.js: 429 is retried three times, honouring Retry-After, before it is reported).
 * @param status the status the engine passed, if any
 * @returns the kind
 */
export function classifyFailure(status: number | undefined): FailureKind {
  // No status: the request never produced an answer the page could read.
  if (typeof status !== "number" || !Number.isInteger(status)) return "network";
  // The service asked for a pause and the engine's retries ran out.
  if (status === 429) return "rateLimited";
  // Anything else with a status.
  return "http";
}
