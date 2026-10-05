// ============================================================================
// src/lib/tools/log-level-mapper/index.ts
// ----------------------------------------------------------------------------
// THE LOG LEVEL MAPPER: the self-describing {manifest, run, vectors} triple.
//
// A level in one logging system, read against every other through
// OpenTelemetry's SeverityNumber scale, with each system's own numbers, words
// and caveats. Pure, local, deterministic; the tables are the sources' own.
// ============================================================================

import { run as compute, type LogLevelInput, type LogLevelResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { LogLevelInput, LogLevelResult, Ladder, Rung, Equivalent } from "./compute";
// The ladders, the scale helpers and the rung lookup, for pages.
export { LADDERS, OTEL_RANGES, otelShort, otelRange, findRung } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Logging & SIEM formats",
  // The slug.
  toolSlug: "log-level-mapper",
  // Other names it answers to.
  canonicalAliases: ["log-levels", "severity-mapper", "log-severity", "severity-number"],
  // What pasted input it recognises: none by pattern (a level name is too short to detect); the example is a valid API body.
  inputDetectors: [
    { kind: "regex", priority: 0, pattern: "^\\s*(TRACE|DEBUG|INFO|WARN(ING)?|ERROR|CRITICAL|FATAL|SEVERE|FINE|FINER|FINEST|CONFIG|NOTICE|EMERG(ENCY)?|ALERT)\\s*$", example: "{\"system\":\"python\",\"level\":\"WARNING\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: a table lookup, nothing evaluated.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // The default for share links: a level name carries nothing private.
  shareSafetyDefault: "safe",
  // The Learn articles written for it.
  learnLinks: ["learn/log-levels-across-systems-one-ladder-many-rungs"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["syslog-pri-decoder", "syslog-message-parser", "http-status-code-explainer"],
  // Sources, each read live on its access date.
  sources: [
    { id: "rfc5424", label: "RFC 5424, The Syslog Protocol (March 2009), section 6.2.1 Table 2", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5424#section-6.2.1", access_date: "2026-10-05", scope: "the eight severities, 0 Emergency to 7 Debug, with their descriptions", status: "active" },
    { id: "printk", label: "Message logging with printk, The Linux Kernel documentation (core-api)", type: "documentation", url: "https://www.kernel.org/doc/html/latest/core-api/printk-basics.html", access_date: "2026-10-05", scope: "KERN_EMERG '0' to KERN_DEBUG '7', KERN_DEFAULT and KERN_CONT, the pr_*() functions, console_loglevel and /proc/sys/kernel/printk", status: "active" },
    { id: "cisco-ios", label: "Cisco IOS Configuration Fundamentals Command Reference, L through mode: logging buffered, the severity level table", type: "vendor-doc", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/cf_command_ref/L_through_mode.html", access_date: "2026-10-05", scope: "0 emergencies LOG_EMERG to 7 debugging LOG_DEBUG; 'The default logging level varies by platform but is generally 7'", status: "active" },
    { id: "junos", label: "Juniper Networks, Junos OS: syslog facilities and severity levels (published 2013-07-08)", type: "vendor-doc", url: "https://juniper.net/documentation/en_US/junos13.1/topics/reference/general/syslog-facilities-severity-levels.html", access_date: "2026-10-05", scope: "the severities emergency, alert, critical, error, warning, notice, info in order, plus any (all levels) and none (disables logging); the facilities table; no numbers given", status: "active" },
    { id: "winmeta", label: "Microsoft Learn, Windows Event Log: EventManifestSchema LevelType complex type (the predefined levels of winmeta.xml)", type: "vendor-doc", url: "https://learn.microsoft.com/en-us/windows/win32/wes/eventmanifestschema-leveltype-complextype", access_date: "2026-10-05", scope: "win:Critical 1, win:Error 2, win:Warning 3, win:Informational 4, win:Verbose 5 with their descriptions; custom levels 16 to 255; 'Higher numbers imply that you receive lower levels as well'", status: "active" },
    { id: "dotnet", label: "Microsoft Learn, Microsoft.Extensions.Logging.LogLevel enum", type: "vendor-doc", url: "https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.logging.loglevel", access_date: "2026-10-05", scope: "Trace 0, Debug 1, Information 2, Warning 3, Error 4, Critical 5, None 6, with the field descriptions", status: "active" },
    { id: "python", label: "Python 3.14 documentation, logging: Logging Levels", type: "documentation", url: "https://docs.python.org/3/library/logging.html#logging-levels", access_date: "2026-10-05", scope: "NOTSET 0, DEBUG 10, INFO 20, WARNING 30, ERROR 40, CRITICAL 50 with 'what it means'; levels are integers and custom ones may be defined", status: "active" },
    { id: "otel-python", label: "OpenTelemetry Python SDK, opentelemetry-sdk/_logs/_internal/__init__.py, the _STD_TO_OTEL table (main branch)", type: "source-code", url: "https://github.com/open-telemetry/opentelemetry-python/blob/main/opentelemetry-sdk/src/opentelemetry/sdk/_logs/_internal/__init__.py", access_date: "2026-10-05", scope: "Python logging 10 to SeverityNumber DEBUG (5), 20 to INFO (9), 30 to WARN (13), 40 to ERROR (17), 50 to FATAL (21), the values between to the range's further steps", status: "active" },
    { id: "jul", label: "Java SE 21 API, java.util.logging.Level", type: "documentation", url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Level.html", access_date: "2026-10-05", scope: "OFF Integer.MAX_VALUE, SEVERE 1000, WARNING 900, INFO 800, CONFIG 700, FINE 500, FINER 400, FINEST 300, ALL Integer.MIN_VALUE; 'Enabling logging at a given level also enables logging at all higher levels'", status: "active" },
    { id: "log4j2", label: "Apache Log4j 2.x manual, Levels", type: "documentation", url: "https://logging.apache.org/log4j/2.x/manual/customloglevels.html", access_date: "2026-10-05", scope: "OFF 0, FATAL 100, ERROR 200, WARN 300, INFO 400, DEBUG 500, TRACE 600, ALL Integer.MAX_VALUE; a level is a name and an int priority; 'WARN is less severe than ERROR'", status: "active" },
    { id: "otel", label: "OpenTelemetry specification, Logs Data Model: SeverityNumber, and Data Model Appendix B, SeverityNumber example mappings", type: "standard", url: "https://opentelemetry.io/docs/specs/otel/logs/data-model/", access_date: "2026-10-05", scope: "the 24 values in six ranges (TRACE 1-4, DEBUG 5-8, INFO 9-12, WARN 13-16, ERROR 17-20, FATAL 21-24), 0 unspecified, the short names; Appendix B's table placing syslog, Windows Event Log, ETW, Log4j, Zap, java.util.logging and .NET on the scale", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: LogLevelInput): LogLevelResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
