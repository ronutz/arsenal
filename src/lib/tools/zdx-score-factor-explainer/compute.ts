// ============================================================================
// src/lib/tools/zdx-score-factor-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE ZDX SCORE FACTOR EXPLAINER ENGINE.
//
// Paste the metrics ZDX exposes and read back what each one is, which probe
// family measures it, and how the documented score semantics apply - with
// the program's honesty rule enforced in code: Zscaler does NOT publish the
// exact composite scoring formula, so this tool computes nothing it cannot
// ground. It classifies a given score against the three documented bands
// (Good 66-100, Okay 34-65, Poor 0-33), explains each metric's documented
// meaning and probe family, renders the web-versus-path diagnostic reading,
// and states the calibrations (5-minute probes, lowest-of-the-hour, the two
// documented roll-up shapes, the three score types, ~20-minute telemetry
// delay, ~2% API/UI aggregate variance). No invented thresholds, no invented
// weights - the same no-invention rule as the F5 thread calculator's rounding
// clause. (Facts live-verified 2026-07-21 against the ZDX reference
// architecture and help portal; the 0-100 scale, the three bands, the roll-up
// rules, whole-number rounding and the score types re-read 2026-10-26 on
// help.zscaler.com/zdx/understanding-zdx-score; D-19 comments throughout.)
//
// Grammar (one metric per line):  <metric> = <value>
// Metrics: score (0-100, whole number), pft | dns | srt (milliseconds),
//          availability (percent 0-100), path-latency (ms), path-loss (%).
// Lines starting with # are comments.
//
// PAGE LANGUAGE (02/11/2026): every reading line, diagnostic, note and error is
// built as an EngineText (src/lib/tools/engine-text.ts): a stable id, the
// English as before, and its values. runLocalisable() returns them as such for
// the page (pack keys tools.zdx-score-factor-explainer.engine.<id>); run()
// returns plainText() of the same reading, and parseMetrics() throws the same
// errors with the same messages (each carrying its sentence), so the API, the
// share spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

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

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface MetricReading<S = string> {
  key: MetricKey;
  value: number;
  family: ProbeFamily;
  /** Documented explanation lines for this metric at this value. */
  /** Present when both probe families appear: the diagnostic split. */
  /** The documented score semantics + honesty calibrations, always emitted. */
  lines: S[]; // each a sentence
}
/** S is string in the API's reading and EngineText in the page's. */
export interface ExplainResult<S = string> {
  readings: MetricReading<S>[]; // each metric
  diagnostic: S[]; // each a sentence
  notes: S[]; // each a sentence
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
    const lineNo = String(i + 1); // the line number, for the messages
    if (t === "" || t.startsWith("#")) return;
    const m = t.match(/^([a-z-]+)\s*=\s*(-?[0-9]+(?:\.[0-9]+)?)$/i);
    if (!m)
      throw engineError(say("err.shape", `Line ${lineNo}: expected "<metric> = <number>", e.g. "pft = 850" or "score = 28".`, { line: lineNo })); // not metric = number
    const key = m[1].toLowerCase() as MetricKey;
    if (!(key in METRIC_FAMILY))
      throw engineError(say("err.unknown", // an unknown metric
        `Line ${lineNo}: unknown metric "${m[1]}". Known: score, pft, dns, srt, availability, path-latency, path-loss.`, { line: lineNo, metric: m[1] },
      ));
    if (seen.has(key)) throw engineError(say("err.twice", `Line ${lineNo}: metric "${key}" appears twice - one line per metric.`, { line: lineNo, key })); // repeated
    seen.add(key);
    const value = Number(m[2]);
    // -- Documented bounds only: the score is a 0-100 value; availability and
    //    loss are percentages. Time metrics just need to be non-negative.
    if (key === "score" && (value < 0 || value > 100))
      // The documented scale runs from 0 (lowest) to 100 (highest).
      throw engineError(say("err.scoreRange", `Line ${lineNo}: the ZDX score is a 0-100 value (got ${value}).`, { line: lineNo, value: String(value) })); // out of range
    if (key === "score" && !Number.isInteger(value))
      // Zscaler rounds every score to the nearest whole number, so a fraction is not a ZDX score.
      throw engineError(say("err.scoreWhole", `Line ${lineNo}: ZDX scores are whole numbers, because Zscaler rounds every score to the nearest whole number (got ${value}).`, { line: lineNo, value: String(value) })); // a fraction
    if ((key === "availability" || key === "path-loss") && (value < 0 || value > 100))
      throw engineError(say("err.percent", `Line ${lineNo}: ${key} is a percentage from 0 to 100 (got ${value}).`, { line: lineNo, key, value: String(value) })); // not a percentage
    if (value < 0) throw engineError(say("err.negative", `Line ${lineNo}: ${key} cannot be negative (got ${value}).`, { line: lineNo, key, value: String(value) })); // negative
    out.push({ key, value });
  });

  if (out.length === 0)
    throw engineError(say("err.empty", 'Paste at least one metric line, e.g. "score = 28" or "pft = 850".')); // nothing pasted
  return out;
}

/** Explain one metric - documented meanings only, no invented thresholds. */
function explainOne(key: MetricKey, value: number): MetricReading<EngineText> {
  const family = METRIC_FAMILY[key];
  const lines: EngineText[] = []; // each line with its id

  if (key === "score") {
    // The three published bands, edges inclusive as documented.
    if (value <= 33) {
      // Poor (0-33, red): the band with automatic root-cause analysis.
      lines.push(say("score.poor", // Poor
        `A score of ${value} sits in the documented Poor band (0-33, red) - the range where the dashboard automatically runs root-cause analysis on the worst recent sample.`, { value: String(value) },
      ));
    } else if (value <= 65) {
      // Okay (34-65, amber): acceptable, per the documentation.
      lines.push(say("score.okay", // Okay
        `A score of ${value} sits in the documented Okay band (34-65, amber): acceptable, but below the Good threshold.`, { value: String(value) },
      ));
    } else {
      // Good (66-100, green): above the acceptable threshold.
      lines.push(say("score.good", // Good
        `A score of ${value} sits in the documented Good band (66-100, green): above the acceptable threshold.`, { value: String(value) },
      ));
    }
    // The pessimism and roll-up rules every score reading rides on.
    lines.push(say("score.pessimism", // the lowest value wins
      "Remember the pessimism: an hourly value is the LOWEST five-minute value observed during the hour. An application's score averages each user's lowest value over the period; department, location, city and organisation scores average the lowest value of each time interval; a user's score is their lowest-scoring application.",
    ));
  } else if (key === "pft") {
    lines.push(say("metric.pft", // Page Fetch Time
      `Page Fetch Time of ${value} ms - a Web Probe metric. By documented design the probe requests only the top-level page document, not every embedded asset: a probe, not a full page replay.`, { value: String(value) },
    ));
  } else if (key === "dns") {
    lines.push(say("metric.dns", // DNS Time
      `DNS Time of ${value} ms - a Web Probe metric: how long name resolution took. Sustained elevation here is a resolver conversation before it is an application one.`, { value: String(value) },
    ));
  } else if (key === "srt") {
    lines.push(say("metric.srt", // Server Response Time
      `Server Response Time of ${value} ms - a Web Probe metric: the time to first byte. Elevation here with a clean network path points at the application side.`, { value: String(value) },
    ));
  } else if (key === "availability") {
    lines.push(say("metric.availability", // Availability
      `Availability of ${value}% - a Web Probe metric: whether the application answered its probes at all.`, { value: String(value) },
    ));
  } else if (key === "path-latency") {
    lines.push(say("metric.pathLatency", // path latency
      `Path latency of ${value} ms - a CloudPath metric: the network path measured hop by hop, the traceroute instinct industrialized.`, { value: String(value) },
    ));
  } else {
    lines.push(say("metric.pathLoss", // path loss
      `Path loss of ${value}% - a CloudPath metric: packet loss along the measured path; loss localized to a specific hop is a network conversation with a street address.`, { value: String(value) },
    ));
  }

  // -- The no-invented-thresholds clause, per metric: good/bad lines for raw
  //    metrics are alert-rule choices the administrator defines, not
  //    published constants - so this tool refuses to grade them.
  if (key !== "score") {
    lines.push(say("metric.noThreshold", // no published threshold
      "No published threshold makes this value good or bad by itself: ZDX alert criteria are administrator-defined per rule, so this tool explains the metric and declines to grade it.",
    ));
  }

  return { key, value, family, lines };
}

/** Run the explainer over the pasted metric list. */
export function run(text: string): ExplainResult {
  return plainText(runLocalisable(text)); // the same reading, sentences as their English (the API's and the vectors')
} // run

/** The page's reading: the same as run(), with every sentence an EngineText (id, English, values). */
export function runLocalisable(text: string): ExplainResult<EngineText> {
  const metrics = parseMetrics(text);
  const readings = metrics.map((m) => explainOne(m.key, m.value));

  const hasWeb = readings.some((r) => r.family === "web");
  const hasPath = readings.some((r) => r.family === "cloudpath");
  const diagnostic: EngineText[] = []; // the split diagnosis, when both families are present
  if (hasWeb && hasPath) {
    diagnostic.push(say("diag.split", // the two families
      "The two probe families split the diagnosis: bad web metrics over a clean path point at the application; a bad path indicts the network. Read them against each other before blaming either.",
    ));
  }

  const notes: EngineText[] = [
    say("note.cadence", "Probing cadence: probes run every five minutes for most plans, against every defined application."), // cadence
    say("note.formula", "The composite formula that turns raw metrics into the 0-100 score is NOT published. This tool therefore computes no score from metrics - it explains factors and documented semantics, and says so (the program's no-invention rule)."), // the unpublished formula
    // The three documented score types, which can disagree for one application.
    say("note.scoreType", "Score type matters: Zscaler documents a Synthetic Probe Score (Web and CloudPath probes), a RUM Score (Real User Monitoring in the browser) and a Combined Score. They use different configurations and metrics and can differ for the same application, so compare like with like."), // score types
    say("note.timing", "Timing calibrations: telemetry reporting carries an estimated delay of around twenty minutes, and API-retrieved aggregates can differ from the dashboard by a small margin because approximate functions are used for performance."), // timing
  ];

  return { readings, diagnostic, notes };
}
