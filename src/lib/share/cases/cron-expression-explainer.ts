// ============================================================================
// src/lib/share/cases/cron-expression-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the cron expression explainer: a schedule goes as typed; a
// crontab line with its command is refused by the page, so it has no link
// (no command, and no credential in one, ever travels).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CRON_SHARE, type CronShareState } from "../../tools/cron-expression-explainer/share"; // the spec

/** The page's Example: 02:00 on weekdays. */
const EXAMPLE = "0 2 * * 1-5"; // verbatim
/** Every 15 minutes in office hours. */
const STEPS = "*/15 9-17 * * mon-fri"; // steps, a range, names
/** A crontab line with a command holding a password: the page counts more than five fields and refuses it. */
const WITH_COMMAND = "0 3 * * * curl -u backup:Hunter2pass https://nas.example.net/run"; // never shareable

/** The cases. */
export const CRON_EXPRESSION_SHARE_CASES = defineShareCases<CronShareState, CronShareState>({
  spec: CRON_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example
    { id: "steps-and-names", state: { input: STEPS }, params: { input: STEPS }, restored: { input: STEPS } }, // steps and names
    { id: "macro", state: { input: "@daily" }, params: { input: "@daily" }, restored: { input: "@daily" } }, // a macro
    { id: "or-rule", state: { input: "0 0 13 * 5" }, params: { input: "0 0 13 * 5" }, restored: { input: "0 0 13 * 5" }, mustNotContain: ["Hunter2pass"] }, // both day fields: the OR rule
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "with-command", state: { input: WITH_COMMAND } }, // a crontab line: refused, no link
    { id: "quartz", state: { input: "0 0 12 * * ?" } }, // six fields: refused
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
