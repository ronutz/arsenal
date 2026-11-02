// ============================================================================
// src/lib/share/cases/log-level-mapper.ts
// ----------------------------------------------------------------------------
// Share cases of the log level mapper (wave 4C, 2026-11-01): the level as
// typed in `input`, the system by key. Values are the tool's golden vectors.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { LOG_LEVEL_SHARE, type LogLevelShareState } from "../../tools/log-level-mapper/share"; // the spec

/** The cases. */
export const LOG_LEVEL_SHARE_CASES = defineShareCases<LogLevelShareState, LogLevelShareState>({
  spec: LOG_LEVEL_SHARE, // the spec
  accept: [
    { id: "example-syslog-warning", state: { system: "syslog", level: "warning" }, params: { input: "warning", system: "syslog" }, restored: { system: "syslog", level: "warning" } }, // the page's Example (golden vector syslog-warning)
    { id: "by-number", state: { system: "syslog", level: "5" }, params: { input: "5", system: "syslog" }, restored: { system: "syslog", level: "5" } }, // a level by the system's own number
    { id: "python-40", state: { system: "python", level: "40" }, params: { input: "40", system: "python" }, restored: { system: "python", level: "40" } }, // another ladder
  ],
  empty: [
    { id: "no-level", state: { system: "syslog", level: "" } }, // nothing typed
    { id: "unknown-level", state: { system: "syslog", level: "catastrophic" } }, // the page says so: nothing to share
  ],
  blocked: [],
  reject: [
    { id: "no-system", values: { input: "warning" } }, // the system is required
    { id: "unknown-system", values: { input: "warning", system: "eventvwr" } }, // a system the select does not offer
    { id: "no-level", values: { system: "syslog" } }, // the level is required
    { id: "line-break", values: { input: "warn\ning", system: "syslog" } }, // a one-line field
  ],
});
