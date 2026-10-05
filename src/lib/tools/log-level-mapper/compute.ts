// ============================================================================
// src/lib/tools/log-level-mapper/compute.ts
// ----------------------------------------------------------------------------
// THE LOG LEVEL MAPPER (PRIME, 2026-10-05 02:47: "log level codes"). Every
// logging system has a ladder, and no two ladders agree: syslog counts 0 to 7
// with 0 the worst; Python counts 10 to 50 with 50 the worst; Log4j counts 100
// to 600 with 100 the worst; Java's java.util.logging runs 300 to 1000; .NET
// and Windows count up from Trace or down from Critical; the Linux kernel
// reuses syslog's numbers as strings; Cisco IOS and Junos name syslog's
// severities their own way; and OpenTelemetry's SeverityNumber (1 to 24) was
// designed to hold all of them. Pick a level in one system and read its
// nearest equivalent in every other, with the caveat where the mapping is
// not one-to-one. The bridge between systems is OpenTelemetry's SeverityNumber,
// the one scale defined to map the others; each ladder is placed on it by the
// mapping its own documentation or OpenTelemetry's appendix states, and the
// nearest rung in every other ladder is read off that scale. Pure, local,
// deterministic.
//
// FACTS, with their sources (all read 2026-10-05):
//   syslog: RFC 5424 §6.2.1 Table 2, severities 0 Emergency to 7 Debug.
//   Linux kernel: "Message logging with printk", kernel.org core-api: KERN_EMERG
//   "0" to KERN_DEBUG "7", KERN_DEFAULT "", KERN_CONT "c".
//   Cisco IOS: Configuration Fundamentals Command Reference, logging buffered:
//   0 emergencies LOG_EMERG ... 7 debugging LOG_DEBUG; "The default logging
//   level varies by platform but is generally 7".
//   Junos: "syslog facilities and severity levels" (juniper.net, published
//   2013-07-08): emergency, alert, critical, error, warning, notice, info in
//   order, plus any and none; the page gives no numbers.
//   Windows Event Log: Event manifest schema, LevelType (learn.microsoft.com):
//   win:Critical 1, win:Error 2, win:Warning 3, win:Informational 4,
//   win:Verbose 5; custom levels 16 to 255; "Higher numbers imply that you
//   receive lower levels as well". win:LogAlways 0 per OpenTelemetry's ETW
//   table.
//   .NET: Microsoft.Extensions.Logging.LogLevel (learn.microsoft.com): Trace 0,
//   Debug 1, Information 2, Warning 3, Error 4, Critical 5, None 6.
//   Python: logging, Python 3.14 docs, "Logging Levels": NOTSET 0, DEBUG 10,
//   INFO 20, WARNING 30, ERROR 40, CRITICAL 50; the placement on the
//   SeverityNumber scale is the OpenTelemetry Python SDK's own table
//   (_STD_TO_OTEL in opentelemetry-sdk, main branch, read 2026-10-05: 10 DEBUG,
//   20 INFO, 30 WARN, 40 ERROR, 50 FATAL).
//   Java: java.util.logging.Level, Java SE 21 API: SEVERE 1000, WARNING 900,
//   INFO 800, CONFIG 700, FINE 500, FINER 400, FINEST 300, OFF/ALL the
//   integer extremes; "Enabling logging at a given level also enables logging
//   at all higher levels".
//   Log4j 2: "Levels", Apache Log4j 2.x manual: OFF 0, FATAL 100, ERROR 200,
//   WARN 300, INFO 400, DEBUG 500, TRACE 600, ALL Integer.MAX_VALUE; "WARN is
//   less severe than ERROR".
//   OpenTelemetry: Logs Data Model, SeverityNumber: 1-4 TRACE, 5-8 DEBUG, 9-12
//   INFO, 13-16 WARN, 17-20 ERROR, 21-24 FATAL, 0 unspecified; "Smaller
//   numerical values correspond to less severe events"; Data Model Appendix B,
//   the example mapping (syslog Debug 7 = DEBUG 5, Informational 6 = INFO 9,
//   Notice 5 = INFO2 10, Warning 4 = WARN 13, Error 3 = ERROR 17, Critical 2 =
//   ERROR2 18, Alert 1 = ERROR3 19, Emergency 0 = FATAL 21; Windows Verbose =
//   DEBUG 5, Information = INFO 9, Warning = WARN 13, Error = ERROR 17,
//   Critical = ERROR2 18; Log4j TRACE = 1, DEBUG = 5, INFO = 9, WARN = 13,
//   ERROR = 17, FATAL = 21; java.util.logging FINEST = 1, FINER = 5, FINE = 6,
//   CONFIG = 7, INFO = 9, WARNING = 13, SEVERE = 17; .NET Trace = 1, Debug = 5,
//   Information = 9, Warning = 13, Error = 17, Critical = 21).
// ============================================================================

/** One system's ladder. */
export interface Ladder {
  /** The system key. */
  key: string;
  /** The display name. */
  name: string;
  /** Whether the system's own numbers grow with severity ("up"), shrink with it ("down"), or are absent ("none"). */
  direction: "up" | "down" | "none";
  /** The rungs, most severe first. */
  rungs: Rung[];
  /** A one-line caveat shown with the column, or null. */
  caveat: string | null;
  /** The source id (the manifest lists it in full). */
  source: string;
}

/** One rung of a ladder. */
export interface Rung {
  /** The level's name as the system spells it. */
  name: string;
  /** The system's own number, or null where it has none (Junos). */
  value: number | string | null;
  /** The system's own description, or null. */
  description: string | null;
  /** Where the rung sits on OpenTelemetry's SeverityNumber scale (1 to 24; 0 for a sentinel such as OFF or NOTSET). */
  otel: number;
  /** True for a sentinel that is not a message level (OFF, ALL, NOTSET, None, LogAlways, any, none). */
  sentinel?: boolean;
}

/** The input: a level in a system. */
export interface LogLevelInput {
  /** The system key (see LADDERS). */
  system: string;
  /** The level, by name or by number, as typed. */
  level: string;
}

/** One system's nearest equivalent to the chosen rung. */
export interface Equivalent {
  /** The system. */
  system: string;
  /** The system's display name. */
  name: string;
  /** The rung chosen in that system. */
  rung: Rung;
  /** Exact on the SeverityNumber scale, or the nearest rung (with the distance in SeverityNumber steps). */
  exact: boolean;
  /** The distance, 0 when exact. */
  distance: number;
  /** Other rungs of that system that share the same nearest distance (a tie: the mapping is not one-to-one). */
  ties: Rung[];
}

/** The result. */
export interface LogLevelResult {
  /** The chosen system and rung, or null when the level was not recognised. */
  chosen: { system: string; name: string; rung: Rung } | null;
  /** The SeverityNumber of the chosen rung and its OpenTelemetry range name. */
  otel: { number: number; range: string; short: string } | null;
  /** The equivalents in every other system, in LADDERS order. */
  equivalents: Equivalent[];
  /** The ladders, for the table. */
  ladders: Ladder[];
  /** Why nothing was chosen: unknown-system, unknown-level. */
  error: string | null;
}

/** OpenTelemetry's ranges and short names. */
export const OTEL_RANGES: { from: number; to: number; name: string }[] = [
  { from: 1, to: 4, name: "TRACE" }, { from: 5, to: 8, name: "DEBUG" }, { from: 9, to: 12, name: "INFO" },
  { from: 13, to: 16, name: "WARN" }, { from: 17, to: 20, name: "ERROR" }, { from: 21, to: 24, name: "FATAL" },
];

/** The short name of a SeverityNumber (TRACE, TRACE2, ... FATAL4), UNSPECIFIED for 0. */
export function otelShort(n: number): string {
  // Zero is unspecified.
  if (n === 0) return "UNSPECIFIED";
  // The range and the position within it.
  const r = OTEL_RANGES.find((x) => n >= x.from && n <= x.to);
  if (!r) return String(n);
  const pos = n - r.from + 1;
  return pos === 1 ? r.name : `${r.name}${pos}`;
}

/** The range name of a SeverityNumber. */
export function otelRange(n: number): string {
  // Zero is unspecified.
  if (n === 0) return "UNSPECIFIED";
  const r = OTEL_RANGES.find((x) => n >= x.from && n <= x.to);
  return r ? r.name : String(n);
}

/** The ladders, in the order the table shows them. */
export const LADDERS: readonly Ladder[] = Object.freeze([
  {
    key: "syslog", name: "syslog (RFC 5424)", direction: "down", source: "rfc5424",
    caveat: "0 is the most severe; eight levels, three of them (Emergency, Alert, Critical) above most other ladders' top.",
    rungs: [
      { name: "Emergency", value: 0, description: "system is unusable", otel: 21 },
      { name: "Alert", value: 1, description: "action must be taken immediately", otel: 19 },
      { name: "Critical", value: 2, description: "critical conditions", otel: 18 },
      { name: "Error", value: 3, description: "error conditions", otel: 17 },
      { name: "Warning", value: 4, description: "warning conditions", otel: 13 },
      { name: "Notice", value: 5, description: "normal but significant condition", otel: 10 },
      { name: "Informational", value: 6, description: "informational messages", otel: 9 },
      { name: "Debug", value: 7, description: "debug-level messages", otel: 5 },
    ],
  },
  {
    key: "printk", name: "Linux kernel (printk)", direction: "down", source: "printk",
    caveat: "Eight levels named and numbered like syslog's severities, written as strings in the message prefix; placed on the scale by that correspondence of name and number. KERN_DEFAULT (no prefix) and KERN_CONT (\"c\") are not levels.",
    rungs: [
      { name: "KERN_EMERG", value: "0", description: "pr_emerg()", otel: 21 },
      { name: "KERN_ALERT", value: "1", description: "pr_alert()", otel: 19 },
      { name: "KERN_CRIT", value: "2", description: "pr_crit()", otel: 18 },
      { name: "KERN_ERR", value: "3", description: "pr_err()", otel: 17 },
      { name: "KERN_WARNING", value: "4", description: "pr_warn()", otel: 13 },
      { name: "KERN_NOTICE", value: "5", description: "pr_notice()", otel: 10 },
      { name: "KERN_INFO", value: "6", description: "pr_info()", otel: 9 },
      { name: "KERN_DEBUG", value: "7", description: "pr_debug() and pr_devel()", otel: 5 },
    ],
  },
  {
    key: "cisco-ios", name: "Cisco IOS (logging)", direction: "down", source: "cisco-ios",
    caveat: "Syslog's numbers with Cisco's keywords; the command reference maps each to its LOG_* constant; the default buffered level is generally 7.",
    rungs: [
      { name: "emergencies", value: 0, description: "LOG_EMERG", otel: 21 },
      { name: "alerts", value: 1, description: "LOG_ALERT", otel: 19 },
      { name: "critical", value: 2, description: "LOG_CRIT", otel: 18 },
      { name: "errors", value: 3, description: "LOG_ERR", otel: 17 },
      { name: "warnings", value: 4, description: "LOG_WARNING", otel: 13 },
      { name: "notifications", value: 5, description: "LOG_NOTICE", otel: 10 },
      { name: "informational", value: 6, description: "LOG_INFO", otel: 9 },
      { name: "debugging", value: 7, description: "LOG_DEBUG", otel: 5 },
    ],
  },
  {
    key: "junos", name: "Junos (system syslog)", direction: "none", source: "junos",
    caveat: "Names only on Juniper's page, in syslog's order from emergency to info; \"any\" selects every level and \"none\" disables logging; there is no named debug rung.",
    rungs: [
      { name: "emergency", value: null, description: null, otel: 21 },
      { name: "alert", value: null, description: null, otel: 19 },
      { name: "critical", value: null, description: null, otel: 18 },
      { name: "error", value: null, description: null, otel: 17 },
      { name: "warning", value: null, description: null, otel: 13 },
      { name: "notice", value: null, description: null, otel: 10 },
      { name: "info", value: null, description: null, otel: 9 },
      { name: "any", value: null, description: "all severity levels", otel: 0, sentinel: true },
      { name: "none", value: null, description: "disables logging of the facility", otel: 0, sentinel: true },
    ],
  },
  {
    key: "windows", name: "Windows Event Log", direction: "down", source: "winmeta",
    caveat: "1 is the most severe; 0 (LogAlways) is not a level; custom levels 16 to 255 are provider-defined.",
    rungs: [
      { name: "Critical", value: 1, description: "an abnormal exit or termination event", otel: 18 },
      { name: "Error", value: 2, description: "a severe error event", otel: 17 },
      { name: "Warning", value: 3, description: "a warning event such as an allocation failure", otel: 13 },
      { name: "Informational", value: 4, description: "a non-error event such as an entry or exit event", otel: 9 },
      { name: "Verbose", value: 5, description: "a detailed trace event", otel: 5 },
      { name: "LogAlways", value: 0, description: "always logged; not a severity", otel: 0, sentinel: true },
    ],
  },
  {
    key: "dotnet", name: ".NET (Microsoft.Extensions.Logging)", direction: "up", source: "dotnet",
    caveat: "0 is the least severe; None (6) is a filter value, not a message level.",
    rungs: [
      { name: "Critical", value: 5, description: "an unrecoverable application or system crash, or a catastrophic failure that requires immediate attention", otel: 21 },
      { name: "Error", value: 4, description: "the current flow of execution is stopped due to a failure", otel: 17 },
      { name: "Warning", value: 3, description: "an abnormal or unexpected event in the application flow", otel: 13 },
      { name: "Information", value: 2, description: "the general flow of the application", otel: 9 },
      { name: "Debug", value: 1, description: "interactive investigation during development", otel: 5 },
      { name: "Trace", value: 0, description: "the most detailed messages; may contain sensitive application data", otel: 1 },
      { name: "None", value: 6, description: "not used for writing log messages", otel: 0, sentinel: true },
    ],
  },
  {
    key: "python", name: "Python (logging)", direction: "up", source: "python",
    caveat: "Numbers grow with severity in steps of ten; NOTSET (0) means \"inherit\"; any integer is a legal level, and the OpenTelemetry SDK for Python maps the tens exactly (10 DEBUG, 20 INFO, 30 WARN, 40 ERROR, 50 FATAL) and the values between to the range's second, third and fourth steps.",
    rungs: [
      { name: "CRITICAL", value: 50, description: "a serious error, indicating that the program itself may be unable to continue running", otel: 21 },
      { name: "ERROR", value: 40, description: "the software has not been able to perform some function", otel: 17 },
      { name: "WARNING", value: 30, description: "something unexpected happened, or a problem might occur in the near future", otel: 13 },
      { name: "INFO", value: 20, description: "confirmation that things are working as expected", otel: 9 },
      { name: "DEBUG", value: 10, description: "detailed information, typically only of interest to a developer", otel: 5 },
      { name: "NOTSET", value: 0, description: "ancestor loggers are consulted to determine the effective level", otel: 0, sentinel: true },
    ],
  },
  {
    key: "jul", name: "Java (java.util.logging)", direction: "up", source: "jul",
    caveat: "Numbers grow with severity; CONFIG sits between INFO and FINE; OFF and ALL are the integer extremes, not levels.",
    rungs: [
      { name: "SEVERE", value: 1000, description: null, otel: 17 },
      { name: "WARNING", value: 900, description: null, otel: 13 },
      { name: "INFO", value: 800, description: null, otel: 9 },
      { name: "CONFIG", value: 700, description: "static configuration messages", otel: 7 },
      { name: "FINE", value: 500, description: null, otel: 6 },
      { name: "FINER", value: 400, description: null, otel: 5 },
      { name: "FINEST", value: 300, description: null, otel: 1 },
      { name: "OFF", value: "Integer.MAX_VALUE", description: "turns logging off", otel: 0, sentinel: true },
      { name: "ALL", value: "Integer.MIN_VALUE", description: "logs every message", otel: 0, sentinel: true },
    ],
  },
  {
    key: "log4j2", name: "Log4j 2", direction: "down", source: "log4j2",
    caveat: "A lower priority number is more severe (FATAL 100, TRACE 600); OFF (0) and ALL (Integer.MAX_VALUE) are filters, not levels.",
    rungs: [
      { name: "FATAL", value: 100, description: null, otel: 21 },
      { name: "ERROR", value: 200, description: null, otel: 17 },
      { name: "WARN", value: 300, description: null, otel: 13 },
      { name: "INFO", value: 400, description: null, otel: 9 },
      { name: "DEBUG", value: 500, description: null, otel: 5 },
      { name: "TRACE", value: 600, description: null, otel: 1 },
      { name: "OFF", value: 0, description: "no logging", otel: 0, sentinel: true },
      { name: "ALL", value: "Integer.MAX_VALUE", description: "every level", otel: 0, sentinel: true },
    ],
  },
  {
    key: "otel", name: "OpenTelemetry (SeverityNumber)", direction: "up", source: "otel",
    caveat: "The scale the others are placed on: 24 values in six ranges of four; 0 is unspecified.",
    rungs: [
      { name: "FATAL", value: 21, description: "a fatal error such as an application or system crash (21 to 24)", otel: 21 },
      { name: "ERROR", value: 17, description: "something went wrong (17 to 20)", otel: 17 },
      { name: "WARN", value: 13, description: "not an error but likely more important than informational (13 to 16)", otel: 13 },
      { name: "INFO", value: 9, description: "something happened (9 to 12)", otel: 9 },
      { name: "DEBUG", value: 5, description: "a debugging event (5 to 8)", otel: 5 },
      { name: "TRACE", value: 1, description: "fine-grained debugging, typically disabled by default (1 to 4)", otel: 1 },
      { name: "UNSPECIFIED", value: 0, description: "an unspecified value", otel: 0, sentinel: true },
    ],
  },
]);

/** Find a rung by name or number within a ladder (case-insensitive; a few aliases: Python's FATAL/WARN, syslog's emerg/crit/err/warn/info). */
export function findRung(ladder: Ladder, level: string): Rung | null {
  // Normalised.
  const key = level.trim().toLowerCase();
  if (!key) return null;
  // By number, when the ladder has numbers.
  if (/^-?\d+$/.test(key)) {
    const n = Number(key);
    const byValue = ladder.rungs.find((r) => typeof r.value === "number" && r.value === n);
    if (byValue) return byValue;
    // OpenTelemetry: any number 1 to 24 maps into its range's rung.
    if (ladder.key === "otel" && n >= 1 && n <= 24) { const r = OTEL_RANGES.find((x) => n >= x.from && n <= x.to)!; return { name: otelShort(n), value: n, description: `${r.name} range (${r.from} to ${r.to})`, otel: n }; }
    return null;
  }
  // By name.
  const byName = ladder.rungs.find((r) => r.name.toLowerCase() === key || r.name.toLowerCase().replace(/^kern_/, "") === key || r.name.toLowerCase().replace(/^win:/, "") === key);
  if (byName) return byName;
  // Aliases per ladder.
  const aliases: Record<string, Record<string, string>> = {
    syslog: { emerg: "Emergency", panic: "Emergency", crit: "Critical", err: "Error", error: "Error", warn: "Warning", info: "Informational", informational: "Informational", notice: "Notice", debug: "Debug", alert: "Alert" },
    python: { fatal: "CRITICAL", warn: "WARNING" },
    windows: { information: "Informational", info: "Informational" },
    printk: { emerg: "KERN_EMERG", alert: "KERN_ALERT", crit: "KERN_CRIT", err: "KERN_ERR", warning: "KERN_WARNING", warn: "KERN_WARNING", notice: "KERN_NOTICE", info: "KERN_INFO", debug: "KERN_DEBUG" },
  };
  const target = aliases[ladder.key]?.[key];
  return target ? ladder.rungs.find((r) => r.name === target) ?? null : null;
}

/** The engine. */
export function run(input: LogLevelInput): LogLevelResult {
  // The ladders for the table.
  const ladders = [...LADDERS];
  // The system.
  const ladder = LADDERS.find((l) => l.key === (input.system ?? "").trim());
  if (!ladder) return { chosen: null, otel: null, equivalents: [], ladders, error: "unknown-system" };
  // The rung.
  const rung = findRung(ladder, input.level ?? "");
  if (!rung) return { chosen: null, otel: null, equivalents: [], ladders, error: "unknown-level" };
  // A sentinel has no place on the scale.
  if (rung.sentinel) return { chosen: { system: ladder.key, name: ladder.name, rung }, otel: { number: 0, range: "UNSPECIFIED", short: "UNSPECIFIED" }, equivalents: [], ladders, error: null };
  // The equivalents: in every other ladder, the rung(s) nearest on the scale (sentinels excluded).
  const equivalents: Equivalent[] = [];
  for (const other of LADDERS) {
    // Not the chosen system itself.
    if (other.key === ladder.key) continue;
    // The candidates.
    const candidates = other.rungs.filter((r) => !r.sentinel);
    // The smallest distance.
    const best = Math.min(...candidates.map((r) => Math.abs(r.otel - rung.otel)));
    // The rungs at that distance; when two tie, prefer the more severe one first in the list (the ladders are most-severe-first).
    const at = candidates.filter((r) => Math.abs(r.otel - rung.otel) === best);
    equivalents.push({ system: other.key, name: other.name, rung: at[0], exact: best === 0, distance: best, ties: at.slice(1) });
  }
  // Done.
  return { chosen: { system: ladder.key, name: ladder.name, rung }, otel: { number: rung.otel, range: otelRange(rung.otel), short: otelShort(rung.otel) }, equivalents, ladders, error: null };
}
