// ============================================================================
// src/lib/tools/zdx-score-factor-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE ZDX SCORE FACTOR EXPLAINER ENGINE.
//
// Paste the metrics ZDX exposes and read back what each one is, which probe
// family measures it, and how the documented score semantics apply - with
// the program's honesty rule enforced in code: Zscaler does NOT publish the
// exact composite scoring formula, so this tool computes nothing it cannot
// ground. It classifies a given score against the documented Poor band,
// explains each metric's documented meaning and probe family, renders the
// web-versus-path diagnostic reading, and states the calibrations (5-minute
// probes, lowest-of-the-hour, group averaging of per-user worsts, ~20-minute
// telemetry delay, ~2% API/UI aggregate variance). No invented thresholds,
// no invented weights - the same no-invention rule as the F5 thread
// calculator's rounding clause. (Facts live-verified 2026-07-21 against the
// ZDX reference architecture and help portal; D-19 comments throughout.)
//
// Grammar (one metric per line):  <metric> = <value>
// Metrics: score (1-100), pft | dns | srt (milliseconds),
//          availability (percent 0-100), path-latency (ms), path-loss (%).
// Lines starting with # are comments.
// ============================================================================

/** The metric keys the teaching grammar accepts. */
export type MetricKey =
  | "score"
  | "pft"
  | "dns"
  | "srt"
  | "availability"
  | "path-latency"
  | "path-loss";

/** Which probe family owns a metric (score is the composite, owned by neither). */
export type ProbeFamily = "web" | "cloudpath" | "composite";

export interface MetricReading {
  key: MetricKey;
  value: number;
  family: ProbeFamily;
  /** Documented explanation lines for this metric at this value. */
  lines: string[];
}

export interface ExplainResult {
  readings: MetricReading[];
  /** Present when both probe families appear: the diagnostic split. */
  diagnostic: string[];
  /** The documented score semantics + honesty calibrations, always emitted. */
  notes: string[];
}

const METRIC_FAMILY: Record<MetricKey, ProbeFamily> = {
  score: "composite",
  pft: "web",
  dns: "web",
  srt: "web",
  availability: "web",
  "path-latency": "cloudpath",
  "path-loss": "cloudpath",
};

/** Parse "<metric> = <value>" lines; helpful line-anchored errors. */
export function parseMetrics(text: string): Array<{ key: MetricKey; value: number }> {
  const out: Array<{ key: MetricKey; value: number }> = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    const t = line.trim();
    const where = `Line ${i + 1}`;
    if (t === "" || t.startsWith("#")) return;
    const m = t.match(/^([a-z-]+)\s*=\s*(-?[0-9]+(?:\.[0-9]+)?)$/i);
    if (!m)
      throw new Error(`${where}: expected "<metric> = <number>", e.g. "pft = 850" or "score = 28".`);
    const key = m[1].toLowerCase() as MetricKey;
    if (!(key in METRIC_FAMILY))
      throw new Error(
        `${where}: unknown metric "${m[1]}". Known: score, pft, dns, srt, availability, path-latency, path-loss.`,
      );
    if (seen.has(key)) throw new Error(`${where}: metric "${key}" appears twice - one line per metric.`);
    seen.add(key);
    const value = Number(m[2]);
    // -- Documented bounds only: the score is a 1-100 value; availability and
    //    loss are percentages. Time metrics just need to be non-negative.
    if (key === "score" && (value < 1 || value > 100))
      throw new Error(`${where}: the ZDX score is a 1-100 value (got ${value}).`);
    if ((key === "availability" || key === "path-loss") && (value < 0 || value > 100))
      throw new Error(`${where}: ${key} is a percentage from 0 to 100 (got ${value}).`);
    if (value < 0) throw new Error(`${where}: ${key} cannot be negative (got ${value}).`);
    out.push({ key, value });
  });

  if (out.length === 0)
    throw new Error('Paste at least one metric line, e.g. "score = 28" or "pft = 850".');
  return out;
}

/** Explain one metric - documented meanings only, no invented thresholds. */
function explainOne(key: MetricKey, value: number): MetricReading {
  const family = METRIC_FAMILY[key];
  const lines: string[] = [];

  if (key === "score") {
    if (value <= 33) {
      lines.push(
        `A score of ${value} sits in the documented Poor band (0-33) - the range where the dashboard automatically runs root-cause analysis on the worst recent sample.`,
      );
    } else {
      lines.push(
        `A score of ${value} sits above the documented Poor band (0-33). Zscaler's public documentation pins the Poor range precisely; this tool classifies against what is documented and does not invent finer band edges.`,
      );
    }
    lines.push(
      "Remember the pessimism: an hourly score is the LOWEST score observed during the hour, and group scores average each member user's lowest over the timeframe.",
    );
  } else if (key === "pft") {
    lines.push(
      `Page Fetch Time of ${value} ms - a Web Probe metric. By documented design the probe requests only the top-level page document, not every embedded asset: a probe, not a full page replay.`,
    );
  } else if (key === "dns") {
    lines.push(
      `DNS Time of ${value} ms - a Web Probe metric: how long name resolution took. Sustained elevation here is a resolver conversation before it is an application one.`,
    );
  } else if (key === "srt") {
    lines.push(
      `Server Response Time of ${value} ms - a Web Probe metric: the time to first byte. Elevation here with a clean network path points at the application side.`,
    );
  } else if (key === "availability") {
    lines.push(
      `Availability of ${value}% - a Web Probe metric: whether the application answered its probes at all.`,
    );
  } else if (key === "path-latency") {
    lines.push(
      `Path latency of ${value} ms - a CloudPath metric: the network path measured hop by hop, the traceroute instinct industrialized.`,
    );
  } else {
    lines.push(
      `Path loss of ${value}% - a CloudPath metric: packet loss along the measured path; loss localized to a specific hop is a network conversation with a street address.`,
    );
  }

  // -- The no-invented-thresholds clause, per metric: good/bad lines for raw
  //    metrics are alert-rule choices the administrator defines, not
  //    published constants - so this tool refuses to grade them.
  if (key !== "score") {
    lines.push(
      "No published threshold makes this value good or bad by itself: ZDX alert criteria are administrator-defined per rule, so this tool explains the metric and declines to grade it.",
    );
  }

  return { key, value, family, lines };
}

/** Run the explainer over the pasted metric list. */
export function run(text: string): ExplainResult {
  const metrics = parseMetrics(text);
  const readings = metrics.map((m) => explainOne(m.key, m.value));

  const hasWeb = readings.some((r) => r.family === "web");
  const hasPath = readings.some((r) => r.family === "cloudpath");
  const diagnostic: string[] = [];
  if (hasWeb && hasPath) {
    diagnostic.push(
      "The two probe families split the diagnosis: bad web metrics over a clean path point at the application; a bad path indicts the network. Read them against each other before blaming either.",
    );
  }

  const notes: string[] = [
    "Probing cadence: probes run every five minutes for most plans, against every defined application.",
    "The composite formula that turns raw metrics into the 1-100 score is NOT published. This tool therefore computes no score from metrics - it explains factors and documented semantics, and says so (the program's no-invention rule).",
    "Timing calibrations: telemetry reporting carries an estimated delay of around twenty minutes, and API-retrieved aggregates can differ from the dashboard by a small margin because approximate functions are used for performance.",
  ];

  return { readings, diagnostic, notes };
}
